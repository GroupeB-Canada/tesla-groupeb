import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.TESLA_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/tesla/callback`;

export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds',
    state: 'groupeb_tesla_auth',
    audience: process.env.TESLA_AUDIENCE!,
  });

  const authUrl = `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
