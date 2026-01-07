/**
 * AICO Smart Home - Ritual Recognition Types
 *
 * A home that understands the poetry of routine.
 * Not just patterns, but rituals - sequences with meaning,
 * comfort derived from repetition, moments of daily ceremony.
 */

import type { RoomId, UserId, DeviceId } from '@/types/core';

// ============================================================================
// Ritual Definition
// ============================================================================

/**
 * A ritual is more than a pattern - it's a meaningful sequence
 * that provides comfort, structure, and identity.
 */
export interface Ritual {
  id: string;
  name: string;
  participants: UserId[];
  type: RitualType;
  frequency: RitualFrequency;
  sequence: RitualStep[];
  timing: RitualTiming;
  importance: RitualImportance;
  flexibility: RitualFlexibility;
  metadata: RitualMetadata;
}

export type RitualType =
  // Daily rituals
  | 'morning_routine'             // Wake up, shower, breakfast
  | 'evening_wind_down'           // Preparing for sleep
  | 'meal_preparation'            // Cooking rituals
  | 'work_focus'                  // Getting into work mode
  | 'exercise'                    // Workout routines
  | 'meditation'                  // Mindfulness practice
  | 'reading_time'                // Daily reading
  | 'coffee_tea_ritual'           // The sacred caffeine moment

  // Weekly rituals
  | 'weekend_brunch'              // Sunday morning tradition
  | 'family_dinner'               // Weekly gathering
  | 'cleaning_day'                // Scheduled cleaning
  | 'shopping_trip'               // Regular shopping
  | 'movie_night'                 // Entertainment ritual
  | 'game_night'                  // Family/friend game time

  // Seasonal rituals
  | 'holiday_preparation'         // Getting ready for holidays
  | 'seasonal_transition'         // Changing home for seasons
  | 'spring_cleaning'             // Deep cleaning
  | 'garden_care'                 // Seasonal gardening

  // Life rituals
  | 'celebration'                 // Birthdays, anniversaries
  | 'remembrance'                 // Memorial moments
  | 'guest_hosting'               // Having visitors
  | 'self_care'                   // Personal wellness time

  // Custom
  | 'custom';

export type RitualFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'seasonal'
  | 'annual'
  | 'irregular';

// ============================================================================
// Ritual Steps
// ============================================================================

export interface RitualStep {
  order: number;
  name: string;
  actions: RitualAction[];
  duration: DurationRange;
  optional: boolean;
  variations: StepVariation[];
  dependencies: number[];         // Step orders that must complete first
}

export interface RitualAction {
  type: ActionType;
  target: DeviceId | RoomId | 'house';
  parameters: Record<string, unknown>;
  triggeredBy: TriggerType;
  timing: 'start' | 'during' | 'end';
}

export type ActionType =
  | 'set_lighting'
  | 'set_temperature'
  | 'play_music'
  | 'play_sound'
  | 'activate_scene'
  | 'adjust_blinds'
  | 'start_appliance'
  | 'send_notification'
  | 'set_ambience';

export type TriggerType =
  | 'time_based'                  // At specific time
  | 'step_start'                  // When step begins
  | 'step_end'                    // When step ends
  | 'user_action'                 // User does something
  | 'sensor_trigger'              // Sensor detects something
  | 'previous_complete';          // Previous step finishes

export interface DurationRange {
  typical: number;                // Minutes
  minimum: number;
  maximum: number;
  variance: number;               // Standard deviation
}

export interface StepVariation {
  condition: VariationCondition;
  modifications: Partial<RitualStep>;
}

export type VariationCondition =
  | 'weekday'
  | 'weekend'
  | 'holiday'
  | 'guest_present'
  | 'running_late'
  | 'extra_time'
  | 'weather_bad'
  | 'mood_low';

// ============================================================================
// Ritual Timing
// ============================================================================

export interface RitualTiming {
  preferredStart: TimeWindow;
  typicalDuration: number;        // Minutes
  flexibility: number;            // Minutes of acceptable variance
  anchors: TimeAnchor[];          // External time dependencies
  blockedBy: string[];            // Other ritual IDs that can't overlap
}

export interface TimeWindow {
  earliest: string;               // HH:MM format
  ideal: string;
  latest: string;
  dayOfWeek?: number[];           // 0-6, Sunday = 0
}

export interface TimeAnchor {
  type: 'before' | 'after' | 'around';
  event: AnchorEvent;
  offset: number;                 // Minutes
}

export type AnchorEvent =
  | 'wake_up'
  | 'leave_home'
  | 'arrive_home'
  | 'sunset'
  | 'sunrise'
  | 'meal_time'
  | 'bedtime'
  | 'work_start'
  | 'work_end';

// ============================================================================
// Ritual Importance & Flexibility
// ============================================================================

export interface RitualImportance {
  level: ImportanceLevel;
  reason: string;
  skipConsequence: SkipConsequence;
  protectedTime: boolean;         // Should other activities avoid this time
}

export type ImportanceLevel =
  | 'sacred'                      // Never skip, deeply meaningful
  | 'important'                   // Strong preference to maintain
  | 'preferred'                   // Nice to have
  | 'optional';                   // Flexible

export type SkipConsequence =
  | 'significant_stress'          // Skipping causes real distress
  | 'mild_discomfort'             // Slightly off day
  | 'minor_inconvenience'         // Manageable
  | 'no_impact';                  // Doesn't matter

export interface RitualFlexibility {
  // Time flexibility
  canStartEarly: boolean;
  canStartLate: boolean;
  canBeShortened: boolean;
  minimumDuration: number;        // Minutes

  // Step flexibility
  stepsCanBeSkipped: number[];    // Step orders
  stepsCanBeReordered: boolean;
  canBeInterrupted: boolean;
  resumeAfterInterrupt: boolean;

  // Participation flexibility
  canBeSolo: boolean;
  requiresAllParticipants: boolean;
  substituteParticipants: boolean;
}

// ============================================================================
// Ritual Metadata
// ============================================================================

export interface RitualMetadata {
  discoveredAt: Date;
  lastOccurrence: Date;
  occurrenceCount: number;
  confidence: number;             // 0-1, how sure we are this is a ritual
  userConfirmed: boolean;         // User explicitly acknowledged
  userNamed: boolean;             // User gave it a name
  history: RitualOccurrence[];
  evolution: RitualEvolution[];
}

export interface RitualOccurrence {
  date: Date;
  startTime: Date;
  endTime: Date;
  stepsCompleted: number[];
  participants: UserId[];
  interruptions: Interruption[];
  satisfaction?: number;          // 0-100 if user rated
  notes?: string;
}

export interface Interruption {
  step: number;
  cause: string;
  duration: number;               // Minutes
  resumed: boolean;
}

export interface RitualEvolution {
  date: Date;
  change: EvolutionChange;
  description: string;
}

export type EvolutionChange =
  | 'timing_shift'                // Start time changed
  | 'duration_change'             // Got longer/shorter
  | 'step_added'                  // New step
  | 'step_removed'                // Step dropped
  | 'participant_added'           // Someone joined
  | 'participant_removed'         // Someone stopped
  | 'frequency_change';           // More or less often

// ============================================================================
// Ritual Support
// ============================================================================

export interface RitualSupport {
  ritualId: string;
  preparations: RitualPreparation[];
  automations: RitualAutomation[];
  protections: RitualProtection[];
  enhancements: RitualEnhancement[];
}

export interface RitualPreparation {
  id: string;
  action: string;
  advanceTime: number;            // Minutes before ritual
  condition?: string;
  enabled: boolean;
}

export interface RitualAutomation {
  id: string;
  trigger: AutomationTrigger;
  actions: RitualAction[];
  enabled: boolean;
  userApproved: boolean;
}

export interface AutomationTrigger {
  type: 'step_start' | 'step_end' | 'ritual_start' | 'ritual_end' | 'condition';
  stepOrder?: number;
  condition?: string;
}

export interface RitualProtection {
  type: ProtectionType;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export type ProtectionType =
  | 'do_not_disturb'              // Block notifications
  | 'hold_deliveries'             // Don't announce deliveries
  | 'quiet_mode'                  // Reduce ambient noise
  | 'lock_scene'                  // Don't change lighting/music
  | 'decline_calls'               // Auto-decline during ritual
  | 'away_message';               // Auto-respond to messages

export interface RitualEnhancement {
  type: EnhancementType;
  settings: Record<string, unknown>;
  enabled: boolean;
}

export type EnhancementType =
  | 'ambient_music'               // Background music
  | 'lighting_scene'              // Special lighting
  | 'temperature_preset'          // Comfort temperature
  | 'scent_diffusion'             // Aromatherapy
  | 'countdown_timer'             // Visual timer
  | 'transition_sound';           // Sound between steps

// ============================================================================
// Ritual Detection
// ============================================================================

export interface RitualCandidate {
  pattern: DetectedPattern;
  confidence: number;
  suggestedType: RitualType;
  suggestedName: string;
  reasoning: string[];
  occurrences: Date[];
  needsConfirmation: boolean;
}

export interface DetectedPattern {
  actions: DetectedAction[];
  timing: DetectedTiming;
  participants: UserId[];
  frequency: RitualFrequency;
  consistency: number;            // 0-1, how consistent the pattern is
}

export interface DetectedAction {
  type: string;
  target: string;
  orderInSequence: number;
  frequency: number;              // How often this action appears
  timing: { mean: number; variance: number };
}

export interface DetectedTiming {
  averageStart: string;           // HH:MM
  startVariance: number;          // Minutes
  averageDuration: number;
  durationVariance: number;
}

// ============================================================================
// Ritual State
// ============================================================================

export interface RitualState {
  // Known rituals
  rituals: Map<string, Ritual>;

  // Active rituals
  activeRituals: ActiveRitual[];

  // Candidates awaiting confirmation
  candidates: RitualCandidate[];

  // Support configurations
  supports: Map<string, RitualSupport>;

  // Detection settings
  detectionConfig: DetectionConfig;
}

export interface ActiveRitual {
  ritualId: string;
  startedAt: Date;
  currentStep: number;
  participants: UserId[];
  status: 'in_progress' | 'paused' | 'interrupted';
  completedSteps: number[];
  estimatedEnd: Date;
}

export interface DetectionConfig {
  minOccurrences: number;         // Minimum to consider a ritual
  minConfidence: number;          // Minimum confidence to suggest
  autoConfirmThreshold: number;   // Confidence to auto-confirm
  learningEnabled: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
}

export default RitualState;
