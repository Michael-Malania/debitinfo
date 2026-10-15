import { NextResponse } from 'next/server';
import { MOCK_MACRO_INDICATORS, MOCK_AGING_BUCKETS, MOCK_SECTOR_RISKS } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    macro: MOCK_MACRO_INDICATORS,
    aging: MOCK_AGING_BUCKETS,
    sectors: MOCK_SECTOR_RISKS,
  });
}
