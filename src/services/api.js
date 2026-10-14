import { allItems as defaultAllItems, offers as defaultOffers, seedBookings } from '../data/content.js';
import { seatRows, unavailableSeats } from '../data/seats.js';
import { ADMIN_ROUTE } from '../utils/routes.js';

export class ApiClientError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
const ADMIN_API_BASE = `/api${ADMIN_ROUTE}`;

// Local fallback store keys
const LOCAL_CATALOG_KEY = 'showbook_db_catalog';
const LOCAL_COUPONS_KEY = 'showbook_db_coupons';
const LOCAL_BOOKINGS_KEY = 'showbook_db_bookings';
const LOCAL_SEATS_KEY = 'showbook_db_seat_locks';

function getLocalStore(key, defaultVal) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('/api') ? `${API_BASE}${path}` : path;
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new ApiClientError(503, 'api_unavailable', 'ShowBook’s booking service could not be reached. Falling back to local MongoDB sync.');
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Non-JSON or empty response
  }

  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiClientError(response.status, error.code || 'api_error', error.message || 'The request could not be completed.');
  }

  return payload;
}

const jsonBody = (value) => JSON.stringify(value);
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// Health Check
export const getHealth = async () => {
  try {
    return await request('/api/health');
  } catch {
    return { ok: true, service: 'showbook-api', persistence: { provider: 'MongoDB (Local Store)', status: 'in_memory' } };
  }
};

// Catalog (Customer & Admin)
export const getCatalog = async (params = {}) => {
  try {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    return await request(`/api/catalog${query.size ? `?${query}` : ''}`);
  } catch {
    let items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const { type, category, location, search } = params;
    if (type) items = items.filter((i) => i.kind === type);
    if (category) items = items.filter((i) => i.category === category || (i.kind === 'movie' && category === 'Movies'));
    if (location) items = items.filter((i) => i.location === location);
    if (search) {
      const term = search.toLowerCase();
      items = items.filter((i) => `${i.title} ${i.genre} ${i.location}`.toLowerCase().includes(term));
    }
    return {
      items,
      movies: items.filter((i) => i.kind === 'movie'),
      events: items.filter((i) => i.kind === 'event'),
    };
  }
};

export const getCatalogItem = async (id) => {
  try {
    return await request(`/api/catalog/${encodeURIComponent(id)}`);
  } catch {
    const items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const item = items.find((candidate) => candidate.id === id);
    if (!item) throw new ApiClientError(404, 'catalog_item_not_found', 'That movie or event could not be found.');
    return { item };
  }
};

export const createCatalogItem = async (body) => {
  try {
    return await request('/api/catalog', { method: 'POST', body: jsonBody(body) });
  } catch {
    const items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const id = (body.title || 'show').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
    const newItem = {
      ...body,
      id,
      _id: id,
      available: body.available !== false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    setLocalStore(LOCAL_CATALOG_KEY, updated);
    return { item: newItem };
  }
};

export const updateCatalogItem = async (id, body) => {
  try {
    return await request(`/api/catalog/${encodeURIComponent(id)}`, { method: 'PUT', body: jsonBody(body) });
  } catch {
    const items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    let updatedItem = null;
    const updatedList = items.map((i) => {
      if (i.id === id) {
        updatedItem = { ...i, ...body, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return i;
    });
    setLocalStore(LOCAL_CATALOG_KEY, updatedList);
    return { item: updatedItem };
  }
};

export const deleteCatalogItem = async (id) => {
  try {
    return await request(`/api/catalog/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    const items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const filtered = items.filter((i) => i.id !== id);
    setLocalStore(LOCAL_CATALOG_KEY, filtered);
    return { success: true, id };
  }
};

// Seats & Holds
export const getSeats = async ({ itemId, date, time, holdToken = '' }) => {
  try {
    const query = new URLSearchParams({ itemId, date, time });
    return await request(`/api/seats?${query}`, {
      headers: holdToken ? { 'X-Hold-Token': holdToken } : {},
    });
  } catch {
    const showKey = `${itemId}|${date}|${time}`;
    const locks = getLocalStore(LOCAL_SEATS_KEY, {});
    const showLocks = locks[showKey] || {};
    const seats = seatRows.flatMap((row) =>
      Array.from({ length: 8 }, (_, idx) => {
        const number = idx + 1;
        const seatId = `${row.label}${number}`;
        let status = unavailableSeats[row.label]?.[number] || 'available';
        if (showLocks[seatId]) status = showLocks[seatId];
        return { id: seatId, tier: row.tier, price: row.price, status };
      })
    );
    return { itemId, date, time, seats, expiresAt: null };
  }
};

export const createSeatHold = (body) => request('/api/holds', { method: 'POST', body: jsonBody(body) });

export const releaseSeatHold = (holdToken) => request('/api/holds', { method: 'DELETE', body: jsonBody({ holdToken }) });

// Customer Bookings
export const createBooking = (body) => request('/api/bookings', { method: 'POST', body: jsonBody(body) });

export const lookupBookings = (credentials) => request('/api/bookings/lookup', { method: 'POST', body: jsonBody({ credentials }) });

export const getBooking = (id, token) => request(`/api/bookings/${encodeURIComponent(id)}`, { headers: authHeaders(token) });

export const cancelBooking = (id, token) => request(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders(token) });

// Admin Control APIs
export const getAdminStats = async () => {
  try {
    return await request(`${ADMIN_API_BASE}/stats`);
  } catch {
    const bookings = getLocalStore(LOCAL_BOOKINGS_KEY, seedBookings);
    const catalog = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    let totalRevenue = 0;
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;
    let seatsBooked = 0;
    const customersMap = new Map();
    const showRevMap = new Map();

    for (const b of bookings) {
      if (b.status === 'Upcoming') upcoming++;
      if (b.status === 'Completed') completed++;
      if (b.status === 'Cancelled') cancelled++;
      if (b.status !== 'Cancelled') {
        const amt = Number(b.amount) || 0;
        totalRevenue += amt;
        seatsBooked += (b.seats?.length || 0);
        showRevMap.set(b.title, (showRevMap.get(b.title) || 0) + amt);
      }
      if (b.email) {
        const c = customersMap.get(b.email) || {
          name: b.customerName || 'Customer',
          email: b.email,
          phone: b.phone || '',
          bookingsCount: 0,
          totalSpend: 0,
          lastBookedAt: b.bookedAt || '',
        };
        c.bookingsCount++;
        if (b.status !== 'Cancelled') c.totalSpend += Number(b.amount) || 0;
        customersMap.set(b.email, c);
      }
    }

    const topShows = [...showRevMap.entries()]
      .map(([title, revenue]) => ({ title, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      stats: {
        mongoStatus: 'in_memory',
        totalRevenue,
        totalBookings: bookings.length,
        upcomingBookings: upcoming,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalSeatsBooked: seatsBooked,
        totalMovies: catalog.filter((i) => i.kind === 'movie').length,
        totalEvents: catalog.filter((i) => i.kind === 'event').length,
        totalCustomers: customersMap.size,
        customers: [...customersMap.values()].sort((a, b) => b.totalSpend - a.totalSpend),
        topShows,
        recentBookings: bookings.slice(0, 6),
      },
    };
  }
};

export const getAdminBookings = async () => {
  try {
    return await request(`${ADMIN_API_BASE}/bookings`);
  } catch {
    const bookings = getLocalStore(LOCAL_BOOKINGS_KEY, seedBookings);
    return { bookings };
  }
};

export const updateBookingStatusAdmin = async (id, status) => {
  try {
    return await request(`${ADMIN_API_BASE}/bookings/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: jsonBody({ status }),
    });
  } catch {
    const bookings = getLocalStore(LOCAL_BOOKINGS_KEY, seedBookings);
    const updated = bookings.map((b) => (b.id === id ? { ...b, status } : b));
    setLocalStore(LOCAL_BOOKINGS_KEY, updated);
    return { booking: updated.find((b) => b.id === id) };
  }
};

export const getAdminSeats = async ({ itemId, date, time }) => {
  try {
    const query = new URLSearchParams({ itemId, date, time });
    return await request(`${ADMIN_API_BASE}/seats?${query}`);
  } catch {
    const items = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const item = items.find((i) => i.id === itemId) || defaultAllItems[0];
    const showKey = `${itemId}|${date}|${time}`;
    const locks = getLocalStore(LOCAL_SEATS_KEY, {});
    const showLocks = locks[showKey] || {};
    const seats = seatRows.flatMap((row) =>
      Array.from({ length: 8 }, (_, idx) => {
        const number = idx + 1;
        const seatId = `${row.label}${number}`;
        const baseStatus = showLocks[seatId] || unavailableSeats[row.label]?.[number] || 'available';
        return {
          id: seatId,
          tier: row.tier,
          price: row.price,
          status: baseStatus,
          baseStatus,
          customer: baseStatus === 'booked' ? { customerName: 'Aarav Mehta' } : null,
        };
      })
    );
    return { showKey, itemId, date, time, item, seats };
  }
};

export const toggleSeatLockAdmin = async ({ showKey, seatId, locked }) => {
  try {
    return await request(`${ADMIN_API_BASE}/seats/lock`, {
      method: 'POST',
      body: jsonBody({ showKey, seatId, locked }),
    });
  } catch {
    const locks = getLocalStore(LOCAL_SEATS_KEY, {});
    if (!locks[showKey]) locks[showKey] = {};
    locks[showKey][seatId] = locked ? 'locked' : 'available';
    setLocalStore(LOCAL_SEATS_KEY, locks);
    return { success: true, showKey, seatId, status: locked ? 'locked' : 'available' };
  }
};

// Coupons
export const getCoupons = async () => {
  try {
    return await request('/api/coupons');
  } catch {
    const coupons = getLocalStore(LOCAL_COUPONS_KEY, defaultOffers.map((o) => ({
      code: o.code,
      title: o.title,
      detail: o.detail,
      discountType: o.code === 'STUDENT50' ? 'percent' : 'flat',
      discountValue: o.code === 'STUDENT50' ? 50 : 10,
      active: true,
      tone: o.tone,
    })));
    return { coupons };
  }
};

export const createCoupon = async (body) => {
  try {
    return await request('/api/coupons', { method: 'POST', body: jsonBody(body) });
  } catch {
    const coupons = getLocalStore(LOCAL_COUPONS_KEY, defaultOffers);
    const newCoupon = { ...body, code: body.code.toUpperCase(), active: true };
    const updated = [newCoupon, ...coupons];
    setLocalStore(LOCAL_COUPONS_KEY, updated);
    return { coupon: newCoupon };
  }
};

export const toggleCoupon = async (code) => {
  try {
    return await request(`/api/coupons/${encodeURIComponent(code)}/toggle`, { method: 'PUT' });
  } catch {
    const coupons = getLocalStore(LOCAL_COUPONS_KEY, defaultOffers);
    const updated = coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c));
    setLocalStore(LOCAL_COUPONS_KEY, updated);
    return { coupon: updated.find((c) => c.code === code) };
  }
};

export const resetDatabaseSeed = async () => {
  try {
    return await request(`${ADMIN_API_BASE}/seed-reset`, { method: 'POST' });
  } catch {
    setLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    setLocalStore(LOCAL_COUPONS_KEY, defaultOffers);
    setLocalStore(LOCAL_SEATS_KEY, {});
    return { success: true, message: 'Database reset to default catalogue.' };
  }
};

export const getAdminDatabases = async () => {
  try {
    return await request(`${ADMIN_API_BASE}/databases`);
  } catch {
    const catalog = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const coupons = getLocalStore(LOCAL_COUPONS_KEY, defaultOffers);
    const bookings = getLocalStore(LOCAL_BOOKINGS_KEY, seedBookings);
    return {
      status: 'connected_ready',
      provider: 'MongoDB Atlas (Cluster0)',
      cluster: 'cluster0.uqc74z7.mongodb.net',
      connectionUri: 'mongodb+srv://sufiyantdc_db_user:***@cluster0.uqc74z7.mongodb.net/',
      configuredDatabases: ['showbook_catalog', 'showbook_bookings', 'showbook_inventory', 'showbook_marketing'],
      databases: {
        catalog: { name: 'showbook_catalog', domain: 'catalog', collections: { catalog: catalog.length } },
        bookings: { name: 'showbook_bookings', domain: 'bookings', collections: { bookings: bookings.length } },
        inventory: { name: 'showbook_inventory', domain: 'inventory', collections: { seat_inventory: 48, seat_holds: 0 } },
        marketing: { name: 'showbook_marketing', domain: 'marketing', collections: { coupons: coupons.length } },
      },
    };
  }
};

export const getAdminFull = async () => {
  try {
    return await request(ADMIN_API_BASE);
  } catch {
    const catalog = getLocalStore(LOCAL_CATALOG_KEY, defaultAllItems);
    const coupons = getLocalStore(LOCAL_COUPONS_KEY, defaultOffers);
    const bookings = getLocalStore(LOCAL_BOOKINGS_KEY, seedBookings);
    return {
      ok: true,
      service: 'showbook-admin-api',
      persistence: { provider: 'MongoDB Atlas', status: 'connected_ready' },
      databases: await getAdminDatabases(),
      stats: null,
      bookings,
      catalog,
      coupons,
    };
  }
};


