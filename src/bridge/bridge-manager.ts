/**
 * AICO Smart Home - Bridge Manager
 *
 * Central manager for all protocol adapters with unified device control.
 */

import { EventEmitter } from 'eventemitter3';
import type { DeviceId, ISOTimestamp } from '@/types/core';
import type { Device, DeviceState, DeviceCommand, CommandResult, ProtocolType, DeviceDiscoveryResult } from '@/types/devices';
import type {
  ProtocolAdapter,
  BridgeConfig,
  AdapterHealth,
  NormalizedMessage,
  DeviceMapping,
} from './types';

interface BridgeEvents {
  'adapter:connected': (protocol: ProtocolType) => void;
  'adapter:disconnected': (protocol: ProtocolType, reason?: string) => void;
  'adapter:error': (protocol: ProtocolType, error: Error) => void;
  'device:state': (deviceId: DeviceId, state: DeviceState, protocol: ProtocolType) => void;
  'device:discovered': (device: DeviceDiscoveryResult) => void;
  'command:sent': (command: DeviceCommand) => void;
  'command:completed': (result: CommandResult) => void;
  'message:normalized': (message: NormalizedMessage) => void;
}

interface CommandQueueItem {
  command: DeviceCommand;
  resolve: (result: CommandResult) => void;
  reject: (error: Error) => void;
  retries: number;
  addedAt: number;
}

interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure?: number;
  successesInHalfOpen: number;
}

export class BridgeManager extends EventEmitter<BridgeEvents> {
  private adapters = new Map<ProtocolType, ProtocolAdapter>();
  private deviceMappings = new Map<DeviceId, DeviceMapping>();
  private deviceStates = new Map<DeviceId, DeviceState>();
  private commandQueue: CommandQueueItem[] = [];
  private processing = false;
  private circuitBreakers = new Map<ProtocolType, CircuitBreaker>();
  private config!: BridgeConfig;

  async initialize(config: BridgeConfig): Promise<void> {
    this.config = config;

    // Initialize circuit breakers for each protocol
    for (const protocol of Object.keys(config.adapters) as ProtocolType[]) {
      this.circuitBreakers.set(protocol, {
        state: 'closed',
        failures: 0,
        successesInHalfOpen: 0,
      });
    }
  }

  async registerAdapter(adapter: ProtocolAdapter): Promise<void> {
    const protocol = adapter.protocol;
    const config = this.config.adapters[protocol];

    if (!config?.enabled) {
      console.log(`Adapter ${protocol} is disabled`);
      return;
    }

    await adapter.initialize(config);

    // Set up event forwarding
    adapter.subscribeToAll((deviceId, state) => {
      this.handleDeviceStateUpdate(deviceId, state, protocol);
    });

    this.adapters.set(protocol, adapter);
    console.log(`Registered adapter: ${adapter.name}`);
  }

  async connectAll(): Promise<void> {
    const connectionPromises = Array.from(this.adapters.entries()).map(
      async ([protocol, adapter]) => {
        try {
          await adapter.connect();
          this.emit('adapter:connected', protocol);
        } catch (error) {
          console.error(`Failed to connect ${protocol}:`, error);
          this.emit('adapter:error', protocol, error as Error);
        }
      }
    );

    await Promise.allSettled(connectionPromises);
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.adapters.entries()).map(
      async ([protocol, adapter]) => {
        try {
          await adapter.disconnect();
          this.emit('adapter:disconnected', protocol);
        } catch (error) {
          console.error(`Failed to disconnect ${protocol}:`, error);
        }
      }
    );

    await Promise.allSettled(disconnectPromises);
  }

  async destroy(): Promise<void> {
    await this.disconnectAll();

    for (const adapter of this.adapters.values()) {
      await adapter.destroy();
    }

    this.adapters.clear();
    this.deviceMappings.clear();
    this.deviceStates.clear();
    this.commandQueue = [];
    this.removeAllListeners();
  }

  // Device Operations
  async sendCommand(command: DeviceCommand): Promise<CommandResult> {
    const mapping = this.deviceMappings.get(command.deviceId);
    if (!mapping) {
      return {
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Device not found',
      };
    }

    // Check rate limiting
    if (this.isRateLimited(command.deviceId)) {
      return {
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Rate limited',
      };
    }

    // Check circuit breaker
    const protocol = mapping.protocol;
    if (!this.canExecute(protocol)) {
      return {
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Circuit breaker open',
      };
    }

    // Queue the command
    return this.queueCommand(command);
  }

  async getDeviceState(deviceId: DeviceId): Promise<DeviceState | null> {
    // Try cache first
    const cached = this.deviceStates.get(deviceId);
    if (cached) {
      return cached;
    }

    // Get from adapter
    const mapping = this.deviceMappings.get(deviceId);
    if (!mapping) {
      return null;
    }

    const adapter = this.adapters.get(mapping.protocol);
    if (!adapter) {
      return null;
    }

    const state = await adapter.getDeviceState(deviceId);
    this.deviceStates.set(deviceId, state);
    return state;
  }

  async discoverDevices(): Promise<DeviceDiscoveryResult[]> {
    const allDevices: DeviceDiscoveryResult[] = [];

    for (const adapter of this.adapters.values()) {
      try {
        const devices = await adapter.discoverDevices();
        allDevices.push(...devices);
        for (const device of devices) {
          this.emit('device:discovered', device);
        }
      } catch (error) {
        console.error(`Discovery failed for ${adapter.protocol}:`, error);
      }
    }

    return allDevices;
  }

  registerDeviceMapping(mapping: DeviceMapping): void {
    this.deviceMappings.set(mapping.deviceId, mapping);
  }

  unregisterDevice(deviceId: DeviceId): void {
    this.deviceMappings.delete(deviceId);
    this.deviceStates.delete(deviceId);
  }

  // Health & Status
  getAdapterHealth(protocol: ProtocolType): AdapterHealth | null {
    const adapter = this.adapters.get(protocol);
    return adapter?.getHealth() ?? null;
  }

  getAllAdapterHealth(): Record<ProtocolType, AdapterHealth> {
    const health: Record<string, AdapterHealth> = {};
    for (const [protocol, adapter] of this.adapters) {
      health[protocol] = adapter.getHealth();
    }
    return health as Record<ProtocolType, AdapterHealth>;
  }

  getQueueStats(): { size: number; processing: boolean } {
    return {
      size: this.commandQueue.length,
      processing: this.processing,
    };
  }

  // Private Methods
  private handleDeviceStateUpdate(deviceId: DeviceId, state: DeviceState, protocol: ProtocolType): void {
    const previousState = this.deviceStates.get(deviceId);
    this.deviceStates.set(deviceId, state);

    // Create normalized message
    const message: NormalizedMessage = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString() as ISOTimestamp,
      protocol,
      type: 'state_update',
      deviceId,
      payload: {
        value: state.values,
        previousValue: previousState?.values,
      },
      raw: state,
    };

    this.emit('device:state', deviceId, state, protocol);
    this.emit('message:normalized', message);
  }

  private async queueCommand(command: DeviceCommand): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const item: CommandQueueItem = {
        command,
        resolve,
        reject,
        retries: 0,
        addedAt: Date.now(),
      };

      // Priority insertion
      if (command.priority === 'critical') {
        this.commandQueue.unshift(item);
      } else if (command.priority === 'high') {
        const criticalCount = this.commandQueue.filter(
          i => i.command.priority === 'critical'
        ).length;
        this.commandQueue.splice(criticalCount, 0, item);
      } else {
        this.commandQueue.push(item);
      }

      // Check queue size
      if (this.commandQueue.length > this.config.messageQueue.maxSize) {
        const dropped = this.commandQueue.pop();
        if (dropped) {
          dropped.reject(new Error('Queue overflow'));
        }
      }

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.commandQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.commandQueue.length > 0) {
      const items = this.commandQueue.splice(
        0,
        this.config.messageQueue.processingConcurrency
      );

      await Promise.all(items.map(item => this.executeCommand(item)));
    }

    this.processing = false;
  }

  private async executeCommand(item: CommandQueueItem): Promise<void> {
    const { command, resolve, reject, retries } = item;
    const mapping = this.deviceMappings.get(command.deviceId);

    if (!mapping) {
      resolve({
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Device mapping not found',
      });
      return;
    }

    const adapter = this.adapters.get(mapping.protocol);
    if (!adapter) {
      resolve({
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Adapter not found',
      });
      return;
    }

    try {
      this.emit('command:sent', command);
      const result = await adapter.sendCommand(command);

      if (result.success) {
        this.recordSuccess(mapping.protocol);
      } else {
        this.recordFailure(mapping.protocol);
      }

      this.emit('command:completed', result);
      resolve(result);
    } catch (error) {
      this.recordFailure(mapping.protocol);

      // Retry logic
      if (retries < this.config.messageQueue.retryPolicy.maxRetries) {
        const delay = Math.min(
          this.config.messageQueue.retryPolicy.initialDelay *
            Math.pow(this.config.messageQueue.retryPolicy.backoffMultiplier, retries),
          this.config.messageQueue.retryPolicy.maxDelay
        );

        await new Promise(r => setTimeout(r, delay));
        item.retries++;
        this.commandQueue.unshift(item);
      } else {
        resolve({
          success: false,
          deviceId: command.deviceId,
          command: command.command,
          executedAt: new Date().toISOString() as ISOTimestamp,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // Circuit Breaker
  private canExecute(protocol: ProtocolType): boolean {
    if (!this.config.faultTolerance.circuitBreaker.enabled) {
      return true;
    }

    const breaker = this.circuitBreakers.get(protocol);
    if (!breaker) {
      return true;
    }

    switch (breaker.state) {
      case 'closed':
        return true;
      case 'open':
        // Check if recovery timeout has passed
        if (
          breaker.lastFailure &&
          Date.now() - breaker.lastFailure > this.config.faultTolerance.circuitBreaker.recoveryTimeout
        ) {
          breaker.state = 'half-open';
          breaker.successesInHalfOpen = 0;
          return true;
        }
        return false;
      case 'half-open':
        return true;
    }
  }

  private recordSuccess(protocol: ProtocolType): void {
    const breaker = this.circuitBreakers.get(protocol);
    if (!breaker) return;

    if (breaker.state === 'half-open') {
      breaker.successesInHalfOpen++;
      if (breaker.successesInHalfOpen >= this.config.faultTolerance.circuitBreaker.halfOpenRequests) {
        breaker.state = 'closed';
        breaker.failures = 0;
      }
    } else {
      breaker.failures = 0;
    }
  }

  private recordFailure(protocol: ProtocolType): void {
    const breaker = this.circuitBreakers.get(protocol);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.state === 'half-open') {
      breaker.state = 'open';
    } else if (breaker.failures >= this.config.faultTolerance.circuitBreaker.failureThreshold) {
      breaker.state = 'open';
    }
  }

  // Rate Limiting
  private commandCounts = new Map<DeviceId, { count: number; resetAt: number }>();

  private isRateLimited(deviceId: DeviceId): boolean {
    if (!this.config.rateLimiting.enabled) {
      return false;
    }

    const now = Date.now();
    let record = this.commandCounts.get(deviceId);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + 1000 };
      this.commandCounts.set(deviceId, record);
    }

    if (record.count >= this.config.rateLimiting.maxCommandsPerDevice) {
      return true;
    }

    record.count++;
    return false;
  }
}

// Export singleton instance
export const bridgeManager = new BridgeManager();
