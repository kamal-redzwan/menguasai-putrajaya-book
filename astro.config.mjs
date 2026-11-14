import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [tailwind()],
  env: {
    schema: {
      CHIP_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      CHIP_BRAND_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      PUBLIC_CHIP_BRAND_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },
});
