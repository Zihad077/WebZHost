'use strict';
// Tiny Firestore REST client. Calls use the signed-in user's own token, so Firestore rules decide access.
const { httpErr } = require('./util');
const enc = v => typeof v === 'string' ? { stringValue: v } : typeof v === 'boolean' ? { booleanValue: v } : Number.isInteger(v) ? { integerValue: String(v) } : { nullValue: null };
const dec = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, 'stringValue' in v ? v.stringValue : 'integerValue' in v ? Number(v.integerValue) : 'booleanValue' in v ? v.booleanValue : null]));
const idOf = d => d.name.split('/').pop();
class Firestore {
  constructor({ base, projectId, databaseId, token }) { this.base = base; this.token = token; this.root = `projects/${projectId}/databases/${databaseId}/documents`; }
  async req(method, url, body) {
    let r; try { r = await fetch(`${this.base}/${url}`, { method, headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), signal: AbortSignal.timeout(9000) }); }
    catch { throw httpErr(502, 'Cannot reach the database.'); }
    if (r.status === 404) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw httpErr(r.status === 401 || r.status === 403 ? 403 : 502, r.status === 403 || r.status === 401 ? 'Database refused access. Check the Firestore rules (see README).' : 'Database error: ' + (j.error?.message || r.status));
    return j;
  }
  async get(path) { const j = await this.req('GET', `${this.root}/${path}`); return j && { id: idOf(j), ...dec(j.fields) }; }
  async list(coll, mask = []) {
    const out = []; let tok = '';
    do {
      const q = new URLSearchParams({ pageSize: '300' }); if (tok) q.set('pageToken', tok); mask.forEach(f => q.append('mask.fieldPaths', f));
      const j = await this.req('GET', `${this.root}/${coll}?${q}`); if (!j) break;
      (j.documents || []).forEach(d => out.push({ id: idOf(d), ...dec(d.fields) })); tok = j.nextPageToken || '';
    } while (tok);
    return out;
  }
  async whereEq(coll, field, value) {
    const j = await this.req('POST', `${this.root}:runQuery`, { structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } } } });
    return (j || []).filter(x => x.document).map(x => ({ id: idOf(x.document), ...dec(x.document.fields) }));
  }
  set(path, obj) { return { update: { name: `${this.root}/${path}`, fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, enc(v)])) } }; }
  del(path) { return { delete: `${this.root}/${path}` }; }
  // All writes in one call succeed or fail together (max 500).
  async commit(writes) { if (!writes.length) return; if (writes.length > 500) throw httpErr(413, 'Too many changes at once.'); await this.req('POST', `${this.root}:commit`, { writes }); }
  async commitChunks(writes) { for (let i = 0; i < writes.length; i += 400) await this.commit(writes.slice(i, i + 400)); }
}
module.exports = { Firestore };
