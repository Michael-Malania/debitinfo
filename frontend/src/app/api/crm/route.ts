import { NextResponse } from 'next/server';
import { MOCK_CALL_QUEUE, MOCK_CALL_LOGS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    queue: MOCK_CALL_QUEUE,
    logs: MOCK_CALL_LOGS,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, logged: body });
}
