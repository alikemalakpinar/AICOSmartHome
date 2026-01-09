/**
 * Security Control Screen
 *
 * Security system management with cameras, locks,
 * alarm status, and access logs.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Lock,
  Unlock,
  Bell,
  BellOff,
  Eye,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassToggle } from '../glass';

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
  { id: 'front', name: 'Front Door', isLocked: true, lastActivity: '2 hours ago' },
  { id: 'back', name: 'Back Door', isLocked: true, lastActivity: '5 hours ago' },
  { id: 'garage', name: 'Garage Door', isLocked: false, lastActivity: '30 min ago' },
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
  const [sirenEnabled, setSirenEnabled] = useState(true);

  const modes: { id: SecurityMode; label: string; icon: typeof Shield; color: string }[] = [
    { id: 'disarmed', label: 'Disarmed', icon: Shield, color: '#64748b' },
    { id: 'home', label: 'Home', icon: ShieldCheck, color: '#10b981' },
    { id: 'away', label: 'Away', icon: ShieldAlert, color: '#f59e0b' },
    { id: 'night', label: 'Night', icon: Shield, color: '#818cf8' },
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
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Security Status */}
      <GlassCard variant="elevated" size="lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: `${currentMode.color}20`,
                boxShadow: `0 0 30px ${currentMode.color}30`,
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <currentMode.icon size={32} style={{ color: currentMode.color }} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Security System</h2>
              <p className="text-sm" style={{ color: currentMode.color }}>
                {currentMode.label} Mode Active
              </p>
            </div>
          </div>
          <GlassToggle
            enabled={sirenEnabled}
            onChange={setSirenEnabled}
            label="Siren"
            size="md"
          />
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-4 gap-3">
          {modes.map(mode => (
            <motion.button
              key={mode.id}
              className="flex flex-col items-center gap-2 py-4 rounded-xl"
              style={{
                background: securityMode === mode.id ? `${mode.color}20` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${securityMode === mode.id ? `${mode.color}50` : 'rgba(255, 255, 255, 0.1)'}`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSecurityMode(mode.id)}
            >
              <mode.icon
                size={24}
                style={{ color: securityMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.5)' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: securityMode === mode.id ? mode.color : 'rgba(255, 255, 255, 0.5)' }}
              >
                {mode.label}
              </span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Camera Feeds */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Camera Feeds</h3>
        <div className="grid grid-cols-2 gap-4">
          {demoCameras.map(camera => (
            <motion.div
              key={camera.id}
              className={`relative rounded-xl overflow-hidden cursor-pointer ${
                selectedCamera === camera.id ? 'ring-2 ring-teal-glow' : ''
              }`}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedCamera(camera.id)}
            >
              {/* Camera Preview Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <Camera size={40} className="text-white/20" />
              </div>

              {/* Overlay Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{camera.name}</p>
                    <p className="text-xs text-white/50">{camera.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {camera.hasMotion && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-warning-amber/20 text-warning-amber">
                        Motion
                      </span>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        camera.isOnline ? 'bg-success-green' : 'bg-error-red'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Door Locks */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Door Locks</h3>
        <div className="space-y-3">
          {locks.map(lock => (
            <GlassCard key={lock.id} variant="subtle" size="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: lock.isLocked
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    }}
                  >
                    {lock.isLocked ? (
                      <Lock size={22} className="text-success-green" />
                    ) : (
                      <Unlock size={22} className="text-error-red" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{lock.name}</p>
                    <p className="text-xs text-white/50">Last activity: {lock.lastActivity}</p>
                  </div>
                </div>
                <GlassButton
                  variant={lock.isLocked ? 'primary' : 'danger'}
                  size="sm"
                  onClick={() => toggleLock(lock.id)}
                >
                  {lock.isLocked ? 'Unlock' : 'Lock'}
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <GlassCard variant="subtle" size="md" noPadding>
          <div className="divide-y divide-white/10">
            {demoLogs.map(log => (
              <div key={log.id} className="flex items-center gap-4 p-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      log.type === 'alert'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : log.type === 'warning'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {log.type === 'alert' ? (
                    <AlertTriangle size={18} className="text-error-red" />
                  ) : log.type === 'warning' ? (
                    <Eye size={18} className="text-warning-amber" />
                  ) : (
                    <Clock size={18} className="text-white/50" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{log.event}</p>
                  <p className="text-xs text-white/50">{log.location}</p>
                </div>
                <span className="text-xs text-white/40">{log.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SecurityScreen;
