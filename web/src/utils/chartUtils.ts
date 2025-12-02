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

  if (diff > threshold) return '#22c55e'; // up - green
  if (diff < -threshold) return '#3b82f6'; // down - blue
  return '#8b949e'; // flat - gray
}
