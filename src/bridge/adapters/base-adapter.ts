/**
 * AICO Smart Home - Base Protocol Adapter
 *
 * Abstract base class for all protocol adapters.
 */

import { EventEmitter } from 'eventemitter3';
import type { DeviceId, ISOTimestamp } from '@/types/core';
import type { DeviceState, DeviceCommand, CommandResult, ProtocolType, DeviceDiscoveryResult } from '@/types/devices';
import type {
  ProtocolAdapter,
  AdapterConfig,
  AdapterHealth,
  AdapterStatus,
  AdapterMetrics,
  AdapterError,
  DeviceStateCallback,
  Unsubscribe,
} from '../types';

export interface AdapterEvents {
  'connected': () => void;
  'disconnected': (reason?: string) => void;
  'reconnecting': (attempt: number) => void;
  'error': (error: AdapterError) => void;
  'device:state': (deviceId: DeviceId, state: DeviceState) => void;
  'device:discovered': (device: DeviceDiscoveryResult) => void;
}

export abstract class BaseProtocolAdapter extends EventEmitter<AdapterEvents> implements ProtocolAdapter {
  abstract readonly protocol: ProtocolType;
  abstract readonly name: string;
  abstract readonly version: string;

  protected config!: AdapterConfig;
  protected status: AdapterStatus = 'disconnected';
  protected lastError?: AdapterError;
  protected metrics: AdapterMetrics = {
    commandsSent: 0,
    commandsSucceeded: 0,
    commandsFailed: 0,
    averageLatency: 0,
    uptime: 0,
    reconnectCount: 0,
  };
  protected connectedAt?: ISOTimestamp;
  protected disconnectedAt?: ISOTimestamp;
  protected reconnectAttempt = 0;
  protected reconnectTimeout?: ReturnType<typeof setTimeout>;
  protected uptimeInterval?: ReturnType<typeof setInterval>;
  protected deviceSubscriptions = new Map<DeviceId, Set<DeviceStateCallback>>();
  protected globalSubscriptions = new Set<DeviceStateCallback>();

  async initialize(config: AdapterConfig): Promise<void> {
    this.config = config;
    this.status = 'initializing';
    await this.onInitialize(config);
    this.status = 'disconnected';
  }

  async connect(): Promise<void> {
    if (this.status === 'connected') {
      return;
    }

    this.status = 'connecting';

    try {
      await this.withTimeout(
        this.onConnect(),
        this.config.timeout.connect,
        'Connection timeout'
      );

      this.status = 'connected';
      this.connectedAt = new Date().toISOString() as ISOTimestamp;
      this.reconnectAttempt = 0;
      this.startUptimeTracking();
      this.emit('connected');
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.status === 'disconnected') {
      return;
    }

    this.clearReconnectTimeout();
    this.stopUptimeTracking();

    try {
      await this.onDisconnect();
    } finally {
      this.status = 'disconnected';
      this.disconnectedAt = new Date().toISOString() as ISOTimestamp;
      this.emit('disconnected');
    }
  }

  async destroy(): Promise<void> {
    await this.disconnect();
    this.deviceSubscriptions.clear();
    this.globalSubscriptions.clear();
    this.removeAllListeners();
    await this.onDestroy();
  }

  async sendCommand(command: DeviceCommand): Promise<CommandResult> {
    this.metrics.commandsSent++;
    const startTime = performance.now();

    try {
      const result = await this.withTimeout(
        this.onSendCommand(command),
        command.timeout ?? this.config.timeout.command,
        'Command timeout'
      );

      const duration = performance.now() - startTime;
      this.updateLatencyMetric(duration);

      if (result.success) {
        this.metrics.commandsSucceeded++;
      } else {
        this.metrics.commandsFailed++;
      }

      return result;
    } catch (error) {
      this.metrics.commandsFailed++;
      return {
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  subscribeToDevice(deviceId: DeviceId, callback: DeviceStateCallback): Unsubscribe {
    let subscriptions = this.deviceSubscriptions.get(deviceId);
    if (!subscriptions) {
      subscriptions = new Set();
      this.deviceSubscriptions.set(deviceId, subscriptions);
    }
    subscriptions.add(callback);

    return () => {
      subscriptions?.delete(callback);
      if (subscriptions?.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
      }
    };
  }

  subscribeToAll(callback: DeviceStateCallback): Unsubscribe {
    this.globalSubscriptions.add(callback);
    return () => {
      this.globalSubscriptions.delete(callback);
    };
  }

  getHealth(): AdapterHealth {
    return {
      status: this.status,
      connected: this.status === 'connected',
      lastConnected: this.connectedAt,
      lastDisconnected: this.disconnectedAt,
      lastError: this.lastError,
      metrics: { ...this.metrics },
      deviceCount: this.getDeviceCount(),
    };
  }

  async ping(): Promise<number> {
    const start = performance.now();
    await this.onPing();
    return performance.now() - start;
  }

  // Protected methods for subclasses
  protected abstract onInitialize(config: AdapterConfig): Promise<void>;
  protected abstract onConnect(): Promise<void>;
  protected abstract onDisconnect(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
  protected abstract onSendCommand(command: DeviceCommand): Promise<CommandResult>;
  protected abstract onPing(): Promise<void>;
  protected abstract getDeviceCount(): number;

  protected notifyStateChange(deviceId: DeviceId, state: DeviceState): void {
    // Notify device-specific subscribers
    const deviceSubs = this.deviceSubscriptions.get(deviceId);
    if (deviceSubs) {
      for (const callback of deviceSubs) {
        try {
          callback(deviceId, state);
        } catch (error) {
          console.error('Error in device state callback:', error);
        }
      }
    }

    // Notify global subscribers
    for (const callback of this.globalSubscriptions) {
      try {
        callback(deviceId, state);
      } catch (error) {
        console.error('Error in global state callback:', error);
      }
    }

    // Emit event
    this.emit('device:state', deviceId, state);
  }

  protected handleConnectionError(error: unknown): void {
    const adapterError: AdapterError = {
      code: 'CONNECTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() as ISOTimestamp,
      recoverable: this.config.reconnect.enabled,
    };

    this.lastError = adapterError;
    this.status = 'error';
    this.emit('error', adapterError);

    if (this.config.reconnect.enabled) {
      this.scheduleReconnect();
    }
  }

  protected scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.config.reconnect.maxAttempts) {
      this.status = 'error';
      return;
    }

    this.status = 'reconnecting';
    this.reconnectAttempt++;

    const delay = Math.min(
      this.config.reconnect.initialDelay *
        Math.pow(this.config.reconnect.backoffMultiplier, this.reconnectAttempt - 1),
      this.config.reconnect.maxDelay
    );

    this.emit('reconnecting', this.reconnectAttempt);

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
        this.metrics.reconnectCount++;
      } catch {
        // Error handling is done in connect()
      }
    }, delay);
  }

  protected clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  protected startUptimeTracking(): void {
    this.uptimeInterval = setInterval(() => {
      this.metrics.uptime++;
    }, 1000);
  }

  protected stopUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = undefined;
    }
  }

  protected updateLatencyMetric(latency: number): void {
    const total = this.metrics.commandsSucceeded + this.metrics.commandsFailed;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (total - 1) + latency) / total;
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    message: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(message)), timeout);
      }),
    ]);
  }
}
