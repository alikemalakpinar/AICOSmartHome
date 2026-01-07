/**
 * AICO Smart Home - MQTT Protocol Adapter
 *
 * Adapter for MQTT-based devices and systems.
 */

import type { DeviceId, ISOTimestamp } from '@/types/core';
import type { DeviceState, DeviceCommand, CommandResult, DeviceDiscoveryResult } from '@/types/devices';
import type { MQTTConfig, AdapterConfig } from '../types';
import { BaseProtocolAdapter } from './base-adapter';

interface MQTTMessage {
  topic: string;
  payload: Buffer;
  qos: 0 | 1 | 2;
  retain: boolean;
}

interface MQTTClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(topic: string, options?: { qos?: 0 | 1 | 2 }): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
  publish(topic: string, payload: string | Buffer, options?: { qos?: 0 | 1 | 2; retain?: boolean }): Promise<void>;
  on(event: 'message', callback: (topic: string, payload: Buffer) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'close', callback: () => void): void;
  on(event: 'connect', callback: () => void): void;
  removeAllListeners(): void;
}

export class MQTTAdapter extends BaseProtocolAdapter {
  readonly protocol = 'mqtt' as const;
  readonly name = 'MQTT Adapter';
  readonly version = '1.0.0';

  private client?: MQTTClient;
  private mqttConfig!: MQTTConfig;
  private deviceTopics = new Map<string, DeviceId>();
  private discoveredDevices = new Map<DeviceId, DeviceDiscoveryResult>();
  private deviceStates = new Map<DeviceId, DeviceState>();

  protected async onInitialize(config: AdapterConfig): Promise<void> {
    this.mqttConfig = config as MQTTConfig;
  }

  protected async onConnect(): Promise<void> {
    const { broker, port, username, password, clientId, useTLS } = this.mqttConfig.connectionParams;

    // In a real implementation, we'd use the mqtt package
    // This is a mock implementation for the architecture
    this.client = await this.createMQTTClient({
      broker,
      port,
      username,
      password,
      clientId,
      useTLS,
    });

    this.setupMessageHandlers();
    await this.subscribeToTopics();
  }

  protected async onDisconnect(): Promise<void> {
    if (this.client) {
      this.client.removeAllListeners();
      await this.client.disconnect();
      this.client = undefined;
    }
  }

  protected async onDestroy(): Promise<void> {
    this.deviceTopics.clear();
    this.discoveredDevices.clear();
    this.deviceStates.clear();
  }

  protected async onSendCommand(command: DeviceCommand): Promise<CommandResult> {
    if (!this.client) {
      return {
        success: false,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: 0,
        error: 'Not connected',
      };
    }

    const startTime = performance.now();
    const topic = this.getCommandTopic(command.deviceId, command.command);
    const payload = JSON.stringify(command.parameters);

    try {
      await this.client.publish(topic, payload, {
        qos: this.mqttConfig.connectionParams.qos,
      });

      return {
        success: true,
        deviceId: command.deviceId,
        command: command.command,
        executedAt: new Date().toISOString() as ISOTimestamp,
        duration: performance.now() - startTime,
      };
    } catch (error) {
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

  protected async onPing(): Promise<void> {
    // MQTT ping is handled by the client automatically
    // This is just a connectivity check
    if (!this.client) {
      throw new Error('Not connected');
    }
  }

  protected getDeviceCount(): number {
    return this.discoveredDevices.size;
  }

  async discoverDevices(): Promise<DeviceDiscoveryResult[]> {
    // Subscribe to discovery topics
    const discoveryTopic = `${this.mqttConfig.connectionParams.topicPrefix}/+/config`;

    if (this.client) {
      await this.client.subscribe(discoveryTopic, { qos: 1 });
    }

    // Wait for discovery responses
    await new Promise(resolve => setTimeout(resolve, this.config.timeout.discovery));

    return Array.from(this.discoveredDevices.values());
  }

  async getDeviceState(deviceId: DeviceId): Promise<DeviceState> {
    const state = this.deviceStates.get(deviceId);
    if (state) {
      return state;
    }

    // Request state update
    const topic = this.getStateTopic(deviceId);
    if (this.client) {
      await this.client.publish(`${topic}/get`, '', { qos: 1 });
    }

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.deviceStates.get(deviceId) ?? {
      online: false,
      lastSeen: new Date().toISOString() as ISOTimestamp,
      lastChanged: new Date().toISOString() as ISOTimestamp,
      values: {},
    };
  }

  private async createMQTTClient(options: {
    broker: string;
    port: number;
    username?: string;
    password?: string;
    clientId: string;
    useTLS: boolean;
  }): Promise<MQTTClient> {
    // Mock implementation - in production, use mqtt.js package
    // const mqtt = await import('mqtt');
    // return mqtt.connectAsync(`${options.useTLS ? 'mqtts' : 'mqtt'}://${options.broker}:${options.port}`, {
    //   clientId: options.clientId,
    //   username: options.username,
    //   password: options.password,
    // });

    // Return mock client for architecture demonstration
    return {
      connect: async () => {},
      disconnect: async () => {},
      subscribe: async () => {},
      unsubscribe: async () => {},
      publish: async () => {},
      on: () => {},
      removeAllListeners: () => {},
    };
  }

  private setupMessageHandlers(): void {
    if (!this.client) return;

    this.client.on('message', (topic: string, payload: Buffer) => {
      this.handleMessage({ topic, payload, qos: 0, retain: false });
    });

    this.client.on('error', (error: Error) => {
      this.handleConnectionError(error);
    });

    this.client.on('close', () => {
      if (this.status === 'connected') {
        this.status = 'disconnected';
        this.emit('disconnected', 'Connection closed');
        if (this.config.reconnect.enabled) {
          this.scheduleReconnect();
        }
      }
    });
  }

  private async subscribeToTopics(): Promise<void> {
    if (!this.client) return;

    const prefix = this.mqttConfig.connectionParams.topicPrefix;
    const topics = [
      `${prefix}/+/state`,
      `${prefix}/+/availability`,
      `${prefix}/+/config`,
    ];

    for (const topic of topics) {
      await this.client.subscribe(topic, { qos: this.mqttConfig.connectionParams.qos });
    }
  }

  private handleMessage(message: MQTTMessage): void {
    const { topic, payload } = message;
    const prefix = this.mqttConfig.connectionParams.topicPrefix;

    try {
      const data = JSON.parse(payload.toString());

      if (topic.endsWith('/state')) {
        this.handleStateMessage(topic, data);
      } else if (topic.endsWith('/config')) {
        this.handleConfigMessage(topic, data);
      } else if (topic.endsWith('/availability')) {
        this.handleAvailabilityMessage(topic, data);
      }
    } catch (error) {
      console.error('Failed to parse MQTT message:', error);
    }
  }

  private handleStateMessage(topic: string, data: Record<string, unknown>): void {
    const deviceId = this.extractDeviceId(topic);
    if (!deviceId) return;

    const state: DeviceState = {
      online: true,
      lastSeen: new Date().toISOString() as ISOTimestamp,
      lastChanged: new Date().toISOString() as ISOTimestamp,
      values: data,
    };

    const previousState = this.deviceStates.get(deviceId);
    this.deviceStates.set(deviceId, state);

    this.notifyStateChange(deviceId, state);
  }

  private handleConfigMessage(topic: string, data: Record<string, unknown>): void {
    const deviceId = this.extractDeviceId(topic);
    if (!deviceId) return;

    const discovery: DeviceDiscoveryResult = {
      protocol: 'mqtt',
      address: topic,
      type: (data['device_class'] as string) ?? 'custom',
      name: (data['name'] as string) ?? deviceId,
      capabilities: this.extractCapabilities(data),
      metadata: {
        manufacturer: data['manufacturer'] as string | undefined,
        model: data['model'] as string | undefined,
      },
    };

    this.discoveredDevices.set(deviceId, discovery);
    this.deviceTopics.set(topic, deviceId);
    this.emit('device:discovered', discovery);
  }

  private handleAvailabilityMessage(topic: string, data: unknown): void {
    const deviceId = this.extractDeviceId(topic);
    if (!deviceId) return;

    const online = data === 'online' || data === true;
    const state = this.deviceStates.get(deviceId);

    if (state) {
      state.online = online;
      state.lastSeen = new Date().toISOString() as ISOTimestamp;
      this.notifyStateChange(deviceId, state);
    }
  }

  private extractDeviceId(topic: string): DeviceId | null {
    const prefix = this.mqttConfig.connectionParams.topicPrefix;
    const match = topic.match(new RegExp(`^${prefix}/([^/]+)/`));
    return match ? (match[1] as DeviceId) : null;
  }

  private extractCapabilities(config: Record<string, unknown>): string[] {
    const capabilities: string[] = [];

    if (config['brightness'] !== undefined) capabilities.push('brightness');
    if (config['color_temp'] !== undefined) capabilities.push('color_temperature');
    if (config['color'] !== undefined) capabilities.push('color');
    if (config['position'] !== undefined) capabilities.push('position');
    if (config['temperature'] !== undefined) capabilities.push('temperature_reading');

    return capabilities;
  }

  private getCommandTopic(deviceId: DeviceId, command: string): string {
    const prefix = this.mqttConfig.connectionParams.topicPrefix;
    return `${prefix}/${deviceId}/set`;
  }

  private getStateTopic(deviceId: DeviceId): string {
    const prefix = this.mqttConfig.connectionParams.topicPrefix;
    return `${prefix}/${deviceId}/state`;
  }
}
