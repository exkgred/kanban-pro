import { NextResponse } from 'next/server';
import axios, { isAxiosError } from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await axios.post(`${apiUrl}/auth/login`, body);

    return NextResponse.json(res.data);
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: error.response?.data?.error || { message: 'Erro interno' },
        },
        { status: error.response?.status || 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Erro interno' } },
      { status: 500 },
    );
  }
}
