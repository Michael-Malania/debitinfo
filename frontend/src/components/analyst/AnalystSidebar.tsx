'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { analystBackendService } from '@/services';

export type AnalystViewType =
  | 'overview'
  | 'pending-debtors'
  | 'debtors-registry'
  | 'creditors-registry'
  | 'portfolio-dispatch'
  | 'analytics'
  | 'staff'
  | 'written-off';

interface AnalystSidebarProps {
  activeView: AnalystViewType;
  onSelectView?: (view: AnalystViewType) => void;
  onOpenCreditorRegistration?: () => void;
  onOpenFilterDrawer?: () => void;
  pendingCount?: number;
  debtorsCount?: number;
  creditorsCount?: number;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

const STORAGE_KEY = 'debitinfo_analyst_sidebar_open';

export default function AnalystSidebar({
  activeView,
  onSelectView,
  onOpenCreditorRegistration,
  onOpenFilterDrawer,
  pendingCount: propPendingCount,
  debtorsCount: propDebtorsCount,
  creditorsCount: propCreditorsCount,
  isOpen: controlledIsOpen,
  onToggleOpen,
}: AnalystSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(true);
  const [fetchedCounts, setFetchedCounts] = useState<{
    pending: number;
    debtors: number;
    creditors: number;
  }>({
    pending: 0,
    debtors: 0,
    creditors: 0,
  });

  // Sync open/collapsed state with localStorage so it persists across pages
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setInternalIsOpen(saved === 'true');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      const next = !isOpen;
      setInternalIsOpen(next);
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
    }
  };

  // Fetch badge counts if we are on a subpage (/analyst/staff, /analyst/written-off, /analyst/analytics)
  useEffect(() => {
    if (
      propPendingCount !== undefined &&
      propDebtorsCount !== undefined &&
      propCreditorsCount !== undefined
    ) {
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [pRes, dRes, cRes] = await Promise.allSettled([
          analystBackendService.getPendingDebtors(),
          analystBackendService.getDebtorsRegistry(),
          analystBackendService.getCreditorsRegistry(),
        ]);
        if (!mounted) return;
        setFetchedCounts({
          pending: pRes.status === 'fulfilled' && Array.isArray(pRes.value) ? pRes.value.length : 0,
          debtors: dRes.status === 'fulfilled' && Array.isArray(dRes.value) ? dRes.value.length : 0,
          creditors: cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value.length : 0,
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [propPendingCount, propDebtorsCount, propCreditorsCount, pathname]);

  const pendingCount = propPendingCount !== undefined ? propPendingCount : fetchedCounts.pending;
  const debtorsCount = propDebtorsCount !== undefined ? propDebtorsCount : fetchedCounts.debtors;
  const creditorsCount = propCreditorsCount !== undefined ? propCreditorsCount : fetchedCounts.creditors;

  const handleNavClick = (view: AnalystViewType) => {
    if (view === 'analytics') {
      router.push('/analyst/analytics');
      return;
    }
    if (view === 'staff') {
      router.push('/analyst/staff');
      return;
    }
    if (view === 'written-off') {
      router.push('/analyst/written-off');
      return;
    }

    // Internal views on /analyst
    if (pathname === '/analyst' && onSelectView) {
      onSelectView(view);
    } else {
      router.push(view === 'overview' ? '/analyst' : `/analyst?view=${view}`);
    }
  };

  const handleCreditorRegClick = () => {
    if (onOpenCreditorRegistration) {
      onOpenCreditorRegistration();
    } else {
      router.push('/analyst?registerCreditor=1');
    }
  };

  const handleFilterClick = () => {
    if (onOpenFilterDrawer) {
      onOpenFilterDrawer();
    } else {
      router.push('/analyst?openFilter=1');
    }
  };

  // Collapsed compact state (shows Burger icon + compact icon rail so user can expand anytime)
  if (!isOpen) {
    return (
      <aside className="w-[64px] bg-surface-card border-r border-border-subtle flex-shrink-0 flex flex-col items-center py-4 px-2 transition-all duration-200 select-none z-30">
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Burger Button to Expand */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="მთავარი კონსოლის გაშლა"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <div className="w-8 h-px bg-border-subtle my-1" />

          {/* Overview */}
          <button
            type="button"
            onClick={() => handleNavClick('overview')}
            title="მთავარი გვერდი"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-slate-600 hover:text-primary hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
          </button>

          {/* Pending Debtors with Red Badge */}
          <button
            type="button"
            onClick={() => handleNavClick('pending-debtors')}
            title="კრედიტორების მიერ ატვირთული დებიტორები (დასადასტურებელი)"
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'pending-debtors'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-amber-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs border border-white">
              {pendingCount}
            </span>
          </button>

          {/* Deep Analytics BI Hub */}
          <button
            type="button"
            onClick={() => handleNavClick('analytics')}
            title="ანალიტიკის გვერდი"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'analytics'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">query_stats</span>
          </button>

          {/* Debtors Registry */}
          <button
            type="button"
            onClick={() => handleNavClick('debtors-registry')}
            title={`დებიტორთა რეესტრი (${debtorsCount})`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'debtors-registry'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-sky-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </button>

          {/* Creditors Registry */}
          <button
            type="button"
            onClick={() => handleNavClick('creditors-registry')}
            title={`კრედიტორთა რეესტრი (${creditorsCount})`}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'creditors-registry'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-primary hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </button>

          {/* Portfolio Dispatch */}
          <button
            type="button"
            onClick={() => handleNavClick('portfolio-dispatch')}
            title="სამართავი პორტფელის განაწილება"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'portfolio-dispatch'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">send_time_extension</span>
          </button>

          {/* Staff Registry */}
          <button
            type="button"
            onClick={() => handleNavClick('staff')}
            title="თანამშრომელთა რეესტრი"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'staff'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-emerald-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </button>

          {/* Written-off Debts Registry */}
          <button
            type="button"
            onClick={() => handleNavClick('written-off')}
            title="ჩამოწერილი ვალების რეესტრი"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'written-off'
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-2 ring-primary/20'
                : 'text-rose-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          </button>

          <div className="w-8 h-px bg-border-subtle my-1" />

          {/* Register Creditor quick icon (Emerald Business Green) */}
          <button
            type="button"
            onClick={handleCreditorRegClick}
            title="+ კრედიტორის რეგისტრაცია"
            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">domain_add</span>
          </button>
        </div>
      </aside>
    );
  }

  // Expanded full state
  return (
    <aside className="w-[268px] bg-surface-card border-r border-border-subtle flex-shrink-0 flex flex-col py-5 px-3 transition-all duration-200 select-none z-30">
      {/* Primary Navigation Cluster */}
      <div className="space-y-6">
        <div>
          {/* Console Header with Burger Toggle Button */}
          <div className="px-2 pb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              მთავარი კონსოლი
            </span>
            <button
              type="button"
              onClick={handleToggle}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
              title="მთავარი კონსოლის ჩაკეცვა"
            >
              <span className="material-symbols-outlined text-[20px]">menu_open</span>
            </button>
          </div>

          <nav className="space-y-1">
            {/* 1. Overview */}
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-body-md font-medium group transition-all cursor-pointer text-left ${
                activeView === 'overview'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  home
                </span>
                <span>მთავარი გვერდი</span>
              </div>
              {activeView === 'overview' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* 2. Pending Creditor Debtors */}
            <button
              type="button"
              onClick={() => handleNavClick('pending-debtors')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg font-body-md font-medium group transition-all cursor-pointer text-left ${
                activeView === 'pending-debtors'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-[20px] shrink-0 ${
                    activeView === 'pending-debtors' ? 'text-white' : 'text-amber-600'
                  }`}
                >
                  fact_check
                </span>
                <span className="text-xs leading-snug font-semibold">
                  კრედიტორების მიერ ატვირთული დებიტორები (დასადასტურებელი)
                </span>
              </div>
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 shadow-sm">
                {pendingCount}
              </span>
            </button>

            {/* 3. Deep Analytics (BI Hub) */}
            <Link
              href="/analyst/analytics"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all font-body-md font-semibold border shadow-2xs ${
                activeView === 'analytics'
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-900 hover:from-indigo-100 hover:to-blue-100 border-indigo-200/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'analytics' ? 'text-white' : 'text-indigo-600'
                  }`}
                >
                  query_stats
                </span>
                <span>ანალიტიკის გვერდი</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activeView === 'analytics'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                BI
              </span>
            </Link>

            {/* 4. Debtors Registry */}
            <button
              type="button"
              onClick={() => handleNavClick('debtors-registry')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer text-left ${
                activeView === 'debtors-registry'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'debtors-registry' ? 'text-white' : 'text-sky-600'
                  }`}
                >
                  badge
                </span>
                <span>დებიტორთა რეესტრი</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                  activeView === 'debtors-registry'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}
              >
                {debtorsCount}
              </span>
            </button>

            {/* 5. Creditors Registry */}
            <button
              type="button"
              onClick={() => handleNavClick('creditors-registry')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer text-left ${
                activeView === 'creditors-registry'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'creditors-registry' ? 'text-white' : 'text-primary'
                  }`}
                >
                  account_balance
                </span>
                <span>კრედიტორთა რეესტრი</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activeView === 'creditors-registry'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-blue-50 text-primary border border-blue-200'
                }`}
              >
                {creditorsCount}
              </span>
            </button>

            {/* 6. Portfolio Dispatch */}
            <button
              type="button"
              onClick={() => handleNavClick('portfolio-dispatch')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer text-left ${
                activeView === 'portfolio-dispatch'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'portfolio-dispatch' ? 'text-white' : 'text-indigo-600'
                  }`}
                >
                  send_time_extension
                </span>
                <span>სამართავი პორტფელის განაწილება</span>
              </div>
            </button>

            {/* 7. Staff Registry */}
            <Link
              href="/analyst/staff"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-body-md font-medium ${
                activeView === 'staff'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'staff' ? 'text-white' : 'text-emerald-600'
                  }`}
                >
                  badge
                </span>
                <span>თანამშრომელთა რეესტრი</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                  activeView === 'staff'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                HR
              </span>
            </Link>

            {/* 8. Written-off Debts Registry */}
            <Link
              href="/analyst/written-off"
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-body-md font-medium ${
                activeView === 'written-off'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-700 hover:text-primary hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    activeView === 'written-off' ? 'text-white' : 'text-rose-600'
                  }`}
                >
                  assignment_turned_in
                </span>
                <span>ჩამოწერილი ვალების რეესტრი</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activeView === 'written-off'
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                აქტები
              </span>
            </Link>
          </nav>

          {/* Creditor Registration CTA (Emerald Business Green) */}
          <div className="pt-3 px-1">
            <button
              type="button"
              onClick={handleCreditorRegClick}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">domain_add</span>
              <span>+ კრედიტორის რეგისტრაცია</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
