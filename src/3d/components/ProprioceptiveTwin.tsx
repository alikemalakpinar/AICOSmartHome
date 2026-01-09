/**
 * AICO - Proprioceptive Digital Twin
 *
 * "The 3D model isn't for you to look at; it's for you to feel."
 *
 * This visualization shows the house as a living organism:
 * - Energy flowing like blood through arteries
 * - Air circulation like breath through lungs
 * - Human presence like nerve impulses
 * - Predictive ghosting of where you'll go next
 *
 * There are no buttons. No controls. Just life.
 */

import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Line,
  Float,
  Sphere,
  Trail,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useSceneStore } from '../scene-manager';
import type { FlowVisualization, FlowPath, HouseVitals } from '../../core/philosophy';

// ============================================================================
// Color Palette - Organic, Living
// ============================================================================

const COLORS = {
  // Background - deep, organic
  background: '#0a0a12',

  // Flow colors by type
  energy: '#ff6b35',       // Warm arterial orange
  air: '#4ecdc4',          // Cool cyan breath
  data: '#a78bfa',         // Electric violet
  presence: '#ffd93d',     // Warm human gold
  prediction: '#3b82f6',   // Blue future ghost

  // Emotional gradients
  harmony: '#10b981',      // Green harmony
  tension: '#ef4444',      // Red tension
  neutral: '#6b7280',      // Gray neutral

  // Structure
  structure: '#1e293b',    // Dim structural lines
  structureGlow: '#334155',

  // Vitals
  heartbeat: '#ef4444',
  breath: '#4ecdc4',
};

// ============================================================================
// Main Component
// ============================================================================

interface ProprioceptiveTwinProps {
  className?: string;
  vitals: HouseVitals;
  flows: FlowVisualization;
  onPresenceClick?: (occupantId: string) => void;
}

export const ProprioceptiveTwin: React.FC<ProprioceptiveTwinProps> = ({
  className,
  vitals,
  flows,
  onPresenceClick,
}) => {
  return (
    <div
      className={`proprioceptive-twin ${className ?? ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        style={{ background: COLORS.background }}
      >
        <color attach="background" args={[COLORS.background]} />

        <Suspense fallback={<LoadingPulse />}>
          <NervousSystemScene
            vitals={vitals}
            flows={flows}
            onPresenceClick={onPresenceClick}
          />
        </Suspense>

        <OrganicPostProcessing vitals={vitals} />
      </Canvas>

      {/* Vital Signs Overlay */}
      <VitalsOverlay vitals={vitals} />
    </div>
  );
};

// ============================================================================
// Nervous System Scene
// ============================================================================

interface NervousSystemSceneProps {
  vitals: HouseVitals;
  flows: FlowVisualization;
  onPresenceClick?: (occupantId: string) => void;
}

const NervousSystemScene: React.FC<NervousSystemSceneProps> = ({
  vitals,
  flows,
  onPresenceClick,
}) => {
  return (
    <>
      {/* Camera */}
      <OrganicCamera vitals={vitals} />

      {/* Ambient - very subtle, breathing */}
      <BreathingAmbient vitals={vitals} />

      {/* House Structure - ghostly outline */}
      <GhostStructure />

      {/* Energy Flow - arterial system */}
      <FlowSystem
        paths={flows.energyFlow}
        baseColor={COLORS.energy}
        pulseSpeed={vitals.heartbeat / 60}
        particleCount={50}
      />

      {/* Air Flow - respiratory system */}
      <FlowSystem
        paths={flows.airFlow}
        baseColor={COLORS.air}
        pulseSpeed={vitals.breath / 20}
        particleCount={30}
      />

      {/* Data Flow - nervous system */}
      <FlowSystem
        paths={flows.dataFlow}
        baseColor={COLORS.data}
        pulseSpeed={2}
        particleCount={40}
      />

      {/* Presence Flow - embodied consciousness */}
      <PresenceVisualization
        occupants={vitals.occupantFields}
        onClick={onPresenceClick}
      />

      {/* Predictive Ghosting */}
      <PredictiveGhosts predictions={flows.predictiveGhosts} />

      {/* Emotional Field */}
      <EmotionalField vitals={vitals} />
    </>
  );
};

// ============================================================================
// Organic Camera
// ============================================================================

const OrganicCamera: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  const controlsRef = useRef<any>(null);

  // Camera breathes with the house
  useFrame(({ clock, camera }) => {
    const breathCycle = Math.sin(clock.elapsedTime * (vitals.breath / 60) * Math.PI * 2);

    // Subtle breathing movement
    camera.position.y += breathCycle * 0.005;

    // Harmony affects field of view feeling
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50 + vitals.harmony * 5;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[15, 12, 15]}
        fov={50}
        near={0.1}
        far={200}
      />
      <OrbitControls
        ref={controlsRef}
        target={[0, 2, 0]}
        minDistance={8}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.3}
        enablePan={false}
      />
    </>
  );
};

// ============================================================================
// Breathing Ambient Light
// ============================================================================

const BreathingAmbient: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  const lightRef = useRef<THREE.AmbientLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;

    const breathCycle = Math.sin(clock.elapsedTime * (vitals.breath / 60) * Math.PI * 2);

    // Light intensity follows breath
    lightRef.current.intensity = 0.15 + breathCycle * 0.05;

    // Color shifts with emotional state
    const harmonyColor = new THREE.Color(
      vitals.harmony > 0 ? COLORS.harmony : COLORS.tension
    );
    const neutralColor = new THREE.Color(COLORS.neutral);

    lightRef.current.color.lerpColors(
      neutralColor,
      harmonyColor,
      Math.abs(vitals.harmony) * 0.3
    );
  });

  return <ambientLight ref={lightRef} intensity={0.15} />;
};

// ============================================================================
// Ghost Structure - The House's Skeleton
// ============================================================================

const GhostStructure: React.FC = () => {
  const structureRef = useRef<THREE.Group>(null);

  // Structure pulses subtly
  useFrame(({ clock }) => {
    if (!structureRef.current) return;

    structureRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const material = child.material as THREE.LineBasicMaterial;
        const pulse = Math.sin(clock.elapsedTime * 0.5 + i * 0.1) * 0.5 + 0.5;
        material.opacity = 0.1 + pulse * 0.1;
      }
    });
  });

  // Simplified house outline
  const houseLines = useMemo(() => {
    const lines: Array<[number, number, number][]> = [
      // Ground floor outline
      [[-6, 0, -4], [6, 0, -4], [6, 0, 4], [-6, 0, 4], [-6, 0, -4]],
      // First floor outline
      [[-5, 3, -3], [5, 3, -3], [5, 3, 3], [-5, 3, 3], [-5, 3, -3]],
      // Vertical connections
      [[-6, 0, -4], [-5, 3, -3]],
      [[6, 0, -4], [5, 3, -3]],
      [[6, 0, 4], [5, 3, 3]],
      [[-6, 0, 4], [-5, 3, 3]],
      // Roof ridge
      [[0, 6, -3], [0, 6, 3]],
      [[-5, 3, -3], [0, 6, -3], [5, 3, -3]],
      [[-5, 3, 3], [0, 6, 3], [5, 3, 3]],
    ];
    return lines;
  }, []);

  return (
    <group ref={structureRef}>
      {houseLines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={COLORS.structure}
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
};

// ============================================================================
// Flow System - Animated Particles Along Paths
// ============================================================================

interface FlowSystemProps {
  paths: FlowPath[];
  baseColor: string;
  pulseSpeed: number;
  particleCount: number;
}

const FlowSystem: React.FC<FlowSystemProps> = ({
  paths,
  baseColor,
  pulseSpeed,
  particleCount,
}) => {
  return (
    <group>
      {paths.map((path, i) => (
        <FlowPathVisualization
          key={path.id || i}
          path={path}
          baseColor={baseColor}
          pulseSpeed={pulseSpeed}
          particleCount={Math.round(particleCount / paths.length)}
        />
      ))}
    </group>
  );
};

interface FlowPathVisualizationProps {
  path: FlowPath;
  baseColor: string;
  pulseSpeed: number;
  particleCount: number;
}

const FlowPathVisualization: React.FC<FlowPathVisualizationProps> = ({
  path,
  baseColor,
  pulseSpeed,
  particleCount,
}) => {
  const particlesRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => {
    const points = path.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(points);
  }, [path.points]);

  // Animate particles along path
  useFrame(({ clock }) => {
    if (!particlesRef.current) return;

    particlesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const offset = i / particleCount;
        const t = ((clock.elapsedTime * pulseSpeed * path.velocity + offset) % 1);

        const point = curve.getPoint(t);
        child.position.copy(point);

        // Particle size pulses
        const pulse = Math.sin(clock.elapsedTime * 4 + i) * 0.5 + 0.5;
        child.scale.setScalar(0.03 + pulse * 0.02);

        // Opacity based on volume
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = path.opacity * (0.5 + pulse * 0.5);
      }
    });
  });

  return (
    <group ref={particlesRef}>
      {/* Path line */}
      <Line
        points={path.points.map(p => [p.x, p.y, p.z] as [number, number, number])}
        color={path.color || baseColor}
        lineWidth={1}
        transparent
        opacity={path.opacity * 0.3}
      />

      {/* Flowing particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            color={path.color || baseColor}
            transparent
            opacity={path.opacity}
          />
        </mesh>
      ))}
    </group>
  );
};

// ============================================================================
// Presence Visualization - Human Souls in Space
// ============================================================================

interface PresenceVisualizationProps {
  occupants: HouseVitals['occupantFields'];
  onClick?: (occupantId: string) => void;
}

const PresenceVisualization: React.FC<PresenceVisualizationProps> = ({
  occupants,
  onClick,
}) => {
  return (
    <group>
      {occupants.map((occupant, i) => (
        <OccupantPresence
          key={i}
          position={[occupant.location.x, occupant.location.y, occupant.location.z]}
          emotionalColor={occupant.emotionalColor}
          activityType={occupant.activityType}
          needsAttention={occupant.needsAttention}
        />
      ))}
    </group>
  );
};

interface OccupantPresenceProps {
  position: [number, number, number];
  emotionalColor: string;
  activityType: 'rest' | 'focus' | 'social' | 'transit' | 'absent';
  needsAttention: boolean;
}

const OccupantPresence: React.FC<OccupantPresenceProps> = ({
  position,
  emotionalColor,
  activityType,
  needsAttention,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Activity affects animation
  const pulseSpeed = activityType === 'rest' ? 0.5 :
    activityType === 'focus' ? 1 :
    activityType === 'social' ? 2 :
    activityType === 'transit' ? 3 : 0;

  useFrame(({ clock }) => {
    if (!groupRef.current || !glowRef.current) return;

    // Core presence pulses
    const pulse = Math.sin(clock.elapsedTime * pulseSpeed) * 0.5 + 0.5;

    // Glow expands and contracts
    glowRef.current.scale.setScalar(1 + pulse * 0.3);
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + pulse * 0.2;

    // Needs attention - faster pulse
    if (needsAttention) {
      const urgentPulse = Math.sin(clock.elapsedTime * 5) * 0.5 + 0.5;
      glowRef.current.scale.setScalar(1 + urgentPulse * 0.5);
    }
  });

  return (
    <Float speed={2} floatIntensity={0.2}>
      <group ref={groupRef} position={position}>
        {/* Core presence */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={emotionalColor} />
        </mesh>

        {/* Emotional glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial
            color={emotionalColor}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Activity indicator ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial
            color={emotionalColor}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    </Float>
  );
};

// ============================================================================
// Predictive Ghosts - Where You'll Go Next
// ============================================================================

interface PredictiveGhostsProps {
  predictions: FlowVisualization['predictiveGhosts'];
}

const PredictiveGhosts: React.FC<PredictiveGhostsProps> = ({ predictions }) => {
  return (
    <group>
      {predictions.map((pred, i) => (
        <PredictiveGhost
          key={i}
          path={pred.predictedPath}
          confidence={pred.confidence}
          timeHorizon={pred.timeHorizonSeconds}
        />
      ))}
    </group>
  );
};

interface PredictiveGhostProps {
  path: Array<{ x: number; y: number; z: number }>;
  confidence: number;
  timeHorizon: number;
}

const PredictiveGhost: React.FC<PredictiveGhostProps> = ({
  path,
  confidence,
  timeHorizon,
}) => {
  const ghostRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ghostRef.current) return;

    // Ghost fades based on time horizon
    const fadeBase = confidence * (1 - timeHorizon / 60);

    ghostRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial;
        const distanceFade = 1 - i / path.length;
        const pulse = Math.sin(clock.elapsedTime * 2 - i * 0.5) * 0.3 + 0.7;
        material.opacity = fadeBase * distanceFade * pulse * 0.4;
      }
    });
  });

  return (
    <group ref={ghostRef}>
      {/* Ghost path line */}
      <Line
        points={path.map(p => [p.x, p.y, p.z] as [number, number, number])}
        color={COLORS.prediction}
        lineWidth={2}
        transparent
        opacity={confidence * 0.3}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />

      {/* Ghost points */}
      {path.map((point, i) => (
        <mesh key={i} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial
            color={COLORS.prediction}
            transparent
            opacity={confidence * 0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

// ============================================================================
// Emotional Field - The Household's Aura
// ============================================================================

const EmotionalField: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  const fieldRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!fieldRef.current) return;

    const material = fieldRef.current.material as THREE.ShaderMaterial;

    // Update uniforms
    if (material.uniforms) {
      material.uniforms.time.value = clock.elapsedTime;
      material.uniforms.harmony.value = vitals.harmony;
      material.uniforms.energy.value = vitals.energy;
    }
  });

  // Simple gradient sphere for emotional field
  const harmonyColor = vitals.harmony > 0 ? COLORS.harmony : COLORS.tension;
  const intensity = Math.abs(vitals.harmony) * 0.15;

  return (
    <mesh ref={fieldRef} position={[0, 3, 0]}>
      <sphereGeometry args={[15, 32, 32]} />
      <meshBasicMaterial
        color={harmonyColor}
        transparent
        opacity={intensity}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// ============================================================================
// Organic Post Processing
// ============================================================================

const OrganicPostProcessing: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  // Bloom intensity increases with energy
  const bloomIntensity = 0.8 + vitals.energy * 0.4;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />
      <ChromaticAberration
        offset={[0.0002, 0.0002]}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Vignette
        offset={0.3}
        darkness={0.5 - vitals.harmony * 0.1}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

// ============================================================================
// Vitals Overlay - Subtle Indicators
// ============================================================================

const VitalsOverlay: React.FC<{ vitals: HouseVitals }> = ({ vitals }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {/* Heartbeat indicator */}
      <VitalIndicator
        label="Pulse"
        value={vitals.heartbeat}
        unit="bpm"
        color={COLORS.heartbeat}
        pulseRate={vitals.heartbeat / 60}
      />

      {/* Breath indicator */}
      <VitalIndicator
        label="Breath"
        value={vitals.breath}
        unit="/min"
        color={COLORS.air}
        pulseRate={vitals.breath / 60}
      />

      {/* Harmony indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: 0.6,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: vitals.harmony > 0 ? COLORS.harmony : COLORS.tension,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'monospace',
            letterSpacing: 1,
          }}
        >
          {vitals.harmony > 0.3 ? 'HARMONY' :
           vitals.harmony < -0.3 ? 'TENSION' : 'NEUTRAL'}
        </span>
      </div>
    </div>
  );
};

interface VitalIndicatorProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  pulseRate: number;
}

const VitalIndicator: React.FC<VitalIndicatorProps> = ({
  label,
  value,
  unit,
  color,
  pulseRate,
}) => {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dotRef.current) {
        dotRef.current.style.opacity = '1';
        setTimeout(() => {
          if (dotRef.current) {
            dotRef.current.style.opacity = '0.3';
          }
        }, 100);
      }
    }, (1 / pulseRate) * 1000);

    return () => clearInterval(interval);
  }, [pulseRate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: 0.6,
      }}
    >
      <div
        ref={dotRef}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          transition: 'opacity 0.1s ease',
        }}
      />
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}
      >
        {Math.round(value)} {unit}
      </span>
    </div>
  );
};

// ============================================================================
// Loading State
// ============================================================================

const LoadingPulse: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.2;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={COLORS.harmony} transparent opacity={0.5} />
    </mesh>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default ProprioceptiveTwin;
