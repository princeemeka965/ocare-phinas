import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = "public/brands";
const backupDir = "scripts/brand-originals"; // kept out of public/ so it isn't web-served
const TOL = 50; // per-step Euclidean RGB tolerance for region growing

async function processFile(file) {
  const src = path.join(dir, file);
  const bak = path.join(backupDir, file);
  if (!fs.existsSync(path.dirname(bak))) fs.mkdirSync(path.dirname(bak), { recursive: true });
  if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);

  // Always process from the pristine original so re-runs are deterministic.
  const { data, info } = await sharp(bak)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  const bg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let tail = 0;
  const idx = (x, y) => y * w + x;
  const dist2 = (i, j) => {
    const a = i * ch, b = j * ch;
    const dr = data[a] - data[b], dg = data[a + 1] - data[b + 1], db = data[a + 2] - data[b + 2];
    return dr * dr + dg * dg + db * db;
  };
  const T2 = TOL * TOL;

  const seed = (p) => { if (!bg[p]) { bg[p] = 1; queue[tail++] = p; } };
  for (let x = 0; x < w; x++) { seed(idx(x, 0)); seed(idx(x, h - 1)); }
  for (let y = 0; y < h; y++) { seed(idx(0, y)); seed(idx(w - 1, y)); }

  let head = 0;
  while (head < tail) {
    const p = queue[head++];
    const x = p % w, y = (p - x) / w;
    if (x > 0 && !bg[p - 1] && dist2(p, p - 1) <= T2) { bg[p - 1] = 1; queue[tail++] = p - 1; }
    if (x < w - 1 && !bg[p + 1] && dist2(p, p + 1) <= T2) { bg[p + 1] = 1; queue[tail++] = p + 1; }
    if (y > 0 && !bg[p - w] && dist2(p, p - w) <= T2) { bg[p - w] = 1; queue[tail++] = p - w; }
    if (y < h - 1 && !bg[p + w] && dist2(p, p + w) <= T2) { bg[p + w] = 1; queue[tail++] = p + w; }
  }

  let cleared = 0;
  for (let i = 0; i < w * h; i++) if (bg[i]) { data[i * ch + 3] = 0; cleared++; }

  const out = sharp(data, { raw: { width: w, height: h, channels: ch } });
  const ext = path.extname(file).toLowerCase();
  const buf = ext === ".webp"
    ? await out.webp({ lossless: true }).toBuffer()
    : await out.png().toBuffer();
  const tmp = src + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, src);
  console.log(`${file.padEnd(20)} cleared ${((100 * cleared) / (w * h)).toFixed(1)}% -> transparent`);
}

for (const f of fs.readdirSync(dir)) {
  if (!fs.statSync(path.join(dir, f)).isFile()) continue;
  try {
    await processFile(f);
  } catch (err) {
    console.error(`${f.padEnd(20)} FAILED: ${err.code || err.message}`);
  }
}
