/**
 * AICO Smart Home - Digital Twin Component
 *
 * Architectural Blueprint Style - Wireframe visualization
 * inspired by technical architectural drawings with
 * glowing blue lines on deep blue background.
 */

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line,
  Grid,
  Float,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useSceneStore } from '../scene-manager';
import type { SceneNode, QualityLevel } from '../types';
import type { DeviceId, RoomId, FloorId } from '@/types/core';

// ============================================================================
// Blueprint Color Palette
// ============================================================================

const COLORS = {
  background: '#0a1628',
  gridPrimary: '#1e3a5f',
  gridSecondary: '#0f2847',
  wireframe: '#00a8ff',
  wireframeSecondary: '#0066aa',
  wireframeGlow: '#00d4ff',
  accent: '#00ffcc',
  text: '#88ccff',
  highlight: '#00ffff',
};

// ============================================================================
// Main Digital Twin Component
// ============================================================================

interface DigitalTwinProps {
  className?: string;
  onDeviceClick?: (deviceId: DeviceId) => void;
  onRoomClick?: (roomId: RoomId) => void;
  onFloorClick?: (floorId: FloorId) => void;
  blurred?: boolean;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  className,
  onDeviceClick,
  onRoomClick,
  onFloorClick,
  blurred = false,
}) => {
  const { scene, camera, quality, updatePerformanceMetrics } = useSceneStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qualitySettings = getQualitySettings(quality);

  return (
    <div
      className={`digital-twin-wrapper ${className ?? ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'filter 0.5s ease-out',
        filter: blurred ? 'blur(8px) brightness(0.7)' : 'none',
      }}
    >
      <Canvas
        ref={canvasRef}
        dpr={qualitySettings.dpr}
        gl={{
          antialias: qualitySettings.antialias,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        style={{ background: COLORS.background }}
      >
        <color attach="background" args={[COLORS.background]} />

        <Suspense fallback={<LoadingIndicator />}>
          <BlueprintScene
            onDeviceClick={onDeviceClick}
            onRoomClick={onRoomClick}
            onFloorClick={onFloorClick}
          />
        </Suspense>

        {qualitySettings.postProcessing && <BlueprintPostProcessing />}

        <PerformanceMonitor onMetrics={updatePerformanceMetrics} />
      </Canvas>

      {/* Blueprint corner decorations */}
      <BlueprintCorners />
    </div>
  );
};

// ============================================================================
// Blueprint Corner Decorations (UI Overlay)
// ============================================================================

const BlueprintCorners: React.FC = () => (
  <>
    {/* Top Left */}
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        width: 60,
        height: 60,
        borderLeft: `2px solid ${COLORS.wireframe}40`,
        borderTop: `2px solid ${COLORS.wireframe}40`,
        pointerEvents: 'none',
      }}
    />
    {/* Top Right */}
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRight: `2px solid ${COLORS.wireframe}40`,
        borderTop: `2px solid ${COLORS.wireframe}40`,
        pointerEvents: 'none',
      }}
    />
    {/* Bottom Left */}
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 60,
        height: 60,
        borderLeft: `2px solid ${COLORS.wireframe}40`,
        borderBottom: `2px solid ${COLORS.wireframe}40`,
        pointerEvents: 'none',
      }}
    />
    {/* Bottom Right */}
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRight: `2px solid ${COLORS.wireframe}40`,
        borderBottom: `2px solid ${COLORS.wireframe}40`,
        pointerEvents: 'none',
      }}
    />
  </>
);

// ============================================================================
// Blueprint Scene
// ============================================================================

interface BlueprintSceneProps {
  onDeviceClick?: (deviceId: DeviceId) => void;
  onRoomClick?: (roomId: RoomId) => void;
  onFloorClick?: (floorId: FloorId) => void;
}

const BlueprintScene: React.FC<BlueprintSceneProps> = ({
  onDeviceClick,
  onRoomClick,
  onFloorClick,
}) => {
  const { scene, camera, floorNavigation, roomNavigation, interaction } = useSceneStore();

  return (
    <>
      {/* Camera */}
      <BlueprintCamera camera={camera} />

      {/* Minimal ambient lighting for labels */}
      <ambientLight intensity={0.3} color={COLORS.wireframe} />

      {/* Blueprint Grid */}
      <BlueprintGrid />

      {/* Architectural House Wireframe */}
      <BlueprintHouse />

      {/* Scene nodes (if available) */}
      {scene && (
        <BlueprintSceneGraph
          node={scene.rootNode}
          floorNavigation={floorNavigation}
          roomNavigation={roomNavigation}
          interaction={interaction}
          onDeviceClick={onDeviceClick}
          onRoomClick={onRoomClick}
          onFloorClick={onFloorClick}
        />
      )}

      {/* Floating measurement labels */}
      <MeasurementLabels />
    </>
  );
};

// ============================================================================
// Blueprint Camera
// ============================================================================

interface BlueprintCameraProps {
  camera: ReturnType<typeof useSceneStore>['camera'];
}

const BlueprintCamera: React.FC<BlueprintCameraProps> = ({ camera }) => {
  const { setCamera } = useSceneStore();
  const controlsRef = useRef<any>(null);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[20, 15, 25]}
        fov={45}
        near={0.1}
        far={1000}
      />

      <OrbitControls
        ref={controlsRef}
        target={[0, 2, 0]}
        minDistance={10}
        maxDistance={50}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        panSpeed={0.4}
        zoomSpeed={0.6}
        enablePan
        screenSpacePanning
      />
    </>
  );
};

// ============================================================================
// Blueprint Grid
// ============================================================================

const BlueprintGrid: React.FC = () => {
  return (
    <group>
      {/* Main grid */}
      <Grid
        position={[0, 0, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={COLORS.gridPrimary}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={COLORS.wireframe}
        fadeDistance={60}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* Center cross marker */}
      <Line
        points={[[-2, 0.01, 0], [2, 0.01, 0]]}
        color={COLORS.accent}
        lineWidth={2}
      />
      <Line
        points={[[0, 0.01, -2], [0, 0.01, 2]]}
        color={COLORS.accent}
        lineWidth={2}
      />
    </group>
  );
};

// ============================================================================
// Blueprint House Wireframe
// ============================================================================

const BlueprintHouse: React.FC = () => {
  const houseRef = useRef<THREE.Group>(null);

  // Subtle rotation animation
  useFrame(({ clock }) => {
    if (houseRef.current) {
      houseRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={houseRef} position={[0, 0, 0]}>
      {/* Ground Floor */}
      <WireframeFloor position={[0, 0, 0]} width={16} depth={12} label="Ground Floor" />

      {/* Ground Floor Rooms */}
      <WireframeRoom position={[-4, 0, -2]} width={6} depth={6} height={3} label="Living Room" />
      <WireframeRoom position={[4, 0, -2]} width={6} depth={4} height={3} label="Kitchen" />
      <WireframeRoom position={[4, 0, 3]} width={6} depth={4} height={3} label="Dining" />
      <WireframeRoom position={[-4, 0, 4]} width={6} depth={3} height={3} label="Entry" />

      {/* First Floor */}
      <WireframeFloor position={[0, 3.5, 0]} width={14} depth={10} label="First Floor" />

      {/* First Floor Rooms */}
      <WireframeRoom position={[-3, 3.5, -1]} width={5} depth={5} height={3} label="Master Bed" />
      <WireframeRoom position={[3, 3.5, -1]} width={4} depth={4} height={3} label="Bedroom 2" />
      <WireframeRoom position={[3, 3.5, 3]} width={4} depth={3} height={3} label="Bath" />
      <WireframeRoom position={[-3, 3.5, 3]} width={5} depth={3} height={3} label="Office" />

      {/* Roof Structure */}
      <WireframeRoof position={[0, 6.5, 0]} width={16} depth={12} height={4} />

      {/* Stairs */}
      <WireframeStairs position={[0, 0, 0]} />

      {/* Windows */}
      <WireframeWindows />

      {/* Device Indicators */}
      <DeviceIndicators />
    </group>
  );
};

// ============================================================================
// Wireframe Components
// ============================================================================

interface WireframeFloorProps {
  position: [number, number, number];
  width: number;
  depth: number;
  label?: string;
}

const WireframeFloor: React.FC<WireframeFloorProps> = ({ position, width, depth, label }) => {
  const hw = width / 2;
  const hd = depth / 2;

  const points: [number, number, number][] = [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [hw, 0, hd],
    [-hw, 0, hd],
    [-hw, 0, -hd],
  ];

  return (
    <group position={position}>
      <Line
        points={points}
        color={COLORS.wireframe}
        lineWidth={2}
      />
      {/* Floor grid lines */}
      {Array.from({ length: Math.floor(width) + 1 }).map((_, i) => (
        <Line
          key={`floor-x-${i}`}
          points={[
            [-hw + i, 0.01, -hd],
            [-hw + i, 0.01, hd],
          ]}
          color={COLORS.gridPrimary}
          lineWidth={0.5}
        />
      ))}
      {Array.from({ length: Math.floor(depth) + 1 }).map((_, i) => (
        <Line
          key={`floor-z-${i}`}
          points={[
            [-hw, 0.01, -hd + i],
            [hw, 0.01, -hd + i],
          ]}
          color={COLORS.gridPrimary}
          lineWidth={0.5}
        />
      ))}
    </group>
  );
};

interface WireframeRoomProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  label?: string;
}

const WireframeRoom: React.FC<WireframeRoomProps> = ({ position, width, depth, height, label }) => {
  const roomRef = useRef<THREE.Group>(null);
  const hw = width / 2;
  const hd = depth / 2;

  // Pulsing animation
  useFrame(({ clock }) => {
    if (roomRef.current) {
      const material = roomRef.current.children[0] as any;
      if (material?.material) {
        material.material.opacity = 0.6 + Math.sin(clock.elapsedTime * 2) * 0.2;
      }
    }
  });

  // Box edges
  const edges: Array<[[number, number, number], [number, number, number]]> = [
    // Bottom
    [[-hw, 0, -hd], [hw, 0, -hd]],
    [[hw, 0, -hd], [hw, 0, hd]],
    [[hw, 0, hd], [-hw, 0, hd]],
    [[-hw, 0, hd], [-hw, 0, -hd]],
    // Top
    [[-hw, height, -hd], [hw, height, -hd]],
    [[hw, height, -hd], [hw, height, hd]],
    [[hw, height, hd], [-hw, height, hd]],
    [[-hw, height, hd], [-hw, height, -hd]],
    // Verticals
    [[-hw, 0, -hd], [-hw, height, -hd]],
    [[hw, 0, -hd], [hw, height, -hd]],
    [[hw, 0, hd], [hw, height, hd]],
    [[-hw, 0, hd], [-hw, height, hd]],
  ];

  return (
    <group ref={roomRef} position={position}>
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color={COLORS.wireframe}
          lineWidth={1.5}
          transparent
          opacity={0.8}
        />
      ))}

      {/* Room label */}
      {label && (
        <Float speed={2} floatIntensity={0.2}>
          <Html
            position={[0, height / 2, 0]}
            center
            distanceFactor={15}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                padding: '4px 12px',
                background: `${COLORS.background}cc`,
                border: `1px solid ${COLORS.wireframe}60`,
                borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  color: COLORS.text,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </div>
          </Html>
        </Float>
      )}
    </group>
  );
};

interface WireframeRoofProps {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
}

const WireframeRoof: React.FC<WireframeRoofProps> = ({ position, width, depth, height }) => {
  const hw = width / 2;
  const hd = depth / 2;

  // Roof points (simple gable roof)
  const roofEdges: Array<[[number, number, number], [number, number, number]]> = [
    // Base rectangle
    [[-hw, 0, -hd], [hw, 0, -hd]],
    [[hw, 0, -hd], [hw, 0, hd]],
    [[hw, 0, hd], [-hw, 0, hd]],
    [[-hw, 0, hd], [-hw, 0, -hd]],
    // Ridge
    [[0, height, -hd], [0, height, hd]],
    // Front gable
    [[-hw, 0, -hd], [0, height, -hd]],
    [[hw, 0, -hd], [0, height, -hd]],
    // Back gable
    [[-hw, 0, hd], [0, height, hd]],
    [[hw, 0, hd], [0, height, hd]],
  ];

  return (
    <group position={position}>
      {roofEdges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color={COLORS.wireframeSecondary}
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  );
};

const WireframeStairs: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const steps = 8;
  const stepHeight = 3.5 / steps;
  const stepDepth = 0.4;

  return (
    <group position={position}>
      {Array.from({ length: steps }).map((_, i) => (
        <group key={i} position={[0, i * stepHeight, i * stepDepth - 1]}>
          <Line
            points={[
              [-1, 0, 0],
              [1, 0, 0],
              [1, 0, stepDepth],
              [-1, 0, stepDepth],
              [-1, 0, 0],
            ]}
            color={COLORS.wireframeSecondary}
            lineWidth={1}
          />
        </group>
      ))}
    </group>
  );
};

const WireframeWindows: React.FC = () => {
  const windowPositions: Array<{ pos: [number, number, number]; size: [number, number] }> = [
    { pos: [-7, 1.5, -5.01], size: [2, 1.5] },
    { pos: [-4, 1.5, -5.01], size: [2, 1.5] },
    { pos: [3, 1.5, -5.01], size: [1.5, 1.2] },
    { pos: [6, 1.5, -5.01], size: [1.5, 1.2] },
    { pos: [-5.5, 5, -4.01], size: [1.5, 1.5] },
    { pos: [3, 5, -4.01], size: [1.2, 1.2] },
  ];

  return (
    <group>
      {windowPositions.map((win, i) => (
        <WireframeWindow key={i} position={win.pos} width={win.size[0]} height={win.size[1]} />
      ))}
    </group>
  );
};

interface WireframeWindowProps {
  position: [number, number, number];
  width: number;
  height: number;
}

const WireframeWindow: React.FC<WireframeWindowProps> = ({ position, width, height }) => {
  const hw = width / 2;
  const hh = height / 2;

  return (
    <group position={position}>
      {/* Window frame */}
      <Line
        points={[
          [-hw, -hh, 0],
          [hw, -hh, 0],
          [hw, hh, 0],
          [-hw, hh, 0],
          [-hw, -hh, 0],
        ]}
        color={COLORS.accent}
        lineWidth={1.5}
      />
      {/* Cross divider */}
      <Line points={[[0, -hh, 0], [0, hh, 0]]} color={COLORS.accent} lineWidth={1} />
      <Line points={[[-hw, 0, 0], [hw, 0, 0]]} color={COLORS.accent} lineWidth={1} />
    </group>
  );
};

// ============================================================================
// Device Indicators
// ============================================================================

const DeviceIndicators: React.FC = () => {
  const deviceStates = useSceneStore(state => state.deviceStates);

  const devices = [
    { id: 'light-living', pos: [-4, 2.8, -2] as [number, number, number], label: 'Light' },
    { id: 'thermostat', pos: [-2, 1.5, -4.5] as [number, number, number], label: 'HVAC' },
    { id: 'camera-entry', pos: [-4, 2.5, 5.5] as [number, number, number], label: 'Camera' },
    { id: 'light-kitchen', pos: [4, 2.8, -2] as [number, number, number], label: 'Light' },
    { id: 'speaker-living', pos: [-6, 1, -3] as [number, number, number], label: 'Speaker' },
  ];

  return (
    <group>
      {devices.map(device => (
        <DeviceMarker
          key={device.id}
          position={device.pos}
          label={device.label}
          active={true}
        />
      ))}
    </group>
  );
};

interface DeviceMarkerProps {
  position: [number, number, number];
  label: string;
  active: boolean;
}

const DeviceMarker: React.FC<DeviceMarkerProps> = ({ position, label, active }) => {
  const markerRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (markerRef.current && active) {
      markerRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.1);
    }
  });

  return (
    <group ref={markerRef} position={position}>
      {/* Device point */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={active ? COLORS.accent : COLORS.wireframeSecondary} />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial
          color={COLORS.accent}
          transparent
          opacity={active ? 0.5 : 0.2}
        />
      </mesh>

      {/* Connection line to floor */}
      <Line
        points={[[0, 0, 0], [0, -position[1], 0]]}
        color={COLORS.wireframeSecondary}
        lineWidth={0.5}
        dashed
        dashSize={0.1}
        gapSize={0.1}
      />
    </group>
  );
};

// ============================================================================
// Measurement Labels
// ============================================================================

const MeasurementLabels: React.FC = () => {
  return (
    <group>
      {/* Width measurement */}
      <group position={[0, 0.1, -8]}>
        <Line
          points={[[-8, 0, 0], [8, 0, 0]]}
          color={COLORS.accent}
          lineWidth={1}
        />
        <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
          <span style={{ color: COLORS.accent, fontSize: '10px', fontFamily: 'monospace' }}>
            16.0m
          </span>
        </Html>
      </group>

      {/* Depth measurement */}
      <group position={[-10, 0.1, 0]}>
        <Line
          points={[[0, 0, -6], [0, 0, 6]]}
          color={COLORS.accent}
          lineWidth={1}
        />
        <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
          <span style={{ color: COLORS.accent, fontSize: '10px', fontFamily: 'monospace' }}>
            12.0m
          </span>
        </Html>
      </group>

      {/* Height measurement */}
      <group position={[-10, 5, -8]}>
        <Line
          points={[[0, -5, 0], [0, 5, 0]]}
          color={COLORS.accent}
          lineWidth={1}
        />
        <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none' }}>
          <span style={{ color: COLORS.accent, fontSize: '10px', fontFamily: 'monospace' }}>
            10.0m
          </span>
        </Html>
      </group>
    </group>
  );
};

// ============================================================================
// Blueprint Scene Graph (for loaded residence data)
// ============================================================================

interface BlueprintSceneGraphProps {
  node: SceneNode;
  floorNavigation: ReturnType<typeof useSceneStore>['floorNavigation'];
  roomNavigation: ReturnType<typeof useSceneStore>['roomNavigation'];
  interaction: ReturnType<typeof useSceneStore>['interaction'];
  onDeviceClick?: (deviceId: DeviceId) => void;
  onRoomClick?: (roomId: RoomId) => void;
  onFloorClick?: (floorId: FloorId) => void;
}

const BlueprintSceneGraph: React.FC<BlueprintSceneGraphProps> = ({
  node,
  floorNavigation,
  roomNavigation,
  interaction,
  onDeviceClick,
  onRoomClick,
  onFloorClick,
}) => {
  // Render children only - the house wireframe is our main visual
  return (
    <group>
      {node.children.map(child => (
        <BlueprintSceneGraph
          key={child.id}
          node={child}
          floorNavigation={floorNavigation}
          roomNavigation={roomNavigation}
          interaction={interaction}
          onDeviceClick={onDeviceClick}
          onRoomClick={onRoomClick}
          onFloorClick={onFloorClick}
        />
      ))}
    </group>
  );
};

// ============================================================================
// Blueprint Post Processing
// ============================================================================

const BlueprintPostProcessing: React.FC = () => {
  return (
    <EffectComposer>
      {/* Strong bloom for glowing wireframes */}
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.7}
      />

      {/* Subtle chromatic aberration */}
      <ChromaticAberration
        offset={[0.0003, 0.0003]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* Vignette for focus */}
      <Vignette
        offset={0.35}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Subtle noise for texture */}
      <Noise
        opacity={0.02}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
};

// ============================================================================
// Performance Monitor
// ============================================================================

interface PerformanceMonitorProps {
  onMetrics: (fps: number, drawCalls: number) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onMetrics }) => {
  const { gl } = useThree();

  useFrame((_, delta) => {
    const fps = Math.round(1 / delta);
    const drawCalls = gl.info.render.calls;
    onMetrics(fps, drawCalls);
  });

  return null;
};

// ============================================================================
// Loading Indicator
// ============================================================================

const LoadingIndicator: React.FC = () => (
  <Html center>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '24px 32px',
        background: `${COLORS.background}ee`,
        border: `1px solid ${COLORS.wireframe}40`,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: `2px solid ${COLORS.wireframe}30`,
          borderTopColor: COLORS.wireframe,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ color: COLORS.text, fontSize: '12px', fontFamily: 'monospace' }}>
        LOADING BLUEPRINT...
      </span>
    </div>
  </Html>
);

// ============================================================================
// Helper Functions
// ============================================================================

function getQualitySettings(quality: QualityLevel) {
  switch (quality) {
    case 'low':
      return {
        dpr: [0.5, 1] as [number, number],
        antialias: false,
        postProcessing: false,
      };
    case 'medium':
      return {
        dpr: [1, 1.5] as [number, number],
        antialias: true,
        postProcessing: true,
      };
    case 'high':
    case 'ultra':
      return {
        dpr: [1, 2] as [number, number],
        antialias: true,
        postProcessing: true,
      };
  }
}

export default DigitalTwin;
