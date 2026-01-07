/**
 * AICO Smart Home - Bridge Layer Types
 *
 * Types for the Universal Bridge Layer that handles protocol integration.
 */

import type { DeviceId, ISOTimestamp } from '@/types/core';
import type { Device, DeviceState, DeviceCommand, CommandResult, ProtocolType, DeviceDiscoveryResult } from '@/types/devices';

// ============================================================================
// Protocol Adapter Interface
// ============================================================================

export interface ProtocolAdapter {
  readonly protocol: ProtocolType;
  readonly name: string;
  readonly version: string;

  // Lifecycle
  initialize(config: AdapterConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  destroy(): Promise<void>;

  // Device Operations
  discoverDevices(): Promise<DeviceDiscoveryResult[]>;
  getDeviceState(deviceId: DeviceId): Promise<DeviceState>;
  sendCommand(command: DeviceCommand): Promise<CommandResult>;

  // Subscriptions
  subscribeToDevice(deviceId: DeviceId, callback: DeviceStateCallback): Unsubscribe;
  subscribeToAll(callback: DeviceStateCallback): Unsubscribe;

  // Health
  getHealth(): AdapterHealth;
  ping(): Promise<number>; // Returns latency in ms
}

export type DeviceStateCallback = (deviceId: DeviceId, state: DeviceState) => void;
export type Unsubscribe = () => void;

// ============================================================================
// Adapter Configuration
// ============================================================================

export interface AdapterConfig {
  enabled: boolean;
  connectionParams: Record<string, unknown>;
  reconnect: ReconnectConfig;
  timeout: TimeoutConfig;
  logging: LoggingConfig;
}

export interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

export interface TimeoutConfig {
  connect: number; // ms
  command: number; // ms
  discovery: number; // ms
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includePayloads: boolean;
}

// ============================================================================
// Adapter Health
// ============================================================================

export interface AdapterHealth {
  status: AdapterStatus;
  connected: boolean;
  lastConnected?: ISOTimestamp;
  lastDisconnected?: ISOTimestamp;
  lastError?: AdapterError;
  metrics: AdapterMetrics;
  deviceCount: number;
}

export type AdapterStatus =
  | 'initializing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'
  | 'disabled';

export interface AdapterError {
  code: string;
  message: string;
  timestamp: ISOTimestamp;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface AdapterMetrics {
  commandsSent: number;
  commandsSucceeded: number;
  commandsFailed: number;
  averageLatency: number;
  uptime: number; // seconds
  reconnectCount: number;
}

// ============================================================================
// Protocol-Specific Configurations
// ============================================================================

export interface KNXConfig extends AdapterConfig {
  connectionParams: {
    host: string;
    port: number;
    physicalAddress: string;
    tunnelType: 'udp' | 'tcp';
  };
}

export interface MQTTConfig extends AdapterConfig {
  connectionParams: {
    broker: string;
    port: number;
    username?: string;
    password?: string;
    clientId: string;
    topicPrefix: string;
    qos: 0 | 1 | 2;
    useTLS: boolean;
  };
}

export interface ZigbeeConfig extends AdapterConfig {
  connectionParams: {
    serialPort: string;
    baudRate: number;
    adapter: 'zstack' | 'deconz' | 'zigate' | 'ezsp';
    panId?: number;
    channel?: number;
  };
}

export interface ZWaveConfig extends AdapterConfig {
  connectionParams: {
    serialPort: string;
    networkKey?: string;
    securityEnabled: boolean;
  };
}

export interface DALIConfig extends AdapterConfig {
  connectionParams: {
    interface: string;
    busNumber: number;
  };
}

export interface ModbusConfig extends AdapterConfig {
  connectionParams: {
    type: 'tcp' | 'rtu';
    host?: string;
    port?: number;
    serialPort?: string;
    baudRate?: number;
    slaveId: number;
  };
}

export interface HomeKitConfig extends AdapterConfig {
  connectionParams: {
    pin: string;
    name: string;
    setupId?: string;
  };
}

export interface CustomAPIConfig extends AdapterConfig {
  connectionParams: {
    baseUrl: string;
    authType: 'none' | 'basic' | 'bearer' | 'api_key';
    credentials?: Record<string, string>;
    headers?: Record<string, string>;
  };
}

// ============================================================================
// Message Normalization
// ============================================================================

export interface NormalizedMessage {
  id: string;
  timestamp: ISOTimestamp;
  protocol: ProtocolType;
  type: MessageType;
  deviceId: DeviceId;
  payload: NormalizedPayload;
  raw: unknown;
}

export type MessageType =
  | 'state_update'
  | 'command'
  | 'command_response'
  | 'event'
  | 'discovery'
  | 'heartbeat'
  | 'error';

export interface NormalizedPayload {
  property?: string;
  value?: unknown;
  previousValue?: unknown;
  unit?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Bridge Manager Types
// ============================================================================

export interface BridgeConfig {
  adapters: Record<ProtocolType, AdapterConfig>;
  messageQueue: MessageQueueConfig;
  rateLimiting: RateLimitConfig;
  faultTolerance: FaultToleranceConfig;
}

export interface MessageQueueConfig {
  maxSize: number;
  processingConcurrency: number;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxCommandsPerSecond: number;
  maxCommandsPerDevice: number;
  burstSize: number;
}

export interface FaultToleranceConfig {
  circuitBreaker: CircuitBreakerConfig;
  bulkhead: BulkheadConfig;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number; // ms
  halfOpenRequests: number;
}

export interface BulkheadConfig {
  enabled: boolean;
  maxConcurrent: number;
  maxQueue: number;
}

// ============================================================================
// Device Mapping
// ============================================================================

export interface DeviceMapping {
  deviceId: DeviceId;
  protocol: ProtocolType;
  protocolAddress: string;
  propertyMappings: PropertyMapping[];
  commandMappings: CommandMapping[];
}

export interface PropertyMapping {
  deviceProperty: string;
  protocolProperty: string;
  transform?: ValueTransform;
}

export interface CommandMapping {
  deviceCommand: string;
  protocolCommand: string;
  parameterMappings: ParameterMapping[];
}

export interface ParameterMapping {
  deviceParam: string;
  protocolParam: string;
  transform?: ValueTransform;
}

export interface ValueTransform {
  type: 'linear' | 'map' | 'function';
  config: LinearTransform | MapTransform | FunctionTransform;
}

export interface LinearTransform {
  type: 'linear';
  inputMin: number;
  inputMax: number;
  outputMin: number;
  outputMax: number;
}

export interface MapTransform {
  type: 'map';
  mappings: Record<string, unknown>;
}

export interface FunctionTransform {
  type: 'function';
  forward: string; // JavaScript expression
  reverse: string;
}
