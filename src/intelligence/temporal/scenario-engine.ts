/**
 * AICO Smart Home - Scenario Prediction Engine
 *
 * Generates probabilistic future scenarios based on patterns,
 * calendar, context, and inference.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  Scenario,
  PredictedState,
  PreparationAction,
  Pattern,
  TemporalMoment,
  TimeWindow,
  OccupancyPrediction,
  ActivityPrediction,
  EnvironmentPrediction,
  ResourcePrediction,
  ActivityType,
} from './types';
import type { UserId, RoomId } from '@/types/core';
import { PatternEngine } from './pattern-engine';

// ============================================================================
// Types
// ============================================================================

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  recurrence?: string;
  type: 'personal' | 'work' | 'social' | 'travel' | 'other';
}

interface ExternalContext {
  weather: {
    current: WeatherCondition;
    forecast: WeatherForecast[];
  };
  traffic?: {
    homeToWork: number;  // Minutes
    workToHome: number;
  };
  events?: {
    localEvents: string[];
    holidays: string[];
  };
}

interface WeatherCondition {
  temperature: number;
  humidity: number;
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  windSpeed: number;
}

interface WeatherForecast extends WeatherCondition {
  time: Date;
}

interface ScenarioEngineConfig {
  predictionHorizons: {
    immediate: number;    // Minutes
    shortTerm: number;    // Hours
    daily: number;        // Hours
    weekly: number;       // Days
  };
  minScenarioProbability: number;
  autoExecuteThreshold: number;
  conflictResolutionStrategy: 'conservative' | 'balanced' | 'aggressive';
}

type ScenarioEngineEvents = {
  scenarioGenerated: [Scenario];
  scenarioUpdated: [Scenario];
  scenarioExpired: [Scenario];
  preparationTriggered: [PreparationAction];
  conflictDetected: [Scenario, Scenario];
};

// ============================================================================
// Scenario Engine
// ============================================================================

export class ScenarioEngine extends EventEmitter<ScenarioEngineEvents> {
  private config: ScenarioEngineConfig;
  private patternEngine: PatternEngine;
  private scenarios: Map<string, Scenario> = new Map();
  private calendar: CalendarEvent[] = [];
  private externalContext: ExternalContext | null = null;
  private occupants: Map<UserId, OccupantState> = new Map();

  constructor(patternEngine: PatternEngine, config: Partial<ScenarioEngineConfig> = {}) {
    super();
    this.patternEngine = patternEngine;
    this.config = {
      predictionHorizons: {
        immediate: 30,
        shortTerm: 240,
        daily: 24,
        weekly: 7,
      },
      minScenarioProbability: 0.3,
      autoExecuteThreshold: 0.85,
      conflictResolutionStrategy: 'balanced',
      ...config,
    };

    // Listen to pattern changes
    this.patternEngine.on('patternDiscovered', (pattern) => {
      this.regenerateScenarios();
    });
  }

  // ============================================================================
  // Context Updates
  // ============================================================================

  updateCalendar(events: CalendarEvent[]): void {
    this.calendar = events;
    this.regenerateScenarios();
  }

  updateExternalContext(context: ExternalContext): void {
    this.externalContext = context;
    this.regenerateScenarios();
  }

  updateOccupantState(userId: UserId, state: OccupantState): void {
    this.occupants.set(userId, state);
    this.regenerateScenarios();
  }

  // ============================================================================
  // Scenario Generation
  // ============================================================================

  regenerateScenarios(): void {
    const now = new Date();
    const moment = this.dateToMoment(now);

    // Clear expired scenarios
    this.cleanupExpiredScenarios(now);

    // Generate scenarios for each time horizon
    this.generateImmediateScenarios(now, moment);
    this.generateShortTermScenarios(now, moment);
    this.generateDailyScenarios(now, moment);
    this.generateWeeklyScenarios(now, moment);

    // Resolve conflicts
    this.resolveConflicts();

    // Trigger preparation actions
    this.triggerPreparations(now);
  }

  private generateImmediateScenarios(now: Date, moment: TemporalMoment): void {
    const horizon = new Date(now.getTime() + this.config.predictionHorizons.immediate * 60000);

    // Check for imminent calendar events
    const imminentEvents = this.getEventsInRange(now, horizon);
    for (const event of imminentEvents) {
      this.createEventScenario(event, 'immediate');
    }

    // Check for pattern-based predictions
    const patternPredictions = this.patternEngine.getPredictionForMoment(moment);
    for (const activity of patternPredictions.activities) {
      if (activity.confidence > this.config.minScenarioProbability) {
        this.createActivityScenario(activity, now, horizon);
      }
    }

    // Check for arrival predictions
    this.predictArrivals(now, horizon);
  }

  private generateShortTermScenarios(now: Date, moment: TemporalMoment): void {
    const horizon = new Date(now.getTime() + this.config.predictionHorizons.shortTerm * 60 * 60000);

    // Pattern-based meal predictions
    this.predictMeals(now, horizon);

    // Social gathering predictions
    this.predictSocialEvents(now, horizon);

    // Energy usage predictions
    this.predictEnergyDemand(now, horizon);
  }

  private generateDailyScenarios(now: Date, moment: TemporalMoment): void {
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Tonight's activities
    this.predictEveningActivities(now, endOfDay);

    // Sleep predictions
    this.predictSleep(now, endOfDay);
  }

  private generateWeeklyScenarios(now: Date, moment: TemporalMoment): void {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Upcoming events
    const weekEvents = this.getEventsInRange(now, weekEnd);
    for (const event of weekEvents) {
      this.createEventScenario(event, 'weekly');
    }

    // Weekend predictions
    if (moment.dayOfWeek < 5) {
      this.predictWeekend(now);
    }
  }

  // ============================================================================
  // Specific Predictions
  // ============================================================================

  private predictArrivals(now: Date, horizon: Date): void {
    // Check patterns for typical arrival times
    const arrivalPatterns = this.patternEngine.getPatternsByType('arrival_departure');

    for (const pattern of arrivalPatterns) {
      const probability = this.calculateArrivalProbability(pattern, now, horizon);

      if (probability > this.config.minScenarioProbability) {
        const scenario = this.createScenario({
          description: 'Occupant arrival expected',
          probability,
          timeframe: { start: now, end: horizon, granularity: 'minute' },
          source: 'pattern',
          predictedState: {
            occupancy: {
              expectedOccupants: [],
              arrivalTimes: new Map(),
              departureTimes: new Map(),
              guestProbability: 0,
            },
            activities: [{ activity: 'arriving', probability, location: 'entrance' as RoomId, participants: [], duration: { min: 1, typical: 5, max: 15 } }],
            environmentNeeds: this.defaultEnvironmentPrediction(),
            resourceNeeds: this.defaultResourcePrediction(),
          },
          requiredPreparation: [
            {
              id: `prep_arrival_${Date.now()}`,
              type: 'environmental',
              action: 'prepare_entrance_lighting',
              executeAt: new Date(now.getTime() - 5 * 60000),
              priority: 'normal',
              reversible: true,
              dependencies: [],
            },
          ],
        });

        this.scenarios.set(scenario.id, scenario);
        this.emit('scenarioGenerated', scenario);
      }
    }
  }

  private predictMeals(now: Date, horizon: Date): void {
    const mealPatterns = this.patternEngine.getPatternsByType('meal_pattern');
    const hour = now.getHours();

    // Breakfast window: 6-10
    // Lunch window: 11-14
    // Dinner window: 18-21

    const mealWindows = [
      { meal: 'breakfast', start: 6, end: 10 },
      { meal: 'lunch', start: 11, end: 14 },
      { meal: 'dinner', start: 18, end: 21 },
    ];

    for (const window of mealWindows) {
      if (hour < window.end && hour + (horizon.getTime() - now.getTime()) / 3600000 >= window.start) {
        const probability = this.calculateMealProbability(window.meal, mealPatterns);

        if (probability > this.config.minScenarioProbability) {
          const mealTime = new Date(now);
          mealTime.setHours(Math.floor((window.start + window.end) / 2), 0, 0, 0);

          const scenario = this.createScenario({
            description: `${window.meal} preparation expected`,
            probability,
            timeframe: { start: mealTime, end: new Date(mealTime.getTime() + 60 * 60000), granularity: 'hour' },
            source: 'pattern',
            predictedState: {
              occupancy: this.defaultOccupancyPrediction(),
              activities: [{
                activity: 'cooking',
                probability,
                location: 'kitchen' as RoomId,
                participants: [],
                duration: { min: 15, typical: 45, max: 90 },
              }],
              environmentNeeds: {
                temperature: { dayMin: 20, dayMax: 23, nightMin: 18, nightMax: 20, unit: 'celsius' },
                lighting: { wakeLight: 100, dayLight: 80, eveningLight: 70, nightLight: 20, colorTempPreference: 4000 },
                humidity: { min: 40, max: 60 },
                ventilation: 'increased',
                noise: 'normal',
              },
              resourceNeeds: { energyDemand: 2, waterDemand: 10, peakLoadTime: mealTime, unusualConsumption: false },
            },
            requiredPreparation: [
              {
                id: `prep_meal_${window.meal}_${Date.now()}`,
                type: 'environmental',
                action: 'preheat_kitchen',
                executeAt: new Date(mealTime.getTime() - 30 * 60000),
                priority: 'normal',
                reversible: true,
                dependencies: [],
              },
            ],
          });

          this.scenarios.set(scenario.id, scenario);
        }
      }
    }
  }

  private predictSocialEvents(now: Date, horizon: Date): void {
    // Check calendar for social events
    const socialEvents = this.calendar.filter(
      (e) => e.type === 'social' && e.start >= now && e.start <= horizon
    );

    for (const event of socialEvents) {
      const guestCount = event.attendees?.length || 2;

      const scenario = this.createScenario({
        description: `Social gathering: ${event.title}`,
        probability: 0.9, // Calendar events are high probability
        timeframe: { start: event.start, end: event.end, granularity: 'hour' },
        source: 'calendar',
        userConfirmationNeeded: false,
        predictedState: {
          occupancy: {
            expectedOccupants: [],
            arrivalTimes: new Map(),
            departureTimes: new Map(),
            guestProbability: 0.95,
            guestCount,
          },
          activities: [{
            activity: 'entertaining',
            probability: 0.9,
            location: 'living_room' as RoomId,
            participants: [],
            duration: { min: 60, typical: 180, max: 360 },
          }],
          environmentNeeds: {
            temperature: { dayMin: 21, dayMax: 23, nightMin: 20, nightMax: 22, unit: 'celsius' },
            lighting: { wakeLight: 100, dayLight: 80, eveningLight: 60, nightLight: 30, colorTempPreference: 3500 },
            humidity: { min: 40, max: 55 },
            ventilation: 'increased',
            noise: 'social',
          },
          resourceNeeds: {
            energyDemand: 3 + guestCount * 0.5,
            waterDemand: 20 + guestCount * 5,
            peakLoadTime: event.start,
            unusualConsumption: guestCount > 4,
          },
        },
        requiredPreparation: this.generateSocialEventPreparations(event),
      });

      this.scenarios.set(scenario.id, scenario);
      this.emit('scenarioGenerated', scenario);
    }
  }

  private predictEnergyDemand(now: Date, horizon: Date): void {
    const patterns = this.patternEngine.getPatternsByType('energy_usage');
    const scenarios = Array.from(this.scenarios.values());

    // Aggregate energy from all predicted scenarios
    let totalEnergy = 0;
    let peakLoad = 0;
    let peakTime = now;

    for (const scenario of scenarios) {
      if (scenario.timeframe.start <= horizon) {
        totalEnergy += scenario.predictedState.resourceNeeds.energyDemand;
        if (scenario.predictedState.resourceNeeds.energyDemand > peakLoad) {
          peakLoad = scenario.predictedState.resourceNeeds.energyDemand;
          peakTime = scenario.predictedState.resourceNeeds.peakLoadTime;
        }
      }
    }

    // Create energy forecast scenario if significant
    if (totalEnergy > 5) {
      const scenario = this.createScenario({
        description: 'High energy demand period',
        probability: 0.7,
        timeframe: { start: now, end: horizon, granularity: 'hour' },
        source: 'inference',
        predictedState: {
          occupancy: this.defaultOccupancyPrediction(),
          activities: [],
          environmentNeeds: this.defaultEnvironmentPrediction(),
          resourceNeeds: {
            energyDemand: totalEnergy,
            waterDemand: 0,
            peakLoadTime: peakTime,
            unusualConsumption: totalEnergy > 10,
          },
        },
        requiredPreparation: totalEnergy > 8 ? [{
          id: `prep_energy_${Date.now()}`,
          type: 'resource',
          action: 'optimize_non_essential_loads',
          executeAt: new Date(peakTime.getTime() - 30 * 60000),
          priority: 'normal',
          reversible: true,
          dependencies: [],
        }] : [],
      });

      this.scenarios.set(scenario.id, scenario);
    }
  }

  private predictEveningActivities(now: Date, endOfDay: Date): void {
    const hour = now.getHours();
    if (hour < 17 || hour > 22) return;

    const leisurePatterns = this.patternEngine.getPatternsByType('leisure_pattern');
    const probability = leisurePatterns.length > 0
      ? leisurePatterns.reduce((sum, p) => sum + p.confidence, 0) / leisurePatterns.length
      : 0.5;

    if (probability > this.config.minScenarioProbability) {
      const scenario = this.createScenario({
        description: 'Evening relaxation time',
        probability,
        timeframe: { start: now, end: endOfDay, granularity: 'hour' },
        source: 'pattern',
        predictedState: {
          occupancy: this.defaultOccupancyPrediction(),
          activities: [{
            activity: 'relaxing',
            probability,
            location: 'living_room' as RoomId,
            participants: [],
            duration: { min: 30, typical: 120, max: 240 },
          }],
          environmentNeeds: {
            temperature: { dayMin: 21, dayMax: 23, nightMin: 20, nightMax: 22, unit: 'celsius' },
            lighting: { wakeLight: 100, dayLight: 80, eveningLight: 50, nightLight: 15, colorTempPreference: 3000 },
            humidity: { min: 40, max: 55 },
            ventilation: 'minimal',
            noise: 'quiet',
          },
          resourceNeeds: this.defaultResourcePrediction(),
        },
        requiredPreparation: [{
          id: `prep_evening_${Date.now()}`,
          type: 'environmental',
          action: 'transition_to_evening_mode',
          executeAt: new Date(now.getTime() - 15 * 60000),
          priority: 'low',
          reversible: true,
          dependencies: [],
        }],
      });

      this.scenarios.set(scenario.id, scenario);
    }
  }

  private predictSleep(now: Date, endOfDay: Date): void {
    const sleepPatterns = this.patternEngine.getPatternsByType('sleep_pattern');
    const typicalBedtime = this.inferTypicalBedtime(sleepPatterns);

    if (typicalBedtime) {
      const bedtimeToday = new Date(now);
      bedtimeToday.setHours(typicalBedtime.hour, typicalBedtime.minute, 0, 0);

      if (bedtimeToday > now) {
        const scenario = this.createScenario({
          description: 'Bedtime approaching',
          probability: 0.8,
          timeframe: { start: bedtimeToday, end: endOfDay, granularity: 'hour' },
          source: 'pattern',
          predictedState: {
            occupancy: this.defaultOccupancyPrediction(),
            activities: [{
              activity: 'sleeping',
              probability: 0.8,
              location: 'bedroom' as RoomId,
              participants: [],
              duration: { min: 360, typical: 480, max: 600 },
            }],
            environmentNeeds: {
              temperature: { dayMin: 18, dayMax: 20, nightMin: 17, nightMax: 19, unit: 'celsius' },
              lighting: { wakeLight: 50, dayLight: 30, eveningLight: 10, nightLight: 0, colorTempPreference: 2700 },
              humidity: { min: 45, max: 55 },
              ventilation: 'minimal',
              noise: 'quiet',
            },
            resourceNeeds: { energyDemand: 0.5, waterDemand: 0, peakLoadTime: bedtimeToday, unusualConsumption: false },
          },
          requiredPreparation: [
            {
              id: `prep_sleep_${Date.now()}`,
              type: 'environmental',
              action: 'begin_sleep_transition',
              executeAt: new Date(bedtimeToday.getTime() - 60 * 60000),
              priority: 'normal',
              reversible: true,
              dependencies: [],
            },
          ],
        });

        this.scenarios.set(scenario.id, scenario);
      }
    }
  }

  private predictWeekend(now: Date): void {
    const dayOfWeek = now.getDay();
    const daysUntilWeekend = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
    const weekendStart = new Date(now);
    weekendStart.setDate(weekendStart.getDate() + daysUntilWeekend);
    weekendStart.setHours(0, 0, 0, 0);

    const scenario = this.createScenario({
      description: 'Weekend period',
      probability: 1.0, // Calendar certainty
      timeframe: {
        start: weekendStart,
        end: new Date(weekendStart.getTime() + 2 * 24 * 60 * 60000),
        granularity: 'day',
      },
      source: 'calendar',
      predictedState: {
        occupancy: {
          expectedOccupants: [],
          arrivalTimes: new Map(),
          departureTimes: new Map(),
          guestProbability: 0.3,
        },
        activities: [{
          activity: 'relaxing',
          probability: 0.7,
          location: 'living_room' as RoomId,
          participants: [],
          duration: { min: 60, typical: 240, max: 480 },
        }],
        environmentNeeds: this.defaultEnvironmentPrediction(),
        resourceNeeds: { energyDemand: 8, waterDemand: 150, peakLoadTime: weekendStart, unusualConsumption: false },
      },
      requiredPreparation: [],
    });

    this.scenarios.set(scenario.id, scenario);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createScenario(partial: Partial<Scenario> & {
    description: string;
    probability: number;
    timeframe: TimeWindow;
    source: Scenario['source'];
    predictedState: PredictedState;
    requiredPreparation: PreparationAction[];
  }): Scenario {
    return {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userConfirmationNeeded: false,
      autoExecuteThreshold: this.config.autoExecuteThreshold,
      confidence: partial.probability,
      enabledBy: [],
      conflictsWith: [],
      ...partial,
    };
  }

  private createEventScenario(event: CalendarEvent, horizon: string): void {
    const scenario = this.createScenario({
      description: event.title,
      probability: 0.95,
      timeframe: { start: event.start, end: event.end, granularity: 'hour' },
      source: 'calendar',
      predictedState: {
        occupancy: {
          expectedOccupants: [],
          arrivalTimes: new Map(),
          departureTimes: new Map(),
          guestProbability: event.type === 'social' ? 0.8 : 0,
        },
        activities: [{
          activity: this.eventTypeToActivity(event.type),
          probability: 0.9,
          location: 'living_room' as RoomId,
          participants: [],
          duration: {
            min: Math.floor((event.end.getTime() - event.start.getTime()) / 60000 * 0.5),
            typical: Math.floor((event.end.getTime() - event.start.getTime()) / 60000),
            max: Math.floor((event.end.getTime() - event.start.getTime()) / 60000 * 1.5),
          },
        }],
        environmentNeeds: this.defaultEnvironmentPrediction(),
        resourceNeeds: this.defaultResourcePrediction(),
      },
      requiredPreparation: [],
    });

    this.scenarios.set(scenario.id, scenario);
    this.emit('scenarioGenerated', scenario);
  }

  private createActivityScenario(
    activity: { activity: ActivityType; probability: number; location: RoomId[]; duration: { min: number; typical: number; max: number }; confidence: number },
    start: Date,
    end: Date
  ): void {
    const scenario = this.createScenario({
      description: `${activity.activity} activity predicted`,
      probability: activity.confidence,
      timeframe: { start, end, granularity: 'minute' },
      source: 'pattern',
      predictedState: {
        occupancy: this.defaultOccupancyPrediction(),
        activities: [{
          activity: activity.activity,
          probability: activity.confidence,
          location: activity.location[0] || ('unknown' as RoomId),
          participants: [],
          duration: activity.duration,
        }],
        environmentNeeds: this.getEnvironmentForActivity(activity.activity),
        resourceNeeds: this.defaultResourcePrediction(),
      },
      requiredPreparation: [],
    });

    this.scenarios.set(scenario.id, scenario);
  }

  private getEventsInRange(start: Date, end: Date): CalendarEvent[] {
    return this.calendar.filter(
      (e) => e.start >= start && e.start <= end
    );
  }

  private calculateArrivalProbability(pattern: Pattern, now: Date, horizon: Date): number {
    // Simplified probability calculation
    return pattern.confidence * 0.8;
  }

  private calculateMealProbability(meal: string, patterns: Pattern[]): number {
    if (patterns.length === 0) return 0.5;
    return patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  }

  private generateSocialEventPreparations(event: CalendarEvent): PreparationAction[] {
    const prepTime = new Date(event.start.getTime() - 60 * 60000);

    return [
      {
        id: `prep_social_lighting_${event.id}`,
        type: 'environmental',
        action: 'set_social_lighting_scene',
        executeAt: new Date(prepTime.getTime() + 45 * 60000),
        priority: 'normal',
        reversible: true,
        dependencies: [],
      },
      {
        id: `prep_social_temp_${event.id}`,
        type: 'environmental',
        action: 'adjust_temperature_for_guests',
        executeAt: prepTime,
        priority: 'normal',
        reversible: true,
        dependencies: [],
      },
      {
        id: `prep_social_music_${event.id}`,
        type: 'environmental',
        action: 'prepare_ambient_music',
        executeAt: new Date(event.start.getTime() - 15 * 60000),
        priority: 'low',
        reversible: true,
        dependencies: [],
      },
    ];
  }

  private inferTypicalBedtime(patterns: Pattern[]): { hour: number; minute: number } | null {
    // Default bedtime if no patterns
    if (patterns.length === 0) return { hour: 23, minute: 0 };

    // Would analyze patterns to find typical bedtime
    return { hour: 23, minute: 0 };
  }

  private eventTypeToActivity(type: CalendarEvent['type']): ActivityType {
    switch (type) {
      case 'work': return 'working';
      case 'social': return 'socializing';
      default: return 'unknown';
    }
  }

  private getEnvironmentForActivity(activity: ActivityType): EnvironmentPrediction {
    const defaults: Record<ActivityType, Partial<EnvironmentPrediction>> = {
      sleeping: { lighting: { wakeLight: 0, dayLight: 0, eveningLight: 0, nightLight: 0, colorTempPreference: 2700 }, noise: 'quiet' },
      working: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 80, nightLight: 50, colorTempPreference: 5000 }, noise: 'quiet' },
      relaxing: { lighting: { wakeLight: 80, dayLight: 60, eveningLight: 40, nightLight: 20, colorTempPreference: 3000 }, noise: 'quiet' },
      socializing: { lighting: { wakeLight: 80, dayLight: 70, eveningLight: 60, nightLight: 40, colorTempPreference: 3500 }, noise: 'social' },
      cooking: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 90, nightLight: 70, colorTempPreference: 4500 }, ventilation: 'increased' },
      watching_media: { lighting: { wakeLight: 50, dayLight: 30, eveningLight: 20, nightLight: 10, colorTempPreference: 3000 }, noise: 'normal' },
      exercising: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 100, nightLight: 80, colorTempPreference: 5000 }, ventilation: 'increased' },
      waking: { lighting: { wakeLight: 50, dayLight: 80, eveningLight: 100, nightLight: 100, colorTempPreference: 4000 } },
      morning_routine: { lighting: { wakeLight: 80, dayLight: 100, eveningLight: 100, nightLight: 100, colorTempPreference: 4500 } },
      breakfast: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 100, nightLight: 100, colorTempPreference: 4000 } },
      studying: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 90, nightLight: 70, colorTempPreference: 5000 }, noise: 'quiet' },
      eating: { lighting: { wakeLight: 80, dayLight: 80, eveningLight: 60, nightLight: 40, colorTempPreference: 3500 } },
      reading: { lighting: { wakeLight: 90, dayLight: 80, eveningLight: 70, nightLight: 50, colorTempPreference: 4000 }, noise: 'quiet' },
      entertaining: { lighting: { wakeLight: 80, dayLight: 70, eveningLight: 60, nightLight: 50, colorTempPreference: 3500 }, noise: 'social' },
      cleaning: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 100, nightLight: 100, colorTempPreference: 5000 } },
      bathing: { lighting: { wakeLight: 70, dayLight: 60, eveningLight: 50, nightLight: 30, colorTempPreference: 3000 } },
      leaving: { lighting: { wakeLight: 100, dayLight: 100, eveningLight: 100, nightLight: 100, colorTempPreference: 4000 } },
      arriving: { lighting: { wakeLight: 100, dayLight: 80, eveningLight: 70, nightLight: 50, colorTempPreference: 4000 } },
      unknown: {},
    };

    return {
      ...this.defaultEnvironmentPrediction(),
      ...defaults[activity],
    };
  }

  private defaultOccupancyPrediction(): OccupancyPrediction {
    return {
      expectedOccupants: [],
      arrivalTimes: new Map(),
      departureTimes: new Map(),
      guestProbability: 0,
    };
  }

  private defaultEnvironmentPrediction(): EnvironmentPrediction {
    return {
      temperature: { dayMin: 20, dayMax: 24, nightMin: 18, nightMax: 21, unit: 'celsius' },
      lighting: { wakeLight: 80, dayLight: 80, eveningLight: 60, nightLight: 20, colorTempPreference: 4000 },
      humidity: { min: 40, max: 55 },
      ventilation: 'normal',
      noise: 'normal',
    };
  }

  private defaultResourcePrediction(): ResourcePrediction {
    return {
      energyDemand: 2,
      waterDemand: 50,
      peakLoadTime: new Date(),
      unusualConsumption: false,
    };
  }

  private dateToMoment(date: Date): TemporalMoment {
    const month = date.getMonth();
    const season = month < 3 || month === 11 ? 'winter' :
                   month < 6 ? 'spring' :
                   month < 9 ? 'summer' : 'autumn';

    const hour = date.getHours();
    const sunPhase = hour < 6 ? 'night' :
                     hour < 8 ? 'dawn' :
                     hour < 12 ? 'morning' :
                     hour < 14 ? 'midday' :
                     hour < 17 ? 'afternoon' :
                     hour < 20 ? 'dusk' :
                     hour < 22 ? 'evening' : 'night';

    return {
      timestamp: date,
      dayOfWeek: date.getDay(),
      hourOfDay: hour,
      minuteOfHour: date.getMinutes(),
      weekOfYear: this.getWeekOfYear(date),
      monthOfYear: month + 1,
      season,
      isHoliday: false, // Would check holiday calendar
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      sunPhase,
    };
  }

  private getWeekOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneWeek = 604800000;
    return Math.ceil(diff / oneWeek);
  }

  // ============================================================================
  // Conflict Resolution
  // ============================================================================

  private resolveConflicts(): void {
    const scenarios = Array.from(this.scenarios.values());

    for (let i = 0; i < scenarios.length; i++) {
      for (let j = i + 1; j < scenarios.length; j++) {
        if (this.scenariosConflict(scenarios[i], scenarios[j])) {
          this.emit('conflictDetected', scenarios[i], scenarios[j]);
          this.resolveConflict(scenarios[i], scenarios[j]);
        }
      }
    }
  }

  private scenariosConflict(a: Scenario, b: Scenario): boolean {
    // Check for time overlap
    if (a.timeframe.end < b.timeframe.start || b.timeframe.end < a.timeframe.start) {
      return false;
    }

    // Check for resource conflicts
    const aActivities = new Set(a.predictedState.activities.map((act) => act.activity));
    const bActivities = new Set(b.predictedState.activities.map((act) => act.activity));

    // Conflicting activities
    const conflicts = [
      ['sleeping', 'socializing'],
      ['sleeping', 'entertaining'],
      ['working', 'socializing'],
    ];

    for (const [actA, actB] of conflicts) {
      if ((aActivities.has(actA as ActivityType) && bActivities.has(actB as ActivityType)) ||
          (aActivities.has(actB as ActivityType) && bActivities.has(actA as ActivityType))) {
        return true;
      }
    }

    return false;
  }

  private resolveConflict(a: Scenario, b: Scenario): void {
    // Resolution strategy based on config
    switch (this.config.conflictResolutionStrategy) {
      case 'conservative':
        // Keep lower probability scenario but mark as conflicted
        if (a.probability > b.probability) {
          b.conflictsWith.push(a.id);
          b.probability *= 0.5;
        } else {
          a.conflictsWith.push(b.id);
          a.probability *= 0.5;
        }
        break;

      case 'aggressive':
        // Remove lower probability scenario
        if (a.probability > b.probability) {
          this.scenarios.delete(b.id);
          this.emit('scenarioExpired', b);
        } else {
          this.scenarios.delete(a.id);
          this.emit('scenarioExpired', a);
        }
        break;

      case 'balanced':
      default:
        // Mark both as conflicted, reduce probabilities
        a.conflictsWith.push(b.id);
        b.conflictsWith.push(a.id);
        a.probability *= 0.7;
        b.probability *= 0.7;
    }
  }

  private cleanupExpiredScenarios(now: Date): void {
    for (const [id, scenario] of this.scenarios) {
      if (scenario.timeframe.end < now) {
        this.scenarios.delete(id);
        this.emit('scenarioExpired', scenario);
      }
    }
  }

  private triggerPreparations(now: Date): void {
    for (const scenario of this.scenarios.values()) {
      for (const prep of scenario.requiredPreparation) {
        if (prep.executeAt <= now && prep.executeAt > new Date(now.getTime() - 60000)) {
          this.emit('preparationTriggered', prep);
        }
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getScenarios(timeframe?: 'immediate' | 'shortTerm' | 'daily' | 'weekly'): Scenario[] {
    const now = new Date();
    const scenarios = Array.from(this.scenarios.values());

    if (!timeframe) return scenarios;

    const horizons = {
      immediate: this.config.predictionHorizons.immediate * 60000,
      shortTerm: this.config.predictionHorizons.shortTerm * 60 * 60000,
      daily: this.config.predictionHorizons.daily * 60 * 60000,
      weekly: this.config.predictionHorizons.weekly * 24 * 60 * 60000,
    };

    const horizon = new Date(now.getTime() + horizons[timeframe]);
    return scenarios.filter((s) => s.timeframe.start <= horizon);
  }

  getHighProbabilityScenarios(threshold: number = 0.7): Scenario[] {
    return Array.from(this.scenarios.values()).filter((s) => s.probability >= threshold);
  }

  getPreparationsDue(within: number = 30): PreparationAction[] {
    const now = new Date();
    const horizon = new Date(now.getTime() + within * 60000);

    const preparations: PreparationAction[] = [];
    for (const scenario of this.scenarios.values()) {
      for (const prep of scenario.requiredPreparation) {
        if (prep.executeAt >= now && prep.executeAt <= horizon) {
          preparations.push(prep);
        }
      }
    }

    return preparations.sort((a, b) => a.executeAt.getTime() - b.executeAt.getTime());
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface OccupantState {
  userId: UserId;
  isHome: boolean;
  lastSeen: Date;
  currentRoom?: RoomId;
  activity?: ActivityType;
}

export default ScenarioEngine;
