'use strict';
const crypto = require('crypto');
const { httpErr } = require('./util');
const CERTS = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cache = { at: 0, certs: {} };
async function googleKey(kid) {
  if (Date.now() - cache.at > 3600e3 || !cache.certs[kid]) {
    const r = await fetch(CERTS); if (!r.ok) throw httpErr(503, 'Cannot load Google signing keys.');
    cache = { at: Date.now(), certs: await r.json() };
  }
  if (!cache.certs[kid]) throw httpErr(401, 'Unknown signing key.');
  return new crypto.X509Certificate(cache.certs[kid]).publicKey;
}
// Verifies a Firebase ID token (RS256) without extra packages.
async function verifyFirebaseToken(token, projectId, getKey = googleKey) {
  const bad = () => httpErr(401, 'Invalid or expired sign-in.');
  const [h, p, s] = String(token).split('.'); if (!s) throw bad();
  let head, pay; try { head = JSON.parse(Buffer.from(h, 'base64url')); pay = JSON.parse(Buffer.from(p, 'base64url')); } catch { throw bad(); }
  if (head.alg !== 'RS256' || !head.kid) throw bad();
  const key = await getKey(head.kid);
  if (!crypto.verify('RSA-SHA256', Buffer.from(h + '.' + p), key, Buffer.from(s, 'base64url'))) throw bad();
  const now = Math.floor(Date.now() / 1000);
  if (pay.aud !== projectId || pay.iss !== 'https://securetoken.google.com/' + projectId || !pay.sub || pay.exp <= now || pay.iat > now + 60) throw bad();
  return { uid: pay.sub, name: pay.email || pay.name || pay.sub };
}
async function authenticate(req, cfg, getKey) {
  const h = req.headers.authorization || '', t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t) throw httpErr(401, 'Sign in required.');
  if (cfg.authMode === 'dev') {
    if (!/^dev:[\w.-]{1,40}$/.test(t)) throw httpErr(401, 'Invalid dev sign-in.');
    return { uid: t, name: t.slice(4) };
  }
  return verifyFirebaseToken(t, cfg.firebaseProjectId, getKey);
}
module.exports = { authenticate, verifyFirebaseToken };
