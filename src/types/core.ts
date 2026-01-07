/**
 * AICO Smart Home - Core Type Definitions
 *
 * Foundation types for the entire system.
 */

// ============================================================================
// Branded Types for Type Safety
// ============================================================================

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type ResidenceId = Brand<string, 'ResidenceId'>;
export type FloorId = Brand<string, 'FloorId'>;
export type RoomId = Brand<string, 'RoomId'>;
export type ZoneId = Brand<string, 'ZoneId'>;
export type DeviceId = Brand<string, 'DeviceId'>;
export type UserId = Brand<string, 'UserId'>;
export type SceneId = Brand<string, 'SceneId'>;
export type RuleId = Brand<string, 'RuleId'>;
export type EventId = Brand<string, 'EventId'>;

export type ISOTimestamp = Brand<string, 'ISOTimestamp'>;
export type UnixTimestamp = Brand<number, 'UnixTimestamp'>;

// ============================================================================
// Geometry Types
// ============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface BoundingBox3D {
  min: Vector3D;
  max: Vector3D;
}

export interface Polygon2D {
  vertices: Vector2D[];
}

export interface Polygon3D {
  vertices: Vector3D[];
  normal: Vector3D;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

// ============================================================================
// 3D Model Types
// ============================================================================

export interface Model3DReference {
  url: string;
  format: 'gltf' | 'glb' | 'fbx' | 'obj';
  scale: Vector3D;
  rotation: Quaternion;
  position: Vector3D;
  lodLevels?: LODLevel[];
}

export interface LODLevel {
  distance: number;
  url: string;
}

export interface Material3D {
  id: string;
  type: 'standard' | 'physical' | 'emissive' | 'glass';
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  emissiveIntensity?: number;
}

// ============================================================================
// Residence Types
// ============================================================================

export type ResidenceType = 'primary' | 'secondary' | 'vacation' | 'yacht' | 'aircraft';

export type ResidenceMode =
  | 'home'
  | 'away'
  | 'night'
  | 'vacation'
  | 'guest'
  | 'party'
  | 'cinema'
  | 'emergency'
  | 'lockdown';

export interface Residence {
  id: ResidenceId;
  name: string;
  type: ResidenceType;
  location: GeoLocation;
  address: Address;
  timezone: string;
  floors: Floor[];
  zones: Zone[];
  mode: ResidenceMode;
  model3D: Model3DReference;
  metadata: ResidenceMetadata;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface ResidenceMetadata {
  area: number; // square meters
  constructionYear?: number;
  lastRenovation?: ISOTimestamp;
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  priority: number;
}

// ============================================================================
// Floor Types
// ============================================================================

export interface Floor {
  id: FloorId;
  residenceId: ResidenceId;
  level: number; // 0 = ground, -1 = basement, 1 = first floor, etc.
  name: string;
  rooms: Room[];
  floorPlan?: FloorPlan;
  model3D: Model3DReference;
  elevation: number; // meters above ground
  height: number; // floor to ceiling height
}

export interface FloorPlan {
  imageUrl: string;
  scale: number; // pixels per meter
  origin: Vector2D;
  rotation: number; // degrees
}

// ============================================================================
// Room Types
// ============================================================================

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'master_bedroom'
  | 'guest_bedroom'
  | 'bathroom'
  | 'master_bathroom'
  | 'kitchen'
  | 'dining_room'
  | 'home_office'
  | 'library'
  | 'media_room'
  | 'cinema'
  | 'gym'
  | 'spa'
  | 'sauna'
  | 'pool'
  | 'wine_cellar'
  | 'garage'
  | 'laundry'
  | 'storage'
  | 'hallway'
  | 'staircase'
  | 'elevator'
  | 'terrace'
  | 'balcony'
  | 'garden'
  | 'entrance'
  | 'foyer'
  | 'utility'
  | 'server_room'
  | 'security_room'
  | 'staff_quarters'
  | 'other';

export interface Room {
  id: RoomId;
  floorId: FloorId;
  name: string;
  type: RoomType;
  boundaries: Polygon3D;
  area: number; // square meters
  devices: DeviceId[];
  scenes: SceneId[];
  currentState: RoomState;
  model3D?: Model3DReference;
  preferences: RoomPreferences;
}

export interface RoomState {
  temperature: number;
  humidity: number;
  co2Level: number;
  pm25Level: number;
  lightLevel: number; // lux
  occupancy: OccupancyState;
  lastUpdated: ISOTimestamp;
}

export interface OccupancyState {
  occupied: boolean;
  occupantCount: number;
  occupantIds: UserId[];
  lastMotion: ISOTimestamp;
  lastPresenceChange: ISOTimestamp;
}

export interface RoomPreferences {
  defaultTemperature: number;
  defaultLighting: LightingPreset;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
  maxOccupancy?: number;
}

export interface LightingPreset {
  brightness: number; // 0-100
  colorTemperature: number; // Kelvin
  color?: string; // hex color for RGB lights
}

// ============================================================================
// Zone Types
// ============================================================================

export type ZoneType =
  | 'hvac'
  | 'lighting'
  | 'security'
  | 'audio'
  | 'custom';

export interface Zone {
  id: ZoneId;
  residenceId: ResidenceId;
  name: string;
  type: ZoneType;
  rooms: RoomId[];
  devices: DeviceId[];
  schedule?: ZoneSchedule;
}

export interface ZoneSchedule {
  enabled: boolean;
  entries: ScheduleEntry[];
}

export interface ScheduleEntry {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm
  endTime: string;
  settings: Record<string, unknown>;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ============================================================================
// Scene Types
// ============================================================================

export interface Scene {
  id: SceneId;
  name: string;
  description?: string;
  icon: string;
  color: string;
  scope: SceneScope;
  actions: SceneAction[];
  transitionDuration: number; // milliseconds
  triggers?: SceneTrigger[];
}

export type SceneScope =
  | { type: 'room'; roomId: RoomId }
  | { type: 'floor'; floorId: FloorId }
  | { type: 'zone'; zoneId: ZoneId }
  | { type: 'residence'; residenceId: ResidenceId };

export interface SceneAction {
  deviceId: DeviceId;
  command: string;
  parameters: Record<string, unknown>;
  delay?: number; // milliseconds
}

export interface SceneTrigger {
  type: 'time' | 'presence' | 'event' | 'voice';
  config: Record<string, unknown>;
}

// ============================================================================
// Time & Calendar Types
// ============================================================================

export interface TimeOfDay {
  hour: number;
  minute: number;
  second?: number;
}

export type TimeOfDayPeriod =
  | 'night'      // 00:00 - 05:59
  | 'morning'    // 06:00 - 11:59
  | 'afternoon'  // 12:00 - 17:59
  | 'evening';   // 18:00 - 23:59

export interface SunTimes {
  sunrise: ISOTimestamp;
  sunset: ISOTimestamp;
  solarNoon: ISOTimestamp;
  dawn: ISOTimestamp;
  dusk: ISOTimestamp;
  goldenHour: ISOTimestamp;
  goldenHourEnd: ISOTimestamp;
}

// ============================================================================
// Weather Types
// ============================================================================

export interface WeatherData {
  timestamp: ISOTimestamp;
  location: GeoLocation;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

export interface CurrentWeather {
  condition: WeatherCondition;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
  cloudCover: number;
}

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'snow'
  | 'sleet'
  | 'hail';

export interface WeatherForecast {
  date: ISOTimestamp;
  condition: WeatherCondition;
  temperatureHigh: number;
  temperatureLow: number;
  precipitationProbability: number;
  humidity: number;
}

export interface WeatherAlert {
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  start: ISOTimestamp;
  end: ISOTimestamp;
}

// ============================================================================
// Result Types
// ============================================================================

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
