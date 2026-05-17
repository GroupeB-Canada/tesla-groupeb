import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID     = process.env.TESLA_CLIENT_ID!;
const CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!;
const REDIRECT_URI  = `${process.env.NEXT_PUBLIC_APP_URL}/api/tesla/callback`;
const AUDIENCE      = process.env.TESLA_AUDIENCE!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  console.log('[tesla/callback] client_id:',     CLIENT_ID?.substring(0, 8) + '…');
  console.log('[tesla/callback] secret length:', CLIENT_SECRET?.length);
  console.log('[tesla/callback] redirect_uri:',  REDIRECT_URI);
  console.log('[tesla/callback] audience:',      AUDIENCE);
  console.log('[tesla/callback] code prefix:',   code?.substring(0, 12) + '…');

  // Attempt 1 — with audience (Tesla Fleet API docs requirement)
  const attempt1 = await tryTokenExchange(code, true);
  if (attempt1.ok) return renderSuccess(attempt1.tokens);

  console.log('[tesla/callback] attempt1 failed, retrying without audience…');

  // Attempt 2 — without audience (fallback for some Tesla environments)
  const attempt2 = await tryTokenExchange(code, false);
  if (attempt2.ok) return renderSuccess(attempt2.tokens);

  // Both failed — show debug page
  return new NextResponse(`
    <!DOCTYPE html><html>
    <head><title>Tesla Auth — Debug</title>
    <style>body{background:#0a0a0a;color:#fff;font-family:monospace;padding:40px;max-width:900px;margin:0 auto}
    h1{color:#E31937}pre{background:#111;padding:20px;border-radius:8px;overflow-x:auto;border:1px solid #333;word-break:break-all;white-space:pre-wrap}
    .err{background:rgba(227,25,55,0.1);border:1px solid rgba(227,25,55,0.3);padding:16px;border-radius:8px;margin-bottom:24px}
    .label{color:#888;font-size:12px;margin-bottom:4px;margin-top:16px}
    </style></head>
    <body>
    <h1>❌ Tesla OAuth — Échec du token exchange</h1>
    <div class="err">Les deux tentatives ont échoué. Envoyez cette page à l'équipe GroupeB.</div>
    <div class="label">TENTATIVE 1 — avec audience (status ${attempt1.status})</div>
    <pre>${JSON.stringify(attempt1.body, null, 2)}</pre>
    <div class="label">TENTATIVE 2 — sans audience (status ${attempt2.status})</div>
    <pre>${JSON.stringify(attempt2.body, null, 2)}</pre>
    <hr style="border-color:#333;margin:32px 0">
    <div class="label">PARAMÈTRES (client_secret masqué)</div>
    <pre>${JSON.stringify({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET?.substring(0, 12) + '…',
      redirect_uri:  REDIRECT_URI,
      audience:      AUDIENCE,
      code_prefix:   code?.substring(0, 16) + '…',
    }, null, 2)}</pre>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' }, status: 500 });

  // ── helpers ────────────────────────────────────────────────────────────
  async function tryTokenExchange(authCode: string, withAudience: boolean) {
    const params: Record<string, string> = {
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code:          authCode,
      redirect_uri:  REDIRECT_URI,
    };
    if (withAudience) params.audience = AUDIENCE;

    const res  = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams(params),
    });
    const text = await res.text();
    console.log(`[tesla/callback] attempt withAudience=${withAudience} status=${res.status} body=${text}`);
    let body: any;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    return { ok: res.ok, status: res.status, tokens: body, body };
  }

  function renderSuccess(tokens: any) {
    const { refresh_token, access_token } = tokens;
    return new NextResponse(`
      <!DOCTYPE html><html>
      <head><title>Tesla Auth — GroupeB</title>
      <style>body{background:#0a0a0a;color:#fff;font-family:monospace;padding:40px;max-width:800px;margin:0 auto}
      h1{color:#22c55e}pre{background:#111;padding:20px;border-radius:8px;overflow-x:auto;border:1px solid #333;word-break:break-all;white-space:pre-wrap}
      .label{color:#888;font-size:12px;margin-bottom:4px}.copy-btn{background:#E31937;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:8px}
      .success{background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);padding:16px;border-radius:8px;margin-bottom:24px}
      </style></head>
      <body>
      <h1>✅ Tesla OAuth — Autorisation réussie</h1>
      <div class="success">
        <strong>Action requise :</strong> Copiez le <code>refresh_token</code> ci-dessous et ajoutez-le dans Amplify → Environment variables → <code>TESLA_REFRESH_TOKEN</code>, puis redéployez.
      </div>
      <div class="label">REFRESH TOKEN</div>
      <pre id="rt">${refresh_token}</pre>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('rt').innerText)">📋 Copier le refresh_token</button>
      <hr style="border-color:#333;margin:32px 0">
      <div class="label">ACCESS TOKEN (temporaire, expire dans 8h)</div>
      <pre>${access_token?.substring(0, 80)}...</pre>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
