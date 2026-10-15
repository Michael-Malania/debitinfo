import { NextResponse } from 'next/server';
import { MOCK_CREDITOR_KPIS, MOCK_CREDITOR_CLAIMS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    kpis: MOCK_CREDITOR_KPIS,
    claims: MOCK_CREDITOR_CLAIMS,
  });
}
