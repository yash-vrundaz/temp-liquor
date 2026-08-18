import type { Product } from "@/types";
import {
  getCustomProductById,
  getCustomProductBySlug,
  getCustomProducts,
} from "@/data/custom-products";

/**
 * Real brand product photography (local copies under /public/products/bottles).
 * Sourced from official brand CDNs referenced by:
 * - https://www.jackdaniels.com/
 * - https://www.theglenlivet.com/en/
 * - https://www.stillhouse.com/
 */
const B = "/products/bottles";

const img = (...paths: string[]) => paths;

export const products: Product[] = [
  // ═══════════════════════════════════════════════════════════
  // Jack Daniel's — core & flavored Tennessee whiskey collection
  // ═══════════════════════════════════════════════════════════
  {
    id: "jd1",
    slug: "jack-daniels-old-no-7",
    name: "Jack Daniel's Old No. 7",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Tennessee Whiskey",
    description:
      "Charcoal mellowed drop by drop through 10 feet of sugar maple charcoal, then matured in handcrafted barrels. The iconic Tennessee whiskey — balanced sweet and oaky flavor, judged ready only when the tasters say so.",
    brandStory:
      "Since 1866 in Lynchburg, Tennessee, Jack Daniel's has made whiskey the same way Jack himself did — charcoal mellowed, barrel matured, and never rushed by a calendar.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 40,
    volumeMl: 750,
    price: 28,
    compareAtPrice: 32,
    rating: 4.6,
    reviewCount: 4820,
    tastingNotes: ["Dried fruit", "Oak", "Vanilla", "Caramel"],
    foodPairings: ["BBQ ribs", "Smoked almonds", "Dark chocolate"],
    cocktails: [
      {
        name: "Lynchburg Lemonade",
        ingredients: ["45ml Old No. 7", "15ml triple sec", "Lemonade", "Lemon"],
        method: "Build over ice in a tall glass; garnish with lemon.",
      },
      {
        name: "Tennessee Mule",
        ingredients: ["50ml Old No. 7", "Ginger beer", "Lime"],
        method: "Build in a copper mug over ice.",
      },
    ],
    images: img(`${B}/jd-old-no-7.png`),
    color: "#2a1810",
    accentColor: "#C9A962",
    labelColor: "#0a0805",
    bottleHeight: 1.1,
    isPremium: false,
    isImported: false,
    tags: ["tennessee", "iconic", "everyday"],
    nutrition: { calories: 98, carbs: 0, sugar: 0 },
  },
  {
    id: "jd2",
    slug: "gentleman-jack",
    name: "Gentleman Jack",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Tennessee Whiskey",
    description:
      "Twice charcoal mellowed Tennessee whiskey — once before aging, once after. Softer, more refined, with polished oak and gentle sweetness for neat pours and elevated cocktails.",
    brandStory:
      "Gentleman Jack takes Jack's charcoal mellowing process twice, creating a smoother expression for those who want Old No. 7 character with extra polish.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 40,
    volumeMl: 750,
    price: 38,
    rating: 4.7,
    reviewCount: 2104,
    tastingNotes: ["Oak", "Citrus", "Honey", "Soft spice"],
    foodPairings: ["Grilled chicken", "Pecan pie", "Mild cheddar"],
    cocktails: [
      {
        name: "Gentleman Jack On A Rock",
        ingredients: ["60ml Gentleman Jack", "Large ice cube"],
        method: "Pour over a single large cube; sip neat.",
      },
      {
        name: "Gentleman Jack Sour",
        ingredients: ["50ml Gentleman Jack", "25ml lemon", "15ml syrup", "Egg white optional"],
        method: "Shake hard, strain into coupe.",
      },
    ],
    images: img(`${B}/jd-gentleman-jack.png`),
    color: "#3d2818",
    accentColor: "#E4C878",
    labelColor: "#120e08",
    bottleHeight: 1.12,
    isPremium: true,
    isImported: false,
    tags: ["tennessee", "double-mellowed", "premium"],
  },
  {
    id: "jd3",
    slug: "jack-daniels-single-barrel-select",
    name: "Jack Daniel's Single Barrel Select",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Single Barrel",
    description:
      "Hand-selected single barrels from the upper reaches of the barrelhouse. Richer, bolder, and more complex than the core range — each bottle unique to its barrel.",
    brandStory:
      "Single Barrel Select is chosen by Jack Daniel's tasters for exceptional depth — proof that one barrel can tell its own story.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 47,
    volumeMl: 750,
    price: 55,
    rating: 4.8,
    reviewCount: 1560,
    tastingNotes: ["Caramel", "Baking spice", "Toasted oak", "Dark fruit"],
    foodPairings: ["Ribeye", "Blue cheese", "Cigar lounge"],
    cocktails: [
      {
        name: "Single Barrel Old Fashioned",
        ingredients: ["60ml Single Barrel Select", "5ml demerara", "2 dashes Angostura", "Orange peel"],
        method: "Stir over ice, strain over large cube, express peel.",
      },
      {
        name: "Single Barrel Manhattan",
        ingredients: ["60ml Single Barrel Select", "30ml sweet vermouth", "Dash bitters"],
        method: "Stir, strain into coupe, cherry garnish.",
      },
    ],
    images: img(`${B}/jd-single-barrel-select.png`),
    color: "#4a2c14",
    accentColor: "#C9A962",
    labelColor: "#0f0a05",
    bottleHeight: 1.15,
    isPremium: true,
    isImported: false,
    tags: ["single-barrel", "gift", "sipping"],
  },
  {
    id: "jd4",
    slug: "jack-daniels-single-barrel-barrel-proof",
    name: "Jack Daniel's Single Barrel Barrel Proof",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Barrel Proof",
    description:
      "Uncut, unfiltered single barrel whiskey at natural barrel strength. Intense oak, heat, and flavor for collectors and serious whiskey drinkers.",
    brandStory:
      "Barrel Proof captures Jack Daniel's whiskey exactly as it leaves the barrel — no dilution, maximum character.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 62.5,
    volumeMl: 750,
    price: 72,
    rating: 4.9,
    reviewCount: 890,
    tastingNotes: ["Bold oak", "Brown sugar", "Pepper", "Dark chocolate"],
    foodPairings: ["Alone", "Dark chocolate", "Smoked brisket"],
    cocktails: [
      {
        name: "Barrel Proof Neat",
        ingredients: ["45ml Barrel Proof", "Optional drop of water"],
        method: "Serve neat; add a drop of water to open aromas.",
      },
    ],
    images: img(`${B}/jd-single-barrel-proof.png`),
    color: "#5c3010",
    accentColor: "#E8C070",
    labelColor: "#100805",
    bottleHeight: 1.15,
    isPremium: true,
    isImported: false,
    tags: ["barrel-proof", "collector", "cask-strength"],
  },
  {
    id: "jd5",
    slug: "jack-daniels-bonded",
    name: "Jack Daniel's Bonded",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Bottled-in-Bond",
    description:
      "Bottled-in-bond Tennessee whiskey at 100 proof — aged at least four years, from one distilling season. Bold, structured, and built for classic cocktails.",
    brandStory:
      "Bonded follows the Bottled-in-Bond Act tradition: one season, one distiller, 100 proof — Jack Daniel's done by the book.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 50,
    volumeMl: 750,
    price: 42,
    rating: 4.7,
    reviewCount: 640,
    tastingNotes: ["Caramel", "Oak spice", "Banana", "Toasted grain"],
    foodPairings: ["Burger", "Maple bacon", "Pecan tart"],
    cocktails: [
      {
        name: "Bonded Boulevardier",
        ingredients: ["45ml Bonded", "30ml Campari", "30ml sweet vermouth"],
        method: "Stir, strain over ice, orange peel.",
      },
      {
        name: "Jack Bonded Whiskey Soda",
        ingredients: ["50ml Bonded", "Soda water", "Lemon"],
        method: "Build over ice in a highball.",
      },
    ],
    images: img(`${B}/jd-bonded.png`, `${B}/jd-bonded-series.jpg`),
    color: "#3a2210",
    accentColor: "#D4A574",
    labelColor: "#0c0804",
    bottleHeight: 1.1,
    isPremium: true,
    isImported: false,
    tags: ["bonded", "100-proof", "cocktail"],
  },
  {
    id: "jd6",
    slug: "jack-daniels-tennessee-honey",
    name: "Jack Daniel's Tennessee Honey",
    brand: "Jack Daniel's",
    category: "liqueur",
    subcategory: "Honey Whiskey",
    description:
      "Jack Daniel's Tennessee Whiskey blended with honey liqueur. Smooth, approachable sweetness with real whiskey backbone — built for lemonade, smash cocktails, and easy sipping.",
    brandStory:
      "Tennessee Honey pairs charcoal-mellowed whiskey with natural honey flavors for a smoother, more versatile Jack.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 35,
    volumeMl: 750,
    price: 26,
    rating: 4.5,
    reviewCount: 3200,
    tastingNotes: ["Honey", "Vanilla", "Oak", "Citrus"],
    foodPairings: ["Fried chicken", "Cornbread", "Lemon desserts"],
    cocktails: [
      {
        name: "Jack Honey Smash",
        ingredients: ["50ml Tennessee Honey", "Lemon", "Mint", "Ice"],
        method: "Muddle lemon and mint, shake with whiskey, dump into rocks glass.",
      },
      {
        name: "Tennessee Honey & Lemonade",
        ingredients: ["45ml Tennessee Honey", "Lemonade"],
        method: "Build over ice; garnish lemon wheel.",
      },
    ],
    images: img(`${B}/jd-tennessee-honey.png`),
    color: "#C4A035",
    accentColor: "#F5E6C8",
    labelColor: "#1a1205",
    bottleHeight: 1.08,
    isPremium: false,
    isImported: false,
    tags: ["honey", "flavored", "easy-drinking"],
  },
  {
    id: "jd7",
    slug: "jack-daniels-tennessee-apple",
    name: "Jack Daniel's Tennessee Apple",
    brand: "Jack Daniel's",
    category: "liqueur",
    subcategory: "Apple Whiskey",
    description:
      "Tennessee whiskey blended with crisp green apple liqueur. Fresh orchard fruit over Jack's oak — excellent in spritzes, ginger highballs, and lemonade.",
    brandStory:
      "Tennessee Apple brings orchard brightness to Lynchburg whiskey — a modern Jack expression for lighter occasions.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 35,
    volumeMl: 750,
    price: 26,
    rating: 4.4,
    reviewCount: 1890,
    tastingNotes: ["Green apple", "Citrus", "Oak", "Soft spice"],
    foodPairings: ["Pork chops", "Apple pie", "Cheddar"],
    cocktails: [
      {
        name: "Jack Apple Spritz",
        ingredients: ["45ml Tennessee Apple", "Prosecco", "Soda", "Apple slice"],
        method: "Build in a wine glass over ice.",
      },
      {
        name: "Tennessee Apple Ginger",
        ingredients: ["50ml Tennessee Apple", "Ginger ale", "Lime"],
        method: "Build over ice in a highball.",
      },
    ],
    images: img(`${B}/jd-tennessee-apple.png`),
    color: "#7a9e3a",
    accentColor: "#C9D98A",
    labelColor: "#101508",
    bottleHeight: 1.08,
    isPremium: false,
    isImported: false,
    tags: ["apple", "flavored", "spritz"],
  },
  {
    id: "jd8",
    slug: "jack-daniels-tennessee-fire",
    name: "Jack Daniel's Tennessee Fire",
    brand: "Jack Daniel's",
    category: "liqueur",
    subcategory: "Cinnamon Whiskey",
    description:
      "Bold like Jack with a warm cinnamon finish. Tennessee whiskey blended with spicy cinnamon liqueur — made for shots, cola mixes, and cold nights.",
    brandStory:
      "Tennessee Fire brings heat to the Jack Daniel's family — cinnamon spice over charcoal-mellowed whiskey.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 35,
    volumeMl: 750,
    price: 26,
    rating: 4.3,
    reviewCount: 1540,
    tastingNotes: ["Cinnamon", "Red hot spice", "Oak", "Sweet heat"],
    foodPairings: ["Chili", "BBQ", "Cinnamon desserts"],
    cocktails: [
      {
        name: "Jack Fire Shot",
        ingredients: ["45ml Tennessee Fire"],
        method: "Serve chilled as a shot.",
      },
    ],
    images: img(`${B}/jd-tennessee-fire.png`),
    color: "#8B1A1A",
    accentColor: "#E07040",
    labelColor: "#1a0805",
    bottleHeight: 1.08,
    isPremium: false,
    isImported: false,
    tags: ["cinnamon", "flavored", "shots"],
  },
  {
    id: "jd9",
    slug: "jack-daniels-tennessee-blackberry",
    name: "Jack Daniel's Tennessee Blackberry",
    brand: "Jack Daniel's",
    category: "liqueur",
    subcategory: "Blackberry Whiskey",
    description:
      "Tennessee whiskey blended with ripe blackberry liqueur. Juicy dark fruit over Jack's signature oak — built for lemonade, iced tea, and summer highballs.",
    brandStory:
      "Tennessee Blackberry expands Jack's flavored lineup with dark berry sweetness rooted in real whiskey character.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 35,
    volumeMl: 750,
    price: 27,
    rating: 4.4,
    reviewCount: 420,
    tastingNotes: ["Blackberry", "Jam", "Oak", "Citrus peel"],
    foodPairings: ["Berry tart", "Pork", "Iced tea"],
    cocktails: [
      {
        name: "Blackberry Lemonade",
        ingredients: ["45ml Tennessee Blackberry", "Lemonade", "Berries"],
        method: "Build over ice; garnish with blackberries.",
      },
    ],
    images: img(`${B}/jd-tennessee-blackberry.png`),
    color: "#4A0A2A",
    accentColor: "#C06090",
    labelColor: "#120510",
    bottleHeight: 1.08,
    isPremium: false,
    isImported: false,
    tags: ["blackberry", "flavored", "summer"],
  },
  {
    id: "jd10",
    slug: "jack-daniels-sinatra-select",
    name: "Jack Daniel's Sinatra Select",
    brand: "Jack Daniel's",
    category: "whiskey",
    subcategory: "Premium Select",
    description:
      "Crafted in tribute to Frank Sinatra, Jack's favorite whiskey drinker. Select barrels with specialized oak for bold oak character, caramel, and a luxurious finish.",
    brandStory:
      "Sinatra Select honors Ol' Blue Eyes with specially crafted oak and a presentation worthy of the Chairman of the Board.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 45,
    volumeMl: 1000,
    price: 168,
    rating: 4.8,
    reviewCount: 380,
    tastingNotes: ["Bold oak", "Caramel", "Smoke", "Dark fruit"],
    foodPairings: ["Steak", "Jazz club", "Dark chocolate"],
    cocktails: [
      {
        name: "Sinatra Neat",
        ingredients: ["60ml Sinatra Select"],
        method: "Serve neat in a rocks glass — Sinatra's way.",
      },
    ],
    images: img(`${B}/jd-sinatra-select.png`),
    color: "#1a1010",
    accentColor: "#4A7AB5",
    labelColor: "#080810",
    bottleHeight: 1.2,
    isPremium: true,
    isImported: false,
    tags: ["premium", "gift", "sinatra"],
  },
  {
    id: "jd11",
    slug: "winter-jack",
    name: "Winter Jack",
    brand: "Jack Daniel's",
    category: "liqueur",
    subcategory: "Seasonal",
    description:
      "A seasonal Tennessee whiskey cider liqueur — apple cider spice meets Jack Daniel's for cold-weather sipping and holiday punches.",
    brandStory:
      "Winter Jack is Jack Daniel's seasonal cider expression — orchard spice for the colder months.",
    origin: "Lynchburg, Tennessee",
    country: "USA",
    abv: 15,
    volumeMl: 750,
    price: 22,
    rating: 4.2,
    reviewCount: 510,
    tastingNotes: ["Apple cider", "Cinnamon", "Clove", "Whiskey"],
    foodPairings: ["Pumpkin pie", "Roast turkey", "Holiday cookies"],
    cocktails: [
      {
        name: "Warm Winter Jack",
        ingredients: ["90ml Winter Jack", "Optional cinnamon stick"],
        method: "Gently warm (do not boil) and serve in a mug.",
      },
    ],
    images: img(`${B}/jd-winter-jack.png`),
    color: "#8B4513",
    accentColor: "#E8A060",
    labelColor: "#1a1008",
    bottleHeight: 1.0,
    isPremium: false,
    isImported: false,
    tags: ["seasonal", "cider", "holiday"],
  },

  // ═══════════════════════════════════════════════════════════
  // The Glenlivet — Speyside single malt collection
  // ═══════════════════════════════════════════════════════════
  {
    id: "gl1",
    slug: "glenlivet-founders-reserve",
    name: "The Glenlivet Founder's Reserve",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "The gateway to The Glenlivet — first-fill American oak sweetness with creamy orchard fruit. Smooth, approachable Speyside single malt since George Smith's original vision.",
    brandStory:
      "The Glenlivet was the first licensed distillery in the Livet valley (1824). Founder's Reserve honors George Smith's original Speyside style.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 42,
    rating: 4.5,
    reviewCount: 2100,
    tastingNotes: ["Apple", "Cream", "Vanilla", "Citrus"],
    foodPairings: ["Mild cheese", "Apple tart", "Smoked salmon"],
    cocktails: [
      {
        name: "Founder's Highball",
        ingredients: ["50ml Founder's Reserve", "Soda", "Lemon"],
        method: "Build over ice in a tall glass.",
      },
    ],
    images: img(`${B}/glenlivet-founders-reserve.png`, `${B}/glenlivet-12-lifestyle.jpg`),
    color: "#C4A574",
    accentColor: "#E8D5A8",
    labelColor: "#1a1408",
    bottleHeight: 1.15,
    isPremium: false,
    isImported: true,
    tags: ["speyside", "entry", "single-malt"],
  },
  {
    id: "gl2",
    slug: "glenlivet-12",
    name: "The Glenlivet 12 Year Old Double Oak",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Matured in American and European oak for orchard fruit, vanilla, and soft spice. The benchmark Speyside single malt — balanced, elegant, and endlessly drinkable.",
    brandStory:
      "12 Year Old Double Oak is the world's introduction to The Glenlivet: fruit-forward, non-peated, and true to George Smith's Speyside original.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 52,
    compareAtPrice: 58,
    rating: 4.7,
    reviewCount: 5400,
    tastingNotes: ["Green apple", "Pear", "Vanilla", "Subtle spice"],
    foodPairings: ["Goat cheese", "Seafood", "Fruit desserts"],
    cocktails: [
      {
        name: "Glenlivet Old Fashioned",
        ingredients: ["60ml Glenlivet 12", "5ml demerara", "2 dashes bitters", "Orange"],
        method: "Stir, strain over large cube, express orange.",
      },
      {
        name: "Speyside Sour",
        ingredients: ["50ml Glenlivet 12", "25ml lemon", "15ml syrup"],
        method: "Shake and strain into coupe.",
      },
    ],
    images: img(`${B}/glenlivet-12.png`, `${B}/glenlivet-12-lifestyle.jpg`),
    color: "#B8956A",
    accentColor: "#F0E0C0",
    labelColor: "#141008",
    bottleHeight: 1.18,
    isPremium: true,
    isImported: true,
    tags: ["12-year", "double-oak", "iconic"],
  },
  {
    id: "gl3",
    slug: "glenlivet-14-cognac-cask",
    name: "The Glenlivet 14 Year Old Cognac Cask Selection",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Finished in hand-selected cognac casks for raisins, honey, and toasted oak with a silky mouthfeel. A distinctive Speyside expression with French cask elegance.",
    brandStory:
      "The Cognac Cask Selection continues The Glenlivet's tradition of pushing single malt forward with thoughtful finishing.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 78,
    rating: 4.7,
    reviewCount: 680,
    tastingNotes: ["Raisin", "Honey", "Cinnamon", "Silky oak"],
    foodPairings: ["Foie gras", "Dried fruit", "Dark chocolate"],
    cocktails: [
      {
        name: "Cognac Cask Manhattan",
        ingredients: ["60ml Glenlivet 14", "30ml sweet vermouth", "Dash bitters"],
        method: "Stir, strain into coupe.",
      },
    ],
    images: img(`${B}/glenlivet-14.png`, `${B}/glenlivet-14-lifestyle.jpg`),
    color: "#A07040",
    accentColor: "#D4A574",
    labelColor: "#120c06",
    bottleHeight: 1.18,
    isPremium: true,
    isImported: true,
    tags: ["14-year", "cognac-cask", "limited"],
  },
  {
    id: "gl4",
    slug: "glenlivet-15-french-oak",
    name: "The Glenlivet 15 Year Old French Oak Reserve",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Finished in French Limousin oak for creamy toffee, baked spice, and nutty depth. Richer and more spiced than the 12 — a refined Speyside pour.",
    brandStory:
      "French Oak Reserve shows how Limousin oak elevates The Glenlivet's fruit-forward spirit into something creamier and more complex.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 85,
    rating: 4.8,
    reviewCount: 1240,
    tastingNotes: ["Creamy toffee", "Almond", "Baked spice", "Oak"],
    foodPairings: ["Roast duck", "Almond cake", "Comté"],
    cocktails: [
      {
        name: "French Oak Neat",
        ingredients: ["50ml Glenlivet 15"],
        method: "Serve neat or with a drop of water.",
      },
    ],
    images: img(`${B}/glenlivet-15.png`, `${B}/glenlivet-15-lifestyle.jpg`),
    color: "#8B6914",
    accentColor: "#C9A962",
    labelColor: "#100c05",
    bottleHeight: 1.18,
    isPremium: true,
    isImported: true,
    tags: ["15-year", "french-oak", "gift"],
  },
  {
    id: "gl5",
    slug: "glenlivet-18",
    name: "The Glenlivet 18 Year Old Batch Reserve",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Masterfully aged with layers of dried fruit, baking spices, and oak richness. Smooth, complex, and lingering — Speyside luxury in every pour.",
    brandStory:
      "18 Year Old Batch Reserve is one of The Glenlivet's most celebrated age statements — patience rewarded with depth and elegance.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 145,
    rating: 4.9,
    reviewCount: 980,
    tastingNotes: ["Raisin", "Nutmeg", "Oak", "Citrus zest"],
    foodPairings: ["Aged cheddar", "Dark chocolate", "Venison"],
    cocktails: [],
    images: img(`${B}/glenlivet-18.png`, `${B}/glenlivet-luxury.png`),
    color: "#6B4423",
    accentColor: "#C9A962",
    labelColor: "#0e0a05",
    bottleHeight: 1.2,
    isPremium: true,
    isImported: true,
    tags: ["18-year", "batch-reserve", "collector"],
  },
  {
    id: "gl6",
    slug: "glenlivet-21",
    name: "The Glenlivet 21 Year Old Archive",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Archive Collection depth — dark fruit, chocolate, and warm oak after two decades of maturation. A Speyside statement for serious collectors.",
    brandStory:
      "21 Year Old Archive represents The Glenlivet at its most patient — long aging for layered, luxurious character.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 43,
    volumeMl: 750,
    price: 289,
    rating: 4.9,
    reviewCount: 210,
    tastingNotes: ["Dark fruit", "Chocolate", "Warm oak", "Spice"],
    foodPairings: ["Alone", "Dark chocolate", "Cigar"],
    cocktails: [],
    images: img(`${B}/glenlivet-21.png`, `${B}/glenlivet-signature.webp`),
    color: "#4A3020",
    accentColor: "#C9A962",
    labelColor: "#0a0805",
    bottleHeight: 1.22,
    isPremium: true,
    isImported: true,
    tags: ["21-year", "archive", "ultra-premium"],
  },
  {
    id: "gl7",
    slug: "glenlivet-25",
    name: "The Glenlivet 25 Year Old",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "A quarter-century of Speyside craft. Profound oak, dried fruit, and silk texture — among The Glenlivet's rarest widely released age statements.",
    brandStory:
      "25 Year Old is Speyside patience personified — selected from the finest stocks of The Glenlivet's warehouses.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 43,
    volumeMl: 750,
    price: 620,
    rating: 5.0,
    reviewCount: 86,
    tastingNotes: ["Dried apricot", "Oak polish", "Honey", "Leather"],
    foodPairings: ["Alone", "Meditation", "Fine chocolate"],
    cocktails: [],
    images: img(`${B}/glenlivet-25.png`, `${B}/glenlivet-luxury.png`),
    color: "#3D2818",
    accentColor: "#E4C878",
    labelColor: "#080605",
    bottleHeight: 1.22,
    isPremium: true,
    isImported: true,
    tags: ["25-year", "rare", "collector"],
  },
  {
    id: "gl8",
    slug: "glenlivet-caribbean-reserve",
    name: "The Glenlivet Caribbean Reserve",
    brand: "The Glenlivet",
    category: "scotch",
    subcategory: "Single Malt",
    description:
      "Selectively finished in Caribbean rum casks for tropical sweetness — banana, coconut, and warm spice over classic Glenlivet fruit. Made for highballs and warm evenings.",
    brandStory:
      "Caribbean Reserve brings rum-cask finishing to Speyside — The Glenlivet's invitation to drink single malt differently.",
    origin: "Speyside, Scotland",
    country: "Scotland",
    abv: 40,
    volumeMl: 750,
    price: 48,
    rating: 4.5,
    reviewCount: 1120,
    tastingNotes: ["Tropical fruit", "Coconut", "Vanilla", "Warm spice"],
    foodPairings: ["Grilled pineapple", "Coconut desserts", "Jerk chicken"],
    cocktails: [
      {
        name: "Caribbean Highball",
        ingredients: ["50ml Caribbean Reserve", "Coconut water", "Lime"],
        method: "Build over ice in a tall glass.",
      },
    ],
    images: img(`${B}/glenlivet-caribbean.png`),
    color: "#2A6B6B",
    accentColor: "#7EC8C8",
    labelColor: "#0a1515",
    bottleHeight: 1.15,
    isPremium: false,
    isImported: true,
    tags: ["rum-cask", "tropical", "highball"],
  },

  // ═══════════════════════════════════════════════════════════
  // Stillhouse — unbreakable stainless steel collection
  // ═══════════════════════════════════════════════════════════
  {
    id: "sh1",
    slug: "stillhouse-original-whiskey",
    name: "Stillhouse Original Whiskey",
    brand: "Stillhouse",
    category: "whiskey",
    subcategory: "Corn Whiskey",
    description:
      "Distilled in a traditional copper pot still, then charcoal filtered so the natural sweetness of the corn shines through. Packaged in 100% stainless steel — good times go where glass can't follow.",
    brandStory:
      "Stillhouse Spirits Co. bottles America's finest in shatterproof steel cans so whiskey can go camping, boating, and off-grid — welcome to Unbreakable Nation.",
    origin: "USA",
    country: "USA",
    abv: 40,
    volumeMl: 750,
    price: 32,
    rating: 4.4,
    reviewCount: 980,
    tastingNotes: ["Sweet corn", "Vanilla", "Charcoal", "Light oak"],
    foodPairings: ["Campfire food", "Burgers", "Root beer floats"],
    cocktails: [
      {
        name: "Stillhouse Root Beer",
        ingredients: ["45ml Original Whiskey", "90ml root beer"],
        method: "Combine over ice; stir and serve.",
      },
    ],
    images: img(`${B}/stillhouse-original.png`),
    color: "#C0C0C0",
    accentColor: "#8B1A1A",
    labelColor: "#1a1a1a",
    bottleHeight: 0.95,
    isPremium: false,
    isImported: false,
    tags: ["steel-can", "adventure", "corn"],
  },
  {
    id: "sh2",
    slug: "stillhouse-spiced-cherry",
    name: "Stillhouse Spiced Cherry Whiskey",
    brand: "Stillhouse",
    category: "liqueur",
    subcategory: "Flavored Whiskey",
    description:
      "Bold black cherry, a hint of vanilla, holiday spices, and award-winning whiskey. Perfectly sweet meets perfectly strong — in an unbreakable can.",
    brandStory:
      "Spiced Cherry is Stillhouse's invitation to take flavored whiskey anywhere glass shouldn't go.",
    origin: "USA",
    country: "USA",
    abv: 34.5,
    volumeMl: 750,
    price: 30,
    rating: 4.3,
    reviewCount: 640,
    tastingNotes: ["Black cherry", "Vanilla", "Holiday spice", "Whiskey"],
    foodPairings: ["BBQ", "Chocolate", "Cola"],
    cocktails: [
      {
        name: "Spiced Cherry Cola",
        ingredients: ["45ml Spiced Cherry", "90ml cola"],
        method: "Build over ice; stir.",
      },
    ],
    images: img(`${B}/stillhouse-spiced-cherry.png`),
    color: "#6B0F2A",
    accentColor: "#C04060",
    labelColor: "#1a0810",
    bottleHeight: 0.95,
    isPremium: false,
    isImported: false,
    tags: ["cherry", "steel-can", "flavored"],
  },
  {
    id: "sh3",
    slug: "stillhouse-peach-tea",
    name: "Stillhouse Peach Tea Whiskey",
    brand: "Stillhouse",
    category: "liqueur",
    subcategory: "Flavored Whiskey",
    description:
      "Southern sweet peach tea blended with 100% clear corn whiskey — the smoothest drink you'll ever take from an oil can.",
    brandStory:
      "Peach Tea Whiskey is Stillhouse's southern porch classic, armored in stainless steel for every adventure.",
    origin: "USA",
    country: "USA",
    abv: 34.5,
    volumeMl: 750,
    price: 30,
    rating: 4.5,
    reviewCount: 720,
    tastingNotes: ["Peach", "Sweet tea", "Corn whiskey", "Honey"],
    foodPairings: ["Fried chicken", "Picnic food", "Iced tea"],
    cocktails: [
      {
        name: "Peach Tea Cooler",
        ingredients: ["45ml Peach Tea Whiskey", "Iced tea", "Lemon"],
        method: "Build over ice in a tall glass.",
      },
    ],
    images: img(`${B}/stillhouse-peach-tea.png`),
    color: "#E8A040",
    accentColor: "#F5D080",
    labelColor: "#1a1205",
    bottleHeight: 0.95,
    isPremium: false,
    isImported: false,
    tags: ["peach", "tea", "steel-can"],
  },
  {
    id: "sh4",
    slug: "stillhouse-apple-crisp",
    name: "Stillhouse Apple Crisp Whiskey",
    brand: "Stillhouse",
    category: "liqueur",
    subcategory: "Flavored Whiskey",
    description:
      "Baked apples, cinnamon, oats, brown sugar, ginger, and nutmeg over 100% clear corn whiskey. Best served wherever you happen to be.",
    brandStory:
      "Apple Crisp brings bakery warmth to Stillhouse's unbreakable lineup — autumn in a steel can.",
    origin: "USA",
    country: "USA",
    abv: 34.5,
    volumeMl: 750,
    price: 30,
    rating: 4.4,
    reviewCount: 580,
    tastingNotes: ["Baked apple", "Cinnamon", "Brown sugar", "Ginger"],
    foodPairings: ["Apple pie", "Pork", "Camping breakfast"],
    cocktails: [
      {
        name: "Apple Crisp Ginger",
        ingredients: ["45ml Apple Crisp", "90ml ginger ale"],
        method: "Build over ice; stir.",
      },
    ],
    images: img(`${B}/stillhouse-apple-crisp.png`),
    color: "#C45C20",
    accentColor: "#E8A060",
    labelColor: "#1a1008",
    bottleHeight: 0.95,
    isPremium: false,
    isImported: false,
    tags: ["apple", "spice", "steel-can"],
  },
  {
    id: "sh5",
    slug: "stillhouse-black-bourbon",
    name: "Stillhouse Black Bourbon",
    brand: "Stillhouse",
    category: "bourbon",
    subcategory: "Coffee Bourbon",
    description:
      "Barrel-aged bourbon with roasted coffee bean aromatics and soft caramel. Remarkably smooth and balanced — then thank us.",
    brandStory:
      "Black Bourbon turns coffee-roasted boldness into a soft, aromatic bourbon experience in shatterproof steel.",
    origin: "USA",
    country: "USA",
    abv: 40,
    volumeMl: 750,
    price: 36,
    rating: 4.6,
    reviewCount: 810,
    tastingNotes: ["Roasted coffee", "Caramel", "Bourbon oak", "Cocoa"],
    foodPairings: ["Espresso", "Dark chocolate", "Steak"],
    cocktails: [
      {
        name: "Black Bourbon Coffee",
        ingredients: ["45ml Black Bourbon", "Hot coffee", "Optional cream"],
        method: "Add whiskey to coffee; sweeten to taste.",
      },
    ],
    images: img(`${B}/stillhouse-black-bourbon.png`),
    color: "#1a1008",
    accentColor: "#8B6914",
    labelColor: "#0a0805",
    bottleHeight: 0.95,
    isPremium: true,
    isImported: false,
    tags: ["bourbon", "coffee", "steel-can"],
  },
  {
    id: "sh6",
    slug: "stillhouse-classic-vodka",
    name: "Stillhouse Classic Vodka",
    brand: "Stillhouse",
    category: "vodka",
    subcategory: "Corn Vodka",
    description:
      "All-natural, gluten-free vodka distilled from 100% estate-grown corn with limestone water, filtered through sugar maple charcoal. The metal can chills fast and mixes with nearly anything.",
    brandStory:
      "Classic Vodka proves Stillhouse's unbreakable philosophy works beyond whiskey — pure corn spirit in adventure-ready steel.",
    origin: "USA",
    country: "USA",
    abv: 40,
    volumeMl: 750,
    price: 28,
    rating: 4.3,
    reviewCount: 450,
    tastingNotes: ["Clean corn", "Soft sweetness", "Neutral", "Charcoal"],
    foodPairings: ["Oysters", "Citrus", "Caviar"],
    cocktails: [
      {
        name: "Stillhouse Soda",
        ingredients: ["50ml Classic Vodka", "Soda", "Lime"],
        method: "Build over ice in a highball.",
      },
    ],
    images: img(`${B}/stillhouse-classic-vodka.png`),
    color: "#E8E8E8",
    accentColor: "#A0C4E8",
    labelColor: "#111111",
    bottleHeight: 0.95,
    isPremium: false,
    isImported: false,
    tags: ["vodka", "gluten-free", "steel-can"],
  },
];

// Prefer procedural mesh when a dedicated GLB is not present yet
for (const p of products) {
  p.glbUrl = `/models/bottles/${p.slug}.glb`;
}

import { runtimeData } from "@/lib/runtime-data-bridge";

export function getAllProducts() {
  const runtime = runtimeData().getRuntimeProducts();
  const custom = getCustomProducts();
  const runtimeIds = new Set(runtime.map((p) => p.id));
  return [...runtime, ...custom.filter((p) => !runtimeIds.has(p.id))];
}

export function getProductBySlug(slug: string) {
  return (
    runtimeData().getRuntimeProducts().find((p) => p.slug === slug) ??
    getCustomProductBySlug(slug)
  );
}

export function getProductById(id: string) {
  return (
    runtimeData().getRuntimeProducts().find((p) => p.id === id) ??
    getCustomProductById(id)
  );
}

export function getProductsByCategory(category: string) {
  return runtimeData().getRuntimeProductsByCategory(category);
}

export function getSimilarProducts(product: Product, limit = 4) {
  return runtimeData().getRuntimeSimilarProducts(product, limit);
}

export function getProductsByBrand(brand: string) {
  return getAllProducts().filter(
    (p) => p.brand.toLowerCase() === brand.toLowerCase(),
  );
}

export function isCatalogProduct(id: string) {
  return runtimeData().isCatalogProductId(id);
}
