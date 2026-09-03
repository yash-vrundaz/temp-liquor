/**
 * Spec's website (specsonline.com) sits behind AWS WAF, so HTML and
 * static.specsonline.com uploads are not fetchable from this environment.
 * Spec's mobile app is BottleCapps; product photos live on the same
 * LiquorApps CDN the app uses. Download those, then visually confirm
 * the bottle before mapping in product-images.json.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/products/market");
const MAP = path.join(ROOT, "src/data/product-images.json");
mkdirSync(OUT, { recursive: true });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const JOBS = [
  {
    slug: "tx-blended-whiskey",
    ext: "webp",
    referer: "https://monarchliquor.bottlecapps.com/",
    urls: [
      "https://images.liquorapps.com/wp/bg/89264-Texas-Blended-WhiskeyBB08.webp",
      "https://images.liquorapps.com/wp/sm/89264-Texas-Blended-WhiskeyBB08.webp",
    ],
  },
  {
    slug: "del-maguey-vida-mezcal",
    ext: "webp",
    referer: "https://shop.fivepointsbottleshop.com/",
    urls: [
      "https://images.liquorapps.com/wp/bg/124541-Del-Maguey-Vida-MezcalBB08.webp",
      "https://images.liquorapps.com/wp/sm/124541-Del-Maguey-Vida-MezcalBB08.webp",
    ],
  },
  {
    slug: "wycliff-brut-sparkling",
    ext: "webp",
    referer: "https://buy.shopbottles.com/",
    urls: [
      "https://images.liquorapps.com/wp/bg/72929-Wycliff-Brut-California-Champagne-BlendBB08.webp",
      "https://images.liquorapps.com/wp/sm/72929-Wycliff-Brut-California-Champagne-BlendBB08.webp",
    ],
  },
];

async function download(url, referer) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "image/webp,image/*,*/*",
      Referer: referer,
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 12000) return null;
  return buf;
}

const mapping = JSON.parse(readFileSync(MAP, "utf8"));
let added = 0;

for (const job of JOBS) {
  const dest = path.join(OUT, `${job.slug}.${job.ext}`);
  if (mapping[job.slug]?.[0] && existsSync(path.join(ROOT, "public", mapping[job.slug][0].replace(/^\//, "")))) {
    console.log(`HAVE  ${job.slug}`);
    continue;
  }
  let saved = false;
  for (const url of job.urls) {
    try {
      const buf = await download(url, job.referer);
      if (!buf) continue;
      writeFileSync(dest, buf);
      mapping[job.slug] = [`/products/market/${job.slug}.${job.ext}`];
      added += 1;
      saved = true;
      console.log(`OK    ${job.slug} (${buf.length} bytes)`);
      break;
    } catch (err) {
      console.warn(`skip  ${url} ${err.message}`);
    }
  }
  if (!saved) console.warn(`MISS  ${job.slug}`);
}

writeFileSync(MAP, JSON.stringify(mapping, null, 2) + "\n");
console.log(`\nAdded ${added}. Map now ${Object.keys(mapping).length} entries.`);
