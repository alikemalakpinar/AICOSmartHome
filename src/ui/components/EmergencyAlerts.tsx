/**
 * AICO Smart Home - Emergency Alerts Component
 *
 * Critical safety alerts for water leak, flood, fire, gas, and smoke detection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import type { DeviceId, RoomId } from '@/types/core';

// ============================================================================
// Types
// ============================================================================

export type AlertType = 'fire' | 'smoke' | 'water' | 'flood' | 'gas' | 'co' | 'intrusion' | 'panic';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'silenced';

export interface EmergencyAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  location: {
    roomId: RoomId;
    roomName: string;
    zone?: string;
  };
  deviceId?: DeviceId;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  sensorValue?: number;
  threshold?: number;
}

interface EmergencyAlertsProps {
  alerts: EmergencyAlert[];
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onSilence: (alertId: string, duration: number) => void;
  onEmergencyAction: (action: EmergencyAction) => void;
}

type EmergencyAction =
  | { type: 'call_emergency'; service: 'fire' | 'police' | 'medical' }
  | { type: 'lockdown' }
  | { type: 'evacuate' }
  | { type: 'shut_water' }
  | { type: 'shut_gas' }
  | { type: 'ventilate' };

// ============================================================================
// Alert Configurations
// ============================================================================

const ALERT_CONFIG: Record<AlertType, {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
  sound: string;
  actions: EmergencyAction['type'][];
}> = {
  fire: {
    icon: '🔥',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.2)',
    label: 'Yangın',
    sound: 'fire_alarm',
    actions: ['call_emergency', 'evacuate', 'shut_gas'],
  },
  smoke: {
    icon: '💨',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.2)',
    label: 'Duman',
    sound: 'smoke_alarm',
    actions: ['ventilate', 'call_emergency', 'evacuate'],
  },
  water: {
    icon: '💧',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.2)',
    label: 'Su Kaçağı',
    sound: 'water_alarm',
    actions: ['shut_water'],
  },
  flood: {
    icon: '🌊',
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.2)',
    label: 'Su Baskını',
    sound: 'flood_alarm',
    actions: ['shut_water', 'call_emergency'],
  },
  gas: {
    icon: '⛽',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.2)',
    label: 'Gaz Kaçağı',
    sound: 'gas_alarm',
    actions: ['shut_gas', 'ventilate', 'evacuate'],
  },
  co: {
    icon: '☠️',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.2)',
    label: 'Karbonmonoksit',
    sound: 'co_alarm',
    actions: ['ventilate', 'evacuate', 'call_emergency'],
  },
  intrusion: {
    icon: '🚨',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.2)',
    label: 'İzinsiz Giriş',
    sound: 'intrusion_alarm',
    actions: ['call_emergency', 'lockdown'],
  },
  panic: {
    icon: '🆘',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.2)',
    label: 'Panik',
    sound: 'panic_alarm',
    actions: ['call_emergency'],
  },
};

const ACTION_LABELS: Record<EmergencyAction['type'], { icon: string; label: string }> = {
  call_emergency: { icon: '📞', label: 'Acil Çağrı' },
  lockdown: { icon: '🔒', label: 'Kilitle' },
  evacuate: { icon: '🚪', label: 'Tahliye' },
  shut_water: { icon: '🚰', label: 'Suyu Kapat' },
  shut_gas: { icon: '🔥', label: 'Gazı Kapat' },
  ventilate: { icon: '💨', label: 'Havalandır' },
};

// ============================================================================
// Emergency Alerts Component
// ============================================================================

export const EmergencyAlerts: React.FC<EmergencyAlertsProps> = ({
  alerts,
  onAcknowledge,
  onResolve,
  onSilence,
  onEmergencyAction,
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ alertId: string; action: EmergencyAction } | null>(null);

  // Critical alerts that need immediate attention
  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  );
  const hasActiveAlerts = criticalAlerts.length > 0;

  // Trigger haptic on new critical alerts
  useEffect(() => {
    if (hasActiveAlerts) {
      triggerHaptic('error');
      const interval = setInterval(() => {
        triggerHaptic('warning');
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [hasActiveAlerts, triggerHaptic]);

  const handleAction = useCallback((alertId: string, action: EmergencyAction) => {
    setConfirmAction({ alertId, action });
  }, []);

  const confirmEmergencyAction = useCallback(() => {
    if (confirmAction) {
      triggerHaptic('success');
      onEmergencyAction(confirmAction.action);
      setConfirmAction(null);
    }
  }, [confirmAction, onEmergencyAction, triggerHaptic]);

  if (alerts.length === 0) {
    return (
      <div className="emergency-alerts no-alerts">
        <div className="safe-status">
          <span className="safe-icon">✅</span>
          <span className="safe-text">Tüm Sistemler Normal</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`emergency-alerts ${hasActiveAlerts ? 'has-critical' : ''}`}>
      {/* Critical Alert Banner */}
      <AnimatePresence>
        {hasActiveAlerts && (
          <motion.div
            className="critical-banner"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <motion.div
              className="banner-pulse"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="alert-count">{criticalAlerts.length}</span>
              <span className="alert-label">Kritik Uyarı</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert List */}
      <div className="alerts-list">
        {alerts.map((alert) => {
          const config = ALERT_CONFIG[alert.type];
          const isExpanded = expandedAlert === alert.id;

          return (
            <motion.div
              key={alert.id}
              className={`alert-card severity-${alert.severity} status-${alert.status}`}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                borderColor: config.color,
                backgroundColor: config.bgColor,
              }}
            >
              {/* Alert Header */}
              <div
                className="alert-header"
                onClick={() => {
                  setExpandedAlert(isExpanded ? null : alert.id);
                  triggerHaptic('selection');
                }}
              >
                <div className="alert-icon-container">
                  <motion.span
                    className="alert-icon"
                    animate={
                      alert.severity === 'critical' && alert.status === 'active'
                        ? { scale: [1, 1.2, 1] }
                        : {}
                    }
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    {config.icon}
                  </motion.span>
                </div>

                <div className="alert-info">
                  <span className="alert-type" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="alert-location">{alert.location.roomName}</span>
                  <span className="alert-time">
                    {formatTimeAgo(alert.triggeredAt)}
                  </span>
                </div>

                <div className="alert-status-badge" style={{ backgroundColor: config.color }}>
                  {alert.status === 'active' && 'AKTİF'}
                  {alert.status === 'acknowledged' && 'ONAYLANDI'}
                  {alert.status === 'silenced' && 'SUSTURULDU'}
                  {alert.status === 'resolved' && 'ÇÖZÜLDÜ'}
                </div>
              </div>

              {/* Alert Details (Expanded) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="alert-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <p className="alert-message">{alert.message}</p>

                    {/* Sensor Data */}
                    {alert.sensorValue !== undefined && (
                      <div className="sensor-data">
                        <span className="sensor-label">Sensör Değeri:</span>
                        <span className="sensor-value">
                          {alert.sensorValue}
                          {alert.threshold && ` / ${alert.threshold}`}
                        </span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    {alert.status === 'active' && (
                      <div className="alert-actions">
                        {config.actions.map((actionType) => {
                          const actionLabel = ACTION_LABELS[actionType];
                          const action: EmergencyAction =
                            actionType === 'call_emergency'
                              ? { type: 'call_emergency', service: alert.type === 'fire' || alert.type === 'smoke' ? 'fire' : 'police' }
                              : { type: actionType } as EmergencyAction;

                          return (
                            <motion.button
                              key={actionType}
                              className="action-btn"
                              onClick={() => handleAction(alert.id, action)}
                              whileTap={{ scale: 0.9 }}
                              style={{ borderColor: config.color }}
                            >
                              <span className="action-icon">{actionLabel.icon}</span>
                              <span className="action-label">{actionLabel.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Alert Control Buttons */}
                    <div className="alert-controls">
                      {alert.status === 'active' && (
                        <>
                          <motion.button
                            className="control-btn acknowledge"
                            onClick={() => {
                              triggerHaptic('success');
                              onAcknowledge(alert.id);
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            Onayla
                          </motion.button>
                          <motion.button
                            className="control-btn silence"
                            onClick={() => {
                              triggerHaptic('selection');
                              onSilence(alert.id, 5 * 60 * 1000); // 5 minutes
                            }}
                            whileTap={{ scale: 0.9 }}
                          >
                            5 dk Sustur
                          </motion.button>
                        </>
                      )}
                      {(alert.status === 'active' || alert.status === 'acknowledged') && (
                        <motion.button
                          className="control-btn resolve"
                          onClick={() => {
                            triggerHaptic('success');
                            onResolve(alert.id);
                          }}
                          whileTap={{ scale: 0.9 }}
                        >
                          Çözüldü
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              className="confirm-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-header">
                <span className="confirm-icon">⚠️</span>
                <span className="confirm-title">Eylemi Onayla</span>
              </div>
              <p className="confirm-message">
                {ACTION_LABELS[confirmAction.action.type].label} işlemini başlatmak istediğinizden emin misiniz?
              </p>
              <div className="confirm-buttons">
                <motion.button
                  className="btn-cancel"
                  onClick={() => setConfirmAction(null)}
                  whileTap={{ scale: 0.9 }}
                >
                  İptal
                </motion.button>
                <motion.button
                  className="btn-confirm"
                  onClick={confirmEmergencyAction}
                  whileTap={{ scale: 0.9 }}
                >
                  Onayla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Sensor Status Panel
// ============================================================================

interface SensorStatusProps {
  sensors: Array<{
    id: string;
    name: string;
    type: AlertType;
    room: string;
    status: 'ok' | 'warning' | 'alert' | 'offline';
    value?: number;
    unit?: string;
    batteryLevel?: number;
  }>;
}

export const SensorStatusPanel: React.FC<SensorStatusProps> = ({ sensors }) => {
  const { triggerHaptic } = useHapticFeedback();

  const groupedSensors = sensors.reduce((acc, sensor) => {
    if (!acc[sensor.type]) acc[sensor.type] = [];
    acc[sensor.type].push(sensor);
    return acc;
  }, {} as Record<AlertType, typeof sensors>);

  const statusColors = {
    ok: '#10b981',
    warning: '#f59e0b',
    alert: '#ef4444',
    offline: '#6b7280',
  };

  return (
    <div className="sensor-status-panel">
      <h3 className="panel-title">Güvenlik Sensörleri</h3>

      {Object.entries(groupedSensors).map(([type, typeSensors]) => {
        const config = ALERT_CONFIG[type as AlertType];

        return (
          <div key={type} className="sensor-group">
            <div className="group-header">
              <span className="group-icon">{config.icon}</span>
              <span className="group-label">{config.label}</span>
              <span className="group-count">{typeSensors.length}</span>
            </div>

            <div className="sensors-grid">
              {typeSensors.map((sensor) => (
                <motion.div
                  key={sensor.id}
                  className={`sensor-card status-${sensor.status}`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => triggerHaptic('selection')}
                >
                  <div
                    className="status-indicator"
                    style={{ backgroundColor: statusColors[sensor.status] }}
                  />
                  <div className="sensor-info">
                    <span className="sensor-name">{sensor.name}</span>
                    <span className="sensor-room">{sensor.room}</span>
                  </div>
                  {sensor.value !== undefined && (
                    <div className="sensor-value">
                      {sensor.value}
                      {sensor.unit && <span className="unit">{sensor.unit}</span>}
                    </div>
                  )}
                  {sensor.batteryLevel !== undefined && (
                    <div className={`battery-level ${sensor.batteryLevel < 20 ? 'low' : ''}`}>
                      🔋 {sensor.batteryLevel}%
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// Emergency Quick Actions
// ============================================================================

export const EmergencyQuickActions: React.FC<{
  onAction: (action: EmergencyAction) => void;
}> = ({ onAction }) => {
  const { triggerHaptic } = useHapticFeedback();
  const [confirmPanic, setConfirmPanic] = useState(false);

  const handlePanic = () => {
    if (!confirmPanic) {
      setConfirmPanic(true);
      triggerHaptic('warning');
      setTimeout(() => setConfirmPanic(false), 3000);
    } else {
      triggerHaptic('error');
      onAction({ type: 'call_emergency', service: 'police' });
      setConfirmPanic(false);
    }
  };

  return (
    <div className="emergency-quick-actions">
      <motion.button
        className={`panic-button ${confirmPanic ? 'confirm' : ''}`}
        onClick={handlePanic}
        whileTap={{ scale: 0.95 }}
        animate={confirmPanic ? { scale: [1, 1.05, 1] } : {}}
        transition={confirmPanic ? { duration: 0.5, repeat: Infinity } : {}}
      >
        <span className="panic-icon">🆘</span>
        <span className="panic-text">
          {confirmPanic ? 'TEKRAR BASIN' : 'PANİK BUTONU'}
        </span>
      </motion.button>

      <div className="quick-action-grid">
        <motion.button
          className="quick-action-btn fire"
          onClick={() => {
            triggerHaptic('selection');
            onAction({ type: 'call_emergency', service: 'fire' });
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">🚒</span>
          <span>İtfaiye</span>
        </motion.button>

        <motion.button
          className="quick-action-btn medical"
          onClick={() => {
            triggerHaptic('selection');
            onAction({ type: 'call_emergency', service: 'medical' });
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">🚑</span>
          <span>Ambulans</span>
        </motion.button>

        <motion.button
          className="quick-action-btn police"
          onClick={() => {
            triggerHaptic('selection');
            onAction({ type: 'call_emergency', service: 'police' });
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">🚔</span>
          <span>Polis</span>
        </motion.button>

        <motion.button
          className="quick-action-btn lockdown"
          onClick={() => {
            triggerHaptic('impact');
            onAction({ type: 'lockdown' });
          }}
          whileTap={{ scale: 0.9 }}
        >
          <span className="action-icon">🔒</span>
          <span>Kilitle</span>
        </motion.button>
      </div>
    </div>
  );
};

// ============================================================================
// Utilities
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;

  return date.toLocaleDateString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default EmergencyAlerts;
