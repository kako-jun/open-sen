import { getPlatformConfig } from '../utils/platformConfig';

interface PlatformBadgeProps {
  platform: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: { box: 18, icon: 10 },
  medium: { box: 22, icon: 12 },
  large: { box: 28, icon: 14 },
};

/**
 * Platform icon badge component
 */
export default function PlatformBadge({ platform, size = 'small' }: PlatformBadgeProps) {
  const config = getPlatformConfig(platform);
  const { box, icon } = sizeConfig[size];

  return (
    <span
      style={{
        background: config.color,
        color: 'white',
        width: `${box}px`,
        height: `${box}px`,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <i className={config.icon} style={{ fontSize: `${icon}px` }}></i>
    </span>
  );
}
