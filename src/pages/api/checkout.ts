import type { APIRoute } from 'astro';

// Proxy purchase creation to CHIP Collect (POST https://gate.chip-in.asia/api/v1/purchases/) so CHIP_SECRET_KEY stays server-side.
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      service: 'CHIP Collect Checkout Endpoint',
      status: 'sedia',
      message: 'Gunakan kaedah POST untuk mencipta transaksi pembelian buku.',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const secretKey = import.meta.env.CHIP_SECRET_KEY;
    const brandId = import.meta.env.CHIP_BRAND_ID || body.brand_id;

    if (!secretKey || !brandId || brandId === 'CHIP_BRAND_ID_ANDA') {
      return new Response(
        JSON.stringify({
          status: 'konfigurasi_diperlukan',
          message:
            'Sila tetapkan pemboleh ubah persekitaran CHIP_SECRET_KEY dan CHIP_BRAND_ID untuk mengaktifkan pengalihan pembayaran sebenar CHIP Collect.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const chipResponse = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        brand_id: brandId,
      }),
    });

    const data = await chipResponse.json();

    if (!chipResponse.ok) {
      return new Response(
        JSON.stringify({
          message: 'Gagal mencipta transaksi pada pelayan CHIP Collect.',
          details: data,
        }),
        {
          status: chipResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        message: 'Ralat pelayan semasa memproses permintaan pembayaran CHIP Collect.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
