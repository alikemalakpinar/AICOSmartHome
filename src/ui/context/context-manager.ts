/**
 * AICO Smart Home - Context Manager
 *
 * Manages UI context and triggers adaptive UI changes.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UserId, ISOTimestamp, TimeOfDayPeriod, WeatherCondition, ResidenceMode, RoomId } from '@/types/core';
import type { UserRole, UserPreferences } from '@/types/users';
import type {
  UIContext,
  TimeContext,
  WeatherContext,
  UserContext,
  ResidenceContext,
  EnvironmentContext,
  InteractionContext,
  UITheme,
  UILayout,
  AdaptationRule,
  InputMethod,
  AirQualityLevel,
} from './types';
import { darkTheme, lightTheme, nightTheme, cinemaTheme } from './themes';
import { defaultLayout, minimalLayout, mediaLayout, securityLayout } from './layouts';

// ============================================================================
// Context Store State
// ============================================================================

interface ContextState {
  context: UIContext;
  theme: UITheme;
  layout: UILayout;
  adaptationRules: AdaptationRule[];
  transitionInProgress: boolean;
}

interface ContextActions {
  // Context Updates
  updateTimeContext(time: Partial<TimeContext>): void;
  updateWeatherContext(weather: Partial<WeatherContext>): void;
  updateUserContext(user: UserContext | null): void;
  updateResidenceContext(residence: Partial<ResidenceContext>): void;
  updateEnvironmentContext(environment: Partial<EnvironmentContext>): void;
  updateInteractionContext(interaction: Partial<InteractionContext>): void;

  // Theme Management
  setTheme(themeId: string): void;
  applyThemeOverrides(overrides: Partial<UITheme['colors']>): void;

  // Layout Management
  setLayout(layoutId: string): void;

  // Adaptation
  evaluateAdaptations(): void;
  addAdaptationRule(rule: AdaptationRule): void;
  removeAdaptationRule(ruleId: string): void;
  enableAdaptationRule(ruleId: string, enabled: boolean): void;

  // User Identification
  onUserIdentified(userId: UserId, preferences: UserPreferences): void;
  onUserLost(): void;

  // Input Tracking
  recordInteraction(method: InputMethod): void;
}

// ============================================================================
// Default Context
// ============================================================================

const createDefaultContext = (): UIContext => ({
  time: {
    timestamp: new Date().toISOString() as ISOTimestamp,
    period: getTimeOfDayPeriod(new Date().getHours()),
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    isWeekend: [0, 6].includes(new Date().getDay()),
    isHoliday: false,
    sunrise: '06:30',
    sunset: '18:30',
  },
  weather: {
    condition: 'clear',
    temperature: 22,
    humidity: 50,
    uvIndex: 5,
    isDay: true,
    forecast: 'Sunny',
  },
  user: null,
  residence: {
    residenceId: '' as any,
    mode: 'home',
    occupantCount: 0,
    guestPresent: false,
    alertCount: 0,
    maintenanceRequired: false,
  },
  environment: {
    ambientLight: 500,
    noiseLevel: 40,
    temperature: 22,
    humidity: 50,
    airQuality: 'good',
  },
  interaction: {
    inputMethod: 'touch',
    lastInteraction: new Date().toISOString() as ISOTimestamp,
    idleTime: 0,
    recentActions: [],
  },
});

// ============================================================================
// Default Adaptation Rules
// ============================================================================

const defaultAdaptationRules: AdaptationRule[] = [
  {
    id: 'night-mode',
    name: 'Night Mode Theme',
    priority: 100,
    conditions: [
      { type: 'time_period', operator: 'equals', value: 'night' },
    ],
    actions: [
      { type: 'set_theme', target: 'theme', value: 'night' },
    ],
    enabled: true,
  },
  {
    id: 'low-light',
    name: 'Low Light Adaptation',
    priority: 90,
    conditions: [
      { type: 'ambient_light', operator: 'less_than', value: 100 },
    ],
    actions: [
      { type: 'set_theme', target: 'theme', value: 'dark' },
      { type: 'set_brightness', target: 'ui', value: 0.6 },
    ],
    enabled: true,
  },
  {
    id: 'cinema-mode',
    name: 'Cinema Mode Layout',
    priority: 80,
    conditions: [
      { type: 'residence_mode', operator: 'equals', value: 'cinema' },
    ],
    actions: [
      { type: 'set_theme', target: 'theme', value: 'cinema' },
      { type: 'set_layout', target: 'layout', value: 'media' },
    ],
    enabled: true,
  },
  {
    id: 'security-alert',
    name: 'Security Alert Mode',
    priority: 200,
    conditions: [
      { type: 'residence_mode', operator: 'in', value: ['emergency', 'lockdown'] },
    ],
    actions: [
      { type: 'set_layout', target: 'layout', value: 'security' },
    ],
    enabled: true,
  },
  {
    id: 'idle-minimal',
    name: 'Idle Minimal Mode',
    priority: 50,
    conditions: [
      { type: 'idle_time', operator: 'greater_than', value: 300 },
    ],
    actions: [
      { type: 'set_layout', target: 'layout', value: 'minimal' },
      { type: 'set_brightness', target: 'ui', value: 0.3 },
    ],
    enabled: true,
  },
  {
    id: 'child-mode',
    name: 'Child Safe Mode',
    priority: 150,
    conditions: [
      { type: 'user_role', operator: 'equals', value: 'child' },
    ],
    actions: [
      { type: 'set_theme', target: 'theme', value: 'light' },
      { type: 'disable_feature', target: 'security_controls', value: true },
      { type: 'disable_feature', target: 'system_settings', value: true },
    ],
    enabled: true,
  },
];

// ============================================================================
// Context Store
// ============================================================================

export const useContextStore = create<ContextState & ContextActions>()(
  subscribeWithSelector((set, get) => ({
    context: createDefaultContext(),
    theme: darkTheme,
    layout: defaultLayout,
    adaptationRules: defaultAdaptationRules,
    transitionInProgress: false,

    // Context Updates
    updateTimeContext(time) {
      set(state => ({
        context: {
          ...state.context,
          time: { ...state.context.time, ...time },
        },
      }));
      get().evaluateAdaptations();
    },

    updateWeatherContext(weather) {
      set(state => ({
        context: {
          ...state.context,
          weather: { ...state.context.weather, ...weather },
        },
      }));
      get().evaluateAdaptations();
    },

    updateUserContext(user) {
      set(state => ({
        context: {
          ...state.context,
          user,
        },
      }));
      get().evaluateAdaptations();
    },

    updateResidenceContext(residence) {
      set(state => ({
        context: {
          ...state.context,
          residence: { ...state.context.residence, ...residence },
        },
      }));
      get().evaluateAdaptations();
    },

    updateEnvironmentContext(environment) {
      set(state => ({
        context: {
          ...state.context,
          environment: { ...state.context.environment, ...environment },
        },
      }));
      get().evaluateAdaptations();
    },

    updateInteractionContext(interaction) {
      set(state => ({
        context: {
          ...state.context,
          interaction: { ...state.context.interaction, ...interaction },
        },
      }));
    },

    // Theme Management
    setTheme(themeId) {
      const themes: Record<string, UITheme> = {
        dark: darkTheme,
        light: lightTheme,
        night: nightTheme,
        cinema: cinemaTheme,
      };

      const theme = themes[themeId];
      if (theme) {
        set({ theme, transitionInProgress: true });
        setTimeout(() => set({ transitionInProgress: false }), 300);
      }
    },

    applyThemeOverrides(overrides) {
      set(state => ({
        theme: {
          ...state.theme,
          colors: { ...state.theme.colors, ...overrides },
        },
      }));
    },

    // Layout Management
    setLayout(layoutId) {
      const layouts: Record<string, UILayout> = {
        default: defaultLayout,
        minimal: minimalLayout,
        media: mediaLayout,
        security: securityLayout,
      };

      const layout = layouts[layoutId];
      if (layout) {
        set({ layout, transitionInProgress: true });
        setTimeout(() => set({ transitionInProgress: false }), 500);
      }
    },

    // Adaptation
    evaluateAdaptations() {
      const { context, adaptationRules } = get();

      // Sort rules by priority (higher first)
      const sortedRules = [...adaptationRules]
        .filter(r => r.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (evaluateConditions(rule.conditions, context)) {
          executeActions(rule.actions, get);
          break; // Only apply highest priority matching rule
        }
      }
    },

    addAdaptationRule(rule) {
      set(state => ({
        adaptationRules: [...state.adaptationRules, rule],
      }));
    },

    removeAdaptationRule(ruleId) {
      set(state => ({
        adaptationRules: state.adaptationRules.filter(r => r.id !== ruleId),
      }));
    },

    enableAdaptationRule(ruleId, enabled) {
      set(state => ({
        adaptationRules: state.adaptationRules.map(r =>
          r.id === ruleId ? { ...r, enabled } : r
        ),
      }));
    },

    // User Management
    onUserIdentified(userId, preferences) {
      const userContext: UserContext = {
        userId,
        name: '', // Would come from user profile
        role: 'resident',
        preferences,
        isHome: true,
        sessionDuration: 0,
      };

      get().updateUserContext(userContext);

      // Apply user preferences
      if (preferences.theme.mode === 'dark') {
        get().setTheme('dark');
      } else if (preferences.theme.mode === 'light') {
        get().setTheme('light');
      }
    },

    onUserLost() {
      get().updateUserContext(null);
    },

    // Interaction Tracking
    recordInteraction(method) {
      set(state => ({
        context: {
          ...state.context,
          interaction: {
            ...state.context.interaction,
            inputMethod: method,
            lastInteraction: new Date().toISOString() as ISOTimestamp,
            idleTime: 0,
            recentActions: [
              method,
              ...state.context.interaction.recentActions.slice(0, 9),
            ],
          },
        },
      }));
    },
  }))
);

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeOfDayPeriod(hour: number): TimeOfDayPeriod {
  if (hour >= 0 && hour < 6) return 'night';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

function evaluateConditions(
  conditions: AdaptationRule['conditions'],
  context: UIContext
): boolean {
  return conditions.every(condition => {
    const contextValue = getContextValue(condition.type, context);
    return compareValues(contextValue, condition.operator, condition.value);
  });
}

function getContextValue(type: string, context: UIContext): unknown {
  switch (type) {
    case 'time_period':
      return context.time.period;
    case 'time_hour':
      return context.time.hour;
    case 'weather_condition':
      return context.weather.condition;
    case 'user_role':
      return context.user?.role;
    case 'residence_mode':
      return context.residence.mode;
    case 'ambient_light':
      return context.environment.ambientLight;
    case 'idle_time':
      return context.interaction.idleTime;
    case 'occupant_count':
      return context.residence.occupantCount;
    default:
      return undefined;
  }
}

function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'equals':
      return actual === expected;
    case 'not_equals':
      return actual !== expected;
    case 'greater_than':
      return typeof actual === 'number' && actual > (expected as number);
    case 'less_than':
      return typeof actual === 'number' && actual < (expected as number);
    case 'contains':
      return typeof actual === 'string' && actual.includes(expected as string);
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    default:
      return false;
  }
}

function executeActions(
  actions: AdaptationRule['actions'],
  get: () => ContextState & ContextActions
): void {
  for (const action of actions) {
    switch (action.type) {
      case 'set_theme':
        get().setTheme(action.value as string);
        break;
      case 'set_layout':
        get().setLayout(action.value as string);
        break;
      // Add more action handlers as needed
    }
  }
}

// ============================================================================
// Context Time Updater
// ============================================================================

export function startContextTimeUpdater(): () => void {
  const update = () => {
    const now = new Date();
    useContextStore.getState().updateTimeContext({
      timestamp: now.toISOString() as ISOTimestamp,
      period: getTimeOfDayPeriod(now.getHours()),
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isWeekend: [0, 6].includes(now.getDay()),
    });
  };

  // Update immediately
  update();

  // Update every minute
  const interval = setInterval(update, 60000);

  return () => clearInterval(interval);
}

// ============================================================================
// Idle Time Tracker
// ============================================================================

export function startIdleTimeTracker(): () => void {
  let lastActivity = Date.now();

  const updateIdle = () => {
    const idleTime = Math.floor((Date.now() - lastActivity) / 1000);
    useContextStore.getState().updateInteractionContext({ idleTime });
  };

  const resetIdle = () => {
    lastActivity = Date.now();
    useContextStore.getState().updateInteractionContext({ idleTime: 0 });
  };

  // Track user activity
  const events = ['touchstart', 'mousedown', 'keydown'];
  events.forEach(event => document.addEventListener(event, resetIdle));

  // Update idle time every second
  const interval = setInterval(updateIdle, 1000);

  return () => {
    clearInterval(interval);
    events.forEach(event => document.removeEventListener(event, resetIdle));
  };
}
