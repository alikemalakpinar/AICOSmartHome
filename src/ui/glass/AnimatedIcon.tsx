/**
 * AnimatedIcon Component
 *
 * Animated icon wrappers with hover effects, state transitions,
 * and smooth micro-interactions for the luxury interface.
 */

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Home,
  Thermometer,
  Lightbulb,
  LightbulbOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ZapOff,
  Music,
  Pause,
  Play,
  Settings,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  ThermometerSun,
  ThermometerSnowflake,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  BatteryLow,
  Power,
  PowerOff,
  Camera,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  Users,
  Heart,
  Star,
  Bookmark,
  Share,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Maximize,
  Minimize,
  Move,
  Layers,
  Grid,
  List,
  Activity,
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Hash,
  type LucideIcon,
} from 'lucide-react';

// Icon name to component mapping
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  thermometer: Thermometer,
  lightbulb: Lightbulb,
  'lightbulb-off': LightbulbOff,
  shield: Shield,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,
  zap: Zap,
  'zap-off': ZapOff,
  music: Music,
  pause: Pause,
  play: Play,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  wind: Wind,
  droplets: Droplets,
  'thermometer-sun': ThermometerSun,
  'thermometer-snowflake': ThermometerSnowflake,
  lock: Lock,
  unlock: Unlock,
  bell: Bell,
  'bell-off': BellOff,
  wifi: Wifi,
  'wifi-off': WifiOff,
  battery: Battery,
  'battery-charging': BatteryCharging,
  'battery-low': BatteryLow,
  power: Power,
  'power-off': PowerOff,
  camera: Camera,
  video: Video,
  mic: Mic,
  'mic-off': MicOff,
  volume: Volume2,
  'volume-off': VolumeX,
  eye: Eye,
  'eye-off': EyeOff,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  info: Info,
  'help-circle': HelpCircle,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  plus: Plus,
  minus: Minus,
  x: X,
  menu: Menu,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  search: Search,
  filter: Filter,
  clock: Clock,
  calendar: Calendar,
  user: User,
  users: Users,
  heart: Heart,
  star: Star,
  bookmark: Bookmark,
  share: Share,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  'rotate-ccw': RotateCcw,
  maximize: Maximize,
  minimize: Minimize,
  move: Move,
  layers: Layers,
  grid: Grid,
  list: List,
  activity: Activity,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  dollar: DollarSign,
  percent: Percent,
  hash: Hash,
};

export type IconName = keyof typeof iconMap;

export interface AnimatedIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  animation?: 'none' | 'pulse' | 'spin' | 'bounce' | 'shake' | 'glow';
  hoverAnimation?: 'scale' | 'rotate' | 'glow' | 'bounce' | 'none';
  active?: boolean;
  activeColor?: string;
  className?: string;
  onClick?: () => void;
}

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const spinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const bounceVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const shakeVariants: Variants = {
  animate: {
    rotate: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

const glowVariants: Variants = {
  animate: {
    filter: [
      'drop-shadow(0 0 4px currentColor)',
      'drop-shadow(0 0 12px currentColor)',
      'drop-shadow(0 0 4px currentColor)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const animationVariantsMap = {
  none: {},
  pulse: pulseVariants,
  spin: spinVariants,
  bounce: bounceVariants,
  shake: shakeVariants,
  glow: glowVariants,
};

const hoverAnimations = {
  none: {},
  scale: { scale: 1.2 },
  rotate: { rotate: 90 },
  glow: { filter: 'drop-shadow(0 0 12px currentColor)' },
  bounce: { y: -4 },
};

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  animation = 'none',
  hoverAnimation = 'scale',
  active = false,
  activeColor = '#00d4aa',
  className = '',
  onClick,
}) => {
  const Icon = iconMap[name];

  if (!Icon) {
    console.warn(`AnimatedIcon: Unknown icon name "${name}"`);
    return null;
  }

  const variants = animationVariantsMap[animation];
  const hoverStyle = hoverAnimations[hoverAnimation];

  const currentColor = active ? activeColor : color;

  return (
    <motion.span
      className={`inline-flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ color: currentColor }}
      variants={variants}
      animate={animation !== 'none' ? 'animate' : undefined}
      whileHover={hoverAnimation !== 'none' ? hoverStyle : undefined}
      whileTap={onClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Icon size={size} strokeWidth={strokeWidth} />
    </motion.span>
  );
};

// Convenience components for common animated icons
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = '#00d4aa',
}) => (
  <AnimatedIcon name="refresh" size={size} color={color} animation="spin" hoverAnimation="none" />
);

export const PulsingAlert: React.FC<{ size?: number; variant?: 'warning' | 'error' | 'info' }> = ({
  size = 24,
  variant = 'warning',
}) => {
  const colors = {
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  };
  const icons: Record<string, IconName> = {
    warning: 'alert-triangle',
    error: 'alert-circle',
    info: 'info',
  };
  return (
    <AnimatedIcon
      name={icons[variant]}
      size={size}
      color={colors[variant]}
      animation="pulse"
      hoverAnimation="none"
    />
  );
};

export const GlowingStatus: React.FC<{
  size?: number;
  online?: boolean;
}> = ({ size = 20, online = true }) => (
  <AnimatedIcon
    name={online ? 'wifi' : 'wifi-off'}
    size={size}
    color={online ? '#10b981' : '#ef4444'}
    animation={online ? 'glow' : 'none'}
    hoverAnimation="scale"
  />
);

export default AnimatedIcon;
