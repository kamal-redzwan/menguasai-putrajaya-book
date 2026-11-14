import type { APIRoute } from 'astro';
import { CHIP_BRAND_ID, getSecret } from 'astro:env/server';
import { env as workerEnv } from 'cloudflare:workers';

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

export const POST: APIRoute = async ({ request, locals }) => {
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

    const cfEnv = (locals as any)?.runtime?.env || {};
    const configuredBrandId =
      cfEnv.CHIP_BRAND_ID ||
      CHIP_BRAND_ID ||
      getSecret('CHIP_BRAND_ID');
    const chipPublicKey =
      cfEnv.CHIP_PUBLIC_KEY ||
      getSecret('CHIP_PUBLIC_KEY');

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
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 2. Verify brand ID if configured
    if (
      configuredBrandId &&
      configuredBrandId !== 'CHIP_BRAND_ID_ANDA' &&
      payload.brand_id &&
      payload.brand_id !== configuredBrandId
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
      payload.id || payload.purchase_id || payload.transaction_id;

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

    // 4. Parse customer details and purchased item
    const client = (payload.client || {}) as Record<string, any>;
    const purchase = (payload.purchase || {}) as Record<string, any>;
    const products = Array.isArray(purchase.products) ? purchase.products : [];

    const customerName = String(
      client.full_name ||
      client.name ||
      client.fullName ||
      payload.full_name ||
      ''
    ).trim();

    const customerEmail = String(
      client.email ||
      payload.email ||
      ''
    ).trim();

    const customerPhone = String(
      client.phone ||
      client.phone_number ||
      payload.phone ||
      ''
    ).trim();

    const shippingAddress = String(
      client.shipping_street_address ||
      client.street_address ||
      client.shipping_address ||
      client.address ||
      payload.shipping_address ||
      ''
    ).trim();

    const purchasedItem =
      products.length > 0
        ? products
            .map((p: any) => `${p.name || 'Buku'} (x${p.quantity || 1})`)
            .join(', ')
        : String(purchase.notes || 'Siapa Akan Menguasai Putrajaya?').trim();

    const orderData = {
      transaction_id: transactionId,
      customer_name: customerName,
      email: customerEmail,
      phone: customerPhone,
      shipping_address: shippingAddress,
      purchased_item: purchasedItem,
      products,
      total: purchase.total ?? null,
      currency: String(purchase.currency || 'MYR'),
      status: String(payload.status || payload.event_type || 'paid'),
      event_type: String(payload.event_type || 'purchase.paid'),
      payment: payload.payment || null,
      saved_at: new Date().toISOString(),
      raw_payload: payload,
    };

    // 5. Save order data into Cloudflare KV binding (ORDERS_DB)
    const ordersDb =
      cfEnv.ORDERS_DB ||
      (workerEnv as any)?.ORDERS_DB;

    if (ordersDb && typeof ordersDb.put === 'function') {
      try {
        await ordersDb.put(transactionId, JSON.stringify(orderData));
      } catch (kvError) {
        console.error(
          `[Webhook] Ralat semasa menyimpan rekod transaksi ${transactionId} ke KV:`,
          kvError
        );
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Gagal menyimpan rekod pesanan ke Cloudflare KV.',
            transaction_id: transactionId,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.warn(
        `[Webhook] KV binding ORDERS_DB belum dikonfigurasi atau tidak tersedia. Data pesanan (${transactionId}) diterima:`
      );
    }

    // 6. Return 200 OK so CHIP acknowledges successful webhook delivery
    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Webhook berjaya diproses dan disimpan.',
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
