// Chart utility functions

/**
 * Determine chart line color based on trend direction
 * - Up trend: green
 * - Down trend: blue
 * - Flat: gray
 */
export function getTrendColor(data: number[]): string {
  if (!data || data.length < 2) return 'var(--text-muted)';

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const threshold = Math.max(first * 0.05, 1); // 5% change threshold

  if (diff > threshold) return '#b8ff57'; // up - neon yellow-green
  if (diff < -threshold) return '#ff6b9d'; // down - neon pink
  return '#5a7a4a'; // flat - muted green
}
