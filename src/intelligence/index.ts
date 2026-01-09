/**
 * AICO Smart Home - Intelligence Layer
 *
 * The cognitive core of a living home.
 * Not automation, but understanding.
 * Not reaction, but anticipation.
 * Not control, but care.
 */

// Rules Engine - Foundation of home automation
export * from './rules';

// Temporal Intelligence - Understanding patterns in time
export * from './temporal/types';
export * from './temporal/pattern-engine';
export * from './temporal/scenario-engine';

// Emotional Inference - Reading the mood of a home
export * from './emotional/types';
export * from './emotional/inference-engine';

// Ambient Interaction - Communication without screens
export * from './ambient/types';
export * from './ambient/ambient-controller';

// Regret Prevention - Gentle guardian against tomorrow's regrets
export * from './regret/regret-prevention';

// Digital Legacy - Honoring presence and absence
export * from './legacy/digital-legacy';

// Graceful Degradation - Failing like a sunset
export * from './degradation/types';
export * from './degradation/degradation-controller';

// Trust-Based Autonomy - Earning the right to act
export * from './autonomy/types';
export * from './autonomy/autonomy-controller';

// Ritual Recognition - The poetry of routine
export * from './ritual/types';
export * from './ritual/ritual-engine';

// Cultural & Seasonal Awareness - Speaking culture's language
export * from './cultural/types';
export * from './cultural/cultural-controller';

// ============================================================================
// POST-INTERFACE ERA - The Invisible Brain
// ============================================================================

// Atmospheric Envelope - Thermal shadows and micro-climate beamforming
export { useAtmosphericStore } from './atmospheric-envelope';
export type {
  ThermalReading,
  MicroClimateZone,
  ComfortProfile,
  AtmosphericIntervention,
} from './atmospheric-envelope';

// Narrative Engine - Temporal intelligence and day shapes
export { useNarrativeStore, NARRATIVE_LIBRARY } from './narrative-engine';
export type {
  NarrativeContext,
  DayShape,
  NarrativeRecord,
  AnticipatedEvent,
} from './narrative-engine';

// Empathy Engine - Emotional mirroring and guidance
export {
  useEmpathyStore,
  EMOTIONAL_ATMOSPHERES,
  GUIDANCE_TARGETS,
} from './empathy-engine';
export type { GuidanceTimeline } from './empathy-engine';

/**
 * The Philosophy of Home Intelligence
 * ====================================
 *
 * 1. SCREENS ARE A FAILURE STATE
 *    The best interaction is invisible. The next best is ambient.
 *    Voice is a concession. Touch is a last resort.
 *
 * 2. TIME IS NOT LINEAR
 *    A home should remember patterns, anticipate needs,
 *    and learn the rhythm of its inhabitants.
 *
 * 3. EMOTIONS MATTER
 *    The house should notice stress, honor rest,
 *    and respond to the subtle signals of wellbeing.
 *
 * 4. TRUST IS EARNED
 *    Autonomy is a privilege, not a right.
 *    The house earns trust through accuracy and restraint.
 *
 * 5. FAILURE SHOULD BE BEAUTIFUL
 *    When systems degrade, they should do so gracefully,
 *    like a sunset - gradually, with dignity.
 *
 * 6. RITUALS HAVE MEANING
 *    A morning coffee is not just caffeine.
 *    Sunday dinner is not just food.
 *    The house should honor these moments.
 *
 * 7. CULTURE SHAPES EXPERIENCE
 *    From Ramadan schedules to seasonal celebrations,
 *    the home speaks the language of its inhabitants.
 *
 * 8. LEGACY PERSISTS
 *    Patterns should fade gently when someone is gone.
 *    Memories should be preserved with care.
 *    The house should know how to grieve.
 *
 * 9. PREVENTION BEATS CURE
 *    Gently warn about the 2 AM decisions.
 *    Protect against tomorrow's regrets.
 *    Be a friend who cares, not a nanny who nags.
 *
 * 10. HUMANS REMAIN SOVEREIGN
 *     The house suggests, the human decides.
 *     Override is always possible.
 *     The house serves, never commands.
 */
