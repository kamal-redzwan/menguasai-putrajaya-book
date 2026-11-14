import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

declare const __BUILD_CHIP_SECRET_KEY__: string | undefined;
declare const __BUILD_CHIP_BRAND_ID__: string | undefined;

export const prerender = false;

function getOrdersKv(runtimeEnv: Record<string, any>) {
  if (runtimeEnv.ORDERS_DB && typeof runtimeEnv.ORDERS_DB.put === 'function') {
    return runtimeEnv.ORDERS_DB;
  }
  for (const [key, val] of Object.entries(runtimeEnv)) {
    if (
      key !== 'ASSETS' &&
      key !== 'SESSION' &&
      val &&
      typeof val === 'object' &&
      typeof (val as any).put === 'function' &&
      typeof (val as any).get === 'function'
    ) {
      return val as any;
    }
  }
  return undefined;
}

function buildOrderRecord(
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

  const quantity =
    products.length > 0
      ? Math.max(1, Math.round(Number(products[0]?.quantity || 1)))
      : 1;

  const productAndNotes = `${products[0]?.name || ''} ${purchase.notes || ''}`;
  const shippingZone = productAndNotes.includes('Sabah & Sarawak')
    ? 'Sabah & Sarawak'
    : 'Semenanjung Malaysia';

  const calculatedTotalSen =
    products.length > 0
      ? products.reduce(
          (sum: number, p: any) =>
            sum + Number(p.price || 0) * Math.round(Number(p.quantity || 1)),
          0
        )
      : 5600;

  const totalSen = Number(
    chipResponseData?.purchase?.total ?? purchase.total ?? calculatedTotalSen
  );

  return {
    zon_penghantaran: shippingZone,
    nama_penuh: customerName,
    email: customerEmail,
    telefon: customerPhone,
    kuantiti: quantity,
    alamat_penghantaran: shippingAddress,
    jumlah_bayaran: `RM${(totalSen / 100).toFixed(2)}`,
    status,
    tarikh: new Date().toISOString(),
  };
}

export const GET: APIRoute = async ({ request }) => {
  const runtimeEnv = (env || {}) as Record<string, any>;
  const ordersDb = getOrdersKv(runtimeEnv);
  const url = new URL(request.url);

  let kvStatus = 'tidak_terikat';
  let keys: unknown[] = [];

  if (ordersDb) {
    kvStatus = 'terikat';
    try {
      if (url.searchParams.get('test_write') === '1') {
        const testKey = `test_${Date.now()}`;
        await ordersDb.put(
          testKey,
          JSON.stringify({ test: true, saved_at: new Date().toISOString() })
        );
        await ordersDb.get(testKey);
      }
      if (typeof ordersDb.list === 'function') {
        const listResult = (await ordersDb.list({ limit: 20 })) as {
          keys?: unknown[];
        };
        keys = listResult?.keys || [];
      }
    } catch (err: any) {
      kvStatus = `ralat: ${err?.message || String(err)}`;
    }
  }

  return new Response(
    JSON.stringify({
      service: 'CHIP Collect Checkout Endpoint',
      status: 'sedia',
      kv_binding: kvStatus,
      kv_keys_count: keys.length,
      kv_keys: keys,
      env_keys: Object.keys(runtimeEnv),
      message: 'Gunakan kaedah POST untuk mencipta transaksi pembelian buku.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as Record<string, any>;

    const runtimeEnv = (env || {}) as Record<string, any>;
    const ordersDb = getOrdersKv(runtimeEnv);

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

    // 1. Immediately save initial form submission to KV before external network call
    const initialOrderId = `order_${Date.now()}`;
    if (ordersDb) {
      try {
        const initialRecord = buildOrderRecord(body, 'submitted');
        await ordersDb.put(initialOrderId, JSON.stringify(initialRecord));
        await ordersDb.get(initialOrderId);
      } catch (kvErr: any) {
        console.error('[Checkout API] Ralat menulis rekod awal ke KV:', kvErr);
      }
    }

    if (!secretKey || !brandId || brandId === 'CHIP_BRAND_ID_ANDA') {
      return new Response(
        JSON.stringify({
          status: 'konfigurasi_diperlukan',
          kv_saved: Boolean(ordersDb),
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

    // 2. Store the finalized form record in Cloudflare KV (ORDERS_DB) and verify with get()
    const transactionId =
      typeof data?.id === 'string' && data.id ? data.id : initialOrderId;

    if (ordersDb) {
      try {
        const orderRecord = buildOrderRecord(
          body,
          chipResponse.ok ? String(data?.status || 'created') : 'chip_error',
          data
        );
        await ordersDb.put(transactionId, JSON.stringify(orderRecord));
        const verified = await ordersDb.get(transactionId);
        if (transactionId !== initialOrderId && verified !== null && typeof ordersDb.delete === 'function') {
          await ordersDb.delete(initialOrderId);
        }
      } catch (kvErr) {
        console.error(
          `[Checkout API] Ralat menyimpan transaksi ${transactionId} ke ORDERS_DB KV:`,
          kvErr
        );
      }
    } else {
      console.error(
        `[Checkout API] KV binding ORDERS_DB tidak ditemui pada env. Kunci env tersedia: ${Object.keys(runtimeEnv).join(', ')}`
      );
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

    return new Response(
      JSON.stringify({
        ...data,
        kv_saved: Boolean(ordersDb),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
