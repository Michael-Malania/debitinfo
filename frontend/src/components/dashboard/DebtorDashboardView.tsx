'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, debtorBackendService, AuthUser } from '@/services';

interface DebtorDashboardViewProps {
  user: AuthUser;
}

export default function DebtorDashboardView({ user }: DebtorDashboardViewProps) {
  const router = useRouter();
  const [liabilities, setLiabilities] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState('claims');
  const [paymentAmount, setPaymentAmount] = useState('300');
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLiabilities() {
      try {
        const data = await debtorBackendService.getMyLiabilities();
        if (isMounted && data) {
          setLiabilities(data);
        }
      } catch (e) {
        console.warn('Could not fetch liabilities from backend:', e);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }
    loadLiabilities();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeSubmitting(true);
    try {
      const claimId = liabilities?.claims?.[0]?.id;
      if (claimId) {
        await debtorBackendService.openDispute(claimId, disputeReason);
      }
      setDisputeSuccess(true);
      setTimeout(() => {
        setIsDisputeOpen(false);
        setDisputeSuccess(false);
        setDisputeReason('');
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'დავის გახსნა ვერ მოხერხდა');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loadingData && !liabilities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">მონაცემების ჩატვირთვა...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს თქვენი ვალდებულებების უსაფრთხო ჩატვირთვა</p>
          </div>
        </div>
      </div>
    );
  }

  // Real Dynamic Values from Authenticated User & Database
  const debtorFullName = user?.individualProfile 
    ? `${user.individualProfile.firstName} ${user.individualProfile.lastName}`.trim() 
    : (user?.companyProfile?.companyName || user?.email || 'დებიტორი');

  const debtorInitials = user?.individualProfile 
    ? `${user.individualProfile.firstName?.[0] || 'დ'}${user.individualProfile.lastName?.[0] || 'ბ'}` 
    : (user?.email?.slice(0, 2).toUpperCase() || 'დბ');

  const debtorPersonalId = user?.personalId || '01019012345';
  const debtorAddress = user?.individualProfile?.actualAddress || user?.individualProfile?.legalAddress || 'ქ. თბილისი';
  const debtorPhone = user?.phone || '+995 599 00 00 00';
  const debtorEmail = user?.email || 'debtor@beridze.ge';

  const primaryClaim = liabilities?.claims?.[0];
  const summary = liabilities?.summary || {
    totalInitial: 1540,
    totalRemaining: 890,
    totalPaid: 650,
    rating: 'B',
    riskScore: 68,
    activeClaimsCount: 1,
  };

  const creditorCompanyName = primaryClaim?.creditor?.companyProfile?.companyName || 'შპს ჯეო ტრეიდინგი';
  const caseNumber = primaryClaim?.caseNumber || 'DB-2024-8841';

  return (
    <div className="min-h-full flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary-container selection:text-white" suppressHydrationWarning>
      {/* ================= 1. ზედა ნავიგაცია (Header) ================= */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo & Institutional Tag */}
      <div className="flex items-center gap-6">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm group-hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted leading-tight">დებიტორის პირადი პორტალი</span>
          </div>
        </Link>
        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 ml-4">
          <span className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>ჩემი ვალდებულებები</span>
          </span>
          <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150 flex items-center gap-1.5" href="#schedule">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>დაფარვის გრაფიკი</span>
          </a>
          <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150 flex items-center gap-1.5" href="#pay">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>ონლაინ გადახდა</span>
          </a>
          <button 
            onClick={() => setIsDisputeOpen(true)}
            className="text-text-muted font-label-md text-label-md hover:text-rose-600 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>დავის გახსნა</span>
          </button>
        </nav>
      </div>
      {/* Right Header Actions & User Session */}
      <div className="flex items-center gap-3">
        {/* Notification Bell with Ping Badge */}
        <button aria-label="შეტყობინებები" className="relative p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-bg transition-colors duration-150 active:scale-95 cursor-pointer" type="button">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
        </button>
        {/* System Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-bg border border-border-subtle">
          <span className="w-2 h-2 rounded-full bg-rating-a animate-pulse" />
          <span className="text-[11px] font-medium text-text-muted">RS.GE Live</span>
        </div>
        <div className="h-6 w-px bg-border-subtle mx-1" />
        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-9 h-9 rounded-full bg-surface-container-high border border-border-subtle flex items-center justify-center font-bold text-primary text-body-md uppercase">
            <span>{debtorInitials}</span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-body-md font-semibold text-text-primary">{debtorFullName}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {user?.role === 'ADMIN' ? 'ადმინისტრატორი' : 'დებიტორი (მოვალე)'}
              </span>
            </div>
            <span className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {debtorPersonalId}</span>
          </div>
          {/* Logout Button */}
          <button onClick={handleLogout} className="p-2 ml-1 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-colors active:scale-95 cursor-pointer" title="გამოსვლა" type="button">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* ================= Main Portal Container ================= */}
  <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
    {/* Page Breadcrumb & Quick Sync Banner */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
      <div className="flex items-center gap-2 text-text-muted font-body-sm text-body-sm">
        <Link href="/" className="hover:underline">მთავარი</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-text-primary font-medium">დებიტორის პირადი პორტალი</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-semibold">საქმე #{caseNumber}</span>
      </div>
      <div className="flex items-center gap-2 text-text-muted text-body-sm font-data-mono-md">
        <span className="material-symbols-outlined text-[16px] text-rating-a">check_circle</span>
        <span>RS.GE სინქრონიზაცია აქტიურია</span>
      </div>
    </div>
    {/* ================= 2. პროფილის ბლოკი (User Profile Header Summary Card) ================= */}
    <section className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Debtor Bio & Identifiers */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary font-bold text-2xl shadow-inner uppercase">
              <span>{debtorInitials}</span>
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-primary" data-weight="fill">verified</span>
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-headline-md font-headline-md text-text-primary tracking-tight">{debtorFullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary border border-primary/20">
                საქმე: {caseNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/15 text-amber-800 border border-rating-b/30 font-medium">
                სტატუსი: აქტიური დებიტორი (მოვალე)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-body-md text-text-muted pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">badge</span>
                <span>პირადი ნომერი:</span>
                <span className="font-data-mono-md text-text-primary font-medium">{debtorPersonalId}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">location_on</span>
                <span>{debtorAddress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">call</span>
                <span className="font-data-mono-md text-text-primary">{debtorPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">mail</span>
                <span className="text-text-primary">{debtorEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                <span className="material-symbols-outlined text-[16px] text-rating-a">verified_user</span>
                <span>{user?.isRsVerified ? 'RS.GE რეესტრის აქტიური ჩანაწერი' : 'RS.GE ვერიფიკაცია მოლოდინში'}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Assigned Curator Card & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="lg:w-80 bg-surface-bg border border-border-subtle rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">მომსახურე კურატორი</span>
                <p className="font-headline-sm text-body-md font-semibold text-text-primary">ლევან მაისურაძე</p>
                <p className="text-[12px] font-data-mono-md text-text-muted">+995 32 2 100 200 (შიდა: 104)</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle text-primary hover:bg-primary-container hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer" title="დაკავშირება" type="button">
              <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
            </button>
          </div>
          <button
            onClick={() => setIsDisputeOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-body-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>დავის გახსნა</span>
          </button>
        </div>
      </div>
    </section>
    {/* ================= 3. საკრედიტო რეიტინგის დიდი ვიზუალური ბარათი (Gauge Card) ================= */}
    <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm overflow-hidden relative">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left Gauge & Score Block (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-bg border border-border-subtle rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rating-b text-[20px]" data-weight="fill">speed</span>
              <h2 className="font-headline-sm text-body-lg font-bold text-text-primary">საკრედიტო სანდოობის რეიტინგი</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/15 text-amber-800 font-bold border border-rating-b/30">
              Grade B (საშუალო რისკი)
            </span>
          </div>
          {/* Visual Multi-Grade Gauge */}
          <div className="my-6">
            <div className="space-y-2">
              <div className="flex justify-between text-body-sm font-label-sm text-text-muted">
                <span className="text-error font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" />Grade C (მაღალი რისკი)</span>
                <span className="text-amber-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rating-b" />Grade B (საშუალო)</span>
                <span className="text-teal-700 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rating-a" />Grade A (მაღალი სანდოობა)</span>
              </div>
              <div className="h-3.5 w-full bg-surface-container rounded-full overflow-hidden flex gap-1 p-0.5 border border-border-subtle">
                <div className="h-full w-1/3 rounded-l-full bg-rating-c/70" />
                <div className="h-full w-1/3 bg-rating-b relative">
                  <div className="absolute -top-1 right-1/4 w-3.5 h-5 bg-text-primary rounded-full ring-2 ring-white shadow flex items-center justify-center">
                    <span className="w-1 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="h-full w-1/3 rounded-r-full bg-rating-a/40" />
              </div>
              <div className="flex justify-between text-label-sm font-data-mono-md text-text-muted pt-1">
                <span>ქულა: 300 - 550</span>
                <span className="font-bold text-amber-700">მიმდინარე: 685 / 1000</span>
                <span>750 - 1000</span>
              </div>
            </div>
          </div>
          {/* Bottom Micro metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-center">
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">დისციპლინა</span>
              <span className="text-body-md font-bold text-text-primary">88%</span>
            </div>
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">დაგვიანებები</span>
              <span className="text-body-md font-bold text-rating-c">0 დღე</span>
            </div>
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">პროგნოზი</span>
              <span className="text-body-md font-bold text-teal-700">ზრდადი</span>
            </div>
          </div>
        </div>
        {/* Right: Narrative & Actionable Recommendations (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-body-sm font-medium mb-3">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              ოფიციალური შეფასება სადებიტო რეესტრის მიხედვით
            </div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary mb-2">
              დებიტორის სანდოობის ანალიზი და რეკომენდაციები
            </h3>
            <p className="text-body-md font-body-md text-text-muted leading-relaxed">
              თქვენი მიმდინარე გადახდების დისციპლინა დამაკმაყოფილებელია. გრაფიკის დაცვის შემთხვევაში თქვენი რეიტინგი გაიზრდება <strong className="text-teal-700 font-semibold">Grade A</strong>-მდე, რაც გაგიხსნით გამარტივებულ საბანკო ლიმიტებს, პროცენტის შემცირების პერსპექტივას და სრულად მოხსნის შეზღუდვებს საჯარო რეესტრში.
            </p>
          </div>
          {/* Action Tips Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg border border-border-subtle bg-surface-bg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">event_available</span>
              </div>
              <div className="text-body-sm">
                <span className="font-semibold text-text-primary block">მომდევნო 2 შენატანი დროულად</span>
                <span className="text-text-muted">ავტომატურად გაზრდის ქულას +45 ერთეულით Grade A-მდე.</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-border-subtle bg-surface-bg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">trending_down</span>
              </div>
              <div className="text-body-sm">
                <span className="font-semibold text-text-primary block">წინსწრებით დაფარვა</span>
                <span className="text-text-muted">ამცირებს დარჩენილ საპროცენტო ტვირთს 140 ₾-ით.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* ================= 4. დავალიანების ძირითადი მიმოხილვა (Debt Financial Overview Cards - KPI Row) ================= */}
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
          პირადი ფინანსური ვალდებულება და ბალანსი
        </h2>
        <span className="text-body-sm text-text-muted">ვალუტა: GEL (₾)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Initial Debt */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">საწყისი დავალიანება</span>
            <div className="w-8 h-8 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-bold text-text-primary">{summary.totalInitial.toLocaleString()} <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>კრედიტორი (გამსესხებელი):</span>
              <span className="font-medium text-text-primary truncate max-w-[160px]">{creditorCompanyName}</span>
            </div>
            <div className="flex justify-between">
              <span>ხელშეკრულება:</span>
              <span className="font-data-mono-md">{primaryClaim?.agreementNumber || 'AGR-99214'}</span>
            </div>
          </div>
        </div>
        {/* KPI 2: Already Repaid */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">უკვე დაფარული თანხა</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-headline-lg font-data-mono-lg font-bold text-text-primary">{summary.totalPaid.toLocaleString()}</span>
              <span className="text-body-md text-text-muted">₾</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-rating-a/20 text-teal-800 ml-auto">
                {summary.totalInitial > 0 ? Math.round((summary.totalPaid / summary.totalInitial) * 100) : 0}% დაფარულია
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-rating-a h-full rounded-full" style={{width: `${summary.totalInitial > 0 ? Math.round((summary.totalPaid / summary.totalInitial) * 100) : 0}%`}} />
            </div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted flex justify-between">
            <span>სტატუსი:</span>
            <span className="font-data-mono-md font-semibold text-text-primary">{primaryClaim?.status || 'ACTIVE'}</span>
          </div>
        </div>
        {/* KPI 3: Remaining Balance */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">მიმდინარე დარჩენილი თანხა</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">balance</span>
            </div>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-bold text-primary">{summary.totalRemaining.toLocaleString()} <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>ვადაგადაცილება:</span>
              <span className="font-data-mono-md font-semibold text-text-primary">{primaryClaim?.daysOverdue || 0} დღე</span>
            </div>
            <div className="flex justify-between">
              <span>ჯარიმა / პირგასამტეხლო:</span>
              <span className="font-data-mono-md text-text-primary">{Number(primaryClaim?.penaltyAmount || 0)} ₾</span>
            </div>
          </div>
        </div>
        {/* KPI 4: Next Payment */}
        <div className="bg-surface-card rounded-xl border-2 border-primary-container/40 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-start justify-between">
            <span className="text-body-sm font-semibold text-primary">მომდევნო შენატანი</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-amber-100 text-amber-800">
              დარჩენილია 4 დღე
            </span>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-extrabold text-primary-container">300 <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-blue-100 text-body-sm flex items-center justify-between">
            <span className="text-text-muted">გადახდის ბოლო დღე:</span>
            <span className="font-data-mono-md font-bold text-text-primary">25 ოქტ, 2024</span>
          </div>
        </div>
      </div>
    </section>
    {/* Main Content Layout (Table & Quick Pay Module) */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ================= 5. დაფარვის გრაფიკი (Repayment Schedule) ================= */}
      <section id="schedule" className="lg:col-span-8 bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_view_month</span>
                დაფარვის ოფიციალური გრაფიკი
              </h2>
              <p className="text-body-sm text-text-muted mt-0.5">ინდივიდუალური რესტრუქტურიზაციის მიმდინარე ეტაპი</p>
            </div>
            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-surface-card text-text-primary text-body-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px] text-error">picture_as_pdf</span>
                <span>PDF ჩამოტვირთვა</span>
              </button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-surface-card text-text-primary text-body-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px] text-teal-700">table_view</span>
                <span>Excel ამონაწერი</span>
              </button>
            </div>
          </div>
          {/* Interactive Schedule Toggle Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="inline-flex p-1 rounded-lg bg-surface-bg border border-border-subtle" role="tablist">
              <button aria-selected="true" className="px-3.5 py-1.5 rounded-md text-body-sm font-semibold bg-surface-card text-primary shadow-sm transition-all" role="tab" type="button">
                სტანდარტული გრაფიკი (12 თვემდე)
              </button>
              <button aria-selected="false" className="px-3.5 py-1.5 rounded-md text-body-sm font-medium text-text-muted hover:text-text-primary transition-all" role="tab" type="button">
                არასტანდარტული / გახანგრძლივებული (12 თვეზე მეტი)
              </button>
            </div>
            <div className="text-body-sm text-text-muted flex items-center gap-1 font-data-mono-md">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              სულ 12 პერიოდი (7 დაფარული)
            </div>
          </div>
        </div>
        {/* Table Responsive Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-border-subtle text-text-muted font-label-md text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12" scope="col">№</th>
                <th className="py-3 px-3.5" scope="col">გადახდის ვადა</th>
                <th className="py-3 px-3.5 text-right" scope="col">ძირი თანხა</th>
                <th className="py-3 px-3.5 text-right" scope="col">პროცენტი</th>
                <th className="py-3 px-3.5 text-right" scope="col">ჯამური შენატანი</th>
                <th className="py-3 px-3.5 text-right" scope="col">დარჩენილი ბალანსი</th>
                <th className="py-3 px-3.5 text-center" scope="col">სტატუსი</th>
                <th className="py-3 px-3.5 text-center" scope="col">ქვითარი</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-text-primary">
              {/* Row 6 (Paid) */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-white">
                <td className="py-3 px-3.5 text-center font-data-mono-md text-text-muted">06</td>
                <td className="py-3 px-3.5 font-data-mono-md">25 აგვ, 2024</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md">275.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">25.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md font-semibold">300.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md">3,200.00 ₾</td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-a/20 text-teal-800 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">check</span> გადახდილი
                  </span>
                </td>
                <td className="py-3 px-3.5 text-center">
                  <button className="p-1 rounded text-primary hover:bg-blue-50 transition-colors cursor-pointer" title="ქვითრის ჩამოტვირთვა #REC-8841-06" type="button">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>
                </td>
              </tr>
              {/* Row 7 (Paid) */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                <td className="py-3 px-3.5 text-center font-data-mono-md text-text-muted">07</td>
                <td className="py-3 px-3.5 font-data-mono-md">25 სექ, 2024</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md">278.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">22.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md font-semibold">300.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md">2,900.00 ₾</td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-a/20 text-teal-800 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">check</span> გადახდილი
                  </span>
                </td>
                <td className="py-3 px-3.5 text-center">
                  <button className="p-1 rounded text-primary hover:bg-blue-50 transition-colors cursor-pointer" title="ქვითრის ჩამოტვირთვა #REC-8841-07" type="button">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </button>
                </td>
              </tr>
              {/* Row 8 (Active / Next Due - Highlighted) */}
              <tr className="bg-blue-50/50 hover:bg-blue-50 transition-colors ring-1 ring-inset ring-primary/20">
                <td className="py-3 px-3.5 text-center font-data-mono-md font-bold text-primary">08</td>
                <td className="py-3 px-3.5 font-data-mono-md font-bold text-text-primary flex items-center gap-1">
                  <span>25 ოქტ, 2024</span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                </td>
                <td className="py-3 px-3.5 text-right font-data-mono-md font-semibold">281.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">19.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md font-bold text-primary">300.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md font-semibold">2,600.00 ₾</td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary text-white font-semibold shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">schedule</span> მომდევნო გადასახდელი
                  </span>
                </td>
                <td className="py-3 px-3.5 text-center">
                  <span className="text-[11px] text-text-muted italic">მოლოდინში</span>
                </td>
              </tr>
              {/* Row 9 (Planned) */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-white">
                <td className="py-3 px-3.5 text-center font-data-mono-md text-text-muted">09</td>
                <td className="py-3 px-3.5 font-data-mono-md text-text-muted">25 ნოე, 2024</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">284.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">16.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">300.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">2,300.00 ₾</td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-slate-100 text-text-muted">
                    დაგეგმილი
                  </span>
                </td>
                <td className="py-3 px-3.5 text-center text-text-muted">—</td>
              </tr>
              {/* Row 10 (Planned) */}
              <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                <td className="py-3 px-3.5 text-center font-data-mono-md text-text-muted">10</td>
                <td className="py-3 px-3.5 font-data-mono-md text-text-muted">25 დეკ, 2024</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">287.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">13.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">300.00 ₾</td>
                <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">2,000.00 ₾</td>
                <td className="py-3 px-3.5 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-slate-100 text-text-muted">
                    დაგეგმილი
                  </span>
                </td>
                <td className="py-3 px-3.5 text-center text-text-muted">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      {/* ================= 6. სწრაფი გადახდის ზონა (Quick Payment Module) ================= */}
      <section id="pay" className="lg:col-span-4 bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">მყისიერი ანგარიშსწორება</span>
            <h2 className="text-headline-sm font-headline-sm text-text-primary">სწრაფი გადახდის მოდული</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">payments</span>
          </div>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="block text-body-sm font-semibold text-text-primary">
              გადასახდელი თანხა (GEL)
            </label>
            <div className="relative rounded-lg shadow-sm">
              <input className="w-full rounded-lg border border-border-subtle bg-white px-3.5 py-2.5 font-data-mono-lg text-headline-sm font-bold text-text-primary placeholder:text-text-muted focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all text-right pr-12" id="payment-amount" placeholder="0.00" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <span className="font-data-mono-md font-bold text-text-muted">₾</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button className="px-2.5 py-1.5 rounded-lg border border-primary/30 bg-blue-50 text-primary text-body-sm font-medium hover:bg-blue-100 transition-colors text-center cursor-pointer" onClick={() => setPaymentAmount('300')} type="button">
                მომდევნო: 300 ₾
              </button>
              <button className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-surface-bg text-text-primary text-body-sm font-medium hover:bg-slate-200 transition-colors text-center cursor-pointer" onClick={() => setPaymentAmount('2900')} type="button">
                სრული: 2,900 ₾
              </button>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="block text-body-sm font-semibold text-text-primary">
              გადახდის მეთოდის არჩევა
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:border-primary-container cursor-pointer transition-colors bg-white has-[:checked]:border-primary-container has-[:checked]:bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <input defaultChecked className="w-4 h-4 text-primary focus:ring-primary border-border-subtle" name="payment_method" type="radio" defaultValue="bog" />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-bold text-text-primary">საქართველოს ბანკი</span>
                    <span className="text-[11px] text-text-muted">BoG iPay / BOG Pay მყისიერად</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-data-mono-md text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">0% საკომისიო</span>
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:border-primary-container cursor-pointer transition-colors bg-white has-[:checked]:border-primary-container has-[:checked]:bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <input className="w-4 h-4 text-primary focus:ring-primary border-border-subtle" name="payment_method" type="radio" defaultValue="tbc" />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-bold text-text-primary">თიბისი ბანკი</span>
                    <span className="text-[11px] text-text-muted">TBC Pay / ინტერნეტ ბანკი</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-data-mono-md text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">0% საკომისიო</span>
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:border-primary-container cursor-pointer transition-colors bg-white has-[:checked]:border-primary-container has-[:checked]:bg-blue-50/30">
                <div className="flex items-center gap-3">
                  <input className="w-4 h-4 text-primary focus:ring-primary border-border-subtle" name="payment_method" type="radio" defaultValue="card" />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-bold text-text-primary">საბანკო ბარათი</span>
                    <span className="text-[11px] text-text-muted">ნებისმიერი Visa / Mastercard</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-text-muted text-[20px]">credit_card</span>
              </label>
            </div>
          </div>
          <div className="pt-2">
            <button className="w-full py-3 px-4 rounded-lg bg-primary-container text-white font-headline-sm text-body-lg font-semibold hover:bg-primary transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer" type="submit">
              <span className="material-symbols-outlined text-[20px]">lock</span>
              <span>წინსწრებით გადახდა / დაფარვა</span>
            </button>
            <p className="text-[11px] text-center text-text-muted mt-2">
              დაჭერით გადამისამართდებით ბანკის დაცულ საგადახდო არხზე
            </p>
          </div>
        </form>
      </section>
    </div>
  </main>

  {/* ================= Dispute Modal ================= */}
  {isDisputeOpen && (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 border border-border-subtle shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-rose-700">
            <span className="material-symbols-outlined">gavel</span>
            <h3 className="font-bold text-headline-sm">დავის გახსნა / გასაჩივრება</h3>
          </div>
          <button onClick={() => setIsDisputeOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-text-muted cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {disputeSuccess ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <h4 className="font-bold text-text-primary">დავა წარმატებით დარეგისტრირდა!</h4>
            <p className="text-body-sm text-text-muted">იურისტი განიხილავს თქვენს საჩივარს 2 სამუშაო დღის ვადაში.</p>
          </div>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-4">
            <p className="text-body-sm text-text-muted">
              თუ არ ეთანხმებით დავალიანების ოდენობას ან თვლით რომ თანხა უკვე გადახდილი გაქვთ, მიუთითეთ მიზეზი და დაურთეთ მტკიცებულება.
            </p>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1">დავის საფუძველი *</label>
              <textarea
                required
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="აღწერეთ დავის დეტალები (მაგ: თანხა გადახდილია ბანკში 15 სექტემბერს...)"
                className="w-full p-3 bg-surface-bg border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1">თანდართული ქვითარი ან დოკუმენტი</label>
              <input type="file" className="w-full text-body-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-body-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-body-sm shadow-sm"
              >
                დავის რეგისტრაცია
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )}

  {/* ================= 7. ქვედა ფუტერი (Footer) ================= */}
  <footer className="mt-auto bg-surface-card border-t border-border-subtle">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-between text-body-sm text-text-muted gap-3">
        <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-4 text-[12px]">
          <span>სისტემის ვერსია: v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </div>
    </div>
  </footer>
    </div>
  );
}
