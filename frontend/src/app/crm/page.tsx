'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CrmPage() {

  const [callActive, setCallActive] = useState(false);

  return (
    <div className="bg-surface-bg text-text-primary h-full flex flex-col font-body-md antialiased overflow-hidden">
<div>
  {/* TopNavBar (Shared Component implementation) */}
  <header className="w-full px-space-xl h-16 flex items-center justify-between border-b border-border-subtle bg-surface-card docked full-width top-0 sticky z-50 shadow-sm">
    <div className="flex items-center gap-space-lg">
      <div className="flex items-center gap-space-sm">
        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined text-lg" data-icon="account_balance">account_balance</span>
        </span>
        <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE Operator</span>
      </div>
      {/* Navigation Links from JSON */}
      <nav className="hidden lg:flex items-center gap-space-md ml-space-md">
        <a className="border-b-2 border-primary text-primary font-headline-sm text-body-md pb-1 flex items-center gap-1.5" href="#">
          <span className="">Active Call Console</span>
          <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
        </a>
        <a className="text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 px-2 py-1 rounded font-body-md" href="#">Queue Registry</a>
        <a className="text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 px-2 py-1 rounded font-body-md" href="#">Debtor Registry</a>
        <a className="text-text-muted hover:text-on-surface hover:bg-surface-container-low transition-colors duration-150 px-2 py-1 rounded font-body-md" href="#">Audit Reports</a>
      </nav>
    </div>
    {/* Trailing Actions & Operator Badge */}
    <div className="flex items-center gap-space-md">
      {/* Status Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-bg border border-border-subtle rounded-full">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rating-a opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
        </span>
        <span className="text-label-md font-label-md text-text-primary">ონლაინ / მზადყოფნაში #04</span>
      </div>
      <div className="h-6 w-[1px] bg-border-subtle hidden sm:block" />
      {/* Action Buttons */}
      <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-text-muted hover:text-on-surface hover:bg-surface-container-low rounded-lg text-body-sm font-label-md transition-colors flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm" data-icon="pause_circle">pause_circle</span>
        <span className="">Pause / Break</span>
      </button>
      {/* Trailing Icon Actions */}
      <div className="flex items-center gap-1 text-text-muted">
        <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors" title="Headset mic">
          <span className="material-symbols-outlined text-xl" data-icon="headset_mic">headset_mic</span>
        </button>
        <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors relative" title="Notifications">
          <span className="material-symbols-outlined text-xl" data-icon="notifications">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rating-c" />
        </button>
        <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors" title="Help">
          <span className="material-symbols-outlined text-xl" data-icon="help">help</span>
        </button>
      </div>
      <div className="h-6 w-[1px] bg-border-subtle" />
      {/* Operator Profile */}
      <div className="flex items-center gap-2.5 pl-1">
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20">
          თპ
        </div>
        <div className="hidden xl:block text-left">
          <p className="text-body-sm font-label-md leading-none text-text-primary">თეონა პეტრიაშვილი</p>
          <p className="text-label-sm font-label-sm text-text-muted mt-0.5">სენიორ დებიტ ოფიცერი</p>
        </div>
      </div>
    </div>
  </header>
  {/* KPI Metrics Ribbon (Top Dashboard Strip) */}
  <section className="w-full bg-surface-card border-b border-border-subtle px-space-xl py-space-sm shrink-0">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
      {/* KPI 1 */}
      <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
        <div>
          <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">დღის გეგმა / განხორციელებული</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-data-mono-lg font-data-mono-lg text-text-primary">42 <span className="text-text-muted font-normal text-sm">/ 60</span></span>
            <span className="text-label-sm font-label-sm text-secondary bg-surface-container px-1.5 py-0.5 rounded">70%</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-lg" data-icon="call">call</span>
        </div>
      </div>
      {/* KPI 2 */}
      <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
        <div>
          <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">შედეგიანი მოლაპარაკება</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-data-mono-lg font-data-mono-lg text-[#047857]">18</span>
            <span className="text-label-sm font-label-sm text-[#047857] bg-accent-mint/20 px-1.5 py-0.5 rounded font-medium">დათანხმდა დაფარვას</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-accent-mint/15 flex items-center justify-center text-[#047857]">
          <span className="material-symbols-outlined text-lg" data-icon="task_alt">task_alt</span>
        </div>
      </div>
      {/* KPI 3 */}
      <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
        <div>
          <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">შეუმდგარი ზარები</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-data-mono-lg font-data-mono-lg text-text-primary">14</span>
            <span className="text-label-sm font-label-sm text-text-muted bg-border-subtle/60 px-1.5 py-0.5 rounded">მიუწვდომელი / დაკავებული</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-outline">
          <span className="material-symbols-outlined text-lg" data-icon="phone_missed">phone_missed</span>
        </div>
      </div>
      {/* KPI 4 */}
      <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl ring-1 ring-accent-mint/50">
        <div>
          <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">დაბრუნებული დავალიანება დღეს</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-data-mono-lg font-data-mono-lg text-primary font-bold">34,800 ₾</span>
            <span className="w-2 h-2 rounded-full bg-accent-mint ml-1 inline-block" />
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-lg" data-icon="payments">payments</span>
        </div>
      </div>
    </div>
  </section>
  {/* Main Split Layout (Two Large Columns) */}
  <main className="flex-1 flex overflow-hidden">
    {/* LEFT SECTION: სამუშაო რეესტრი (Queue Registry & Filters) */}
    <section className="w-7/12 border-r border-border-subtle flex flex-col bg-surface-card overflow-hidden">
      {/* Section Header & Filter Cluster */}
      <div className="p-space-md border-b border-border-subtle bg-surface-card shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="format_list_bulleted">format_list_bulleted</span>
            <h2 className="text-headline-sm font-headline-sm text-text-primary">სამუშაო რეესტრი (Queue Registry)</h2>
            <span className="px-2 py-0.5 bg-surface-container text-primary rounded-full text-label-sm font-label-sm">28 აქტიური საქმე</span>
          </div>
          <button className="px-2.5 py-1 text-label-md font-label-md text-primary bg-primary/10 hover:bg-primary/15 rounded-lg flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm" data-icon="refresh">refresh</span>
            <span className="">განახლება</span>
          </button>
        </div>
        {/* Portfolio Segmented Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-body-sm">
          <button className="px-3 py-1.5 bg-primary text-on-primary font-medium rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1.5">
            <span className="">ყველა</span>
            <span className="bg-white/20 text-xs px-1.5 py-0.2 rounded-full">28</span>
          </button>
          <button className="px-3 py-1.5 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg whitespace-nowrap flex items-center gap-1.5 hover:bg-surface-container-low transition-colors">
            <span className="">მაღალი პრიორიტეტი</span>
            <span className="bg-rating-c/15 text-rating-c text-xs font-bold px-1.5 py-0.2 rounded-full">8</span>
          </button>
          <button className="px-3 py-1.5 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg whitespace-nowrap flex items-center gap-1.5 hover:bg-surface-container-low transition-colors">
            <span className="">დანიშნული გადარეკვა</span>
            <span className="bg-rating-b/20 text-[#B45309] text-xs font-bold px-1.5 py-0.2 rounded-full">5</span>
          </button>
          <button className="px-3 py-1.5 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg whitespace-nowrap flex items-center gap-1.5 hover:bg-surface-container-low transition-colors">
            <span className="">ახალი</span>
            <span className="bg-surface-container text-primary text-xs font-medium px-1.5 py-0.2 rounded-full">15</span>
          </button>
        </div>
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-lg" data-icon="search">search</span>
          <input className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all font-body-md" placeholder="ძებნა: სახელი, გვარი, 11-ნიშნა პირადი ნომერი ან ტელეფონი..." type="text" />
        </div>
      </div>
      {/* Interactive Registry Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-[#F1F5F9] border-b border-border-subtle text-text-muted text-label-sm font-label-sm uppercase tracking-wider z-10">
            <tr>
              <th className="py-2.5 px-4 font-semibold">მოვალე / პ/ნ</th>
              <th className="py-2.5 px-3 font-semibold">ტელეფონი</th>
              <th className="py-2.5 px-3 font-semibold text-right">ვალის თანხა</th>
              <th className="py-2.5 px-3 font-semibold">ვადაგადაცილება</th>
              <th className="py-2.5 px-3 font-semibold text-center">ბოლო სტატუსი</th>
              <th className="py-2.5 px-4 font-semibold text-right">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-body-sm">
            {/* Row 1 (Active Focused Item) */}
            <tr className="bg-surface-container/60 hover:bg-surface-container cursor-pointer border-l-4 border-l-primary transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="">დავით კაპანაძე</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-mint" title="მიმდინარე საუბარი" />
                </div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">01019033412</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary font-medium">+995 599 12 34 56</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">4,850 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 4,100 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">14.03.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-c/10 text-rating-c text-[11px] font-bold rounded">180 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-mint/15 text-[#047857] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                  დარეკვა
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-body-sm font-medium hover:bg-[#0A37CA] transition-colors flex items-center gap-1 ml-auto shadow-sm">
                  <span className="material-symbols-outlined text-sm" data-icon="call">call</span>
                  <span className="">გახსნილია</span>
                </button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="bg-surface-card hover:bg-surface-bg cursor-pointer transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary">ლევან გელაშვილი</div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">01024045671</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary">+995 577 45 89 20</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">12,200 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 10,000 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">02.01.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-c/10 text-rating-c text-[11px] font-bold rounded">245 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-border-subtle text-text-muted inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" data-icon="phone_missed">phone_missed</span>
                  არ უპასუხა
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-sm text-primary" data-icon="call">call</span>
                  <span className="">დარეკვა</span>
                </button>
              </td>
            </tr>
            {/* Row 3 */}
            <tr className="bg-surface-bg/40 hover:bg-surface-bg cursor-pointer transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary">ნინო მაისურაძე</div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">62001004523</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary">+995 593 88 12 04</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">1,400 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 1,150 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">18.06.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-b/20 text-[#B45309] text-[11px] font-bold rounded">92 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rating-b/20 text-[#B45309] inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" data-icon="handshake">handshake</span>
                  შეთანხმებული
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-sm text-primary" data-icon="folder_open">folder_open</span>
                  <span className="">გახსნა</span>
                </button>
              </td>
            </tr>
            {/* Row 4 */}
            <tr className="bg-surface-card hover:bg-surface-bg cursor-pointer transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary">გიორგი ბერიძე</div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">01008011299</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary">+995 591 60 70 80</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">6,340 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 5,400 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">22.04.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-c/10 text-rating-c text-[11px] font-bold rounded">145 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-mint/15 text-[#047857] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                  დარეკვა
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-sm text-primary" data-icon="call">call</span>
                  <span className="">დარეკვა</span>
                </button>
              </td>
            </tr>
            {/* Row 5 */}
            <tr className="bg-surface-bg/40 hover:bg-surface-bg cursor-pointer transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary">თამარ ჩხეიძე</div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">54001018892</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary">+995 555 41 23 89</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">2,910 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 2,500 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">05.05.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-b/20 text-[#B45309] text-[11px] font-bold rounded">130 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-border-subtle text-text-muted inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" data-icon="schedule">schedule</span>
                  დაგეგმილი
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-sm text-primary" data-icon="call">call</span>
                  <span className="">დარეკვა</span>
                </button>
              </td>
            </tr>
            {/* Row 6 */}
            <tr className="bg-surface-card hover:bg-surface-bg cursor-pointer transition-colors">
              <td className="py-3 px-4">
                <div className="font-semibold text-text-primary">ირაკლი მამულაშვილი</div>
                <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">01027011920</div>
              </td>
              <td className="py-3 px-3">
                <span className="text-data-mono-md font-data-mono-md text-text-primary">+995 598 77 44 11</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">8,750 ₾</span>
                <span className="block text-label-sm text-text-muted">ძირი: 7,000 ₾</span>
              </td>
              <td className="py-3 px-3">
                <div className="text-text-primary">11.02.2024</div>
                <span className="inline-block px-1.5 py-0.2 bg-rating-c/10 text-rating-c text-[11px] font-bold rounded">210 დღე</span>
              </td>
              <td className="py-3 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rating-c/15 text-rating-c inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]" data-icon="cancel">cancel</span>
                  უარი
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <button className="px-3 py-1.5 bg-surface-card border border-border-subtle text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto">
                  <span className="material-symbols-outlined text-sm text-primary" data-icon="call">call</span>
                  <span className="">დარეკვა</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-surface-bg border-t border-border-subtle flex items-center justify-between text-label-sm text-text-muted shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" data-icon="info">info</span>
          <span >სიის მონაცემები სინქრონიზებულია Debitinfo Risk Engine-თან</span>
        </div>
        <div >ჩვენება: 1-6 / 28 მოვალე</div>
      </div>
    </section>
    {/* RIGHT SECTION: ზარის მართვა & CRM კომენტარების დღიური (Active Debtor Case) */}
    <section className="w-5/12 flex flex-col bg-surface-bg overflow-hidden">
      {/* Debtor Case Quick Info Header */}
      <div className="p-space-md bg-surface-card border-b border-border-subtle shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded uppercase font-data-mono-md">აქტიური საქმე #DL-8821</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rating-b/20 text-[#B45309]">Grade B (საშუალო რისკი)</span>
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-text-primary mt-1">დავით კაპანაძე</h1>
            <p className="text-body-sm text-text-muted flex items-center gap-2 mt-0.5">
              <span className="">პ/ნ: <strong className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">01019033412</strong></span>
              <span >•</span>
              <span >კრედიტორი: <strong className="text-text-primary font-medium">სს კრედიტ პლიუსი</strong></span>
            </p>
          </div>
          <div className="text-right">
            <span className="text-label-sm font-label-sm text-text-muted uppercase">ჯამური დავალიანება</span>
            <div className="text-headline-sm font-data-mono-lg font-bold text-primary mt-0.5">4,850 ₾</div>
            <span className="text-xs text-text-muted">ხელშეკრულება #CP-9021</span>
          </div>
        </div>
        {/* Live Softphone Controller Widget */}
        <div className="mt-3.5 p-3 bg-gradient-to-r from-surface-card to-surface-container/50 border border-border-subtle rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-mint/20 border border-accent-mint flex items-center justify-center text-[#047857] relative">
              <span className="material-symbols-outlined text-xl" data-icon="phone_in_talk">phone_in_talk</span>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-mint rounded-full ring-2 ring-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-data-mono-md font-data-mono-md font-bold text-text-primary">+995 599 12 34 56</span>
                <span className="px-1.5 py-0.2 bg-surface-card border border-border-subtle text-[11px] text-text-muted rounded">ხაზი #2</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#047857] font-medium mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#047857] animate-ping" />
                <span className="font-data-mono-md text-data-mono-md">02:45</span>
                <span className="text-text-muted">მიმდინარეობს საუბარი (ჩაწერა ჩართულია)</span>
              </div>
            </div>
          </div>
          {/* Call Controls: Mute, Hold, Hangup */}
          <div className="flex items-center gap-1.5">
            <button className="p-2 bg-surface-card border border-border-subtle hover:bg-surface-container-low text-text-muted rounded-lg transition-colors" title="მიკროფონის გათიშვა (Mute)">
              <span className="material-symbols-outlined text-lg" data-icon="mic_off">mic_off</span>
            </button>
            <button className="p-2 bg-surface-card border border-border-subtle hover:bg-surface-container-low text-text-muted rounded-lg transition-colors" title="დაპაუზება (Hold)">
              <span className="material-symbols-outlined text-lg" data-icon="pause">pause</span>
            </button>
            <button className="px-3 py-2 bg-rating-c hover:bg-[#B91C1C] text-white rounded-lg font-medium text-body-sm transition-colors flex items-center gap-1 shadow-sm" title="ზარის დასრულება">
              <span className="material-symbols-outlined text-lg" data-icon="call_end">call_end</span>
              <span className="text-xs font-semibold">დასრულება</span>
            </button>
          </div>
        </div>
      </div>
      {/* Scrollable CRM Entry & Timeline Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-space-md space-y-space-md">
        {/* New Call Result Entry Form */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-lg" data-icon="edit_note">edit_note</span>
              <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">ზარის შედეგის დაფიქსირება &amp; CRM ჩანაწერი</h3>
            </div>
            <span className="text-label-sm text-text-muted">სავალდებულო ველები *</span>
          </div>
          <form className="mt-3 space-y-3" onSubmit={(e) => e.preventDefault()}>
            {/* Outcome Status Selector (Quick Badges) */}
            <div>
              <label className="block text-label-sm font-label-md text-text-muted mb-1.5">ზარის სტატუსი / შედეგი *</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button className="py-1.5 px-2 bg-accent-mint/15 border-2 border-[#047857] text-[#047857] rounded-lg text-xs font-semibold text-left flex items-center gap-1.5" type="button">
                  <span className="w-2 h-2 rounded-full bg-[#047857]" />
                  <span className="">დათანხმდა გადახდას</span>
                </button>
                <button className="py-1.5 px-2 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg text-xs font-medium text-left flex items-center gap-1.5 transition-colors" type="button">
                  <span className="w-2 h-2 rounded-full bg-rating-b" />
                  <span className="">არ იღებს ყურმილს</span>
                </button>
                <button className="py-1.5 px-2 bg-surface-bg border border-border-subtle text-text-muted hover:text-rating-c rounded-lg text-xs font-medium text-left flex items-center gap-1.5 transition-colors" type="button">
                  <span className="w-2 h-2 rounded-full bg-rating-c" />
                  <span className="">კატეგორიული უარი</span>
                </button>
                <button className="py-1.5 px-2 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg text-xs font-medium text-left flex items-center gap-1.5 transition-colors" type="button">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="">მოითხოვა გრაფიკი</span>
                </button>
                <button className="col-span-2 py-1.5 px-2 bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary rounded-lg text-xs font-medium text-left flex items-center gap-1.5 transition-colors" type="button">
                  <span className="w-2 h-2 rounded-full bg-outline" />
                  <span className="">სხვა პირმა უპასუხა (ოჯახის წევრი / მესამე პირი)</span>
                </button>
              </div>
            </div>
            {/* Negotiated Terms / Notes */}
            <div>
              <label className="block text-label-sm font-label-md text-text-muted mb-1">მოლაპარაკების შედეგი და შეთანხმებული პირობა *</label>
              <textarea className="w-full p-2.5 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 font-body-md placeholder:text-text-muted/70" rows={2} defaultValue={"დათანხმდა თანხის 30%-ის გადახდას პარასკევამდე, დანარჩენზე ითხოვს 4-თვიან განწილვადებას."} />
            </div>
            {/* Follow-up Date & Time Picker */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-label-sm font-label-md text-text-muted mb-1">მომდევნო დაკავშირება (თარიღი)</label>
                <div className="relative">
                  <input className="w-full py-1.5 pl-8 pr-2 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-secondary-container font-data-mono-md" type="text" defaultValue="28.10.2024" />
                  <span className="material-symbols-outlined absolute left-2 top-2 text-text-muted text-base" data-icon="calendar_today">calendar_today</span>
                </div>
              </div>
              <div>
                <label className="block text-label-sm font-label-md text-text-muted mb-1">დრო</label>
                <div className="relative">
                  <input className="w-full py-1.5 pl-8 pr-2 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-secondary-container font-data-mono-md" type="text" defaultValue="14:00" />
                  <span className="material-symbols-outlined absolute left-2 top-2 text-text-muted text-base" data-icon="schedule">schedule</span>
                </div>
              </div>
            </div>
            {/* Save Action Button */}
            <div className="pt-1">
              <button className="w-full py-2.5 bg-primary hover:bg-[#0A37CA] text-on-primary font-medium text-body-md rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg" data-icon="check_circle">check_circle</span>
                <span className="">შედეგის შენახვა და რეესტრში დაფიქსირება</span>
              </button>
            </div>
          </form>
        </div>
        {/* CRM History / Interaction Timeline */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-text-muted text-lg" data-icon="history">history</span>
              <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">საქმის ისტორია &amp; CRM ქრონოლოგია</h3>
            </div>
            <span className="text-label-sm text-text-muted">3 ჩანაწერი</span>
          </div>
          {/* Timeline items */}
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle">
            {/* Timeline Item 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-border-subtle ring-4 ring-white" />
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-data-mono-md text-text-muted">24.10.2024, 11:20</span>
                <span className="px-1.5 py-0.2 bg-border-subtle text-text-muted text-[11px] font-semibold rounded">უპასუხო</span>
              </div>
              <p className="text-body-sm text-text-primary font-medium">არ აიღო ყურმილზე, გაიგზავნა SMS შეხსენება.</p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <span className="material-symbols-outlined text-xs" data-icon="person">person</span>
                <span className="">ოპერატორი: თეონა პეტრიაშვილი</span>
              </div>
            </div>
            {/* Timeline Item 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-rating-b ring-4 ring-white" />
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-data-mono-md text-text-muted">19.10.2024, 15:40</span>
                <span className="px-1.5 py-0.2 bg-rating-b/20 text-[#B45309] text-[11px] font-semibold rounded">გადადებული</span>
              </div>
              <p className="text-body-sm text-text-primary font-medium">გაესაუბრა მეუღლე, დავითი იმყოფება რეგიონში. შევთანხმდით ორშაბათს დარეკვაზე.</p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <span className="material-symbols-outlined text-xs" data-icon="person">person</span>
                <span className="">ოპერატორი: გიორგი კვირიკაშვილი</span>
              </div>
            </div>
            {/* Timeline Item 3 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-data-mono-md text-text-muted">10.10.2024, 09:30</span>
                <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[11px] font-semibold rounded">სისტემური</span>
              </div>
              <p className="text-body-sm text-text-muted">საქმე გადმოეცა ქოლ-ცენტრს ანალიტიკოსის მიერ პირველადი დამუშავებისთვის.</p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                <span className="material-symbols-outlined text-xs" data-icon="smart_toy">smart_toy</span>
                <span className="">ავტომატური განაწილება (Queue Engine)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  {/* Micro-interaction JS for softphone duration & tab active feelings */}
</div>

    </div>
  );
}
