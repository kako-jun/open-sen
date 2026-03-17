import { getTrendColor } from '../utils/chartUtils';

interface MiniChartProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

/**
 * Mini sparkline chart component (SVG)
 */
export default function MiniChart({
  data,
  color,
  width = 50,
  height = 16,
}: MiniChartProps) {
  if (!data || data.length < 2) return null;

  const chartColor = color || getTrendColor(data);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const filterId = `glow-mini-${Math.round(Math.random() * 10000)}`;

  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={chartColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}
