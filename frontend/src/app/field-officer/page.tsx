'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function FieldOfficerPage() {

  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="min-h-full bg-surface-bg flex flex-col font-body-md text-text-primary antialiased selection:bg-primary-container selection:text-white">
<div>
  {/* ==================== TOP NAVIGATION ==================== */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand & Module Badge */}
      <div className="flex items-center gap-3">
        <a className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight flex items-center gap-2" href="/">
          <span className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm">DI</span>
          <span>Debitinfo.GE</span>
        </a>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border-subtle">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary uppercase tracking-wider font-semibold">
            საველე ოფიცერი
          </span>
          <span className="text-text-muted text-body-sm font-body-sm">Field Officer Console</span>
        </div>
      </div>
      {/* Officer Info & Daily Progress Pill (Desktop) */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-3 bg-surface-bg py-1.5 px-3 rounded-lg border border-border-subtle">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-mint ring-4 ring-accent-mint/20" />
          </div>
          <div className="text-left">
            <div className="text-label-md font-label-md text-text-primary flex items-center gap-1.5">
              <span>დავით ბერიძე</span>
              <span className="text-text-muted text-body-sm font-body-sm">• თბილისი (ვაკე-საბურთალო)</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-body-sm font-body-sm text-text-muted">გეგმა: 6/8 ვიზიტი (75%)</span>
              <div className="w-24 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{width: '75%'}} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Actions & Sync */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* GPS Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-label-md bg-accent-mint/15 text-slate-800 border border-accent-mint/30" title="GPS სიგნალი აქტიურია">
          <span className="material-symbols-outlined text-[16px] text-emerald-600 animate-pulse" style={{fontVariationSettings: '"FILL" 1'}}>my_location</span>
          <span className="text-body-sm font-body-sm font-medium">GPS აქტიური</span>
        </div>
        {/* Notification Button */}
        <button className="relative p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-bg transition-colors duration-150 active:scale-95" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rating-c text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        {/* Officer Avatar / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-error hover:border-error/30 hover:bg-error-container/20 transition-all duration-150 text-body-sm font-body-sm active:scale-95">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline font-medium">გამოსვლა</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* ==================== MAIN CONTENT WRAPPER ==================== */}
  <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
    {/* KPI / DAILY ROUTE SUMMARY METRICS */}
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Card 1 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-primary/30 transition-colors">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-body-sm font-body-sm font-medium">დაგეგმილი დღეს</span>
          <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-headline-lg font-headline-lg font-bold text-text-primary">8</span>
          <span className="text-label-md font-label-md text-text-muted">მისამართი</span>
        </div>
        <div className="mt-2 text-body-sm font-body-sm text-text-muted flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-primary">navigation</span>
          <span>მარშრუტი ოპტიმიზებულია</span>
        </div>
      </div>
      {/* Card 2 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-accent-mint transition-colors">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-body-sm font-body-sm font-medium">შესრულებული / ჩაბარებული</span>
          <div className="w-8 h-8 rounded-lg bg-accent-mint/15 flex items-center justify-center text-emerald-700">
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>check_circle</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-headline-lg font-headline-lg font-bold text-slate-900">6</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-emerald-800 font-bold">
            75% შესრულდა
          </span>
        </div>
        <div className="mt-2 text-body-sm font-body-sm text-emerald-700 flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[14px]">done_all</span>
          <span>დარჩენილია 2 ობიექტი</span>
        </div>
      </div>
      {/* Card 3 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-primary-container transition-colors">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-body-sm font-body-sm font-medium">ამოღებული / შეთანხმებული</span>
          <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-headline-lg font-headline-lg font-bold font-data-mono-lg text-primary">14,200</span>
          <span className="text-headline-sm font-headline-sm font-semibold text-text-primary">₾</span>
        </div>
        <div className="mt-2 text-body-sm font-body-sm text-text-muted flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
          <span>დღიური ინკასაციის ლიმიტი: OK</span>
        </div>
      </div>
      {/* Card 4 */}
      <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-rating-b transition-colors">
        <div className="flex items-center justify-between text-text-muted mb-2">
          <span className="text-body-sm font-body-sm font-medium">პრობლემური / ესკალაცია</span>
          <div className="w-8 h-8 rounded-lg bg-rating-b/15 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-headline-lg font-headline-lg font-bold text-text-primary">2</span>
          <span className="text-label-md font-label-md text-text-muted">საქმე</span>
        </div>
        <div className="mt-2 text-body-sm font-body-sm text-amber-700 flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[14px]">flag</span>
          <span>გადაეცა იურიდიულ სამსახურს</span>
        </div>
      </div>
    </section>
    {/* ==================== MAIN SPLIT VIEW (35% / 65%) ==================== */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: ROUTE & VISITS WORKLIST (approx 35% -> col-span-12 lg:col-span-5) */}
      <section className="lg:col-span-5 space-y-4">
        <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">route</span>
              <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">ვიზიტების მარშრუტი</h2>
            </div>
            <span className="text-label-sm font-label-sm font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">დღეს: 8</span>
          </div>
          {/* Search & Filter bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">search</span>
            <input className="w-full pl-9 pr-3 py-2 text-body-sm font-body-sm rounded-lg border border-border-subtle focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 placeholder:text-text-muted" placeholder="ძებნა მისამართით, კომპანიით, პ/ნ..." type="text" defaultValue="ალ. ყაზბეგის" />
          </div>
          {/* Sub-filters: District Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-body-sm font-body-sm">
            <button className="px-3 py-1 rounded-full text-label-md font-label-md bg-primary-container text-white shrink-0">ყველა (8)</button>
            <button className="px-3 py-1 rounded-full text-label-md font-label-md bg-surface-bg text-text-muted hover:text-text-primary border border-border-subtle shrink-0">საბურთალო (5)</button>
            <button className="px-3 py-1 rounded-full text-label-md font-label-md bg-surface-bg text-text-muted hover:text-text-primary border border-border-subtle shrink-0">ვაკე (2)</button>
            <button className="px-3 py-1 rounded-full text-label-md font-label-md bg-surface-bg text-text-muted hover:text-text-primary border border-border-subtle shrink-0">დიდუბე (1)</button>
          </div>
          {/* Sort Bar */}
          <div className="flex items-center justify-between text-label-md font-label-md text-text-muted pt-1">
            <span>დახარისხება:</span>
            <div className="flex items-center gap-2">
              <button className="text-primary font-semibold flex items-center gap-0.5 hover:underline">
                პრიორიტეტით <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              <span>•</span>
              <button className="hover:text-text-primary">მანძილით</button>
              <span>•</span>
              <button className="hover:text-text-primary">თანხით</button>
            </div>
          </div>
        </div>
        {/* ROUTE CARDS LIST */}
        <div className="space-y-3">
          {/* Card 1 (Active / Selected) */}
          <div className="bg-surface-card rounded-xl border-2 border-primary-container p-4 shadow-sm relative transition-all duration-150 cursor-pointer ring-2 ring-primary-container/10">
            <div className="absolute -left-1 top-4 bottom-4 w-1.5 bg-primary-container rounded-r-full" />
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-secondary-container/20 text-secondary font-bold">
                    აქტიური ვიზიტი / ადგილზე
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-c/15 text-rating-c font-bold">
                    მაღალი პრიორიტეტი
                  </span>
                </div>
                <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary mt-1">შპს „მეგა რითეილი“</h3>
                <p className="text-body-sm font-body-sm text-text-muted">დირექტორი: ლევან მაისურაძე (პ/ნ 01019088712)</p>
              </div>
              <div className="text-right">
                <div className="text-headline-sm font-headline-sm font-bold font-data-mono-lg text-primary">18,450 ₾</div>
                <div className="text-label-sm font-label-sm text-rating-c font-medium">ვადაგადაცილება: 140 დღე</div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-start gap-2 text-body-sm font-body-sm text-slate-700">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">location_on</span>
              <div className="flex-1">
                <span className="font-medium text-text-primary">თბილისი, ალ. ყაზბეგის გამზ. 24ბ</span>
                <span className="text-text-muted block text-label-md font-label-md">სადარბაზო 2, სართული 3, ოფისი 12</span>
              </div>
              <span className="text-label-sm font-label-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">50 მ მანძილზე</span>
            </div>
          </div>
          {/* Card 2 (Completed / Agreement) */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-emerald-800 font-bold">
                    შეთანხმებული / დაფარვის გრაფიკი
                  </span>
                  <span className="text-label-sm font-label-sm text-text-muted">11:15 სთ</span>
                </div>
                <h3 className="text-body-lg font-body-lg font-semibold text-text-primary mt-1">გიორგი კაპანაძე</h3>
                <p className="text-body-sm font-body-sm text-text-muted font-label-sm">პ/ნ 01024045981</p>
              </div>
              <div className="text-right">
                <div className="text-body-lg font-body-lg font-bold font-data-mono-md text-text-primary">4,800 ₾</div>
                <div className="text-label-sm font-label-sm text-emerald-700 font-medium">ოქმი #412-B</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-body-sm font-body-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                <span>თბილისი, ი. ჭავჭავაძის გამზ. 75, ბ. 14</span>
              </div>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            </div>
          </div>
          {/* Card 3 (Not Found / Problem) */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/20 text-amber-800 font-bold">
                    ვერ მოიძებნა ადგილზე
                  </span>
                  <span className="text-label-sm font-label-sm text-text-muted">12:45 სთ</span>
                </div>
                <h3 className="text-body-lg font-body-lg font-semibold text-text-primary mt-1">ნინო ჩხეიძე</h3>
                <p className="text-body-sm font-body-sm text-text-muted font-label-sm">პ/ნ 01019033412</p>
              </div>
              <div className="text-right">
                <div className="text-body-lg font-body-lg font-bold font-data-mono-md text-text-primary">6,200 ₾</div>
                <div className="text-label-sm font-label-sm text-amber-700 font-medium">დაკეტილი კარი</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-body-sm font-body-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                <span>თბილისი, პეკინის გამზ. 18</span>
              </div>
              <span className="material-symbols-outlined text-amber-600 text-[18px]">door_front</span>
            </div>
          </div>
          {/* Card 4 (Next Up / Pending) */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm hover:border-slate-300 transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-slate-100 text-slate-700 font-semibold border border-border-subtle">
                    მომდევნო რიგში (15:30)
                  </span>
                </div>
                <h3 className="text-body-lg font-body-lg font-semibold text-text-primary mt-1">თენგიზ ჯაფარიძე</h3>
                <p className="text-body-sm font-body-sm text-text-muted font-label-sm">პ/ნ 62001004523</p>
              </div>
              <div className="text-right">
                <div className="text-body-lg font-body-lg font-bold font-data-mono-md text-text-primary">12,000 ₾</div>
                <div className="text-label-sm font-label-sm text-text-muted">მანძილი: 1.8 კმ</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-body-sm font-body-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                <span>თბილისი, ვაჟა-ფშაველას გამზ. 41</span>
              </div>
              <span className="material-symbols-outlined text-text-muted text-[18px]">schedule</span>
            </div>
          </div>
        </div>
      </section>
      {/* RIGHT COLUMN: SELECTED DEBTOR PROFILE & FIELD VISIT REPORT FORM (approx 65% -> col-span-12 lg:col-span-7) */}
      <section className="lg:col-span-7 space-y-6">
        {/* DEBTOR HEADER & QUICK ACTION BAR */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary font-bold">
                  საქმის #FO-2024-884
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/20 text-amber-800 font-bold">
                  რეიტინგი B (ზომიერი რისკი)
                </span>
                <span className="text-label-sm font-label-sm text-text-muted">ს/კ 404981245</span>
              </div>
              <h1 className="text-headline-md font-headline-md font-bold text-text-primary mt-1.5">
                შპს „მეგა რითეილი“
              </h1>
              <p className="text-body-sm font-body-sm text-text-muted">
                დირექტორი: <span className="font-semibold text-text-primary">ლევან მაისურაძე</span> (პ/ნ 01019088712)
              </p>
            </div>
            {/* Debt Balance Widget */}
            <div className="bg-surface-bg p-3.5 rounded-xl border border-border-subtle text-right sm:min-w-[180px]">
              <span className="text-label-md font-label-md text-text-muted block">ვალის ჯამური ნაშთი</span>
              <div className="text-headline-md font-headline-md font-bold font-data-mono-lg text-primary tracking-tight">
                18,450.00 <span className="text-body-lg font-body-lg">₾</span>
              </div>
              <span className="text-label-sm font-label-sm text-rating-c font-medium block mt-0.5">140 დღე ვადაგადაცილება</span>
            </div>
          </div>
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-white text-body-md font-body-md font-medium hover:bg-primary transition-colors shadow-sm active:scale-95" href="tel:+995599123456">
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>დარეკვა (+995 599 12 34 56)</span>
            </a>
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-secondary-container text-primary text-body-md font-body-md font-medium bg-transparent hover:bg-secondary-container/10 transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
              <span>Waze / Google Maps ნავიგაცია</span>
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-bg text-body-md font-body-md transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>ისტორია</span>
            </button>
          </div>
        </div>
        {/* LOCATION & MAP WIDGET */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">pin_drop</span>
              <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">მისამართის რეკვიზიტები &amp; GPS</h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-mint/20 text-emerald-800 text-label-sm font-label-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>თქვენ იმყოფებით ობიექტთან (50მ)</span>
            </div>
          </div>
          {/* Address Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-body-sm font-body-sm">
            <div className="bg-surface-bg p-3 rounded-lg border border-border-subtle">
              <div className="text-label-md font-label-md text-text-muted mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                ფაქტობრივი მისამართი (სამუშაო)
              </div>
              <p className="font-semibold text-text-primary">თბილისი, ალ. ყაზბეგის გამზ. 24ბ</p>
              <p className="text-text-muted text-label-md font-label-md">სადარბაზო 2, სართული 3, ოფისი 12 (დომოფონი: 12K)</p>
            </div>
            <div className="bg-surface-bg p-3 rounded-lg border border-border-subtle">
              <div className="text-label-md font-label-md text-text-muted mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                იურიდიული მისამართი (RS.GE)
              </div>
              <p className="font-semibold text-text-primary">თბილისი, მერაბ კოსტავას ქ. 47</p>
              <p className="text-text-muted text-label-md font-label-md">რეგისტრირებული იურ. მისამართი</p>
            </div>
          </div>
          {/* Key Contacts on Site */}
          <div className="flex flex-wrap items-center gap-4 text-body-sm font-body-sm bg-surface-container-low p-3 rounded-lg border border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]">person</span>
              <span><strong>ადგილზე პასუხისმგებელი:</strong> ლევან მაისურაძე</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]">support_agent</span>
              <span><strong>ბუღალტერი:</strong> ნათია კვარაცხელია (+995 577 44 55 66)</span>
            </div>
          </div>
          {/* Visual Map Block (Simulated High-Precision Radar/Map) */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border-subtle bg-slate-900 flex items-center justify-center">
            {/* Simulated Map Texture Grid */}
            <div className="absolute inset-0 opacity-25" style={{backgroundImage: 'radial-gradient(#0DBCFC 1px, transparent 1px), radial-gradient(#0DBCFC 1px, #0f172a 1px)', backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px'}} />
            {/* Map Street Overlay Graphic */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1 bg-slate-700/60 rounded" />
              <div className="h-3/4 w-1 bg-slate-700/60 rounded absolute" />
            </div>
            {/* Current GPS Position Pulse */}
            <div className="absolute flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-primary/20 animate-ping absolute" />
                <span className="w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="material-symbols-outlined text-[14px]">my_location</span>
                </span>
              </div>
              <div className="mt-2 bg-slate-900/90 text-white border border-border-subtle/30 px-2.5 py-1 rounded text-label-sm font-label-sm flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-accent-mint" />
                <span>ალ. ყაზბეგის გამზ. 24ბ (დაფიქსირებულია GPS)</span>
              </div>
            </div>
            {/* Map Controls overlay */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-1">
              <button className="w-7 h-7 bg-white text-slate-800 rounded shadow flex items-center justify-center hover:bg-slate-100 font-bold text-xs" title="გადიდება">+</button>
              <button className="w-7 h-7 bg-white text-slate-800 rounded shadow flex items-center justify-center hover:bg-slate-100 font-bold text-xs" title="დაპატარავება">-</button>
            </div>
          </div>
        </div>
        {/* FIELD VISIT REPORT & PROTOCOL FORM */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">assignment</span>
              </div>
              <div>
                <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">ადგილზე ვიზიტის ანგარიშის შედგენა &amp; ოქმი</h3>
                <p className="text-body-sm font-body-sm text-text-muted">გთხოვთ, ზუსტად დააფიქსიროთ მოლაპარაკების შედეგი და მიაბათ მტკიცებულება</p>
              </div>
            </div>
            <span className="text-label-sm font-label-sm font-mono text-text-muted bg-surface-bg px-2 py-1 rounded border border-border-subtle">
              SYNC_READY
            </span>
          </div>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* Outcome Radio Options */}
            <div className="space-y-2">
              <label className="block text-body-md font-body-md font-semibold text-text-primary">
                მოლაპარაკების შედეგი <span className="text-rating-c">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm font-body-sm">
                {/* Option 1: Selected */}
                <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary-container bg-primary-container/5 cursor-pointer transition-all">
                  <input defaultChecked className="mt-0.5 text-primary-container focus:ring-primary-container" name="visit_status" type="radio" defaultValue="agreement" />
                  <div>
                    <span className="font-semibold text-text-primary block">შედგა მოლაპარაკება - დათანხმდა გრაფიკს</span>
                    <span className="text-label-md font-label-md text-text-muted">გაფორმდა ოქმი და შეთანხმდა ვადები</span>
                  </div>
                </label>
                {/* Option 2 */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:bg-surface-bg cursor-pointer transition-all">
                  <input className="mt-0.5 text-primary-container focus:ring-primary-container" name="visit_status" type="radio" defaultValue="paid_part" />
                  <div>
                    <span className="font-semibold text-text-primary block">ადგილზე გადაიხადა ნაწილი (ქვითარი)</span>
                    <span className="text-label-md font-label-md text-text-muted">ინკასაცია / გადარიცხვის დადასტურება</span>
                  </div>
                </label>
                {/* Option 3 */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:bg-surface-bg cursor-pointer transition-all">
                  <input className="mt-0.5 text-primary-container focus:ring-primary-container" name="visit_status" type="radio" defaultValue="absent" />
                  <div>
                    <span className="font-semibold text-text-primary block">მისამართზე არავინ დახვდა / დაკეტილია</span>
                    <span className="text-label-md font-label-md text-text-muted">დატოვებულია ოფიციალური შეტყობინება</span>
                  </div>
                </label>
                {/* Option 4 */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:bg-surface-bg cursor-pointer transition-all">
                  <input className="mt-0.5 text-primary-container focus:ring-primary-container" name="visit_status" type="radio" defaultValue="refused" />
                  <div>
                    <span className="font-semibold text-text-primary block text-rating-c">კატეგორიული უარი / აგრესიული რეაქცია</span>
                    <span className="text-label-md font-label-md text-text-muted">საჭიროებს საქმის იურიდიულ ესკალაციას</span>
                  </div>
                </label>
                {/* Option 5 (Span full) */}
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle hover:bg-surface-bg cursor-pointer transition-all sm:col-span-2">
                  <input className="mt-0.5 text-primary-container focus:ring-primary-container" name="visit_status" type="radio" defaultValue="relocated" />
                  <div>
                    <span className="font-semibold text-text-primary block">მისამართი შეცვლილია / ფართი გაქირავებულია სხვაზე</span>
                    <span className="text-label-md font-label-md text-text-muted">ახალი მესაკუთრის ან დამქირავებლის ინფორმაცია მოითხოვს გადამოწმებას</span>
                  </div>
                </label>
              </div>
            </div>
            {/* Agreement Inputs: Date & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-bg p-4 rounded-xl border border-border-subtle">
              <div>
                <label className="block text-label-md font-label-md font-semibold text-text-primary mb-1">
                  შეთანხმებული გადახდის ვადა
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">event</span>
                  <input className="w-full pl-9 pr-3 py-2 text-body-sm font-body-sm font-data-mono-md rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary" type="text" defaultValue="30.11.2025" />
                </div>
              </div>
              <div>
                <label className="block text-label-md font-label-md font-semibold text-text-primary mb-1">
                  შესატანი თანხა (₾)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">payments</span>
                  <input className="w-full pl-9 pr-8 py-2 text-body-sm font-body-sm font-data-mono-md rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary" type="text" defaultValue="5,000" />
                  <span className="absolute right-3 top-2.5 text-text-muted font-bold text-body-sm">₾</span>
                </div>
              </div>
            </div>
            {/* Description / Officer Comments */}
            <div>
              <label className="block text-body-md font-body-md font-semibold text-text-primary mb-1">
                დეტალური აღწერა / ვიზიტის კომენტარი <span className="text-rating-c">*</span>
              </label>
              <textarea className="w-full p-3 text-body-sm font-body-sm rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary placeholder:text-text-muted resize-y" rows={3} defaultValue={"შეხვედრა შედგა კომპანიის ხელმძღვანელთან. განიხილეს 18,450 ₾ დავალიანება. მოვალე მზად არის 30 ნოემბრამდე დაფაროს 5,000 ₾, ხოლო დარჩენილზე გაფორმდეს 3-თვიანი გრაფიკი."} />
            </div>
            {/* Media / Document Upload Area */}
            <div className="space-y-3">
              <label className="block text-body-md font-body-md font-semibold text-text-primary">
                ჩააბარე აქტი ან ატვირთე ფოტო მტკიცებულება
              </label>
              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-border-subtle hover:border-primary-container bg-surface-bg/50 rounded-xl p-5 text-center transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform shadow-sm">
                    <span className="material-symbols-outlined text-[26px]">add_a_photo</span>
                  </div>
                  <div>
                    <span className="text-body-md font-body-md font-semibold text-primary block">გადაუღე ფოტო (კამერა) / ატვირთე ოქმი</span>
                    <span className="text-label-md font-label-md text-text-muted">ობიექტის ფასადი, ხელმოწერილი აქტი ან ქვითარი (JPG, PNG, PDF - მაქს. 10MB)</span>
                  </div>
                </div>
              </div>
              {/* Attached Files Preview List */}
              <div className="space-y-2 pt-1">
                {/* File 1: PDF Act */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-card shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-red-100 text-rating-c flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </div>
                    <div>
                      <span className="text-body-sm font-body-sm font-semibold text-text-primary block">akt_kazbegi_24b.pdf</span>
                      <span className="text-label-sm font-label-sm text-text-muted">1.4 MB • ხელმოწერილი ოქმი #412</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded text-text-muted hover:text-primary transition-colors" title="ნახვა" type="button">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button className="p-1.5 rounded text-text-muted hover:text-rating-c transition-colors" title="წაშლა" type="button">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                {/* File 2: Image Façade */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-card shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 text-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">image</span>
                    </div>
                    <div>
                      <span className="text-body-sm font-body-sm font-semibold text-text-primary block">fasadi_retail.jpg</span>
                      <span className="text-label-sm font-label-sm text-text-muted">2.8 MB • გეოთეგირებული ფოტო (50მ)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded text-text-muted hover:text-primary transition-colors" title="ნახვა" type="button">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button className="p-1.5 rounded text-text-muted hover:text-rating-c transition-colors" title="წაშლა" type="button">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Form Action Footer Buttons */}
            <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:bg-surface-bg text-body-sm font-body-sm transition-colors active:scale-95" type="button">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>დროებითი შენახვა (Draft)</span>
                </button>
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-rating-c/40 text-rating-c hover:bg-rating-c/10 text-body-sm font-body-sm transition-colors active:scale-95" type="button">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>ესკალაცია იურისტზე</span>
                </button>
              </div>
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-white text-body-md font-body-md font-semibold hover:bg-primary transition-colors shadow-md active:scale-95" type="submit">
                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>check_circle</span>
                <span>ვიზიტის დასრულება &amp; ანგარიშის გაგზავნა</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>
  {/* ==================== FOOTER ==================== */}
  <footer className="bg-surface-card border-t border-border-subtle mt-12">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-text-muted">
      <div className="flex items-center gap-3">
        <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
        <span className="text-border-subtle">|</span>
        <span>საველე ოპერაციების მართვის სისტემა</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-label-md font-label-md">
        <a className="hover:text-primary transition-colors" href="#">კონფიდენციალურობის პოლიტიკა</a>
        <a className="hover:text-primary transition-colors" href="#">მომსახურების პირობები</a>
        <a className="hover:text-primary transition-colors" href="#">რეკვიზიტები</a>
        <a className="hover:text-primary transition-colors" href="#">საგადასახადო შემოწმება</a>
        <a className="hover:text-primary transition-colors" href="#">საკონტაქტო პირი</a>
      </div>
      <div className="text-label-sm font-label-sm text-slate-400">
        © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
      </div>
    </div>
  </footer>
</div>

    </div>
  );
}
