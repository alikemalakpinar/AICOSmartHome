/**
 * Energy Management Screen
 *
 * Vitality flow monitoring and device power management
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
  Thermometer,
  Lightbulb,
  Tv,
  Refrigerator,
  Flame,
} from 'lucide-react';

interface EnergyDevice {
  id: string;
  name: string;
  icon: typeof Plug;
  power: number;
  isOn: boolean;
  category: 'climate' | 'lighting' | 'appliance' | 'other';
}

const demoDevices: EnergyDevice[] = [
  { id: 'hvac', name: 'HVAC System', icon: Thermometer, power: 1200, isOn: true, category: 'climate' },
  { id: 'water', name: 'Water Heater', icon: Flame, power: 800, isOn: true, category: 'appliance' },
  { id: 'fridge', name: 'Refrigerator', icon: Refrigerator, power: 150, isOn: true, category: 'appliance' },
  { id: 'lights', name: 'All Lights', icon: Lightbulb, power: 340, isOn: true, category: 'lighting' },
  { id: 'tv', name: 'Entertainment', icon: Tv, power: 250, isOn: false, category: 'other' },
  { id: 'oven', name: 'Oven', icon: Flame, power: 2000, isOn: false, category: 'appliance' },
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Vitality</h1>
            <p className="text-slate-500 text-sm mt-0.5">Energy flow monitoring</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
            netPower > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <Zap size={12} className="mr-1.5" />
            {netPower > 0 ? 'Consuming' : 'Generating'}
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-3xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap size={18} className="text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {(totalPower / 1000).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">kW Current</p>
              <div className="flex items-center gap-1 mt-2 text-red-500">
                <TrendingUp size={12} />
                <span className="text-xs">+15%</span>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Sun size={18} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {(solarGeneration / 1000).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">kW Solar</p>
              <div className="flex items-center gap-1 mt-2 text-emerald-500">
                <TrendingUp size={12} />
                <span className="text-xs">Optimal</span>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${netPower > 0 ? 'bg-red-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                  <Battery size={18} className={netPower > 0 ? 'text-red-500' : 'text-emerald-600'} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {netPower > 0 ? '+' : ''}{(netPower / 1000).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">kW Net</p>
              <div className={`flex items-center gap-1 mt-2 ${netPower > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {netPower > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span className="text-xs">{netPower > 0 ? 'Using grid' : 'Selling'}</span>
              </div>
            </motion.div>
          </div>

          {/* Usage Chart */}
          <motion.div
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Flow Pattern</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hourly consumption</p>
              </div>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {(['day', 'week', 'month'] as const).map(range => (
                  <button
                    key={range}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                      timeRange === range
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="h-40 flex items-end gap-1">
              {hourlyData.map((value, index) => (
                <motion.div
                  key={index}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: index === 18
                      ? 'linear-gradient(180deg, #14b8a6 0%, #5eead4 100%)'
                      : 'linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(value / 4) * 100}%` }}
                  transition={{ delay: index * 0.015, duration: 0.4 }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-xs text-slate-400">00:00</span>
              <span className="text-xs text-slate-400">12:00</span>
              <span className="text-xs text-slate-400">23:00</span>
            </div>
          </motion.div>

          {/* Device Consumption */}
          <motion.div
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Device Flow</h3>
              <button className="text-xs text-teal-600 font-medium hover:text-teal-700">
                Manage
              </button>
            </div>
            <div className="space-y-2">
              {devices.map((device, index) => {
                const Icon = device.icon;

                return (
                  <motion.div
                    key={device.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.17 + index * 0.03 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        device.isOn ? 'bg-teal-100' : 'bg-slate-100'
                      }`}>
                        <Icon size={18} className={device.isOn ? 'text-teal-600' : 'text-slate-400'} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{device.name}</p>
                        <p className="text-xs text-slate-400">
                          {device.isOn ? `${device.power} W` : 'Dormant'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {device.isOn && totalPower > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700">
                            {((device.power / totalPower) * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => toggleDevice(device.id)}
                        className={`w-11 h-6 rounded-full transition-all duration-200 ${
                          device.isOn
                            ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                            : 'bg-slate-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          device.isOn ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom Spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default EnergyScreen;
