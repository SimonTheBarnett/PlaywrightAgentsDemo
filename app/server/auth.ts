import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, Response } from 'express';
import { ApiError, fields } from './domain.js';
import type { JsonStore } from './store.js';
import type { User } from './types.js';

const deriveKey = promisify(scrypt);
const lifetime = 8 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: 'strict', path: '/' } as const;

export class Sessions {
  private sessions = new Map<string, { userId: string; expires: number }>();

  private token(req: Request): string | undefined {
    return req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('wee_session='))?.slice(12);
  }

  user(req: Request, store: JsonStore): User {
    const token = this.token(req);
    const session = token ? this.sessions.get(token) : undefined;
    if (session && session.expires > Date.now()) {
      const user = store.snapshot().users.find(item => item.id === session.userId);
      if (user) return user;
    }
    if (token) this.sessions.delete(token);
    throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in.');
  }

  async login(req: Request, res: Response, store: JsonStore): Promise<void> {
    const input = fields(req.body, ['email', 'password']);
    if (typeof input.email !== 'string' || typeof input.password !== 'string'
        || !input.email.trim() || !input.password || input.password.length > 200) {
      throw new ApiError(400, 'INVALID_INPUT', 'Enter an email and password.');
    }
    const users = store.snapshot().users;
    const user = users.find(item => item.email === (input.email as string).trim().toLowerCase());
    // Perform the same expensive check for an unknown email.
    const [salt, hash] = (user ?? users[0]!).passwordHash.split(':') as [string, string];
    const key = await deriveKey(input.password, salt, 64) as Buffer;
    if (!timingSafeEqual(key, Buffer.from(hash, 'hex')) || !user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    const oldToken = this.token(req);
    if (oldToken) this.sessions.delete(oldToken);
    for (const [token, session] of this.sessions) {
      if (session.expires <= Date.now()) this.sessions.delete(token);
    }
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, { userId: user.id, expires: Date.now() + lifetime });
    res.cookie('wee_session', token, { ...cookieOptions, maxAge: lifetime });
    res.json({ user: publicUser(user) });
  }

  logout(req: Request, res: Response): void {
    const token = this.token(req);
    if (token) this.sessions.delete(token);
    res.clearCookie('wee_session', cookieOptions);
    res.sendStatus(204);
  }
}

export function publicUser(user: User) {
  return { id: user.id, email: user.email, role: user.role };
}
