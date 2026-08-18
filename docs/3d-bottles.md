# How premium liquor sites ship “real” 3D

Research summary used for Sam's Discount Liquor:

## Industry pattern

1. **Shopify / brand sites** — upload photographer-grade **GLB + USDZ** into `model-viewer` (rotate, zoom, “View in your space”).
2. **Glenfiddich / Woodford / Tullibardine** — hire CGI studios for web-ready PBR bottle models (labels, glass, foil), then Three.js / model-viewer.
3. **Catalog pages** — still lead with **real photography**; 3D is an enhancer, not a replacement.

## What we implemented

| Layer | Approach |
|-------|----------|
| Hero / store / PDP preview | Lathe silhouettes per category (scotch, square bourbon, wine, champagne…) + PBR glass + foil labels |
| AR | Product GLBs in `/public/models/bottles/*.glb` via `model-viewer` |
| 2D cards | Unsplash product photography (not placehold.co) |
| Lighting | Studio HDR + key/fill/rim + contact shadows + ACES |

## Regenerating bottle GLBs

```bash
npm run generate:bottles
```

## Going further (production)

Swap in commissioned branded GLBs (CGTrader / studio) per SKU — same `product.glbUrl` field. No code change required.
