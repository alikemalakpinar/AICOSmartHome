/**
 * AICO Smart Home - Security Panel Component
 *
 * Camera feeds, door locks, alarm system, and access control.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId, RoomId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

type AlarmState = 'disarmed' | 'armed_away' | 'armed_home' | 'armed_night' | 'triggered';
type LockState = 'locked' | 'unlocked' | 'jammed' | 'unknown';
type CameraState = 'live' | 'recording' | 'offline' | 'motion_detected';

interface Camera {
  id: DeviceId;
  name: string;
  location: string;
  state: CameraState;
  streamUrl?: string;
  thumbnailUrl?: string;
  hasMotionDetection: boolean;
  hasNightVision: boolean;
  isPTZ: boolean;
  lastMotion?: Date;
}

interface DoorLock {
  id: DeviceId;
  name: string;
  location: string;
  state: LockState;
  batteryLevel?: number;
  lastActivity?: { action: 'lock' | 'unlock'; user?: string; time: Date };
  isAutoLock: boolean;
}

interface AccessLog {
  id: string;
  type: 'entry' | 'exit' | 'denied' | 'unlock' | 'lock';
  location: string;
  user?: string;
  method?: 'pin' | 'fingerprint' | 'face' | 'card' | 'app' | 'manual';
  timestamp: Date;
  imageUrl?: string;
}

interface SecurityPanelProps {
  alarmState: AlarmState;
  cameras: Camera[];
  locks: DoorLock[];
  accessLogs: AccessLog[];
  onAlarmStateChange: (state: AlarmState) => void;
  onLockToggle: (lockId: DeviceId, action: 'lock' | 'unlock') => void;
  onCameraSelect: (cameraId: DeviceId) => void;
  onEmergency: () => void;
}

// ============================================================================
// Alarm State Configurations
// ============================================================================

const ALARM_STATES: Record<AlarmState, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  disarmed: {
    label: 'Devre Dışı',
    icon: '🔓',
    color: '#10b981',
    description: 'Alarm sistemi kapalı',
  },
  armed_away: {
    label: 'Uzak Mod',
    icon: '🏠',
    color: '#ef4444',
    description: 'Tüm sensörler aktif',
  },
  armed_home: {
    label: 'Ev Modu',
    icon: '🏡',
    color: '#f59e0b',
    description: 'Çevre sensörleri aktif',
  },
  armed_night: {
    label: 'Gece Modu',
    icon: '🌙',
    color: '#8b5cf6',
    description: 'Gece güvenliği aktif',
  },
  triggered: {
    label: 'ALARM!',
    icon: '🚨',
    color: '#dc2626',
    description: 'Alarm tetiklendi!',
  },
};

// ============================================================================
// Security Panel Component
// ============================================================================

export const SecurityPanel: React.FC<SecurityPanelProps> = ({
  alarmState,
  cameras,
  locks,
  accessLogs,
  onAlarmStateChange,
  onLockToggle,
  onCameraSelect,
  onEmergency,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'overview' | 'cameras' | 'locks' | 'logs'>('overview');
  const [selectedCamera, setSelectedCamera] = useState<DeviceId | null>(null);
  const [showArmOptions, setShowArmOptions] = useState(false);
  const [pinEntry, setPinEntry] = useState('');

  // Get alarm config
  const alarmConfig = ALARM_STATES[alarmState];

  // Handle alarm state change with PIN verification
  const handleAlarmChange = useCallback((newState: AlarmState) => {
    // In production, would verify PIN first
    triggerHaptic('success');
    onAlarmStateChange(newState);
    setShowArmOptions(false);
  }, [onAlarmStateChange, triggerHaptic]);

  // Handle lock toggle
  const handleLockToggle = useCallback((lock: DoorLock) => {
    const action = lock.state === 'locked' ? 'unlock' : 'lock';
    triggerHaptic(action === 'lock' ? 'success' : 'warning');
    onLockToggle(lock.id, action);
  }, [onLockToggle, triggerHaptic]);

  // Cameras with motion
  const camerasWithMotion = cameras.filter((c) => c.state === 'motion_detected');

  return (
    <div className={`security-panel alarm-${alarmState}`}>
      {/* Alarm Status Header */}
      <div
        className="alarm-status"
        style={{ backgroundColor: `${alarmConfig.color}22` }}
      >
        <motion.div
          className="status-content"
          animate={alarmState === 'triggered' ? { scale: [1, 1.05, 1] } : {}}
          transition={alarmState === 'triggered' ? { duration: 0.5, repeat: Infinity } : {}}
        >
          <span className="status-icon">{alarmConfig.icon}</span>
          <div className="status-info">
            <span className="status-label\" style={{ color: alarmConfig.color }}>
              {alarmConfig.label}
            </span>
            <span className="status-description">{alarmConfig.description}</span>
          </div>
        </motion.div>

        <div className="alarm-controls">
          {alarmState === 'triggered' ? (
            <motion.button
              className="emergency-stop-btn"
              onClick={() => {
                triggerHaptic('impact');
                handleAlarmChange('disarmed');
              }}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              DURDUR
            </motion.button>
          ) : (
            <motion.button
              className="arm-toggle-btn"
              onClick={() => {
                setShowArmOptions(!showArmOptions);
                triggerHaptic('selection');
              }}
              whileTap={{ scale: 0.95 }}
            >
              {alarmState === 'disarmed' ? 'KORU' : 'DEVRE DIŞI'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Arm Options */}
      <AnimatePresence>
        {showArmOptions && (
          <motion.div
            className="arm-options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {alarmState === 'disarmed' ? (
              <div className="arm-buttons">
                {(['armed_away', 'armed_home', 'armed_night'] as AlarmState[]).map((state) => {
                  const config = ALARM_STATES[state];
                  return (
                    <motion.button
                      key={state}
                      className="arm-btn"
                      onClick={() => handleAlarmChange(state)}
                      whileTap={{ scale: 0.95 }}
                      style={{ borderColor: config.color }}
                    >
                      <span className="arm-icon">{config.icon}</span>
                      <span className="arm-label">{config.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="disarm-section">
                <PinPad
                  onComplete={(pin) => {
                    // Verify PIN (simplified)
                    if (pin.length === 4) {
                      handleAlarmChange('disarmed');
                    }
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="security-tabs">
        {[
          { id: 'overview', label: 'Genel', icon: '🏠' },
          { id: 'cameras', label: 'Kameralar', icon: '📹', badge: camerasWithMotion.length },
          { id: 'locks', label: 'Kilitler', icon: '🔐' },
          { id: 'logs', label: 'Geçmiş', icon: '📋' },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              triggerHaptic('selection');
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              className="overview-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SecurityOverview
                cameras={cameras}
                locks={locks}
                recentLogs={accessLogs.slice(0, 5)}
                onCameraClick={(id) => {
                  setSelectedCamera(id);
                  setActiveTab('cameras');
                  triggerHaptic('selection');
                }}
                onLockClick={(id) => {
                  setActiveTab('locks');
                  triggerHaptic('selection');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'cameras' && (
            <motion.div
              key="cameras"
              className="cameras-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CameraGrid
                cameras={cameras}
                selectedCamera={selectedCamera}
                onSelect={(id) => {
                  setSelectedCamera(id);
                  onCameraSelect(id);
                  triggerHaptic('selection');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'locks' && (
            <motion.div
              key="locks"
              className="locks-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LockGrid locks={locks} onToggle={handleLockToggle} />
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              className="logs-tab"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AccessLogList logs={accessLogs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Emergency Button */}
      <motion.button
        className="emergency-btn"
        onClick={() => {
          triggerHaptic('error');
          onEmergency();
        }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="emergency-icon">🆘</span>
        <span className="emergency-text">ACİL DURUM</span>
      </motion.button>
    </div>
  );
};

// ============================================================================
// PIN Pad Component
// ============================================================================

const PinPad: React.FC<{
  onComplete: (pin: string) => void;
}> = ({ onComplete }) => {
  const { triggerHaptic } = useHapticFeedback();
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      triggerHaptic('tap');
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onComplete(newPin);
        setPin('');
      }
    }
  };

  const handleClear = () => {
    triggerHaptic('tap');
    setPin('');
  };

  const handleBackspace = () => {
    triggerHaptic('tap');
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="pin-pad">
      <div className="pin-display">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="pin-buttons">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
          <motion.button
            key={key}
            className={`pin-btn ${key === 'C' || key === '⌫' ? 'action' : ''}`}
            onClick={() => {
              if (key === 'C') handleClear();
              else if (key === '⌫') handleBackspace();
              else handleDigit(key);
            }}
            whileTap={{ scale: 0.9 }}
          >
            {key}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Security Overview
// ============================================================================

const SecurityOverview: React.FC<{
  cameras: Camera[];
  locks: DoorLock[];
  recentLogs: AccessLog[];
  onCameraClick: (id: DeviceId) => void;
  onLockClick: (id: DeviceId) => void;
}> = ({ cameras, locks, recentLogs, onCameraClick, onLockClick }) => {
  const onlineCameras = cameras.filter((c) => c.state !== 'offline');
  const lockedDoors = locks.filter((l) => l.state === 'locked');

  return (
    <div className="security-overview">
      {/* Status Cards */}
      <div className="status-cards">
        <div className="status-card cameras">
          <span className="card-icon">📹</span>
          <div className="card-content">
            <span className="card-value">{onlineCameras.length}/{cameras.length}</span>
            <span className="card-label">Kamera Çevrimiçi</span>
          </div>
        </div>

        <div className="status-card locks">
          <span className="card-icon">🔐</span>
          <div className="card-content">
            <span className="card-value">{lockedDoors.length}/{locks.length}</span>
            <span className="card-label">Kapı Kilitli</span>
          </div>
        </div>
      </div>

      {/* Camera Previews */}
      <div className="camera-previews">
        <h4>Kamera Önizlemeleri</h4>
        <div className="preview-grid">
          {cameras.slice(0, 4).map((camera) => (
            <motion.div
              key={camera.id}
              className={`camera-preview state-${camera.state}`}
              onClick={() => onCameraClick(camera.id)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="preview-image">
                {camera.thumbnailUrl ? (
                  <img src={camera.thumbnailUrl} alt={camera.name} />
                ) : (
                  <div className="placeholder">📹</div>
                )}
                {camera.state === 'motion_detected' && (
                  <motion.div
                    className="motion-indicator"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Hareket!
                  </motion.div>
                )}
              </div>
              <span className="preview-name">{camera.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Lock Status */}
      <div className="lock-status-list">
        <h4>Kapı Durumları</h4>
        {locks.map((lock) => (
          <motion.div
            key={lock.id}
            className={`lock-status-item state-${lock.state}`}
            onClick={() => onLockClick(lock.id)}
            whileTap={{ scale: 0.98 }}
          >
            <span className="lock-icon">
              {lock.state === 'locked' ? '🔒' : '🔓'}
            </span>
            <span className="lock-name">{lock.name}</span>
            <span className={`lock-state ${lock.state}`}>
              {lock.state === 'locked' ? 'Kilitli' : 'Açık'}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h4>Son Aktivite</h4>
        {recentLogs.map((log) => (
          <div key={log.id} className={`activity-item type-${log.type}`}>
            <span className="activity-icon">
              {log.type === 'entry' && '🚪'}
              {log.type === 'exit' && '👋'}
              {log.type === 'denied' && '⛔'}
              {log.type === 'unlock' && '🔓'}
              {log.type === 'lock' && '🔒'}
            </span>
            <div className="activity-content">
              <span className="activity-text">
                {log.user || 'Bilinmeyen'} - {log.location}
              </span>
              <span className="activity-time">
                {formatTime(log.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Camera Grid
// ============================================================================

const CameraGrid: React.FC<{
  cameras: Camera[];
  selectedCamera: DeviceId | null;
  onSelect: (id: DeviceId) => void;
}> = ({ cameras, selectedCamera, onSelect }) => {
  const { triggerHaptic } = useHapticFeedback();

  return (
    <div className="camera-grid">
      {cameras.map((camera) => (
        <motion.div
          key={camera.id}
          className={`camera-card ${selectedCamera === camera.id ? 'selected' : ''} state-${camera.state}`}
          onClick={() => onSelect(camera.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="camera-feed">
            {camera.thumbnailUrl ? (
              <img src={camera.thumbnailUrl} alt={camera.name} />
            ) : (
              <div className="no-feed">
                {camera.state === 'offline' ? '📵' : '📹'}
              </div>
            )}

            {/* Status Overlay */}
            <div className="camera-status">
              {camera.state === 'recording' && (
                <span className="recording-badge">● REC</span>
              )}
              {camera.state === 'motion_detected' && (
                <motion.span
                  className="motion-badge"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  ⚡ Hareket
                </motion.span>
              )}
              {camera.state === 'offline' && (
                <span className="offline-badge">Çevrimdışı</span>
              )}
            </div>

            {/* Feature Badges */}
            <div className="feature-badges">
              {camera.hasNightVision && <span className="badge">🌙</span>}
              {camera.isPTZ && <span className="badge">🔄</span>}
            </div>
          </div>

          <div className="camera-info">
            <span className="camera-name">{camera.name}</span>
            <span className="camera-location">{camera.location}</span>
          </div>

          {camera.lastMotion && (
            <span className="last-motion">
              Son hareket: {formatTime(camera.lastMotion)}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Lock Grid
// ============================================================================

const LockGrid: React.FC<{
  locks: DoorLock[];
  onToggle: (lock: DoorLock) => void;
}> = ({ locks, onToggle }) => {
  const { triggerHaptic } = useHapticFeedback();

  return (
    <div className="lock-grid">
      {locks.map((lock) => (
        <motion.div
          key={lock.id}
          className={`lock-card state-${lock.state}`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="lock-visual">
            <motion.span
              className="lock-icon"
              animate={lock.state === 'locked' ? {} : { rotate: [0, -15, 15, 0] }}
              transition={lock.state === 'locked' ? {} : { duration: 0.5 }}
            >
              {lock.state === 'locked' ? '🔒' : '🔓'}
            </motion.span>
          </div>

          <div className="lock-info">
            <span className="lock-name">{lock.name}</span>
            <span className="lock-location">{lock.location}</span>
            {lock.lastActivity && (
              <span className="last-activity">
                {lock.lastActivity.action === 'lock' ? 'Kilitlendi' : 'Açıldı'}
                {lock.lastActivity.user && ` - ${lock.lastActivity.user}`}
              </span>
            )}
          </div>

          <div className="lock-controls">
            <motion.button
              className={`toggle-btn ${lock.state === 'locked' ? 'locked' : 'unlocked'}`}
              onClick={() => onToggle(lock)}
              whileTap={{ scale: 0.9 }}
              disabled={lock.state === 'jammed'}
            >
              {lock.state === 'locked' ? 'Aç' : 'Kilitle'}
            </motion.button>
          </div>

          {lock.batteryLevel !== undefined && (
            <div className={`battery-level ${lock.batteryLevel < 20 ? 'low' : ''}`}>
              🔋 {lock.batteryLevel}%
            </div>
          )}

          {lock.isAutoLock && (
            <span className="auto-lock-badge">Otomatik Kilit</span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Access Log List
// ============================================================================

const AccessLogList: React.FC<{
  logs: AccessLog[];
}> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'entry' | 'denied'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'entry') return log.type === 'entry' || log.type === 'exit';
    if (filter === 'denied') return log.type === 'denied';
    return true;
  });

  const typeLabels: Record<AccessLog['type'], { icon: string; label: string }> = {
    entry: { icon: '🚪', label: 'Giriş' },
    exit: { icon: '👋', label: 'Çıkış' },
    denied: { icon: '⛔', label: 'Reddedildi' },
    unlock: { icon: '🔓', label: 'Açıldı' },
    lock: { icon: '🔒', label: 'Kilitlendi' },
  };

  const methodLabels: Record<NonNullable<AccessLog['method']>, string> = {
    pin: 'PIN',
    fingerprint: 'Parmak İzi',
    face: 'Yüz Tanıma',
    card: 'Kart',
    app: 'Uygulama',
    manual: 'Manuel',
  };

  return (
    <div className="access-log-list">
      <div className="log-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Tümü
        </button>
        <button
          className={filter === 'entry' ? 'active' : ''}
          onClick={() => setFilter('entry')}
        >
          Giriş/Çıkış
        </button>
        <button
          className={filter === 'denied' ? 'active' : ''}
          onClick={() => setFilter('denied')}
        >
          Reddedilen
        </button>
      </div>

      <div className="logs-container">
        {filteredLogs.map((log) => {
          const typeInfo = typeLabels[log.type];

          return (
            <motion.div
              key={log.id}
              className={`log-item type-${log.type}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {log.imageUrl && (
                <div className="log-image">
                  <img src={log.imageUrl} alt="" />
                </div>
              )}

              <div className="log-icon">{typeInfo.icon}</div>

              <div className="log-content">
                <div className="log-header">
                  <span className="log-type">{typeInfo.label}</span>
                  <span className="log-location">{log.location}</span>
                </div>
                <div className="log-details">
                  <span className="log-user">{log.user || 'Bilinmeyen'}</span>
                  {log.method && (
                    <span className="log-method">{methodLabels[log.method]}</span>
                  )}
                </div>
              </div>

              <div className="log-time">{formatTime(log.timestamp)}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default SecurityPanel;
