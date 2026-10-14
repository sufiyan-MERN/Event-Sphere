/**
 * Application routes and dynamic route configuration.
 * Allows customizing route paths (such as the admin panel) via .env variables.
 */

export function normalizeRoute(route) {
  if (!route || typeof route !== 'string') return '/admin';
  const trimmed = route.trim();
  if (!trimmed) return '/admin';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.length > 1 ? withLeading.replace(/\/+$/, '') : withLeading;
}

export const ADMIN_ROUTE = normalizeRoute(
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_ADMIN_ROUTE || import.meta.env?.ADMIN_ROUTE)) ||
    '/admin'
);
