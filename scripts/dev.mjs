import { fork } from 'node:child_process';
import { createServer } from 'vite';

// Direct Node/IPC startup avoids cmd.exe child trees and shell-specific signals.
const api = fork('app/server/index.ts', [], { execArgv: ['--import', 'tsx'], stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
let client;
let stopping = false;
function requestApiShutdown() {
  if (!api.connected) return;
  api.send('shutdown', error => {
    // Ctrl+C may close the API's IPC channel between the check and send.
    if (error && !['EPIPE', 'ERR_IPC_CHANNEL_CLOSED'].includes(error.code)) {
      console.error(error.message);
      process.exitCode = 1;
    }
  });
}
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  await client?.close();
  requestApiShutdown();
}
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
// IPC also lets application-level checks exercise graceful shutdown on Windows,
// where sending POSIX signals from a different process forcefully terminates it.
process.on('message', message => { if (message === 'shutdown') void stop(); });
process.on('disconnect', () => void stop());
api.on('exit', code => {
  void stop(code ?? 1).finally(() => { if (process.connected) process.disconnect(); });
});
api.on('error', error => { console.error(error.message); void stop(1); });
api.on('message', message => { if (message === 'ready' && stopping) requestApiShutdown(); });
try {
  client = await createServer();
  if (stopping) await client.close();
  else {
    await client.listen();
    client.printUrls();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Client startup failed.');
  await stop(1);
}
