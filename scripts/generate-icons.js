import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'static', 'icons');
mkdirSync(iconsDir, { recursive: true });

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function generatePNG(size) {
  const bg = [0x1a, 0x1a, 0x2e];
  const gold = [0xc5, 0xa5, 0x5a];

  const pixels = [];
  for (let y = 0; y < size; y++) {
    pixels.push(0);
    for (let x = 0; x < size; x++) {
      if (isCross(x, y, size)) {
        pixels.push(...gold);
      } else {
        pixels.push(...bg);
      }
    }
  }

  const raw = Buffer.from(pixels);
  const compressed = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

function isCross(x, y, size) {
  const cx = Math.floor(size / 2);
  const cy = Math.floor(size / 2);
  const arm = Math.max(2, Math.floor(size * 0.06));
  const halfLen = Math.floor(size * 0.32);
  const topLen = Math.floor(size * 0.38);

  const inVert = Math.abs(x - cx) <= arm && y >= cy - topLen && y <= cy + halfLen;
  const inHoriz = Math.abs(y - cy) <= arm && x >= cx - halfLen && x <= cx + halfLen;

  return inVert || inHoriz;
}

writeFileSync(join(iconsDir, 'icon-192.png'), generatePNG(192));
writeFileSync(join(iconsDir, 'icon-512.png'), generatePNG(512));
console.log('Icons generated.');
