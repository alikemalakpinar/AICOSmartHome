/**
 * EmotionalStateWidget Component
 *
 * Ambient intelligence display showing the home's
 * emotional awareness and adaptive comfort state.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Smile,
  Coffee,
  Moon,
  Sparkles,
  Activity,
  Volume2,
  Sun,
} from 'lucide-react';
import { GlassCard } from '../glass';

export type MoodType = 'relaxed' | 'focused' | 'energized' | 'cozy' | 'social' | 'sleeping';

export interface EmotionalStateData {
  currentMood: MoodType;
  comfortScore: number; // 0-100
  occupants: number;
  activeScenes: string[];
  ambientFactors: {
    lighting: 'bright' | 'dim' | 'natural' | 'off';
    temperature: 'warm' | 'cool' | 'neutral';
    sound: 'quiet' | 'ambient' | 'music' | 'active';
  };
  suggestions?: string[];
}

interface EmotionalStateWidgetProps {
  data: EmotionalStateData;
  compact?: boolean;
  className?: string;
}

const moodConfig: Record<MoodType, { icon: typeof Heart; color: string; label: string; gradient: string }> = {
  relaxed: {
    icon: Smile,
    color: '#00d4aa',
    label: 'Relaxed',
    gradient: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 102, 255, 0.1) 100%)',
  },
  focused: {
    icon: Activity,
    color: '#0066ff',
    label: 'Focused',
    gradient: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
  },
  energized: {
    icon: Sparkles,
    color: '#fcd34d',
    label: 'Energized',
    gradient: 'linear-gradient(135deg, rgba(252, 211, 77, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%)',
  },
  cozy: {
    icon: Coffee,
    color: '#c9a962',
    label: 'Cozy',
    gradient: 'linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
  },
  social: {
    icon: Heart,
    color: '#f472b6',
    label: 'Social',
    gradient: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2) 0%, rgba(167, 139, 250, 0.1) 100%)',
  },
  sleeping: {
    icon: Moon,
    color: '#818cf8',
    label: 'Sleep Mode',
    gradient: 'linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(30, 41, 59, 0.3) 100%)',
  },
};

export const EmotionalStateWidget: React.FC<EmotionalStateWidgetProps> = ({
  data,
  compact = false,
  className = '',
}) => {
  const mood = moodConfig[data.currentMood];
  const MoodIcon = mood.icon;

  if (compact) {
    return (
      <GlassCard variant="subtle" size="sm" className={className}>
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-xl"
            style={{ background: mood.gradient }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <MoodIcon size={20} style={{ color: mood.color }} />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-white">{mood.label}</p>
            <p className="text-xs text-white/50">
              {data.occupants} {data.occupants === 1 ? 'person' : 'people'} home
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" size="md" className={className}>
      <div className="space-y-5">
        {/* Mood display */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-white/50 uppercase tracking-wide">Home Mood</p>
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 rounded-2xl"
                style={{ background: mood.gradient }}
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 20px ${mood.color}20`,
                    `0 0 40px ${mood.color}30`,
                    `0 0 20px ${mood.color}20`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <MoodIcon size={28} style={{ color: mood.color }} />
              </motion.div>
              <div>
                <p className="text-xl font-semibold text-white">{mood.label}</p>
                <p className="text-sm text-white/50">
                  {data.occupants} {data.occupants === 1 ? 'person' : 'people'} present
                </p>
              </div>
            </div>
          </div>

          {/* Comfort score */}
          <div className="text-right">
            <p className="text-xs text-white/50 mb-1">Comfort</p>
            <div className="relative">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle
                  cx="30"
                  cy="30"
                  r="25"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="30"
                  cy="30"
                  r="25"
                  fill="none"
                  stroke={mood.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 25}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 25 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 25 * (1 - data.comfortScore / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  transform="rotate(-90 30 30)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {data.comfortScore}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ambient factors */}
        <div className="grid grid-cols-3 gap-2">
          <AmbientFactor
            icon={<Sun size={16} />}
            label="Light"
            value={data.ambientFactors.lighting}
            color={
              data.ambientFactors.lighting === 'bright'
                ? '#fcd34d'
                : data.ambientFactors.lighting === 'natural'
                  ? '#60a5fa'
                  : '#64748b'
            }
          />
          <AmbientFactor
            icon={
              data.ambientFactors.temperature === 'warm' ? (
                <Sun size={16} />
              ) : (
                <Activity size={16} />
              )
            }
            label="Temp"
            value={data.ambientFactors.temperature}
            color={
              data.ambientFactors.temperature === 'warm'
                ? '#f97316'
                : data.ambientFactors.temperature === 'cool'
                  ? '#60a5fa'
                  : '#10b981'
            }
          />
          <AmbientFactor
            icon={<Volume2 size={16} />}
            label="Sound"
            value={data.ambientFactors.sound}
            color={
              data.ambientFactors.sound === 'music'
                ? '#f472b6'
                : data.ambientFactors.sound === 'quiet'
                  ? '#64748b'
                  : '#00d4aa'
            }
          />
        </div>

        {/* Active scenes */}
        {data.activeScenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/50 uppercase tracking-wide">Active Scenes</p>
            <div className="flex flex-wrap gap-2">
              {data.activeScenes.map((scene) => (
                <motion.span
                  key={scene}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {scene}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {data.suggestions && data.suggestions.length > 0 && (
            <motion.div
              className="pt-3 border-t border-white/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                <Sparkles size={16} className="text-muted-gold mt-0.5" />
                <p className="text-sm text-white/70">{data.suggestions[0]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
};

const AmbientFactor: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div
    className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl"
    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
  >
    <span style={{ color }}>{icon}</span>
    <span className="text-xs text-white/50">{label}</span>
    <span className="text-xs font-medium text-white capitalize">{value}</span>
  </div>
);

export default EmotionalStateWidget;
