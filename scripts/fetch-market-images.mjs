/**
 * Pull bottle photos from Ly's Liquor collection JSON (same store as the
 * reference site) and write /public/products/market + src/data/product-images.json.
 *
 * Usage: node scripts/fetch-market-images.mjs
 */
import { createWriteStream, mkdirSync, readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/products/market");
const MAP = path.join(ROOT, "src/data/product-images.json");
const CACHE = path.join(ROOT, "scripts/cache/lyliquor-products.json");
mkdirSync(OUT, { recursive: true });
mkdirSync(path.dirname(CACHE), { recursive: true });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const COLLECTIONS = [
  "whiskey",
  "bourbon",
  "scotch",
  "vodka",
  "gin",
  "rum",
  "tequila",
  "mezcal",
  "wine",
  "cognac",
  "brandy",
  "liqueur",
  "champagne",
  "ready-to-drink-cocktails",
  "beer",
];

const HANDLES = {
  "don-julio-blanco": "don-julio-blanco",
  "don-julio-reposado": "don-julio-reposado",
  "don-julio-anejo": "don-julio-anejo",
  "don-julio-1942": "don-julio-1942",
  "austin-hope-cabernet-2023": "austin-hope-cabernet-sauvignon-2023-750ml",
  "far-niente-napa-cabernet-2023": "far-niente-napa-valley-cabernet-sauvignon-2023-750ml",
  "baileys-cookies-creamy-oat": "baileys-cookies-creamy-non-dairy-liqueur-made-with-oat-milk-750ml",
  "suntory-toki-japanese-whisky": "toki-black-japanese-whisky-750ml",
  "sarti-rosa-aperitivo": "sarti-rosa-aperitivo-italia-700ml",
  "maria-bonita-mezcal-joven": "maria-bonita-mezcal-joven-salmiana-cupreata-7-year",
  "glen-grant-15-batch-strength": "the-glen-grant-15-year-old-batch-strength-single-malt-scotch-whisky-750ml",
  "johnnie-walker-blue-label": "johnnie-walker-blue-label-festive-blend-limited-edition-750ml",
  "aviation-american-gin": "aviation-american-gin",
  "clase-azul-reposado": "clase-azul-reposado",
  "buchanans-12-deluxe": "buchanans-deluxe-aged-12-years-blended-scotch-whiskey",
  "hennessy-vs-cognac": "hennessy-vs-cognac",
  "hennessy-vsop-cognac": "hennessy-privilege-vsop",
  "johnnie-walker-blue-label": "johnnie-walker-blue-label-scotch-whisky",
  "johnnie-walker-red-label": "johnnie-walker-red-label-blended-scotch-whiskey",
  "johnnie-walker-black-label": "johnnie-walker-black-label-blended-scotch-whiskey",
  "don-julio-anejo": "don-julio-anejo",
};

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['’éèò]/g, (ch) => ({ "é": "e", "è": "e", "ò": "o", "'": "", "’": "" }[ch] || ch))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseDrafts() {
  const src = readFileSync(path.join(ROOT, "src/data/market-catalog.ts"), "utf8");
  return src
    .split(/\n  \{\n    id: "/)
    .slice(1)
    .map((block) => {
      const pick = (key) => block.match(new RegExp(`${key}: "([^"]+)"`))?.[1] ?? "";
      return {
        id: block.match(/^([^"]+)/)?.[1] ?? "",
        slug: pick("slug"),
        name: pick("name"),
        brand: pick("brand"),
      };
    })
    .filter((p) => p.id.startsWith("mk-") && p.slug);
}

function distinctive(product) {
  const n = norm(`${product.brand} ${product.name}`);
  const tokens = [];
  for (const key of [
    "blanco",
    "reposado",
    "anejo",
    "1942",
    "black label",
    "red label",
    "blue label",
    "cookies",
    "cask strength",
    "single barrel",
    "vsop",
    "imperial",
    "prosecco",
    "pinot noir",
    "sauvignon",
    "pinot grigio",
    "cabernet",
    "rose",
  ]) {
    if (n.includes(key.replace(/ /g, " ")) || n.includes(key)) tokens.push(key);
  }
  return tokens;
}

function score(product, hit) {
  const title = norm(hit.title);
  const name = norm(product.name);
  const brand = norm(product.brand);
  if (!title) return -1;
  const isPack = /12pk|6pk|8pk|4pk/.test(product.slug);
  if (!isPack && /\bbundle\b|\d+\s*x\s*\d+|party pack|gift set/.test(title)) return -1;
  if (brand && !title.includes(brand) && !norm(hit.vendor || "").includes(brand)) return -1;
  for (const token of distinctive(product)) {
    if (!title.includes(norm(token))) return -1;
  }
  let s = 4;
  for (const tok of name.split(" ").filter((t) => t.length > 2)) {
    if (title.includes(tok)) s += 2;
  }
  if (title.includes(name)) s += 8;
  return s;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function toRow(p) {
  return {
    title: p.title,
    vendor: p.vendor,
    handle: p.handle,
    image: p.images?.[0]?.src || p.image?.src || p.image,
  };
}

async function loadLysCatalog() {
  const byKey = new Map();
  const add = (row) => {
    if (!row?.title || !row?.image) return;
    byKey.set(`${norm(row.title)}|${row.image}`, row);
  };

  const prior =
    "C:/Users/Raj/.cursor/projects/e-Raj-Data-G-GitHub-temp-liquor/agent-tools/bb76c335-8c63-409a-a563-2089c4e4d0b0.txt";
  if (existsSync(prior)) {
    const dumped = JSON.parse(readFileSync(prior, "utf8")).products || [];
    dumped.forEach((p) => add(toRow(p)));
  }
  if (existsSync(CACHE)) {
    JSON.parse(readFileSync(CACHE, "utf8")).forEach(add);
  }

  for (const handle of COLLECTIONS) {
    for (let page = 1; page <= 4; page += 1) {
      try {
        const data = await fetchJson(
          `https://lyliquor.com/collections/${handle}/products.json?limit=250&page=${page}`,
        );
        const list = data.products || [];
        list.forEach((p) => add(toRow(p)));
        console.log(`collection ${handle} p${page}: ${list.length}`);
        if (list.length < 250) break;
        await new Promise((r) => setTimeout(r, 900));
      } catch (err) {
        console.warn(`skip ${handle} p${page}: ${err.message}`);
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const all = [...byKey.values()];
  writeFileSync(CACHE, JSON.stringify(all));
  console.log(`Ly's index: ${all.length} unique products`);
  return all;
}

async function productByHandle(handle) {
  const data = await fetchJson(`https://lyliquor.com/products/${handle}.json`);
  return toRow(data.product);
}

function shopifySized(src) {
  const clean = String(src).split("&width=")[0];
  return `${clean}${clean.includes("?") ? "&" : "?"}width=1200`;
}

function extFromUrl(url) {
  const m = url.split("?")[0].match(/\.(png|jpe?g|webp|gif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://lyliquor.com/" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(String(res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error(`too small ${buf.length}`);
  await pipeline(Readable.from(buf), createWriteStream(dest));
  return buf.length;
}

const drafts = parseDrafts();
const catalog = await loadLysCatalog();
const mapping = {};
let ok = 0;

for (const product of drafts) {
  let sourceUrl = null;

  const ranked = catalog
    .map((hit) => ({ hit, s: score(product, hit) }))
    .filter((row) => row.s >= 6)
    .sort((a, b) => b.s - a.s);
  if (ranked[0]?.hit?.image) sourceUrl = shopifySized(ranked[0].hit.image);

  if (!sourceUrl && HANDLES[product.slug]) {
    try {
      const row = await productByHandle(HANDLES[product.slug]);
      if (row.image) sourceUrl = shopifySized(row.image);
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.warn(`handle ${product.slug}: ${err.message}`);
    }
  }

  if (!sourceUrl) {
    console.warn(`MISS  ${product.slug}`);
    continue;
  }

  const ext = extFromUrl(sourceUrl);
  const file = `${product.slug}.${ext}`;
  const dest = path.join(OUT, file);
  try {
    if (existsSync(dest) && statSync(dest).size < 12000) unlinkSync(dest);
    const bytes = existsSync(dest) ? statSync(dest).size : await download(sourceUrl, dest);
    mapping[product.slug] = [`/products/market/${file}`];
    ok += 1;
    console.log(`OK    ${product.slug} (${bytes} bytes)`);
  } catch (err) {
    mapping[product.slug] = [sourceUrl];
    ok += 1;
    console.log(`URL   ${product.slug} (hotlink) ${err.message}`);
  }
}

writeFileSync(MAP, JSON.stringify(mapping, null, 2) + "\n");
console.log(`\nMapped ${ok}/${drafts.length} → ${MAP}`);
