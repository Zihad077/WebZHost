'use strict';
const http = require('http');
const { Store } = require('./store'), { authenticate } = require('./auth'), { createRuntime } = require('./runtime');
const { readZip, writeZip } = require('./zip'), { analyze } = require('./analyze'), { analyzeLogs } = require('./logs');
const { httpErr, cleanRel, rateLimit } = require('./util'), TEMPLATES = require('./templates');
const NAME_RE = /^[\w][\w .-]{0,59}$/, MAX_TEXT = 512 * 1024;

function createHandler(cfg, opts = {}) {
  const runtime = opts.runtime || createRuntime(cfg);
  const send = (res, code, body, h = {}) => {
    const isJ = !Buffer.isBuffer(body) && typeof body !== 'string';
    res.writeHead(code, { 'Content-Type': isJ ? 'application/json' : 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...h });
    res.end(isJ ? JSON.stringify(body) : body);
  };
  const readBody = (req, max) => new Promise((ok, no) => {
    const c = []; let n = 0;
    req.on('data', d => { n += d.length; if (n > max) { no(httpErr(413, `Upload too large (limit ${Math.round(max / 2 ** 20 * 10) / 10} MB).`)); req.destroy(); } else c.push(d); });
    req.on('end', () => ok(Buffer.concat(c))); req.on('error', no);
  });
  const jsonBody = async req => { try { return JSON.parse((await readBody(req, 64 * 1024)).toString() || '{}'); } catch (e) { throw e.status ? e : httpErr(400, 'Invalid JSON.'); } };
  const cleanName = n => { n = String(n || '').trim(); if (!NAME_RE.test(n)) throw httpErr(400, 'Name must be 1-60 letters, numbers, spaces, dots, dashes or underscores.'); return n; };

  async function route(req, res, u, user, store) {
    const p = u.pathname, M = req.method;
    if (p === '/api/projects' && M === 'GET') return send(res, 200, await store.list(user.uid));
    if (p === '/api/projects' && M === 'POST') {
      rateLimit('create:' + user.uid);
      const name = cleanName(u.searchParams.get('name')), tpl = u.searchParams.get('template');
      if (tpl) { if (!TEMPLATES[tpl]) throw httpErr(400, 'Unknown template.'); return send(res, 201, await store.create(user.uid, name, TEMPLATES[tpl].files(), 'template:' + tpl)); }
      const files = readZip(await readBody(req, cfg.maxUploadBytes)), a = analyze(files);
      if (a.errors) throw httpErr(422, 'The project has errors and was not created.', { analysis: a });
      return send(res, 201, await store.create(user.uid, name, files, 'zip'));
    }
    if (p === '/api/templates') return send(res, 200, Object.entries(TEMPLATES).map(([id, t]) => ({ id, label: t.label })));
    const m = p.match(/^\/api\/projects\/([a-f0-9]{16})(?:\/(\w+))?(?:\/(\w+))?(?:\/(\w+))?$/); if (!m) throw httpErr(404, 'Not found.');
    const [, id, sub, a3, a4] = m, meta = await store.meta(id, user.uid), key = `${M} ${sub || ''}`;
    switch (key) {
      case 'GET ': return send(res, 200, { ...meta, runtime: await runtime.status(id), runtimeAvailable: runtime.available });
      case 'DELETE ': rateLimit('del:' + user.uid); if (u.searchParams.get('confirm') !== 'yes') throw httpErr(400, 'Confirmation required.'); await store.remove(id); return send(res, 200, { ok: true });
      case 'POST rename': { const b = await jsonBody(req); meta.name = cleanName(b.name); await store.save(meta); return send(res, 200, meta); }
      case 'GET health': return send(res, 200, analyze(await store.walk(id)));
      case 'GET logs': { const t = await runtime.logs(id); return send(res, 200, { available: runtime.available, text: t, analysis: analyzeLogs(t) }); }
      case 'POST start': case 'POST stop': case 'POST restart': {
        rateLimit('life:' + user.uid, 30); const a = analyze(await store.walk(id));
        if (sub !== 'stop' && a.errors) throw httpErr(422, 'Fix project errors first (see Health).', { analysis: a });
        return send(res, 200, await runtime[sub](id, { startCommand: a.startCommand, type: a.type }));
      }
      case 'GET export': return send(res, 200, writeZip(await store.walk(id)), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${meta.id}.zip"` });
      case 'GET files': {
        const r = await store.read(id, u.searchParams.get('path') || ''); if (!r) throw httpErr(404, 'Not found.');
        if (r.type === 'dir') return send(res, 200, r);
        if (r.data.length > MAX_TEXT) throw httpErr(413, 'File is too large to edit here (limit 512 KB).');
        if (r.data.includes(0)) throw httpErr(415, 'Binary files cannot be edited.');
        return send(res, 200, { type: 'file', size: r.data.length, content: r.data.toString('utf8') });
      }
      case 'PUT files': { rateLimit('write:' + user.uid, 120); await store.writeFile(id, u.searchParams.get('path') || '', await readBody(req, MAX_TEXT)); await store.refresh(meta); return send(res, 200, { ok: true }); }
      case 'DELETE files': { await store.deleteFile(id, u.searchParams.get('path') || ''); await store.refresh(meta); return send(res, 200, { ok: true }); }
      case 'GET backups': if (a3) return send(res, 200, await store.getBackup(id, a3), { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${a3}.zip"` }); return send(res, 200, await store.listBackups(id));
      case 'POST backups': {
        if (a3 && a4 === 'restore') {
          rateLimit('restore:' + user.uid, 5); if ((await jsonBody(req)).confirm !== true) throw httpErr(400, 'Confirmation required.');
          const safety = await store.restore(id, a3); await store.refresh(meta); return send(res, 200, { ok: true, safetyBackup: safety });
        }
        rateLimit('backup:' + user.uid, 10); return send(res, 201, { id: await store.backup(id) });
      }
    }
    throw httpErr(404, 'Not found.');
  }

  return async (req, res) => {
    try {
      const u = new URL(req.url, 'http://x'), origin = req.headers.origin;
      if (cfg.allowedOrigin && origin === cfg.allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      }
      if (req.method === 'OPTIONS') return send(res, 204, '');
      if (!u.pathname.startsWith('/api/')) throw httpErr(404, 'Not found.');
      if (u.pathname === '/api/config') return send(res, 200, { authMode: cfg.authMode, firebase: cfg.publicFirebase, runtime: { kind: runtime.kind, available: runtime.available }, maxUploadMB: cfg.maxUploadBytes / 2 ** 20 });
      const user = await authenticate(req, cfg, opts.getKey);
      await route(req, res, u, user, new Store(cfg, req.headers.authorization.slice(7)));
    } catch (e) {
      if (!e.status) console.error(e);
      send(res, e.status || 500, { error: e.status ? e.message : 'Internal error.', code: e.code, analysis: e.analysis });
    }
  };
}
const createApp = (cfg, opts) => http.createServer(createHandler(cfg, opts));
module.exports = { createHandler, createApp };
