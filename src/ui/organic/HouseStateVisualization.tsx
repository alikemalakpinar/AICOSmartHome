/**
 * AICO - Organic House State Visualization
 *
 * "The Home Screen should not be a grid of widgets.
 *  It should be a slow-moving, artistic visualization of House State."
 *
 * This replaces the traditional dashboard with a living, breathing
 * abstract form that changes color, shape, and motion based on
 * the household's collective state.
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import type { HouseVitals, AtmosphericEnvelope } from '../../core/philosophy';

// ============================================================================
// Organic Visualization Component
// ============================================================================

interface HouseStateVisualizationProps {
  vitals: HouseVitals;
  atmosphere: Partial<AtmosphericEnvelope>;
  className?: string;
}

export const HouseStateVisualization: React.FC<HouseStateVisualizationProps> = ({
  vitals,
  atmosphere,
  className,
}) => {
  // Derived visual properties
  const visualState = useMemo(() => calculateVisualState(vitals, atmosphere), [vitals, atmosphere]);

  return (
    <div
      className={`house-state-visualization ${className ?? ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at center, ${visualState.backgroundGradient.inner} 0%, ${visualState.backgroundGradient.outer} 100%)`,
      }}
    >
      {/* Fluid Form - The "Soul" */}
      <FluidSoul vitals={vitals} visualState={visualState} />

      {/* Particle Field - Life Energy */}
      <ParticleField vitals={vitals} visualState={visualState} />

      {/* Breath Rings */}
      <BreathRings vitals={vitals} visualState={visualState} />

      {/* Presence Echoes */}
      <PresenceEchoes occupants={vitals.occupantFields} />

      {/* Narrative Indicator */}
      {vitals.narrative.arc && (
        <NarrativeIndicator narrative={vitals.narrative} />
      )}

      {/* Minimal Status */}
      <MinimalStatus vitals={vitals} />
    </div>
  );
};

// ============================================================================
// Visual State Calculator
// ============================================================================

interface VisualState {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundGradient: { inner: string; outer: string };

  // Motion
  motionIntensity: number;        // 0-1
  pulseRate: number;              // Hz
  flowSpeed: number;              // arbitrary units

  // Form
  formComplexity: number;         // 0-1, affects blob shape
  formScale: number;              // 0.5-1.5
  formOpacity: number;
}

function calculateVisualState(
  vitals: HouseVitals,
  atmosphere: Partial<AtmosphericEnvelope>
): VisualState {
  // Harmony affects color warmth
  const harmonyHue = vitals.harmony > 0 ? 160 : 0;  // Green vs Red
  const harmonySaturation = Math.abs(vitals.harmony) * 40 + 20;

  // Energy affects brightness and motion
  const energyLightness = 30 + vitals.energy * 20;
  const motionIntensity = 0.3 + vitals.energy * 0.5;

  // Presence affects opacity and scale
  const presenceScale = 0.7 + vitals.presence * 0.5;

  // Primary color from harmony
  const primaryColor = `hsl(${harmonyHue}, ${harmonySaturation}%, ${energyLightness}%)`;

  // Secondary from energy
  const secondaryHue = 200 + vitals.energy * 40;  // Blue to cyan
  const secondaryColor = `hsl(${secondaryHue}, 50%, ${energyLightness}%)`;

  // Accent from presence
  const accentHue = 40 + vitals.presence * 20;    // Gold tones
  const accentColor = `hsl(${accentHue}, 60%, 60%)`;

  // Background gradient
  const bgLightness = 5 + vitals.energy * 5;
  const backgroundGradient = {
    inner: `hsl(${harmonyHue}, 20%, ${bgLightness + 5}%)`,
    outer: `hsl(${harmonyHue}, 10%, ${bgLightness}%)`,
  };

  // Pulse rate from heartbeat
  const pulseRate = vitals.heartbeat / 60;

  // Flow speed from narrative momentum
  const flowSpeed = 1 + vitals.narrative.momentum * 0.5;

  // Form complexity from occupant count
  const formComplexity = 0.3 + vitals.occupantFields.length * 0.1;

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundGradient,
    motionIntensity,
    pulseRate,
    flowSpeed,
    formComplexity,
    formScale: presenceScale,
    formOpacity: 0.4 + vitals.presence * 0.3,
  };
}

// ============================================================================
// Fluid Soul - The Central Organic Form
// ============================================================================

interface FluidSoulProps {
  vitals: HouseVitals;
  visualState: VisualState;
}

const FluidSoul: React.FC<FluidSoulProps> = ({ vitals, visualState }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const controls = useAnimation();

  // Generate organic blob path
  const generateBlobPath = (complexity: number, scale: number, offset: number = 0): string => {
    const points = Math.floor(6 + complexity * 6);
    const angleStep = (Math.PI * 2) / points;
    const baseRadius = 200 * scale;

    let path = '';

    for (let i = 0; i <= points; i++) {
      const angle = i * angleStep + offset;
      const radiusVariation = Math.sin(angle * 3 + offset * 2) * 30 * complexity;
      const radius = baseRadius + radiusVariation;

      const x = 250 + Math.cos(angle) * radius;
      const y = 250 + Math.sin(angle) * radius;

      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        // Use quadratic curves for smoothness
        const prevAngle = (i - 0.5) * angleStep + offset;
        const cpRadius = baseRadius + Math.sin(prevAngle * 3 + offset * 2) * 30 * complexity;
        const cpX = 250 + Math.cos(prevAngle) * cpRadius;
        const cpY = 250 + Math.sin(prevAngle) * cpRadius;

        path += ` Q ${cpX} ${cpY} ${x} ${y}`;
      }
    }

    return path + ' Z';
  };

  // Animate the blob
  useEffect(() => {
    let animationFrame: number;
    let offset = 0;

    const animate = () => {
      offset += 0.002 * visualState.flowSpeed;

      if (pathRef.current) {
        pathRef.current.setAttribute(
          'd',
          generateBlobPath(visualState.formComplexity, visualState.formScale, offset)
        );
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [visualState]);

  // Pulse animation
  const pulseAnimation = {
    scale: [1, 1.02, 1],
    opacity: [visualState.formOpacity, visualState.formOpacity * 1.1, visualState.formOpacity],
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
      }}
      animate={pulseAnimation}
      transition={{
        duration: 1 / visualState.pulseRate,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 500 500" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="soulGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={visualState.primaryColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={visualState.secondaryColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={visualState.accentColor} stopOpacity="0" />
          </radialGradient>

          <filter id="soulBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          </filter>
        </defs>

        {/* Glow layer */}
        <path
          ref={pathRef}
          d={generateBlobPath(visualState.formComplexity, visualState.formScale, 0)}
          fill="url(#soulGradient)"
          filter="url(#soulBlur)"
          opacity={visualState.formOpacity}
        />

        {/* Core layer */}
        <path
          d={generateBlobPath(visualState.formComplexity, visualState.formScale * 0.6, 0)}
          fill={visualState.primaryColor}
          opacity={visualState.formOpacity * 0.5}
        />
      </svg>
    </motion.div>
  );
};

// ============================================================================
// Particle Field - Ambient Life Energy
// ============================================================================

const ParticleField: React.FC<{ vitals: HouseVitals; visualState: VisualState }> = ({
  vitals,
  visualState,
}) => {
  const particleCount = Math.floor(20 + vitals.energy * 30);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: particleCount }).map((_, i) => (
        <Particle
          key={i}
          index={i}
          total={particleCount}
          visualState={visualState}
        />
      ))}
    </div>
  );
};

const Particle: React.FC<{
  index: number;
  total: number;
  visualState: VisualState;
}> = ({ index, total, visualState }) => {
  const progress = index / total;

  // Random but deterministic position
  const startX = (Math.sin(index * 0.7) * 0.5 + 0.5) * 100;
  const startY = (Math.cos(index * 0.9) * 0.5 + 0.5) * 100;

  // Animation parameters
  const duration = 10 + (index % 5) * 2;
  const delay = -progress * duration;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${startX}%`,
        top: `${startY}%`,
        width: 4 + (index % 3) * 2,
        height: 4 + (index % 3) * 2,
        borderRadius: '50%',
        background: index % 2 === 0 ? visualState.primaryColor : visualState.secondaryColor,
        opacity: 0,
      }}
      animate={{
        x: [0, Math.sin(index) * 100, 0],
        y: [0, Math.cos(index) * 100, 0],
        opacity: [0, 0.4 * visualState.motionIntensity, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// ============================================================================
// Breath Rings - Expanding Circles Synced to Breath Rate
// ============================================================================

const BreathRings: React.FC<{ vitals: HouseVitals; visualState: VisualState }> = ({
  vitals,
  visualState,
}) => {
  const breathDuration = 60 / vitals.breath;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `1px solid ${visualState.secondaryColor}`,
            opacity: 0,
          }}
          animate={{
            scale: [1, 4, 4],
            opacity: [0.4, 0.1, 0],
          }}
          transition={{
            duration: breathDuration * 2,
            delay: i * (breathDuration / 2),
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Presence Echoes - Subtle Indicators of Occupants
// ============================================================================

const PresenceEchoes: React.FC<{ occupants: HouseVitals['occupantFields'] }> = ({
  occupants,
}) => {
  if (occupants.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 16,
        pointerEvents: 'none',
      }}
    >
      {occupants.map((occupant, i) => (
        <motion.div
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: occupant.emotionalColor,
            boxShadow: `0 0 20px ${occupant.emotionalColor}`,
          }}
          animate={{
            scale: occupant.needsAttention ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: occupant.needsAttention ? 0.5 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Narrative Indicator - Current Story Arc
// ============================================================================

const NarrativeIndicator: React.FC<{
  narrative: HouseVitals['narrative'];
}> = ({ narrative }) => {
  // Momentum affects width of indicator
  const momentumWidth = 50 + Math.abs(narrative.momentum) * 50;

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: 0.5,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 0.5, y: 0 }}
    >
      {/* Phase indicator */}
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'monospace',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {narrative.phase}
      </span>

      {/* Momentum bar */}
      <div
        style={{
          width: 100,
          height: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            background: narrative.momentum > 0
              ? 'rgba(16, 185, 129, 0.6)'
              : 'rgba(239, 68, 68, 0.6)',
            borderRadius: 1,
          }}
          animate={{ width: `${momentumWidth}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Minimal Status - Almost Hidden
// ============================================================================

const MinimalStatus: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    >
      {/* Silence indicator */}
      {!vitals.awareness.externalWorld && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#818cf8',
          }}
        />
      )}

      {/* Time awareness */}
      <span
        style={{
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}
      >
        {vitals.awareness.timeAwareness === 'suspended' ? 'TIMELESS' :
         vitals.awareness.timeAwareness === 'urgent' ? 'NOW' : ''}
      </span>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default HouseStateVisualization;
export { calculateVisualState };
export type { VisualState };
