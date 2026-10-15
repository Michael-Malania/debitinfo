'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {

  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-surface-bg text-text-primary antialiased min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary selection:text-white">
<div>
  {/* TOP NAVIGATION BAR */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <a className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>assured_workload</span>
          </div>
          <div className="flex items-baseline">
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
            <span className="font-headline-sm text-headline-sm font-bold text-secondary-container">.GE</span>
          </div>
        </a>
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-border-subtle">
          <span className="w-2 h-2 rounded-full bg-accent-mint custom-pulse-ring" />
          <span className="font-label-sm text-label-sm text-text-muted tracking-tight">RS.GE LIVE SYNC</span>
        </div>
      </div>
      {/* Main Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">მთავარი</a>
        <a className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 flex items-center gap-1.5" href="#">
          <span>ჩემი პროფილი</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        </a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">შემოწმების ისტორია</a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">სერვისები</a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="#">დახმარება</a>
      </nav>
      {/* Right Actions / User Cluster */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-primary hover:bg-surface-bg border border-border-subtle transition-colors" title="ენა / Language" type="button">
          <span className="material-symbols-outlined text-[19px]">language</span>
        </button>
        {/* Notification Bell */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-primary hover:bg-surface-bg border border-border-subtle transition-colors" title="შეტყობინებები" type="button">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-text-muted/40 rounded-full" />
        </button>
        {/* Divider */}
        <div className="h-6 w-px bg-border-subtle hidden sm:block" />
        {/* User Chip & Status */}
        <div className="flex items-center gap-3 pl-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs border border-border-subtle">
              გბ
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent-mint rounded-full border-2 border-surface-card" title="ვერიფიცირებული" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-label-md text-label-md text-text-primary leading-tight">გიორგი ბერიძე</span>
              <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings: '"FILL" 1'}}>verified</span>
            </div>
            <span className="font-label-sm text-label-sm text-text-muted">აქტიური პროფილი</span>
          </div>
        </div>
        {/* Exit Action */}
        <button className="text-text-muted hover:text-error hover:bg-error-container/30 px-2.5 py-1.5 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1 ml-1" title="გამოსვლა" type="button">
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
          <a className="hover:text-primary transition-colors" href="#">მთავარი</a>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-text-primary font-medium">მომხმარებლის პროფილი &amp; მონიტორინგი</span>
        </nav>
        <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">პირადი კაბინეტი</h1>
      </div>
      {/* Timestamp chip */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle shadow-sm self-start sm:self-auto">
        <span className="w-2 h-2 rounded-full bg-accent-mint" />
        <span className="font-body-sm text-body-sm text-text-muted">
          სისტემური სტატუსი: <strong className="text-text-primary font-medium">აქტიური / სინქრონიზებული</strong>
        </span>
      </div>
    </div>
    {/* 1. USER PROFILE IDENTITY & REQUISITES CARD */}
    <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Identity Summary Left */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container text-white flex items-center justify-center font-bold text-xl shadow-md shadow-primary/20 shrink-0">
            გბ
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="font-headline-md text-headline-md text-text-primary">გიორგი ბერიძე</h2>
              {/* Verification Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-label-md text-label-md">
                <span className="material-symbols-outlined text-[15px] text-emerald-600" style={{fontVariationSettings: '"FILL" 1'}}>verified_user</span>
                იდენტობა დადასტურებულია
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
              შემოწმებულია სახელმწიფო სერვისების განვითარების სააგენტოსა და RS.GE-ს ბაზებთან
            </p>
          </div>
        </div>
        {/* Security / Requisites Block Right */}
        <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border-subtle lg:pl-8">
          {/* Personal ID */}
          <div className="space-y-0.5">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">პირადი ნომერი (პ/ნ)</span>
            <div className="flex items-center gap-2">
              <span className="font-data-mono-md text-data-mono-md text-text-primary tracking-wide">01024089123</span>
              <button className="text-text-muted hover:text-primary transition-colors cursor-pointer" onClick={() => { navigator.clipboard.writeText('01024089123'); setCopied(true); setTimeout(() => setCopied(false), 2000); }} title="კოპირება" type="button">
                <span className="material-symbols-outlined text-[15px]">{copied ? 'check' : 'content_copy'}</span>
              </button>
            </div>
          </div>
          {/* Phone */}
          <div className="space-y-0.5">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">ტელეფონის ნომერი</span>
            <span className="font-data-mono-md text-data-mono-md text-text-primary">+995 599 12 34 56</span>
          </div>
          {/* Email */}
          <div className="space-y-0.5">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">ელ. ფოსტა</span>
            <span className="font-body-sm text-body-sm text-text-primary font-medium truncate block max-w-[200px]">giorgi.beridze@example.ge</span>
          </div>
        </div>
      </div>
    </section>
    {/* 2. CENTRAL HERO STATUS CARD (CLEAN STATE / ZERO DEBTS) */}
    <section className="relative overflow-hidden bg-gradient-to-br from-surface-card via-white to-slate-50/60 rounded-2xl border border-border-subtle p-6 sm:p-10 shadow-sm">
      {/* Subtle Decorative Fintech Mesh */}
      <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-accent-mint/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
        {/* Big Trust Badge Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-accent-mint/20 via-sky-100 to-primary-fixed/30 border border-emerald-200 flex items-center justify-center shadow-lg shadow-accent-mint/20">
            <span className="material-symbols-outlined text-[54px] text-emerald-600" style={{fontVariationSettings: '"FILL" 1'}}>verified</span>
          </div>
          {/* Orbiting micro indicator */}
          <div className="absolute -top-1 -right-1 bg-surface-card rounded-full p-1.5 shadow-md border border-border-subtle flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-accent-mint block" />
          </div>
        </div>
        {/* Main Headline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300/60">
            <span className="font-data-mono-md text-data-mono-md font-bold text-emerald-800">რეიტინგი: A (უნაკლო)</span>
            <span className="text-emerald-400">•</span>
            <span className="font-label-md text-label-md text-emerald-800 font-semibold">სუფთა პროფილი</span>
          </div>
          <h2 className="font-headline-xl text-headline-xl text-text-primary tracking-tight font-extrabold max-w-2xl mx-auto leading-tight">
            თქვენს სახელზე აქტიური დავალიანება ან საკრედიტო ვალდებულება არ მოიძებნა
          </h2>
          <p className="font-body-md text-body-md text-text-muted max-w-xl mx-auto leading-relaxed">
            მონაცემთა ბაზაში რაიმე ვალდებულების ან დავალების დაფიქსირების შემთხვევაში, თქვენი კაბინეტი ავტომატურად განახლდება და მოგენიჭებათ შესაბამისი სტატუსი.
          </p>
        </div>
        {/* Telemetry / Live Scan Info Bar */}
        <div className="w-full max-w-xl bg-surface-bg/80 border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">sync</span>
            </div>
            <div>
              <span className="font-body-sm text-body-sm font-medium text-text-primary block">ბოლო სრული სკანირება: დღეს, 14:32</span>
              <span className="font-label-sm text-label-sm text-text-muted">მონაცემთა ბაზა აქტუალურია • შემოწმებულია 18 ფინანსური წყარო</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-label-md text-label-md bg-emerald-100/60 px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[14px]">done_all</span> 0 ჩანაწერი
          </span>
        </div>
        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full pt-2">
          {/* Download Certificate Primary CTA */}
          <a className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-[#0A37CA] transition-all shadow-md shadow-primary/25 active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>ოფიციალური ცნობის ჩამოტვირთვა (PDF)</span>
          </a>
          {/* Refresh Check Secondary CTA */}
          <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-surface-card border border-border-subtle text-text-primary hover:border-secondary-container hover:text-primary transition-all font-label-md text-label-md shadow-sm active:scale-[0.98]" type="button">
            <span className="material-symbols-outlined text-[18px] text-primary">autorenew</span>
            <span>განმეორებით გადამოწმება</span>
          </button>
        </div>
      </div>
    </section>
    {/* METRICS QUICK BAR (0 DEBTS BREAKDOWN) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">საბანკო სექტორი</span>
          <span className="font-data-mono-lg text-data-mono-lg text-text-primary font-bold">0.00 ₾</span>
          <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span> ვადაგადაცილება არ არის
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-[22px]">account_balance</span>
        </div>
      </div>
      {/* Card 2 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">საგადასახადო (RS.GE)</span>
          <span className="font-data-mono-lg text-data-mono-lg text-text-primary font-bold">0.00 ₾</span>
          <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span> საგადასახადო დავალიანება: 0
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
        </div>
      </div>
      {/* Card 3 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">სააღსრულებო რეესტრი</span>
          <span className="font-data-mono-lg text-data-mono-lg text-text-primary font-bold">არ ფიქსირდება</span>
          <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span> მოვალეთა რეესტრი: სუფთა
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-[22px]">gavel</span>
        </div>
      </div>
      {/* Card 4 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block">მიკროსაფინანსო სექტორი</span>
          <span className="font-data-mono-lg text-data-mono-lg text-text-primary font-bold">0.00 ₾</span>
          <span className="font-body-sm text-body-sm text-emerald-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span> შეუსრულებელი ვალდებულება: 0
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
          <span className="material-symbols-outlined text-[22px]">domain</span>
        </div>
      </div>
    </div>
    {/* 3. SEARCH & VERIFICATION HISTORY TABLE (შემოწმების ისტორია) */}
    <section className="bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">შემოწმების ისტორია &amp; აუდიტის ლოგი</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-bg border border-border-subtle text-text-muted font-label-sm text-label-sm">4 ჩანაწერი</span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted mt-0.5">სისტემის მიერ ჩატარებული ოფიციალური შემოწმებების ქრონოლოგია</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary bg-surface-card text-body-sm font-medium transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>ფილტრი</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary bg-surface-card text-body-sm font-medium transition-colors" type="button">
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>ექსპორტი (CSV)</span>
          </button>
        </div>
      </div>
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-border-subtle">
              <th className="py-3 px-4 sm:px-6 font-label-sm text-label-sm text-text-muted uppercase tracking-wider" scope="col">თარიღი და დრო</th>
              <th className="py-3 px-4 sm:px-6 font-label-sm text-label-sm text-text-muted uppercase tracking-wider" scope="col">შემოწმების ტიპი / წყარო</th>
              <th className="py-3 px-4 sm:px-6 font-label-sm text-label-sm text-text-muted uppercase tracking-wider" scope="col">მოთხოვნილი პ/ნ</th>
              <th className="py-3 px-4 sm:px-6 font-label-sm text-label-sm text-text-muted uppercase tracking-wider" scope="col">შედეგი</th>
              <th className="py-3 px-4 sm:px-6 font-label-sm text-label-sm text-text-muted uppercase tracking-wider text-right" scope="col">დოკუმენტი</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm">
            {/* Row 1 */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-4 px-4 sm:px-6">
                <div className="font-data-mono-md text-data-mono-md text-text-primary">24.10.2024 • 14:32</div>
                <span className="text-text-muted font-body-sm text-body-sm">ავტომატური სკანირება</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-text-primary">სრული სისტემური აუდიტი</span>
                </div>
                <span className="text-text-muted text-[11px] block mt-0.5">RS.GE + საკრედიტო ბიურო + მოვალეთა რეესტრი</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="font-data-mono-md text-data-mono-md text-text-muted bg-surface-bg px-2 py-0.5 rounded border border-border-subtle">
                  01024089123
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>ვალის გარეშე</span>
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6 text-right">
                <a className="inline-flex items-center gap-1 text-primary hover:underline font-label-md text-label-md" href="#">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>ცნობა #8912</span>
                </a>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-4 px-4 sm:px-6">
                <div className="font-data-mono-md text-data-mono-md text-text-primary">15.10.2024 • 10:15</div>
                <span className="text-text-muted font-body-sm text-body-sm">მომხმარებლის მოთხოვნა</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container shrink-0" />
                  <span className="font-medium text-text-primary">RS.GE საგადასახადო რეესტრი</span>
                </div>
                <span className="text-text-muted text-[11px] block mt-0.5">შემოსავლების სამსახურის საინფორმაციო ბაზა</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="font-data-mono-md text-data-mono-md text-text-muted bg-surface-bg px-2 py-0.5 rounded border border-border-subtle">
                  01024089123
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>ვალის გარეშე</span>
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6 text-right">
                <a className="inline-flex items-center gap-1 text-primary hover:underline font-label-md text-label-md" href="#">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>ცნობა #8741</span>
                </a>
              </td>
            </tr>
            {/* Row 3 */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-4 px-4 sm:px-6">
                <div className="font-data-mono-md text-data-mono-md text-text-primary">01.10.2024 • 09:00</div>
                <span className="text-text-muted font-body-sm text-body-sm">გეგმიური მონიტორინგი</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="font-medium text-text-primary">საბანკო საკრედიტო მონიტორინგი</span>
                </div>
                <span className="text-text-muted text-[11px] block mt-0.5">საქართველოს საბანკო ასოციაციის ბაზა</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="font-data-mono-md text-data-mono-md text-text-muted bg-surface-bg px-2 py-0.5 rounded border border-border-subtle">
                  01024089123
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>ვალის გარეშე</span>
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6 text-right">
                <a className="inline-flex items-center gap-1 text-primary hover:underline font-label-md text-label-md" href="#">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>ცნობა #8519</span>
                </a>
              </td>
            </tr>
            {/* Row 4 */}
            <tr className="hover:bg-slate-50/60 transition-colors">
              <td className="py-4 px-4 sm:px-6">
                <div className="font-data-mono-md text-data-mono-md text-text-primary">15.09.2024 • 16:45</div>
                <span className="text-text-muted font-body-sm text-body-sm">საწყისი ვერიფიკაცია</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-mint shrink-0" />
                  <span className="font-medium text-text-primary">პირველადი რეგისტრაციის აუდიტი</span>
                </div>
                <span className="text-text-muted text-[11px] block mt-0.5">სრული საკრედიტო ისტორიის გენერირება</span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="font-data-mono-md text-data-mono-md text-text-muted bg-surface-bg px-2 py-0.5 rounded border border-border-subtle">
                  01024089123
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>ვალის გარეშე</span>
                </span>
              </td>
              <td className="py-4 px-4 sm:px-6 text-right">
                <a className="inline-flex items-center gap-1 text-primary hover:underline font-label-md text-label-md" href="#">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>ცნობა #8104</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Table Footer Note */}
      <div className="p-4 bg-slate-50 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between text-text-muted font-body-sm text-body-sm gap-2">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
          ყველა ჩანაწერი დამოწმებულია ელექტრონული კვალიფიციური შტამპით.
        </span>
        <a className="text-primary hover:underline font-medium" href="#">სრული ისტორიის ნახვა (არქივი) →</a>
      </div>
    </section>
    {/* 4. QUICK SERVICES & SUPPORT / SECURITY BLOCK */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2 Cards column (Services) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-text-primary">დამატებითი სერვისები &amp; უსაფრთხოება</h3>
          <span className="font-label-md text-label-md text-primary">მომსახურების პაკეტები</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Service Card 1 */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex flex-col justify-between hover:border-secondary-container transition-colors shadow-sm">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">sms</span>
              </div>
              <h4 className="font-label-md text-label-md text-text-primary">SMS შეტყობინებები</h4>
              <p className="font-body-sm text-body-sm text-text-muted">მყისიერი შეტყობინება ნებისმიერი ახალი დავალიანების ან მოთხოვნისას.</p>
            </div>
            <div className="pt-4 mt-2 border-t border-border-subtle flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">აქტიური</span>
              <span className="font-body-sm text-body-sm font-medium text-text-primary">უფასო</span>
            </div>
          </div>
          {/* Service Card 2 */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex flex-col justify-between hover:border-secondary-container transition-colors shadow-sm">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-secondary-container/15 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
              </div>
              <h4 className="font-label-md text-label-md text-text-primary">ოფიციალური ცნობა</h4>
              <p className="font-body-sm text-body-sm text-text-muted">დამოწმებული ელექტრონული შტამპით ბანკებსა და საელჩოებში წარსადგენად.</p>
            </div>
            <div className="pt-4 mt-2 border-t border-border-subtle flex items-center justify-between">
              <a className="font-body-sm text-body-sm text-primary hover:underline font-medium" href="#">გენერირება →</a>
              <span className="font-label-sm text-label-sm text-text-muted">PDF ფორმატი</span>
            </div>
          </div>
          {/* Service Card 3 */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex flex-col justify-between hover:border-secondary-container transition-colors shadow-sm">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">shield</span>
              </div>
              <h4 className="font-label-md text-label-md text-text-primary">მონაცემთა დაცვა</h4>
              <p className="font-body-sm text-body-sm text-text-muted">პერსონალურ მონაცემთა დაცვის შესახებ კანონის სრული გარანტია და შიფრაცია.</p>
            </div>
            <div className="pt-4 mt-2 border-t border-border-subtle flex items-center justify-between">
              <a className="font-body-sm text-body-sm text-primary hover:underline font-medium" href="#">უფლებები →</a>
              <span className="font-label-sm text-label-sm text-emerald-700 font-semibold">ISO 27001</span>
            </div>
          </div>
        </div>
        {/* Institutional Security & Partners Banner */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">security</span>
            <span className="font-body-sm text-body-sm text-text-primary font-medium">ინტეგრირებული უსაფრთხოების პარტნიორები:</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted font-label-md text-label-md">
            <span className="hover:text-text-primary transition-colors flex items-center gap-1 font-semibold text-text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mint" /> RS.GE
            </span>
            <span className="hover:text-text-primary transition-colors">საქართველოს ბანკი</span>
            <span className="hover:text-text-primary transition-colors">თიბისი ბანკი</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">lock</span> 256-bit SSL
            </span>
          </div>
        </div>
      </div>
      {/* Support / Contact Card */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-6 flex flex-col justify-between shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-text-primary">მხარდაჭერის ცენტრი</h4>
              <span className="font-label-sm text-label-sm text-emerald-600 font-medium">24/7 ოპერატორები ხაზზე არიან</span>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted">
            გაქვთ კითხვები მონაცემთა სისწორეზე ან გსურთ დამატებითი კონსულტაცია თქვენს საკრედიტო რეიტინგთან დაკავშირებით?
          </p>
          <div className="space-y-3 pt-2">
            {/* Hotline */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-bg border border-border-subtle">
              <span className="material-symbols-outlined text-primary text-[20px]">call</span>
              <div>
                <span className="font-label-sm text-label-sm text-text-muted block">ცხელი ხაზი:</span>
                <span className="font-data-mono-md text-data-mono-md text-text-primary font-bold">+995 32 2 123 456</span>
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-bg border border-border-subtle">
              <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
              <div>
                <span className="font-label-sm text-label-sm text-text-muted block">ელ. ფოსტა:</span>
                <a className="font-body-sm text-body-sm text-primary hover:underline font-medium" href="mailto:support@debitinfo.ge">support@debitinfo.ge</a>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-5 mt-4 border-t border-border-subtle">
          <button className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary hover:text-primary transition-colors text-text-primary font-label-md text-label-md" type="button">
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>ონლაინ კონსულტანტი (ჩატი)</span>
          </button>
        </div>
      </div>
    </div>
  </main>
  {/* FOOTER (SHARED COMPONENT BLUEPRINT EXECUTION) */}
  <footer className="bg-surface-card border-t border-border-subtle mt-12">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-8">
      {/* Top Row: Logo, System Integration Note & Nav Links */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
            <span className="font-headline-sm text-headline-sm font-bold text-secondary-container">.GE</span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted">
            საქართველოს დავალიანებებისა და საკრედიტო რეესტრის ოფიციალური მონიტორინგის პლატფორმა.
          </p>
        </div>
        {/* Links from Shared Components JSON */}
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body-sm text-body-sm">
          <li>
            <a className="text-text-muted hover:text-primary transition-colors duration-150 hover:underline" href="#">კონფიდენციალურობის პოლიტიკა</a>
          </li>
          <li>
            <a className="text-text-muted hover:text-primary transition-colors duration-150 hover:underline" href="#">მომსახურების პირობები</a>
          </li>
          <li>
            <a className="text-text-muted hover:text-primary transition-colors duration-150 hover:underline" href="#">რეკვიზიტები</a>
          </li>
          <li>
            <a className="text-text-muted hover:text-primary transition-colors duration-150 hover:underline" href="#">საგადასახადო შემოწმება</a>
          </li>
          <li>
            <a className="text-text-muted hover:text-primary transition-colors duration-150 hover:underline" href="#">საკონტაქტო პირი</a>
          </li>
        </ul>
      </div>
      {/* Bottom Row: Exact Copyright Text from JSON */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted font-body-sm text-body-sm">
        <p className="text-center sm:text-left">
          © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
        </p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
            სისტემა მუშაობს სტაბილურად
          </span>
        </div>
      </div>
    </div>
  </footer>
</div>

    </div>
  );
}
