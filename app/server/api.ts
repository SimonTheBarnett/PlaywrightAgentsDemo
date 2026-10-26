import express, { type ErrorRequestHandler, type Request } from 'express';
import { Sessions, publicUser } from './auth.js';
import { ApiError, cancelBooking, createBooking, fields, todayUtc } from './domain.js';
import type { configuration } from './config.js';
import type { JsonStore } from './store.js';
import type { Role } from './types.js';

export function createApi(store: JsonStore, config: ReturnType<typeof configuration>) {
  const app = express();
  const sessions = new Sessions();
  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== config.origin) {
      throw new ApiError(403, 'FORBIDDEN_ORIGIN', 'Use the local application origin.');
    }
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  const requireRole = (req: Request, role?: Role) => {
    const user = sessions.user(req, store);
    if (role && user.role !== role) throw new ApiError(403, 'FORBIDDEN', 'Access denied.');
    return user;
  };

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', today: todayUtc() }));
  app.get('/api/rooms', (_req, res) => res.json({ rooms: store.snapshot().rooms }));
  app.post('/api/auth/login', (req, res) => sessions.login(req, res, store));
  app.get('/api/auth/me', (req, res) => res.json({ user: publicUser(requireRole(req)) }));
  app.post('/api/auth/logout', (req, res) => sessions.logout(req, res));
  app.get('/api/bookings', (req, res) => {
    const user = requireRole(req, 'guest');
    res.json({ bookings: store.snapshot().bookings.filter(item => item.ownerId === user.id) });
  });
  app.post('/api/bookings', async (req, res) => {
    const user = requireRole(req, 'guest');
    const booking = await store.mutate(data => createBooking(data, user, req.body));
    res.status(201).json({ booking });
  });
  app.post('/api/bookings/:id/cancel', async (req, res) => {
    const user = requireRole(req);
    fields(req.body ?? {}, []);
    const booking = await store.mutate(data => cancelBooking(data, user, req.params.id!));
    res.json({ booking });
  });
  app.get('/api/admin/bookings', (req, res) => {
    requireRole(req, 'admin');
    const data = store.snapshot();
    res.json({ bookings: data.bookings.map(booking => ({
      ...booking, ownerEmail: data.users.find(user => user.id === booking.ownerId)!.email,
    })) });
  });
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found.')));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
    } else if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Send a valid JSON body of at most 8 KB.' } });
    } else {
      console.error('Request failed:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to save or load data. Please try again.' } });
    }
  };
  app.use(errors);
  return app;
}
