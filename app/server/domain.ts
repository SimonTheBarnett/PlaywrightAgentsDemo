import type { Booking, Database, User } from './types.js';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function fields(body: unknown, names: string[]): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some(key => !names.includes(key))) {
    throw new ApiError(400, 'INVALID_INPUT', 'Provide only the expected fields.');
  }
  return body as Record<string, unknown>;
}

export function calendarDay(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp / 86_400_000;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createBooking(data: Database, user: User, body: unknown): Booking {
  const input = fields(body, ['roomId', 'arrival', 'departure']);
  const arrivalDay = calendarDay(input.arrival);
  const departureDay = calendarDay(input.departure);
  if (arrivalDay === null || departureDay === null) {
    throw new ApiError(400, 'INVALID_DATES', 'Enter valid arrival and departure dates (YYYY-MM-DD).');
  }
  if (departureDay <= arrivalDay) {
    throw new ApiError(400, 'INVALID_DATES', 'Departure must be after arrival.');
  }
  const arrival = input.arrival as string;
  const departure = input.departure as string;
  if (arrival < todayUtc()) {
    throw new ApiError(400, 'PAST_ARRIVAL', 'Arrival must be today or later (UTC).');
  }
  if (typeof input.roomId !== 'string' || !input.roomId) {
    throw new ApiError(400, 'INVALID_INPUT', 'Choose a room.');
  }
  const room = data.rooms.find(item => item.id === input.roomId);
  if (!room) throw new ApiError(404, 'NOT_FOUND', 'Room not found.');
  if (data.bookings.some(booking => booking.roomId === room.id && booking.status === 'active'
      && arrival < booking.departure && departure > booking.arrival)) {
    throw new ApiError(409, 'BOOKING_CONFLICT', 'This room is already booked for those dates.');
  }
  const booking: Booking = {
    id: `booking-${data.nextBookingId++}`,
    ownerId: user.id,
    roomId: room.id,
    arrival,
    departure,
    nightlyPrice: room.nightlyPrice,
    total: (departureDay - arrivalDay) * room.nightlyPrice,
    status: 'active',
  };
  data.bookings.push(booking);
  return booking;
}

export function cancelBooking(data: Database, user: User, id: string): Booking {
  const booking = data.bookings.find(item => item.id === id);
  if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found.');
  if (user.role !== 'admin' && booking.ownerId !== user.id) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot cancel another guest\'s booking.');
  }
  booking.status = 'cancelled';
  return booking;
}
