/**
 * AICO Smart Home - Theme Definitions
 *
 * Premium theme configurations for the ultra-luxury interface.
 */

import type { UITheme, ThemeColors, ThemeTypography, ThemeSpacing, ThemeAnimation, ThemeEffects } from './types';

// ============================================================================
// Shared Typography
// ============================================================================

const typography: ThemeTypography = {
  fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMono: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================================================
// Shared Spacing
// ============================================================================

const spacing: ThemeSpacing = {
  unit: 4,
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

// ============================================================================
// Shared Animation
// ============================================================================

const animation: ThemeAnimation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// ============================================================================
// Shared Effects
// ============================================================================

const effects: ThemeEffects = {
  blur: {
    sm: '4px',
    md: '12px',
    lg: '24px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.15)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 200, 150, 0.3)',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    full: '9999px',
  },
};

// ============================================================================
// Dark Theme (Default)
// ============================================================================

const darkColors: ThemeColors = {
  // Primary palette - Elegant teal/cyan
  primary: '#00d4aa',
  primaryLight: '#4eecc4',
  primaryDark: '#00a080',
  secondary: '#6366f1',
  accent: '#f59e0b',

  // Backgrounds
  background: '#0a0a12',
  backgroundElevated: '#12121c',
  backgroundOverlay: 'rgba(0, 0, 0, 0.7)',
  surface: '#1a1a28',
  surfaceHover: '#222234',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#606070',
  textInverse: '#0a0a12',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Device states
  deviceOn: '#00d4aa',
  deviceOff: '#4a4a5c',
  deviceAlert: '#f59e0b',
  deviceOffline: '#ef4444',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #00d4aa 0%, #6366f1 100%)',
  gradientBackground: 'linear-gradient(180deg, #0a0a12 0%, #12121c 100%)',

  // Borders
  border: '#2a2a3c',
  borderFocus: '#00d4aa',
};

export const darkTheme: UITheme = {
  id: 'dark',
  name: 'Dark',
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  animation,
  effects,
};

// ============================================================================
// Light Theme
// ============================================================================

const lightColors: ThemeColors = {
  // Primary palette
  primary: '#0891b2',
  primaryLight: '#22d3ee',
  primaryDark: '#0e7490',
  secondary: '#6366f1',
  accent: '#f59e0b',

  // Backgrounds
  background: '#f8fafc',
  backgroundElevated: '#ffffff',
  backgroundOverlay: 'rgba(255, 255, 255, 0.9)',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Device states
  deviceOn: '#0891b2',
  deviceOff: '#cbd5e1',
  deviceAlert: '#f59e0b',
  deviceOffline: '#ef4444',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
  gradientBackground: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',

  // Borders
  border: '#e2e8f0',
  borderFocus: '#0891b2',
};

export const lightTheme: UITheme = {
  id: 'light',
  name: 'Light',
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  animation,
  effects: {
    ...effects,
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.08)',
      lg: '0 10px 25px rgba(0, 0, 0, 0.12)',
      glow: '0 0 20px rgba(8, 145, 178, 0.2)',
    },
  },
};

// ============================================================================
// Night Theme (Ultra-dim for nighttime)
// ============================================================================

const nightColors: ThemeColors = {
  // Primary palette - Subtle warm amber
  primary: '#f59e0b',
  primaryLight: '#fbbf24',
  primaryDark: '#d97706',
  secondary: '#8b5cf6',
  accent: '#f59e0b',

  // Backgrounds - Deep black
  background: '#000000',
  backgroundElevated: '#0a0a0a',
  backgroundOverlay: 'rgba(0, 0, 0, 0.9)',
  surface: '#111111',
  surfaceHover: '#1a1a1a',

  // Text - Warm, low brightness
  textPrimary: '#c4a57b',
  textSecondary: '#8b7355',
  textMuted: '#5a4d3f',
  textInverse: '#000000',

  // Semantic - Muted
  success: '#059669',
  warning: '#d97706',
  error: '#b91c1c',
  info: '#2563eb',

  // Device states
  deviceOn: '#f59e0b',
  deviceOff: '#3a3a3a',
  deviceAlert: '#d97706',
  deviceOffline: '#7f1d1d',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)',
  gradientBackground: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',

  // Borders
  border: '#1a1a1a',
  borderFocus: '#f59e0b',
};

export const nightTheme: UITheme = {
  id: 'night',
  name: 'Night',
  mode: 'dark',
  colors: nightColors,
  typography,
  spacing,
  animation,
  effects: {
    ...effects,
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4)',
      lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
      glow: '0 0 15px rgba(245, 158, 11, 0.15)',
    },
  },
};

// ============================================================================
// Cinema Theme (Immersive dark with accent colors)
// ============================================================================

const cinemaColors: ThemeColors = {
  // Primary palette - Deep purple/violet
  primary: '#8b5cf6',
  primaryLight: '#a78bfa',
  primaryDark: '#7c3aed',
  secondary: '#ec4899',
  accent: '#ec4899',

  // Backgrounds - Pure black
  background: '#000000',
  backgroundElevated: '#050505',
  backgroundOverlay: 'rgba(0, 0, 0, 0.95)',
  surface: '#0a0a0a',
  surfaceHover: '#141414',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textInverse: '#000000',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#8b5cf6',

  // Device states
  deviceOn: '#8b5cf6',
  deviceOff: '#2a2a2a',
  deviceAlert: '#f59e0b',
  deviceOffline: '#ef4444',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  gradientBackground: 'linear-gradient(180deg, #000000 0%, #050505 100%)',

  // Borders
  border: '#1f1f1f',
  borderFocus: '#8b5cf6',
};

export const cinemaTheme: UITheme = {
  id: 'cinema',
  name: 'Cinema',
  mode: 'dark',
  colors: cinemaColors,
  typography,
  spacing,
  animation: {
    ...animation,
    duration: {
      ...animation.duration,
      normal: 400, // Slower, more cinematic
      slow: 700,
    },
  },
  effects: {
    ...effects,
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px rgba(0, 0, 0, 0.6)',
      lg: '0 10px 25px rgba(0, 0, 0, 0.7)',
      glow: '0 0 30px rgba(139, 92, 246, 0.25)',
    },
  },
};
