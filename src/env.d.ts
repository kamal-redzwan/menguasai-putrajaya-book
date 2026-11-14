/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare const __CHIP_SECRET_KEY__: string;
declare const __CHIP_BRAND_ID__: string;
declare const __CHIP_PUBLIC_KEY__: string;

interface KVNamespace {
  get(key: string, options?: unknown): Promise<string | null>;
  put(key: string, value: string | ReadableStream | ArrayBuffer, options?: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: unknown): Promise<unknown>;
}

declare module 'cloudflare:workers' {
  export const env: {
    ORDERS_DB?: KVNamespace;
    [key: string]: unknown;
  };
}
