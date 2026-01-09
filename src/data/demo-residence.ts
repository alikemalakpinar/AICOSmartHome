/**
 * AICO Smart Home - Demo Residence Data
 *
 * Sample luxury residence for demonstration purposes.
 */

import type {
  Residence,
  ResidenceId,
  Floor,
  FloorId,
  Room,
  RoomId,
  DeviceId,
  SceneId,
  ISOTimestamp,
} from '@/types/core';

// Helper to create branded types
const asResidenceId = (s: string) => s as ResidenceId;
const asFloorId = (s: string) => s as FloorId;
const asRoomId = (s: string) => s as RoomId;
const asDeviceId = (s: string) => s as DeviceId;
const asSceneId = (s: string) => s as SceneId;
const asTimestamp = (s: string) => s as ISOTimestamp;

// ============================================================================
// Demo Residence: Bosphorus Villa
// ============================================================================

const createDemoRoom = (
  id: string,
  floorId: string,
  name: string,
  type: Room['type'],
  position: { x: number; z: number },
  size: { width: number; depth: number }
): Room => ({
  id: asRoomId(id),
  floorId: asFloorId(floorId),
  name,
  type,
  boundaries: {
    vertices: [
      { x: position.x, y: 0, z: position.z },
      { x: position.x + size.width, y: 0, z: position.z },
      { x: position.x + size.width, y: 0, z: position.z + size.depth },
      { x: position.x, y: 0, z: position.z + size.depth },
    ],
    normal: { x: 0, y: 1, z: 0 },
  },
  area: size.width * size.depth,
  devices: [],
  scenes: [asSceneId(`scene-${id}-default`)],
  currentState: {
    temperature: 22,
    humidity: 45,
    co2Level: 400,
    pm25Level: 10,
    lightLevel: 300,
    occupancy: {
      occupied: false,
      occupantCount: 0,
      occupantIds: [],
      lastMotion: asTimestamp(new Date().toISOString()),
      lastPresenceChange: asTimestamp(new Date().toISOString()),
    },
    lastUpdated: asTimestamp(new Date().toISOString()),
  },
  preferences: {
    defaultTemperature: 22,
    defaultLighting: {
      brightness: 80,
      colorTemperature: 4000,
    },
  },
});

const groundFloorRooms: Room[] = [
  createDemoRoom('room-entrance', 'floor-ground', 'Giriş', 'entrance', { x: 0, z: 0 }, { width: 4, depth: 4 }),
  createDemoRoom('room-living', 'floor-ground', 'Oturma Odası', 'living_room', { x: -8, z: 0 }, { width: 8, depth: 6 }),
  createDemoRoom('room-kitchen', 'floor-ground', 'Mutfak', 'kitchen', { x: 4, z: 0 }, { width: 5, depth: 5 }),
  createDemoRoom('room-dining', 'floor-ground', 'Yemek Odası', 'dining_room', { x: -8, z: -7 }, { width: 6, depth: 5 }),
  createDemoRoom('room-wc', 'floor-ground', 'WC', 'bathroom', { x: 4, z: -4 }, { width: 2, depth: 3 }),
];

const firstFloorRooms: Room[] = [
  createDemoRoom('room-master', 'floor-first', 'Ana Yatak Odası', 'master_bedroom', { x: -8, z: 0 }, { width: 7, depth: 6 }),
  createDemoRoom('room-master-bath', 'floor-first', 'Ana Banyo', 'master_bathroom', { x: -8, z: -5 }, { width: 4, depth: 4 }),
  createDemoRoom('room-bedroom2', 'floor-first', 'Yatak Odası 2', 'bedroom', { x: 2, z: 0 }, { width: 5, depth: 5 }),
  createDemoRoom('room-bedroom3', 'floor-first', 'Yatak Odası 3', 'guest_bedroom', { x: 2, z: -6 }, { width: 5, depth: 5 }),
  createDemoRoom('room-bath2', 'floor-first', 'Banyo', 'bathroom', { x: -2, z: 0 }, { width: 3, depth: 3 }),
  createDemoRoom('room-hallway1', 'floor-first', 'Koridor', 'hallway', { x: -2, z: -4 }, { width: 4, depth: 6 }),
];

const basementRooms: Room[] = [
  createDemoRoom('room-cinema', 'floor-basement', 'Sinema Odası', 'cinema', { x: -6, z: 0 }, { width: 8, depth: 6 }),
  createDemoRoom('room-gym', 'floor-basement', 'Spor Salonu', 'gym', { x: 3, z: 0 }, { width: 6, depth: 5 }),
  createDemoRoom('room-wine', 'floor-basement', 'Şarap Mahzeni', 'wine_cellar', { x: 3, z: -6 }, { width: 4, depth: 4 }),
  createDemoRoom('room-tech', 'floor-basement', 'Teknik Oda', 'server_room', { x: -6, z: -5 }, { width: 4, depth: 4 }),
];

const floors: Floor[] = [
  {
    id: asFloorId('floor-basement'),
    residenceId: asResidenceId('residence-demo'),
    level: -1,
    name: 'Bodrum Kat',
    rooms: basementRooms,
    elevation: -3,
    height: 2.8,
    model3D: {
      url: '/models/floors/basement.glb',
      format: 'glb',
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      position: { x: 0, y: -3, z: 0 },
    },
  },
  {
    id: asFloorId('floor-ground'),
    residenceId: asResidenceId('residence-demo'),
    level: 0,
    name: 'Zemin Kat',
    rooms: groundFloorRooms,
    elevation: 0,
    height: 3.2,
    model3D: {
      url: '/models/floors/ground.glb',
      format: 'glb',
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      position: { x: 0, y: 0, z: 0 },
    },
  },
  {
    id: asFloorId('floor-first'),
    residenceId: asResidenceId('residence-demo'),
    level: 1,
    name: 'Birinci Kat',
    rooms: firstFloorRooms,
    elevation: 3.2,
    height: 3,
    model3D: {
      url: '/models/floors/first.glb',
      format: 'glb',
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      position: { x: 0, y: 3.2, z: 0 },
    },
  },
];

export const demoResidence: Residence = {
  id: asResidenceId('residence-demo'),
  name: 'Boğaz Villası',
  type: 'primary',
  location: {
    latitude: 41.0856,
    longitude: 29.0553,
    altitude: 50,
  },
  address: {
    street: 'Yalı Sokak No: 42',
    city: 'İstanbul',
    state: 'İstanbul',
    postalCode: '34470',
    country: 'Türkiye',
  },
  timezone: 'Europe/Istanbul',
  floors,
  zones: [
    {
      id: 'zone-hvac-ground' as any,
      residenceId: asResidenceId('residence-demo'),
      name: 'Zemin Kat HVAC',
      type: 'hvac',
      rooms: groundFloorRooms.map(r => r.id),
      devices: [],
    },
    {
      id: 'zone-hvac-first' as any,
      residenceId: asResidenceId('residence-demo'),
      name: 'Birinci Kat HVAC',
      type: 'hvac',
      rooms: firstFloorRooms.map(r => r.id),
      devices: [],
    },
  ],
  mode: 'home',
  model3D: {
    url: '/models/residence.glb',
    format: 'glb',
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    position: { x: 0, y: 0, z: 0 },
  },
  metadata: {
    area: 450,
    constructionYear: 2020,
    emergencyContacts: [
      { name: 'Güvenlik', role: 'security', phone: '+90 212 XXX XX XX', priority: 1 },
      { name: 'Teknik Servis', role: 'maintenance', phone: '+90 212 XXX XX XX', priority: 2 },
    ],
  },
};

export default demoResidence;
