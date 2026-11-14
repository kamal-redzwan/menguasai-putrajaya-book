import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

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
    const body = (await request.json()) as Record<string, unknown>;

    const secretKey = env.CHIP_SECRET_KEY as string;
    const brandId = (env.CHIP_BRAND_ID as string) || (typeof body.brand_id === 'string' ? body.brand_id : undefined);

    if (!secretKey || !brandId || brandId === 'CHIP_BRAND_ID_ANDA') {
      return new Response(
        JSON.stringify({
          status: 'konfigurasi_diperlukan',
          message: 'Makluman Konfigurasi CHIP Collect: Sila tetapkan pemboleh ubah persekitaran CHIP_SECRET_KEY dan CHIP_BRAND_ID untuk mengaktifkan pengalihan pembayaran sebenar CHIP Collect.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chipResponse = await fetch('https://gate.chip-in.asia/api/v1/purchases/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, brand_id: brandId }),
    });

    const data = await chipResponse.json();

    if (!chipResponse.ok) {
      return new Response(
        JSON.stringify({ message: 'Gagal mencipta transaksi pada pelayan CHIP Collect.', details: data }),
        { status: chipResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("[Checkout API Error]:", error);
    return new Response(
      JSON.stringify({ message: `Ralat pelayan semasa memproses permintaan pembayaran. Butiran: ${error.message || 'Ralat tidak diketahui'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
