/**
 * AICO Smart Home - Context-Aware UI Types
 *
 * Types for adaptive, context-aware user interface.
 */

import type { UserId, ResidenceId, RoomId, ISOTimestamp, TimeOfDayPeriod, WeatherCondition } from '@/types/core';
import type { ResidenceMode } from '@/types/core';
import type { UserRole, UserPreferences } from '@/types/users';

// ============================================================================
// Context Types
// ============================================================================

export interface UIContext {
  time: TimeContext;
  weather: WeatherContext;
  user: UserContext | null;
  residence: ResidenceContext;
  environment: EnvironmentContext;
  interaction: InteractionContext;
}

export interface TimeContext {
  timestamp: ISOTimestamp;
  period: TimeOfDayPeriod;
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  sunrise: string;
  sunset: string;
}

export interface WeatherContext {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
  forecast: string;
}

export interface UserContext {
  userId: UserId;
  name: string;
  role: UserRole;
  preferences: UserPreferences;
  currentRoom?: RoomId;
  isHome: boolean;
  sessionDuration: number;
}

export interface ResidenceContext {
  residenceId: ResidenceId;
  mode: ResidenceMode;
  occupantCount: number;
  guestPresent: boolean;
  alertCount: number;
  maintenanceRequired: boolean;
}

export interface EnvironmentContext {
  ambientLight: number; // lux
  noiseLevel: number; // dB
  temperature: number;
  humidity: number;
  airQuality: AirQualityLevel;
}

export type AirQualityLevel = 'excellent' | 'good' | 'moderate' | 'poor' | 'hazardous';

export interface InteractionContext {
  inputMethod: InputMethod;
  lastInteraction: ISOTimestamp;
  idleTime: number; // seconds
  recentActions: string[];
}

export type InputMethod = 'touch' | 'voice' | 'gesture' | 'remote' | 'automation';

// ============================================================================
// Theme Types
// ============================================================================

export interface UITheme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  animation: ThemeAnimation;
  effects: ThemeEffects;
}

export interface ThemeColors {
  // Primary palette
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;

  // Backgrounds
  background: string;
  backgroundElevated: string;
  backgroundOverlay: string;
  surface: string;
  surfaceHover: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Device states
  deviceOn: string;
  deviceOff: string;
  deviceAlert: string;
  deviceOffline: string;

  // Gradients
  gradientPrimary: string;
  gradientBackground: string;

  // Borders
  border: string;
  borderFocus: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  unit: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeAnimation {
  duration: {
    instant: number;
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    default: string;
    in: string;
    out: string;
    inOut: string;
    spring: string;
  };
}

export interface ThemeEffects {
  blur: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// ============================================================================
// Layout Types
// ============================================================================

export interface UILayout {
  id: string;
  name: string;
  type: LayoutType;
  regions: LayoutRegion[];
  breakpoints: LayoutBreakpoints;
}

export type LayoutType =
  | 'dashboard'
  | 'control'
  | 'media'
  | 'security'
  | 'minimal'
  | 'fullscreen'
  | 'split';

export interface LayoutRegion {
  id: string;
  name: string;
  area: GridArea;
  widgets: WidgetPlacement[];
  scrollable: boolean;
  collapsible: boolean;
}

export interface GridArea {
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
}

export interface WidgetPlacement {
  widgetId: string;
  widgetType: string;
  position: number;
  config: Record<string, unknown>;
}

export interface LayoutBreakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

// ============================================================================
// Adaptation Rules
// ============================================================================

export interface AdaptationRule {
  id: string;
  name: string;
  priority: number;
  conditions: AdaptationCondition[];
  actions: AdaptationAction[];
  enabled: boolean;
}

export interface AdaptationCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: unknown;
}

export type ConditionType =
  | 'time_period'
  | 'time_hour'
  | 'weather_condition'
  | 'user_role'
  | 'user_preference'
  | 'residence_mode'
  | 'ambient_light'
  | 'idle_time'
  | 'occupant_count';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in';

export interface AdaptationAction {
  type: ActionType;
  target: string;
  value: unknown;
  transition?: TransitionConfig;
}

export type ActionType =
  | 'set_theme'
  | 'set_layout'
  | 'set_color'
  | 'set_brightness'
  | 'show_widget'
  | 'hide_widget'
  | 'set_font_size'
  | 'enable_feature'
  | 'disable_feature';

export interface TransitionConfig {
  duration: number;
  easing: string;
  delay?: number;
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize: WidgetSize;
  configSchema: Record<string, unknown>;
  supportedContexts: string[];
}

export type WidgetCategory =
  | 'climate'
  | 'lighting'
  | 'security'
  | 'media'
  | 'energy'
  | 'info'
  | 'control'
  | 'chart'
  | 'custom';

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetInstance {
  id: string;
  definitionId: string;
  title?: string;
  size: WidgetSize;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  visible: boolean;
  locked: boolean;
}

// ============================================================================
// Haptic Feedback Types
// ============================================================================

export interface HapticPattern {
  id: string;
  name: string;
  type: HapticType;
  intensity: number;
  duration: number;
  pattern?: number[]; // On/off durations in ms
}

export type HapticType =
  | 'tap'
  | 'double_tap'
  | 'long_press'
  | 'success'
  | 'error'
  | 'warning'
  | 'notification'
  | 'selection'
  | 'impact'
  | 'custom';
