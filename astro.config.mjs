import { defineConfig, envField } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  session: false,
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  integrations: [tailwind()],
  vite: {
    define: {
      __CHIP_SECRET_KEY__: JSON.stringify(process.env.CHIP_SECRET_KEY || ''),
      __CHIP_BRAND_ID__: JSON.stringify(
        process.env.CHIP_BRAND_ID || process.env.PUBLIC_CHIP_BRAND_ID || ''
      ),
      __CHIP_PUBLIC_KEY__: JSON.stringify(process.env.CHIP_PUBLIC_KEY || ''),
    },
  },
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
      ORDERS_DB: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },
});
