'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AnalystRegistryManager from '@/components/analyst/AnalystRegistryManager';

export default function AnalystPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationTab, setRegistrationTab] = useState<'debtor' | 'creditor'>('debtor');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Live Analyst & Excel Management State
  const [users, setUsers] = useState<any[]>([]);
  const [excelDebtors, setExcelDebtors] = useState<any[]>([]);
  const [excelCreditors, setExcelCreditors] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [syncingExcel, setSyncingExcel] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Dynamic Staff, Claims & Workload Dispatcher State
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [claimsOptions, setClaimsOptions] = useState<any[]>([]);
  const [workloadStats, setWorkloadStats] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [dispatchPriority, setDispatchPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMessage, setDispatchSuccessMessage] = useState<string | null>(null);

  const loadAnalystData = async () => {
    setLoadingData(true);
    try {
      const [u, d, c, staff, claims, workload] = await Promise.all([
        analystBackendService.getUsers(),
        analystBackendService.getExcelDebtors(),
        analystBackendService.getExcelCreditors(),
        analystBackendService.getStaffOptions(),
        analystBackendService.getClaimsOptions(),
        analystBackendService.getWorkloadStats(),
      ]);
      setUsers(u || []);
      setExcelDebtors(d || []);
      setExcelCreditors(c || []);
      setStaffOptions(staff || []);
      setClaimsOptions(claims || []);
      setWorkloadStats(workload || null);

      if (staff && staff.length > 0) {
        setSelectedStaffId((prev) => prev || staff[0].id);
      }
      if (claims && claims.length > 0) {
        setSelectedClaimId((prev) => prev || claims[0].id);
      }
    } catch (err) {
      console.warn('Could not load analyst data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedClaimId) {
      alert('გთხოვთ აირჩიოთ შემსრულებელი თანამშრომელი და საქმე');
      return;
    }
    setIsDispatching(true);
    try {
      const res = await analystBackendService.dispatchTask({
        staffUserId: selectedStaffId,
        claimId: selectedClaimId,
        priority: dispatchPriority,
        instructions: dispatchInstructions || 'გადაამოწმეთ მოვალის სტატუსი და განახორციელეთ შესაბამისი მოქმედება.',
      });
      setDispatchSuccessMessage(res?.message || 'დავალება წარმატებით გაეგზავნა თანამშრომელს!');
      setDispatchInstructions('');
      setTimeout(() => setDispatchSuccessMessage(null), 5000);
      const updatedWorkload = await analystBackendService.getWorkloadStats();
      setWorkloadStats(updatedWorkload);
    } catch (err: any) {
      alert(err?.message || 'დავალების გაგზავნა ვერ მოხერხდა');
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/analyst');
      return;
    }
    if (u.role !== 'ANALYST' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadAnalystData();
  }, [router]);

  const handleAssignRole = async (user: any, role: 'DEBTOR' | 'CREDITOR', agreement?: string, amount?: number, registryItemId?: string) => {
    try {
      await analystBackendService.assignRole({
        userId: user.id,
        targetRole: role,
        agreementNumber: agreement || `AGR-${Math.floor(10000 + Math.random() * 90000)}`,
        amount: amount || (role === 'DEBTOR' ? 1540 : 0),
        registryItemId,
      });
      setActionSuccessMessage(`მომხმარებელს ${user.name || user.email} წარმატებით მიენიჭა ${role === 'DEBTOR' ? 'დებიტორის' : 'კრედიტორის'} სტატუსი!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadAnalystData();
    } catch (err: any) {
      alert(err?.message || 'როლის მინიჭება ვერ მოხერხდა');
    }
  };

  const handleSyncExcel = async () => {
    setSyncingExcel(true);
    try {
      const res = await analystBackendService.syncExcelData();
      setActionSuccessMessage(res?.message || 'Excel-ის მონაცემთა ბაზა წარმატებით დასინქრონირდა!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadAnalystData();
    } catch (err: any) {
      alert(err?.message || 'სინქრონიზაცია ვერ მოხერხდა');
    } finally {
      setSyncingExcel(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRegistrationOpen(false);
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalDebtorsAmount = excelDebtors.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalCreditorsAmount = excelCreditors.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPortfolioAmount = totalDebtorsAmount + totalCreditorsAmount;
  const activeCasesCount = excelDebtors.length + excelCreditors.length;
  const totalRecoveredAmount = Math.round(totalPortfolioAmount * 0.438);

  const userName = currentUser?.name || currentUser?.email || 'დავით კაპანაძე';
  const userRoleTitle = currentUser?.role === 'ADMIN'
    ? 'სისტემური ადმინისტრატორი'
    : currentUser?.role === 'ANALYST'
    ? 'მთავარი ანალიტიკოსი'
    : currentUser?.role || 'ფინანსური ანალიტიკოსი';
  const userInitials = currentUser?.name
    ? currentUser.name.substring(0, 2)
    : currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : 'დკ';

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface-bg text-text-primary min-h-screen antialiased flex flex-col font-body-md select-none selection:bg-primary-container selection:text-white">
<div>
  {/* ========================================================================= */}
  {/* 1. TOP NAVIGATION BAR / OPERATIONS HEADER */}
  {/* ========================================================================= */}
  <header className="w-full bg-surface-card border-b border-border-subtle sticky top-0 z-40 shadow-sm">
    <div className="w-full px-4 lg:px-8 max-w-[1720px] mx-auto flex items-center justify-between h-16">
      {/* Brand & Operations Subtitle */}
      <div className="flex items-center gap-4">
        <a className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>account_balance</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
              <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
            </div>
          </div>
        </a>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border-subtle">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
            ანალიტიკოსის კონსოლი
          </span>
          <span className="text-text-muted text-body-sm font-body-sm hidden md:inline">v2.4 Live</span>
        </div>
      </div>
      {/* Quick Search Bar */}
      <div className="flex-1 max-w-xl mx-6 hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-[18px]">search</span>
          <input className="w-full pl-10 pr-24 py-2 bg-surface-bg border border-border-subtle rounded-lg text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="საქმის №, პ/ნ, ს/კ ან მოვალის ძიება..." type="text" />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-card rounded border border-border-subtle">⌘K</kbd>
          </div>
        </div>
      </div>
      {/* Live Telemetry, Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Live System Telemetry Pulse */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-text-muted">RS.GE სინქრონიზაცია</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 leading-none">
              აქტიური • 0.14 წმ
            </span>
          </div>
        </div>
        {/* Notification Bell with Unread Badge */}
        <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white font-label-sm text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-surface-card">
            3
          </span>
        </button>
        {/* Current Date Widget */}
        <div className="hidden lg:flex flex-col text-right pr-2">
          <span className="text-body-sm font-body-sm font-medium text-text-primary">24 ოქტომბერი, 2024</span>
          <span className="text-label-sm font-label-sm text-text-muted">14:38:02 (Tbilisi, GMT+4)</span>
        </div>
        {/* Link to Ops (Admin Only) */}
        {currentUser?.role === 'ADMIN' && (
          <Link
            href="/ops"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
            title="საოპერაციო ცენტრში გადასვლა"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
          </Link>
        )}

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-border-subtle group">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-body-md border border-primary/20 shadow-sm">
            {userInitials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-body-sm font-body-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
              {userName}
            </span>
            <span className="text-label-sm font-label-sm text-text-muted">
              {userRoleTitle}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            authService.logout();
            window.location.href = '/ops';
          }}
          className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
          title="სისტემიდან გამოსვლა"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </div>
  </header>
  {/* ========================================================================= */}
  {/* MAIN WORKSPACE LAYOUT (SIDEBAR + CONTENT CANVAS) */}
  {/* ========================================================================= */}
  <div className="flex-1 flex w-full max-w-[1720px] mx-auto overflow-hidden">
    {/* ========================================================================= */}
    {/* 2. LEFT COLLAPSIBLE NAVIGATION SIDEBAR (260px) */}
    {/* ========================================================================= */}
    <aside className="w-[260px] bg-surface-card border-r border-border-subtle flex-shrink-0 flex flex-col justify-between hidden md:flex py-5 px-3">
      {/* Primary Navigation Cluster */}
      <div className="space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            მთავარი კონსოლი
          </div>
          <nav className="space-y-1">
            <a className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary-container text-white shadow-sm font-body-md font-medium group transition-all" href="#">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>dashboard</span>
                <span>მიმოხილვა &amp; მონიტორინგი</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </a>
            <a className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors font-body-md font-medium" href="#excel-registry-section">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-sky-600">badge</span>
                <span>დებიტორთა რეესტრი</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono font-semibold">
                {excelDebtors.length}
              </span>
            </a>
            <a className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors font-body-md font-medium" href="#excel-registry-section">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-primary">account_balance</span>
                <span>კრედიტორთა რეესტრი</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-primary border border-blue-200 text-[10px] font-mono font-bold">
                {excelCreditors.length}
              </span>
            </a>
            <Link className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors font-body-md font-medium" href="/crm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-purple-600">assignment</span>
                <span>დავალებები &amp; CRM</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
            </Link>
            <Link className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition-colors font-body-md font-medium" href="/ops">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-text-muted">groups</span>
                <span>თანამშრომელთა გუნდი</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
            </Link>
          </nav>
        </div>
        {/* Quick Access Filters */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="px-3 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            სწრაფი ფილტრები
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-body-sm text-slate-600 hover:bg-slate-50 hover:text-text-primary transition-colors text-left">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rating-c" />
                <span className="">სასამართლო სარჩელები</span>
              </span>
              <span className="font-mono text-label-sm text-text-muted">312</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-body-sm text-slate-600 hover:bg-slate-50 hover:text-text-primary transition-colors text-left">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="">მოლაპარაკების ფაზა</span>
              </span>
              <span className="font-mono text-label-sm text-text-muted">456</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-body-sm text-slate-600 hover:bg-slate-50 hover:text-text-primary transition-colors text-left">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="">გრაფიკით დაფარვა</span>
              </span>
              <span className="font-mono text-label-sm text-text-muted">516</span>
            </button>
          </div>
        </div><div className="px-1 pt-2">
          <button type="button" onClick={() => setIsFilterDrawerOpen(true)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-primary/20 text-primary hover:border-primary hover:shadow-sm transition-all group cursor-pointer" title="გაფართოებული ფილტრაცია">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[17px]">tune</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-body-sm font-semibold text-text-primary group-hover:text-primary transition-colors leading-tight">ფილტრები</span>
                <span className="text-[10px] text-text-muted">Audit &amp; Verification</span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">⌥F</span>
          </button>
        </div>
      </div>
      {/* Bottom Sidebar Health Widget */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">dns</span>
            <span className="text-body-sm font-body-sm font-semibold text-text-primary">სისტემის მდგომარეობა</span>
          </div>
          <span className="text-label-sm font-label-sm text-emerald-600 font-bold">99.8%</span>
        </div>
        {/* Load bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full" style={{width: '92%'}} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted">
          <span className="">აქტიური სესიები: <strong className="text-text-primary font-mono">14</strong></span>
          <span className="">პინგ: <strong className="text-emerald-600 font-mono">18ms</strong></span>
        </div>
      </div>
    </aside>
    {/* ========================================================================= */}
    {/* MAIN CONTENT CANVAS */}
    {/* ========================================================================= */}
    <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-8 bg-surface-bg">
      {/* Operational Header Row with Breadcrumb & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-muted mb-1">
            <span >პლატფორმა</span>
            <span >/</span>
            <span >ოპერაციული ცენტრი</span>
            <span >/</span>
            <span className="text-primary font-medium">სამართავი პანელი</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-text-primary tracking-tight font-bold">
            ფინანსური ანალიტიკოსის მთავარი დაფა
          </h1>
          <p className="text-body-md font-body-md text-text-muted mt-0.5">
            საქართველოს იურიდიულ პირთა დავალიანების მონიტორინგი, რისკ-შეფასება და დავალებების დისპეტჩერიზაცია
          </p>
        </div>
        <div className="flex items-center gap-3"><button type="button" onClick={() => setIsFilterDrawerOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-primary/30 text-primary hover:bg-blue-50 transition-colors text-body-md font-body-md font-medium shadow-sm cursor-pointer" title="გაფართოებული ფილტრაცია">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="">ფილტრები</span>
            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[10px] font-mono font-bold text-primary">Audit</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-border-subtle text-text-primary hover:bg-slate-50 transition-colors text-body-md font-body-md shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-text-muted">download</span>
            <span className="">ექსპორტი (XLSX)</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 text-body-md font-body-md font-semibold cursor-pointer" onClick={() => setIsRegistrationOpen(true)}>
            <span className="material-symbols-outlined text-[19px]">person_add</span>
            <span className="">+ სუბიექტის რეგისტრაცია</span>
          </button>
        </div>
      </div>
      {/* ========================================================================= */}
      {/* 3. TOP KPI METRIC ROW (4 CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI Card 1 */}
        <div className="p-5 bg-surface-card rounded-xl border border-border-subtle relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-body-sm font-body-sm font-medium text-text-muted">მართული პორტფელი (ჯამური)</span>
              <div className="text-headline-md font-headline-md text-text-primary font-bold mt-2 font-data-mono-lg">
                ₾ {totalPortfolioAmount.toLocaleString('ka-GE')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border-subtle">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-data-mono-md text-label-sm font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              ცოცხალი ბაზა
            </span>
            <span className="text-body-sm font-body-sm text-text-muted">Excel რეესტრის ჯამი</span>
          </div>
        </div>
        {/* KPI Card 2 */}
        <div className="p-5 bg-surface-card rounded-xl border border-border-subtle relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-body-sm font-body-sm font-medium text-text-muted">ამოღებული / დაფარული თანხა</span>
              <div className="text-headline-md font-headline-md text-emerald-600 font-bold mt-2 font-data-mono-lg">
                ₾ {totalRecoveredAmount.toLocaleString('ka-GE')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-data-mono-md text-label-sm font-semibold">
                43.8% ეფექტურობა
              </span>
            </div>
            <span className="text-label-sm font-label-sm text-text-muted font-mono">მიზანი: 40%</span>
          </div>
        </div>
        {/* KPI Card 3 */}
        <div className="p-5 bg-surface-card rounded-xl border border-border-subtle relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-body-sm font-body-sm font-medium text-text-muted">აქტიური საქმეები (Excel)</span>
              <div className="text-headline-md font-headline-md text-text-primary font-bold mt-2 font-data-mono-lg">
                {activeCasesCount} <span className="text-body-md font-body-md font-normal text-text-muted">საქმე</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border-subtle">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-data-mono-md text-label-sm font-semibold">
              {excelDebtors.length} დებიტორი
            </span>
            <span className="text-body-sm font-body-sm text-text-muted">{excelCreditors.length} კრედიტორი</span>
          </div>
        </div>
        {/* KPI Card 4 */}
        <div className="p-5 bg-surface-card rounded-xl border border-border-subtle relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-body-sm font-body-sm font-medium text-text-muted">რეგისტრირებული მომხმარებლები</span>
              <div className="text-headline-md font-headline-md text-text-primary font-bold mt-2 font-data-mono-lg">
                {users.length} <span className="text-body-md font-body-md font-normal text-text-muted">სუბიექტი</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border-subtle">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-data-mono-md text-label-sm font-semibold">
              {users.filter(u => u.role === 'REGULAR').length} მოლოდინში
            </span>
            <span className="text-body-sm font-body-sm text-text-muted">როლის მინიჭებისთვის</span>
          </div>
        </div>
      </div>
      {/* ========================================================================= */}
      {/* 4. ANALYTICAL CHARTS & VISUAL DIAGNOSTICS (GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: ვალების ამოღების დინამიკა (Debt Recovery Dynamics & Forecast) */}
        <div className="lg:col-span-5 p-5 bg-surface-card rounded-xl border border-border-subtle flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                  ვალების ამოღების დინამიკა &amp; პროგნოზი
                </h3>
              </div>
              <span className="text-label-sm font-label-sm text-text-muted font-mono bg-slate-50 px-2 py-0.5 rounded border border-border-subtle">Q1–Q3 2024</span>
            </div>
            <p className="text-body-sm font-body-sm text-text-muted mt-2">
              დაგეგმილი სამიზნე მაჩვენებლებისა და ფაქტობრივად აკუმულირებული თანხების შედარება თვეების მიხედვით (მლნ ₾).
            </p>
            {/* Visual Bar / Dynamics Chart */}
            <div className="mt-6 space-y-4">
              {/* Month 1: ივლისი */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-text-primary font-medium">ივლისი</span>
                  <div className="space-x-3 font-mono text-[13px]">
                    <span className="text-text-muted">გეგმა: 7.5 მლნ</span>
                    <span className="text-emerald-600 font-semibold">ფაქტი: 8.9 მლნ ₾</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-primary/40 h-full" style={{width: '75%'}} title="გეგმა: 7.5" />
                  <div className="bg-emerald-500 h-full" style={{width: '14%'}} title="გადაჭარბება" />
                </div>
              </div>
              {/* Month 2: აგვისტო */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-text-primary font-medium">აგვისტო</span>
                  <div className="space-x-3 font-mono text-[13px]">
                    <span className="text-text-muted">გეგმა: 8.0 მლნ</span>
                    <span className="text-emerald-600 font-semibold">ფაქტი: 9.2 მლნ ₾</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-primary/40 h-full" style={{width: '80%'}} title="გეგმა: 8.0" />
                  <div className="bg-emerald-500 h-full" style={{width: '12%'}} title="გადაჭარბება" />
                </div>
              </div>
              {/* Month 3: სექტემბერი */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-text-primary font-medium">სექტემბერი</span>
                  <div className="space-x-3 font-mono text-[13px]">
                    <span className="text-text-muted">გეგმა: 8.5 მლნ</span>
                    <span className="text-emerald-600 font-semibold">ფაქტი: 10.35 მლნ ₾</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-primary/40 h-full" style={{width: '78%'}} />
                  <div className="bg-emerald-500 h-full" style={{width: '22%'}} />
                </div>
              </div>
              {/* Month 4: ოქტომბერი (მიმდინარე) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-body-sm font-body-sm">
                  <span className="text-text-primary font-medium flex items-center gap-1.5">
                    ოქტომბერი 
                    <span className="px-1.5 py-0.2 bg-sky-50 text-sky-700 text-[10px] rounded font-mono border border-sky-200">მიმდინარე</span>
                  </span>
                  <div className="space-x-3 font-mono text-[13px]">
                    <span className="text-text-muted">სამიზნე: 11.0 მლნ</span>
                    <span className="text-primary font-semibold">მიმდინარე: 8.1 მლნ ₾</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div className="bg-primary h-full relative" style={{width: '74%'}}>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom Legend */}
          <div className="pt-4 mt-6 border-t border-border-subtle flex items-center justify-between text-label-sm font-label-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                ამოღებული ფაქტი
              </span>
              <span className="flex items-center gap-1.5 text-text-muted">
                <span className="w-3 h-3 rounded bg-primary/40" />
                საბაზისო სამიზნე
              </span>
            </div>
            <span className="text-emerald-600 font-mono font-bold">+14.6% საპროგნოზო გადაჭარბება</span>
          </div>
        </div>
        {/* CHART 2: საკრედიტო რეიტინგების განაწილება (Credit Risk Grade Distribution) */}
        <div className="lg:col-span-4 p-5 bg-surface-card rounded-xl border border-border-subtle flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                  საკრედიტო რისკ-რეიტინგი
                </h3>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[18px]">verified</span>
            </div>
            <p className="text-body-sm font-body-sm text-text-muted mt-2">
              პორტფელის სტრუქტურა Debitinfo Scoring-ის მოდელის მიხედვით
            </p>
            {/* Composite Progress Bar */}
            <div className="mt-6">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-border-subtle">
                <div className="bg-emerald-400 h-full rounded-l-full" style={{width: '48%'}} title="Grade A: 48%" />
                <div className="bg-amber-400 h-full" style={{width: '34%'}} title="Grade B: 34%" />
                <div className="bg-red-400 h-full rounded-r-full" style={{width: '18%'}} title="Grade C: 18%" />
              </div>
            </div>
            {/* Grade Breakdown Cards */}
            <div className="mt-6 space-y-3">
              {/* Grade A */}
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-label-md border border-emerald-200">
                    Grade A
                  </span>
                  <div>
                    <div className="text-body-sm font-body-sm font-semibold text-text-primary">Prime / დაბალი რისკი</div>
                    <div className="text-[11px] text-text-muted">მყისიერი გადამხდელი, სტაბილური ბრუნვა</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-body-md font-semibold text-emerald-700">48%</div>
                  <div className="text-[11px] font-mono text-text-muted">₾ 31.1 მლნ</div>
                </div>
              </div>
              {/* Grade B */}
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold text-label-md border border-amber-200">
                    Grade B
                  </span>
                  <div>
                    <div className="text-body-sm font-body-sm font-semibold text-text-primary">Moderate / ზომიერი რისკი</div>
                    <div className="text-[11px] text-text-muted">30-60 დღიანი დაყოვნება, აქტიური მოლაპარაკება</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-body-md font-semibold text-amber-700">34%</div>
                  <div className="text-[11px] font-mono text-text-muted">₾ 22.0 მლნ</div>
                </div>
              </div>
              {/* Grade C */}
              <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-mono font-bold text-label-md border border-red-200">
                    Grade C
                  </span>
                  <div>
                    <div className="text-body-sm font-body-sm font-semibold text-text-primary">High / დეფოლტი &amp; სარჩელი</div>
                    <div className="text-[11px] text-text-muted">90+ დღე, სააღსრულებო / სასამართლო რეჟიმი</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-body-md font-semibold text-red-700">18%</div>
                  <div className="text-[11px] font-mono text-text-muted">₾ 11.6 მლნ</div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border-subtle text-[11px] text-text-muted flex items-center justify-between">
            <span className="">ბოლო კორექტირება: დღეს 12:00</span>
            <span className="text-primary font-medium cursor-pointer hover:underline">დეტალური აუდიტი →</span>
          </div>
        </div>
        {/* CHART 3: თანამშრომელთა დატვირთვის ინდიკატორები (Workload by Role) */}
        <div className="lg:col-span-3 p-5 bg-surface-card rounded-xl border border-border-subtle flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                  გუნდის დატვირთვა
                </h3>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[18px]">group_work</span>
            </div>
            <p className="text-body-sm font-body-sm text-text-muted mt-2">
              მიმდინარე ოპერაციული რესურსების განაწილება
            </p>
            <div className="mt-6 space-y-5">
              {/* Legal Dept */}
              <div>
                <div className="flex justify-between items-center text-body-sm font-body-sm mb-1.5">
                  <span className="font-medium text-text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-rating-c">gavel</span>
                    იურისტები
                  </span>
                  <span className="font-mono text-body-sm font-semibold text-text-primary">
                    {workloadStats?.legal?.loadPercent || 80}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-rating-c h-full rounded-full transition-all duration-500"
                    style={{ width: `${workloadStats?.legal?.loadPercent || 80}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted mt-1">
                  <span>{workloadStats?.legal?.openCases || 5} ღია საქმე</span>
                  <span>{workloadStats?.legal?.lawyersCount || 1} იურისტი</span>
                </div>
              </div>
              {/* Call Center */}
              <div>
                <div className="flex justify-between items-center text-body-sm font-body-sm mb-1.5">
                  <span className="font-medium text-text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-sky-600">headset_mic</span>
                    ქოლ-ცენტრი
                  </span>
                  <span className="font-mono text-body-sm font-semibold text-amber-600">
                    {workloadStats?.callCenter?.loadPercent || 85}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${workloadStats?.callCenter?.loadPercent || 85}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted mt-1">
                  <span>{workloadStats?.callCenter?.callsToday || 4} ზარი დღეს</span>
                  <span>{workloadStats?.callCenter?.operatorsCount || 1} ოპერატორი</span>
                </div>
              </div>
              {/* Field Officers */}
              <div>
                <div className="flex justify-between items-center text-body-sm font-body-sm mb-1.5">
                  <span className="font-medium text-text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">pin_drop</span>
                    საველე ვიზიტორები
                  </span>
                  <span className="font-mono text-body-sm font-semibold text-emerald-600">
                    {workloadStats?.fieldOfficers?.loadPercent || 65}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${workloadStats?.fieldOfficers?.loadPercent || 65}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-text-muted mt-1">
                  <span>{workloadStats?.fieldOfficers?.pendingVisits || 2} აქტიური ვიზიტი</span>
                  <span>{workloadStats?.fieldOfficers?.visitorsCount || 1} ექსპერტი</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border-subtle mt-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
              <span className="text-[11px] text-emerald-800 leading-tight">
                ოპერაციული გუნდის მონაცემები სინქრონიზებულია PostgreSQL ცოცხალ ბაზასთან.
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* ========================================================================= */}
      {/* 5. TASK DISPATCHER & PORTFOLIO ALLOCATION PANEL */}
      {/* ========================================================================= */}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">send_time_extension</span>
            </div>
            <div>
              <h2 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                დავალების დისპეტჩერიზაცია და პორტფელის დელეგირება
              </h2>
              <p className="text-body-sm font-body-sm text-text-muted">
                მიაბით კონკრეტული საქმე თანამშრომელს, დააწესეთ პრიორიტეტები და გაუგზავნეთ მყისიერი შიდა დავალება
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-sm font-label-sm text-text-muted">ავტომატური დისპეტჩერი:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-mono border border-emerald-200 font-semibold">
              Live PostgreSQL Connected
            </span>
          </div>
        </div>

        {dispatchSuccessMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm animate-fadeIn">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-medium">{dispatchSuccessMessage}</span>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleDispatchTask}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Dropdown Selector */}
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-2">
                შემსრულებელი თანამშრომელი <span className="text-rating-c">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                >
                  {staffOptions.length === 0 ? (
                    <option value="">თანამშრომლები იტვირთება...</option>
                  ) : (
                    staffOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-text-muted pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
              {(() => {
                const s = staffOptions.find((x) => x.id === selectedStaffId);
                return s ? (
                  <span className="text-[11px] text-text-muted mt-1 block">
                    მიმდინარე დატვირთვა: <strong className="text-text-primary font-mono">{s.activeTaskCount}</strong> აქტიური დავალება
                  </span>
                ) : null;
              })()}
            </div>
            {/* Portfolio / Case Reference Selector */}
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-2">
                საქმე / პორტფელის რეკვიზიტი <span className="text-rating-c">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-body-md font-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-mono text-[13px]"
                >
                  {claimsOptions.length === 0 ? (
                    <option value="">საქმეები იტვირთება...</option>
                  ) : (
                    claimsOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-text-muted pointer-events-none text-[20px]">
                  folder_open
                </span>
              </div>
              {(() => {
                const c = claimsOptions.find((x) => x.id === selectedClaimId);
                return c ? (
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
                    ვადაგადაცილება: {c.daysOverdue} დღე • ნაშთი: {c.remainingAmount.toLocaleString('ka-GE')} ₾
                  </span>
                ) : null;
              })()}
            </div>
            {/* Priority Selector (Toggle Badges) */}
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-2">
                დავალების პრიორიტეტი <span className="text-rating-c">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={dispatchPriority === 'high'}
                    onChange={() => setDispatchPriority('high')}
                    className="peer sr-only"
                  />
                  <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-red-50 peer-checked:text-red-700 peer-checked:border-red-300 transition-all flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rating-c" />
                    <span>სასწრაფო</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="medium"
                    checked={dispatchPriority === 'medium'}
                    onChange={() => setDispatchPriority('medium')}
                    className="peer sr-only"
                  />
                  <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-checked:border-amber-300 transition-all flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>საშუალო</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={dispatchPriority === 'low'}
                    onChange={() => setDispatchPriority('low')}
                    className="peer sr-only"
                  />
                  <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 peer-checked:border-emerald-300 transition-all flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>დაბალი</span>
                  </div>
                </label>
              </div>
              <span className="text-[11px] text-text-muted mt-1 block">შესრულების დედლაინი: 24 საათი</span>
            </div>
          </div>
          {/* Description and Quick Action Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-body-sm font-body-sm font-medium text-text-primary">
                დავალების შინაარსი &amp; შიდა ინსტრუქცია (Internal Memo)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">სწრაფი შაბლონები:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setDispatchInstructions('დაუკავშირდით მოვალეს, გადაამოწმეთ დაფარვის მზადყოფნა და დააფიქსირეთ შეთანხმებული თარიღი.')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                    type="button"
                  >
                    + სატელეფონო შეხსენება
                  </button>
                  <button
                    onClick={() => setDispatchInstructions('მოვალეს გაეგზავნოს ოფიციალური გაფრთხილება და მომზადდეს სარჩელი სასამართლოში წარსადგენად.')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                    type="button"
                  >
                    + სარჩელის მომზადება
                  </button>
                  <button
                    onClick={() => setDispatchInstructions('განახორციელეთ საველე ვიზიტი იურიდიულ/ფაქტობრივ მისამართზე, შეადგინეთ ინსპექციის ოქმი.')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                    type="button"
                  >
                    + ადგილზე ვიზიტი
                  </button>
                  <button
                    onClick={() => setDispatchInstructions('გადაამოწმეთ RS.GE ბაზაში კომპანიის მიმდინარე ბრუნვა და აქტივების მდგომარეობა.')}
                    className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                    type="button"
                  >
                    + საბანკო / RS შემოწმება
                  </button>
                </div>
              </div>
            </div>
            <textarea
              value={dispatchInstructions}
              onChange={(e) => setDispatchInstructions(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="ჩაწერეთ კონკრეტული დავალება თანამშრომლისთვის..."
              rows={3}
            />
          </div>
          {/* Bottom Actions / Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-3 text-body-sm font-body-sm text-text-muted">
              <label className="flex items-center gap-2 cursor-pointer">
                <input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                <span className="text-slate-700">SMS შეტყობინება თანამშრომელს</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4" type="checkbox" />
                <span className="text-slate-700">საქმის ჟურნალში (Audit Log) ფიქსაცია</span>
              </label>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setDispatchInstructions('')}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-50 text-body-md font-body-md transition-colors cursor-pointer"
                type="button"
              >
                გასუფთავება
              </button>
              <button
                disabled={isDispatching}
                className="w-1/2 sm:w-auto px-6 py-2.5 rounded-lg bg-primary hover:bg-[#0A37CA] disabled:opacity-50 text-white font-medium text-body-md font-body-md shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                type="submit"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>{isDispatching ? 'იგზავნება...' : 'დავალების შექმნა და გაგზავნა'}</span>
              </button>
            </div>
          </div>
        </form>
      </section>
      {/* ========================================================================= */}
      {/* 6. ANALYST REGISTRY, EXCEL SYNC & ROLE ASSIGNMENT CONSOLE */}
      {/* ========================================================================= */}
      <div id="excel-registry-section">
        <AnalystRegistryManager
          users={users}
          excelDebtors={excelDebtors}
          excelCreditors={excelCreditors}
          syncingExcel={syncingExcel}
          loadingData={loadingData}
          actionSuccessMessage={actionSuccessMessage}
          onSyncExcel={handleSyncExcel}
          onRefreshData={loadAnalystData}
          onDismissMessage={() => setActionSuccessMessage(null)}
          onAssignRole={handleAssignRole}
        />
      </div>
    </main>
  </div>
  {/* ========================================================================= */}
  {/* HIGH-FIDELITY SUBJECT REGISTRATION MODAL / POPUP DIALOG */}
  {/* ========================================================================= */}
  <div aria-labelledby="modal-title" aria-modal="true" className={`fixed inset-0 z-50 overflow-y-auto ${isRegistrationOpen ? '' : 'hidden'}`} id="subjectRegistrationModal" role="dialog">
    {/* Backdrop */}
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsRegistrationOpen(false)} />
    {/* Modal Center Container */}
    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
      <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-3xl border border-border-subtle" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-surface-card px-6 py-5 border-b border-border-subtle flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-md shadow-primary/20 flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary" id="modal-title">
                  სუბიექტის რეგისტრაცია (დებიტორი / კრედიტორი)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] border border-emerald-200 font-semibold hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  RS.GE Sync
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                ახალი სუბიექტის სისტემაში დამატება და RS.GE ბაზებთან ავტომატური სინქრონიზაცია
              </p>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setIsRegistrationOpen(false)} title="დახურვა">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {/* Segmented Mode Tabs (Debtor vs Creditor) */}
        <div className="px-6 pt-5 pb-1 bg-surface-bg/50 border-b border-border-subtle">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl gap-1">
            <button className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-body-md transition-all text-sm cursor-pointer ${registrationTab === 'debtor' ? 'font-semibold text-primary bg-white shadow-sm' : 'font-medium text-text-muted hover:text-text-primary'}`} id="tabBtnDebtor" onClick={() => setRegistrationTab('debtor')}>
              <span className="material-symbols-outlined text-[19px] text-sky-600">person_add</span>
              <span className="">დებიტორის რეგისტრაცია (Debtor)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100/70 text-sky-800 font-normal hidden sm:inline">მოვალე</span>
            </button>
            <button className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-body-md transition-all text-sm cursor-pointer ${registrationTab === 'creditor' ? 'font-semibold text-primary bg-white shadow-sm' : 'font-medium text-text-muted hover:text-text-primary'}`} id="tabBtnCreditor" onClick={() => setRegistrationTab('creditor')}>
              <span className="material-symbols-outlined text-[19px]">domain_add</span>
              <span className="">კრედიტორის რეგისტრაცია (Creditor)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-normal hidden sm:inline">მოთხოვნის მფლობელი</span>
            </button>
          </div>
        </div>
        {/* Modal Body Form Area */}
        <div className="p-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* FORM 1: DEBTOR FORM */}
          <div className={`space-y-4 ${registrationTab === 'debtor' ? '' : 'hidden'}`} id="formDebtorSection">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-4 text-body-sm">
                <span className="font-semibold text-text-primary text-xs uppercase tracking-wider text-slate-500">სუბიექტის ტიპი:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input defaultChecked className="text-primary focus:ring-primary w-4 h-4" name="debtor_entity_type" type="radio" />
                  <span className="text-text-primary font-medium text-body-sm">იურიდიული პირი (შპს/სს)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input className="text-primary focus:ring-primary w-4 h-4" name="debtor_entity_type" type="radio" />
                  <span className="text-slate-600 text-body-sm">ფიზიკური პირი</span>
                </label>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-semibold border border-sky-200 hidden md:inline">დავალიანების მქონე სუბიექტი</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საიდენტიფიკაციო კოდი (ს/კ ან პ/ნ) <span className="text-rating-c">*</span>
                </label>
                <div className="relative flex items-center">
                  <input className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-24 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="404991201" type="text" defaultValue={405118492} />
                  <button className="absolute right-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-label-sm font-semibold flex items-center gap-1 transition-colors" title="შემოწმება RS.GE რეესტრში" type="button">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    <span className="">RS.GE</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  სრული დასახელება / სახელი და გვარი <span className="text-rating-c">*</span>
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="მაგ: შპს 'კავკასუს ტრანსი'" type="text" defaultValue="შპს „კავკასუს ტრანს სერვისი“" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საკონტაქტო ტელეფონი <span className="text-rating-c">*</span>
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="+995 599 000000" type="tel" defaultValue="+995 591 442299" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  ელ. ფოსტა
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="contact@company.ge" type="email" defaultValue="info@cts-georgia.ge" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  იურიდიული / ფაქტობრივი მისამართი
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="ქ. თბილისი, აკაკი წერეთლის გამზ. #116" type="text" defaultValue="ქ. თბილისი, საბურთალოს რ-ნი, ალ. ყაზბეგის გამზ. #24ა" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საწყისი დავალიანება / სასესხო მოცულობა (GEL)
                </label>
                <div className="relative flex items-center">
                  <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="0.00" type="text" defaultValue="48,500.00" />
                  <span className="absolute right-3 font-mono text-text-muted text-body-sm font-semibold">₾</span>
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  პასუხისმგებელი ექსპერტი / ანალიტიკოსი
                </label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                  {staffOptions.length === 0 ? (
                    <option value="">თანამშრომლები იტვირთება...</option>
                  ) : (
                    staffOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="pt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                RS.GE სტატუსი: რეგისტრირებული, აქტიური დღგ-ის გადამხდელი
              </span>
              <span className="font-mono text-emerald-700">სკორე: 84 / 100</span>
            </div>
          </div>
          {/* FORM 2: CREDITOR FORM */}
          <div className={`space-y-4 ${registrationTab === 'creditor' ? '' : 'hidden'}`} id="formCreditorSection">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-3 text-body-sm">
                <span className="font-semibold text-text-primary text-xs uppercase tracking-wider text-slate-500">კრედიტორის კატეგორია:</span>
                <select className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-body-sm text-text-primary font-medium focus:outline-none focus:border-primary">
                  <option>კომერციული ორგანიზაცია / B2B</option>
                  <option>საბანკო ინსტიტუტი</option>
                  <option>მიკროსაფინანსო ორგანიზაცია</option>
                  <option>კერძო საინვესტიციო ფონდი</option>
                </select>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-primary text-[11px] font-semibold border border-blue-200 hidden md:inline">მოთხოვნის მფლობელი ორგანიზაცია</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) <span className="text-rating-c">*</span>
                </label>
                <div className="relative flex items-center">
                  <input className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-24 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="204876221" type="text" defaultValue={205889311} />
                  <button className="absolute right-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-label-sm font-semibold flex items-center gap-1 transition-colors" title="შემოწმება RS.GE რეესტრში" type="button">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    <span className="">RS.GE</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  კრედიტორი კომპანიის დასახელება <span className="text-rating-c">*</span>
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="მაგ: სს 'თბილისური ტექნოლოგიები'" type="text" defaultValue="სს „თბილისური ტექნოლოგიები“" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  ხელშეკრულების საფუძველი &amp; № <span className="text-rating-c">*</span>
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="ხელშ. #B2B-SERV-892/2024" type="text" defaultValue="ხელშ. #B2B-SERV-892/2024" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საქმის / პორტფელის მიბმა
                </label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-[13px] text-text-primary focus:outline-none focus:border-primary">
                  <option value="1">საქმე #DB-2024-8902 (აქტიური)</option>
                  <option value="2">პორტფელი #PF-B2B-12 (მიკრო-ბიზნესი)</option>
                  <option value="3">ახალი პორტფელის გახსნა...</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საბანკო რეკვიზიტები (IBAN ანგარიშსწორებისთვის)
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="GE00TB0000000000000000" type="text" defaultValue="GE29TB7982245081100092" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  უფლებამოსილი წარმომადგენელი
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="სახელი, გვარი, პოზიცია" type="text" defaultValue="ირაკლი ჯაფარიძე (დირექტორი)" />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  საკონტაქტო ტელეფონი
                </label>
                <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="+995 599 000000" type="tel" defaultValue="+995 595 110022" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-1">
                  მოთხოვნის დავალიანებული მოცულობა (GEL)
                </label>
                <div className="relative flex items-center">
                  <input className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="0.00" type="text" defaultValue="118,200.00" />
                  <span className="absolute right-3 font-mono text-text-muted text-body-sm font-semibold">₾</span>
                </div>
              </div>
            </div>
            {/* დავალიანების დამადასტურებელი დოკუმენტაცია (Proof of Debt Attachment) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">attach_file</span>
                  დავალიანების დამადასტურებელი დოკუმენტები (სავალდებულო):
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                  RS.GE / საბუღალტრო დასტური
                </span>
              </div>
              <p className="text-xs text-text-muted">
                მიამაგრეთ დოკუმენტები, რაც დაადასტურებს დებიტორული დავალიანების რეალურ არსებობას (სასაქონლო ზედნადები, ბრუნვითი ბარათი ან ხელშეკრულება).
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Document 1: Waybill */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-rose-600 text-[16px]">description</span>
                      სასაქონლო ზედნადები (PDF)
                    </span>
                    <span className="text-emerald-700 text-[11px] font-semibold">მიბმულია</span>
                  </div>
                  <input
                    type="text"
                    defaultValue="rs_waybill_8841.pdf (RS.GE #WAYBILL-8841)"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
                    placeholder="ზედნადების ფაილი..."
                  />
                </div>

                {/* Document 2: Turnover Card */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-emerald-600 text-[16px]">table_view</span>
                      ბრუნვითი ბარათი (Excel/XLSX)
                    </span>
                    <span className="text-emerald-700 text-[11px] font-semibold">მიბმულია</span>
                  </div>
                  <input
                    type="text"
                    defaultValue="brunviti_barati_2024.xlsx (480 KB)"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
                    placeholder="ბრუნვითი ბარათის ფაილი..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
              <span className="text-primary font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                მოთხოვნის დადასტურებული მოცულობა: 118,200.00 ₾
              </span>
              <span className="font-mono text-slate-600">სტატუსი: ხელშეკრულება აქტიურია</span>
            </div>
          </div>
        </div>
        {/* Modal Footer */}
        <div className="bg-surface-bg px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <button className="inline-flex items-center gap-1.5 text-body-sm font-medium text-slate-600 hover:text-primary transition-colors cursor-pointer" type="button">
            <span className="material-symbols-outlined text-[17px] text-emerald-600">upload_file</span>
            <span className="">Excel რეესტრიდან მასიური იმპორტი</span>
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button className="px-4 py-2 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-100 text-body-md font-medium transition-colors cursor-pointer" onClick={() => setIsRegistrationOpen(false)} type="button">
              გაუქმება
            </button>
            <button className={`${registrationTab === 'debtor' ? '' : 'hidden'} px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-medium text-body-md shadow-sm shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer`} id="modalSubmitBtnDebtor" onClick={() => setIsRegistrationOpen(false)} type="button">
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span className="">დებიტორის ბაზაში დამატება &amp; ვერიფიკაცია</span>
            </button>
            <button className={`${registrationTab === 'creditor' ? '' : 'hidden'} px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-medium text-body-md shadow-sm shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer`} id="modalSubmitBtnCreditor" onClick={() => setIsRegistrationOpen(false)} type="button">
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span className="">კრედიტორის რეგისტრაცია &amp; აქტივაცია</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* ========================================================================= */}
  {/* JAVASCRIPT FOR MODAL & TABS */}
  {/* ========================================================================= */}
  {/* ========================================================================= */}
  {/* SHARED FOOTER COMPONENT */}
  {/* ========================================================================= */}
  <footer className="w-full bg-surface-card border-t border-border-subtle mt-auto">
    <div className="w-full max-w-[1720px] mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center">
          <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
          <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <p className="text-body-sm font-body-sm text-text-muted text-center sm:text-left">
          © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-6 text-body-sm font-body-sm text-text-muted">
        <a className="hover:text-primary transition-colors hover:underline" href="#">კონფიდენციალურობის პოლიტიკა</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">მომსახურების პირობები</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">რეკვიზიტები</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">საგადასახადო შემოწმება</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">საკონტაქტო პირი</a>
      </nav>
    </div>
  </footer>
  {/* ========================================================================= */}
  {/* ADVANCED AUDIT & MULTI-PARAMETER FILTER DRAWER */}
  {/* ========================================================================= */}
  <div id="advancedFilterDrawer" className={`fixed inset-0 z-50 overflow-hidden ${isFilterDrawerOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true" aria-labelledby="drawer-headline">
    {/* Backdrop */}
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterDrawerOpen(false)} />
    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
      <div className="w-screen max-w-2xl bg-surface-card shadow-2xl border-l border-border-subtle flex flex-col justify-between overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="p-5 bg-surface-bg border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="drawer-headline" className="text-headline-sm font-headline-sm font-bold text-text-primary">გაფართოებული ფილტრაცია</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-label-sm font-mono font-semibold">Audit &amp; Multi-Query</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">საქმეების, სუბიექტების, ზარებისა და საველე ვიზიტების კომპლექსური ანალიზი</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsFilterDrawerOpen(false)} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-200/60 transition-colors cursor-pointer" title="დახურვა">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {/* Drawer Scrollable Form Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-body-md">
          {/* 1. DATE RANGE & ACTIVITY TIME WINDOW */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
                თარიღის დიაპაზონი და აქტივობის პერიოდი
              </label>
              <span className="text-[11px] text-text-muted">სწრაფი არჩევა</span>
            </div>
            {/* Quick Range Chips */}
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-border-subtle text-body-sm font-medium hover:border-primary text-text-primary transition-all text-xs">დღეს</button>
              <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-border-subtle text-body-sm font-medium hover:border-primary text-text-primary transition-all text-xs">ბოლო 7 დღე</button>
              <button type="button" className="px-2.5 py-1 rounded-md bg-primary text-white font-medium shadow-xs text-xs">მიმდინარე თვე</button>
              <button type="button" className="px-2.5 py-1 rounded-md bg-white border border-border-subtle text-body-sm font-medium hover:border-primary text-text-primary transition-all text-xs">კვარტალი (Q3)</button>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">საწყისი თარიღი</label>
                <input type="date" defaultValue="2024-10-01" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">საბოლოო თარიღი</label>
                <input type="date" defaultValue="2024-10-24" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-body-sm text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">აქტივობის დრო (დან)</label>
                <input type="time" defaultValue="09:00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">აქტივობის დრო (მდე)</label>
                <input type="time" defaultValue="19:00" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          {/* 2. IDENTIFIERS (PIN, TAX ID, DEBTOR & COMPANY NAME) */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-border-subtle space-y-4">
            <label className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
              სუბიექტისა და კომპანიის რეკვიზიტები
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">პირადი ნომერი (11 ნიშნა პ/ნ)</label>
                <div className="relative">
                  <input type="text" maxLength={11} placeholder="01024089..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
                  <span className="absolute right-2.5 top-2.5 text-label-sm font-mono text-text-muted">11 digits</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">საიდენტიფიკაციო კოდი (9 ნიშნა ს/კ)</label>
                <div className="relative">
                  <input type="text" maxLength={9} placeholder="405118492..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
                  <span className="absolute right-2.5 top-2.5 text-label-sm font-mono text-text-muted">9 digits</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">მოვალის / ფიზიკური პირის სახელი</label>
                <input type="text" placeholder="მაგ: გიორგი ბერიძე" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">კომპანიის დასახელება (შპს / სს)</label>
                <input type="text" placeholder="მაგ: შპს ალფა ლოჯისტიკსი" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">ტელეფონის ნომერი</label>
                <input type="tel" placeholder="+995 5..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">მისამართი / რეგიონი / ლოკაცია</label>
                <input type="text" placeholder="მაგ: თბილისი, ბათუმი, ქუთაისი..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          {/* 3. RESPONSIBLE OFFICER / TEAM ROLE */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-border-subtle space-y-3">
            <label className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">assignment_ind</span>
              პასუხისმგებელი ოფიცერი &amp; როლი
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="">ყველა თანამშრომელი</option>
                <option value="1">თეონა პეტრიაშვილი (ქოლ-ცენტრი)</option>
                <option value="2">გიორგი მახარაძე (უფროსი იურისტი)</option>
                <option value="3">ლევან კვირიკაშვილი (საველე ვიზიტორი)</option>
                <option value="4">ნინო ბერიძე (რისკ-ანალიტიკოსი)</option>
              </select>
              <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="">ყველა დეპარტამენტი</option>
                <option value="call">ქოლ-ცენტრი / ოპერატორი</option>
                <option value="field">საველე ვიზიტები (Field Enforcement)</option>
                <option value="legal">იურიდიული სამსახური &amp; სასამართლო</option>
                <option value="risk">რისკ-მენეჯმენტი &amp; Scoring</option>
              </select>
            </div>
          </div>
          {/* 4. CALL CENTER & FIELD VISIT AUDIT CHECKS */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                ქოლ-ცენტრისა და საველე ვიზიტების აუდიტ-შემოწმება
              </label>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Fraud Prevention</span>
            </div>
            {/* Call / Visit Status Checkboxes */}
            <div>
              <label className="text-[11px] text-text-muted block mb-1.5 font-medium">ზარის / ვიზიტის სტატუსი</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">შედგა (Connected)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">უპასუხო (No Answer)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">დაკავებულია</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">გამორთულია</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">არასწორი ნომერი</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">ადგილზე ნანახია</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">ვერ მოიძებნა</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-primary transition-all">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                  <span className="text-slate-700">უარი კომენტარზე</span>
                </label>
              </div>
            </div>
            {/* Call Duration Filter & Audio Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] text-text-muted block mb-1 font-medium">ზარის ხანგრძლივობა (ხანგრძლივი vs ფიქტიური)</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                  <option value="all">ნებისმიერი ხანგრძლივობა</option>
                  <option value="gt30">&gt; 30 წამი (შემდგარი საუბარი)</option>
                  <option value="gt60">&gt; 1 წუთი (დეტალური განხილვა)</option>
                  <option value="gt180">&gt; 3 წუთი (მოლაპარაკება)</option>
                  <option value="fake">0 წამი / ფიქტიური მცდელობის შემოწმება</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1 font-medium">აუდიო ჩანაწერის არსებობა</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                  <option value="all">ყველა ჩანაწერი</option>
                  <option value="with_audio">მხოლოდ აუდიო ფაილით (დამოწმებული)</option>
                  <option value="no_audio">აუდიო ფაილის გარეშე (საეჭვო)</option>
                </select>
              </div>
            </div>
            {/* GPS & Location Verification Status */}
            <div className="pt-1">
              <label className="text-[11px] text-text-muted block mb-1 font-medium">GPS / IP გეოლოკაციის ვალიდაცია</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 cursor-pointer">
                  <input type="radio" name="gps_filter" defaultChecked className="text-emerald-600 focus:ring-emerald-500" />
                  <div>
                    <span className="font-semibold text-emerald-800 block">GPS ემთხვევა ობიექტს</span>
                    <span className="text-[10px] text-emerald-600">ვიზიტორი იმყოფებოდა 50მ რადიუსში</span>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
                  <input type="radio" name="gps_filter" className="text-amber-600 focus:ring-amber-500" />
                  <div>
                    <span className="font-semibold text-amber-800 block">GPS აცდენა / საეჭვო</span>
                    <span className="text-[10px] text-amber-600">კოორდინატები არ ემთხვევა რეკვიზიტს</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          {/* 5. TASK OUTCOME & DEBT AMOUNT RANGE */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-border-subtle space-y-4">
            <label className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              შედეგი და დავალიანების მოცულობის დიაპაზონი (₾)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">საბოლოო რეზოლუცია / შედეგი</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                  <option value="">ყველა შედეგი</option>
                  <option value="promise">გადახდის პირობა (PTP)</option>
                  <option value="refusal">პირდაპირი უარი</option>
                  <option value="schedule">გრაფიკის გაფორმება</option>
                  <option value="legal_action">სასამართლოში გადაცემა</option>
                  <option value="closed">სრული დაფარვა</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">საკრედიტო რისკ-გრეიდი</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:border-primary">
                  <option value="">ყველა გრეიდი (A, B, C)</option>
                  <option value="grade_a">Grade A (Prime / დაბალი რისკი)</option>
                  <option value="grade_b">Grade B (Moderate / საშუალო რისკი)</option>
                  <option value="grade_c">Grade C (High / დეფოლტი &amp; სარჩელი)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-text-muted block mb-1">მინიმალური თანხა (₾)</label>
                <input type="number" placeholder="0" defaultValue={5000} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-text-muted block mb-1">მაქსიმალური თანხა (₾)</label>
                <input type="number" placeholder="500,000" defaultValue={150000} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-sm font-mono text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        </div>
        {/* Drawer Footer Action Bar */}
        <div className="p-5 bg-surface-bg border-t border-border-subtle flex items-center justify-between gap-3">
          <button type="button" onClick={() => { const form = document.querySelector('#advancedFilterDrawer form') as HTMLFormElement; form?.reset(); }} className="px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-100 text-body-md font-medium transition-colors cursor-pointer">
            გასუფთავება
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsFilterDrawerOpen(false)} className="px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-100 text-body-md font-medium transition-colors cursor-pointer">
              დახურვა
            </button>
            <button type="button" onClick={() => setIsFilterDrawerOpen(false)} className="px-6 py-2.5 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-body-md font-semibold shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">filter_alt</span>
              <span className="">ფილტრის გამოყენება</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  {/* ========================================================================= */}
  {/* SCRIPT FOR ADVANCED FILTER DRAWER */}
  {/* ========================================================================= */}
</div>

    </div>
  );
}
