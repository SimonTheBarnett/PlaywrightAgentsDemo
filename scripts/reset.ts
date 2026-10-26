import { configuration } from '../app/server/config.js';
import { JsonStore } from '../app/server/store.js';

const config = configuration();
const store = new JsonStore(config.dataFile);
try {
  await store.acquire();
  await store.reset();
  console.log('Demo data restored: three rooms, two guests, one admin, zero bookings.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Reset failed.');
  process.exitCode = 1;
} finally {
  await store.close();
}
