/**
 * AICO Smart Home - Climate Control Component
 *
 * Advanced HVAC control with temperature adjustment and modes.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId, RoomId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

type ClimateMode = 'off' | 'heat' | 'cool' | 'auto' | 'fan_only' | 'dry';
type FanSpeed = 'auto' | 'low' | 'medium' | 'high' | 'turbo';

interface ClimateControlProps {
  deviceId: DeviceId;
  name: string;
  room?: string;
  currentTemp: number;
  targetTemp: number;
  humidity: number;
  mode: ClimateMode;
  fanSpeed: FanSpeed;
  isActive: boolean;
  minTemp?: number;
  maxTemp?: number;
  outdoorTemp?: number;
  onTargetTempChange: (temp: number) => void;
  onModeChange: (mode: ClimateMode) => void;
  onFanSpeedChange: (speed: FanSpeed) => void;
  compact?: boolean;
}

// ============================================================================
// Climate Control Component
// ============================================================================

export const ClimateControl: React.FC<ClimateControlProps> = ({
  deviceId,
  name,
  room,
  currentTemp,
  targetTemp,
  humidity,
  mode,
  fanSpeed,
  isActive,
  minTemp = 16,
  maxTemp = 30,
  outdoorTemp,
  onTargetTempChange,
  onModeChange,
  onFanSpeedChange,
  compact = false,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [localTarget, setLocalTarget] = useState(targetTemp);
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  // Sync local state with props
  useEffect(() => {
    if (!isDragging) {
      setLocalTarget(targetTemp);
    }
  }, [targetTemp, isDragging]);

  // Temperature range
  const tempRange = maxTemp - minTemp;

  // Calculate rotation angle from temperature
  const tempToAngle = (temp: number) => {
    const percentage = (temp - minTemp) / tempRange;
    return -135 + percentage * 270; // -135 to +135 degrees
  };

  // Calculate temperature from angle
  const angleToTemp = (angle: number) => {
    const normalizedAngle = ((angle + 135) % 360) / 270;
    return Math.round((minTemp + normalizedAngle * tempRange) * 2) / 2; // 0.5 degree steps
  };

  // Handle dial rotation
  const handleDialRotation = useCallback((event: React.PointerEvent | PointerEvent) => {
    if (!dialRef.current) return;

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    let adjustedAngle = angle + 90; // Adjust so top is 0

    // Clamp to valid range
    if (adjustedAngle < -135) adjustedAngle = -135;
    if (adjustedAngle > 135) adjustedAngle = 135;

    const newTemp = angleToTemp(adjustedAngle);
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));

    // Haptic on whole degrees
    if (Math.abs(clampedTemp - localTarget) >= 0.5) {
      triggerHaptic('selection');
    }

    setLocalTarget(clampedTemp);
  }, [localTarget, minTemp, maxTemp, triggerHaptic]);

  // Mode configurations
  const modes: { mode: ClimateMode; icon: string; label: string; color: string }[] = [
    { mode: 'off', icon: '⏻', label: 'Kapalı', color: '#666' },
    { mode: 'cool', icon: '❄️', label: 'Soğutma', color: '#3b82f6' },
    { mode: 'heat', icon: '🔥', label: 'Isıtma', color: '#ef4444' },
    { mode: 'auto', icon: '🔄', label: 'Otomatik', color: '#10b981' },
    { mode: 'fan_only', icon: '💨', label: 'Fan', color: '#8b5cf6' },
    { mode: 'dry', icon: '💧', label: 'Nem Alma', color: '#f59e0b' },
  ];

  const fanSpeeds: { speed: FanSpeed; icon: string; label: string }[] = [
    { speed: 'auto', icon: 'A', label: 'Otomatik' },
    { speed: 'low', icon: '◐', label: 'Düşük' },
    { speed: 'medium', icon: '◑', label: 'Orta' },
    { speed: 'high', icon: '●', label: 'Yüksek' },
    { speed: 'turbo', icon: '◉', label: 'Turbo' },
  ];

  const currentMode = modes.find(m => m.mode === mode) || modes[0];

  // Get status color based on mode and activity
  const getStatusColor = () => {
    if (!isActive || mode === 'off') return '#666';
    return currentMode.color;
  };

  // Get temperature indicator color
  const getTempColor = () => {
    const diff = localTarget - currentTemp;
    if (mode === 'cool') return '#3b82f6';
    if (mode === 'heat') return '#ef4444';
    if (diff > 0) return '#ef4444';
    if (diff < 0) return '#3b82f6';
    return '#10b981';
  };

  if (compact) {
    return (
      <CompactClimateControl
        name={name}
        currentTemp={currentTemp}
        targetTemp={localTarget}
        mode={mode}
        isActive={isActive}
        onTempUp={() => {
          const newTemp = Math.min(maxTemp, localTarget + 0.5);
          setLocalTarget(newTemp);
          onTargetTempChange(newTemp);
          triggerHaptic('selection');
        }}
        onTempDown={() => {
          const newTemp = Math.max(minTemp, localTarget - 0.5);
          setLocalTarget(newTemp);
          onTargetTempChange(newTemp);
          triggerHaptic('selection');
        }}
        modeColor={currentMode.color}
      />
    );
  }

  return (
    <div className={`climate-control mode-${mode} ${isActive ? 'active' : 'inactive'}`}>
      {/* Header */}
      <div className="climate-header">
        <div className="climate-info">
          <h3 className="climate-name">{name}</h3>
          {room && <span className="climate-room">{room}</span>}
        </div>
        <div className="climate-outdoor">
          {outdoorTemp !== undefined && (
            <span className="outdoor-temp">
              Dış: {outdoorTemp}°C
            </span>
          )}
        </div>
      </div>

      {/* Main Temperature Dial */}
      <div className="climate-dial-container">
        <div
          ref={dialRef}
          className="temperature-dial"
          onPointerDown={(e) => {
            setIsDragging(true);
            triggerHaptic('selection');
            handleDialRotation(e);
          }}
          onPointerMove={(e) => isDragging && handleDialRotation(e)}
          onPointerUp={() => {
            setIsDragging(false);
            triggerHaptic('success');
            onTargetTempChange(localTarget);
          }}
          onPointerLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              onTargetTempChange(localTarget);
            }
          }}
        >
          {/* Dial background */}
          <svg className="dial-svg" viewBox="0 0 200 200">
            {/* Background arc */}
            <path
              d="M 30 150 A 85 85 0 1 1 170 150"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Temperature scale marks */}
            {Array.from({ length: tempRange * 2 + 1 }, (_, i) => {
              const temp = minTemp + i * 0.5;
              const angle = tempToAngle(temp);
              const isWhole = temp % 1 === 0;
              const rad = (angle - 90) * (Math.PI / 180);
              const innerR = isWhole ? 72 : 76;
              const outerR = 82;

              return (
                <line
                  key={i}
                  x1={100 + innerR * Math.cos(rad)}
                  y1={100 + innerR * Math.sin(rad)}
                  x2={100 + outerR * Math.cos(rad)}
                  y2={100 + outerR * Math.sin(rad)}
                  stroke={temp <= localTarget ? getTempColor() : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isWhole ? 2 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Active arc */}
            <motion.path
              d="M 30 150 A 85 85 0 1 1 170 150"
              fill="none"
              stroke={getTempColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="400"
              initial={false}
              animate={{
                strokeDashoffset: 400 - ((localTarget - minTemp) / tempRange) * 400,
                stroke: getTempColor(),
              }}
              style={{ filter: `drop-shadow(0 0 8px ${getTempColor()})` }}
            />

            {/* Temperature labels */}
            {[minTemp, (minTemp + maxTemp) / 2, maxTemp].map((temp) => {
              const angle = tempToAngle(temp);
              const rad = (angle - 90) * (Math.PI / 180);
              const r = 60;

              return (
                <text
                  key={temp}
                  x={100 + r * Math.cos(rad)}
                  y={100 + r * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize="10"
                >
                  {temp}°
                </text>
              );
            })}
          </svg>

          {/* Center content */}
          <div className="dial-center">
            <motion.div
              className="mode-icon"
              animate={{ color: getStatusColor() }}
            >
              {currentMode.icon}
            </motion.div>

            <div className="current-temp">
              <span className="temp-value">{currentTemp.toFixed(1)}</span>
              <span className="temp-unit">°C</span>
            </div>

            <div className="target-temp">
              <button
                className="temp-adjust minus"
                onClick={() => {
                  const newTemp = Math.max(minTemp, localTarget - 0.5);
                  setLocalTarget(newTemp);
                  onTargetTempChange(newTemp);
                  triggerHaptic('selection');
                }}
              >
                −
              </button>
              <span className="target-value" style={{ color: getTempColor() }}>
                Hedef: {localTarget}°C
              </span>
              <button
                className="temp-adjust plus"
                onClick={() => {
                  const newTemp = Math.min(maxTemp, localTarget + 0.5);
                  setLocalTarget(newTemp);
                  onTargetTempChange(newTemp);
                  triggerHaptic('selection');
                }}
              >
                +
              </button>
            </div>

            <div className="humidity-display">
              💧 {humidity}%
            </div>
          </div>

          {/* Dial handle */}
          <motion.div
            className="dial-handle"
            animate={{ rotate: tempToAngle(localTarget) }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="handle-indicator" style={{ backgroundColor: getTempColor() }} />
          </motion.div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mode-selector">
        <span className="selector-label">Mod</span>
        <div className="mode-buttons">
          {modes.map((m) => (
            <motion.button
              key={m.mode}
              className={`mode-btn ${mode === m.mode ? 'active' : ''}`}
              onClick={() => {
                onModeChange(m.mode);
                triggerHaptic(m.mode === 'off' ? 'tap' : 'success');
              }}
              whileTap={{ scale: 0.9 }}
              animate={{
                backgroundColor: mode === m.mode ? `${m.color}22` : 'transparent',
                borderColor: mode === m.mode ? m.color : 'rgba(255,255,255,0.2)',
              }}
            >
              <span className="mode-icon" style={{ color: m.color }}>{m.icon}</span>
              <span className="mode-label">{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Fan speed selector */}
      <AnimatePresence>
        {mode !== 'off' && (
          <motion.div
            className="fan-selector"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="selector-label">Fan Hızı</span>
            <div className="fan-buttons">
              {fanSpeeds.map((f) => (
                <motion.button
                  key={f.speed}
                  className={`fan-btn ${fanSpeed === f.speed ? 'active' : ''}`}
                  onClick={() => {
                    onFanSpeedChange(f.speed);
                    triggerHaptic('selection');
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="fan-icon">{f.icon}</span>
                  <span className="fan-label">{f.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick presets */}
      <div className="climate-presets">
        {[
          { temp: 18, label: 'Enerji Tasarrufu', icon: '🌱' },
          { temp: 20, label: 'Konfor', icon: '😊' },
          { temp: 22, label: 'Rahat', icon: '🛋️' },
          { temp: 24, label: 'Sıcak', icon: '☀️' },
        ].map((preset) => (
          <motion.button
            key={preset.temp}
            className={`preset-btn ${Math.abs(localTarget - preset.temp) < 0.5 ? 'active' : ''}`}
            onClick={() => {
              setLocalTarget(preset.temp);
              onTargetTempChange(preset.temp);
              triggerHaptic('selection');
            }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="preset-icon">{preset.icon}</span>
            <span className="preset-temp">{preset.temp}°</span>
            <span className="preset-label">{preset.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Compact Version
// ============================================================================

const CompactClimateControl: React.FC<{
  name: string;
  currentTemp: number;
  targetTemp: number;
  mode: ClimateMode;
  isActive: boolean;
  onTempUp: () => void;
  onTempDown: () => void;
  modeColor: string;
}> = ({ name, currentTemp, targetTemp, mode, isActive, onTempUp, onTempDown, modeColor }) => {
  const modeIcons: Record<ClimateMode, string> = {
    off: '⏻',
    heat: '🔥',
    cool: '❄️',
    auto: '🔄',
    fan_only: '💨',
    dry: '💧',
  };

  return (
    <motion.div
      className={`climate-control-compact mode-${mode} ${isActive ? 'active' : ''}`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="compact-mode" style={{ color: modeColor }}>
        {modeIcons[mode]}
      </div>
      <div className="compact-info">
        <span className="compact-name">{name}</span>
        <span className="compact-current">{currentTemp}°C</span>
      </div>
      <div className="compact-target">
        <button onClick={onTempDown} className="temp-btn">−</button>
        <span className="target-display" style={{ color: modeColor }}>{targetTemp}°</span>
        <button onClick={onTempUp} className="temp-btn">+</button>
      </div>
    </motion.div>
  );
};

export default ClimateControl;
