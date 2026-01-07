/**
 * AICO Smart Home - Atmosphere & Comfort Service
 *
 * Central service for climate, lighting, and environmental control.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DeviceId, RoomId, ZoneId, ISOTimestamp } from '@/types/core';
import type {
  ClimateState,
  ClimateMode,
  FanMode,
  HVACZone,
  AirQualityData,
  LightingState,
  LightingZone,
  LightingScene,
  CircadianLightingConfig,
  ScentDiffuserState,
  ElectrochromicGlassState,
  ComfortScore,
  AtmospherePreset,
  AtmosphereSettings,
} from './types';

// ============================================================================
// Store State
// ============================================================================

interface AtmosphereState {
  // Climate
  hvacZones: Map<ZoneId, HVACZone>;
  roomTemperatures: Map<RoomId, number>;
  roomHumidity: Map<RoomId, number>;
  outdoorTemperature: number;
  outdoorHumidity: number;

  // Air Quality
  roomAirQuality: Map<RoomId, AirQualityData>;
  airPurifiers: Map<DeviceId, { isOn: boolean; mode: string }>;

  // Lighting
  lightingZones: Map<ZoneId, LightingZone>;
  lightStates: Map<DeviceId, LightingState>;
  activeScenes: Map<RoomId, string>;
  circadianEnabled: boolean;

  // Scent
  scentDiffusers: Map<DeviceId, ScentDiffuserState>;

  // Glass
  electrochromicGlass: Map<DeviceId, ElectrochromicGlassState>;

  // Presets
  presets: AtmospherePreset[];
  activePreset: string | null;

  // Comfort
  comfortScores: Map<RoomId, ComfortScore>;
}

interface AtmosphereActions {
  // Climate Control
  setTemperature(zoneId: ZoneId, temperature: number): Promise<void>;
  setClimateMode(zoneId: ZoneId, mode: ClimateMode): Promise<void>;
  setFanMode(zoneId: ZoneId, mode: FanMode): Promise<void>;
  setHumidity(zoneId: ZoneId, humidity: number): Promise<void>;

  // Lighting Control
  setLightState(deviceId: DeviceId, state: Partial<LightingState>): Promise<void>;
  setRoomLighting(roomId: RoomId, state: Partial<LightingState>): Promise<void>;
  activateScene(roomId: RoomId, sceneId: string): Promise<void>;
  toggleCircadianLighting(enabled: boolean): void;
  setCircadianConfig(zoneId: ZoneId, config: CircadianLightingConfig): void;

  // Air Quality
  setAirPurifierMode(deviceId: DeviceId, mode: string): Promise<void>;
  updateAirQuality(roomId: RoomId, data: AirQualityData): void;

  // Scent Control
  setScentDiffuser(deviceId: DeviceId, state: Partial<ScentDiffuserState>): Promise<void>;

  // Glass Control
  setGlassOpacity(deviceId: DeviceId, opacity: number): Promise<void>;
  setGlassMode(deviceId: DeviceId, mode: 'manual' | 'auto' | 'privacy' | 'solar'): Promise<void>;

  // Presets
  activatePreset(presetId: string, roomId?: RoomId): Promise<void>;
  createPreset(preset: Omit<AtmospherePreset, 'id'>): AtmospherePreset;
  deletePreset(presetId: string): void;

  // Comfort
  calculateComfortScore(roomId: RoomId): ComfortScore;

  // Bulk Operations
  setWholeHomeTemperature(temperature: number): Promise<void>;
  turnOffAllLights(): Promise<void>;
  setAwayMode(): Promise<void>;
  setHomeMode(): Promise<void>;
}

// ============================================================================
// Default Presets
// ============================================================================

const defaultPresets: AtmospherePreset[] = [
  {
    id: 'morning',
    name: 'Morning',
    description: 'Energizing atmosphere to start the day',
    icon: 'sunrise',
    settings: {
      climate: { temperature: 21, mode: 'auto' },
      lighting: { brightness: 80, colorTemperature: 5000 },
    },
  },
  {
    id: 'relax',
    name: 'Relax',
    description: 'Calm and comfortable atmosphere',
    icon: 'sofa',
    settings: {
      climate: { temperature: 22, mode: 'auto' },
      lighting: { brightness: 40, colorTemperature: 2700 },
      scent: { enabled: true, scent: 'lavender', intensity: 30 },
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Optimal conditions for concentration',
    icon: 'brain',
    settings: {
      climate: { temperature: 20, mode: 'cool' },
      lighting: { brightness: 70, colorTemperature: 4500 },
    },
  },
  {
    id: 'movie',
    name: 'Movie Night',
    description: 'Cinema-like atmosphere',
    icon: 'film',
    settings: {
      lighting: { brightness: 5, colorTemperature: 2200 },
      glass: { opacity: 100 },
    },
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Peaceful environment for rest',
    icon: 'moon',
    settings: {
      climate: { temperature: 19, mode: 'auto' },
      lighting: { brightness: 0, colorTemperature: 2200 },
      scent: { enabled: true, scent: 'chamomile', intensity: 20 },
    },
  },
  {
    id: 'party',
    name: 'Party',
    description: 'Vibrant atmosphere for entertaining',
    icon: 'party',
    settings: {
      climate: { temperature: 20, mode: 'cool' },
      lighting: { brightness: 60, colorTemperature: 3500, color: { r: 255, g: 100, b: 150 } },
    },
  },
];

// ============================================================================
// Store
// ============================================================================

export const useAtmosphereStore = create<AtmosphereState & AtmosphereActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    hvacZones: new Map(),
    roomTemperatures: new Map(),
    roomHumidity: new Map(),
    outdoorTemperature: 20,
    outdoorHumidity: 50,
    roomAirQuality: new Map(),
    airPurifiers: new Map(),
    lightingZones: new Map(),
    lightStates: new Map(),
    activeScenes: new Map(),
    circadianEnabled: true,
    scentDiffusers: new Map(),
    electrochromicGlass: new Map(),
    presets: defaultPresets,
    activePreset: null,
    comfortScores: new Map(),

    // Climate Control
    async setTemperature(zoneId, temperature) {
      const zones = new Map(get().hvacZones);
      const zone = zones.get(zoneId);
      if (zone) {
        zone.state.targetTemperature = temperature;
        zones.set(zoneId, zone);
        set({ hvacZones: zones });

        // Send command to device via bridge
        // await bridgeManager.sendCommand({ deviceId: zone.thermostat, command: 'set_temperature', parameters: { temperature } });
      }
    },

    async setClimateMode(zoneId, mode) {
      const zones = new Map(get().hvacZones);
      const zone = zones.get(zoneId);
      if (zone) {
        zone.state.mode = mode;
        zone.state.isActive = mode !== 'off';
        zones.set(zoneId, zone);
        set({ hvacZones: zones });
      }
    },

    async setFanMode(zoneId, mode) {
      const zones = new Map(get().hvacZones);
      const zone = zones.get(zoneId);
      if (zone) {
        zone.state.fanMode = mode;
        zones.set(zoneId, zone);
        set({ hvacZones: zones });
      }
    },

    async setHumidity(zoneId, humidity) {
      const zones = new Map(get().hvacZones);
      const zone = zones.get(zoneId);
      if (zone) {
        zone.state.targetHumidity = humidity;
        zones.set(zoneId, zone);
        set({ hvacZones: zones });
      }
    },

    // Lighting Control
    async setLightState(deviceId, state) {
      const lights = new Map(get().lightStates);
      const current = lights.get(deviceId) ?? {
        isOn: false,
        brightness: 0,
      };
      lights.set(deviceId, { ...current, ...state });
      set({ lightStates: lights });

      // Send command to device
      // await bridgeManager.sendCommand({ deviceId, command: 'set', parameters: state });
    },

    async setRoomLighting(roomId, state) {
      // Find all lights in room and set their state
      const { lightingZones, lightStates } = get();

      for (const zone of lightingZones.values()) {
        if (zone.rooms.includes(roomId)) {
          for (const deviceId of zone.lights) {
            await get().setLightState(deviceId, state);
          }
        }
      }
    },

    async activateScene(roomId, sceneId) {
      const { lightingZones } = get();

      for (const zone of lightingZones.values()) {
        if (zone.rooms.includes(roomId)) {
          const scene = zone.scenes.find(s => s.id === sceneId);
          if (scene) {
            for (const sceneState of scene.states) {
              await get().setLightState(sceneState.deviceId, sceneState.state);
            }
          }
        }
      }

      const scenes = new Map(get().activeScenes);
      scenes.set(roomId, sceneId);
      set({ activeScenes: scenes });
    },

    toggleCircadianLighting(enabled) {
      set({ circadianEnabled: enabled });
    },

    setCircadianConfig(zoneId, config) {
      const zones = new Map(get().lightingZones);
      const zone = zones.get(zoneId);
      if (zone) {
        zone.circadian = config;
        zones.set(zoneId, zone);
        set({ lightingZones: zones });
      }
    },

    // Air Quality
    async setAirPurifierMode(deviceId, mode) {
      const purifiers = new Map(get().airPurifiers);
      purifiers.set(deviceId, { isOn: mode !== 'off', mode });
      set({ airPurifiers: purifiers });
    },

    updateAirQuality(roomId, data) {
      const airQuality = new Map(get().roomAirQuality);
      airQuality.set(roomId, data);
      set({ roomAirQuality: airQuality });

      // Recalculate comfort score
      get().calculateComfortScore(roomId);
    },

    // Scent Control
    async setScentDiffuser(deviceId, state) {
      const diffusers = new Map(get().scentDiffusers);
      const current = diffusers.get(deviceId);
      if (current) {
        diffusers.set(deviceId, { ...current, ...state });
        set({ scentDiffusers: diffusers });
      }
    },

    // Glass Control
    async setGlassOpacity(deviceId, opacity) {
      const glass = new Map(get().electrochromicGlass);
      const current = glass.get(deviceId);
      if (current) {
        glass.set(deviceId, { ...current, opacity });
        set({ electrochromicGlass: glass });
      }
    },

    async setGlassMode(deviceId, mode) {
      const glass = new Map(get().electrochromicGlass);
      const current = glass.get(deviceId);
      if (current) {
        glass.set(deviceId, { ...current, mode });
        set({ electrochromicGlass: glass });
      }
    },

    // Presets
    async activatePreset(presetId, roomId) {
      const preset = get().presets.find(p => p.id === presetId);
      if (!preset) return;

      const { settings } = preset;

      // Apply climate settings
      if (settings.climate) {
        for (const zone of get().hvacZones.values()) {
          if (!roomId || zone.rooms.includes(roomId)) {
            await get().setTemperature(zone.id, settings.climate.temperature);
            await get().setClimateMode(zone.id, settings.climate.mode);
            if (settings.climate.humidity) {
              await get().setHumidity(zone.id, settings.climate.humidity);
            }
          }
        }
      }

      // Apply lighting settings
      if (settings.lighting) {
        for (const zone of get().lightingZones.values()) {
          if (!roomId || zone.rooms.includes(roomId)) {
            for (const deviceId of zone.lights) {
              await get().setLightState(deviceId, {
                isOn: settings.lighting.brightness > 0,
                brightness: settings.lighting.brightness,
                colorTemperature: settings.lighting.colorTemperature,
                color: settings.lighting.color,
              });
            }
          }
        }
      }

      // Apply scent settings
      if (settings.scent) {
        for (const [deviceId, diffuser] of get().scentDiffusers) {
          await get().setScentDiffuser(deviceId, {
            isOn: settings.scent.enabled,
            scent: settings.scent.scent,
            intensity: settings.scent.intensity,
          });
        }
      }

      // Apply glass settings
      if (settings.glass) {
        for (const [deviceId, glass] of get().electrochromicGlass) {
          await get().setGlassOpacity(deviceId, settings.glass.opacity);
        }
      }

      set({ activePreset: presetId });
    },

    createPreset(preset) {
      const newPreset: AtmospherePreset = {
        ...preset,
        id: crypto.randomUUID(),
      };
      set(state => ({
        presets: [...state.presets, newPreset],
      }));
      return newPreset;
    },

    deletePreset(presetId) {
      set(state => ({
        presets: state.presets.filter(p => p.id !== presetId),
      }));
    },

    // Comfort Score
    calculateComfortScore(roomId) {
      const { roomTemperatures, roomHumidity, roomAirQuality } = get();

      const temp = roomTemperatures.get(roomId) ?? 22;
      const humidity = roomHumidity.get(roomId) ?? 50;
      const airQuality = roomAirQuality.get(roomId);

      // Calculate thermal comfort (PMV-based simplified)
      const thermalScore = calculateThermalComfort(temp, humidity);

      // Calculate air quality score
      const airScore = airQuality
        ? calculateAirQualityScore(airQuality)
        : 80;

      // Calculate humidity score
      const humidityScore = calculateHumidityScore(humidity);

      // Calculate lighting score (placeholder)
      const lightingScore = 80;

      // Overall score (weighted average)
      const overall = Math.round(
        thermalScore * 0.35 +
        airScore * 0.25 +
        humidityScore * 0.2 +
        lightingScore * 0.2
      );

      const score: ComfortScore = {
        overall,
        thermal: thermalScore,
        airQuality: airScore,
        lighting: lightingScore,
        humidity: humidityScore,
        factors: [
          { name: 'Temperature', value: temp, optimal: { min: 20, max: 24 }, weight: 0.35, contribution: thermalScore },
          { name: 'Air Quality', value: airQuality?.aqi ?? 50, optimal: { min: 0, max: 50 }, weight: 0.25, contribution: airScore },
          { name: 'Humidity', value: humidity, optimal: { min: 40, max: 60 }, weight: 0.2, contribution: humidityScore },
          { name: 'Lighting', value: 500, optimal: { min: 300, max: 500 }, weight: 0.2, contribution: lightingScore },
        ],
      };

      const scores = new Map(get().comfortScores);
      scores.set(roomId, score);
      set({ comfortScores: scores });

      return score;
    },

    // Bulk Operations
    async setWholeHomeTemperature(temperature) {
      for (const zone of get().hvacZones.values()) {
        await get().setTemperature(zone.id, temperature);
      }
    },

    async turnOffAllLights() {
      for (const deviceId of get().lightStates.keys()) {
        await get().setLightState(deviceId, { isOn: false, brightness: 0 });
      }
    },

    async setAwayMode() {
      // Lower temperature, turn off lights, etc.
      await get().setWholeHomeTemperature(18);
      await get().turnOffAllLights();

      // Turn off scent diffusers
      for (const deviceId of get().scentDiffusers.keys()) {
        await get().setScentDiffuser(deviceId, { isOn: false });
      }
    },

    async setHomeMode() {
      // Restore comfortable settings
      await get().setWholeHomeTemperature(22);
      await get().activatePreset('relax');
    },
  }))
);

// ============================================================================
// Helper Functions
// ============================================================================

function calculateThermalComfort(temp: number, humidity: number): number {
  // Simplified thermal comfort calculation
  // Optimal: 21-23°C
  const optimalTemp = 22;
  const deviation = Math.abs(temp - optimalTemp);

  if (deviation <= 1) return 100;
  if (deviation <= 2) return 90;
  if (deviation <= 3) return 75;
  if (deviation <= 4) return 60;
  if (deviation <= 5) return 45;
  return 30;
}

function calculateAirQualityScore(data: AirQualityData): number {
  // Based on AQI
  if (data.aqi <= 50) return 100;
  if (data.aqi <= 100) return 80;
  if (data.aqi <= 150) return 60;
  if (data.aqi <= 200) return 40;
  if (data.aqi <= 300) return 20;
  return 10;
}

function calculateHumidityScore(humidity: number): number {
  // Optimal: 40-60%
  if (humidity >= 40 && humidity <= 60) return 100;
  if (humidity >= 35 && humidity <= 65) return 85;
  if (humidity >= 30 && humidity <= 70) return 70;
  return 50;
}
