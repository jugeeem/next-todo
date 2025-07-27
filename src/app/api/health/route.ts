import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'Todo API is running',
    timestamp: new Date().toISOString(),
  });
}
