// Platform configuration for icons and colors

export interface PlatformConfig {
  color: string;
  icon: string;
}

export const platformConfig: Record<string, PlatformConfig> = {
  zenn: { color: '#3ea8ff', icon: 'fa-solid fa-z' },
  qiita: { color: '#55c500', icon: 'fa-solid fa-q' },
  reddit: { color: '#ff4500', icon: 'fa-brands fa-reddit-alien' },
  github: { color: '#333333', icon: 'fa-brands fa-github' },
  note: { color: '#41c9b4', icon: 'fa-solid fa-n' },
  x: { color: '#000000', icon: 'fa-brands fa-x-twitter' },
  instagram: { color: '#e4405f', icon: 'fa-brands fa-instagram' },
  youtube: { color: '#ff0000', icon: 'fa-brands fa-youtube' },
  tiktok: { color: '#000000', icon: 'fa-brands fa-tiktok' },
  facebook: { color: '#1877f2', icon: 'fa-brands fa-facebook' },
  threads: { color: '#000000', icon: 'fa-brands fa-threads' },
};

const defaultConfig: PlatformConfig = { color: '#6e7681', icon: 'fa-solid fa-link' };

export function getPlatformConfig(platform: string): PlatformConfig {
  return platformConfig[platform] || defaultConfig;
}
