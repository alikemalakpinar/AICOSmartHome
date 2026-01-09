/**
 * Security Control Screen
 *
 * Beautiful security management with cameras, locks, and activity logs
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Lock,
  Unlock,
  Bell,
  Eye,
  Clock,
  AlertTriangle,
  Home,
  Moon,
} from 'lucide-react';

type SecurityMode = 'disarmed' | 'home' | 'away' | 'night';

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  isOnline: boolean;
  hasMotion: boolean;
}

interface DoorLock {
  id: string;
  name: string;
  icon: string;
  isLocked: boolean;
  lastActivity: string;
}

interface AccessLog {
  id: string;
  event: string;
  location: string;
  time: string;
  type: 'info' | 'warning' | 'alert';
}

const demoCameras: CameraFeed[] = [
  { id: 'front', name: 'Front Door', location: 'Entrance', isOnline: true, hasMotion: false },
  { id: 'back', name: 'Backyard', location: 'Garden', isOnline: true, hasMotion: true },
  { id: 'garage', name: 'Garage', location: 'Parking', isOnline: true, hasMotion: false },
  { id: 'living', name: 'Living Room', location: 'Indoor', isOnline: false, hasMotion: false },
];

const demoLocks: DoorLock[] = [
  { id: 'front', name: 'Front Door', icon: '🚪', isLocked: true, lastActivity: '2 hours ago' },
  { id: 'back', name: 'Back Door', icon: '🚪', isLocked: true, lastActivity: '5 hours ago' },
  { id: 'garage', name: 'Garage Door', icon: '🚗', isLocked: false, lastActivity: '30 min ago' },
];

const demoLogs: AccessLog[] = [
  { id: '1', event: 'Front door unlocked', location: 'Entrance', time: '10:30 AM', type: 'info' },
  { id: '2', event: 'Motion detected', location: 'Backyard', time: '10:15 AM', type: 'warning' },
  { id: '3', event: 'Garage door opened', location: 'Garage', time: '9:45 AM', type: 'info' },
  { id: '4', event: 'Failed access attempt', location: 'Front Door', time: '9:30 AM', type: 'alert' },
];

export const SecurityScreen: React.FC = () => {
  const [securityMode, setSecurityMode] = useState<SecurityMode>('home');
  const [locks, setLocks] = useState(demoLocks);
  const [selectedCamera, setSelectedCamera] = useState<string | null>('front');

  const modes: { id: SecurityMode; label: string; icon: typeof Shield; color: string; bgColor: string }[] = [
    { id: 'disarmed', label: 'Disarmed', icon: Shield, color: '#64748b', bgColor: '#f1f5f9' },
    { id: 'home', label: 'Home', icon: Home, color: '#10b981', bgColor: '#d1fae5' },
    { id: 'away', label: 'Away', icon: ShieldAlert, color: '#f59e0b', bgColor: '#fef3c7' },
    { id: 'night', label: 'Night', icon: Moon, color: '#8b5cf6', bgColor: '#ede9fe' },
  ];

  const toggleLock = (id: string) => {
    setLocks(prev =>
      prev.map(lock =>
        lock.id === id ? { ...lock, isLocked: !lock.isLocked } : lock
      )
    );
  };

  const currentMode = modes.find(m => m.id === securityMode)!;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Security</h1>
            <p className="text-slate-500 text-sm mt-0.5">Protect your home</p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: currentMode.bgColor, color: currentMode.color }}
          >
            <currentMode.icon size={12} className="mr-1.5" />
            {currentMode.label} Mode
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-3xl mx-auto">
          {/* Security Status Card */}
          <motion.div
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: currentMode.bgColor }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShieldCheck size={32} style={{ color: currentMode.color }} />
              </motion.div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Security System</h2>
                <p className="text-sm" style={{ color: currentMode.color }}>
                  {currentMode.label} Mode Active
                </p>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-4 gap-2">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  onClick={() => setSecurityMode(mode.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    securityMode === mode.id
                      ? 'ring-2'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  style={{
                    backgroundColor: securityMode === mode.id ? mode.bgColor : undefined,
                    ringColor: securityMode === mode.id ? mode.color : undefined,
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <mode.icon
                    size={22}
                    style={{ color: securityMode === mode.id ? mode.color : '#94a3b8' }}
                  />
                  <span className={`text-xs font-medium ${
                    securityMode === mode.id ? '' : 'text-slate-500'
                  }`} style={{ color: securityMode === mode.id ? mode.color : undefined }}>
                    {mode.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Camera Feeds */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Camera Feeds</h3>
            <div className="grid grid-cols-2 gap-3">
              {demoCameras.map((camera) => (
                <motion.div
                  key={camera.id}
                  className={`relative rounded-xl overflow-hidden cursor-pointer ${
                    selectedCamera === camera.id ? 'ring-2 ring-teal-400' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  {/* Camera Preview Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <Camera size={32} className="text-slate-400" />
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{camera.name}</p>
                        <p className="text-xs text-white/70">{camera.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {camera.hasMotion && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/90 text-white">
                            Motion
                          </span>
                        )}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            camera.isOnline ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Door Locks */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Door Locks</h3>
            <div className="space-y-2">
              {locks.map((lock, index) => (
                <motion.div
                  key={lock.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + index * 0.03 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        lock.isLocked ? 'bg-emerald-100' : 'bg-red-100'
                      }`}
                    >
                      {lock.isLocked ? (
                        <Lock size={20} className="text-emerald-600" />
                      ) : (
                        <Unlock size={20} className="text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{lock.name}</p>
                      <p className="text-xs text-slate-400">Last: {lock.lastActivity}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => toggleLock(lock.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      lock.isLocked
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {lock.isLocked ? 'Unlock' : 'Lock'}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Activity</h3>
              <button className="text-xs text-teal-600 font-medium hover:text-teal-700">
                View All
              </button>
            </div>
            <div className="space-y-1">
              {demoLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.17 + index * 0.02 }}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      log.type === 'alert'
                        ? 'bg-red-100'
                        : log.type === 'warning'
                          ? 'bg-amber-100'
                          : 'bg-slate-100'
                    }`}
                  >
                    {log.type === 'alert' ? (
                      <AlertTriangle size={16} className="text-red-500" />
                    ) : log.type === 'warning' ? (
                      <Eye size={16} className="text-amber-500" />
                    ) : (
                      <Clock size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">{log.event}</p>
                    <p className="text-xs text-slate-400">{log.location}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{log.time}</span>
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

export default SecurityScreen;
