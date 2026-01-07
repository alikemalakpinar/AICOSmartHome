/**
 * AICO Smart Home - Ambient Interaction Controller
 *
 * Orchestrates non-screen communication through environmental cues.
 * The goal: users forget the system exists.
 */

import { EventEmitter } from 'eventemitter3';
import type {
  AmbientSignal,
  AmbientSignalType,
  SignalPriority,
  AmbientMessage,
  SignalTarget,
  BreathOfLight,
  ThermalWhisper,
  AcousticSignal,
  GesturalInput,
  AmbientConfig,
  RoomAmbienceState,
  AttentionState,
  InteractionLevel,
  LIGHT_MEANINGS,
  ACOUSTIC_MEANINGS,
} from './types';
import type { RoomId, UserId, DeviceId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface AmbientOutput {
  type: 'light' | 'thermal' | 'acoustic' | 'haptic';
  target: RoomId[];
  parameters: Record<string, unknown>;
  duration: number;
}

type AmbientControllerEvents = {
  signalSent: [AmbientSignal];
  signalAcknowledged: [string, UserId?];
  interactionLevelEscalated: [InteractionLevel, InteractionLevel];
  ambientStateChanged: [RoomId, RoomAmbienceState];
  userAttentionChanged: [UserId, AttentionState];
};

// ============================================================================
// Ambient Controller
// ============================================================================

export class AmbientController extends EventEmitter<AmbientControllerEvents> {
  private config: AmbientConfig;
  private activeSignals: Map<string, AmbientSignal> = new Map();
  private signalQueue: AmbientSignal[] = [];
  private roomStates: Map<RoomId, RoomAmbienceState> = new Map();
  private userAttention: Map<UserId, AttentionState> = new Map();
  private lastSignalTime: number = 0;

  // Device interfaces (would be injected in real implementation)
  private lightController?: LightControllerInterface;
  private thermalController?: ThermalControllerInterface;
  private audioController?: AudioControllerInterface;

  constructor(config: Partial<AmbientConfig> = {}) {
    super();

    this.config = {
      enabledTypes: ['breath_of_light', 'acoustic_presence', 'thermal_whisper'],
      maxSimultaneousSignals: 3,
      cooldownBetweenSignals: 2000,
      lightSensitivity: 0.7,
      soundSensitivity: 0.5,
      thermalSensitivity: 0.3,
      enableGesturalRecognition: true,
      enableVoiceActivation: true,
      fallbackToScreenAfter: 30000,
      ...config,
    };
  }

  // ============================================================================
  // Signal Sending
  // ============================================================================

  /**
   * Send an ambient signal to communicate with users
   */
  sendSignal(signal: Omit<AmbientSignal, 'id'>): string {
    const signalWithId: AmbientSignal = {
      ...signal,
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Check if signal type is enabled
    if (!this.config.enabledTypes.includes(signal.type)) {
      return signalWithId.id;
    }

    // Check cooldown
    const now = Date.now();
    if (now - this.lastSignalTime < this.config.cooldownBetweenSignals) {
      // Queue the signal
      this.signalQueue.push(signalWithId);
      this.scheduleQueueProcessing();
      return signalWithId.id;
    }

    // Check simultaneous signal limit
    if (this.activeSignals.size >= this.config.maxSimultaneousSignals) {
      if (signal.priority === 'urgent' || signal.priority === 'attention') {
        // Preempt lowest priority signal
        this.preemptLowestPriority(signalWithId);
      } else {
        this.signalQueue.push(signalWithId);
        this.scheduleQueueProcessing();
        return signalWithId.id;
      }
    }

    this.executeSignal(signalWithId);
    return signalWithId.id;
  }

  /**
   * Execute a prepared signal
   */
  private executeSignal(signal: AmbientSignal): void {
    this.activeSignals.set(signal.id, signal);
    this.lastSignalTime = Date.now();

    // Convert to device commands
    const outputs = this.signalToOutputs(signal);

    // Execute outputs
    for (const output of outputs) {
      this.executeOutput(output);
    }

    // Schedule signal completion
    setTimeout(() => {
      this.completeSignal(signal.id);
    }, signal.duration);

    this.emit('signalSent', signal);
  }

  /**
   * Convert abstract signal to device outputs
   */
  private signalToOutputs(signal: AmbientSignal): AmbientOutput[] {
    const outputs: AmbientOutput[] = [];
    const rooms = this.resolveTargetRooms(signal.target);

    switch (signal.type) {
      case 'breath_of_light':
        outputs.push(this.createLightOutput(signal, rooms));
        break;

      case 'thermal_whisper':
        outputs.push(this.createThermalOutput(signal, rooms));
        break;

      case 'acoustic_presence':
        outputs.push(this.createAcousticOutput(signal, rooms));
        break;

      case 'haptic_pulse':
        // Would interface with haptic devices
        break;

      case 'scent_note':
        // Would interface with scent diffusers
        break;
    }

    return outputs;
  }

  // ============================================================================
  // Light Signals
  // ============================================================================

  private createLightOutput(signal: AmbientSignal, rooms: RoomId[]): AmbientOutput {
    const intensity = this.config.lightSensitivity;

    // Map message intent to light pattern
    const lightParams = this.intentToLightPattern(signal.message.intent, intensity);

    return {
      type: 'light',
      target: rooms,
      parameters: lightParams,
      duration: signal.duration,
    };
  }

  private intentToLightPattern(
    intent: AmbientMessage['intent'],
    intensity: number
  ): Record<string, unknown> {
    const patterns: Record<string, Record<string, unknown>> = {
      // Presence signals
      presence_arriving: {
        pattern: 'gentle_pulse',
        temperatureShift: -200 * intensity, // Warmer
        brightnessChange: 5 * intensity,
        transitionTime: 3000,
      },
      presence_departing: {
        pattern: 'gradual_shift',
        temperatureShift: 200 * intensity, // Cooler
        brightnessChange: -3 * intensity,
        transitionTime: 5000,
      },

      // System status
      system_processing: {
        pattern: 'slow_pulse',
        temperatureShift: 50 * intensity,
        pulseSpeed: 30000,
        amplitude: 3 * intensity,
      },
      task_complete: {
        pattern: 'single_pulse',
        temperatureShift: -100 * intensity,
        brightnessChange: 8 * intensity,
        transitionTime: 1000,
      },

      // Suggestions
      consider_action: {
        pattern: 'attention_blink',
        temperatureShift: 0,
        brightnessChange: 10 * intensity,
        blinkCount: 1,
        blinkDuration: 500,
      },
      opportunity_available: {
        pattern: 'directional_glow',
        direction: 'toward_opportunity',
        temperatureShift: -150 * intensity,
      },

      // Alerts
      attention_needed: {
        pattern: 'gentle_pulse',
        temperatureShift: 100 * intensity,
        pulseSpeed: 5000,
        amplitude: 10 * intensity,
      },
      action_required: {
        pattern: 'attention_pulse',
        temperatureShift: 200 * intensity,
        pulseSpeed: 3000,
        amplitude: 15 * intensity,
      },
      safety_alert: {
        pattern: 'urgent_pulse',
        color: { r: 255, g: 100, b: 100 },
        pulseSpeed: 1000,
        amplitude: 30,
      },

      // Environment
      environment_change: {
        pattern: 'gradual_shift',
        temperatureShift: 100 * intensity,
        transitionTime: 10000,
      },
      preparation_ready: {
        pattern: 'steady_warm',
        temperatureShift: -300 * intensity,
        brightnessChange: 5 * intensity,
      },
    };

    return patterns[intent] || patterns.system_processing;
  }

  // ============================================================================
  // Thermal Signals
  // ============================================================================

  private createThermalOutput(signal: AmbientSignal, rooms: RoomId[]): AmbientOutput {
    const sensitivity = this.config.thermalSensitivity;

    // Very subtle temperature changes
    const adjustment = this.intentToThermalAdjustment(signal.message.intent, sensitivity);

    return {
      type: 'thermal',
      target: rooms,
      parameters: adjustment,
      duration: signal.duration,
    };
  }

  private intentToThermalAdjustment(
    intent: AmbientMessage['intent'],
    sensitivity: number
  ): Record<string, unknown> {
    const adjustments: Record<string, Record<string, unknown>> = {
      presence_arriving: {
        direction: 'warm',
        delta: 0.5 * sensitivity,
        source: 'entrance',
      },
      environment_change: {
        direction: 'preview',
        delta: 0.3 * sensitivity,
        // Preview of outdoor temperature
      },
      consider_action: {
        direction: 'cool',
        delta: 0.2 * sensitivity,
        source: 'window',
        // Hint to go outside
      },
      preparation_ready: {
        direction: 'comfortable',
        delta: 0,
        // Ensure optimal temperature
      },
    };

    return adjustments[intent] || { direction: 'stable', delta: 0 };
  }

  // ============================================================================
  // Acoustic Signals
  // ============================================================================

  private createAcousticOutput(signal: AmbientSignal, rooms: RoomId[]): AmbientOutput {
    const sensitivity = this.config.soundSensitivity;

    const audioParams = this.intentToAudioPattern(signal.message.intent, sensitivity);

    return {
      type: 'acoustic',
      target: rooms,
      parameters: audioParams,
      duration: signal.duration,
    };
  }

  private intentToAudioPattern(
    intent: AmbientMessage['intent'],
    sensitivity: number
  ): Record<string, unknown> {
    const patterns: Record<string, Record<string, unknown>> = {
      presence_arriving: {
        type: 'spatial_tone',
        frequency: 440,
        volume: 15 * sensitivity,
        position: { direction: 'entrance' },
        envelope: 'soft',
      },
      system_processing: {
        type: 'ambient_texture',
        texture: 'soft_hum',
        volume: 5 * sensitivity,
      },
      consider_action: {
        type: 'notification_chime',
        tone: 'gentle',
        volume: 20 * sensitivity,
      },
      attention_needed: {
        type: 'spatial_tone',
        frequency: 523,
        volume: 25 * sensitivity,
        repetitions: 2,
        interval: 1000,
      },
      action_required: {
        type: 'notification_chime',
        tone: 'attention',
        volume: 35 * sensitivity,
        repetitions: 3,
      },
      safety_alert: {
        type: 'alert_tone',
        tone: 'warning',
        volume: 60,
        continuous: true,
      },
      task_complete: {
        type: 'completion_tone',
        tone: 'success',
        volume: 20 * sensitivity,
      },
      preparation_ready: {
        type: 'ready_tone',
        tone: 'prepared',
        volume: 15 * sensitivity,
      },
    };

    return patterns[intent] || { type: 'silence', volume: 0 };
  }

  // ============================================================================
  // Signal Lifecycle
  // ============================================================================

  private completeSignal(signalId: string): void {
    const signal = this.activeSignals.get(signalId);
    if (signal) {
      this.activeSignals.delete(signalId);

      // Restore ambient state
      this.restoreAmbientState(signal);

      // Process queue
      this.processSignalQueue();
    }
  }

  acknowledgeSignal(signalId: string, userId?: UserId): void {
    const signal = this.activeSignals.get(signalId);
    if (signal) {
      signal.acknowledged = true;
      this.emit('signalAcknowledged', signalId, userId);

      // If interruptible, complete early
      if (signal.interruptible) {
        this.completeSignal(signalId);
      }
    }
  }

  private preemptLowestPriority(newSignal: AmbientSignal): void {
    const priorities: SignalPriority[] = ['background', 'subtle', 'gentle', 'attention', 'urgent'];

    let lowestPriority = 5;
    let lowestId: string | null = null;

    for (const [id, signal] of this.activeSignals) {
      const priorityIndex = priorities.indexOf(signal.priority);
      if (priorityIndex < lowestPriority && signal.interruptible) {
        lowestPriority = priorityIndex;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.completeSignal(lowestId);
      this.executeSignal(newSignal);
    }
  }

  private processSignalQueue(): void {
    if (this.signalQueue.length === 0) return;
    if (this.activeSignals.size >= this.config.maxSimultaneousSignals) return;

    const now = Date.now();
    if (now - this.lastSignalTime < this.config.cooldownBetweenSignals) return;

    const nextSignal = this.signalQueue.shift();
    if (nextSignal) {
      this.executeSignal(nextSignal);
    }
  }

  private scheduleQueueProcessing(): void {
    const delay = this.config.cooldownBetweenSignals - (Date.now() - this.lastSignalTime);
    setTimeout(() => this.processSignalQueue(), Math.max(0, delay));
  }

  // ============================================================================
  // Gestural Input Processing
  // ============================================================================

  processGesturalInput(input: GesturalInput): void {
    if (!this.config.enableGesturalRecognition) return;

    // Update user attention based on gesture
    this.updateUserAttention(input);

    // Interpret gesture as interaction
    const interaction = this.interpretGesture(input);
    if (interaction) {
      this.handleGesturalInteraction(interaction);
    }
  }

  private updateUserAttention(input: GesturalInput): void {
    if (!input.userId) return;

    const current = this.userAttention.get(input.userId) || {
      userId: input.userId,
      currentFocus: 'available' as const,
      lastInteraction: new Date(),
      receptiveToSignals: true,
      preferredLevel: 'ambient' as InteractionLevel,
    };

    // Update focus based on gesture
    switch (input.type) {
      case 'sitting_down':
      case 'stationary':
        current.currentFocus = 'available';
        break;
      case 'pacing':
        current.currentFocus = 'occupied';
        break;
      case 'looking_at':
      case 'approaching_device':
        current.currentFocus = 'focused';
        break;
      case 'lying_down':
        current.currentFocus = 'resting';
        current.receptiveToSignals = false;
        break;
    }

    current.lastInteraction = new Date();
    this.userAttention.set(input.userId, current);
    this.emit('userAttentionChanged', input.userId, current);
  }

  private interpretGesture(input: GesturalInput): GesturalInteraction | null {
    switch (input.type) {
      case 'waving':
        return { type: 'attention_request', confidence: input.confidence };

      case 'pointing':
        return {
          type: 'directional_command',
          direction: input.data.direction,
          confidence: input.confidence,
        };

      case 'approaching_device':
        return {
          type: 'device_interest',
          target: input.data.target,
          confidence: input.confidence,
        };

      case 'reaching_toward':
        return {
          type: 'action_intent',
          target: input.data.target,
          confidence: input.confidence,
        };

      default:
        return null;
    }
  }

  private handleGesturalInteraction(interaction: GesturalInteraction): void {
    // Would trigger appropriate automation based on gesture
    console.log('Gestural interaction:', interaction);
  }

  // ============================================================================
  // Room State Management
  // ============================================================================

  private resolveTargetRooms(target: SignalTarget): RoomId[] {
    switch (target.type) {
      case 'room':
        return target.id ? [target.id as RoomId] : [];

      case 'zone':
        // Would resolve zone to rooms
        return [];

      case 'user':
        // Find rooms where user is
        return this.findUserRooms(target.id as UserId);

      case 'house':
        return Array.from(this.roomStates.keys());

      default:
        return [];
    }
  }

  private findUserRooms(userId: UserId): RoomId[] {
    const rooms: RoomId[] = [];
    for (const [roomId, state] of this.roomStates) {
      if (state.occupants.includes(userId)) {
        rooms.push(roomId);
      }
    }
    return rooms;
  }

  private restoreAmbientState(signal: AmbientSignal): void {
    const rooms = this.resolveTargetRooms(signal.target);

    for (const roomId of rooms) {
      const state = this.roomStates.get(roomId);
      if (state) {
        // Restore to baseline ambient state
        // This would gradually transition back
      }
    }
  }

  // ============================================================================
  // Output Execution
  // ============================================================================

  private executeOutput(output: AmbientOutput): void {
    switch (output.type) {
      case 'light':
        this.lightController?.execute(output.target, output.parameters, output.duration);
        break;

      case 'thermal':
        this.thermalController?.execute(output.target, output.parameters, output.duration);
        break;

      case 'acoustic':
        this.audioController?.execute(output.target, output.parameters, output.duration);
        break;
    }
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Signal that someone is approaching
   */
  signalApproaching(userId: UserId, entranceRoom: RoomId): void {
    this.sendSignal({
      type: 'breath_of_light',
      priority: 'subtle',
      message: { intent: 'presence_arriving', content: 'Someone is approaching' },
      target: { type: 'room', id: entranceRoom },
      duration: 5000,
      interruptible: true,
    });
  }

  /**
   * Signal that system is processing
   */
  signalProcessing(rooms: RoomId[]): void {
    for (const room of rooms) {
      this.sendSignal({
        type: 'breath_of_light',
        priority: 'background',
        message: { intent: 'system_processing', content: 'System is thinking' },
        target: { type: 'room', id: room },
        duration: 10000,
        interruptible: true,
      });
    }
  }

  /**
   * Signal task completion
   */
  signalComplete(rooms: RoomId[]): void {
    for (const room of rooms) {
      this.sendSignal({
        type: 'breath_of_light',
        priority: 'subtle',
        message: { intent: 'task_complete', content: 'Task completed' },
        target: { type: 'room', id: room },
        duration: 2000,
        interruptible: true,
      });
    }
  }

  /**
   * Gentle suggestion signal
   */
  signalSuggestion(userId: UserId, suggestion: string): void {
    this.sendSignal({
      type: 'breath_of_light',
      priority: 'gentle',
      message: { intent: 'consider_action', content: suggestion },
      target: { type: 'user', id: userId },
      duration: 5000,
      interruptible: true,
    });
  }

  /**
   * Attention needed signal
   */
  signalAttention(userId: UserId, reason: string): void {
    this.sendSignal({
      type: 'acoustic_presence',
      priority: 'attention',
      message: { intent: 'attention_needed', content: reason },
      target: { type: 'user', id: userId },
      duration: 3000,
      interruptible: false,
    });
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<AmbientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setLightController(controller: LightControllerInterface): void {
    this.lightController = controller;
  }

  setThermalController(controller: ThermalControllerInterface): void {
    this.thermalController = controller;
  }

  setAudioController(controller: AudioControllerInterface): void {
    this.audioController = controller;
  }

  // ============================================================================
  // Public State Access
  // ============================================================================

  getActiveSignals(): AmbientSignal[] {
    return Array.from(this.activeSignals.values());
  }

  getUserAttention(userId: UserId): AttentionState | undefined {
    return this.userAttention.get(userId);
  }

  getRoomState(roomId: RoomId): RoomAmbienceState | undefined {
    return this.roomStates.get(roomId);
  }
}

// ============================================================================
// Controller Interfaces
// ============================================================================

interface LightControllerInterface {
  execute(rooms: RoomId[], params: Record<string, unknown>, duration: number): void;
}

interface ThermalControllerInterface {
  execute(rooms: RoomId[], params: Record<string, unknown>, duration: number): void;
}

interface AudioControllerInterface {
  execute(rooms: RoomId[], params: Record<string, unknown>, duration: number): void;
}

interface GesturalInteraction {
  type: string;
  confidence: number;
  direction?: { x: number; y: number; z: number };
  target?: DeviceId | RoomId;
}

export default AmbientController;
