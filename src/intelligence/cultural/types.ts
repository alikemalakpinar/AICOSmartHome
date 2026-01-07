/**
 * AICO Smart Home - Cultural & Seasonal Awareness Types
 *
 * A home that understands the rhythm of culture and seasons.
 * Ramadan schedules, seasonal celebrations, life transitions -
 * the house adapts to the full spectrum of human experience.
 */

import type { UserId, RoomId } from '@/types/core';

// ============================================================================
// Cultural Context
// ============================================================================

export interface CulturalProfile {
  id: string;
  householdId: string;
  primaryCulture: CultureIdentifier;
  secondaryCultures: CultureIdentifier[];
  religiousObservances: ReligiousObservance[];
  culturalPreferences: CulturalPreferences;
  familyStructure: FamilyStructure;
  communicationStyle: CommunicationStyle;
}

export interface CultureIdentifier {
  region: string;                 // e.g., 'turkey', 'germany', 'japan'
  subculture?: string;            // e.g., 'istanbul', 'bavarian', 'kansai'
  diaspora?: boolean;             // Living outside cultural homeland
  generational?: number;          // Diaspora generation
}

export interface ReligiousObservance {
  religion: Religion;
  observanceLevel: 'secular' | 'cultural' | 'observant' | 'strict';
  specificTraditions: string[];
  dietaryRestrictions: DietaryRestriction[];
}

export type Religion =
  | 'islam'
  | 'christianity_orthodox'
  | 'christianity_catholic'
  | 'christianity_protestant'
  | 'judaism'
  | 'buddhism'
  | 'hinduism'
  | 'sikhism'
  | 'secular'
  | 'spiritual'
  | 'other';

export interface DietaryRestriction {
  type: 'halal' | 'kosher' | 'vegetarian' | 'vegan' | 'no_pork' | 'no_beef' | 'no_alcohol' | 'other';
  strictness: 'strict' | 'moderate' | 'flexible';
  exceptions?: string[];
}

export interface CulturalPreferences {
  // Hospitality
  hospitalityStyle: 'formal' | 'warm_informal' | 'reserved' | 'elaborate';
  guestExpectations: GuestExpectation[];

  // Social norms
  genderSeparation: 'none' | 'optional' | 'preferred' | 'required';
  elderRespect: 'modern' | 'traditional' | 'formal';

  // Home customs
  shoesInside: 'allowed' | 'discouraged' | 'forbidden';
  formalAreas: RoomId[];

  // Communication
  directness: 'very_direct' | 'direct' | 'indirect' | 'very_indirect';
  formalityDefault: 'casual' | 'polite' | 'formal' | 'honorific';
}

export interface GuestExpectation {
  type: 'offer_tea' | 'offer_coffee' | 'offer_food' | 'offer_slippers' | 'formal_greeting';
  automatic: boolean;
  timing: 'immediate' | 'after_seated' | 'after_conversation';
}

export interface FamilyStructure {
  type: 'nuclear' | 'extended' | 'multigenerational' | 'single_parent' | 'couple' | 'single';
  headOfHousehold?: UserId;       // If culturally relevant
  elderPresent: boolean;
  childrenPresent: boolean;
  ageGroups: AgeGroup[];
}

export interface AgeGroup {
  range: 'infant' | 'child' | 'teen' | 'young_adult' | 'adult' | 'middle_age' | 'senior' | 'elderly';
  count: number;
  specialNeeds?: string[];
}

export type CommunicationStyle =
  | 'high_context'                // Meaning from context
  | 'low_context'                 // Explicit communication
  | 'mixed';

// ============================================================================
// Calendar Systems
// ============================================================================

export interface CalendarAwareness {
  // Multiple calendar systems
  primaryCalendar: CalendarSystem;
  secondaryCalendars: CalendarSystem[];

  // Current date in all systems
  currentDates: Map<CalendarSystem, CalendarDate>;

  // Upcoming events
  upcomingEvents: CulturalEvent[];

  // Special periods
  activeSpecialPeriods: SpecialPeriod[];
}

export type CalendarSystem =
  | 'gregorian'
  | 'islamic_hijri'
  | 'hebrew'
  | 'chinese_lunar'
  | 'persian'
  | 'indian_hindu'
  | 'ethiopian'
  | 'buddhist';

export interface CalendarDate {
  system: CalendarSystem;
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
  isSpecialDay: boolean;
  specialDayName?: string;
}

// ============================================================================
// Cultural Events & Holidays
// ============================================================================

export interface CulturalEvent {
  id: string;
  name: string;
  localName: string;              // Name in original language
  type: EventType;
  culture: CultureIdentifier;
  religion?: Religion;
  date: EventDate;
  importance: EventImportance;
  traditions: EventTradition[];
  homeAdjustments: HomeAdjustment[];
  greetings: Greeting[];
}

export type EventType =
  // Religious
  | 'religious_major'             // Major religious holiday
  | 'religious_minor'             // Minor observance
  | 'fasting_period'              // Fasting time
  | 'pilgrimage'                  // Pilgrimage period

  // National/Cultural
  | 'national_holiday'
  | 'cultural_celebration'
  | 'remembrance'
  | 'independence'

  // Seasonal
  | 'new_year'
  | 'spring_festival'
  | 'harvest_festival'
  | 'winter_festival'
  | 'summer_celebration'

  // Family
  | 'mothers_day'
  | 'fathers_day'
  | 'childrens_day'
  | 'family_day'

  // Life events
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'wedding'
  | 'birth'
  | 'memorial';

export interface EventDate {
  // Fixed or calculated
  type: 'fixed' | 'lunar' | 'calculated' | 'variable';

  // For fixed dates
  month?: number;
  day?: number;

  // For calculated dates
  calculation?: string;           // e.g., 'first_monday_of_september'
  calendarSystem?: CalendarSystem;

  // Duration
  duration: number;               // Days
  preparationDays: number;        // Days before
}

export type EventImportance =
  | 'major'                       // Big celebration, major changes
  | 'significant'                 // Notable, some changes
  | 'minor'                       // Acknowledged, minimal changes
  | 'awareness';                  // Just awareness, no changes

export interface EventTradition {
  name: string;
  description: string;
  timing: 'before' | 'during' | 'after';
  homeRelevant: boolean;
  automatable: boolean;
}

export interface HomeAdjustment {
  type: AdjustmentType;
  parameters: Record<string, unknown>;
  timing: 'preparation' | 'during' | 'cleanup';
  priority: number;
}

export type AdjustmentType =
  | 'lighting_scheme'
  | 'temperature_preset'
  | 'schedule_shift'
  | 'alarm_adjustment'
  | 'meal_timing'
  | 'guest_preparation'
  | 'decoration_reminder'
  | 'music_playlist'
  | 'notification_silence'
  | 'special_scene';

export interface Greeting {
  language: string;
  text: string;
  pronunciation?: string;
  appropriate: 'all_day' | 'morning' | 'evening' | 'on_meeting';
  voiceEnabled: boolean;
}

// ============================================================================
// Special Periods (Ramadan, etc.)
// ============================================================================

export interface SpecialPeriod {
  id: string;
  name: string;
  type: SpecialPeriodType;
  startDate: Date;
  endDate: Date;
  dailySchedule?: DailySchedule;
  restrictions: Restriction[];
  homeMode: HomeMode;
  automations: PeriodAutomation[];
}

export type SpecialPeriodType =
  | 'ramadan'
  | 'lent'
  | 'advent'
  | 'hanukkah'
  | 'diwali'
  | 'chinese_new_year_period'
  | 'mourning'
  | 'celebration_period'
  | 'sabbath'
  | 'shabbat';

export interface DailySchedule {
  // For fasting periods
  fastingStart?: string;          // Time
  fastingEnd?: string;
  prayerTimes?: PrayerTime[];

  // Meal adjustments
  mealTimes: MealAdjustment[];

  // Activity windows
  activeHours: TimeRange[];
  quietHours: TimeRange[];
}

export interface PrayerTime {
  name: string;                   // e.g., 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha'
  time: string;                   // Calculated based on location
  notificationMinutes: number;    // Minutes before
  quietPeriod: number;            // Minutes of quiet
}

export interface MealAdjustment {
  meal: 'suhoor' | 'iftar' | 'breakfast' | 'lunch' | 'dinner' | 'sabbath_meal';
  time: string;
  preparation: number;            // Minutes before
  duration: number;               // Minutes
  automations: string[];          // Automation IDs to trigger
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Restriction {
  type: 'no_music' | 'no_entertainment' | 'quiet_mode' | 'no_cooking_smell' | 'modest_lighting' | 'no_work';
  strictness: 'suggestion' | 'reminder' | 'enforced';
  exceptions?: string[];
}

export interface HomeMode {
  name: string;
  lighting: LightingMode;
  audio: AudioMode;
  climate: ClimateMode;
  notifications: NotificationMode;
}

export interface LightingMode {
  defaultScheme: string;
  maxBrightness: number;
  colorTemperature: number;
  specialScenes: string[];
}

export interface AudioMode {
  musicAllowed: boolean;
  allowedGenres?: string[];
  maxVolume: number;
  callToActionEnabled: boolean;   // e.g., Adhan
}

export interface ClimateMode {
  preferredTemp: number;
  ecoMode: boolean;
  ventilationBoost?: string[];    // Times to boost
}

export interface NotificationMode {
  silentHours: TimeRange[];
  allowedCategories: string[];
  prayerReminders: boolean;
  mealReminders: boolean;
}

export interface PeriodAutomation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationTrigger {
  type: 'time' | 'prayer' | 'sunset' | 'sunrise' | 'meal_time' | 'manual';
  value?: string;
  offset?: number;                // Minutes
}

export interface AutomationAction {
  type: string;
  target: string;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Seasonal Awareness
// ============================================================================

export interface SeasonalContext {
  currentSeason: Season;
  seasonTransition: SeasonTransition | null;
  weatherContext: WeatherContext;
  daylightInfo: DaylightInfo;
  seasonalMood: SeasonalMood;
  homeSeasonalization: HomeSeasonalization;
}

export interface Season {
  name: 'spring' | 'summer' | 'autumn' | 'winter';
  localName: string;
  startDate: Date;
  endDate: Date;
  characteristics: SeasonCharacteristic[];
  culturalSignificance: string[];
}

export interface SeasonTransition {
  from: Season;
  to: Season;
  progress: number;               // 0-1
  transitionTasks: TransitionTask[];
}

export interface TransitionTask {
  name: string;
  description: string;
  category: 'climate' | 'lighting' | 'storage' | 'garden' | 'maintenance';
  priority: number;
  suggestedDate?: Date;
  completed: boolean;
}

export interface SeasonCharacteristic {
  type: 'temperature' | 'daylight' | 'weather' | 'activity' | 'mood';
  description: string;
  homeImplication: string;
}

export interface WeatherContext {
  current: string;
  forecast: string[];             // Next 7 days summary
  extreme: boolean;
  homeRelevant: string[];         // Weather-related home suggestions
}

export interface DaylightInfo {
  sunrise: string;
  sunset: string;
  daylightHours: number;
  goldenHourMorning: string;
  goldenHourEvening: string;
  blueHour: string;
  trend: 'lengthening' | 'shortening' | 'stable';
}

export interface SeasonalMood {
  // Seasonal affective considerations
  lightNeed: 'high' | 'medium' | 'low';
  energyLevel: 'high' | 'medium' | 'low';
  socialTendency: 'outgoing' | 'mixed' | 'cozy';
  suggestions: string[];
}

export interface HomeSeasonalization {
  currentScheme: string;
  colorPalette: string[];
  scentSuggestions: string[];
  musicMood: string;
  temperatureOffset: number;      // Seasonal preference adjustment
  lightingAdjustment: number;     // Brightness adjustment
}

// ============================================================================
// Life Events
// ============================================================================

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  date: Date;
  participants: UserId[];
  culturalTreatment: CulturalTreatment;
  homePreparation: HomePreparation[];
  duration: EventDuration;
  privacy: 'private' | 'family' | 'friends' | 'public';
}

export type LifeEventType =
  // Joyful
  | 'birth'
  | 'engagement'
  | 'wedding'
  | 'graduation'
  | 'new_job'
  | 'retirement'
  | 'new_home'
  | 'birthday'
  | 'anniversary'

  // Difficult
  | 'illness'
  | 'loss'
  | 'divorce'
  | 'job_loss'
  | 'moving_away'

  // Transitions
  | 'child_leaving'
  | 'elder_moving_in'
  | 'pet_arrival'
  | 'pet_loss';

export interface CulturalTreatment {
  traditions: string[];
  expectations: string[];
  taboos: string[];
  supportNeeds: string[];
}

export interface HomePreparation {
  task: string;
  timing: 'immediate' | 'before_event' | 'during' | 'after';
  automatable: boolean;
  priority: number;
}

export interface EventDuration {
  type: 'moment' | 'day' | 'period' | 'ongoing';
  days?: number;
  indefinite?: boolean;
}

// ============================================================================
// Cultural State
// ============================================================================

export interface CulturalState {
  profile: CulturalProfile;
  calendar: CalendarAwareness;
  currentPeriods: SpecialPeriod[];
  seasonalContext: SeasonalContext;
  lifeEvents: LifeEvent[];
  upcomingCelebrations: CulturalEvent[];
  activeAdjustments: HomeAdjustment[];
  prayerSchedule?: PrayerTime[];
}

export default CulturalState;
