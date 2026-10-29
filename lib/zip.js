'use strict';
const zlib = require('zlib');
const T = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = -1; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
class ZipError extends Error { constructor(m, code = 'ZIP_INVALID') { super(m); this.code = code; this.status = 400; } }
const LIM = { maxFiles: 2000, maxTotal: 50 * 2 ** 20, maxFile: 10 * 2 ** 20, maxRatio: 200 };
const unsafeName = n => !n || n.includes('\0') || n.includes('\\') || n.startsWith('/') || /^[a-zA-Z]:/.test(n) || n.split('/').includes('..');

// Fully validates and extracts a ZIP in memory. Never touches the disk.
function readZip(buf, lim = {}) {
  const L = { ...LIM, ...lim };
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new ZipError('This is not a ZIP file.');
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new ZipError('This is not a valid ZIP file (no end record).');
  const count = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16);
  if (count > L.maxFiles) throw new ZipError(`Too many files (limit ${L.maxFiles}).`, 'ZIP_LIMIT');
  const out = []; let total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new ZipError('ZIP directory is corrupt.');
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16),
      cs = buf.readUInt32LE(p + 20), us = buf.readUInt32LE(p + 24), nl = buf.readUInt16LE(p + 28),
      el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), attr = buf.readUInt32LE(p + 38), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nl);
    p += 46 + nl + el + cl;
    if (unsafeName(name)) throw new ZipError(`Unsafe path in archive: ${name.slice(0, 80)}`, 'ZIP_UNSAFE');
    if (flags & 1) throw new ZipError('Encrypted archives are not supported.');
    if (((attr >>> 16) & 0xF000) === 0xA000) throw new ZipError(`Symbolic links are not allowed: ${name}`, 'ZIP_UNSAFE');
    if (name.endsWith('/')) { out.push({ name: name.slice(0, -1), dir: true }); continue; }
    if (us > L.maxFile) throw new ZipError(`File too large: ${name}`, 'ZIP_LIMIT');
    total += us; if (total > L.maxTotal) throw new ZipError('Archive is too large when unpacked.', 'ZIP_LIMIT');
    if (cs > 0 && us > 1 << 20 && us / cs > L.maxRatio) throw new ZipError(`Suspicious compression ratio: ${name}`, 'ZIP_UNSAFE');
    if (off + 30 > buf.length || buf.readUInt32LE(off) !== 0x04034b50) throw new ZipError('ZIP entry is corrupt.');
    const ds = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
    if (ds + cs > buf.length) throw new ZipError('ZIP entry is truncated.');
    const raw = buf.subarray(ds, ds + cs); let data;
    try { data = method === 0 ? Buffer.from(raw) : method === 8 ? zlib.inflateRawSync(raw, { maxOutputLength: Math.max(us, 1) }) : null; }
    catch { throw new ZipError(`Cannot decompress ${name}.`); }
    if (!data) throw new ZipError(`Unsupported compression method in ${name}.`);
    if (data.length !== us || crc32(data) !== crc) throw new ZipError(`Checksum mismatch: ${name}`);
    out.push({ name, dir: false, data });
  }
  return out;
}

function writeZip(files) {
  const parts = [], cd = []; let off = 0;
  for (const f of files) {
    const nm = Buffer.from(f.name + (f.dir ? '/' : '')), data = f.dir ? Buffer.alloc(0) : f.data;
    const m = f.dir ? 0 : 8, def = f.dir ? data : zlib.deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(m, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(def.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    parts.push(lh, nm, def);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(m, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(def.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    cd.push(ch, nm); off += 30 + nm.length + def.length;
  }
  const cdb = Buffer.concat(cd), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cdb.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cdb, end]);
}
module.exports = { readZip, writeZip, ZipError, crc32 };
