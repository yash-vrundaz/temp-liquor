/**
 * Import Spec's product dump (Untitled-1 / cdn.specsonline.com images)
 * into specs-wines.json + product-images.json.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/products/market");
const MAP = path.join(ROOT, "src/data/product-images.json");
const CATALOG = path.join(ROOT, "src/data/specs-wines.json");
const CACHE = path.join(ROOT, "scripts/cache/specs-products.json");
mkdirSync(OUT, { recursive: true });
mkdirSync(path.join(ROOT, "scripts/cache"), { recursive: true });

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const DUMP_CANDIDATES = [
  process.argv[2],
  "C:/Users/Raj/.cursor/projects/e-Raj-Data-G-GitHub-temp-liquor/uploads/Untitled-1-L1-L11053-0.txt",
  path.join(ROOT, "scripts/cache/specs-dump.txt"),
].filter(Boolean);

/** Existing shop slugs that this dump should update instead of duplicating. */
const ALIAS = {
  "wycliff-brut-sparkling": "wycliff-brut-sparkling",
  "lamarca-prosecco-nv": "la-marca-prosecco",
  "louis-martini-cabernet-sauvignon-sonoma-valley-2012": "louis-m-martini-cabernet",
  "josh-cellars-cabernet-sauvignon": "josh-cellars-cabernet",
  "meiomi-pinot-noir": "meiomi-pinot-noir",
  "kim-crawford-sauvignon-blanc": "kim-crawford-sauvignon-blanc",
  "santa-margherita-pinot-grigio": "santa-margherita-pinot-grigio",
  "whispering-angel-rose": "whispering-angel-rose",
  "caymus-cabernet-sauvignon": "caymus-cabernet-sauvignon",
  "malibu-rum-coconut": "malibu-coconut-rum",
  "malibu-rum-coconut-2": "malibu-coconut-rum",
  "malibu-rum-coconut-3": "malibu-coconut-rum",
  "malibu-coconut-rum-8": "malibu-coconut-rum",
  "bacardi-rum-light-2": "bacardi-superior-rum",
  "bacardi-superior-light-rum": "bacardi-superior-rum",
  "captain-morgan-original-spiced-rum-5": "captain-morgan-spiced-rum",
  "captain-morgan-spiced-rum": "captain-morgan-spiced-rum",
  "sailor-jerry-spiced-rum": "sailor-jerry-spiced-rum",
  "sailor-jerry-spiced-rum-3": "sailor-jerry-spiced-rum",
  "wray-nephew-overproof-rum": "wray-nephew-overproof-rum",
  "wray-nephew-overproof-rum-3": "wray-nephew-overproof-rum",
  "bumbu-original-rum": "bumbu-original-rum",
  "bumbu-rum-6-case": "bumbu-original-rum",
  "titos-texas-vodka": "titos-handmade-vodka",
  "titos-texas-vodka-2": "titos-handmade-vodka",
  "titos-texas-vodka-3": "titos-handmade-vodka",
  "titos-texas-vodka-4": "titos-handmade-vodka",
  "titos-texas-vodka-5": "titos-handmade-vodka",
  "titos-texas-vodka-6": "titos-handmade-vodka",
  "ketel-one-vodka": "ketel-one-vodka",
  "ketel-one-vodka-2": "ketel-one-vodka",
  "ketel-one-vodka-3": "ketel-one-vodka",
  "ketel-one-vodka-4": "ketel-one-vodka",
  "grey-goose-vodka": "grey-goose-vodka",
  "grey-goose-vodka-1": "grey-goose-vodka",
  "grey-goose-vodka-2": "grey-goose-vodka",
  "grey-goose-vodka-6": "grey-goose-vodka",
  "grey-goose-vodka-8": "grey-goose-vodka",
  "smirnoff-no-21-vodka": "smirnoff-no-21-vodka",
  "smirnoff-vodka-glass-80": "smirnoff-no-21-vodka",
  "smirnoff-vodka-80-3": "smirnoff-no-21-vodka",
  "smirnoff-vodka-80-4": "smirnoff-no-21-vodka",
  "smirnoff-vodka-80-plastic-bottle": "smirnoff-no-21-vodka",
  "smirnoff-vodka-80-plastic-bottle-2": "smirnoff-no-21-vodka",
  "deep-eddy-vodka": "deep-eddy-vodka",
  "deep-eddy-texas-vodka": "deep-eddy-vodka",
  "deep-eddy-texas-vodka-3": "deep-eddy-vodka",
  "wheatley-vodka": "wheatley-vodka",
};

function parseDump(raw) {
  const chunks = raw.split(/"products"\s*:\s*/).slice(1);
  const products = [];
  for (const chunk of chunks) {
    const start = chunk.indexOf("[");
    if (start < 0) continue;
    let depth = 0;
    let end = -1;
    for (let i = start; i < chunk.length; i++) {
      if (chunk[i] === "[") depth++;
      else if (chunk[i] === "]") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) throw new Error("Could not find end of products array");
    products.push(...JSON.parse(chunk.slice(start, end + 1)));
  }
  return products;
}

function slugFromUrl(url) {
  const m = String(url || "").match(/\/shop\/(?:wine|spirits|beer)\/([^/]+)\/?$/i);
  return (m?.[1] || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(Nv|Usa|Igt|Doc|Docg|Aoc|Av|Abv)\b/g, (m) => m.toUpperCase())
    .replace(/\bM\.\s*Martini\b/i, "M. Martini");
}

function brandName(brand) {
  const b = String(brand || "").trim();
  const special = {
    "LOUIS MARTINI": "Louis M. Martini",
    "WILLIAM WYCLIFF": "William Wycliff",
    "La Marca": "La Marca",
    Bacardí: "Bacardi",
    BACARDI: "Bacardi",
    APPLETON: "Appleton Estate",
    "Bumbu Rum Company": "Bumbu",
    "TROPIC ISLE PALMS": "Tropic Isle Palms",
    MODELO: "Modelo",
    Michelob: "Michelob",
  };
  if (special[b]) return special[b];
  return titleCase(b);
}

function parseSize(size) {
  const s = String(size || "").toUpperCase().replace(/\s+/g, "");
  const ml = s.match(/^(\d+(?:\.\d+)?)ML$/);
  if (ml) return Math.round(Number(ml[1]));
  const l = s.match(/^(\d+(?:\.\d+)?)L$/);
  if (l) return Math.round(Number(l[1]) * 1000);
  const oz = s.match(/^(\d+(?:\.\d+)?)OZ$/);
  if (oz) return Math.round(Number(oz[1]) * 29.5735);
  return 750;
}

const SKIP_SLUGS = new Set([
  "kim-crawford-sauvignon-blanc-new-zealand-2014",
  "josh-cellars-cabernet-sauvignon-2012",
  "meiomi-pinot-noir-belle-glos-vt",
  "santa-margherita-pinot-grigio-2013-2",
  "chateau-desclans-whispering-angel-cotes-de-provence-rare-rose-blend",
  "clicquot-brut-yellow-label-champagne-nv-2",
  "moet-chandon-brut-imperial-champagne-brut-champagne-blend-p5azd6",
  "moet-chandon-brut-imperial-champagne-brut-champagne-blend-p14wtg",
  "la-marca-prosecco",
  "barefoot-chardonnay-tetra-case-of-24",
  "barefoot-pinot-grigio-tetra-case-of-24",
]);

function mapCategory(group, subcategory, taxonomy) {
  const blob = `${group} ${subcategory} ${taxonomy}`.toLowerCase();
  if (/category_beer|\/beer\b|\blager\b|\bpilsner\b|\bbock\b|\bale\b|\bipa\b|\bstout\b|\bporter\b/.test(blob)) {
    return "beer";
  }
  if (/vermouth/.test(blob)) return "liqueur";
  if (/pouch|wine cocktail|chi-?chi/.test(blob)) return "rtd";
  if (/mezcal/.test(blob)) return "mezcal";
  if (/tequila/.test(blob)) return "tequila";
  if (/vodka/.test(blob)) return "vodka";
  if (/gin\b/.test(blob)) return "gin";
  if (/rum\b/.test(blob)) return "rum";
  // Prefer subcategory/taxonomy so "Brandy & Cognac" group maps correctly.
  if (/_cognac(?:_|$)|\/cognac\b|\bcognac\b/.test(`${subcategory} ${taxonomy}`)) return "cognac";
  if (/_brandy(?:_|$)|\/brandy\b|\bbrandy\b/.test(`${subcategory} ${taxonomy}`) || /\bbrandy\b/.test(blob)) {
    return "brandy";
  }
  if (/liqueur|cordial|cream|schnapps|aperitif/.test(blob)) return "liqueur";
  if (/bourbon|boutique-bourbon|tennessee whiskey|american whiskey/.test(blob)) return "bourbon";
  if (/scotch|irish whiskey|japanese whisk|canadian whisk|rye|whiskey|whisky/.test(blob)) {
    if (/scotch/.test(blob)) return "scotch";
    if (/bourbon/.test(blob)) return "bourbon";
    return "whiskey";
  }
  if (
    /sparkling|champagne|prosecco|cava|brut|cremant/.test(blob) &&
    !/still/.test(blob)
  ) {
    return "champagne";
  }
  if (/spirits/.test(blob) && /rum/.test(blob)) return "rum";
  if (/category_spirits/.test(blob)) return "whiskey";
  return "wine";
}

const ALIAS_PATTERNS = [
  [/^modelo-especial-12pk/, "modelo-especial-12pk"],
  [/^shiner-bock-12pk/, "shiner-bock-12pk"],
  [/^heineken-(12pk|lager)/, "heineken-12pk"],
  [/^guinness-draught/, "guinness-draught-6pk"],
  [/^white-claw-variety/, "white-claw-variety-12pk"],
  [/^buffalo-trace-kentucky-straight-bourbon/, "buffalo-trace-bourbon"],
  [/^makers-mark-bourbon-90$/, "makers-mark-bourbon"],
  [/^bulleit-(bourbon|frontier)/, "bulleit-bourbon"],
  [/^woodford-reserve-bourbon/, "woodford-reserve-bourbon"],
  [/^wild-turkey-101/, "wild-turkey-101-bourbon"],
  [/^knob-creek-9-year/, "knob-creek-9-year"],
  [/^blantons-single-barrel/, "blantons-single-barrel"],
  [/^weller-antique/, "weller-antique-107"],
  [/^jim-beam-black/, "jim-beam-black-7-year"],
  [/^jim-beam-(bourbon-80|kentucky-straight|bourbon-plastic)/, "jim-beam-white-label"],
  [/^johnnie-walker-black/, "johnnie-walker-black-label"],
  [/^johnnie-walker-red/, "johnnie-walker-red-label"],
  [/^johnnie-walker-blue/, "johnnie-walker-blue-label"],
  [/^buchanans-(12|de-luxe-12)/, "buchanans-12-deluxe"],
  [/^macallan-12-year-old-double-cask/, "macallan-12-double-cask"],
  [/^glenfiddich-malt-12yr/, "glenfiddich-12-year"],
  [/^glenmorangie-10/, "glenmorangie-10-original"],
  [/^don-julio-1942/, "don-julio-1942"],
  [/^don-julio-anejo(?!-claro)/, "don-julio-anejo"],
  [/^don-julio-(blanco|tequila-silver)/, "don-julio-blanco"],
  [/^don-julio-(reposado|tequila-reposado)/, "don-julio-reposado"],
  [/^espolon-(blanco|tequila-blanco)/, "espolon-blanco-tequila"],
  [/^espolon-(reposado|tequila-reposado)/, "espolon-reposado-tequila"],
  [/^lunazul-tequila-reposado/, "lunazul-reposado-tequila"],
  [/^patron-(silver|tequila-silver)/, "patron-silver-tequila"],
  [/^casamigos-tequila-blanco/, "casamigos-blanco-tequila"],
  [/^jose-cuervo-especial-gold/, "jose-cuervo-especial-gold"],
  [/^hennessy-(v-s-cognac|vs-cognac|cognac-vs$)/, "hennessy-vs-cognac"],
  [/^hennessy-(cognac-vsop|vsop)/, "hennessy-vsop-cognac"],
  [/^remy-martin-(v-s-o-p-cognac|cognac-vsop|vsop)/, "remy-martin-vsop"],
  [/^e-?j-(brandy|vs-brandy)/, "ej-vs-brandy"],
];

function resolveShopSlug(urlSlug) {
  if (ALIAS[urlSlug]) return ALIAS[urlSlug];
  for (const [re, slug] of ALIAS_PATTERNS) {
    if (re.test(urlSlug)) return slug;
  }
  return urlSlug;
}

function brandFromName(name) {
  const n = String(name || "").trim();
  if (/^Chateau/i.test(n)) {
    const m = n.match(/^(Chateau(?:\s+D['’][A-Za-z]+|\s+[A-Za-z]+){1,3})/i);
    return m ? m[1].replace(/\s+/g, " ").trim() : n.split(" ").slice(0, 2).join(" ");
  }
  return n.split(/\s+/).slice(0, 2).join(" ") || "Spec's";
}

function finalizeEntry(entry) {
  if (!entry.brand) entry.brand = brandFromName(entry.name);
  const blob = `${entry.slug} ${entry.name} ${entry.brand}`.toLowerCase();
  if (/daily|pouch|chi-?chi|wine cocktail/.test(blob)) {
    entry.category = "rtd";
    entry.subcategory = "Wine Cocktail";
    entry.tags = Array.from(new Set([...(entry.tags || []), "rtd", "pouch"]));
    if (/pouch/.test(blob) && entry.volumeMl === 750) entry.volumeMl = 296;
  }
  if (/vermouth/.test(blob)) {
    entry.category = "liqueur";
    entry.subcategory = "Vermouth";
  }
  if (entry.compareAtPrice == null) delete entry.compareAtPrice;
  return entry;
}

function mapCountry(subcategory, taxonomy, group, description = "") {
  const blob = `${subcategory} ${taxonomy} ${group} ${description}`.toLowerCase();
  if (/jamaica|jamaican|appleton|wray|myers|smith.?cross/.test(blob)) return "Jamaica";
  if (/barbados|mount gay|plantation/.test(blob)) return "Barbados";
  if (/puerto rico|bacardi|don q/.test(blob)) return "Puerto Rico";
  if (/cuba|havana/.test(blob)) return "Cuba";
  if (/nicaragua|flor de ca/.test(blob)) return "Nicaragua";
  if (/guatemala|zacapa|botran/.test(blob)) return "Guatemala";
  if (/venezuela|santa teresa|diplomatico|diplom/.test(blob)) return "Venezuela";
  if (/guyana|el dorado/.test(blob)) return "Guyana";
  if (/trinidad|kraken/.test(blob)) return "Trinidad and Tobago";
  if (/martinique|agricole/.test(blob)) return "Martinique";
  if (/us.?virgin|cruzan|st\.?\s*croix/.test(blob)) return "USA";
  if (/italy|italian|tuscany|piedmont|veneto|chianti|barolo|prosecco|abruzzo|sicily/.test(blob)) return "Italy";
  if (/france|french|bordeaux|burgundy|bourgogne|champagne|loire|rhone|provence|beaujolais/.test(blob)) return "France";
  if (/spain|spanish|rioja|cava|ribera/.test(blob)) return "Spain";
  if (/chile|chilean/.test(blob)) return "Chile";
  if (/argentina|mendoza/.test(blob)) return "Argentina";
  if (/new zealand|marlborough/.test(blob)) return "New Zealand";
  if (/australia|barossa|margaret river/.test(blob)) return "Australia";
  if (/germany|german|mosel/.test(blob)) return "Germany";
  if (/portugal|port |douro/.test(blob)) return "Portugal";
  if (/south africa/.test(blob)) return "South Africa";
  if (/canada/.test(blob)) return "Canada";
  if (/caribbean|rum/.test(blob)) return "Caribbean";
  return "USA";
}

function tastingNotes(description, group) {
  const text = String(description || "");
  const flavors = [
    "cherry", "blackberry", "black cherry", "plum", "cassis", "raspberry",
    "strawberry", "apple", "pear", "citrus", "lemon", "grapefruit", "peach",
    "tropical", "vanilla", "oak", "chocolate", "cocoa", "spice", "pepper",
    "honey", "floral", "herb", "mineral", "toast", "brioche", "melon",
    "coconut", "molasses", "banana", "caramel", "cinnamon", "almond", "pineapple",
  ];
  const found = [];
  const lower = text.toLowerCase();
  for (const f of flavors) {
    if (lower.includes(f) && !found.includes(titleCase(f))) found.push(titleCase(f));
    if (found.length >= 4) break;
  }
  if (found.length >= 2) return found;
  const g = titleCase(group || "Wine");
  return [g, "Fruit", "Finish"].slice(0, 3);
}

function foodPairings(category, group) {
  const blob = `${category} ${group}`.toLowerCase();
  if (/beer|lager|pilsner|bock/.test(blob)) return ["BBQ", "Pizza", "Game day"];
  if (/rum/.test(blob)) return ["Pineapple", "Lime", "BBQ"];
  if (/vodka|gin|tequila|mezcal|whiskey|bourbon|scotch|cognac|brandy/.test(blob)) {
    return ["Citrus", "Party snacks", "Cocktails"];
  }
  if (/sparkling|champagne|prosecco/.test(blob)) return ["Brunch", "Fruit", "Light appetizers"];
  if (/cabernet|malbec|syrah|merlot|red wine|bordeaux/.test(blob)) return ["Steak", "Lamb", "Hard cheese"];
  if (/pinot noir/.test(blob)) return ["Salmon", "Mushroom", "Duck"];
  if (/sauvignon|pinot grigio|albari/.test(blob)) return ["Oysters", "Salad", "Goat cheese"];
  if (/chardonnay|white/.test(blob)) return ["Chicken", "Seafood", "Pasta"];
  if (/ros[eé]|blush/.test(blob)) return ["Patio snacks", "Salad", "Seafood"];
  if (/dessert/.test(blob)) return ["Dessert", "Cheese", "Chocolate"];
  return ["Dinner", "Cheese", "Sharing plates"];
}

async function download(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "image/jpeg,image/webp,image/*,*/*",
      Referer: "https://specsonline.com/",
    },
    redirect: "follow",
  });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "";
  if (type && !type.includes("image") && !type.includes("octet")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) return null;
  return buf;
}

const dumpPath = DUMP_CANDIDATES.find((p) => existsSync(p));
if (!dumpPath) {
  console.error("Spec's dump not found");
  process.exit(1);
}

const products = parseDump(readFileSync(dumpPath, "utf8"));
const byUpc = new Map();
for (const p of products) {
  const upc = p.details?.attributes?.upc || p.code;
  if (!upc) continue;
  if (!byUpc.has(upc)) byUpc.set(upc, p);
}
const prevCache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : [];
const cacheByUpc = new Map();
for (const row of prevCache) {
  const upc = row.details?.attributes?.upc || row.code;
  if (upc && !cacheByUpc.has(upc)) cacheByUpc.set(upc, row);
}
for (const row of byUpc.values()) {
  const upc = row.details?.attributes?.upc || row.code;
  if (upc && !cacheByUpc.has(upc)) cacheByUpc.set(upc, row);
}
writeFileSync(CACHE, JSON.stringify([...cacheByUpc.values()], null, 2));
console.log(`Parsed ${products.length} rows, ${byUpc.size} unique UPCs from ${path.basename(dumpPath)}`);

const mapping = JSON.parse(readFileSync(MAP, "utf8"));
const catalog = existsSync(CATALOG) ? JSON.parse(readFileSync(CATALOG, "utf8")) : [];
const catalogIds = new Set(catalog.map((w) => w.id));
const catalogSlugs = new Set(catalog.map((w) => w.slug));
let downloaded = 0;
let skippedNoImage = 0;
let aliased = 0;
let skippedExisting = 0;

for (const p of byUpc.values()) {
  const attr = p.details?.attributes || {};
  const upc = String(attr.upc || "").replace(/\D/g, "") || String(p.code || "").replace(/\D/g, "");
  const urlSlug = slugFromUrl(p.url);
  if (!upc || !urlSlug) continue;
  const id = `sp-${attr.sku || upc}`;
  if (catalogIds.has(id)) {
    skippedExisting += 1;
    continue;
  }
  let shopSlug = resolveShopSlug(urlSlug);
  const isAlias = shopSlug !== urlSlug;
  if (!isAlias && catalogSlugs.has(shopSlug)) {
    shopSlug = `${urlSlug}-${upc.slice(-6)}`;
  }
  const imageUrl = p.details?.image;
  if (!imageUrl || !String(imageUrl).startsWith("http")) {
    skippedNoImage += 1;
    continue;
  }
  const destName = `specs-${upc}.jpg`;
  const dest = path.join(OUT, destName);
  const publicPath = `/products/market/${destName}`;
  if (!existsSync(dest)) {
    try {
      const buf = await download(imageUrl);
      if (!buf) {
        skippedNoImage += 1;
        continue;
      }
      writeFileSync(dest, buf);
      downloaded += 1;
      process.stdout.write(`OK  ${shopSlug} (${buf.length})\n`);
    } catch (err) {
      console.warn(`FAIL ${shopSlug} ${err.message}`);
      skippedNoImage += 1;
      continue;
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  const hasExistingPhoto = Boolean(mapping[shopSlug]?.[0]) && isAlias;
  if (!hasExistingPhoto) {
    mapping[shopSlug] = [publicPath];
  }
  if (isAlias || SKIP_SLUGS.has(urlSlug) || SKIP_SLUGS.has(shopSlug)) {
    aliased += 1;
    if (!hasExistingPhoto && isAlias) mapping[shopSlug] = [publicPath];
    continue;
  }

  let brand = brandName(attr.brand);
  const title = String(p.details?.title || "").trim() || brand;
  if (!brand) brand = brandFromName(title);
  const first = (brand.split(" ")[0] || "").toLowerCase();
  const name = first && title.toLowerCase().includes(first) ? title : `${brand} ${title}`.trim();
  const group = attr.categoryGroup || attr.subcategory || "Wine";
  const subcategory = attr.subcategory || group;
  const category = mapCategory(group, subcategory, p.taxonomy);
  const descRaw = String(p.details?.description || "").trim();
  const country = mapCountry(subcategory, p.taxonomy, group, `${descRaw} ${brand} ${title}`);
  const cents = p.pricing?.unitPricePromoDiscount || p.pricing?.unitPrice || 0;
  const compare = p.pricing?.unitPricePromoDiscount
    ? p.pricing.unitPrice
    : null;
  const desc =
    descRaw ||
    `${name} from Spec's. ${attr.size || "750ML"} ${subcategory}.`;
  const spirit =
    /rum|vodka|gin|tequila|mezcal|whiskey|bourbon|scotch|cognac|brandy|liqueur/.test(category);
  let abv = 13.5;
  if (category === "beer") abv = 4.5;
  else if (category === "champagne") abv = 12;
  else if (/dessert|moscato|dolce/.test(`${group} ${title}`.toLowerCase())) abv = 8;
  else if (spirit) {
    const abvMatch = descRaw.match(/(\d+(?:\.\d+)?)\s*%\s*ABV/i);
    abv = abvMatch ? Number(abvMatch[1]) : /overproof|wray/.test(`${title} ${shopSlug}`.toLowerCase()) ? 63 : 40;
  }
  const entry = finalizeEntry({
    id,
    slug: shopSlug,
    sku: String(attr.sku || ""),
    name,
    brand,
    category,
    subcategory,
    description: desc.length > 420 ? `${desc.slice(0, 417)}...` : desc,
    brandStory: `Stocked from Spec's Spring Valley / Katy Freeway (SKU ${attr.sku || upc}).`,
    origin: subcategory.replace(/\s+/g, " ").trim(),
    country,
    abv,
    volumeMl: parseSize(attr.size),
    price: Math.round((cents / 100) * 100) / 100,
    compareAtPrice: compare ? Math.round((compare / 100) * 100) / 100 : undefined,
    rating: p.max_rating ? Math.min(5, Math.round((Number(p.max_rating) / 20) * 10) / 10) : 4.2,
    reviewCount: 80 + (Number(attr.sku || upc.slice(-4)) % 900),
    tastingNotes: tastingNotes(desc, group),
    foodPairings: foodPairings(category, group),
    tags: ["specs", category, String(group).toLowerCase().replace(/[^a-z0-9]+/g, "-")].filter(Boolean),
    isPremium: cents >= 4000,
    isImported: country !== "USA",
  });
  catalog.push(entry);
  catalogIds.add(entry.id);
  catalogSlugs.add(entry.slug);
}

writeFileSync(MAP, JSON.stringify(mapping, null, 2) + "\n");
writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  `\nDownloaded ${downloaded}. Already in catalog ${skippedExisting}. Aliased/skipped ${aliased}. Catalog now ${catalog.length}. No image ${skippedNoImage}. Map ${Object.keys(mapping).length}.`,
);
