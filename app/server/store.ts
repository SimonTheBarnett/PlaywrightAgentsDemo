import { mkdir, open, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { calendarDay } from './domain.js';
import { seedData } from './seed.js';
import type { Database } from './types.js';

function validateDatabase(value: unknown): asserts value is Database {
  const fail = () => { throw new Error('Invalid data file; restore a valid backup or explicitly reset it.'); };
  if (!value || typeof value !== 'object') return fail();
  const data = value as Database;
  if (data.schemaVersion !== 1 || !Number.isSafeInteger(data.nextBookingId) || data.nextBookingId < 1
      || !Array.isArray(data.users) || !Array.isArray(data.rooms) || !Array.isArray(data.bookings)) return fail();
  const seed = seedData();
  // Accounts and rooms are fixed demo configuration; there are no edit endpoints.
  if (JSON.stringify(data.users) !== JSON.stringify(seed.users)
      || JSON.stringify(data.rooms) !== JSON.stringify(seed.rooms)) return fail();
  const ids = new Set<string>();
  for (const booking of data.bookings) {
    if (!booking || typeof booking !== 'object') return fail();
    const arrival = calendarDay(booking.arrival);
    const departure = calendarDay(booking.departure);
    const room = data.rooms.find(item => item.id === booking.roomId);
    const id = typeof booking.id === 'string' ? /^booking-([1-9]\d*)$/.exec(booking.id) : null;
    if (!id || Number(id[1]) >= data.nextBookingId || ids.has(booking.id)
        || !data.users.some(user => user.id === booking.ownerId && user.role === 'guest')
        || !room || arrival === null || departure === null || departure <= arrival
        || booking.nightlyPrice !== room.nightlyPrice
        || booking.total !== (departure - arrival) * booking.nightlyPrice
        || !['active', 'cancelled'].includes(booking.status)) return fail();
    ids.add(booking.id);
  }
  const active = data.bookings.filter(item => item.status === 'active');
  if (active.some((booking, index) => active.slice(index + 1).some(other => other.roomId === booking.roomId
      && booking.arrival < other.departure && booking.departure > other.arrival))) return fail();
}

export class JsonStore {
  private current!: Database;
  private queue: Promise<unknown> = Promise.resolve();
  private lock?: Awaited<ReturnType<typeof open>>;
  private lockFile?: string;

  constructor(readonly file: string) {}

  async acquire(): Promise<void> {
    if (this.lock) throw new Error('This store already owns a lock.');
    await mkdir(dirname(this.file), { recursive: true });
    const lockDirectory = `${this.file}.lock`;
    await mkdir(lockDirectory, { recursive: true });
    // Unique owner markers avoid deleting a new owner's lock during recovery.
    // Publish ours before scanning: concurrent contenders either see an owner
    // and refuse, or both refuse. Keep the directory itself between runs.
    const marker = join(lockDirectory, `${process.pid}-${randomUUID()}.json`);
    this.lock = await open(marker, 'wx');
    this.lockFile = marker;
    try {
      for (const entry of await readdir(lockDirectory)) {
        if (entry === basename(marker)) continue;
        const owner = /^(\d+)-[0-9a-f-]{36}\.json$/.exec(entry);
        if (!owner) throw new Error(`Unrecognized store lock record: ${entry}. See README.`);
        const pid = Number(owner[1]);
        if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid lock owner process ID.');
        try {
          process.kill(pid, 0);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
            await rm(join(lockDirectory, entry), { force: true });
            continue;
          }
          // Access denied is not proof that an owner has exited.
        }
        throw new Error(`Store is locked by process ${pid}: ${lockDirectory}. Stop its owner before retrying.`);
      }
      await this.lock.writeFile(JSON.stringify({ pid: process.pid }));
    } catch (error) {
      await this.close();
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.file, 'utf8'));
      validateDatabase(parsed);
      this.current = parsed;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await this.replace(seedData());
    }
  }

  snapshot(): Database {
    return structuredClone(this.current);
  }

  mutate<T>(change: (candidate: Database) => T): Promise<T> {
    const operation = this.queue.then(async () => {
      const candidate = this.snapshot();
      const result = change(candidate);
      await this.replace(candidate);
      return result;
    });
    // A rejected write must not poison subsequent operations.
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  reset(): Promise<void> {
    const operation = this.queue.then(() => this.replace(seedData()));
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  private async replace(data: Database): Promise<void> {
    if (!this.lock) throw new Error('Store ownership is required before writing.');
    const temporary = `${this.file}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
      await rename(temporary, this.file);
      this.current = data;
    } finally {
      await rm(temporary, { force: true });
    }
  }

  async close(): Promise<void> {
    await this.queue;
    if (this.lock) {
      await this.lock.close();
      this.lock = undefined;
      await rm(this.lockFile!);
      this.lockFile = undefined;
    }
  }
}
