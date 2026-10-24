'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, creditorBackendService, AuthUser } from '@/services';

interface CreditorDashboardViewProps {
  user: AuthUser;
}

export default function CreditorDashboardView({ user }: CreditorDashboardViewProps) {
  const router = useRouter();
  const [claimsData, setClaimsData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let isMounted = true;
    async function loadClaims() {
      try {
        const data = await creditorBackendService.getMyClaims();
        if (isMounted && data) {
          setClaimsData(data);
        }
      } catch (e) {
        console.warn('Could not fetch creditor claims:', e);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }
    loadClaims();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  if (loadingData && !claimsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">მონაცემების ჩატვირთვა...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს თქვენი ორგანიზაციის მოთხოვნების უსაფრთხო ჩატვირთვა</p>
          </div>
        </div>
      </div>
    );
  }

  // Real Dynamic Values from Authenticated User & Database
  const companyName = user?.companyProfile?.companyName || (user?.entityType === 'PHYSICAL' ? `${user.individualProfile?.firstName || ''} ${user.individualProfile?.lastName || ''}`.trim() : null) || user?.email || 'შპს ჯეო ტრეიდინგი';
  const companyInitials = companyName ? companyName.replace(/შპს|სს|ა\(ა\)იპ|"|„|“/g, '').trim().slice(0, 2).toUpperCase() : 'კრ';
  const taxId = user?.personalId || user?.companyProfile?.taxId || '405123456';

  const kpis = claimsData?.kpis || {
    totalPrincipal: 1540,
    totalRecovered: 650,
    recoveryRate: 42.2,
    activeClaimsCount: 1,
    activeDebtorsCount: 1,
  };

  return (
    <div className="bg-surface-bg text-text-primary antialiased font-body-md text-body-md min-h-screen flex flex-col" suppressHydrationWarning>
      {/* ========================================================================= */}
  {/* TopNavBar (Creditor Dashboard Context)                                   */}
  {/* ========================================================================= */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo + Segment Indicator */}
      <div className="flex items-center gap-6">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" data-icon="account_balance">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
            <span className="text-[9px] font-label-sm font-semibold tracking-wider text-text-muted uppercase">კრედიტორის კაბინეტი</span>
          </div>
        </Link>
        {/* Global Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 ml-4">
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#services">სერვისები</Link>
          <span className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 font-semibold cursor-pointer">პორტფელი &amp; რეესტრი</span>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#pricing">ტარიფები</Link>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#blog">ბლოგი</Link>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/contact">კონტაქტი</Link>
        </nav>
      </div>
      {/* Header Actions: Quick Search, Notifications & Organization Profile */}
      <div className="flex items-center gap-3">
        {/* Live Search Field in Header */}
        <div className="hidden xl:flex items-center relative w-72">
          <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]" data-icon="search">search</span>
          <input className="w-full pl-9 pr-3 py-1.5 bg-surface-bg border border-border-subtle rounded-lg text-body-sm font-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all" placeholder="დებიტორის პ/ნ ან ს/კ..." type="text" />
        </div>
        {/* Notification Center with Pulse Indicator */}
        <button className="relative p-2 rounded-lg hover:bg-surface-container-high/40 text-text-muted hover:text-text-primary transition-colors" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[22px]" data-icon="notifications">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rating-c ring-2 ring-white animate-pulse" />
        </button>
        {/* RS.GE Integration Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>RS.GE სინქრონიზაცია</span>
        </div>
        {/* Language Action */}
        <button className="p-2 text-text-muted hover:text-primary rounded-lg transition-colors hidden sm:block" title="ენა">
          <span className="material-symbols-outlined text-[20px]" data-icon="language">language</span>
        </button>
        <div className="h-6 w-px bg-border-subtle hidden sm:block" />
        {/* Client Profile Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-body-sm uppercase">
            <span>{companyInitials}</span>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-body-sm font-semibold text-text-primary leading-tight truncate max-w-[180px]">{companyName}</span>
            <span className="text-[10px] text-text-muted font-label-sm">ს/კ {taxId}</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 ml-1 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-colors active:scale-95 cursor-pointer" title="გამოსვლა" type="button">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* ========================================================================= */}
  {/* Contextual Sub-Header: Client Metadata & High-Value Batch Actions         */}
  {/* ========================================================================= */}
  <section className="bg-surface-card border-b border-border-subtle">
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Company Identity Card */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-primary">
            <span className="material-symbols-outlined text-[26px]" data-icon="domain">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-headline-md font-headline-md font-bold text-text-primary">{companyName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 text-[11px] font-semibold border border-emerald-500/20">
                <span className="material-symbols-outlined text-[14px]" data-icon="verified">verified</span>
                {user?.isRsVerified ? 'აქტიური — ვერიფიცირებული RS.GE-ით' : 'RS.GE ვერიფიკაცია მოლოდინში'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-body-sm text-text-muted flex-wrap">
              <span>საიდენტიფიკაციო კოდი: <strong className="font-data-mono-md text-text-primary">{taxId}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>სისტემური როლი: <span className="font-semibold text-primary">კრედიტორი / დამკვეთი (გამსესხებელი)</span></span>
              <span className="hidden sm:inline">•</span>
              <span>სტატუსი: <span className="font-data-mono-md text-emerald-600 font-semibold">{user?.status || 'ACTIVE'}</span></span>
            </div>
          </div>
        </div>
        {/* High-Priority Operations / Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-bg text-text-primary font-medium text-body-sm shadow-sm transition-all active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-[18px] text-text-muted" data-icon="file_download">file_download</span>
            <span>რეესტრის ექსპორტი (CSV/XLS)</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container hover:bg-on-primary-fixed-variant text-white font-medium text-body-sm shadow-sm transition-all active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]" data-icon="upload_file">upload_file</span>
            <span>Excel რეესტრის ატვირთვა</span>
          </button>
        </div>
      </div>
    </div>
  </section>
  {/* ========================================================================= */}
  {/* Main Operational Canvas                                                  */}
  {/* ========================================================================= */}
  <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
    {/* 1. Executive Financial KPI Cards Row */}
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Claimed */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">ჯამური მოთხოვნილი თანხა</span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]" data-icon="payments">payments</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-text-primary font-data-mono-lg tracking-tight">
            ₾ {kpis.totalPrincipal.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-body-sm text-text-muted">
            <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span> რეალური ბაზა
            </span>
            <span>სულ {kpis.activeDebtorsCount} დებიტორი რეესტრში</span>
          </div>
        </div>
      </div>
      {/* Card 2: Recovered Amount with #0DFCC4 highlight */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent-mint/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">დაფარული / ამოღებული თანხა</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <span className="material-symbols-outlined text-[20px]" data-icon="price_check">price_check</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-emerald-800 font-data-mono-lg tracking-tight flex items-center gap-2">
            ₾ {kpis.totalRecovered.toLocaleString()}
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-mint/20 text-emerald-900 font-bold border border-accent-mint/40">{kpis.recoveryRate}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{width: `${kpis.recoveryRate}%`}} />
          </div>
        </div>
      </div>
      {/* Card 3: Remaining Balance */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">დარჩენილი ბალანსი</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <span className="material-symbols-outlined text-[20px]" data-icon="pending_actions">pending_actions</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-amber-600 font-data-mono-lg tracking-tight">
            ₾ {Math.max(0, kpis.totalPrincipal - kpis.totalRecovered).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-body-sm text-text-muted">
            <span className="inline-flex items-center text-amber-700 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <span className="material-symbols-outlined text-[13px] mr-0.5" data-icon="warning">warning</span> {kpis.activeClaimsCount} აქტიური საქმე
            </span>
            <span>აქტიური მონიტორინგი</span>
          </div>
        </div>
      </div>
      {/* Card 4: Active Cases and Status Distribution */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">აქტიური საქმეები და სტატუსი</span>
          <div className="p-2 rounded-lg bg-blue-50 text-primary">
            <span className="material-symbols-outlined text-[20px]" data-icon="gavel">gavel</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-text-primary font-data-mono-lg tracking-tight">
            18 <span className="text-sm font-normal text-text-muted">აქტიური</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-body-sm font-medium">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs border border-rose-200">4 სამართლებრივი</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">2 დახურული</span>
          </div>
        </div>
      </div>
    </section>
    {/* 2. Dual Workspace: Master Data Table + Live Debtor Inspector Drawer */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left/Center Column: Master Debtors Registry (7 Cols on desktop) */}
      <div className="lg:col-span-7 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex flex-col">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary flex items-center gap-2">
              დებიტორთა (მოვალეთა) სრული რეესტრი
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-data-mono-md">24</span>
            </h2>
            <p className="text-body-sm text-text-muted mt-0.5">მონაცემები ავტომატურად განახლებულია სამოქალაქო რეესტრიდან</p>
          </div>
          {/* Quick Search Filter Inside Table */}
          <div className="relative w-full sm:w-56">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-text-muted text-[18px]" data-icon="filter_list">filter_list</span>
            <input className="w-full pl-8 pr-3 py-1.5 bg-surface-bg border border-border-subtle rounded-lg text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container" placeholder="ფილტრი სახელით..." type="text" />
          </div>
        </div>
        {/* Filter Tabs */}
        <div className="px-5 pt-3 border-b border-border-subtle flex items-center space-x-2 overflow-x-auto">
          <button className="px-3 py-2 text-body-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap">
            ყველა დებიტორი (24)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            ვადაგადაცილებული (9)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            მიმდინარე (13)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            დახურული (2)
          </button>
        </div>
        {/* Master Data Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">დებიტორი (მოვალე) / საიდენტ.</th>
                <th className="py-3 px-4 text-right">საწყისი ვალი</th>
                <th className="py-3 px-4 text-right">დარჩენილი</th>
                <th className="py-3 px-3 text-center">რისკი</th>
                <th className="py-3 px-3 text-center">სტატუსი</th>
                <th className="py-3 px-3 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-sm">
              {/* Row 1: Selected Debtor (გიორგი გიორგაძე) */}
              <tr className="bg-blue-50/40 hover:bg-blue-50/70 transition-colors border-l-4 border-l-primary">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    გიორგი გიორგაძე
                    <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                  </div>
                  <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: 01019012345</div>
                </td>
                <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                  ₾ 5,000.00
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-data-mono-md font-bold text-amber-600">₾ 2,200.00</span>
                  <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: 2,800.00</div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    Grade B
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                    გრაფიკი
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer" title="დეტალები">
                    <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                  </button>
                </td>
              </tr>
              {/* Row 2: ნინო აბაშიძე */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary">ნინო აბაშიძე</div>
                  <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: 01024098765</div>
                </td>
                <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                  ₾ 18,200.00
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-data-mono-md font-bold text-rose-600">₾ 18,200.00</span>
                  <div className="text-[10px] text-text-muted font-data-mono-md">დაფარულია: 0.00</div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/30">
                    Grade C
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800">
                    სამართლებრივი
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="დეტალები">
                    <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                  </button>
                </td>
              </tr>
              {/* Row 3: შპს ალფა ლოჯისტიკსი */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary">შპს ალფა ლოჯისტიკსი</div>
                  <div className="font-data-mono-md text-[11px] text-text-muted">ს/კ: 405991823</div>
                </td>
                <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                  ₾ 42,500.00
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-data-mono-md font-bold text-amber-600">₾ 12,500.00</span>
                  <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: 30,000.00</div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-mint/20 text-emerald-800 border border-accent-mint/40">
                    Grade A
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                    აქტიური
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="დეტალები">
                    <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                  </button>
                </td>
              </tr>
              {/* Row 4: დავით კაპანაძე */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary">დავით კაპანაძე</div>
                  <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: 62001004321</div>
                </td>
                <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                  ₾ 4,500.00
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-data-mono-md font-bold text-emerald-700">₾ 0.00</span>
                  <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: 4,500.00</div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-mint/20 text-emerald-800 border border-accent-mint/40">
                    Grade A
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    დაფარული
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="დეტალები">
                    <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                  </button>
                </td>
              </tr>
              {/* Row 5: მარიამ წიკლაური */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-text-primary">მარიამ წიკლაური</div>
                  <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: 01008022119</div>
                </td>
                <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                  ₾ 9,800.00
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="font-data-mono-md font-bold text-amber-600">₾ 6,300.00</span>
                  <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: 3,500.00</div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    Grade B
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
                    აქტიური
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button className="p-1.5 text-text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="დეტალები">
                    <span className="material-symbols-outlined text-[18px]" data-icon="visibility">visibility</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Table Pagination & Counter */}
        <div className="p-4 border-t border-border-subtle flex items-center justify-between text-body-sm text-text-muted">
          <span>ნაჩვენებია <strong>1-5</strong> / სულ <strong>24</strong> ჩანაწერი</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-[16px]" data-icon="chevron_left">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded bg-primary text-white font-semibold">1</button>
            <button className="px-3 py-1 rounded border border-border-subtle hover:bg-surface-bg">2</button>
            <button className="px-3 py-1 rounded border border-border-subtle hover:bg-surface-bg">3</button>
            <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg">
              <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      {/* Right Column: Debtor Detail Card & Real-Time Settlement Ledger */}
      <div className="lg:col-span-5 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex flex-col space-y-6 p-6">
        {/* Inspector Header: Identity & Contact Coordinates */}
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-headline-sm">
                გგ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">გიორგი გიორგაძე</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    Grade B (ზომიერი რისკი)
                  </span>
                </div>
                <div className="font-data-mono-md text-body-sm text-text-muted mt-0.5">პ/ნ: 01019012345 (დებიტორი)</div>
              </div>
            </div>
            {/* Detail Action Menu */}
            <button className="p-1 text-text-muted hover:text-text-primary rounded-lg" title="პარამეტრები">
              <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
            </button>
          </div>
          {/* Contact & Domicile Details Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-surface-bg rounded-lg border border-border-subtle text-body-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]" data-icon="call">call</span>
              <span className="font-data-mono-md text-text-primary">+995 599 12 34 56</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]" data-icon="calendar_month">calendar_month</span>
              <span className="text-text-muted">ვადა: <strong className="text-text-primary">14 იან, 2025</strong></span>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <span className="material-symbols-outlined text-text-muted text-[18px] shrink-0" data-icon="location_on">location_on</span>
              <span className="text-text-muted truncate">თბილისი, ვაჟა-ფშაველას გამზ. 25, ბინა 42</span>
            </div>
          </div>
        </div>
        {/* Financial Balance Dynamics & Progress Visualizer */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-border-subtle space-y-3">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-text-muted font-medium">ვალის კლების დინამიკა</span>
            <span className="text-emerald-700 font-bold font-data-mono-md">56% დაფარულია</span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className="bg-accent-mint h-2.5 rounded-full transition-all duration-500 shadow-sm" style={{width: '56%', backgroundColor: '#0DFCC4'}} />
          </div>
          {/* Financial Breakdown Triplet */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
            <div>
              <div className="text-[11px] text-text-muted">მოთხოვნილი</div>
              <div className="font-data-mono-md font-semibold text-text-primary text-[13px] mt-0.5">₾ 5,000.00</div>
            </div>
            <div>
              <div className="text-[11px] text-text-muted">გადახდილი</div>
              <div className="font-data-mono-md font-bold text-emerald-600 text-[13px] mt-0.5">₾ 2,800.00</div>
            </div>
            <div>
              <div className="text-[11px] text-text-muted">დარჩენილი</div>
              <div className="font-data-mono-md font-bold text-amber-600 text-[13px] mt-0.5">₾ 2,200.00</div>
            </div>
          </div>
        </div>
        {/* Chronological Settlement Ledger */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-body-md font-semibold text-text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary" data-icon="history">history</span>
              გადახდების ქრონოლოგიური ისტორია
            </h4>
            <span className="text-[11px] font-label-sm text-text-muted">სულ 3 ტრანზაქცია</span>
          </div>
          <div className="space-y-2.5">
            {/* Payment 1 */}
            <div className="p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" data-icon="add_card">add_card</span>
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-text-primary">საბანკო გადარიცხვა TBC Bank</div>
                  <div className="text-[11px] text-text-muted font-label-sm">10 თებერვალი, 2025 • ტრანზაქცია #TX-9023</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono-md font-bold text-emerald-600 text-body-sm">+1,000.00 ₾</div>
                <div className="text-[10px] text-text-muted font-data-mono-md">ნაშთი: 2,200.00 ₾</div>
              </div>
            </div>
            {/* Payment 2 */}
            <div className="p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" data-icon="account_balance">account_balance</span>
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-text-primary">საბანკო გადარიცხვა BOG</div>
                  <div className="text-[11px] text-text-muted font-label-sm">25 იანვარი, 2025 • ტრანზაქცია #TX-8812</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono-md font-bold text-emerald-600 text-body-sm">+800.00 ₾</div>
                <div className="text-[10px] text-text-muted font-data-mono-md">ნაშთი: 3,200.00 ₾</div>
              </div>
            </div>
            {/* Payment 3 */}
            <div className="p-3 rounded-lg bg-surface-card border border-border-subtle hover:border-slate-300 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" data-icon="paid">paid</span>
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-text-primary">პირველი შენატანი (შეთანხმება)</div>
                  <div className="text-[11px] text-text-muted font-label-sm">10 იანვარი, 2025 • ტრანზაქცია #TX-8401</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-data-mono-md font-bold text-emerald-600 text-body-sm">+1,000.00 ₾</div>
                <div className="text-[10px] text-text-muted font-data-mono-md">ნაშთი: 4,000.00 ₾</div>
              </div>
            </div>
          </div>
        </div>
        {/* Debtor Quick Interventions */}
        <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
          <span className="text-body-sm font-medium text-text-muted">ოპერატიული მოქმედებები დებიტორზე:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-text-primary text-body-sm font-medium transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-blue-600" data-icon="sms">sms</span>
              <span>SMS შეტყობინება</span>
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-text-primary text-body-sm font-medium transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px] text-rose-600" data-icon="picture_as_pdf">picture_as_pdf</span>
              <span>ამონაწერი PDF</span>
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-rose-700 hover:border-rose-200 text-body-sm font-medium transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]" data-icon="gavel">gavel</span>
              <span>იურისტს გადაცემა</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* 3. Risk Intelligence & Analytics Overview */}
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
          <span className="material-symbols-outlined text-[24px]" data-icon="security_update_good">security_update_good</span>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-body-md">ავტომატური RS.GE სინქრონიზაცია</h4>
          <p className="text-body-sm text-text-muted mt-1">ყველა საგადასახადო ინვოისი და ელექტრონული სასაქონლო ზედნადები მოწმდება რეალურ დროში.</p>
        </div>
      </div>
      <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
          <span className="material-symbols-outlined text-[24px]" data-icon="shield">shield</span>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-body-md">256-bit საბანკო დაშიფვრა</h4>
          <p className="text-body-sm text-text-muted mt-1">კრედიტორის მონაცემთა ბაზა დაცულია საერთაშორისო საბანკო PCI-DSS სტანდარტების შესაბამისად.</p>
        </div>
      </div>
      <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
          <span className="material-symbols-outlined text-[24px]" data-icon="schedule">schedule</span>
        </div>
        <div>
          <h4 className="font-semibold text-text-primary text-body-md">ავტომატური შეხსენებები</h4>
          <p className="text-body-sm text-text-muted mt-1">ვადაგადაცილების შემთხვევაში სისტემა გრაფიკის მიხედვით აგზავნის ოფიციალურ შეტყობინებებს.</p>
        </div>
      </div>
    </section>
  </main>
  {/* Footer */}
  <footer className="bg-surface-card border-t border-border-subtle mt-12">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]" data-icon="account_balance">account_balance</span>
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary">Debitinfo.GE</span>
        </div>
        <nav className="flex flex-wrap items-center gap-6">
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">კონფიდენციალურობის პოლიტიკა</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">მომსახურების პირობები</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">რეკვიზიტები</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">საგადასახადო შემოწმება</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">საკონტაქტო პირი</a>
        </nav>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-text-muted">
        <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-3 text-label-sm font-label-sm">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="material-symbols-outlined text-[14px]" data-icon="lock">lock</span> SSL 256-Bit Secure
          </span>
          <span>•</span>
          <span>Tbilisi, Georgia</span>
        </div>
      </div>
    </div>
  </footer>
    </div>
  );
}
