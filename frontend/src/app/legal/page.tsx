'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LegalPage() {

  const [selectedCase, setSelectedCase] = useState(null);

  return (
    <div className="h-full flex flex-col font-body-md text-text-primary antialiased bg-surface-bg">
<div>
  {/* Top Navigation Bar (Shared Component Structure) */}
  <header className="bg-surface-card border-b border-border-subtle sticky top-0 z-50 shadow-sm">
    <div className="w-full px-4 lg:px-8 max-w-[1720px] mx-auto flex items-center justify-between h-16">
      {/* Brand & Status */}
      <div className="flex items-center gap-6">
        <a className="flex items-center gap-2 group" href="#">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">balance</span>
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
        </a>
        {/* System Telemetry Badge */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-body-sm font-body-sm text-emerald-800 font-medium">სისტემა ონლაინში | RS.GE აქტიური</span>
        </div>
      </div>
      {/* Quick Registry Search */}
      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-[18px]">search</span>
          <input className="w-full bg-surface-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all" placeholder="მოძებნე საქმე, მოვალე, პ/ნ ან ს/კ..." type="text" />
          <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono bg-surface-card border border-border-subtle rounded text-text-muted">⌘K</kbd>
        </div>
      </div>
      {/* User & Notifications Header Actions */}
      <div className="flex items-center gap-3">
        {/* Language Action */}
        <button className="p-2 text-text-muted hover:text-primary transition-colors duration-150 rounded-lg hover:bg-surface-bg" title="ენა">
          <span className="material-symbols-outlined text-[20px]">language</span>
        </button>
        {/* Notification Bell */}
        <button className="relative p-2 text-text-muted hover:text-primary transition-colors duration-150 rounded-lg hover:bg-surface-bg" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rating-c rounded-full border-2 border-surface-card" />
        </button>
        <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block" />
        {/* Lawyer Profile Badge */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-body-md border border-primary/20">
            გბ
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-body-md font-body-md font-semibold text-text-primary leading-tight">გიორგი ბერიძე</span>
            <span className="text-body-sm font-body-sm text-text-muted leading-tight">წამყვანი იურისტი</span>
          </div>
          <button className="text-text-muted hover:text-primary">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* Secondary Lawyer Workflow Filter Tabs */}
  <nav className="bg-surface-card border-b border-border-subtle px-4 lg:px-8">
    <div className="max-w-[1720px] mx-auto flex items-center justify-between overflow-x-auto custom-scrollbar">
      <div className="flex items-center space-x-8 py-3">
        <a className="text-primary font-label-md text-label-md border-b-2 border-primary pb-3.5 -mb-3 flex items-center gap-2" href="#">
          <span className="material-symbols-outlined text-[18px]">folder_shared</span>
          <span>მიმდინარე საქმეები (14)</span>
        </a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors flex items-center gap-2" href="#">
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          <span>სასამართლო წარმოებაში (6)</span>
        </a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors flex items-center gap-2" href="#">
          <span className="material-symbols-outlined text-[18px]">history_edu</span>
          <span>სარჩელის მომზადება (5)</span>
        </a>
        <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors flex items-center gap-2" href="#">
          <span className="material-symbols-outlined text-[18px]">task_alt</span>
          <span>დასრულებული (32)</span>
        </a>
      </div>
      {/* Quick Export / New Case CTA */}
      <div className="flex items-center gap-2 py-2 shrink-0">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-bg text-text-primary text-body-sm font-body-sm font-medium transition-colors">
          <span className="material-symbols-outlined text-[16px] text-text-muted">file_download</span>
          <span>ექსპორტი (PDF/Excel)</span>
        </button>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-body-sm font-body-sm font-medium shadow-sm active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>ახალი საქმის მიღება</span>
        </button>
      </div>
    </div>
  </nav>
  {/* Main Dual-Column Content Canvas */}
  <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6">
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Legal Cases Registry (approx 58-60% width -> 7 cols on xl) */}
      <section className="xl:col-span-7 flex flex-col gap-5">
        {/* Legal KPIs Mini Bar (4 Metric Pills) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-body-sm font-body-sm font-medium">აქტიური საქმეები</span>
              <span className="material-symbols-outlined text-primary text-[18px]">folder_open</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-headline-md font-headline-md font-bold text-text-primary">14</span>
              <span className="text-label-sm font-label-sm text-text-muted">+2 ახალი</span>
            </div>
          </div>
          <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-body-sm font-body-sm font-medium">ჯამური სადავო თანხა</span>
              <span className="material-symbols-outlined text-secondary-container text-[18px]">account_balance_wallet</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-data-mono-lg font-data-mono-lg text-text-primary">₾284,500</span>
            </div>
          </div>
          <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-body-sm font-body-sm font-medium">წარმატებული მორიგება</span>
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">handshake</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-headline-md font-headline-md font-bold text-emerald-600">78%</span>
              <span className="text-label-sm font-label-sm text-emerald-700">მიზანი 75%</span>
            </div>
          </div>
          <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between border-l-4 border-l-rating-c">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-body-sm font-body-sm font-medium text-rating-c font-semibold">გადაუდებელი ვადები</span>
              <span className="material-symbols-outlined text-rating-c text-[18px]">timer</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-headline-md font-headline-md font-bold text-rating-c">3</span>
              <span className="text-label-sm font-label-sm text-text-muted">&lt; 48 საათი</span>
            </div>
          </div>
        </div>
        {/* Registry Table Container */}
        <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Registry Header & Filter Toolbar */}
          <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card">
            <div>
              <h2 className="text-headline-sm font-headline-sm text-text-primary font-bold">იურიდიული საქმეების რეესტრი</h2>
              <p className="text-body-sm font-body-sm text-text-muted">მონიტორინგი და საპროცესო ქმედებების აღრიცხვა</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-surface-bg border border-border-subtle rounded-lg pl-3 pr-8 py-1.5 text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container">
                  <option>ყველა სტატუსი</option>
                  <option>ოფიციალური გაფრთხილება</option>
                  <option>სარჩელის მომზადება</option>
                  <option>სასამართლო განხილვა</option>
                  <option>სააღსრულებო</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 text-text-muted pointer-events-none text-[16px]">expand_more</span>
              </div>
              {/* Sort Dropdown */}
              <div className="relative">
                <select className="appearance-none bg-surface-bg border border-border-subtle rounded-lg pl-3 pr-8 py-1.5 text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container">
                  <option>პრიორიტეტი (მაღალი-დაბალი)</option>
                  <option>თანხა (კლებადობით)</option>
                  <option>ვადის ამოწურვა</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 text-text-muted pointer-events-none text-[16px]">sort</span>
              </div>
            </div>
          </div>
          {/* Table Content */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-border-subtle text-text-muted text-[11px] font-label-md tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">საქმის N / მოვალე</th>
                  <th className="py-2.5 px-3 font-semibold">სამართლებრივი ეტაპი</th>
                  <th className="py-2.5 px-3 font-semibold text-right">სადავო თანხა</th>
                  <th className="py-2.5 px-3 font-semibold">გადმოცემა / ვადა</th>
                  <th className="py-2.5 px-3 font-semibold text-center">ქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-sm font-body-sm">
                {/* ROW 1 (ACTIVE / SELECTED ROW) */}
                <tr className="bg-blue-50/60 border-l-4 border-l-primary hover:bg-blue-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rating-c mt-1.5 shrink-0" title="მაღალი პრიორიტეტი" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-data-mono-md text-data-mono-md text-primary font-bold">#LEG-2025-084</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-medium">მაღალი</span>
                        </div>
                        <p className="font-medium text-text-primary mt-0.5">შპს "ორიონ ტექნოლოჯი"</p>
                        <p className="text-body-sm font-body-sm text-text-muted text-[11px]">ს/კ 405128991 • დირ: დ. მაისურაძე</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      სარჩელის მომზადება
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">₾24,800</span>
                    <span className="block text-[11px] text-text-muted">ძირი: ₾21,000</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-text-primary block font-medium">12 თებერვალი</span>
                    <span className="text-rating-c text-[11px] font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> 2 დღე დარჩა
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="p-1.5 rounded-lg bg-primary text-white hover:bg-[#0A37CA] transition-colors" title="გახსნა">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                  </td>
                </tr>
                {/* ROW 2 */}
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rating-b mt-1.5 shrink-0" title="საშუალო პრიორიტეტი" />
                      <div>
                        <span className="font-data-mono-md text-data-mono-md text-text-muted">#LEG-2025-079</span>
                        <p className="font-medium text-text-primary mt-0.5">ნიკოლოზ კობახიძე</p>
                        <p className="text-body-sm font-body-sm text-text-muted text-[11px]">პ/ნ 01024055112</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      ოფიციალური გაფრთხილება
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">₾8,450</span>
                    <span className="block text-[11px] text-text-muted">საურავი: ₾650</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-text-primary block font-medium">18 თებერვალი</span>
                    <span className="text-text-muted text-[11px]">ვადა: 6 დღე</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-slate-100 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </button>
                  </td>
                </tr>
                {/* ROW 3 */}
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-data-mono-md text-data-mono-md text-text-muted">#LEG-2025-063</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono">#3/1142-24</span>
                        </div>
                        <p className="font-medium text-text-primary mt-0.5">შპს "ალფა ლოჯისტიკსი"</p>
                        <p className="text-body-sm font-body-sm text-text-muted text-[11px]">ს/კ 204918233</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      სასამართლო წარმოება
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">₾56,200</span>
                    <span className="block text-[11px] text-text-muted">ბაჟი: ₾1,686</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-text-primary block font-medium">04 თებერვალი</span>
                    <span className="text-blue-700 text-[11px]">სხდომა: 24 თებ</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-slate-100 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </button>
                  </td>
                </tr>
                {/* ROW 4 */}
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-data-mono-md text-data-mono-md text-text-muted">#LEG-2025-055</span>
                        <p className="font-medium text-text-primary mt-0.5">თამარ გელოვანი</p>
                        <p className="text-body-sm font-body-sm text-text-muted text-[11px]">პ/ნ 62001034491</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      მორიგების ეტაპი
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">₾4,300</span>
                    <span className="block text-[11px] text-emerald-700">გრაფიკი: 4 თვე</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-text-primary block font-medium">29 იანვარი</span>
                    <span className="text-emerald-700 text-[11px]">შეთანხმებულია</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-slate-100 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </button>
                  </td>
                </tr>
                {/* ROW 5 */}
                <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-data-mono-md text-data-mono-md text-text-muted">#LEG-2025-048</span>
                        <p className="font-medium text-text-primary mt-0.5">შპს "მეგა ბილდერსი"</p>
                        <p className="text-body-sm font-body-sm text-text-muted text-[11px]">ს/კ 404882190</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      სააღსრულებო ფურცელი
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">₾91,000</span>
                    <span className="block text-[11px] text-text-muted">ყადაღა: აქტიური</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-text-primary block font-medium">21 იანვარი</span>
                    <span className="text-text-muted text-[11px]">აღსრულებაში</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-slate-100 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Table Pagination / Footer */}
          <div className="p-3 border-t border-border-subtle bg-surface-card flex items-center justify-between text-body-sm font-body-sm text-text-muted">
            <span className="text-[12px]">ნაჩვენებია 5 / 14 საქმე</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-bg text-text-muted hover:bg-slate-100 disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              </button>
              <button className="px-2.5 py-1 rounded bg-primary text-white font-medium text-[12px]">1</button>
              <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg text-[12px]">2</button>
              <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg text-[12px]">3</button>
              <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-bg text-text-muted hover:bg-slate-100">
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* RIGHT COLUMN: Selected Case Detail & Actions Workspace (approx 40-42% width -> 5 cols on xl) */}
      <section className="xl:col-span-5 flex flex-col gap-5">
        {/* CARD A: Debtor Dossier & Documents */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm relative overflow-hidden">
          {/* Active Badge Ribbon */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono font-bold">#LEG-2025-084</span>
              <span className="text-body-sm font-body-sm text-text-muted font-medium">საქმის სრული ანკეტა &amp; დოსიე</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              Grade C (High Risk)
            </span>
          </div>
          {/* Debtor Identity Details */}
          <div className="pt-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">შპს "ორიონ ტექნოლოჯი"</h3>
                <p className="text-body-sm font-body-sm text-text-muted">საიდენტიფიკაციო კოდი (ს/კ): <span className="font-mono text-text-primary font-medium">405128991</span></p>
              </div>
              <div className="text-right">
                <span className="text-label-sm font-label-sm text-text-muted block">სრული მოთხოვნა</span>
                <span className="text-headline-md font-headline-md font-bold text-rating-c font-data-mono-lg">₾24,800.00</span>
              </div>
            </div>
            {/* Quick Meta Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-surface-bg rounded-lg border border-border-subtle text-[12px]">
              <div>
                <span className="text-text-muted block">ხელმძღვანელი პირი:</span>
                <span className="font-medium text-text-primary">დავით მაისურაძე (დირექტორი)</span>
              </div>
              <div>
                <span className="text-text-muted block">იურიდიული მისამართი:</span>
                <span className="font-medium text-text-primary">თბილისი, ვაჟა-ფშაველას 71</span>
              </div>
              <div>
                <span className="text-text-muted block">დავალიანების ხანდაზმულობა:</span>
                <span className="font-medium text-amber-700">114 დღე (ვადაგადაცილებული)</span>
              </div>
              <div>
                <span className="text-text-muted block">წარმომადგენლობა:</span>
                <span className="font-medium text-text-primary">სრულუფლებიანი</span>
              </div>
            </div>
            {/* Dossier Attachment Links / Pills */}
            <div className="pt-2">
              <span className="text-label-sm font-label-sm text-text-muted block mb-2 font-medium">დამოწმებული დოკუმენტაცია &amp; რეესტრები:</span>
              <div className="flex flex-wrap gap-2">
                <a className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary text-text-primary hover:text-primary text-[11px] font-medium transition-colors" href="#">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                  <span>RS.GE ამონაწერი (მიბმულია)</span>
                </a>
                <a className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary text-text-primary hover:text-primary text-[11px] font-medium transition-colors" href="#">
                  <span className="material-symbols-outlined text-[15px] text-primary">description</span>
                  <span>ხელშეკრულება #OR-2023.pdf</span>
                </a>
                <a className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary text-text-primary hover:text-primary text-[11px] font-medium transition-colors" href="#">
                  <span className="material-symbols-outlined text-[15px] text-text-muted">account_balance</span>
                  <span>საბანკო რეკვიზიტები</span>
                </a>
                <a className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary text-text-primary hover:text-primary text-[11px] font-medium transition-colors" href="#">
                  <span className="material-symbols-outlined text-[15px] text-purple-600">draft</span>
                  <span>სასამართლო უწყება (შაბლონი)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* CARD B: Chronological Audit Trail & Interactions Log */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history</span>
              ქრონოლოგიური ისტორია &amp; ინტერაქციების ლოგი
            </h3>
            <span className="text-label-sm font-label-sm text-text-muted">სულ: 4 ჩანაწერი</span>
          </div>
          {/* Timeline Component */}
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Timeline Item 1 */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center ring-4 ring-white">
                <span className="material-symbols-outlined text-[12px]">gavel</span>
              </span>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-purple-700">[იურისტი - გიორგი ბერიძე]</span>
                <span className="text-text-muted font-mono">14 თებ, 11:30</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-primary bg-purple-50/70 p-2.5 rounded-lg border border-purple-100">
                მომზადდა სარჩელის პროექტი თბილისის საქალაქო სასამართლოსთვის. ელოდება ბაჟის დადასტურებას და მინდობილობის ხელმოწერას.
              </p>
            </div>
            {/* Timeline Item 2 */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white">
                <span className="material-symbols-outlined text-[12px]">pin_drop</span>
              </span>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-amber-700">[ვიზიტორი - ლევან ხუციშვილი]</span>
                <span className="text-text-muted font-mono">11 თებ, 16:45</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-primary bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                ადგილზე ვიზიტი იურიდიულ მისამართზე. ოფისი ფუნქციონირებს, დირექტორმა უარი განაცხადა ნებაყოფლობით დაფარვაზე.
              </p>
            </div>
            {/* Timeline Item 3 */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center ring-4 ring-white">
                <span className="material-symbols-outlined text-[12px]">call</span>
              </span>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-secondary">[ქოლ-ცენტრის ოპერატორი - მარიამი]</span>
                <span className="text-text-muted font-mono">08 თებ, 14:20</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-primary bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                სატელეფონო ზარი: კონტაქტი შედგა, თუმცა გადახდის გრაფიკის შეთავაზებაზე მიღებულია უარი.
              </p>
            </div>
            {/* Timeline Item 4 */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-400 text-white flex items-center justify-center ring-4 ring-white">
                <span className="material-symbols-outlined text-[12px]">assignment_ind</span>
              </span>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-slate-700">[ანალიტიკოსი - ნინო კაპანაძე]</span>
                <span className="text-text-muted font-mono">05 თებ, 10:00</span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted bg-slate-50 p-2 rounded-lg border border-border-subtle text-[12px]">
                საქმე გადაეცა იურიდიულ დეპარტამენტს. რეკომენდაცია: სასამართლო წარმოების დაუყოვნებლივ დაწყება.
              </p>
            </div>
          </div>
        </div>
        {/* CARD C: Legal Action Control Center */}
        <div className="bg-surface-card border-2 border-primary/20 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              იურიდიული ქმედებების მართვის პანელი
            </h3>
            <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">ოპერაციული ზონა</span>
          </div>
          {/* Segmented Status Switcher */}
          <div>
            <label className="text-label-sm font-label-sm text-text-muted block mb-1.5 font-medium">სამართლებრივი სტატუსის გადაყვანა:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-surface-bg border border-border-subtle rounded-lg text-center text-[11px] font-medium">
              <button className="py-1.5 px-2 rounded text-text-muted hover:text-text-primary hover:bg-white transition-all">
                გაფრთხილება
              </button>
              <button className="py-1.5 px-2 rounded bg-primary text-white font-semibold shadow-sm">
                სარჩელის მომზადება
              </button>
              <button className="py-1.5 px-2 rounded text-text-muted hover:text-text-primary hover:bg-white transition-all">
                სასამართლო
              </button>
              <button className="py-1.5 px-2 rounded text-text-muted hover:text-text-primary hover:bg-white transition-all">
                სააღსრულებო
              </button>
            </div>
          </div>
          {/* Action Checklist / Milestones */}
          <div className="p-3 bg-surface-bg rounded-lg border border-border-subtle">
            <span className="text-label-sm font-label-sm text-text-muted block mb-2 font-medium">სავალდებულო საკონტროლო ეტაპები:</span>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                <input defaultChecked className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" type="checkbox" />
                <span className="line-through text-text-muted">გაფრთხილების წერილი გაგზავნილია (RS.GE ფოსტით)</span>
              </label>
              <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                <input defaultChecked className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" type="checkbox" />
                <span className="font-medium text-text-primary">სარჩელის პროექტი შედგენილია</span>
              </label>
              <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                <input className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" type="checkbox" />
                <span className="font-medium text-rating-c">სახელმწიფო ბაჟი (3% — ₾744) გადახდილია [ ]</span>
              </label>
            </div>
          </div>
          {/* Legal Opinion / Notes Text Area */}
          <div>
            <label className="text-label-sm font-label-sm text-text-muted block mb-1 font-medium">იურიდიული დასკვნა / სამართლებრივი შენიშვნა:</label>
            <textarea className="w-full bg-surface-card border border-border-subtle rounded-lg p-2.5 text-body-sm font-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all" placeholder="ჩაწერეთ იურიდიული კომენტარი ან დასკვნა საქმის მიმდინარეობის შესახებ..." rows={3} defaultValue={"სარჩელი მზადაა შეტანისთვის. მოპასუხის ქონებრივი მდგომარეობის გადამოწმებით იკვეთება საბანკო ანგარიშების მოძრაობა. რეკომენდებულია სარჩელის უზრუნველყოფის შუამდგომლობის დაყენება (ანგარიშების ყადაღა)."} />
          </div>
          {/* Drag & Drop Document Upload Area */}
          <div className="border-2 border-dashed border-border-subtle hover:border-primary rounded-xl p-4 text-center bg-surface-bg hover:bg-blue-50/20 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[28px] text-primary mb-1">upload_file</span>
            <p className="text-body-sm font-body-sm text-text-primary font-medium">ატვირთეთ სარჩელი, მინდობილობა ან სასამართლო განჩინება</p>
            <p className="text-[11px] text-text-muted mt-0.5">ფორმატები: PDF, DOCX, XLSX (მაქსიმუმ 25 MB)</p>
          </div>
          {/* Action Buttons / CTA Cluster */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <button className="flex-1 py-2.5 px-4 bg-primary hover:bg-[#0A37CA] text-white font-medium text-body-sm font-body-sm rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>სტატუსის განახლება და დაფიქსირება</span>
            </button>
            <button className="py-2.5 px-3 bg-surface-card border border-secondary-container text-primary hover:bg-sky-50 font-medium text-body-sm font-body-sm rounded-lg transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>უწყების გენერირება (PDF)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </main>
  {/* Global Footer (Shared Component Structure) */}
  <footer className="bg-surface-card border-t border-border-subtle mt-10">
    <div className="w-full max-w-[1720px] mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-headline-sm font-headline-sm font-bold text-primary">Debitinfo.GE</span>
        <span className="text-text-muted text-body-sm font-body-sm hidden md:inline">|</span>
        <p className="text-text-muted text-body-sm font-body-sm">
          © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-text-muted text-body-sm font-body-sm">
        <a className="hover:text-primary transition-colors" href="#">კონფიდენციალურობის პოლიტიკა</a>
        <a className="hover:text-primary transition-colors" href="#">მომსახურების პირობები</a>
        <a className="hover:text-primary transition-colors" href="#">რეკვიზიტები</a>
        <a className="hover:text-primary transition-colors" href="#">საგადასახადო შემოწმება</a>
        <a className="hover:text-primary transition-colors" href="#">საკონტაქტო პირი</a>
      </div>
    </div>
  </footer>
</div>

    </div>
  );
}
