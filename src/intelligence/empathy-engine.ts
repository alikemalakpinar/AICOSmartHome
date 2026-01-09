/**
 * AICO - Empathy Engine
 *
 * "The house doesn't fight your emotions.
 *  It validates, then gently guides."
 *
 * This engine implements Architectural Empathy:
 * - Mirroring: The house reflects the occupant's emotional state
 * - Validation: A "happy" house during grief is offensive
 * - Guidance: Imperceptibly shifting toward well-being over time
 */

import { create } from 'zustand';
import type {
  EmotionalMirror,
  EmotionalState,
  BioFeedbackArchitecture,
  AtmosphericEnvelope,
} from '../core/philosophy';

// ============================================================================
// Emotional Atmosphere Mappings
// ============================================================================

/**
 * How each emotional state maps to atmospheric qualities.
 * Used for both mirroring and guidance.
 */
const EMOTIONAL_ATMOSPHERES: Record<EmotionalState['primary'], Partial<AtmosphericEnvelope>> = {
  // Positive states
  joy: {
    light: { colorTemperature: 4500, intensity: 0.85, direction: 'diffuse' },
    sound: { ambientLevel: 40, musicPresence: 0.4, frequencyBalance: 'neutral' },
    visual: { movement: 0.3, nature: 0.5 },
    temporal: { pace: 'energized' },
  },
  contentment: {
    light: { colorTemperature: 3200, intensity: 0.6 },
    sound: { ambientLevel: 32, musicPresence: 0.2 },
    visual: { clutter: 0.2, movement: 0.1 },
    temporal: { pace: 'slow' },
  },
  excitement: {
    light: { colorTemperature: 5000, intensity: 0.9 },
    sound: { ambientLevel: 45, musicPresence: 0.5 },
    visual: { movement: 0.4 },
    temporal: { pace: 'energized', urgency: 0.3 },
  },

  // Calm states
  calm: {
    light: { colorTemperature: 2800, intensity: 0.5 },
    sound: { ambientLevel: 28, maskingNoise: 'pink' },
    air: { humidity: 50 },
    temporal: { pace: 'slow', urgency: 0 },
  },
  focus: {
    light: { colorTemperature: 5500, intensity: 0.75 },
    sound: { ambientLevel: 25, maskingNoise: 'brown' },
    air: { oxygenEnrichment: 2 },
    temporal: { pace: 'suspended', continuity: 0 },
  },
  flow: {
    light: { colorTemperature: 4000, intensity: 0.7 },
    sound: { ambientLevel: 28 },
    temporal: { pace: 'suspended' },
  },

  // Grief/Sadness states - the house holds space
  sadness: {
    light: { colorTemperature: 2400, intensity: 0.35 },
    sound: { ambientLevel: 25, frequencyBalance: 'bass-warm' },
    visual: { movement: 0, clutter: 0.1 },
    temporal: { pace: 'slow', continuity: 0.8 },
  },
  grief: {
    light: { colorTemperature: 2200, intensity: 0.25 },
    sound: { ambientLevel: 22, maskingNoise: 'brown' },
    visual: { movement: 0, transparency: 0.3 },
    temporal: { pace: 'suspended' },
  },
  melancholy: {
    light: { colorTemperature: 2600, intensity: 0.4 },
    sound: { ambientLevel: 28, musicPresence: 0.1 },
    temporal: { pace: 'slow' },
  },

  // Anxious states - create safety
  anxiety: {
    light: { colorTemperature: 2800, intensity: 0.45 },
    sound: { ambientLevel: 30, maskingNoise: 'pink' },
    air: { humidity: 48 },
    visual: { movement: 0, clutter: 0.1 },
    temporal: { pace: 'slow', urgency: 0 },
  },
  stress: {
    light: { colorTemperature: 3000, intensity: 0.5 },
    sound: { ambientLevel: 32, maskingNoise: 'pink' },
    temporal: { urgency: 0 },
  },
  overwhelm: {
    light: { colorTemperature: 2600, intensity: 0.35 },
    sound: { ambientLevel: 25, maskingNoise: 'brown' },
    visual: { movement: 0, clutter: 0, transparency: 0.2 },
    temporal: { pace: 'suspended', urgency: 0 },
  },

  // Anger states - the "Library Effect"
  anger: {
    sound: { ambientLevel: 25, frequencyBalance: 'bass-warm' },  // Acoustic deadening
    visual: { transparency: 0.3 },
    temporal: { pace: 'slow' },
  },
  frustration: {
    sound: { ambientLevel: 28 },
    light: { colorTemperature: 3000, intensity: 0.5 },
    temporal: { urgency: 0 },
  },
  irritation: {
    light: { colorTemperature: 3200, intensity: 0.55 },
    sound: { ambientLevel: 30 },
  },

  // Neutral
  neutral: {
    light: { colorTemperature: 3500, intensity: 0.6 },
    sound: { ambientLevel: 35, musicPresence: 0.1 },
    temporal: { pace: 'normal' },
  },
};

/**
 * Target states for guidance - where we're guiding toward.
 * Some emotions guide toward neutral, others toward positive.
 */
const GUIDANCE_TARGETS: Partial<Record<EmotionalState['primary'], EmotionalState['primary']>> = {
  sadness: 'melancholy',          // Don't force happiness, just ease
  grief: 'sadness',               // Gentle steps
  anxiety: 'calm',
  stress: 'calm',
  overwhelm: 'calm',
  anger: 'frustration',           // De-escalate gradually
  frustration: 'neutral',
  irritation: 'neutral',
  melancholy: 'contentment',      // Over longer time
};

// ============================================================================
// Empathy State
// ============================================================================

interface EmpathyState {
  // Per-occupant emotional mirrors
  emotionalMirrors: Map<string, EmotionalMirror>;

  // Household-level emotional field
  householdEmotion: {
    dominantState: EmotionalState;
    harmony: number;              // -1 (conflict) to 1 (harmony)
    tension: number;              // 0 to 1
  };

  // Bio-feedback architecture state
  bioFeedback: BioFeedbackArchitecture;

  // Guidance timelines (per occupant)
  guidanceTimelines: Map<string, GuidanceTimeline>;
}

interface GuidanceTimeline {
  occupantId: string;
  startedAt: number;
  startState: EmotionalState;
  targetState: EmotionalState;
  totalDurationMinutes: number;
  currentProgress: number;        // 0-1
  checkpoints: Array<{
    progress: number;
    atmosphereSnapshot: Partial<AtmosphericEnvelope>;
  }>;
}

// ============================================================================
// Empathy Engine Store
// ============================================================================

export const useEmpathyStore = create<EmpathyState & {
  // Actions
  updateEmotionalReading: (occupantId: string, state: EmotionalState) => void;
  calculateMirrorResponse: (occupantId: string) => Partial<AtmosphericEnvelope>;
  startGuidance: (occupantId: string) => void;
  advanceGuidance: (occupantId: string, deltaMinutes: number) => void;
  detectConflict: () => boolean;
  applyLibraryEffect: (roomIds: string[]) => void;
  getHouseholdAtmosphere: () => Partial<AtmosphericEnvelope>;
  updateBioFeedback: () => void;
}>((set, get) => ({
  emotionalMirrors: new Map(),
  householdEmotion: {
    dominantState: {
      primary: 'neutral',
      intensity: 0.5,
      stability: 0.8,
      socialHarmony: 0.5,
      isolationDesire: 0.3,
    },
    harmony: 0.5,
    tension: 0,
  },
  bioFeedback: {
    wallOpacity: new Map(),
    acousticDampening: {
      active: false,
      zones: [],
      reason: 'conflict_detected',
    },
    surfaceState: new Map(),
  },
  guidanceTimelines: new Map(),

  updateEmotionalReading: (occupantId, state) => {
    const { emotionalMirrors, householdEmotion } = get();

    const currentMirror = emotionalMirrors.get(occupantId);

    // Determine mirror phase
    const phase = determineMirrorPhase(state, currentMirror);

    // Calculate target state for guidance
    const targetState = GUIDANCE_TARGETS[state.primary]
      ? { ...state, primary: GUIDANCE_TARGETS[state.primary]! }
      : null;

    // Build guidance curve if needed
    const guidanceCurve = targetState
      ? buildGuidanceCurve(state, targetState)
      : [];

    const newMirror: EmotionalMirror = {
      detectedState: state,
      mirrorResponse: {
        phase,
        intensity: calculateMirrorIntensity(state, phase),
        targetState,
      },
      guidanceCurve,
    };

    // Update household emotion
    const allStates = Array.from(emotionalMirrors.values()).map(m => m.detectedState);
    allStates.push(state);
    const newHouseholdEmotion = calculateHouseholdEmotion(allStates);

    set(s => ({
      emotionalMirrors: new Map(s.emotionalMirrors).set(occupantId, newMirror),
      householdEmotion: newHouseholdEmotion,
    }));
  },

  calculateMirrorResponse: (occupantId) => {
    const mirror = get().emotionalMirrors.get(occupantId);
    if (!mirror) return {};

    const { phase, intensity, targetState } = mirror.mirrorResponse;
    const currentAtmosphere = EMOTIONAL_ATMOSPHERES[mirror.detectedState.primary];

    switch (phase) {
      case 'validation':
        // Fully mirror the emotional state
        return scaleAtmosphere(currentAtmosphere, intensity);

      case 'holding':
        // Maintain the mirrored state, stable
        return scaleAtmosphere(currentAtmosphere, intensity * 0.9);

      case 'guidance':
        // Interpolate toward target
        if (!targetState) return currentAtmosphere;
        const targetAtmosphere = EMOTIONAL_ATMOSPHERES[targetState.primary];
        const progress = mirror.guidanceCurve[0]?.progress || 0;
        return interpolateAtmosphere(currentAtmosphere, targetAtmosphere, progress);

      case 'neutral':
      default:
        return EMOTIONAL_ATMOSPHERES.neutral;
    }
  },

  startGuidance: (occupantId) => {
    const mirror = get().emotionalMirrors.get(occupantId);
    if (!mirror || !mirror.mirrorResponse.targetState) return;

    const duration = getGuidanceDuration(
      mirror.detectedState.primary,
      mirror.mirrorResponse.targetState.primary
    );

    const timeline: GuidanceTimeline = {
      occupantId,
      startedAt: Date.now(),
      startState: mirror.detectedState,
      targetState: mirror.mirrorResponse.targetState,
      totalDurationMinutes: duration,
      currentProgress: 0,
      checkpoints: generateCheckpoints(
        mirror.detectedState,
        mirror.mirrorResponse.targetState,
        duration
      ),
    };

    set(s => ({
      guidanceTimelines: new Map(s.guidanceTimelines).set(occupantId, timeline),
    }));
  },

  advanceGuidance: (occupantId, deltaMinutes) => {
    set(state => {
      const timeline = state.guidanceTimelines.get(occupantId);
      if (!timeline) return state;

      const newProgress = Math.min(
        1,
        timeline.currentProgress + deltaMinutes / timeline.totalDurationMinutes
      );

      if (newProgress >= 1) {
        // Guidance complete
        const timelines = new Map(state.guidanceTimelines);
        timelines.delete(occupantId);
        return { guidanceTimelines: timelines };
      }

      return {
        guidanceTimelines: new Map(state.guidanceTimelines).set(occupantId, {
          ...timeline,
          currentProgress: newProgress,
        }),
      };
    });
  },

  detectConflict: () => {
    const { householdEmotion, emotionalMirrors } = get();

    // Check for tension indicators
    if (householdEmotion.tension > 0.6) return true;
    if (householdEmotion.harmony < -0.3) return true;

    // Check for anger in any occupant
    for (const mirror of emotionalMirrors.values()) {
      if (
        mirror.detectedState.primary === 'anger' &&
        mirror.detectedState.intensity > 0.6
      ) {
        return true;
      }
    }

    return false;
  },

  applyLibraryEffect: (roomIds) => {
    // Activate acoustic dampening in specified rooms
    set(state => ({
      bioFeedback: {
        ...state.bioFeedback,
        acousticDampening: {
          active: true,
          zones: roomIds,
          reason: 'conflict_detected',
        },
      },
    }));

    // Auto-deactivate after 30 minutes
    setTimeout(() => {
      set(state => ({
        bioFeedback: {
          ...state.bioFeedback,
          acousticDampening: {
            active: false,
            zones: [],
            reason: 'conflict_detected',
          },
        },
      }));
    }, 30 * 60 * 1000);
  },

  getHouseholdAtmosphere: () => {
    const { householdEmotion, emotionalMirrors, guidanceTimelines } = get();

    // Start with dominant emotion atmosphere
    let atmosphere = { ...EMOTIONAL_ATMOSPHERES[householdEmotion.dominantState.primary] };

    // Blend in active guidance influences
    for (const timeline of guidanceTimelines.values()) {
      const checkpoint = timeline.checkpoints.find(
        c => c.progress >= timeline.currentProgress
      );
      if (checkpoint) {
        atmosphere = blendAtmospheres(atmosphere, checkpoint.atmosphereSnapshot, 0.3);
      }
    }

    // Apply tension modulation
    if (householdEmotion.tension > 0.3) {
      // Reduce stimulation during tension
      atmosphere = {
        ...atmosphere,
        sound: {
          ...atmosphere.sound,
          ambientLevel: Math.min(30, atmosphere.sound?.ambientLevel || 35),
          musicPresence: 0,
        },
        visual: {
          ...atmosphere.visual,
          movement: 0,
        },
      };
    }

    return atmosphere;
  },

  updateBioFeedback: () => {
    const { householdEmotion, detectConflict } = get();

    // Update wall opacity based on isolation desire
    const wallOpacity = new Map<string, number>();
    // Higher isolation desire = more opaque walls
    const baseOpacity = 0.3 + householdEmotion.dominantState.isolationDesire * 0.5;

    // Surface state based on emotional temperature
    const surfaceState = new Map<string, 'soft' | 'neutral' | 'crisp'>();
    const emotionalTemp = getEmotionalTemperature(householdEmotion.dominantState.primary);
    const surfaceType = emotionalTemp < 0 ? 'soft' : emotionalTemp > 0 ? 'crisp' : 'neutral';

    set(state => ({
      bioFeedback: {
        ...state.bioFeedback,
        wallOpacity,
        surfaceState,
      },
    }));
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

function determineMirrorPhase(
  state: EmotionalState,
  currentMirror: EmotionalMirror | undefined
): EmotionalMirror['mirrorResponse']['phase'] {
  // New emotional reading without prior mirror
  if (!currentMirror) {
    return state.intensity > 0.5 ? 'validation' : 'neutral';
  }

  const previousPhase = currentMirror.mirrorResponse.phase;
  const stateChanged = state.primary !== currentMirror.detectedState.primary;

  // State changed - restart validation
  if (stateChanged) return 'validation';

  // Progress through phases
  switch (previousPhase) {
    case 'validation':
      // After validation, hold for a while
      return state.stability > 0.7 ? 'holding' : 'validation';
    case 'holding':
      // After holding, begin guidance if needed
      return GUIDANCE_TARGETS[state.primary] ? 'guidance' : 'holding';
    case 'guidance':
      // Continue guidance until complete
      return 'guidance';
    default:
      return 'neutral';
  }
}

function calculateMirrorIntensity(
  state: EmotionalState,
  phase: EmotionalMirror['mirrorResponse']['phase']
): number {
  // Validation phase mirrors strongly
  if (phase === 'validation') return state.intensity * 0.9;

  // Holding maintains but softens
  if (phase === 'holding') return state.intensity * 0.7;

  // Guidance fades the mirror
  if (phase === 'guidance') return state.intensity * 0.4;

  return 0.5;
}

function buildGuidanceCurve(
  from: EmotionalState,
  to: EmotionalState
): EmotionalMirror['guidanceCurve'] {
  const duration = getGuidanceDuration(from.primary, to.primary);
  const steps = 10;

  const curve: EmotionalMirror['guidanceCurve'] = [];

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    // Ease-out curve - faster at start, slower at end
    const eased = 1 - Math.pow(1 - progress, 2);

    const fromAtmo = EMOTIONAL_ATMOSPHERES[from.primary];
    const toAtmo = EMOTIONAL_ATMOSPHERES[to.primary];

    curve.push({
      hoursFromNow: (duration / 60) * progress,
      targetAtmosphere: interpolateAtmosphere(fromAtmo, toAtmo, eased),
    });
  }

  return curve;
}

function getGuidanceDuration(
  from: EmotionalState['primary'],
  to: EmotionalState['primary']
): number {
  // Duration in minutes based on emotional distance
  const heavyStates = ['grief', 'anger', 'overwhelm'];
  const isHeavy = heavyStates.includes(from);

  // Heavy states need longer guidance
  if (isHeavy) return 180; // 3 hours

  // Moderate states
  if (from === 'sadness' || from === 'anxiety' || from === 'stress') return 90;

  // Light states
  return 30;
}

function generateCheckpoints(
  from: EmotionalState,
  to: EmotionalState,
  durationMinutes: number
): GuidanceTimeline['checkpoints'] {
  const checkpoints: GuidanceTimeline['checkpoints'] = [];
  const steps = 5;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const fromAtmo = EMOTIONAL_ATMOSPHERES[from.primary];
    const toAtmo = EMOTIONAL_ATMOSPHERES[to.primary];

    checkpoints.push({
      progress,
      atmosphereSnapshot: interpolateAtmosphere(fromAtmo, toAtmo, progress),
    });
  }

  return checkpoints;
}

function calculateHouseholdEmotion(
  states: EmotionalState[]
): EmpathyState['householdEmotion'] {
  if (states.length === 0) {
    return {
      dominantState: { primary: 'neutral', intensity: 0.5, stability: 1, socialHarmony: 0.5, isolationDesire: 0.3 },
      harmony: 0.5,
      tension: 0,
    };
  }

  // Find dominant state (highest intensity)
  const dominant = states.reduce((prev, curr) =>
    curr.intensity > prev.intensity ? curr : prev
  );

  // Calculate harmony (are emotions aligned?)
  const primaryTypes = new Set(states.map(s => s.primary));
  const alignment = 1 - (primaryTypes.size - 1) / states.length;

  // Calculate tension
  const negativeEmotions = ['anger', 'frustration', 'anxiety', 'stress', 'overwhelm'];
  const negativeCount = states.filter(s => negativeEmotions.includes(s.primary)).length;
  const tension = negativeCount / states.length;

  // Check for conflict (opposing emotions)
  const hasConflict = states.some(s => s.primary === 'anger') &&
    states.some(s => s.primary === 'sadness' || s.primary === 'anxiety');

  return {
    dominantState: dominant,
    harmony: hasConflict ? -0.5 : alignment - 0.5,
    tension,
  };
}

function getEmotionalTemperature(primary: EmotionalState['primary']): number {
  const temps: Record<EmotionalState['primary'], number> = {
    joy: 1, excitement: 1, anger: 0.8,
    contentment: 0.3, focus: 0, flow: 0.2,
    calm: -0.2, neutral: 0,
    frustration: 0.5, irritation: 0.3,
    sadness: -0.5, melancholy: -0.3, grief: -0.8,
    anxiety: -0.4, stress: -0.2, overwhelm: -0.6,
  };
  return temps[primary] ?? 0;
}

function scaleAtmosphere(
  atmosphere: Partial<AtmosphericEnvelope>,
  scale: number
): Partial<AtmosphericEnvelope> {
  // Scale intensity-related values
  return {
    ...atmosphere,
    light: atmosphere.light ? {
      ...atmosphere.light,
      intensity: (atmosphere.light.intensity || 0.5) * scale,
    } : undefined,
    sound: atmosphere.sound ? {
      ...atmosphere.sound,
      musicPresence: (atmosphere.sound.musicPresence || 0) * scale,
    } : undefined,
  };
}

function interpolateAtmosphere(
  from: Partial<AtmosphericEnvelope>,
  to: Partial<AtmosphericEnvelope>,
  t: number
): Partial<AtmosphericEnvelope> {
  const lerp = (a: number | undefined, b: number | undefined, t: number): number => {
    if (a === undefined) return b ?? 0;
    if (b === undefined) return a;
    return a + (b - a) * t;
  };

  return {
    light: from.light || to.light ? {
      colorTemperature: lerp(from.light?.colorTemperature, to.light?.colorTemperature, t),
      intensity: lerp(from.light?.intensity, to.light?.intensity, t),
      spectrum: [],
      direction: t < 0.5 ? from.light?.direction : to.light?.direction,
      circadianPhase: lerp(from.light?.circadianPhase, to.light?.circadianPhase, t),
    } : undefined,
    sound: from.sound || to.sound ? {
      ambientLevel: lerp(from.sound?.ambientLevel, to.sound?.ambientLevel, t),
      frequencyBalance: t < 0.5 ? from.sound?.frequencyBalance : to.sound?.frequencyBalance,
      spatialWidth: lerp(from.sound?.spatialWidth, to.sound?.spatialWidth, t),
      maskingNoise: t < 0.5 ? from.sound?.maskingNoise : to.sound?.maskingNoise,
      musicPresence: lerp(from.sound?.musicPresence, to.sound?.musicPresence, t),
    } : undefined,
    temporal: from.temporal || to.temporal ? {
      pace: t < 0.5 ? from.temporal?.pace : to.temporal?.pace,
      urgency: lerp(from.temporal?.urgency, to.temporal?.urgency, t),
      continuity: lerp(from.temporal?.continuity, to.temporal?.continuity, t),
    } : undefined,
  };
}

function blendAtmospheres(
  base: Partial<AtmosphericEnvelope>,
  overlay: Partial<AtmosphericEnvelope>,
  overlayWeight: number
): Partial<AtmosphericEnvelope> {
  return interpolateAtmosphere(base, overlay, overlayWeight);
}

// ============================================================================
// Exports
// ============================================================================

export { EMOTIONAL_ATMOSPHERES, GUIDANCE_TARGETS };
export type { GuidanceTimeline };
