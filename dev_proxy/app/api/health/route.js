import { NextResponse } from 'next/server';

export async function GET() {
  // In the future, this could check dependencies (e.g., Redis connection)
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
} 