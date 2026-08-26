import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const response = NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    response.cookies.set('refresh_token', '', { maxAge: 0, httpOnly: true, path: '/' });
    return response;
  }

  const body = await res.json();
  const data = body.data ?? body;

  const response = NextResponse.json({ accessToken: data.accessToken });
  response.cookies.set('refresh_token', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
