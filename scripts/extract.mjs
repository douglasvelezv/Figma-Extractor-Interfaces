#!/usr/bin/env node
/**
 * Extractor local de frames de Figma -> carpeta + ZIP.
 * Alternativa al web app cuando el CDN de Figma bloquea la descarga por CORS.
 *
 * Uso:
 *   FIGMA_TOKEN=figd_xxx node scripts/extract.mjs <enlace-o-clave> [--scale 2] [--out ./salida] [--name Interfaces] [--numeric]
 *
 * Requiere Node 18+ (fetch nativo). El ZIP se crea con `zip` del sistema si está
 * disponible; si no, deja la carpeta lista para comprimir a mano.
 */

import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const API = "https://api.figma.com/v1";

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const has = (flag) => process.argv.includes(flag);

const token = process.env.FIGMA_TOKEN;
const target = process.argv[2];
const scale = arg("--scale", "2");
const outDir = arg("--out", "./salida");
const folderName = arg("--name", "Interfaces");
const numeric = has("--numeric");

if (!token || !target || target.startsWith("--")) {
  console.error("Falta FIGMA_TOKEN o el enlace del archivo.\nUso: FIGMA_TOKEN=figd_xxx node scripts/extract.mjs <enlace> [--scale 2] [--out ./salida] [--name Interfaces] [--numeric]");
  process.exit(1);
}

const key =
  (target.match(/figma\.com\/(?:file|proto|design|board)\/([A-Za-z0-9]{10,})/i) || [])[1] ||
  (/^[A-Za-z0-9]{10,}$/.test(target) ? target : null);

if (!key) {
  console.error("No se pudo extraer la clave del archivo del enlace.");
  process.exit(1);
}

const headers = { "X-Figma-Token": token };

async function api(path) {
  const res = await fetch(API + path, { headers });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

function sanitize(name) {
  return (name || "").replace(/[<>:"/\\|?* -]/g, "_").replace(/\s+/g, " ").trim().slice(0, 120) || "sin_nombre";
}

const file = await api(`/files/${key}?depth=2`);
const frames = [];
for (const page of file.document.children || []) {
  if (page.type !== "CANVAS") continue;
  for (const node of page.children || []) {
    if (node.type === "FRAME") frames.push({ id: node.id, name: node.name, page: page.name });
  }
}
if (!frames.length) {
  console.error("No se encontraron frames de nivel superior.");
  process.exit(1);
}
console.log(`Archivo: ${file.name} — ${frames.length} frames`);

const urls = {};
const BATCH = 20;
for (let b = 0; b < frames.length; b += BATCH) {
  const batch = frames.slice(b, b + BATCH).map((f) => f.id);
  const q = new URLSearchParams({ ids: batch.join(","), format: "png", scale });
  const data = await api(`/images/${key}?${q}`);
  if (data.err) throw new Error("Render: " + data.err);
  Object.assign(urls, data.images || {});
  console.log(`  render ${Math.min(b + BATCH, frames.length)}/${frames.length}`);
  if (b + BATCH < frames.length) await new Promise((r) => setTimeout(r, 300));
}

const base = join(outDir, folderName);
if (existsSync(base)) await rm(base, { recursive: true, force: true });
await mkdir(base, { recursive: true });

const used = new Set();
let i = 0;
for (const f of frames) {
  i++;
  const url = urls[f.id];
  if (!url) { console.warn(`  ! sin imagen: ${f.name}`); continue; }
  let stem = numeric ? String(i).padStart(4, "0") : sanitize(f.name);
  let name = stem, n = 2;
  while (used.has(name.toLowerCase())) name = `${stem} (${n++})`;
  used.add(name.toLowerCase());

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(base, name + ".png"), buf);
  console.log(`  ✓ ${name}.png`);
}

const zipPath = join(outDir, folderName + ".zip");
const zip = spawnSync("zip", ["-r", folderName + ".zip", folderName], { cwd: outDir, stdio: "inherit" });
if (zip.status === 0) console.log(`\nZIP: ${zipPath}`);
else console.log(`\nCarpeta lista en ${base}. Comprímela a mano (no se encontró 'zip').`);
