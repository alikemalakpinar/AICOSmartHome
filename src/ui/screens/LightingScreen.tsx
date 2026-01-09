/**
 * Lighting Control Screen
 *
 * Advanced lighting control with brightness, color temperature,
 * RGB picker, and scene management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Sun,
  Moon,
  Palette,
  Power,
  Sparkles,
} from 'lucide-react';
import { GlassCard, GlassSlider, GlassToggle } from '../glass';

interface LightZone {
  id: string;
  name: string;
  brightness: number;
  colorTemp: number;
  color?: string;
  isOn: boolean;
}

const demoLights: LightZone[] = [
  { id: 'living', name: 'Living Room', brightness: 80, colorTemp: 4000, isOn: true },
  { id: 'bedroom', name: 'Bedroom', brightness: 40, colorTemp: 2700, isOn: true },
  { id: 'kitchen', name: 'Kitchen', brightness: 100, colorTemp: 5000, isOn: true },
  { id: 'dining', name: 'Dining', brightness: 60, colorTemp: 3000, color: '#ff9500', isOn: false },
  { id: 'office', name: 'Office', brightness: 90, colorTemp: 4500, isOn: true },
  { id: 'bathroom', name: 'Bathroom', brightness: 70, colorTemp: 4000, isOn: false },
];

const lightingScenes = [
  { id: 'bright', name: 'Bright', icon: Sun, color: '#fcd34d' },
  { id: 'relax', name: 'Relax', icon: Moon, color: '#f97316' },
  { id: 'focus', name: 'Focus', icon: Sparkles, color: '#60a5fa' },
  { id: 'movie', name: 'Movie', icon: Palette, color: '#a78bfa' },
];

export const LightingScreen: React.FC = () => {
  const [lights, setLights] = useState(demoLights);
  const [selectedLight, setSelectedLight] = useState<string | null>('living');
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const selectedZone = lights.find(l => l.id === selectedLight);

  const updateLight = (id: string, updates: Partial<LightZone>) => {
    setLights(prev =>
      prev.map(light =>
        light.id === id ? { ...light, ...updates } : light
      )
    );
  };

  const toggleLight = (id: string) => {
    updateLight(id, { isOn: !lights.find(l => l.id === id)?.isOn });
  };

  const getColorTempColor = (temp: number) => {
    if (temp < 3000) return '#ff9500';
    if (temp < 4000) return '#ffd700';
    if (temp < 5000) return '#fffaf0';
    return '#e0f0ff';
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Lighting</h2>
          <p className="text-white/50 text-sm mt-1">Control lights throughout your home</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-green/15">
          <span className="w-2 h-2 rounded-full bg-success-green" />
          <span className="text-sm text-success-green">
            {lights.filter(l => l.isOn).length} lights on
          </span>
        </div>
      </div>

      {/* Quick Scenes */}
      <div className="flex gap-3">
        {lightingScenes.map(scene => (
          <motion.button
            key={scene.id}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl"
            style={{
              background: activeScene === scene.id
                ? `${scene.color}20`
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${
                activeScene === scene.id ? `${scene.color}50` : 'rgba(255, 255, 255, 0.1)'
              }`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveScene(activeScene === scene.id ? null : scene.id)}
          >
            <scene.icon
              size={20}
              style={{ color: activeScene === scene.id ? scene.color : 'rgba(255, 255, 255, 0.6)' }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: activeScene === scene.id ? scene.color : 'rgba(255, 255, 255, 0.6)' }}
            >
              {scene.name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Selected Light Control */}
      {selectedZone && (
        <GlassCard variant="elevated" size="lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: selectedZone.isOn
                    ? `linear-gradient(135deg, ${getColorTempColor(selectedZone.colorTemp)}40 0%, ${getColorTempColor(selectedZone.colorTemp)}20 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: selectedZone.isOn
                    ? `0 0 20px ${getColorTempColor(selectedZone.colorTemp)}30`
                    : 'none',
                }}
              >
                <Lightbulb
                  size={24}
                  style={{
                    color: selectedZone.isOn
                      ? getColorTempColor(selectedZone.colorTemp)
                      : 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedZone.name}</h3>
                <p className="text-white/50 text-sm">
                  {selectedZone.isOn ? `${selectedZone.brightness}% brightness` : 'Off'}
                </p>
              </div>
            </div>
            <GlassToggle
              enabled={selectedZone.isOn}
              onChange={() => toggleLight(selectedZone.id)}
              size="md"
            />
          </div>

          {selectedZone.isOn && (
            <div className="space-y-6">
              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/70">Brightness</span>
                  <span className="text-sm font-medium text-white">{selectedZone.brightness}%</span>
                </div>
                <GlassSlider
                  value={selectedZone.brightness}
                  onChange={(v) => updateLight(selectedZone.id, { brightness: v })}
                  variant="teal"
                />
              </div>

              {/* Color Temperature */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/70">Color Temperature</span>
                  <span className="text-sm font-medium text-white">{selectedZone.colorTemp}K</span>
                </div>
                <div className="relative">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #ff9500 0%, #ffd700 33%, #fffaf0 66%, #e0f0ff 100%)',
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white"
                    style={{
                      left: `${((selectedZone.colorTemp - 2700) / (6500 - 2700)) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      background: getColorTempColor(selectedZone.colorTemp),
                      boxShadow: `0 0 10px ${getColorTempColor(selectedZone.colorTemp)}`,
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0}
                    onDrag={(_, info) => {
                      const container = (info.point.x / window.innerWidth) * 3800 + 2700;
                      updateLight(selectedZone.id, {
                        colorTemp: Math.max(2700, Math.min(6500, Math.round(container / 100) * 100)),
                      });
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-white/40">Warm</span>
                  <span className="text-xs text-white/40">Cool</span>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* All Lights Grid */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">All Lights</h3>
        <div className="grid grid-cols-3 gap-3">
          {lights.map(light => (
            <motion.div
              key={light.id}
              className={`p-4 rounded-xl cursor-pointer ${
                selectedLight === light.id ? 'ring-2 ring-teal-glow' : ''
              }`}
              style={{
                background: light.isOn
                  ? `linear-gradient(135deg, ${getColorTempColor(light.colorTemp)}15 0%, rgba(255,255,255,0.05) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedLight(light.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <Lightbulb
                  size={20}
                  style={{
                    color: light.isOn ? getColorTempColor(light.colorTemp) : 'rgba(255, 255, 255, 0.3)',
                  }}
                />
                <motion.button
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: light.isOn ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLight(light.id);
                  }}
                >
                  <Power
                    size={14}
                    style={{ color: light.isOn ? '#00d4aa' : 'rgba(255, 255, 255, 0.5)' }}
                  />
                </motion.button>
              </div>
              <p className="text-sm font-medium text-white truncate">{light.name}</p>
              <p className="text-xs text-white/50">
                {light.isOn ? `${light.brightness}%` : 'Off'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightingScreen;
