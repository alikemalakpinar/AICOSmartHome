/**
 * AICO Smart Home - Device Type Definitions
 *
 * Comprehensive device modeling for all supported device types.
 */

import type {
  DeviceId,
  RoomId,
  ZoneId,
  ResidenceId,
  ISOTimestamp,
  Vector3D,
} from './core';

// ============================================================================
// Protocol Types
// ============================================================================

export type ProtocolType =
  | 'knx'
  | 'mqtt'
  | 'zigbee'
  | 'zwave'
  | 'dali'
  | 'modbus'
  | 'homekit'
  | 'matter'
  | 'wifi'
  | 'bluetooth'
  | 'thread'
  | 'custom_api'
  | 'internal';

export interface ProtocolAddress {
  protocol: ProtocolType;
  address: string;
  channel?: string;
  endpoint?: number;
}

// ============================================================================
// Device Categories
// ============================================================================

export type DeviceCategory =
  | 'lighting'
  | 'climate'
  | 'security'
  | 'media'
  | 'appliance'
  | 'sensor'
  | 'cover'
  | 'lock'
  | 'camera'
  | 'energy'
  | 'water'
  | 'vehicle'
  | 'wellness'
  | 'kitchen'
  | 'cellar'
  | 'outdoor'
  | 'network'
  | 'other';

// ============================================================================
// Device Types
// ============================================================================

export type DeviceType =
  // Lighting
  | 'light_switch'
  | 'light_dimmer'
  | 'light_color'
  | 'light_tunable_white'
  | 'light_rgbw'
  | 'light_strip'
  | 'light_chandelier'
  | 'light_outdoor'
  | 'light_pathway'
  // Climate
  | 'thermostat'
  | 'hvac_unit'
  | 'air_handler'
  | 'fan'
  | 'ceiling_fan'
  | 'humidifier'
  | 'dehumidifier'
  | 'air_purifier'
  | 'heater'
  | 'cooler'
  | 'heat_pump'
  | 'radiant_floor'
  | 'fireplace'
  | 'scent_diffuser'
  // Covers
  | 'blind'
  | 'shade'
  | 'curtain'
  | 'shutter'
  | 'awning'
  | 'garage_door'
  | 'gate'
  | 'electrochromic_glass'
  // Security
  | 'motion_sensor'
  | 'door_sensor'
  | 'window_sensor'
  | 'glass_break_sensor'
  | 'smoke_detector'
  | 'co_detector'
  | 'water_leak_sensor'
  | 'vibration_sensor'
  | 'siren'
  | 'panic_button'
  | 'keypad'
  | 'security_panel'
  // Locks
  | 'door_lock'
  | 'deadbolt'
  | 'smart_lock'
  | 'intercom'
  | 'video_doorbell'
  // Cameras
  | 'camera_indoor'
  | 'camera_outdoor'
  | 'camera_ptz'
  | 'camera_thermal'
  | 'camera_doorbell'
  | 'camera_drone'
  // Media
  | 'tv'
  | 'projector'
  | 'screen'
  | 'speaker'
  | 'soundbar'
  | 'av_receiver'
  | 'media_player'
  | 'streaming_device'
  | 'game_console'
  | 'turntable'
  // Appliances
  | 'refrigerator'
  | 'freezer'
  | 'wine_cooler'
  | 'oven'
  | 'cooktop'
  | 'range_hood'
  | 'dishwasher'
  | 'washer'
  | 'dryer'
  | 'vacuum_robot'
  | 'coffee_machine'
  | 'ice_maker'
  // Energy
  | 'smart_meter'
  | 'solar_inverter'
  | 'battery_storage'
  | 'ev_charger'
  | 'generator'
  | 'ups'
  | 'smart_outlet'
  | 'power_strip'
  // Water
  | 'water_meter'
  | 'water_valve'
  | 'irrigation_controller'
  | 'pool_pump'
  | 'pool_heater'
  | 'hot_tub'
  | 'water_heater'
  | 'water_softener'
  // Sensors
  | 'temperature_sensor'
  | 'humidity_sensor'
  | 'air_quality_sensor'
  | 'light_sensor'
  | 'presence_sensor'
  | 'occupancy_sensor'
  | 'weather_station'
  | 'radon_sensor'
  | 'noise_sensor'
  // Wellness
  | 'sauna'
  | 'steam_room'
  | 'spa_controller'
  | 'smart_mirror'
  | 'sleep_tracker'
  | 'air_monitor'
  // Vehicle
  | 'vehicle'
  | 'vehicle_charger'
  // Network
  | 'router'
  | 'access_point'
  | 'switch'
  | 'bridge'
  // Other
  | 'elevator'
  | 'dumbwaiter'
  | 'fountain'
  | 'aquarium'
  | 'pet_feeder'
  | 'robot_patrol'
  | 'custom';

// ============================================================================
// Capability Types
// ============================================================================

export type CapabilityType =
  | 'on_off'
  | 'brightness'
  | 'color_temperature'
  | 'color'
  | 'temperature_control'
  | 'temperature_reading'
  | 'humidity_control'
  | 'humidity_reading'
  | 'position'
  | 'tilt'
  | 'fan_speed'
  | 'mode'
  | 'lock'
  | 'motion'
  | 'contact'
  | 'presence'
  | 'occupancy'
  | 'air_quality'
  | 'energy_reading'
  | 'power_reading'
  | 'water_reading'
  | 'battery'
  | 'volume'
  | 'media_playback'
  | 'source_selection'
  | 'camera_stream'
  | 'camera_ptz'
  | 'recording'
  | 'alarm'
  | 'notification'
  | 'scene'
  | 'schedule'
  | 'voice_control'
  | 'custom';

export interface Capability {
  type: CapabilityType;
  name: string;
  readable: boolean;
  writable: boolean;
  config: CapabilityConfig;
}

export type CapabilityConfig =
  | OnOffCapabilityConfig
  | BrightnessCapabilityConfig
  | ColorTemperatureCapabilityConfig
  | ColorCapabilityConfig
  | TemperatureCapabilityConfig
  | HumidityCapabilityConfig
  | PositionCapabilityConfig
  | FanSpeedCapabilityConfig
  | ModeCapabilityConfig
  | NumericCapabilityConfig
  | EnumCapabilityConfig
  | CustomCapabilityConfig;

export interface OnOffCapabilityConfig {
  type: 'on_off';
}

export interface BrightnessCapabilityConfig {
  type: 'brightness';
  min: number;
  max: number;
  step: number;
}

export interface ColorTemperatureCapabilityConfig {
  type: 'color_temperature';
  minKelvin: number;
  maxKelvin: number;
}

export interface ColorCapabilityConfig {
  type: 'color';
  colorMode: 'rgb' | 'hsv' | 'xy';
}

export interface TemperatureCapabilityConfig {
  type: 'temperature';
  min: number;
  max: number;
  step: number;
  unit: 'celsius' | 'fahrenheit';
}

export interface HumidityCapabilityConfig {
  type: 'humidity';
  min: number;
  max: number;
}

export interface PositionCapabilityConfig {
  type: 'position';
  min: number;
  max: number;
  supportsStop: boolean;
}

export interface FanSpeedCapabilityConfig {
  type: 'fan_speed';
  speeds: string[];
}

export interface ModeCapabilityConfig {
  type: 'mode';
  modes: string[];
}

export interface NumericCapabilityConfig {
  type: 'numeric';
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface EnumCapabilityConfig {
  type: 'enum';
  values: string[];
}

export interface CustomCapabilityConfig {
  type: 'custom';
  schema: Record<string, unknown>;
}

// ============================================================================
// Device State Types
// ============================================================================

export interface DeviceState {
  online: boolean;
  lastSeen: ISOTimestamp;
  lastChanged: ISOTimestamp;
  values: Record<string, DeviceStateValue>;
}

export type DeviceStateValue =
  | boolean
  | number
  | string
  | Record<string, unknown>;

// ============================================================================
// Device Health Types
// ============================================================================

export type DeviceHealthStatus = 'healthy' | 'degraded' | 'offline' | 'error';

export interface DeviceHealth {
  status: DeviceHealthStatus;
  lastCheck: ISOTimestamp;
  uptime: number; // seconds
  signalStrength?: number; // dBm for wireless
  batteryLevel?: number; // 0-100
  firmwareVersion?: string;
  firmwareUpdateAvailable?: boolean;
  errors: DeviceError[];
  metrics: DeviceMetrics;
}

export interface DeviceError {
  code: string;
  message: string;
  timestamp: ISOTimestamp;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface DeviceMetrics {
  commandSuccessRate: number;
  averageResponseTime: number; // milliseconds
  totalCommands: number;
  failedCommands: number;
}

// ============================================================================
// Device Metadata
// ============================================================================

export interface DeviceMetadata {
  manufacturer: string;
  model: string;
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
  installDate?: ISOTimestamp;
  warrantyExpiry?: ISOTimestamp;
  notes?: string;
  tags: string[];
  customFields: Record<string, string>;
}

// ============================================================================
// Main Device Interface
// ============================================================================

export interface Device {
  id: DeviceId;
  name: string;
  displayName: string;
  icon: string;
  category: DeviceCategory;
  type: DeviceType;
  protocol: ProtocolAddress;
  roomId: RoomId;
  zoneIds: ZoneId[];
  residenceId: ResidenceId;
  capabilities: Capability[];
  state: DeviceState;
  health: DeviceHealth;
  metadata: DeviceMetadata;
  position?: Vector3D;
  isHidden: boolean;
  isFavorite: boolean;
  sortOrder: number;
}

// ============================================================================
// Device Group Types
// ============================================================================

export interface DeviceGroup {
  id: string;
  name: string;
  icon: string;
  devices: DeviceId[];
  type: 'manual' | 'automatic';
  autoGroupRule?: AutoGroupRule;
}

export interface AutoGroupRule {
  type: 'room' | 'type' | 'category' | 'tag';
  value: string;
}

// ============================================================================
// Command Types
// ============================================================================

export interface DeviceCommand {
  deviceId: DeviceId;
  command: string;
  parameters: Record<string, unknown>;
  priority: CommandPriority;
  timeout?: number; // milliseconds
}

export type CommandPriority = 'low' | 'normal' | 'high' | 'critical';

export interface CommandResult {
  success: boolean;
  deviceId: DeviceId;
  command: string;
  executedAt: ISOTimestamp;
  duration: number; // milliseconds
  error?: string;
  previousState?: DeviceState;
  newState?: DeviceState;
}

// ============================================================================
// Specific Device Types (Type-safe device configs)
// ============================================================================

export interface LightDevice extends Device {
  type: 'light_switch' | 'light_dimmer' | 'light_color' | 'light_tunable_white' | 'light_rgbw';
  state: DeviceState & {
    values: {
      on: boolean;
      brightness?: number;
      colorTemperature?: number;
      color?: { r: number; g: number; b: number };
    };
  };
}

export interface ThermostatDevice extends Device {
  type: 'thermostat';
  state: DeviceState & {
    values: {
      mode: 'off' | 'heat' | 'cool' | 'auto' | 'fan_only';
      targetTemperature: number;
      currentTemperature: number;
      humidity?: number;
      fanMode?: 'auto' | 'low' | 'medium' | 'high';
    };
  };
}

export interface CoverDevice extends Device {
  type: 'blind' | 'shade' | 'curtain' | 'shutter' | 'electrochromic_glass';
  state: DeviceState & {
    values: {
      position: number; // 0-100, 0 = closed
      tilt?: number; // 0-100 for blinds
      moving: boolean;
    };
  };
}

export interface LockDevice extends Device {
  type: 'door_lock' | 'deadbolt' | 'smart_lock';
  state: DeviceState & {
    values: {
      locked: boolean;
      jammed?: boolean;
      batteryLow?: boolean;
    };
  };
}

export interface CameraDevice extends Device {
  type: 'camera_indoor' | 'camera_outdoor' | 'camera_ptz' | 'camera_thermal' | 'camera_doorbell';
  state: DeviceState & {
    values: {
      streaming: boolean;
      recording: boolean;
      motionDetected?: boolean;
      nightVision?: boolean;
    };
  };
  streamUrl: string;
  snapshotUrl: string;
  ptzCapabilities?: PTZCapabilities;
}

export interface PTZCapabilities {
  pan: { min: number; max: number };
  tilt: { min: number; max: number };
  zoom: { min: number; max: number };
  presets: PTZPreset[];
}

export interface PTZPreset {
  id: string;
  name: string;
  position: { pan: number; tilt: number; zoom: number };
}

export interface SensorDevice extends Device {
  type: 'temperature_sensor' | 'humidity_sensor' | 'air_quality_sensor' | 'motion_sensor' | 'presence_sensor';
  state: DeviceState & {
    values: {
      value: number | boolean;
      unit?: string;
    };
  };
}

export interface EnergyDevice extends Device {
  type: 'smart_meter' | 'solar_inverter' | 'battery_storage' | 'ev_charger';
  state: DeviceState & {
    values: {
      power: number; // watts
      energy?: number; // watt-hours
      voltage?: number;
      current?: number;
      frequency?: number;
    };
  };
}

export interface MediaDevice extends Device {
  type: 'tv' | 'speaker' | 'av_receiver' | 'media_player';
  state: DeviceState & {
    values: {
      on: boolean;
      volume?: number;
      muted?: boolean;
      source?: string;
      mediaTitle?: string;
      mediaArtist?: string;
      playbackState?: 'playing' | 'paused' | 'stopped';
    };
  };
}

// ============================================================================
// Device Registry Types
// ============================================================================

export interface DeviceRegistryEntry {
  device: Device;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  version: number;
}

export interface DeviceDiscoveryResult {
  protocol: ProtocolType;
  address: string;
  type: DeviceType;
  name: string;
  capabilities: CapabilityType[];
  metadata: Partial<DeviceMetadata>;
}
