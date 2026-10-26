import { createApi } from './api.js';
import { configuration } from './config.js';
import { JsonStore } from './store.js';

const config = configuration();
const store = new JsonStore(config.dataFile);
try {
  await store.acquire();
  await store.load();
  const server = createApi(store, config).listen(config.port, '127.0.0.1');
  server.on('listening', () => {
    console.log(`Wee B&B API ready at http://127.0.0.1:${config.port}`);
    process.send?.('ready');
  });
  server.on('error', async error => {
    console.error('API startup failed:', error.message);
    await store.close();
    process.exitCode = 1;
    if (process.connected) process.disconnect();
  });
  let closing = false;
  const shutdown = () => {
    if (closing) return;
    closing = true;
    server.close(async () => {
      await store.close();
      process.exitCode = 0;
      if (process.connected) process.disconnect();
    });
    server.closeIdleConnections();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('message', message => { if (message === 'shutdown') shutdown(); });
  process.on('disconnect', shutdown);
} catch (error) {
  await store.close();
  console.error('API startup failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
  if (process.connected) process.disconnect();
}
