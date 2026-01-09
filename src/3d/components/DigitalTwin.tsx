/**
 * AICO Smart Home - Digital Twin Component
 *
 * Ultra-luxury 3D visualization with photorealistic rendering,
 * HDRI environment, PBR materials, and cinematic post-processing.
 */

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Html,
  Float,
  MeshReflectorMaterial,
  Sparkles,
  Stars,
  Sky,
  Lightformer,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  SSAO,
  Vignette,
  ChromaticAberration,
  DepthOfField,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useSceneStore } from '../scene-manager';
import type { SceneNode, QualityLevel } from '../types';
import type { DeviceId, RoomId, FloorId } from '@/types/core';

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
        shadows={qualitySettings.shadows ? 'soft' : false}
        dpr={qualitySettings.dpr}
        gl={{
          antialias: qualitySettings.antialias,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#050508']} />

        {/* Ambient fog for depth */}
        <fog attach="fog" args={['#050508', 30, 100]} />

        <Suspense fallback={<LoadingIndicator />}>
          <SceneContent
            onDeviceClick={onDeviceClick}
            onRoomClick={onRoomClick}
            onFloorClick={onFloorClick}
          />
        </Suspense>

        {qualitySettings.postProcessing && (
          <LuxuryPostProcessing quality={quality} />
        )}

        <PerformanceMonitor onMetrics={updatePerformanceMetrics} />
      </Canvas>

      {/* Overlay gradient for depth */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// ============================================================================
// Scene Content
// ============================================================================

interface SceneContentProps {
  onDeviceClick?: (deviceId: DeviceId) => void;
  onRoomClick?: (roomId: RoomId) => void;
  onFloorClick?: (floorId: FloorId) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({
  onDeviceClick,
  onRoomClick,
  onFloorClick,
}) => {
  const { scene, camera, floorNavigation, roomNavigation, interaction } = useSceneStore();

  if (!scene) {
    return <EmptyScene />;
  }

  return (
    <>
      {/* Camera */}
      <CameraController camera={camera} />

      {/* Premium Lighting Setup */}
      <LuxuryLighting />

      {/* HDRI Environment */}
      <Environment
        preset="night"
        background={false}
        blur={0.5}
      >
        {/* Custom light formers for architectural look */}
        <Lightformer
          intensity={2}
          rotation-x={Math.PI / 2}
          position={[0, 5, -9]}
          scale={[10, 10, 1]}
          color="#00d4aa"
        />
        <Lightformer
          intensity={1}
          rotation-y={Math.PI / 2}
          position={[-5, 1, -1]}
          scale={[20, 0.1, 1]}
          color="#0066ff"
        />
        <Lightformer
          intensity={0.5}
          rotation-y={-Math.PI / 2}
          position={[10, 1, 0]}
          scale={[20, 1, 1]}
          color="#c9a962"
        />
      </Environment>

      {/* Reflective Floor */}
      <ReflectiveGround />

      {/* Ambient Particles */}
      <Sparkles
        count={100}
        scale={40}
        size={2}
        speed={0.3}
        opacity={0.3}
        color="#00d4aa"
      />

      {/* Scene Graph */}
      <SceneGraph
        node={scene.rootNode}
        floorNavigation={floorNavigation}
        roomNavigation={roomNavigation}
        interaction={interaction}
        onDeviceClick={onDeviceClick}
        onRoomClick={onRoomClick}
        onFloorClick={onFloorClick}
      />

      {/* State Visualizations */}
      <StateVisualizations />
    </>
  );
};

// ============================================================================
// Premium Lighting Setup
// ============================================================================

const LuxuryLighting: React.FC = () => {
  const mainLightRef = useRef<THREE.DirectionalLight>(null);

  // Subtle animation for main light
  useFrame(({ clock }) => {
    if (mainLightRef.current) {
      mainLightRef.current.intensity = 1.2 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <>
      {/* Ambient - very subtle */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      {/* Key Light - warm architectural */}
      <directionalLight
        ref={mainLightRef}
        position={[15, 25, 15]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* Fill Light - cool blue */}
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.4}
        color="#4169e1"
      />

      {/* Rim Light - teal accent */}
      <directionalLight
        position={[0, 5, -15]}
        intensity={0.3}
        color="#00d4aa"
      />

      {/* Ground bounce light */}
      <hemisphereLight
        color="#1a1a2e"
        groundColor="#0a0a12"
        intensity={0.3}
      />

      {/* Accent point lights */}
      <pointLight
        position={[10, 2, 0]}
        intensity={0.5}
        color="#00d4aa"
        distance={15}
        decay={2}
      />
      <pointLight
        position={[-10, 2, 5]}
        intensity={0.3}
        color="#c9a962"
        distance={15}
        decay={2}
      />
    </>
  );
};

// ============================================================================
// Reflective Ground Plane
// ============================================================================

const ReflectiveGround: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={15}
        roughness={0.9}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050508"
        metalness={0.8}
        mirror={0.5}
      />
    </mesh>
  );
};

// ============================================================================
// Camera Controller
// ============================================================================

interface CameraControllerProps {
  camera: ReturnType<typeof useSceneStore>['camera'];
}

const CameraController: React.FC<CameraControllerProps> = ({ camera }) => {
  const { setCamera } = useSceneStore();
  const controlsRef = useRef<any>(null);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={camera.fov}
        near={0.1}
        far={1000}
      />

      <OrbitControls
        ref={controlsRef}
        target={[camera.target.x, camera.target.y, camera.target.z]}
        minDistance={camera.constraints.minDistance}
        maxDistance={camera.constraints.maxDistance}
        minPolarAngle={camera.constraints.minPolarAngle}
        maxPolarAngle={camera.constraints.maxPolarAngle}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
        panSpeed={0.4}
        zoomSpeed={0.6}
        enablePan
        screenSpacePanning
        onChange={() => {
          if (controlsRef.current) {
            const { x, y, z } = controlsRef.current.object.position;
            setCamera({ position: { x, y, z } });
          }
        }}
      />
    </>
  );
};

// ============================================================================
// Luxury Post Processing
// ============================================================================

interface LuxuryPostProcessingProps {
  quality: QualityLevel;
}

const LuxuryPostProcessing: React.FC<LuxuryPostProcessingProps> = ({ quality }) => {
  const settings = getQualitySettings(quality);

  return (
    <EffectComposer multisampling={settings.antialias ? 8 : 0}>
      {/* Bloom - key for luxury glow effect */}
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />

      {/* SSAO - subtle depth in corners */}
      {settings.ssao && (
        <SSAO
          radius={0.4}
          intensity={30}
          luminanceInfluence={0.6}
          samples={settings.ssaoSamples}
          worldDistanceThreshold={1}
          worldDistanceFalloff={0.1}
          worldProximityThreshold={0.5}
          worldProximityFalloff={0.5}
        />
      )}

      {/* Depth of Field - cinematic */}
      {settings.dof && (
        <DepthOfField
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={4}
        />
      )}

      {/* Chromatic Aberration - subtle edge effect */}
      <ChromaticAberration
        offset={[0.0005, 0.0005]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.5}
      />

      {/* Vignette - darker edges */}
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Film grain - subtle texture */}
      <Noise
        opacity={0.03}
        blendFunction={BlendFunction.OVERLAY}
      />

      {/* Tone mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};

// ============================================================================
// Scene Graph Renderer
// ============================================================================

interface SceneGraphProps {
  node: SceneNode;
  floorNavigation: ReturnType<typeof useSceneStore>['floorNavigation'];
  roomNavigation: ReturnType<typeof useSceneStore>['roomNavigation'];
  interaction: ReturnType<typeof useSceneStore>['interaction'];
  onDeviceClick?: (deviceId: DeviceId) => void;
  onRoomClick?: (roomId: RoomId) => void;
  onFloorClick?: (floorId: FloorId) => void;
}

const SceneGraph: React.FC<SceneGraphProps> = ({
  node,
  floorNavigation,
  roomNavigation,
  interaction,
  onDeviceClick,
  onRoomClick,
  onFloorClick,
}) => {
  const { selectNode, setHoveredNode } = useSceneStore();

  const isSelected = interaction.selectedNodes.includes(node.id);
  const isHovered = interaction.hoveredNode === node.id;

  const { visible, opacity } = calculateNodeVisibility(
    node,
    floorNavigation,
    roomNavigation
  );

  if (!visible) return null;

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();

    if (node.type === 'room' && onRoomClick) {
      onRoomClick(node.metadata.roomId as RoomId);
    } else if (node.type === 'floor' && onFloorClick) {
      onFloorClick(node.metadata.floorId as FloorId);
    } else if (node.type === 'device' && onDeviceClick) {
      onDeviceClick(node.metadata.deviceId as DeviceId);
    }

    selectNode(node.id);
  };

  return (
    <group
      position={[
        node.transform.position.x,
        node.transform.position.y,
        node.transform.position.z,
      ]}
      rotation={[
        node.transform.rotation.x,
        node.transform.rotation.y,
        node.transform.rotation.z,
      ]}
      scale={[
        node.transform.scale.x,
        node.transform.scale.y,
        node.transform.scale.z,
      ]}
    >
      <NodeContent
        node={node}
        opacity={opacity}
        isSelected={isSelected}
        isHovered={isHovered}
        interactive={node.interactive}
        onClick={handleClick}
        onPointerOver={() => setHoveredNode(node.id)}
        onPointerOut={() => setHoveredNode(null)}
      />

      {node.children.map(child => (
        <SceneGraph
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
// Node Content Renderer
// ============================================================================

interface NodeContentProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  interactive: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const NodeContent: React.FC<NodeContentProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
  interactive,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  switch (node.type) {
    case 'room':
      return (
        <PBRRoomMesh
          node={node}
          opacity={opacity}
          isSelected={isSelected}
          isHovered={isHovered}
          interactive={interactive}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        />
      );

    case 'device':
      return (
        <PBRDeviceMesh
          node={node}
          opacity={opacity}
          isSelected={isSelected}
          isHovered={isHovered}
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        />
      );

    case 'floor':
      return (
        <PBRFloorMesh
          node={node}
          opacity={opacity}
          isSelected={isSelected}
          isHovered={isHovered}
        />
      );

    default:
      return null;
  }
};

// ============================================================================
// PBR Room Mesh
// ============================================================================

interface PBRRoomMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  interactive: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const PBRRoomMesh: React.FC<PBRRoomMeshProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
  interactive,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const deviceStates = useSceneStore(state => state.deviceStates);
  const roomId = node.metadata.roomId as RoomId;

  // Animate selection glow
  useFrame(({ clock }) => {
    if (meshRef.current && (isSelected || isHovered)) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 3) * 0.1;
    }
  });

  const roomColor = getRoomColor(roomId, deviceStates);

  return (
    <group>
      {/* Room floor - PBR material */}
      <mesh
        ref={meshRef}
        receiveShadow
        castShadow
        onClick={interactive ? onClick : undefined}
        onPointerOver={interactive ? onPointerOver : undefined}
        onPointerOut={interactive ? onPointerOut : undefined}
      >
        <boxGeometry args={[5, 0.15, 5]} />
        <meshStandardMaterial
          color={roomColor}
          transparent
          opacity={opacity * 0.9}
          roughness={0.4}
          metalness={0.1}
          envMapIntensity={0.8}
          emissive={isSelected ? '#00d4aa' : isHovered ? '#0066ff' : '#000000'}
          emissiveIntensity={isSelected || isHovered ? 0.2 : 0}
        />
      </mesh>

      {/* Room walls - glass-like material */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[5, 3, 5]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          transparent
          opacity={opacity * 0.15}
          roughness={0.1}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={0.5}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Edge glow for selected/hovered */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[5.1, 0.02, 5.1]} />
          <meshBasicMaterial
            color={isSelected ? '#00d4aa' : '#0066ff'}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Room label */}
      <Float speed={2} floatIntensity={0.3}>
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={15}
          style={{
            opacity: opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <span
              style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {node.name}
            </span>
          </div>
        </Html>
      </Float>
    </group>
  );
};

// ============================================================================
// PBR Device Mesh
// ============================================================================

interface PBRDeviceMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const PBRDeviceMesh: React.FC<PBRDeviceMeshProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const deviceStates = useSceneStore(state => state.deviceStates);
  const deviceId = node.metadata.deviceId as DeviceId;
  const deviceState = deviceStates.get(deviceId);

  const isOn = deviceState?.values?.on === true;
  const color = isOn ? '#00d4aa' : '#3a3a5c';

  // Animate glow
  useFrame(({ clock }) => {
    if (glowRef.current && isOn) {
      glowRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4) * 0.1);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(clock.elapsedTime * 4) * 0.15;
    }
  });

  return (
    <Float speed={3} floatIntensity={isOn ? 0.2 : 0.05}>
      <group>
        {/* Device sphere - metallic PBR */}
        <mesh
          ref={meshRef}
          castShadow
          onClick={onClick}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            roughness={0.2}
            metalness={0.8}
            envMapIntensity={1}
            emissive={color}
            emissiveIntensity={isOn ? 0.5 : 0.05}
          />
        </mesh>

        {/* Outer glow when on */}
        {isOn && (
          <mesh ref={glowRef} scale={1.5}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.3}
              side={THREE.BackSide}
            />
          </mesh>
        )}

        {/* Selection ring */}
        {(isSelected || isHovered) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
            <ringGeometry args={[0.35, 0.4, 32]} />
            <meshBasicMaterial
              color={isSelected ? '#00d4aa' : '#0066ff'}
              transparent
              opacity={0.8}
            />
          </mesh>
        )}
      </group>
    </Float>
  );
};

// ============================================================================
// PBR Floor Mesh
// ============================================================================

interface PBRFloorMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
}

const PBRFloorMesh: React.FC<PBRFloorMeshProps> = ({
  node,
  opacity,
}) => {
  return (
    <mesh receiveShadow position={[0, -0.05, 0]}>
      <boxGeometry args={[25, 0.1, 25]} />
      <meshStandardMaterial
        color="#12121a"
        transparent
        opacity={opacity * 0.8}
        roughness={0.7}
        metalness={0.2}
        envMapIntensity={0.3}
      />
    </mesh>
  );
};

// ============================================================================
// State Visualizations
// ============================================================================

const StateVisualizations: React.FC = () => {
  const activeVisualizations = useSceneStore(state => state.activeVisualizations);

  return (
    <group>
      {activeVisualizations.map((viz, index) => (
        <VisualizationRenderer key={`${viz.type}-${index}`} visualization={viz} />
      ))}
    </group>
  );
};

interface VisualizationRendererProps {
  visualization: ReturnType<typeof useSceneStore>['activeVisualizations'][0];
}

const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({ visualization }) => {
  switch (visualization.type) {
    case 'temperature_gradient':
      return <TemperatureGradientVisualization config={visualization.config} />;
    case 'occupancy_heatmap':
      return <OccupancyHeatmapVisualization config={visualization.config} />;
    default:
      return null;
  }
};

const TemperatureGradientVisualization: React.FC<{ config: any }> = () => null;
const OccupancyHeatmapVisualization: React.FC<{ config: any }> = () => null;

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
// Loading & Empty States
// ============================================================================

const LoadingIndicator: React.FC = () => (
  <Html center>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '32px',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#00d4aa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
        Loading Digital Twin...
      </span>
    </div>
  </Html>
);

const EmptyScene: React.FC = () => (
  <>
    <ambientLight intensity={0.3} />
    <Stars radius={100} depth={50} count={3000} factor={4} fade speed={1} />
    <Html center>
      <div
        style={{
          padding: '32px 48px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>
          No residence loaded
        </span>
      </div>
    </Html>
  </>
);

// ============================================================================
// Helper Functions
// ============================================================================

function getQualitySettings(quality: QualityLevel) {
  switch (quality) {
    case 'low':
      return {
        dpr: [0.5, 1] as [number, number],
        shadows: false,
        antialias: false,
        postProcessing: false,
        bloomResolution: 128,
        ssao: false,
        ssaoSamples: 8,
        dof: false,
      };
    case 'medium':
      return {
        dpr: [1, 1.5] as [number, number],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 256,
        ssao: false,
        ssaoSamples: 16,
        dof: false,
      };
    case 'high':
      return {
        dpr: [1, 2] as [number, number],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 512,
        ssao: true,
        ssaoSamples: 32,
        dof: true,
      };
    case 'ultra':
      return {
        dpr: [2, 2] as [number, number],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 1024,
        ssao: true,
        ssaoSamples: 64,
        dof: true,
      };
  }
}

function calculateNodeVisibility(
  node: SceneNode,
  floorNavigation: ReturnType<typeof useSceneStore>['floorNavigation'],
  roomNavigation: ReturnType<typeof useSceneStore>['roomNavigation']
): { visible: boolean; opacity: number } {
  if (!node.visible) {
    return { visible: false, opacity: 0 };
  }

  if (
    floorNavigation.isolateFloor &&
    node.type === 'floor' &&
    node.metadata.floorId !== floorNavigation.currentFloor
  ) {
    return { visible: true, opacity: floorNavigation.floorOpacity };
  }

  if (roomNavigation.currentRoom !== null) {
    if (node.type === 'room') {
      if (node.metadata.roomId === roomNavigation.currentRoom) {
        return { visible: true, opacity: 1 };
      }
      return {
        visible: roomNavigation.showNeighbors,
        opacity: roomNavigation.neighborOpacity,
      };
    }
  }

  return { visible: true, opacity: 1 };
}

function getRoomColor(
  roomId: RoomId,
  deviceStates: Map<DeviceId, any>
): string {
  return '#1a1a2e';
}

export default DigitalTwin;
