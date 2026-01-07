/**
 * AICO Smart Home - Security & Surveillance Module Types
 *
 * Types for security, camera, and access control systems.
 */

import type { DeviceId, RoomId, ZoneId, UserId, ISOTimestamp } from '@/types/core';

// ============================================================================
// Alarm System Types
// ============================================================================

export type AlarmMode = 'disarmed' | 'armed_home' | 'armed_away' | 'armed_night' | 'armed_vacation';
export type AlarmState = 'idle' | 'pending' | 'triggered' | 'alarming';

export interface AlarmSystemState {
  mode: AlarmMode;
  state: AlarmState;
  zones: SecurityZone[];
  entryDelay: number; // seconds
  exitDelay: number;
  lastArmed?: ISOTimestamp;
  lastTriggered?: ISOTimestamp;
  triggeredBy?: DeviceId;
  sirenActive: boolean;
}

export interface SecurityZone {
  id: ZoneId;
  name: string;
  type: ZoneType;
  sensors: DeviceId[];
  bypassable: boolean;
  bypassed: boolean;
  triggered: boolean;
  activeInModes: AlarmMode[];
}

export type ZoneType =
  | 'perimeter'   // Doors, windows
  | 'interior'    // Motion sensors inside
  | 'fire'        // Smoke/heat detectors
  | 'flood'       // Water sensors
  | 'panic'       // Panic buttons
  | 'medical';    // Medical alert

// ============================================================================
// Camera Types
// ============================================================================

export interface CameraConfig {
  deviceId: DeviceId;
  name: string;
  location: string;
  roomId?: RoomId;
  type: CameraType;
  capabilities: CameraCapabilities;
  streamUrls: StreamUrls;
  recordingConfig: RecordingConfig;
}

export type CameraType = 'indoor' | 'outdoor' | 'doorbell' | 'ptz' | 'thermal';

export interface CameraCapabilities {
  ptz: boolean;
  nightVision: boolean;
  thermalImaging: boolean;
  twoWayAudio: boolean;
  motionDetection: boolean;
  personDetection: boolean;
  vehicleDetection: boolean;
  animalDetection: boolean;
  packageDetection: boolean;
  faceRecognition: boolean;
  lpr: boolean; // License Plate Recognition
}

export interface StreamUrls {
  live: string;
  liveLow: string; // Lower quality for grid view
  snapshot: string;
}

export interface RecordingConfig {
  enabled: boolean;
  mode: 'continuous' | 'motion' | 'schedule';
  retention: number; // days
  resolution: string;
  fps: number;
}

export interface CameraState {
  deviceId: DeviceId;
  online: boolean;
  streaming: boolean;
  recording: boolean;
  motionDetected: boolean;
  nightVisionActive: boolean;
  ptzPosition?: PTZPosition;
  lastMotion?: ISOTimestamp;
  lastSnapshot?: string;
}

export interface PTZPosition {
  pan: number;
  tilt: number;
  zoom: number;
}

export interface PTZPreset {
  id: string;
  name: string;
  position: PTZPosition;
}

// ============================================================================
// Detection & Alert Types
// ============================================================================

export interface SecurityEvent {
  id: string;
  timestamp: ISOTimestamp;
  type: SecurityEventType;
  severity: EventSeverity;
  source: DeviceId;
  zone?: ZoneId;
  description: string;
  acknowledged: boolean;
  acknowledgedBy?: UserId;
  acknowledgedAt?: ISOTimestamp;
  metadata: Record<string, unknown>;
  media?: EventMedia[];
}

export type SecurityEventType =
  | 'motion_detected'
  | 'person_detected'
  | 'vehicle_detected'
  | 'unknown_person'
  | 'known_person'
  | 'door_opened'
  | 'window_opened'
  | 'glass_break'
  | 'alarm_triggered'
  | 'alarm_armed'
  | 'alarm_disarmed'
  | 'smoke_detected'
  | 'co_detected'
  | 'flood_detected'
  | 'panic_activated'
  | 'tamper_detected'
  | 'power_outage'
  | 'system_offline'
  | 'lpr_detection';

export type EventSeverity = 'info' | 'warning' | 'alert' | 'critical' | 'emergency';

export interface EventMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  timestamp: ISOTimestamp;
}

// ============================================================================
// Access Control Types
// ============================================================================

export interface AccessPoint {
  id: DeviceId;
  name: string;
  type: AccessPointType;
  location: string;
  roomId?: RoomId;
  lock?: DeviceId;
  camera?: DeviceId;
  intercom?: DeviceId;
  state: AccessPointState;
}

export type AccessPointType = 'door' | 'gate' | 'garage' | 'elevator';

export interface AccessPointState {
  locked: boolean;
  doorState: 'open' | 'closed' | 'unknown';
  autoLock: boolean;
  autoLockDelay: number; // seconds
  lastAccess?: AccessLog;
}

export interface AccessLog {
  id: string;
  timestamp: ISOTimestamp;
  accessPointId: DeviceId;
  userId?: UserId;
  guestId?: string;
  method: AccessMethod;
  granted: boolean;
  reason?: string;
  photo?: string;
}

export type AccessMethod =
  | 'code'
  | 'biometric'
  | 'card'
  | 'key'
  | 'remote'
  | 'auto_unlock'
  | 'voice';

// ============================================================================
// Robot & Drone Types
// ============================================================================

export interface PatrolRobot {
  id: DeviceId;
  name: string;
  type: 'indoor' | 'outdoor';
  state: RobotState;
  capabilities: RobotCapabilities;
  currentRoute?: PatrolRoute;
}

export interface RobotState {
  status: 'idle' | 'patrolling' | 'alert' | 'returning' | 'charging' | 'offline';
  battery: number;
  position: { x: number; y: number; floor: number };
  heading: number;
  lastUpdate: ISOTimestamp;
}

export interface RobotCapabilities {
  camera: boolean;
  thermalCamera: boolean;
  speaker: boolean;
  microphone: boolean;
  nightVision: boolean;
}

export interface PatrolRoute {
  id: string;
  name: string;
  waypoints: Waypoint[];
  schedule?: PatrolSchedule;
}

export interface Waypoint {
  id: string;
  position: { x: number; y: number; floor: number };
  duration: number; // seconds to stay
  action?: 'scan' | 'alert' | 'photo';
}

export interface PatrolSchedule {
  enabled: boolean;
  entries: {
    days: number[];
    startTime: string;
    endTime: string;
    routeId: string;
  }[];
}

// ============================================================================
// Panic & Emergency Types
// ============================================================================

export interface PanicMode {
  active: boolean;
  activatedAt?: ISOTimestamp;
  activatedBy?: UserId;
  type: PanicType;
  actions: PanicAction[];
}

export type PanicType = 'intrusion' | 'medical' | 'fire' | 'silent';

export interface PanicAction {
  type: string;
  executed: boolean;
  executedAt?: ISOTimestamp;
  details?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  notifyOn: SecurityEventType[];
}

// ============================================================================
// LPR (License Plate Recognition) Types
// ============================================================================

export interface LPRDetection {
  id: string;
  timestamp: ISOTimestamp;
  cameraId: DeviceId;
  plateNumber: string;
  confidence: number;
  image: string;
  vehicleType?: string;
  vehicleColor?: string;
  direction: 'arriving' | 'departing';
  known: boolean;
  vehicleId?: string;
}

export interface KnownVehicle {
  id: string;
  plateNumber: string;
  description: string;
  owner?: UserId;
  type: 'resident' | 'guest' | 'staff' | 'delivery' | 'blocked';
  notes?: string;
  createdAt: ISOTimestamp;
}
