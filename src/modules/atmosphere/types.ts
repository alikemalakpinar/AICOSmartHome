/**
 * AICO Smart Home - Atmosphere & Comfort Module Types
 *
 * Types for climate, lighting, and environmental control.
 */

import type { DeviceId, RoomId, ZoneId, ISOTimestamp } from '@/types/core';

// ============================================================================
// Climate Types
// ============================================================================

export interface ClimateState {
  temperature: number;
  targetTemperature: number;
  humidity: number;
  targetHumidity?: number;
  mode: ClimateMode;
  fanMode: FanMode;
  isActive: boolean;
}

export type ClimateMode = 'off' | 'heat' | 'cool' | 'auto' | 'fan_only' | 'dry';
export type FanMode = 'auto' | 'low' | 'medium' | 'high' | 'turbo' | 'quiet';

export interface HVACZone {
  id: ZoneId;
  name: string;
  rooms: RoomId[];
  thermostat: DeviceId;
  vents: DeviceId[];
  state: ClimateState;
  schedule?: ClimateSchedule;
}

export interface ClimateSchedule {
  enabled: boolean;
  entries: ClimateScheduleEntry[];
}

export interface ClimateScheduleEntry {
  id: string;
  name: string;
  days: number[]; // 0-6
  time: string; // HH:mm
  temperature: number;
  mode: ClimateMode;
}

// ============================================================================
// Air Quality Types
// ============================================================================

export interface AirQualityData {
  timestamp: ISOTimestamp;
  co2: number; // ppm
  pm25: number; // μg/m³
  pm10: number;
  voc: number; // ppb
  humidity: number; // %
  temperature: number;
  aqi: number; // Air Quality Index (0-500)
  aqiCategory: AQICategory;
}

export type AQICategory = 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AirPurifierState {
  deviceId: DeviceId;
  isOn: boolean;
  mode: 'auto' | 'manual' | 'sleep' | 'turbo';
  fanSpeed: number; // 0-100
  filterLife: number; // 0-100
  filterChangeRequired: boolean;
}

// ============================================================================
// Lighting Types
// ============================================================================

export interface LightingState {
  isOn: boolean;
  brightness: number; // 0-100
  colorTemperature?: number; // Kelvin
  color?: RGBColor;
  effect?: LightEffect;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export type LightEffect = 'none' | 'candle' | 'fireplace' | 'colorloop' | 'sunrise' | 'sunset';

export interface CircadianLightingConfig {
  enabled: boolean;
  wakeTime: string; // HH:mm
  sleepTime: string;
  curve: CircadianCurvePoint[];
}

export interface CircadianCurvePoint {
  time: string; // HH:mm
  brightness: number;
  colorTemperature: number;
}

export interface LightingZone {
  id: ZoneId;
  name: string;
  rooms: RoomId[];
  lights: DeviceId[];
  scenes: LightingScene[];
  circadian?: CircadianLightingConfig;
}

export interface LightingScene {
  id: string;
  name: string;
  icon: string;
  states: LightSceneState[];
  transitionTime: number; // ms
}

export interface LightSceneState {
  deviceId: DeviceId;
  state: LightingState;
}

// ============================================================================
// Scent & Aromatherapy Types
// ============================================================================

export interface ScentDiffuserState {
  deviceId: DeviceId;
  isOn: boolean;
  intensity: number; // 0-100
  scent: string;
  remainingCapacity: number; // 0-100
  schedule?: ScentSchedule;
}

export interface ScentSchedule {
  enabled: boolean;
  entries: ScentScheduleEntry[];
}

export interface ScentScheduleEntry {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
  scent: string;
  intensity: number;
}

// ============================================================================
// Electrochromic Glass Types
// ============================================================================

export interface ElectrochromicGlassState {
  deviceId: DeviceId;
  opacity: number; // 0-100 (0 = fully transparent)
  tint?: string; // color tint if supported
  mode: GlassMode;
  solarGain: number; // current solar heat gain coefficient
}

export type GlassMode = 'manual' | 'auto' | 'privacy' | 'solar';

export interface GlassAutomationConfig {
  enabled: boolean;
  solarThreshold: number; // W/m²
  privacySchedule?: {
    start: string;
    end: string;
    opacity: number;
  };
}

// ============================================================================
// Comfort Score Types
// ============================================================================

export interface ComfortScore {
  overall: number; // 0-100
  thermal: number;
  airQuality: number;
  lighting: number;
  humidity: number;
  factors: ComfortFactor[];
}

export interface ComfortFactor {
  name: string;
  value: number;
  optimal: { min: number; max: number };
  weight: number;
  contribution: number;
}

// ============================================================================
// Atmosphere Presets
// ============================================================================

export interface AtmospherePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: AtmosphereSettings;
}

export interface AtmosphereSettings {
  climate?: {
    temperature: number;
    humidity?: number;
    mode: ClimateMode;
  };
  lighting?: {
    brightness: number;
    colorTemperature: number;
    color?: RGBColor;
  };
  scent?: {
    enabled: boolean;
    scent: string;
    intensity: number;
  };
  glass?: {
    opacity: number;
  };
}
