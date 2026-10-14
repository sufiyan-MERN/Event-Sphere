try { process.loadEnvFile?.(); } catch {}
import app from './app.js';
import { closeMongo, connectMongo, mongoStatus } from './lib/EventDB.js';

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`ShowBook Express listening on port ${port}; Atlas status: ${mongoStatus()}.`);
});
server.requestTimeout = 15_000;
server.headersTimeout = 20_000;

// Connect without blocking the health endpoint; connection failures are surfaced as safe state only.
void connectMongo();

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`ShowBook Express received ${signal}; closing.`);
  server.close(async () => {
    await closeMongo();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
