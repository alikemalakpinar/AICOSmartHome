/**
 * AICO Smart Home - Layout Definitions
 *
 * Adaptive layout configurations for different contexts.
 */

import type { UILayout, LayoutRegion, LayoutBreakpoints } from './types';

// ============================================================================
// Shared Breakpoints
// ============================================================================

const breakpoints: LayoutBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// ============================================================================
// Default Dashboard Layout
// ============================================================================

export const defaultLayout: UILayout = {
  id: 'default',
  name: 'Dashboard',
  type: 'dashboard',
  breakpoints,
  regions: [
    {
      id: 'header',
      name: 'Header',
      area: { row: 1, column: 1, rowSpan: 1, columnSpan: 12 },
      widgets: [
        { widgetId: 'clock', widgetType: 'clock', position: 0, config: {} },
        { widgetId: 'weather', widgetType: 'weather', position: 1, config: {} },
        { widgetId: 'user-status', widgetType: 'user-status', position: 2, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'main',
      name: 'Main Content',
      area: { row: 2, column: 1, rowSpan: 8, columnSpan: 8 },
      widgets: [
        { widgetId: 'digital-twin', widgetType: 'digital-twin', position: 0, config: { fullSize: true } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'sidebar',
      name: 'Quick Controls',
      area: { row: 2, column: 9, rowSpan: 8, columnSpan: 4 },
      widgets: [
        { widgetId: 'room-selector', widgetType: 'room-selector', position: 0, config: {} },
        { widgetId: 'quick-scenes', widgetType: 'quick-scenes', position: 1, config: {} },
        { widgetId: 'climate-summary', widgetType: 'climate-summary', position: 2, config: {} },
        { widgetId: 'recent-activity', widgetType: 'recent-activity', position: 3, config: {} },
      ],
      scrollable: true,
      collapsible: true,
    },
    {
      id: 'footer',
      name: 'Quick Access',
      area: { row: 10, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'nav-bar', widgetType: 'navigation', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
  ],
};

// ============================================================================
// Minimal Layout (For idle/screensaver mode)
// ============================================================================

export const minimalLayout: UILayout = {
  id: 'minimal',
  name: 'Minimal',
  type: 'minimal',
  breakpoints,
  regions: [
    {
      id: 'center',
      name: 'Center Display',
      area: { row: 1, column: 1, rowSpan: 12, columnSpan: 12 },
      widgets: [
        { widgetId: 'ambient-display', widgetType: 'ambient-display', position: 0, config: {
          showTime: true,
          showWeather: true,
          showStatus: true,
          animation: 'subtle',
        }},
      ],
      scrollable: false,
      collapsible: false,
    },
  ],
};

// ============================================================================
// Media Layout (For cinema/entertainment mode)
// ============================================================================

export const mediaLayout: UILayout = {
  id: 'media',
  name: 'Media',
  type: 'media',
  breakpoints,
  regions: [
    {
      id: 'media-display',
      name: 'Media Display',
      area: { row: 1, column: 1, rowSpan: 10, columnSpan: 12 },
      widgets: [
        { widgetId: 'media-player', widgetType: 'media-player', position: 0, config: { fullscreen: true } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'media-controls',
      name: 'Media Controls',
      area: { row: 11, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'playback-controls', widgetType: 'playback-controls', position: 0, config: {} },
        { widgetId: 'volume-control', widgetType: 'volume-control', position: 1, config: {} },
        { widgetId: 'source-selector', widgetType: 'source-selector', position: 2, config: {} },
      ],
      scrollable: false,
      collapsible: true,
    },
  ],
};

// ============================================================================
// Security Layout (For emergency/security mode)
// ============================================================================

export const securityLayout: UILayout = {
  id: 'security',
  name: 'Security',
  type: 'security',
  breakpoints,
  regions: [
    {
      id: 'alert-banner',
      name: 'Alert Banner',
      area: { row: 1, column: 1, rowSpan: 1, columnSpan: 12 },
      widgets: [
        { widgetId: 'alert-banner', widgetType: 'alert-banner', position: 0, config: { priority: 'critical' } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'camera-grid',
      name: 'Camera Grid',
      area: { row: 2, column: 1, rowSpan: 7, columnSpan: 8 },
      widgets: [
        { widgetId: 'camera-grid', widgetType: 'camera-grid', position: 0, config: { layout: '2x2' } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'security-controls',
      name: 'Security Controls',
      area: { row: 2, column: 9, rowSpan: 7, columnSpan: 4 },
      widgets: [
        { widgetId: 'alarm-status', widgetType: 'alarm-status', position: 0, config: {} },
        { widgetId: 'lock-controls', widgetType: 'lock-controls', position: 1, config: {} },
        { widgetId: 'panic-button', widgetType: 'panic-button', position: 2, config: {} },
        { widgetId: 'emergency-contacts', widgetType: 'emergency-contacts', position: 3, config: {} },
      ],
      scrollable: true,
      collapsible: false,
    },
    {
      id: 'zone-status',
      name: 'Zone Status',
      area: { row: 9, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'zone-status', widgetType: 'zone-status', position: 0, config: {} },
      ],
      scrollable: true,
      collapsible: false,
    },
    {
      id: 'actions',
      name: 'Quick Actions',
      area: { row: 11, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'security-actions', widgetType: 'security-actions', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
  ],
};

// ============================================================================
// Control Layout (For focused device control)
// ============================================================================

export const controlLayout: UILayout = {
  id: 'control',
  name: 'Control',
  type: 'control',
  breakpoints,
  regions: [
    {
      id: 'header',
      name: 'Header',
      area: { row: 1, column: 1, rowSpan: 1, columnSpan: 12 },
      widgets: [
        { widgetId: 'back-button', widgetType: 'navigation-button', position: 0, config: { action: 'back' } },
        { widgetId: 'device-title', widgetType: 'title', position: 1, config: {} },
        { widgetId: 'device-status', widgetType: 'status-indicator', position: 2, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'device-preview',
      name: 'Device Preview',
      area: { row: 2, column: 1, rowSpan: 5, columnSpan: 6 },
      widgets: [
        { widgetId: 'device-preview', widgetType: 'device-preview', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'primary-control',
      name: 'Primary Control',
      area: { row: 2, column: 7, rowSpan: 5, columnSpan: 6 },
      widgets: [
        { widgetId: 'primary-control', widgetType: 'device-control', position: 0, config: { mode: 'primary' } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'secondary-controls',
      name: 'Secondary Controls',
      area: { row: 7, column: 1, rowSpan: 4, columnSpan: 12 },
      widgets: [
        { widgetId: 'secondary-controls', widgetType: 'device-control', position: 0, config: { mode: 'secondary' } },
      ],
      scrollable: true,
      collapsible: true,
    },
    {
      id: 'footer',
      name: 'Actions',
      area: { row: 11, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'device-actions', widgetType: 'action-bar', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
  ],
};

// ============================================================================
// Split Layout (For multi-tasking)
// ============================================================================

export const splitLayout: UILayout = {
  id: 'split',
  name: 'Split View',
  type: 'split',
  breakpoints,
  regions: [
    {
      id: 'header',
      name: 'Header',
      area: { row: 1, column: 1, rowSpan: 1, columnSpan: 12 },
      widgets: [
        { widgetId: 'header', widgetType: 'header', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'left-panel',
      name: 'Left Panel',
      area: { row: 2, column: 1, rowSpan: 9, columnSpan: 6 },
      widgets: [
        { widgetId: 'digital-twin', widgetType: 'digital-twin', position: 0, config: { compact: true } },
      ],
      scrollable: false,
      collapsible: false,
    },
    {
      id: 'right-panel',
      name: 'Right Panel',
      area: { row: 2, column: 7, rowSpan: 9, columnSpan: 6 },
      widgets: [],
      scrollable: true,
      collapsible: false,
    },
    {
      id: 'footer',
      name: 'Navigation',
      area: { row: 11, column: 1, rowSpan: 2, columnSpan: 12 },
      widgets: [
        { widgetId: 'nav-bar', widgetType: 'navigation', position: 0, config: {} },
      ],
      scrollable: false,
      collapsible: false,
    },
  ],
};
