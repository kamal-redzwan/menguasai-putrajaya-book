import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  session: false,
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [tailwind()],
  env: {
    schema: {
      PUBLIC_CHIP_BRAND_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
