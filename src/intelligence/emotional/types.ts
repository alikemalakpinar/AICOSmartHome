/**
 * AICO Smart Home - Emotional Intelligence Types
 *
 * Infers emotional and psychological states to provide
 * cognitive relief and emotional safety.
 */

import type { UserId, RoomId, DeviceId } from '@/types/core';

// ============================================================================
// Core Emotional Types
// ============================================================================

export interface EmotionalContext {
  // Current inferred states (ephemeral - never stored permanently)
  stress: StressIndicators;
  energy: EnergyLevel;
  socialMode: SocialMode;
  cognitiveLoad: CognitiveLoadLevel;
  mood: MoodIndicators;

  // Temporal emotional patterns
  circadianMood: CircadianPattern;
  weeklyRhythm: WeeklyEmotionalPattern;
  seasonalAffect: SeasonalAffectPattern;

  // Relationship dynamics
  householdHarmony: HouseholdHarmony;
  privacyNeed: PrivacyLevel;

  // Confidence in inference
  overallConfidence: number;
  lastUpdated: Date;
}

// ============================================================================
// Stress Indicators
// ============================================================================

export interface StressIndicators {
  level: StressLevel;
  confidence: number;
  sources: StressSource[];
  trend: 'increasing' | 'stable' | 'decreasing';

  // Component signals
  signals: {
    voiceStress?: VoiceStressSignal;
    movementStress?: MovementStressSignal;
    sleepStress?: SleepStressSignal;
    heartRateVariability?: HRVSignal;
    environmentalStress?: EnvironmentalStressSignal;
    behavioralStress?: BehavioralStressSignal;
  };
}

export type StressLevel = 'relaxed' | 'calm' | 'mild' | 'moderate' | 'elevated' | 'high';

export type StressSource =
  | 'sleep_deprivation'
  | 'work_pressure'
  | 'social_conflict'
  | 'health_concern'
  | 'environmental_discomfort'
  | 'time_pressure'
  | 'unknown';

export interface VoiceStressSignal {
  pitchVariation: number;      // Higher = more stress
  speechRate: number;          // Words per minute
  pauseFrequency: number;      // More pauses can indicate stress
  volumeVariation: number;
  confidence: number;
}

export interface MovementStressSignal {
  paceScore: number;           // 0-1, higher = more rushed
  restlessness: number;        // Movement without purpose
  hesitancy: number;           // Stopping/starting movements
  confidence: number;
}

export interface SleepStressSignal {
  hoursSlept: number;
  sleepQuality: number;        // 0-1
  sleepDebt: number;           // Hours accumulated
  wakeFrequency: number;       // Times woken during night
  confidence: number;
}

export interface HRVSignal {
  rmssd: number;               // Root mean square of successive differences
  sdnn: number;                // Standard deviation of NN intervals
  stressIndex: number;         // Calculated stress index
  recoveryScore: number;       // 0-100
  confidence: number;
}

export interface EnvironmentalStressSignal {
  clutterLevel: number;        // Visual disorder
  noiseLevel: number;          // Ambient noise
  temperatureComfort: number;  // Deviation from preference
  lightingComfort: number;
  airQuality: number;
  confidence: number;
}

export interface BehavioralStressSignal {
  taskSwitching: number;       // Frequent context switching
  incompleteTasks: number;     // Started but not finished
  deviceChecking: number;      // Compulsive device checking
  routineDeviation: number;    // Departure from normal patterns
  confidence: number;
}

// ============================================================================
// Energy Level
// ============================================================================

export interface EnergyLevel {
  physical: number;            // 0-100
  mental: number;              // 0-100
  social: number;              // 0-100 (social battery)
  overall: number;             // Weighted average
  trend: 'rising' | 'stable' | 'declining';

  // Factors
  factors: {
    sleepRecovery: number;
    activityLevel: number;
    nutritionIndicators: number;
    socialInteraction: number;
    timeOfDay: number;
  };
}

// ============================================================================
// Social & Cognitive Modes
// ============================================================================

export type SocialMode =
  | 'solitude'                 // Wants to be alone
  | 'intimate'                 // Close family/partner only
  | 'social'                   // Open to visitors
  | 'formal';                  // Professional/formal mode

export type CognitiveLoadLevel =
  | 'low'                      // Relaxed, available capacity
  | 'moderate'                 // Normal engagement
  | 'high'                     // Focused, limited spare capacity
  | 'overwhelmed';             // Capacity exceeded

export interface CognitiveLoadIndicators {
  level: CognitiveLoadLevel;
  taskComplexity: number;
  interruptionCount: number;
  decisionFatigue: number;
  attentionSpan: number;
  confidence: number;
}

// ============================================================================
// Mood Indicators
// ============================================================================

export interface MoodIndicators {
  valence: number;             // -1 (negative) to 1 (positive)
  arousal: number;             // 0 (calm) to 1 (energized)
  dominance: number;           // 0 (submissive) to 1 (in control)

  // Discrete emotions (probabilities)
  emotions: {
    happy: number;
    content: number;
    excited: number;
    anxious: number;
    frustrated: number;
    sad: number;
    angry: number;
    neutral: number;
  };

  confidence: number;
}

// ============================================================================
// Temporal Patterns
// ============================================================================

export interface CircadianPattern {
  morningMood: MoodIndicators;
  afternoonMood: MoodIndicators;
  eveningMood: MoodIndicators;
  nightMood: MoodIndicators;
  peakEnergyTime: number;      // Hour of day (0-23)
  lowEnergyTime: number;
  optimalFocusWindow: { start: number; end: number };
}

export interface WeeklyEmotionalPattern {
  dayPatterns: Map<number, DayEmotionalPattern>;  // 0-6
  weekdayVsWeekend: {
    weekdayStress: number;
    weekendStress: number;
    weekdayEnergy: number;
    weekendEnergy: number;
  };
  mostStressfulDay: number;
  mostRelaxedDay: number;
}

export interface DayEmotionalPattern {
  dayOfWeek: number;
  typicalStress: StressLevel;
  typicalEnergy: number;
  socialLikelihood: number;
  workIntensity: number;
}

export interface SeasonalAffectPattern {
  winterMood: number;          // -1 to 1
  springMood: number;
  summerMood: number;
  autumnMood: number;
  lightSensitivity: number;    // How much light affects mood
  temperatureSensitivity: number;
  hasSeasonalPattern: boolean;
}

// ============================================================================
// Household Dynamics
// ============================================================================

export interface HouseholdHarmony {
  overallHarmony: number;      // 0-1
  tensions: TensionIndicator[];
  lastConflict?: Date;
  recoveryProgress: number;    // If recovering from conflict

  // Interaction quality
  interactionFrequency: number;
  positiveInteractions: number;
  negativeInteractions: number;
}

export interface TensionIndicator {
  type: TensionType;
  severity: number;            // 0-1
  duration: number;            // Hours
  participants?: UserId[];
  resolved: boolean;
}

export type TensionType =
  | 'space_conflict'           // Competing for same space
  | 'noise_conflict'           // Volume/activity level mismatch
  | 'temperature_conflict'     // Different temperature preferences
  | 'schedule_conflict'        // Timing conflicts
  | 'privacy_conflict'         // Privacy boundary issues
  | 'resource_conflict'        // Competing for resources
  | 'general';

export type PrivacyLevel =
  | 'open'                     // Fine with observation
  | 'normal'                   // Standard privacy expectations
  | 'elevated'                 // Wants more privacy
  | 'maximum';                 // Do not disturb

// ============================================================================
// Emotional Response Configuration
// ============================================================================

export interface EmotionalResponse {
  trigger: EmotionalTrigger;
  actions: EmotionalAction[];
  priority: 'immediate' | 'soon' | 'gradual';
  reversible: boolean;
}

export interface EmotionalTrigger {
  condition: 'stress_high' | 'energy_low' | 'overwhelmed' | 'tension_detected' | 'mood_negative';
  threshold: number;
  duration?: number;           // Must persist for X minutes
}

export interface EmotionalAction {
  type: EmotionalActionType;
  target: 'environment' | 'notifications' | 'automation' | 'suggestions';
  action: string;
  intensity: number;
}

export type EmotionalActionType =
  | 'reduce_stimulation'       // Dim lights, reduce noise
  | 'increase_comfort'         // Optimize temperature, lighting
  | 'defer_decisions'          // Hold non-essential automation choices
  | 'suggest_break'            // Gentle break suggestion
  | 'enhance_privacy'          // Reduce system presence
  | 'prepare_recovery'         // Set up for rest/recovery
  | 'hold_notifications'       // Batch non-urgent notifications
  | 'enable_silence_mode';     // Maximum non-interference

// ============================================================================
// Inference Configuration
// ============================================================================

export interface EmotionalInferenceConfig {
  // Signal weights
  weights: {
    voice: number;
    movement: number;
    sleep: number;
    hrv: number;
    environmental: number;
    behavioral: number;
  };

  // Thresholds
  thresholds: {
    stressIntervention: number;
    energyWarning: number;
    overloadPrevention: number;
  };

  // Privacy
  privacy: {
    storeEmotionalData: boolean;
    retentionPeriod: number;   // Hours, 0 = never store
    shareWithOtherOccupants: boolean;
    anonymizeForAnalytics: boolean;
  };

  // Calibration
  calibration: {
    personalBaseline: boolean;
    adaptationRate: number;
    minConfidenceForAction: number;
  };
}

// ============================================================================
// Emotional Intelligence State
// ============================================================================

export interface EmotionalIntelligenceState {
  occupants: Map<UserId, EmotionalContext>;
  household: HouseholdHarmony;

  // Active responses
  activeResponses: EmotionalResponse[];

  // Learning
  learningState: {
    dataPoints: number;
    baselineEstablished: boolean;
    calibrationQuality: number;
    lastCalibration: Date;
  };
}

export default EmotionalIntelligenceState;
