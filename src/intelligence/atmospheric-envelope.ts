/**
 * AICO - Atmospheric Envelope System
 *
 * "The user wants to BE comfortable. Not to KNOW the temperature."
 *
 * This system maintains a Thermal Shadow around each occupant,
 * adjusting micro-climate through beamforming - heating the person,
 * not the room.
 */

import { create } from 'zustand';
import type {
  ThermalShadow,
  AtmosphericBreath,
  AtmosphericEnvelope,
} from '../core/philosophy';

// ============================================================================
// Thermal Shadow Tracking
// ============================================================================

interface ThermalReading {
  occupantId: string;
  timestamp: number;
  location: { x: number; y: number; z: number };

  // From thermal cameras
  skinTemperature: number;        // Celsius, typically 32-36 for comfort
  temperatureVariance: number;    // How much it's fluctuating

  // Derived metrics
  thermalTrend: 'cooling' | 'stable' | 'warming';
  comfortDeviation: number;       // Distance from ideal, negative = cold
}

interface MicroClimateZone {
  id: string;
  center: { x: number; y: number; z: number };
  radius: number;

  // Active systems in this zone
  systems: {
    irEmitters: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      intensity: number;          // 0-1
      targetAngle: { azimuth: number; elevation: number };
    }>;
    airVents: Array<{
      id: string;
      position: { x: number; y: number; z: number };
      flowRate: number;           // CFM
      temperature: number;        // Output temp
      direction: { x: number; y: number; z: number };
    }>;
    radiantSurfaces: Array<{
      id: string;
      surfaceType: 'floor' | 'wall' | 'ceiling';
      area: number;
      temperature: number;
    }>;
  };

  // Current state
  effectiveTemperature: number;   // What it "feels like"
  radiativeBalance: number;       // Net radiant heat
}

// ============================================================================
// Atmospheric Envelope Store
// ============================================================================

interface AtmosphericState {
  // Thermal shadows for each occupant
  thermalShadows: Map<string, ThermalShadow>;

  // Active micro-climate zones
  microClimateZones: Map<string, MicroClimateZone>;

  // Global atmospheric state
  atmosphere: AtmosphericEnvelope;

  // Comfort thresholds (learned per occupant)
  comfortProfiles: Map<string, ComfortProfile>;

  // System state
  lastUpdate: number;
  interventionLog: AtmosphericIntervention[];
}

interface ComfortProfile {
  occupantId: string;

  // Learned preferences
  preferredSkinTemp: number;      // Their comfort point
  temperatureSensitivity: number; // How quickly they notice changes
  humidityPreference: number;     // Preferred humidity
  airMovementTolerance: number;   // Tolerance for drafts

  // Contextual variations
  sleepingDelta: number;          // How much cooler when sleeping
  activeDelta: number;            // How much cooler when active
  focusDelta: number;             // Preference during focus work

  // Temporal patterns
  morningWarmthBias: number;      // Prefer warmer in morning?
  eveningCoolBias: number;        // Prefer cooler in evening?
}

interface AtmosphericIntervention {
  timestamp: number;
  occupantId: string;
  trigger: 'thermal_deviation' | 'predictive' | 'narrative' | 'request';
  action: string;
  magnitude: number;
  noticed: boolean;               // Did the occupant notice?
}

// ============================================================================
// Thermal Comfort Calculations
// ============================================================================

/**
 * Calculate Predicted Mean Vote (PMV) - ISO 7730
 * Modified for residential luxury context
 */
function calculateThermalComfort(
  airTemp: number,
  radiativeTemp: number,
  airVelocity: number,
  humidity: number,
  metabolicRate: number,         // Met units (1.0 = seated)
  clothingInsulation: number     // Clo units
): { pmv: number; ppd: number } {
  // Simplified PMV calculation
  const operativeTemp = (airTemp + radiativeTemp) / 2;
  const tempDiff = operativeTemp - 24; // 24°C as neutral

  // Adjustments
  const velocityEffect = -0.5 * (airVelocity - 0.1);
  const humidityEffect = -0.01 * (humidity - 50);
  const metabolicEffect = -2 * (metabolicRate - 1.0);
  const clothingEffect = 3 * (clothingInsulation - 0.6);

  const pmv = tempDiff * 0.3 + velocityEffect + humidityEffect + metabolicEffect + clothingEffect;

  // Predicted Percentage Dissatisfied
  const ppd = 100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));

  return { pmv: Math.max(-3, Math.min(3, pmv)), ppd: Math.max(5, ppd) };
}

/**
 * Calculate optimal IR emitter targeting for a person.
 * This is micro-climate beamforming.
 */
function calculateIRBeamforming(
  occupantPosition: { x: number; y: number; z: number },
  occupantThermalNeed: number,   // Positive = needs warming
  availableEmitters: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    maxIntensity: number;
    currentIntensity: number;
  }>
): Array<{ id: string; targetIntensity: number; targetAngle: { azimuth: number; elevation: number } }> {
  return availableEmitters.map(emitter => {
    // Calculate direction to occupant
    const dx = occupantPosition.x - emitter.position.x;
    const dy = occupantPosition.y - emitter.position.y;
    const dz = occupantPosition.z - emitter.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const azimuth = Math.atan2(dx, dz);
    const elevation = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    // Intensity falls off with square of distance
    const distanceFactor = 1 / (1 + distance * distance * 0.1);

    // Calculate needed intensity based on thermal need
    const targetIntensity = Math.max(0, Math.min(
      emitter.maxIntensity,
      occupantThermalNeed * distanceFactor * 0.5
    ));

    return {
      id: emitter.id,
      targetIntensity,
      targetAngle: { azimuth, elevation }
    };
  });
}

// ============================================================================
// Atmospheric Envelope Engine
// ============================================================================

export const useAtmosphericStore = create<AtmosphericState & {
  // Actions
  updateThermalReading: (reading: ThermalReading) => void;
  processAtmosphere: () => void;
  getInterventionNeeded: (occupantId: string) => AtmosphericIntervention | null;
  setAtmosphericTarget: (target: Partial<AtmosphericEnvelope>) => void;
  learnComfortProfile: (occupantId: string, feedback: 'too_cold' | 'comfortable' | 'too_warm') => void;
}>((set, get) => ({
  thermalShadows: new Map(),
  microClimateZones: new Map(),
  atmosphere: createDefaultAtmosphere(),
  comfortProfiles: new Map(),
  lastUpdate: Date.now(),
  interventionLog: [],

  updateThermalReading: (reading) => {
    const { thermalShadows, comfortProfiles } = get();

    const profile = comfortProfiles.get(reading.occupantId) || createDefaultProfile(reading.occupantId);
    const currentShadow = thermalShadows.get(reading.occupantId);

    // Calculate comfort deviation
    const comfortDeviation = reading.skinTemperature - profile.preferredSkinTemp;

    // Determine if intervention needed
    const needsIntervention = Math.abs(comfortDeviation) > 0.2; // 0.2°C threshold

    // Calculate micro-climate adjustments
    const microClimate = needsIntervention ? {
      irEmitterTargets: calculateIRTargets(reading.location, -comfortDeviation),
      localizedAirflow: calculateAirflowAdjustment(reading.location, comfortDeviation),
      radiativeHeatBalance: -comfortDeviation * 10, // Watts per square meter
    } : currentShadow?.microClimate || {
      irEmitterTargets: [],
      localizedAirflow: { direction: 0, velocity: 0 },
      radiativeHeatBalance: 0,
    };

    const newShadow: ThermalShadow = {
      occupantId: reading.occupantId,
      skinTemperature: reading.skinTemperature,
      coreTemperatureEstimate: reading.skinTemperature + 4.5,
      metabolicRate: inferMetabolicRate(reading),
      comfortField: {
        center: reading.location,
        radius: 2.0,              // 2 meter personal thermal bubble
        gradient: 0.5,
      },
      microClimate,
    };

    set(state => ({
      thermalShadows: new Map(state.thermalShadows).set(reading.occupantId, newShadow),
      lastUpdate: Date.now(),
    }));
  },

  processAtmosphere: () => {
    const { thermalShadows, atmosphere, microClimateZones } = get();

    // Process each thermal shadow
    thermalShadows.forEach((shadow, occupantId) => {
      // Find or create micro-climate zone
      let zone = findNearestZone(shadow.comfortField.center, microClimateZones);

      if (!zone) {
        zone = createMicroClimateZone(shadow.comfortField.center);
      }

      // Apply micro-climate adjustments to zone
      applyMicroClimateAdjustments(zone, shadow);
    });
  },

  getInterventionNeeded: (occupantId) => {
    const shadow = get().thermalShadows.get(occupantId);
    if (!shadow) return null;

    const profile = get().comfortProfiles.get(occupantId);
    if (!profile) return null;

    const deviation = shadow.skinTemperature - profile.preferredSkinTemp;

    if (Math.abs(deviation) < 0.2) return null;

    return {
      timestamp: Date.now(),
      occupantId,
      trigger: 'thermal_deviation',
      action: deviation < 0 ? 'warming' : 'cooling',
      magnitude: Math.abs(deviation),
      noticed: false,
    };
  },

  setAtmosphericTarget: (target) => {
    set(state => ({
      atmosphere: { ...state.atmosphere, ...target },
    }));
  },

  learnComfortProfile: (occupantId, feedback) => {
    set(state => {
      const profiles = new Map(state.comfortProfiles);
      const current = profiles.get(occupantId) || createDefaultProfile(occupantId);
      const shadow = state.thermalShadows.get(occupantId);

      if (shadow) {
        // Adjust preferred temperature based on feedback
        const adjustment = feedback === 'too_cold' ? 0.3
          : feedback === 'too_warm' ? -0.3
          : 0;

        profiles.set(occupantId, {
          ...current,
          preferredSkinTemp: current.preferredSkinTemp + adjustment,
        });
      }

      return { comfortProfiles: profiles };
    });
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

function createDefaultAtmosphere(): AtmosphericEnvelope {
  return {
    light: {
      colorTemperature: 3500,
      intensity: 0.7,
      spectrum: [],
      direction: 'diffuse',
      circadianPhase: 12,
    },
    sound: {
      ambientLevel: 35,
      frequencyBalance: 'neutral',
      spatialWidth: 0.5,
      maskingNoise: 'none',
      musicPresence: 0,
    },
    air: {
      pressure: 101.3,
      humidity: 45,
      ionization: 'neutral',
      scent: null,
      oxygenEnrichment: 0,
    },
    thermal: {
      radiativeBalance: 0,
      airTemperature: 22,
      floorTemperature: 24,
      asymmetry: 0,
    },
    visual: {
      clutter: 0.3,
      movement: 0.1,
      transparency: 0.5,
      nature: 0.4,
    },
    temporal: {
      pace: 'normal',
      urgency: 0,
      continuity: 0.5,
    },
  };
}

function createDefaultProfile(occupantId: string): ComfortProfile {
  return {
    occupantId,
    preferredSkinTemp: 33.5,      // Typical comfortable skin temperature
    temperatureSensitivity: 0.5,
    humidityPreference: 45,
    airMovementTolerance: 0.3,
    sleepingDelta: -1.5,
    activeDelta: -2.0,
    focusDelta: -0.5,
    morningWarmthBias: 0.5,
    eveningCoolBias: 0.3,
  };
}

function inferMetabolicRate(reading: ThermalReading): 'low' | 'normal' | 'elevated' {
  // Infer from skin temperature variance and trend
  if (reading.temperatureVariance > 0.5 || reading.thermalTrend === 'warming') {
    return 'elevated';
  }
  if (reading.thermalTrend === 'cooling' && reading.temperatureVariance < 0.2) {
    return 'low';
  }
  return 'normal';
}

function calculateIRTargets(
  location: { x: number; y: number; z: number },
  thermalNeed: number
): Array<{ x: number; y: number; z: number; intensity: number }> {
  // Simplified: return a target point above the person with appropriate intensity
  return [{
    x: location.x,
    y: location.y + 2.5,  // Ceiling mounted
    z: location.z,
    intensity: Math.abs(thermalNeed) * 0.3,
  }];
}

function calculateAirflowAdjustment(
  location: { x: number; y: number; z: number },
  comfortDeviation: number
): { direction: number; velocity: number } {
  // If too warm, increase airflow; if too cold, minimize it
  const velocity = comfortDeviation > 0
    ? Math.min(0.5, comfortDeviation * 0.2)  // Increase airflow
    : 0.05;                                   // Minimal airflow

  return {
    direction: 0,  // Downward
    velocity,
  };
}

function findNearestZone(
  position: { x: number; y: number; z: number },
  zones: Map<string, MicroClimateZone>
): MicroClimateZone | null {
  let nearest: MicroClimateZone | null = null;
  let nearestDist = Infinity;

  zones.forEach(zone => {
    const dx = position.x - zone.center.x;
    const dy = position.y - zone.center.y;
    const dz = position.z - zone.center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < nearestDist && dist < zone.radius) {
      nearest = zone;
      nearestDist = dist;
    }
  });

  return nearest;
}

function createMicroClimateZone(center: { x: number; y: number; z: number }): MicroClimateZone {
  return {
    id: `zone-${Date.now()}`,
    center,
    radius: 3.0,
    systems: {
      irEmitters: [],
      airVents: [],
      radiantSurfaces: [],
    },
    effectiveTemperature: 22,
    radiativeBalance: 0,
  };
}

function applyMicroClimateAdjustments(zone: MicroClimateZone, shadow: ThermalShadow): void {
  // Apply the shadow's micro-climate requirements to the zone's systems
  // This would interface with actual hardware in production

  zone.radiativeBalance = shadow.microClimate.radiativeHeatBalance;

  // Update effective temperature based on adjustments
  zone.effectiveTemperature = 22 + shadow.microClimate.radiativeHeatBalance * 0.1;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  ThermalReading,
  MicroClimateZone,
  ComfortProfile,
  AtmosphericIntervention,
};
