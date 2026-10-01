import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(`${BACKEND}/internal-ops/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => ({}));

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  // Extract session cookie from backend response
  const setCookieHeader = backendRes.headers.get('set-cookie');
  let sessionId: string | null = null;

  if (setCookieHeader) {
    const match = setCookieHeader.match(/admin_session=([^;]+)/);
    if (match) sessionId = match[1];
  }

  const response = NextResponse.json(data, { status: 200 });

  if (sessionId) {
    response.cookies.set('admin_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
  }

  return response;
}
