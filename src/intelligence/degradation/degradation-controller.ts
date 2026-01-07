/**
 * AICO Smart Home - Graceful Degradation Controller
 *
 * "A house that fails like a sunset, not a crash."
 *
 * When systems falter, we don't alarm - we adapt.
 * Each degradation phase has its own elegance.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  DegradationState,
  CapabilityTier,
  CapabilityPyramid,
  CapabilitySet,
  Capability,
  SystemConstraint,
  ConstraintType,
  ConstraintSeverity,
  ResourceBudget,
  ResourceType,
  ResourceForecast,
  PowerMode,
  RecoveryPlan,
  RecoveryPhase,
  SunsetDegradation,
  SunsetPhase,
  AmbientDegradationFeedback,
  OfflineProfile,
  ManualOverride,
  FallbackBehavior,
  CommunicationChannel,
} from './types';

interface DegradationEvents {
  'constraint:added': (constraint: SystemConstraint) => void;
  'constraint:removed': (constraintType: ConstraintType) => void;
  'tier:changed': (from: CapabilityTier, to: CapabilityTier) => void;
  'capability:degraded': (capabilityId: string, level: number) => void;
  'capability:restored': (capabilityId: string) => void;
  'sunset:phase-changed': (phase: SunsetPhase) => void;
  'recovery:started': (plan: RecoveryPlan) => void;
  'recovery:completed': (constraintType: ConstraintType) => void;
  'power:mode-changed': (mode: PowerMode) => void;
  'offline:entered': () => void;
  'offline:exited': () => void;
}

// Tier hierarchy from lowest to highest
const TIER_ORDER: CapabilityTier[] = [
  'survival',
  'comfort',
  'convenience',
  'intelligence',
  'luxury',
];

export class GracefulDegradationController extends EventEmitter<DegradationEvents> {
  private state: DegradationState;
  private pyramid: CapabilityPyramid;
  private sunsetState: SunsetDegradation | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private recoveryInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.pyramid = this.initializeCapabilityPyramid();
    this.state = this.initializeState();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initializeState(): DegradationState {
    return {
      currentTier: 'luxury',
      activeConstraints: [],
      degradedCapabilities: new Map(),
      disabledCapabilities: [],
      resourceBudget: this.initializeResourceBudget(),
      powerMode: 'normal',
      offlineProfile: null,
      lastCloudSync: new Date(),
      pendingSyncItems: 0,
      activeRecoveryPlans: [],
      manualOverrides: [],
      userNotified: false,
      lastNotificationAt: new Date(),
      acknowledgedConstraints: [],
    };
  }

  private initializeResourceBudget(): ResourceBudget {
    return {
      available: new Map([
        ['power', 5000],          // 5kW available
        ['bandwidth', 100000],   // 100 Mbps
        ['processing', 100],     // 100% CPU available
        ['memory', 4096],        // 4GB RAM
        ['storage', 256000],     // 256GB
        ['cloud_api', 1000],     // 1000 calls/min
      ]),
      allocated: new Map(),
      reserved: new Map([
        ['power', 500],          // 500W reserved for essentials
        ['processing', 10],      // 10% reserved
        ['memory', 512],         // 512MB reserved
      ]),
      forecast: {
        powerDuration: Infinity,
        batteryLevel: 100,
        solarGeneration: 0,
        gridStatus: 'available',
        networkQuality: 100,
      },
    };
  }

  private initializeCapabilityPyramid(): CapabilityPyramid {
    const tiers = new Map<CapabilityTier, CapabilitySet>();

    // Tier 0: Survival - Cannot be disabled
    tiers.set('survival', {
      tier: 'survival',
      name: 'Hayatta Kalma',
      description: 'Temel güvenlik ve yaşam desteği',
      capabilities: [
        this.createCapability('safety_monitoring', 'Güvenlik İzleme', 'safety', 'survival', true),
        this.createCapability('emergency_lighting', 'Acil Aydınlatma', 'lighting', 'survival', true),
        this.createCapability('smoke_detection', 'Duman Algılama', 'safety', 'survival', true),
        this.createCapability('flood_detection', 'Su Baskını Algılama', 'safety', 'survival', true),
        this.createCapability('basic_climate', 'Temel İklim Kontrolü', 'climate', 'survival', true),
        this.createCapability('emergency_communication', 'Acil İletişim', 'communication', 'survival', true),
      ],
      requiredResources: [
        { resource: 'power', minimum: 200, optimal: 500, unit: 'W' },
      ],
      fallbackBehavior: { type: 'manual_override', parameters: {}, notifyUser: true, logReason: true },
    });

    // Tier 1: Comfort
    tiers.set('comfort', {
      tier: 'comfort',
      name: 'Konfor',
      description: 'Tam iklim kontrolü ve aydınlatma',
      capabilities: [
        this.createCapability('full_climate', 'Tam İklim Kontrolü', 'climate', 'comfort', false),
        this.createCapability('all_lighting', 'Tüm Aydınlatma', 'lighting', 'comfort', false),
        this.createCapability('basic_automation', 'Temel Otomasyon', 'automation', 'comfort', false),
        this.createCapability('security_cameras', 'Güvenlik Kameraları', 'security', 'comfort', false),
        this.createCapability('intercom', 'İnterkom', 'communication', 'comfort', false),
      ],
      requiredResources: [
        { resource: 'power', minimum: 1000, optimal: 2000, unit: 'W' },
        { resource: 'bandwidth', minimum: 5000, optimal: 20000, unit: 'Kbps' },
      ],
      fallbackBehavior: { type: 'reduce_frequency', parameters: { factor: 0.5 }, notifyUser: true, logReason: true },
    });

    // Tier 2: Convenience
    tiers.set('convenience', {
      tier: 'convenience',
      name: 'Kolaylık',
      description: 'Sesli kontrol, sahneler, zamanlama',
      capabilities: [
        this.createCapability('voice_control', 'Sesli Kontrol', 'automation', 'convenience', false),
        this.createCapability('scenes', 'Sahne Yönetimi', 'automation', 'convenience', false),
        this.createCapability('scheduling', 'Zamanlama', 'automation', 'convenience', false),
        this.createCapability('remote_access', 'Uzaktan Erişim', 'communication', 'convenience', false),
        this.createCapability('media_control', 'Medya Kontrolü', 'entertainment', 'convenience', false),
      ],
      requiredResources: [
        { resource: 'power', minimum: 1500, optimal: 3000, unit: 'W' },
        { resource: 'bandwidth', minimum: 20000, optimal: 50000, unit: 'Kbps' },
        { resource: 'cloud_api', minimum: 100, optimal: 500, unit: 'calls/min' },
      ],
      fallbackBehavior: { type: 'local_only', parameters: {}, notifyUser: false, logReason: true },
    });

    // Tier 3: Intelligence
    tiers.set('intelligence', {
      tier: 'intelligence',
      name: 'Zeka',
      description: 'Tahminler, ambient sinyaller, duygusal çıkarım',
      capabilities: [
        this.createCapability('pattern_recognition', 'Örüntü Tanıma', 'intelligence', 'intelligence', false),
        this.createCapability('predictions', 'Tahminler', 'intelligence', 'intelligence', false),
        this.createCapability('ambient_signals', 'Ambient Sinyaller', 'intelligence', 'intelligence', false),
        this.createCapability('emotional_inference', 'Duygusal Çıkarım', 'intelligence', 'intelligence', false),
        this.createCapability('energy_optimization', 'Enerji Optimizasyonu', 'intelligence', 'intelligence', false),
      ],
      requiredResources: [
        { resource: 'power', minimum: 2000, optimal: 3500, unit: 'W' },
        { resource: 'processing', minimum: 40, optimal: 70, unit: '%' },
        { resource: 'memory', minimum: 2048, optimal: 3072, unit: 'MB' },
      ],
      fallbackBehavior: { type: 'cached_data', parameters: { maxAge: 3600 }, notifyUser: false, logReason: true },
    });

    // Tier 4: Luxury
    tiers.set('luxury', {
      tier: 'luxury',
      name: 'Lüks',
      description: 'Tam AI, proaktif öneriler, dijital ikiz',
      capabilities: [
        this.createCapability('digital_twin', 'Dijital İkiz', 'intelligence', 'luxury', false),
        this.createCapability('proactive_suggestions', 'Proaktif Öneriler', 'intelligence', 'luxury', false),
        this.createCapability('full_ai', 'Tam Yapay Zeka', 'intelligence', 'luxury', false),
        this.createCapability('regret_prevention', 'Pişmanlık Önleme', 'intelligence', 'luxury', false),
        this.createCapability('ritual_recognition', 'Ritüel Tanıma', 'intelligence', 'luxury', false),
      ],
      requiredResources: [
        { resource: 'power', minimum: 3000, optimal: 5000, unit: 'W' },
        { resource: 'processing', minimum: 60, optimal: 90, unit: '%' },
        { resource: 'memory', minimum: 3072, optimal: 4096, unit: 'MB' },
        { resource: 'cloud_api', minimum: 500, optimal: 1000, unit: 'calls/min' },
      ],
      fallbackBehavior: { type: 'simplified_logic', parameters: {}, notifyUser: false, logReason: true },
    });

    return {
      tiers,
      currentTier: 'luxury',
      targetTier: 'luxury',
      constraints: [],
    };
  }

  private createCapability(
    id: string,
    name: string,
    category: Capability['category'],
    tier: CapabilityTier,
    essential: boolean
  ): Capability {
    return {
      id,
      name,
      category,
      tier,
      essential,
      dependencies: [],
      resourceCost: { power: 50, bandwidth: 100, processing: 5, memory: 64, cloudCalls: 10 },
      degradationPath: [
        { level: 0, description: 'Tam kapasite', resourceSavings: {}, userImpact: { severity: 'none', description: '' } },
        { level: 1, description: 'Azaltılmış sıklık', resourceSavings: { power: 20, processing: 20 }, userImpact: { severity: 'minimal', description: 'Daha yavaş güncellemeler' } },
        { level: 2, description: 'Yalnızca yerel', resourceSavings: { bandwidth: 100, cloudCalls: 10 }, userImpact: { severity: 'noticeable', description: 'Bulut özellikleri kapalı' } },
        { level: 3, description: 'Önbellek modu', resourceSavings: { power: 40, processing: 40 }, userImpact: { severity: 'significant', description: 'Yalnızca önbellek verisi' } },
      ],
    };
  }

  // ===========================================================================
  // Constraint Management
  // ===========================================================================

  /**
   * Report a system constraint
   */
  public reportConstraint(
    type: ConstraintType,
    severity: ConstraintSeverity,
    source: string,
    message: string,
    estimatedDuration?: number
  ): void {
    // Check if constraint already exists
    const existing = this.state.activeConstraints.find(c => c.type === type);
    if (existing) {
      existing.severity = severity;
      existing.message = message;
      existing.estimatedDuration = estimatedDuration;
      return;
    }

    const constraint: SystemConstraint = {
      type,
      severity,
      source,
      message,
      startedAt: new Date(),
      estimatedDuration,
      affectedCapabilities: this.getAffectedCapabilities(type),
    };

    this.state.activeConstraints.push(constraint);
    this.emit('constraint:added', constraint);

    // Begin sunset degradation
    this.beginSunsetDegradation(constraint);

    // Reevaluate current tier
    this.evaluateAndAdjustTier();

    // Start recovery planning
    this.planRecovery(constraint);
  }

  /**
   * Report that a constraint has been resolved
   */
  public resolveConstraint(type: ConstraintType): void {
    const index = this.state.activeConstraints.findIndex(c => c.type === type);
    if (index === -1) return;

    this.state.activeConstraints.splice(index, 1);
    this.emit('constraint:removed', type);

    // Begin recovery
    this.executeRecovery(type);

    // Reevaluate tier
    this.evaluateAndAdjustTier();
  }

  private getAffectedCapabilities(constraintType: ConstraintType): string[] {
    const affected: string[] = [];

    switch (constraintType) {
      case 'power_outage':
        // Everything except battery-backed essentials
        affected.push('full_climate', 'all_lighting', 'voice_control', 'digital_twin');
        break;
      case 'network_offline':
        affected.push('remote_access', 'cloud_api', 'proactive_suggestions', 'full_ai');
        break;
      case 'cloud_unavailable':
        affected.push('full_ai', 'proactive_suggestions', 'voice_control');
        break;
      case 'device_failure':
        // Will be specific to device
        break;
      case 'security_breach':
        affected.push('remote_access', 'voice_control');
        break;
    }

    return affected;
  }

  // ===========================================================================
  // Tier Management
  // ===========================================================================

  private evaluateAndAdjustTier(): void {
    const constraints = this.state.activeConstraints;
    let newTier: CapabilityTier = 'luxury';

    // Find the most restrictive constraint
    for (const constraint of constraints) {
      const constraintTier = this.getMaxTierForConstraint(constraint);
      if (TIER_ORDER.indexOf(constraintTier) < TIER_ORDER.indexOf(newTier)) {
        newTier = constraintTier;
      }
    }

    // Check resource availability
    const resourceTier = this.getMaxTierForResources();
    if (TIER_ORDER.indexOf(resourceTier) < TIER_ORDER.indexOf(newTier)) {
      newTier = resourceTier;
    }

    // Apply tier change if needed
    if (newTier !== this.state.currentTier) {
      const oldTier = this.state.currentTier;
      this.transitionToTier(newTier);
      this.emit('tier:changed', oldTier, newTier);
    }
  }

  private getMaxTierForConstraint(constraint: SystemConstraint): CapabilityTier {
    switch (constraint.severity) {
      case 'critical':
        return 'survival';
      case 'major':
        return 'comfort';
      case 'moderate':
        return 'convenience';
      case 'minor':
        return 'intelligence';
      default:
        return 'luxury';
    }
  }

  private getMaxTierForResources(): CapabilityTier {
    const budget = this.state.resourceBudget;
    const power = budget.available.get('power') || 0;
    const bandwidth = budget.available.get('bandwidth') || 0;

    // Check against tier requirements
    for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
      const tier = TIER_ORDER[i];
      const tierSet = this.pyramid.tiers.get(tier);
      if (!tierSet) continue;

      let canSupport = true;
      for (const req of tierSet.requiredResources) {
        const available = budget.available.get(req.resource) || 0;
        if (available < req.minimum) {
          canSupport = false;
          break;
        }
      }

      if (canSupport) {
        return tier;
      }
    }

    return 'survival';
  }

  private transitionToTier(newTier: CapabilityTier): void {
    const currentIndex = TIER_ORDER.indexOf(this.state.currentTier);
    const newIndex = TIER_ORDER.indexOf(newTier);

    if (newIndex < currentIndex) {
      // Degrading - sunset mode
      this.degradeToTier(newTier);
    } else {
      // Improving - dawn mode
      this.upgradeToTier(newTier);
    }

    this.state.currentTier = newTier;
    this.pyramid.currentTier = newTier;
  }

  private degradeToTier(targetTier: CapabilityTier): void {
    const targetIndex = TIER_ORDER.indexOf(targetTier);

    // Disable capabilities above target tier
    for (let i = TIER_ORDER.length - 1; i > targetIndex; i--) {
      const tier = TIER_ORDER[i];
      const tierSet = this.pyramid.tiers.get(tier);
      if (!tierSet) continue;

      for (const capability of tierSet.capabilities) {
        if (!capability.essential) {
          this.degradeCapability(capability.id, 3); // Max degradation
        }
      }
    }

    // Partially degrade target tier
    const targetSet = this.pyramid.tiers.get(targetTier);
    if (targetSet) {
      for (const capability of targetSet.capabilities) {
        if (!capability.essential) {
          this.degradeCapability(capability.id, 1); // Light degradation
        }
      }
    }
  }

  private upgradeToTier(targetTier: CapabilityTier): void {
    const currentIndex = TIER_ORDER.indexOf(this.state.currentTier);
    const targetIndex = TIER_ORDER.indexOf(targetTier);

    // Restore capabilities up to target tier
    for (let i = currentIndex; i <= targetIndex; i++) {
      const tier = TIER_ORDER[i];
      const tierSet = this.pyramid.tiers.get(tier);
      if (!tierSet) continue;

      for (const capability of tierSet.capabilities) {
        this.restoreCapability(capability.id);
      }
    }
  }

  private degradeCapability(capabilityId: string, level: number): void {
    const currentLevel = this.state.degradedCapabilities.get(capabilityId) || 0;
    if (level > currentLevel) {
      this.state.degradedCapabilities.set(capabilityId, level);
      this.emit('capability:degraded', capabilityId, level);
    }
  }

  private restoreCapability(capabilityId: string): void {
    if (this.state.degradedCapabilities.has(capabilityId)) {
      this.state.degradedCapabilities.delete(capabilityId);
      this.emit('capability:restored', capabilityId);
    }

    const disabledIndex = this.state.disabledCapabilities.indexOf(capabilityId);
    if (disabledIndex !== -1) {
      this.state.disabledCapabilities.splice(disabledIndex, 1);
      this.emit('capability:restored', capabilityId);
    }
  }

  // ===========================================================================
  // Sunset Degradation (Beautiful Failure)
  // ===========================================================================

  private beginSunsetDegradation(constraint: SystemConstraint): void {
    const phase = this.determineInitialSunsetPhase(constraint);

    this.sunsetState = {
      phase,
      startedAt: new Date(),
      transitionDuration: this.getTransitionDuration(constraint),
      ambientFeedback: this.getAmbientFeedback(phase),
    };

    this.emit('sunset:phase-changed', phase);
    this.applyAmbientFeedback(this.sunsetState.ambientFeedback);
  }

  private determineInitialSunsetPhase(constraint: SystemConstraint): SunsetPhase {
    switch (constraint.severity) {
      case 'informational':
        return 'golden_hour';
      case 'minor':
        return 'sunset';
      case 'moderate':
        return 'twilight';
      case 'major':
        return 'dusk';
      case 'critical':
        return 'night';
      default:
        return 'golden_hour';
    }
  }

  private getTransitionDuration(constraint: SystemConstraint): number {
    // Graceful transitions take time
    switch (constraint.severity) {
      case 'critical':
        return 30;       // 30 seconds for critical (fast but not jarring)
      case 'major':
        return 120;      // 2 minutes
      case 'moderate':
        return 300;      // 5 minutes
      case 'minor':
        return 600;      // 10 minutes
      default:
        return 900;      // 15 minutes for gentle degradation
    }
  }

  private getAmbientFeedback(phase: SunsetPhase): AmbientDegradationFeedback {
    switch (phase) {
      case 'golden_hour':
        return {
          lightTemperatureShift: -200,  // Slightly warmer
          lightIntensityFactor: 0.95,
          backgroundSoundType: 'gentle_ambient',
        };
      case 'sunset':
        return {
          lightTemperatureShift: -500,  // Warmer
          lightIntensityFactor: 0.85,
          backgroundSoundType: 'evening_wind',
        };
      case 'twilight':
        return {
          lightTemperatureShift: -800,  // Much warmer
          lightIntensityFactor: 0.7,
          backgroundSoundType: 'soft_silence',
        };
      case 'dusk':
        return {
          lightTemperatureShift: -1000,
          lightIntensityFactor: 0.5,
          notificationTone: 'gentle_chime',
        };
      case 'night':
        return {
          lightTemperatureShift: -1200,
          lightIntensityFactor: 0.3,
          notificationTone: 'soft_pulse',
        };
      case 'dawn':
        return {
          lightTemperatureShift: 200,   // Cooling back
          lightIntensityFactor: 1.0,
          backgroundSoundType: 'morning_birds',
        };
    }
  }

  private applyAmbientFeedback(feedback: AmbientDegradationFeedback): void {
    // This would integrate with the ambient controller
    // For now, we store the state for other systems to read
    console.log('Applying ambient degradation feedback:', feedback);
  }

  // ===========================================================================
  // Recovery Planning
  // ===========================================================================

  private planRecovery(constraint: SystemConstraint): void {
    const plan: RecoveryPlan = {
      constraint: constraint.type,
      phases: this.createRecoveryPhases(constraint),
      estimatedDuration: constraint.estimatedDuration || 60,
      userCommunication: {
        notifyOnStart: constraint.severity !== 'informational',
        progressUpdates: constraint.severity === 'major' || constraint.severity === 'critical',
        updateInterval: 60,
        notifyOnComplete: true,
        channels: this.getNotificationChannels(constraint),
      },
    };

    this.state.activeRecoveryPlans.push(plan);
    this.emit('recovery:started', plan);
  }

  private createRecoveryPhases(constraint: SystemConstraint): RecoveryPhase[] {
    const phases: RecoveryPhase[] = [];

    // Phase 1: Stabilize
    phases.push({
      order: 1,
      name: 'Stabilizasyon',
      description: 'Sistemin mevcut durumunu sabitleme',
      capabilities: ['safety_monitoring', 'emergency_communication'],
      prerequisites: [],
      validationSteps: [
        { check: 'safety_systems_online', expectedResult: 'true', retryCount: 3, retryDelay: 5 },
      ],
    });

    // Phase 2: Core restoration
    phases.push({
      order: 2,
      name: 'Temel Restorasyon',
      description: 'Temel yeteneklerin geri yüklenmesi',
      capabilities: ['basic_climate', 'emergency_lighting'],
      prerequisites: ['Stabilizasyon'],
      validationSteps: [
        { check: 'core_capabilities_functional', expectedResult: 'true', retryCount: 5, retryDelay: 10 },
      ],
    });

    // Phase 3: Comfort restoration
    if (constraint.severity !== 'critical') {
      phases.push({
        order: 3,
        name: 'Konfor Restorasyonu',
        description: 'Konfor özelliklerinin geri yüklenmesi',
        capabilities: ['full_climate', 'all_lighting', 'security_cameras'],
        prerequisites: ['Temel Restorasyon'],
        validationSteps: [
          { check: 'comfort_tier_available', expectedResult: 'true', retryCount: 3, retryDelay: 15 },
        ],
      });
    }

    // Phase 4: Full restoration
    if (constraint.severity === 'minor' || constraint.severity === 'informational') {
      phases.push({
        order: 4,
        name: 'Tam Restorasyon',
        description: 'Tüm özelliklerin tam kapasiteye dönüşü',
        capabilities: ['digital_twin', 'full_ai', 'proactive_suggestions'],
        prerequisites: ['Konfor Restorasyonu'],
        validationSteps: [
          { check: 'luxury_tier_available', expectedResult: 'true', retryCount: 3, retryDelay: 30 },
        ],
      });
    }

    return phases;
  }

  private getNotificationChannels(constraint: SystemConstraint): CommunicationChannel[] {
    const channels: CommunicationChannel[] = ['ambient_light'];

    if (constraint.severity === 'major' || constraint.severity === 'critical') {
      channels.push('voice_announcement', 'screen_notification');
    }

    if (constraint.severity === 'critical') {
      channels.push('external_push');
    }

    return channels;
  }

  private executeRecovery(constraintType: ConstraintType): void {
    // Find and execute recovery plan
    const planIndex = this.state.activeRecoveryPlans.findIndex(
      p => p.constraint === constraintType
    );

    if (planIndex === -1) return;

    const plan = this.state.activeRecoveryPlans[planIndex];

    // Begin dawn phase
    if (this.sunsetState) {
      this.sunsetState.phase = 'dawn';
      this.emit('sunset:phase-changed', 'dawn');
      this.applyAmbientFeedback(this.getAmbientFeedback('dawn'));
    }

    // Execute recovery phases
    this.executeRecoveryPhases(plan);

    // Remove completed plan
    this.state.activeRecoveryPlans.splice(planIndex, 1);
    this.emit('recovery:completed', constraintType);
  }

  private executeRecoveryPhases(plan: RecoveryPlan): void {
    for (const phase of plan.phases) {
      for (const capabilityId of phase.capabilities) {
        this.restoreCapability(capabilityId);
      }
    }
  }

  // ===========================================================================
  // Power Management
  // ===========================================================================

  /**
   * Update power status and adjust capabilities accordingly
   */
  public updatePowerStatus(
    gridAvailable: boolean,
    batteryLevel: number,
    solarGeneration: number
  ): void {
    const forecast = this.state.resourceBudget.forecast;
    forecast.gridStatus = gridAvailable ? 'available' : 'offline';
    forecast.batteryLevel = batteryLevel;
    forecast.solarGeneration = solarGeneration;

    // Calculate available power
    let availablePower = 0;
    if (gridAvailable) {
      availablePower = 5000; // 5kW grid
    } else if (batteryLevel > 20) {
      availablePower = 2000; // Conservative battery usage
    } else if (batteryLevel > 5) {
      availablePower = 500;  // Survival mode
    }
    availablePower += solarGeneration;

    this.state.resourceBudget.available.set('power', availablePower);

    // Determine power mode
    let newMode: PowerMode = 'normal';
    if (!gridAvailable && batteryLevel > 50) {
      newMode = 'backup';
    } else if (!gridAvailable && batteryLevel > 20) {
      newMode = 'emergency';
    } else if (!gridAvailable && batteryLevel <= 20) {
      newMode = 'blackout';
    } else if (solarGeneration > 0 && !gridAvailable) {
      newMode = 'solar';
    }

    if (newMode !== this.state.powerMode) {
      this.state.powerMode = newMode;
      this.emit('power:mode-changed', newMode);

      // Report constraint if needed
      if (newMode === 'emergency' || newMode === 'blackout') {
        this.reportConstraint(
          'power_limited',
          newMode === 'blackout' ? 'critical' : 'major',
          'power_monitor',
          `Güç durumu: ${newMode}`,
          batteryLevel * 2 // Rough estimate in minutes
        );
      }
    }

    // Reevaluate tier
    this.evaluateAndAdjustTier();
  }

  /**
   * Update network status
   */
  public updateNetworkStatus(
    connected: boolean,
    bandwidth: number,
    latency: number
  ): void {
    const budget = this.state.resourceBudget;
    budget.available.set('bandwidth', connected ? bandwidth : 0);
    budget.forecast.networkQuality = connected ? Math.max(0, 100 - latency / 10) : 0;

    if (!connected && !this.state.offlineProfile) {
      this.enterOfflineMode();
    } else if (connected && this.state.offlineProfile) {
      this.exitOfflineMode();
    }

    // Report constraint if degraded
    if (!connected) {
      this.reportConstraint(
        'network_offline',
        'moderate',
        'network_monitor',
        'İnternet bağlantısı kesildi'
      );
    } else if (bandwidth < 1000) {
      this.reportConstraint(
        'network_degraded',
        'minor',
        'network_monitor',
        'İnternet bağlantısı zayıf'
      );
    }

    this.evaluateAndAdjustTier();
  }

  // ===========================================================================
  // Offline Mode
  // ===========================================================================

  private enterOfflineMode(): void {
    this.state.offlineProfile = {
      id: 'default_offline',
      name: 'Çevrimdışı Mod',
      priority: 1,
      capabilities: this.createOfflineCapabilities(),
      scheduledActions: [],
      dataRetention: {
        sensorData: 24,
        eventLog: 168,       // 1 week
        patternData: 720,    // 1 month
        userPreferences: 'permanent',
      },
    };

    this.emit('offline:entered');
  }

  private exitOfflineMode(): void {
    this.state.offlineProfile = null;
    this.state.lastCloudSync = new Date();
    this.emit('offline:exited');
  }

  private createOfflineCapabilities(): Array<{
    capabilityId: string;
    offlineMode: 'full' | 'degraded' | 'cached' | 'manual' | 'disabled';
    lastSyncedAt: Date;
    localCacheValid: boolean;
    manualOverrideAllowed: boolean;
  }> {
    return [
      { capabilityId: 'safety_monitoring', offlineMode: 'full', lastSyncedAt: new Date(), localCacheValid: true, manualOverrideAllowed: true },
      { capabilityId: 'basic_climate', offlineMode: 'full', lastSyncedAt: new Date(), localCacheValid: true, manualOverrideAllowed: true },
      { capabilityId: 'all_lighting', offlineMode: 'full', lastSyncedAt: new Date(), localCacheValid: true, manualOverrideAllowed: true },
      { capabilityId: 'voice_control', offlineMode: 'degraded', lastSyncedAt: new Date(), localCacheValid: true, manualOverrideAllowed: true },
      { capabilityId: 'scenes', offlineMode: 'cached', lastSyncedAt: new Date(), localCacheValid: true, manualOverrideAllowed: true },
      { capabilityId: 'full_ai', offlineMode: 'disabled', lastSyncedAt: new Date(), localCacheValid: false, manualOverrideAllowed: false },
      { capabilityId: 'remote_access', offlineMode: 'disabled', lastSyncedAt: new Date(), localCacheValid: false, manualOverrideAllowed: false },
    ];
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  public getState(): Readonly<DegradationState> {
    return this.state;
  }

  public getCurrentTier(): CapabilityTier {
    return this.state.currentTier;
  }

  public isCapabilityAvailable(capabilityId: string): boolean {
    return !this.state.disabledCapabilities.includes(capabilityId);
  }

  public getCapabilityDegradationLevel(capabilityId: string): number {
    return this.state.degradedCapabilities.get(capabilityId) || 0;
  }

  public getSunsetPhase(): SunsetPhase | null {
    return this.sunsetState?.phase || null;
  }

  public isOffline(): boolean {
    return this.state.offlineProfile !== null;
  }

  public getPowerMode(): PowerMode {
    return this.state.powerMode;
  }

  public acknowledgeConstraint(constraintType: ConstraintType): void {
    if (!this.state.acknowledgedConstraints.includes(constraintType)) {
      this.state.acknowledgedConstraints.push(constraintType);
    }
  }

  /**
   * Register a manual override
   */
  public registerManualOverride(override: Omit<ManualOverride, 'id' | 'activatedAt'>): string {
    const id = `override_${Date.now()}`;
    const fullOverride: ManualOverride = {
      ...override,
      id,
      activatedAt: new Date(),
    };
    this.state.manualOverrides.push(fullOverride);
    return id;
  }

  public removeManualOverride(id: string): void {
    const index = this.state.manualOverrides.findIndex(o => o.id === id);
    if (index !== -1) {
      this.state.manualOverrides.splice(index, 1);
    }
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
    }
    this.removeAllListeners();
  }
}

export default GracefulDegradationController;
