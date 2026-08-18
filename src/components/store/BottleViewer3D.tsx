"use client";

import { ContactShadows, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, type ErrorInfo } from "react";
import * as THREE from "three";
import type { Product } from "@/types";
import { BottleMesh } from "./BottleMesh";

class ViewerErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error("BottleViewer3D:", e, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center bg-[#0a0908] px-4 text-center text-sm text-muted">
          3D viewer error — reload the page
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Stable studio bottle viewer — lathe PBR mesh (always works).
 * Avoids fragile GLB/HDR hangs that white-screen the canvas.
 */
export function BottleViewer3D({
  product,
  className,
}: {
  product: Product;
  className?: string;
  preferGlb?: boolean;
}) {
  return (
    <div className={`bg-[#0a0908] ${className ?? "h-full min-h-90 w-full"}`}>
      <ViewerErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
            gl.setClearColor("#0a0908", 1);
          }}
        >
          <PerspectiveCamera makeDefault position={[1.1, 0.95, 2.4]} fov={38} />
          <color attach="background" args={["#0a0908"]} />
          <ambientLight intensity={0.55} color="#f5ebe0" />
          <hemisphereLight intensity={0.35} color="#fff8ee" groundColor="#1a120c" />
          <spotLight
            position={[3, 5, 2]}
            angle={0.35}
            penumbra={0.9}
            intensity={3.5}
            color="#ffe4b0"
            castShadow
          />
          <spotLight position={[-2.5, 3, 1]} angle={0.5} penumbra={1} intensity={1.6} color="#b8d0ff" />
          <spotLight position={[0, 2, -3]} angle={0.55} penumbra={0.85} intensity={2.2} color="#e4c878" />
          <pointLight position={[0.5, 1.2, 1.5]} intensity={0.8} color="#fff0d0" />

          <group position={[0, 0, 0]}>
            {/* lite avoids MeshPhysical transmission → white-screen without HDR env */}
            <BottleMesh product={product} scale={1.15} autoRotate lite />
          </group>

          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={6} blur={2.4} far={2.5} />

          <OrbitControls
            enablePan={false}
            minDistance={1.2}
            maxDistance={4}
            maxPolarAngle={Math.PI / 1.7}
            target={[0, 0.55, 0]}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  );
}
