import { NextRequest, NextResponse } from 'next/server';
import { getNearbySuperchargers } from '@/lib/tesla';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '0');
  const lng = parseFloat(searchParams.get('lng') ?? '0');

  if (!lat || !lng) {
    return NextResponse.json({ ok: false, error: 'lat and lng required' }, { status: 400 });
  }

  try {
    const chargers = await getNearbySuperchargers(lat, lng);
    return NextResponse.json({ ok: true, data: chargers });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
