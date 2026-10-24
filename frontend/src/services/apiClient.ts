/**
 * Debitinfo API Client
 * Connects Next.js Frontend with NestJS + Fastify Backend
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('debitinfo_access_token');
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
      headers,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
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
