import { NextResponse } from 'next/server';
import { MOCK_DEBTORS } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return NextResponse.json(MOCK_DEBTORS);
  }

  const filtered = MOCK_DEBTORS.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.personalId.includes(q) ||
      d.caseNumber.toLowerCase().includes(q)
  );

  return NextResponse.json(filtered);
}
