/**
 * AICO Smart Home - Haptic Feedback Hook
 *
 * Provides tactile feedback for wall-mounted touch interface.
 * Supports multiple feedback types for different interactions.
 */

import { useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type HapticType =
  | 'tap'           // Light tap for button press
  | 'selection'     // Selection changed
  | 'success'       // Action completed successfully
  | 'warning'       // Warning feedback
  | 'error'         // Error occurred
  | 'impact'        // Strong impact feedback
  | 'notification'  // Notification received
  | 'drag_start'    // Started dragging
  | 'drag_end'      // Finished dragging
  | 'slider_tick';  // Slider passed a tick mark

export interface HapticPattern {
  duration: number;
  intensity: number;
  delay?: number;
}

export interface HapticFeedbackOptions {
  enabled?: boolean;
  intensity?: number; // 0-1 global intensity multiplier
}

// ============================================================================
// Haptic Patterns
// ============================================================================

const HAPTIC_PATTERNS: Record<HapticType, HapticPattern[]> = {
  tap: [{ duration: 10, intensity: 0.5 }],
  selection: [{ duration: 15, intensity: 0.4 }],
  success: [
    { duration: 20, intensity: 0.6 },
    { duration: 15, intensity: 0.4, delay: 80 },
  ],
  warning: [
    { duration: 30, intensity: 0.7 },
    { duration: 20, intensity: 0.5, delay: 100 },
    { duration: 30, intensity: 0.7, delay: 100 },
  ],
  error: [
    { duration: 40, intensity: 0.9 },
    { duration: 30, intensity: 0.7, delay: 50 },
    { duration: 40, intensity: 0.9, delay: 50 },
  ],
  impact: [{ duration: 25, intensity: 0.8 }],
  notification: [
    { duration: 20, intensity: 0.5 },
    { duration: 20, intensity: 0.5, delay: 150 },
  ],
  drag_start: [{ duration: 12, intensity: 0.3 }],
  drag_end: [{ duration: 18, intensity: 0.5 }],
  slider_tick: [{ duration: 5, intensity: 0.2 }],
};

// ============================================================================
// Haptic Controller
// ============================================================================

class HapticController {
  private enabled: boolean = true;
  private globalIntensity: number = 1.0;
  private lastTriggerTime: number = 0;
  private minInterval: number = 20; // Minimum ms between haptic events

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    // Check for Vibration API support
    if (!('vibrate' in navigator)) {
      console.log('Haptic: Vibration API not supported, using fallback');
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setGlobalIntensity(intensity: number): void {
    this.globalIntensity = Math.max(0, Math.min(1, intensity));
  }

  async trigger(type: HapticType): Promise<void> {
    if (!this.enabled) return;

    const now = Date.now();
    if (now - this.lastTriggerTime < this.minInterval) {
      return; // Rate limiting
    }
    this.lastTriggerTime = now;

    const patterns = HAPTIC_PATTERNS[type];
    if (!patterns) return;

    await this.executePattern(patterns);
  }

  private async executePattern(patterns: HapticPattern[]): Promise<void> {
    for (const pattern of patterns) {
      if (pattern.delay) {
        await this.delay(pattern.delay);
      }

      const adjustedIntensity = pattern.intensity * this.globalIntensity;
      const adjustedDuration = Math.round(pattern.duration * adjustedIntensity);

      this.vibrate(adjustedDuration);
    }
  }

  private vibrate(duration: number): void {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      }
      // For desktop/embedded systems, we might use Web Audio for haptic simulation
      // or communicate with native haptic hardware via WebSocket
      this.triggerHapticHardware(duration);
    } catch (error) {
      // Silently fail - haptic is enhancement, not critical
    }
  }

  private triggerHapticHardware(duration: number): void {
    // This would communicate with the actual haptic motor controller
    // on the wall-mounted hardware via IPC or WebSocket
    if (typeof window !== 'undefined' && (window as any).__AICO_HAPTIC__) {
      (window as any).__AICO_HAPTIC__.trigger(duration);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const hapticController = new HapticController();

// ============================================================================
// Hook
// ============================================================================

export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true, intensity = 1.0 } = options;
  const lastTypeRef = useRef<HapticType | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Update controller settings
  hapticController.setEnabled(enabled);
  hapticController.setGlobalIntensity(intensity);

  const triggerHaptic = useCallback((type: HapticType) => {
    // Debounce same type haptic feedback
    const now = Date.now();
    if (type === lastTypeRef.current && now - lastTimeRef.current < 50) {
      return;
    }

    lastTypeRef.current = type;
    lastTimeRef.current = now;

    hapticController.trigger(type);
  }, []);

  const triggerPattern = useCallback((pattern: HapticPattern[]) => {
    if (!enabled) return;

    pattern.forEach(async (p, i) => {
      const delay = pattern.slice(0, i).reduce((acc, curr) =>
        acc + curr.duration + (curr.delay || 0), 0
      );

      setTimeout(() => {
        if ('vibrate' in navigator) {
          navigator.vibrate(Math.round(p.duration * p.intensity * intensity));
        }
      }, delay);
    });
  }, [enabled, intensity]);

  return {
    triggerHaptic,
    triggerPattern,
    setEnabled: (e: boolean) => hapticController.setEnabled(e),
    setIntensity: (i: number) => hapticController.setGlobalIntensity(i),
  };
}

export default useHapticFeedback;
