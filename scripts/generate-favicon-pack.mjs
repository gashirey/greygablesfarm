/**
 * Generate Grey Gables daisy favicon pack into public/.
 * Run: node scripts/generate-favicon-pack.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public");

/** Brand-adjacent colors tuned to pop at 16px on browser tabs */
const SAGE = "#6E9476";
const PETAL = "#FFFCFA";
const CENTER = "#E8B44A";
const CENTER_RING = "#C9952E";
/** Hot corner badge — same on GG / ASP / Surge so local tabs read instantly */
const LOCAL_BADGE = "#FF2D55";

/** @param {number} size @param {{ opaque?: boolean }} [opts] */
function daisySvg(size, opts = {}) {
  const opaque = opts.opaque === true;
  const c = size / 2;
  const petalLen = size * 0.34;
  const petalW = size * 0.155;
  const centerR = size * 0.145;
  const ringR = size * 0.17;
  const radius = size * 0.22;
  const pad = opaque ? 0 : size * 0.04;
  const bgRx = opaque ? 0 : radius;

  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    const x = c + Math.cos(angle) * (petalLen * 0.42);
    const y = c + Math.sin(angle) * (petalLen * 0.42);
    const deg = i * 45;
    return `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="${petalW.toFixed(2)}" ry="${petalLen.toFixed(2)}" fill="${PETAL}" transform="rotate(${deg} ${x.toFixed(2)} ${y.toFixed(2)})"/>`;
  }).join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${bgRx}" ry="${bgRx}" fill="${SAGE}"/>
  ${petals}
  <circle cx="${c}" cy="${c}" r="${ringR.toFixed(2)}" fill="${CENTER_RING}"/>
  <circle cx="${c}" cy="${c}" r="${centerR.toFixed(2)}" fill="${CENTER}"/>
  <circle cx="${(c - centerR * 0.28).toFixed(2)}" cy="${(c - centerR * 0.28).toFixed(2)}" r="${(centerR * 0.28).toFixed(2)}" fill="#F5D078" opacity="0.55"/>
</svg>`;
}

/** Minimal ICO with embedded PNG images (modern browsers + OS). */
function pngBuffersToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];

  for (const png of pngBuffers) {
    const meta = readPngSize(png);
    entries.push({
      width: meta.width >= 256 ? 0 : meta.width,
      height: meta.height >= 256 ? 0 : meta.height,
      size: png.length,
      offset,
      png,
    });
    offset += png.length;
  }

  const buf = Buffer.alloc(offset);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(count, 4);

  let entryAt = 6;
  for (const e of entries) {
    buf.writeUInt8(e.width, entryAt);
    buf.writeUInt8(e.height, entryAt + 1);
    buf.writeUInt8(0, entryAt + 2);
    buf.writeUInt8(0, entryAt + 3);
    buf.writeUInt16LE(1, entryAt + 4);
    buf.writeUInt16LE(32, entryAt + 6);
    buf.writeUInt32LE(e.size, entryAt + 8);
    buf.writeUInt32LE(e.offset, entryAt + 12);
    entryAt += 16;
  }

  for (const e of entries) {
    e.png.copy(buf, e.offset);
  }
  return buf;
}

function readPngSize(png) {
  // IHDR at byte 16 after 8-byte signature
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

/** @param {number} size @param {{ opaque?: boolean }} [opts] */
async function renderPng(size, opts = {}) {
  const svg = Buffer.from(daisySvg(size, opts));
  return sharp(svg, { density: 288 })
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  // Master SVG source (editable)
  writeFileSync(join(outDir, "favicon-daisy.svg"), daisySvg(512));

  /** @type {Array<[string, number, { opaque?: boolean }]>} */
  const sizes = [
    ["favicon-16x16.png", 16, {}],
    ["favicon-32x32.png", 32, {}],
    ["favicon-48x48.png", 48, {}],
    ["icon.png", 32, {}],
    ["apple-touch-icon.png", 180, { opaque: true }],
    ["icon-192.png", 192, {}],
    ["icon-512.png", 512, {}],
  ];

  /** @type {Record<string, Buffer>} */
  const pngs = {};
  for (const [name, size, opts] of sizes) {
    pngs[name] = await renderPng(size, opts);
    writeFileSync(join(outDir, name), pngs[name]);
    console.log(`wrote ${name} (${size}x${size}${opts.opaque ? ", opaque" : ""})`);
  }

  const ico = pngBuffersToIco([
    pngs["favicon-16x16.png"],
    pngs["favicon-32x32.png"],
    pngs["favicon-48x48.png"],
  ]);
  writeFileSync(join(outDir, "favicon.ico"), ico);
  console.log("wrote favicon.ico");

  const manifest = {
    name: "Grey Gables Farm",
    short_name: "Grey Gables",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    theme_color: SAGE,
    background_color: "#f2ece9",
    display: "standalone",
  };
  writeFileSync(
    join(outDir, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log("wrote site.webmanifest");

  // Prefer public/ + metadata icons (no app/favicon.ico) so localhost can swap packs.

  await writeLocalBadgePack(outDir, pngs, {
    name: "[local] Grey Gables Farm",
    short_name: "local",
    theme_color: LOCAL_BADGE,
    background_color: "#f2ece9",
  });

  console.log(`\nDaisy pack ready in ${outDir} (+ public/local badge pack)`);
  console.log(`Colors: sage ${SAGE}, petal ${PETAL}, center ${CENTER}`);
}

/** @param {string} outDir @param {Record<string, Buffer>} pngs */
async function writeLocalBadgePack(publicDir, pngs, manifestBase) {
  const localDir = join(publicDir, "local");
  mkdirSync(localDir, { recursive: true });

  async function badge(buf, size) {
    const r = Math.max(3, Math.round(size * 0.22));
    const cx = size - Math.round(size * 0.22);
    const cy = Math.round(size * 0.22);
    const ring = Math.max(1, Math.round(size * 0.04));
    const overlay = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <circle cx="${cx}" cy="${cy}" r="${r + ring}" fill="#FFFFFF"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${LOCAL_BADGE}"/>
</svg>`);
    return sharp(buf)
      .resize(size, size)
      .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
      .png()
      .toBuffer();
  }

  const localPngs = {};
  for (const [name, size] of [
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["favicon-48x48.png", 48],
    ["icon.png", 32],
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ]) {
    const src = pngs[name] || pngs["icon-512.png"];
    localPngs[name] = await badge(src, size);
    writeFileSync(join(localDir, name), localPngs[name]);
  }

  const localIco = pngBuffersToIco([
    localPngs["favicon-16x16.png"],
    localPngs["favicon-32x32.png"],
    localPngs["favicon-48x48.png"],
  ]);
  writeFileSync(join(localDir, "favicon.ico"), localIco);

  writeFileSync(
    join(localDir, "site.webmanifest"),
    `${JSON.stringify(
      {
        ...manifestBase,
        icons: [
          { src: "/local/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/local/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        display: "standalone",
      },
      null,
      2,
    )}\n`,
  );
  console.log("wrote public/local/* (badged for localhost tabs)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
