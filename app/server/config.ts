import { fileURLToPath } from 'node:url';

export function configuration() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This application supports local development/testing only.');
  }
  return {
    port: 3001,
    origin: 'http://127.0.0.1:5173',
    dataFile: fileURLToPath(new URL('../../data/demo.json', import.meta.url)),
  };
}
