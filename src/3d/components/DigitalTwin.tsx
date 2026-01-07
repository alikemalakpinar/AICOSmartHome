/**
 * AICO Smart Home - Digital Twin Component
 *
 * Main 3D visualization component for the residence digital twin.
 */

import React, { Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Html,
  useGLTF,
  Bounds,
  useBounds,
} from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, Vignette } from '@react-three/postprocessing';
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
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  className,
  onDeviceClick,
  onRoomClick,
  onFloorClick,
}) => {
  const { scene, camera, quality, updatePerformanceMetrics } = useSceneStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qualitySettings = getQualitySettings(quality);

  return (
    <div className={`digital-twin-container ${className ?? ''}`}>
      <Canvas
        ref={canvasRef}
        shadows={qualitySettings.shadows}
        dpr={qualitySettings.dpr}
        gl={{
          antialias: qualitySettings.antialias,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <Suspense fallback={<LoadingIndicator />}>
          <SceneContent
            onDeviceClick={onDeviceClick}
            onRoomClick={onRoomClick}
            onFloorClick={onFloorClick}
          />
        </Suspense>

        {qualitySettings.postProcessing && (
          <PostProcessingEffects quality={quality} />
        )}

        <PerformanceMonitor onMetrics={updatePerformanceMetrics} />
      </Canvas>

      <OverlayContainer />
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

      {/* Lighting */}
      <SceneLighting />

      {/* Environment */}
      <Environment preset="apartment" />

      {/* Ground */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.5}
        scale={40}
        blur={1}
        far={10}
      />

      {/* Scene Graph */}
      <Bounds fit clip observe margin={1.2}>
        <SceneGraph
          node={scene.rootNode}
          floorNavigation={floorNavigation}
          roomNavigation={roomNavigation}
          interaction={interaction}
          onDeviceClick={onDeviceClick}
          onRoomClick={onRoomClick}
          onFloorClick={onFloorClick}
        />
      </Bounds>

      {/* State Visualizations */}
      <StateVisualizations />

      {/* Grid Helper (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <gridHelper args={[50, 50, '#333', '#222']} />
      )}
    </>
  );
};

// ============================================================================
// Camera Controller
// ============================================================================

interface CameraControllerProps {
  camera: ReturnType<typeof useSceneStore>['camera'];
}

const CameraController: React.FC<CameraControllerProps> = ({ camera }) => {
  const { setCamera, setCameraMode } = useSceneStore();
  const controlsRef = useRef<any>(null);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={camera.fov}
        near={camera.near}
        far={camera.far}
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
        rotateSpeed={0.5}
        panSpeed={0.5}
        zoomSpeed={0.5}
        onChange={(e) => {
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
// Scene Lighting
// ============================================================================

const SceneLighting: React.FC = () => {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.3} color="#ffffff" />

      {/* Key Light (Sun) */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        color="#fffaf0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill Light */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
        color="#b0c4de"
      />

      {/* Rim Light */}
      <directionalLight
        position={[0, 5, -10]}
        intensity={0.2}
        color="#4169e1"
      />
    </>
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

  // Calculate visibility and opacity based on navigation state
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
      {/* Node Content */}
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

      {/* Children */}
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
        <RoomMesh
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
        <DeviceMesh
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
        <FloorMesh
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
// Room Mesh
// ============================================================================

interface RoomMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  interactive: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const RoomMesh: React.FC<RoomMeshProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
  interactive,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const deviceStates = useSceneStore(state => state.deviceStates);
  const roomId = node.metadata.roomId as RoomId;

  // Get room color based on state (temperature, etc.)
  const roomColor = getRoomColor(roomId, deviceStates);

  return (
    <group>
      {/* Room floor */}
      <mesh
        receiveShadow
        onClick={interactive ? onClick : undefined}
        onPointerOver={interactive ? onPointerOver : undefined}
        onPointerOut={interactive ? onPointerOut : undefined}
      >
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial
          color={roomColor}
          transparent
          opacity={opacity * 0.8}
          emissive={isSelected ? '#00ff88' : isHovered ? '#4488ff' : '#000000'}
          emissiveIntensity={isSelected || isHovered ? 0.2 : 0}
        />
      </mesh>

      {/* Room walls (wireframe outline) */}
      <mesh>
        <boxGeometry args={[5, 3, 5]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={opacity * 0.1}
          wireframe
        />
      </mesh>

      {/* Room label */}
      <Html
        position={[0, 2, 0]}
        center
        style={{
          opacity: opacity,
          pointerEvents: 'none',
        }}
      >
        <div className="room-label">
          <span className="room-name">{node.name}</span>
        </div>
      </Html>
    </group>
  );
};

// ============================================================================
// Device Mesh
// ============================================================================

interface DeviceMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (e: THREE.Event) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const DeviceMesh: React.FC<DeviceMeshProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const deviceStates = useSceneStore(state => state.deviceStates);
  const deviceId = node.metadata.deviceId as DeviceId;
  const deviceState = deviceStates.get(deviceId);

  const isOn = deviceState?.values?.on === true;
  const color = isOn ? '#00ff88' : '#666666';

  return (
    <group>
      <mesh
        castShadow
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={isSelected ? '#ffffff' : isHovered ? '#4488ff' : color}
          emissiveIntensity={isOn ? 0.5 : 0.1}
        />
      </mesh>

      {/* Device indicator ring */}
      {isOn && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

// ============================================================================
// Floor Mesh
// ============================================================================

interface FloorMeshProps {
  node: SceneNode;
  opacity: number;
  isSelected: boolean;
  isHovered: boolean;
}

const FloorMesh: React.FC<FloorMeshProps> = ({
  node,
  opacity,
  isSelected,
  isHovered,
}) => {
  return (
    <mesh receiveShadow position={[0, -0.05, 0]}>
      <boxGeometry args={[20, 0.1, 20]} />
      <meshStandardMaterial
        color="#2a2a3e"
        transparent
        opacity={opacity * 0.5}
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
  // Render different visualization types
  switch (visualization.type) {
    case 'temperature_gradient':
      return <TemperatureGradientVisualization config={visualization.config} />;
    case 'occupancy_heatmap':
      return <OccupancyHeatmapVisualization config={visualization.config} />;
    default:
      return null;
  }
};

const TemperatureGradientVisualization: React.FC<{ config: any }> = ({ config }) => {
  // Temperature gradient overlay implementation
  return null;
};

const OccupancyHeatmapVisualization: React.FC<{ config: any }> = ({ config }) => {
  // Occupancy heatmap implementation
  return null;
};

// ============================================================================
// Post Processing Effects
// ============================================================================

interface PostProcessingEffectsProps {
  quality: QualityLevel;
}

const PostProcessingEffects: React.FC<PostProcessingEffectsProps> = ({ quality }) => {
  const settings = getQualitySettings(quality);

  return (
    <EffectComposer>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        height={settings.bloomResolution}
      />
      {settings.ssao && (
        <SSAO
          radius={0.5}
          intensity={0.5}
          luminanceInfluence={0.5}
          samples={settings.ssaoSamples}
        />
      )}
      <Vignette offset={0.3} darkness={0.4} />
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

  useFrame((state, delta) => {
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
    <div className="loading-indicator">
      <div className="spinner" />
      <span>Loading 3D Model...</span>
    </div>
  </Html>
);

const EmptyScene: React.FC = () => (
  <>
    <ambientLight intensity={0.5} />
    <Html center>
      <div className="empty-scene">
        <span>No residence loaded</span>
      </div>
    </Html>
  </>
);

// ============================================================================
// Overlay Container
// ============================================================================

const OverlayContainer: React.FC = () => {
  const overlays = useSceneStore(state => state.overlays);

  return (
    <div className="overlay-container">
      {Array.from(overlays.values()).map(overlay => (
        <OverlayRenderer key={overlay.id} overlay={overlay} />
      ))}
    </div>
  );
};

interface OverlayRendererProps {
  overlay: ReturnType<typeof useSceneStore>['overlays'] extends Map<string, infer V> ? V : never;
}

const OverlayRenderer: React.FC<OverlayRendererProps> = ({ overlay }) => {
  if (!overlay.visible) return null;

  // Render overlay based on type
  return (
    <div
      className={`overlay overlay-${overlay.type}`}
      style={{ zIndex: overlay.zIndex }}
    >
      {/* Overlay content rendering */}
    </div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function getQualitySettings(quality: QualityLevel) {
  switch (quality) {
    case 'low':
      return {
        dpr: [0.5, 1],
        shadows: false,
        antialias: false,
        postProcessing: false,
        bloomResolution: 128,
        ssao: false,
        ssaoSamples: 8,
      };
    case 'medium':
      return {
        dpr: [1, 1.5],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 256,
        ssao: false,
        ssaoSamples: 16,
      };
    case 'high':
      return {
        dpr: [1, 2],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 512,
        ssao: true,
        ssaoSamples: 32,
      };
    case 'ultra':
      return {
        dpr: [2, 2],
        shadows: true,
        antialias: true,
        postProcessing: true,
        bloomResolution: 1024,
        ssao: true,
        ssaoSamples: 64,
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

  // Floor isolation
  if (
    floorNavigation.isolateFloor &&
    node.type === 'floor' &&
    node.metadata.floorId !== floorNavigation.currentFloor
  ) {
    return { visible: true, opacity: floorNavigation.floorOpacity };
  }

  // Room focus
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
  // Default color - could be enhanced based on room state
  return '#3a3a5c';
}

export default DigitalTwin;
