import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    profile: null,
    liabilities: [],
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    message: 'Operation logged',
    data: body,
  });
}
