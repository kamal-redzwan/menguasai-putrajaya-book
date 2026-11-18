import { defineConfig, envField, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import emdash from 'emdash/astro';
import { d1, r2 } from '@emdash-cms/cloudflare';

export default defineConfig({
  output: 'static',
  // EmDash keeps signed-in admin users in the Astro session. Sessions live in the R2 bucket (own folder) so the
  // Worker needs no KV namespace.
  session: {
    driver: sessionDrivers.cloudflareR2Binding({ binding: 'MEDIA', base: 'sessions' }),
  },
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'DB', session: 'auto' }),
      storage: r2({ binding: 'MEDIA' }),
    }),
  ],
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
