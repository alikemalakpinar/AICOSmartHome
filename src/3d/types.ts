/**
 * AICO Smart Home - 3D Digital Twin Types
 *
 * Types for the GPU-accelerated 3D home visualization.
 */

import type { Vector3D, Quaternion, RoomId, FloorId, DeviceId, ResidenceId } from '@/types/core';

// ============================================================================
// Scene Types
// ============================================================================

export interface Scene3D {
  id: string;
  residenceId: ResidenceId;
  rootNode: SceneNode;
  camera: CameraState;
  lighting: LightingState;
  environment: EnvironmentState;
  postProcessing: PostProcessingConfig;
}

export interface SceneNode {
  id: string;
  type: NodeType;
  name: string;
  transform: Transform3D;
  children: SceneNode[];
  visible: boolean;
  interactive: boolean;
  metadata: Record<string, unknown>;
}

export type NodeType =
  | 'group'
  | 'residence'
  | 'floor'
  | 'room'
  | 'device'
  | 'furniture'
  | 'decoration'
  | 'effect'
  | 'overlay';

export interface Transform3D {
  position: Vector3D;
  rotation: Quaternion;
  scale: Vector3D;
}

// ============================================================================
// Camera Types
// ============================================================================

export interface CameraState {
  position: Vector3D;
  target: Vector3D;
  up: Vector3D;
  fov: number;
  near: number;
  far: number;
  mode: CameraMode;
  constraints: CameraConstraints;
}

export type CameraMode =
  | 'orbit'       // Free rotation around target
  | 'pan'         // Pan/translate view
  | 'fly'         // First-person fly-through
  | 'floorplan'   // Top-down orthographic
  | 'room'        // Focused on single room
  | 'device'      // Focused on device
  | 'follow'      // Following a user
  | 'cinematic';  // Automated tour

export interface CameraConstraints {
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  min: Vector3D;
  max: Vector3D;
}

export interface CameraTransition {
  from: CameraState;
  to: CameraState;
  duration: number;
  easing: EasingFunction;
}

export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring';

// ============================================================================
// Lighting Types
// ============================================================================

export interface LightingState {
  ambientLight: AmbientLight;
  directionalLights: DirectionalLight[];
  pointLights: PointLight[];
  spotLights: SpotLight[];
  areaLights: AreaLight[];
  environmentMap?: string;
  exposure: number;
  toneMapping: ToneMapping;
}

export interface AmbientLight {
  color: string;
  intensity: number;
}

export interface DirectionalLight {
  id: string;
  color: string;
  intensity: number;
  direction: Vector3D;
  castShadow: boolean;
  shadowConfig?: ShadowConfig;
}

export interface PointLight {
  id: string;
  color: string;
  intensity: number;
  position: Vector3D;
  distance: number;
  decay: number;
  castShadow: boolean;
}

export interface SpotLight {
  id: string;
  color: string;
  intensity: number;
  position: Vector3D;
  target: Vector3D;
  angle: number;
  penumbra: number;
  distance: number;
  decay: number;
  castShadow: boolean;
  shadowConfig?: ShadowConfig;
}

export interface AreaLight {
  id: string;
  color: string;
  intensity: number;
  position: Vector3D;
  rotation: Quaternion;
  width: number;
  height: number;
}

export interface ShadowConfig {
  mapSize: number;
  bias: number;
  normalBias: number;
  radius: number;
}

export type ToneMapping =
  | 'linear'
  | 'reinhard'
  | 'cineon'
  | 'aces'
  | 'filmic';

// ============================================================================
// Environment Types
// ============================================================================

export interface EnvironmentState {
  background: BackgroundConfig;
  fog?: FogConfig;
  reflection: ReflectionConfig;
  skybox?: SkyboxConfig;
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'texture' | 'skybox';
  value: string | GradientConfig;
}

export interface GradientConfig {
  topColor: string;
  bottomColor: string;
}

export interface FogConfig {
  type: 'linear' | 'exponential';
  color: string;
  near?: number;
  far?: number;
  density?: number;
}

export interface ReflectionConfig {
  enabled: boolean;
  resolution: number;
  maxBounces: number;
}

export interface SkyboxConfig {
  type: 'hdri' | 'procedural' | 'cubemap';
  url?: string;
  sunPosition?: Vector3D;
  turbidity?: number;
  rayleigh?: number;
}

// ============================================================================
// Post Processing Types
// ============================================================================

export interface PostProcessingConfig {
  enabled: boolean;
  effects: PostProcessingEffect[];
}

export type PostProcessingEffect =
  | BloomEffect
  | SSAOEffect
  | DepthOfFieldEffect
  | VignetteEffect
  | ChromaticAberrationEffect
  | ToneMappingEffect;

export interface BloomEffect {
  type: 'bloom';
  enabled: boolean;
  intensity: number;
  threshold: number;
  radius: number;
}

export interface SSAOEffect {
  type: 'ssao';
  enabled: boolean;
  radius: number;
  intensity: number;
  samples: number;
}

export interface DepthOfFieldEffect {
  type: 'dof';
  enabled: boolean;
  focusDistance: number;
  focalLength: number;
  aperture: number;
}

export interface VignetteEffect {
  type: 'vignette';
  enabled: boolean;
  offset: number;
  darkness: number;
}

export interface ChromaticAberrationEffect {
  type: 'chromatic';
  enabled: boolean;
  offset: number;
}

export interface ToneMappingEffect {
  type: 'tonemapping';
  enabled: boolean;
  mode: ToneMapping;
  exposure: number;
}

// ============================================================================
// Interaction Types
// ============================================================================

export interface InteractionState {
  mode: InteractionMode;
  selectedNodes: string[];
  hoveredNode?: string;
  dragState?: DragState;
  gestureState?: GestureState;
}

export type InteractionMode =
  | 'view'      // Camera manipulation only
  | 'select'    // Object selection
  | 'control'   // Device control
  | 'measure'   // Distance measurement
  | 'annotate'; // Add annotations

export interface DragState {
  startPosition: Vector3D;
  currentPosition: Vector3D;
  nodeId: string;
  type: 'move' | 'rotate' | 'scale';
}

export interface GestureState {
  type: GestureType;
  touches: TouchPoint[];
  startTime: number;
  velocity: Vector3D;
}

export type GestureType =
  | 'tap'
  | 'double_tap'
  | 'long_press'
  | 'pan'
  | 'pinch'
  | 'rotate'
  | 'swipe';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  force?: number;
}

// ============================================================================
// Overlay Types
// ============================================================================

export interface OverlayConfig {
  id: string;
  type: OverlayType;
  anchor: AnchorConfig;
  content: OverlayContent;
  visible: boolean;
  interactive: boolean;
  zIndex: number;
}

export type OverlayType =
  | 'label'
  | 'icon'
  | 'status'
  | 'control'
  | 'info'
  | 'alert'
  | 'menu';

export interface AnchorConfig {
  type: 'world' | 'screen' | 'node';
  position?: Vector3D;
  nodeId?: string;
  offset?: Vector3D;
  billboarding: boolean;
}

export type OverlayContent =
  | TextContent
  | IconContent
  | DeviceStatusContent
  | DeviceControlContent
  | InfoPanelContent;

export interface TextContent {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
}

export interface IconContent {
  type: 'icon';
  icon: string;
  size: number;
  color: string;
}

export interface DeviceStatusContent {
  type: 'device_status';
  deviceId: DeviceId;
  showLabel: boolean;
  showValue: boolean;
}

export interface DeviceControlContent {
  type: 'device_control';
  deviceId: DeviceId;
  compact: boolean;
}

export interface InfoPanelContent {
  type: 'info_panel';
  title: string;
  fields: InfoField[];
}

export interface InfoField {
  label: string;
  value: string;
  icon?: string;
}

// ============================================================================
// Animation Types
// ============================================================================

export interface AnimationClip {
  id: string;
  name: string;
  duration: number;
  tracks: AnimationTrack[];
  loop: boolean;
}

export interface AnimationTrack {
  nodeId: string;
  property: string;
  keyframes: Keyframe[];
  interpolation: InterpolationType;
}

export interface Keyframe {
  time: number;
  value: number | Vector3D | Quaternion;
  easing?: EasingFunction;
}

export type InterpolationType =
  | 'linear'
  | 'step'
  | 'bezier';

// ============================================================================
// State Visualization Types
// ============================================================================

export interface StateVisualization {
  type: VisualizationType;
  config: VisualizationConfig;
}

export type VisualizationType =
  | 'temperature_gradient'
  | 'occupancy_heatmap'
  | 'light_intensity'
  | 'air_quality'
  | 'security_zones'
  | 'energy_flow';

export type VisualizationConfig =
  | TemperatureGradientConfig
  | OccupancyHeatmapConfig
  | LightIntensityConfig
  | AirQualityConfig
  | SecurityZonesConfig
  | EnergyFlowConfig;

export interface TemperatureGradientConfig {
  type: 'temperature_gradient';
  minTemp: number;
  maxTemp: number;
  colorScale: string[];
  opacity: number;
}

export interface OccupancyHeatmapConfig {
  type: 'occupancy_heatmap';
  timeWindow: number; // minutes
  resolution: number;
  colorScale: string[];
}

export interface LightIntensityConfig {
  type: 'light_intensity';
  showLux: boolean;
  showColor: boolean;
  emissiveStrength: number;
}

export interface AirQualityConfig {
  type: 'air_quality';
  metric: 'co2' | 'pm25' | 'voc' | 'combined';
  thresholds: { value: number; color: string }[];
}

export interface SecurityZonesConfig {
  type: 'security_zones';
  showZones: boolean;
  showCameras: boolean;
  showMotion: boolean;
  highlightBreaches: boolean;
}

export interface EnergyFlowConfig {
  type: 'energy_flow';
  showProduction: boolean;
  showConsumption: boolean;
  animated: boolean;
  particleCount: number;
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavigationTarget {
  type: 'residence' | 'floor' | 'room' | 'device' | 'position';
  id?: string;
  position?: Vector3D;
  camera?: Partial<CameraState>;
  transition?: CameraTransition;
}

export interface FloorNavigation {
  currentFloor: FloorId;
  isolateFloor: boolean;
  cutawayEnabled: boolean;
  cutawayHeight: number;
  floorOpacity: number;
}

export interface RoomNavigation {
  currentRoom: RoomId | null;
  focusMode: 'fit' | 'enter' | 'overview';
  showNeighbors: boolean;
  neighborOpacity: number;
}
