'use strict';
// In-memory stand-in for the Firestore REST API (the subset WebZHost uses).
const http = require('http');
function fakeFirestore() {
  const docs = new Map(); let commits = 0;
  const NAME = 'projects/p/databases/d/documents/';
  const mk = (path, f) => ({ name: NAME + path, fields: f });
  const srv = http.createServer((req, res) => {
    const out = (c, b) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(b)); };
    if (!req.headers.authorization) return out(401, { error: { message: 'no auth' } });
    const u = new URL(req.url, 'http://x'), rest = u.pathname.split('/documents')[1] || '', chunks = [];
    req.on('data', c => chunks.push(c)); req.on('end', () => {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
      if (req.method === 'POST' && rest === ':commit') {
        if (body.writes.length > 500) return out(400, { error: { message: 'too many writes' } });
        for (const w of body.writes) { if (w.update) docs.set(w.update.name.slice(NAME.length), w.update.fields); else docs.delete(w.delete.slice(NAME.length)); }
        commits++; return out(200, { commitTime: 'x' });
      }
      if (req.method === 'POST' && rest === ':runQuery') {
        const q = body.structuredQuery, c = q.from[0].collectionId, f = q.where.fieldFilter, hit = [];
        for (const [k, v] of docs) if (k.startsWith(c + '/') && !k.slice(c.length + 1).includes('/') && v[f.field.fieldPath]?.stringValue === f.value.stringValue) hit.push({ document: mk(k, v) });
        return out(200, hit.length ? hit : [{ readTime: 'x' }]);
      }
      const path = decodeURIComponent(rest.replace(/^\//, '')), segs = path.split('/');
      if (req.method === 'GET' && segs.length % 2 === 0) { const d = docs.get(path); return d ? out(200, mk(path, d)) : out(404, { error: { message: 'nf' } }); }
      if (req.method === 'GET') {
        const mask = u.searchParams.getAll('mask.fieldPaths'), list = [];
        for (const [k, v] of docs) if (k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'))
          list.push(mk(k, mask.length ? Object.fromEntries(Object.entries(v).filter(([n]) => mask.includes(n))) : v));
        return out(200, list.length ? { documents: list } : {});
      }
      out(400, { error: { message: 'unsupported' } });
    });
  });
  return { srv, docs, get commits() { return commits; } };
}
module.exports = { fakeFirestore };
