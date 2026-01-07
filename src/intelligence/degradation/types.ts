/**
 * AICO Smart Home - Graceful Degradation Types
 *
 * A house that fails beautifully. When systems falter,
 * the home should degrade like a sunset, not crash like a computer.
 */

import type { RoomId, DeviceId, UserId } from '@/types/core';

// ============================================================================
// Capability Pyramid
// ============================================================================

/**
 * The hierarchy of home capabilities, from essential to luxurious.
 * When resources constrain, we shed from the top down.
 */
export type CapabilityTier =
  | 'survival'      // Tier 0: Safety, basic climate, essential lighting
  | 'comfort'       // Tier 1: Full climate, all lighting, basic automation
  | 'convenience'   // Tier 2: Voice control, scenes, scheduling
  | 'intelligence'  // Tier 3: Predictions, ambient signals, emotional inference
  | 'luxury';       // Tier 4: Full AI, proactive suggestions, digital twin

export interface CapabilityPyramid {
  tiers: Map<CapabilityTier, CapabilitySet>;
  currentTier: CapabilityTier;
  targetTier: CapabilityTier;
  constraints: SystemConstraint[];
}

export interface CapabilitySet {
  tier: CapabilityTier;
  name: string;
  description: string;
  capabilities: Capability[];
  requiredResources: ResourceRequirement[];
  fallbackBehavior: FallbackBehavior;
}

export interface Capability {
  id: string;
  name: string;
  category: CapabilityCategory;
  tier: CapabilityTier;
  essential: boolean;              // Cannot be disabled even in survival mode
  dependencies: string[];          // Other capability IDs
  resourceCost: ResourceCost;
  degradationPath: DegradationStep[];
}

export type CapabilityCategory =
  | 'safety'
  | 'climate'
  | 'lighting'
  | 'security'
  | 'automation'
  | 'intelligence'
  | 'communication'
  | 'entertainment';

// ============================================================================
// System Constraints
// ============================================================================

export interface SystemConstraint {
  type: ConstraintType;
  severity: ConstraintSeverity;
  source: string;
  message: string;
  startedAt: Date;
  estimatedDuration?: number;      // Minutes
  affectedCapabilities: string[];
}

export type ConstraintType =
  | 'power_outage'                 // No grid power
  | 'power_limited'                // Running on backup/solar
  | 'network_offline'              // No internet
  | 'network_degraded'             // Slow/unreliable internet
  | 'device_failure'               // Specific device down
  | 'hub_failure'                  // Local hub issues
  | 'cloud_unavailable'            // Cloud services down
  | 'sensor_failure'               // Sensor network issues
  | 'thermal_emergency'            // Overheating systems
  | 'water_emergency'              // Flood detection
  | 'security_breach';             // Security compromise

export type ConstraintSeverity =
  | 'informational'                // User should know
  | 'minor'                        // Some features affected
  | 'moderate'                     // Significant features affected
  | 'major'                        // Core features affected
  | 'critical';                    // Safety features at risk

// ============================================================================
// Resource Management
// ============================================================================

export interface ResourceRequirement {
  resource: ResourceType;
  minimum: number;
  optimal: number;
  unit: string;
}

export interface ResourceCost {
  power: number;                   // Watts
  bandwidth: number;               // Kbps
  processing: number;              // Relative CPU units
  memory: number;                  // MB
  cloudCalls: number;              // Calls per minute
}

export type ResourceType =
  | 'power'
  | 'bandwidth'
  | 'processing'
  | 'memory'
  | 'storage'
  | 'cloud_api';

export interface ResourceBudget {
  available: Map<ResourceType, number>;
  allocated: Map<ResourceType, number>;
  reserved: Map<ResourceType, number>;  // Reserved for essential capabilities
  forecast: ResourceForecast;
}

export interface ResourceForecast {
  powerDuration: number;           // Minutes of backup power
  batteryLevel: number;            // 0-100
  solarGeneration: number;         // Current watts
  gridStatus: 'available' | 'unstable' | 'offline';
  networkQuality: number;          // 0-100
}

// ============================================================================
// Degradation Strategies
// ============================================================================

export interface DegradationStep {
  level: number;                   // 0 = full, higher = more degraded
  description: string;
  resourceSavings: Partial<ResourceCost>;
  userImpact: UserImpact;
  automaticTrigger?: DegradationTrigger;
}

export interface DegradationTrigger {
  condition: TriggerCondition;
  threshold: number;
  hysteresis: number;              // Prevent oscillation
}

export type TriggerCondition =
  | 'power_below'
  | 'battery_below'
  | 'bandwidth_below'
  | 'latency_above'
  | 'error_rate_above'
  | 'temperature_above';

export interface UserImpact {
  severity: 'none' | 'minimal' | 'noticeable' | 'significant';
  description: string;
  workarounds?: string[];
}

export interface FallbackBehavior {
  type: FallbackType;
  parameters: Record<string, unknown>;
  notifyUser: boolean;
  logReason: boolean;
}

export type FallbackType =
  | 'disable'                      // Turn off capability
  | 'reduce_frequency'             // Poll less often
  | 'local_only'                   // Skip cloud calls
  | 'cached_data'                  // Use last known values
  | 'simplified_logic'             // Use simpler algorithms
  | 'manual_override';             // Require manual control

// ============================================================================
// Offline Operation
// ============================================================================

export interface OfflineProfile {
  id: string;
  name: string;
  priority: number;
  capabilities: OfflineCapability[];
  scheduledActions: ScheduledAction[];
  dataRetention: DataRetentionPolicy;
}

export interface OfflineCapability {
  capabilityId: string;
  offlineMode: OfflineMode;
  lastSyncedAt: Date;
  localCacheValid: boolean;
  manualOverrideAllowed: boolean;
}

export type OfflineMode =
  | 'full'                         // Works completely offline
  | 'degraded'                     // Reduced functionality
  | 'cached'                       // Uses cached data only
  | 'manual'                       // Manual control only
  | 'disabled';                    // Not available offline

export interface ScheduledAction {
  id: string;
  action: string;
  scheduledFor: Date;
  requiresNetwork: boolean;
  requiresCloud: boolean;
  fallbackAction?: string;
  maxDelay: number;                // Minutes to wait for connectivity
}

export interface DataRetentionPolicy {
  sensorData: number;              // Hours to retain
  eventLog: number;
  patternData: number;
  userPreferences: 'permanent' | number;
}

// ============================================================================
// Recovery & Resilience
// ============================================================================

export interface RecoveryPlan {
  constraint: ConstraintType;
  phases: RecoveryPhase[];
  estimatedDuration: number;
  userCommunication: CommunicationPlan;
}

export interface RecoveryPhase {
  order: number;
  name: string;
  description: string;
  capabilities: string[];          // Capabilities to restore
  prerequisites: string[];         // Must be complete first
  validationSteps: ValidationStep[];
}

export interface ValidationStep {
  check: string;
  expectedResult: string;
  retryCount: number;
  retryDelay: number;              // Seconds
}

export interface CommunicationPlan {
  notifyOnStart: boolean;
  progressUpdates: boolean;
  updateInterval: number;          // Seconds
  notifyOnComplete: boolean;
  channels: CommunicationChannel[];
}

export type CommunicationChannel =
  | 'ambient_light'                // Light color/pattern
  | 'ambient_sound'                // Audio signal
  | 'screen_notification'          // If screen available
  | 'voice_announcement'           // TTS announcement
  | 'external_push';               // Phone notification

// ============================================================================
// Manual Override System
// ============================================================================

export interface ManualOverride {
  id: string;
  userId: UserId;
  deviceId?: DeviceId;
  roomId?: RoomId;
  capability: string;
  action: string;
  activatedAt: Date;
  expiresAt?: Date;
  reason: OverrideReason;
  systemState: 'degraded' | 'offline' | 'emergency';
}

export type OverrideReason =
  | 'system_failure'
  | 'user_preference'
  | 'safety_override'
  | 'maintenance';

export interface PhysicalFallback {
  deviceId: DeviceId;
  physicalControl: PhysicalControlType;
  location: string;
  instructions: string;
  lastTestedAt: Date;
}

export type PhysicalControlType =
  | 'wall_switch'
  | 'breaker_panel'
  | 'manual_valve'
  | 'physical_key'
  | 'emergency_button';

// ============================================================================
// Degradation State
// ============================================================================

export interface DegradationState {
  // Current status
  currentTier: CapabilityTier;
  activeConstraints: SystemConstraint[];
  degradedCapabilities: Map<string, number>;  // capability -> degradation level
  disabledCapabilities: string[];

  // Resource status
  resourceBudget: ResourceBudget;
  powerMode: PowerMode;

  // Offline status
  offlineProfile: OfflineProfile | null;
  lastCloudSync: Date;
  pendingSyncItems: number;

  // Recovery
  activeRecoveryPlans: RecoveryPlan[];
  manualOverrides: ManualOverride[];

  // User communication
  userNotified: boolean;
  lastNotificationAt: Date;
  acknowledgedConstraints: string[];
}

export type PowerMode =
  | 'normal'                       // Grid power, full capability
  | 'eco'                          // Grid power, reduced for efficiency
  | 'backup'                       // Battery/UPS power
  | 'solar'                        // Solar only
  | 'emergency'                    // Minimum power for safety
  | 'blackout';                    // No power (this state is theoretical)

// ============================================================================
// Sunset Degradation Philosophy
// ============================================================================

/**
 * A house should fail like a sunset - gradually, beautifully,
 * with each stage having its own kind of peace.
 */
export interface SunsetDegradation {
  phase: SunsetPhase;
  startedAt: Date;
  transitionDuration: number;      // Minutes for graceful transition
  ambientFeedback: AmbientDegradationFeedback;
}

export type SunsetPhase =
  | 'golden_hour'                  // Full capability, hints of constraint
  | 'sunset'                       // Reducing capabilities gracefully
  | 'twilight'                     // Core capabilities only
  | 'dusk'                         // Comfort capabilities
  | 'night'                        // Survival capabilities
  | 'dawn';                        // Recovery beginning

export interface AmbientDegradationFeedback {
  // Visual feedback
  lightTemperatureShift?: number;  // Kelvin shift (warmer = more degraded)
  lightIntensityFactor?: number;   // 0-1 multiplier

  // Audio feedback
  backgroundSoundType?: string;    // e.g., 'gentle_rain' during degradation
  notificationTone?: string;       // Different tones for different phases

  // Haptic (if wall panel)
  hapticPattern?: string;
}

export default DegradationState;
