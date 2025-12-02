import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [react()],
  output: 'server',  // SSRでCloudflare Accessのヘッダーを取得
  adapter: cloudflare(),
  site: 'https://open-sen.llll-ll.com',
  vite: {
    define: {
      'import.meta.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL || ''),
    },
  },
});
