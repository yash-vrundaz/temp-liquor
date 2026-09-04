/**
 * Download bottle photos from Total Wine's public image CDN
 * for SKUs Ly's Liquor does not stock.
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
  { slug: "still-austin-the-musician", ids: ["191594751"], media: ["h9d/hb1/26556777005086.png"] },
  { slug: "redbreast-12-irish", ids: ["97340750"] },
  { slug: "tx-blended-whiskey", ids: [] },
  { slug: "deep-eddy-vodka", ids: ["120821750"] },
  { slug: "the-botanist-islay-gin", ids: ["125061750"] },
  { slug: "wray-nephew-overproof-rum", ids: ["2893750"], media: ["h15/hbf/29150454251550.png"] },
  { slug: "bumbu-original-rum", ids: ["183696750"], media: ["hd8/h9e/14615567106078.png"] },
  { slug: "espolon-reposado-tequila", ids: ["96444750"] },
  { slug: "del-maguey-vida-mezcal", ids: [] },
  { slug: "ej-vs-brandy", ids: ["1007750"] },
  { slug: "louis-m-martini-cabernet", ids: [] },
  { slug: "kim-crawford-sauvignon-blanc", ids: ["94641750"] },
  { slug: "santa-margherita-pinot-grigio", ids: ["2596750"], media: ["h76/h8b/28900633444382.png"] },
  { slug: "wycliff-brut-sparkling", ids: ["38050"] },
  { slug: "modelo-especial-12pk", ids: ["18724122", "131815164"], media: ["h1b/h91/16502501310494.png"] },
  { slug: "shiner-bock-12pk", ids: ["17192122", "17192127", "17192123"] },
  { slug: "heineken-12pk", ids: ["3380122", "3380005"] },
  { slug: "white-claw-variety-12pk", ids: ["174185122"] },
  { slug: "aperol-aperitivo", ids: ["15568750"] },
  { slug: "campari-aperitivo", ids: ["2724750"] },
  { slug: "cutwater-lemon-drop-4pk", ids: ["2126241800"], media: ["h23/h7d/30458031046686.png"] },
  { slug: "cutwater-mango-margarita-4pk", ids: ["235109355"], media: ["hc8/h31/27547107328030.png"] },
  { slug: "high-noon-variety-8pk", ids: ["226890355", "230804355"], media: ["h80/h4d/16704576421918.png"] },
];

function urlsFor(job) {
  const urls = [];
  for (const id of job.ids || []) {
    for (const size of ["x1000,sq", "x1000,12pk", "x1000,6pk", "x1000,4pk", "x1000"]) {
      for (const n of ["1", "2"]) {
        urls.push(`https://www.totalwine.com/dynamic/${size}/images/${id}/${id}-${n}-fr.png`);
      }
    }
  }
  for (const media of job.media || []) {
    urls.push(`https://www.totalwine.com/media/sys_master/twmmedia/${media}`);
    urls.push(`https://www.totalwine.com/dynamic/x1000,sq/media/sys_master/twmmedia/${media}`);
  }
  return urls;
}

async function download(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://www.totalwine.com/" },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "";
  if (!type.includes("image")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 12000) return null;
  return buf;
}

const mapping = JSON.parse(readFileSync(MAP, "utf8"));
let added = 0;

for (const job of JOBS) {
  if (mapping[job.slug]?.[0] && !mapping[job.slug][0].includes("unsplash")) {
    const local = mapping[job.slug][0];
    if (local.startsWith("http") || existsSync(path.join(ROOT, "public", local.replace(/^\//, "")))) {
      console.log(`HAVE  ${job.slug}`);
      continue;
    }
  }
  let saved = false;
  for (const url of urlsFor(job)) {
    try {
      const buf = await download(url);
      if (!buf) continue;
      const dest = path.join(OUT, `${job.slug}.png`);
      writeFileSync(dest, buf);
      mapping[job.slug] = [`/products/market/${job.slug}.png`];
      added += 1;
      saved = true;
      console.log(`OK    ${job.slug} (${buf.length} bytes) ${url}`);
      break;
    } catch (err) {
      console.warn(`skip  ${url} ${err.message}`);
    }
  }
  if (!saved) console.warn(`MISS  ${job.slug}`);
  await new Promise((r) => setTimeout(r, 200));
}

writeFileSync(MAP, JSON.stringify(mapping, null, 2) + "\n");
console.log(`\nAdded ${added}. Map now ${Object.keys(mapping).length} entries.`);
