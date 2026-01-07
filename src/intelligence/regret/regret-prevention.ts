/**
 * AICO Smart Home - Regret Prevention Engine
 *
 * Prevents users from making decisions they'll regret.
 * Most systems help you do things. This one stops you
 * from doing things you shouldn't.
 */

import { EventEmitter } from 'eventemitter3';
import type { UserId, RoomId, DeviceId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

export interface RegretPrevention {
  // Financial regret prevention
  financial: FinancialRegretPrevention;

  // Health regret prevention
  health: HealthRegretPrevention;

  // Social regret prevention
  social: SocialRegretPrevention;

  // Security regret prevention
  security: SecurityRegretPrevention;

  // Maintenance regret prevention
  maintenance: MaintenanceRegretPrevention;
}

export interface FinancialRegretPrevention {
  // Energy cost projection
  energyProjection: {
    currentTrajectory: CostProjection;
    optimizedTrajectory: CostProjection;
    savingsOpportunity: number;
    unusualSpending: boolean;
    alerts: FinancialAlert[];
  };

  // Resource waste detection
  wasteDetection: {
    lightsOnInEmptyRooms: RoomId[];
    hvacInefficiency: HvacInefficiency[];
    waterLeakSuspicion: boolean;
    standbyPowerWaste: DeviceId[];
  };
}

export interface CostProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  currency: string;
  confidence: number;
}

export interface FinancialAlert {
  type: 'spike' | 'trend' | 'anomaly' | 'opportunity';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  savings?: number;
  action?: string;
}

export interface HvacInefficiency {
  room: RoomId;
  reason: 'window_open' | 'door_open' | 'conflicting_settings' | 'overcooling' | 'overheating';
  wastedEnergy: number; // kWh per hour
  suggestion: string;
}

export interface HealthRegretPrevention {
  // Sleep debt tracking
  sleepDebt: {
    accumulated: number;      // Hours
    trend: 'increasing' | 'stable' | 'recovering';
    impact: SleepImpact;
    recommendation: string;
  };

  // Circadian disruption
  circadianHealth: {
    disruptionLevel: number;  // 0-1
    lightExposure: LightExposureAnalysis;
    screenTime: ScreenTimeAnalysis;
    recommendation: string;
  };

  // Sedentary warnings
  sedentary: {
    hoursToday: number;
    daysSedentary: number;
    suggestion: string;
    optimalBreakTime?: Date;
  };

  // Air quality concerns
  airQuality: {
    co2Level: number;
    pm25Level: number;
    humidity: number;
    recommendation?: string;
  };
}

export interface SleepImpact {
  cognitiveReduction: number;    // Percentage
  moodImpact: number;            // -1 to 0
  recoveryTimeNeeded: number;    // Hours
}

export interface LightExposureAnalysis {
  morningLight: number;          // 0-1 (1 = optimal)
  eveningBlueLight: number;      // 0-1 (0 = optimal)
  recommendation: string;
}

export interface ScreenTimeAnalysis {
  todayTotal: number;            // Minutes
  eveningScreenTime: number;     // Minutes after 8 PM
  recommendation?: string;
}

export interface SocialRegretPrevention {
  // Isolation detection
  isolation: {
    daysWithoutSocialContact: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    concernLevel: 'none' | 'mild' | 'moderate' | 'concerning';
    suggestion?: string;
  };

  // Relationship maintenance
  relationships: RelationshipHealth[];

  // Privacy boundary protection
  privacyProtection: {
    guestDataExposure: boolean;
    sensitiveAutomationActive: boolean;
    recommendedAdjustments: string[];
  };
}

export interface RelationshipHealth {
  type: 'family' | 'friend' | 'professional';
  lastMeaningfulContact: Date;
  suggestedAction?: string;
}

export interface SecurityRegretPrevention {
  // Vulnerability windows
  vulnerabilities: SecurityVulnerability[];

  // Access anomalies
  accessAnomalies: AccessAnomaly[];

  // Forgotten actions
  forgottenActions: ForgottenAction[];
}

export interface SecurityVulnerability {
  type: 'door_unlocked' | 'window_open' | 'alarm_disabled' | 'camera_offline';
  location: RoomId | string;
  duration: number;            // Minutes
  riskLevel: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface AccessAnomaly {
  timestamp: Date;
  type: 'unusual_time' | 'unknown_device' | 'failed_attempts';
  details: string;
  requiresAttention: boolean;
}

export interface ForgottenAction {
  action: string;
  usualTime: string;
  missedFor: number;           // Minutes
  suggestion: string;
}

export interface MaintenanceRegretPrevention {
  // Neglected maintenance
  neglectedItems: MaintenanceItem[];

  // Predictive failures
  predictedFailures: PredictedFailure[];

  // Warranty expirations
  warrantyAlerts: WarrantyAlert[];
}

export interface MaintenanceItem {
  device: DeviceId;
  type: 'filter_change' | 'cleaning' | 'inspection' | 'calibration';
  lastPerformed?: Date;
  overdue: boolean;
  overdueBy?: number;          // Days
  risk: string;
}

export interface PredictedFailure {
  device: DeviceId;
  probability: number;
  timeframe: string;
  preventiveAction: string;
  estimatedCost: {
    preventive: number;
    reactive: number;
  };
}

export interface WarrantyAlert {
  device: DeviceId;
  expiresAt: Date;
  daysRemaining: number;
  suggestedAction?: string;
}

// ============================================================================
// Intervention Types
// ============================================================================

export interface GentleIntervention {
  id: string;
  trigger: RegretTrigger;
  timing: InterventionTiming;
  method: InterventionMethod;
  message: string;
  action?: InterventionAction;
  persistence: 'once' | 'periodic' | 'until_resolved';
  overridable: boolean;
  snoozeable: boolean;
}

export type RegretTrigger =
  | { type: 'energy_waste'; threshold: number }
  | { type: 'sleep_debt'; hours: number }
  | { type: 'security_gap'; duration: number }
  | { type: 'maintenance_overdue'; days: number }
  | { type: 'isolation'; days: number }
  | { type: 'health_concern'; severity: string };

export type InterventionTiming = 'immediate' | 'convenient' | 'optimal_moment';
export type InterventionMethod = 'ambient' | 'suggestion' | 'question' | 'action';

export interface InterventionAction {
  type: 'automate' | 'schedule' | 'remind' | 'suggest';
  payload: Record<string, unknown>;
}

type RegretEngineEvents = {
  interventionTriggered: [GentleIntervention];
  interventionAcknowledged: [string];
  interventionSnoozed: [string, number];
  regretConditionDetected: [string, Record<string, unknown>];
  regretConditionResolved: [string];
};

// ============================================================================
// Regret Prevention Engine
// ============================================================================

export class RegretPreventionEngine extends EventEmitter<RegretEngineEvents> {
  private state: RegretPrevention;
  private activeInterventions: Map<string, GentleIntervention> = new Map();
  private snoozedInterventions: Map<string, Date> = new Map();

  constructor() {
    super();
    this.state = this.initializeState();
  }

  private initializeState(): RegretPrevention {
    return {
      financial: {
        energyProjection: {
          currentTrajectory: { daily: 0, weekly: 0, monthly: 0, yearly: 0, currency: 'TRY', confidence: 0 },
          optimizedTrajectory: { daily: 0, weekly: 0, monthly: 0, yearly: 0, currency: 'TRY', confidence: 0 },
          savingsOpportunity: 0,
          unusualSpending: false,
          alerts: [],
        },
        wasteDetection: {
          lightsOnInEmptyRooms: [],
          hvacInefficiency: [],
          waterLeakSuspicion: false,
          standbyPowerWaste: [],
        },
      },
      health: {
        sleepDebt: {
          accumulated: 0,
          trend: 'stable',
          impact: { cognitiveReduction: 0, moodImpact: 0, recoveryTimeNeeded: 0 },
          recommendation: '',
        },
        circadianHealth: {
          disruptionLevel: 0,
          lightExposure: { morningLight: 0.5, eveningBlueLight: 0.5, recommendation: '' },
          screenTime: { todayTotal: 0, eveningScreenTime: 0 },
          recommendation: '',
        },
        sedentary: {
          hoursToday: 0,
          daysSedentary: 0,
          suggestion: '',
        },
        airQuality: {
          co2Level: 400,
          pm25Level: 10,
          humidity: 45,
        },
      },
      social: {
        isolation: {
          daysWithoutSocialContact: 0,
          trend: 'stable',
          concernLevel: 'none',
        },
        relationships: [],
        privacyProtection: {
          guestDataExposure: false,
          sensitiveAutomationActive: false,
          recommendedAdjustments: [],
        },
      },
      security: {
        vulnerabilities: [],
        accessAnomalies: [],
        forgottenActions: [],
      },
      maintenance: {
        neglectedItems: [],
        predictedFailures: [],
        warrantyAlerts: [],
      },
    };
  }

  // ============================================================================
  // Analysis Methods
  // ============================================================================

  /**
   * Analyze energy usage and detect waste
   */
  analyzeEnergyUsage(
    currentUsage: number,
    occupancy: Map<RoomId, boolean>,
    deviceStates: Map<DeviceId, boolean>
  ): void {
    // Find lights on in empty rooms
    const emptyRoomsWithLights: RoomId[] = [];
    for (const [roomId, occupied] of occupancy) {
      if (!occupied) {
        // Check if lights are on in this room
        // This would integrate with actual device states
        emptyRoomsWithLights.push(roomId);
      }
    }

    if (emptyRoomsWithLights.length > 0) {
      this.state.financial.wasteDetection.lightsOnInEmptyRooms = emptyRoomsWithLights;

      // Create intervention
      this.createIntervention({
        trigger: { type: 'energy_waste', threshold: 0 },
        timing: 'convenient',
        method: 'ambient',
        message: `${emptyRoomsWithLights.length} odada gereksiz ışık yanıyor`,
        action: {
          type: 'automate',
          payload: { turnOff: emptyRoomsWithLights },
        },
        persistence: 'until_resolved',
        overridable: true,
        snoozeable: true,
      });
    }
  }

  /**
   * Analyze sleep patterns and debt
   */
  analyzeSleepHealth(
    hoursSleptLastNight: number,
    sleepQuality: number,
    wakeTime: Date,
    currentTime: Date
  ): void {
    const optimalSleep = 8;
    const deficit = optimalSleep - hoursSleptLastNight;

    // Update sleep debt (accumulates over days)
    if (deficit > 0) {
      this.state.health.sleepDebt.accumulated += deficit * 0.5; // Partial accumulation
      this.state.health.sleepDebt.trend = 'increasing';
    } else {
      this.state.health.sleepDebt.accumulated = Math.max(
        0,
        this.state.health.sleepDebt.accumulated - 1
      );
      this.state.health.sleepDebt.trend =
        this.state.health.sleepDebt.accumulated > 0 ? 'recovering' : 'stable';
    }

    // Calculate impact
    const debt = this.state.health.sleepDebt.accumulated;
    this.state.health.sleepDebt.impact = {
      cognitiveReduction: Math.min(30, debt * 5),
      moodImpact: -Math.min(0.5, debt * 0.1),
      recoveryTimeNeeded: debt * 1.5,
    };

    // Generate recommendation
    if (debt > 4) {
      this.state.health.sleepDebt.recommendation =
        'Ciddi uyku borcu birikti. Bu akşam erken yatmayı düşünün.';

      this.createIntervention({
        trigger: { type: 'sleep_debt', hours: debt },
        timing: 'optimal_moment',
        method: 'suggestion',
        message: 'Uyku borcunuz yüksek. Performansınız etkilenebilir.',
        persistence: 'periodic',
        overridable: true,
        snoozeable: true,
      });
    } else if (debt > 2) {
      this.state.health.sleepDebt.recommendation =
        'Hafif uyku borcu var. Normal uyku düzeninize dönmeye çalışın.';
    }
  }

  /**
   * Check for security vulnerabilities
   */
  analyzeSecurityState(
    doorStates: Map<string, 'locked' | 'unlocked'>,
    windowStates: Map<string, 'open' | 'closed'>,
    alarmEnabled: boolean,
    occupancyMode: 'home' | 'away' | 'night'
  ): void {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check doors when away
    if (occupancyMode === 'away') {
      for (const [door, state] of doorStates) {
        if (state === 'unlocked') {
          vulnerabilities.push({
            type: 'door_unlocked',
            location: door as RoomId,
            duration: 0,
            riskLevel: 'high',
            suggestion: `${door} kapısı kilitli değil`,
          });
        }
      }
    }

    // Check windows
    for (const [window, state] of windowStates) {
      if (state === 'open' && occupancyMode === 'away') {
        vulnerabilities.push({
          type: 'window_open',
          location: window,
          duration: 0,
          riskLevel: 'medium',
          suggestion: `${window} penceresi açık`,
        });
      }
    }

    // Check alarm
    if (!alarmEnabled && occupancyMode === 'away') {
      vulnerabilities.push({
        type: 'alarm_disabled',
        location: 'system',
        duration: 0,
        riskLevel: 'high',
        suggestion: 'Alarm sistemi aktif değil',
      });
    }

    this.state.security.vulnerabilities = vulnerabilities;

    if (vulnerabilities.some((v) => v.riskLevel === 'high')) {
      this.createIntervention({
        trigger: { type: 'security_gap', duration: 0 },
        timing: 'immediate',
        method: 'question',
        message: 'Güvenlik açığı tespit edildi. Düzeltmemi ister misiniz?',
        action: {
          type: 'automate',
          payload: { secure: true },
        },
        persistence: 'until_resolved',
        overridable: false,
        snoozeable: false,
      });
    }
  }

  /**
   * Analyze social health
   */
  analyzeSocialHealth(
    socialInteractions: { date: Date; type: string }[],
    calendarEvents: { date: Date; social: boolean }[]
  ): void {
    const now = new Date();
    const recentInteractions = socialInteractions.filter(
      (i) => now.getTime() - i.date.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    const daysSinceLastSocial =
      recentInteractions.length > 0
        ? Math.floor(
            (now.getTime() - recentInteractions[0].date.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : 7;

    this.state.social.isolation = {
      daysWithoutSocialContact: daysSinceLastSocial,
      trend:
        daysSinceLastSocial > this.state.social.isolation.daysWithoutSocialContact
          ? 'increasing'
          : 'decreasing',
      concernLevel:
        daysSinceLastSocial > 5
          ? 'concerning'
          : daysSinceLastSocial > 3
          ? 'moderate'
          : daysSinceLastSocial > 1
          ? 'mild'
          : 'none',
    };

    if (this.state.social.isolation.concernLevel === 'concerning') {
      this.state.social.isolation.suggestion =
        'Bir süredir sosyal etkileşiminiz yok. Birini aramayı düşünür müsünüz?';

      this.createIntervention({
        trigger: { type: 'isolation', days: daysSinceLastSocial },
        timing: 'optimal_moment',
        method: 'suggestion',
        message: this.state.social.isolation.suggestion,
        persistence: 'periodic',
        overridable: true,
        snoozeable: true,
      });
    }
  }

  /**
   * Analyze maintenance needs
   */
  analyzeMaintenanceState(
    devices: { id: DeviceId; lastMaintenance?: Date; type: string }[],
    warranties: { id: DeviceId; expires: Date }[]
  ): void {
    const now = new Date();
    const neglectedItems: MaintenanceItem[] = [];
    const warrantyAlerts: WarrantyAlert[] = [];

    // Check maintenance schedules
    const maintenanceIntervals: Record<string, number> = {
      hvac_filter: 90,    // Days
      water_heater: 365,
      smoke_detector: 180,
      ventilation: 180,
    };

    for (const device of devices) {
      const interval = maintenanceIntervals[device.type];
      if (interval && device.lastMaintenance) {
        const daysSince = Math.floor(
          (now.getTime() - device.lastMaintenance.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSince > interval) {
          neglectedItems.push({
            device: device.id,
            type: 'filter_change',
            lastPerformed: device.lastMaintenance,
            overdue: true,
            overdueBy: daysSince - interval,
            risk: 'Performans düşüklüğü ve yüksek enerji tüketimi',
          });
        }
      }
    }

    // Check warranties
    for (const warranty of warranties) {
      const daysRemaining = Math.floor(
        (warranty.expires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysRemaining < 30 && daysRemaining > 0) {
        warrantyAlerts.push({
          device: warranty.id,
          expiresAt: warranty.expires,
          daysRemaining,
          suggestedAction:
            daysRemaining < 7
              ? 'Garanti süresi dolmak üzere. Kontrol ettirmeyi düşünün.'
              : 'Garanti bitimine az kaldı.',
        });
      }
    }

    this.state.maintenance.neglectedItems = neglectedItems;
    this.state.maintenance.warrantyAlerts = warrantyAlerts;

    if (neglectedItems.length > 0) {
      this.createIntervention({
        trigger: { type: 'maintenance_overdue', days: neglectedItems[0].overdueBy || 0 },
        timing: 'convenient',
        method: 'suggestion',
        message: `${neglectedItems.length} bakım işlemi gecikmiş durumda`,
        persistence: 'periodic',
        overridable: true,
        snoozeable: true,
      });
    }
  }

  // ============================================================================
  // Intervention Management
  // ============================================================================

  private createIntervention(
    partial: Omit<GentleIntervention, 'id'>
  ): GentleIntervention {
    const intervention: GentleIntervention = {
      ...partial,
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Check if snoozed
    if (this.snoozedInterventions.has(intervention.id)) {
      const snoozeUntil = this.snoozedInterventions.get(intervention.id)!;
      if (new Date() < snoozeUntil) {
        return intervention; // Still snoozed
      }
      this.snoozedInterventions.delete(intervention.id);
    }

    this.activeInterventions.set(intervention.id, intervention);
    this.emit('interventionTriggered', intervention);
    this.emit('regretConditionDetected', intervention.trigger.type, intervention.trigger);

    return intervention;
  }

  acknowledgeIntervention(id: string): void {
    const intervention = this.activeInterventions.get(id);
    if (intervention) {
      this.activeInterventions.delete(id);
      this.emit('interventionAcknowledged', id);
      this.emit('regretConditionResolved', intervention.trigger.type);
    }
  }

  snoozeIntervention(id: string, minutes: number): void {
    const intervention = this.activeInterventions.get(id);
    if (intervention && intervention.snoozeable) {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
      this.snoozedInterventions.set(id, snoozeUntil);
      this.activeInterventions.delete(id);
      this.emit('interventionSnoozed', id, minutes);
    }
  }

  // ============================================================================
  // The 2 AM Intervention
  // ============================================================================

  /**
   * Special intervention for late-night work sessions
   */
  checkLateNightWork(
    userId: UserId,
    currentTime: Date,
    sleepDebt: number,
    tomorrowHasImportantEvent: boolean
  ): GentleIntervention | null {
    const hour = currentTime.getHours();

    // Only intervene between midnight and 4 AM
    if (hour < 0 || hour > 4) return null;

    // Check conditions
    if (sleepDebt < 2 && !tomorrowHasImportantEvent) return null;

    // Create escalating intervention
    const severity = hour >= 2 ? 'high' : 'medium';
    const messages = {
      medium: 'Yarınki performansınız uyku kalitesine bağlı.',
      high: 'Düşünceleriniz değerli. Sabah 6\'da da burada olacaklar.',
    };

    return this.createIntervention({
      trigger: { type: 'sleep_debt', hours: sleepDebt },
      timing: 'immediate',
      method: severity === 'high' ? 'ambient' : 'suggestion',
      message: messages[severity],
      action: {
        type: 'automate',
        payload: {
          gradualLightWarm: true,
          temperatureDrop: 1,
          prepareBedroomPath: true,
        },
      },
      persistence: 'until_resolved',
      overridable: true,
      snoozeable: true,
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getState(): RegretPrevention {
    return this.state;
  }

  getActiveInterventions(): GentleIntervention[] {
    return Array.from(this.activeInterventions.values());
  }

  getFinancialSummary(): FinancialRegretPrevention {
    return this.state.financial;
  }

  getHealthSummary(): HealthRegretPrevention {
    return this.state.health;
  }

  getSecuritySummary(): SecurityRegretPrevention {
    return this.state.security;
  }
}

export default RegretPreventionEngine;
