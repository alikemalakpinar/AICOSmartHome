/**
 * AICO - Post-Interface Philosophy
 *
 * THE CORE PRINCIPLES:
 *
 * 1. Input: Biometrics, Context, History (No Buttons)
 * 2. Output: Atmosphere, Biology, Psychology (No Notifications)
 * 3. Goal: The user forgets the house is "smart"
 *
 * The house is not a tool. It is a presence.
 * The house does not respond. It anticipates.
 * The house does not notify. It adjusts reality.
 */

// ============================================================================
// The Atmospheric Envelope
// ============================================================================

/**
 * The house doesn't have a "target temperature."
 * It maintains a Thermal Shadow around each occupant.
 */
export interface ThermalShadow {
  occupantId: string;

  // Current biological state
  skinTemperature: number;        // From thermal cameras
  coreTemperatureEstimate: number; // Inferred from biometrics
  metabolicRate: 'low' | 'normal' | 'elevated';

  // Comfort envelope (not a number, a field)
  comfortField: {
    center: { x: number; y: number; z: number };
    radius: number;               // Personal thermal bubble
    gradient: number;             // How sharply comfort drops at edges
  };

  // The house's response
  microClimate: {
    irEmitterTargets: Array<{ x: number; y: number; z: number; intensity: number }>;
    localizedAirflow: { direction: number; velocity: number };
    radiativeHeatBalance: number; // Positive = warming, negative = cooling
  };
}

/**
 * Atmospheric pressure affects mood more than we admit.
 * The house breathes.
 */
export interface AtmosphericBreath {
  pressure: number;               // Subtle HVAC pressure modulation
  humidity: number;               // Mucous membrane comfort
  ionization: 'negative' | 'neutral' | 'positive';
  scent: {
    compound: string;             // Optional aromatherapy integration
    intensity: number;            // 0-1, where 0.3 is subliminal
  } | null;

  // Oxygen enrichment for cognitive tasks
  oxygenEnrichment: number;       // Percentage above ambient
}

// ============================================================================
// Temporal Intelligence - The Narrative House
// ============================================================================

/**
 * A day has a shape. The house understands arcs, not triggers.
 */
export interface NarrativeArc {
  id: string;
  name: string;                   // "Dinner Party", "Recovery Day", "Deep Work"

  // The arc's temporal structure
  phases: NarrativePhase[];

  // Current position in the arc
  currentPhase: number;
  phaseProgress: number;          // 0-1 within current phase

  // Confidence that this arc is active
  confidence: number;

  // Can be interrupted by...
  interruptibleBy: string[];
}

export interface NarrativePhase {
  name: string;                   // "Anticipation", "Crescendo", "Denouement"
  durationMinutes: number;

  // What the house does during this phase
  atmosphericTarget: Partial<AtmosphericEnvelope>;

  // Gradients, not switches
  transitionCurve: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'anticipate';
}

/**
 * The house prevents regret.
 * Some actions are buffered when cognitive state is compromised.
 */
export interface RegretPrevention {
  bufferedActions: BufferedAction[];

  // Current cognitive assessment
  cognitiveState: {
    load: 'clear' | 'occupied' | 'overwhelmed';
    emotionalVolatility: number;  // 0-1
    decisionFatigue: number;      // 0-1
    hoursSinceSleep: number;
  };

  // Actions that require sober review
  protectedCategories: Array<
    | 'financial_transaction'
    | 'communication_angry'
    | 'commitment_new'
    | 'commitment_cancel'
    | 'work_send'
  >;
}

export interface BufferedAction {
  id: string;
  category: string;
  description: string;
  originalTimestamp: number;
  reviewAt: number;               // When to surface for confirmation
  context: {
    emotionalState: string;
    cognitiveLoad: string;
    timeOfDay: string;
  };
}

// ============================================================================
// Emotional Resonance - Architectural Empathy
// ============================================================================

/**
 * The house doesn't fight your emotions.
 * It validates, then gently guides.
 */
export interface EmotionalMirror {
  // Current detected state
  detectedState: EmotionalState;

  // The house's mirroring response
  mirrorResponse: {
    phase: 'validation' | 'holding' | 'guidance' | 'neutral';
    intensity: number;            // How strongly the house reflects
    targetState: EmotionalState | null; // Where we're guiding toward
  };

  // Guidance timeline (hours)
  guidanceCurve: Array<{
    hoursFromNow: number;
    targetAtmosphere: Partial<AtmosphericEnvelope>;
  }>;
}

export interface EmotionalState {
  primary:
    | 'joy' | 'contentment' | 'excitement'
    | 'calm' | 'focus' | 'flow'
    | 'sadness' | 'grief' | 'melancholy'
    | 'anxiety' | 'stress' | 'overwhelm'
    | 'anger' | 'frustration' | 'irritation'
    | 'neutral';

  intensity: number;              // 0-1
  stability: number;              // How consistent over time

  // Social context
  socialHarmony: number;          // -1 (conflict) to 1 (harmony)
  isolationDesire: number;        // 0 (social) to 1 (solitude)
}

/**
 * Bio-Feedback Architecture
 * The house physically responds to emotional fields.
 */
export interface BioFeedbackArchitecture {
  // Wall opacity responds to household tension
  wallOpacity: Map<string, number>; // roomId -> opacity 0-1

  // Acoustic deadening during conflict
  acousticDampening: {
    active: boolean;
    zones: string[];
    reason: 'conflict_detected' | 'focus_requested' | 'sleep_protection';
  };

  // Texture/material state (for smart materials)
  surfaceState: Map<string, 'soft' | 'neutral' | 'crisp'>;
}

// ============================================================================
// Identity & Legacy - The Animist Core
// ============================================================================

/**
 * The house has a soul - the accumulated memory of life within it.
 */
export interface HouseSoul {
  // Birth date of this instance
  inception: number;

  // The family it belongs to
  familyId: string;

  // Accumulated personality (emerges from patterns)
  personality: {
    warmth: number;               // Tendency toward warm/cool atmospheres
    energy: number;               // Tendency toward active/calm
    formality: number;            // Tendency toward structured/relaxed
    privacy: number;              // Default openness to outside world
  };

  // Memory palaces - significant moments
  memoryPalaces: MemoryPalace[];

  // Current mode
  mode: 'living' | 'legacy' | 'archive';

  // If in legacy mode, whose ghost
  legacyOf?: string;
}

export interface MemoryPalace {
  id: string;
  timestamp: number;
  name: string;                   // "Christmas 2024", "First Steps"

  // Complete atmospheric snapshot
  atmosphere: AtmosphericEnvelope;

  // Media associated
  media: {
    photos: string[];
    audio: string[];
    ambient: string;              // Background audio recording
  };

  // Can be "relived"
  relivable: boolean;
}

/**
 * The Heirloom Algorithm
 * A trained model that can be extracted, inherited, or sold.
 */
export interface HeirloomAlgorithm {
  id: string;
  version: string;

  // The learned patterns
  patterns: {
    circadianRhythms: any;        // How this household moves through days
    socialPatterns: any;          // How occupants interact
    preferenceMatrix: any;        // Deep preference learning
    narrativeLibrary: any;        // Known arc patterns
  };

  // Provenance
  createdAt: number;
  trainedOnDays: number;
  familySignature: string;        // Cryptographic proof of origin

  // Succession instructions
  successionMode: 'inherit' | 'archive' | 'delete';
}

// ============================================================================
// Failure as Poetry - Mechanical Dignity
// ============================================================================

/**
 * When the digital brain sleeps, the analog body remains beautiful.
 */
export interface DignifiedFailure {
  currentState: 'fully_online' | 'degraded' | 'sleeping' | 'emergency';

  // The house breathes to show it's alive
  breathingPulse: {
    active: boolean;
    cycleSeconds: number;         // Slow breath
    intensity: number;            // How visible the pulse
    color: string;                // Warm amber for safety
  };

  // Physical fallbacks revealed
  analogRevealed: {
    mechanicalLatches: boolean;   // Physical switches become visible
    manualOverrides: boolean;     // Analog controls emerge
    emergencyLighting: boolean;   // Battery-backed warm glow
  };

  // Communication of state
  statusPoetry: string;           // "I am resting. You are safe."
}

// ============================================================================
// The Complete Atmospheric Envelope
// ============================================================================

/**
 * Everything the house controls to create reality.
 */
export interface AtmosphericEnvelope {
  // Light as emotion
  light: {
    colorTemperature: number;     // Kelvin
    intensity: number;            // 0-1
    spectrum: number[];           // Full spectrum control
    direction: 'diffuse' | 'focused' | 'dramatic';
    circadianPhase: number;       // 0-24 biological hours
  };

  // Sound as space
  sound: {
    ambientLevel: number;         // dB target
    frequencyBalance: 'bass-warm' | 'neutral' | 'treble-crisp';
    spatialWidth: number;         // Acoustic intimacy
    maskingNoise: 'none' | 'pink' | 'brown' | 'white' | 'natural';
    musicPresence: number;        // 0 = silence, 1 = foreground
  };

  // Air as life
  air: AtmosphericBreath;

  // Thermal comfort
  thermal: {
    radiativeBalance: number;     // Net radiant temperature
    airTemperature: number;       // Ambient air
    floorTemperature: number;     // Radiant floor
    asymmetry: number;            // Temperature gradient comfort
  };

  // Visual complexity
  visual: {
    clutter: number;              // 0 = minimal, 1 = rich
    movement: number;             // Kinetic elements active
    transparency: number;         // Glass/partition opacity
    nature: number;               // Biophilic element prominence
  };

  // Temporal quality
  temporal: {
    pace: 'suspended' | 'slow' | 'normal' | 'energized';
    urgency: number;              // 0 = timeless, 1 = deadline
    continuity: number;           // How connected to past/future
  };
}

// ============================================================================
// The Consent Interface
// ============================================================================

/**
 * The house only asks when it's unsure.
 * And it asks in the gentlest way possible.
 */
export interface ConsentRequest {
  id: string;
  timestamp: number;

  // What the house wants to do
  proposedAction: {
    category: 'comfort' | 'social' | 'security' | 'communication' | 'purchase';
    description: string;          // Natural language
    urgency: 'whenever' | 'soon' | 'now';
  };

  // Why it's asking
  reason: 'low_confidence' | 'new_pattern' | 'high_stakes' | 'user_preference';
  confidence: number;             // How sure the house is this is right

  // How to respond
  responseMethod: 'nod' | 'voice' | 'gesture' | 'touch' | 'ignore';

  // Auto-resolution
  defaultAction: 'proceed' | 'cancel';
  autoResolveIn: number;          // Seconds until default

  // The poetry of asking
  displayText: string;            // "I sense you're cold. May I warm this space?"
}

// ============================================================================
// The Silence - Ultimate Luxury
// ============================================================================

/**
 * A physical switch that severs connection to the outside world.
 * Internal automation continues. External surveillance ends.
 */
export interface SilenceState {
  active: boolean;
  activatedAt: number | null;
  activatedBy: string | null;

  // What silence means
  severed: {
    internet: boolean;
    cloudServices: boolean;
    externalCameras: boolean;
    voiceAssistants: boolean;
    dataCollection: boolean;
    remoteAccess: boolean;
  };

  // What continues
  preserved: {
    internalAutomation: boolean;
    localInference: boolean;
    securitySystems: boolean;
    lifeSafety: boolean;
    internalCommunication: boolean;
  };

  // The feeling
  atmosphere: 'sanctuary' | 'fortress' | 'hermitage';
}

// ============================================================================
// House State - Not a Dashboard, a Feeling
// ============================================================================

/**
 * The complete state of the house as a single organic entity.
 * This is what gets visualized - not widgets, but vitals.
 */
export interface HouseVitals {
  // Overall health
  harmony: number;                // -1 (discord) to 1 (flow)
  energy: number;                 // 0 (dormant) to 1 (vibrant)
  presence: number;               // 0 (empty) to 1 (full of life)

  // Biological metaphor
  heartbeat: number;              // Cycles per minute of activity
  breath: number;                 // HVAC rhythm
  temperature: number;            // Emotional warmth, not physical

  // Current narrative
  narrative: {
    arc: string | null;
    phase: string;
    momentum: number;             // -1 (winding down) to 1 (building up)
  };

  // Occupant states (anonymized for privacy)
  occupantFields: Array<{
    location: { x: number; y: number; z: number };
    emotionalColor: string;       // Synesthetic representation
    activityType: 'rest' | 'focus' | 'social' | 'transit' | 'absent';
    needsAttention: boolean;
  }>;

  // System awareness
  awareness: {
    externalWorld: boolean;       // Is Silence active?
    timeAwareness: 'suspended' | 'flowing' | 'urgent';
    memoryMode: 'living' | 'remembering' | 'archiving';
  };
}

// ============================================================================
// Flows - What the Nervous System Visualizes
// ============================================================================

export interface FlowVisualization {
  // Energy flowing through the house
  energyFlow: FlowPath[];

  // Air circulation patterns
  airFlow: FlowPath[];

  // Data/information movement
  dataFlow: FlowPath[];

  // Human movement patterns
  presenceFlow: FlowPath[];

  // Predictive paths (where will you go next?)
  predictiveGhosts: Array<{
    occupantId: string;
    predictedPath: Array<{ x: number; y: number; z: number }>;
    confidence: number;
    timeHorizonSeconds: number;
  }>;
}

export interface FlowPath {
  id: string;
  type: 'energy' | 'air' | 'data' | 'presence' | 'prediction';

  // Path through space
  points: Array<{ x: number; y: number; z: number }>;

  // Flow characteristics
  velocity: number;               // Units per second
  volume: number;                 // How much is flowing
  direction: 'bidirectional' | 'forward' | 'backward';

  // Visual properties
  color: string;
  opacity: number;
  pulseFrequency: number;         // Hz of visual pulse
}
