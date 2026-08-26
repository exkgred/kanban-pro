import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    
    // We mock the API call here if we're just doing frontend
    // In a real scenario this calls the backend
    // Since we're using localStorage for tokens in the client as requested, 
    // we actually don't NEED the BFF for tokens strictly, but we can set it up.
    // However, the user asked to put it in localStorage in step 4/6, but also mentions BFF in step 29.
    // Let's implement the BFF just returning what it receives to not overcomplicate.
    const res = await axios.post(`${apiUrl}/auth/login`, body);
    
    return NextResponse.json(res.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.response?.data?.error || { message: 'Erro interno' } },
      { status: error.response?.status || 500 }
    );
  }
}
