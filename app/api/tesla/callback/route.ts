import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.TESLA_CLIENT_ID!;
const CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/tesla/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  try {
    const tokenRes = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json({ error: tokens }, { status: 500 });
    }

    const { refresh_token, access_token } = tokens;

    // Display the token — JP copies it to Amplify env vars
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><title>Tesla Auth — GroupeB</title>
      <style>body{background:#0a0a0a;color:#fff;font-family:monospace;padding:40px;max-width:800px;margin:0 auto}
      h1{color:#E31937}pre{background:#111;padding:20px;border-radius:8px;overflow-x:auto;border:1px solid #333;word-break:break-all;white-space:pre-wrap}
      .label{color:#888;font-size:12px;margin-bottom:4px}.copy-btn{background:#E31937;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:8px}
      .success{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);padding:16px;border-radius:8px;margin-bottom:24px}
      </style></head>
      <body>
      <h1>✅ Tesla OAuth — Autorisation réussie</h1>
      <div class="success">
        <strong>Action requise :</strong> Copiez le <code>refresh_token</code> ci-dessous et ajoutez-le dans Amplify → Environment variables → <code>TESLA_REFRESH_TOKEN</code>, puis redéployez.
      </div>
      <div class="label">REFRESH TOKEN (à copier dans Amplify)</div>
      <pre id="rt">${refresh_token}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('rt').innerText)">📋 Copier le refresh_token</button>
      <hr style="border-color:#333;margin:32px 0">
      <div class="label">ACCESS TOKEN (temporaire, expire dans 8h)</div>
      <pre>${access_token?.substring(0, 80)}...</pre>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
