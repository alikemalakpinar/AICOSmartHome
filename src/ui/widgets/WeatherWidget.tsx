/**
 * WeatherWidget Component
 *
 * Premium weather display with animated icons,
 * forecast data, and glass aesthetics.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Eye,
} from 'lucide-react';
import { GlassCard } from '../glass';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'wind';
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  isDay: boolean;
  forecast?: {
    time: string;
    temp: number;
    condition: string;
  }[];
}

interface WeatherWidgetProps {
  data: WeatherData;
  compact?: boolean;
  className?: string;
}

const conditionIcons = {
  clear: { day: Sun, night: Moon },
  cloudy: { day: Cloud, night: Cloud },
  rain: { day: CloudRain, night: CloudRain },
  snow: { day: CloudSnow, night: CloudSnow },
  storm: { day: CloudLightning, night: CloudLightning },
  wind: { day: Wind, night: Wind },
};

const conditionColors = {
  clear: '#fcd34d',
  cloudy: '#94a3b8',
  rain: '#60a5fa',
  snow: '#e0e7ff',
  storm: '#a78bfa',
  wind: '#67e8f9',
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  data,
  compact = false,
  className = '',
}) => {
  const IconComponent = conditionIcons[data.condition][data.isDay ? 'day' : 'night'];
  const accentColor = conditionColors[data.condition];

  if (compact) {
    return (
      <GlassCard variant="subtle" size="sm" className={className}>
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              rotate: data.condition === 'clear' ? [0, 5, -5, 0] : 0,
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ color: accentColor }}
          >
            <IconComponent size={32} />
          </motion.div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-white">
                {data.temperature}
              </span>
              <span className="text-lg text-white/60">°C</span>
            </div>
            <span className="text-xs text-white/50 capitalize">
              {data.condition}
            </span>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="floating" size="md" glow="none" className={className}>
      <div className="space-y-4">
        {/* Main weather display */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-light text-white">
                {data.temperature}
              </span>
              <span className="text-2xl text-white/60">°C</span>
            </div>
            <p className="text-sm text-white/50">
              Feels like {data.feelsLike}°C
            </p>
            <p className="text-sm text-white/70 capitalize font-medium">
              {data.condition}
            </p>
          </div>

          <motion.div
            className="relative"
            animate={{
              y: [0, -5, 0],
              rotate: data.condition === 'clear' ? [0, 10, 0] : 0,
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <IconComponent
              size={64}
              style={{ color: accentColor }}
              strokeWidth={1.5}
            />
            {/* Glow effect */}
            <div
              className="absolute inset-0 blur-xl opacity-30"
              style={{ backgroundColor: accentColor }}
            />
          </motion.div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Droplets size={16} />}
            label="Humidity"
            value={`${data.humidity}%`}
          />
          <StatItem
            icon={<Wind size={16} />}
            label="Wind"
            value={`${data.windSpeed} km/h`}
          />
          <StatItem
            icon={<Eye size={16} />}
            label="Visibility"
            value={`${data.visibility} km`}
          />
          <StatItem
            icon={<Sun size={16} />}
            label="UV Index"
            value={data.uvIndex.toString()}
            highlight={data.uvIndex > 6}
          />
        </div>

        {/* Forecast */}
        {data.forecast && data.forecast.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between">
              {data.forecast.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.time}
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-xs text-white/50">{item.time}</span>
                  <span className="text-sm font-medium text-white">
                    {item.temp}°
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div
    className="flex items-center gap-2 px-3 py-2 rounded-lg"
    style={{
      background: highlight
        ? 'rgba(245, 158, 11, 0.1)'
        : 'rgba(255, 255, 255, 0.03)',
    }}
  >
    <span className={highlight ? 'text-warning-amber' : 'text-white/40'}>
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-white/50">{label}</p>
      <p
        className={`text-sm font-medium ${
          highlight ? 'text-warning-amber' : 'text-white/80'
        }`}
      >
        {value}
      </p>
    </div>
  </div>
);

export default WeatherWidget;
