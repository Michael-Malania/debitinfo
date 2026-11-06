import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    kpis: {
      totalPrincipal: 0,
      totalRecovered: 0,
      recoveryRate: 0,
      activeClaimsCount: 0,
      activeDebtorsCount: 0,
    },
    claims: [],
  });
}
