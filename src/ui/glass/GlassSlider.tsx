/**
 * GlassSlider Component
 *
 * Premium slider with glass aesthetics, glow effects,
 * and smooth drag interactions.
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';

export interface GlassSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  variant?: 'default' | 'teal' | 'gold' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const trackSizes = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

const thumbSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const variantColors = {
  default: {
    track: 'rgba(255, 255, 255, 0.3)',
    fill: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
  teal: {
    track: 'rgba(0, 212, 170, 0.2)',
    fill: '#00d4aa',
    glow: 'rgba(0, 212, 170, 0.5)',
  },
  gold: {
    track: 'rgba(201, 169, 98, 0.2)',
    fill: '#c9a962',
    glow: 'rgba(201, 169, 98, 0.5)',
  },
  gradient: {
    track: 'rgba(255, 255, 255, 0.1)',
    fill: 'linear-gradient(90deg, #00d4aa 0%, #0066ff 100%)',
    glow: 'rgba(0, 212, 170, 0.4)',
  },
};

export const GlassSlider: React.FC<GlassSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => `${Math.round(v)}`,
  variant = 'teal',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const colors = variantColors[variant];
  const percentage = ((value - min) / (max - min)) * 100;

  const x = useMotionValue(0);

  const calculateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percent * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, value]
  );

  const handleTrackClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const newValue = calculateValue(e.clientX);
    onChange(newValue);
  };

  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDrag = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const thumbX = rect.left + (percentage / 100) * rect.width + info.offset.x;
    const newValue = calculateValue(thumbX);
    onChange(newValue);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-3">
          {label && <span className="text-sm font-medium text-white/70">{label}</span>}
          {showValue && (
            <motion.span
              className="text-sm font-semibold"
              style={{
                color: variant === 'teal' ? '#00d4aa' : variant === 'gold' ? '#c9a962' : 'white',
              }}
              animate={{ scale: isDragging ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {formatValue(value)}
            </motion.span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className={`relative ${trackSizes[size]} rounded-full cursor-pointer`}
        style={{
          background: colors.track,
          opacity: disabled ? 0.5 : 1,
        }}
        onClick={handleTrackClick}
      >
        {/* Fill */}
        <motion.div
          className={`absolute left-0 top-0 ${trackSizes[size]} rounded-full`}
          style={{
            width: `${percentage}%`,
            background: colors.fill,
            boxShadow: isDragging ? `0 0 20px ${colors.glow}` : `0 0 10px ${colors.glow}`,
          }}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Thumb */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            ${thumbSizes[size]}
            rounded-full
            cursor-grab active:cursor-grabbing
          `}
          style={{
            left: `${percentage}%`,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
            boxShadow: `
              0 2px 8px rgba(0, 0, 0, 0.3),
              0 0 ${isDragging ? '20px' : '10px'} ${colors.glow},
              inset 0 1px 2px rgba(255, 255, 255, 0.3)
            `,
            x,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileHover={!disabled ? { scale: 1.15 } : undefined}
          whileTap={!disabled ? { scale: 0.95 } : undefined}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      </div>
    </div>
  );
};

// Toggle variant for on/off states
export interface GlassToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const toggleTrackSizes = {
  sm: 'w-10 h-5',
  md: 'w-12 h-6',
  lg: 'w-14 h-7',
};

const toggleThumbSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const GlassToggle: React.FC<GlassToggleProps> = ({
  enabled,
  onChange,
  label,
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-white/70">{label}</span>
      )}

      <motion.button
        className={`
          relative ${toggleTrackSizes[size]}
          rounded-full
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        style={{
          background: enabled
            ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.4) 0%, rgba(0, 212, 170, 0.2) 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          border: enabled
            ? '1px solid rgba(0, 212, 170, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: enabled
            ? '0 0 20px rgba(0, 212, 170, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            : 'inset 0 1px 1px rgba(0, 0, 0, 0.2)',
        }}
        onClick={handleClick}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        <motion.div
          className={`
            absolute top-0.5
            ${toggleThumbSizes[size]}
            rounded-full
          `}
          style={{
            background: enabled
              ? '#00d4aa'
              : 'rgba(255, 255, 255, 0.6)',
            boxShadow: enabled
              ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 212, 170, 0.5)'
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
          initial={false}
          animate={{
            x: enabled ? (size === 'sm' ? 20 : size === 'md' ? 24 : 28) : 2,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
};

export default GlassSlider;
