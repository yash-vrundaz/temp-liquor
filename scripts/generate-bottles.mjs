/**
 * Generates liquor bottle GLB assets for AR (model-viewer).
 * Run: node scripts/generate-bottles.mjs
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Minimal FileReader polyfill for Node (GLTFExporter textures path)
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onerror = null;
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        const b64 = Buffer.from(buf).toString("base64");
        const type = blob.type || "application/octet-stream";
        this.result = `data:${type};base64,${b64}`;
        this.onload?.({ target: this });
      }).catch((e) => this.onerror?.(e));
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onload?.({ target: this });
      }).catch((e) => this.onerror?.(e));
    }
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "models", "bottles");
mkdirSync(outDir, { recursive: true });

const bottles = [
  { id: "macallan-18-sherry-oak", color: "#8B4513", accent: "#C9A962", label: "#1a1208", h: 1.15, brand: "MACALLAN", name: "18 SHERRY OAK" },
  { id: "glenfiddich-21-reserva", color: "#A0522D", accent: "#DAA520", label: "#0f0a05", h: 1.1, brand: "GLENFIDDICH", name: "21 RESERVA" },
  { id: "johnnie-walker-blue", color: "#1a2744", accent: "#C9A962", label: "#0a1020", h: 1.2, brand: "JOHNNIE WALKER", name: "BLUE LABEL" },
  { id: "woodford-reserve", color: "#6B3E26", accent: "#D4A574", label: "#2a1810", h: 1.05, brand: "WOODFORD", name: "RESERVE" },
  { id: "belvedere-pure", color: "#E8E8E8", accent: "#C0C0C0", label: "#111111", h: 1.25, brand: "BELVEDERE", name: "PURE", clear: true },
  { id: "hendricks-gin", color: "#1C3A3A", accent: "#98D8C8", label: "#0a1515", h: 0.95, brand: "HENDRICK'S", name: "GIN" },
  { id: "diplomatico-reserva", color: "#3D1A08", accent: "#C9A962", label: "#1a0a05", h: 1.0, brand: "DIPLOMATICO", name: "RESERVA" },
  { id: "patron-anejo", color: "#C4A35A", accent: "#F5E6C8", label: "#2a2010", h: 1.15, brand: "PATRON", name: "ANEJO" },
  { id: "hennessy-xo", color: "#5C0A0A", accent: "#C9A962", label: "#1a0505", h: 1.1, brand: "HENNESSY", name: "X.O" },
  { id: "dom-perignon-2013", color: "#1a1a1a", accent: "#F5E6C8", label: "#0a0a0a", h: 1.3, brand: "DOM PERIGNON", name: "2013", clear: true },
  { id: "opus-one-2019", color: "#2C1810", accent: "#C9A962", label: "#0f0805", h: 1.2, brand: "OPUS ONE", name: "2019" },
  { id: "guinness-draught-4pk", color: "#1a1a1a", accent: "#C9A962", label: "#0a0a0a", h: 0.7, brand: "GUINNESS", name: "DRAUGHT" },
  { id: "grand-marnier-cuvee", color: "#8B0000", accent: "#C9A962", label: "#1a0505", h: 1.05, brand: "GRAND MARNIER", name: "CUVEE" },
  { id: "remy-martin-louis-xiii", color: "#C9A962", accent: "#F5E6C8", label: "#2a2010", h: 1.0, brand: "LOUIS XIII", name: "REMY MARTIN" },
  { id: "grey-goose-vx", color: "#F0F0F0", accent: "#C9A962", label: "#1a1a1a", h: 1.2, brand: "GREY GOOSE", name: "VX", clear: true },
  { id: "monkey-47", color: "#1a3010", accent: "#8FBC8F", label: "#0a1508", h: 0.85, brand: "MONKEY 47", name: "DRY GIN" },
];

function buildBottle(cfg) {
  const group = new THREE.Group();
  group.name = cfg.id;
  const h = cfg.h;
  const clear = cfg.clear;
  const glassColor = new THREE.Color(clear ? "#e8f0f4" : cfg.color);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    roughness: 0.05,
    metalness: 0,
    transmission: clear ? 0.85 : 0.55,
    thickness: 1.2,
    ior: 1.5,
    transparent: true,
    opacity: 1,
  });

  const liquidMat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: 0.3,
    metalness: 0.1,
    transparent: true,
    opacity: clear ? 0.35 : 0.9,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.21, h * 0.58, 48),
    glassMat,
  );
  body.position.y = h * 0.32;
  body.name = "body";
  group.add(body);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.18, h * 0.46, 32),
    liquidMat,
  );
  liquid.position.y = h * 0.27;
  group.add(liquid);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.17, h * 0.12, 32),
    glassMat.clone(),
  );
  shoulder.position.y = h * 0.64;
  group.add(shoulder);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.09, h * 0.2, 24),
    glassMat.clone(),
  );
  neck.position.y = h * 0.78;
  group.add(neck);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.075, 0.1, 24),
    new THREE.MeshStandardMaterial({
      color: cfg.accent,
      metalness: 0.9,
      roughness: 0.2,
    }),
  );
  cap.position.y = h * 0.9;
  group.add(cap);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.04, 32),
    glassMat.clone(),
  );
  base.position.y = 0.02;
  group.add(base);

  // Label as flat card (canvas needs jsdom in node - use solid color plane instead in node)
  const labelMat = new THREE.MeshStandardMaterial({
    color: cfg.label,
    roughness: 0.55,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), labelMat);
  label.position.set(0, h * 0.35, 0.165);
  group.add(label);

  // Accent stripe on label
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.03),
    new THREE.MeshStandardMaterial({ color: cfg.accent, metalness: 0.7, roughness: 0.3 }),
  );
  stripe.position.set(0, h * 0.48, 0.168);
  group.add(stripe);

  group.updateMatrixWorld(true);
  return group;
}

function exportGLB(object) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      object,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(Buffer.from(result));
        } else {
          resolve(Buffer.from(JSON.stringify(result)));
        }
      },
      (err) => reject(err),
      { binary: true },
    );
  });
}

// Polyfill minimal canvas for three if needed — we avoid canvas textures in node
async function main() {
  console.log("Generating bottle GLBs…");
  for (const cfg of bottles) {
    const bottle = buildBottle(cfg);
    // Center for AR placement (sit on ground)
    const box = new THREE.Box3().setFromObject(bottle);
    const size = box.getSize(new THREE.Vector3());
    // Scale to ~0.25m tall for table AR
    const targetH = 0.28;
    const s = targetH / Math.max(size.y, 0.001);
    bottle.scale.setScalar(s);
    bottle.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(bottle);
    bottle.position.y -= box2.min.y;

    const buf = await exportGLB(bottle);
    const path = join(outDir, `${cfg.id}.glb`);
    writeFileSync(path, buf);
    console.log("  wrote", path, `(${(buf.length / 1024).toFixed(1)} KB)`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
