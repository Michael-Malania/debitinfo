import { NextResponse } from 'next/server';
import { MOCK_FIELD_TASKS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json(MOCK_FIELD_TASKS);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, updatedTask: body });
}
