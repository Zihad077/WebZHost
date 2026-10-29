'use strict';
// File-backed store: metadata, project files and backups on a persistent disk.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { httpErr, safeJoin } = require('./util');
const { readZip, writeZip } = require('./zip');
const { analyze, stripRoot } = require('./analyze');
const atomic = (f, data) => { const t = f + '.tmp' + process.pid; fs.writeFileSync(t, data); fs.renameSync(t, f); };

class Store {
  constructor(dir) { this.dir = path.resolve(dir); fs.mkdirSync(path.join(this.dir, 'projects'), { recursive: true }); }
  pdir(id) { if (!/^[a-f0-9]{16}$/.test(id)) throw httpErr(404, 'Project not found.'); return path.join(this.dir, 'projects', id); }
  filesDir(id) { return path.join(this.pdir(id), 'files'); }
  meta(id, uid) {
    let m; try { m = JSON.parse(fs.readFileSync(path.join(this.pdir(id), 'meta.json'), 'utf8')); } catch { throw httpErr(404, 'Project not found.'); }
    if (m.owner !== uid) throw httpErr(404, 'Project not found.'); return m;
  }
  save(m) { atomic(path.join(this.pdir(m.id), 'meta.json'), JSON.stringify(m, null, 2)); }
  list(uid) {
    return fs.readdirSync(path.join(this.dir, 'projects')).map(id => { try { return this.meta(id, uid); } catch { return null; } })
      .filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  writeFiles(root, files) {
    fs.mkdirSync(root, { recursive: true });
    for (const f of files) {
      const t = safeJoin(root, f.name);
      if (f.dir) fs.mkdirSync(t, { recursive: true }); else { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.writeFileSync(t, f.data); }
    }
  }
  create(uid, name, files, source) {
    const clean = stripRoot(files), analysis = analyze(clean), id = crypto.randomBytes(8).toString('hex'), now = new Date().toISOString();
    this.writeFiles(this.filesDir(id), clean);
    const m = { id, owner: uid, name, source, type: analysis.type, startCommand: analysis.startCommand, errors: analysis.errors, warnings: analysis.warnings,
      createdAt: now, updatedAt: now, deployments: [{ id: 1, at: now, status: 'stored', note: 'Archive validated and stored. It has not been executed.' }] };
    this.save(m); return { meta: m, analysis };
  }
  remove(id) { fs.rmSync(this.pdir(id), { recursive: true, force: true }); }
  walk(id) {
    const root = this.filesDir(id), out = [];
    const rec = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name), rel = path.relative(root, p).split(path.sep).join('/');
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) { out.push({ name: rel, dir: true }); rec(p); } else if (e.isFile()) out.push({ name: rel, dir: false, data: fs.readFileSync(p) });
    } };
    if (fs.existsSync(root)) rec(root); return out;
  }
  refresh(m) { const a = analyze(this.walk(m.id)); Object.assign(m, { type: a.type, startCommand: a.startCommand, errors: a.errors, warnings: a.warnings, updatedAt: new Date().toISOString() }); this.save(m); return a; }
  bdir(id) { const d = path.join(this.pdir(id), 'backups'); fs.mkdirSync(d, { recursive: true }); return d; }
  listBackups(id) {
    return fs.readdirSync(this.bdir(id)).filter(n => /^\w+\.zip$/.test(n)).sort().reverse()
      .map(n => ({ id: n.slice(0, -4), size: fs.statSync(path.join(this.bdir(id), n)).size, at: n.slice(0, -4) }));
  }
  backup(id, tag = 'b') {
    const bid = `${tag}${new Date().toISOString().replace(/\D/g, '')}`;
    atomic(path.join(this.bdir(id), bid + '.zip'), writeZip(this.walk(id))); return bid;
  }
  backupPath(id, bid) { if (!/^\w+$/.test(bid)) throw httpErr(404, 'Backup not found.'); const p = path.join(this.bdir(id), bid + '.zip'); if (!fs.existsSync(p)) throw httpErr(404, 'Backup not found.'); return p; }
  // Validates fully in memory, stages on disk, then swaps. The live files change only if every step succeeded.
  restore(id, bid) {
    const files = readZip(fs.readFileSync(this.backupPath(id, bid)));
    const safety = this.backup(id, 'pre'), root = this.filesDir(id), stage = root + '.new', old = root + '.old';
    fs.rmSync(stage, { recursive: true, force: true }); fs.rmSync(old, { recursive: true, force: true });
    try { this.writeFiles(stage, files); } catch (e) { fs.rmSync(stage, { recursive: true, force: true }); throw e; }
    if (fs.existsSync(root)) fs.renameSync(root, old); fs.renameSync(stage, root); fs.rmSync(old, { recursive: true, force: true });
    return safety;
  }
}
module.exports = { Store };
