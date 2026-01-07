/**
 * AICO Smart Home - Socket/Outlet Control Component
 *
 * Smart power outlet control with energy monitoring and scheduling.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface SocketControlProps {
  deviceId: DeviceId;
  name: string;
  room?: string;
  isOn: boolean;
  currentPower?: number; // Current power draw in watts
  voltage?: number;
  current?: number; // Amps
  energyToday?: number; // kWh consumed today
  energyTotal?: number; // Total kWh consumed
  maxPower?: number; // Maximum allowed power in watts
  hasEnergyMonitoring?: boolean;
  hasSchedule?: boolean;
  schedule?: SocketSchedule[];
  connectedDevice?: string; // What's plugged in
  onToggle: (isOn: boolean) => void;
  onScheduleChange?: (schedule: SocketSchedule[]) => void;
  onMaxPowerChange?: (maxPower: number) => void;
  compact?: boolean;
}

interface SocketSchedule {
  id: string;
  enabled: boolean;
  time: string; // HH:MM format
  action: 'on' | 'off';
  days: number[]; // 0-6 (Sunday-Saturday)
  label?: string;
}

// ============================================================================
// Socket Control Component
// ============================================================================

export const SocketControl: React.FC<SocketControlProps> = ({
  deviceId,
  name,
  room,
  isOn,
  currentPower = 0,
  voltage = 220,
  current = 0,
  energyToday = 0,
  energyTotal = 0,
  maxPower = 3500,
  hasEnergyMonitoring = true,
  hasSchedule = true,
  schedule = [],
  connectedDevice,
  onToggle,
  onScheduleChange,
  onMaxPowerChange,
  compact = false,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate power usage percentage
  const powerPercentage = (currentPower / maxPower) * 100;
  const isOverload = powerPercentage > 90;
  const isHighUsage = powerPercentage > 70;

  // Get power status color
  const getPowerColor = () => {
    if (!isOn) return '#666';
    if (isOverload) return '#ef4444';
    if (isHighUsage) return '#f59e0b';
    return '#10b981';
  };

  // Handle toggle
  const handleToggle = useCallback(() => {
    triggerHaptic(isOn ? 'tap' : 'success');
    onToggle(!isOn);
  }, [isOn, onToggle, triggerHaptic]);

  // Format power display
  const formatPower = (watts: number) => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${watts.toFixed(1)} W`;
  };

  if (compact) {
    return (
      <CompactSocketControl
        name={name}
        isOn={isOn}
        currentPower={currentPower}
        onToggle={handleToggle}
        powerColor={getPowerColor()}
      />
    );
  }

  return (
    <div className={`socket-control ${isOn ? 'on' : 'off'} ${isOverload ? 'overload' : ''}`}>
      {/* Header */}
      <div className="socket-header">
        <div className="socket-info">
          <h3 className="socket-name">{name}</h3>
          {room && <span className="socket-room">{room}</span>}
          {connectedDevice && (
            <span className="connected-device">🔌 {connectedDevice}</span>
          )}
        </div>
        <motion.button
          className={`power-toggle ${isOn ? 'on' : 'off'}`}
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          animate={{
            backgroundColor: isOn ? getPowerColor() : 'rgba(255,255,255,0.1)',
          }}
        >
          <motion.span
            className="power-icon"
            animate={{ rotate: isOn ? 0 : 180 }}
          >
            ⏻
          </motion.span>
        </motion.button>
      </div>

      {/* Power Visualization */}
      <div className="power-visualization">
        <div className="socket-visual">
          <svg viewBox="0 0 100 100" className="socket-svg">
            {/* Outlet background */}
            <rect
              x="20"
              y="20"
              width="60"
              height="60"
              rx="8"
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />

            {/* Socket holes */}
            <circle cx="38" cy="45" r="5" fill={isOn ? getPowerColor() : '#333'} />
            <circle cx="62" cy="45" r="5" fill={isOn ? getPowerColor() : '#333'} />
            <rect x="45" y="58" width="10" height="8" rx="2" fill={isOn ? getPowerColor() : '#333'} />

            {/* Power flow animation when on */}
            {isOn && (
              <>
                <motion.circle
                  cx="38"
                  cy="45"
                  r="8"
                  fill="none"
                  stroke={getPowerColor()}
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{
                    opacity: [0.8, 0],
                    scale: [1, 2],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.circle
                  cx="62"
                  cy="45"
                  r="8"
                  fill="none"
                  stroke={getPowerColor()}
                  strokeWidth="2"
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{
                    opacity: [0.8, 0],
                    scale: [1, 2],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: 0.5,
                  }}
                />
              </>
            )}
          </svg>
        </div>

        {/* Power meter */}
        {hasEnergyMonitoring && isOn && (
          <div className="power-meter">
            <div className="meter-label">Güç Tüketimi</div>
            <div className="meter-bar-container">
              <motion.div
                className="meter-bar"
                initial={false}
                animate={{
                  width: `${Math.min(powerPercentage, 100)}%`,
                  backgroundColor: getPowerColor(),
                }}
              />
              <div className="meter-markers">
                {[0, 25, 50, 75, 100].map((mark) => (
                  <div
                    key={mark}
                    className="marker"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="meter-values">
              <span className="current-power">{formatPower(currentPower)}</span>
              <span className="max-power">/ {formatPower(maxPower)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Energy Stats */}
      {hasEnergyMonitoring && (
        <div className="energy-stats">
          <div className="stat-item">
            <span className="stat-icon">⚡</span>
            <div className="stat-content">
              <span className="stat-label">Bugün</span>
              <span className="stat-value">{energyToday.toFixed(2)} kWh</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <div className="stat-content">
              <span className="stat-label">Toplam</span>
              <span className="stat-value">{energyTotal.toFixed(1)} kWh</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🔌</span>
            <div className="stat-content">
              <span className="stat-label">Voltaj</span>
              <span className="stat-value">{voltage} V</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">〰️</span>
            <div className="stat-content">
              <span className="stat-label">Akım</span>
              <span className="stat-value">{current.toFixed(2)} A</span>
            </div>
          </div>
        </div>
      )}

      {/* Overload Warning */}
      <AnimatePresence>
        {isOverload && (
          <motion.div
            className="overload-warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Yüksek güç tüketimi! Aşırı yük riski.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Section */}
      {hasSchedule && (
        <div className="schedule-section">
          <button
            className="schedule-toggle"
            onClick={() => {
              setShowSchedule(!showSchedule);
              triggerHaptic('selection');
            }}
          >
            <span className="schedule-icon">🕒</span>
            <span>Zamanlayıcı</span>
            <motion.span
              className="toggle-arrow"
              animate={{ rotate: showSchedule ? 180 : 0 }}
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {showSchedule && (
              <motion.div
                className="schedule-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ScheduleEditor
                  schedule={schedule}
                  onChange={(newSchedule) => {
                    triggerHaptic('selection');
                    onScheduleChange?.(newSchedule);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <motion.button
          className="action-btn timer"
          onClick={() => {
            triggerHaptic('selection');
            // Open timer modal
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">⏱️</span>
          <span>Zamanlayıcı</span>
        </motion.button>

        <motion.button
          className="action-btn details"
          onClick={() => {
            setShowDetails(!showDetails);
            triggerHaptic('selection');
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">📈</span>
          <span>Detaylar</span>
        </motion.button>
      </div>
    </div>
  );
};

// ============================================================================
// Schedule Editor
// ============================================================================

const ScheduleEditor: React.FC<{
  schedule: SocketSchedule[];
  onChange: (schedule: SocketSchedule[]) => void;
}> = ({ schedule, onChange }) => {
  const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const addSchedule = () => {
    const newSchedule: SocketSchedule = {
      id: Date.now().toString(),
      enabled: true,
      time: '08:00',
      action: 'on',
      days: [1, 2, 3, 4, 5], // Weekdays
      label: 'Yeni Program',
    };
    onChange([...schedule, newSchedule]);
  };

  const updateSchedule = (id: string, updates: Partial<SocketSchedule>) => {
    onChange(
      schedule.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeSchedule = (id: string) => {
    onChange(schedule.filter((s) => s.id !== id));
  };

  return (
    <div className="schedule-editor">
      {schedule.length === 0 ? (
        <div className="no-schedule">
          <span>Henüz program yok</span>
        </div>
      ) : (
        <div className="schedule-list">
          {schedule.map((item) => (
            <div key={item.id} className={`schedule-item ${item.enabled ? 'enabled' : 'disabled'}`}>
              <div className="schedule-header">
                <input
                  type="time"
                  value={item.time}
                  onChange={(e) => updateSchedule(item.id, { time: e.target.value })}
                  className="time-input"
                />
                <select
                  value={item.action}
                  onChange={(e) => updateSchedule(item.id, { action: e.target.value as 'on' | 'off' })}
                  className="action-select"
                >
                  <option value="on">Aç</option>
                  <option value="off">Kapat</option>
                </select>
                <button
                  className="toggle-enabled"
                  onClick={() => updateSchedule(item.id, { enabled: !item.enabled })}
                >
                  {item.enabled ? '✓' : '○'}
                </button>
                <button
                  className="remove-schedule"
                  onClick={() => removeSchedule(item.id)}
                >
                  ✕
                </button>
              </div>

              <div className="day-selector">
                {dayLabels.map((label, index) => (
                  <button
                    key={index}
                    className={`day-btn ${item.days.includes(index) ? 'active' : ''}`}
                    onClick={() => {
                      const newDays = item.days.includes(index)
                        ? item.days.filter((d) => d !== index)
                        : [...item.days, index].sort();
                      updateSchedule(item.id, { days: newDays });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="add-schedule-btn" onClick={addSchedule}>
        <span>+</span> Program Ekle
      </button>
    </div>
  );
};

// ============================================================================
// Compact Version
// ============================================================================

const CompactSocketControl: React.FC<{
  name: string;
  isOn: boolean;
  currentPower: number;
  onToggle: () => void;
  powerColor: string;
}> = ({ name, isOn, currentPower, onToggle, powerColor }) => {
  return (
    <motion.div
      className={`socket-control-compact ${isOn ? 'on' : 'off'}`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="compact-icon" style={{ color: powerColor }}>
        🔌
      </div>
      <div className="compact-info">
        <span className="compact-name">{name}</span>
        {isOn && (
          <span className="compact-power">{currentPower.toFixed(0)} W</span>
        )}
      </div>
      <motion.button
        className="compact-toggle"
        onClick={onToggle}
        animate={{
          backgroundColor: isOn ? powerColor : 'rgba(255,255,255,0.1)',
        }}
        whileTap={{ scale: 0.9 }}
      >
        <span>{isOn ? 'AÇIK' : 'KAPALI'}</span>
      </motion.button>
    </motion.div>
  );
};

export default SocketControl;
