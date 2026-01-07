/**
 * AICO Smart Home - KNX Protocol Adapter
 *
 * Adapter for KNX building automation systems.
 */

import type { DeviceId, ISOTimestamp } from '@/types/core';
import type { DeviceState, DeviceCommand, CommandResult, DeviceDiscoveryResult } from '@/types/devices';
import type { KNXConfig, AdapterConfig } from '../types';
import { BaseProtocolAdapter } from './base-adapter';

// KNX Data Point Types
type DPT =
  | 'DPT1'   // 1-bit (switch, bool)
  | 'DPT2'   // 1-bit controlled
  | 'DPT3'   // 3-bit controlled (dimming, blinds)
  | 'DPT4'   // Character
  | 'DPT5'   // 8-bit unsigned (0-255, percentage)
  | 'DPT6'   // 8-bit signed
  | 'DPT7'   // 2-byte unsigned
  | 'DPT8'   // 2-byte signed
  | 'DPT9'   // 2-byte float (temperature)
  | 'DPT10'  // Time
  | 'DPT11'  // Date
  | 'DPT12'  // 4-byte unsigned
  | 'DPT13'  // 4-byte signed
  | 'DPT14'  // 4-byte float
  | 'DPT16'  // String
  | 'DPT17'  // Scene number
  | 'DPT18'  // Scene control
  | 'DPT232'; // RGB color

interface KNXGroupAddress {
  main: number;
  middle: number;
  sub: number;
}

interface KNXDatapoint {
  address: KNXGroupAddress;
  dpt: DPT;
  name: string;
  description?: string;
  readOnly: boolean;
}

interface KNXConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  write(address: string, value: unknown, dpt: string): Promise<void>;
  read(address: string): Promise<void>;
  on(event: 'GroupValue_Write', handler: (address: string, data: Buffer) => void): void;
  on(event: 'GroupValue_Response', handler: (address: string, data: Buffer) => void): void;
  on(event: 'connected', handler: () => void): void;
  on(event: 'disconnected', handler: () => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  removeAllListeners(): void;
}

export class KNXAdapter extends BaseProtocolAdapter {
  readonly protocol = 'knx' as const;
  readonly name = 'KNX Adapter';
  readonly version = '1.0.0';

  private connection?: KNXConnection;
  private knxConfig!: KNXConfig;
  private datapoints = new Map<string, KNXDatapoint>();
  private addressToDevice = new Map<string, DeviceId>();
  private deviceStates = new Map<DeviceId, DeviceState>();
  private discoveredDevices = new Map<DeviceId, DeviceDiscoveryResult>();

  protected async onInitialize(config: AdapterConfig): Promise<void> {
    this.knxConfig = config as KNXConfig;
  }

  protected async onConnect(): Promise<void> {
    const { host, port, physicalAddress, tunnelType } = this.knxConfig.connectionParams;

    this.connection = await this.createKNXConnection({
      host,
      port,
      physicalAddress,
      tunnelType,
    });

    this.setupEventHandlers();
  }

  protected async onDisconnect(): Promise<void> {
    if (this.connection) {
      this.connection.removeAllListeners();
      await this.connection.disconnect();
      this.connection = undefined;
    }
  }

  protected async onDestroy(): Promise<void> {
    this.datapoints.clear();
    this.addressToDevice.clear();
    this.deviceStates.clear();
    this.discoveredDevices.clear();
  }

  protected async onSendCommand(command: DeviceCommand): Promise<CommandResult> {
    if (!this.connection) {
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

    try {
      const { address, dpt, value } = this.translateCommand(command);
      await this.connection.write(address, value, dpt);

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
    if (!this.connection) {
      throw new Error('Not connected');
    }
    // KNX doesn't have a direct ping, we can read a known address
  }

  protected getDeviceCount(): number {
    return this.discoveredDevices.size;
  }

  async discoverDevices(): Promise<DeviceDiscoveryResult[]> {
    // KNX discovery typically requires ETS project import
    // or programming mode scanning
    // This is a simplified version that registers known devices

    // In real implementation:
    // 1. Put devices in programming mode
    // 2. Send M_PropRead.req to read device descriptors
    // 3. Parse ETS project file for full configuration

    return Array.from(this.discoveredDevices.values());
  }

  async getDeviceState(deviceId: DeviceId): Promise<DeviceState> {
    const state = this.deviceStates.get(deviceId);
    if (state) {
      return state;
    }

    // Read state from device
    const datapoint = this.getDeviceDatapoint(deviceId);
    if (datapoint && this.connection) {
      await this.connection.read(this.formatAddress(datapoint.address));
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return this.deviceStates.get(deviceId) ?? {
      online: false,
      lastSeen: new Date().toISOString() as ISOTimestamp,
      lastChanged: new Date().toISOString() as ISOTimestamp,
      values: {},
    };
  }

  // Register a KNX datapoint mapping
  registerDatapoint(deviceId: DeviceId, datapoint: KNXDatapoint): void {
    const addressString = this.formatAddress(datapoint.address);
    this.datapoints.set(addressString, datapoint);
    this.addressToDevice.set(addressString, deviceId);

    const discovery: DeviceDiscoveryResult = {
      protocol: 'knx',
      address: addressString,
      type: this.inferDeviceType(datapoint.dpt),
      name: datapoint.name,
      capabilities: this.inferCapabilities(datapoint.dpt),
      metadata: {
        manufacturer: 'KNX',
      },
    };

    this.discoveredDevices.set(deviceId, discovery);
  }

  // Import datapoints from ETS project export
  importETSProject(projectData: string): void {
    // Parse ETS XML/JSON export format
    // Extract group addresses and datapoint types
    // This would parse the standard ETS export format
    console.log('Importing ETS project data...');
  }

  private async createKNXConnection(options: {
    host: string;
    port: number;
    physicalAddress: string;
    tunnelType: 'udp' | 'tcp';
  }): Promise<KNXConnection> {
    // In production, use knx.js package:
    // const knx = await import('knx');
    // return new knx.Connection({
    //   ipAddr: options.host,
    //   ipPort: options.port,
    //   physAddr: options.physicalAddress,
    //   forceTunneling: true,
    // });

    // Mock implementation for architecture
    return {
      connect: async () => {},
      disconnect: async () => {},
      write: async () => {},
      read: async () => {},
      on: () => {},
      removeAllListeners: () => {},
    };
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('GroupValue_Write', (address: string, data: Buffer) => {
      this.handleGroupValue(address, data);
    });

    this.connection.on('GroupValue_Response', (address: string, data: Buffer) => {
      this.handleGroupValue(address, data);
    });

    this.connection.on('disconnected', () => {
      if (this.status === 'connected') {
        this.status = 'disconnected';
        this.emit('disconnected', 'KNX connection lost');
        if (this.config.reconnect.enabled) {
          this.scheduleReconnect();
        }
      }
    });

    this.connection.on('error', (error: Error) => {
      this.handleConnectionError(error);
    });
  }

  private handleGroupValue(address: string, data: Buffer): void {
    const deviceId = this.addressToDevice.get(address);
    if (!deviceId) return;

    const datapoint = this.datapoints.get(address);
    if (!datapoint) return;

    const value = this.decodeValue(data, datapoint.dpt);

    const existingState = this.deviceStates.get(deviceId);
    const state: DeviceState = {
      online: true,
      lastSeen: new Date().toISOString() as ISOTimestamp,
      lastChanged: new Date().toISOString() as ISOTimestamp,
      values: {
        ...(existingState?.values ?? {}),
        [datapoint.name]: value,
      },
    };

    this.deviceStates.set(deviceId, state);
    this.notifyStateChange(deviceId, state);
  }

  private translateCommand(command: DeviceCommand): { address: string; dpt: string; value: unknown } {
    const datapoint = this.getDeviceDatapoint(command.deviceId);
    if (!datapoint) {
      throw new Error(`No datapoint found for device ${command.deviceId}`);
    }

    let value = command.parameters['value'];

    // Apply command-specific translations
    switch (command.command) {
      case 'turn_on':
        value = true;
        break;
      case 'turn_off':
        value = false;
        break;
      case 'set_brightness':
        value = Math.round((command.parameters['brightness'] as number) * 2.55);
        break;
      case 'set_position':
        value = command.parameters['position'];
        break;
      case 'set_temperature':
        value = command.parameters['temperature'];
        break;
    }

    return {
      address: this.formatAddress(datapoint.address),
      dpt: datapoint.dpt,
      value,
    };
  }

  private getDeviceDatapoint(deviceId: DeviceId): KNXDatapoint | undefined {
    for (const [address, id] of this.addressToDevice) {
      if (id === deviceId) {
        return this.datapoints.get(address);
      }
    }
    return undefined;
  }

  private formatAddress(address: KNXGroupAddress): string {
    return `${address.main}/${address.middle}/${address.sub}`;
  }

  private parseAddress(addressString: string): KNXGroupAddress {
    const parts = addressString.split('/').map(Number);
    return {
      main: parts[0] ?? 0,
      middle: parts[1] ?? 0,
      sub: parts[2] ?? 0,
    };
  }

  private decodeValue(data: Buffer, dpt: DPT): unknown {
    switch (dpt) {
      case 'DPT1':
        return data[0] === 1;
      case 'DPT5':
        return data[0];
      case 'DPT9':
        // 2-byte float decoding
        const sign = (data[0] & 0x80) >> 7;
        const exp = (data[0] & 0x78) >> 3;
        const mant = ((data[0] & 0x07) << 8) | data[1];
        return (sign ? -1 : 1) * (0.01 * mant) * Math.pow(2, exp);
      case 'DPT232':
        return { r: data[0], g: data[1], b: data[2] };
      default:
        return data;
    }
  }

  private encodeValue(value: unknown, dpt: DPT): Buffer {
    switch (dpt) {
      case 'DPT1':
        return Buffer.from([value ? 1 : 0]);
      case 'DPT5':
        return Buffer.from([Math.min(255, Math.max(0, value as number))]);
      case 'DPT9': {
        // 2-byte float encoding
        const v = value as number;
        const sign = v < 0 ? 1 : 0;
        const absV = Math.abs(v);
        let exp = 0;
        let mant = absV * 100;
        while (mant > 2047 && exp < 15) {
          mant /= 2;
          exp++;
        }
        mant = Math.round(mant);
        return Buffer.from([
          (sign << 7) | (exp << 3) | ((mant >> 8) & 0x07),
          mant & 0xff,
        ]);
      }
      case 'DPT232': {
        const rgb = value as { r: number; g: number; b: number };
        return Buffer.from([rgb.r, rgb.g, rgb.b]);
      }
      default:
        return Buffer.from([]);
    }
  }

  private inferDeviceType(dpt: DPT): string {
    switch (dpt) {
      case 'DPT1':
        return 'light_switch';
      case 'DPT5':
        return 'light_dimmer';
      case 'DPT9':
        return 'temperature_sensor';
      case 'DPT232':
        return 'light_color';
      default:
        return 'custom';
    }
  }

  private inferCapabilities(dpt: DPT): string[] {
    switch (dpt) {
      case 'DPT1':
        return ['on_off'];
      case 'DPT5':
        return ['on_off', 'brightness'];
      case 'DPT9':
        return ['temperature_reading'];
      case 'DPT232':
        return ['on_off', 'brightness', 'color'];
      case 'DPT3':
        return ['position'];
      default:
        return [];
    }
  }
}
