/**
 * AICO Smart Home - Biometric Manager
 *
 * Central manager for all biometric authentication methods.
 */

import { EventEmitter } from 'eventemitter3';
import type { UserId, ISOTimestamp } from '@/types/core';
import type { UserProfile } from '@/types/users';
import type {
  BiometricIdentificationResult,
  BiometricSession,
  BiometricMethod,
  BiometricAuditLog,
  BiometricAuditEvent,
  BiometricPrivacySettings,
  CameraFrame,
  AudioChunk,
  FaceDetectionResult,
  FaceRecognitionResult,
} from './types';
import { FaceRecognitionService } from './face-recognition';

// ============================================================================
// Biometric Manager Events
// ============================================================================

interface BiometricManagerEvents {
  'user:identified': (result: BiometricIdentificationResult) => void;
  'user:lost': (sessionId: string) => void;
  'session:started': (session: BiometricSession) => void;
  'session:updated': (session: BiometricSession) => void;
  'session:ended': (session: BiometricSession) => void;
  'face:detected': (result: FaceDetectionResult) => void;
  'error': (error: Error) => void;
}

// ============================================================================
// Biometric Manager Configuration
// ============================================================================

export interface BiometricManagerConfig {
  faceRecognition: {
    enabled: boolean;
    modelPath: string;
    threshold: number;
    minQuality: number;
  };
  voiceRecognition: {
    enabled: boolean;
    modelPath: string;
    threshold: number;
  };
  sessionTimeout: number; // ms
  reidentificationInterval: number; // ms
  privacySettings: BiometricPrivacySettings;
}

// ============================================================================
// Biometric Manager
// ============================================================================

export class BiometricManager extends EventEmitter<BiometricManagerEvents> {
  private config: BiometricManagerConfig;
  private faceService: FaceRecognitionService | null = null;
  private activeSessions = new Map<string, BiometricSession>();
  private userProfiles = new Map<UserId, UserProfile>();
  private auditLog: BiometricAuditLog[] = [];
  private sessionCleanupInterval?: ReturnType<typeof setInterval>;
  private processing = false;

  constructor(config: BiometricManagerConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Initialize face recognition
    if (this.config.faceRecognition.enabled) {
      this.faceService = new FaceRecognitionService({
        modelPath: this.config.faceRecognition.modelPath,
        inputSize: 160,
        embeddingSize: 512,
        threshold: this.config.faceRecognition.threshold,
        backend: 'onnx',
      });

      this.faceService.on('detection', result => {
        this.emit('face:detected', result);
      });

      this.faceService.on('recognition', result => {
        this.handleFaceRecognition(result);
      });

      await this.faceService.initialize();
    }

    // Start session cleanup
    this.sessionCleanupInterval = setInterval(
      () => this.cleanupSessions(),
      10000
    );
  }

  async destroy(): Promise<void> {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }

    if (this.faceService) {
      await this.faceService.destroy();
    }

    this.activeSessions.clear();
    this.removeAllListeners();
  }

  // ============================================================================
  // Frame Processing
  // ============================================================================

  async processFrame(frame: CameraFrame): Promise<BiometricIdentificationResult[]> {
    if (this.processing) {
      return [];
    }

    this.processing = true;
    const results: BiometricIdentificationResult[] = [];

    try {
      if (this.faceService) {
        // Detect faces
        const detection = await this.faceService.detectFaces(frame);

        // Process each detected face
        for (const face of detection.faces) {
          // Check quality threshold
          if (face.quality.score < this.config.faceRecognition.minQuality) {
            continue;
          }

          // Recognize face
          const recognition = await this.faceService.recognizeFace(face, frame);

          if (recognition.recognized && recognition.userId) {
            const result = this.createIdentificationResult(
              recognition.userId,
              recognition.confidence,
              'face'
            );
            result.faceResult = recognition;
            results.push(result);

            // Update or create session
            this.updateSession(result);
          }
        }

        // Check for lost sessions (faces no longer visible)
        this.checkLostSessions(detection);
      }
    } catch (error) {
      this.emit('error', error as Error);
    } finally {
      this.processing = false;
    }

    return results;
  }

  async processAudio(chunk: AudioChunk): Promise<BiometricIdentificationResult | null> {
    // Voice recognition processing
    // Implementation would be similar to face recognition
    return null;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  getActiveSession(sessionId: string): BiometricSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): BiometricSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSessionByUser(userId: UserId): BiometricSession | undefined {
    return Array.from(this.activeSessions.values()).find(
      s => s.userId === userId && s.isActive
    );
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.emit('session:ended', session);
      this.activeSessions.delete(sessionId);

      this.logAuditEvent({
        event: 'session_ended',
        userId: session.userId,
        method: session.method,
        success: true,
      });
    }
  }

  private updateSession(result: BiometricIdentificationResult): void {
    const existingSession = result.userId
      ? this.getSessionByUser(result.userId)
      : undefined;

    if (existingSession) {
      // Update existing session
      existingSession.lastActivity = new Date().toISOString() as ISOTimestamp;
      existingSession.confidence = Math.max(existingSession.confidence, result.confidence);
      this.emit('session:updated', existingSession);
    } else {
      // Create new session
      const session: BiometricSession = {
        id: result.sessionId,
        userId: result.userId,
        startedAt: result.timestamp,
        lastActivity: result.timestamp,
        method: result.method,
        confidence: result.confidence,
        isActive: true,
      };

      this.activeSessions.set(session.id, session);
      this.emit('session:started', session);
      this.emit('user:identified', result);

      this.logAuditEvent({
        event: 'session_started',
        userId: result.userId,
        method: result.method,
        success: true,
      });
    }
  }

  private checkLostSessions(detection: FaceDetectionResult): void {
    const now = Date.now();
    const timeout = this.config.sessionTimeout;

    for (const [sessionId, session] of this.activeSessions) {
      const lastActivityTime = new Date(session.lastActivity).getTime();

      if (now - lastActivityTime > timeout) {
        session.isActive = false;
        this.emit('user:lost', sessionId);
        this.emit('session:ended', session);
        this.activeSessions.delete(sessionId);

        this.logAuditEvent({
          event: 'session_ended',
          userId: session.userId,
          method: session.method,
          success: true,
          details: { reason: 'timeout' },
        });
      }
    }
  }

  private cleanupSessions(): void {
    const now = Date.now();
    const maxAge = this.config.sessionTimeout * 2;

    for (const [sessionId, session] of this.activeSessions) {
      const startTime = new Date(session.startedAt).getTime();
      if (now - startTime > maxAge && !session.isActive) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  // ============================================================================
  // Enrollment
  // ============================================================================

  async enrollUser(
    userId: UserId,
    profile: UserProfile
  ): Promise<void> {
    this.userProfiles.set(userId, profile);

    this.logAuditEvent({
      event: 'enrollment_started',
      userId,
      method: 'face',
      success: true,
    });
  }

  async addFaceEnrollmentSample(
    userId: UserId,
    frame: CameraFrame
  ): Promise<number> {
    if (!this.faceService) {
      throw new Error('Face recognition not enabled');
    }

    const detection = await this.faceService.detectFaces(frame);
    if (detection.faces.length === 0) {
      throw new Error('No face detected');
    }

    if (detection.faces.length > 1) {
      throw new Error('Multiple faces detected');
    }

    const face = detection.faces[0];
    return this.faceService.addEnrollmentSample(userId, face, frame);
  }

  async completeEnrollment(userId: UserId): Promise<void> {
    if (!this.faceService) {
      throw new Error('Face recognition not enabled');
    }

    await this.faceService.completeEnrollment(userId);

    this.logAuditEvent({
      event: 'enrollment_completed',
      userId,
      method: 'face',
      success: true,
    });
  }

  async deleteEnrollment(userId: UserId): Promise<void> {
    this.userProfiles.delete(userId);

    if (this.faceService) {
      await this.faceService.deleteEnrollment(userId);
    }

    this.logAuditEvent({
      event: 'data_deleted',
      userId,
      method: 'face',
      success: true,
    });
  }

  // ============================================================================
  // Audit & Privacy
  // ============================================================================

  getAuditLog(filter?: {
    userId?: UserId;
    event?: BiometricAuditEvent;
    startDate?: ISOTimestamp;
    endDate?: ISOTimestamp;
  }): BiometricAuditLog[] {
    let logs = [...this.auditLog];

    if (filter?.userId) {
      logs = logs.filter(l => l.userId === filter.userId);
    }

    if (filter?.event) {
      logs = logs.filter(l => l.event === filter.event);
    }

    if (filter?.startDate) {
      logs = logs.filter(l => l.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      logs = logs.filter(l => l.timestamp <= filter.endDate!);
    }

    return logs;
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private createIdentificationResult(
    userId: UserId,
    confidence: number,
    method: BiometricMethod
  ): BiometricIdentificationResult {
    const profile = this.userProfiles.get(userId);

    return {
      identified: true,
      userId,
      userName: profile?.name,
      confidence,
      method,
      timestamp: new Date().toISOString() as ISOTimestamp,
      sessionId: crypto.randomUUID(),
    };
  }

  private handleFaceRecognition(result: FaceRecognitionResult): void {
    if (result.recognized && result.userId) {
      this.logAuditEvent({
        event: 'identification_success',
        userId: result.userId,
        method: 'face',
        success: true,
        details: { confidence: result.confidence },
      });
    } else {
      this.logAuditEvent({
        event: 'identification_failed',
        method: 'face',
        success: false,
        details: { confidence: result.confidence },
      });
    }
  }

  private logAuditEvent(
    params: Omit<BiometricAuditLog, 'id' | 'timestamp'>
  ): void {
    const log: BiometricAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString() as ISOTimestamp,
      ...params,
    };

    this.auditLog.push(log);

    // Trim log if too large
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }
}

// Export singleton factory
export function createBiometricManager(config: BiometricManagerConfig): BiometricManager {
  return new BiometricManager(config);
}
