/**
 * AICO Smart Home - Light Control Component
 *
 * Advanced light control with dimmer, color temperature, and RGB.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface LightControlProps {
  deviceId: DeviceId;
  name: string;
  room?: string;
  isOn: boolean;
  brightness: number; // 0-100
  colorTemperature?: number; // 2700-6500 Kelvin
  color?: { r: number; g: number; b: number };
  supportsColorTemp?: boolean;
  supportsRGB?: boolean;
  supportsDimming?: boolean;
  onToggle: (isOn: boolean) => void;
  onBrightnessChange: (brightness: number) => void;
  onColorTempChange?: (kelvin: number) => void;
  onColorChange?: (color: { r: number; g: number; b: number }) => void;
  compact?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export const LightControl: React.FC<LightControlProps> = ({
  deviceId,
  name,
  room,
  isOn,
  brightness,
  colorTemperature = 4000,
  color,
  supportsColorTemp = false,
  supportsRGB = false,
  supportsDimming = true,
  onToggle,
  onBrightnessChange,
  onColorTempChange,
  onColorChange,
  compact = false,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [activeTab, setActiveTab] = useState<'brightness' | 'temperature' | 'color'>('brightness');
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Local state for smooth interaction
  const [localBrightness, setLocalBrightness] = useState(brightness);
  const [localColorTemp, setLocalColorTemp] = useState(colorTemperature);
  const [localColor, setLocalColor] = useState(color || { r: 255, g: 200, b: 100 });

  // Sync with props
  useEffect(() => {
    if (!isDragging) {
      setLocalBrightness(brightness);
    }
  }, [brightness, isDragging]);

  // Calculate light color based on temperature
  const getLightColor = useCallback(() => {
    if (color && supportsRGB) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
    // Convert Kelvin to RGB approximation
    const temp = (localColorTemp - 2700) / (6500 - 2700);
    const r = 255;
    const g = Math.round(180 + temp * 75);
    const b = Math.round(100 + temp * 155);
    return `rgb(${r}, ${g}, ${b})`;
  }, [localColorTemp, color, supportsRGB]);

  // Handle toggle
  const handleToggle = useCallback(() => {
    triggerHaptic(isOn ? 'tap' : 'success');
    onToggle(!isOn);
  }, [isOn, onToggle, triggerHaptic]);

  // Handle brightness change
  const handleBrightnessChange = useCallback((value: number) => {
    setLocalBrightness(value);
    if (!isDragging) {
      onBrightnessChange(value);
    }
  }, [isDragging, onBrightnessChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    triggerHaptic('success');
    onBrightnessChange(localBrightness);
  }, [localBrightness, onBrightnessChange, triggerHaptic]);

  // Circular slider handler
  const handleCircularDrag = useCallback((event: React.PointerEvent | PointerEvent) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let degrees = (angle * 180) / Math.PI + 90;
    if (degrees < 0) degrees += 360;

    // Map 0-270 degrees to 0-100%
    let value = Math.max(0, Math.min(100, (degrees / 270) * 100));
    if (degrees > 270) value = degrees > 315 ? 0 : 100;

    // Snap to values
    const snapPoints = [0, 25, 50, 75, 100];
    const snapped = snapPoints.find(p => Math.abs(value - p) < 3);
    if (snapped !== undefined && Math.abs(localBrightness - snapped) > 3) {
      triggerHaptic('impact');
    }

    setLocalBrightness(Math.round(value));
  }, [localBrightness, triggerHaptic]);

  if (compact) {
    return (
      <CompactLightControl
        name={name}
        isOn={isOn}
        brightness={localBrightness}
        color={getLightColor()}
        onToggle={handleToggle}
        onBrightnessChange={handleBrightnessChange}
      />
    );
  }

  return (
    <div className={`light-control ${isOn ? 'is-on' : 'is-off'}`}>
      {/* Header */}
      <div className="light-header">
        <div className="light-info">
          <h3 className="light-name">{name}</h3>
          {room && <span className="light-room">{room}</span>}
        </div>
        <motion.button
          className={`power-toggle ${isOn ? 'on' : 'off'}`}
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          animate={{
            backgroundColor: isOn ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <motion.div
            className="power-icon"
            animate={{
              color: isOn ? '#00d4aa' : '#666',
              filter: isOn ? 'drop-shadow(0 0 10px #00d4aa)' : 'none',
            }}
          >
            ⏻
          </motion.div>
        </motion.button>
      </div>

      {/* Main Control - Circular Dimmer */}
      <div className="light-main-control">
        <div
          ref={sliderRef}
          className="circular-dimmer"
          onPointerDown={(e) => {
            setIsDragging(true);
            triggerHaptic('selection');
            handleCircularDrag(e);
          }}
          onPointerMove={(e) => isDragging && handleCircularDrag(e)}
          onPointerUp={handleDragEnd}
          onPointerLeave={() => isDragging && handleDragEnd()}
        >
          {/* Background ring */}
          <svg className="dimmer-ring" viewBox="0 0 200 200">
            <defs>
              <linearGradient id={`lightGradient-${deviceId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={getLightColor()} stopOpacity="0.3" />
                <stop offset="100%" stopColor={getLightColor()} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Background track */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="400"
              strokeDashoffset="133"
              transform="rotate(135 100 100)"
            />

            {/* Active fill */}
            <motion.circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke={isOn ? `url(#lightGradient-${deviceId})` : 'rgba(255,255,255,0.2)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="400"
              strokeDashoffset={133 + (267 * (100 - localBrightness)) / 100}
              transform="rotate(135 100 100)"
              animate={{
                strokeDashoffset: 133 + (267 * (100 - (isOn ? localBrightness : 0))) / 100,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />

            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = 135 + (tick * 270) / 100;
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + 72 * Math.cos(rad);
              const y1 = 100 + 72 * Math.sin(rad);
              const x2 = 100 + 78 * Math.cos(rad);
              const y2 = 100 + 78 * Math.sin(rad);

              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={localBrightness >= tick ? getLightColor() : 'rgba(255,255,255,0.3)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Center display */}
          <div className="dimmer-center">
            <motion.div
              className="light-bulb-icon"
              animate={{
                opacity: isOn ? 1 : 0.3,
                filter: isOn ? `drop-shadow(0 0 ${localBrightness / 5}px ${getLightColor()})` : 'none',
              }}
              style={{ color: isOn ? getLightColor() : '#444' }}
            >
              💡
            </motion.div>
            <div className="brightness-value">
              <span className="value">{isOn ? localBrightness : 0}</span>
              <span className="unit">%</span>
            </div>
            <div className="brightness-label">
              {!isOn ? 'Kapalı' : localBrightness === 0 ? 'Minimum' : localBrightness === 100 ? 'Maksimum' : 'Parlaklık'}
            </div>
          </div>

          {/* Drag handle */}
          {isOn && (
            <motion.div
              className="dimmer-handle"
              style={{
                transform: `rotate(${135 + (localBrightness * 270) / 100}deg)`,
              }}
            >
              <div className="handle-dot" style={{ backgroundColor: getLightColor() }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs for additional controls */}
      {(supportsColorTemp || supportsRGB) && isOn && (
        <div className="light-tabs">
          <button
            className={`tab ${activeTab === 'brightness' ? 'active' : ''}`}
            onClick={() => setActiveTab('brightness')}
          >
            Parlaklık
          </button>
          {supportsColorTemp && (
            <button
              className={`tab ${activeTab === 'temperature' ? 'active' : ''}`}
              onClick={() => setActiveTab('temperature')}
            >
              Sıcaklık
            </button>
          )}
          {supportsRGB && (
            <button
              className={`tab ${activeTab === 'color' ? 'active' : ''}`}
              onClick={() => setActiveTab('color')}
            >
              Renk
            </button>
          )}
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {isOn && activeTab === 'temperature' && supportsColorTemp && (
          <motion.div
            key="temp"
            className="color-temp-control"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ColorTemperatureSlider
              value={localColorTemp}
              onChange={(value) => {
                setLocalColorTemp(value);
                triggerHaptic('selection');
              }}
              onChangeEnd={(value) => {
                onColorTempChange?.(value);
                triggerHaptic('success');
              }}
            />
          </motion.div>
        )}

        {isOn && activeTab === 'color' && supportsRGB && (
          <motion.div
            key="color"
            className="color-picker-control"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ColorPicker
              color={localColor}
              onChange={(newColor) => {
                setLocalColor(newColor);
                triggerHaptic('selection');
              }}
              onChangeEnd={(newColor) => {
                onColorChange?.(newColor);
                triggerHaptic('success');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick brightness presets */}
      {isOn && activeTab === 'brightness' && (
        <div className="brightness-presets">
          {[
            { value: 10, label: 'Gece', icon: '🌙' },
            { value: 25, label: 'Loş', icon: '🕯️' },
            { value: 50, label: 'Orta', icon: '💡' },
            { value: 75, label: 'Parlak', icon: '☀️' },
            { value: 100, label: 'Maksimum', icon: '✨' },
          ].map((preset) => (
            <motion.button
              key={preset.value}
              className={`preset-btn ${Math.abs(localBrightness - preset.value) < 5 ? 'active' : ''}`}
              onClick={() => {
                handleBrightnessChange(preset.value);
                onBrightnessChange(preset.value);
                triggerHaptic('selection');
              }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-label">{preset.label}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Color Temperature Slider
// ============================================================================

const ColorTemperatureSlider: React.FC<{
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: (value: number) => void;
}> = ({ value, onChange, onChangeEnd }) => {
  const percentage = ((value - 2700) / (6500 - 2700)) * 100;

  return (
    <div className="temp-slider">
      <div className="temp-labels">
        <span>🔥 Sıcak</span>
        <span className="temp-value">{value}K</span>
        <span>❄️ Soğuk</span>
      </div>
      <div className="temp-track">
        <input
          type="range"
          min="2700"
          max="6500"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={(e) => onChangeEnd(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onChangeEnd(Number((e.target as HTMLInputElement).value))}
        />
        <div className="temp-gradient" />
        <div className="temp-indicator" style={{ left: `${percentage}%` }} />
      </div>
      <div className="temp-presets">
        {[
          { value: 2700, label: 'Mum' },
          { value: 3000, label: 'Sıcak' },
          { value: 4000, label: 'Nötr' },
          { value: 5000, label: 'Gün Işığı' },
          { value: 6500, label: 'Soğuk' },
        ].map((preset) => (
          <button
            key={preset.value}
            onClick={() => {
              onChange(preset.value);
              onChangeEnd(preset.value);
            }}
            className={Math.abs(value - preset.value) < 200 ? 'active' : ''}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Color Picker
// ============================================================================

const ColorPicker: React.FC<{
  color: { r: number; g: number; b: number };
  onChange: (color: { r: number; g: number; b: number }) => void;
  onChangeEnd: (color: { r: number; g: number; b: number }) => void;
}> = ({ color, onChange, onChangeEnd }) => {
  const presetColors = [
    { r: 255, g: 0, b: 0, name: 'Kırmızı' },
    { r: 255, g: 128, b: 0, name: 'Turuncu' },
    { r: 255, g: 255, b: 0, name: 'Sarı' },
    { r: 0, g: 255, b: 0, name: 'Yeşil' },
    { r: 0, g: 255, b: 255, name: 'Cyan' },
    { r: 0, g: 0, b: 255, name: 'Mavi' },
    { r: 128, g: 0, b: 255, name: 'Mor' },
    { r: 255, g: 0, b: 255, name: 'Magenta' },
    { r: 255, g: 255, b: 255, name: 'Beyaz' },
  ];

  return (
    <div className="color-picker">
      <div className="color-preview">
        <div
          className="preview-swatch"
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
        />
        <span className="color-hex">
          #{color.r.toString(16).padStart(2, '0')}
          {color.g.toString(16).padStart(2, '0')}
          {color.b.toString(16).padStart(2, '0')}
        </span>
      </div>

      <div className="color-presets">
        {presetColors.map((preset, index) => (
          <motion.button
            key={index}
            className="color-preset"
            style={{ backgroundColor: `rgb(${preset.r}, ${preset.g}, ${preset.b})` }}
            onClick={() => {
              onChange(preset);
              onChangeEnd(preset);
            }}
            whileTap={{ scale: 0.85 }}
            title={preset.name}
          />
        ))}
      </div>

      <div className="color-sliders">
        {['r', 'g', 'b'].map((channel) => (
          <div key={channel} className={`color-slider ${channel}-slider`}>
            <span className="slider-label">{channel.toUpperCase()}</span>
            <input
              type="range"
              min="0"
              max="255"
              value={color[channel as keyof typeof color]}
              onChange={(e) => {
                onChange({ ...color, [channel]: Number(e.target.value) });
              }}
              onMouseUp={() => onChangeEnd(color)}
              onTouchEnd={() => onChangeEnd(color)}
            />
            <span className="slider-value">{color[channel as keyof typeof color]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Compact Version
// ============================================================================

const CompactLightControl: React.FC<{
  name: string;
  isOn: boolean;
  brightness: number;
  color: string;
  onToggle: () => void;
  onBrightnessChange: (value: number) => void;
}> = ({ name, isOn, brightness, color, onToggle, onBrightnessChange }) => {
  return (
    <motion.div
      className={`light-control-compact ${isOn ? 'is-on' : 'is-off'}`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="compact-toggle" onClick={onToggle}>
        <motion.div
          className="compact-bulb"
          animate={{
            backgroundColor: isOn ? color : '#333',
            boxShadow: isOn ? `0 0 20px ${color}` : 'none',
          }}
        >
          💡
        </motion.div>
      </div>
      <div className="compact-info">
        <span className="compact-name">{name}</span>
        <span className="compact-status">{isOn ? `${brightness}%` : 'Kapalı'}</span>
      </div>
      {isOn && (
        <input
          type="range"
          min="1"
          max="100"
          value={brightness}
          onChange={(e) => onBrightnessChange(Number(e.target.value))}
          className="compact-slider"
        />
      )}
    </motion.div>
  );
};

export default LightControl;
