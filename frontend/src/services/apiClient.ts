/**
 * Debitinfo API Client
 * Connects Next.js Frontend with NestJS + Fastify Backend
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://debitinfo-backend.onrender.com'
    : 'http://localhost:4000');

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/ops',
  '/crm',
  '/analyst',
  '/legal',
  '/field-officer',
  '/accountant',
  '/hr',
  '/profile',
];

export const OPS_ROUTES = [
  '/ops',
  '/analyst',
  '/crm',
  '/legal',
  '/field-officer',
  '/accountant',
  '/hr',
];

export const OPS_ROLES = [
  'ADMIN',
  'ANALYST',
  'OPERATOR',
  'FIELD_OFFICER',
  'LEGAL',
  'ACCOUNTANT',
  'HR',
];

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isOpsRoute(pathname: string): boolean {
  return OPS_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isOpsRole(role?: string | null): boolean {
  if (!role) return false;
  return OPS_ROLES.includes(role.toUpperCase());
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('debitinfo_access_token');
  }

  const method = (options?.method || 'GET').toUpperCase();
  const hasBody = options?.body !== undefined && options?.body !== null;
  let finalBody = options?.body;

  // Fastify throws 400/500 if Content-Type is application/json but body is empty.
  // Supply an empty JSON object {} for POST/PUT/PATCH when no body was passed.
  if (['POST', 'PUT', 'PATCH'].includes(method) && !hasBody) {
    finalBody = JSON.stringify({});
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      body: finalBody,
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          // Identify user role BEFORE wiping storage
          let userRole: string | null = null;
          try {
            const rawUser = localStorage.getItem('debitinfo_user');
            if (rawUser) {
              const parsed = JSON.parse(rawUser);
              userRole = parsed?.role || null;
            }
          } catch {
            // ignore
          }

          if (!userRole) {
            const cookieMatch = document.cookie.match(/(?:^|;\s*)user_role=([^;]*)/);
            if (cookieMatch) {
              userRole = decodeURIComponent(cookieMatch[1]);
            }
          }

          localStorage.removeItem('debitinfo_access_token');
          localStorage.removeItem('debitinfo_refresh_token');
          localStorage.removeItem('debitinfo_user');
          document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
          document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';

          // Strictly redirect ONLY when session expires while inside a protected workspace.
          // Public routes ('/', '/about', '/contact', etc.) must NEVER redirect.
          const pathname = window.location.pathname;
          if (isProtectedRoute(pathname)) {
            const host = window.location.hostname.toLowerCase();
            const isDedicatedOps = host.startsWith('ops.') || host.includes('-ops');
            const isOps = isOpsRoute(pathname) || isOpsRole(userRole);

            if (isOps) {
              const base = isDedicatedOps ? '/' : '/ops';
              window.location.href = `${base}?expired=true&redirect=${encodeURIComponent(pathname)}`;
            } else {
              window.location.href = `/login?expired=true&redirect=${encodeURIComponent(pathname)}`;
            }
          }
        }
      }
      const message = json?.message || json?.error || `API error: ${res.status} ${res.statusText}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    // Unpack transform interceptor envelope { success: true, data: T }
    if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (error) {
    console.warn(`[apiFetch] Request to ${url} failed:`, error);
    throw error;
  }
}
