// API configuration

export const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

/**
 * Get auth token from cookie
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Create fetch options with auth header
 */
export function createAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
