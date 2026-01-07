/**
 * AICO Smart Home - Trust-Based Autonomy Types
 *
 * A house that earns the right to act independently.
 * Trust is built through accurate predictions and appropriate actions,
 * lost through mistakes and overreach.
 */

import type { UserId, RoomId, DeviceId } from '@/types/core';

// ============================================================================
// Delegation Spectrum
// ============================================================================

/**
 * The spectrum from full user control to full house autonomy.
 * Each household member can have different levels for different domains.
 */
export type DelegationLevel =
  | 'inform'        // House only provides information
  | 'suggest'       // House makes suggestions, user decides
  | 'propose'       // House proposes actions with easy approval
  | 'auto_reversible' // House acts but user can easily undo
  | 'auto_notify'   // House acts and notifies
  | 'auto_silent';  // House acts without notification

export interface DelegationProfile {
  userId: UserId;
  domains: Map<DelegationDomain, DomainDelegation>;
  globalTrustLevel: number;       // 0-100, overall trust score
  delegationPreferences: DelegationPreferences;
  trustHistory: TrustEvent[];
}

export type DelegationDomain =
  | 'climate'
  | 'lighting'
  | 'security'
  | 'energy'
  | 'entertainment'
  | 'communication'
  | 'scheduling'
  | 'purchases'
  | 'health'
  | 'social';

export interface DomainDelegation {
  domain: DelegationDomain;
  currentLevel: DelegationLevel;
  maxLevel: DelegationLevel;      // User-set maximum
  trustScore: number;             // 0-100 for this domain
  recentActions: AutonomousAction[];
  successRate: number;            // Historical success
  lastAdjusted: Date;
}

export interface DelegationPreferences {
  // Time-based delegation
  sleepTimeDelegation: Partial<Record<DelegationDomain, DelegationLevel>>;
  awayDelegation: Partial<Record<DelegationDomain, DelegationLevel>>;
  busyDelegation: Partial<Record<DelegationDomain, DelegationLevel>>;

  // Comfort preferences
  comfortPriority: 'efficiency' | 'balanced' | 'maximum_comfort';

  // Notification preferences
  notifyOnAutoActions: boolean;
  notifyOnSuggestions: boolean;
  notificationThreshold: DelegationLevel;

  // Safety
  alwaysAskFor: string[];         // Actions that always require approval
  neverAutomate: string[];        // Actions to never automate
}

// ============================================================================
// Trust Building
// ============================================================================

export interface TrustEvent {
  id: string;
  timestamp: Date;
  domain: DelegationDomain;
  action: AutonomousAction;
  outcome: TrustOutcome;
  trustDelta: number;             // Positive or negative change
  userFeedback?: UserFeedback;
}

export type TrustOutcome =
  | 'correct_prediction'          // House was right
  | 'appreciated_action'          // User liked the action
  | 'neutral'                     // No feedback, assumed OK
  | 'minor_correction'            // User made small adjustment
  | 'significant_correction'      // User significantly changed
  | 'rejected'                    // User rejected the action
  | 'complained';                 // User expressed frustration

export interface UserFeedback {
  type: FeedbackType;
  explicit: boolean;              // User actively gave feedback
  message?: string;
  timestamp: Date;
}

export type FeedbackType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'undo'
  | 'modify'
  | 'complain'
  | 'praise';

// ============================================================================
// Autonomous Actions
// ============================================================================

export interface AutonomousAction {
  id: string;
  domain: DelegationDomain;
  type: ActionType;
  description: string;
  reason: ActionReason;
  confidence: number;             // 0-1, how confident the house is
  reversibility: Reversibility;
  timing: ActionTiming;
  impact: ActionImpact;
  executedAt?: Date;
  outcome?: ActionOutcome;
}

export type ActionType =
  // Climate
  | 'adjust_temperature'
  | 'adjust_humidity'
  | 'open_ventilation'
  | 'activate_heating'
  | 'activate_cooling'

  // Lighting
  | 'adjust_lights'
  | 'activate_scene'
  | 'adjust_blinds'

  // Security
  | 'lock_doors'
  | 'arm_system'
  | 'activate_cameras'
  | 'send_alert'

  // Energy
  | 'shift_load'
  | 'reduce_consumption'
  | 'charge_batteries'
  | 'sell_excess'

  // Scheduling
  | 'reschedule_task'
  | 'set_reminder'
  | 'book_service'

  // Social
  | 'send_message'
  | 'decline_invitation'
  | 'update_status';

export interface ActionReason {
  primary: string;                // Main reason for action
  supporting: string[];           // Additional factors
  patterns: string[];             // Patterns that support this
  confidence: number;             // How sure we are about the reason
}

export interface Reversibility {
  isReversible: boolean;
  reverseWindow: number;          // Seconds available to reverse
  reverseMethod: 'automatic' | 'manual' | 'partial';
  reverseDescription?: string;
}

export interface ActionTiming {
  proposed: Date;
  deadline?: Date;                // When it must happen by
  flexibility: 'immediate' | 'soon' | 'flexible' | 'scheduled';
  optimalWindow?: { start: Date; end: Date };
}

export interface ActionImpact {
  affectedRooms: RoomId[];
  affectedDevices: DeviceId[];
  affectedUsers: UserId[];
  energyImpact: number;           // Watts (positive = more, negative = less)
  comfortImpact: 'positive' | 'neutral' | 'negative';
  financialImpact?: number;       // Currency amount
}

export interface ActionOutcome {
  success: boolean;
  actualResult: string;
  userReaction?: TrustOutcome;
  timestamp: Date;
}

// ============================================================================
// Proposals and Suggestions
// ============================================================================

export interface ActionProposal {
  action: AutonomousAction;
  presentation: ProposalPresentation;
  requiredApproval: ApprovalType;
  expiresAt?: Date;
  alternatives?: AlternativeAction[];
}

export interface ProposalPresentation {
  headline: string;               // Short description
  explanation: string;            // Why the house wants to do this
  visualPreview?: string;         // Image or animation preview
  voiceScript?: string;           // For voice announcement
  ambientSignal?: string;         // Ambient signal type
}

export type ApprovalType =
  | 'none'                        // Will happen automatically
  | 'cancelable'                  // Happening, can cancel
  | 'one_tap'                     // One tap to approve
  | 'confirmation'                // Requires explicit confirmation
  | 'biometric'                   // Requires biometric
  | 'multi_user';                 // Requires multiple users

export interface AlternativeAction {
  action: AutonomousAction;
  reason: string;                 // Why this is an alternative
  tradeoffs: string[];            // What's different
}

// ============================================================================
// Trust Calibration
// ============================================================================

export interface TrustCalibration {
  userId: UserId;
  calibrationState: CalibrationState;
  learningPhase: LearningPhase;
  confidenceThresholds: ConfidenceThresholds;
  behaviorBaseline: BehaviorBaseline;
}

export type CalibrationState =
  | 'initial'                     // New user, learning preferences
  | 'learning'                    // Building trust
  | 'established'                 // Normal operation
  | 'recalibrating';              // Adjusting after issues

export type LearningPhase =
  | 'observation'                 // Only watching
  | 'suggestion'                  // Making suggestions
  | 'supervised'                  // Acting with supervision
  | 'autonomous';                 // Acting independently

export interface ConfidenceThresholds {
  // Minimum confidence to take different actions
  informThreshold: number;        // 0.3 - low bar to inform
  suggestThreshold: number;       // 0.5 - medium bar to suggest
  proposeThreshold: number;       // 0.7 - higher bar to propose
  autoActThreshold: number;       // 0.9 - very high bar to act alone
}

export interface BehaviorBaseline {
  // Learned user preferences
  temperatureRange: { min: number; max: number };
  lightingPreferences: Record<string, number>;
  schedulePatterns: SchedulePattern[];
  correctionHistory: CorrectionRecord[];
}

export interface SchedulePattern {
  dayOfWeek: number;
  timeOfDay: string;
  typicalActions: string[];
  variance: number;               // How much this varies
}

export interface CorrectionRecord {
  domain: DelegationDomain;
  originalAction: string;
  correction: string;
  frequency: number;              // How often this correction happens
  lastOccurred: Date;
}

// ============================================================================
// Permission Requests
// ============================================================================

export interface PermissionRequest {
  id: string;
  action: AutonomousAction;
  requestedLevel: DelegationLevel;
  currentLevel: DelegationLevel;
  reason: string;
  permanent: boolean;             // One-time or permanent change
  scope: PermissionScope;
  requestedAt: Date;
  expiresAt?: Date;
  response?: PermissionResponse;
}

export type PermissionScope =
  | 'this_action'                 // Just this one time
  | 'similar_actions'             // This type of action
  | 'domain'                      // Entire domain
  | 'time_limited'                // For a period
  | 'conditional';                // Under certain conditions

export interface PermissionResponse {
  granted: boolean;
  scope: PermissionScope;
  conditions?: string[];          // Conditions for permission
  expiresAt?: Date;
  respondedAt: Date;
}

// ============================================================================
// Autonomy State
// ============================================================================

export interface AutonomyState {
  // User profiles
  profiles: Map<UserId, DelegationProfile>;

  // Active proposals
  pendingProposals: ActionProposal[];
  recentActions: AutonomousAction[];

  // Calibration
  calibrations: Map<UserId, TrustCalibration>;

  // Permission requests
  pendingPermissions: PermissionRequest[];

  // Global state
  autonomyMode: AutonomyMode;
  houseConfidence: number;        // Overall house confidence
  learningRate: number;           // How fast trust changes
}

export type AutonomyMode =
  | 'conservative'                // House is cautious
  | 'balanced'                    // Normal operation
  | 'proactive'                   // House takes initiative
  | 'guest_mode'                  // Reduced autonomy for guests
  | 'vacation_mode';              // Extended absence behavior

// ============================================================================
// Trust Decay and Recovery
// ============================================================================

export interface TrustDynamics {
  // Trust grows slowly, decays quickly
  growthRate: number;             // How fast trust increases
  decayRate: number;              // How fast trust decreases
  recoveryPeriod: number;         // Days to recover from major breach

  // Thresholds
  warningThreshold: number;       // Below this, warn user
  lockoutThreshold: number;       // Below this, reduce autonomy
  rehabilitationThreshold: number; // Need this to start regaining trust
}

export const DEFAULT_TRUST_DYNAMICS: TrustDynamics = {
  growthRate: 0.5,                // Slow growth
  decayRate: 2.0,                 // Fast decay (4x faster than growth)
  recoveryPeriod: 14,             // 2 weeks to recover

  warningThreshold: 40,
  lockoutThreshold: 20,
  rehabilitationThreshold: 30,
};

export default AutonomyState;
