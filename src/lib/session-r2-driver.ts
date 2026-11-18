// Astro session store for EmDash sign-in, kept in the R2 bucket instead of KV.
// unstorage's own R2 driver looks the binding up on globalThis, which a module Worker never sets,
// so we hand it the bucket from cloudflare:workers (where EmDash's media storage finds it too).
import { env } from "cloudflare:workers";
import r2Driver from "unstorage/drivers/cloudflare-r2-binding";

type Options = { binding: string; base?: string };

export default (opts: Options) =>
  r2Driver({ ...opts, binding: (env as Record<string, unknown>)[opts.binding] as never });
