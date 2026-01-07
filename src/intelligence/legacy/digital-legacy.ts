/**
 * AICO Smart Home - Digital Legacy System
 *
 * What happens when the system outlives its user?
 * This module handles inheritance, memory preservation,
 * and graceful transitions across generations.
 */

import { EventEmitter } from 'eventemitter3';
import type { UserId, ResidenceId, RoomId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

export interface DigitalLegacy {
  // Succession planning
  successionPlan: SuccessionPlan;

  // Memory preservation
  homeMemory: HomeMemory;

  // Absence protocols
  absenceProtocols: AbsenceProtocol[];

  // Data lifecycle
  dataLifecycle: DataLifecyclePolicy;
}

export interface SuccessionPlan {
  primaryHeir: UserId | null;
  secondaryHeirs: UserId[];
  transitionPeriod: number;           // Days for gradual transition
  preservedPatterns: PatternPreservationType[];
  fadingPatterns: PatternPreservationType[];
  immediateTransferItems: string[];
  delayedTransferItems: string[];
  requiresConfirmation: boolean;
  lastUpdated: Date;
}

export type PatternPreservationType =
  | 'daily_routines'
  | 'comfort_preferences'
  | 'security_settings'
  | 'automation_rules'
  | 'voice_recordings'
  | 'usage_patterns'
  | 'relationship_data'
  | 'health_patterns';

export interface HomeMemory {
  // Significant moments (opt-in, curated)
  significantMoments: SignificantMoment[];

  // Pattern archive (anonymized, compressed)
  patternArchive: PatternArchive;

  // Voice preservation (explicit consent required)
  voiceArchive?: VoiceArchive;

  // Photo/video memories linked to home events
  mediaMemories: MediaMemory[];

  // The house's "personality" - accumulated micro-decisions
  housePersonality: HousePersonality;
}

export interface SignificantMoment {
  id: string;
  timestamp: Date;
  type: MomentType;
  description: string;
  location?: RoomId;
  participants: UserId[];
  emotionalSignificance: number;      // 0-1
  systemDetected: boolean;            // vs manually marked
  preserved: boolean;
}

export type MomentType =
  | 'celebration'
  | 'gathering'
  | 'milestone'
  | 'daily_ritual'
  | 'quiet_moment'
  | 'family_event'
  | 'achievement'
  | 'memorial';

export interface PatternArchive {
  compressed: boolean;
  dateRange: { start: Date; end: Date };
  patterns: CompressedPattern[];
  totalDataPoints: number;
  compressionRatio: number;
}

export interface CompressedPattern {
  type: string;
  summary: string;
  frequency: string;
  lastOccurrence: Date;
  significance: number;
}

export interface VoiceArchive {
  consentGiven: boolean;
  consentDate: Date;
  samples: VoiceSample[];
  purposeDescription: string;
  deletionScheduled?: Date;
}

export interface VoiceSample {
  id: string;
  timestamp: Date;
  duration: number;                   // Seconds
  context: string;
  preservationReason: string;
}

export interface MediaMemory {
  id: string;
  timestamp: Date;
  type: 'photo' | 'video';
  linkedMoment?: string;              // SignificantMoment id
  location?: RoomId;
  participants: UserId[];
  preservationStatus: 'active' | 'archived' | 'scheduled_deletion';
}

export interface HousePersonality {
  // Accumulated preferences
  preferenceWeights: Map<string, number>;

  // Learned behaviors
  learnedBehaviors: LearnedBehavior[];

  // Response patterns
  responseStyle: {
    proactivity: number;              // 0-1
    verbosity: number;                // 0-1
    formality: number;                // 0-1
    warmth: number;                   // 0-1
  };

  // Evolution history
  evolutionMilestones: PersonalityMilestone[];
}

export interface LearnedBehavior {
  trigger: string;
  response: string;
  learnedFrom: UserId;
  learnedDate: Date;
  reinforcements: number;
}

export interface PersonalityMilestone {
  date: Date;
  change: string;
  cause: string;
}

// ============================================================================
// Absence Protocols
// ============================================================================

export interface AbsenceProtocol {
  type: AbsenceType;
  userId: UserId;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  status: 'active' | 'concluded' | 'transitioned';
  automationLevel: AutomationLevel;
  notificationRecipients: NotificationRecipient[];
  emergencyContacts: EmergencyContact[];
  specialInstructions?: string;
}

export type AbsenceType =
  | 'travel'                          // Temporary, expected return
  | 'hospitalization'                 // Medical absence
  | 'separation'                      // Relationship change
  | 'relocation'                      // Moving out
  | 'death';                          // Permanent absence

export type AutomationLevel =
  | 'full'                            // System operates normally
  | 'reduced'                         // Essential automation only
  | 'minimal'                         // Safety systems only
  | 'standby'                         // Waiting for return
  | 'transition';                     // Preparing for new owner

export interface NotificationRecipient {
  userId: UserId;
  relationship: string;
  notifyOn: NotificationTrigger[];
}

export type NotificationTrigger =
  | 'emergency'
  | 'security_alert'
  | 'system_failure'
  | 'maintenance_needed'
  | 'periodic_status';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  priority: number;
}

// ============================================================================
// Mortality Protocol
// ============================================================================

export interface MortalityProtocol {
  userId: UserId;
  confirmed: boolean;
  confirmedDate?: Date;
  confirmedBy?: UserId;

  phases: {
    immediate: ImmediatePhase;
    transition: TransitionPhase;
    succession: SuccessionPhase;
  };
}

export interface ImmediatePhase {
  status: 'pending' | 'active' | 'complete';
  actions: {
    secureAllSystems: boolean;
    notifyDesignatedContacts: boolean;
    preserveStateSnapshot: boolean;
    suspendNonEssentialAutomation: boolean;
    maintainSafetySystem: boolean;
  };
  completedAt?: Date;
}

export interface TransitionPhase {
  status: 'pending' | 'active' | 'complete';
  startDate?: Date;
  duration: number;                   // Days
  actions: {
    maintainBasicAutomation: boolean;
    gradualPatternFade: GradualFadeConfig;
    memoryConsolidation: boolean;
    prepareHandover: boolean;
  };
}

export interface GradualFadeConfig {
  enabled: boolean;
  fadeStartDate?: Date;
  fadeDuration: number;               // Days
  preserveEchoes: boolean;            // Keep subtle reminders
  echoTypes: string[];
}

export interface SuccessionPhase {
  status: 'pending' | 'active' | 'complete';
  heir: UserId | null;
  actions: {
    transferOwnership: boolean;
    relearningPeriod: number;         // Days for new patterns
    legacyPreservation: LegacyPreservationType;
    deletePersonalData: boolean;
    archiveFamilyData: boolean;
  };
}

export type LegacyPreservationType =
  | 'full'                            // Keep everything
  | 'memories_only'                   // Keep significant moments
  | 'patterns_only'                   // Keep behavioral patterns
  | 'minimal'                         // Keep essential settings
  | 'none';                           // Complete reset

// ============================================================================
// Data Lifecycle
// ============================================================================

export interface DataLifecyclePolicy {
  retention: DataRetentionPolicy;
  deletion: DataDeletionPolicy;
  export: DataExportPolicy;
  inheritance: DataInheritancePolicy;
}

export interface DataRetentionPolicy {
  personalData: number;               // Days, 0 = don't store
  behavioralData: number;
  voiceData: number;
  mediaData: number;
  automaticPurge: boolean;
}

export interface DataDeletionPolicy {
  allowUserDeletion: boolean;
  deletionDelay: number;              // Days before permanent deletion
  exemptFromDeletion: string[];       // Data types that can't be deleted
}

export interface DataExportPolicy {
  allowExport: boolean;
  exportFormats: string[];
  includesPersonalData: boolean;
  requiresVerification: boolean;
}

export interface DataInheritancePolicy {
  automaticTransfer: boolean;
  requiresHeirVerification: boolean;
  excludedDataTypes: string[];
  transformationRules: TransformationRule[];
}

export interface TransformationRule {
  dataType: string;
  action: 'keep' | 'anonymize' | 'delete' | 'archive';
  condition?: string;
}

// ============================================================================
// Digital Legacy Manager
// ============================================================================

type LegacyManagerEvents = {
  absenceProtocolActivated: [AbsenceProtocol];
  mortalityProtocolInitiated: [UserId];
  transitionPhaseStarted: [UserId];
  successionComplete: [UserId, UserId]; // deceased, heir
  memoryPreserved: [SignificantMoment];
  patternFading: [string, number];      // pattern, fadePercent
  legacyArchiveCreated: [UserId];
};

export class DigitalLegacyManager extends EventEmitter<LegacyManagerEvents> {
  private legacy: DigitalLegacy;
  private activeProtocols: Map<UserId, AbsenceProtocol> = new Map();
  private mortalityProtocols: Map<UserId, MortalityProtocol> = new Map();

  constructor() {
    super();
    this.legacy = this.initializeLegacy();
  }

  private initializeLegacy(): DigitalLegacy {
    return {
      successionPlan: {
        primaryHeir: null,
        secondaryHeirs: [],
        transitionPeriod: 90,
        preservedPatterns: ['daily_routines', 'comfort_preferences', 'security_settings'],
        fadingPatterns: ['voice_recordings', 'usage_patterns'],
        immediateTransferItems: ['security_settings', 'automation_rules'],
        delayedTransferItems: ['personal_preferences', 'media_memories'],
        requiresConfirmation: true,
        lastUpdated: new Date(),
      },
      homeMemory: {
        significantMoments: [],
        patternArchive: {
          compressed: false,
          dateRange: { start: new Date(), end: new Date() },
          patterns: [],
          totalDataPoints: 0,
          compressionRatio: 1,
        },
        mediaMemories: [],
        housePersonality: {
          preferenceWeights: new Map(),
          learnedBehaviors: [],
          responseStyle: {
            proactivity: 0.5,
            verbosity: 0.3,
            formality: 0.4,
            warmth: 0.6,
          },
          evolutionMilestones: [],
        },
      },
      absenceProtocols: [],
      dataLifecycle: {
        retention: {
          personalData: 365,
          behavioralData: 730,
          voiceData: 0,
          mediaData: 0,
          automaticPurge: true,
        },
        deletion: {
          allowUserDeletion: true,
          deletionDelay: 30,
          exemptFromDeletion: ['security_logs'],
        },
        export: {
          allowExport: true,
          exportFormats: ['json', 'csv'],
          includesPersonalData: true,
          requiresVerification: true,
        },
        inheritance: {
          automaticTransfer: false,
          requiresHeirVerification: true,
          excludedDataTypes: ['voice_recordings', 'biometric_data'],
          transformationRules: [],
        },
      },
    };
  }

  // ============================================================================
  // Succession Planning
  // ============================================================================

  /**
   * Set primary heir for the residence
   */
  setPrimaryHeir(heir: UserId): void {
    this.legacy.successionPlan.primaryHeir = heir;
    this.legacy.successionPlan.lastUpdated = new Date();
  }

  /**
   * Configure what patterns to preserve vs fade
   */
  configurePatternPreservation(
    preserve: PatternPreservationType[],
    fade: PatternPreservationType[]
  ): void {
    this.legacy.successionPlan.preservedPatterns = preserve;
    this.legacy.successionPlan.fadingPatterns = fade;
    this.legacy.successionPlan.lastUpdated = new Date();
  }

  // ============================================================================
  // Absence Protocols
  // ============================================================================

  /**
   * Activate an absence protocol
   */
  activateAbsenceProtocol(protocol: Omit<AbsenceProtocol, 'status'>): void {
    const fullProtocol: AbsenceProtocol = {
      ...protocol,
      status: 'active',
    };

    this.activeProtocols.set(protocol.userId, fullProtocol);
    this.legacy.absenceProtocols.push(fullProtocol);
    this.emit('absenceProtocolActivated', fullProtocol);

    // Configure automation based on absence type
    this.configureAutomationForAbsence(fullProtocol);
  }

  private configureAutomationForAbsence(protocol: AbsenceProtocol): void {
    switch (protocol.type) {
      case 'travel':
        // Maintain security, reduce comfort automation
        break;
      case 'hospitalization':
        // Prepare for potential return, notify caregivers
        break;
      case 'death':
        // Initiate mortality protocol
        this.initiateMortalityProtocol(protocol.userId);
        break;
    }
  }

  /**
   * End an absence protocol
   */
  concludeAbsenceProtocol(userId: UserId): void {
    const protocol = this.activeProtocols.get(userId);
    if (protocol) {
      protocol.status = 'concluded';
      protocol.actualEndDate = new Date();
      this.activeProtocols.delete(userId);
    }
  }

  // ============================================================================
  // Mortality Protocol
  // ============================================================================

  /**
   * Initiate mortality protocol (with confirmation requirement)
   */
  initiateMortalityProtocol(userId: UserId): void {
    const protocol: MortalityProtocol = {
      userId,
      confirmed: false,
      phases: {
        immediate: {
          status: 'pending',
          actions: {
            secureAllSystems: false,
            notifyDesignatedContacts: false,
            preserveStateSnapshot: false,
            suspendNonEssentialAutomation: false,
            maintainSafetySystem: false,
          },
        },
        transition: {
          status: 'pending',
          duration: this.legacy.successionPlan.transitionPeriod,
          actions: {
            maintainBasicAutomation: false,
            gradualPatternFade: {
              enabled: true,
              fadeDuration: 90,
              preserveEchoes: true,
              echoTypes: ['morning_light', 'evening_routine'],
            },
            memoryConsolidation: false,
            prepareHandover: false,
          },
        },
        succession: {
          status: 'pending',
          heir: this.legacy.successionPlan.primaryHeir,
          actions: {
            transferOwnership: false,
            relearningPeriod: 30,
            legacyPreservation: 'memories_only',
            deletePersonalData: false,
            archiveFamilyData: true,
          },
        },
      },
    };

    this.mortalityProtocols.set(userId, protocol);
    this.emit('mortalityProtocolInitiated', userId);
  }

  /**
   * Confirm mortality (required before proceeding)
   */
  confirmMortality(userId: UserId, confirmedBy: UserId): void {
    const protocol = this.mortalityProtocols.get(userId);
    if (protocol) {
      protocol.confirmed = true;
      protocol.confirmedDate = new Date();
      protocol.confirmedBy = confirmedBy;

      // Execute immediate phase
      this.executeImmediatePhase(protocol);
    }
  }

  private executeImmediatePhase(protocol: MortalityProtocol): void {
    protocol.phases.immediate.status = 'active';

    // Secure all systems
    protocol.phases.immediate.actions.secureAllSystems = true;

    // Preserve state snapshot
    this.preserveStateSnapshot(protocol.userId);
    protocol.phases.immediate.actions.preserveStateSnapshot = true;

    // Notify designated contacts
    this.notifyDesignatedContacts(protocol.userId);
    protocol.phases.immediate.actions.notifyDesignatedContacts = true;

    // Suspend non-essential automation
    protocol.phases.immediate.actions.suspendNonEssentialAutomation = true;

    // Maintain safety systems
    protocol.phases.immediate.actions.maintainSafetySystem = true;

    protocol.phases.immediate.status = 'complete';
    protocol.phases.immediate.completedAt = new Date();

    // Schedule transition phase
    setTimeout(() => {
      this.beginTransitionPhase(protocol);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days after immediate phase
  }

  private beginTransitionPhase(protocol: MortalityProtocol): void {
    protocol.phases.transition.status = 'active';
    protocol.phases.transition.startDate = new Date();

    this.emit('transitionPhaseStarted', protocol.userId);

    // Start gradual pattern fading
    if (protocol.phases.transition.actions.gradualPatternFade.enabled) {
      this.beginPatternFading(protocol);
    }

    // Consolidate memories
    this.consolidateMemories(protocol.userId);
    protocol.phases.transition.actions.memoryConsolidation = true;
  }

  private beginPatternFading(protocol: MortalityProtocol): void {
    const fadeConfig = protocol.phases.transition.actions.gradualPatternFade;
    fadeConfig.fadeStartDate = new Date();

    const fadeDays = fadeConfig.fadeDuration;
    let daysPassed = 0;

    const fadeInterval = setInterval(() => {
      daysPassed++;
      const fadePercent = (daysPassed / fadeDays) * 100;

      // Emit fading progress for each pattern type
      for (const patternType of this.legacy.successionPlan.fadingPatterns) {
        this.emit('patternFading', patternType, fadePercent);
      }

      if (daysPassed >= fadeDays) {
        clearInterval(fadeInterval);
        protocol.phases.transition.status = 'complete';
        this.beginSuccessionPhase(protocol);
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private beginSuccessionPhase(protocol: MortalityProtocol): void {
    protocol.phases.succession.status = 'active';

    const heir = protocol.phases.succession.heir;
    if (heir) {
      // Transfer ownership
      this.transferOwnership(protocol.userId, heir);

      protocol.phases.succession.actions.transferOwnership = true;
      protocol.phases.succession.status = 'complete';

      this.emit('successionComplete', protocol.userId, heir);
    }
  }

  // ============================================================================
  // Memory Preservation
  // ============================================================================

  /**
   * Mark a moment as significant
   */
  preserveMoment(moment: Omit<SignificantMoment, 'id' | 'preserved'>): void {
    const fullMoment: SignificantMoment = {
      ...moment,
      id: `moment_${Date.now()}`,
      preserved: true,
    };

    this.legacy.homeMemory.significantMoments.push(fullMoment);
    this.emit('memoryPreserved', fullMoment);
  }

  /**
   * Auto-detect significant moments
   */
  detectSignificantMoment(
    eventType: string,
    participants: UserId[],
    location: RoomId,
    indicators: { duration: number; energy: number; unusualness: number }
  ): boolean {
    // Detect if this is a significant moment worth preserving
    const significanceScore =
      indicators.duration * 0.3 +
      indicators.energy * 0.3 +
      indicators.unusualness * 0.4;

    if (significanceScore > 0.7) {
      this.preserveMoment({
        timestamp: new Date(),
        type: this.inferMomentType(eventType),
        description: `Auto-detected: ${eventType}`,
        location,
        participants,
        emotionalSignificance: significanceScore,
        systemDetected: true,
      });
      return true;
    }

    return false;
  }

  private inferMomentType(eventType: string): MomentType {
    const mapping: Record<string, MomentType> = {
      party: 'celebration',
      dinner: 'gathering',
      birthday: 'milestone',
      morning_routine: 'daily_ritual',
      quiet_evening: 'quiet_moment',
    };
    return mapping[eventType] || 'family_event';
  }

  private preserveStateSnapshot(userId: UserId): void {
    // Create a snapshot of the current system state for archival
    console.log(`Preserving state snapshot for user ${userId}`);
  }

  private notifyDesignatedContacts(userId: UserId): void {
    // Notify designated contacts about the situation
    console.log(`Notifying designated contacts for user ${userId}`);
  }

  private consolidateMemories(userId: UserId): void {
    // Create a consolidated archive of memories
    this.emit('legacyArchiveCreated', userId);
  }

  private transferOwnership(fromUser: UserId, toUser: UserId): void {
    // Transfer system ownership
    console.log(`Transferring ownership from ${fromUser} to ${toUser}`);
  }

  // ============================================================================
  // The Grieving House
  // ============================================================================

  /**
   * When a long-term occupant is no longer present,
   * the house gradually "forgets" while preserving echoes.
   */
  async beginGrievingProcess(userId: UserId): Promise<void> {
    // The house doesn't immediately delete patterns
    // It gradually fades presence over weeks/months

    // Preserve "echoes" - subtle reminders that remain
    // e.g., kitchen light still warms at their coffee time
    // but the coffee maker doesn't auto-start

    // Eventually asks remaining occupants:
    // "Shall I remember, or let go?"
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getLegacy(): DigitalLegacy {
    return this.legacy;
  }

  getSuccessionPlan(): SuccessionPlan {
    return this.legacy.successionPlan;
  }

  getSignificantMoments(): SignificantMoment[] {
    return this.legacy.homeMemory.significantMoments;
  }

  getActiveAbsenceProtocols(): AbsenceProtocol[] {
    return Array.from(this.activeProtocols.values());
  }
}

export default DigitalLegacyManager;
