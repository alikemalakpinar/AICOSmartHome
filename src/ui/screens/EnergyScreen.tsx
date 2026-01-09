/**
 * Energy Management Screen
 *
 * Detailed energy monitoring with consumption analytics,
 * solar generation, and device power management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Sun,
  Battery,
  TrendingUp,
  TrendingDown,
  Plug,
  Flame,
  Lightbulb,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../glass';

interface EnergyDevice {
  id: string;
  name: string;
  power: number;
  isOn: boolean;
  category: 'climate' | 'lighting' | 'appliance' | 'other';
}

const demoDevices: EnergyDevice[] = [
  { id: 'hvac', name: 'HVAC System', power: 1200, isOn: true, category: 'climate' },
  { id: 'water', name: 'Water Heater', power: 800, isOn: true, category: 'appliance' },
  { id: 'fridge', name: 'Refrigerator', power: 150, isOn: true, category: 'appliance' },
  { id: 'lights', name: 'All Lights', power: 340, isOn: true, category: 'lighting' },
  { id: 'tv', name: 'Entertainment', power: 250, isOn: false, category: 'other' },
  { id: 'oven', name: 'Oven', power: 2000, isOn: false, category: 'appliance' },
];

const hourlyData = [
  1.2, 1.1, 0.9, 0.8, 0.9, 1.4, 2.1, 2.8, 2.4, 2.1, 1.9, 2.0,
  2.3, 2.1, 1.8, 1.9, 2.4, 3.1, 3.5, 3.2, 2.8, 2.4, 1.9, 1.5,
];

export const EnergyScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [devices, setDevices] = useState(demoDevices);

  const totalPower = devices.filter(d => d.isOn).reduce((sum, d) => sum + d.power, 0);
  const solarGeneration = 1850;
  const netPower = totalPower - solarGeneration;

  const toggleDevice = (id: string) => {
    setDevices(prev =>
      prev.map(d => (d.id === id ? { ...d, isOn: !d.isOn } : d))
    );
  };

  const categoryIcons = {
    climate: Flame,
    lighting: Lightbulb,
    appliance: Plug,
    other: Zap,
  };

  const categoryColors = {
    climate: '#f97316',
    lighting: '#fcd34d',
    appliance: '#60a5fa',
    other: '#a78bfa',
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current Usage */}
        <GlassCard variant="elevated" size="md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-warning-amber/15">
              <Zap size={24} className="text-warning-amber" />
            </div>
            <div>
              <p className="text-xs text-white/50">Current Usage</p>
              <p className="text-2xl font-semibold text-white">
                {(totalPower / 1000).toFixed(2)} <span className="text-sm text-white/60">kW</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-error-red">
            <TrendingUp size={14} />
            <span className="text-xs">+15% from yesterday</span>
          </div>
        </GlassCard>

        {/* Solar Generation */}
        <GlassCard variant="elevated" size="md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-yellow-400/15">
              <Sun size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-white/50">Solar Generation</p>
              <p className="text-2xl font-semibold text-white">
                {(solarGeneration / 1000).toFixed(2)} <span className="text-sm text-white/60">kW</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-success-green">
            <TrendingUp size={14} />
            <span className="text-xs">Optimal conditions</span>
          </div>
        </GlassCard>

        {/* Net Power */}
        <GlassCard variant="elevated" size="md">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${netPower > 0 ? 'bg-error-red/15' : 'bg-success-green/15'}`}>
              <Battery size={24} className={netPower > 0 ? 'text-error-red' : 'text-success-green'} />
            </div>
            <div>
              <p className="text-xs text-white/50">Net Power</p>
              <p className="text-2xl font-semibold text-white">
                {netPower > 0 ? '+' : ''}{(netPower / 1000).toFixed(2)} <span className="text-sm text-white/60">kW</span>
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${netPower > 0 ? 'text-error-red' : 'text-success-green'}`}>
            {netPower > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs">{netPower > 0 ? 'Using grid power' : 'Selling to grid'}</span>
          </div>
        </GlassCard>
      </div>

      {/* Usage Chart */}
      <GlassCard variant="default" size="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-white/50" />
            <div>
              <h3 className="text-lg font-semibold text-white">Energy Usage</h3>
              <p className="text-xs text-white/50">Hourly consumption pattern</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map(range => (
              <motion.button
                key={range}
                className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
                style={{
                  background: timeRange === range ? 'rgba(0, 212, 170, 0.15)' : 'transparent',
                  color: timeRange === range ? '#00d4aa' : 'rgba(255, 255, 255, 0.5)',
                }}
                whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 flex items-end gap-1">
          {hourlyData.map((value, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t"
              style={{
                background: index === 18
                  ? 'linear-gradient(180deg, #00d4aa 0%, #00d4aa50 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(value / 4) * 100}%` }}
              transition={{ delay: index * 0.02, duration: 0.5 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-white/40">00:00</span>
          <span className="text-xs text-white/40">06:00</span>
          <span className="text-xs text-white/40">12:00</span>
          <span className="text-xs text-white/40">18:00</span>
          <span className="text-xs text-white/40">23:00</span>
        </div>
      </GlassCard>

      {/* Device Power Consumption */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Device Consumption</h3>
        <div className="space-y-3">
          {devices.map(device => {
            const Icon = categoryIcons[device.category];
            const color = categoryColors[device.category];

            return (
              <GlassCard key={device.id} variant="subtle" size="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}15` }}
                    >
                      <Icon size={22} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{device.name}</p>
                      <p className="text-xs text-white/50">
                        {device.isOn ? `${device.power} W` : 'Off'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {device.isOn && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {((device.power / totalPower) * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-white/50">of total</p>
                      </div>
                    )}
                    <motion.button
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: device.isOn ? 'rgba(0, 212, 170, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleDevice(device.id)}
                    >
                      <Plug
                        size={18}
                        style={{ color: device.isOn ? '#00d4aa' : 'rgba(255, 255, 255, 0.5)' }}
                      />
                    </motion.button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnergyScreen;
