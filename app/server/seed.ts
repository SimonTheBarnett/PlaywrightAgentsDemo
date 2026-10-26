import type { Database } from './types.js';

// Public demonstration credentials are documented in README. Only salted scrypt
// hashes are embedded here; resetting restores the same logical account records.
export function seedData(): Database {
  return {
    schemaVersion: 1,
    nextBookingId: 1,
    users: [
      { id: 'guest', email: 'guest@example.test', role: 'guest', passwordHash: '49569bf3d1c0cf6cc15461653b92c6dc:2aaa93d5f16566c2f64fe0b0882098f050b10840e5420cf375205fb0aee12688ec7e96f2dc0d07ddd8610be140a1a69654ecef3778b9652aa3dcb7c4059bc2ca' },
      { id: 'guest2', email: 'guest2@example.test', role: 'guest', passwordHash: 'f10abcecc99f77172862eb82e870eea2:7369d08a9a89f58abfa267a1cf19427b7c32b126b562e0462dc5eb2af9c01b95d8e0f1601eb211c90bcb6b36d0a6a95882dcb6bbb943d4878eec6962286f611b' },
      { id: 'admin', email: 'admin@example.test', role: 'admin', passwordHash: '3bf6ad56a2816a3824662c8b99cad66a:648bbd9772d2e3a806700dd8b50e7fd159623cc30f72ff33ed9a77adab1f5926cf653174bc4ce0b7fe7b76f4bd46cc64577a275a20eb4ff2d209ec2f073e2a0c' },
    ],
    rooms: [
      { id: 'room-1', name: 'Heather', description: 'A cosy double room overlooking the garden.', nightlyPrice: 8000 },
      { id: 'room-2', name: 'Thistle', description: 'A quiet twin room with a small seating area.', nightlyPrice: 10000 },
      { id: 'room-3', name: 'Rowan', description: 'A spacious double room with views of the hills.', nightlyPrice: 12000 },
    ],
    bookings: [],
  };
}
