/**
 * AICO Smart Home - Trust-Based Autonomy Controller
 *
 * "The house must earn the right to act."
 *
 * Trust is built through consistency and appropriate judgment.
 * It's lost through mistakes and overreach.
 * The house should be humble about its capabilities.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  AutonomyState,
  DelegationProfile,
  DelegationLevel,
  DelegationDomain,
  DomainDelegation,
  DelegationPreferences,
  TrustEvent,
  TrustOutcome,
  UserFeedback,
  AutonomousAction,
  ActionProposal,
  ProposalPresentation,
  ApprovalType,
  AlternativeAction,
  TrustCalibration,
  CalibrationState,
  LearningPhase,
  ConfidenceThresholds,
  PermissionRequest,
  PermissionResponse,
  PermissionScope,
  AutonomyMode,
  TrustDynamics,
  DEFAULT_TRUST_DYNAMICS,
} from './types';
import type { UserId, RoomId } from '@/types/core';

interface AutonomyEvents {
  'trust:changed': (userId: UserId, domain: DelegationDomain, newLevel: number) => void;
  'delegation:upgraded': (userId: UserId, domain: DelegationDomain, newLevel: DelegationLevel) => void;
  'delegation:downgraded': (userId: UserId, domain: DelegationDomain, newLevel: DelegationLevel) => void;
  'action:proposed': (proposal: ActionProposal) => void;
  'action:executed': (action: AutonomousAction) => void;
  'action:rejected': (actionId: string, reason: string) => void;
  'permission:requested': (request: PermissionRequest) => void;
  'permission:granted': (requestId: string) => void;
  'permission:denied': (requestId: string) => void;
  'calibration:phase-changed': (userId: UserId, phase: LearningPhase) => void;
  'warning:trust-low': (userId: UserId, domain: DelegationDomain) => void;
}

// Delegation level hierarchy (least to most autonomous)
const DELEGATION_HIERARCHY: DelegationLevel[] = [
  'inform',
  'suggest',
  'propose',
  'auto_reversible',
  'auto_notify',
  'auto_silent',
];

export class TrustBasedAutonomyController extends EventEmitter<AutonomyEvents> {
  private state: AutonomyState;
  private dynamics: TrustDynamics;
  private trustDecayInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.dynamics = { ...DEFAULT_TRUST_DYNAMICS };
    this.state = this.initializeState();
    this.startTrustDecay();
  }

  // ===========================================================================
  // Initialization
  // ===========================================================================

  private initializeState(): AutonomyState {
    return {
      profiles: new Map(),
      pendingProposals: [],
      recentActions: [],
      calibrations: new Map(),
      pendingPermissions: [],
      autonomyMode: 'balanced',
      houseConfidence: 50,        // Start neutral
      learningRate: 1.0,
    };
  }

  // ===========================================================================
  // User Profile Management
  // ===========================================================================

  /**
   * Initialize a new user with conservative defaults
   */
  public initializeUser(userId: UserId): void {
    if (this.state.profiles.has(userId)) return;

    const profile: DelegationProfile = {
      userId,
      domains: this.createDefaultDomains(),
      globalTrustLevel: 30,       // Start with low trust
      delegationPreferences: this.createDefaultPreferences(),
      trustHistory: [],
    };

    this.state.profiles.set(userId, profile);

    // Initialize calibration
    this.state.calibrations.set(userId, {
      userId,
      calibrationState: 'initial',
      learningPhase: 'observation',
      confidenceThresholds: {
        informThreshold: 0.3,
        suggestThreshold: 0.5,
        proposeThreshold: 0.7,
        autoActThreshold: 0.9,
      },
      behaviorBaseline: {
        temperatureRange: { min: 20, max: 24 },
        lightingPreferences: {},
        schedulePatterns: [],
        correctionHistory: [],
      },
    });
  }

  private createDefaultDomains(): Map<DelegationDomain, DomainDelegation> {
    const domains = new Map<DelegationDomain, DomainDelegation>();
    const allDomains: DelegationDomain[] = [
      'climate', 'lighting', 'security', 'energy',
      'entertainment', 'communication', 'scheduling',
      'purchases', 'health', 'social',
    ];

    for (const domain of allDomains) {
      domains.set(domain, {
        domain,
        currentLevel: this.getDefaultLevelForDomain(domain),
        maxLevel: this.getMaxLevelForDomain(domain),
        trustScore: 30,
        recentActions: [],
        successRate: 0,
        lastAdjusted: new Date(),
      });
    }

    return domains;
  }

  private getDefaultLevelForDomain(domain: DelegationDomain): DelegationLevel {
    // Different domains start at different levels
    switch (domain) {
      case 'lighting':
        return 'suggest';         // Lighting is safe to suggest
      case 'climate':
        return 'suggest';         // Climate is safe to suggest
      case 'security':
        return 'inform';          // Security is sensitive
      case 'purchases':
        return 'inform';          // Money is sensitive
      case 'social':
        return 'inform';          // Social actions are sensitive
      default:
        return 'suggest';
    }
  }

  private getMaxLevelForDomain(domain: DelegationDomain): DelegationLevel {
    // Some domains should never be fully autonomous
    switch (domain) {
      case 'purchases':
        return 'propose';         // Never auto-buy
      case 'social':
        return 'propose';         // Never auto-message
      case 'security':
        return 'auto_notify';     // Security can auto-act but must notify
      default:
        return 'auto_silent';
    }
  }

  private createDefaultPreferences(): DelegationPreferences {
    return {
      sleepTimeDelegation: {
        lighting: 'auto_silent',
        climate: 'auto_silent',
        security: 'auto_notify',
      },
      awayDelegation: {
        security: 'auto_silent',
        energy: 'auto_silent',
        climate: 'auto_notify',
      },
      busyDelegation: {
        communication: 'inform',
        scheduling: 'suggest',
      },
      comfortPriority: 'balanced',
      notifyOnAutoActions: true,
      notifyOnSuggestions: false,
      notificationThreshold: 'auto_reversible',
      alwaysAskFor: ['unlock_door', 'disarm_security', 'large_purchase'],
      neverAutomate: ['send_message', 'post_social', 'financial_transaction'],
    };
  }

  // ===========================================================================
  // Action Processing
  // ===========================================================================

  /**
   * Attempt to execute an autonomous action
   */
  public async attemptAction(
    userId: UserId,
    action: AutonomousAction
  ): Promise<{ executed: boolean; reason: string; proposalId?: string }> {
    const profile = this.state.profiles.get(userId);
    if (!profile) {
      return { executed: false, reason: 'Kullanıcı profili bulunamadı' };
    }

    const domainDelegation = profile.domains.get(action.domain);
    if (!domainDelegation) {
      return { executed: false, reason: 'Alan delegasyonu bulunamadı' };
    }

    // Check if action is in neverAutomate list
    if (profile.delegationPreferences.neverAutomate.includes(action.type)) {
      return { executed: false, reason: 'Bu eylem asla otomatikleştirilemez' };
    }

    // Check if action requires explicit approval
    if (profile.delegationPreferences.alwaysAskFor.includes(action.type)) {
      const proposal = this.createProposal(action, 'confirmation');
      return { executed: false, reason: 'Onay gerekli', proposalId: proposal.action.id };
    }

    // Determine what level is needed for this action
    const requiredLevel = this.determineRequiredLevel(action);
    const currentLevel = domainDelegation.currentLevel;

    // Check if we have sufficient delegation
    if (this.isLevelSufficient(currentLevel, requiredLevel)) {
      return this.executeAction(userId, action, domainDelegation);
    }

    // Not sufficient - create appropriate response
    if (requiredLevel === 'propose' || requiredLevel === 'suggest') {
      const proposal = this.createProposal(action, this.getApprovalType(requiredLevel));
      return {
        executed: false,
        reason: 'Öneri oluşturuldu',
        proposalId: proposal.action.id,
      };
    }

    return {
      executed: false,
      reason: `Yetersiz yetki: ${currentLevel} < ${requiredLevel}`,
    };
  }

  private determineRequiredLevel(action: AutonomousAction): DelegationLevel {
    // Higher impact = higher required level
    const { impact, confidence, reversibility } = action;

    // Financial impact always requires explicit approval
    if (impact.financialImpact && impact.financialImpact > 0) {
      return 'propose';
    }

    // Non-reversible actions need higher approval
    if (!reversibility.isReversible) {
      return 'propose';
    }

    // Low confidence = lower autonomy
    if (confidence < 0.5) {
      return 'suggest';
    }

    // Multiple users affected = more scrutiny
    if (impact.affectedUsers.length > 1) {
      return 'propose';
    }

    // High confidence, reversible, single user = can auto-act
    if (confidence > 0.9 && reversibility.isReversible) {
      return 'auto_reversible';
    }

    return 'propose';
  }

  private isLevelSufficient(current: DelegationLevel, required: DelegationLevel): boolean {
    const currentIndex = DELEGATION_HIERARCHY.indexOf(current);
    const requiredIndex = DELEGATION_HIERARCHY.indexOf(required);
    return currentIndex >= requiredIndex;
  }

  private async executeAction(
    userId: UserId,
    action: AutonomousAction,
    delegation: DomainDelegation
  ): Promise<{ executed: boolean; reason: string }> {
    // Execute the action
    action.executedAt = new Date();

    // Store in recent actions
    delegation.recentActions.push(action);
    if (delegation.recentActions.length > 100) {
      delegation.recentActions.shift();
    }

    this.state.recentActions.push(action);
    if (this.state.recentActions.length > 500) {
      this.state.recentActions.shift();
    }

    this.emit('action:executed', action);

    // Should we notify?
    const profile = this.state.profiles.get(userId)!;
    if (
      profile.delegationPreferences.notifyOnAutoActions &&
      this.isLevelSufficient(delegation.currentLevel, profile.delegationPreferences.notificationThreshold)
    ) {
      // Notification would be sent here
    }

    return { executed: true, reason: 'Eylem başarıyla gerçekleştirildi' };
  }

  private createProposal(action: AutonomousAction, approvalType: ApprovalType): ActionProposal {
    const proposal: ActionProposal = {
      action,
      presentation: this.createPresentation(action),
      requiredApproval: approvalType,
      expiresAt: action.timing.deadline,
      alternatives: this.generateAlternatives(action),
    };

    this.state.pendingProposals.push(proposal);
    this.emit('action:proposed', proposal);

    return proposal;
  }

  private createPresentation(action: AutonomousAction): ProposalPresentation {
    return {
      headline: this.getActionHeadline(action),
      explanation: action.reason.primary,
      voiceScript: this.getVoiceScript(action),
      ambientSignal: this.getAmbientSignal(action),
    };
  }

  private getActionHeadline(action: AutonomousAction): string {
    // Turkish headlines for different action types
    const headlines: Record<string, string> = {
      adjust_temperature: 'Sıcaklık Ayarı',
      adjust_lights: 'Aydınlatma Ayarı',
      activate_scene: 'Sahne Aktivasyonu',
      lock_doors: 'Kapı Kilitleme',
      shift_load: 'Enerji Kaydırma',
      set_reminder: 'Hatırlatıcı',
    };

    return headlines[action.type] || action.description;
  }

  private getVoiceScript(action: AutonomousAction): string {
    return `${action.description}. ${action.reason.primary}`;
  }

  private getAmbientSignal(action: AutonomousAction): string {
    // Different ambient signals for different actions
    switch (action.domain) {
      case 'climate':
        return 'thermal_whisper';
      case 'lighting':
        return 'breath_of_light';
      case 'security':
        return 'attention_gentle';
      default:
        return 'notification_chime';
    }
  }

  private generateAlternatives(action: AutonomousAction): AlternativeAction[] {
    // Generate alternatives based on action type
    const alternatives: AlternativeAction[] = [];

    if (action.type === 'adjust_temperature') {
      alternatives.push({
        action: {
          ...action,
          id: `${action.id}_alt1`,
          description: 'Daha küçük sıcaklık değişikliği',
        },
        reason: 'Daha muhafazakar yaklaşım',
        tradeoffs: ['Daha az enerji tasarrufu', 'Daha küçük değişiklik'],
      });
    }

    return alternatives;
  }

  private getApprovalType(level: DelegationLevel): ApprovalType {
    switch (level) {
      case 'inform':
        return 'none';
      case 'suggest':
        return 'one_tap';
      case 'propose':
        return 'confirmation';
      case 'auto_reversible':
        return 'cancelable';
      case 'auto_notify':
        return 'none';
      case 'auto_silent':
        return 'none';
    }
  }

  // ===========================================================================
  // Proposal Handling
  // ===========================================================================

  /**
   * User approves a proposal
   */
  public approveProposal(proposalId: string): void {
    const index = this.state.pendingProposals.findIndex(
      p => p.action.id === proposalId
    );

    if (index === -1) return;

    const proposal = this.state.pendingProposals[index];
    this.state.pendingProposals.splice(index, 1);

    // Execute the action
    proposal.action.executedAt = new Date();
    this.state.recentActions.push(proposal.action);
    this.emit('action:executed', proposal.action);

    // Record as positive trust event
    this.recordTrustEvent(
      proposal.action,
      'appreciated_action',
      { type: 'thumbs_up', explicit: true, timestamp: new Date() }
    );
  }

  /**
   * User rejects a proposal
   */
  public rejectProposal(proposalId: string, reason?: string): void {
    const index = this.state.pendingProposals.findIndex(
      p => p.action.id === proposalId
    );

    if (index === -1) return;

    const proposal = this.state.pendingProposals[index];
    this.state.pendingProposals.splice(index, 1);

    this.emit('action:rejected', proposalId, reason || 'Kullanıcı tarafından reddedildi');

    // Record as negative trust event
    this.recordTrustEvent(
      proposal.action,
      'rejected',
      { type: 'thumbs_down', explicit: true, message: reason, timestamp: new Date() }
    );
  }

  /**
   * User undoes a recently executed action
   */
  public undoAction(actionId: string): void {
    const action = this.state.recentActions.find(a => a.id === actionId);
    if (!action) return;

    // Record as correction
    this.recordTrustEvent(
      action,
      'minor_correction',
      { type: 'undo', explicit: true, timestamp: new Date() }
    );
  }

  // ===========================================================================
  // Trust Management
  // ===========================================================================

  /**
   * Record a trust event and update trust scores
   */
  private recordTrustEvent(
    action: AutonomousAction,
    outcome: TrustOutcome,
    feedback?: UserFeedback
  ): void {
    // Find the user (from affected users or default)
    const userId = action.impact.affectedUsers[0];
    if (!userId) return;

    const profile = this.state.profiles.get(userId);
    if (!profile) return;

    const domainDelegation = profile.domains.get(action.domain);
    if (!domainDelegation) return;

    // Calculate trust delta
    const trustDelta = this.calculateTrustDelta(outcome, action.confidence);

    // Create event
    const event: TrustEvent = {
      id: `trust_${Date.now()}`,
      timestamp: new Date(),
      domain: action.domain,
      action,
      outcome,
      trustDelta,
      userFeedback: feedback,
    };

    // Update profile
    profile.trustHistory.push(event);
    if (profile.trustHistory.length > 1000) {
      profile.trustHistory.shift();
    }

    // Update domain trust score
    domainDelegation.trustScore = Math.max(0, Math.min(100,
      domainDelegation.trustScore + trustDelta
    ));

    // Update success rate
    this.updateSuccessRate(domainDelegation);

    // Update global trust
    this.updateGlobalTrust(profile);

    // Emit event
    this.emit('trust:changed', userId, action.domain, domainDelegation.trustScore);

    // Check for delegation changes
    this.evaluateDelegationLevel(userId, domainDelegation);

    // Check for warnings
    if (domainDelegation.trustScore < this.dynamics.warningThreshold) {
      this.emit('warning:trust-low', userId, action.domain);
    }
  }

  private calculateTrustDelta(outcome: TrustOutcome, confidence: number): number {
    // Trust grows slowly, decays quickly
    const baseDeltas: Record<TrustOutcome, number> = {
      correct_prediction: 2,
      appreciated_action: 3,
      neutral: 0.5,
      minor_correction: -2,
      significant_correction: -5,
      rejected: -8,
      complained: -15,
    };

    let delta = baseDeltas[outcome] || 0;

    // Adjust by confidence - high confidence mistakes are worse
    if (delta < 0 && confidence > 0.8) {
      delta *= 1.5; // High confidence mistakes hurt more
    }

    // Apply dynamics
    if (delta > 0) {
      delta *= this.dynamics.growthRate;
    } else {
      delta *= this.dynamics.decayRate;
    }

    return delta * this.state.learningRate;
  }

  private updateSuccessRate(delegation: DomainDelegation): void {
    const recentActions = delegation.recentActions.slice(-50);
    if (recentActions.length === 0) {
      delegation.successRate = 0;
      return;
    }

    const successful = recentActions.filter(
      a => a.outcome?.success && a.outcome.userReaction !== 'rejected'
    ).length;

    delegation.successRate = (successful / recentActions.length) * 100;
  }

  private updateGlobalTrust(profile: DelegationProfile): void {
    const domains = Array.from(profile.domains.values());
    const totalScore = domains.reduce((sum, d) => sum + d.trustScore, 0);
    profile.globalTrustLevel = totalScore / domains.length;
  }

  private evaluateDelegationLevel(userId: UserId, delegation: DomainDelegation): void {
    const currentIndex = DELEGATION_HIERARCHY.indexOf(delegation.currentLevel);
    const maxIndex = DELEGATION_HIERARCHY.indexOf(delegation.maxLevel);

    // Check for upgrade
    if (
      delegation.trustScore > 70 &&
      delegation.successRate > 80 &&
      currentIndex < maxIndex
    ) {
      const newLevel = DELEGATION_HIERARCHY[currentIndex + 1];
      delegation.currentLevel = newLevel;
      delegation.lastAdjusted = new Date();
      this.emit('delegation:upgraded', userId, delegation.domain, newLevel);
    }

    // Check for downgrade
    if (
      delegation.trustScore < this.dynamics.lockoutThreshold &&
      currentIndex > 0
    ) {
      const newLevel = DELEGATION_HIERARCHY[currentIndex - 1];
      delegation.currentLevel = newLevel;
      delegation.lastAdjusted = new Date();
      this.emit('delegation:downgraded', userId, delegation.domain, newLevel);
    }
  }

  // ===========================================================================
  // Trust Decay
  // ===========================================================================

  private startTrustDecay(): void {
    // Trust slowly decays without positive reinforcement
    this.trustDecayInterval = setInterval(() => {
      for (const [userId, profile] of this.state.profiles) {
        for (const [domain, delegation] of profile.domains) {
          // Small decay per day
          const decayPerHour = 0.1;
          delegation.trustScore = Math.max(
            this.dynamics.rehabilitationThreshold,
            delegation.trustScore - decayPerHour
          );
        }
      }
    }, 60 * 60 * 1000); // Every hour
  }

  // ===========================================================================
  // Calibration
  // ===========================================================================

  /**
   * Update calibration phase based on trust level
   */
  private updateCalibration(userId: UserId): void {
    const calibration = this.state.calibrations.get(userId);
    const profile = this.state.profiles.get(userId);

    if (!calibration || !profile) return;

    const trust = profile.globalTrustLevel;
    let newPhase: LearningPhase;

    if (trust < 20) {
      newPhase = 'observation';
    } else if (trust < 50) {
      newPhase = 'suggestion';
    } else if (trust < 75) {
      newPhase = 'supervised';
    } else {
      newPhase = 'autonomous';
    }

    if (newPhase !== calibration.learningPhase) {
      calibration.learningPhase = newPhase;
      this.emit('calibration:phase-changed', userId, newPhase);
    }

    // Update calibration state
    if (trust < 30 && calibration.calibrationState === 'established') {
      calibration.calibrationState = 'recalibrating';
    } else if (trust > 60 && calibration.calibrationState !== 'established') {
      calibration.calibrationState = 'established';
    }
  }

  // ===========================================================================
  // Permission Requests
  // ===========================================================================

  /**
   * Request elevated permission for a domain
   */
  public requestPermission(
    userId: UserId,
    domain: DelegationDomain,
    requestedLevel: DelegationLevel,
    reason: string,
    permanent: boolean = false
  ): string {
    const profile = this.state.profiles.get(userId);
    if (!profile) return '';

    const delegation = profile.domains.get(domain);
    if (!delegation) return '';

    const request: PermissionRequest = {
      id: `perm_${Date.now()}`,
      action: {
        id: `action_${Date.now()}`,
        domain,
        type: 'adjust_temperature', // Placeholder
        description: reason,
        reason: { primary: reason, supporting: [], patterns: [], confidence: 0.8 },
        confidence: 0.8,
        reversibility: { isReversible: true, reverseWindow: 300, reverseMethod: 'automatic' },
        timing: { proposed: new Date(), flexibility: 'flexible' },
        impact: { affectedRooms: [], affectedDevices: [], affectedUsers: [userId], energyImpact: 0, comfortImpact: 'neutral' },
      },
      requestedLevel,
      currentLevel: delegation.currentLevel,
      reason,
      permanent,
      scope: permanent ? 'domain' : 'this_action',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    this.state.pendingPermissions.push(request);
    this.emit('permission:requested', request);

    return request.id;
  }

  /**
   * Respond to a permission request
   */
  public respondToPermission(
    requestId: string,
    granted: boolean,
    scope?: PermissionScope,
    conditions?: string[]
  ): void {
    const index = this.state.pendingPermissions.findIndex(p => p.id === requestId);
    if (index === -1) return;

    const request = this.state.pendingPermissions[index];
    request.response = {
      granted,
      scope: scope || request.scope,
      conditions,
      respondedAt: new Date(),
    };

    this.state.pendingPermissions.splice(index, 1);

    if (granted) {
      this.emit('permission:granted', requestId);

      // If permanent, update the delegation level
      if (request.permanent && request.scope === 'domain') {
        const profile = this.state.profiles.get(request.action.impact.affectedUsers[0]);
        if (profile) {
          const delegation = profile.domains.get(request.action.domain);
          if (delegation) {
            delegation.currentLevel = request.requestedLevel;
            delegation.lastAdjusted = new Date();
          }
        }
      }
    } else {
      this.emit('permission:denied', requestId);
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  public getProfile(userId: UserId): DelegationProfile | undefined {
    return this.state.profiles.get(userId);
  }

  public getDelegationLevel(userId: UserId, domain: DelegationDomain): DelegationLevel {
    const profile = this.state.profiles.get(userId);
    if (!profile) return 'inform';

    const delegation = profile.domains.get(domain);
    return delegation?.currentLevel || 'inform';
  }

  public getTrustScore(userId: UserId, domain?: DelegationDomain): number {
    const profile = this.state.profiles.get(userId);
    if (!profile) return 0;

    if (domain) {
      const delegation = profile.domains.get(domain);
      return delegation?.trustScore || 0;
    }

    return profile.globalTrustLevel;
  }

  public getCalibration(userId: UserId): TrustCalibration | undefined {
    return this.state.calibrations.get(userId);
  }

  public getPendingProposals(userId?: UserId): ActionProposal[] {
    if (!userId) return this.state.pendingProposals;

    return this.state.pendingProposals.filter(
      p => p.action.impact.affectedUsers.includes(userId)
    );
  }

  public getRecentActions(userId?: UserId, limit: number = 50): AutonomousAction[] {
    let actions = this.state.recentActions;

    if (userId) {
      actions = actions.filter(a => a.impact.affectedUsers.includes(userId));
    }

    return actions.slice(-limit);
  }

  public setAutonomyMode(mode: AutonomyMode): void {
    this.state.autonomyMode = mode;

    // Adjust learning rate based on mode
    switch (mode) {
      case 'conservative':
        this.state.learningRate = 0.5;
        break;
      case 'proactive':
        this.state.learningRate = 1.5;
        break;
      case 'guest_mode':
        this.state.learningRate = 0;
        break;
      default:
        this.state.learningRate = 1.0;
    }
  }

  public getAutonomyMode(): AutonomyMode {
    return this.state.autonomyMode;
  }

  /**
   * Provide explicit feedback on an action
   */
  public provideFeedback(
    actionId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    message?: string
  ): void {
    const action = this.state.recentActions.find(a => a.id === actionId);
    if (!action) return;

    const outcome: TrustOutcome =
      feedback === 'positive' ? 'appreciated_action' :
      feedback === 'negative' ? 'complained' :
      'neutral';

    const userFeedback: UserFeedback = {
      type: feedback === 'positive' ? 'thumbs_up' :
            feedback === 'negative' ? 'thumbs_down' :
            'thumbs_up',
      explicit: true,
      message,
      timestamp: new Date(),
    };

    this.recordTrustEvent(action, outcome, userFeedback);
  }

  public destroy(): void {
    if (this.trustDecayInterval) {
      clearInterval(this.trustDecayInterval);
    }
    this.removeAllListeners();
  }
}

export default TrustBasedAutonomyController;
