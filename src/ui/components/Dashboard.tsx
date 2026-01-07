/**
 * AICO Smart Home - Main Dashboard Component
 *
 * Central hub displaying all smart home controls on wall-mounted display.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { ClimateControl } from './ClimateControl';
import { LightControl } from './LightControl';
import { CurtainControl } from './CurtainControl';
import { SocketControl } from './SocketControl';
import { EmergencyAlerts, EmergencyQuickActions } from './EmergencyAlerts';
import { RoomDeviceGrid } from './RoomDeviceGrid';
import { SecurityPanel } from './SecurityPanel';
import type { DeviceId, RoomId, FloorId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

type DashboardView = 'home' | 'climate' | 'lighting' | 'security' | 'energy' | 'rooms' | 'settings';

interface DashboardProps {
  currentTime: Date;
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
  };
  user?: {
    name: string;
    avatar?: string;
  };
  residenceMode: string;
  onModeChange: (mode: string) => void;
  onSceneActivate: (sceneId: string) => void;
}

// ============================================================================
// Mock Data (would come from real stores in production)
// ============================================================================

const mockFloors = [
  {
    id: 'floor-1' as FloorId,
    name: 'Zemin Kat',
    rooms: [
      {
        id: 'living-room' as RoomId,
        name: 'Oturma Odası',
        icon: '🛋️',
        floor: 'floor-1' as FloorId,
        temperature: 22,
        humidity: 45,
        occupancy: true,
        devices: [
          { id: 'light-1' as DeviceId, name: 'Tavan Işığı', type: 'dimmer' as const, isOn: true, value: 80 },
          { id: 'light-2' as DeviceId, name: 'Okuma Lambası', type: 'light' as const, isOn: false },
          { id: 'ac-1' as DeviceId, name: 'Klima', type: 'ac' as const, isOn: true, value: 22 },
          { id: 'curtain-1' as DeviceId, name: 'Ana Perde', type: 'curtain' as const, value: 75 },
          { id: 'tv-1' as DeviceId, name: 'TV', type: 'tv' as const, isOn: true },
          { id: 'speaker-1' as DeviceId, name: 'Hoparlör', type: 'speaker' as const, isOn: false },
        ],
      },
      {
        id: 'kitchen' as RoomId,
        name: 'Mutfak',
        icon: '🍳',
        floor: 'floor-1' as FloorId,
        temperature: 21,
        devices: [
          { id: 'light-3' as DeviceId, name: 'Tezgah Işığı', type: 'light' as const, isOn: true },
          { id: 'outlet-1' as DeviceId, name: 'Kahve Makinesi', type: 'outlet' as const, isOn: false },
        ],
      },
    ],
  },
  {
    id: 'floor-2' as FloorId,
    name: 'Üst Kat',
    rooms: [
      {
        id: 'bedroom' as RoomId,
        name: 'Yatak Odası',
        icon: '🛏️',
        floor: 'floor-2' as FloorId,
        temperature: 20,
        humidity: 50,
        devices: [
          { id: 'light-4' as DeviceId, name: 'Tavan', type: 'dimmer' as const, isOn: false, value: 0 },
          { id: 'blind-1' as DeviceId, name: 'Jaluzi', type: 'blind' as const, value: 0 },
        ],
      },
    ],
  },
];

const mockAlerts: any[] = [];

const mockCameras: any[] = [
  { id: 'cam-1', name: 'Giriş', location: 'Kapı Önü', state: 'live', hasMotionDetection: true, hasNightVision: true, isPTZ: false },
  { id: 'cam-2', name: 'Bahçe', location: 'Arka Bahçe', state: 'live', hasMotionDetection: true, hasNightVision: true, isPTZ: true },
];

const mockLocks: any[] = [
  { id: 'lock-1', name: 'Ana Kapı', location: 'Giriş', state: 'locked', batteryLevel: 85, isAutoLock: true },
  { id: 'lock-2', name: 'Garaj', location: 'Garaj', state: 'locked', batteryLevel: 92, isAutoLock: false },
];

// ============================================================================
// Dashboard Component
// ============================================================================

export const Dashboard: React.FC<DashboardProps> = ({
  currentTime,
  weather,
  user,
  residenceMode,
  onModeChange,
  onSceneActivate,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [activeView, setActiveView] = useState<DashboardView>('home');
  const [selectedRoom, setSelectedRoom] = useState<RoomId | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceId | null>(null);
  const [showDevicePanel, setShowDevicePanel] = useState(false);

  // Navigation items
  const navItems: { id: DashboardView; icon: string; label: string }[] = [
    { id: 'home', icon: '🏠', label: 'Ana Sayfa' },
    { id: 'rooms', icon: '🚪', label: 'Odalar' },
    { id: 'climate', icon: '🌡️', label: 'İklim' },
    { id: 'lighting', icon: '💡', label: 'Aydınlatma' },
    { id: 'security', icon: '🔒', label: 'Güvenlik' },
    { id: 'energy', icon: '⚡', label: 'Enerji' },
    { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
  ];

  // Quick scenes
  const quickScenes = [
    { id: 'good-morning', name: 'Günaydın', icon: '🌅' },
    { id: 'leaving', name: 'Çıkış', icon: '👋' },
    { id: 'coming-home', name: 'Eve Dönüş', icon: '🏡' },
    { id: 'movie-time', name: 'Film Vakti', icon: '🎬' },
    { id: 'good-night', name: 'İyi Geceler', icon: '🌙' },
  ];

  // Handle navigation
  const handleNavigation = useCallback((view: DashboardView) => {
    triggerHaptic('selection');
    setActiveView(view);
  }, [triggerHaptic]);

  // Handle device selection
  const handleDeviceSelect = useCallback((deviceId: DeviceId) => {
    triggerHaptic('selection');
    setSelectedDevice(deviceId);
    setShowDevicePanel(true);
  }, [triggerHaptic]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="time-display">
            <span className="time">
              {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="date">
              {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="weather-display">
            <span className="weather-icon">{getWeatherIcon(weather.condition)}</span>
            <span className="weather-temp">{weather.temperature}°C</span>
            <span className="weather-humidity">💧 {weather.humidity}%</span>
          </div>
        </div>

        <div className="header-center">
          <div className="logo">
            <span className="logo-text">AICO</span>
          </div>
        </div>

        <div className="header-right">
          {user && (
            <div className="user-info">
              <span className="user-greeting">Merhaba, {user.name}</span>
              <span className="user-avatar">{user.avatar || '👤'}</span>
            </div>
          )}
          <div className={`residence-mode mode-${residenceMode}`}>
            <span className="mode-icon">{getModeIcon(residenceMode)}</span>
            <span className="mode-label">{getModeLabel(residenceMode)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Left Sidebar - Navigation */}
        <nav className="dashboard-nav">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`nav-btn ${activeView === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item.id)}
              whileTap={{ scale: 0.95 }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </motion.button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            {activeView === 'home' && (
              <motion.div
                key="home"
                className="view-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HomeView
                  quickScenes={quickScenes}
                  onSceneActivate={(id) => {
                    triggerHaptic('success');
                    onSceneActivate(id);
                  }}
                  floors={mockFloors}
                  alerts={mockAlerts}
                />
              </motion.div>
            )}

            {activeView === 'rooms' && (
              <motion.div
                key="rooms"
                className="view-rooms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RoomDeviceGrid
                  floors={mockFloors}
                  selectedRoom={selectedRoom || undefined}
                  onRoomSelect={setSelectedRoom}
                  onDeviceSelect={handleDeviceSelect}
                  onDeviceToggle={(id, isOn) => {
                    triggerHaptic(isOn ? 'success' : 'tap');
                    console.log('Toggle device:', id, isOn);
                  }}
                  onQuickAction={(action) => {
                    triggerHaptic('success');
                    console.log('Quick action:', action);
                  }}
                />
              </motion.div>
            )}

            {activeView === 'climate' && (
              <motion.div
                key="climate"
                className="view-climate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ClimateView />
              </motion.div>
            )}

            {activeView === 'lighting' && (
              <motion.div
                key="lighting"
                className="view-lighting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LightingView />
              </motion.div>
            )}

            {activeView === 'security' && (
              <motion.div
                key="security"
                className="view-security"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SecurityPanel
                  alarmState="disarmed"
                  cameras={mockCameras}
                  locks={mockLocks}
                  accessLogs={[]}
                  onAlarmStateChange={(state) => console.log('Alarm:', state)}
                  onLockToggle={(id, action) => console.log('Lock:', id, action)}
                  onCameraSelect={(id) => console.log('Camera:', id)}
                  onEmergency={() => {
                    triggerHaptic('error');
                    console.log('Emergency!');
                  }}
                />
              </motion.div>
            )}

            {activeView === 'energy' && (
              <motion.div
                key="energy"
                className="view-energy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <EnergyView />
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div
                key="settings"
                className="view-settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SettingsView onModeChange={onModeChange} currentMode={residenceMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Quick Info */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-section alerts">
            <h4>Uyarılar</h4>
            {mockAlerts.length === 0 ? (
              <div className="no-alerts">
                <span className="check-icon">✓</span>
                <span>Tüm sistemler normal</span>
              </div>
            ) : (
              <EmergencyAlerts
                alerts={mockAlerts}
                onAcknowledge={(id) => console.log('Acknowledge:', id)}
                onResolve={(id) => console.log('Resolve:', id)}
                onSilence={(id, duration) => console.log('Silence:', id, duration)}
                onEmergencyAction={(action) => console.log('Emergency:', action)}
              />
            )}
          </div>

          <div className="sidebar-section quick-access">
            <h4>Hızlı Erişim</h4>
            <EmergencyQuickActions
              onAction={(action) => {
                triggerHaptic('warning');
                console.log('Emergency action:', action);
              }}
            />
          </div>
        </aside>
      </main>

      {/* Device Panel Overlay */}
      <AnimatePresence>
        {showDevicePanel && selectedDevice && (
          <DevicePanel
            deviceId={selectedDevice}
            onClose={() => {
              setShowDevicePanel(false);
              setSelectedDevice(null);
              triggerHaptic('tap');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// View Components
// ============================================================================

const HomeView: React.FC<{
  quickScenes: { id: string; name: string; icon: string }[];
  onSceneActivate: (id: string) => void;
  floors: any[];
  alerts: any[];
}> = ({ quickScenes, onSceneActivate, floors, alerts }) => {
  const { triggerHaptic } = useHapticFeedback();

  // Calculate totals
  const totalRooms = floors.reduce((acc, f) => acc + f.rooms.length, 0);
  const totalDevices = floors.reduce(
    (acc, f) => acc + f.rooms.reduce((a: number, r: any) => a + r.devices.length, 0),
    0
  );
  const activeDevices = floors.reduce(
    (acc, f) =>
      acc + f.rooms.reduce((a: number, r: any) => a + r.devices.filter((d: any) => d.isOn).length, 0),
    0
  );

  return (
    <div className="home-view">
      {/* Quick Scenes */}
      <section className="quick-scenes-section">
        <h3>Hızlı Senaryolar</h3>
        <div className="scenes-grid">
          {quickScenes.map((scene) => (
            <motion.button
              key={scene.id}
              className="scene-btn"
              onClick={() => onSceneActivate(scene.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="scene-icon">{scene.icon}</span>
              <span className="scene-name">{scene.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Status Overview */}
      <section className="status-overview">
        <h3>Ev Durumu</h3>
        <div className="status-cards">
          <div className="status-card">
            <span className="card-icon">🏠</span>
            <span className="card-value">{totalRooms}</span>
            <span className="card-label">Oda</span>
          </div>
          <div className="status-card">
            <span className="card-icon">📱</span>
            <span className="card-value">{totalDevices}</span>
            <span className="card-label">Cihaz</span>
          </div>
          <div className="status-card active">
            <span className="card-icon">⚡</span>
            <span className="card-value">{activeDevices}</span>
            <span className="card-label">Aktif</span>
          </div>
          <div className="status-card">
            <span className="card-icon">🌡️</span>
            <span className="card-value">22°C</span>
            <span className="card-label">Ortalama</span>
          </div>
        </div>
      </section>

      {/* Room Quick Access */}
      <section className="rooms-quick-access">
        <h3>Odalar</h3>
        <div className="rooms-carousel">
          {floors.flatMap((floor) =>
            floor.rooms.map((room: any) => (
              <motion.div
                key={room.id}
                className={`room-quick-card ${room.occupancy ? 'occupied' : ''}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => triggerHaptic('selection')}
              >
                <span className="room-icon">{room.icon}</span>
                <span className="room-name">{room.name}</span>
                <div className="room-stats">
                  {room.temperature && <span>{room.temperature}°C</span>}
                  <span>{room.devices.filter((d: any) => d.isOn).length}/{room.devices.length}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const ClimateView: React.FC = () => {
  return (
    <div className="climate-view">
      <h2>İklim Kontrolü</h2>
      <div className="climate-grid">
        <ClimateControl
          deviceId={'ac-living' as DeviceId}
          name="Oturma Odası"
          room="Zemin Kat"
          currentTemp={22.5}
          targetTemp={22}
          humidity={45}
          mode="cool"
          fanSpeed="auto"
          isActive={true}
          outdoorTemp={28}
          onTargetTempChange={(temp) => console.log('Target:', temp)}
          onModeChange={(mode) => console.log('Mode:', mode)}
          onFanSpeedChange={(speed) => console.log('Fan:', speed)}
        />
        <ClimateControl
          deviceId={'ac-bedroom' as DeviceId}
          name="Yatak Odası"
          room="Üst Kat"
          currentTemp={20}
          targetTemp={20}
          humidity={50}
          mode="off"
          fanSpeed="auto"
          isActive={false}
          onTargetTempChange={(temp) => console.log('Target:', temp)}
          onModeChange={(mode) => console.log('Mode:', mode)}
          onFanSpeedChange={(speed) => console.log('Fan:', speed)}
          compact
        />
      </div>
    </div>
  );
};

const LightingView: React.FC = () => {
  return (
    <div className="lighting-view">
      <h2>Aydınlatma</h2>
      <div className="lighting-grid">
        <LightControl
          deviceId={'light-living' as DeviceId}
          name="Oturma Odası"
          room="Zemin Kat"
          isOn={true}
          brightness={80}
          colorTemp={4000}
          supportsColorTemp={true}
          supportsRGB={true}
          onToggle={(on) => console.log('Toggle:', on)}
          onBrightnessChange={(b) => console.log('Brightness:', b)}
          onColorTempChange={(t) => console.log('Color temp:', t)}
          onColorChange={(c) => console.log('Color:', c)}
        />
        <LightControl
          deviceId={'light-kitchen' as DeviceId}
          name="Mutfak"
          room="Zemin Kat"
          isOn={true}
          brightness={100}
          onToggle={(on) => console.log('Toggle:', on)}
          onBrightnessChange={(b) => console.log('Brightness:', b)}
          compact
        />
      </div>

      <h3>Perdeler</h3>
      <div className="curtains-grid">
        <CurtainControl
          deviceId={'curtain-living' as DeviceId}
          name="Ana Perde"
          room="Oturma Odası"
          position={75}
          type="curtain"
          onPositionChange={(p) => console.log('Position:', p)}
        />
      </div>
    </div>
  );
};

const EnergyView: React.FC = () => {
  return (
    <div className="energy-view">
      <h2>Enerji Yönetimi</h2>

      <div className="energy-summary">
        <div className="energy-card current">
          <span className="card-icon">⚡</span>
          <span className="card-value">2.4 kW</span>
          <span className="card-label">Anlık Tüketim</span>
        </div>
        <div className="energy-card today">
          <span className="card-icon">📊</span>
          <span className="card-value">18.5 kWh</span>
          <span className="card-label">Bugün</span>
        </div>
        <div className="energy-card month">
          <span className="card-icon">📅</span>
          <span className="card-value">342 kWh</span>
          <span className="card-label">Bu Ay</span>
        </div>
        <div className="energy-card cost">
          <span className="card-icon">💰</span>
          <span className="card-value">₺285</span>
          <span className="card-label">Tahmini Maliyet</span>
        </div>
      </div>

      <h3>Priz Kontrolleri</h3>
      <div className="sockets-grid">
        <SocketControl
          deviceId={'socket-1' as DeviceId}
          name="Kahve Makinesi"
          room="Mutfak"
          isOn={false}
          currentPower={0}
          energyToday={0.5}
          energyTotal={45}
          onToggle={(on) => console.log('Toggle:', on)}
        />
        <SocketControl
          deviceId={'socket-2' as DeviceId}
          name="TV Ünitesi"
          room="Oturma Odası"
          isOn={true}
          currentPower={150}
          energyToday={2.3}
          energyTotal={180}
          connectedDevice="TV + Ses Sistemi"
          onToggle={(on) => console.log('Toggle:', on)}
        />
      </div>
    </div>
  );
};

const SettingsView: React.FC<{
  currentMode: string;
  onModeChange: (mode: string) => void;
}> = ({ currentMode, onModeChange }) => {
  const { triggerHaptic } = useHapticFeedback();

  const modes = [
    { id: 'home', label: 'Evde', icon: '🏠' },
    { id: 'away', label: 'Dışarıda', icon: '🚗' },
    { id: 'night', label: 'Gece', icon: '🌙' },
    { id: 'vacation', label: 'Tatil', icon: '🏖️' },
    { id: 'guest', label: 'Misafir', icon: '👥' },
  ];

  return (
    <div className="settings-view">
      <h2>Ayarlar</h2>

      <section className="settings-section">
        <h3>Ev Modu</h3>
        <div className="mode-selector">
          {modes.map((mode) => (
            <motion.button
              key={mode.id}
              className={`mode-btn ${currentMode === mode.id ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic('success');
                onModeChange(mode.id);
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>Hızlı Ayarlar</h3>
        <div className="quick-settings">
          <div className="setting-item">
            <span className="setting-label">Haptic Feedback</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <span className="setting-label">Sesli Bildirimler</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <span className="setting-label">Gece Modu (Otomatik)</span>
            <input type="checkbox" />
          </div>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// Device Panel
// ============================================================================

const DevicePanel: React.FC<{
  deviceId: DeviceId;
  onClose: () => void;
}> = ({ deviceId, onClose }) => {
  return (
    <motion.div
      className="device-panel-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="device-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <h3>Cihaz Detayları</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-content">
          <p>Device ID: {deviceId}</p>
          {/* Full device control would go here */}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    snowy: '🌨️',
    foggy: '🌫️',
    clear: '🌙',
  };
  return icons[condition.toLowerCase()] || '🌤️';
}

function getModeIcon(mode: string): string {
  const icons: Record<string, string> = {
    home: '🏠',
    away: '🚗',
    night: '🌙',
    vacation: '🏖️',
    guest: '👥',
    party: '🎉',
  };
  return icons[mode] || '🏠';
}

function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    home: 'Evde',
    away: 'Dışarıda',
    night: 'Gece',
    vacation: 'Tatil',
    guest: 'Misafir',
    party: 'Parti',
  };
  return labels[mode] || mode;
}

export default Dashboard;
