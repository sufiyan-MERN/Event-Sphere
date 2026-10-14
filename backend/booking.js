import { createHash } from 'node:crypto';
import { getItem } from '../src/data/content.js';
import { ApiError } from './errors.js';
import { seatById } from '../src/data/seats.js';
import { availableShowDates, availableShowTimes, isCalendarDate } from '../src/data/show-schedule.js';

export const paymentMethods = ['UPI', 'Credit/Debit Card', 'Net Banking', 'Wallet'];

export function parseDurationMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) return Math.ceil(duration);
  if (typeof duration !== 'string') return null;
  let totalMinutes = 0;
  let parts = 0;
  for (const match of duration.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/gi)) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    totalMinutes += amount * (unit.startsWith('h') ? 60 : 1);
    parts += 1;
  }
  return parts && Number.isFinite(totalMinutes) && totalMinutes > 0 ? Math.ceil(totalMinutes) : null;
}

export function deriveBookingStatus(booking, now = Date.now()) {
  if (booking?.status === 'Cancelled' || booking?.status === 'Completed') return booking.status;
  if (booking?.status !== 'Upcoming' || !isCalendarDate(booking.date)) return booking?.status;
  const match = typeof booking.time === 'string' ? /^(\d{1,2}):(\d{2})\s+(AM|PM)$/.exec(booking.time) : null;
  if (!match) return 'Upcoming';
  const hour12 = Number(match[1]);
  const minute = Number(match[2]);
  if (hour12 < 1 || hour12 > 12 || minute > 59) return 'Upcoming';
  let hour = hour12 % 12;
  if (match[3] === 'PM') hour += 12;
  const [year, month, day] = booking.date.split('-').map(Number);
  const showStartUtc = Date.UTC(year, month - 1, day, hour, minute) - 330 * 60_000;
  const duration = parseDurationMinutes(booking.duration) ?? parseDurationMinutes(getItem(booking.itemId)?.duration);
  if (!duration) return 'Upcoming';
  return showStartUtc + duration * 60_000 <= now ? 'Completed' : 'Upcoming';
}

export function sanitizeBookingSummary(booking) {
  const { accessTokenHash, showKey, _id, customerName, email, phone, ...summary } = booking;
  return summary;
}

export function validateShow(input, fallbackItem = null) {
  const itemId = typeof input?.itemId === 'string' ? input.itemId.trim() : '';
  const item = fallbackItem || getItem(itemId);
  if (!item) throw new ApiError(404, 'catalog_item_not_found', 'That movie or event could not be found.');
  const date = typeof input?.date === 'string' ? input.date : '';
  if (!isCalendarDate(date)) {
    throw new ApiError(400, 'invalid_date', 'Choose a valid show date.');
  }
  if (!availableShowDates(item).includes(date)) {
    throw new ApiError(400, 'show_date_unavailable', 'That movie or event is not scheduled on the selected date.');
  }
  const time = typeof input?.time === 'string' ? input.time : '';
  if (!availableShowTimes(item, date).includes(time)) {
    throw new ApiError(400, 'invalid_showtime', 'That showtime is not scheduled for the selected movie or event.');
  }
  return { item, itemId, date, time, showKey: `${itemId}|${date}|${time}` };
}

export function validateSeatIds(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 48) {
    throw new ApiError(400, 'invalid_seats', 'Select between one and 48 seats.');
  }
  const ids = [...new Set(value.map((id) => typeof id === 'string' ? id.trim().toUpperCase() : ''))];
  if (ids.length !== value.length || ids.some((id) => !seatById(id))) {
    throw new ApiError(400, 'invalid_seats', 'One or more seat IDs are invalid.');
  }
  return ids.sort((a, b) => a.localeCompare(b));
}

export function validateContact(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  const phone = typeof input?.phone === 'string' ? input.phone.trim() : '';
  if (name.length < 2 || name.length > 100) throw new ApiError(400, 'invalid_name', 'Enter a name between 2 and 100 characters.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'invalid_email', 'Enter a valid email address.');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) throw new ApiError(400, 'invalid_phone', 'Enter a valid phone number.');
  return { name, email, phone };
}

export function normalizeCoupon(input) {
  const coupon = typeof input === 'string' ? input.trim().toUpperCase() : '';
  return coupon;
}

export function calculateServerPrice(seats, coupon = '') {
  const ticketPrice = seats.reduce((sum, seat) => sum + seat.price, 0);
  const convenienceFee = seats.length ? 30 : 0;
  const taxes = Math.round((ticketPrice + convenienceFee) * 0.05);
  let discount = 0;
  if (coupon === 'STUDENT50') {
    discount = Math.round(ticketPrice * 0.5);
  } else if (coupon === 'FIRSTBOOKING') {
    discount = Math.round(ticketPrice * 0.1);
  } else if (coupon === 'WEEKEND') {
    discount = Math.min(100, ticketPrice);
  } else if (coupon === 'CASHBACK') {
    discount = Math.min(50, ticketPrice);
  } else if (coupon) {
    // Dynamic or admin-added coupon default 10%
    discount = Math.round(ticketPrice * 0.1);
  }
  return { ticketPrice, convenienceFee, taxes, discount, total: Math.max(0, ticketPrice + convenienceFee + taxes - discount) };
}

export function hashSecretToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function validateOpaqueToken(token, code = 'invalid_access_token') {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    throw new ApiError(401, code, 'A valid booking access token is required.');
  }
  return token;
}
