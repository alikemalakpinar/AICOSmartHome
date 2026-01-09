/**
 * AICO Living Home - A Sentient Dwelling
 *
 * Not a smart home. A living organism that anticipates,
 * adapts, and breathes with its inhabitants.
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
  Sunrise,
  Focus,
  Leaf,
  Film,
  Wine,
  Moon,
  Activity,
  Heart,
  Cloud,
  Sun,
  Droplets,
  Wind,
} from 'lucide-react';
import { DigitalTwin, useSceneStore } from './3d';
import { useContextStore, startContextTimeUpdater, startIdleTimeTracker } from './ui/context';
import { demoResidence } from './data/demo-residence';
import {
  ClimateScreen,
  LightingScreen,
  SecurityScreen,
  EnergyScreen,
  MediaScreen,
  SettingsScreen,
} from './ui/screens';
import type { DeviceId, RoomId, FloorId } from './types/core';

// Import Tailwind styles
import './styles/tailwind.css';

// ============================================================================
// Navigation Items
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Sanctuary', icon: Home },
  { id: 'climate', label: 'Atmosphere', icon: Thermometer },
  { id: 'lighting', label: 'Illumination', icon: Lightbulb },
  { id: 'security', label: 'Protection', icon: Shield, badge: 2 },
  { id: 'energy', label: 'Vitality', icon: Zap },
  { id: 'media', label: 'Harmony', icon: Music },
  { id: 'settings', label: 'Essence', icon: Settings },
];

// ============================================================================
// Scene Definitions with Premium Icons
// ============================================================================

interface Scene {
  id: string;
  name: string;
  icon: typeof Sunrise;
  color: string;
  description: string;
}

const scenes: Scene[] = [
  { id: 'morning', name: 'Awaken', icon: Sunrise, color: '#f59e0b', description: 'Gentle morning rise' },
  { id: 'focus', name: 'Focus', icon: Focus, color: '#3b82f6', description: 'Deep concentration' },
  { id: 'relax', name: 'Serenity', icon: Leaf, color: '#10b981', description: 'Calm and peaceful' },
  { id: 'cinema', name: 'Cinema', icon: Film, color: '#8b5cf6', description: 'Immersive viewing' },
  { id: 'dinner', name: 'Gather', icon: Wine, color: '#ec4899', description: 'Intimate dining' },
  { id: 'sleep', name: 'Dormant', icon: Moon, color: '#6366f1', description: 'Restful slumber' },
];

// ============================================================================
// Main App Component
// ============================================================================

export const App: React.FC = () => {
  const { context } = useContextStore();
  const [initialized, setInitialized] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isPanelFocused, setIsPanelFocused] = useState(false);

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

  useEffect(() => {
    setIsPanelFocused(showScreen);
  }, [showScreen]);

  const handleDeviceClick = useCallback((deviceId: DeviceId) => {
    console.log('Device awakened:', deviceId);
    setIsPanelFocused(true);
  }, []);

  const handleRoomClick = useCallback((roomId: RoomId) => {
    console.log('Room focused:', roomId);
  }, []);

  const handleFloorClick = useCallback((floorId: FloorId) => {
    console.log('Floor selected:', floorId);
  }, []);

  const handleNavSelect = useCallback((id: string) => {
    setActiveNav(id);
  }, []);

  const handleCloseScreen = useCallback(() => {
    setActiveNav('home');
  }, []);

  const handleSceneActivate = useCallback((sceneId: string) => {
    setActiveScene(activeScene === sceneId ? null : sceneId);
    console.log(`Scene ${sceneId} ${activeScene === sceneId ? 'dormant' : 'awakened'}`);
  }, [activeScene]);

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white font-display">
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
        {/* Top Header Bar - White Theme */}
        <motion.header
          className="pointer-events-auto"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        >
          <div className="mx-6 mt-4 px-6 py-4 rounded-2xl flex items-center justify-between bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/50">
            {/* Left: Time & Conditions */}
            <div className="flex items-center gap-6">
              <TimeDisplay />
              <div className="h-8 w-px bg-slate-200" />
              <WeatherConditions />
            </div>

            {/* Center: Logo */}
            <Logo />

            {/* Right: User & Vitals */}
            <div className="flex items-center gap-3">
              <VitalsBadge />

              <motion.button
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500"
                whileHover={{ backgroundColor: '#f8fafc', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(true)}
              >
                <Bell size={18} />
              </motion.button>

              <ResidenceModeBadge mode={context.residence.mode} />
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Organic Widgets */}
          <AnimatePresence>
            {!showScreen && (
              <motion.aside
                className="w-80 p-6 pointer-events-auto space-y-4"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <HomeVitalsWidget />
                <AtmosphereWidget />
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
                <div className="h-full rounded-3xl overflow-hidden relative bg-white shadow-2xl shadow-slate-300/50 border border-slate-200/60">
                  {/* Close Button */}
                  <div className="absolute top-4 right-4 z-20">
                    <motion.button
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200"
                      whileHover={{ backgroundColor: '#f1f5f9', scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCloseScreen}
                    >
                      <X size={18} className="text-slate-500" />
                    </motion.button>
                  </div>

                  <ScreenContent activeScreen={activeNav} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showScreen && <div className="flex-1" />}

          {/* Right Side - Navigation */}
          <motion.aside
            className="pointer-events-auto"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
          >
            <div className="h-full py-6 pr-6">
              <NavigationSidebar
                items={navItems}
                activeId={activeNav}
                onSelect={handleNavSelect}
              />
            </div>
          </motion.aside>
        </div>

        {/* Bottom Bar - Scene Selection */}
        <AnimatePresence>
          {!showScreen && (
            <motion.footer
              className="pointer-events-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mx-6 mb-4 px-6 py-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-lg shadow-slate-200/50">
                <QuickScenes
                  scenes={scenes}
                  activeScene={activeScene}
                  onActivate={handleSceneActivate}
                />
              </div>
            </motion.footer>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationsModal onClose={() => setShowNotifications(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Screen Content Router
// ============================================================================

const ScreenContent: React.FC<{ activeScreen: string }> = ({ activeScreen }) => {
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
// White Theme Navigation Sidebar
// ============================================================================

const NavigationSidebar: React.FC<{
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ items, activeId, onSelect }) => {
  return (
    <motion.aside
      className="h-full flex flex-col w-72 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg shadow-slate-200/50"
      initial={{ width: 280 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-semibold tracking-wider bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            AICO
          </span>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Living Home</p>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <motion.button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-sm transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              onClick={() => onSelect(item.id)}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Icon size={20} className={isActive ? 'text-teal-600' : ''} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="mx-4 h-px bg-slate-100" />

      {/* System Status */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50">
          <Activity size={16} className="text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">All vitals nominal</span>
        </div>
      </div>
    </motion.aside>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

const LoadingScreen: React.FC = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-white to-slate-50">
    <motion.div
      className="flex flex-col items-center gap-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative w-20 h-20"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl shadow-teal-500/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      </motion.div>

      <div className="text-center">
        <span className="text-2xl font-semibold tracking-[0.3em] bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
          AICO
        </span>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Awakening</p>
      </div>

      <motion.div
        className="w-6 h-6 border-2 border-slate-200 border-t-teal-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  </div>
);

const Logo: React.FC = () => (
  <motion.div
    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
    whileHover={{ scale: 1.02 }}
  >
    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/20">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
    <span className="text-lg font-semibold tracking-[0.15em] bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
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
      <span className="text-2xl font-light text-slate-900 tabular-nums">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-xs text-slate-400">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
};

const WeatherConditions: React.FC = () => (
  <div className="flex items-center gap-3">
    <Sun size={20} className="text-amber-500" />
    <div className="flex flex-col">
      <span className="text-lg font-medium text-slate-900">24°</span>
      <span className="text-xs text-slate-400">Clear skies</span>
    </div>
    <div className="flex items-center gap-2 ml-3 text-slate-400">
      <div className="flex items-center gap-1">
        <Droplets size={14} />
        <span className="text-xs">45%</span>
      </div>
      <div className="flex items-center gap-1">
        <Wind size={14} />
        <span className="text-xs">12km/h</span>
      </div>
    </div>
  </div>
);

const VitalsBadge: React.FC = () => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
    <Heart size={16} className="text-emerald-500" />
    <span className="text-sm font-medium text-emerald-700">Healthy</span>
  </div>
);

const ResidenceModeBadge: React.FC<{ mode: string }> = ({ mode }) => {
  const modeConfig: Record<string, { color: string; bg: string; border: string }> = {
    home: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    away: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    night: { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    vacation: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    guest: { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  };

  const config = modeConfig[mode] || modeConfig.home;

  return (
    <div className={`px-3 py-2 rounded-xl text-sm font-medium capitalize ${config.bg} ${config.color} border ${config.border}`}>
      {mode === 'home' ? 'Present' : mode} Mode
    </div>
  );
};

const HomeVitalsWidget: React.FC = () => (
  <motion.div
    className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/60 shadow-lg shadow-slate-200/50"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
        <Activity size={20} className="text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">Home Vitals</h3>
        <p className="text-xs text-slate-400">Real-time pulse</p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Energy Flow</span>
        <span className="text-sm font-medium text-slate-900">2.4 kW</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: '65%' }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-xl bg-amber-50">
          <p className="text-xs text-amber-600">Solar</p>
          <p className="text-lg font-semibold text-amber-700">1.8 kW</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50">
          <p className="text-xs text-emerald-600">Saving</p>
          <p className="text-lg font-semibold text-emerald-700">+12%</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const AtmosphereWidget: React.FC = () => (
  <motion.div
    className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/60 shadow-lg shadow-slate-200/50"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
        <Cloud size={20} className="text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">Atmosphere</h3>
        <p className="text-xs text-slate-400">Comfort envelope</p>
      </div>
    </div>

    <div className="flex items-center justify-center py-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-light text-violet-700">92</p>
            <p className="text-xs text-violet-500">Comfort</p>
          </div>
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-violet-300"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>

    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
      <Leaf size={14} className="text-emerald-500" />
      <span>Relaxed & Balanced</span>
    </div>
  </motion.div>
);

const QuickScenes: React.FC<{
  scenes: Scene[];
  activeScene: string | null;
  onActivate: (id: string) => void;
}> = ({ scenes, activeScene, onActivate }) => (
  <div className="flex items-center gap-4">
    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Scenes</span>
    <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
      {scenes.map((scene, index) => {
        const Icon = scene.icon;
        const isActive = activeScene === scene.id;

        return (
          <motion.button
            key={scene.id}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
            onClick={() => onActivate(scene.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon size={18} style={{ color: isActive ? 'white' : scene.color }} />
            <span className="text-sm font-medium">{scene.name}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);

const NotificationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const notifications = [
    { id: 1, icon: Shield, title: 'Front Door Unlocked', message: 'Access granted 5 minutes ago', time: '5m', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: Zap, title: 'Energy Milestone', message: 'Reduced consumption by 15%', time: '1h', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: Activity, title: 'Motion Sensed', message: 'Backyard activity detected', time: '2h', color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-6 top-24 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <motion.div
                key={n.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`w-10 h-10 rounded-xl ${n.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={n.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
                <span className="text-xs text-slate-400">{n.time}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Initialization
// ============================================================================

async function initializeSystem(): Promise<void> {
  console.log('AICO Living Home awakening...');
  await new Promise(resolve => setTimeout(resolve, 1500));

  const { loadScene } = useSceneStore.getState();
  loadScene(demoResidence);

  console.log('System vitals nominal:', demoResidence.name);
}

export default App;
