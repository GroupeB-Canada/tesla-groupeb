import { NextRequest, NextResponse } from 'next/server';

// Pages qui nécessitent un mot de passe (contrôles du véhicule)
const PROTECTED = ['/live', '/portal', '/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Vérifier le cookie de session
  const session = req.cookies.get('tesla_session')?.value;
  if (session === process.env.PORTAL_PASSWORD) return NextResponse.next();

  // Rediriger vers la page de connexion
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/live/:path*', '/portal/:path*', '/admin/:path*'],
};
