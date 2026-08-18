# Virtual showroom — real 3D bottles

Inspired by **ByondXR (Bacardi)** and **Obsess**: walkable store, reflective floors, dense glass shelves, island displays, studio lightformers.

## What you get

| Surface | Asset |
|---------|--------|
| `/virtual-store` | Reflective floor, WASD walk, GLB bottles, islands |
| Product page | **3D Bottle** tab (studio-lit GLB) |
| `/ar/[slug]` | Interactive 3D + phone AR |

## Regenerating GLBs

```bash
npm run generate:bottles
```

Writes `/public/models/bottles/{slug}.glb` — lathe glass body, liquid, foil cap.

## Production upgrade

Replace any file in `public/models/bottles/` with a commissioned branded GLB.
`product.glbUrl` already points there — no code change needed.
