/**
 * Lighting Control Screen
 *
 * Beautiful, functional lighting control with smooth scrolling
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Sun,
  Moon,
  Sparkles,
  Film,
  Power,
} from 'lucide-react';

interface LightZone {
  id: string;
  name: string;
  icon: string;
  brightness: number;
  colorTemp: number;
  color?: string;
  isOn: boolean;
}

const demoLights: LightZone[] = [
  { id: 'living', name: 'Living Room', icon: '🛋️', brightness: 80, colorTemp: 4000, isOn: true },
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️', brightness: 40, colorTemp: 2700, isOn: true },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', brightness: 100, colorTemp: 5000, isOn: true },
  { id: 'dining', name: 'Dining', icon: '🍽️', brightness: 60, colorTemp: 3000, color: '#ff9500', isOn: false },
  { id: 'office', name: 'Office', icon: '💻', brightness: 90, colorTemp: 4500, isOn: true },
  { id: 'bathroom', name: 'Bathroom', icon: '🛁', brightness: 70, colorTemp: 4000, isOn: false },
];

const lightingScenes = [
  { id: 'bright', name: 'Bright', icon: Sun, color: '#f59e0b' },
  { id: 'relax', name: 'Relax', icon: Moon, color: '#8b5cf6' },
  { id: 'focus', name: 'Focus', icon: Sparkles, color: '#3b82f6' },
  { id: 'movie', name: 'Movie', icon: Film, color: '#ec4899' },
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
    if (temp < 4000) return '#fbbf24';
    if (temp < 5000) return '#fef3c7';
    return '#dbeafe';
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Lighting</h1>
            <p className="text-slate-500 text-sm mt-0.5">Control lights throughout your home</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
            <Lightbulb size={12} className="mr-1.5" />
            {lights.filter(l => l.isOn).length} lights on
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-3xl mx-auto">
          {/* Quick Scenes */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Scenes</h3>
            <div className="grid grid-cols-4 gap-3">
              {lightingScenes.map((scene) => (
                <motion.button
                  key={scene.id}
                  onClick={() => setActiveScene(activeScene === scene.id ? null : scene.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    activeScene === scene.id
                      ? 'bg-amber-50 ring-2 ring-amber-400'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={`p-2.5 rounded-xl ${activeScene === scene.id ? 'bg-white shadow-sm' : ''}`}
                  >
                    <scene.icon
                      size={22}
                      style={{ color: activeScene === scene.id ? scene.color : '#94a3b8' }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    activeScene === scene.id ? 'text-amber-700' : 'text-slate-500'
                  }`}>
                    {scene.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Selected Light Control */}
          {selectedZone && (
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: selectedZone.isOn
                        ? `linear-gradient(135deg, ${getColorTempColor(selectedZone.colorTemp)}40 0%, ${getColorTempColor(selectedZone.colorTemp)}20 100%)`
                        : '#f1f5f9',
                      boxShadow: selectedZone.isOn
                        ? `0 4px 12px ${getColorTempColor(selectedZone.colorTemp)}30`
                        : 'none',
                    }}
                  >
                    {selectedZone.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedZone.name}</h3>
                    <p className="text-slate-500 text-sm">
                      {selectedZone.isOn ? `${selectedZone.brightness}% brightness` : 'Off'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleLight(selectedZone.id)}
                  className={`w-14 h-7 rounded-full transition-all duration-200 ${
                    selectedZone.isOn
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    selectedZone.isOn ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {selectedZone.isOn && (
                <div className="space-y-6">
                  {/* Brightness */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-500">Brightness</span>
                      <span className="text-sm font-medium text-slate-900">{selectedZone.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedZone.brightness}
                      onChange={(e) => updateLight(selectedZone.id, { brightness: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-gradient-to-r
                        [&::-webkit-slider-thumb]:from-amber-400
                        [&::-webkit-slider-thumb]:to-amber-500
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Color Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-500">Color Temperature</span>
                      <span className="text-sm font-medium text-slate-900">{selectedZone.colorTemp}K</span>
                    </div>
                    <div className="relative">
                      <div
                        className="h-3 rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #ff9500 0%, #fbbf24 33%, #fef3c7 66%, #dbeafe 100%)',
                        }}
                      />
                      <input
                        type="range"
                        min="2700"
                        max="6500"
                        value={selectedZone.colorTemp}
                        onChange={(e) => updateLight(selectedZone.id, { colorTemp: Number(e.target.value) })}
                        className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-slate-400">Warm</span>
                      <span className="text-xs text-slate-400">Cool</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* All Lights Grid */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">All Lights</h3>
            <div className="grid grid-cols-3 gap-3">
              {lights.map((light, index) => (
                <motion.div
                  key={light.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedLight === light.id
                      ? 'ring-2 ring-amber-400 bg-amber-50'
                      : light.isOn
                        ? 'bg-slate-50 hover:bg-slate-100'
                        : 'bg-slate-50/50 hover:bg-slate-100'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 + index * 0.02 }}
                  onClick={() => setSelectedLight(light.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{light.icon}</span>
                    <motion.button
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        light.isOn ? 'bg-amber-100' : 'bg-slate-100'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLight(light.id);
                      }}
                    >
                      <Power
                        size={14}
                        className={light.isOn ? 'text-amber-600' : 'text-slate-400'}
                      />
                    </motion.button>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{light.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {light.isOn ? `${light.brightness}%` : 'Off'}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default LightingScreen;
