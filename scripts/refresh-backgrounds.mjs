import { readFile, writeFile } from "node:fs/promises";

const API_URL = "https://api.lolicon.app/setu/v1";
const CATALOG_URL = new URL("../backgrounds.json", import.meta.url);
const MAX_CATALOG_SIZE = 48;

function normalize(item) {
  if (!item || item.r18 !== false) return null;
  const width = Number(item.width);
  const height = Number(item.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width / height < 1.2) return null;
  try {
    const sourceUrl = new URL(String(item.sourceUrl || item.url));
    if (sourceUrl.protocol !== "https:" || sourceUrl.hostname !== "i.pixiv.re") return null;
    const match = sourceUrl.pathname.match(/^\/img-original\/(img\/.+\/)(\d+_p\d+)\.[a-z0-9]+$/i);
    if (!match) return null;
    const url = new URL(sourceUrl);
    url.pathname = `/img-master/${match[1]}${match[2]}_master1200.jpg`;
    return {
      pid: Number(item.pid),
      p: Number(item.p) || 0,
      title: String(item.title || ""),
      author: String(item.author || ""),
      r18: false,
      width,
      height,
      sourceUrl: sourceUrl.href,
      url: url.href,
    };
  } catch (error) {
    return null;
  }
}

async function readCurrentCatalog() {
  try {
    const current = JSON.parse(await readFile(CATALOG_URL, "utf8"));
    return Array.isArray(current.data) ? current.data.map(normalize).filter(Boolean) : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function requestBackgrounds() {
  const url = new URL(API_URL);
  url.searchParams.set("r18", "0");
  url.searchParams.set("num", "20");
  url.searchParams.set("excludeAI", "true");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Lolicon API returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.code !== 0 || !Array.isArray(payload.data)) {
    throw new Error(`Lolicon API returned an invalid payload: ${payload.msg || "unknown error"}`);
  }
  if (payload.count !== payload.data.length) {
    throw new Error("Lolicon API count does not match data length");
  }
  const candidates = payload.data.map(normalize).filter(Boolean);
  const availability = await Promise.all(candidates.map(async item => {
    try {
      const response = await fetch(item.url, { method: "HEAD" });
      return response.ok && response.headers.get("content-type")?.startsWith("image/") ? item : null;
    } catch (error) {
      return null;
    }
  }));
  return availability.filter(Boolean);
}

const current = await readCurrentCatalog();
const incoming = await requestBackgrounds();
const merged = [];
const seen = new Set();
for (const item of [...incoming, ...current]) {
  const key = `${item.pid}:${item.p}`;
  if (seen.has(key)) continue;
  seen.add(key);
  merged.push(item);
  if (merged.length >= MAX_CATALOG_SIZE) break;
}

if (!merged.length) throw new Error("Lolicon API returned no non-R18 landscape images");
if (JSON.stringify(merged) === JSON.stringify(current)) {
  console.log("Background catalog already contains all returned landscape images");
  process.exit(0);
}

await writeFile(CATALOG_URL, `${JSON.stringify({
  source: API_URL,
  updatedAt: new Date().toISOString(),
  data: merged,
}, null, 2)}\n`);
console.log(`Background catalog updated: ${incoming.length} new candidates, ${merged.length} total`);
