import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

declare const __BUILD_CHIP_SECRET_KEY__: string | undefined;
declare const __BUILD_CHIP_BRAND_ID__: string | undefined;

export const prerender = false;

function enrichChipPayload(
  body: Record<string, any>,
  brandId: string,
  successCallback: string
): Record<string, any> {
  const client = { ...(body.client || {}) } as Record<string, any>;
  const purchase = { ...(body.purchase || {}) } as Record<string, any>;
  const rawProducts = Array.isArray(purchase.products) ? purchase.products : [];

  const fullName = String(
    client.full_name || client.name || body.full_name || ''
  ).trim();
  const email = String(client.email || body.email || '').trim();
  const phone = String(
    client.phone || client.phone_number || body.phone || ''
  ).trim();
  const rawAddress = String(
    client.shipping_street_address ||
      client.street_address ||
      client.shipping_address ||
      body.shipping_address ||
      ''
  ).trim();
  const cleanAddress = rawAddress.replace(/\s+/g, ' ');
  const truncatedAddress = cleanAddress.slice(0, 128);

  if (truncatedAddress) {
    client.street_address = client.street_address || truncatedAddress;
    client.shipping_street_address =
      client.shipping_street_address || truncatedAddress;
  }

  const firstProduct = rawProducts[0] || {};
  const quantity = Math.max(1, Math.round(Number(firstProduct.quantity || 1)));
  const unitPriceSen = Number(firstProduct.price || 5600);
  const totalRM = ((unitPriceSen * quantity) / 100).toFixed(2);

  const productAndNotes = `${firstProduct.name || ''} ${purchase.notes || ''}`;
  const regionLabel = productAndNotes.includes('Sabah & Sarawak')
    ? 'Sabah & Sarawak'
    : 'Semenanjung Malaysia';

  const cleanProductName = `Siapa Akan Menguasai Putrajaya? (${regionLabel})`;

  const products =
    rawProducts.length > 0
      ? rawProducts.map((p: any, idx: number) =>
          idx === 0
            ? {
                ...p,
                name: cleanProductName,
              }
            : p
        )
      : [
          {
            name: cleanProductName,
            price: unitPriceSen,
            quantity,
          },
        ];

  const fullNotes = `Nama: ${fullName} | Tel: ${phone} | E-mel: ${email} | Zon: ${regionLabel} | Kuantiti: ${quantity} naskhah | Jumlah: RM${totalRM} | Alamat: ${cleanAddress}`;

  purchase.products = products;
  purchase.notes =
    purchase.notes && String(purchase.notes).includes('Alamat:')
      ? String(purchase.notes).slice(0, 10000)
      : fullNotes.slice(0, 10000);

  const payload: Record<string, any> = {
    ...body,
    brand_id: brandId,
    client,
    purchase,
    success_callback: successCallback,
  };

  // Leave reference unset so CHIP uses reference_generated (e.g. CH15) as the Receipt Invoice number
  delete payload.reference;

  return payload;
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

    const enrichedPayload = enrichChipPayload(body, brandId, successCallback);

    const chipResponse = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedPayload),
    });

    const data = (await chipResponse.json()) as Record<string, any>;

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
