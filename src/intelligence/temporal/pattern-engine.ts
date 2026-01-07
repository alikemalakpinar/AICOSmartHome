/**
 * AICO Smart Home - Pattern Recognition Engine
 *
 * Discovers, tracks, and validates behavioral patterns over time.
 * This is the foundation of anticipatory intelligence.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  Pattern,
  PatternType,
  DailyPattern,
  WeeklyPattern,
  SeasonalPattern,
  TimeSlotBehavior,
  ActivitySignature,
  ActivityType,
  TemporalMoment,
  DurationRange,
  EnvironmentState,
} from './types';
import type { DeviceId, RoomId, UserId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface PatternObservation {
  timestamp: Date;
  type: 'activity' | 'presence' | 'device' | 'environment';
  data: Record<string, unknown>;
  userId?: UserId;
  roomId?: RoomId;
  deviceId?: DeviceId;
}

interface PatternCandidate {
  type: PatternType;
  observations: PatternObservation[];
  strength: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface PatternEngineConfig {
  minObservationsForPattern: number;
  minConfidenceThreshold: number;
  patternDecayDays: number;
  emergingPatternThreshold: number;
  establishedPatternThreshold: number;
}

type PatternEngineEvents = {
  patternDiscovered: [Pattern];
  patternStrengthened: [Pattern];
  patternWeakened: [Pattern];
  patternFaded: [Pattern];
  anomalyDetected: [PatternObservation, Pattern];
};

// ============================================================================
// Pattern Engine
// ============================================================================

export class PatternEngine extends EventEmitter<PatternEngineEvents> {
  private config: PatternEngineConfig;
  private observations: PatternObservation[] = [];
  private candidates: Map<string, PatternCandidate> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private lastAnalysis: Date = new Date(0);

  constructor(config: Partial<PatternEngineConfig> = {}) {
    super();
    this.config = {
      minObservationsForPattern: 5,
      minConfidenceThreshold: 0.6,
      patternDecayDays: 14,
      emergingPatternThreshold: 0.4,
      establishedPatternThreshold: 0.75,
      ...config,
    };
  }

  // ============================================================================
  // Observation Ingestion
  // ============================================================================

  /**
   * Record an observation for pattern analysis
   */
  observe(observation: PatternObservation): void {
    this.observations.push(observation);

    // Keep observations for rolling window (90 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    this.observations = this.observations.filter((o) => o.timestamp > cutoff);

    // Trigger incremental analysis if enough time has passed
    const now = new Date();
    if (now.getTime() - this.lastAnalysis.getTime() > 60000) {
      // Every minute
      this.analyzeIncremental(observation);
      this.lastAnalysis = now;
    }
  }

  /**
   * Batch import historical observations
   */
  importHistory(observations: PatternObservation[]): void {
    this.observations.push(...observations);
    this.observations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.performFullAnalysis();
  }

  // ============================================================================
  // Pattern Analysis
  // ============================================================================

  /**
   * Incremental analysis on new observation
   */
  private analyzeIncremental(observation: PatternObservation): void {
    // Check if observation fits existing patterns
    for (const pattern of this.patterns.values()) {
      const fit = this.calculatePatternFit(observation, pattern);

      if (fit > 0.8) {
        this.strengthenPattern(pattern, observation);
      } else if (fit < 0.2 && this.shouldHaveMatched(observation, pattern)) {
        this.emitAnomaly(observation, pattern);
      }
    }

    // Check if observation contributes to emerging patterns
    this.updateCandidates(observation);

    // Promote candidates to patterns if strong enough
    this.promoteCandidates();
  }

  /**
   * Full analysis of all observations
   */
  performFullAnalysis(): void {
    // Reset candidates
    this.candidates.clear();

    // Analyze daily patterns
    this.analyzeDailyPatterns();

    // Analyze weekly patterns
    this.analyzeWeeklyPatterns();

    // Analyze activity sequences
    this.analyzeActivitySequences();

    // Analyze comfort preferences
    this.analyzeComfortPreferences();

    // Decay old patterns
    this.decayPatterns();

    // Promote strong candidates
    this.promoteCandidates();
  }

  // ============================================================================
  // Daily Pattern Analysis
  // ============================================================================

  private analyzeDailyPatterns(): void {
    // Group observations by time of day
    const timeSlots = this.groupByTimeSlot(this.observations);

    // Find recurring behaviors in each slot
    for (const [slotKey, slotObs] of timeSlots) {
      const behavior = this.extractSlotBehavior(slotKey, slotObs);

      if (behavior && behavior.confidence > this.config.emergingPatternThreshold) {
        const candidateKey = `daily_${slotKey}`;

        if (!this.candidates.has(candidateKey)) {
          this.candidates.set(candidateKey, {
            type: 'daily_routine',
            observations: slotObs,
            strength: behavior.confidence,
            firstSeen: slotObs[0].timestamp,
            lastSeen: slotObs[slotObs.length - 1].timestamp,
          });
        } else {
          const candidate = this.candidates.get(candidateKey)!;
          candidate.observations.push(...slotObs);
          candidate.strength = Math.max(candidate.strength, behavior.confidence);
          candidate.lastSeen = slotObs[slotObs.length - 1].timestamp;
        }
      }
    }
  }

  private groupByTimeSlot(
    observations: PatternObservation[]
  ): Map<string, PatternObservation[]> {
    const slots = new Map<string, PatternObservation[]>();

    for (const obs of observations) {
      const hour = obs.timestamp.getHours();
      const slot = Math.floor(hour / 2); // 2-hour slots
      const key = `slot_${slot}`;

      if (!slots.has(key)) {
        slots.set(key, []);
      }
      slots.get(key)!.push(obs);
    }

    return slots;
  }

  private extractSlotBehavior(
    slotKey: string,
    observations: PatternObservation[]
  ): TimeSlotBehavior | null {
    if (observations.length < this.config.minObservationsForPattern) {
      return null;
    }

    // Extract the slot time range
    const slotNum = parseInt(slotKey.split('_')[1]);
    const startHour = slotNum * 2;
    const endHour = startHour + 2;

    // Analyze activities in this slot
    const activities = this.extractActivities(observations);

    // Analyze environment preferences
    const environment = this.extractEnvironmentPreferences(observations);

    // Calculate consistency
    const consistency = this.calculateConsistency(observations);

    return {
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
      probability: consistency,
      activities,
      environmentPreferences: environment,
    };
  }

  // ============================================================================
  // Weekly Pattern Analysis
  // ============================================================================

  private analyzeWeeklyPatterns(): void {
    // Group by day of week
    const dayGroups = new Map<number, PatternObservation[]>();

    for (const obs of this.observations) {
      const day = obs.timestamp.getDay();
      if (!dayGroups.has(day)) {
        dayGroups.set(day, []);
      }
      dayGroups.get(day)!.push(obs);
    }

    // Analyze cross-day patterns
    const weekdayObs = [1, 2, 3, 4, 5].flatMap((d) => dayGroups.get(d) || []);
    const weekendObs = [0, 6].flatMap((d) => dayGroups.get(d) || []);

    // Check for weekday vs weekend differences
    const weekdayBehavior = this.extractBehaviorSignature(weekdayObs);
    const weekendBehavior = this.extractBehaviorSignature(weekendObs);

    if (this.significantDifference(weekdayBehavior, weekendBehavior)) {
      this.candidates.set('weekly_weekday_weekend', {
        type: 'weekly_routine',
        observations: this.observations,
        strength: 0.7,
        firstSeen: this.observations[0]?.timestamp || new Date(),
        lastSeen: this.observations[this.observations.length - 1]?.timestamp || new Date(),
      });
    }
  }

  // ============================================================================
  // Activity Sequence Analysis
  // ============================================================================

  private analyzeActivitySequences(): void {
    // Find common sequences of activities
    const sequences = this.findActivitySequences();

    for (const sequence of sequences) {
      if (sequence.occurrences >= this.config.minObservationsForPattern) {
        const key = `sequence_${sequence.activities.join('_')}`;
        this.candidates.set(key, {
          type: 'daily_routine',
          observations: sequence.observations,
          strength: sequence.confidence,
          firstSeen: sequence.firstSeen,
          lastSeen: sequence.lastSeen,
        });
      }
    }
  }

  private findActivitySequences(): Array<{
    activities: ActivityType[];
    occurrences: number;
    confidence: number;
    observations: PatternObservation[];
    firstSeen: Date;
    lastSeen: Date;
  }> {
    const sequences: Map<
      string,
      {
        activities: ActivityType[];
        occurrences: number;
        observations: PatternObservation[];
        firstSeen: Date;
        lastSeen: Date;
      }
    > = new Map();

    // Sliding window over observations
    const window: PatternObservation[] = [];
    const windowSize = 5;

    for (const obs of this.observations) {
      window.push(obs);
      if (window.length > windowSize) {
        window.shift();
      }

      if (window.length === windowSize) {
        const activities = this.inferActivitiesFromWindow(window);
        const key = activities.join('->');

        if (!sequences.has(key)) {
          sequences.set(key, {
            activities,
            occurrences: 0,
            observations: [],
            firstSeen: window[0].timestamp,
            lastSeen: window[window.length - 1].timestamp,
          });
        }

        const seq = sequences.get(key)!;
        seq.occurrences++;
        seq.observations.push(...window);
        seq.lastSeen = window[window.length - 1].timestamp;
      }
    }

    // Calculate confidence and filter
    return Array.from(sequences.values())
      .map((seq) => ({
        ...seq,
        confidence: seq.occurrences / (this.observations.length / windowSize),
      }))
      .filter((seq) => seq.confidence > 0.1);
  }

  // ============================================================================
  // Comfort Preference Analysis
  // ============================================================================

  private analyzeComfortPreferences(): void {
    // Extract environment observations
    const envObs = this.observations.filter((o) => o.type === 'environment');

    if (envObs.length < 10) return;

    // Find preferred ranges
    const temps = envObs
      .map((o) => (o.data as any).temperature)
      .filter((t) => t !== undefined);
    const humidity = envObs
      .map((o) => (o.data as any).humidity)
      .filter((h) => h !== undefined);
    const lighting = envObs
      .map((o) => (o.data as any).brightness)
      .filter((l) => l !== undefined);

    if (temps.length > 0) {
      const tempPref = this.calculatePreferredRange(temps);
      this.candidates.set('comfort_temperature', {
        type: 'comfort_preference',
        observations: envObs,
        strength: tempPref.confidence,
        firstSeen: envObs[0].timestamp,
        lastSeen: envObs[envObs.length - 1].timestamp,
      });
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private extractActivities(observations: PatternObservation[]): ActivitySignature[] {
    const activityCounts = new Map<ActivityType, number>();
    const activityRooms = new Map<ActivityType, Set<RoomId>>();
    const activityDevices = new Map<ActivityType, Set<DeviceId>>();

    for (const obs of observations) {
      const activity = this.inferActivity(obs);
      if (activity) {
        activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);

        if (obs.roomId) {
          if (!activityRooms.has(activity)) activityRooms.set(activity, new Set());
          activityRooms.get(activity)!.add(obs.roomId);
        }

        if (obs.deviceId) {
          if (!activityDevices.has(activity)) activityDevices.set(activity, new Set());
          activityDevices.get(activity)!.add(obs.deviceId);
        }
      }
    }

    const total = observations.length;
    return Array.from(activityCounts.entries())
      .map(([type, count]) => ({
        type,
        duration: this.estimateDuration(type),
        location: Array.from(activityRooms.get(type) || []),
        devices: Array.from(activityDevices.get(type) || []),
        confidence: count / total,
      }))
      .filter((a) => a.confidence > 0.1);
  }

  private inferActivity(obs: PatternObservation): ActivityType | null {
    // Infer activity from observation data
    if (obs.type === 'activity' && obs.data.activity) {
      return obs.data.activity as ActivityType;
    }

    if (obs.type === 'device') {
      const deviceType = obs.data.deviceType as string;
      const state = obs.data.state as string;

      // Infer from device usage
      if (deviceType === 'tv' && state === 'on') return 'watching_media';
      if (deviceType === 'oven' && state === 'on') return 'cooking';
      if (deviceType === 'coffee_maker' && state === 'on') return 'morning_routine';
      if (deviceType === 'shower' && state === 'on') return 'bathing';
    }

    if (obs.type === 'presence') {
      const entering = obs.data.entering as boolean;
      if (entering === true) return 'arriving';
      if (entering === false) return 'leaving';
    }

    return null;
  }

  private extractEnvironmentPreferences(
    observations: PatternObservation[]
  ): EnvironmentState {
    const envObs = observations.filter((o) => o.type === 'environment');

    const temps = envObs.map((o) => (o.data as any).temperature).filter(Boolean);
    const humidity = envObs.map((o) => (o.data as any).humidity).filter(Boolean);
    const brightness = envObs.map((o) => (o.data as any).brightness).filter(Boolean);
    const colorTemp = envObs.map((o) => (o.data as any).colorTemp).filter(Boolean);

    return {
      temperature: temps.length > 0 ? this.median(temps) : 22,
      humidity: humidity.length > 0 ? this.median(humidity) : 45,
      lighting: {
        brightness: brightness.length > 0 ? this.median(brightness) : 70,
        colorTemp: colorTemp.length > 0 ? this.median(colorTemp) : 4000,
      },
      noise: 30,
      curtains: 50,
    };
  }

  private calculateConsistency(observations: PatternObservation[]): number {
    if (observations.length < 2) return 0;

    // Group by date
    const dates = new Set(
      observations.map((o) => o.timestamp.toISOString().split('T')[0])
    );

    // Calculate how many days had this pattern
    const daysCovered = dates.size;
    const totalDays = Math.ceil(
      (observations[observations.length - 1].timestamp.getTime() -
        observations[0].timestamp.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return totalDays > 0 ? daysCovered / totalDays : 0;
  }

  private extractBehaviorSignature(
    observations: PatternObservation[]
  ): Map<string, number> {
    const signature = new Map<string, number>();

    for (const obs of observations) {
      const activity = this.inferActivity(obs);
      if (activity) {
        signature.set(activity, (signature.get(activity) || 0) + 1);
      }
    }

    // Normalize
    const total = Array.from(signature.values()).reduce((a, b) => a + b, 0);
    for (const [key, value] of signature) {
      signature.set(key, value / total);
    }

    return signature;
  }

  private significantDifference(
    sig1: Map<string, number>,
    sig2: Map<string, number>
  ): boolean {
    let totalDiff = 0;
    const allKeys = new Set([...sig1.keys(), ...sig2.keys()]);

    for (const key of allKeys) {
      const v1 = sig1.get(key) || 0;
      const v2 = sig2.get(key) || 0;
      totalDiff += Math.abs(v1 - v2);
    }

    return totalDiff > 0.3; // 30% difference threshold
  }

  private inferActivitiesFromWindow(window: PatternObservation[]): ActivityType[] {
    return window
      .map((obs) => this.inferActivity(obs))
      .filter((a): a is ActivityType => a !== null);
  }

  private estimateDuration(activity: ActivityType): DurationRange {
    const durations: Record<ActivityType, DurationRange> = {
      sleeping: { min: 300, typical: 480, max: 720 },
      waking: { min: 5, typical: 15, max: 30 },
      morning_routine: { min: 20, typical: 45, max: 90 },
      breakfast: { min: 10, typical: 25, max: 60 },
      working: { min: 60, typical: 240, max: 480 },
      studying: { min: 30, typical: 90, max: 240 },
      cooking: { min: 15, typical: 45, max: 120 },
      eating: { min: 15, typical: 30, max: 90 },
      relaxing: { min: 15, typical: 60, max: 240 },
      exercising: { min: 20, typical: 45, max: 120 },
      watching_media: { min: 30, typical: 90, max: 240 },
      reading: { min: 15, typical: 45, max: 180 },
      socializing: { min: 30, typical: 120, max: 360 },
      entertaining: { min: 60, typical: 180, max: 480 },
      cleaning: { min: 15, typical: 45, max: 180 },
      bathing: { min: 10, typical: 20, max: 60 },
      leaving: { min: 1, typical: 5, max: 15 },
      arriving: { min: 1, typical: 5, max: 15 },
      unknown: { min: 5, typical: 30, max: 120 },
    };
    return durations[activity] || durations.unknown;
  }

  private calculatePreferredRange(values: number[]): {
    min: number;
    max: number;
    preferred: number;
    confidence: number;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const p25 = sorted[Math.floor(sorted.length * 0.25)];
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const median = this.median(values);

    // Calculate how tight the range is
    const range = p75 - p25;
    const totalRange = sorted[sorted.length - 1] - sorted[0];
    const confidence = totalRange > 0 ? 1 - range / totalRange : 0.5;

    return {
      min: p25,
      max: p75,
      preferred: median,
      confidence,
    };
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculatePatternFit(obs: PatternObservation, pattern: Pattern): number {
    // Calculate how well this observation fits the pattern
    // Returns 0-1
    // Implementation depends on pattern type
    return 0.5; // Placeholder
  }

  private shouldHaveMatched(obs: PatternObservation, pattern: Pattern): boolean {
    // Determine if this observation should have matched the pattern
    // Used for anomaly detection
    return false; // Placeholder
  }

  private strengthenPattern(pattern: Pattern, obs: PatternObservation): void {
    pattern.occurrences++;
    pattern.lastObserved = obs.timestamp;
    pattern.confidence = Math.min(1, pattern.confidence + 0.01);
    this.emit('patternStrengthened', pattern);
  }

  private emitAnomaly(obs: PatternObservation, pattern: Pattern): void {
    this.emit('anomalyDetected', obs, pattern);
  }

  private updateCandidates(obs: PatternObservation): void {
    // Update existing candidates with new observation
    for (const candidate of this.candidates.values()) {
      candidate.observations.push(obs);
      candidate.lastSeen = obs.timestamp;
    }
  }

  private promoteCandidates(): void {
    for (const [key, candidate] of this.candidates) {
      if (candidate.strength >= this.config.establishedPatternThreshold) {
        const pattern = this.candidateToPattern(candidate, key);
        this.patterns.set(pattern.id, pattern);
        this.candidates.delete(key);
        this.emit('patternDiscovered', pattern);
      }
    }
  }

  private candidateToPattern(candidate: PatternCandidate, key: string): Pattern {
    return {
      id: key,
      type: candidate.type,
      confidence: candidate.strength,
      stability: this.calculateStability(candidate),
      firstObserved: candidate.firstSeen,
      lastObserved: candidate.lastSeen,
      occurrences: candidate.observations.length,
      data: this.extractPatternData(candidate),
      status: 'established',
    };
  }

  private calculateStability(candidate: PatternCandidate): number {
    // Measure how consistent the pattern is
    const daySpread = new Set(
      candidate.observations.map((o) => o.timestamp.toISOString().split('T')[0])
    ).size;
    return Math.min(1, daySpread / 14); // Stable if seen across 2+ weeks
  }

  private extractPatternData(candidate: PatternCandidate): unknown {
    // Extract structured data based on pattern type
    return { observations: candidate.observations.length };
  }

  private decayPatterns(): void {
    const now = new Date();
    const decayCutoff = new Date();
    decayCutoff.setDate(decayCutoff.getDate() - this.config.patternDecayDays);

    for (const [id, pattern] of this.patterns) {
      if (pattern.lastObserved < decayCutoff) {
        pattern.status = 'fading';
        pattern.confidence *= 0.9;

        if (pattern.confidence < 0.3) {
          pattern.status = 'dormant';
          this.emit('patternFaded', pattern);
        } else {
          this.emit('patternWeakened', pattern);
        }
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get all established patterns
   */
  getPatterns(): Pattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns of a specific type
   */
  getPatternsByType(type: PatternType): Pattern[] {
    return Array.from(this.patterns.values()).filter((p) => p.type === type);
  }

  /**
   * Get pattern confidence for a given moment
   */
  getPredictionForMoment(moment: TemporalMoment): {
    activities: ActivitySignature[];
    environment: EnvironmentState;
    confidence: number;
  } {
    const relevantPatterns = this.findRelevantPatterns(moment);
    const activities = this.aggregateActivities(relevantPatterns);
    const environment = this.aggregateEnvironment(relevantPatterns);

    return {
      activities,
      environment,
      confidence: relevantPatterns.length > 0
        ? relevantPatterns.reduce((sum, p) => sum + p.confidence, 0) / relevantPatterns.length
        : 0,
    };
  }

  private findRelevantPatterns(moment: TemporalMoment): Pattern[] {
    return Array.from(this.patterns.values()).filter((pattern) => {
      if (pattern.status === 'dormant') return false;

      // Check if pattern applies to this moment
      // This is a simplified check
      return pattern.confidence > 0.5;
    });
  }

  private aggregateActivities(patterns: Pattern[]): ActivitySignature[] {
    // Combine activity predictions from multiple patterns
    const activities: ActivitySignature[] = [];
    // Implementation would aggregate from pattern data
    return activities;
  }

  private aggregateEnvironment(patterns: Pattern[]): EnvironmentState {
    // Combine environment preferences from multiple patterns
    return {
      temperature: 22,
      humidity: 45,
      lighting: { brightness: 70, colorTemp: 4000 },
      noise: 30,
      curtains: 50,
    };
  }
}

export default PatternEngine;
