import type { APIRoute } from 'astro';
import { env as workerEnv } from 'cloudflare:workers';

declare const __BUILD_CHIP_BRAND_ID__: string | undefined;
declare const __BUILD_CHIP_PUBLIC_KEY__: string | undefined;

export const prerender = false;

// Verifies RSA-SHA256 signature against raw body using standard Web Crypto API
async function verifySignature(
  rawBody: string,
  signatureBase64: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    const cleanPem = publicKeyPem
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\s+/g, '');
    const binaryDer = Uint8Array.from(atob(cleanPem), (c) => c.charCodeAt(0));
    const cryptoSubtle = globalThis.crypto?.subtle;
    if (!cryptoSubtle) return false;

    const key = await cryptoSubtle.importKey(
      'spki',
      binaryDer.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(signatureBase64), (c) =>
      c.charCodeAt(0)
    );
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(rawBody);

    return await cryptoSubtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      signatureBytes,
      dataBytes
    );
  } catch (err) {
    console.error('[Webhook] Ralat semasa mengesahkan tandatangan RSA:', err);
    return false;
  }
}

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      service: 'CHIP Collect Webhook Endpoint',
      status: 'sedia',
      message: 'Gunakan kaedah POST untuk memproses webhook daripada CHIP Collect.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim() === '') {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Permintaan tidak sah: Kandungan badan kosong.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Format JSON tidak sah dalam badan permintaan webhook.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const runtimeEnv = (workerEnv || {}) as Record<string, any>;
    const configuredBrandId = (
      (runtimeEnv.CHIP_BRAND_ID as string) ||
      (typeof __BUILD_CHIP_BRAND_ID__ !== 'undefined' ? __BUILD_CHIP_BRAND_ID__ : '') ||
      'db3280df-c2eb-48e5-bdcb-b757e269de69'
    ).trim();
    const chipPublicKey = (
      (runtimeEnv.CHIP_PUBLIC_KEY as string) ||
      (typeof __BUILD_CHIP_PUBLIC_KEY__ !== 'undefined' ? __BUILD_CHIP_PUBLIC_KEY__ : '') ||
      ''
    ).trim();

    // 1. Verify signature if X-Signature header and CHIP_PUBLIC_KEY are available
    const signatureHeader =
      request.headers.get('x-signature') ||
      request.headers.get('X-Signature');

    if (signatureHeader && chipPublicKey) {
      const isValidSignature = await verifySignature(
        rawBody,
        signatureHeader,
        chipPublicKey
      );
      if (!isValidSignature) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Tandatangan webhook X-Signature tidak sah.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 2. Verify brand ID if configured
    const targetObj = (payload.object && typeof payload.object === 'object' ? payload.object : payload) as Record<string, any>;
    const payloadBrandId = targetObj.brand_id || payload.brand_id;

    if (
      configuredBrandId &&
      configuredBrandId !== 'CHIP_BRAND_ID_ANDA' &&
      payloadBrandId &&
      payloadBrandId !== configuredBrandId
    ) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Padanan brand_id webhook tidak sah.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Verify transaction ID
    const transactionId =
      targetObj.id || payload.id || payload.purchase_id || payload.transaction_id;

    if (!transactionId || typeof transactionId !== 'string') {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'ID transaksi tidak ditemui dalam muatan webhook.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Return 200 OK so CHIP acknowledges successful webhook delivery
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Webhook berjaya diterima dan disahkan.',
        transaction_id: transactionId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Webhook] Ralat tidak dijangka:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Ralat pelayan dalaman semasa memproses webhook.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
