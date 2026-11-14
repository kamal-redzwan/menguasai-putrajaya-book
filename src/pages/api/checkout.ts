import type { APIRoute } from 'astro';

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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // Read directly from the Astro v6 Cloudflare context, completely bypassing the broken 'cloudflare:workers' module
    const cfEnv = (locals as any).cloudflare?.env || {};

    const secretKey = cfEnv.CHIP_SECRET_KEY as string;
    const brandId = (cfEnv.CHIP_BRAND_ID as string) || (typeof body.brand_id === 'string' ? body.brand_id : undefined);

    if (!secretKey || !brandId || brandId === 'CHIP_BRAND_ID_ANDA') {
      // Diagnostic output: Exposes exactly what Cloudflare actually injected into memory
      const loadedKeys = Object.keys(cfEnv).join(', ');

      return new Response(
        JSON.stringify({
          status: 'konfigurasi_diperlukan',
          message: `Makluman Sistem: Kunci gagal dibaca. Kunci yang dikesan dalam memori pelayan: [${loadedKeys || 'TIADA'}]. Pastikan pemboleh ubah ditetapkan untuk persekitaran 'Preview' di papan pemuka Cloudflare.`,
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
