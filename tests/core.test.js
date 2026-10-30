'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { readZip, writeZip } = require('../lib/zip'), { analyze } = require('../lib/analyze'), { analyzeLogs } = require('../lib/logs');
const { cleanRel } = require('../lib/util'), { verifyFirebaseToken } = require('../lib/auth'), { loadConfig } = require('../lib/config');
const { createApp } = require('../lib/app'), { fakeFirestore } = require('./fake-firestore'), TEMPLATES = require('../lib/templates');
const F = (name, s) => ({ name, dir: false, data: Buffer.from(s) });

test('zip round trip', () => {
  const z = readZip(writeZip([F('a/b.txt', 'hello'), { name: 'a', dir: true }]));
  assert.equal(z.find(x => x.name === 'a/b.txt').data.toString(), 'hello');
});
test('zip rejects traversal, absolute and corrupt archives', () => {
  for (const n of ['../evil.txt', 'a/../../evil', '/etc/passwd', 'C:/x'])
    assert.throws(() => readZip(writeZip([F(n, 'x')])), /Unsafe path/);
  const z = writeZip([F('a.txt', 'hello world')]); z[40] ^= 0xff;
  assert.throws(() => readZip(z));
  assert.throws(() => readZip(Buffer.from('not a zip at all, really not')), /ZIP/);
});
test('zip rejects zip bombs and too many files', () => {
  assert.throws(() => readZip(writeZip([F('z.bin', Buffer.alloc(3 << 20))]), { maxRatio: 50 }), /ratio/);
  assert.throws(() => readZip(writeZip([F('1', 'a'), F('2', 'b')]), { maxFiles: 1 }), /Too many/);
});
test('analyze detects python, node, and problems', () => {
  const py = analyze([F('proj/main.py', 'print(1)'), F('proj/requirements.txt', 'requests>=2\n!!bad line\n')]);
  assert.equal(py.type, 'python'); assert.equal(py.startCommand, 'python main.py');
  assert.ok(py.findings.some(f => f.code === 'REQ_LINE_INVALID'));
  const nd = analyze([F('package.json', '{"main":"x.js","scripts":{"start":"node x.js"}}')]);
  assert.equal(nd.type, 'node'); assert.ok(nd.findings.some(f => f.code === 'ENTRY_MISSING'));
  assert.ok(analyze([F('package.json', '{bad')]).findings.some(f => f.code === 'PKG_JSON_INVALID'));
  assert.equal(analyze([F('readme.txt', 'hi')]).errors, 1);
  assert.ok(analyze([F('main.py', 't="1234567890:' + 'A'.repeat(35) + '"'), F('.env', 'x=1')]).warnings >= 2);
  assert.equal(analyze([F('package.json', '{"main":"a;rm -rf /"}')]).startCommand, null);
});
test('templates analyze cleanly', () => {
  for (const t of Object.values(TEMPLATES)) assert.equal(analyze(t.files()).errors, 0);
});
test('log analyzer groups and explains', () => {
  const r = analyzeLogs("ModuleNotFoundError: No module named 'telegram'\nretry 1\nretry 2\nretry 3");
  assert.equal(r.findings[0].title, 'Missing Python package'); assert.match(r.findings[0].fix, /telegram/);
  assert.equal(r.repeated[0].count, 3);
});
test('cleanRel blocks traversal and odd paths', () => {
  for (const p of ['../x', 'a/../b', '/etc/passwd', 'a\\b', 'a\0b', 'a//b', './x', 'C:/x']) assert.throws(() => cleanRel(p), /Invalid path/);
  assert.equal(cleanRel('ok/file.txt'), 'ok/file.txt'); assert.equal(cleanRel('', true), ''); assert.throws(() => cleanRel(''));
});
test('firebase token verification', async () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const mk = (over = {}, key = privateKey) => {
    const now = Math.floor(Date.now() / 1000), h = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'k' })).toString('base64url');
    const p = Buffer.from(JSON.stringify({ aud: 'proj', iss: 'https://securetoken.google.com/proj', sub: 'u1', iat: now, exp: now + 600, ...over })).toString('base64url');
    return `${h}.${p}.${crypto.sign('RSA-SHA256', Buffer.from(h + '.' + p), key).toString('base64url')}`;
  };
  const gk = async () => publicKey;
  assert.equal((await verifyFirebaseToken(mk(), 'proj', gk)).uid, 'u1');
  await assert.rejects(verifyFirebaseToken(mk({ exp: 1 }), 'proj', gk));
  await assert.rejects(verifyFirebaseToken(mk({ aud: 'other' }), 'proj', gk));
  await assert.rejects(verifyFirebaseToken(mk({}, crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey), 'proj', gk));
});
test('production refuses dev auth', () => { process.env.NODE_ENV = 'production';
  assert.throws(() => loadConfig({ authMode: 'dev' }));
  delete process.env.NODE_ENV;
});

test('API end to end (fake Firestore)', async () => {
  const fake = fakeFirestore(); await new Promise(r => fake.srv.listen(0, r));
  const cfg = loadConfig({ authMode: 'dev', firestoreBase: `http://127.0.0.1:${fake.srv.address().port}/v1`, firebase: { projectId: 'p' }, databaseId: 'd' });
  const srv = createApp(cfg); await new Promise(r => srv.listen(0, r)); const base = `http://127.0.0.1:${srv.address().port}/api`;
  const call = (u, tok, o = {}) => fetch(base + u, { ...o, headers: { ...(tok ? { Authorization: 'Bearer dev:' + tok } : {}), ...(o.headers || {}) } });
  try {
    assert.equal((await call('/projects')).status, 401);
    assert.equal((await call('/projects?name=bad', 'alice', { method: 'POST', body: writeZip([F('../x', 'y')]) })).status, 400);
    assert.equal((await call('/projects?name=empty', 'alice', { method: 'POST', body: writeZip([F('r.txt', 'x')]) })).status, 422);
    assert.equal((await call('/projects?name=big', 'alice', { method: 'POST', body: writeZip([F('main.py', crypto.randomBytes(800 * 1024).toString('hex'))]) })).status, 413);
    const up = await call('/projects?name=Zipped', 'alice', { method: 'POST', body: writeZip([F('x/main.py', 'print(1)'), F('x/requirements.txt', 'requests\n')]) });
    assert.equal(up.status, 201);
    const c = await call('/projects?name=Bot1&template=python-bot', 'alice', { method: 'POST' });
    assert.equal(c.status, 201); const id = (await c.json()).meta.id;
    assert.equal((await (await call('/projects', 'alice')).json()).length, 2);
    assert.equal((await (await call('/projects', 'bob')).json()).length, 0);
    assert.equal((await call('/projects/' + id, 'bob')).status, 404);
    assert.equal((await call('/projects/' + id + '/files?path=main.py', 'bob')).status, 404);
    assert.equal((await call('/projects/' + id + '/files?path=../../meta.json', 'alice')).status, 400);
    assert.equal((await call('/projects/' + id + '/files?path=main.py', 'alice')).status, 200);
    assert.equal((await call('/projects/' + id + '/files?path=notes/a.txt', 'alice', { method: 'PUT', body: 'hi' })).status, 200);
    const dir = await (await call('/projects/' + id + '/files?path=notes', 'alice')).json();
    assert.equal(dir.entries[0].name, 'a.txt');
    const root = await (await call('/projects/' + id + '/files', 'alice')).json();
    assert.ok(root.entries.some(e => e.name === 'notes' && e.dir));
    assert.equal((await call('/projects/' + id + '/start', 'alice', { method: 'POST' })).status, 501);
    assert.equal((await (await call('/projects/' + id, 'alice')).json()).runtime.state, 'unknown');
    const b = await (await call('/projects/' + id + '/backups', 'alice', { method: 'POST' })).json();
    assert.equal((await call('/projects/' + id + '/backups', 'bob')).status, 404);
    await call('/projects/' + id + '/files?path=main.py', 'alice', { method: 'DELETE' });
    assert.equal((await call('/projects/' + id + '/files?path=main.py', 'alice')).status, 404);
    assert.equal((await call(`/projects/${id}/backups/${b.id}/restore`, 'alice', { method: 'POST', body: '{}' })).status, 400);
    assert.equal((await call(`/projects/${id}/backups/${b.id}/restore`, 'alice', { method: 'POST', body: '{"confirm":true}' })).status, 200);
    assert.equal((await call('/projects/' + id + '/files?path=main.py', 'alice')).status, 200);
    // corrupt backup must not replace live files
    const key = `wz_projects/${id}/backups/${b.id}`, raw = Buffer.from(fake.docs.get(key).data.stringValue, 'base64'); raw[45] ^= 0xff;
    fake.docs.get(key).data.stringValue = raw.toString('base64');
    await call('/projects/' + id + '/files?path=main.py', 'alice', { method: 'DELETE' });
    assert.equal((await call(`/projects/${id}/backups/${b.id}/restore`, 'alice', { method: 'POST', body: '{"confirm":true}' })).status, 400);
    assert.equal((await call('/projects/' + id + '/files?path=main.py', 'alice')).status, 404);   // still unchanged
    assert.equal((await call('/projects/' + id + '?confirm=yes', 'bob', { method: 'DELETE' })).status, 404);
    assert.equal((await call('/projects/' + id, 'alice', { method: 'DELETE' })).status, 400);
    assert.equal((await call('/projects/' + id + '?confirm=yes', 'alice', { method: 'DELETE' })).status, 200);
    assert.ok(![...fake.docs.keys()].some(k => k.startsWith('wz_projects/' + id)));   // nothing left behind
  } finally { srv.close(); fake.srv.close(); }
});
