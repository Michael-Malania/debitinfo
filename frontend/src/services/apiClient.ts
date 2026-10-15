/**
 * API Client configuration
 *
 * When a separate backend (e.g. FastAPI, Express, NestJS, Go) is deployed,
 * set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:8000/api/v1).
 * If NEXT_PUBLIC_API_URL is omitted, requests hit the Next.js internal API routes.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[apiFetch] Fallback/Error on ${url}:`, error);
    throw error;
  }
}
