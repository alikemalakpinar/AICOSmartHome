/**
 * AICO Smart Home - Ambient Interaction Types
 *
 * Non-screen based communication through light, sound,
 * temperature, and spatial awareness.
 */

import type { RoomId, UserId, DeviceId } from '@/types/core';

// ============================================================================
// Interaction Hierarchy
// ============================================================================

/**
 * The screen is a failure state. Every level above touch
 * represents a more elegant form of communication.
 */
export type InteractionLevel =
  | 'invisible'    // Level 0: System acts, user unaware
  | 'ambient'      // Level 1: Light/sound/temperature signals
  | 'gestural'     // Level 2: Spatial awareness, body language
  | 'voice'        // Level 3: Natural conversation
  | 'touch';       // Level 4: Explicit interaction (FALLBACK)

// ============================================================================
// Ambient Signals
// ============================================================================

export interface AmbientSignal {
  id: string;
  type: AmbientSignalType;
  priority: SignalPriority;
  message: AmbientMessage;
  target: SignalTarget;
  duration: number;           // Milliseconds
  interruptible: boolean;
  acknowledged?: boolean;
}

export type AmbientSignalType =
  | 'breath_of_light'         // Subtle light color/intensity changes
  | 'thermal_whisper'         // Micro temperature adjustments
  | 'acoustic_presence'       // Spatial sound cues
  | 'haptic_pulse'            // Tactile feedback (if available)
  | 'scent_note';             // Fragrance diffusion

export type SignalPriority =
  | 'background'              // User may not notice
  | 'subtle'                  // Noticeable if attentive
  | 'gentle'                  // Should be noticed
  | 'attention'               // Requires acknowledgment
  | 'urgent';                 // Cannot be ignored

export interface AmbientMessage {
  intent: MessageIntent;
  content: string;            // Human-readable description
  data?: Record<string, unknown>;
}

export type MessageIntent =
  // Informational
  | 'presence_arriving'       // Someone approaching
  | 'presence_departing'      // Someone leaving
  | 'system_processing'       // System is thinking
  | 'task_complete'           // Automation finished
  | 'environment_change'      // Weather, external change

  // Suggestions
  | 'consider_action'         // Gentle suggestion
  | 'opportunity_available'   // Time-limited option
  | 'preparation_ready'       // Something is prepared

  // Alerts
  | 'attention_needed'        // Requires awareness
  | 'action_required'         // Requires response
  | 'safety_alert';           // Safety-critical

export interface SignalTarget {
  type: 'room' | 'zone' | 'user' | 'house';
  id?: RoomId | UserId;
  direction?: SpatialDirection;  // For directional signals
}

export type SpatialDirection =
  | 'entrance'
  | 'window'
  | 'ceiling'
  | 'floor'
  | 'north' | 'south' | 'east' | 'west';

// ============================================================================
// Breath of Light
// ============================================================================

export interface BreathOfLight {
  pattern: LightPattern;
  colorTransition: ColorTransition;
  intensityRange: [number, number];  // 0-100
  duration: number;
  rooms: RoomId[];
}

export type LightPattern =
  | 'steady'                  // No change
  | 'slow_pulse'              // Very slow breathing (30s cycle)
  | 'gentle_pulse'            // Gentle breathing (10s cycle)
  | 'soft_wave'               // Wave moving through space
  | 'gradual_shift'           // Slow transition
  | 'attention_blink';        // Single subtle blink

export interface ColorTransition {
  from: LightColor;
  to: LightColor;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface LightColor {
  temperature?: number;       // Kelvin (2700-6500)
  rgb?: { r: number; g: number; b: number };
  saturation?: number;        // 0-100
}

export const LIGHT_MEANINGS: Record<string, Partial<BreathOfLight>> = {
  // Presence signals
  approaching_warm: {
    pattern: 'gentle_pulse',
    colorTransition: { from: { temperature: 4000 }, to: { temperature: 3200 }, easing: 'ease-out' },
  },
  departing_cool: {
    pattern: 'gradual_shift',
    colorTransition: { from: { temperature: 4000 }, to: { temperature: 5000 }, easing: 'ease-in' },
  },

  // Status signals
  processing: {
    pattern: 'slow_pulse',
    colorTransition: { from: { temperature: 4000 }, to: { temperature: 4200 }, easing: 'ease-in-out' },
  },
  ready: {
    pattern: 'steady',
    colorTransition: { from: { temperature: 3800 }, to: { temperature: 3800 }, easing: 'linear' },
  },

  // Weather signals
  sunny_outside: {
    pattern: 'steady',
    colorTransition: { from: { temperature: 5500 }, to: { temperature: 5500 }, easing: 'linear' },
  },
  cold_outside: {
    pattern: 'gradual_shift',
    colorTransition: { from: { temperature: 3000 }, to: { temperature: 2700 }, easing: 'ease-out' },
  },
};

// ============================================================================
// Thermal Whispers
// ============================================================================

export interface ThermalWhisper {
  zone: RoomId;
  adjustment: number;         // Degrees delta (typically -1 to +1)
  duration: number;           // Seconds
  source?: SpatialDirection;  // Where the "breeze" comes from
  meaning: ThermalMeaning;
}

export type ThermalMeaning =
  | 'weather_preview'         // Hint about outdoor conditions
  | 'activity_suggestion'     // Maybe time to go outside
  | 'comfort_adjustment'      // Automatic comfort tuning
  | 'energy_signal'           // System is optimizing
  | 'presence_announcement';  // Someone at an entrance

// ============================================================================
// Acoustic Presence
// ============================================================================

export interface AcousticSignal {
  type: AcousticType;
  volume: number;             // 0-100 (relative to ambient)
  position?: SpatialPosition;
  movement?: SpatialMovement;
  duration: number;
}

export type AcousticType =
  | 'spatial_tone'            // Positioned sound
  | 'ambient_texture'         // Background texture change
  | 'rhythmic_pulse'          // Gentle rhythmic element
  | 'silence_emphasis'        // Deliberate quieting
  | 'notification_chime';     // Subtle notification

export interface SpatialPosition {
  room: RoomId;
  x: number;                  // -1 to 1 (left to right)
  y: number;                  // -1 to 1 (back to front)
  z: number;                  // -1 to 1 (floor to ceiling)
}

export interface SpatialMovement {
  from: SpatialPosition;
  to: SpatialPosition;
  duration: number;
}

export const ACOUSTIC_MEANINGS: Record<string, Partial<AcousticSignal>> = {
  attention_gentle: {
    type: 'spatial_tone',
    volume: 20,
    duration: 500,
  },
  processing_ambient: {
    type: 'ambient_texture',
    volume: 10,
    duration: 5000,
  },
  direction_hint: {
    type: 'spatial_tone',
    volume: 15,
    duration: 300,
  },
  silence_for_rest: {
    type: 'silence_emphasis',
    volume: 0,
    duration: 0, // Infinite until changed
  },
};

// ============================================================================
// Gestural Recognition
// ============================================================================

export interface GesturalInput {
  type: GestureType;
  userId?: UserId;
  room: RoomId;
  timestamp: Date;
  confidence: number;
  data: GestureData;
}

export type GestureType =
  // Presence gestures
  | 'entering_room'
  | 'leaving_room'
  | 'approaching_device'
  | 'moving_away'

  // Intent gestures
  | 'looking_at'              // Gaze direction
  | 'reaching_toward'         // Reaching motion
  | 'waving'                  // Attention signal
  | 'pointing'                // Directional intent

  // State gestures
  | 'sitting_down'
  | 'standing_up'
  | 'lying_down'
  | 'pacing'
  | 'stationary';

export interface GestureData {
  position?: { x: number; y: number; z: number };
  direction?: { x: number; y: number; z: number };
  velocity?: number;
  target?: DeviceId | RoomId;
}

// ============================================================================
// Ambient Interaction State
// ============================================================================

export interface AmbientInteractionState {
  // Active signals
  activeSignals: AmbientSignal[];

  // Signal history (for pattern learning)
  signalHistory: AmbientSignalRecord[];

  // User attention state
  userAttention: Map<UserId, AttentionState>;

  // Room states
  roomAmbience: Map<RoomId, RoomAmbienceState>;

  // Configuration
  config: AmbientConfig;
}

export interface AmbientSignalRecord {
  signal: AmbientSignal;
  sentAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  userResponse?: 'noticed' | 'acted' | 'ignored';
}

export interface AttentionState {
  userId: UserId;
  currentFocus: 'available' | 'occupied' | 'focused' | 'resting';
  lastInteraction: Date;
  receptiveToSignals: boolean;
  preferredLevel: InteractionLevel;
}

export interface RoomAmbienceState {
  roomId: RoomId;
  currentLighting: BreathOfLight | null;
  currentThermal: ThermalWhisper | null;
  currentAcoustic: AcousticSignal | null;
  occupants: UserId[];
  activityLevel: 'empty' | 'low' | 'moderate' | 'high';
}

export interface AmbientConfig {
  // Signal preferences
  enabledTypes: AmbientSignalType[];
  maxSimultaneousSignals: number;
  cooldownBetweenSignals: number;  // Milliseconds

  // Sensitivity
  lightSensitivity: number;        // 0-1, how subtle the lights are
  soundSensitivity: number;        // 0-1, how quiet the sounds are
  thermalSensitivity: number;      // 0-1, how small temp changes are

  // Privacy
  enableGesturalRecognition: boolean;
  enableVoiceActivation: boolean;

  // Fallback
  fallbackToScreenAfter: number;   // Seconds before offering screen interaction
}

export default AmbientInteractionState;
