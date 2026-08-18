import * as THREE from "three";

function canvasTex(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 512,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function makeWalnutTexture() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#3d2918";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 55; i++) {
      const y = (i / 55) * h;
      ctx.strokeStyle = `rgba(${20 + (i % 6) * 6},${12 + (i % 4) * 4},8,${0.2 + (i % 4) * 0.06})`;
      ctx.lineWidth = 1.5 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 6) {
        ctx.lineTo(x, y + Math.sin(x * 0.035 + i * 0.7) * 3.5);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(255,220,160,${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
  });
}

export function makeMarbleTexture() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#e8e2d8";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = `rgba(120,110,100,${0.15 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let s = 0; s < 12; s++) {
        x += (Math.random() - 0.5) * 80;
        y += (Math.random() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(180,160,140,${0.08 + Math.random() * 0.12})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.quadraticCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
  }, 1024, 1024);
}

export function makeFloorTexture() {
  return canvasTex((ctx, w, h) => {
    const plank = 32;
    for (let y = 0; y < h; y += plank) {
      for (let x = 0; x < w; x += 128) {
        const shade = 48 + ((x + y) % 7) * 4;
        ctx.fillStyle = `rgb(${shade + 20},${shade - 5},${shade - 18})`;
        ctx.fillRect(x, y, 128, plank - 1);
        ctx.strokeStyle = "rgba(20,12,8,0.35)";
        ctx.strokeRect(x, y, 128, plank - 1);
      }
    }
  }, 1024, 1024);
}

export function makeBrandWallTexture() {
  return canvasTex((ctx, w, h) => {
    ctx.fillStyle = "#12100c";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "#8a7340");
    g.addColorStop(0.5, "#e4c878");
    g.addColorStop(1, "#8a7340");
    ctx.strokeStyle = g;
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.fillStyle = "#c9a962";
    ctx.font = "600 32px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("SAM'S DISCOUNT LIQUOR", w / 2, h * 0.42);
    ctx.fillStyle = "#f3ead7";
    ctx.font = "18px sans-serif";
    ctx.fillText("NEW YORK  ·  EST. 2012", w / 2, h * 0.55);
    ctx.fillText("PRIVATE CLIENT  ·  RARE ALLOCATIONS", w / 2, h * 0.65);
  }, 1024, 512);
}

export function makeAdDisplayTexture(title: string, subtitle: string) {
  return canvasTex((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#1a1410");
    g.addColorStop(1, "#0a0806");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c9a962";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#c9a962";
    ctx.font = "600 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(title, w / 2, h * 0.42);
    ctx.fillStyle = "#d8cfc0";
    ctx.font = "16px sans-serif";
    ctx.fillText(subtitle, w / 2, h * 0.58);
  }, 768, 432);
}
