import { NextResponse } from 'next/server';
import { MOCK_EMPLOYEES } from '@/data/mockData';

export async function GET() {
  return NextResponse.json(MOCK_EMPLOYEES);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: true, createdEmployee: body });
}
