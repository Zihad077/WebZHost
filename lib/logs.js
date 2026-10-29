'use strict';
const DOC = '#/docs';
const RULES = [
  { re: /ModuleNotFoundError: No module named '([\w.-]+)'/, title: 'Missing Python package', cause: m => `Package "${m[1]}" is not installed.`, fix: m => `Add "${m[1]}" to requirements.txt and redeploy.` },
  { re: /Cannot find module '([^']+)'/, title: 'Missing Node module', cause: m => `Module "${m[1]}" is not installed or the path is wrong.`, fix: () => 'Add it to package.json dependencies, or check the file path.' },
  { re: /SyntaxError/, title: 'Syntax error', cause: () => 'The code has invalid syntax.', fix: () => 'Open the file and line shown above and fix it.' },
  { re: /Conflict: terminated by other getUpdates/i, title: 'Two bot instances running', cause: () => 'Another process uses the same bot token.', fix: () => 'Stop the other instance, or use a new token.' },
  { re: /Unauthorized|401: Unauthorized|InvalidToken/i, title: 'Invalid token', cause: () => 'Telegram or an API refused the token.', fix: () => 'Check the token in your environment variables.' },
  { re: /EADDRINUSE/, title: 'Port in use', cause: () => 'Another process uses this port.', fix: () => 'Use the PORT environment variable.' },
  { re: /ENOENT|FileNotFoundError/, title: 'File not found', cause: () => 'The code opens a file that does not exist.', fix: () => 'Check file names and paths (they are case sensitive).' },
  { re: /MemoryError|heap out of memory/i, title: 'Out of memory', cause: () => 'The process used more memory than allowed.', fix: () => 'Reduce memory use or raise the limit.' },
  { re: /ECONNREFUSED|ConnectionRefusedError|ETIMEDOUT/, title: 'Connection failed', cause: () => 'A network service refused or timed out.', fix: () => 'Check the host, port and network access.' },
  { re: /Traceback \(most recent call last\)|\n\s+at .+\(.+:\d+:\d+\)/, title: 'Stack trace found', cause: () => 'The program raised an unhandled error.', fix: () => 'Read the last line of the trace first.' },
];
const norm = l => l.replace(/\d{4}-\d\d-\d\d[T ][\d:.,]+Z?/g, '').replace(/\b\d+\b/g, 'N').trim();
function analyzeLogs(text) {
  const lines = String(text || '').split(/\r?\n/).filter(Boolean), groups = new Map(), findings = [];
  for (const l of lines) { const k = norm(l); if (k) { const g = groups.get(k) || { sample: l, count: 0 }; g.count++; groups.set(k, g); } }
  for (const r of RULES) {
    const m = String(text || '').match(r.re); if (!m) continue;
    const count = lines.filter(l => r.re.test(l)).length || 1;
    findings.push({ title: r.title, cause: r.cause(m), fix: r.fix(m), count, doc: DOC });
  }
  return { total: lines.length, findings, repeated: [...groups.values()].filter(g => g.count > 1).sort((a, b) => b.count - a.count).slice(0, 10) };
}
module.exports = { analyzeLogs };
