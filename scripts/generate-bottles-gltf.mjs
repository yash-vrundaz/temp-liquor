/**
 * Generate higher-detail liquor bottle GLBs (lathe glass + liquid + foil).
 * Run: npm run generate:bottles
 */
import { Document, NodeIO } from "@gltf-transform/core";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "models", "bottles");
mkdirSync(outDir, { recursive: true });

const PROFILES = {
  scotch: [
    [0.22, 0],
    [0.225, 0.02],
    [0.222, 0.08],
    [0.21, 0.42],
    [0.2, 0.52],
    [0.15, 0.6],
    [0.09, 0.68],
    [0.075, 0.78],
    [0.072, 0.9],
    [0.08, 0.95],
    [0.09, 0.99],
  ],
  vodka: [
    [0.175, 0],
    [0.18, 0.02],
    [0.178, 0.5],
    [0.14, 0.62],
    [0.08, 0.7],
    [0.068, 0.85],
    [0.065, 0.96],
    [0.08, 1],
  ],
  gin: [
    [0.2, 0],
    [0.205, 0.03],
    [0.19, 0.4],
    [0.16, 0.5],
    [0.1, 0.6],
    [0.072, 0.72],
    [0.068, 0.92],
    [0.085, 0.98],
  ],
  rum: [
    [0.21, 0],
    [0.215, 0.04],
    [0.2, 0.38],
    [0.18, 0.48],
    [0.11, 0.58],
    [0.078, 0.7],
    [0.07, 0.92],
    [0.085, 0.98],
  ],
  wine: [
    [0.16, 0],
    [0.165, 0.03],
    [0.17, 0.32],
    [0.15, 0.48],
    [0.08, 0.6],
    [0.055, 0.72],
    [0.052, 0.95],
    [0.07, 1],
  ],
  champagne: [
    [0.155, 0],
    [0.16, 0.03],
    [0.165, 0.38],
    [0.12, 0.52],
    [0.065, 0.68],
    [0.055, 0.9],
    [0.07, 0.98],
  ],
  cognac: [
    [0.23, 0],
    [0.245, 0.05],
    [0.23, 0.32],
    [0.15, 0.52],
    [0.085, 0.66],
    [0.07, 0.88],
    [0.09, 0.97],
  ],
  beer: [
    [0.14, 0],
    [0.145, 0.02],
    [0.14, 0.52],
    [0.105, 0.64],
    [0.068, 0.74],
    [0.06, 0.92],
    [0.07, 0.98],
  ],
  tequila: [
    [0.19, 0],
    [0.2, 0.05],
    [0.22, 0.32],
    [0.18, 0.48],
    [0.1, 0.6],
    [0.072, 0.88],
    [0.09, 0.97],
  ],
  liqueur: [
    [0.18, 0],
    [0.185, 0.03],
    [0.17, 0.42],
    [0.11, 0.56],
    [0.072, 0.7],
    [0.065, 0.92],
    [0.08, 0.98],
  ],
  square: null,
};

const bottles = [
  { id: "macallan-18-sherry-oak", color: [0.545, 0.271, 0.075], accent: [0.788, 0.663, 0.384], profile: "scotch", h: 1.15 },
  { id: "glenfiddich-21-reserva", color: [0.627, 0.322, 0.176], accent: [0.855, 0.647, 0.125], profile: "scotch", h: 1.1 },
  { id: "johnnie-walker-blue", color: [0.102, 0.153, 0.267], accent: [0.788, 0.663, 0.384], profile: "scotch", h: 1.2 },
  { id: "woodford-reserve", color: [0.42, 0.243, 0.149], accent: [0.831, 0.647, 0.455], profile: "square", h: 1.05 },
  { id: "belvedere-pure", color: [0.91, 0.91, 0.91], accent: [0.75, 0.75, 0.75], profile: "vodka", h: 1.25, clear: true },
  { id: "hendricks-gin", color: [0.11, 0.227, 0.227], accent: [0.596, 0.847, 0.784], profile: "gin", h: 0.95 },
  { id: "diplomatico-reserva", color: [0.239, 0.102, 0.031], accent: [0.788, 0.663, 0.384], profile: "rum", h: 1.0 },
  { id: "patron-anejo", color: [0.769, 0.639, 0.353], accent: [0.961, 0.902, 0.784], profile: "tequila", h: 1.15 },
  { id: "hennessy-xo", color: [0.361, 0.039, 0.039], accent: [0.788, 0.663, 0.384], profile: "cognac", h: 1.1 },
  { id: "dom-perignon-2013", color: [0.12, 0.12, 0.12], accent: [0.961, 0.902, 0.784], profile: "champagne", h: 1.3, clear: true },
  { id: "opus-one-2019", color: [0.173, 0.094, 0.063], accent: [0.788, 0.663, 0.384], profile: "wine", h: 1.2 },
  { id: "guinness-draught-4pk", color: [0.1, 0.1, 0.1], accent: [0.788, 0.663, 0.384], profile: "beer", h: 0.75 },
  { id: "grand-marnier-cuvee", color: [0.545, 0, 0], accent: [0.788, 0.663, 0.384], profile: "liqueur", h: 1.05 },
  { id: "remy-martin-louis-xiii", color: [0.788, 0.663, 0.384], accent: [0.961, 0.902, 0.784], profile: "cognac", h: 1.0 },
  { id: "grey-goose-vx", color: [0.94, 0.94, 0.94], accent: [0.788, 0.663, 0.384], profile: "vodka", h: 1.2, clear: true },
  { id: "monkey-47", color: [0.102, 0.188, 0.063], accent: [0.561, 0.737, 0.561], profile: "gin", h: 0.85 },
];

function lathe(profile, heightScale, radial = 64) {
  const rings = profile.length;
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i < rings; i++) {
    const [r, y] = profile[i];
    const yy = y * heightScale;
    const prev = profile[Math.max(0, i - 1)];
    const next = profile[Math.min(rings - 1, i + 1)];
    const dy = (next[1] - prev[1]) * heightScale || 0.01;
    const dr = next[0] - prev[0];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, yy, z);
      // approximate smooth normal from profile slope
      const nx = Math.cos(a);
      const nz = Math.sin(a);
      const ny = -dr / Math.hypot(dr, dy || 0.001);
      const len = Math.hypot(nx, ny, nz) || 1;
      normals.push(nx / len, ny / len, nz / len);
    }
  }

  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + ((j + 1) % radial);
      const d = (i + 1) * radial + j;
      indices.push(a, b, c, a, c, d);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

function box(w, h, d) {
  const hw = w / 2,
    hh = h / 2,
    hd = d / 2;
  const positions = new Float32Array([
    -hw, -hh, hd, hw, -hh, hd, hw, hh, hd, -hw, hh, hd, -hw, -hh, -hd, -hw, hh, -hd, hw, hh, -hd, hw, -hh, -hd, -hw, hh,
    -hd, -hw, hh, hd, hw, hh, hd, hw, hh, -hd, -hw, -hh, -hd, hw, -hh, -hd, hw, -hh, hd, -hw, -hh, hd, hw, -hh, -hd, hw,
    hh, -hd, hw, hh, hd, hw, -hh, hd, -hw, -hh, -hd, -hw, -hh, hd, -hw, hh, hd, -hw, hh, -hd,
  ]);
  const normals = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  ]);
  const indices = new Uint32Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22,
    20, 22, 23,
  ]);
  return { positions, normals, indices };
}

function addMesh(document, name, geo, color, metallic = 0, roughness = 0.08, alpha = 1) {
  let buffer = document.getRoot().listBuffers()[0];
  if (!buffer) buffer = document.createBuffer();

  const pos = document.createAccessor(`${name}_pos`).setType("VEC3").setArray(geo.positions).setBuffer(buffer);
  const nor = document.createAccessor(`${name}_nor`).setType("VEC3").setArray(geo.normals).setBuffer(buffer);
  const idx = document.createAccessor(`${name}_idx`).setType("SCALAR").setArray(geo.indices).setBuffer(buffer);

  const prim = document.createPrimitive().setAttribute("POSITION", pos).setAttribute("NORMAL", nor).setIndices(idx);
  const mat = document
    .createMaterial(name)
    .setBaseColorFactor([color[0], color[1], color[2], alpha])
    .setMetallicFactor(metallic)
    .setRoughnessFactor(roughness);
  if (alpha < 1) mat.setAlphaMode("BLEND");
  prim.setMaterial(mat);
  return document.createMesh(name).addPrimitive(prim);
}

async function main() {
  console.log("Building high-detail 3D bottle GLBs…");
  const io = new NodeIO();

  for (const b of bottles) {
    const document = new Document();
    document.createBuffer();
    // Store-scale bottles ~1m tall in meters-ish units used by R3F
    const s = 1;
    const glass = b.clear ? [0.92, 0.95, 0.97] : b.color;
    const alpha = b.clear ? 0.55 : 0.88;

    const root = document.createNode("bottle");

    if (b.profile === "square") {
      const body = addMesh(document, "body", box(0.36, b.h * 0.55, 0.36), glass, 0, 0.05, alpha);
      const liquid = addMesh(document, "liquid", box(0.3, b.h * 0.45, 0.3), b.color, 0.05, 0.28, b.clear ? 0.35 : 0.95);
      const neck = addMesh(document, "neck", lathe([[0.1, 0], [0.07, 0.5], [0.065, 1]], b.h * 0.22, 48), glass, 0, 0.05, alpha);
      const cap = addMesh(document, "cap", lathe([[0.075, 0], [0.078, 0.5], [0.08, 1]], 0.1, 32), b.accent, 0.92, 0.16, 1);
      root.addChild(document.createNode("body").setMesh(body).setTranslation([0, b.h * 0.28 * s, 0]).setScale([s, s, s]));
      root.addChild(document.createNode("liquid").setMesh(liquid).setTranslation([0, b.h * 0.26 * s, 0]).setScale([s, s, s]));
      root.addChild(document.createNode("neck").setMesh(neck).setTranslation([0, b.h * 0.72 * s, 0]).setScale([s, s, s]));
      root.addChild(document.createNode("cap").setMesh(cap).setTranslation([0, b.h * 0.93 * s, 0]).setScale([s, s, s]));
    } else {
      const profile = PROFILES[b.profile];
      const body = addMesh(document, "body", lathe(profile, b.h, 72), glass, 0, 0.04, alpha);
      const liquidProfile = profile.filter(([, y]) => y > 0.04 && y < 0.7).map(([r, y]) => [r * 0.82, y]);
      const liquid = addMesh(
        document,
        "liquid",
        lathe(liquidProfile.length > 2 ? liquidProfile : [[0.14, 0], [0.12, 1]], b.h * 0.9, 48),
        b.color,
        0.05,
        0.25,
        b.clear ? 0.35 : 0.95,
      );
      const cap = addMesh(document, "cap", lathe([[0.075, 0], [0.078, 0.6], [0.08, 1]], 0.1, 32), b.accent, 0.92, 0.16, 1);
      root.addChild(document.createNode("body").setMesh(body).setScale([s, s, s]));
      root.addChild(document.createNode("liquid").setMesh(liquid).setScale([s, s, s]));
      root.addChild(document.createNode("cap").setMesh(cap).setTranslation([0, b.h * 0.93 * s, 0]).setScale([s, s, s]));
    }

    const scene = document.createScene(b.id);
    scene.addChild(root);
    await io.write(join(outDir, `${b.id}.glb`), document);
    console.log("  wrote", b.id + ".glb");
  }
  console.log("Done — real 3D GLBs ready for /virtual-store and AR.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
