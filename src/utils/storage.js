const STORAGE_KEYS = {
  location: 'showbook-location',
  profile: 'showbook-profile',
  bookings: 'showbook-bookings',
  lastConfirmedBookingId: 'showbook-last-confirmed-booking',
  isAuthenticated: 'showbook-signed-in',
  favorites: 'showbook-favorites',
  preferences: 'showbook-preferences',
  activeBooking: 'showbook-active-booking',
};

export function readStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEYS };
