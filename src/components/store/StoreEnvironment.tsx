"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

const WARM = "#ffe4b8";

/** Compact boutique shell for a U-shaped aisle layout */
export function StoreEnvironment() {
  const floor = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3d2c20", roughness: 0.38, metalness: 0.1 }),
    [],
  );
  const wall = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#241810", roughness: 0.72, metalness: 0.05 }),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor}>
        <planeGeometry args={[18, 18]} />
      </mesh>

      {/* Center runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.2]}>
        <planeGeometry args={[2.4, 12]} />
        <meshStandardMaterial color="#4a1814" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 2.2]}>
        <planeGeometry args={[2.55, 12.2]} />
        <meshStandardMaterial color="#c9a962" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Room walls */}
      <mesh position={[0, 2.2, -5.8]} material={wall}>
        <boxGeometry args={[16, 4.6, 0.28]} />
      </mesh>
      <mesh position={[0, 2.2, 9.0]} material={wall}>
        <boxGeometry args={[16, 4.6, 0.28]} />
      </mesh>
      <mesh position={[-7.6, 2.2, 1.8]} rotation={[0, Math.PI / 2, 0]} material={wall}>
        <boxGeometry args={[14.5, 4.6, 0.28]} />
      </mesh>
      <mesh position={[7.6, 2.2, 1.8]} rotation={[0, Math.PI / 2, 0]} material={wall}>
        <boxGeometry args={[14.5, 4.6, 0.28]} />
      </mesh>

      <mesh position={[0, 4.55, 1.8]}>
        <boxGeometry args={[16, 0.14, 15]} />
        <meshStandardMaterial color="#0c0a08" />
      </mesh>

      {[-3.5, 0, 3.5].map((x) => (
        <group key={x} position={[x, 4.35, 1.5]}>
          <mesh>
            <boxGeometry args={[1.2, 0.04, 0.28]} />
            <meshStandardMaterial color="#fff6e8" emissive={WARM} emissiveIntensity={1.5} />
          </mesh>
          <pointLight intensity={0.9} distance={8} color={WARM} />
        </group>
      ))}

      {/* Entrance frame */}
      <group position={[0, 0, 8.4]}>
        <mesh position={[-2.0, 2.0, 0]}>
          <boxGeometry args={[0.18, 4.0, 0.3]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[2.0, 2.0, 0]}>
          <boxGeometry args={[0.18, 4.0, 0.3]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.95, 0]}>
          <boxGeometry args={[4.2, 0.22, 0.3]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.2} />
        </mesh>
        <spotLight position={[0, 3.2, -1.2]} angle={0.55} penumbra={0.75} intensity={3.0} color={WARM} />
      </group>

      {/* Checkout desk near entrance */}
      <group position={[0, 0, 4.8]}>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[2.4, 0.84, 0.95]} />
          <meshStandardMaterial color="#1a1410" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[2.6, 0.07, 1.1]} />
          <meshStandardMaterial color="#d4ccc0" roughness={0.28} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.93, 0.52]}>
          <boxGeometry args={[2.6, 0.02, 0.03]} />
          <meshStandardMaterial color="#c9a962" metalness={0.9} roughness={0.2} />
        </mesh>
        <pointLight position={[0, 2.0, 0]} intensity={1.0} distance={5} color={WARM} />
      </group>
    </group>
  );
}

export function FeatureIsland({
  position,
  children,
}: {
  position: [number, number, number];
  children?: ReactNode;
}) {
  return <group position={position}>{children}</group>;
}
