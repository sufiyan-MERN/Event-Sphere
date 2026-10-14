export class ApiClientError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  const url = path.startsWith('/api') ? `${API_BASE}${path}` : path;
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiClientError(503, 'api_unavailable', 'ShowBook’s booking service could not be reached. Please try again shortly.');
  }
  let payload = {};
  try { payload = await response.json(); } catch { /* Keep safe generic response for non-JSON failures. */ }
  if (!response.ok) {
    const error = payload?.error || {};
    throw new ApiClientError(response.status, error.code || 'api_error', error.message || 'The request could not be completed.');
  }
  return payload;
}

const jsonBody = (value) => JSON.stringify(value);
const authHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};

export const getHealth = () => request('/api/health');
export const getCatalog = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return request(`/api/catalog${query.size ? `?${query}` : ''}`);
};
export const getCatalogItem = (id) => request(`/api/catalog/${encodeURIComponent(id)}`);
export const getSeats = ({ itemId, date, time, holdToken = '' }) => {
  const query = new URLSearchParams({ itemId, date, time });
  return request(`/api/seats?${query}`, { headers: holdToken ? { 'X-Hold-Token': holdToken } : {} });
};
export const createSeatHold = (body) => request('/api/holds', { method: 'POST', body: jsonBody(body) });
export const releaseSeatHold = (holdToken) => request('/api/holds', { method: 'DELETE', body: jsonBody({ holdToken }) });
export const createBooking = (body) => request('/api/bookings', { method: 'POST', body: jsonBody(body) });
export const lookupBookings = (credentials) => request('/api/bookings/lookup', { method: 'POST', body: jsonBody({ credentials }) });
export const getBooking = (id, token) => request(`/api/bookings/${encodeURIComponent(id)}`, { headers: authHeaders(token) });
export const cancelBooking = (id, token) => request(`/api/bookings/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeaders(token) });
