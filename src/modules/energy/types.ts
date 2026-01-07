/**
 * AICO Smart Home - Energy & Sustainability Module Types
 *
 * Types for energy monitoring, solar, battery, and EV charging.
 */

import type { DeviceId, ISOTimestamp } from '@/types/core';

// ============================================================================
// Energy Monitoring Types
// ============================================================================

export interface EnergyOverview {
  timestamp: ISOTimestamp;
  consumption: PowerReading;
  production: PowerReading;
  gridImport: number; // kW
  gridExport: number; // kW
  selfConsumption: number; // percentage
  selfSufficiency: number; // percentage
  batteryState?: BatteryState;
  evCharging?: EVChargingState;
}

export interface PowerReading {
  current: number; // kW
  today: number; // kWh
  thisMonth: number; // kWh
  thisYear: number; // kWh
  lifetime: number; // kWh
}

export interface EnergyHistory {
  resolution: 'minute' | 'hour' | 'day' | 'month';
  data: EnergyDataPoint[];
}

export interface EnergyDataPoint {
  timestamp: ISOTimestamp;
  consumption: number; // kWh
  production: number; // kWh
  gridImport: number;
  gridExport: number;
  batteryCharge?: number;
  batteryDischarge?: number;
}

// ============================================================================
// Solar Types
// ============================================================================

export interface SolarSystem {
  id: string;
  name: string;
  capacity: number; // kWp
  panels: number;
  inverters: SolarInverter[];
  orientation: number; // degrees from north
  tilt: number; // degrees from horizontal
  installDate: ISOTimestamp;
}

export interface SolarInverter {
  deviceId: DeviceId;
  name: string;
  capacity: number; // kW
  state: InverterState;
}

export interface InverterState {
  online: boolean;
  producing: boolean;
  power: number; // kW
  voltage: number;
  current: number;
  frequency: number;
  temperature: number;
  efficiency: number;
  todayEnergy: number; // kWh
  lifetimeEnergy: number; // kWh
  errors: string[];
}

export interface SolarForecast {
  date: string;
  hourly: SolarForecastHour[];
  totalProduction: number; // kWh
}

export interface SolarForecastHour {
  hour: number;
  production: number; // kWh
  irradiance: number; // W/m²
  cloudCover: number; // percentage
}

// ============================================================================
// Battery Storage Types
// ============================================================================

export interface BatterySystem {
  id: string;
  name: string;
  capacity: number; // kWh
  maxChargePower: number; // kW
  maxDischargePower: number; // kW
  batteries: Battery[];
  mode: BatteryMode;
  schedule?: BatterySchedule;
}

export interface Battery {
  deviceId: DeviceId;
  name: string;
  capacity: number; // kWh
  state: BatteryState;
}

export interface BatteryState {
  online: boolean;
  stateOfCharge: number; // percentage
  stateOfHealth: number; // percentage
  power: number; // kW (positive = charging, negative = discharging)
  voltage: number;
  current: number;
  temperature: number;
  cycleCount: number;
  status: 'idle' | 'charging' | 'discharging' | 'standby' | 'error';
  timeToFull?: number; // minutes
  timeToEmpty?: number; // minutes
}

export type BatteryMode =
  | 'self_consumption'  // Maximize solar usage
  | 'time_of_use'       // Charge during off-peak, discharge during peak
  | 'backup'            // Reserve for power outage
  | 'manual';           // Manual control

export interface BatterySchedule {
  enabled: boolean;
  entries: BatteryScheduleEntry[];
}

export interface BatteryScheduleEntry {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
  mode: 'charge' | 'discharge' | 'hold';
  power?: number; // kW
  targetSoC?: number; // percentage
}

// ============================================================================
// EV Charging Types
// ============================================================================

export interface EVCharger {
  deviceId: DeviceId;
  name: string;
  location: string;
  type: 'level2' | 'dc_fast';
  maxPower: number; // kW
  phases: 1 | 3;
  connector: EVConnectorType;
  state: EVChargerState;
  schedule?: EVChargingSchedule;
}

export type EVConnectorType = 'j1772' | 'ccs1' | 'ccs2' | 'chademo' | 'type2' | 'tesla';

export interface EVChargerState {
  online: boolean;
  status: EVChargerStatus;
  vehicleConnected: boolean;
  vehicleId?: string;
  currentPower: number; // kW
  sessionEnergy: number; // kWh
  sessionDuration: number; // minutes
  vehicleSoC?: number; // percentage
  targetSoC?: number;
  estimatedCompletion?: ISOTimestamp;
  limitReason?: string;
}

export type EVChargerStatus =
  | 'available'
  | 'preparing'
  | 'charging'
  | 'suspended_evse'
  | 'suspended_ev'
  | 'finishing'
  | 'reserved'
  | 'unavailable'
  | 'faulted';

export interface EVChargingSchedule {
  enabled: boolean;
  mode: 'immediate' | 'scheduled' | 'smart';
  entries?: ChargingScheduleEntry[];
  departureTime?: string;
  targetSoC?: number;
  preferSolar?: boolean;
  maxGridPower?: number;
}

export interface ChargingScheduleEntry {
  id: string;
  days: number[];
  startTime: string;
  endTime: string;
  maxPower?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  batteryCapacity: number; // kWh
  efficiency: number; // Wh/km
  connector: EVConnectorType;
  currentSoC?: number;
  range?: number; // km
  preConditioningSupported: boolean;
}

// ============================================================================
// Water Management Types
// ============================================================================

export interface WaterSystem {
  mainValve: DeviceId;
  meter: DeviceId;
  leakSensors: DeviceId[];
  irrigationZones: IrrigationZone[];
}

export interface WaterUsage {
  timestamp: ISOTimestamp;
  current: number; // liters per minute
  today: number; // liters
  thisMonth: number;
  thisYear: number;
}

export interface IrrigationZone {
  id: string;
  name: string;
  valve: DeviceId;
  moistureSensor?: DeviceId;
  schedule?: IrrigationSchedule;
  state: IrrigationState;
}

export interface IrrigationState {
  active: boolean;
  moistureLevel?: number;
  lastRun?: ISOTimestamp;
  nextRun?: ISOTimestamp;
}

export interface IrrigationSchedule {
  enabled: boolean;
  mode: 'fixed' | 'smart';
  entries?: IrrigationEntry[];
  moistureThreshold?: number;
  rainDelay?: boolean;
}

export interface IrrigationEntry {
  id: string;
  days: number[];
  startTime: string;
  duration: number; // minutes
}

export interface LeakDetection {
  deviceId: DeviceId;
  location: string;
  leakDetected: boolean;
  lastDetection?: ISOTimestamp;
  autoShutoff: boolean;
}

// ============================================================================
// Utility Rate Types
// ============================================================================

export interface UtilityRate {
  provider: string;
  planName: string;
  type: 'flat' | 'tiered' | 'time_of_use';
  currency: string;
  periods?: RatePeriod[];
  tiers?: RateTier[];
  flatRate?: number;
}

export interface RatePeriod {
  name: string;
  rate: number; // per kWh
  days: number[];
  startTime: string;
  endTime: string;
}

export interface RateTier {
  name: string;
  minUsage: number; // kWh
  maxUsage?: number;
  rate: number;
}

export interface EnergyCost {
  today: number;
  thisMonth: number;
  thisYear: number;
  projected: number; // projected monthly cost
  savings: number; // savings from solar/battery
}
