'use strict';
// Deterministic project analysis. Reads data only; never executes archive content.
const TOKEN_RE = /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/;
const REQ_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*(\[[^\]]+\])?\s*((===|==|>=|<=|~=|!=|<|>)\s*[\w.*+!-]+\s*(,\s*(===|==|>=|<=|~=|!=|<|>)\s*[\w.*+!-]+)*)?\s*(;.*)?$/;
const SAFE_ENTRY = /^[\w./-]+$/;
const BINARY = /\.(png|jpe?g|gif|webp|ico|zip|gz|pdf|woff2?|ttf|mp[34]|so|pyc|exe)$/i;

function stripRoot(files) {
  files = files.filter(f => !f.name.startsWith('__MACOSX/'));
  const names = files.filter(f => !f.dir).map(f => f.name);
  if (!names.length) return files;
  const first = names[0].split('/')[0];
  if (names.every(n => n.includes('/') && n.split('/')[0] === first))
    return files.map(f => ({ ...f, name: f.name.slice(first.length + 1) })).filter(f => f.name);
  return files;
}

function analyze(input) {
  const files = stripRoot(input), F = new Map(files.filter(f => !f.dir).map(f => [f.name, f.data]));
  const findings = [], add = (level, code, message) => findings.push({ level, code, message });
  const has = n => F.has(n); let type = 'unknown', entry = null, cmd = null, deps = {};
  if (has('package.json')) {
    let pkg = null;
    try { pkg = JSON.parse(F.get('package.json').toString('utf8')); } catch { add('error', 'PKG_JSON_INVALID', 'package.json is not valid JSON.'); }
    type = 'node';
    if (pkg && typeof pkg === 'object') {
      deps = pkg.dependencies || {};
      entry = pkg.main || ['index.js', 'server.js', 'bot.js', 'app.js'].find(has) || null;
      if (pkg.scripts && pkg.scripts.start) cmd = 'npm start';
      else add('warning', 'NO_START_SCRIPT', 'package.json has no "start" script.');
    }
  } else if (has('requirements.txt') || [...F.keys()].some(n => n.endsWith('.py'))) {
    type = 'python';
    entry = ['main.py', 'bot.py', 'app.py', 'run.py', '__main__.py'].find(has) || [...F.keys()].find(n => n.endsWith('.py') && !n.includes('/')) || null;
    if (has('requirements.txt')) {
      F.get('requirements.txt').toString('utf8').split(/\r?\n/).forEach((l, i) => {
        l = l.trim(); if (!l || l.startsWith('#') || l.startsWith('-')) return;
        if (!REQ_RE.test(l)) add('warning', 'REQ_LINE_INVALID', `requirements.txt line ${i + 1} looks malformed.`);
        else deps[l.split(/[=<>~!;\[\s]/)[0]] = l;
      });
    } else add('warning', 'NO_REQUIREMENTS', 'No requirements.txt found. Dependencies will not be installed.');
  } else add('error', 'NO_PROJECT_TYPE', 'No package.json, requirements.txt or .py file found.');
  if (type !== 'unknown') {
    if (entry && !SAFE_ENTRY.test(entry)) { add('error', 'ENTRY_UNSAFE', 'Entry file name has unsafe characters.'); entry = null; }
    else if (entry && !has(entry.replace(/^\.\//, ''))) add('error', 'ENTRY_MISSING', `Entry file "${entry}" was not found.`);
    else if (!entry && !cmd) add('error', 'NO_ENTRY', 'No entry point found (for example main.py or index.js).');
    if (!cmd && entry) cmd = type === 'python' ? `python ${entry}` : `node ${entry}`;
  }
  if ([...F.keys()].some(n => n === '.env' || n.endsWith('/.env'))) add('warning', 'ENV_FILE', 'A .env file is included. Do not ship secrets in archives.');
  if ([...F.keys()].some(n => n.startsWith('node_modules/'))) add('warning', 'NODE_MODULES', 'node_modules is included. Remove it and use package.json.');
  for (const [n, d] of F) if (d.length < 200000 && !BINARY.test(n) && TOKEN_RE.test(d.toString('utf8'))) add('warning', 'SECRET_IN_SOURCE', `${n} looks like it contains a Telegram bot token. Use an environment variable.`);
  return { type, entry, startCommand: cmd, dependencies: deps, fileCount: F.size,
    findings, errors: findings.filter(f => f.level === 'error').length, warnings: findings.filter(f => f.level === 'warning').length };
}
module.exports = { analyze, stripRoot };
