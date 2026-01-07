/**
 * AICO Smart Home - 3D Scene Manager
 *
 * Core scene management for the Digital Twin visualization.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ResidenceId, FloorId, RoomId, DeviceId, Vector3D, Quaternion } from '@/types/core';
import type { Residence, Floor, Room } from '@/types/core';
import type { Device, DeviceState } from '@/types/devices';
import type {
  Scene3D,
  SceneNode,
  Transform3D,
  CameraState,
  CameraMode,
  LightingState,
  InteractionState,
  InteractionMode,
  OverlayConfig,
  StateVisualization,
  NavigationTarget,
  FloorNavigation,
  RoomNavigation,
  PostProcessingConfig,
  EasingFunction,
} from './types';

// ============================================================================
// Scene Store State
// ============================================================================

interface SceneState {
  // Scene Data
  scene: Scene3D | null;
  residenceData: Residence | null;

  // Navigation
  camera: CameraState;
  floorNavigation: FloorNavigation;
  roomNavigation: RoomNavigation;

  // Interaction
  interaction: InteractionState;

  // Overlays
  overlays: Map<string, OverlayConfig>;

  // Visualization
  activeVisualizations: StateVisualization[];

  // Device States (for real-time updates)
  deviceStates: Map<DeviceId, DeviceState>;

  // Performance
  quality: QualityLevel;
  fps: number;
  drawCalls: number;
}

export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';

// ============================================================================
// Scene Store Actions
// ============================================================================

interface SceneActions {
  // Scene Management
  loadScene(residence: Residence): void;
  unloadScene(): void;
  updateSceneNode(nodeId: string, transform: Partial<Transform3D>): void;

  // Camera Control
  setCamera(camera: Partial<CameraState>): void;
  setCameraMode(mode: CameraMode): void;
  animateCameraTo(target: NavigationTarget, duration?: number): Promise<void>;
  resetCamera(): void;

  // Floor Navigation
  setCurrentFloor(floorId: FloorId): void;
  toggleFloorIsolation(isolated: boolean): void;
  setCutawayHeight(height: number): void;

  // Room Navigation
  focusRoom(roomId: RoomId | null): void;
  enterRoom(roomId: RoomId): void;
  exitRoom(): void;

  // Device Focus
  focusDevice(deviceId: DeviceId): void;

  // Interaction
  setInteractionMode(mode: InteractionMode): void;
  selectNode(nodeId: string, addToSelection?: boolean): void;
  clearSelection(): void;
  setHoveredNode(nodeId: string | null): void;

  // Overlays
  addOverlay(overlay: OverlayConfig): void;
  removeOverlay(overlayId: string): void;
  updateOverlay(overlayId: string, config: Partial<OverlayConfig>): void;

  // Visualization
  addVisualization(visualization: StateVisualization): void;
  removeVisualization(type: StateVisualization['type']): void;
  clearVisualizations(): void;

  // Device State
  updateDeviceState(deviceId: DeviceId, state: DeviceState): void;

  // Quality
  setQuality(quality: QualityLevel): void;
  updatePerformanceMetrics(fps: number, drawCalls: number): void;
}

// ============================================================================
// Default States
// ============================================================================

const defaultCamera: CameraState = {
  position: { x: 10, y: 10, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  fov: 60,
  near: 0.1,
  far: 1000,
  mode: 'orbit',
  constraints: {
    minDistance: 2,
    maxDistance: 100,
    minPolarAngle: 0.1,
    maxPolarAngle: Math.PI - 0.1,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
  },
};

const defaultFloorNavigation: FloorNavigation = {
  currentFloor: '' as FloorId,
  isolateFloor: false,
  cutawayEnabled: false,
  cutawayHeight: 3,
  floorOpacity: 1,
};

const defaultRoomNavigation: RoomNavigation = {
  currentRoom: null,
  focusMode: 'fit',
  showNeighbors: true,
  neighborOpacity: 0.3,
};

const defaultInteraction: InteractionState = {
  mode: 'view',
  selectedNodes: [],
  hoveredNode: undefined,
};

// ============================================================================
// Scene Store
// ============================================================================

export const useSceneStore = create<SceneState & SceneActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    scene: null,
    residenceData: null,
    camera: defaultCamera,
    floorNavigation: defaultFloorNavigation,
    roomNavigation: defaultRoomNavigation,
    interaction: defaultInteraction,
    overlays: new Map(),
    activeVisualizations: [],
    deviceStates: new Map(),
    quality: 'high',
    fps: 60,
    drawCalls: 0,

    // Scene Management
    loadScene(residence: Residence) {
      const scene = buildSceneFromResidence(residence);
      set({
        scene,
        residenceData: residence,
        floorNavigation: {
          ...defaultFloorNavigation,
          currentFloor: residence.floors[0]?.id ?? ('' as FloorId),
        },
      });
    },

    unloadScene() {
      set({
        scene: null,
        residenceData: null,
        camera: defaultCamera,
        floorNavigation: defaultFloorNavigation,
        roomNavigation: defaultRoomNavigation,
        interaction: defaultInteraction,
        overlays: new Map(),
        activeVisualizations: [],
        deviceStates: new Map(),
      });
    },

    updateSceneNode(nodeId: string, transform: Partial<Transform3D>) {
      const { scene } = get();
      if (!scene) return;

      const updatedRoot = updateNodeInTree(scene.rootNode, nodeId, transform);
      set({ scene: { ...scene, rootNode: updatedRoot } });
    },

    // Camera Control
    setCamera(camera: Partial<CameraState>) {
      set(state => ({
        camera: { ...state.camera, ...camera },
      }));
    },

    setCameraMode(mode: CameraMode) {
      set(state => ({
        camera: { ...state.camera, mode },
      }));
    },

    async animateCameraTo(target: NavigationTarget, duration = 1000) {
      const { camera, residenceData } = get();

      const targetCamera = calculateTargetCamera(target, residenceData, camera);
      if (!targetCamera) return;

      // Animate camera
      await animateCamera(camera, targetCamera, duration, (newCamera) => {
        set({ camera: newCamera });
      });
    },

    resetCamera() {
      set({ camera: defaultCamera });
    },

    // Floor Navigation
    setCurrentFloor(floorId: FloorId) {
      set(state => ({
        floorNavigation: {
          ...state.floorNavigation,
          currentFloor: floorId,
        },
      }));
    },

    toggleFloorIsolation(isolated: boolean) {
      set(state => ({
        floorNavigation: {
          ...state.floorNavigation,
          isolateFloor: isolated,
        },
      }));
    },

    setCutawayHeight(height: number) {
      set(state => ({
        floorNavigation: {
          ...state.floorNavigation,
          cutawayEnabled: true,
          cutawayHeight: height,
        },
      }));
    },

    // Room Navigation
    focusRoom(roomId: RoomId | null) {
      set(state => ({
        roomNavigation: {
          ...state.roomNavigation,
          currentRoom: roomId,
          focusMode: 'fit',
        },
      }));

      if (roomId) {
        get().animateCameraTo({ type: 'room', id: roomId });
      }
    },

    enterRoom(roomId: RoomId) {
      set(state => ({
        roomNavigation: {
          ...state.roomNavigation,
          currentRoom: roomId,
          focusMode: 'enter',
        },
        camera: {
          ...state.camera,
          mode: 'fly',
        },
      }));

      get().animateCameraTo({
        type: 'room',
        id: roomId,
        camera: { mode: 'fly' },
      });
    },

    exitRoom() {
      const { roomNavigation, floorNavigation } = get();
      if (!roomNavigation.currentRoom) return;

      set(state => ({
        roomNavigation: {
          ...state.roomNavigation,
          currentRoom: null,
          focusMode: 'overview',
        },
        camera: {
          ...state.camera,
          mode: 'orbit',
        },
      }));

      get().animateCameraTo({ type: 'floor', id: floorNavigation.currentFloor });
    },

    // Device Focus
    focusDevice(deviceId: DeviceId) {
      get().animateCameraTo({ type: 'device', id: deviceId });
    },

    // Interaction
    setInteractionMode(mode: InteractionMode) {
      set(state => ({
        interaction: { ...state.interaction, mode },
      }));
    },

    selectNode(nodeId: string, addToSelection = false) {
      set(state => {
        const selectedNodes = addToSelection
          ? [...state.interaction.selectedNodes, nodeId]
          : [nodeId];

        return {
          interaction: { ...state.interaction, selectedNodes },
        };
      });
    },

    clearSelection() {
      set(state => ({
        interaction: { ...state.interaction, selectedNodes: [] },
      }));
    },

    setHoveredNode(nodeId: string | null) {
      set(state => ({
        interaction: { ...state.interaction, hoveredNode: nodeId ?? undefined },
      }));
    },

    // Overlays
    addOverlay(overlay: OverlayConfig) {
      set(state => {
        const overlays = new Map(state.overlays);
        overlays.set(overlay.id, overlay);
        return { overlays };
      });
    },

    removeOverlay(overlayId: string) {
      set(state => {
        const overlays = new Map(state.overlays);
        overlays.delete(overlayId);
        return { overlays };
      });
    },

    updateOverlay(overlayId: string, config: Partial<OverlayConfig>) {
      set(state => {
        const overlays = new Map(state.overlays);
        const existing = overlays.get(overlayId);
        if (existing) {
          overlays.set(overlayId, { ...existing, ...config });
        }
        return { overlays };
      });
    },

    // Visualization
    addVisualization(visualization: StateVisualization) {
      set(state => ({
        activeVisualizations: [
          ...state.activeVisualizations.filter(v => v.type !== visualization.type),
          visualization,
        ],
      }));
    },

    removeVisualization(type: StateVisualization['type']) {
      set(state => ({
        activeVisualizations: state.activeVisualizations.filter(v => v.type !== type),
      }));
    },

    clearVisualizations() {
      set({ activeVisualizations: [] });
    },

    // Device State
    updateDeviceState(deviceId: DeviceId, state: DeviceState) {
      set(store => {
        const deviceStates = new Map(store.deviceStates);
        deviceStates.set(deviceId, state);
        return { deviceStates };
      });
    },

    // Quality
    setQuality(quality: QualityLevel) {
      set({ quality });
    },

    updatePerformanceMetrics(fps: number, drawCalls: number) {
      set({ fps, drawCalls });
    },
  }))
);

// ============================================================================
// Helper Functions
// ============================================================================

function buildSceneFromResidence(residence: Residence): Scene3D {
  const rootNode = buildResidenceNode(residence);

  return {
    id: `scene-${residence.id}`,
    residenceId: residence.id,
    rootNode,
    camera: defaultCamera,
    lighting: buildDefaultLighting(),
    environment: {
      background: { type: 'gradient', value: { topColor: '#1a1a2e', bottomColor: '#16213e' } },
      reflection: { enabled: true, resolution: 512, maxBounces: 2 },
    },
    postProcessing: buildDefaultPostProcessing(),
  };
}

function buildResidenceNode(residence: Residence): SceneNode {
  return {
    id: `node-${residence.id}`,
    type: 'residence',
    name: residence.name,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    children: residence.floors.map(floor => buildFloorNode(floor)),
    visible: true,
    interactive: false,
    metadata: { residenceId: residence.id },
  };
}

function buildFloorNode(floor: Floor): SceneNode {
  return {
    id: `node-${floor.id}`,
    type: 'floor',
    name: floor.name,
    transform: {
      position: { x: 0, y: floor.elevation, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    children: floor.rooms.map(room => buildRoomNode(room)),
    visible: true,
    interactive: true,
    metadata: { floorId: floor.id, level: floor.level },
  };
}

function buildRoomNode(room: Room): SceneNode {
  return {
    id: `node-${room.id}`,
    type: 'room',
    name: room.name,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    children: [], // Device nodes would be added here
    visible: true,
    interactive: true,
    metadata: { roomId: room.id, roomType: room.type },
  };
}

function buildDefaultLighting(): LightingState {
  return {
    ambientLight: { color: '#ffffff', intensity: 0.3 },
    directionalLights: [
      {
        id: 'sun',
        color: '#fffaf0',
        intensity: 1,
        direction: { x: -1, y: -2, z: -1 },
        castShadow: true,
        shadowConfig: {
          mapSize: 2048,
          bias: -0.0001,
          normalBias: 0.02,
          radius: 1,
        },
      },
    ],
    pointLights: [],
    spotLights: [],
    areaLights: [],
    exposure: 1,
    toneMapping: 'aces',
  };
}

function buildDefaultPostProcessing(): PostProcessingConfig {
  return {
    enabled: true,
    effects: [
      { type: 'bloom', enabled: true, intensity: 0.5, threshold: 0.8, radius: 0.5 },
      { type: 'ssao', enabled: true, radius: 0.5, intensity: 0.5, samples: 32 },
      { type: 'vignette', enabled: true, offset: 0.3, darkness: 0.4 },
    ],
  };
}

function updateNodeInTree(
  node: SceneNode,
  nodeId: string,
  transform: Partial<Transform3D>
): SceneNode {
  if (node.id === nodeId) {
    return {
      ...node,
      transform: { ...node.transform, ...transform },
    };
  }

  return {
    ...node,
    children: node.children.map(child => updateNodeInTree(child, nodeId, transform)),
  };
}

function calculateTargetCamera(
  target: NavigationTarget,
  residence: Residence | null,
  currentCamera: CameraState
): CameraState | null {
  if (!residence) return null;

  switch (target.type) {
    case 'residence':
      return {
        ...currentCamera,
        position: { x: 20, y: 20, z: 20 },
        target: { x: 0, y: 0, z: 0 },
        mode: 'orbit',
      };

    case 'floor': {
      const floor = residence.floors.find(f => f.id === target.id);
      if (!floor) return null;
      return {
        ...currentCamera,
        position: { x: 0, y: floor.elevation + 15, z: 15 },
        target: { x: 0, y: floor.elevation, z: 0 },
        mode: 'orbit',
      };
    }

    case 'room': {
      // Find room across all floors
      for (const floor of residence.floors) {
        const room = floor.rooms.find(r => r.id === target.id);
        if (room) {
          const center = calculateRoomCenter(room);
          return {
            ...currentCamera,
            position: { x: center.x + 5, y: floor.elevation + 3, z: center.z + 5 },
            target: center,
            mode: target.camera?.mode ?? 'orbit',
          };
        }
      }
      return null;
    }

    case 'position':
      return target.position
        ? { ...currentCamera, target: target.position }
        : null;

    default:
      return null;
  }
}

function calculateRoomCenter(room: Room): Vector3D {
  const vertices = room.boundaries.vertices;
  if (vertices.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length,
    z: sum.z / vertices.length,
  };
}

async function animateCamera(
  from: CameraState,
  to: CameraState,
  duration: number,
  onUpdate: (camera: CameraState) => void
): Promise<void> {
  return new Promise(resolve => {
    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const current: CameraState = {
        ...to,
        position: lerpVector3D(from.position, to.position, eased),
        target: lerpVector3D(from.target, to.target, eased),
        fov: lerp(from.fov, to.fov, eased),
      };

      onUpdate(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector3D(a: Vector3D, b: Vector3D, t: number): Vector3D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
