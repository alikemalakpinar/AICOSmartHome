/**
 * AICO Smart Home - Emotional Inference Engine
 *
 * Infers emotional states from multiple signals while
 * preserving privacy and enabling cognitive relief.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  EmotionalContext,
  StressIndicators,
  StressLevel,
  StressSource,
  EnergyLevel,
  SocialMode,
  CognitiveLoadLevel,
  MoodIndicators,
  EmotionalResponse,
  EmotionalTrigger,
  EmotionalAction,
  EmotionalInferenceConfig,
  HouseholdHarmony,
  TensionIndicator,
  VoiceStressSignal,
  MovementStressSignal,
  SleepStressSignal,
  BehavioralStressSignal,
  EnvironmentalStressSignal,
} from './types';
import type { UserId, RoomId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface SensorInput {
  type: SensorInputType;
  userId?: UserId;
  timestamp: Date;
  data: Record<string, unknown>;
}

type SensorInputType =
  | 'voice_analysis'
  | 'movement_tracking'
  | 'sleep_data'
  | 'wearable_hrv'
  | 'environmental_sensors'
  | 'behavioral_observation'
  | 'calendar_context'
  | 'interaction_pattern';

type EmotionalEngineEvents = {
  stressLevelChanged: [UserId, StressLevel, StressLevel];
  energyLevelChanged: [UserId, number, number];
  cognitiveOverloadDetected: [UserId];
  tensionDetected: [TensionIndicator];
  responseTriggered: [EmotionalResponse];
  silenceModeActivated: [UserId];
  recoveryRecommended: [UserId, string];
};

// ============================================================================
// Emotional Inference Engine
// ============================================================================

export class EmotionalInferenceEngine extends EventEmitter<EmotionalEngineEvents> {
  private config: EmotionalInferenceConfig;
  private contexts: Map<UserId, EmotionalContext> = new Map();
  private household: HouseholdHarmony;
  private inputBuffer: SensorInput[] = [];
  private activeResponses: Map<string, EmotionalResponse> = new Map();

  constructor(config: Partial<EmotionalInferenceConfig> = {}) {
    super();

    this.config = {
      weights: {
        voice: 0.2,
        movement: 0.15,
        sleep: 0.25,
        hrv: 0.2,
        environmental: 0.1,
        behavioral: 0.1,
      },
      thresholds: {
        stressIntervention: 0.7,
        energyWarning: 0.3,
        overloadPrevention: 0.8,
      },
      privacy: {
        storeEmotionalData: false,
        retentionPeriod: 0,
        shareWithOtherOccupants: false,
        anonymizeForAnalytics: true,
      },
      calibration: {
        personalBaseline: true,
        adaptationRate: 0.1,
        minConfidenceForAction: 0.6,
      },
      ...config,
    };

    this.household = this.initializeHouseholdHarmony();
  }

  // ============================================================================
  // Input Processing
  // ============================================================================

  /**
   * Process incoming sensor data
   */
  processSensorInput(input: SensorInput): void {
    this.inputBuffer.push(input);

    // Process immediately if high-priority signal
    if (this.isHighPrioritySignal(input)) {
      this.processInputsNow();
    }

    // Trim buffer
    if (this.inputBuffer.length > 1000) {
      this.inputBuffer = this.inputBuffer.slice(-500);
    }
  }

  /**
   * Batch process inputs (called periodically)
   */
  processInputsNow(): void {
    const userInputs = this.groupInputsByUser(this.inputBuffer);

    for (const [userId, inputs] of userInputs) {
      const previousContext = this.contexts.get(userId);
      const newContext = this.inferEmotionalContext(userId, inputs, previousContext);

      // Detect significant changes
      if (previousContext) {
        this.detectChanges(userId, previousContext, newContext);
      }

      this.contexts.set(userId, newContext);

      // Evaluate triggers
      this.evaluateTriggers(userId, newContext);
    }

    // Update household harmony
    this.updateHouseholdHarmony();

    // Clear processed inputs
    this.inputBuffer = [];
  }

  // ============================================================================
  // Emotional Context Inference
  // ============================================================================

  private inferEmotionalContext(
    userId: UserId,
    inputs: SensorInput[],
    previous?: EmotionalContext
  ): EmotionalContext {
    // Extract signals from inputs
    const voiceSignal = this.extractVoiceSignal(inputs);
    const movementSignal = this.extractMovementSignal(inputs);
    const sleepSignal = this.extractSleepSignal(inputs);
    const environmentalSignal = this.extractEnvironmentalSignal(inputs);
    const behavioralSignal = this.extractBehavioralSignal(inputs);

    // Infer stress
    const stress = this.inferStress({
      voiceStress: voiceSignal,
      movementStress: movementSignal,
      sleepStress: sleepSignal,
      environmentalStress: environmentalSignal,
      behavioralStress: behavioralSignal,
    }, previous?.stress);

    // Infer energy
    const energy = this.inferEnergy(sleepSignal, inputs, previous?.energy);

    // Infer social mode
    const socialMode = this.inferSocialMode(inputs, previous?.socialMode);

    // Infer cognitive load
    const cognitiveLoad = this.inferCognitiveLoad(behavioralSignal, stress, previous?.cognitiveLoad);

    // Infer mood
    const mood = this.inferMood(stress, energy, inputs, previous?.mood);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence([
      voiceSignal?.confidence || 0,
      movementSignal?.confidence || 0,
      sleepSignal?.confidence || 0,
      environmentalSignal?.confidence || 0,
      behavioralSignal?.confidence || 0,
    ]);

    return {
      stress,
      energy,
      socialMode,
      cognitiveLoad,
      mood,
      circadianMood: previous?.circadianMood || this.defaultCircadianPattern(),
      weeklyRhythm: previous?.weeklyRhythm || this.defaultWeeklyPattern(),
      seasonalAffect: previous?.seasonalAffect || this.defaultSeasonalPattern(),
      householdHarmony: this.household,
      privacyNeed: this.inferPrivacyNeed(socialMode, cognitiveLoad, stress),
      overallConfidence,
      lastUpdated: new Date(),
    };
  }

  // ============================================================================
  // Stress Inference
  // ============================================================================

  private inferStress(
    signals: {
      voiceStress?: VoiceStressSignal;
      movementStress?: MovementStressSignal;
      sleepStress?: SleepStressSignal;
      environmentalStress?: EnvironmentalStressSignal;
      behavioralStress?: BehavioralStressSignal;
    },
    previous?: StressIndicators
  ): StressIndicators {
    const weights = this.config.weights;
    let totalWeight = 0;
    let weightedScore = 0;

    // Voice stress contribution
    if (signals.voiceStress && signals.voiceStress.confidence > 0.5) {
      const voiceScore = this.normalizeVoiceStress(signals.voiceStress);
      weightedScore += voiceScore * weights.voice * signals.voiceStress.confidence;
      totalWeight += weights.voice * signals.voiceStress.confidence;
    }

    // Movement stress contribution
    if (signals.movementStress && signals.movementStress.confidence > 0.5) {
      const movementScore = (signals.movementStress.paceScore +
        signals.movementStress.restlessness +
        signals.movementStress.hesitancy) / 3;
      weightedScore += movementScore * weights.movement * signals.movementStress.confidence;
      totalWeight += weights.movement * signals.movementStress.confidence;
    }

    // Sleep stress contribution (inversely related - poor sleep = more stress)
    if (signals.sleepStress && signals.sleepStress.confidence > 0.5) {
      const sleepScore = 1 - signals.sleepStress.sleepQuality;
      weightedScore += sleepScore * weights.sleep * signals.sleepStress.confidence;
      totalWeight += weights.sleep * signals.sleepStress.confidence;
    }

    // Environmental stress contribution
    if (signals.environmentalStress && signals.environmentalStress.confidence > 0.5) {
      const envScore = (signals.environmentalStress.clutterLevel +
        signals.environmentalStress.noiseLevel +
        (1 - signals.environmentalStress.temperatureComfort) +
        (1 - signals.environmentalStress.lightingComfort)) / 4;
      weightedScore += envScore * weights.environmental * signals.environmentalStress.confidence;
      totalWeight += weights.environmental * signals.environmentalStress.confidence;
    }

    // Behavioral stress contribution
    if (signals.behavioralStress && signals.behavioralStress.confidence > 0.5) {
      const behaviorScore = (signals.behavioralStress.taskSwitching +
        signals.behavioralStress.incompleteTasks +
        signals.behavioralStress.deviceChecking +
        signals.behavioralStress.routineDeviation) / 4;
      weightedScore += behaviorScore * weights.behavioral * signals.behavioralStress.confidence;
      totalWeight += weights.behavioral * signals.behavioralStress.confidence;
    }

    // Calculate final stress score
    const stressScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const level = this.scoreToStressLevel(stressScore);

    // Determine trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (previous) {
      const previousScore = this.stressLevelToScore(previous.level);
      if (stressScore > previousScore + 0.1) trend = 'increasing';
      else if (stressScore < previousScore - 0.1) trend = 'decreasing';
    }

    // Identify sources
    const sources = this.identifyStressSources(signals, stressScore);

    return {
      level,
      confidence: totalWeight > 0 ? totalWeight / Object.keys(weights).length : 0,
      sources,
      trend,
      signals,
    };
  }

  private normalizeVoiceStress(signal: VoiceStressSignal): number {
    // Normalize voice stress indicators to 0-1
    const pitchContribution = Math.min(signal.pitchVariation / 100, 1) * 0.3;
    const rateContribution = Math.abs(signal.speechRate - 150) / 100 * 0.3; // Normal ~150 wpm
    const pauseContribution = Math.min(signal.pauseFrequency / 10, 1) * 0.2;
    const volumeContribution = Math.min(signal.volumeVariation / 20, 1) * 0.2;

    return pitchContribution + rateContribution + pauseContribution + volumeContribution;
  }

  private scoreToStressLevel(score: number): StressLevel {
    if (score < 0.15) return 'relaxed';
    if (score < 0.3) return 'calm';
    if (score < 0.45) return 'mild';
    if (score < 0.6) return 'moderate';
    if (score < 0.8) return 'elevated';
    return 'high';
  }

  private stressLevelToScore(level: StressLevel): number {
    const scores: Record<StressLevel, number> = {
      relaxed: 0.1,
      calm: 0.25,
      mild: 0.4,
      moderate: 0.55,
      elevated: 0.7,
      high: 0.9,
    };
    return scores[level];
  }

  private identifyStressSources(
    signals: Record<string, unknown>,
    score: number
  ): StressSource[] {
    const sources: StressSource[] = [];

    if (signals.sleepStress) {
      const sleep = signals.sleepStress as SleepStressSignal;
      if (sleep.sleepDebt > 2) sources.push('sleep_deprivation');
    }

    if (signals.behavioralStress) {
      const behavior = signals.behavioralStress as BehavioralStressSignal;
      if (behavior.taskSwitching > 0.7) sources.push('work_pressure');
    }

    if (signals.environmentalStress) {
      const env = signals.environmentalStress as EnvironmentalStressSignal;
      if (env.temperatureComfort < 0.5 || env.noiseLevel > 0.7) {
        sources.push('environmental_discomfort');
      }
    }

    if (sources.length === 0 && score > 0.4) {
      sources.push('unknown');
    }

    return sources;
  }

  // ============================================================================
  // Energy Inference
  // ============================================================================

  private inferEnergy(
    sleepSignal: SleepStressSignal | undefined,
    inputs: SensorInput[],
    previous?: EnergyLevel
  ): EnergyLevel {
    // Base energy from sleep
    const sleepRecovery = sleepSignal
      ? sleepSignal.sleepQuality * (sleepSignal.hoursSlept / 8)
      : 0.5;

    // Activity level from recent movement
    const activityInputs = inputs.filter((i) => i.type === 'movement_tracking');
    const activityLevel = activityInputs.length > 0 ? 0.5 : 0.3;

    // Time of day factor
    const hour = new Date().getHours();
    const timeOfDay = this.getTimeOfDayEnergy(hour);

    // Calculate component energies
    const physical = Math.min(1, sleepRecovery * 0.6 + activityLevel * 0.4) * 100;
    const mental = Math.min(1, sleepRecovery * 0.7 + timeOfDay * 0.3) * 100;
    const social = previous?.social || 70; // Social battery changes slowly

    const overall = (physical * 0.4 + mental * 0.4 + social * 0.2);

    // Determine trend
    let trend: 'rising' | 'stable' | 'declining' = 'stable';
    if (previous) {
      if (overall > previous.overall + 5) trend = 'rising';
      else if (overall < previous.overall - 5) trend = 'declining';
    }

    return {
      physical,
      mental,
      social,
      overall,
      trend,
      factors: {
        sleepRecovery,
        activityLevel,
        nutritionIndicators: 0.5, // Would need meal tracking
        socialInteraction: 0.5,
        timeOfDay,
      },
    };
  }

  private getTimeOfDayEnergy(hour: number): number {
    // Typical energy curve throughout the day
    if (hour >= 6 && hour < 9) return 0.7;  // Morning rise
    if (hour >= 9 && hour < 12) return 0.9; // Peak morning
    if (hour >= 12 && hour < 14) return 0.6; // Post-lunch dip
    if (hour >= 14 && hour < 17) return 0.8; // Afternoon
    if (hour >= 17 && hour < 20) return 0.7; // Evening
    if (hour >= 20 && hour < 23) return 0.5; // Wind down
    return 0.3; // Night
  }

  // ============================================================================
  // Social Mode & Cognitive Load Inference
  // ============================================================================

  private inferSocialMode(
    inputs: SensorInput[],
    previous?: SocialMode
  ): SocialMode {
    // Check for social indicators
    const interactionInputs = inputs.filter((i) => i.type === 'interaction_pattern');
    const calendarInputs = inputs.filter((i) => i.type === 'calendar_context');

    // Check calendar for meetings/events
    const hasUpcomingMeeting = calendarInputs.some((i) =>
      (i.data as any).type === 'work' || (i.data as any).type === 'formal'
    );
    if (hasUpcomingMeeting) return 'formal';

    const hasSocialEvent = calendarInputs.some((i) =>
      (i.data as any).type === 'social'
    );
    if (hasSocialEvent) return 'social';

    // Default based on time and previous
    return previous || 'intimate';
  }

  private inferCognitiveLoad(
    behavioral: BehavioralStressSignal | undefined,
    stress: StressIndicators,
    previous?: CognitiveLoadLevel
  ): CognitiveLoadLevel {
    let score = 0;

    // Behavioral indicators
    if (behavioral) {
      score += behavioral.taskSwitching * 0.3;
      score += behavioral.incompleteTasks * 0.2;
      score += behavioral.deviceChecking * 0.2;
    }

    // Stress contribution
    score += this.stressLevelToScore(stress.level) * 0.3;

    if (score < 0.25) return 'low';
    if (score < 0.5) return 'moderate';
    if (score < 0.75) return 'high';
    return 'overwhelmed';
  }

  // ============================================================================
  // Mood Inference
  // ============================================================================

  private inferMood(
    stress: StressIndicators,
    energy: EnergyLevel,
    inputs: SensorInput[],
    previous?: MoodIndicators
  ): MoodIndicators {
    // Valence (negative to positive)
    const stressContribution = -this.stressLevelToScore(stress.level);
    const energyContribution = (energy.overall / 100) * 0.5;
    const valence = (stressContribution + energyContribution + 0.5) * 0.7; // Normalize to -1 to 1

    // Arousal (calm to energized)
    const arousal = Math.min(1, energy.physical / 100);

    // Dominance (sense of control)
    const dominance = stress.level === 'high' || stress.level === 'elevated'
      ? 0.3
      : 0.6;

    // Discrete emotions
    const emotions = this.inferDiscreteEmotions(valence, arousal, stress);

    return {
      valence,
      arousal,
      dominance,
      emotions,
      confidence: (stress.confidence + 0.5) / 2,
    };
  }

  private inferDiscreteEmotions(
    valence: number,
    arousal: number,
    stress: StressIndicators
  ): MoodIndicators['emotions'] {
    // Map valence/arousal to discrete emotions
    let emotions = {
      happy: 0,
      content: 0,
      excited: 0,
      anxious: 0,
      frustrated: 0,
      sad: 0,
      angry: 0,
      neutral: 0.3,
    };

    if (valence > 0.3 && arousal > 0.5) {
      emotions.happy = (valence + arousal) / 2;
      emotions.excited = arousal * 0.5;
    } else if (valence > 0.3 && arousal <= 0.5) {
      emotions.content = valence;
    } else if (valence < -0.3 && arousal > 0.5) {
      if (stress.level === 'high' || stress.level === 'elevated') {
        emotions.anxious = Math.abs(valence) * arousal;
      } else {
        emotions.frustrated = Math.abs(valence) * 0.5;
      }
    } else if (valence < -0.3 && arousal <= 0.5) {
      emotions.sad = Math.abs(valence);
    }

    // Normalize
    const total = Object.values(emotions).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const key in emotions) {
        emotions[key as keyof typeof emotions] /= total;
      }
    }

    return emotions;
  }

  // ============================================================================
  // Privacy Inference
  // ============================================================================

  private inferPrivacyNeed(
    socialMode: SocialMode,
    cognitiveLoad: CognitiveLoadLevel,
    stress: StressIndicators
  ): 'open' | 'normal' | 'elevated' | 'maximum' {
    if (cognitiveLoad === 'overwhelmed' || stress.level === 'high') {
      return 'maximum';
    }

    if (socialMode === 'solitude' || cognitiveLoad === 'high' || stress.level === 'elevated') {
      return 'elevated';
    }

    if (socialMode === 'formal') {
      return 'normal';
    }

    return socialMode === 'social' ? 'open' : 'normal';
  }

  // ============================================================================
  // Signal Extraction
  // ============================================================================

  private extractVoiceSignal(inputs: SensorInput[]): VoiceStressSignal | undefined {
    const voiceInputs = inputs.filter((i) => i.type === 'voice_analysis');
    if (voiceInputs.length === 0) return undefined;

    // Average voice metrics
    const latest = voiceInputs[voiceInputs.length - 1];
    return {
      pitchVariation: (latest.data.pitchVariation as number) || 50,
      speechRate: (latest.data.speechRate as number) || 150,
      pauseFrequency: (latest.data.pauseFrequency as number) || 5,
      volumeVariation: (latest.data.volumeVariation as number) || 10,
      confidence: 0.7,
    };
  }

  private extractMovementSignal(inputs: SensorInput[]): MovementStressSignal | undefined {
    const moveInputs = inputs.filter((i) => i.type === 'movement_tracking');
    if (moveInputs.length === 0) return undefined;

    const latest = moveInputs[moveInputs.length - 1];
    return {
      paceScore: (latest.data.paceScore as number) || 0.5,
      restlessness: (latest.data.restlessness as number) || 0.3,
      hesitancy: (latest.data.hesitancy as number) || 0.2,
      confidence: 0.6,
    };
  }

  private extractSleepSignal(inputs: SensorInput[]): SleepStressSignal | undefined {
    const sleepInputs = inputs.filter((i) => i.type === 'sleep_data');
    if (sleepInputs.length === 0) return undefined;

    const latest = sleepInputs[sleepInputs.length - 1];
    return {
      hoursSlept: (latest.data.hoursSlept as number) || 7,
      sleepQuality: (latest.data.sleepQuality as number) || 0.7,
      sleepDebt: (latest.data.sleepDebt as number) || 0,
      wakeFrequency: (latest.data.wakeFrequency as number) || 1,
      confidence: 0.8,
    };
  }

  private extractEnvironmentalSignal(inputs: SensorInput[]): EnvironmentalStressSignal | undefined {
    const envInputs = inputs.filter((i) => i.type === 'environmental_sensors');
    if (envInputs.length === 0) return undefined;

    const latest = envInputs[envInputs.length - 1];
    return {
      clutterLevel: (latest.data.clutterLevel as number) || 0.3,
      noiseLevel: (latest.data.noiseLevel as number) || 0.4,
      temperatureComfort: (latest.data.temperatureComfort as number) || 0.8,
      lightingComfort: (latest.data.lightingComfort as number) || 0.7,
      airQuality: (latest.data.airQuality as number) || 0.8,
      confidence: 0.7,
    };
  }

  private extractBehavioralSignal(inputs: SensorInput[]): BehavioralStressSignal | undefined {
    const behaviorInputs = inputs.filter((i) => i.type === 'behavioral_observation');
    if (behaviorInputs.length === 0) return undefined;

    const latest = behaviorInputs[behaviorInputs.length - 1];
    return {
      taskSwitching: (latest.data.taskSwitching as number) || 0.3,
      incompleteTasks: (latest.data.incompleteTasks as number) || 0.2,
      deviceChecking: (latest.data.deviceChecking as number) || 0.3,
      routineDeviation: (latest.data.routineDeviation as number) || 0.1,
      confidence: 0.5,
    };
  }

  // ============================================================================
  // Household Harmony
  // ============================================================================

  private initializeHouseholdHarmony(): HouseholdHarmony {
    return {
      overallHarmony: 0.8,
      tensions: [],
      recoveryProgress: 1,
      interactionFrequency: 0.5,
      positiveInteractions: 10,
      negativeInteractions: 0,
    };
  }

  private updateHouseholdHarmony(): void {
    const contexts = Array.from(this.contexts.values());

    // Check for conflicting needs
    const tensions = this.detectTensions(contexts);

    // Update harmony based on tensions
    let harmony = 1;
    for (const tension of tensions) {
      harmony -= tension.severity * 0.1;
    }

    this.household = {
      ...this.household,
      overallHarmony: Math.max(0, Math.min(1, harmony)),
      tensions,
    };

    // Emit tension events
    for (const tension of tensions) {
      if (tension.severity > 0.5) {
        this.emit('tensionDetected', tension);
      }
    }
  }

  private detectTensions(contexts: EmotionalContext[]): TensionIndicator[] {
    const tensions: TensionIndicator[] = [];

    // Check for privacy conflicts
    const wantsPrivacy = contexts.filter((c) => c.privacyNeed === 'maximum' || c.privacyNeed === 'elevated');
    const wantsSocial = contexts.filter((c) => c.socialMode === 'social');

    if (wantsPrivacy.length > 0 && wantsSocial.length > 0) {
      tensions.push({
        type: 'privacy_conflict',
        severity: 0.6,
        duration: 0,
        resolved: false,
      });
    }

    return tensions;
  }

  // ============================================================================
  // Response Triggering
  // ============================================================================

  private evaluateTriggers(userId: UserId, context: EmotionalContext): void {
    // Stress intervention
    if (
      this.stressLevelToScore(context.stress.level) > this.config.thresholds.stressIntervention &&
      context.stress.confidence > this.config.calibration.minConfidenceForAction
    ) {
      this.triggerResponse({
        trigger: { condition: 'stress_high', threshold: this.config.thresholds.stressIntervention },
        actions: [
          { type: 'reduce_stimulation', target: 'environment', action: 'dim_lights', intensity: 0.3 },
          { type: 'hold_notifications', target: 'notifications', action: 'batch_non_urgent', intensity: 1 },
          { type: 'enhance_privacy', target: 'automation', action: 'reduce_system_presence', intensity: 0.5 },
        ],
        priority: 'gradual',
        reversible: true,
      });
    }

    // Energy warning
    if (context.energy.overall < this.config.thresholds.energyWarning * 100) {
      this.emit('recoveryRecommended', userId, 'Low energy detected. Consider taking a break.');
    }

    // Cognitive overload prevention
    if (context.cognitiveLoad === 'overwhelmed') {
      this.emit('cognitiveOverloadDetected', userId);
      this.triggerResponse({
        trigger: { condition: 'overwhelmed', threshold: this.config.thresholds.overloadPrevention },
        actions: [
          { type: 'defer_decisions', target: 'automation', action: 'hold_automation_choices', intensity: 1 },
          { type: 'enable_silence_mode', target: 'environment', action: 'minimize_all_stimulation', intensity: 0.8 },
        ],
        priority: 'immediate',
        reversible: true,
      });

      this.emit('silenceModeActivated', userId);
    }
  }

  private triggerResponse(response: EmotionalResponse): void {
    const responseId = `response_${Date.now()}`;
    this.activeResponses.set(responseId, response);
    this.emit('responseTriggered', response);
  }

  // ============================================================================
  // Change Detection
  // ============================================================================

  private detectChanges(
    userId: UserId,
    previous: EmotionalContext,
    current: EmotionalContext
  ): void {
    // Stress level change
    if (previous.stress.level !== current.stress.level) {
      this.emit('stressLevelChanged', userId, previous.stress.level, current.stress.level);
    }

    // Energy level change
    const energyDiff = Math.abs(previous.energy.overall - current.energy.overall);
    if (energyDiff > 10) {
      this.emit('energyLevelChanged', userId, previous.energy.overall, current.energy.overall);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private isHighPrioritySignal(input: SensorInput): boolean {
    return input.type === 'wearable_hrv' || input.type === 'voice_analysis';
  }

  private groupInputsByUser(inputs: SensorInput[]): Map<UserId, SensorInput[]> {
    const grouped = new Map<UserId, SensorInput[]>();
    const defaultUser = 'default' as UserId;

    for (const input of inputs) {
      const userId = input.userId || defaultUser;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)!.push(input);
    }

    return grouped;
  }

  private calculateOverallConfidence(confidences: number[]): number {
    const valid = confidences.filter((c) => c > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  private defaultCircadianPattern() {
    const defaultMood: MoodIndicators = {
      valence: 0,
      arousal: 0.5,
      dominance: 0.5,
      emotions: { happy: 0, content: 0.3, excited: 0, anxious: 0, frustrated: 0, sad: 0, angry: 0, neutral: 0.7 },
      confidence: 0.3,
    };
    return {
      morningMood: defaultMood,
      afternoonMood: defaultMood,
      eveningMood: defaultMood,
      nightMood: defaultMood,
      peakEnergyTime: 10,
      lowEnergyTime: 15,
      optimalFocusWindow: { start: 9, end: 12 },
    };
  }

  private defaultWeeklyPattern() {
    return {
      dayPatterns: new Map(),
      weekdayVsWeekend: {
        weekdayStress: 0.5,
        weekendStress: 0.3,
        weekdayEnergy: 0.6,
        weekendEnergy: 0.7,
      },
      mostStressfulDay: 1,
      mostRelaxedDay: 6,
    };
  }

  private defaultSeasonalPattern() {
    return {
      winterMood: 0,
      springMood: 0.2,
      summerMood: 0.3,
      autumnMood: 0.1,
      lightSensitivity: 0.5,
      temperatureSensitivity: 0.5,
      hasSeasonalPattern: false,
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getEmotionalContext(userId: UserId): EmotionalContext | undefined {
    return this.contexts.get(userId);
  }

  getAllContexts(): Map<UserId, EmotionalContext> {
    return new Map(this.contexts);
  }

  getHouseholdHarmony(): HouseholdHarmony {
    return this.household;
  }

  getActiveResponses(): EmotionalResponse[] {
    return Array.from(this.activeResponses.values());
  }

  /**
   * Manual override for privacy mode
   */
  setPrivacyMode(userId: UserId, mode: 'open' | 'normal' | 'elevated' | 'maximum'): void {
    const context = this.contexts.get(userId);
    if (context) {
      context.privacyNeed = mode;
      this.contexts.set(userId, context);
    }
  }

  /**
   * Clear active responses
   */
  clearResponses(): void {
    this.activeResponses.clear();
  }
}

export default EmotionalInferenceEngine;
