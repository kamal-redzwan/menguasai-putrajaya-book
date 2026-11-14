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
  vite: {
    define: {
      __BUILD_CHIP_SECRET_KEY__: JSON.stringify(process.env.CHIP_SECRET_KEY ?? ''),
      __BUILD_CHIP_BRAND_ID__: JSON.stringify(
        process.env.CHIP_BRAND_ID ??
          process.env.PUBLIC_CHIP_BRAND_ID ??
          'db3280df-c2eb-48e5-bdcb-b757e269de69'
      ),
      __BUILD_CHIP_PUBLIC_KEY__: JSON.stringify(process.env.CHIP_PUBLIC_KEY ?? ''),
    },
  },
});
