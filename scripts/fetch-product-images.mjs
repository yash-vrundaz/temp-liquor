/**
 * Download real brand product photography into /public/products/bottles
 * Sources (official brand CDNs):
 * - Jack Daniel's pantheon media
 * - The Glenlivet ImageKit
 * - Stillhouse CloudFront
 *
 * Usage: npm run fetch:product-images
 */
import { createWriteStream, mkdirSync, statSync } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/products/bottles");
mkdirSync(OUT, { recursive: true });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const JD = "https://live-jd24-backend.pantheonsite.io/sites/default/files";
const GL = "https://ik.imagekit.io/cvygf2xse/theglenlivet/wp-content/uploads";
const SH = "https://dys01ae4o0qrd.cloudfront.net/wp-content/uploads";

/** @type {{ file: string; url: string }[]} */
const ASSETS = [
  // Jack Daniel's
  { file: "jd-old-no-7.png", url: `${JD}/2025-04/old%20no%207%20-%20with%20reflection.png` },
  { file: "jd-gentleman-jack.png", url: `${JD}/2025-04/Gentleman%20Jack%20-%20with%20reflection.png` },
  { file: "jd-single-barrel-select.png", url: `${JD}/2025-04/single%20barrel%20select%20-%20with%20reflection.png` },
  { file: "jd-single-barrel-proof.png", url: `${JD}/2025-04/single%20barrel%20barrel%20proof%20-%20with%20reflection.png` },
  { file: "jd-bonded.png", url: `${JD}/2025-04/bonded%20-%20with%20reflection.png` },
  { file: "jd-sinatra-select.png", url: `${JD}/2025-04/sinatra%20select%20-%20with%20reflection.png` },
  { file: "jd-tennessee-honey.png", url: `${JD}/2025-04/tennessee%20honey%20-%20with%20reflection.png` },
  { file: "jd-tennessee-apple.png", url: `${JD}/2025-04/tennessee%20apple%20-%20with%20reflection_0.png` },
  { file: "jd-tennessee-fire.png", url: `${JD}/2025-04/tennessee%20fire%20-%20with%20reflection.png` },
  { file: "jd-tennessee-blackberry.png", url: `${JD}/2025-08/tennessee%20blackberry%20-%20with%20reflection_0.png` },
  { file: "jd-winter-jack.png", url: `${JD}/2025-04/winter%20jack%20-%20with%20reflection.png` },
  { file: "jd-bonded-series.jpg", url: `${JD}/2024-12/Bonded%20Series%20Bottles%20on%20Side.png` },

  // The Glenlivet
  { file: "glenlivet-12.png", url: `${GL}/2021/10/12-Year-Old-Single-Malt-Whisky-Bottle-70cl.png` },
  { file: "glenlivet-14.png", url: `${GL}/2022/06/TGL-14YO-Bottle-.png` },
  { file: "glenlivet-15.png", url: `${GL}/2021/10/15-year-old-single-malt-whisky-bottle-70cl.png` },
  { file: "glenlivet-18.png", url: `${GL}/2021/10/18-year-old-single-malt-scotch-whisky-bottle-70cl.png` },
  { file: "glenlivet-21.png", url: `${GL}/2022/07/21-year-old-bottle-2.png` },
  { file: "glenlivet-25.png", url: `${GL}/2022/06/25-year-old-bottle-2.png` },
  { file: "glenlivet-founders-reserve.png", url: `${GL}/2021/10/Founders-Reserve-Bottle-70cl.png` },
  { file: "glenlivet-caribbean.png", url: `${GL}/2021/11/caribbean-reserve.png` },
  { file: "glenlivet-12-lifestyle.jpg", url: `${GL}/2024/09/TGL_12YO_OF_1x1_clean-aspect-ratio-13-12-2.jpg?tr=q-90,w-1000` },
  { file: "glenlivet-14-lifestyle.jpg", url: `${GL}/2024/09/TGL_14YO_Manhattan-_1x1_clean-aspect-ratio-13-12-2.jpg?tr=q-90,w-1000` },
  { file: "glenlivet-15-lifestyle.jpg", url: `${GL}/2024/09/TGL_LIFESTYLE_MOC_15YO_MULTI_1x1_clean-aspect-ratio-13-12-1.jpg?tr=q-90,w-1000` },
  { file: "glenlivet-luxury.png", url: `${GL}/2025/11/Luxury-collection.png?tr=q-90,w-1200` },
  { file: "glenlivet-signature.webp", url: `${GL}/2025/09/Signature_16x10.webp?tr=q-90,w-1200` },

  // Stillhouse
  { file: "stillhouse-original.png", url: `${SH}/2020/07/27105328/FY21_Stillhouse_OriginalWhiskey_IPX_750ML-2.png` },
  { file: "stillhouse-spiced-cherry.png", url: `${SH}/2020/07/27105336/FY21_Stillhouse_SpicedCherryWhiskey_IPX_750ML-2.png` },
  { file: "stillhouse-peach-tea.png", url: `${SH}/2020/07/27105329/FY21_Stillhouse_PeachTeaWhiskey_IPX_750ML-2.png` },
  { file: "stillhouse-apple-crisp.png", url: `${SH}/2020/07/27105313/FY21_Stillhouse_AppleCrispWhiskey_IPX_750ML-2.png` },
  { file: "stillhouse-black-bourbon.png", url: `${SH}/2020/07/27105320/FY21_Stillhouse_BlackBourbon_IPX_750ML-2.png` },
  { file: "stillhouse-classic-vodka.png", url: `${SH}/2020/07/27105322/FY21_Stillhouse_ClassicVodka_IPX_750ML-2.png` },
];

async function downloadOne({ file, url }) {
  const dest = path.join(OUT, file);
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*,*/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`${file}: too small`);
  await pipeline(Readable.from(buf), createWriteStream(dest));
  console.log(`OK  ${file} (${statSync(dest).size} bytes)`);
}

let ok = 0;
for (const asset of ASSETS) {
  try {
    await downloadOne(asset);
    ok++;
  } catch (e) {
    console.warn(`FAIL ${e.message}`);
  }
}
console.log(`\nDownloaded ${ok}/${ASSETS.length} → ${OUT}`);
