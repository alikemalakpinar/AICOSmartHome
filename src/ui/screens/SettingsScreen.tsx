/**
 * Settings Screen
 *
 * Beautiful settings management with clean sections
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  User,
  Bell,
  Shield,
  Wifi,
  Palette,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: typeof Settings;
  color: string;
  bgColor: string;
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
    color: '#8b5cf6',
    bgColor: '#ede9fe',
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
    color: '#f59e0b',
    bgColor: '#fef3c7',
    items: [
      { id: 'push', label: 'Push Notifications', type: 'toggle', value: true },
      { id: 'sound', label: 'Notification Sounds', type: 'toggle', value: true },
      { id: 'alerts', label: 'Security Alerts', description: 'Always on', type: 'toggle', value: true },
      { id: 'energy', label: 'Energy Reports', description: 'Weekly summary', type: 'toggle', value: false },
    ],
  },
  {
    id: 'display',
    title: 'Display',
    icon: Palette,
    color: '#ec4899',
    bgColor: '#fce7f3',
    items: [
      { id: 'theme', label: 'Theme', description: 'Light', type: 'select', value: 'light' },
      { id: 'autoNight', label: 'Auto Night Mode', type: 'toggle', value: true },
      { id: 'brightness', label: 'Auto Brightness', type: 'toggle', value: true },
      { id: 'animations', label: 'Reduce Animations', type: 'toggle', value: false },
    ],
  },
  {
    id: 'network',
    title: 'Network',
    icon: Wifi,
    color: '#3b82f6',
    bgColor: '#dbeafe',
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
    color: '#10b981',
    bgColor: '#d1fae5',
    items: [
      { id: 'camera', label: 'Camera Privacy Mode', type: 'toggle', value: false },
      { id: 'voice', label: 'Voice Recording', description: 'Store commands', type: 'toggle', value: true },
      { id: 'data', label: 'Data Sharing', description: 'Anonymous analytics', type: 'toggle', value: true },
    ],
  },
  {
    id: 'system',
    title: 'System',
    icon: HardDrive,
    color: '#64748b',
    bgColor: '#f1f5f9',
    items: [
      { id: 'language', label: 'Language', description: 'English', type: 'select', value: 'en' },
      { id: 'updates', label: 'Auto Updates', type: 'toggle', value: true },
      { id: 'backup', label: 'Cloud Backup', description: 'Today, 10:30 AM', type: 'action' },
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

  const [expandedSection, setExpandedSection] = useState<string | null>('account');

  const toggleSetting = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Configure your smart home</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
            <Check size={12} className="mr-1.5" />
            All Systems OK
          </span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-3xl mx-auto">
          {/* User Card */}
          <motion.div
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Homeowner</h3>
                <p className="text-sm text-slate-500">homeowner@aico.home</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Premium Plan</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </motion.div>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + sectionIndex * 0.03 }}
            >
              {/* Section Header */}
              <button
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: section.bgColor }}
                >
                  <section.icon size={18} style={{ color: section.color }} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-slate-900">{section.title}</h4>
                  <p className="text-xs text-slate-400">{section.items.length} settings</p>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-slate-300" />
                </motion.div>
              </button>

              {/* Section Items */}
              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-slate-100">
                      {section.items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-4 py-3 ${
                            index < section.items.length - 1 ? 'border-b border-slate-50' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                            )}
                          </div>

                          {item.type === 'toggle' && (
                            <button
                              onClick={() => toggleSetting(item.id)}
                              className={`w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ml-3 ${
                                settings[item.id]
                                  ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                                  : 'bg-slate-200'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                settings[item.id] ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </button>
                          )}

                          {item.type === 'select' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 ml-3">
                              <span className="text-sm text-slate-600">{item.description}</span>
                              <ChevronRight size={14} className="text-slate-400" />
                            </div>
                          )}

                          {item.type === 'action' && (
                            <ChevronRight size={18} className="text-slate-300 ml-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Version Info */}
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">AICO Smart Home v2.0.0</p>
            <p className="text-xs text-slate-300 mt-1">Build 2024.01.15</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
