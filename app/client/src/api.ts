export interface User { id: string; email: string; role: 'guest' | 'admin' }
export interface Room { id: string; name: string; description: string; nightlyPrice: number }
export interface Booking {
  id: string;
  ownerId: string;
  roomId: string;
  arrival: string;
  departure: string;
  nightlyPrice: number;
  total: number;
  status: 'active' | 'cancelled';
  ownerEmail?: string;
}

export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw new RequestError(response.status, data?.error?.message ?? 'Request failed.');
  return data as T;
}

export const money = (pence: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
