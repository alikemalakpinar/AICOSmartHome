/**
 * AICO - Narrative Engine
 *
 * "A day has a shape. The house understands arcs, not triggers."
 *
 * This engine orchestrates atmospheric changes over time,
 * understanding that life unfolds as narrative arcs with
 * anticipation, crescendo, and denouement.
 */

import { create } from 'zustand';
import type {
  NarrativeArc,
  NarrativePhase,
  RegretPrevention,
  BufferedAction,
  AtmosphericEnvelope,
} from '../core/philosophy';

// ============================================================================
// Narrative Arc Definitions
// ============================================================================

/**
 * Pre-defined narrative arcs that the house can recognize and orchestrate.
 */
const NARRATIVE_LIBRARY: Record<string, Omit<NarrativeArc, 'currentPhase' | 'phaseProgress' | 'confidence'>> = {
  dinner_party: {
    id: 'dinner_party',
    name: 'Evening Gathering',
    phases: [
      {
        name: 'Anticipation',
        durationMinutes: 120,     // 2 hours before
        atmosphericTarget: {
          thermal: { airTemperature: 21, radiativeBalance: -5 }, // Slightly cool, anticipating body heat
          light: { colorTemperature: 3200, intensity: 0.6 },
          sound: { ambientLevel: 32, musicPresence: 0.2 },
        },
        transitionCurve: 'ease-in',
      },
      {
        name: 'Arrival',
        durationMinutes: 30,
        atmosphericTarget: {
          light: { colorTemperature: 3000, intensity: 0.7, direction: 'focused' },
          sound: { ambientLevel: 38, musicPresence: 0.4 },
          visual: { movement: 0.2 },
        },
        transitionCurve: 'ease-out',
      },
      {
        name: 'Crescendo',
        durationMinutes: 180,     // Main event
        atmosphericTarget: {
          light: { colorTemperature: 2700, intensity: 0.65 },  // Flattering to food and skin
          sound: { ambientLevel: 45, musicPresence: 0.3, frequencyBalance: 'bass-warm' },
          air: { humidity: 48 },
        },
        transitionCurve: 'ease-in-out',
      },
      {
        name: 'Denouement',
        durationMinutes: 60,
        atmosphericTarget: {
          light: { colorTemperature: 2400, intensity: 0.4 },
          sound: { ambientLevel: 35, musicPresence: 0.15 },
          temporal: { pace: 'slow' },
        },
        transitionCurve: 'ease-out',
      },
      {
        name: 'Closure',
        durationMinutes: 30,
        atmosphericTarget: {
          light: { colorTemperature: 2200, intensity: 0.3 },
          sound: { musicPresence: 0.05 },
        },
        transitionCurve: 'linear',
      },
    ],
    interruptibleBy: ['emergency', 'sleep_urgent'],
  },

  deep_work: {
    id: 'deep_work',
    name: 'Deep Focus Session',
    phases: [
      {
        name: 'Entry',
        durationMinutes: 15,
        atmosphericTarget: {
          sound: { ambientLevel: 28, maskingNoise: 'brown' },
          light: { colorTemperature: 5000, intensity: 0.8 },
          air: { oxygenEnrichment: 2 },
          temporal: { urgency: 0 },
        },
        transitionCurve: 'ease-in',
      },
      {
        name: 'Immersion',
        durationMinutes: 90,
        atmosphericTarget: {
          sound: { ambientLevel: 25, maskingNoise: 'brown' },
          temporal: { pace: 'suspended', continuity: 0 },
        },
        transitionCurve: 'ease-in-out',
      },
      {
        name: 'Emergence',
        durationMinutes: 15,
        atmosphericTarget: {
          sound: { maskingNoise: 'none', musicPresence: 0.1 },
          light: { colorTemperature: 4500, intensity: 0.7 },
          temporal: { pace: 'slow' },
        },
        transitionCurve: 'ease-out',
      },
    ],
    interruptibleBy: ['emergency', 'human_urgent'],
  },

  morning_awakening: {
    id: 'morning_awakening',
    name: 'Morning Emergence',
    phases: [
      {
        name: 'Pre-Dawn',
        durationMinutes: 30,
        atmosphericTarget: {
          light: { colorTemperature: 2000, intensity: 0.05, circadianPhase: 5 },
          sound: { ambientLevel: 20 },
          thermal: { airTemperature: 20 },
        },
        transitionCurve: 'anticipate',
      },
      {
        name: 'First Light',
        durationMinutes: 20,
        atmosphericTarget: {
          light: { colorTemperature: 3000, intensity: 0.3, circadianPhase: 6 },
          sound: { ambientLevel: 28, maskingNoise: 'natural' },
          thermal: { airTemperature: 21, floorTemperature: 26 },
        },
        transitionCurve: 'ease-in',
      },
      {
        name: 'Activation',
        durationMinutes: 30,
        atmosphericTarget: {
          light: { colorTemperature: 5500, intensity: 0.8, circadianPhase: 8 },
          air: { oxygenEnrichment: 3 },
          temporal: { pace: 'energized' },
        },
        transitionCurve: 'ease-out',
      },
    ],
    interruptibleBy: ['emergency'],
  },

  decompression: {
    id: 'decompression',
    name: 'Stress Recovery',
    phases: [
      {
        name: 'Arrival Buffer',
        durationMinutes: 10,
        atmosphericTarget: {
          sound: { ambientLevel: 30, maskingNoise: 'pink' },
          light: { colorTemperature: 2800, intensity: 0.4 },
        },
        transitionCurve: 'ease-in',
      },
      {
        name: 'Decompression',
        durationMinutes: 30,
        atmosphericTarget: {
          thermal: { airTemperature: 23 },
          sound: { ambientLevel: 25, musicPresence: 0.1 },
          air: { scent: { compound: 'lavender', intensity: 0.2 } },
          temporal: { pace: 'slow', urgency: 0 },
        },
        transitionCurve: 'ease-in-out',
      },
      {
        name: 'Restoration',
        durationMinutes: 60,
        atmosphericTarget: {
          light: { colorTemperature: 3200, intensity: 0.5 },
          temporal: { pace: 'normal' },
        },
        transitionCurve: 'ease-out',
      },
    ],
    interruptibleBy: ['emergency', 'family_arrival'],
  },

  sleep_descent: {
    id: 'sleep_descent',
    name: 'Sleep Preparation',
    phases: [
      {
        name: 'Evening Wind-Down',
        durationMinutes: 60,
        atmosphericTarget: {
          light: { colorTemperature: 2400, intensity: 0.4, circadianPhase: 20 },
          sound: { ambientLevel: 30 },
          visual: { movement: 0 },
        },
        transitionCurve: 'ease-in',
      },
      {
        name: 'Pre-Sleep',
        durationMinutes: 30,
        atmosphericTarget: {
          light: { colorTemperature: 1800, intensity: 0.15, circadianPhase: 22 },
          thermal: { airTemperature: 19 },
          sound: { ambientLevel: 25, maskingNoise: 'brown' },
        },
        transitionCurve: 'ease-in-out',
      },
      {
        name: 'Sleep Entry',
        durationMinutes: 20,
        atmosphericTarget: {
          light: { intensity: 0, circadianPhase: 23 },
          thermal: { airTemperature: 18 },
          sound: { ambientLevel: 22 },
          temporal: { pace: 'suspended' },
        },
        transitionCurve: 'ease-out',
      },
    ],
    interruptibleBy: ['emergency'],
  },
};

// ============================================================================
// Narrative State
// ============================================================================

interface NarrativeState {
  // Active narratives (can have multiple)
  activeNarratives: NarrativeArc[];

  // Detected upcoming events
  anticipatedEvents: AnticipatedEvent[];

  // Regret prevention system
  regretPrevention: RegretPrevention;

  // Temporal context
  dayShape: DayShape;

  // Narrative history
  narrativeHistory: NarrativeRecord[];
}

interface AnticipatedEvent {
  id: string;
  source: 'calendar' | 'pattern' | 'explicit';
  eventType: string;
  startTime: number;
  confidence: number;
  suggestedNarrative: string | null;
}

interface DayShape {
  // Current position in the day's arc
  phase: 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'late_night';

  // Momentum
  energyArc: number;             // -1 (winding down) to 1 (building up)

  // Social density
  socialDensity: number;         // 0 (alone) to 1 (crowded)

  // Productivity window
  inProductiveWindow: boolean;

  // Expected remaining events
  remainingEvents: number;
}

interface NarrativeRecord {
  narrativeId: string;
  startedAt: number;
  completedAt: number | null;
  interrupted: boolean;
  interruptedBy: string | null;
  phasesCompleted: number;
  occupantSatisfaction: number | null;
}

// ============================================================================
// Narrative Engine Store
// ============================================================================

export const useNarrativeStore = create<NarrativeState & {
  // Actions
  detectNarrative: (context: NarrativeContext) => NarrativeArc | null;
  startNarrative: (narrativeId: string, startTime?: number) => void;
  advanceNarrative: (narrativeId: string) => void;
  interruptNarrative: (narrativeId: string, reason: string) => void;
  getCurrentAtmosphericTarget: () => Partial<AtmosphericEnvelope>;
  bufferAction: (action: Omit<BufferedAction, 'id' | 'reviewAt'>) => void;
  reviewBufferedActions: () => BufferedAction[];
  updateDayShape: () => void;
}>((set, get) => ({
  activeNarratives: [],
  anticipatedEvents: [],
  regretPrevention: {
    bufferedActions: [],
    cognitiveState: {
      load: 'clear',
      emotionalVolatility: 0,
      decisionFatigue: 0,
      hoursSinceSleep: 8,
    },
    protectedCategories: [
      'financial_transaction',
      'communication_angry',
      'commitment_new',
      'work_send',
    ],
  },
  dayShape: {
    phase: 'morning',
    energyArc: 0,
    socialDensity: 0,
    inProductiveWindow: false,
    remainingEvents: 0,
  },
  narrativeHistory: [],

  detectNarrative: (context) => {
    // Analyze context to detect which narrative should be active
    const { timeOfDay, upcomingEvents, occupantState, recentActivity } = context;

    // Check for calendar-driven narratives
    for (const event of upcomingEvents) {
      const timeUntilEvent = event.startTime - Date.now();
      const hoursUntil = timeUntilEvent / (1000 * 60 * 60);

      // Dinner party detection
      if (event.type === 'social_gathering' && hoursUntil < 3 && hoursUntil > 0) {
        const template = NARRATIVE_LIBRARY.dinner_party;
        return {
          ...template,
          currentPhase: 0,
          phaseProgress: 0,
          confidence: event.confidence,
        };
      }
    }

    // Pattern-based detection
    if (occupantState.stressLevel > 0.7 && recentActivity === 'arrived_home') {
      const template = NARRATIVE_LIBRARY.decompression;
      return {
        ...template,
        currentPhase: 0,
        phaseProgress: 0,
        confidence: 0.8,
      };
    }

    // Time-based narratives
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 8 && occupantState.justWoke) {
      const template = NARRATIVE_LIBRARY.morning_awakening;
      return {
        ...template,
        currentPhase: 0,
        phaseProgress: 0,
        confidence: 0.9,
      };
    }

    if (hour >= 21 || hour < 1) {
      const template = NARRATIVE_LIBRARY.sleep_descent;
      return {
        ...template,
        currentPhase: 0,
        phaseProgress: 0,
        confidence: 0.7,
      };
    }

    return null;
  },

  startNarrative: (narrativeId, startTime = Date.now()) => {
    const template = NARRATIVE_LIBRARY[narrativeId];
    if (!template) return;

    const narrative: NarrativeArc = {
      ...template,
      currentPhase: 0,
      phaseProgress: 0,
      confidence: 1.0,
    };

    set(state => ({
      activeNarratives: [...state.activeNarratives, narrative],
    }));
  },

  advanceNarrative: (narrativeId) => {
    set(state => {
      const narratives = state.activeNarratives.map(n => {
        if (n.id !== narrativeId) return n;

        const currentPhase = n.phases[n.currentPhase];
        const newProgress = n.phaseProgress + (1 / (currentPhase.durationMinutes * 60));

        if (newProgress >= 1) {
          // Move to next phase
          if (n.currentPhase + 1 >= n.phases.length) {
            // Narrative complete
            return null;
          }
          return {
            ...n,
            currentPhase: n.currentPhase + 1,
            phaseProgress: 0,
          };
        }

        return {
          ...n,
          phaseProgress: newProgress,
        };
      }).filter((n): n is NarrativeArc => n !== null);

      return { activeNarratives: narratives };
    });
  },

  interruptNarrative: (narrativeId, reason) => {
    set(state => {
      const narrative = state.activeNarratives.find(n => n.id === narrativeId);

      // Record interruption
      const record: NarrativeRecord = {
        narrativeId,
        startedAt: Date.now() - 1000,  // Approximate
        completedAt: Date.now(),
        interrupted: true,
        interruptedBy: reason,
        phasesCompleted: narrative?.currentPhase || 0,
        occupantSatisfaction: null,
      };

      return {
        activeNarratives: state.activeNarratives.filter(n => n.id !== narrativeId),
        narrativeHistory: [...state.narrativeHistory, record],
      };
    });
  },

  getCurrentAtmosphericTarget: () => {
    const { activeNarratives, dayShape } = get();

    if (activeNarratives.length === 0) {
      // Return base atmosphere based on day shape
      return getBaseAtmosphere(dayShape);
    }

    // Blend active narratives (primary narrative dominates)
    const primary = activeNarratives[0];
    const phase = primary.phases[primary.currentPhase];

    // Interpolate based on progress and transition curve
    const eased = applyTransitionCurve(primary.phaseProgress, phase.transitionCurve);

    // If there's a next phase, interpolate toward it
    if (primary.currentPhase + 1 < primary.phases.length) {
      const nextPhase = primary.phases[primary.currentPhase + 1];
      return interpolateAtmosphere(
        phase.atmosphericTarget,
        nextPhase.atmosphericTarget,
        eased
      );
    }

    return phase.atmosphericTarget;
  },

  bufferAction: (action) => {
    const { regretPrevention } = get();

    // Determine review time based on action type and current state
    const reviewDelay = regretPrevention.cognitiveState.load === 'overwhelmed'
      ? 8 * 60 * 60 * 1000  // 8 hours
      : regretPrevention.cognitiveState.load === 'occupied'
        ? 2 * 60 * 60 * 1000  // 2 hours
        : 30 * 60 * 1000;     // 30 minutes

    const buffered: BufferedAction = {
      ...action,
      id: `action-${Date.now()}`,
      reviewAt: Date.now() + reviewDelay,
    };

    set(state => ({
      regretPrevention: {
        ...state.regretPrevention,
        bufferedActions: [...state.regretPrevention.bufferedActions, buffered],
      },
    }));
  },

  reviewBufferedActions: () => {
    const { regretPrevention } = get();
    const now = Date.now();

    const ready = regretPrevention.bufferedActions.filter(a => a.reviewAt <= now);

    // Remove reviewed actions
    set(state => ({
      regretPrevention: {
        ...state.regretPrevention,
        bufferedActions: state.regretPrevention.bufferedActions.filter(
          a => a.reviewAt > now
        ),
      },
    }));

    return ready;
  },

  updateDayShape: () => {
    const hour = new Date().getHours();

    const phase: DayShape['phase'] =
      hour >= 0 && hour < 5 ? 'night' :
      hour >= 5 && hour < 7 ? 'dawn' :
      hour >= 7 && hour < 12 ? 'morning' :
      hour >= 12 && hour < 14 ? 'midday' :
      hour >= 14 && hour < 18 ? 'afternoon' :
      hour >= 18 && hour < 22 ? 'evening' :
      'late_night';

    const energyArc =
      phase === 'morning' ? 0.7 :
      phase === 'midday' ? 0.3 :
      phase === 'afternoon' ? 0.5 :
      phase === 'evening' ? -0.3 :
      -0.8;

    set(state => ({
      dayShape: {
        ...state.dayShape,
        phase,
        energyArc,
        inProductiveWindow: phase === 'morning' || phase === 'afternoon',
      },
    }));
  },
}));

// ============================================================================
// Helper Types
// ============================================================================

interface NarrativeContext {
  timeOfDay: number;
  upcomingEvents: Array<{
    type: string;
    startTime: number;
    confidence: number;
  }>;
  occupantState: {
    stressLevel: number;
    justWoke: boolean;
    socialMode: boolean;
  };
  recentActivity: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getBaseAtmosphere(dayShape: DayShape): Partial<AtmosphericEnvelope> {
  const baseTemps: Record<DayShape['phase'], number> = {
    night: 2000,
    dawn: 2500,
    morning: 4500,
    midday: 5500,
    afternoon: 5000,
    evening: 3200,
    late_night: 2400,
  };

  const baseIntensity: Record<DayShape['phase'], number> = {
    night: 0.1,
    dawn: 0.3,
    morning: 0.8,
    midday: 0.9,
    afternoon: 0.8,
    evening: 0.5,
    late_night: 0.3,
  };

  return {
    light: {
      colorTemperature: baseTemps[dayShape.phase],
      intensity: baseIntensity[dayShape.phase],
      spectrum: [],
      direction: 'diffuse',
      circadianPhase: new Date().getHours(),
    },
  };
}

function applyTransitionCurve(progress: number, curve: NarrativePhase['transitionCurve']): number {
  switch (curve) {
    case 'linear':
      return progress;
    case 'ease-in':
      return progress * progress;
    case 'ease-out':
      return 1 - Math.pow(1 - progress, 2);
    case 'ease-in-out':
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    case 'anticipate':
      // Slight pullback before moving forward
      const overshoot = 1.70158;
      return progress * progress * ((overshoot + 1) * progress - overshoot);
    default:
      return progress;
  }
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
    light: {
      colorTemperature: lerp(from.light?.colorTemperature, to.light?.colorTemperature, t),
      intensity: lerp(from.light?.intensity, to.light?.intensity, t),
      spectrum: from.light?.spectrum || [],
      direction: t < 0.5 ? from.light?.direction || 'diffuse' : to.light?.direction || 'diffuse',
      circadianPhase: lerp(from.light?.circadianPhase, to.light?.circadianPhase, t),
    },
    sound: from.sound && to.sound ? {
      ambientLevel: lerp(from.sound.ambientLevel, to.sound.ambientLevel, t),
      frequencyBalance: t < 0.5 ? from.sound.frequencyBalance : to.sound.frequencyBalance,
      spatialWidth: lerp(from.sound.spatialWidth, to.sound.spatialWidth, t),
      maskingNoise: t < 0.5 ? from.sound.maskingNoise : to.sound.maskingNoise,
      musicPresence: lerp(from.sound.musicPresence, to.sound.musicPresence, t),
    } : from.sound || to.sound,
    thermal: from.thermal && to.thermal ? {
      radiativeBalance: lerp(from.thermal.radiativeBalance, to.thermal.radiativeBalance, t),
      airTemperature: lerp(from.thermal.airTemperature, to.thermal.airTemperature, t),
      floorTemperature: lerp(from.thermal.floorTemperature, to.thermal.floorTemperature, t),
      asymmetry: lerp(from.thermal.asymmetry, to.thermal.asymmetry, t),
    } : from.thermal || to.thermal,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { NARRATIVE_LIBRARY };
export type { NarrativeContext, DayShape, NarrativeRecord, AnticipatedEvent };
