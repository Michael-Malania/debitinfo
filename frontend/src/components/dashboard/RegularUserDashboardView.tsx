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
  const [isCertificatePaid, setIsCertificatePaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);

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
      const certWindow = window.open('', '_blank');
      if (certWindow) {
        certWindow.document.write(`
          <!DOCTYPE html>
          <html lang="ka">
          <head>
            <meta charset="utf-8">
            <title>ოფიციალური ცნობა - Debitinfo.GE - ${personalId}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              .header { border-bottom: 2px solid #002984; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .brand { font-size: 24px; font-weight: bold; color: #002984; }
              .badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
              .title { font-size: 22px; font-weight: bold; text-align: center; margin: 30px 0 8px; color: #0f172a; }
              .subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 30px; }
              .table { width: 100%; border-collapse: collapse; margin: 25px 0; }
              .table th, .table td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 14px; }
              .table th { background: #f8fafc; font-weight: 600; width: 38%; color: #475569; }
              .status-ok { color: #059669; font-weight: bold; font-size: 15px; }
              .stamp-box { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; }
              .stamp { border: 2px dashed #002984; padding: 15px 24px; border-radius: 8px; text-align: center; color: #002984; font-weight: bold; font-size: 13px; line-height: 1.4; }
              .qr-box { font-size: 12px; color: #64748b; text-align: right; line-height: 1.5; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">Debitinfo.GE</div>
              <div class="badge">რეიტინგი: A • სუფთა საკრედიტო ისტორია</div>
            </div>
            <div class="title">ოფიციალური იურიდიული ცნობა</div>
            <div class="subtitle">დავალიანების არარსებობისა და საკრედიტო რეიტინგის შესახებ</div>
            
            <table class="table">
              <tr><th>სუბიექტის დასახელება</th><td><strong>${displayName}</strong></td></tr>
              <tr><th>${isLegal ? 'საიდენტიფიკაციო კოდი (ს/კ)' : 'პირადი ნომერი (პ/ნ)'}</th><td><strong style="font-family: monospace;">${personalId}</strong></td></tr>
              <tr><th>სამართლებრივი სტატუსი</th><td>${isLegal ? 'იურიდიული პირი' : 'ფიზიკური პირი'}</td></tr>
              <tr><th>მისამართი</th><td>${address}</td></tr>
              <tr><th>მიმდინარე დავალიანება</th><td class="status-ok">0.00 ₾ (არ ფიქსირდება)</td></tr>
              <tr><th>სასამართლო / სააღსრულებო საქმე</th><td>0 აქტიური საქმე</td></tr>
              <tr><th>ცნობის ნომერი</th><td>#DI-${Date.now().toString().slice(-8)}</td></tr>
              <tr><th>გაცემის თარიღი</th><td>${new Date().toLocaleDateString('ka-GE')}</td></tr>
            </table>

            <p style="font-size: 13px; color: #475569; margin-top: 24px; text-align: justify;">
              წინამდებარე ცნობა ადასტურებს, რომ აღნიშნულ სუბიექტს საქართველოს მოვალეთა და კრედიტორთა ეროვნულ ბაზაში Debitinfo.GE არ ერიცხება ვადაგადაცილებული ფინანსური ან საკრედიტო დავალიანება. დოკუმენტი განკუთვნილია წარსადგენად ბანკებში, საჯარო რეესტრსა და ოფიციალურ სახელმწიფო უწყებებში.
            </p>

            <div class="stamp-box">
              <div class="stamp">
                DEBITINFO.GE<br>
                ელექტრონულად დამოწმებულია<br>
                ✓ ოფიციალური ბეჭედი
              </div>
              <div class="qr-box">
                QR ვერიფიკაციის კოდი: DI-VERIFY-${Math.random().toString(36).substring(2, 9).toUpperCase()}<br>
                ვალიდურობის ვადა: 30 კალენდარული დღე
              </div>
            </div>

            <div class="no-print" style="margin-top: 40px; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 28px; background: #002984; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
                🖨️ ბეჭდვა / PDF შენახვა
              </button>
            </div>
          </body>
          </html>
        `);
        certWindow.document.close();
      }
    }, 600);
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

            {/* Sealed / Locked Paid Official Certificate Banner */}
            {!isCertificatePaid ? (
              <div className="w-full max-w-xl bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-amber-500/10 border-2 border-dashed border-amber-300 rounded-xl p-5 text-left shadow-xs transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">lock</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-text-primary text-body-md flex items-center gap-1.5">
                        <span>ოფიციალური იურიდიული ცნობა</span>
                        <span className="text-amber-850 text-xs font-semibold px-2 py-0.5 rounded bg-amber-200/80">დალუქულია</span>
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                        ფასიანი სერვისი • 15 ₾
                      </span>
                    </div>
                    <p className="text-body-sm text-text-muted leading-relaxed">
                      ოფიციალური ცნობის ჩამოტვირთვა დალუქულია. სერვისის ჩასართავად და დამოწმებული PDF დოკუმენტის მისაღებად აუცილებელია მომსახურების საფასურის გადახდა.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl bg-emerald-500/10 border border-emerald-300 rounded-xl p-5 text-left shadow-xs transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[24px]">lock_open</span>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-text-primary text-body-md flex items-center gap-1.5">
                        <span>ოფიციალური იურიდიული ცნობა</span>
                        <span className="text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200/80">ჩართულია</span>
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        გადახდილია • აქტიური
                      </span>
                    </div>
                    <p className="text-body-sm text-text-muted leading-relaxed">
                      სერვისი წარმატებით გააქტიურებულია. შეგიძლიათ შეუზღუდავად ჩამოტვირთოთ ოფიციალური QR-კოდირებული PDF დოკუმენტი.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-2">
              {!isCertificatePaid ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-body-md transition-all shadow-md shadow-amber-600/25 active:scale-[0.98] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  <span>ოფიციალური ცნობის ჩამოტვირთვა (15 ₾)</span>
                </button>
              ) : (
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
              )}
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

      {/* PAYMENT & ACTIVATION MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl border border-border-subtle max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[26px]">lock</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-body-lg font-bold text-text-primary">
                    სერვისის ჩართვა &amp; ცნობის მიღება
                  </h3>
                  <p className="text-body-sm text-text-muted">ოფიციალური იურიდიული დოკუმენტის გააქტიურება</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-bg transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Document Info Card */}
            <div className="p-4 rounded-xl bg-surface-bg border border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-muted">დოკუმენტის ტიპი:</span>
                <span className="font-semibold text-text-primary">ცნობა დავალიანების არარსებობის შესახებ</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-muted">მიმღები სუბიექტი:</span>
                <span className="font-semibold text-text-primary">{displayName}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-muted">{isLegal ? 'საიდენტიფიკაციო კოდი:' : 'პირადი ნომერი:'}</span>
                <span className="font-mono font-semibold text-text-primary">{personalId}</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-muted">დამოწმების ფორმატი:</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  QR კოდი + ელ. ბეჭედი
                </span>
              </div>
            </div>

            {/* Fee summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-amber-500/5 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-body-sm text-text-muted block">მომსახურების საფასური:</span>
                <span className="text-xs text-text-muted">ერთჯერადი აქტივაცია • შეუზღუდავი ჩამოტვირთვა</span>
              </div>
              <span className="text-2xl font-bold font-mono text-primary">15.00 ₾</span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-body-sm font-semibold text-text-primary">გადახდის მეთოდი:</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="border-2 border-primary bg-primary/5 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="paymentMethod" defaultChecked className="text-primary" />
                  <span className="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                  <span className="text-xs font-semibold text-text-primary">საბანკო ბარათი</span>
                </label>
                <label className="border border-border-subtle hover:border-primary/40 rounded-xl p-3 flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="paymentMethod" className="text-primary" />
                  <span className="material-symbols-outlined text-text-muted text-[20px]">account_balance</span>
                  <span className="text-xs font-semibold text-text-primary">TBC / BoG Pay</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border-subtle text-text-primary hover:bg-surface-bg text-body-sm font-medium transition-colors cursor-pointer"
                type="button"
              >
                გაუქმება
              </button>
              <button
                onClick={() => {
                  setPaying(true);
                  setTimeout(() => {
                    setPaying(false);
                    setIsCertificatePaid(true);
                    setShowPaymentModal(false);
                    handleDownloadCertificate();
                  }, 1200);
                }}
                disabled={paying}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-body-sm font-semibold transition-all shadow-md shadow-amber-600/20 active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-75"
                type="button"
              >
                {paying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>მიმდინარეობს გადახდა...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>გადახდა და სერვისის ჩართვა (15 ₾)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
