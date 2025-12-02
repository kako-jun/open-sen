// String utility functions

/**
 * Shorten owner ID to first 8 characters
 */
export function shortenOwnerId(id: string): string {
  return id.substring(0, 8);
}

/**
 * Shorten URL for display
 */
export function shortenUrl(url: string, maxLength: number = 40): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.substring(0, 30) + '...' : u.pathname;
    return u.hostname + path;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }
}
