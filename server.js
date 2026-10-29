'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { loadConfig } = require('./lib/config'), { Store } = require('./lib/store'), { authenticate } = require('./lib/auth');
const { createRuntime } = require('./lib/runtime'), { readZip, writeZip } = require('./lib/zip'), { analyze } = require('./lib/analyze');
const { analyzeLogs } = require('./lib/logs'), { httpErr, safeJoin, rateLimit } = require('./lib/util'), TEMPLATES = require('./lib/templates');
const NAME_RE = /^[\w][\w .-]{0,59}$/, MAX_TEXT = 512 * 1024;

function createApp(cfg, opts = {}) {
  const store = new Store(cfg.dataDir), runtime = opts.runtime || createRuntime(cfg);
  const send = (res, code, body, h = {}) => {
    const isJ = !Buffer.isBuffer(body) && typeof body !== 'string';
    res.writeHead(code, { 'Content-Type': isJ ? 'application/json' : 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...h });
    res.end(isJ ? JSON.stringify(body) : body);
  };
  const readBody = (req, max) => new Promise((ok, no) => {
    const c = []; let n = 0;
    req.on('data', d => { n += d.length; if (n > max) { no(httpErr(413, `Upload too large (limit ${Math.round(max / 2 ** 20)} MB).`)); req.destroy(); } else c.push(d); });
    req.on('end', () => ok(Buffer.concat(c))); req.on('error', no);
  });
  const jsonBody = async req => { try { return JSON.parse((await readBody(req, 64 * 1024)).toString() || '{}'); } catch (e) { throw e.status ? e : httpErr(400, 'Invalid JSON.'); } };
  const cleanName = n => { n = String(n || '').trim(); if (!NAME_RE.test(n)) throw httpErr(400, 'Name must be 1-60 letters, numbers, spaces, dots, dashes or underscores.'); return n; };

  async function route(req, res, u, user) {
    const p = u.pathname, M = req.method;
    if (p === '/api/projects' && M === 'GET') return send(res, 200, store.list(user.uid));
    if (p === '/api/projects' && M === 'POST') {
      rateLimit('create:' + user.uid);
      const name = cleanName(u.searchParams.get('name')), tpl = u.searchParams.get('template');
      if (tpl) { if (!TEMPLATES[tpl]) throw httpErr(400, 'Unknown template.'); return send(res, 201, store.create(user.uid, name, TEMPLATES[tpl].files(), 'template:' + tpl)); }
      const files = readZip(await readBody(req, cfg.maxUploadBytes)), a = analyze(files);
      if (a.errors) throw httpErr(422, 'The project has errors and was not created.', { analysis: a });
      return send(res, 201, store.create(user.uid, name, files, 'zip'));
    }
    if (p === '/api/templates') return send(res, 200, Object.entries(TEMPLATES).map(([id, t]) => ({ id, label: t.label })));
    const m = p.match(/^\/api\/projects\/([a-f0-9]{16})(?:\/(\w+))?(?:\/(\w+))?(?:\/(\w+))?$/); if (!m) throw httpErr(404, 'Not found.');
    const [, id, sub, a3, a4] = m, meta = store.meta(id, user.uid), key = `${M} ${sub || ''}`;
    switch (key) {
      case 'GET ': return send(res, 200, { ...meta, runtime: await runtime.status(id), runtimeAvailable: runtime.available });
      case 'DELETE ': rateLimit('del:' + user.uid); if (u.searchParams.get('confirm') !== 'yes') throw httpErr(400, 'Confirmation required.'); store.remove(id); return send(res, 200, { ok: true });
      case 'POST rename': { const b = await jsonBody(req); meta.name = cleanName(b.name); store.save(meta); return send(res, 200, meta); }
      case 'GET health': return send(res, 200, analyze(store.walk(id)));
      case 'GET logs': { const t = await runtime.logs(id); return send(res, 200, { available: runtime.available, text: t, analysis: analyzeLogs(t) }); }
      case 'POST start': case 'POST stop': case 'POST restart': {
        rateLimit('life:' + user.uid, 30); const a = analyze(store.walk(id)), act = sub;
        if (act !== 'stop' && a.errors) throw httpErr(422, 'Fix project errors first (see Health).', { analysis: a });
        return send(res, 200, await runtime[act](id, { startCommand: a.startCommand, type: a.type }));
      }
      case 'GET export': return send(res, 200, writeZip(store.walk(id)), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${meta.id}.zip"` });
      case 'GET files': {
        const t = safeJoin(store.filesDir(id), u.searchParams.get('path') || ''); if (!fs.existsSync(t)) throw httpErr(404, 'Not found.');
        const st = fs.statSync(t);
        if (st.isDirectory()) return send(res, 200, { type: 'dir', entries: fs.readdirSync(t, { withFileTypes: true }).filter(e => !e.isSymbolicLink()).map(e => ({ name: e.name, dir: e.isDirectory(), size: e.isDirectory() ? 0 : fs.statSync(path.join(t, e.name)).size })).sort((x, y) => y.dir - x.dir || x.name.localeCompare(y.name)) });
        if (st.size > MAX_TEXT) throw httpErr(413, 'File is too large to edit here (limit 512 KB).');
        const d = fs.readFileSync(t); if (d.includes(0)) throw httpErr(415, 'Binary files cannot be edited.');
        return send(res, 200, { type: 'file', size: st.size, content: d.toString('utf8') });
      }
      case 'PUT files': {
        rateLimit('write:' + user.uid, 120); const rel = u.searchParams.get('path') || ''; if (!rel) throw httpErr(400, 'Path required.');
        const t = safeJoin(store.filesDir(id), rel); if (fs.existsSync(t) && fs.statSync(t).isDirectory()) throw httpErr(400, 'That path is a folder.');
        fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, await readBody(req, MAX_TEXT)); store.refresh(meta); return send(res, 200, { ok: true });
      }
      case 'DELETE files': {
        const rel = u.searchParams.get('path') || ''; if (!rel) throw httpErr(400, 'Path required.');
        const t = safeJoin(store.filesDir(id), rel); if (!fs.existsSync(t)) throw httpErr(404, 'Not found.');
        fs.rmSync(t, { recursive: true }); store.refresh(meta); return send(res, 200, { ok: true });
      }
      case 'GET backups': if (a3) { const b = store.backupPath(id, a3); return send(res, 200, fs.readFileSync(b), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${a3}.zip"` }); } return send(res, 200, store.listBackups(id));
      case 'POST backups': {
        if (a3 && a4 === 'restore') {
          rateLimit('restore:' + user.uid, 5); if ((await jsonBody(req)).confirm !== true) throw httpErr(400, 'Confirmation required.');
          const safety = store.restore(id, a3); store.refresh(meta); return send(res, 200, { ok: true, safetyBackup: safety });
        }
        rateLimit('backup:' + user.uid, 10); return send(res, 201, { id: store.backup(id) });
      }
    }
    throw httpErr(404, 'Not found.');
  }

  const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript'], '/config.js': ['config.js', 'text/javascript'] };
  return http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://x'), origin = req.headers.origin;
      if (cfg.allowedOrigin && origin === cfg.allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      }
      if (req.method === 'OPTIONS') return send(res, 204, '');
      if (!u.pathname.startsWith('/api/')) {
        const s = STATIC[u.pathname] || STATIC['/']; return send(res, 200, fs.readFileSync(path.join(__dirname, s[0])), { 'Content-Type': s[1] });
      }
      if (u.pathname === '/api/config') return send(res, 200, { authMode: cfg.authMode, firebase: cfg.publicFirebase, runtime: { kind: runtime.kind, available: runtime.available }, maxUploadMB: cfg.maxUploadBytes / 2 ** 20 });
      const user = await authenticate(req, cfg, opts.getKey);
      await route(req, res, u, user);
    } catch (e) {
      if (!e.status) console.error(e);
      send(res, e.status || 500, { error: e.status ? e.message : 'Internal error.', code: e.code, analysis: e.analysis });
    }
  });
}
module.exports = { createApp };
if (require.main === module) { const cfg = loadConfig(); createApp(cfg).listen(cfg.port, () => console.log(`WebZHost API on :${cfg.port} (auth: ${cfg.authMode})`)); }
