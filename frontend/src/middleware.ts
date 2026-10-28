import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getTargetRouteByRole(role?: string): string {
  switch (role) {
    case 'ADMIN':
      return '/ops';
    case 'LEGAL':
      return '/legal';
    case 'ANALYST':
      return '/analyst';
    case 'OPERATOR':
      return '/crm';
    case 'FIELD_OFFICER':
      return '/field-officer';
    case 'ACCOUNTANT':
      return '/accountant';
    case 'CREDITOR':
    case 'DEBTOR':
    case 'REGULAR':
    default:
      return '/dashboard';
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // 1. Operations & Admin Portal (/ops)
  if (pathname === '/ops' || pathname.startsWith('/ops/')) {
    // Unauthenticated staff are allowed to see the /ops login form
    if (!accessToken) {
      return NextResponse.next();
    }

    // Authenticated users who are NOT ADMIN must be directed to their designated portal
    if (userRole && userRole !== 'ADMIN') {
      const destUrl = new URL(getTargetRouteByRole(userRole), request.url);
      return NextResponse.redirect(destUrl);
    }

    return NextResponse.next();
  }

  // 2. HR & Staff Management (/hr)
  if (pathname === '/hr' || pathname.startsWith('/hr/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 3. Legal Workspace (/legal) - Lawyers & Admins only
  if (pathname === '/legal' || pathname.startsWith('/legal/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'LEGAL' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 4. Financial Analyst Workspace (/analyst) - Analysts & Admins only
  if (pathname === '/analyst' || pathname.startsWith('/analyst/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'ANALYST' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 5. CRM / Call Center Workspace (/crm) - Operators & Admins only
  if (pathname === '/crm' || pathname.startsWith('/crm/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'OPERATOR' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 6. Field Officer Console (/field-officer) - Field Officers & Admins only
  if (pathname === '/field-officer' || pathname.startsWith('/field-officer/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'FIELD_OFFICER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 7. Accountant Console (/accountant) - Accountants & Admins only
  if (pathname === '/accountant' || pathname.startsWith('/accountant/')) {
    if (!accessToken) {
      const opsUrl = new URL('/ops', request.url);
      opsUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(opsUrl);
    }
    if (userRole && userRole !== 'ACCOUNTANT' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  // 8. Client Dashboard (/dashboard) - Regular Users, Debtors, Creditors & Admin
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Staff members should not view customer debt claims cabinet; send them to staff portal
    if (userRole && ['LEGAL', 'ANALYST', 'OPERATOR', 'FIELD_OFFICER', 'ACCOUNTANT'].includes(userRole)) {
      return NextResponse.redirect(new URL(getTargetRouteByRole(userRole), request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/ops/:path*',
    '/dashboard/:path*',
    '/crm/:path*',
    '/analyst/:path*',
    '/legal/:path*',
    '/field-officer/:path*',
    '/hr/:path*',
  ],
};
