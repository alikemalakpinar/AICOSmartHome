/**
 * AICO Smart Home - Security & Surveillance Service
 *
 * Central service for security, cameras, and access control.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { EventEmitter } from 'eventemitter3';
import type { DeviceId, RoomId, ZoneId, UserId, ISOTimestamp } from '@/types/core';
import type {
  AlarmMode,
  AlarmState,
  AlarmSystemState,
  SecurityZone,
  CameraConfig,
  CameraState,
  PTZPosition,
  SecurityEvent,
  SecurityEventType,
  EventSeverity,
  AccessPoint,
  AccessLog,
  AccessMethod,
  PatrolRobot,
  PanicMode,
  PanicType,
  EmergencyContact,
  LPRDetection,
  KnownVehicle,
} from './types';

// ============================================================================
// Security Events
// ============================================================================

interface SecurityServiceEvents {
  'alarm:triggered': (event: SecurityEvent) => void;
  'alarm:mode_changed': (mode: AlarmMode) => void;
  'camera:motion': (cameraId: DeviceId, event: SecurityEvent) => void;
  'camera:person_detected': (cameraId: DeviceId, event: SecurityEvent) => void;
  'access:granted': (accessPointId: DeviceId, log: AccessLog) => void;
  'access:denied': (accessPointId: DeviceId, log: AccessLog) => void;
  'panic:activated': (panic: PanicMode) => void;
  'panic:deactivated': () => void;
  'event:new': (event: SecurityEvent) => void;
}

// ============================================================================
// Store State
// ============================================================================

interface SecurityState {
  // Alarm System
  alarmSystem: AlarmSystemState;
  alarmCode: string; // Hashed

  // Cameras
  cameras: Map<DeviceId, CameraConfig>;
  cameraStates: Map<DeviceId, CameraState>;
  activeCameraView: DeviceId | null;
  cameraGridLayout: 'single' | '2x2' | '3x3' | '4x4';

  // Events
  events: SecurityEvent[];
  unacknowledgedCount: number;

  // Access Control
  accessPoints: Map<DeviceId, AccessPoint>;
  accessLogs: AccessLog[];

  // Robots
  patrolRobots: Map<DeviceId, PatrolRobot>;

  // Panic Mode
  panicMode: PanicMode;
  emergencyContacts: EmergencyContact[];

  // LPR
  knownVehicles: KnownVehicle[];
  recentLPRDetections: LPRDetection[];
}

interface SecurityActions {
  // Alarm Control
  armAlarm(mode: AlarmMode, code: string): Promise<boolean>;
  disarmAlarm(code: string): Promise<boolean>;
  triggerAlarm(source: DeviceId, type: SecurityEventType): void;
  silenceAlarm(): void;
  bypassZone(zoneId: ZoneId): void;
  unbypassZone(zoneId: ZoneId): void;

  // Camera Control
  selectCamera(cameraId: DeviceId | null): void;
  setCameraGridLayout(layout: 'single' | '2x2' | '3x3' | '4x4'): void;
  movePTZ(cameraId: DeviceId, position: PTZPosition): Promise<void>;
  goToPreset(cameraId: DeviceId, presetId: string): Promise<void>;
  startRecording(cameraId: DeviceId): Promise<void>;
  stopRecording(cameraId: DeviceId): Promise<void>;
  takeSnapshot(cameraId: DeviceId): Promise<string>;

  // Event Management
  acknowledgeEvent(eventId: string, userId: UserId): void;
  acknowledgeAllEvents(userId: UserId): void;
  clearOldEvents(beforeDate: ISOTimestamp): void;

  // Access Control
  lockAccessPoint(accessPointId: DeviceId): Promise<void>;
  unlockAccessPoint(accessPointId: DeviceId, duration?: number): Promise<void>;
  grantAccess(accessPointId: DeviceId, method: AccessMethod, userId?: UserId): void;
  denyAccess(accessPointId: DeviceId, method: AccessMethod, reason: string): void;

  // Robot Control
  startPatrol(robotId: DeviceId, routeId: string): Promise<void>;
  stopPatrol(robotId: DeviceId): Promise<void>;
  sendRobotTo(robotId: DeviceId, position: { x: number; y: number; floor: number }): Promise<void>;

  // Panic Mode
  activatePanic(type: PanicType, userId?: UserId): Promise<void>;
  deactivatePanic(code: string): Promise<boolean>;

  // LPR
  addKnownVehicle(vehicle: Omit<KnownVehicle, 'id' | 'createdAt'>): void;
  removeKnownVehicle(vehicleId: string): void;
  processLPRDetection(detection: Omit<LPRDetection, 'id' | 'known' | 'vehicleId'>): LPRDetection;

  // Internal
  addSecurityEvent(event: Omit<SecurityEvent, 'id' | 'acknowledged'>): void;
  updateCameraState(cameraId: DeviceId, state: Partial<CameraState>): void;
}

// ============================================================================
// Event Emitter
// ============================================================================

export const securityEvents = new EventEmitter<SecurityServiceEvents>();

// ============================================================================
// Store
// ============================================================================

export const useSecurityStore = create<SecurityState & SecurityActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    alarmSystem: {
      mode: 'disarmed',
      state: 'idle',
      zones: [],
      entryDelay: 30,
      exitDelay: 60,
      sirenActive: false,
    },
    alarmCode: '', // Should be set during initialization
    cameras: new Map(),
    cameraStates: new Map(),
    activeCameraView: null,
    cameraGridLayout: '2x2',
    events: [],
    unacknowledgedCount: 0,
    accessPoints: new Map(),
    accessLogs: [],
    patrolRobots: new Map(),
    panicMode: {
      active: false,
      type: 'intrusion',
      actions: [],
    },
    emergencyContacts: [],
    knownVehicles: [],
    recentLPRDetections: [],

    // Alarm Control
    async armAlarm(mode, code) {
      // Verify code
      if (!verifyCode(code, get().alarmCode)) {
        return false;
      }

      // Check if all zones are ready
      const { alarmSystem } = get();
      const unreadyZones = alarmSystem.zones.filter(
        z => z.triggered && !z.bypassed && z.activeInModes.includes(mode)
      );

      if (unreadyZones.length > 0) {
        // Cannot arm - zones triggered
        return false;
      }

      // Start exit delay
      set(state => ({
        alarmSystem: {
          ...state.alarmSystem,
          mode,
          state: 'pending',
          lastArmed: new Date().toISOString() as ISOTimestamp,
        },
      }));

      // After exit delay, fully arm
      setTimeout(() => {
        set(state => ({
          alarmSystem: {
            ...state.alarmSystem,
            state: 'idle',
          },
        }));
      }, alarmSystem.exitDelay * 1000);

      securityEvents.emit('alarm:mode_changed', mode);

      get().addSecurityEvent({
        timestamp: new Date().toISOString() as ISOTimestamp,
        type: 'alarm_armed',
        severity: 'info',
        source: 'system' as DeviceId,
        description: `Alarm armed in ${mode} mode`,
        metadata: { mode },
      });

      return true;
    },

    async disarmAlarm(code) {
      if (!verifyCode(code, get().alarmCode)) {
        return false;
      }

      set(state => ({
        alarmSystem: {
          ...state.alarmSystem,
          mode: 'disarmed',
          state: 'idle',
          sirenActive: false,
        },
      }));

      securityEvents.emit('alarm:mode_changed', 'disarmed');

      get().addSecurityEvent({
        timestamp: new Date().toISOString() as ISOTimestamp,
        type: 'alarm_disarmed',
        severity: 'info',
        source: 'system' as DeviceId,
        description: 'Alarm disarmed',
        metadata: {},
      });

      return true;
    },

    triggerAlarm(source, type) {
      const { alarmSystem } = get();

      if (alarmSystem.mode === 'disarmed') {
        return;
      }

      // Start entry delay or trigger immediately
      const zone = alarmSystem.zones.find(z => z.sensors.includes(source));

      if (zone?.type === 'perimeter') {
        // Entry delay for perimeter
        set(state => ({
          alarmSystem: {
            ...state.alarmSystem,
            state: 'pending',
            triggeredBy: source,
          },
        }));

        setTimeout(() => {
          const current = get().alarmSystem;
          if (current.state === 'pending') {
            set(state => ({
              alarmSystem: {
                ...state.alarmSystem,
                state: 'alarming',
                sirenActive: true,
                lastTriggered: new Date().toISOString() as ISOTimestamp,
              },
            }));
          }
        }, alarmSystem.entryDelay * 1000);
      } else {
        // Immediate trigger
        set(state => ({
          alarmSystem: {
            ...state.alarmSystem,
            state: 'alarming',
            sirenActive: true,
            triggeredBy: source,
            lastTriggered: new Date().toISOString() as ISOTimestamp,
          },
        }));
      }

      const event: Omit<SecurityEvent, 'id' | 'acknowledged'> = {
        timestamp: new Date().toISOString() as ISOTimestamp,
        type: 'alarm_triggered',
        severity: 'emergency',
        source,
        zone: zone?.id,
        description: `Alarm triggered by ${type}`,
        metadata: { type },
      };

      get().addSecurityEvent(event);
      securityEvents.emit('alarm:triggered', { ...event, id: '', acknowledged: false });
    },

    silenceAlarm() {
      set(state => ({
        alarmSystem: {
          ...state.alarmSystem,
          sirenActive: false,
        },
      }));
    },

    bypassZone(zoneId) {
      set(state => ({
        alarmSystem: {
          ...state.alarmSystem,
          zones: state.alarmSystem.zones.map(z =>
            z.id === zoneId ? { ...z, bypassed: true } : z
          ),
        },
      }));
    },

    unbypassZone(zoneId) {
      set(state => ({
        alarmSystem: {
          ...state.alarmSystem,
          zones: state.alarmSystem.zones.map(z =>
            z.id === zoneId ? { ...z, bypassed: false } : z
          ),
        },
      }));
    },

    // Camera Control
    selectCamera(cameraId) {
      set({ activeCameraView: cameraId });
    },

    setCameraGridLayout(layout) {
      set({ cameraGridLayout: layout });
    },

    async movePTZ(cameraId, position) {
      const states = new Map(get().cameraStates);
      const state = states.get(cameraId);
      if (state) {
        states.set(cameraId, { ...state, ptzPosition: position });
        set({ cameraStates: states });
      }
      // Send command to actual camera
    },

    async goToPreset(cameraId, presetId) {
      // Send preset command to camera
    },

    async startRecording(cameraId) {
      const states = new Map(get().cameraStates);
      const state = states.get(cameraId);
      if (state) {
        states.set(cameraId, { ...state, recording: true });
        set({ cameraStates: states });
      }
    },

    async stopRecording(cameraId) {
      const states = new Map(get().cameraStates);
      const state = states.get(cameraId);
      if (state) {
        states.set(cameraId, { ...state, recording: false });
        set({ cameraStates: states });
      }
    },

    async takeSnapshot(cameraId) {
      // Request snapshot from camera
      const url = `snapshot-${cameraId}-${Date.now()}.jpg`;
      const states = new Map(get().cameraStates);
      const state = states.get(cameraId);
      if (state) {
        states.set(cameraId, { ...state, lastSnapshot: url });
        set({ cameraStates: states });
      }
      return url;
    },

    // Event Management
    acknowledgeEvent(eventId, userId) {
      set(state => ({
        events: state.events.map(e =>
          e.id === eventId
            ? {
                ...e,
                acknowledged: true,
                acknowledgedBy: userId,
                acknowledgedAt: new Date().toISOString() as ISOTimestamp,
              }
            : e
        ),
        unacknowledgedCount: state.events.filter(
          e => !e.acknowledged && e.id !== eventId
        ).length,
      }));
    },

    acknowledgeAllEvents(userId) {
      set(state => ({
        events: state.events.map(e => ({
          ...e,
          acknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date().toISOString() as ISOTimestamp,
        })),
        unacknowledgedCount: 0,
      }));
    },

    clearOldEvents(beforeDate) {
      set(state => ({
        events: state.events.filter(e => e.timestamp >= beforeDate),
      }));
    },

    // Access Control
    async lockAccessPoint(accessPointId) {
      const points = new Map(get().accessPoints);
      const point = points.get(accessPointId);
      if (point) {
        point.state.locked = true;
        points.set(accessPointId, point);
        set({ accessPoints: points });
      }
      // Send lock command
    },

    async unlockAccessPoint(accessPointId, duration) {
      const points = new Map(get().accessPoints);
      const point = points.get(accessPointId);
      if (point) {
        point.state.locked = false;
        points.set(accessPointId, point);
        set({ accessPoints: points });

        if (duration) {
          setTimeout(() => {
            get().lockAccessPoint(accessPointId);
          }, duration * 1000);
        }
      }
    },

    grantAccess(accessPointId, method, userId) {
      const log: AccessLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString() as ISOTimestamp,
        accessPointId,
        userId,
        method,
        granted: true,
      };

      set(state => ({
        accessLogs: [log, ...state.accessLogs.slice(0, 999)],
      }));

      // Update access point state
      const points = new Map(get().accessPoints);
      const point = points.get(accessPointId);
      if (point) {
        point.state.lastAccess = log;
        points.set(accessPointId, point);
        set({ accessPoints: points });
      }

      securityEvents.emit('access:granted', accessPointId, log);
    },

    denyAccess(accessPointId, method, reason) {
      const log: AccessLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString() as ISOTimestamp,
        accessPointId,
        method,
        granted: false,
        reason,
      };

      set(state => ({
        accessLogs: [log, ...state.accessLogs.slice(0, 999)],
      }));

      get().addSecurityEvent({
        timestamp: new Date().toISOString() as ISOTimestamp,
        type: 'unknown_person',
        severity: 'alert',
        source: accessPointId,
        description: `Access denied: ${reason}`,
        metadata: { method, reason },
      });

      securityEvents.emit('access:denied', accessPointId, log);
    },

    // Robot Control
    async startPatrol(robotId, routeId) {
      const robots = new Map(get().patrolRobots);
      const robot = robots.get(robotId);
      if (robot) {
        robot.state.status = 'patrolling';
        // robot.currentRoute = routes.get(routeId);
        robots.set(robotId, robot);
        set({ patrolRobots: robots });
      }
    },

    async stopPatrol(robotId) {
      const robots = new Map(get().patrolRobots);
      const robot = robots.get(robotId);
      if (robot) {
        robot.state.status = 'returning';
        robots.set(robotId, robot);
        set({ patrolRobots: robots });
      }
    },

    async sendRobotTo(robotId, position) {
      // Send navigation command to robot
    },

    // Panic Mode
    async activatePanic(type, userId) {
      const actions: PanicMode['actions'] = [];

      // Define panic actions based on type
      switch (type) {
        case 'intrusion':
          actions.push(
            { type: 'lock_all_doors', executed: false },
            { type: 'activate_siren', executed: false },
            { type: 'start_recording_all', executed: false },
            { type: 'notify_authorities', executed: false },
            { type: 'notify_contacts', executed: false }
          );
          break;
        case 'medical':
          actions.push(
            { type: 'unlock_front_door', executed: false },
            { type: 'flash_exterior_lights', executed: false },
            { type: 'call_emergency_services', executed: false },
            { type: 'notify_contacts', executed: false }
          );
          break;
        case 'fire':
          actions.push(
            { type: 'unlock_all_doors', executed: false },
            { type: 'activate_fire_alarm', executed: false },
            { type: 'call_fire_department', executed: false },
            { type: 'notify_contacts', executed: false }
          );
          break;
        case 'silent':
          actions.push(
            { type: 'start_recording_all', executed: false },
            { type: 'notify_authorities_silent', executed: false },
            { type: 'track_location', executed: false }
          );
          break;
      }

      const panicMode: PanicMode = {
        active: true,
        activatedAt: new Date().toISOString() as ISOTimestamp,
        activatedBy: userId,
        type,
        actions,
      };

      set({ panicMode });

      // Execute actions
      // This would trigger actual device commands

      get().addSecurityEvent({
        timestamp: new Date().toISOString() as ISOTimestamp,
        type: 'panic_activated',
        severity: 'emergency',
        source: 'system' as DeviceId,
        description: `${type} panic mode activated`,
        metadata: { type, userId },
      });

      securityEvents.emit('panic:activated', panicMode);
    },

    async deactivatePanic(code) {
      if (!verifyCode(code, get().alarmCode)) {
        return false;
      }

      set({
        panicMode: {
          active: false,
          type: 'intrusion',
          actions: [],
        },
      });

      securityEvents.emit('panic:deactivated');
      return true;
    },

    // LPR
    addKnownVehicle(vehicle) {
      const newVehicle: KnownVehicle = {
        ...vehicle,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString() as ISOTimestamp,
      };

      set(state => ({
        knownVehicles: [...state.knownVehicles, newVehicle],
      }));
    },

    removeKnownVehicle(vehicleId) {
      set(state => ({
        knownVehicles: state.knownVehicles.filter(v => v.id !== vehicleId),
      }));
    },

    processLPRDetection(detection) {
      const known = get().knownVehicles.find(
        v => v.plateNumber.toLowerCase() === detection.plateNumber.toLowerCase()
      );

      const fullDetection: LPRDetection = {
        ...detection,
        id: crypto.randomUUID(),
        known: !!known,
        vehicleId: known?.id,
      };

      set(state => ({
        recentLPRDetections: [fullDetection, ...state.recentLPRDetections.slice(0, 99)],
      }));

      // Create event for unknown vehicles
      if (!known) {
        get().addSecurityEvent({
          timestamp: detection.timestamp,
          type: 'lpr_detection',
          severity: 'info',
          source: detection.cameraId,
          description: `Unknown vehicle detected: ${detection.plateNumber}`,
          metadata: {
            plateNumber: detection.plateNumber,
            direction: detection.direction,
          },
          media: [
            {
              type: 'image',
              url: detection.image,
              timestamp: detection.timestamp,
            },
          ],
        });
      } else if (known.type === 'blocked') {
        get().addSecurityEvent({
          timestamp: detection.timestamp,
          type: 'lpr_detection',
          severity: 'alert',
          source: detection.cameraId,
          description: `Blocked vehicle detected: ${detection.plateNumber}`,
          metadata: {
            plateNumber: detection.plateNumber,
            vehicleId: known.id,
            owner: known.owner,
          },
          media: [
            {
              type: 'image',
              url: detection.image,
              timestamp: detection.timestamp,
            },
          ],
        });
      }

      return fullDetection;
    },

    // Internal
    addSecurityEvent(event) {
      const fullEvent: SecurityEvent = {
        ...event,
        id: crypto.randomUUID(),
        acknowledged: false,
      };

      set(state => ({
        events: [fullEvent, ...state.events.slice(0, 999)],
        unacknowledgedCount: state.unacknowledgedCount + 1,
      }));

      securityEvents.emit('event:new', fullEvent);
    },

    updateCameraState(cameraId, state) {
      const states = new Map(get().cameraStates);
      const current = states.get(cameraId) ?? {
        deviceId: cameraId,
        online: false,
        streaming: false,
        recording: false,
        motionDetected: false,
        nightVisionActive: false,
      };
      states.set(cameraId, { ...current, ...state });
      set({ cameraStates: states });
    },
  }))
);

// ============================================================================
// Helper Functions
// ============================================================================

function verifyCode(input: string, stored: string): boolean {
  // In production, use proper bcrypt comparison
  // return bcrypt.compareSync(input, stored);
  return input === stored || stored === ''; // Simplified for demo
}
