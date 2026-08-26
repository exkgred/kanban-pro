import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('refresh_token', '', {
    maxAge: 0,
    httpOnly: true,
    path: '/',
  });
  return response;
}
