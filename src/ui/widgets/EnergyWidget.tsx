/**
 * EnergyWidget Component
 *
 * Real-time energy monitoring with animated graphs,
 * consumption tracking, and smart insights.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Battery,
  Sun,
  Plug,
  Flame,
  Snowflake,
} from 'lucide-react';
import { GlassCard } from '../glass';

export interface EnergyData {
  currentPower: number; // Watts
  todayUsage: number; // kWh
  monthlyUsage: number; // kWh
  solarGeneration?: number; // Watts
  batteryLevel?: number; // Percentage
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  breakdown: {
    category: 'climate' | 'lighting' | 'appliances' | 'other';
    power: number;
    percentage: number;
  }[];
  hourlyUsage?: number[]; // Last 24 hours
}

interface EnergyWidgetProps {
  data: EnergyData;
  compact?: boolean;
  className?: string;
}

const categoryConfig = {
  climate: { icon: Flame, color: '#f97316', label: 'Climate' },
  lighting: { icon: Zap, color: '#fcd34d', label: 'Lighting' },
  appliances: { icon: Plug, color: '#60a5fa', label: 'Appliances' },
  other: { icon: Zap, color: '#a78bfa', label: 'Other' },
};

export const EnergyWidget: React.FC<EnergyWidgetProps> = ({
  data,
  compact = false,
  className = '',
}) => {
  const formattedPower = useMemo(() => {
    if (data.currentPower >= 1000) {
      return `${(data.currentPower / 1000).toFixed(1)} kW`;
    }
    return `${data.currentPower} W`;
  }, [data.currentPower]);

  const TrendIcon = data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Zap;
  const trendColor = data.trend === 'up' ? '#ef4444' : data.trend === 'down' ? '#10b981' : '#fcd34d';

  if (compact) {
    return (
      <GlassCard variant="subtle" size="sm" className={className}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg"
              style={{ background: 'rgba(250, 204, 21, 0.15)' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap size={20} className="text-yellow-400" />
            </motion.div>
            <div>
              <p className="text-lg font-semibold text-white">{formattedPower}</p>
              <p className="text-xs text-white/50">Current Power</p>
            </div>
          </div>
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={16} />
            <span className="text-sm font-medium">{data.trendPercent}%</span>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" size="md" className={className}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50 mb-1">Current Power</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-4xl font-light text-white"
                key={data.currentPower}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {formattedPower}
              </motion.span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: `${trendColor}20`,
              color: trendColor,
            }}
          >
            <TrendIcon size={14} />
            <span className="text-sm font-medium">
              {data.trendPercent}% {data.trend === 'up' ? 'higher' : data.trend === 'down' ? 'lower' : ''}
            </span>
          </div>
        </div>

        {/* Solar & Battery */}
        {(data.solarGeneration !== undefined || data.batteryLevel !== undefined) && (
          <div className="flex gap-3">
            {data.solarGeneration !== undefined && (
              <div
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(250, 204, 21, 0.1)' }}
              >
                <Sun size={20} className="text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {data.solarGeneration >= 1000
                      ? `${(data.solarGeneration / 1000).toFixed(1)} kW`
                      : `${data.solarGeneration} W`}
                  </p>
                  <p className="text-xs text-white/50">Solar</p>
                </div>
              </div>
            )}

            {data.batteryLevel !== undefined && (
              <div
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(16, 185, 129, 0.1)' }}
              >
                <Battery size={20} className="text-success-green" />
                <div>
                  <p className="text-sm font-medium text-white">{data.batteryLevel}%</p>
                  <p className="text-xs text-white/50">Battery</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage breakdown */}
        <div className="space-y-3">
          <p className="text-xs text-white/50 uppercase tracking-wide">Breakdown</p>
          <div className="space-y-2">
            {data.breakdown.map((item) => {
              const config = categoryConfig[item.category];
              const Icon = config.icon;

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: config.color }} />
                      <span className="text-sm text-white/70">{config.label}</span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {item.power >= 1000 ? `${(item.power / 1000).toFixed(1)} kW` : `${item.power} W`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-xs text-white/50">Today</p>
            <p className="text-lg font-medium text-white">{data.todayUsage.toFixed(1)} kWh</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5">
            <p className="text-xs text-white/50">This Month</p>
            <p className="text-lg font-medium text-white">{data.monthlyUsage.toFixed(0)} kWh</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default EnergyWidget;
