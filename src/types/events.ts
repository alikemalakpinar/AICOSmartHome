/**
 * AICO Smart Home - Event Type Definitions
 *
 * Event sourcing and domain event types.
 */

import type {
  EventId,
  DeviceId,
  RoomId,
  FloorId,
  ZoneId,
  ResidenceId,
  UserId,
  SceneId,
  RuleId,
  ISOTimestamp,
} from './core';
import type { DeviceState, CommandResult } from './devices';

// ============================================================================
// Base Event Types
// ============================================================================

export interface DomainEvent<T extends EventType = EventType, P = unknown> {
  id: EventId;
  type: T;
  timestamp: ISOTimestamp;
  version: number;
  source: EventSource;
  payload: P;
  metadata: EventMetadata;
}

export interface EventSource {
  type: 'device' | 'user' | 'system' | 'rule' | 'schedule' | 'external';
  id: string;
  name?: string;
}

export interface EventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: UserId;
  deviceId?: DeviceId;
  roomId?: RoomId;
  floorId?: FloorId;
  zoneId?: ZoneId;
  residenceId: ResidenceId;
  tags?: string[];
  priority?: EventPriority;
  ttl?: number; // Time to live in seconds
}

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

// ============================================================================
// Event Categories
// ============================================================================

export type EventType =
  // Device Events
  | 'device.state_changed'
  | 'device.command_sent'
  | 'device.command_completed'
  | 'device.command_failed'
  | 'device.discovered'
  | 'device.registered'
  | 'device.removed'
  | 'device.online'
  | 'device.offline'
  | 'device.health_changed'
  | 'device.firmware_update'
  // User Events
  | 'user.presence_changed'
  | 'user.identified'
  | 'user.authenticated'
  | 'user.session_started'
  | 'user.session_ended'
  | 'user.preference_changed'
  | 'user.permission_changed'
  // Scene Events
  | 'scene.activated'
  | 'scene.deactivated'
  | 'scene.created'
  | 'scene.modified'
  | 'scene.deleted'
  // Rule Events
  | 'rule.triggered'
  | 'rule.executed'
  | 'rule.failed'
  | 'rule.enabled'
  | 'rule.disabled'
  | 'rule.created'
  | 'rule.modified'
  | 'rule.deleted'
  // Residence Events
  | 'residence.mode_changed'
  | 'residence.alert'
  | 'residence.emergency'
  | 'residence.maintenance'
  // Room Events
  | 'room.occupancy_changed'
  | 'room.environment_changed'
  // Security Events
  | 'security.alarm_triggered'
  | 'security.alarm_acknowledged'
  | 'security.alarm_cleared'
  | 'security.access_granted'
  | 'security.access_denied'
  | 'security.breach_detected'
  | 'security.lockdown_initiated'
  | 'security.lockdown_cleared'
  // Energy Events
  | 'energy.threshold_exceeded'
  | 'energy.production_changed'
  | 'energy.consumption_changed'
  | 'energy.grid_status_changed'
  // System Events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | 'system.warning'
  | 'system.update_available'
  | 'system.update_installed'
  | 'system.backup_created'
  | 'system.backup_restored'
  // Integration Events
  | 'integration.connected'
  | 'integration.disconnected'
  | 'integration.error'
  // Voice Events
  | 'voice.wake_word_detected'
  | 'voice.command_recognized'
  | 'voice.command_executed'
  | 'voice.command_failed';

// ============================================================================
// Device Event Payloads
// ============================================================================

export interface DeviceStateChangedPayload {
  deviceId: DeviceId;
  previousState: DeviceState;
  newState: DeviceState;
  changedProperties: string[];
}

export interface DeviceCommandPayload {
  deviceId: DeviceId;
  command: string;
  parameters: Record<string, unknown>;
  requestId: string;
}

export interface DeviceCommandCompletedPayload {
  deviceId: DeviceId;
  command: string;
  result: CommandResult;
  requestId: string;
}

export interface DeviceDiscoveredPayload {
  protocol: string;
  address: string;
  type: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
}

export interface DeviceHealthChangedPayload {
  deviceId: DeviceId;
  previousStatus: string;
  newStatus: string;
  details: Record<string, unknown>;
}

// ============================================================================
// User Event Payloads
// ============================================================================

export interface UserPresenceChangedPayload {
  userId: UserId;
  previousPresence: {
    isHome: boolean;
    roomId?: RoomId;
  };
  newPresence: {
    isHome: boolean;
    roomId?: RoomId;
  };
  source: string;
}

export interface UserIdentifiedPayload {
  userId: UserId;
  method: 'face' | 'voice' | 'fingerprint' | 'code';
  confidence: number;
  location: string;
}

export interface UserAuthenticatedPayload {
  userId: UserId;
  method: string;
  sessionId: string;
  device: {
    type: string;
    name: string;
  };
}

// ============================================================================
// Scene Event Payloads
// ============================================================================

export interface SceneActivatedPayload {
  sceneId: SceneId;
  triggeredBy: 'user' | 'rule' | 'schedule' | 'voice';
  userId?: UserId;
  ruleId?: RuleId;
  actionsExecuted: number;
  duration: number;
}

// ============================================================================
// Rule Event Payloads
// ============================================================================

export interface RuleTriggeredPayload {
  ruleId: RuleId;
  ruleName: string;
  trigger: {
    type: string;
    source: string;
    data: Record<string, unknown>;
  };
}

export interface RuleExecutedPayload {
  ruleId: RuleId;
  ruleName: string;
  conditionsEvaluated: {
    condition: string;
    result: boolean;
  }[];
  actionsExecuted: {
    action: string;
    result: 'success' | 'failure';
    duration: number;
    error?: string;
  }[];
  totalDuration: number;
}

// ============================================================================
// Residence Event Payloads
// ============================================================================

export interface ResidenceModeChangedPayload {
  residenceId: ResidenceId;
  previousMode: string;
  newMode: string;
  changedBy: 'user' | 'rule' | 'schedule' | 'system';
  userId?: UserId;
}

export interface ResidenceAlertPayload {
  residenceId: ResidenceId;
  alertType: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  source: string;
  requiresAcknowledgment: boolean;
}

// ============================================================================
// Security Event Payloads
// ============================================================================

export interface SecurityAlarmPayload {
  alarmId: string;
  type: 'intrusion' | 'fire' | 'water' | 'gas' | 'medical' | 'panic';
  zone: string;
  devices: DeviceId[];
  severity: 'warning' | 'critical' | 'emergency';
}

export interface SecurityAccessPayload {
  userId?: UserId;
  guestId?: string;
  location: string;
  method: 'code' | 'biometric' | 'key' | 'remote';
  result: 'granted' | 'denied';
  reason?: string;
}

// ============================================================================
// Energy Event Payloads
// ============================================================================

export interface EnergyThresholdPayload {
  type: 'consumption' | 'production' | 'cost';
  threshold: number;
  currentValue: number;
  unit: string;
  period: string;
}

export interface EnergyStatusPayload {
  solarProduction: number;
  gridConsumption: number;
  batteryLevel: number;
  batteryCharging: boolean;
  selfSufficiency: number;
}

// ============================================================================
// System Event Payloads
// ============================================================================

export interface SystemStartupPayload {
  version: string;
  bootTime: number;
  services: {
    name: string;
    status: 'running' | 'failed';
    duration: number;
  }[];
}

export interface SystemErrorPayload {
  code: string;
  message: string;
  stack?: string;
  component: string;
  severity: 'warning' | 'error' | 'critical';
  recoverable: boolean;
}

export interface SystemUpdatePayload {
  fromVersion: string;
  toVersion: string;
  changelog: string[];
  automatic: boolean;
}

// ============================================================================
// Voice Event Payloads
// ============================================================================

export interface VoiceWakeWordPayload {
  userId?: UserId;
  wakeWord: string;
  confidence: number;
  audioLevel: number;
}

export interface VoiceCommandPayload {
  userId?: UserId;
  transcript: string;
  intent: string;
  entities: Record<string, string>;
  confidence: number;
}

// ============================================================================
// Event Subscription Types
// ============================================================================

export type EventFilter = {
  types?: EventType[];
  sources?: string[];
  residenceIds?: ResidenceId[];
  roomIds?: RoomId[];
  deviceIds?: DeviceId[];
  userIds?: UserId[];
  priorities?: EventPriority[];
  tags?: string[];
};

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  filter: EventFilter;
  handler: EventHandler;
  priority: number;
}

// ============================================================================
// Event Store Types
// ============================================================================

export interface EventStoreQuery {
  filter?: EventFilter;
  startTime?: ISOTimestamp;
  endTime?: ISOTimestamp;
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
}

export interface EventStoreResult {
  events: DomainEvent[];
  total: number;
  hasMore: boolean;
}

export interface EventSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: unknown;
  timestamp: ISOTimestamp;
}

// ============================================================================
// Event Bus Types
// ============================================================================

export interface EventBusStats {
  totalEvents: number;
  eventsPerSecond: number;
  subscriberCount: number;
  queueDepth: number;
  processedToday: number;
  failedToday: number;
}

export interface EventBusConfig {
  maxQueueSize: number;
  processingTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  deadLetterEnabled: boolean;
}
