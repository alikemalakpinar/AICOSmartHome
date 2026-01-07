/**
 * AICO Smart Home - Room Device Grid Component
 *
 * Room-based device selection and control interface.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId, RoomId, FloorId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

export type DeviceType =
  | 'light'
  | 'dimmer'
  | 'switch'
  | 'outlet'
  | 'thermostat'
  | 'ac'
  | 'curtain'
  | 'blind'
  | 'sensor'
  | 'camera'
  | 'lock'
  | 'speaker'
  | 'tv'
  | 'fan'
  | 'heater';

interface Device {
  id: DeviceId;
  name: string;
  type: DeviceType;
  isOn?: boolean;
  value?: number; // For dimmers, thermostats, etc.
  status?: 'online' | 'offline' | 'error';
  icon?: string;
}

interface Room {
  id: RoomId;
  name: string;
  icon: string;
  floor: FloorId;
  devices: Device[];
  temperature?: number;
  humidity?: number;
  occupancy?: boolean;
}

interface Floor {
  id: FloorId;
  name: string;
  rooms: Room[];
}

interface RoomDeviceGridProps {
  floors: Floor[];
  selectedRoom?: RoomId;
  onRoomSelect: (roomId: RoomId) => void;
  onDeviceSelect: (deviceId: DeviceId) => void;
  onDeviceToggle: (deviceId: DeviceId, isOn: boolean) => void;
  onQuickAction: (action: RoomQuickAction) => void;
}

type RoomQuickAction =
  | { type: 'all_off'; roomId: RoomId }
  | { type: 'all_on'; roomId: RoomId }
  | { type: 'scene'; roomId: RoomId; sceneId: string };

// ============================================================================
// Device Type Configurations
// ============================================================================

const DEVICE_ICONS: Record<DeviceType, string> = {
  light: '💡',
  dimmer: '🔆',
  switch: '🔘',
  outlet: '🔌',
  thermostat: '🌡️',
  ac: '❄️',
  curtain: '🪟',
  blind: '🏠',
  sensor: '📡',
  camera: '📹',
  lock: '🔐',
  speaker: '🔊',
  tv: '📺',
  fan: '🌀',
  heater: '🔥',
};

const ROOM_QUICK_SCENES = [
  { id: 'relax', name: 'Rahat', icon: '🛋️' },
  { id: 'focus', name: 'Odaklan', icon: '💼' },
  { id: 'movie', name: 'Film', icon: '🎬' },
  { id: 'sleep', name: 'Uyku', icon: '🌙' },
];

// ============================================================================
// Room Device Grid Component
// ============================================================================

export const RoomDeviceGrid: React.FC<RoomDeviceGridProps> = ({
  floors,
  selectedRoom,
  onRoomSelect,
  onDeviceSelect,
  onDeviceToggle,
  onQuickAction,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [selectedFloor, setSelectedFloor] = useState<FloorId | null>(
    floors[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<'rooms' | 'devices'>('rooms');

  // Get current floor and room
  const currentFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloor),
    [floors, selectedFloor]
  );

  const currentRoom = useMemo(
    () => currentFloor?.rooms.find((r) => r.id === selectedRoom),
    [currentFloor, selectedRoom]
  );

  // Get device counts by type for a room
  const getDeviceSummary = useCallback((room: Room) => {
    const summary: Record<string, { count: number; onCount: number }> = {};
    room.devices.forEach((device) => {
      if (!summary[device.type]) {
        summary[device.type] = { count: 0, onCount: 0 };
      }
      summary[device.type].count++;
      if (device.isOn) summary[device.type].onCount++;
    });
    return summary;
  }, []);

  // Handle room selection
  const handleRoomSelect = useCallback(
    (roomId: RoomId) => {
      triggerHaptic('selection');
      onRoomSelect(roomId);
      setViewMode('devices');
    },
    [onRoomSelect, triggerHaptic]
  );

  // Handle device toggle
  const handleDeviceToggle = useCallback(
    (device: Device) => {
      triggerHaptic(device.isOn ? 'tap' : 'success');
      onDeviceToggle(device.id, !device.isOn);
    },
    [onDeviceToggle, triggerHaptic]
  );

  return (
    <div className="room-device-grid">
      {/* Floor Selector */}
      <div className="floor-selector">
        {floors.map((floor) => (
          <motion.button
            key={floor.id}
            className={`floor-btn ${selectedFloor === floor.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedFloor(floor.id);
              triggerHaptic('selection');
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="floor-name">{floor.name}</span>
            <span className="room-count">{floor.rooms.length} Oda</span>
          </motion.button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button
          className={`mode-btn ${viewMode === 'rooms' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('rooms');
            triggerHaptic('selection');
          }}
        >
          Odalar
        </button>
        <button
          className={`mode-btn ${viewMode === 'devices' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('devices');
            triggerHaptic('selection');
          }}
          disabled={!selectedRoom}
        >
          Cihazlar
        </button>
      </div>

      {/* Room Grid */}
      <AnimatePresence mode="wait">
        {viewMode === 'rooms' && currentFloor && (
          <motion.div
            key="rooms"
            className="rooms-grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {currentFloor.rooms.map((room) => {
              const summary = getDeviceSummary(room);
              const activeDevices = room.devices.filter((d) => d.isOn).length;

              return (
                <RoomCard
                  key={room.id}
                  room={room}
                  isSelected={selectedRoom === room.id}
                  activeDevices={activeDevices}
                  summary={summary}
                  onClick={() => handleRoomSelect(room.id)}
                  onQuickAction={(action) => {
                    triggerHaptic('success');
                    onQuickAction(action);
                  }}
                />
              );
            })}
          </motion.div>
        )}

        {/* Device Grid */}
        {viewMode === 'devices' && currentRoom && (
          <motion.div
            key="devices"
            className="devices-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Room Header */}
            <div className="room-header">
              <button
                className="back-btn"
                onClick={() => {
                  setViewMode('rooms');
                  triggerHaptic('tap');
                }}
              >
                ← Odalar
              </button>
              <div className="room-title">
                <span className="room-icon">{currentRoom.icon}</span>
                <span className="room-name">{currentRoom.name}</span>
              </div>
              <div className="room-stats">
                {currentRoom.temperature && (
                  <span className="stat temp">🌡️ {currentRoom.temperature}°C</span>
                )}
                {currentRoom.humidity && (
                  <span className="stat humidity">💧 {currentRoom.humidity}%</span>
                )}
              </div>
            </div>

            {/* Quick Scenes */}
            <div className="room-quick-scenes">
              {ROOM_QUICK_SCENES.map((scene) => (
                <motion.button
                  key={scene.id}
                  className="scene-btn"
                  onClick={() => {
                    triggerHaptic('success');
                    onQuickAction({
                      type: 'scene',
                      roomId: currentRoom.id,
                      sceneId: scene.id,
                    });
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="scene-icon">{scene.icon}</span>
                  <span className="scene-name">{scene.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Device Grid */}
            <div className="devices-grid">
              {currentRoom.devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onToggle={() => handleDeviceToggle(device)}
                  onSelect={() => {
                    triggerHaptic('selection');
                    onDeviceSelect(device.id);
                  }}
                />
              ))}
            </div>

            {/* Room Actions */}
            <div className="room-actions">
              <motion.button
                className="action-btn all-off"
                onClick={() => {
                  triggerHaptic('impact');
                  onQuickAction({ type: 'all_off', roomId: currentRoom.id });
                }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="action-icon">⏹</span>
                <span>Tümünü Kapat</span>
              </motion.button>
              <motion.button
                className="action-btn all-on"
                onClick={() => {
                  triggerHaptic('success');
                  onQuickAction({ type: 'all_on', roomId: currentRoom.id });
                }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="action-icon">▶</span>
                <span>Tümünü Aç</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Room Card Component
// ============================================================================

interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  activeDevices: number;
  summary: Record<string, { count: number; onCount: number }>;
  onClick: () => void;
  onQuickAction: (action: RoomQuickAction) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  isSelected,
  activeDevices,
  summary,
  onClick,
  onQuickAction,
}) => {
  const totalDevices = room.devices.length;
  const activePercentage = totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0;

  return (
    <motion.div
      className={`room-card ${isSelected ? 'selected' : ''} ${room.occupancy ? 'occupied' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Room Header */}
      <div className="card-header">
        <span className="room-icon">{room.icon}</span>
        <span className="room-name">{room.name}</span>
        {room.occupancy && <span className="occupancy-badge">●</span>}
      </div>

      {/* Room Stats */}
      <div className="card-stats">
        {room.temperature && (
          <span className="stat">{room.temperature}°C</span>
        )}
        {room.humidity && (
          <span className="stat">{room.humidity}%</span>
        )}
      </div>

      {/* Device Summary */}
      <div className="device-summary">
        {Object.entries(summary).slice(0, 4).map(([type, data]) => (
          <div key={type} className="summary-item">
            <span className="device-icon">{DEVICE_ICONS[type as DeviceType]}</span>
            <span className="device-count">
              {data.onCount}/{data.count}
            </span>
          </div>
        ))}
      </div>

      {/* Activity Bar */}
      <div className="activity-bar">
        <motion.div
          className="activity-fill"
          initial={false}
          animate={{ width: `${activePercentage}%` }}
          style={{
            backgroundColor: activePercentage > 0 ? '#10b981' : 'transparent',
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <motion.button
          className="quick-btn off"
          onClick={() => onQuickAction({ type: 'all_off', roomId: room.id })}
          whileTap={{ scale: 0.9 }}
        >
          Kapat
        </motion.button>
        <motion.button
          className="quick-btn on"
          onClick={() => onQuickAction({ type: 'all_on', roomId: room.id })}
          whileTap={{ scale: 0.9 }}
        >
          Aç
        </motion.button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Device Card Component
// ============================================================================

interface DeviceCardProps {
  device: Device;
  onToggle: () => void;
  onSelect: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onToggle, onSelect }) => {
  const icon = device.icon || DEVICE_ICONS[device.type];
  const isControllable = ['light', 'dimmer', 'switch', 'outlet', 'fan', 'heater'].includes(
    device.type
  );

  return (
    <motion.div
      className={`device-card type-${device.type} ${device.isOn ? 'on' : 'off'} ${device.status === 'offline' ? 'offline' : ''}`}
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="device-icon-container">
        <span className={`device-icon ${device.isOn ? 'active' : ''}`}>{icon}</span>
        {device.status === 'offline' && <span className="offline-badge">●</span>}
      </div>

      <div className="device-info">
        <span className="device-name">{device.name}</span>
        {device.value !== undefined && (
          <span className="device-value">
            {device.type === 'thermostat' || device.type === 'ac'
              ? `${device.value}°C`
              : device.type === 'dimmer'
              ? `${device.value}%`
              : device.value}
          </span>
        )}
      </div>

      {isControllable && (
        <motion.button
          className={`toggle-btn ${device.isOn ? 'on' : 'off'}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="toggle-indicator" />
        </motion.button>
      )}
    </motion.div>
  );
};

// ============================================================================
// Floor Overview Component
// ============================================================================

interface FloorOverviewProps {
  floors: Floor[];
  onRoomSelect: (roomId: RoomId) => void;
}

export const FloorOverview: React.FC<FloorOverviewProps> = ({
  floors,
  onRoomSelect,
}) => {
  const { triggerHaptic } = useHapticFeedback();

  return (
    <div className="floor-overview">
      {floors.map((floor) => {
        const totalDevices = floor.rooms.reduce(
          (acc, room) => acc + room.devices.length,
          0
        );
        const activeDevices = floor.rooms.reduce(
          (acc, room) => acc + room.devices.filter((d) => d.isOn).length,
          0
        );

        return (
          <div key={floor.id} className="floor-section">
            <div className="floor-header">
              <span className="floor-name">{floor.name}</span>
              <span className="floor-stats">
                {activeDevices}/{totalDevices} aktif
              </span>
            </div>

            <div className="floor-rooms">
              {floor.rooms.map((room) => (
                <motion.button
                  key={room.id}
                  className="room-pill"
                  onClick={() => {
                    triggerHaptic('selection');
                    onRoomSelect(room.id);
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="room-icon">{room.icon}</span>
                  <span className="room-name">{room.name}</span>
                  {room.devices.some((d) => d.isOn) && (
                    <span className="active-indicator" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomDeviceGrid;
