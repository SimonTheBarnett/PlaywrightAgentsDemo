export type Role = 'guest' | 'admin';
export interface User {
  id: string;
  email: string;
  role: Role;
  passwordHash: string;
}
export interface Room {
  id: string;
  name: string;
  description: string;
  nightlyPrice: number;
}
export interface Booking {
  id: string;
  ownerId: string;
  roomId: string;
  arrival: string;
  departure: string;
  nightlyPrice: number;
  total: number;
  status: 'active' | 'cancelled';
}
export interface Database {
  schemaVersion: 1;
  nextBookingId: number;
  users: User[];
  rooms: Room[];
  bookings: Booking[];
}
