/**
 * AICO Smart Home - Ritual Recognition Engine
 *
 * "The poetry of routine."
 *
 * Detecting and supporting the rituals that give life rhythm.
 * A morning coffee isn't just caffeine - it's ceremony.
 * Sunday dinner isn't just food - it's family.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  RitualState,
  Ritual,
  RitualType,
  RitualFrequency,
  RitualStep,
  RitualTiming,
  RitualImportance,
  RitualFlexibility,
  RitualMetadata,
  RitualCandidate,
  DetectedPattern,
  DetectedAction,
  ActiveRitual,
  RitualSupport,
  RitualPreparation,
  RitualAutomation,
  RitualProtection,
  RitualEnhancement,
  DetectionConfig,
  RitualOccurrence,
  TimeWindow,
} from './types';
import type { UserId, RoomId, DeviceId } from '@/types/core';

interface RitualEvents {
  'ritual:detected': (candidate: RitualCandidate) => void;
  'ritual:confirmed': (ritual: Ritual) => void;
  'ritual:starting': (ritual: Ritual, participants: UserId[]) => void;
  'ritual:step-changed': (ritualId: string, step: number) => void;
  'ritual:completed': (ritualId: string, satisfaction?: number) => void;
  'ritual:interrupted': (ritualId: string, reason: string) => void;
  'ritual:evolved': (ritualId: string, change: string) => void;
  'preparation:triggered': (ritualId: string, preparation: RitualPreparation) => void;
  'protection:activated': (ritualId: string, protection: RitualProtection) => void;
}

interface ActionObservation {
  timestamp: Date;
  userId: UserId;
  actionType: string;
  target: string;
  room: RoomId;
  context: Record<string, unknown>;
}

export class RitualRecognitionEngine extends EventEmitter<RitualEvents> {
  private state: RitualState;
  private observations: ActionObservation[] = [];
  private preparationTimers: Map<string, NodeJS.Timeout> = new Map();
  private detectionInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<DetectionConfig>) {
    super();
    this.state = this.initializeState(config);
    this.startDetection();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initializeState(config?: Partial<DetectionConfig>): RitualState {
    return {
      rituals: new Map(),
      activeRituals: [],
      candidates: [],
      supports: new Map(),
      detectionConfig: {
        minOccurrences: 5,
        minConfidence: 0.6,
        autoConfirmThreshold: 0.9,
        learningEnabled: true,
        sensitivityLevel: 'medium',
        ...config,
      },
    };
  }

  // ===========================================================================
  // Observation
  // ===========================================================================

  /**
   * Observe a user action for pattern detection
   */
  public observe(observation: ActionObservation): void {
    this.observations.push(observation);

    // Keep only last 30 days of observations
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.observations = this.observations.filter(o => o.timestamp > thirtyDaysAgo);

    // Check if observation triggers active ritual progression
    this.checkActiveRitualProgression(observation);
  }

  private checkActiveRitualProgression(observation: ActionObservation): void {
    for (const active of this.state.activeRituals) {
      const ritual = this.state.rituals.get(active.ritualId);
      if (!ritual) continue;

      const currentStep = ritual.sequence[active.currentStep];
      if (!currentStep) continue;

      // Check if observation matches expected next step action
      const matchesStep = currentStep.actions.some(
        a => a.type === observation.actionType
      );

      if (matchesStep) {
        this.advanceRitual(active.ritualId);
      }
    }
  }

  // ===========================================================================
  // Pattern Detection
  // ===========================================================================

  private startDetection(): void {
    // Run detection every hour
    this.detectionInterval = setInterval(() => {
      if (this.state.detectionConfig.learningEnabled) {
        this.detectPatterns();
      }
    }, 60 * 60 * 1000);
  }

  private detectPatterns(): void {
    const patterns = this.analyzeObservations();

    for (const pattern of patterns) {
      const existingCandidate = this.state.candidates.find(
        c => this.patternsMatch(c.pattern, pattern)
      );

      if (existingCandidate) {
        // Update existing candidate
        this.updateCandidate(existingCandidate, pattern);
      } else if (pattern.consistency >= this.state.detectionConfig.minConfidence) {
        // Create new candidate
        this.createCandidate(pattern);
      }
    }

    // Check for auto-confirmation
    this.checkAutoConfirmation();
  }

  private analyzeObservations(): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Group observations by time of day and day of week
    const timeGroups = this.groupByTimeOfDay();
    const sequenceGroups = this.findSequences(timeGroups);

    for (const sequence of sequenceGroups) {
      if (sequence.actions.length >= 2 && sequence.occurrenceCount >= this.state.detectionConfig.minOccurrences) {
        patterns.push(this.createPattern(sequence));
      }
    }

    return patterns;
  }

  private groupByTimeOfDay(): Map<string, ActionObservation[]> {
    const groups = new Map<string, ActionObservation[]>();

    for (const observation of this.observations) {
      // Round to 30-minute windows
      const date = observation.timestamp;
      const hour = date.getHours();
      const halfHour = Math.floor(date.getMinutes() / 30) * 30;
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}_${hour}_${halfHour}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(observation);
    }

    return groups;
  }

  private findSequences(timeGroups: Map<string, ActionObservation[]>): Array<{
    actions: DetectedAction[];
    occurrenceCount: number;
    participants: UserId[];
    frequency: RitualFrequency;
  }> {
    const sequences: Array<{
      actions: DetectedAction[];
      occurrenceCount: number;
      participants: UserId[];
      frequency: RitualFrequency;
    }> = [];

    // Find repeated sequences of actions
    const actionSequences = new Map<string, {
      actions: string[];
      timestamps: Date[];
      users: Set<UserId>;
    }>();

    for (const [key, observations] of timeGroups) {
      // Sort by timestamp
      const sorted = observations.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      // Extract action sequence
      const actionKey = sorted.map(o => o.actionType).join(',');

      if (!actionSequences.has(actionKey)) {
        actionSequences.set(actionKey, {
          actions: sorted.map(o => o.actionType),
          timestamps: [],
          users: new Set(),
        });
      }

      const seq = actionSequences.get(actionKey)!;
      seq.timestamps.push(sorted[0].timestamp);
      sorted.forEach(o => seq.users.add(o.userId));
    }

    // Convert to detected sequences
    for (const [key, seq] of actionSequences) {
      if (seq.timestamps.length >= this.state.detectionConfig.minOccurrences) {
        const frequency = this.determineFrequency(seq.timestamps);
        const actions: DetectedAction[] = seq.actions.map((type, index) => ({
          type,
          target: '',
          orderInSequence: index,
          frequency: seq.timestamps.length,
          timing: { mean: 0, variance: 0 },
        }));

        sequences.push({
          actions,
          occurrenceCount: seq.timestamps.length,
          participants: Array.from(seq.users),
          frequency,
        });
      }
    }

    return sequences;
  }

  private determineFrequency(timestamps: Date[]): RitualFrequency {
    if (timestamps.length < 2) return 'irregular';

    // Calculate average interval between occurrences
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i].getTime() - timestamps[i - 1].getTime());
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const avgDays = avgInterval / (24 * 60 * 60 * 1000);

    if (avgDays <= 1.5) return 'daily';
    if (avgDays <= 8) return 'weekly';
    if (avgDays <= 16) return 'biweekly';
    if (avgDays <= 35) return 'monthly';
    if (avgDays <= 100) return 'seasonal';
    if (avgDays <= 400) return 'annual';
    return 'irregular';
  }

  private createPattern(sequence: {
    actions: DetectedAction[];
    occurrenceCount: number;
    participants: UserId[];
    frequency: RitualFrequency;
  }): DetectedPattern {
    const consistency = Math.min(1, sequence.occurrenceCount / 10);

    return {
      actions: sequence.actions,
      timing: {
        averageStart: '08:00', // Would be calculated from actual data
        startVariance: 30,
        averageDuration: 30,
        durationVariance: 10,
      },
      participants: sequence.participants,
      frequency: sequence.frequency,
      consistency,
    };
  }

  private patternsMatch(a: DetectedPattern, b: DetectedPattern): boolean {
    // Check if patterns represent the same ritual
    if (a.actions.length !== b.actions.length) return false;

    const aActions = a.actions.map(x => x.type).sort();
    const bActions = b.actions.map(x => x.type).sort();

    return aActions.every((action, i) => action === bActions[i]);
  }

  private updateCandidate(candidate: RitualCandidate, pattern: DetectedPattern): void {
    // Update confidence based on new pattern data
    candidate.confidence = (candidate.confidence + pattern.consistency) / 2;
    candidate.occurrences.push(new Date());

    // Keep last 30 occurrences
    if (candidate.occurrences.length > 30) {
      candidate.occurrences.shift();
    }
  }

  private createCandidate(pattern: DetectedPattern): void {
    const suggestedType = this.inferRitualType(pattern);
    const suggestedName = this.generateRitualName(suggestedType, pattern);

    const candidate: RitualCandidate = {
      pattern,
      confidence: pattern.consistency,
      suggestedType,
      suggestedName,
      reasoning: this.generateReasoning(pattern),
      occurrences: [new Date()],
      needsConfirmation: true,
    };

    this.state.candidates.push(candidate);
    this.emit('ritual:detected', candidate);
  }

  private inferRitualType(pattern: DetectedPattern): RitualType {
    // Infer type based on actions and timing
    const actions = pattern.actions.map(a => a.type);
    const startHour = parseInt(pattern.timing.averageStart.split(':')[0]);

    // Morning routines
    if (startHour >= 5 && startHour <= 9) {
      if (actions.some(a => a.includes('coffee') || a.includes('kettle'))) {
        return 'coffee_tea_ritual';
      }
      return 'morning_routine';
    }

    // Evening routines
    if (startHour >= 19 && startHour <= 23) {
      if (actions.some(a => a.includes('dim') || a.includes('sleep'))) {
        return 'evening_wind_down';
      }
      return 'evening_wind_down';
    }

    // Meal times
    if (actions.some(a => a.includes('kitchen') || a.includes('oven'))) {
      return 'meal_preparation';
    }

    // Exercise
    if (actions.some(a => a.includes('exercise') || a.includes('gym'))) {
      return 'exercise';
    }

    return 'custom';
  }

  private generateRitualName(type: RitualType, pattern: DetectedPattern): string {
    const typeNames: Record<RitualType, string> = {
      morning_routine: 'Sabah Rutini',
      evening_wind_down: 'Akşam Dinlenmesi',
      meal_preparation: 'Yemek Hazırlığı',
      work_focus: 'Çalışma Odağı',
      exercise: 'Egzersiz Zamanı',
      meditation: 'Meditasyon',
      reading_time: 'Okuma Zamanı',
      coffee_tea_ritual: 'Kahve/Çay Ritüeli',
      weekend_brunch: 'Hafta Sonu Kahvaltısı',
      family_dinner: 'Aile Yemeği',
      cleaning_day: 'Temizlik Günü',
      shopping_trip: 'Alışveriş',
      movie_night: 'Film Gecesi',
      game_night: 'Oyun Gecesi',
      holiday_preparation: 'Bayram Hazırlığı',
      seasonal_transition: 'Mevsim Geçişi',
      spring_cleaning: 'Bahar Temizliği',
      garden_care: 'Bahçe Bakımı',
      celebration: 'Kutlama',
      remembrance: 'Anma',
      guest_hosting: 'Misafir Ağırlama',
      self_care: 'Kişisel Bakım',
      custom: 'Özel Ritüel',
    };

    return typeNames[type] || 'Keşfedilen Ritüel';
  }

  private generateReasoning(pattern: DetectedPattern): string[] {
    const reasons: string[] = [];

    reasons.push(`${pattern.actions.length} adımlık tutarlı bir sıra tespit edildi`);
    reasons.push(`${pattern.frequency} sıklıkta tekrarlanıyor`);
    reasons.push(`Tutarlılık skoru: %${Math.round(pattern.consistency * 100)}`);

    if (pattern.participants.length > 1) {
      reasons.push(`${pattern.participants.length} kişi katılıyor`);
    }

    return reasons;
  }

  private checkAutoConfirmation(): void {
    const threshold = this.state.detectionConfig.autoConfirmThreshold;

    for (let i = this.state.candidates.length - 1; i >= 0; i--) {
      const candidate = this.state.candidates[i];

      if (candidate.confidence >= threshold && candidate.occurrences.length >= 10) {
        // Auto-confirm high-confidence rituals
        this.confirmRitual(candidate);
        this.state.candidates.splice(i, 1);
      }
    }
  }

  // ===========================================================================
  // Ritual Management
  // ===========================================================================

  /**
   * Confirm a detected ritual candidate
   */
  public confirmRitual(candidate: RitualCandidate, customName?: string): Ritual {
    const ritual: Ritual = {
      id: `ritual_${Date.now()}`,
      name: customName || candidate.suggestedName,
      participants: candidate.pattern.participants,
      type: candidate.suggestedType,
      frequency: candidate.pattern.frequency,
      sequence: this.createSequenceFromPattern(candidate.pattern),
      timing: this.createTimingFromPattern(candidate.pattern),
      importance: this.inferImportance(candidate),
      flexibility: this.inferFlexibility(candidate),
      metadata: {
        discoveredAt: candidate.occurrences[0],
        lastOccurrence: candidate.occurrences[candidate.occurrences.length - 1],
        occurrenceCount: candidate.occurrences.length,
        confidence: candidate.confidence,
        userConfirmed: true,
        userNamed: !!customName,
        history: [],
        evolution: [],
      },
    };

    this.state.rituals.set(ritual.id, ritual);

    // Create default support
    this.createDefaultSupport(ritual);

    this.emit('ritual:confirmed', ritual);
    return ritual;
  }

  private createSequenceFromPattern(pattern: DetectedPattern): RitualStep[] {
    return pattern.actions.map((action, index) => ({
      order: index,
      name: this.getActionName(action.type),
      actions: [{
        type: action.type as any,
        target: action.target as any,
        parameters: {},
        triggeredBy: 'step_start',
        timing: 'start',
      }],
      duration: {
        typical: 5,
        minimum: 2,
        maximum: 15,
        variance: 3,
      },
      optional: false,
      variations: [],
      dependencies: index > 0 ? [index - 1] : [],
    }));
  }

  private getActionName(actionType: string): string {
    const names: Record<string, string> = {
      set_lighting: 'Aydınlatma Ayarı',
      set_temperature: 'Sıcaklık Ayarı',
      play_music: 'Müzik Çalma',
      activate_scene: 'Sahne Aktivasyonu',
      adjust_blinds: 'Perde Ayarı',
      start_appliance: 'Cihaz Başlatma',
    };

    return names[actionType] || actionType;
  }

  private createTimingFromPattern(pattern: DetectedPattern): RitualTiming {
    const [hours, minutes] = pattern.timing.averageStart.split(':').map(Number);
    const earliest = `${String(hours - 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const latest = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      preferredStart: {
        earliest,
        ideal: pattern.timing.averageStart,
        latest,
      },
      typicalDuration: pattern.timing.averageDuration,
      flexibility: pattern.timing.startVariance,
      anchors: [],
      blockedBy: [],
    };
  }

  private inferImportance(candidate: RitualCandidate): RitualImportance {
    // More frequent and consistent = more important
    const frequencyWeight = {
      daily: 0.9,
      weekly: 0.7,
      biweekly: 0.5,
      monthly: 0.4,
      seasonal: 0.3,
      annual: 0.6, // Annual rituals are often important
      irregular: 0.2,
    };

    const score = candidate.confidence * (frequencyWeight[candidate.pattern.frequency] || 0.3);

    let level: RitualImportance['level'];
    let skipConsequence: RitualImportance['skipConsequence'];

    if (score > 0.8) {
      level = 'sacred';
      skipConsequence = 'significant_stress';
    } else if (score > 0.6) {
      level = 'important';
      skipConsequence = 'mild_discomfort';
    } else if (score > 0.4) {
      level = 'preferred';
      skipConsequence = 'minor_inconvenience';
    } else {
      level = 'optional';
      skipConsequence = 'no_impact';
    }

    return {
      level,
      reason: 'Tutarlılık ve sıklık bazında çıkarıldı',
      skipConsequence,
      protectedTime: level === 'sacred' || level === 'important',
    };
  }

  private inferFlexibility(candidate: RitualCandidate): RitualFlexibility {
    const variance = candidate.pattern.timing.startVariance;

    return {
      canStartEarly: variance > 15,
      canStartLate: variance > 15,
      canBeShortened: candidate.pattern.timing.durationVariance > 10,
      minimumDuration: Math.max(5, candidate.pattern.timing.averageDuration - candidate.pattern.timing.durationVariance * 2),
      stepsCanBeSkipped: [],
      stepsCanBeReordered: false,
      canBeInterrupted: candidate.pattern.consistency < 0.9,
      resumeAfterInterrupt: true,
      canBeSolo: candidate.pattern.participants.length === 1,
      requiresAllParticipants: candidate.pattern.participants.length > 1,
      substituteParticipants: false,
    };
  }

  private createDefaultSupport(ritual: Ritual): void {
    const support: RitualSupport = {
      ritualId: ritual.id,
      preparations: this.generateDefaultPreparations(ritual),
      automations: this.generateDefaultAutomations(ritual),
      protections: this.generateDefaultProtections(ritual),
      enhancements: this.generateDefaultEnhancements(ritual),
    };

    this.state.supports.set(ritual.id, support);
  }

  private generateDefaultPreparations(ritual: Ritual): RitualPreparation[] {
    const preparations: RitualPreparation[] = [];

    // Preheat/prepare based on ritual type
    if (ritual.type === 'coffee_tea_ritual') {
      preparations.push({
        id: `prep_${ritual.id}_1`,
        action: 'Suyu ısıt',
        advanceTime: 5,
        enabled: false, // User must enable
      });
    }

    if (ritual.type === 'morning_routine') {
      preparations.push({
        id: `prep_${ritual.id}_2`,
        action: 'Banyoyu ısıt',
        advanceTime: 15,
        enabled: false,
      });
    }

    return preparations;
  }

  private generateDefaultAutomations(ritual: Ritual): RitualAutomation[] {
    const automations: RitualAutomation[] = [];

    // Lighting automation
    automations.push({
      id: `auto_${ritual.id}_lighting`,
      trigger: { type: 'ritual_start' },
      actions: [{
        type: 'set_lighting',
        target: 'house',
        parameters: { scene: ritual.type },
        triggeredBy: 'step_start',
        timing: 'start',
      }],
      enabled: false,
      userApproved: false,
    });

    return automations;
  }

  private generateDefaultProtections(ritual: Ritual): RitualProtection[] {
    const protections: RitualProtection[] = [];

    if (ritual.importance.level === 'sacred' || ritual.importance.level === 'important') {
      protections.push({
        type: 'do_not_disturb',
        parameters: { allowEmergency: true },
        enabled: false,
      });

      protections.push({
        type: 'quiet_mode',
        parameters: { reduceBy: 50 },
        enabled: false,
      });
    }

    return protections;
  }

  private generateDefaultEnhancements(ritual: Ritual): RitualEnhancement[] {
    const enhancements: RitualEnhancement[] = [];

    // Music suggestion based on ritual type
    if (ritual.type === 'meditation') {
      enhancements.push({
        type: 'ambient_music',
        settings: { genre: 'meditation', volume: 20 },
        enabled: false,
      });
    }

    if (ritual.type === 'morning_routine') {
      enhancements.push({
        type: 'lighting_scene',
        settings: { scene: 'energizing', transition: 'gradual' },
        enabled: false,
      });
    }

    return enhancements;
  }

  // ===========================================================================
  // Ritual Execution
  // ===========================================================================

  /**
   * Signal that a ritual is starting
   */
  public startRitual(ritualId: string, participants: UserId[]): void {
    const ritual = this.state.rituals.get(ritualId);
    if (!ritual) return;

    // Check if already active
    if (this.state.activeRituals.some(a => a.ritualId === ritualId)) {
      return;
    }

    const active: ActiveRitual = {
      ritualId,
      startedAt: new Date(),
      currentStep: 0,
      participants,
      status: 'in_progress',
      completedSteps: [],
      estimatedEnd: new Date(Date.now() + ritual.timing.typicalDuration * 60 * 1000),
    };

    this.state.activeRituals.push(active);

    // Activate protections
    this.activateProtections(ritualId);

    // Activate enhancements
    this.activateEnhancements(ritualId);

    this.emit('ritual:starting', ritual, participants);
  }

  /**
   * Advance to next step in ritual
   */
  public advanceRitual(ritualId: string): void {
    const activeIndex = this.state.activeRituals.findIndex(a => a.ritualId === ritualId);
    if (activeIndex === -1) return;

    const active = this.state.activeRituals[activeIndex];
    const ritual = this.state.rituals.get(ritualId);
    if (!ritual) return;

    active.completedSteps.push(active.currentStep);
    active.currentStep++;

    if (active.currentStep >= ritual.sequence.length) {
      // Ritual complete
      this.completeRitual(ritualId);
    } else {
      this.emit('ritual:step-changed', ritualId, active.currentStep);
    }
  }

  /**
   * Complete a ritual
   */
  public completeRitual(ritualId: string, satisfaction?: number): void {
    const activeIndex = this.state.activeRituals.findIndex(a => a.ritualId === ritualId);
    if (activeIndex === -1) return;

    const active = this.state.activeRituals[activeIndex];
    const ritual = this.state.rituals.get(ritualId);

    if (ritual) {
      // Record occurrence
      const occurrence: RitualOccurrence = {
        date: active.startedAt,
        startTime: active.startedAt,
        endTime: new Date(),
        stepsCompleted: active.completedSteps,
        participants: active.participants,
        interruptions: [],
        satisfaction,
      };

      ritual.metadata.history.push(occurrence);
      ritual.metadata.lastOccurrence = new Date();
      ritual.metadata.occurrenceCount++;

      // Keep last 100 occurrences
      if (ritual.metadata.history.length > 100) {
        ritual.metadata.history.shift();
      }
    }

    // Deactivate protections
    this.deactivateProtections(ritualId);

    // Remove from active
    this.state.activeRituals.splice(activeIndex, 1);

    this.emit('ritual:completed', ritualId, satisfaction);
  }

  /**
   * Interrupt an active ritual
   */
  public interruptRitual(ritualId: string, reason: string): void {
    const active = this.state.activeRituals.find(a => a.ritualId === ritualId);
    if (!active) return;

    active.status = 'interrupted';
    this.emit('ritual:interrupted', ritualId, reason);
  }

  // ===========================================================================
  // Support Activation
  // ===========================================================================

  private activateProtections(ritualId: string): void {
    const support = this.state.supports.get(ritualId);
    if (!support) return;

    for (const protection of support.protections) {
      if (protection.enabled) {
        this.emit('protection:activated', ritualId, protection);
      }
    }
  }

  private deactivateProtections(ritualId: string): void {
    // Deactivation logic would go here
  }

  private activateEnhancements(ritualId: string): void {
    const support = this.state.supports.get(ritualId);
    if (!support) return;

    // Enhancement activation logic
  }

  /**
   * Schedule preparation for upcoming ritual
   */
  public schedulePreparation(ritualId: string, startTime: Date): void {
    const ritual = this.state.rituals.get(ritualId);
    const support = this.state.supports.get(ritualId);

    if (!ritual || !support) return;

    for (const preparation of support.preparations) {
      if (!preparation.enabled) continue;

      const prepTime = new Date(startTime.getTime() - preparation.advanceTime * 60 * 1000);
      const delay = prepTime.getTime() - Date.now();

      if (delay > 0) {
        const timerId = setTimeout(() => {
          this.emit('preparation:triggered', ritualId, preparation);
        }, delay);

        this.preparationTimers.set(`${ritualId}_${preparation.id}`, timerId);
      }
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  public getRitual(id: string): Ritual | undefined {
    return this.state.rituals.get(id);
  }

  public getAllRituals(): Ritual[] {
    return Array.from(this.state.rituals.values());
  }

  public getRitualsByType(type: RitualType): Ritual[] {
    return Array.from(this.state.rituals.values()).filter(r => r.type === type);
  }

  public getRitualsByParticipant(userId: UserId): Ritual[] {
    return Array.from(this.state.rituals.values()).filter(
      r => r.participants.includes(userId)
    );
  }

  public getActiveRituals(): ActiveRitual[] {
    return [...this.state.activeRituals];
  }

  public getCandidates(): RitualCandidate[] {
    return [...this.state.candidates];
  }

  public getSupport(ritualId: string): RitualSupport | undefined {
    return this.state.supports.get(ritualId);
  }

  /**
   * Update ritual support configuration
   */
  public updateSupport(ritualId: string, updates: Partial<RitualSupport>): void {
    const support = this.state.supports.get(ritualId);
    if (!support) return;

    Object.assign(support, updates);
  }

  /**
   * Dismiss a ritual candidate
   */
  public dismissCandidate(index: number): void {
    if (index >= 0 && index < this.state.candidates.length) {
      this.state.candidates.splice(index, 1);
    }
  }

  /**
   * Delete a ritual
   */
  public deleteRitual(id: string): void {
    this.state.rituals.delete(id);
    this.state.supports.delete(id);

    // Clear any active
    const activeIndex = this.state.activeRituals.findIndex(a => a.ritualId === id);
    if (activeIndex !== -1) {
      this.state.activeRituals.splice(activeIndex, 1);
    }
  }

  public destroy(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }

    for (const timer of this.preparationTimers.values()) {
      clearTimeout(timer);
    }
    this.preparationTimers.clear();

    this.removeAllListeners();
  }
}

export default RitualRecognitionEngine;
