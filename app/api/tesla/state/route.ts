import { NextResponse } from 'next/server';
import { getVehicleState } from '@/lib/tesla';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getVehicleState();
    return NextResponse.json({ ok: true, data: state });
  } catch (err: any) {
    console.error('[/api/tesla/state]', err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
