import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

type Params = { path: string[] };

async function proxyRequest(req: NextRequest, params: Params) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  const path = params.path.join('/');
  const url = `${BACKEND}/internal-ops/api/${path}${req.nextUrl.search}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.value) {
    headers['Cookie'] = `admin_session=${session.value}`;
  }

  let bodyText: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    bodyText = await req.text();
  }

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body: bodyText || undefined,
  });

  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxyRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxyRequest(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxyRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  return proxyRequest(req, await params);
}
