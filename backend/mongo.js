import { randomBytes } from 'node:crypto';
import { seatById, seatRows, unavailableSeats } from '../src/data/seats.js';
import { allItems, events, movies, offers, seedBookings } from '../src/data/content.js';
import { ApiError } from './errors.js';
import { requireMongo, getMongoClient, mongoStatus, DATABASES } from './lib/EventDB.js';
import {
  calculateServerPrice,
  deriveBookingStatus,
  hashSecretToken,
  sanitizeBookingSummary,
  validateOpaqueToken,
  validateSeatIds,
  validateShow,
} from './booking.js';

const holdDurationMs = 5 * 60 * 1000;

// Ensure catalogue is seeded into showbook_catalog
let catalogSeeded = false;
export async function ensureCatalog(catalogDb) {
  if (catalogSeeded) return;
  const col = catalogDb.collection('catalog');
  const count = await col.countDocuments();
  if (count === 0) {
    const seedDocs = allItems.map((item) => ({
      ...item,
      _id: item.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    for (const doc of seedDocs) {
      await col.insertOne(doc);
    }
    console.log(`[ShowBook MongoDB] Seeded ${seedDocs.length} items into database "${DATABASES.catalog}.catalog".`);
  }
  catalogSeeded = true;
}

// Ensure coupons are seeded into showbook_marketing
let couponsSeeded = false;
export async function ensureCoupons(marketingDb) {
  if (couponsSeeded) return;
  const col = marketingDb.collection('coupons');
  const count = await col.countDocuments();
  if (count === 0) {
    const seedCoupons = offers.map((offer) => ({
      code: offer.code,
      title: offer.title,
      detail: offer.detail,
      discountType: offer.code === 'STUDENT50' ? 'percent' : offer.code === 'FIRSTBOOKING' ? 'percent' : 'flat',
      discountValue: offer.code === 'STUDENT50' ? 50 : offer.code === 'FIRSTBOOKING' ? 10 : offer.code === 'WEEKEND' ? 100 : 50,
      active: true,
      tone: offer.tone,
      createdAt: new Date(),
    }));
    for (const doc of seedCoupons) {
      await col.insertOne(doc);
    }
    console.log(`[ShowBook MongoDB] Seeded ${seedCoupons.length} coupons into database "${DATABASES.marketing}.coupons".`);
  }
  couponsSeeded = true;
}

// Ensure initial customer bookings are seeded into showbook_bookings
let bookingsSeeded = false;
export async function ensureBookings(bookingsDb) {
  if (bookingsSeeded) return;
  const col = bookingsDb.collection('bookings');
  const count = await col.countDocuments();
  if (count === 0) {
    for (const b of seedBookings) {
      await col.insertOne({
        ...b,
        _id: b.id,
        createdAt: new Date(b.bookedAt || Date.now()),
        updatedAt: new Date(b.bookedAt || Date.now()),
      });
    }
    console.log(`[ShowBook MongoDB] Seeded ${seedBookings.length} initial bookings into database "${DATABASES.bookings}.bookings".`);
  }
  bookingsSeeded = true;
}

// Helper to look up an item from showbook_catalog or fallback
async function findItem(id) {
  const catalogDb = await requireMongo('catalog');
  await ensureCatalog(catalogDb);
  const doc = await catalogDb.collection('catalog').findOne({ id });
  if (doc) return doc;
  return allItems.find((candidate) => candidate.id === id) || null;
}

function inventoryRows(showKey) {
  return seatRows.flatMap((row) =>
    Array.from({ length: 8 }, (_, index) => {
      const number = index + 1;
      const seatId = `${row.label}${number}`;
      return {
        updateOne: {
          filter: { showKey, seatId },
          update: {
            $setOnInsert: {
              showKey,
              seatId,
              tier: row.tier,
              price: row.price,
              baseStatus: unavailableSeats[row.label]?.[number] || 'available',
              bookingId: null,
            },
          },
          upsert: true,
        },
      };
    })
  );
}

async function ensureInventory(inventoryDb, showKey) {
  await inventoryDb.collection('seat_inventory').bulkWrite(inventoryRows(showKey), { ordered: false });
}

function cleanBooking(doc) {
  if (!doc) return null;
  const { accessTokenHash, showKey, _id, ...booking } = doc;
  const seats = Array.isArray(booking.seats)
    ? booking.seats.map((seat) => (typeof seat === 'string' ? seat : seat?.id)).filter((seat) => typeof seat === 'string')
    : [];
  const status = deriveBookingStatus(booking);
  return { ...booking, seats, status };
}

function bookingSummary(doc) {
  const booking = cleanBooking(doc);
  if (!booking) return null;
  return sanitizeBookingSummary(booking);
}

function generateBookingId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `BK${date}${randomBytes(8).toString('hex').toUpperCase()}`;
}

// --- CATALOG SERVICES (DATABASE: showbook_catalog) ---

export async function getCatalogFromDb({ type = '', category = '', location = '', search = '' } = {}) {
  const catalogDb = await requireMongo('catalog');
  await ensureCatalog(catalogDb);

  let items = await catalogDb.collection('catalog').find({}).toArray();

  if (type) {
    items = items.filter((item) => item.kind === type);
  }
  if (category) {
    items = items.filter((item) => item.category === category || (item.kind === 'movie' && category === 'Movies'));
  }
  if (location) {
    items = items.filter((item) => item.location === location);
  }
  if (search) {
    const term = search.toLowerCase().trim();
    items = items.filter((item) =>
      `${item.title} ${item.genre || ''} ${item.category || ''} ${item.location} ${item.language || ''}`
        .toLowerCase()
        .includes(term)
    );
  }

  return {
    items,
    movies: items.filter((item) => item.kind === 'movie'),
    events: items.filter((item) => item.kind === 'event'),
  };
}

export async function getCatalogItemFromDb(id) {
  const item = await findItem(id);
  if (!item) throw new ApiError(404, 'catalog_item_not_found', 'That movie or event could not be found.');
  return item;
}

export async function createCatalogItemInDb(data) {
  const catalogDb = await requireMongo('catalog');
  await ensureCatalog(catalogDb);

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) throw new ApiError(400, 'invalid_title', 'Title is required.');

  const kind = data.kind === 'movie' ? 'movie' : 'event';
  const category = typeof data.category === 'string' && data.category ? data.category.trim() : kind === 'movie' ? 'Movies' : 'Events';
  const price = Number(data.price) > 0 ? Number(data.price) : 250;
  const venue = typeof data.venue === 'string' && data.venue ? data.venue.trim() : 'PVR Next Galleria';
  const location = typeof data.location === 'string' && data.location ? data.location.trim() : 'Hyderabad';
  const date = typeof data.date === 'string' && data.date ? data.date : new Date().toISOString().slice(0, 10);
  const time = typeof data.time === 'string' && data.time ? data.time : '7:30 PM';

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const id = `${slug || 'show'}-${randomBytes(3).toString('hex')}`;

  const newItem = {
    id,
    _id: id,
    kind,
    category,
    title,
    genre: data.genre || (kind === 'movie' ? 'Drama · Action' : 'Live Experience'),
    genreTag: data.genreTag || (kind === 'movie' ? 'Drama' : 'Live'),
    rating: Number(data.rating) || 8.5,
    language: data.language || 'English · Hindi',
    duration: data.duration || (kind === 'movie' ? '2h 15m' : '2 hours'),
    price,
    image: data.image || (kind === 'movie' ? allItems[0].image : allItems[4].image),
    date,
    time,
    venue,
    location,
    description: data.description || `${title} — an unforgettable experience in ${location}.`,
    tags: Array.isArray(data.tags) ? data.tags : ['Featured', 'New'],
    available: data.available !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await catalogDb.collection('catalog').insertOne(newItem);
  return newItem;
}

export async function updateCatalogItemInDb(id, updates) {
  const catalogDb = await requireMongo('catalog');
  await ensureCatalog(catalogDb);

  const existing = await catalogDb.collection('catalog').findOne({ id });
  if (!existing) throw new ApiError(404, 'catalog_item_not_found', 'That movie or event could not be found.');

  const allowedUpdates = [
    'title', 'kind', 'category', 'genre', 'genreTag', 'rating',
    'language', 'duration', 'price', 'image', 'date', 'time',
    'venue', 'location', 'description', 'tags', 'available',
  ];

  const setFields = { updatedAt: new Date() };
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      if (key === 'price' || key === 'rating') {
        setFields[key] = Number(updates[key]);
      } else {
        setFields[key] = updates[key];
      }
    }
  }

  await catalogDb.collection('catalog').updateOne({ id }, { $set: setFields });
  const updated = await catalogDb.collection('catalog').findOne({ id });
  return updated;
}

export async function deleteCatalogItemInDb(id) {
  const catalogDb = await requireMongo('catalog');
  await ensureCatalog(catalogDb);

  const res = await catalogDb.collection('catalog').deleteOne({ id });
  if (res.deletedCount === 0) {
    throw new ApiError(404, 'catalog_item_not_found', 'Item not found in catalog.');
  }
  return { success: true, id };
}

// --- SEAT INVENTORY & HOLDS (DATABASE: showbook_inventory) ---

export async function getSeatAvailability({ itemId, date, time, holdToken = '' }) {
  const inventoryDb = await requireMongo('inventory');
  const item = await findItem(itemId);
  const { showKey } = validateShow({ itemId, date, time }, item);
  await ensureInventory(inventoryDb, showKey);
  const now = new Date();
  const holdTokenHash = holdToken ? hashSecretToken(validateOpaqueToken(holdToken, 'invalid_hold_token')) : null;
  const [inventory, holds] = await Promise.all([
    inventoryDb.collection('seat_inventory').find({ showKey }).toArray(),
    inventoryDb.collection('seat_holds').find({ showKey, expiresAt: { $gt: now } }).toArray(),
  ]);
  const holdsBySeat = new Map(holds.map((hold) => [hold.seatId, hold]));
  const seats = inventory.map((seat) => {
    const hold = holdsBySeat.get(seat.seatId);
    let status = seat.baseStatus;
    if (status === 'available' && seat.bookingId) status = 'booked';
    if (status === 'available' && hold) status = hold.holdTokenHash === holdTokenHash ? 'selected' : 'locked';
    return { id: seat.seatId, tier: seat.tier, price: seat.price, status };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const ownHold = holds.find((hold) => holdTokenHash && hold.holdTokenHash === holdTokenHash);
  return { itemId, date, time, seats, expiresAt: ownHold?.expiresAt || null };
}

export async function createHold({ itemId, date, time, seatIds: rawSeatIds, holdToken = '' }) {
  const inventoryDb = await requireMongo('inventory');
  const item = await findItem(itemId);
  const { showKey } = validateShow({ itemId, date, time }, item);
  const seatIds = validateSeatIds(rawSeatIds);
  await ensureInventory(inventoryDb, showKey);
  const oldToken = holdToken ? validateOpaqueToken(holdToken, 'invalid_hold_token') : null;
  const holdTokenValue = oldToken || randomBytes(32).toString('base64url');
  const holdTokenHash = hashSecretToken(holdTokenValue);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + holdDurationMs);
  const inventory = inventoryDb.collection('seat_inventory');
  const holds = inventoryDb.collection('seat_holds');
  const session = getMongoClient().startSession();

  try {
    await session.withTransaction(async () => {
      if (oldToken) {
        const previous = await holds.findOne({ holdTokenHash }, { session });
        if (previous && previous.showKey !== showKey) {
          throw new ApiError(409, 'hold_mismatch', 'Release your current seat hold before changing to a different show.');
        }
      }
      const currentInventory = await inventory.find({ showKey, seatId: { $in: seatIds } }, { session }).toArray();
      if (currentInventory.length !== seatIds.length || currentInventory.some((seat) => seat.baseStatus !== 'available' || seat.bookingId)) {
        throw new ApiError(409, 'seat_unavailable', 'One or more selected seats are no longer available. Refresh the seat map.');
      }
      const conflicts = await holds.find({
        showKey,
        seatId: { $in: seatIds },
        expiresAt: { $gt: now },
        holdTokenHash: { $ne: holdTokenHash },
      }, { session }).limit(1).toArray();
      if (conflicts.length) throw new ApiError(409, 'seat_held', 'Someone else is holding one or more selected seats. Choose different seats.');

      await holds.deleteMany({ showKey, holdTokenHash, seatId: { $nin: seatIds } }, { session });
      await holds.bulkWrite(seatIds.map((seatId) => ({
        updateOne: {
          filter: { showKey, seatId },
          update: {
            $set: { showKey, seatId, itemId, date, time, holdTokenHash, expiresAt },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })), { ordered: true, session });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
  } catch (error) {
    if (error?.code === 11000 || error?.code === 112) {
      throw new ApiError(409, 'seat_held', 'Someone else reserved one or more selected seats. Refresh the seat map.');
    }
    throw error;
  } finally {
    await session.endSession();
  }

  return {
    holdToken: holdTokenValue,
    expiresAt: expiresAt.toISOString(),
    item: { id: item.id, title: item.title },
    itemId, date, time,
    seats: seatIds.map((id) => seatById(id)),
  };
}

export async function releaseHold(token) {
  const holdToken = validateOpaqueToken(token, 'invalid_hold_token');
  const inventoryDb = await requireMongo('inventory');
  const result = await inventoryDb.collection('seat_holds').deleteMany({ holdTokenHash: hashSecretToken(holdToken) });
  return { released: result.deletedCount > 0 };
}

// --- BOOKINGS (DATABASE: showbook_bookings & showbook_inventory) ---

export async function createBooking({ holdToken: rawHoldToken, customer, coupon, paymentMethod }) {
  const holdToken = validateOpaqueToken(rawHoldToken, 'invalid_hold_token');
  const holdTokenHash = hashSecretToken(holdToken);
  const [bookingsDb, inventoryDb] = await Promise.all([
    requireMongo('bookings'),
    requireMongo('inventory'),
  ]);
  const client = getMongoClient();
  const inventory = inventoryDb.collection('seat_inventory');
  const holds = inventoryDb.collection('seat_holds');
  const bookings = bookingsDb.collection('bookings');
  const bookingId = generateBookingId();
  const bookingAccessToken = randomBytes(32).toString('base64url');
  const accessTokenHash = hashSecretToken(bookingAccessToken);
  const now = new Date();
  let result = null;
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const heldSeats = await holds.find({ holdTokenHash, expiresAt: { $gt: now } }, { session }).sort({ seatId: 1 }).toArray();
      if (!heldSeats.length) throw new ApiError(409, 'hold_expired', 'Your seat hold expired. Return to the seat map and choose again.');
      const { showKey, itemId, date, time } = heldSeats[0];
      if (heldSeats.some((hold) => hold.showKey !== showKey || hold.itemId !== itemId || hold.date !== date || hold.time !== time)) {
        throw new ApiError(409, 'hold_mismatch', 'Your seat hold is no longer valid for this show. Choose your seats again.');
      }
      const item = await findItem(itemId);
      validateShow({ itemId, date, time }, item);
      const seatIds = heldSeats.map((hold) => hold.seatId);
      const seatDocs = await inventory.find({ showKey, seatId: { $in: seatIds }, baseStatus: 'available', bookingId: null }, { session }).toArray();
      if (seatDocs.length !== seatIds.length) throw new ApiError(409, 'seat_unavailable', 'A reserved seat is no longer available. Please refresh and try again.');
      const seatDetails = seatDocs.map((seat) => seatById(seat.seatId)).sort((a, b) => a.id.localeCompare(b.id));
      const seats = seatDetails.map((seat) => seat.id);
      const pricing = calculateServerPrice(seatDetails, coupon);
      const booking = {
        _id: bookingId,
        id: bookingId,
        showKey,
        itemId: item.id,
        title: item.title,
        kind: item.kind,
        duration: item.duration,
        poster: item.image,
        date,
        time,
        venue: item.venue,
        location: item.location,
        seats,
        amount: pricing.total,
        ticketPrice: pricing.ticketPrice,
        convenienceFee: pricing.convenienceFee,
        taxes: pricing.taxes,
        discount: pricing.discount,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        coupon,
        status: 'Upcoming',
        payment: 'DEMO_SUCCESS',
        paymentMethod,
        accessTokenHash,
        createdAt: now,
        bookedAt: now.toISOString(),
      };
      await bookings.insertOne(booking, { session });
      const update = await inventory.updateMany({ showKey, seatId: { $in: seatIds }, baseStatus: 'available', bookingId: null }, { $set: { bookingId } }, { session });
      if (update.matchedCount !== seatIds.length) throw new ApiError(409, 'seat_unavailable', 'A reserved seat is no longer available. Please refresh and try again.');
      await holds.deleteMany({ showKey, holdTokenHash }, { session });
      result = cleanBooking(booking);
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
  } catch (error) {
    if (error?.code === 11000 || error?.code === 112) {
      throw new ApiError(409, 'seat_unavailable', 'A reserved seat is no longer available. Please refresh and try again.');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return { booking: result, bookingAccessToken };
}

export async function lookupBookings(credentials) {
  if (!Array.isArray(credentials) || credentials.length > 50) throw new ApiError(400, 'invalid_lookup', 'Provide up to 50 booking access credentials.');
  const valid = credentials.filter((item) => item && typeof item.id === 'string' && typeof item.token === 'string');
  if (!valid.length) return [];
  const matches = valid.map(({ id, token }) => ({ id, accessTokenHash: hashSecretToken(validateOpaqueToken(token)) }));
  const bookingsDb = await requireMongo('bookings');
  const bookings = bookingsDb.collection('bookings');
  const docs = await bookings.find({ $or: matches }).sort({ createdAt: -1 }).limit(50).toArray();
  const completedIds = docs.filter((doc) => doc.status === 'Upcoming' && deriveBookingStatus(doc) === 'Completed').map((doc) => doc.id);
  if (completedIds.length) {
    const completedAt = new Date();
    await bookings.updateMany({ id: { $in: completedIds }, status: 'Upcoming' }, { $set: { status: 'Completed', completedAt } });
    for (const doc of docs) if (completedIds.includes(doc.id)) doc.status = 'Completed';
  }
  return docs.map(bookingSummary);
}

export async function getBooking(id, token) {
  const accessToken = validateOpaqueToken(token);
  const bookingsDb = await requireMongo('bookings');
  const bookings = bookingsDb.collection('bookings');
  let doc = await bookings.findOne({ id, accessTokenHash: hashSecretToken(accessToken) });
  if (!doc) throw new ApiError(404, 'booking_not_found', 'That booking could not be found.');
  if (doc.status === 'Upcoming' && deriveBookingStatus(doc) === 'Completed') {
    const completedAt = new Date();
    await bookings.updateOne({ id, status: 'Upcoming' }, { $set: { status: 'Completed', completedAt } });
    doc = { ...doc, status: 'Completed', completedAt };
  }
  return cleanBooking(doc);
}

export async function cancelBooking(id, token) {
  const accessToken = validateOpaqueToken(token);
  const [bookingsDb, inventoryDb] = await Promise.all([
    requireMongo('bookings'),
    requireMongo('inventory'),
  ]);
  const client = getMongoClient();
  let result = null;
  const bookings = bookingsDb.collection('bookings');
  const owned = await bookings.findOne({ id, accessTokenHash: hashSecretToken(accessToken) });
  if (!owned) throw new ApiError(404, 'booking_not_found', 'That booking could not be found.');
  if (owned.status === 'Upcoming' && deriveBookingStatus(owned) === 'Completed') {
    await bookings.updateOne({ id, status: 'Upcoming' }, { $set: { status: 'Completed', completedAt: new Date() } });
    owned.status = 'Completed';
  }
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const booking = await bookings.findOne({ id, accessTokenHash: hashSecretToken(accessToken) }, { session });
      if (!booking) throw new ApiError(404, 'booking_not_found', 'That booking could not be found.');
      if (cleanBooking(booking).status !== 'Upcoming') throw new ApiError(409, 'booking_not_cancellable', 'Only an upcoming booking can be cancelled.');
      await bookings.updateOne({ id, accessTokenHash: hashSecretToken(accessToken), status: 'Upcoming' }, { $set: { status: 'Cancelled', cancelledAt: new Date() } }, { session });
      await inventoryDb.collection('seat_inventory').updateMany({ bookingId: id }, { $set: { bookingId: null } }, { session });
      result = cleanBooking({ ...booking, status: 'Cancelled' });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
  } finally {
    await session.endSession();
  }
  return result;
}

// --- ADMIN SPECIFIC SERVICES (DATABASE: showbook_bookings & showbook_catalog) ---

export async function getAllBookingsAdmin() {
  const bookingsDb = await requireMongo('bookings');
  await ensureBookings(bookingsDb);
  const bookings = await bookingsDb.collection('bookings').find({}).sort({ createdAt: -1 }).toArray();
  return bookings.map((b) => ({
    id: b.id,
    itemId: b.itemId,
    title: b.title,
    kind: b.kind,
    date: b.date,
    time: b.time,
    venue: b.venue,
    location: b.location,
    seats: b.seats || [],
    amount: b.amount,
    ticketPrice: b.ticketPrice,
    convenienceFee: b.convenienceFee,
    taxes: b.taxes,
    discount: b.discount,
    customerName: b.customerName,
    email: b.email,
    phone: b.phone,
    coupon: b.coupon,
    status: deriveBookingStatus(b),
    payment: b.payment,
    paymentMethod: b.paymentMethod,
    bookedAt: b.bookedAt || (b.createdAt ? b.createdAt.toISOString() : new Date().toISOString()),
  }));
}

export async function updateBookingStatusAdmin(id, status) {
  if (!['Upcoming', 'Completed', 'Cancelled'].includes(status)) {
    throw new ApiError(400, 'invalid_status', 'Status must be Upcoming, Completed, or Cancelled.');
  }
  const [bookingsDb, inventoryDb] = await Promise.all([
    requireMongo('bookings'),
    requireMongo('inventory'),
  ]);
  const booking = await bookingsDb.collection('bookings').findOne({ id });
  if (!booking) throw new ApiError(404, 'booking_not_found', 'Booking not found.');

  await bookingsDb.collection('bookings').updateOne({ id }, { $set: { status, updatedAt: new Date() } });

  if (status === 'Cancelled') {
    await inventoryDb.collection('seat_inventory').updateMany({ bookingId: id }, { $set: { bookingId: null } });
  } else if (status === 'Upcoming') {
    if (booking.showKey && Array.isArray(booking.seats)) {
      await inventoryDb.collection('seat_inventory').updateMany(
        { showKey: booking.showKey, seatId: { $in: booking.seats } },
        { $set: { bookingId: id } }
      );
    }
  }

  const updated = await bookingsDb.collection('bookings').findOne({ id });
  return cleanBooking(updated);
}

export async function getAdminStats() {
  const [bookingsDb, catalogDb] = await Promise.all([
    requireMongo('bookings'),
    requireMongo('catalog'),
  ]);
  await ensureCatalog(catalogDb);
  await ensureBookings(bookingsDb);

  const [bookings, catalogItems] = await Promise.all([
    bookingsDb.collection('bookings').find({}).toArray(),
    catalogDb.collection('catalog').find({}).toArray(),
  ]);

  let totalRevenue = 0;
  let upcomingCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let totalSeatsBooked = 0;
  const customersMap = new Map();
  const showRevenueMap = new Map();

  for (const b of bookings) {
    const status = deriveBookingStatus(b);
    if (status === 'Upcoming') upcomingCount++;
    if (status === 'Completed') completedCount++;
    if (status === 'Cancelled') cancelledCount++;

    if (status !== 'Cancelled') {
      const amt = Number(b.amount) || 0;
      totalRevenue += amt;
      totalSeatsBooked += (b.seats?.length || 0);

      const title = b.title || 'Unknown';
      showRevenueMap.set(title, (showRevenueMap.get(title) || 0) + amt);
    }

    if (b.email) {
      const existing = customersMap.get(b.email) || {
        name: b.customerName || 'Customer',
        email: b.email,
        phone: b.phone || '',
        bookingsCount: 0,
        totalSpend: 0,
        lastBookedAt: b.bookedAt || '',
      };
      existing.bookingsCount++;
      if (status !== 'Cancelled') {
        existing.totalSpend += Number(b.amount) || 0;
      }
      customersMap.set(b.email, existing);
    }
  }

  const topShows = [...showRevenueMap.entries()]
    .map(([title, revenue]) => ({ title, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const moviesCount = catalogItems.filter((i) => i.kind === 'movie').length;
  const eventsCount = catalogItems.filter((i) => i.kind === 'event').length;

  return {
    mongoStatus: mongoStatus(),
    totalRevenue,
    totalBookings: bookings.length,
    upcomingBookings: upcomingCount,
    completedBookings: completedCount,
    cancelledBookings: cancelledCount,
    totalSeatsBooked,
    totalMovies: moviesCount,
    totalEvents: eventsCount,
    totalCustomers: customersMap.size,
    customers: [...customersMap.values()].sort((a, b) => b.totalSpend - a.totalSpend),
    topShows,
    recentBookings: bookings
      .slice(-6)
      .reverse()
      .map(cleanBooking),
  };
}

export async function getAdminSeats({ itemId, date, time }) {
  const [inventoryDb, bookingsDb] = await Promise.all([
    requireMongo('inventory'),
    requireMongo('bookings'),
  ]);
  const item = await findItem(itemId);
  const { showKey } = validateShow({ itemId, date, time }, item);
  await ensureInventory(inventoryDb, showKey);

  const [inventory, bookings] = await Promise.all([
    inventoryDb.collection('seat_inventory').find({ showKey }).toArray(),
    bookingsDb.collection('bookings').find({ showKey, status: { $ne: 'Cancelled' } }).toArray(),
  ]);

  const bookingMap = new Map();
  for (const b of bookings) {
    if (Array.isArray(b.seats)) {
      for (const seatId of b.seats) {
        bookingMap.set(seatId, {
          bookingId: b.id,
          customerName: b.customerName,
          email: b.email,
          phone: b.phone,
          amount: b.amount,
        });
      }
    }
  }

  const seats = inventory.map((seat) => {
    let status = seat.baseStatus;
    if (seat.bookingId) status = 'booked';
    const customer = bookingMap.get(seat.seatId) || null;
    return {
      id: seat.seatId,
      tier: seat.tier,
      price: seat.price,
      status,
      baseStatus: seat.baseStatus,
      bookingId: seat.bookingId,
      customer,
    };
  }).sort((a, b) => a.id.localeCompare(b.id));

  return { showKey, itemId, date, time, item: { id: item.id, title: item.title, venue: item.venue }, seats };
}

export async function toggleSeatLockAdmin({ showKey, seatId, locked }) {
  const inventoryDb = await requireMongo('inventory');
  const status = locked ? 'locked' : 'available';
  await inventoryDb.collection('seat_inventory').updateOne(
    { showKey, seatId },
    { $set: { baseStatus: status } },
    { upsert: true }
  );
  return { success: true, showKey, seatId, status };
}

// --- COUPON MANAGEMENT (DATABASE: showbook_marketing) ---

export async function getCouponsFromDb() {
  const marketingDb = await requireMongo('marketing');
  await ensureCoupons(marketingDb);
  const coupons = await marketingDb.collection('coupons').find({}).toArray();
  return coupons;
}

export async function createCouponInDb(data) {
  const marketingDb = await requireMongo('marketing');
  await ensureCoupons(marketingDb);
  const code = (data.code || '').trim().toUpperCase();
  if (!code) throw new ApiError(400, 'invalid_code', 'Coupon code is required.');

  const existing = await marketingDb.collection('coupons').findOne({ code });
  if (existing) throw new ApiError(409, 'coupon_exists', 'A coupon with that code already exists.');

  const newCoupon = {
    code,
    title: data.title || code,
    detail: data.detail || `${data.discountValue || 10}% discount on ticket purchase.`,
    discountType: data.discountType === 'flat' ? 'flat' : 'percent',
    discountValue: Number(data.discountValue) || 10,
    active: true,
    tone: data.tone || 'coral',
    createdAt: new Date(),
  };

  await marketingDb.collection('coupons').insertOne(newCoupon);
  return newCoupon;
}

export async function toggleCouponInDb(code) {
  const marketingDb = await requireMongo('marketing');
  await ensureCoupons(marketingDb);
  const normalized = (code || '').trim().toUpperCase();
  const coupon = await marketingDb.collection('coupons').findOne({ code: normalized });
  if (!coupon) throw new ApiError(404, 'coupon_not_found', 'Coupon not found.');

  const updatedActive = !coupon.active;
  await marketingDb.collection('coupons').updateOne({ code: normalized }, { $set: { active: updatedActive } });
  return { ...coupon, active: updatedActive };
}

export async function resetDatabaseSeed() {
  const [catalogDb, marketingDb] = await Promise.all([
    requireMongo('catalog'),
    requireMongo('marketing'),
  ]);
  await catalogDb.collection('catalog').deleteMany({});
  await marketingDb.collection('coupons').deleteMany({});
  catalogSeeded = false;
  couponsSeeded = false;
  await ensureCatalog(catalogDb);
  await ensureCoupons(marketingDb);
  return { success: true, message: 'Database catalog and coupons reseeded successfully.' };
}
