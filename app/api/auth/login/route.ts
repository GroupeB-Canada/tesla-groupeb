import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { password, from } = await req.json();

  const PORTAL_PASSWORD = process.env.PORTAL_PASSWORD;

  if (!password || password !== PORTAL_PASSWORD) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }

  const redirectTo = from && from.startsWith('/') ? from : '/live';

  const res = NextResponse.json({ ok: true, redirect: redirectTo });

  // Cookie httpOnly — expire dans 24h
  res.cookies.set('tesla_session', PORTAL_PASSWORD!, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  });

  return res;
}
