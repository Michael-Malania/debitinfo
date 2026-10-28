'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/services';
import DebtorDashboardView from '@/components/dashboard/DebtorDashboardView';
import CreditorDashboardView from '@/components/dashboard/CreditorDashboardView';
import RegularUserDashboardView from '@/components/dashboard/RegularUserDashboardView';

export default function UnifiedDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const currentUser = await authService.getMe();
        if (!isMounted) return;
        if (!currentUser) {
          router.replace('/login?redirect=/dashboard');
          return;
        }
        // If staff member accidentally hits client dashboard, redirect to their specialized console
        if (['LEGAL', 'ANALYST', 'OPERATOR', 'FIELD_OFFICER', 'ACCOUNTANT'].includes(currentUser.role)) {
          const dest = authService.getPortalRouteForRole(currentUser.role);
          router.replace(dest);
          return;
        }
        setUser(currentUser);
      } catch (err) {
        if (isMounted) {
          router.replace('/login?redirect=/dashboard');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">ავტორიზაციის შემოწმება...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს თქვენი მონაცემების უსაფრთხო ჩატვირთვა</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Creditor Role -> Creditor Management Dashboard
  if (user.role === 'CREDITOR') {
    return <CreditorDashboardView user={user} />;
  }

  // Debtor Role -> Debtor Liabilities & Payments Dashboard
  if (user.role === 'DEBTOR') {
    return <DebtorDashboardView user={user} />;
  }

  // Regular User Role (Newly registered physical or legal person with 0 debts / clean profile)
  if (user.role === 'REGULAR') {
    return <RegularUserDashboardView user={user} />;
  }

  // Analyst Role -> Direct to Analyst Console
  if (user.role === 'ANALYST') {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-surface-card rounded-2xl border border-border-subtle shadow-lg space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">ანალიტიკოსის სამუშაო სივრცე</h2>
            <p className="text-body-sm text-text-muted mt-1">
              ავტორიზებული ხართ როგორც: <strong className="text-primary font-mono">{user.role}</strong> ({user.email})
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/analyst"
              className="w-full py-2.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-white font-medium text-body-sm transition-all shadow-sm"
            >
              ანალიტიკოსის კონსოლში შესვლა
            </Link>
            <button
              onClick={async () => {
                await authService.logout();
                router.push('/login');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm transition-colors cursor-pointer"
            >
              სისტემიდან გამოსვლა
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin / Operational Staff -> Show CRM link
  if (user.role === 'ADMIN' || user.role === 'OPERATOR') {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 bg-surface-card rounded-2xl border border-border-subtle shadow-lg space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">სისტემური სამუშაო გარემო</h2>
            <p className="text-body-sm text-text-muted mt-1">
              თქვენ ავტორიზებული ხართ როგორც: <strong className="text-primary font-mono">{user.role}</strong> ({user.email})
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/crm"
              className="w-full py-2.5 px-4 rounded-xl bg-primary-container hover:bg-primary text-white font-medium text-body-sm transition-all shadow-sm"
            >
              CRM სამუშაო სივრცეში გადასვლა
            </Link>
            <button
              onClick={async () => {
                await authService.logout();
                router.push('/login');
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm transition-colors cursor-pointer"
            >
              სისტემიდან გამოსვლა
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return <RegularUserDashboardView user={user} />;
}
