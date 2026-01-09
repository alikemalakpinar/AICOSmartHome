/**
 * Climate Control Screen
 *
 * Beautiful, functional climate control with smooth scrolling
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer,
  Droplets,
  Wind,
  Snowflake,
  Sun,
  Zap,
  Clock,
  Leaf,
  Fan,
} from 'lucide-react';

type ClimateMode = 'auto' | 'cool' | 'heat' | 'fan' | 'eco';

interface RoomClimate {
  id: string;
  name: string;
  icon: string;
  temperature: number;
  targetTemp: number;
  humidity: number;
  isActive: boolean;
}

const demoRooms: RoomClimate[] = [
  { id: '1', name: 'Living Room', icon: '🛋️', temperature: 23, targetTemp: 22, humidity: 45, isActive: true },
  { id: '2', name: 'Bedroom', icon: '🛏️', temperature: 21, targetTemp: 20, humidity: 48, isActive: true },
  { id: '3', name: 'Kitchen', icon: '🍳', temperature: 24, targetTemp: 22, humidity: 42, isActive: false },
  { id: '4', name: 'Office', icon: '💻', temperature: 22, targetTemp: 22, humidity: 44, isActive: true },
  { id: '5', name: 'Bathroom', icon: '🛁', temperature: 25, targetTemp: 24, humidity: 55, isActive: false },
  { id: '6', name: 'Guest Room', icon: '🛎️', temperature: 21, targetTemp: 21, humidity: 46, isActive: false },
];

export const ClimateScreen: React.FC = () => {
  const [globalTemp, setGlobalTemp] = useState(22);
  const [mode, setMode] = useState<ClimateMode>('auto');
  const [rooms, setRooms] = useState(demoRooms);

  const modes: Array<{ id: ClimateMode; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'auto', label: 'Auto', icon: <Zap size={20} />, color: '#14b8a6' },
    { id: 'cool', label: 'Cool', icon: <Snowflake size={20} />, color: '#3b82f6' },
    { id: 'heat', label: 'Heat', icon: <Sun size={20} />, color: '#f97316' },
    { id: 'fan', label: 'Fan', icon: <Fan size={20} />, color: '#8b5cf6' },
    { id: 'eco', label: 'Eco', icon: <Leaf size={20} />, color: '#22c55e' },
  ];

  const toggleRoom = (roomId: string) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, isActive: !room.isActive } : room
      )
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Climate</h1>
            <p className="text-slate-500 text-sm mt-0.5">Control your home temperature</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
            System Active
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-3xl mx-auto">
          {/* Main Temperature Control */}
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col items-center">
              {/* Temperature Display */}
              <div className="relative mb-6">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />
                  {/* Progress arc */}
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="url(#tempGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={565}
                    strokeDashoffset={565 - ((globalTemp - 16) / 14) * 565}
                    transform="rotate(-90 100 100)"
                    initial={{ strokeDashoffset: 565 }}
                    animate={{ strokeDashoffset: 565 - ((globalTemp - 16) / 14) * 565 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-light text-slate-900">{globalTemp}°</span>
                  <span className="text-slate-400 text-sm mt-1">Target</span>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="w-full max-w-xs">
                <input
                  type="range"
                  min="16"
                  max="30"
                  value={globalTemp}
                  onChange={(e) => setGlobalTemp(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gradient-to-r
                    [&::-webkit-slider-thumb]:from-teal-400
                    [&::-webkit-slider-thumb]:to-teal-500
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-teal-500/30
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
                  <span>16°C</span>
                  <span>30°C</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mode Selection */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Mode</h3>
            <div className="grid grid-cols-5 gap-2">
              {modes.map((m) => (
                <motion.button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    mode === m.id
                      ? 'bg-teal-50 ring-2 ring-teal-400'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className={`p-2 rounded-lg ${mode === m.id ? 'bg-white shadow-sm' : ''}`}
                    style={{ color: mode === m.id ? m.color : '#94a3b8' }}
                  >
                    {m.icon}
                  </div>
                  <span className={`text-xs font-medium ${
                    mode === m.id ? 'text-teal-700' : 'text-slate-500'
                  }`}>
                    {m.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Droplets size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">45%</p>
                  <p className="text-xs text-slate-400">Humidity</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Leaf size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">Good</p>
                  <p className="text-xs text-slate-400">Air Quality</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">2h</p>
                  <p className="text-xs text-slate-400">Schedule</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Room Controls */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Room Controls</h3>
              <button className="text-xs text-teal-600 font-medium hover:text-teal-700">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {rooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + index * 0.03 }}
                  onClick={() => toggleRoom(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{room.icon}</span>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{room.name}</p>
                      <p className="text-xs text-slate-400">{room.humidity}% humidity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{room.temperature}°</p>
                      <p className="text-xs text-slate-400">→ {room.targetTemp}°</p>
                    </div>
                    <button
                      className={`w-11 h-6 rounded-full transition-all duration-200 ${
                        room.isActive
                          ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                          : 'bg-slate-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRoom(room.id);
                      }}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        room.isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
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

export default ClimateScreen;
