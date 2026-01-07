/**
 * AICO Smart Home - Temporal Intelligence Types
 *
 * The system that understands past, present, and probable futures.
 * This is what makes the house anticipate rather than react.
 */

import type { DeviceId, RoomId, UserId, ResidenceId } from '@/types/core';

// ============================================================================
// Core Temporal Types
// ============================================================================

export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'season' | 'year';

export interface TimeWindow {
  start: Date;
  end: Date;
  granularity: TimeGranularity;
}

export interface TemporalMoment {
  timestamp: Date;
  dayOfWeek: number;        // 0-6
  hourOfDay: number;        // 0-23
  minuteOfHour: number;     // 0-59
  weekOfYear: number;       // 1-52
  monthOfYear: number;      // 1-12
  season: Season;
  isHoliday: boolean;
  isWeekend: boolean;
  sunPhase: SunPhase;
  lunarPhase?: LunarPhase;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SunPhase = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening';
export type LunarPhase = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' |
                         'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

// ============================================================================
// Pattern Types
// ============================================================================

export interface Pattern<T = unknown> {
  id: string;
  type: PatternType;
  confidence: number;           // 0-1, how certain we are this pattern exists
  stability: number;            // 0-1, how consistent the pattern is
  firstObserved: Date;
  lastObserved: Date;
  occurrences: number;
  data: T;

  // Pattern lifecycle
  status: 'emerging' | 'established' | 'fading' | 'dormant';
  nextExpectedOccurrence?: Date;
}

export type PatternType =
  | 'daily_routine'
  | 'weekly_routine'
  | 'seasonal_behavior'
  | 'occupancy_pattern'
  | 'energy_usage'
  | 'sleep_pattern'
  | 'social_pattern'
  | 'comfort_preference'
  | 'arrival_departure'
  | 'meal_pattern'
  | 'work_pattern'
  | 'leisure_pattern'
  | 'ritual';

export interface DailyPattern extends Pattern {
  type: 'daily_routine';
  data: {
    timeSlots: TimeSlotBehavior[];
    variations: DayVariation[];
    exceptions: PatternException[];
  };
}

export interface TimeSlotBehavior {
  startTime: string;          // HH:MM format
  endTime: string;
  probability: number;        // Likelihood this slot is active
  activities: ActivitySignature[];
  environmentPreferences: EnvironmentState;
}

export interface ActivitySignature {
  type: ActivityType;
  duration: DurationRange;
  location: RoomId[];
  devices: DeviceId[];
  confidence: number;
}

export type ActivityType =
  | 'sleeping' | 'waking' | 'morning_routine' | 'breakfast'
  | 'working' | 'studying' | 'cooking' | 'eating'
  | 'relaxing' | 'exercising' | 'watching_media' | 'reading'
  | 'socializing' | 'entertaining' | 'cleaning' | 'bathing'
  | 'leaving' | 'arriving' | 'unknown';

export interface DurationRange {
  min: number;    // minutes
  typical: number;
  max: number;
}

export interface DayVariation {
  dayType: 'weekday' | 'weekend' | 'holiday' | 'special';
  modifier: number;   // Multiplier for pattern timing
  shifts: TimeShift[];
}

export interface TimeShift {
  originalSlot: string;
  shiftedTo: string;
  probability: number;
}

export interface PatternException {
  date: Date;
  reason?: string;
  deviation: number;  // How much it differed from expected
}

// ============================================================================
// Weekly Patterns
// ============================================================================

export interface WeeklyPattern extends Pattern {
  type: 'weekly_routine';
  data: {
    dayProfiles: Map<number, DayProfile>;  // 0-6 -> profile
    crossDayPatterns: CrossDayPattern[];
    weeklyRhythm: WeeklyRhythm;
  };
}

export interface DayProfile {
  dayOfWeek: number;
  typicalWakeTime: string;
  typicalSleepTime: string;
  occupancyProbability: number[];  // 24 hourly values
  energyProfile: number[];         // 24 hourly values
  activityDensity: number;         // How busy the day typically is
}

export interface CrossDayPattern {
  name: string;
  span: number[];                  // Days involved (e.g., [5, 6] for weekend)
  behavior: string;
  confidence: number;
}

export interface WeeklyRhythm {
  busiestDay: number;
  quietestDay: number;
  socialDays: number[];
  maintenanceDays: number[];
  variability: number;             // How predictable the week is
}

// ============================================================================
// Seasonal Patterns
// ============================================================================

export interface SeasonalPattern extends Pattern {
  type: 'seasonal_behavior';
  data: {
    season: Season;
    temperaturePreference: TemperatureRange;
    lightingPreference: LightingPreference;
    activityShifts: ActivityShift[];
    energyBaseline: number;
    occupancyModifier: number;
  };
}

export interface TemperatureRange {
  dayMin: number;
  dayMax: number;
  nightMin: number;
  nightMax: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface LightingPreference {
  wakeLight: number;              // 0-100
  dayLight: number;
  eveningLight: number;
  nightLight: number;
  colorTempPreference: number;    // Kelvin
}

export interface ActivityShift {
  activity: ActivityType;
  seasonalChange: 'more' | 'less' | 'shifted';
  magnitude: number;
}

// ============================================================================
// Predictive Scenarios
// ============================================================================

export interface Scenario {
  id: string;
  description: string;
  probability: number;            // 0-1
  timeframe: TimeWindow;

  // What we predict
  predictedState: PredictedState;
  requiredPreparation: PreparationAction[];

  // Relationships
  enabledBy: string[];            // Other scenarios that make this more likely
  conflictsWith: string[];        // Mutually exclusive scenarios

  // Decision making
  userConfirmationNeeded: boolean;
  autoExecuteThreshold: number;   // Probability at which we auto-execute

  // Tracking
  source: 'pattern' | 'calendar' | 'inference' | 'external';
  confidence: number;
}

export interface PredictedState {
  occupancy: OccupancyPrediction;
  activities: ActivityPrediction[];
  environmentNeeds: EnvironmentPrediction;
  resourceNeeds: ResourcePrediction;
}

export interface OccupancyPrediction {
  expectedOccupants: UserId[];
  arrivalTimes: Map<UserId, Date>;
  departureTimes: Map<UserId, Date>;
  guestProbability: number;
  guestCount?: number;
}

export interface ActivityPrediction {
  activity: ActivityType;
  probability: number;
  location: RoomId;
  participants: UserId[];
  duration: DurationRange;
}

export interface EnvironmentPrediction {
  temperature: TemperatureRange;
  lighting: LightingPreference;
  humidity: { min: number; max: number };
  ventilation: 'minimal' | 'normal' | 'increased';
  noise: 'quiet' | 'normal' | 'social';
}

export interface ResourcePrediction {
  energyDemand: number;           // kWh expected
  waterDemand: number;            // Liters expected
  peakLoadTime: Date;
  unusualConsumption: boolean;
}

export interface PreparationAction {
  id: string;
  type: 'environmental' | 'security' | 'resource' | 'notification';
  action: string;
  executeAt: Date;
  priority: 'critical' | 'high' | 'normal' | 'low';
  reversible: boolean;
  dependencies: string[];
}

// ============================================================================
// Environment State
// ============================================================================

export interface EnvironmentState {
  temperature: number;
  humidity: number;
  lighting: {
    brightness: number;
    colorTemp: number;
    rgb?: { r: number; g: number; b: number };
  };
  airQuality?: {
    co2: number;
    pm25: number;
    voc: number;
  };
  noise: number;                  // dB
  curtains: number;               // 0-100 open percentage
}

// ============================================================================
// Lifecycle Events
// ============================================================================

export interface LifecycleEvent {
  id: string;
  type: LifecycleEventType;
  date: Date;
  description: string;
  impact: LifecycleImpact;
  detected: boolean;              // Auto-detected vs user-reported
  confirmed: boolean;
}

export type LifecycleEventType =
  | 'new_occupant'
  | 'occupant_left'
  | 'baby_arrival'
  | 'child_growth_stage'
  | 'retirement'
  | 'work_change'
  | 'health_change'
  | 'relationship_change'
  | 'renovation'
  | 'new_pet'
  | 'pet_loss'
  | 'bereavement';

export interface LifecycleImpact {
  patternsAffected: PatternType[];
  automationChanges: string[];
  durationOfImpact: 'temporary' | 'permanent' | 'gradual';
  sensitivityPeriod?: TimeWindow;
}

// ============================================================================
// Temporal Intelligence State
// ============================================================================

export interface TemporalIntelligenceState {
  // Current understanding
  currentMoment: TemporalMoment;
  activePatterns: Pattern[];

  // Historical knowledge
  patternLibrary: {
    daily: DailyPattern[];
    weekly: WeeklyPattern[];
    seasonal: SeasonalPattern[];
    lifecycle: LifecycleEvent[];
  };

  // Predictions
  scenarios: {
    immediate: Scenario[];        // Next 30 minutes
    shortTerm: Scenario[];        // Next 2-4 hours
    today: Scenario[];            // Rest of today
    thisWeek: Scenario[];         // This week
    upcoming: Scenario[];         // Beyond this week
  };

  // Learning state
  learningProgress: {
    daysOfData: number;
    patternConfidence: number;
    predictionAccuracy: number;
    lastCalibration: Date;
  };
}

export default TemporalIntelligenceState;
