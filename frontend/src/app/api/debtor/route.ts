import { NextResponse } from 'next/server';
import { MOCK_DEBTORS, MOCK_LIABILITIES } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    profile: MOCK_DEBTORS[0],
    liabilities: MOCK_LIABILITIES,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    message: 'Operation logged successfully',
    data: body,
  });
}
