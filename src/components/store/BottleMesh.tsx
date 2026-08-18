"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Product } from "@/types";
import { BOTTLE_PROFILES, shapeForCategory } from "./bottleProfiles";

type Props = {
  product: Product;
  position?: [number, number, number];
  scale?: number;
  selected?: boolean;
  onSelect?: () => void;
  autoRotate?: boolean;
  /** Lighter materials for crowded scenes (virtual store) */
  lite?: boolean;
};

function makeLabelTexture(product: Product) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d")!;

  // Cream / dark paper base with subtle grain
  const base = ctx.createLinearGradient(0, 0, 0, 1280);
  base.addColorStop(0, product.labelColor);
  base.addColorStop(0.5, "#12100c");
  base.addColorStop(1, product.labelColor);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1280);

  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,240,200,${Math.random() * 0.035})`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1280, 1.5, 1.5);
  }

  // Foil border
  const foil = ctx.createLinearGradient(0, 0, 1024, 0);
  foil.addColorStop(0, product.accentColor);
  foil.addColorStop(0.5, "#f5e6c8");
  foil.addColorStop(1, product.accentColor);
  ctx.strokeStyle = foil;
  ctx.lineWidth = 18;
  ctx.strokeRect(48, 48, 928, 1184);
  ctx.lineWidth = 3;
  ctx.strokeRect(80, 80, 864, 1120);

  // Brand crest circle
  ctx.beginPath();
  ctx.arc(512, 280, 70, 0, Math.PI * 2);
  ctx.strokeStyle = product.accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = product.accentColor;
  ctx.font = "600 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("MS", 512, 290);

  ctx.fillStyle = product.accentColor;
  ctx.font = "600 42px Georgia, serif";
  ctx.fillText(product.brand.toUpperCase().slice(0, 20), 512, 420);

  ctx.beginPath();
  ctx.moveTo(220, 460);
  ctx.lineTo(804, 460);
  ctx.strokeStyle = `${product.accentColor}99`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#f3ead7";
  ctx.font = "500 52px Georgia, serif";
  const name = product.name.replace(product.brand, "").trim() || product.name;
  wrapText(ctx, name, 512, 560, 760, 58);

  ctx.fillStyle = product.accentColor;
  ctx.font = "16px sans-serif";
  ctx.fillText(product.origin.toUpperCase(), 512, 980);
  ctx.fillText(`${product.abv}% ALC./VOL.  ·  ${product.volumeMl} ml`, 512, 1030);
  ctx.fillText("SAM'S DISCOUNT LIQUOR — NEW YORK", 512, 1120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

function GlassMat({
  color,
  clear,
  lite,
}: {
  color: string;
  clear?: boolean;
  lite?: boolean;
}) {
  if (lite) {
    return (
      <meshStandardMaterial
        color={clear ? "#d8e4ec" : color}
        roughness={0.22}
        metalness={0.15}
        transparent
        opacity={clear ? 0.75 : 0.92}
        envMapIntensity={1.2}
      />
    );
  }
  return (
    <meshPhysicalMaterial
      color={clear ? "#f4f8fb" : color}
      roughness={0.015}
      metalness={0}
      transmission={clear ? 0.95 : 0.78}
      thickness={1.6}
      ior={1.52}
      transparent
      opacity={1}
      envMapIntensity={2.8}
      clearcoat={1}
      clearcoatRoughness={0.04}
      attenuationColor={clear ? "#ffffff" : color}
      attenuationDistance={clear ? 3 : 0.7}
      specularIntensity={1}
      reflectivity={0.9}
    />
  );
}

export function BottleMesh({
  product,
  position = [0, 0, 0],
  scale = 1,
  selected,
  onSelect,
  autoRotate,
  lite = false,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const shape = shapeForCategory(product.category);
  const isSquare = shape === "bourbon-square";
  const isClear = ["vodka", "gin", "champagne"].includes(product.category);
  const h = product.bottleHeight * scale;
  const s = scale;

  const labelMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    return makeLabelTexture(product);
  }, [product]);

  const latheGeo = useMemo(() => {
    const profile = BOTTLE_PROFILES[shape];
    const points = profile.map(
      ([r, y]) => new THREE.Vector2(r * s * (isSquare ? 0.95 : 1), y * h),
    );
    const geo = new THREE.LatheGeometry(points, 64);
    geo.computeVertexNormals();
    return geo;
  }, [shape, h, s, isSquare]);

  const liquidGeo = useMemo(() => {
    const profile = BOTTLE_PROFILES[shape];
    // inset liquid profile
    const points = profile
      .filter(([, y]) => y > 0.02 && y < 0.72)
      .map(([r, y]) => new THREE.Vector2(Math.max(0.02, r * s * 0.82), y * h * 0.95));
    if (points.length < 2) {
      return new THREE.CylinderGeometry(0.12 * s, 0.15 * s, h * 0.5, 32);
    }
    const geo = new THREE.LatheGeometry(points, 48);
    geo.computeVertexNormals();
    return geo;
  }, [shape, h, s]);

  const targetScale = useRef(new THREE.Vector3(1, 1, 1));

  useLayoutEffect(() => {
    return () => {
      latheGeo.dispose();
      liquidGeo.dispose();
    };
  }, [latheGeo, liquidGeo]);

  useFrame((_, dt) => {
    if (!group.current) return;
    if (autoRotate || selected) {
      group.current.rotation.y += dt * (selected ? 0.85 : 0.15);
    }
    targetScale.current.setScalar(selected ? 1.06 : 1);
    group.current.scale.lerp(targetScale.current, 0.12);
  });

  const glassTint = isClear ? "#eef5f8" : product.color;

  return (
    <group
      ref={group}
      position={position}
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
      {/* Outer glass — lathe silhouette */}
      {!isSquare && (
        <mesh geometry={latheGeo} castShadow receiveShadow>
          <GlassMat color={glassTint} clear={isClear} lite={lite} />
        </mesh>
      )}

      {/* Square bourbon bottle (Jack Daniel's style) */}
      {isSquare && (
        <group>
          <mesh position={[0, h * 0.28, 0]} castShadow>
            <boxGeometry args={[0.36 * s, h * 0.55, 0.36 * s]} />
            <GlassMat color={glassTint} lite={lite} />
          </mesh>
          <mesh position={[0, h * 0.58, 0]} castShadow>
            <boxGeometry args={[0.28 * s, h * 0.08, 0.28 * s]} />
            <GlassMat color={glassTint} lite={lite} />
          </mesh>
          <mesh position={[0, h * 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.07 * s, 0.1 * s, h * 0.22, 24]} />
            <GlassMat color={glassTint} lite={lite} />
          </mesh>
        </group>
      )}

      {/* Liquid */}
      {isSquare ? (
        <mesh position={[0, h * 0.26, 0]}>
          <boxGeometry args={[0.3 * s, h * 0.45, 0.3 * s]} />
          <meshStandardMaterial
            color={product.color}
            roughness={0.22}
            metalness={0.08}
            transparent
            opacity={0.94}
            emissive={product.color}
            emissiveIntensity={0.12}
          />
        </mesh>
      ) : (
        <mesh geometry={liquidGeo}>
          <meshStandardMaterial
            color={product.color}
            roughness={0.22}
            metalness={0.08}
            transparent
            opacity={isClear ? 0.35 : 0.94}
            emissive={product.color}
            emissiveIntensity={0.12}
          />
        </mesh>
      )}

      {/* Foil capsule */}
      <mesh position={[0, h * 0.93, 0]} castShadow>
        <cylinderGeometry args={[0.078 * s, 0.082 * s, 0.12 * s, 32]} />
        <meshStandardMaterial
          color={product.accentColor}
          metalness={0.95}
          roughness={0.15}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* Cork */}
      <mesh position={[0, h * 1.0, 0]}>
        <cylinderGeometry args={[0.055 * s, 0.055 * s, 0.04 * s, 20]} />
        <meshStandardMaterial color="#5a3d28" roughness={0.85} />
      </mesh>

      {/* Champagne wire cage suggestion */}
      {product.category === "champagne" && (
        <mesh position={[0, h * 0.88, 0]}>
          <torusGeometry args={[0.09 * s, 0.008 * s, 8, 24]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.25} />
        </mesh>
      )}

      {/* Curved paper label */}
      {labelMap && !isSquare && (
        <mesh position={[0, h * 0.38, 0]} rotation={[0, 0.2, 0]}>
          <cylinderGeometry
            args={[
              0.195 * s * (shape === "wine" || shape === "champagne" ? 0.85 : 1),
              0.205 * s * (shape === "wine" || shape === "champagne" ? 0.88 : 1.02),
              0.42 * s,
              64,
              1,
              true,
              -1.0,
              2.0,
            ]}
          />
          <meshStandardMaterial
            map={labelMap}
            roughness={0.48}
            metalness={0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {labelMap && isSquare && (
        <mesh position={[0, h * 0.3, 0.182 * s]}>
          <planeGeometry args={[0.3 * s, 0.4 * s]} />
          <meshStandardMaterial map={labelMap} roughness={0.48} metalness={0.04} />
        </mesh>
      )}

      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22 * s, 0.34 * s, 48]} />
          <meshBasicMaterial color={product.accentColor} transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}
