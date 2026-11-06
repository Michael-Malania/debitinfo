import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    queue: [],
    logs: [],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, logged: body });
}
