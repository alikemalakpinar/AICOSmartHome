/**
 * AICO Smart Home - Biometric Authentication Types
 *
 * Types for face recognition, voice recognition, and user identification.
 */

import type { UserId, ISOTimestamp } from '@/types/core';

// ============================================================================
// Face Recognition Types
// ============================================================================

export interface FaceDetectionResult {
  detected: boolean;
  faces: DetectedFace[];
  timestamp: ISOTimestamp;
  frameId: string;
}

export interface DetectedFace {
  id: string;
  boundingBox: BoundingBox;
  landmarks: FaceLandmarks;
  confidence: number;
  quality: FaceQuality;
  embedding?: Float32Array;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  leftEye: Point2D;
  rightEye: Point2D;
  nose: Point2D;
  leftMouth: Point2D;
  rightMouth: Point2D;
  additionalPoints?: Point2D[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface FaceQuality {
  score: number;
  brightness: number;
  blur: number;
  occlusion: number;
  poseYaw: number;
  posePitch: number;
  poseRoll: number;
}

export interface FaceRecognitionResult {
  recognized: boolean;
  userId?: UserId;
  userName?: string;
  confidence: number;
  faceId: string;
  embedding: Float32Array;
  matchDistance: number;
  timestamp: ISOTimestamp;
}

export interface FaceEnrollment {
  userId: UserId;
  embeddings: Float32Array[];
  photos: EnrollmentPhoto[];
  enrolledAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  quality: number;
}

export interface EnrollmentPhoto {
  id: string;
  imageData: string; // base64
  capturedAt: ISOTimestamp;
  quality: FaceQuality;
}

// ============================================================================
// Voice Recognition Types
// ============================================================================

export interface VoiceDetectionResult {
  detected: boolean;
  speechSegments: SpeechSegment[];
  audioLevel: number;
  timestamp: ISOTimestamp;
}

export interface SpeechSegment {
  start: number;
  end: number;
  confidence: number;
}

export interface VoiceRecognitionResult {
  recognized: boolean;
  userId?: UserId;
  userName?: string;
  confidence: number;
  embedding: Float32Array;
  timestamp: ISOTimestamp;
}

export interface VoiceEnrollment {
  userId: UserId;
  embeddings: Float32Array[];
  samples: VoiceSample[];
  enrolledAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface VoiceSample {
  id: string;
  duration: number;
  capturedAt: ISOTimestamp;
  quality: number;
}

// ============================================================================
// Combined Biometric Types
// ============================================================================

export interface BiometricIdentificationResult {
  identified: boolean;
  userId?: UserId;
  userName?: string;
  confidence: number;
  method: BiometricMethod;
  faceResult?: FaceRecognitionResult;
  voiceResult?: VoiceRecognitionResult;
  timestamp: ISOTimestamp;
  sessionId: string;
}

export type BiometricMethod =
  | 'face'
  | 'voice'
  | 'face_and_voice'
  | 'pin'
  | 'fingerprint';

export interface BiometricSession {
  id: string;
  userId?: UserId;
  startedAt: ISOTimestamp;
  lastActivity: ISOTimestamp;
  method: BiometricMethod;
  confidence: number;
  isActive: boolean;
}

// ============================================================================
// Camera & Sensor Types
// ============================================================================

export interface CameraConfig {
  deviceId: string;
  resolution: Resolution;
  frameRate: number;
  infrared: boolean;
  autoExposure: boolean;
  faceDetectionEnabled: boolean;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface CameraFrame {
  id: string;
  timestamp: ISOTimestamp;
  resolution: Resolution;
  format: 'rgb' | 'rgba' | 'gray' | 'ir';
  data: Uint8Array | ImageData;
}

export interface MicrophoneConfig {
  deviceId: string;
  sampleRate: number;
  channels: number;
  bufferSize: number;
  noiseReduction: boolean;
}

export interface AudioChunk {
  id: string;
  timestamp: ISOTimestamp;
  sampleRate: number;
  channels: number;
  data: Float32Array;
  duration: number;
}

// ============================================================================
// Privacy & Security Types
// ============================================================================

export interface BiometricPrivacySettings {
  storeEmbeddings: boolean;
  storePhotos: boolean;
  retentionDays: number;
  localOnly: boolean;
  encryptAtRest: boolean;
}

export interface BiometricAuditLog {
  id: string;
  timestamp: ISOTimestamp;
  event: BiometricAuditEvent;
  userId?: UserId;
  method: BiometricMethod;
  success: boolean;
  details?: Record<string, unknown>;
}

export type BiometricAuditEvent =
  | 'enrollment_started'
  | 'enrollment_completed'
  | 'enrollment_failed'
  | 'identification_attempted'
  | 'identification_success'
  | 'identification_failed'
  | 'session_started'
  | 'session_ended'
  | 'data_deleted';

// ============================================================================
// Model Configuration
// ============================================================================

export interface FaceModelConfig {
  modelPath: string;
  inputSize: number;
  embeddingSize: number;
  threshold: number;
  backend: 'tensorflow' | 'onnx' | 'wasm';
}

export interface VoiceModelConfig {
  modelPath: string;
  sampleRate: number;
  windowSize: number;
  hopSize: number;
  embeddingSize: number;
  threshold: number;
  backend: 'tensorflow' | 'onnx' | 'wasm';
}

export interface BiometricModelStatus {
  faceModel: ModelStatus;
  voiceModel: ModelStatus;
}

export interface ModelStatus {
  loaded: boolean;
  loading: boolean;
  error?: string;
  version?: string;
  lastUpdated?: ISOTimestamp;
}
