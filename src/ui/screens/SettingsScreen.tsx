/**
 * Settings Screen
 *
 * System configuration, preferences, and
 * account management.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Wifi,
  Palette,
  Globe,
  Moon,
  Volume2,
  Smartphone,
  HardDrive,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react';
import { GlassCard, GlassToggle, GlassButton } from '../glass';

interface SettingSection {
  id: string;
  title: string;
  icon: typeof Settings;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select' | 'action';
  value?: boolean | string;
}

const settingsSections: SettingSection[] = [
  {
    id: 'account',
    title: 'Account',
    icon: User,
    items: [
      { id: 'profile', label: 'Profile Settings', type: 'action' },
      { id: 'biometric', label: 'Biometric Login', description: 'Face ID & fingerprint', type: 'toggle', value: true },
      { id: 'family', label: 'Family Members', description: '4 members', type: 'action' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    items: [
      { id: 'push', label: 'Push Notifications', type: 'toggle', value: true },
      { id: 'sound', label: 'Notification Sounds', type: 'toggle', value: true },
      { id: 'alerts', label: 'Security Alerts', description: 'Always enabled for security', type: 'toggle', value: true },
      { id: 'energy', label: 'Energy Reports', description: 'Weekly summary', type: 'toggle', value: false },
    ],
  },
  {
    id: 'display',
    title: 'Display',
    icon: Palette,
    items: [
      { id: 'theme', label: 'Theme', description: 'Dark', type: 'select', value: 'dark' },
      { id: 'autoNight', label: 'Auto Night Mode', type: 'toggle', value: true },
      { id: 'brightness', label: 'Auto Brightness', type: 'toggle', value: true },
      { id: 'animations', label: 'Reduce Animations', type: 'toggle', value: false },
    ],
  },
  {
    id: 'network',
    title: 'Network',
    icon: Wifi,
    items: [
      { id: 'wifi', label: 'WiFi Network', description: 'AICO_Home_5G', type: 'action' },
      { id: 'bridge', label: 'Bridge Status', description: 'All systems online', type: 'action' },
      { id: 'remote', label: 'Remote Access', type: 'toggle', value: true },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    items: [
      { id: 'camera', label: 'Camera Privacy Mode', type: 'toggle', value: false },
      { id: 'voice', label: 'Voice Recording', description: 'Store voice commands', type: 'toggle', value: true },
      { id: 'data', label: 'Data Sharing', description: 'Anonymized analytics', type: 'toggle', value: true },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: HardDrive,
    items: [
      { id: 'language', label: 'Language', description: 'English', type: 'select', value: 'en' },
      { id: 'updates', label: 'Auto Updates', type: 'toggle', value: true },
      { id: 'backup', label: 'Cloud Backup', description: 'Last: Today, 10:30 AM', type: 'action' },
      { id: 'reset', label: 'Reset Settings', type: 'action' },
    ],
  },
];

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, boolean | string>>({
    biometric: true,
    push: true,
    sound: true,
    alerts: true,
    energy: false,
    autoNight: true,
    brightness: true,
    animations: false,
    remote: true,
    camera: false,
    voice: true,
    data: true,
    updates: true,
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const toggleSetting = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Settings</h2>
          <p className="text-white/50 text-sm mt-1">Configure your smart home</p>
        </div>
        <GlassButton variant="ghost" size="sm" icon={<Info size={18} />}>
          Help
        </GlassButton>
      </div>

      {/* User Card */}
      <GlassCard variant="elevated" size="md">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 102, 255, 0.3) 100%)',
            }}
          >
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Homeowner</h3>
            <p className="text-sm text-white/50">homeowner@aico.home</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-success-green" />
              <span className="text-xs text-success-green">Premium Plan</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-white/30" />
        </div>
      </GlassCard>

      {/* Settings Sections */}
      <div className="space-y-4">
        {settingsSections.map(section => (
          <GlassCard key={section.id} variant="default" size="md" noPadding>
            {/* Section Header */}
            <motion.button
              className="w-full flex items-center gap-4 p-4"
              onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <section.icon size={20} className="text-white/70" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-white font-medium">{section.title}</h4>
                <p className="text-xs text-white/50">{section.items.length} settings</p>
              </div>
              <motion.div
                animate={{ rotate: selectedSection === section.id ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={20} className="text-white/30" />
              </motion.div>
            </motion.button>

            {/* Section Items */}
            <motion.div
              initial={false}
              animate={{
                height: selectedSection === section.id ? 'auto' : 0,
                opacity: selectedSection === section.id ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10">
                {section.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      index < section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-white/50">{item.description}</p>
                      )}
                    </div>

                    {item.type === 'toggle' && (
                      <GlassToggle
                        enabled={settings[item.id] as boolean}
                        onChange={() => toggleSetting(item.id)}
                        size="sm"
                      />
                    )}

                    {item.type === 'select' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                        <span className="text-sm text-white/70">{item.value}</span>
                        <ChevronRight size={14} className="text-white/30" />
                      </div>
                    )}

                    {item.type === 'action' && (
                      <ChevronRight size={18} className="text-white/30" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </GlassCard>
        ))}
      </div>

      {/* Version Info */}
      <div className="text-center py-6">
        <p className="text-xs text-white/30">AICO Smart Home v2.0.0</p>
        <p className="text-xs text-white/20 mt-1">Build 2024.01.15</p>
      </div>
    </div>
  );
};

export default SettingsScreen;
