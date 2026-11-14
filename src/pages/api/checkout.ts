import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

declare const __BUILD_CHIP_SECRET_KEY__: string | undefined;
declare const __BUILD_CHIP_BRAND_ID__: string | undefined;

export const prerender = false;

function buildOrderRecord(
  transactionId: string,
  body: Record<string, any>,
  status: string,
  chipResponseData?: Record<string, any>
) {
  const client = (body.client || {}) as Record<string, any>;
  const purchase = (body.purchase || {}) as Record<string, any>;
  const products = Array.isArray(purchase.products) ? purchase.products : [];

  const customerName = String(
    client.full_name || client.name || body.full_name || ''
  ).trim();
  const customerEmail = String(client.email || body.email || '').trim();
  const customerPhone = String(
    client.phone || client.phone_number || body.phone || ''
  ).trim();
  const shippingAddress = String(
    client.shipping_street_address ||
      client.street_address ||
      client.shipping_address ||
      body.shipping_address ||
      ''
  ).trim();

  const purchasedItem =
    products.length > 0
      ? products
          .map((p: any) => `${p.name || 'Buku'} (x${p.quantity || 1})`)
          .join(', ')
      : String(purchase.notes || 'Siapa Akan Menguasai Putrajaya?').trim();

  const calculatedTotal =
    products.length > 0
      ? products.reduce(
          (sum: number, p: any) =>
            sum + Number(p.price || 0) * Number(p.quantity || 1),
          0
        )
      : null;

  return {
    transaction_id: transactionId,
    customer_name: customerName,
    email: customerEmail,
    phone: customerPhone,
    shipping_address: shippingAddress,
    purchased_item: purchasedItem,
    products,
    total: chipResponseData?.purchase?.total ?? purchase.total ?? calculatedTotal,
    currency: String(purchase.currency || 'MYR'),
    status,
    checkout_url: chipResponseData?.checkout_url ?? null,
    saved_at: new Date().toISOString(),
  };
}

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      service: 'CHIP Collect Checkout Endpoint',
      status: 'sedia',
      message: 'Gunakan kaedah POST untuk mencipta transaksi pembelian buku.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, any>;

    const runtimeEnv = (env || {}) as Record<string, any>;
    const ordersDb = runtimeEnv.ORDERS_DB;

    const secretKey = (
      (runtimeEnv.CHIP_SECRET_KEY as string) ||
      (typeof __BUILD_CHIP_SECRET_KEY__ !== 'undefined' ? __BUILD_CHIP_SECRET_KEY__ : '') ||
      ''
    ).trim();

    const bodyBrandId =
      typeof body.brand_id === 'string' && body.brand_id !== 'CHIP_BRAND_ID_ANDA'
        ? body.brand_id
        : '';

    const brandId = (
      (runtimeEnv.CHIP_BRAND_ID as string) ||
      (typeof __BUILD_CHIP_BRAND_ID__ !== 'undefined' ? __BUILD_CHIP_BRAND_ID__ : '') ||
      bodyBrandId ||
      'db3280df-c2eb-48e5-bdcb-b757e269de69'
    ).trim();

    if (!secretKey || !brandId || brandId === 'CHIP_BRAND_ID_ANDA') {
      const fallbackId = `order_${Date.now()}`;
      if (ordersDb && typeof ordersDb.put === 'function') {
        try {
          const orderRecord = buildOrderRecord(fallbackId, body, 'pending_config');
          await ordersDb.put(fallbackId, JSON.stringify(orderRecord));
        } catch (kvErr) {
          console.error('[Checkout API] Ralat menyimpan ke ORDERS_DB KV:', kvErr);
        }
      }

      return new Response(
        JSON.stringify({
          status: 'konfigurasi_diperlukan',
          message:
            'Makluman Konfigurasi CHIP Collect: Sila tetapkan pemboleh ubah persekitaran CHIP_SECRET_KEY dan CHIP_BRAND_ID untuk mengaktifkan pengalihan pembayaran sebenar CHIP Collect.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const origin = new URL(request.url).origin;
    const successCallback =
      typeof body.success_callback === 'string' && body.success_callback
        ? body.success_callback
        : `${origin}/api/webhook`;

    const chipResponse = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        brand_id: brandId,
        success_callback: successCallback,
      }),
    });

    const data = (await chipResponse.json()) as Record<string, any>;

    // Store the form submission and transaction details in Cloudflare KV (ORDERS_DB)
    const transactionId =
      typeof data?.id === 'string' && data.id ? data.id : `order_${Date.now()}`;

    if (ordersDb && typeof ordersDb.put === 'function') {
      try {
        const orderRecord = buildOrderRecord(
          transactionId,
          body,
          chipResponse.ok ? String(data?.status || 'created') : 'chip_error',
          data
        );
        await ordersDb.put(transactionId, JSON.stringify(orderRecord));
      } catch (kvErr) {
        console.error(
          `[Checkout API] Ralat menyimpan transaksi ${transactionId} ke ORDERS_DB KV:`,
          kvErr
        );
      }
    } else {
      console.error('[Checkout API] KV binding ORDERS_DB tidak ditemui pada env.');
    }

    if (!chipResponse.ok) {
      return new Response(
        JSON.stringify({
          message: 'Gagal mencipta transaksi pada pelayan CHIP Collect.',
          details: data,
        }),
        { status: chipResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Checkout API Error]:', error);
    return new Response(
      JSON.stringify({
        message: `Ralat pelayan semasa memproses permintaan pembayaran. Butiran: ${error.message || 'Ralat tidak diketahui'}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
