'use strict';
const httpErr = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
// Clean a project-relative path. Rejects traversal, absolute paths, backslashes, odd segments.
function cleanRel(rel, allowEmpty = false) {
  if (typeof rel !== 'string' || rel.length > 200 || rel.includes('\0') || rel.includes('\\') || rel.startsWith('/') || /^[a-zA-Z]:/.test(rel))
    throw httpErr(400, 'Invalid path');
  if (rel === '') { if (allowEmpty) return ''; throw httpErr(400, 'Path required.'); }
  if (rel.split('/').some(s => s === '' || s === '.' || s === '..')) throw httpErr(400, 'Invalid path');
  return rel;
}
const hits = new Map();
// Per-instance limit only (serverless instances do not share memory). Firestore rules are the real guard.
function rateLimit(key, max = 20, windowMs = 60000) {
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (a.length >= max) throw httpErr(429, 'Too many requests. Try again soon.');
  a.push(now); hits.set(key, a);
}
module.exports = { httpErr, cleanRel, rateLimit };
