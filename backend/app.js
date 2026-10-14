import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiRouter from './api.js';
import { errorBody } from './errors.js';
import { mongoStatus } from './lib/EventDB.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const distDir = path.join(projectRoot, 'dist');
const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hold-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

function createRateGuard({ windowMs = 60_000, limit = 120 } = {}) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 5000) {
      for (const [address, value] of buckets) if (value.resetAt <= now) buckets.delete(address);
    }
    res.setHeader('RateLimit-Limit', limit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limit - bucket.count));
    if (bucket.count > limit) return res.status(429).json({ error: { code: 'rate_limit_exceeded', message: 'Please wait a moment before trying again.' } });
    return next();
  };
}

app.get('/_app/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, service: 'showbook-api', persistence: { provider: 'MongoDB Atlas', status: mongoStatus() } });
});
app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use('/api', createRateGuard());
app.use('/api', express.json({ limit: '16kb', strict: true }));
app.use('/api', apiRouter);
app.use('/api', (req, res) => res.status(404).json({ error: { code: 'api_route_not_found', message: 'That API endpoint does not exist.' } }));

app.use(express.static(distDir, { index: false, dotfiles: 'deny', fallthrough: true }));
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html') && !req.path.startsWith('/_app/')) {
    return res.sendFile(path.join(distDir, 'index.html'), (error) => error && next(error));
  }
  return next();
});
app.use((req, res) => res.status(404).json({ error: { code: 'not_found', message: 'The requested resource was not found.' } }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'The request body must be valid JSON.' } });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'request_too_large', message: 'The request body is too large.' } });
  }
  const { status, body } = errorBody(error);
  // Generic errors may contain driver details or a connection URI; never return or log them.
  return res.status(status).json(body);
});

export default app;
