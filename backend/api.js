import { Router } from 'express';
import { ApiError } from './errors.js';
import { mongoStatus, getDatabaseRegistryInfo } from './lib/EventDB.js';
import {
  cancelBooking,
  createBooking,
  createCatalogItemInDb,
  createCouponInDb,
  createHold,
  deleteCatalogItemInDb,
  getAllBookingsAdmin,
  getAdminSeats,
  getAdminStats,
  getBooking,
  getCatalogFromDb,
  getCatalogItemFromDb,
  getCouponsFromDb,
  getSeatAvailability,
  lookupBookings,
  releaseHold,
  resetDatabaseSeed,
  toggleCouponInDb,
  toggleSeatLockAdmin,
  updateBookingStatusAdmin,
  updateCatalogItemInDb,
} from './mongo.js';
import {
  normalizeCoupon,
  paymentMethods,
  validateContact,
  validateOpaqueToken,
  validateSeatIds,
} from './booking.js';

const router = Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const ownKeysOnly = (body, allowed) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'invalid_body', 'A JSON object is required.');
  const extra = Object.keys(body).find((key) => !allowed.includes(key));
  if (extra) throw new ApiError(400, 'unexpected_field', `The field “${extra}” is not accepted.`);
};

// Health Check
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'showbook-api', persistence: { provider: 'MongoDB', status: mongoStatus() } });
});

// --- CATALOG (MongoDB Synced) ---

router.get('/catalog', asyncRoute(async (req, res) => {
  const { type = '', category = '', location = '', search = '' } = req.query;
  const result = await getCatalogFromDb({ type, category, location, search });
  res.json(result);
}));

router.get('/catalog/:id', asyncRoute(async (req, res) => {
  const item = await getCatalogItemFromDb(req.params.id);
  res.json({ item });
}));

router.post('/catalog', asyncRoute(async (req, res) => {
  const newItem = await createCatalogItemInDb(req.body);
  res.status(201).json({ item: newItem });
}));

router.put('/catalog/:id', asyncRoute(async (req, res) => {
  const updated = await updateCatalogItemInDb(req.params.id, req.body);
  res.json({ item: updated });
}));

router.delete('/catalog/:id', asyncRoute(async (req, res) => {
  const result = await deleteCatalogItemInDb(req.params.id);
  res.json(result);
}));

// --- SEATS & HOLDS ---

router.get('/seats', asyncRoute(async (req, res) => {
  const { itemId, date, time } = req.query;
  if (!itemId || !date || !time) {
    throw new ApiError(400, 'missing_params', 'itemId, date, and time are required.');
  }
  const result = await getSeatAvailability({ itemId, date, time, holdToken: req.get('x-hold-token') || '' });
  res.json(result);
}));

router.post('/holds', asyncRoute(async (req, res) => {
  ownKeysOnly(req.body, ['itemId', 'date', 'time', 'seatIds', 'holdToken']);
  const { itemId, date, time, seatIds, holdToken } = req.body;
  if (!itemId || !date || !time) {
    throw new ApiError(400, 'missing_params', 'itemId, date, and time are required.');
  }
  const validSeats = validateSeatIds(seatIds);
  const result = await createHold({ itemId, date, time, seatIds: validSeats, holdToken: holdToken || '' });
  res.status(201).json(result);
}));

router.delete('/holds', asyncRoute(async (req, res) => {
  ownKeysOnly(req.body, ['holdToken']);
  const holdToken = validateOpaqueToken(req.body.holdToken, 'invalid_hold_token');
  res.json(await releaseHold(holdToken));
}));



router.post('/bookings', asyncRoute(async (req, res) => {
  ownKeysOnly(req.body, ['holdToken', 'customer', 'coupon', 'paymentMethod']);
  const holdToken = validateOpaqueToken(req.body.holdToken, 'invalid_hold_token');
  const customer = validateContact(req.body.customer);
  const coupon = normalizeCoupon(req.body.coupon);
  const paymentMethod = typeof req.body.paymentMethod === 'string' ? req.body.paymentMethod : '';
  if (!paymentMethods.includes(paymentMethod)) {
    throw new ApiError(400, 'invalid_payment_method', 'Choose one of the available demo payment methods.');
  }
  const result = await createBooking({ holdToken, customer, coupon, paymentMethod });
  res.status(201).json(result);
}));

router.post('/bookings/lookup', asyncRoute(async (req, res) => {
  ownKeysOnly(req.body, ['credentials']);
  res.json({ bookings: await lookupBookings(req.body.credentials) });
}));

router.get('/bookings/:id', asyncRoute(async (req, res) => {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  res.json({ booking: await getBooking(req.params.id, token) });
}));

router.delete('/bookings/:id', asyncRoute(async (req, res) => {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  res.json({ booking: await cancelBooking(req.params.id, token) });
}));

// --- ADMIN CONTROL ENDPOINTS (DYNAMIC ROUTE SUPPORT) ---

const rawAdminRoute = process.env.ADMIN_ROUTE || process.env.VITE_ADMIN_ROUTE || '/admin';
const dynamicAdminRoute = (rawAdminRoute.startsWith('/') ? rawAdminRoute : `/${rawAdminRoute}`).replace(/\/+$/, '') || '/admin';

const adminRouter = Router();

adminRouter.get('/', asyncRoute(async (req, res) => {
  const [stats, bookings, catalog, coupons, databases] = await Promise.all([
    getAdminStats(),
    getAllBookingsAdmin(),
    getCatalogFromDb(),
    getCouponsFromDb(),
    getDatabaseRegistryInfo(),
  ]);
  res.json({
    ok: true,
    service: 'showbook-admin-api',
    persistence: { provider: 'MongoDB Atlas', status: mongoStatus() },
    databases,
    stats,
    bookings,
    catalog: catalog.items,
    coupons,
  });
}));

adminRouter.get('/databases', asyncRoute(async (req, res) => {
  const databases = await getDatabaseRegistryInfo();
  res.json(databases);
}));

adminRouter.get('/stats', asyncRoute(async (req, res) => {
  const stats = await getAdminStats();
  res.json({ stats });
}));

adminRouter.get('/bookings', asyncRoute(async (req, res) => {
  const bookings = await getAllBookingsAdmin();
  res.json({ bookings });
}));

adminRouter.put('/bookings/:id/status', asyncRoute(async (req, res) => {
  const { status } = req.body;
  const updated = await updateBookingStatusAdmin(req.params.id, status);
  res.json({ booking: updated });
}));

adminRouter.get('/seats', asyncRoute(async (req, res) => {
  const { itemId, date, time } = req.query;
  if (!itemId || !date || !time) {
    throw new ApiError(400, 'missing_params', 'itemId, date, and time are required.');
  }
  const result = await getAdminSeats({ itemId, date, time });
  res.json(result);
}));

adminRouter.post('/seats/lock', asyncRoute(async (req, res) => {
  const { showKey, seatId, locked } = req.body;
  if (!showKey || !seatId) throw new ApiError(400, 'missing_fields', 'showKey and seatId are required.');
  const result = await toggleSeatLockAdmin({ showKey, seatId, locked: Boolean(locked) });
  res.json(result);
}));

adminRouter.post('/seed-reset', asyncRoute(async (req, res) => {
  const result = await resetDatabaseSeed();
  res.json(result);
}));

// Mount on standard '/admin' and any dynamic custom admin route specified in .env
router.use('/admin', adminRouter);
if (dynamicAdminRoute !== '/admin') {
  router.use(dynamicAdminRoute, adminRouter);
}

router.get('/coupons', asyncRoute(async (req, res) => {
  const coupons = await getCouponsFromDb();
  res.json({ coupons });
}));

router.post('/coupons', asyncRoute(async (req, res) => {
  const coupon = await createCouponInDb(req.body);
  res.status(201).json({ coupon });
}));

router.put('/coupons/:code/toggle', asyncRoute(async (req, res) => {
  const coupon = await toggleCouponInDb(req.params.code);
  res.json({ coupon });
}));



export default router;
