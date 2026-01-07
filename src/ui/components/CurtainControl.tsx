/**
 * AICO Smart Home - Curtain/Blind Control Component
 *
 * Gesture-based curtain control with drag interaction.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

interface CurtainControlProps {
  deviceId: DeviceId;
  name: string;
  room?: string;
  position: number; // 0-100, 0 = fully closed, 100 = fully open
  tilt?: number; // 0-100 for blinds
  isMoving?: boolean;
  hasTilt?: boolean;
  type?: 'curtain' | 'blind' | 'roller' | 'shutter';
  onPositionChange: (position: number) => void;
  onTiltChange?: (tilt: number) => void;
  onStop?: () => void;
  compact?: boolean;
}

// ============================================================================
// Curtain Control Component
// ============================================================================

export const CurtainControl: React.FC<CurtainControlProps> = ({
  deviceId,
  name,
  room,
  position,
  tilt = 50,
  isMoving = false,
  hasTilt = false,
  type = 'curtain',
  onPositionChange,
  onTiltChange,
  onStop,
  compact = false,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState(position);
  const [showTilt, setShowTilt] = useState(false);

  // Motion values for smooth animations
  const dragY = useMotionValue(0);
  const containerHeight = useRef(0);

  // Spring animation for position indicator
  const springPosition = useSpring(position, {
    stiffness: 300,
    damping: 30,
  });

  // Update local position when prop changes
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition(position);
      springPosition.set(position);
    }
  }, [position, isDragging, springPosition]);

  // Calculate container height on mount
  useEffect(() => {
    if (containerRef.current) {
      containerHeight.current = containerRef.current.getBoundingClientRect().height;
    }
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    triggerHaptic('selection');
  }, [triggerHaptic]);

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!containerRef.current) return;

    const height = containerRef.current.getBoundingClientRect().height - 80; // Subtract handle size
    const deltaPercent = (info.delta.y / height) * 100;
    const newPosition = Math.max(0, Math.min(100, localPosition - deltaPercent));

    setLocalPosition(newPosition);
    springPosition.set(newPosition);

    // Haptic at 0, 25, 50, 75, 100
    const snapPoints = [0, 25, 50, 75, 100];
    const prevSnap = snapPoints.find(p => Math.abs(localPosition - p) < 2);
    const newSnap = snapPoints.find(p => Math.abs(newPosition - p) < 2);
    if (newSnap !== undefined && newSnap !== prevSnap) {
      triggerHaptic('impact');
    }
  }, [localPosition, springPosition, triggerHaptic]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    triggerHaptic('success');
    onPositionChange(Math.round(localPosition));
  }, [localPosition, onPositionChange, triggerHaptic]);

  // Quick position buttons
  const quickPositions = [
    { label: 'Açık', value: 100, icon: '☀️' },
    { label: '%75', value: 75, icon: '🌤️' },
    { label: '%50', value: 50, icon: '⛅' },
    { label: '%25', value: 25, icon: '🌥️' },
    { label: 'Kapalı', value: 0, icon: '🌙' },
  ];

  const handleQuickPosition = (value: number) => {
    triggerHaptic('selection');
    setLocalPosition(value);
    springPosition.set(value);
    onPositionChange(value);
  };

  // Get curtain visual based on type
  const getCurtainVisual = () => {
    const openPercent = localPosition;

    switch (type) {
      case 'blind':
        return <BlindVisual openPercent={openPercent} tilt={tilt} />;
      case 'roller':
        return <RollerVisual openPercent={openPercent} />;
      case 'shutter':
        return <ShutterVisual openPercent={openPercent} />;
      default:
        return <CurtainVisual openPercent={openPercent} />;
    }
  };

  if (compact) {
    return (
      <CompactCurtainControl
        name={name}
        position={localPosition}
        isMoving={isMoving}
        onPositionChange={handleQuickPosition}
      />
    );
  }

  return (
    <div className="curtain-control" ref={containerRef}>
      {/* Header */}
      <div className="curtain-header">
        <div className="curtain-info">
          <h3 className="curtain-name">{name}</h3>
          {room && <span className="curtain-room">{room}</span>}
        </div>
        <div className="curtain-status">
          {isMoving ? (
            <motion.div
              className="moving-indicator"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Hareket Ediyor...
            </motion.div>
          ) : (
            <span className="position-text">%{Math.round(localPosition)}</span>
          )}
        </div>
      </div>

      {/* Main Control Area */}
      <div className="curtain-control-area">
        {/* Visual Preview */}
        <div className="curtain-preview">
          <div className="window-frame">
            <div className="window-glass">
              <div className="window-view" />
            </div>
            {getCurtainVisual()}
          </div>
        </div>

        {/* Drag Slider */}
        <div className="curtain-slider">
          <div className="slider-track">
            {/* Track markers */}
            <div className="track-markers">
              {[0, 25, 50, 75, 100].map((mark) => (
                <div
                  key={mark}
                  className={`track-marker ${localPosition >= mark ? 'active' : ''}`}
                  style={{ bottom: `${mark}%` }}
                >
                  <span className="marker-label">{mark}%</span>
                </div>
              ))}
            </div>

            {/* Fill */}
            <motion.div
              className="slider-fill"
              style={{ height: `${localPosition}%` }}
            />

            {/* Draggable Handle */}
            <motion.div
              className="slider-handle"
              style={{ bottom: `calc(${localPosition}% - 30px)` }}
              drag="y"
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="handle-grip">
                <span className="grip-line" />
                <span className="grip-line" />
                <span className="grip-line" />
              </div>
              <div className="handle-value">%{Math.round(localPosition)}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Quick Position Buttons */}
      <div className="quick-positions">
        {quickPositions.map((pos) => (
          <motion.button
            key={pos.value}
            className={`quick-btn ${Math.abs(localPosition - pos.value) < 3 ? 'active' : ''}`}
            onClick={() => handleQuickPosition(pos.value)}
            whileTap={{ scale: 0.9 }}
          >
            <span className="quick-icon">{pos.icon}</span>
            <span className="quick-label">{pos.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Tilt Control for Blinds */}
      {hasTilt && (
        <div className="tilt-control">
          <button
            className="tilt-toggle"
            onClick={() => setShowTilt(!showTilt)}
          >
            <span>Kanat Açısı</span>
            <motion.span
              animate={{ rotate: showTilt ? 180 : 0 }}
            >
              ▼
            </motion.span>
          </button>

          {showTilt && (
            <motion.div
              className="tilt-slider-container"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <TiltControl
                tilt={tilt}
                onChange={(newTilt) => {
                  triggerHaptic('selection');
                  onTiltChange?.(newTilt);
                }}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Stop Button */}
      {isMoving && onStop && (
        <motion.button
          className="stop-btn"
          onClick={() => {
            triggerHaptic('error');
            onStop();
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="stop-icon">⏹</span>
          <span>Durdur</span>
        </motion.button>
      )}
    </div>
  );
};

// ============================================================================
// Visual Components
// ============================================================================

const CurtainVisual: React.FC<{ openPercent: number }> = ({ openPercent }) => {
  const leftWidth = (100 - openPercent) / 2;
  const rightWidth = (100 - openPercent) / 2;

  return (
    <div className="curtain-visual">
      <motion.div
        className="curtain-panel left"
        animate={{ width: `${leftWidth}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="curtain-folds">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="fold" />
          ))}
        </div>
      </motion.div>
      <motion.div
        className="curtain-panel right"
        animate={{ width: `${rightWidth}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className="curtain-folds">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="fold" />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const BlindVisual: React.FC<{ openPercent: number; tilt: number }> = ({ openPercent, tilt }) => {
  const closedHeight = 100 - openPercent;
  const slatAngle = ((tilt - 50) / 50) * 45; // -45 to +45 degrees

  return (
    <div className="blind-visual">
      <motion.div
        className="blind-slats"
        animate={{ height: `${closedHeight}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="slat"
            animate={{ rotateX: slatAngle }}
            style={{ transformOrigin: 'center' }}
          />
        ))}
      </motion.div>
    </div>
  );
};

const RollerVisual: React.FC<{ openPercent: number }> = ({ openPercent }) => {
  const closedHeight = 100 - openPercent;

  return (
    <div className="roller-visual">
      <div className="roller-tube" />
      <motion.div
        className="roller-fabric"
        animate={{ height: `${closedHeight}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      />
    </div>
  );
};

const ShutterVisual: React.FC<{ openPercent: number }> = ({ openPercent }) => {
  const closedHeight = 100 - openPercent;

  return (
    <div className="shutter-visual">
      <motion.div
        className="shutter-panels"
        animate={{ height: `${closedHeight}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="shutter-slat" />
        ))}
      </motion.div>
    </div>
  );
};

// ============================================================================
// Tilt Control
// ============================================================================

const TiltControl: React.FC<{
  tilt: number;
  onChange: (tilt: number) => void;
}> = ({ tilt, onChange }) => {
  return (
    <div className="tilt-control-inner">
      <div className="tilt-visual">
        <motion.div
          className="tilt-slat-preview"
          animate={{ rotateX: ((tilt - 50) / 50) * 45 }}
        />
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={tilt}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tilt-slider"
      />
      <div className="tilt-labels">
        <span>Kapalı</span>
        <span>Düz</span>
        <span>Açık</span>
      </div>
    </div>
  );
};

// ============================================================================
// Compact Version
// ============================================================================

const CompactCurtainControl: React.FC<{
  name: string;
  position: number;
  isMoving: boolean;
  onPositionChange: (position: number) => void;
}> = ({ name, position, isMoving, onPositionChange }) => {
  return (
    <div className="curtain-control-compact">
      <div className="compact-header">
        <span className="compact-icon">🪟</span>
        <span className="compact-name">{name}</span>
        <span className="compact-value">%{Math.round(position)}</span>
      </div>
      <div className="compact-slider">
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => onPositionChange(Number(e.target.value))}
          disabled={isMoving}
        />
        <div
          className="compact-fill"
          style={{ width: `${position}%` }}
        />
      </div>
      <div className="compact-presets">
        <button onClick={() => onPositionChange(0)}>Kapat</button>
        <button onClick={() => onPositionChange(50)}>%50</button>
        <button onClick={() => onPositionChange(100)}>Aç</button>
      </div>
    </div>
  );
};

export default CurtainControl;
