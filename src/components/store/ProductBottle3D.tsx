"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useLayoutEffect,
  useMemo,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { Product } from "@/types";
import { BottleMesh } from "./BottleMesh";

class BottleErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Bottle GLB failed, using mesh fallback:", error.message, info);
  }
  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function enhanceMaterials(root: THREE.Object3D, product: Product, lite: boolean) {
  const isClear = ["vodka", "gin", "champagne"].includes(product.category);
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const name = (mesh.name || mesh.parent?.name || "").toLowerCase();

    if (name.includes("cap") || name.includes("foil") || name.includes("cork")) {
      mesh.material = new THREE.MeshStandardMaterial({
        color: product.accentColor,
        metalness: 0.92,
        roughness: 0.18,
        envMapIntensity: 1.6,
      });
      return;
    }

    if (name.includes("liquid")) {
      mesh.material = new THREE.MeshStandardMaterial({
        color: product.color,
        roughness: 0.25,
        metalness: 0.08,
        transparent: true,
        opacity: isClear ? 0.4 : 0.94,
        emissive: product.color,
        emissiveIntensity: 0.1,
        envMapIntensity: 0.9,
      });
      return;
    }

    if (lite) {
      mesh.material = new THREE.MeshStandardMaterial({
        color: isClear ? "#d8e4ec" : product.color,
        roughness: 0.18,
        metalness: 0.12,
        transparent: true,
        opacity: isClear ? 0.78 : 0.92,
        envMapIntensity: 1.4,
      });
      return;
    }

    mesh.material = new THREE.MeshPhysicalMaterial({
      color: isClear ? "#f4f8fb" : product.color,
      roughness: 0.04,
      metalness: 0,
      transmission: isClear ? 0.9 : 0.7,
      thickness: 1.3,
      ior: 1.5,
      transparent: true,
      opacity: 1,
      envMapIntensity: 2.2,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      attenuationColor: isClear ? "#ffffff" : product.color,
      attenuationDistance: isClear ? 2.5 : 0.65,
    });
  });
}

function makeLabelTexture(product: Product) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = product.labelColor;
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = product.accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, 464, 592);
  ctx.fillStyle = product.accentColor;
  ctx.font = "600 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(product.brand.toUpperCase().slice(0, 18), 256, 160);
  ctx.fillStyle = "#f3ead7";
  ctx.font = "500 26px Georgia, serif";
  const short = product.name.length > 22 ? `${product.name.slice(0, 20)}…` : product.name;
  ctx.fillText(short, 256, 320);
  ctx.fillStyle = product.accentColor;
  ctx.font = "14px sans-serif";
  ctx.fillText(`${product.abv}% · ${product.volumeMl}ml`, 256, 520);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function GlbBottle({
  product,
  url,
  selected,
  onSelect,
  scale = 1,
  lite = false,
}: {
  product: Product;
  url: string;
  selected?: boolean;
  onSelect?: () => void;
  scale?: number;
  lite?: boolean;
}) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const target = useRef(1);
  const labelMap = useMemo(() => makeLabelTexture(product), [product]);

  const clone = useMemo(() => {
    const c = scene.clone(true);
    enhanceMaterials(c, product, lite);
    return c;
  }, [scene, product, lite]);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetH = 0.9 * scale * product.bottleHeight;
    const s = size.y > 0.001 ? targetH / size.y : 1;
    clone.scale.setScalar(s);
    box.setFromObject(clone);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    clone.position.y += (box.max.y - box.min.y) / 2;
  }, [clone, product.bottleHeight, scale]);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (selected) group.current.rotation.y += dt * 0.9;
    target.current = selected ? 1.08 : 1;
    const cur = group.current.scale.x;
    const next = cur + (target.current - cur) * 0.12;
    group.current.scale.setScalar(next);
  });

  const labelY = 0.36 * scale * product.bottleHeight;
  const labelR = 0.11 * scale;

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <primitive object={clone} />
      <mesh position={[0, labelY, 0]} rotation={[0, 0.15, 0]}>
        <cylinderGeometry args={[labelR, labelR * 1.04, 0.3 * scale, 40, 1, true, -0.9, 1.8]} />
        <meshStandardMaterial map={labelMap} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.22, 40]} />
          <meshBasicMaterial color={product.accentColor} transparent opacity={0.45} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Real 3D bottle from product GLB (+ glass materials & label).
 * Falls back to high-quality lathe mesh if GLB fails.
 */
export function ProductBottle3D({
  product,
  position = [0, 0, 0],
  scale = 1,
  selected,
  onSelect,
  preferGlb = true,
  lite = false,
}: {
  product: Product;
  position?: [number, number, number];
  scale?: number;
  selected?: boolean;
  onSelect?: () => void;
  preferGlb?: boolean;
  /** Lighter materials for crowded shelves */
  lite?: boolean;
}) {
  const url = product.glbUrl ?? `/models/bottles/${product.slug}.glb`;
  const meshFallback = (
    <BottleMesh
      product={product}
      selected={selected}
      onSelect={onSelect}
      scale={scale}
      lite={lite}
    />
  );

  return (
    <group position={position}>
      {preferGlb ? (
        <BottleErrorBoundary fallback={meshFallback}>
          <Suspense fallback={meshFallback}>
            <GlbBottle
              product={product}
              url={url}
              selected={selected}
              onSelect={onSelect}
              scale={scale}
              lite={lite}
            />
          </Suspense>
        </BottleErrorBoundary>
      ) : (
        meshFallback
      )}
    </group>
  );
}

export function preloadProductBottles(list: Product[]) {
  for (const p of list) {
    const url = p.glbUrl ?? `/models/bottles/${p.slug}.glb`;
    useGLTF.preload(url);
  }
}
