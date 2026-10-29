'use strict';
const fs = require('fs'), path = require('path');
const httpErr = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
// Resolve `rel` inside `root`; rejects traversal, absolute paths, backslashes and symlink escapes.
function safeJoin(root, rel = '') {
  if (typeof rel !== 'string' || rel.includes('\0') || rel.includes('\\') || path.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel))
    throw httpErr(400, 'Invalid path');
  const r = path.resolve(root), t = path.resolve(r, rel);
  if (t !== r && !t.startsWith(r + path.sep)) throw httpErr(400, 'Invalid path');
  let c = t; while (!fs.existsSync(c)) c = path.dirname(c);
  const rr = fs.realpathSync(r), rc = fs.realpathSync(c);
  if (rc !== rr && !rc.startsWith(rr + path.sep)) throw httpErr(400, 'Invalid path');
  return t;
}
const hits = new Map();
function rateLimit(key, max = 20, windowMs = 60000) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (a.length >= max) throw httpErr(429, 'Too many requests. Try again soon.');
  a.push(now); hits.set(key, a);
}
module.exports = { httpErr, safeJoin, rateLimit };
