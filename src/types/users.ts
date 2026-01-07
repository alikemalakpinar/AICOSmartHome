/**
 * AICO Smart Home - User Type Definitions
 *
 * User profiles, permissions, and biometric data types.
 */

import type {
  UserId,
  ResidenceId,
  RoomId,
  DeviceId,
  SceneId,
  ISOTimestamp,
} from './core';

// ============================================================================
// User Roles
// ============================================================================

export type UserRole =
  | 'owner'         // Full access to everything
  | 'family'        // Full access except system settings
  | 'resident'      // Living in the home, standard access
  | 'guest'         // Temporary access, limited areas
  | 'child'         // Restricted access, parental controls
  | 'staff'         // Service staff, specific area access
  | 'security'      // Security personnel
  | 'maintenance'   // Maintenance staff, technical access
  | 'custom';       // Custom role with specific permissions

// ============================================================================
// User Profile
// ============================================================================

export interface UserProfile {
  id: UserId;
  email: string;
  name: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  residences: UserResidenceAccess[];
  biometric: BiometricData;
  preferences: UserPreferences;
  permissions: Permission[];
  restrictions: Restriction[];
  schedule?: UserSchedule;
  status: UserStatus;
  metadata: UserMetadata;
}

export interface UserResidenceAccess {
  residenceId: ResidenceId;
  role: UserRole;
  accessLevel: AccessLevel;
  validFrom?: ISOTimestamp;
  validUntil?: ISOTimestamp;
}

export type AccessLevel = 'full' | 'limited' | 'temporary' | 'supervised';

// ============================================================================
// Biometric Data
// ============================================================================

export interface BiometricData {
  faceRecognition: FaceRecognitionData | null;
  voiceRecognition: VoiceRecognitionData | null;
  fingerprint: FingerprintData | null;
  pin: PinData | null;
}

export interface FaceRecognitionData {
  enabled: boolean;
  enrolled: boolean;
  enrolledAt?: ISOTimestamp;
  embedding?: Float32Array; // Face embedding vector
  confidence: number;
  lastRecognized?: ISOTimestamp;
  photos: FacePhoto[];
}

export interface FacePhoto {
  id: string;
  url: string;
  capturedAt: ISOTimestamp;
  isActive: boolean;
}

export interface VoiceRecognitionData {
  enabled: boolean;
  enrolled: boolean;
  enrolledAt?: ISOTimestamp;
  embedding?: Float32Array; // Voice embedding vector
  wakeWords: string[];
  lastRecognized?: ISOTimestamp;
}

export interface FingerprintData {
  enabled: boolean;
  fingerIds: string[];
  enrolledAt?: ISOTimestamp;
}

export interface PinData {
  enabled: boolean;
  pinHash: string; // bcrypt hash
  lastChanged: ISOTimestamp;
  failedAttempts: number;
  lockedUntil?: ISOTimestamp;
}

// ============================================================================
// User Preferences
// ============================================================================

export interface UserPreferences {
  language: string;
  temperatureUnit: 'celsius' | 'fahrenheit';
  timeFormat: '12h' | '24h';
  dateFormat: string;
  theme: ThemePreference;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  comfort: ComfortPreferences;
  dashboard: DashboardPreferences;
  accessibility: AccessibilityPreferences;
}

export interface ThemePreference {
  mode: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  hapticFeedback: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string;
  categories: Record<NotificationCategory, boolean>;
}

export type NotificationCategory =
  | 'security'
  | 'climate'
  | 'energy'
  | 'maintenance'
  | 'system'
  | 'custom';

export interface PrivacyPreferences {
  sharePresence: boolean;
  allowTracking: boolean;
  showInOccupancy: boolean;
  cameraExclusions: RoomId[]; // Rooms where user doesn't want to be tracked
}

export interface ComfortPreferences {
  preferredTemperature: number;
  preferredHumidity: number;
  preferredLightingLevel: number;
  preferredColorTemperature: number;
  morningRoutine?: RoutinePreference;
  eveningRoutine?: RoutinePreference;
  sleepPreferences?: SleepPreferences;
}

export interface RoutinePreference {
  enabled: boolean;
  time: string; // HH:mm
  scenes: SceneId[];
  duration: number; // minutes
}

export interface SleepPreferences {
  bedtime: string; // HH:mm
  wakeTime: string;
  windDownDuration: number; // minutes
  gradualWake: boolean;
  wakeGradualDuration: number; // minutes
}

export interface DashboardPreferences {
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  favoriteDevices: DeviceId[];
  favoriteScenes: SceneId[];
  favoriteRooms: RoomId[];
}

export type DashboardLayout = 'grid' | 'list' | 'minimal' | 'custom';

export interface WidgetConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  reduceMotion: boolean;
  colorBlindMode?: 'protanopia' | 'deuteranopia' | 'tritanopia';
  voiceControlEnabled: boolean;
  gestureSimplification: boolean;
}

// ============================================================================
// Permissions
// ============================================================================

export interface Permission {
  id: string;
  resource: PermissionResource;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
}

export type PermissionResource =
  | { type: 'all' }
  | { type: 'residence'; residenceId: ResidenceId }
  | { type: 'room'; roomId: RoomId }
  | { type: 'device'; deviceId: DeviceId }
  | { type: 'device_category'; category: string }
  | { type: 'scene'; sceneId: SceneId }
  | { type: 'feature'; feature: string };

export type PermissionAction =
  | 'view'
  | 'control'
  | 'configure'
  | 'create'
  | 'delete'
  | 'share'
  | 'admin';

export interface PermissionCondition {
  type: 'time' | 'location' | 'presence' | 'custom';
  config: Record<string, unknown>;
}

// ============================================================================
// Restrictions
// ============================================================================

export interface Restriction {
  id: string;
  type: RestrictionType;
  config: RestrictionConfig;
  reason?: string;
  enforcer: UserId | 'system';
  createdAt: ISOTimestamp;
  expiresAt?: ISOTimestamp;
}

export type RestrictionType =
  | 'room_access'
  | 'device_access'
  | 'feature_access'
  | 'time_restriction'
  | 'content_restriction'
  | 'spending_limit'
  | 'volume_limit';

export type RestrictionConfig =
  | RoomAccessRestriction
  | DeviceAccessRestriction
  | TimeRestriction
  | ContentRestriction
  | LimitRestriction;

export interface RoomAccessRestriction {
  type: 'room_access';
  rooms: RoomId[];
  action: 'block' | 'supervise' | 'notify';
}

export interface DeviceAccessRestriction {
  type: 'device_access';
  devices: DeviceId[];
  categories?: string[];
  action: 'block' | 'limit' | 'notify';
}

export interface TimeRestriction {
  type: 'time_restriction';
  schedule: {
    days: number[]; // 0-6, 0 = Sunday
    startTime: string;
    endTime: string;
  };
  action: 'block' | 'notify';
}

export interface ContentRestriction {
  type: 'content_restriction';
  categories: string[];
  rating: string;
}

export interface LimitRestriction {
  type: 'limit';
  resource: string;
  limit: number;
  period: 'day' | 'week' | 'month';
}

// ============================================================================
// User Schedule
// ============================================================================

export interface UserSchedule {
  defaultPresence: PresenceSchedule;
  exceptions: ScheduleException[];
}

export interface PresenceSchedule {
  weekdays: DailySchedule;
  weekends: DailySchedule;
}

export interface DailySchedule {
  wakeTime: string;
  leaveTime?: string;
  returnTime?: string;
  sleepTime: string;
}

export interface ScheduleException {
  date: string; // YYYY-MM-DD
  type: 'away' | 'home' | 'vacation' | 'custom';
  description?: string;
}

// ============================================================================
// User Status
// ============================================================================

export interface UserStatus {
  presence: UserPresence;
  currentLocation?: UserLocation;
  lastActive: ISOTimestamp;
  sessions: UserSession[];
}

export interface UserPresence {
  isHome: boolean;
  currentRoom?: RoomId;
  residenceId?: ResidenceId;
  since: ISOTimestamp;
  source: 'biometric' | 'device' | 'manual' | 'geofence' | 'schedule';
}

export interface UserLocation {
  type: 'room' | 'zone' | 'geofence';
  id: string;
  confidence: number;
  timestamp: ISOTimestamp;
}

export interface UserSession {
  id: string;
  device: SessionDevice;
  startedAt: ISOTimestamp;
  lastActivity: ISOTimestamp;
  ipAddress?: string;
  location?: string;
}

export interface SessionDevice {
  type: 'panel' | 'mobile' | 'web' | 'voice';
  name: string;
  os?: string;
  browser?: string;
}

// ============================================================================
// User Metadata
// ============================================================================

export interface UserMetadata {
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UserId | 'system';
  lastLogin?: ISOTimestamp;
  loginCount: number;
  invitedBy?: UserId;
  notes?: string;
  tags: string[];
}

// ============================================================================
// Guest Access
// ============================================================================

export interface GuestAccess {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  accessCode?: string;
  qrCode?: string;
  validFrom: ISOTimestamp;
  validUntil: ISOTimestamp;
  permissions: Permission[];
  restrictions: Restriction[];
  usageCount: number;
  maxUsage?: number;
  createdBy: UserId;
  createdAt: ISOTimestamp;
}

// ============================================================================
// Activity Log
// ============================================================================

export interface UserActivity {
  id: string;
  userId: UserId;
  type: ActivityType;
  timestamp: ISOTimestamp;
  details: Record<string, unknown>;
  source: string;
  residenceId: ResidenceId;
  roomId?: RoomId;
  deviceId?: DeviceId;
}

export type ActivityType =
  | 'login'
  | 'logout'
  | 'presence_change'
  | 'device_control'
  | 'scene_activate'
  | 'setting_change'
  | 'permission_change'
  | 'biometric_enroll'
  | 'access_denied'
  | 'alert_acknowledge';
