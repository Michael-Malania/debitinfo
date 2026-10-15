import { NextResponse } from 'next/server';
import { MOCK_LEGAL_CASES } from '@/data/mockData';

export async function GET() {
  return NextResponse.json(MOCK_LEGAL_CASES);
}
