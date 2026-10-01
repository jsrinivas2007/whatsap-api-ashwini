import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  await fetch(`${BACKEND}/internal-ops/api/logout`, {
    method: 'POST',
    headers: {
      'Cookie': `admin_session=${session?.value || ''}`,
      'Content-Type': 'application/json',
    },
  }).catch(() => {});

  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
