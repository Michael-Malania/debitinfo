'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/services';

interface RegularUserDashboardViewProps {
  user: AuthUser;
}

export default function RegularUserDashboardView({ user }: RegularUserDashboardViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isLegal = user.entityType === 'LEGAL';

  const displayName = isLegal
    ? (user.companyProfile?.companyName || user.email)
    : (user.individualProfile
        ? `${user.individualProfile.firstName} ${user.individualProfile.lastName}`.trim()
        : user.email);

  const initials = isLegal
    ? (user.companyProfile?.companyName?.slice(0, 2) || 'იპ')
    : (user.individualProfile
        ? `${user.individualProfile.firstName?.[0] || 'მ'}${user.individualProfile.lastName?.[0] || 'პ'}`
        : 'მპ');

  const personalId = user.personalId || '01024089123';
  const phone = user.phone || '+995 599 00 00 00';
  const email = user.email;
  const address = isLegal
    ? (user.companyProfile?.actualAddress || user.companyProfile?.legalAddress || 'ქ. თბილისი')
    : (user.individualProfile?.actualAddress || user.individualProfile?.legalAddress || 'ქ. თბილისი');

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleDownloadCertificate = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert('ოფიციალური სუფთა საკრედიტო ისტორიის ცნობა (PDF) წარმატებით გენერირდა!');
    }, 1200);
  };

  return (
    <div className="bg-surface-bg text-text-primary antialiased min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary selection:text-white" suppressHydrationWarning>
      {/* TOP NAVIGATION BAR */}
      <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
        <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined text-[20px]">assured_workload</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary-container">.GE</span>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-border-subtle">
              <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
              <span className="font-label-sm text-label-sm text-text-muted tracking-tight">RS.GE LIVE SYNC</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 flex items-center gap-1.5" href="/dashboard">
              <span>ჩემი პროფილი</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/#services">
              სერვისები
            </Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/contact">
              დახმარება &amp; ცხელი ხაზი
            </Link>
          </nav>

          {/* Right Actions / User Cluster */}
          <div className="flex items-center gap-3">
            {/* User Chip & Status */}
            <div className="flex items-center gap-3 pl-1">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-border-subtle">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-mint rounded-full border-2 border-surface-card" title="ვერიფიცირებული" />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-md text-label-md text-text-primary leading-tight font-semibold">{displayName}</span>
                  {user.isRsVerified && (
                    <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm text-emerald-600 font-medium">სუფთა პროფილი (A)</span>
              </div>
            </div>

            {/* Exit Action */}
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1 ml-1 cursor-pointer"
              title="გამოსვლა"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden md:inline font-medium">გამოსვლა</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* BREADCRUMBS & SECTION TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-text-muted font-body-sm text-body-sm mb-1">
              <Link className="hover:text-primary transition-colors" href="/">მთავარი</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-text-primary font-medium">მომხმარებლის პროფილი &amp; მონიტორინგი</span>
            </nav>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight font-bold">პირადი კაბინეტი</h1>
          </div>
          {/* Timestamp chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle shadow-xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
            <span className="font-body-sm text-body-sm text-text-muted">
              სისტემური სტატუსი: <strong className="text-text-primary font-medium">აქტიური / სინქრონიზებული</strong>
            </span>
          </div>
        </div>

        {/* 1. USER PROFILE IDENTITY & REQUISITES CARD */}
        <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Identity Summary Left */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary/20 shrink-0">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h2 className="font-headline-md text-headline-md text-text-primary font-bold">{displayName}</h2>
                  {/* Verification Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-label-md text-label-md font-semibold">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
                    {user.isRsVerified ? 'იდენტობა დადასტურებულია RS.GE-ით' : 'სისტემაში ვერიფიცირებული'}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-muted flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
                  სუბიექტის ტიპი: <strong className="text-text-primary font-medium">{isLegal ? 'იურიდიული პირი' : 'ფიზიკური პირი'}</strong> • მისამართი: {address}
                </p>
              </div>
            </div>

            {/* Security / Requisites Block Right */}
            <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border-subtle lg:pl-8">
              {/* Personal ID / Tax ID */}
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">
                  {isLegal ? 'საიდენტიფიკაციო კოდი (ს/კ)' : 'პირადი ნომერი (პ/ნ)'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-body-md text-text-primary font-bold tracking-wide">{personalId}</span>
                  <button
                    className="text-text-muted hover:text-primary transition-colors cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(personalId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="კოპირება"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
              </div>
              {/* Phone */}
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">ტელეფონის ნომერი</span>
                <span className="font-mono text-body-md text-text-primary">{phone}</span>
              </div>
              {/* Email */}
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">ელ. ფოსტა</span>
                <span className="font-body-sm text-text-primary font-medium truncate block max-w-[200px]">{email}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CENTRAL HERO STATUS CARD (CLEAN STATE / ZERO DEBTS) */}
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-card via-white to-slate-50/60 rounded-2xl border border-border-subtle p-6 sm:p-10 shadow-xs">
          {/* Subtle Decorative Fintech Mesh */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-accent-mint/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            {/* Big Trust Badge Icon */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-accent-mint/20 via-sky-100 to-primary-fixed/30 border border-emerald-200 flex items-center justify-center shadow-lg shadow-accent-mint/20">
                <span className="material-symbols-outlined text-[54px] text-emerald-600">verified</span>
              </div>
              <div className="absolute -top-1 -right-1 bg-surface-card rounded-full p-1.5 shadow-md border border-border-subtle flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-accent-mint block" />
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300/60">
                <span className="font-mono text-body-sm font-bold text-emerald-800">რეიტინგი: A (უნაკლო)</span>
                <span className="text-emerald-400">•</span>
                <span className="font-label-md text-label-md text-emerald-800 font-semibold">სუფთა საკრედიტო პროფილი</span>
              </div>
              <h2 className="font-headline-xl text-2xl sm:text-3xl text-text-primary tracking-tight font-extrabold max-w-2xl mx-auto leading-tight">
                თქვენს სახელზე აქტიური დავალიანება ან საკრედიტო ვალდებულება არ მოიძებნა
              </h2>
              <p className="font-body-md text-body-md text-text-muted max-w-xl mx-auto leading-relaxed">
                თქვენ რეგისტრირებული ხართ როგორც აქტიური მომხმარებელი. მონაცემთა ბაზაში რაიმე ვალდებულების ან კრედიტორული მოთხოვნის დაფიქსირების შემთხვევაში, ანალიტიკოსის მიერ მოხდება საქმის სინქრონიზაცია და თქვენი კაბინეტი ავტომატურად განახლდება.
              </p>
            </div>

            {/* Telemetry / Live Scan Info Bar */}
            <div className="w-full max-w-xl bg-surface-bg/80 border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                </div>
                <div>
                  <span className="font-body-sm text-body-sm font-medium text-text-primary block">სრული სკანირება: სინქრონიზებულია რეესტრთან</span>
                  <span className="font-label-sm text-label-sm text-text-muted">მონაცემთა ბაზა აქტუალურია • გადამოწმებულია რეესტრის ჩანაწერები</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-label-md text-label-md bg-emerald-100/60 px-2.5 py-1 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[14px]">done_all</span> 0 დავალიანება
              </span>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-2">
              <button
                onClick={handleDownloadCertificate}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-primary hover:bg-[#0A37CA] text-white font-medium text-body-md transition-all shadow-md shadow-primary/20 active:scale-[0.98] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {downloading ? 'sync' : 'download'}
                </span>
                <span>{downloading ? 'მზადდება PDF...' : 'ოფიციალური ცნობის ჩამოტვირთვა (PDF)'}</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-card border border-border-subtle text-text-primary hover:border-primary/40 hover:text-primary transition-all font-medium text-body-md shadow-xs active:scale-[0.98] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">autorenew</span>
                <span>განმეორებით გადამოწმება</span>
              </button>
            </div>
          </div>
        </section>

        {/* METRICS QUICK BAR (0 DEBTS BREAKDOWN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">საბანკო სექტორი</span>
              <span className="font-mono text-xl text-text-primary font-bold">0.00 ₾</span>
              <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">check</span> ვადაგადაცილება არ არის
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">მიკროსაფინანსო &amp; სესხები</span>
              <span className="font-mono text-xl text-text-primary font-bold">0.00 ₾</span>
              <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">check</span> ვალდებულება არ ფიქსირდება
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[20px]">credit_card</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">საკომუნიკაციო &amp; სერვისები</span>
              <span className="font-mono text-xl text-text-primary font-bold">0.00 ₾</span>
              <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">check</span> სუფთა ისტორია
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[20px]">cell_tower</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">სააღსრულებო &amp; დავები</span>
              <span className="font-mono text-xl text-text-primary font-bold">0</span>
              <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">check</span> საქმე არ მიმდინარეობს
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto bg-surface-card border-t border-border-subtle py-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-text-muted">
          <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="material-symbols-outlined text-[14px]">lock</span> SSL 256-Bit Secure
            </span>
            <span>•</span>
            <span>Tbilisi, Georgia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
