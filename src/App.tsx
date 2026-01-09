/**
 * AICO Smart Home - Main Application
 *
 * Ultra-luxury wall-mounted home intelligence system.
 * Spatial computing interface with glassmorphism design.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Thermometer,
  Lightbulb,
  Shield,
  Zap,
  Music,
  Settings,
  Bell,
  User,
  X,
} from 'lucide-react';
import { DigitalTwin, useSceneStore } from './3d';
import { useContextStore, startContextTimeUpdater, startIdleTimeTracker } from './ui/context';
import { demoResidence } from './data/demo-residence';
import {
  GlassCard,
  GlassIconButton,
  GlassSidebar,
  GlassModal,
  type NavItem,
} from './ui/glass';
import { WeatherWidget, EnergyWidget, EmotionalStateWidget } from './ui/widgets';
import {
  ClimateScreen,
  LightingScreen,
  SecurityScreen,
  EnergyScreen,
  MediaScreen,
  SettingsScreen,
} from './ui/screens';
import type { WeatherData, EnergyData, EmotionalStateData } from './ui/widgets';
import type { DeviceId, RoomId, FloorId } from './types/core';

// Import Tailwind styles
import './styles/tailwind.css';

// ============================================================================
// Demo Data
// ============================================================================

const demoWeatherData: WeatherData = {
  temperature: 24,
  feelsLike: 26,
  condition: 'clear',
  humidity: 45,
  windSpeed: 12,
  visibility: 10,
  uvIndex: 4,
  isDay: true,
  forecast: [
    { time: '14:00', temp: 25, condition: 'clear' },
    { time: '17:00', temp: 23, condition: 'cloudy' },
    { time: '20:00', temp: 20, condition: 'clear' },
    { time: '23:00', temp: 18, condition: 'clear' },
    { time: '02:00', temp: 16, condition: 'clear' },
  ],
};

const demoEnergyData: EnergyData = {
  currentPower: 2340,
  todayUsage: 18.5,
  monthlyUsage: 342,
  solarGeneration: 1850,
  batteryLevel: 78,
  trend: 'down',
  trendPercent: 12,
  breakdown: [
    { category: 'climate', power: 1200, percentage: 51 },
    { category: 'lighting', power: 340, percentage: 15 },
    { category: 'appliances', power: 600, percentage: 26 },
    { category: 'other', power: 200, percentage: 8 },
  ],
};

const demoEmotionalData: EmotionalStateData = {
  currentMood: 'relaxed',
  comfortScore: 92,
  occupants: 2,
  activeScenes: ['Evening Ambiance', 'Background Music'],
  ambientFactors: {
    lighting: 'dim',
    temperature: 'warm',
    sound: 'ambient',
  },
  suggestions: ['Consider activating "Wind Down" mode in 30 minutes'],
};

// ============================================================================
// Navigation Items
// ============================================================================

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'climate', label: 'Climate', icon: Thermometer },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  { id: 'security', label: 'Security', icon: Shield, badge: 2 },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'media', label: 'Media', icon: Music },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ============================================================================
// Screen Title Map
// ============================================================================

const screenTitles: Record<string, string> = {
  climate: 'Climate Control',
  lighting: 'Lighting',
  security: 'Security',
  energy: 'Energy',
  media: 'Media',
  settings: 'Settings',
};

// ============================================================================
// Main App Component
// ============================================================================

export const App: React.FC = () => {
  const { theme, context, transitionInProgress } = useContextStore();
  const [initialized, setInitialized] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPanelFocused, setIsPanelFocused] = useState(false);

  // Determine if a screen should be shown
  const showScreen = activeNav !== 'home';

  useEffect(() => {
    const stopTimeUpdater = startContextTimeUpdater();
    const stopIdleTracker = startIdleTimeTracker();

    initializeSystem().then(() => {
      setInitialized(true);
    });

    return () => {
      stopTimeUpdater();
      stopIdleTracker();
    };
  }, []);

  // Update blur state when navigating
  useEffect(() => {
    setIsPanelFocused(showScreen);
  }, [showScreen]);

  const handleDeviceClick = useCallback((deviceId: DeviceId) => {
    console.log('Device clicked:', deviceId);
    setIsPanelFocused(true);
  }, []);

  const handleRoomClick = useCallback((roomId: RoomId) => {
    console.log('Room clicked:', roomId);
  }, []);

  const handleFloorClick = useCallback((floorId: FloorId) => {
    console.log('Floor clicked:', floorId);
  }, []);

  const handleNavSelect = useCallback((id: string) => {
    setActiveNav(id);
  }, []);

  const handleCloseScreen = useCallback(() => {
    setActiveNav('home');
  }, []);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black font-display">
      {/* 3D Digital Twin Background */}
      <div className="absolute inset-0 z-0">
        <DigitalTwin
          onDeviceClick={handleDeviceClick}
          onRoomClick={handleRoomClick}
          onFloorClick={handleFloorClick}
          blurred={isPanelFocused}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        {/* Top Header Bar */}
        <motion.header
          className="pointer-events-auto"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <div
            className="mx-6 mt-4 px-6 py-4 rounded-2xl flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Left: Time & Weather */}
            <div className="flex items-center gap-8">
              <TimeDisplay />
              <div className="h-8 w-px bg-white/10" />
              <WeatherWidget data={demoWeatherData} compact />
            </div>

            {/* Center: Logo */}
            <Logo />

            {/* Right: User & Status */}
            <div className="flex items-center gap-4">
              <UserStatus user={context.user} />

              <GlassIconButton
                icon={<Bell size={20} />}
                label="Notifications"
                variant="ghost"
                onClick={() => setShowNotifications(true)}
              />

              <ResidenceModeBadge mode={context.residence.mode} />
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Floating Widget Panel (hidden when screen is open) */}
          <AnimatePresence>
            {!showScreen && (
              <motion.aside
                className="w-80 p-6 pointer-events-auto space-y-4"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <EnergyWidget data={demoEnergyData} />
                <EmotionalStateWidget data={demoEmotionalData} />
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Center - Screen Content Panel */}
          <AnimatePresence mode="wait">
            {showScreen && (
              <motion.div
                key={activeNav}
                className="flex-1 p-6 pointer-events-auto"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div
                  className="h-full rounded-3xl overflow-hidden relative bg-slate-50"
                  style={{
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25), 0 10px 30px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Screen Header with Close Button */}
                  <div className="absolute top-4 right-4 z-20">
                    <motion.button
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm"
                      whileHover={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        scale: 1.05,
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCloseScreen}
                    >
                      <X size={20} className="text-slate-500" />
                    </motion.button>
                  </div>

                  {/* Screen Content */}
                  <ScreenContent activeScreen={activeNav} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty space for 3D view when no screen */}
          {!showScreen && <div className="flex-1" />}

          {/* Right Side - Navigation Sidebar */}
          <motion.aside
            className="pointer-events-auto"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
          >
            <div className="h-full py-6 pr-6">
              <GlassSidebar
                items={navItems}
                activeId={activeNav}
                onSelect={handleNavSelect}
                collapsed={sidebarCollapsed}
              />
            </div>
          </motion.aside>
        </div>

        {/* Bottom Bar - Quick Actions (hidden when screen is open) */}
        <AnimatePresence>
          {!showScreen && (
            <motion.footer
              className="pointer-events-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div
                className="mx-6 mb-4 px-6 py-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <QuickScenes />
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>

      {/* Modals & Overlays */}
      <GlassModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        subtitle="Recent alerts and updates"
        position="right"
      >
        <NotificationsList />
      </GlassModal>
    </div>
  );
};

// ============================================================================
// Screen Content Router
// ============================================================================

interface ScreenContentProps {
  activeScreen: string;
}

const ScreenContent: React.FC<ScreenContentProps> = ({ activeScreen }) => {
  switch (activeScreen) {
    case 'climate':
      return <ClimateScreen />;
    case 'lighting':
      return <LightingScreen />;
    case 'security':
      return <SecurityScreen />;
    case 'energy':
      return <EnergyScreen />;
    case 'media':
      return <MediaScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return null;
  }
};

// ============================================================================
// Sub-components
// ============================================================================

const LoadingScreen: React.FC = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-black">
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo animation */}
      <motion.div
        className="relative w-24 h-24"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #00d4aa, #0066ff, #c9a962, #00d4aa)',
            opacity: 0.3,
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </motion.div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span
          className="text-3xl font-semibold tracking-[0.3em]"
          style={{
            background: 'linear-gradient(135deg, #00d4aa 0%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AICO
        </span>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="w-8 h-8 border-2 border-white/10 border-t-[#00d4aa] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />

      <motion.p
        className="text-white/40 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Initializing Smart Home System
      </motion.p>
    </motion.div>
  </div>
);

const Logo: React.FC = () => (
  <motion.div
    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400 }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 102, 255, 0.3) 100%)',
        boxShadow: '0 4px 20px rgba(0, 212, 170, 0.2)',
      }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
    <span
      className="text-xl font-semibold tracking-[0.2em]"
      style={{
        background: 'linear-gradient(135deg, #00d4aa 0%, #00a080 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      AICO
    </span>
  </motion.div>
);

const TimeDisplay: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <span className="text-2xl font-light text-white tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-xs text-white/50">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
};

const UserStatus: React.FC<{ user: any }> = ({ user }) => {
  if (!user) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5">
        <User size={18} className="text-white/60" />
        <span className="text-sm text-white/60">Guest</span>
      </div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-xl"
      style={{
        background: 'rgba(0, 212, 170, 0.1)',
        border: '1px solid rgba(0, 212, 170, 0.2)',
      }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4aa]/40 to-[#0066ff]/40 flex items-center justify-center">
        <span className="text-sm font-medium text-white">
          {user.name?.charAt(0) || 'U'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{user.name}</span>
        <span className="text-xs text-[#00d4aa]/80">Verified</span>
      </div>
    </motion.div>
  );
};

const ResidenceModeBadge: React.FC<{ mode: string }> = ({ mode }) => {
  const modeConfig: Record<string, { color: string; bg: string }> = {
    home: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    away: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
    night: { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
    vacation: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    guest: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
    party: { color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
    cinema: { color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' },
    emergency: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
    lockdown: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  };

  const config = modeConfig[mode] || modeConfig.home;
  const isAlert = mode === 'emergency' || mode === 'lockdown';

  return (
    <motion.div
      className="px-4 py-2 rounded-xl text-sm font-medium capitalize"
      style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}30`,
      }}
      animate={isAlert ? { scale: [1, 1.02, 1] } : {}}
      transition={isAlert ? { duration: 1, repeat: Infinity } : {}}
    >
      {mode} Mode
    </motion.div>
  );
};

const QuickScenes: React.FC = () => {
  const scenes = [
    { id: 'morning', name: 'Morning Boost', icon: '🌅', color: '#fcd34d' },
    { id: 'focus', name: 'Deep Focus', icon: '🎯', color: '#0066ff' },
    { id: 'relax', name: 'Relaxation', icon: '🧘', color: '#00d4aa' },
    { id: 'movie', name: 'Cinema', icon: '🎬', color: '#a78bfa' },
    { id: 'dinner', name: 'Dinner Party', icon: '🍷', color: '#f472b6' },
    { id: 'sleep', name: 'Sleep Mode', icon: '🌙', color: '#818cf8' },
  ];

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-white/50 uppercase tracking-wider">Quick Scenes</span>
      <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar">
        {scenes.map((scene, index) => (
          <motion.button
            key={scene.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.05 }}
            whileHover={{
              background: `${scene.color}20`,
              borderColor: `${scene.color}40`,
              scale: 1.02,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg">{scene.icon}</span>
            <span className="text-sm font-medium text-white/80">{scene.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const NotificationsList: React.FC = () => {
  const notifications = [
    {
      id: 1,
      type: 'info',
      title: 'Front Door Unlocked',
      message: 'The front door was unlocked 5 minutes ago',
      time: '5 min ago',
    },
    {
      id: 2,
      type: 'success',
      title: 'Energy Goal Achieved',
      message: "You've reduced energy usage by 15% this week",
      time: '1 hour ago',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Motion Detected',
      message: 'Motion detected in backyard camera',
      time: '2 hours ago',
    },
  ];

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <motion.div
          key={notification.id}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white">{notification.title}</p>
              <p className="text-xs text-white/50 mt-1">{notification.message}</p>
            </div>
            <span className="text-xs text-white/40">{notification.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Initialization
// ============================================================================

async function initializeSystem(): Promise<void> {
  console.log('AICO Smart Home System initializing...');

  // Simulate initialization delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Load demo residence into scene
  const { loadScene } = useSceneStore.getState();
  loadScene(demoResidence);

  console.log('System initialized with demo residence:', demoResidence.name);
}

export default App;
