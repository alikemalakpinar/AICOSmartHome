/**
 * Climate Control Screen
 *
 * HVAC control interface with temperature adjustment,
 * humidity monitoring, and zone management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Wind,
  Fan,
  Power,
  ChevronUp,
  ChevronDown,
  Leaf,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassSlider, GlassToggle } from '../glass';

type ClimateMode = 'auto' | 'heat' | 'cool' | 'fan' | 'dry';

interface RoomClimate {
  id: string;
  name: string;
  currentTemp: number;
  targetTemp: number;
  humidity: number;
  isActive: boolean;
}

const demoRooms: RoomClimate[] = [
  { id: 'living', name: 'Living Room', currentTemp: 23, targetTemp: 22, humidity: 45, isActive: true },
  { id: 'bedroom', name: 'Master Bedroom', currentTemp: 21, targetTemp: 20, humidity: 50, isActive: true },
  { id: 'kitchen', name: 'Kitchen', currentTemp: 24, targetTemp: 22, humidity: 55, isActive: false },
  { id: 'office', name: 'Home Office', currentTemp: 22, targetTemp: 21, humidity: 48, isActive: true },
];

export const ClimateScreen: React.FC = () => {
  const [globalTemp, setGlobalTemp] = useState(22);
  const [mode, setMode] = useState<ClimateMode>('auto');
  const [fanSpeed, setFanSpeed] = useState(50);
  const [ecoMode, setEcoMode] = useState(true);
  const [rooms, setRooms] = useState(demoRooms);

  const modes: { id: ClimateMode; icon: typeof Thermometer; label: string; color: string }[] = [
    { id: 'auto', icon: Thermometer, label: 'Auto', color: '#00d4aa' },
    { id: 'heat', icon: ThermometerSun, label: 'Heat', color: '#f97316' },
    { id: 'cool', icon: ThermometerSnowflake, label: 'Cool', color: '#60a5fa' },
    { id: 'fan', icon: Fan, label: 'Fan', color: '#a78bfa' },
    { id: 'dry', icon: Droplets, label: 'Dry', color: '#fcd34d' },
  ];

  const adjustTemp = (delta: number) => {
    setGlobalTemp(prev => Math.max(16, Math.min(30, prev + delta)));
  };

  const toggleRoom = (roomId: string) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, isActive: !room.isActive } : room
      )
    );
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Main Temperature Control */}
      <GlassCard variant="elevated" size="lg" className="relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">Climate Control</h2>
            <p className="text-white/50 text-sm mt-1">Whole home temperature management</p>
          </div>
          <GlassToggle
            enabled={ecoMode}
            onChange={setEcoMode}
            label="Eco Mode"
            size="md"
          />
        </div>

        {/* Temperature Dial */}
        <div className="flex items-center justify-center gap-12">
          {/* Decrease */}
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            whileHover={{ scale: 1.1, background: 'rgba(96, 165, 250, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustTemp(-0.5)}
          >
            <ChevronDown size={28} className="text-blue-400" />
          </motion.button>

          {/* Temperature Display */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* Progress arc */}
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={mode === 'heat' ? '#f97316' : mode === 'cool' ? '#60a5fa' : '#00d4aa'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 90 * (1 - (globalTemp - 16) / 14),
                }}
                transition={{ duration: 0.5 }}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-6xl font-light text-white"
                key={globalTemp}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {globalTemp}
              </motion.span>
              <span className="text-2xl text-white/60">°C</span>
              <span className="text-sm text-white/40 mt-2 capitalize">{mode} Mode</span>
            </div>
          </div>

          {/* Increase */}
          <motion.button
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            whileHover={{ scale: 1.1, background: 'rgba(249, 115, 22, 0.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => adjustTemp(0.5)}
          >
            <ChevronUp size={28} className="text-orange-400" />
          </motion.button>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center gap-3 mt-8">
          {modes.map(m => (
            <motion.button
              key={m.id}
              className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl"
              style={{
                background: mode === m.id ? `${m.color}20` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${mode === m.id ? `${m.color}50` : 'rgba(255, 255, 255, 0.1)'}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode(m.id)}
            >
              <m.icon size={24} style={{ color: mode === m.id ? m.color : 'rgba(255, 255, 255, 0.5)' }} />
              <span
                className="text-xs font-medium"
                style={{ color: mode === m.id ? m.color : 'rgba(255, 255, 255, 0.5)' }}
              >
                {m.label}
              </span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Fan Speed */}
      <GlassCard variant="default" size="md">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="p-3 rounded-xl"
            style={{ background: 'rgba(167, 139, 250, 0.15)' }}
          >
            <Fan size={24} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium">Fan Speed</h3>
            <p className="text-white/50 text-sm">Adjust airflow intensity</p>
          </div>
          <span className="text-lg font-semibold text-purple-400">{fanSpeed}%</span>
        </div>
        <GlassSlider
          value={fanSpeed}
          onChange={setFanSpeed}
          min={0}
          max={100}
          variant="default"
        />
      </GlassCard>

      {/* Room Controls */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Room Zones</h3>
        <div className="grid grid-cols-2 gap-4">
          {rooms.map(room => (
            <GlassCard
              key={room.id}
              variant="subtle"
              size="sm"
              interactive
              onClick={() => toggleRoom(room.id)}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">{room.name}</h4>
                  <p className="text-white/50 text-xs">
                    {room.currentTemp}°C / {room.humidity}% humidity
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    room.isActive ? 'bg-success-green' : 'bg-white/30'
                  }`}
                  style={{
                    boxShadow: room.isActive ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-light text-white">{room.targetTemp}°</span>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: room.isActive ? 'rgba(0, 212, 170, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: room.isActive ? '#00d4aa' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {room.isActive ? 'Active' : 'Off'}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClimateScreen;
