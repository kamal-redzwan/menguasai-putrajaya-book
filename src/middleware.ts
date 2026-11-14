import { defineMiddleware } from 'astro:middleware';
import { env as workerEnv } from 'cloudflare:workers';

export const onRequest = defineMiddleware((context, next) => {
  try {
    const runtimeEnvRecord = (workerEnv ?? {}) as unknown as Record<string, unknown>;
    const combinedEnv: Record<string, unknown> = {
      ...runtimeEnvRecord,
      CHIP_SECRET_KEY:
        runtimeEnvRecord.CHIP_SECRET_KEY || import.meta.env.CHIP_SECRET_KEY,
      CHIP_BRAND_ID:
        runtimeEnvRecord.CHIP_BRAND_ID ||
        runtimeEnvRecord.PUBLIC_CHIP_BRAND_ID ||
        import.meta.env.CHIP_BRAND_ID ||
        import.meta.env.PUBLIC_CHIP_BRAND_ID,
    };

    const locals = context.locals as unknown as Record<string, unknown>;
    if (locals && typeof locals === 'object') {
      if (locals.runtime && typeof locals.runtime === 'object') {
        Object.defineProperty(locals.runtime, 'env', {
          value: combinedEnv,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        Object.defineProperty(locals, 'runtime', {
          value: { env: combinedEnv },
          writable: true,
          enumerable: false,
          configurable: true,
        });
      }
    }
  } catch {
    // Ignore if runtime property cannot be redefined in the current environment
  }

  return next();
});
