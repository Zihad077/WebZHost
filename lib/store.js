'use strict';
// Firestore-backed store. wz_projects/{id} (+ subcollections files, backups).
const crypto = require('crypto');
const { httpErr, cleanRel } = require('./util'), { readZip, writeZip } = require('./zip');
const { analyze, stripRoot } = require('./analyze'), { Firestore } = require('./firestore');
const L = { maxFiles: 200, maxFile: 700 * 1024, maxTotal: 5 * 2 ** 20, maxBackup: 700 * 1024 };
const fid = p => crypto.createHash('sha1').update(p).digest('hex');
const P = id => `wz_projects/${id}`;

class Store {
  constructor(cfg, token) { this.db = new Firestore({ base: cfg.firestoreBase, projectId: cfg.projectId, databaseId: cfg.databaseId, token }); }
  static check(files) {
    const fs = files.filter(f => !f.dir); let t = 0;
    if (fs.length > L.maxFiles) throw httpErr(413, `Too many files (limit ${L.maxFiles}).`);
    for (const f of fs) { t += f.data.length; if (f.data.length > L.maxFile) throw httpErr(413, `File too large: ${f.name} (limit 700 KB).`); }
    if (t > L.maxTotal) throw httpErr(413, 'Project is too large (limit 5 MB unpacked).');
  }
  fileOps(id, files) { return files.filter(f => !f.dir).map(f => this.db.set(`${P(id)}/files/${fid(f.name)}`, { path: f.name, size: f.data.length, content: f.data.toString('base64') })); }
  parse(m) { return { ...m, deployments: JSON.parse(m.deployments || '[]') }; }
  async meta(id, uid) {
    if (!/^[a-f0-9]{16}$/.test(id)) throw httpErr(404, 'Project not found.');
    const m = await this.db.get(P(id)); if (!m || m.owner !== uid) throw httpErr(404, 'Project not found.'); return this.parse(m);
  }
  async save(m) { const { id, deployments, ...rest } = m; await this.db.commit([this.db.set(P(id), { ...rest, deployments: JSON.stringify(deployments) })]); }
  async list(uid) { return (await this.db.whereEq('wz_projects', 'owner', uid)).map(m => this.parse(m)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  async create(uid, name, files, source) {
    const clean = stripRoot(files); Store.check(clean);
    const analysis = analyze(clean), id = crypto.randomBytes(8).toString('hex'), now = new Date().toISOString();
    const meta = { id, owner: uid, name, source, type: analysis.type, startCommand: analysis.startCommand || '', errors: analysis.errors, warnings: analysis.warnings,
      createdAt: now, updatedAt: now, deployments: [{ id: 1, at: now, status: 'stored', note: 'Archive validated and stored. It has not been executed.' }] };
    await this.save(meta);
    try { await this.db.commitChunks(this.fileOps(id, clean)); } catch (e) { await this.remove(id).catch(() => {}); throw e; }
    return { meta, analysis };
  }
  async remove(id) {
    const ops = [...(await this.db.list(`${P(id)}/files`, ['size'])).map(d => this.db.del(`${P(id)}/files/${d.id}`)), ...(await this.db.list(`${P(id)}/backups`, ['size'])).map(d => this.db.del(`${P(id)}/backups/${d.id}`))];
    await this.db.commitChunks(ops); await this.db.commit([this.db.del(P(id))]);
  }
  async walk(id) { return (await this.db.list(`${P(id)}/files`)).map(d => ({ name: d.path, dir: false, data: Buffer.from(d.content, 'base64') })); }
  async tree(id) { return this.db.list(`${P(id)}/files`, ['path', 'size']); }
  async refresh(m) { const a = analyze(await this.walk(m.id)); Object.assign(m, { type: a.type, startCommand: a.startCommand || '', errors: a.errors, warnings: a.warnings, updatedAt: new Date().toISOString() }); await this.save(m); return a; }
  // Returns {type:'file',data} | {type:'dir',entries} | null
  async read(id, rel) {
    rel = cleanRel(rel, true);
    if (rel) { const f = await this.db.get(`${P(id)}/files/${fid(rel)}`); if (f) return { type: 'file', data: Buffer.from(f.content, 'base64') }; }
    const pre = rel ? rel + '/' : '', seen = new Map();
    for (const f of await this.tree(id)) if (f.path.startsWith(pre)) {
      const rest = f.path.slice(pre.length), seg = rest.split('/')[0], isDir = rest.includes('/');
      if (!seen.has(seg) || isDir) seen.set(seg, { name: seg, dir: isDir, size: isDir ? 0 : f.size });
    }
    if (!seen.size && rel) return null;
    return { type: 'dir', entries: [...seen.values()].sort((a, b) => b.dir - a.dir || a.name.localeCompare(b.name)) };
  }
  async writeFile(id, rel, data) {
    rel = cleanRel(rel); if (data.length > L.maxFile) throw httpErr(413, 'File too large (limit 700 KB).');
    if (!(await this.db.get(`${P(id)}/files/${fid(rel)}`)) && (await this.tree(id)).length >= L.maxFiles) throw httpErr(413, `Too many files (limit ${L.maxFiles}).`);
    await this.db.commit(this.fileOps(id, [{ name: rel, data }]));
  }
  async deleteFile(id, rel) {
    rel = cleanRel(rel); const hit = (await this.tree(id)).filter(f => f.path === rel || f.path.startsWith(rel + '/'));
    if (!hit.length) throw httpErr(404, 'Not found.'); await this.db.commitChunks(hit.map(f => this.db.del(`${P(id)}/files/${f.id}`)));
  }
  async listBackups(id) { return (await this.db.list(`${P(id)}/backups`, ['size'])).map(b => ({ id: b.id, size: b.size, at: b.id })).sort((a, b) => b.id.localeCompare(a.id)); }
  async backup(id, tag = 'b') {
    const zip = writeZip(await this.walk(id)); if (zip.length > L.maxBackup) throw httpErr(413, 'Project is too big for a backup (limit 700 KB zipped).');
    const bid = `${tag}${new Date().toISOString().replace(/\D/g, '')}`;
    await this.db.commit([this.db.set(`${P(id)}/backups/${bid}`, { size: zip.length, data: zip.toString('base64') })]); return bid;
  }
  async getBackup(id, bid) {
    if (!/^\w+$/.test(bid)) throw httpErr(404, 'Backup not found.');
    const b = await this.db.get(`${P(id)}/backups/${bid}`); if (!b) throw httpErr(404, 'Backup not found.'); return Buffer.from(b.data, 'base64');
  }
  // Validates the whole backup first, then swaps all files in ONE atomic commit.
  async restore(id, bid) {
    const files = readZip(await this.getBackup(id, bid)); Store.check(files);
    let safety = null; try { safety = await this.backup(id, 'pre'); } catch (e) { if (e.status !== 413) throw e; }
    const ops = [...(await this.tree(id)).map(f => this.db.del(`${P(id)}/files/${f.id}`)), ...this.fileOps(id, files)];
    await this.db.commit(ops); return safety;
  }
}
module.exports = { Store };
