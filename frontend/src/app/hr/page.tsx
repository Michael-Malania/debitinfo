'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HrPage() {

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'tab-docs' | 'tab-bank' | 'tab-discipline' | 'tab-access'>('tab-docs');

  const saveEmployee = () => {
    alert("თანამშრომელი წარმატებით დარეგისტრირდა RS.GE და Debitinfo.GE ბაზაში!");
    setIsRegisterModalOpen(false);
  };

  const issueWarning = () => {
    alert("დისციპლინური გაფრთხილება გაიცა და დაფიქსირდა პერსონალის დოსიეში.");
    setIsWarningModalOpen(false);
  };

  const confirmTermination = () => {
    if (confirm("ნამდვილად გსურთ თეონა პეტრიაშვილის შრომითი ურთიერთობის შეწყვეტა (ოფბორდინგი)?")) {
      alert("ოფბორდინგის აქტი გენერირებულია და გადაცემულია იურიდიულ დეპარტამენტს.");
    }
  };

  return (
    <div className="h-full text-text-primary bg-surface-bg flex flex-col font-body-md text-body-md antialiased overflow-hidden">
<div>
  {/* TOP APP BAR (from Shared Components JSON: TopNavBar) */}
  <header className="docked full-width top-0 sticky z-40 border-b border-border-subtle shadow-sm flex justify-between items-center w-full px-space-lg h-16 bg-surface-container-lowest">
    <div className="flex items-center gap-space-lg">
      <Link href="/" className="flex items-center gap-space-xs group cursor-pointer">
        <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight group-hover:underline">Debitinfo.GE</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-[#047857] border border-accent-mint/30 ml-2 font-semibold">
          HR &amp; ადმინისტრატორი v2.4 Live
        </span>
      </Link>
      {/* Search Bar on Left */}
      <div className="relative w-80 md:w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
        <input className="w-full bg-surface-container-lowest border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all" placeholder="მოძებნეთ თანამშრომელი სახელით, პ/ნ, პოზიციით..." type="text" />
      </div>
    </div>
    {/* Trailing Actions & User info */}
    <div className="flex items-center gap-space-md">
      {/* RS.GE Sync Primary Pill / Status */}
      <div className="hidden lg:flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-[#065F46]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
        </span>
        <span className="font-medium">RS.GE სინქრონიზაცია</span>
        <span className="text-text-muted text-[11px] font-mono">| აქტიური</span>
        <button className="text-[#059669] hover:text-[#047857] ml-1 flex items-center" title="სინქრონიზაციის განახლება">
          <span className="material-symbols-outlined text-[16px]">sync</span>
        </button>
      </div>
      {/* Icon Actions */}
      <button className="relative p-2 rounded-lg text-text-muted hover:bg-surface-container-low transition-colors duration-150 active:scale-[0.98]" title="შეტყობინებები">
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rating-c rounded-full ring-2 ring-white" />
      </button>
      <div className="h-6 w-px bg-border-subtle" />
      {/* Profile Section */}
      <div className="flex items-center gap-space-sm pl-1">
        <div className="relative">
          <img alt="HR ადმინისტრატორის პროფილი" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="A professional headshot of a Georgian female senior HR administrator in corporate attire smiling confidently inside a high-tech modern fintech banking office with cool slate blue ambient illumination and soft daylight." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBamdS0WZSsRmw2mE_FScuuNTNi5diYKacxfxJgsWJW5vYXWvkgjLnXq2SoMOJNPW84BjmCpZJA81aZuK9dhQCVAgAB8nsnlHjm3yb2x1FTPCSGZ_ho6F-75TW9oJW9QcE1oufrsYVKKeFxXv1sg_UOn2YXCUYUQgyoU-LYSgoENRXk_RsZS09a5FuDLBs4CXZQliXa_lFmPqb3VRzJgLaJ0KAkaaCS4Wq_gayMLwHXh_92-p1_mKJreg" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] border-2 border-white rounded-full" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-body-sm font-body-sm font-semibold text-text-primary leading-tight">ნათია მაისურაძე</span>
          <span className="text-label-sm font-label-sm text-text-muted">უფროსი HR ადმინისტრატორი</span>
        </div>
      </div>
    </div>
  </header>
  {/* BODY CONTENT AREA: Sidebar + Work Canvas */}
  <div className="flex flex-1 overflow-hidden relative">
    {/* VERTICAL DRAWER (from Shared Components JSON: SideNavBar) */}
    <aside className="flex flex-col justify-between h-full p-space-md w-64 bg-surface-container-lowest border-r border-border-subtle shrink-0">
      <div className="flex flex-col gap-space-md">
        {/* Quick CTA inside SideBar */}
        <button className="w-full flex items-center justify-center gap-2 bg-primary-container text-on-primary py-2.5 px-4 rounded-lg font-label-md text-label-md hover:bg-[#0A37CA] active:scale-[0.99] transition-all shadow-sm cursor-pointer" onClick={() => setIsRegisterModalOpen(true)}>
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>+ ახალი თანამშრომელი</span>
        </button>
        {/* Navigation Tabs: Semantic Match -> "თანამშრომლები" active */}
        <nav className="flex flex-col space-y-1">
          {/* Tab 1: Active */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-surface-container text-primary font-label-md text-label-md font-semibold transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span>თანამშრომლები</span>
          </a>
          {/* Tab 2 */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>მიღება / Onboarding</span>
            <span className="ml-auto bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[11px] font-semibold">4</span>
          </a>
          {/* Tab 3 */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            <span>დოკუმენტაცია &amp; კანცელარია</span>
          </a>
          {/* Tab 4 */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span>ხელფასები &amp; ანგარიშები</span>
          </a>
          {/* Tab 5 */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>დისციპლინური აღრიცხვა</span>
            <span className="ml-auto bg-rating-b/20 text-[#B45309] px-1.5 py-0.5 rounded text-[11px] font-semibold">3</span>
          </a>
          {/* Tab 6 */}
          <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            <span>როლები &amp; წვდომები</span>
          </a>
        </nav>
      </div>
      {/* Footer Tabs in Drawer */}
      <div className="pt-4 border-t border-border-subtle flex flex-col space-y-1">
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>სისტემური პარამეტრები</span>
        </a>
        <a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-low font-body-md text-body-md transition-colors" href="#">
          <span className="material-symbols-outlined text-[18px]">help</span>
          <span>დახმარება</span>
        </a>
        <div className="mt-2 p-2.5 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-text-muted uppercase">უსაფრთხოება</span>
            <span className="text-body-sm font-body-sm font-medium text-text-primary">256-Bit SSL Encr.</span>
          </div>
          <span className="material-symbols-outlined text-[#059669] text-[18px]">verified_user</span>
        </div>
      </div>
    </aside>
    {/* MAIN SCROLLABLE CONTENT CANVAS */}
    <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-space-lg gap-space-lg">
      {/* Header Banner & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-headline-lg text-text-primary">თანამშრომელთა მენეჯმენტი და პერსონალის დოსიე</h1>
          </div>
          <p className="text-body-md font-body-md text-text-muted mt-0.5">
            კადრების რეგისტრაცია, გათავისუფლება, გაფრთხილებები და ციფრული კანცელარია
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* Export Action */}
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-card border border-border-subtle text-text-primary rounded-lg text-body-md font-body-md hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-text-muted">file_download</span>
            <span>ექსპორტი (Excel/PDF)</span>
          </button>
          {/* Warning Action */}
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-lg text-body-md font-body-md hover:bg-[#FEF3C7] transition-colors shadow-sm cursor-pointer" onClick={() => setIsWarningModalOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>+ გაფრთხილების გაცემა</span>
          </button>
          {/* Register Primary Action */}
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-body-md font-body-md hover:bg-[#0A37CA] transition-colors shadow-sm cursor-pointer" onClick={() => setIsRegisterModalOpen(true)}>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ ახალი თანამშრომლის რეგისტრაცია</span>
          </button>
        </div>
      </div>
      {/* 4 KPI SUMMARY ANALYTIC CARDS (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-border-subtle/80 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-body-sm font-medium text-text-muted">სულ თანამშრომელი</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-headline-lg font-bold text-text-primary">42</span>
            <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-full bg-accent-mint/20 text-[#047857] font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> +3 თვეში
            </span>
          </div>
          <div className="mt-2 text-body-sm font-body-sm text-text-muted flex justify-between items-center border-t border-border-subtle/60 pt-2">
            <span>აქტიური რეესტრი</span>
            <span className="font-medium text-text-primary">100% შტატი</span>
          </div>
        </div>
        {/* KPI 2 */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-border-subtle/80 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-body-sm font-medium text-text-muted">სამუშაოზე მიღება (Onboarding)</span>
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-headline-lg font-bold text-text-primary">4</span>
            <span className="text-label-sm font-label-sm text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-semibold">
              მომზადების ეტაპი
            </span>
          </div>
          <div className="mt-2 text-body-sm font-body-sm text-text-muted flex justify-between items-center border-t border-border-subtle/60 pt-2">
            <span>საბუთების შემოწმება</span>
            <span className="font-medium text-[#0284C7]">2 კონტრაქტი მზადაა</span>
          </div>
        </div>
        {/* KPI 3 */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-border-subtle/80 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-body-sm font-medium text-text-muted">დოკუმენტაციის ვადაგასულობა</span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-headline-lg font-bold text-rating-b">2</span>
            <span className="text-label-sm font-label-sm bg-rating-b/20 text-[#B45309] px-2 py-0.5 rounded-full font-semibold">
              განახლება საჭიროა
            </span>
          </div>
          <div className="mt-2 text-body-sm font-body-sm text-text-muted flex justify-between items-center border-t border-border-subtle/60 pt-2">
            <span>ID ბარათი / IBAN</span>
            <span className="font-medium text-[#B45309]">ვადა: &lt; 7 დღე</span>
          </div>
        </div>
        {/* KPI 4 */}
        <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-border-subtle/80 transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-body-sm font-medium text-text-muted">აქტიური გაფრთხილებები</span>
            <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">assignment_late</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-headline-lg font-bold text-rating-c">3</span>
            <span className="text-label-sm font-label-sm bg-rating-c/15 text-rating-c px-2 py-0.5 rounded-full font-semibold">
              დისციპლინური
            </span>
          </div>
          <div className="mt-2 text-body-sm font-body-sm text-text-muted flex justify-between items-center border-t border-border-subtle/60 pt-2">
            <span>1 საყვედური, 2 სიტყვიერი</span>
            <span className="font-medium text-rating-c">მონიტორინგზე</span>
          </div>
        </div>
      </div>
      {/* MAIN SPLIT WORKSPACE: Employee Registry (Left/Center) + Digital Dossier Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT/CENTER: Employee Registry (7 Cols on XL) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
            {/* Filters Ribbon */}
            <div className="flex flex-col gap-3 pb-3 border-b border-border-subtle">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-headline-sm font-headline-sm text-text-primary">თანამშრომელთა სია</span>
                <span className="text-body-sm font-body-sm text-text-muted">ნაჩვენებია: 5 / 42 კადრი</span>
              </div>
              {/* Department Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                <button className="px-3 py-1.5 rounded-lg text-body-sm font-body-sm font-medium bg-primary text-on-primary shrink-0 transition-colors">
                  ყველა (42)
                </button>
                <button className="px-3 py-1.5 rounded-lg text-body-sm font-body-sm font-medium text-text-muted hover:bg-surface-container-low shrink-0 transition-colors">
                  ანალიტიკოსები (8)
                </button>
                <button className="px-3 py-1.5 rounded-lg text-body-sm font-body-sm font-medium text-text-muted hover:bg-surface-container-low shrink-0 transition-colors">
                  იურისტები (6)
                </button>
                <button className="px-3 py-1.5 rounded-lg text-body-sm font-body-sm font-medium bg-surface-container text-primary font-semibold shrink-0 transition-colors">
                  ქოლ-ცენტრი (18)
                </button>
                <button className="px-3 py-1.5 rounded-lg text-body-sm font-body-sm font-medium text-text-muted hover:bg-surface-container-low shrink-0 transition-colors">
                  ვიზიტორები / Field (10)
                </button>
              </div>
              {/* Quick Search & Status Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                  <span className="text-text-muted">სტატუსი:</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent-mint/15 text-[#047857] text-label-sm font-label-sm font-semibold cursor-pointer">აქტიური</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-text-muted text-label-sm font-label-sm cursor-pointer hover:bg-slate-200">შვებულება</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-text-muted text-label-sm font-label-sm cursor-pointer hover:bg-slate-200">გაფრთხილებული</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-text-muted text-label-sm font-label-sm cursor-pointer hover:bg-slate-200">გათავისუფლებული</span>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-body-sm font-body-sm bg-surface-card border border-border-subtle rounded-lg px-2.5 py-1 text-text-muted focus:outline-none focus:border-secondary-container">
                    <option>დალაგება: ბოლო აქტივობა</option>
                    <option>სახელი / გვარი</option>
                    <option>დეპარტამენტი</option>
                    <option>ხელფასი (კლებადობით)</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Employee Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F1F5F9] text-text-muted text-label-sm font-label-sm uppercase tracking-wider">
                    <th className="py-2.5 px-3">თანამშრომელი</th>
                    <th className="py-2.5 px-3">პოზიცია &amp; განყოფილება</th>
                    <th className="py-2.5 px-3">კონტაქტი &amp; IBAN</th>
                    <th className="py-2.5 px-3 text-center">სტატუსი</th>
                    <th className="py-2.5 px-3 text-right">ქმედებები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-body-sm font-body-sm">
                  {/* Row 1: Selected Employee (თეონა პეტრიაშვილი) */}
                  <tr className="bg-[#EFF6FF] border-l-4 border-l-primary hover:bg-[#E0E7FF]/40 cursor-pointer transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img alt="თეონა პეტრიაშვილი" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="A portrait photo of a young professional Georgian female call center team lead wearing smart casual business office clothing with a warm pleasant expression against a bright architectural studio background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzYYuSnuFVs1jBy7wsTIRbJgGQAMLMohHZIDLhlYRqkiLb5kiccSDBEfyLnt_mcq2K3sJbHdr7iS9PBR616g42rkYT4_OupKPiNrUa5nxrCkL2wDydE7a7ATFziqyfI0oyj_9FM4k_FZab4NNW_I0koY2fxxktNBB-D7S-PoTpxuoAQkcN_5DJRuSG7J3pLZ6d_gfoTmabPC3zeqADPxIicDc8SwNhmUELq5wck_XzOirVlauYcnKTIQ" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">თეონა პეტრიაშვილი</span>
                          <span className="font-label-sm text-label-sm text-text-muted">პ/ნ 01024089912</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">უფროსი ოპერატორი</span>
                        <span className="text-text-muted text-[11px]">ქოლ-ცენტრი / Recovery</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-sm text-label-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">+995 599 11 22 33</span>
                        <span className="text-text-muted">GE29TB78...012 (TBC)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rating-b/20 text-[#B45309]">
                        1 გაფრთხილება
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 rounded text-primary hover:bg-white shadow-xs" title="დოსიეს ნახვა">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button className="p-1 rounded text-[#D97706] hover:bg-white cursor-pointer" onClick={() => setIsWarningModalOpen(true)} title="გაფრთხილება">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        <button className="p-1 rounded text-error hover:bg-white cursor-pointer" onClick={confirmTermination} title="გათავისუფლება (ოფბორდინგი)">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 2: გიორგი ბერიძე */}
                  <tr className="hover:bg-surface-bg transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img alt="გიორგი ბერიძე" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="Corporate headshot portrait of a confident male Georgian financial analyst in his early thirties with dark hair, wearing a navy tailored suit in a modern glass fintech office setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnLGL0Pm6pa42XMInA_v5KL9MkqMepmmxROfJKfq0-V6Qla9F25KXp6u49hVy8lkUgc2P85exEjcS5Us0mFd_-LOwDTrFZ0aBgR6PiuGamkZ-SatsneonH6kb0glA54rl377UtCB3Lm6lPOU7vPw-oLOCEw45l9lIrmzvlIZsnsKqxgNIwHihhxos6wdXhaYYSFKzfO2VS6_0vou2rB0nihA8CRjPlMlyLmccg7WUZNjAE_4uBVl15Ig" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">გიორგი ბერიძე</span>
                          <span className="font-label-sm text-label-sm text-text-muted">პ/ნ 01019045812</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">უფროსი ანალიტიკოსი</span>
                        <span className="text-text-muted text-[11px]">რისკების &amp; სკორინგის დეპ.</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-sm text-label-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">+995 595 44 88 12</span>
                        <span className="text-text-muted">GE45BG00...891 (BOG)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-mint/20 text-[#047857]">
                        აქტიური
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 rounded text-text-muted hover:text-primary hover:bg-white" title="დოსიეს ნახვა">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-[#D97706] hover:bg-white" title="გაფრთხილება">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-error hover:bg-white" title="გათავისუფლება">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 3: სალომე კვირიკაშვილი */}
                  <tr className="hover:bg-surface-bg transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img alt="სალომე კვირიკაშვილი" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="Portrait photo of a young female lawyer with sleek brown hair wearing a white blazer inside an executive conference legal boardroom with soft directional daylighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSpRqXnviFQ2HvXj1Hp1IZZesOGo9lGuj5SMmeoa8UD0dEgs-kwcz0jlamzeS1bo1xwsYgmV4SGGPmMIngsTr1kjXEMVV5pyP_6Uy36gqohzjYxHDD0BNZ_Tz4gKA3yWfGHlULWKqSTOChhMT8pwOLsCWgyHPd-xiDEtnkYfnFimV4WMfdMKPJaEh4rnLIKROGMXYyGkdE4_63gAfQ0UtHFhHDTYiTDjKVjrR77cT3YoCOPYp8ji1FuA" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">სალომე კვირიკაშვილი</span>
                          <span className="font-label-sm text-label-sm text-text-muted">პ/ნ 62001045239</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">წამყვანი იურისტი</span>
                        <span className="text-text-muted text-[11px]">იურიდიული / სააღსრულებო</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-sm text-label-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">+995 577 90 22 11</span>
                        <span className="text-text-muted">GE12TB99...340 (TBC)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FE] text-[#6D28D9]">
                        შვებულებაში
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 rounded text-text-muted hover:text-primary hover:bg-white" title="დოსიეს ნახვა">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-[#D97706] hover:bg-white" title="გაფრთხილება">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-error hover:bg-white" title="გათავისუფლება">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 4: დავით ლომიძე */}
                  <tr className="hover:bg-surface-bg transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img alt="დავით ლომიძე" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="Portrait of a Georgian male field recovery officer wearing a modern grey polo shirt in a bright corporate hallway with natural soft sunlight." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHGBdJ270Auf-c6lcfZHee87-LRcM_LlJ_440wkIzBkffBKHYp3S0lqNWXR37Wuk-4BqKBODH_XLmL5kAJ1z9EpjAeJEjccM92Y9NzNlvyzpGHnWrbQYeVRxV8CSRacl7IDOocmofopKEOMQdRGSBLTcDUxF09y_axnyPotACvHWTt2HRwQqOUYCAU9o50A_K4dOUgYGBl0Ivu4vL1zSbchCWNy6p_7q58hthhPa-exjQH9m5hvXxf3g" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">დავით ლომიძე</span>
                          <span className="font-label-sm text-label-sm text-text-muted">პ/ნ 01008034119</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">ვიზიტორი ოფიცერი</span>
                        <span className="text-text-muted text-[11px]">Field Monitoring / თბილისი</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-sm text-label-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">+995 591 00 23 89</span>
                        <span className="text-text-muted">GE88BG00...554 (BOG)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-mint/20 text-[#047857]">
                        აქტიური
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 rounded text-text-muted hover:text-primary hover:bg-white" title="დოსიეს ნახვა">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-[#D97706] hover:bg-white" title="გაფრთხილება">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-error hover:bg-white" title="გათავისუფლება">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 5: ირაკლი ჯაფარიძე */}
                  <tr className="hover:bg-surface-bg transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img alt="ირაკლი ჯაფარიძე" className="w-9 h-9 rounded-full object-cover border border-border-subtle" data-alt="Portrait headshot of an energetic Georgian male customer support specialist in an ultramodern corporate open space office, wearing a clean crisp blue shirt." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEHLMLht0om7EvVShJrMKCgFJ5rmrsT9CN1Bffgi2N1JZqBWv8ZKGW9sbPsoq1cX9k6BRJN1Eot7aUiaLqNJT8XsZ3MgcaJnQ8-m7YcB4pEP-lTExsXzdUyM5UU_95n_R9vMQXHvhy9ZYrXGLuaZUONApn3DpwBOsZgVjnuAb2LULJ_mP0Ea4ztpOF6eln-T8kl7aT3xYt_cOXf0SE_7-gUPfCra64wbFl_BMtxFRvDWUS5PHlL-5w7Q" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">ირაკლი ჯაფარიძე</span>
                          <span className="font-label-sm text-label-sm text-text-muted">პ/ნ 31002011945</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">ოპერატორი</span>
                        <span className="text-text-muted text-[11px]">ქოლ-ცენტრი / შემომავალი</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-sm text-label-sm">
                      <div className="flex flex-col">
                        <span className="text-text-primary">+995 558 77 12 34</span>
                        <span className="text-text-muted">GE04LB01...990 (Liberty)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-mint/20 text-[#047857]">
                        აქტიური
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1 rounded text-text-muted hover:text-primary hover:bg-white" title="დოსიეს ნახვა">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-[#D97706] hover:bg-white" title="გაფრთხილება">
                          <span className="material-symbols-outlined text-[18px]">warning</span>
                        </button>
                        <button className="p-1 rounded text-text-muted hover:text-error hover:bg-white" title="გათავისუფლება">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Table Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-body-sm font-body-sm text-text-muted">
              <span>გვერდი 1 / 9 (სულ 42 ჩანაწერი)</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1 border border-border-subtle rounded-md bg-surface-card disabled:opacity-50" disabled>წინა</button>
                <button className="px-2.5 py-1 border border-primary bg-primary text-white rounded-md font-medium">1</button>
                <button className="px-2.5 py-1 border border-border-subtle rounded-md bg-surface-card hover:bg-slate-50">2</button>
                <button className="px-2.5 py-1 border border-border-subtle rounded-md bg-surface-card hover:bg-slate-50">3</button>
                <button className="px-2.5 py-1 border border-border-subtle rounded-md bg-surface-card hover:bg-slate-50">შემდეგი</button>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT: Interactive Dossier & Digital Chancery (5 Cols on XL) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Dossier Header Profile Summary */}
            <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] border-b border-border-subtle">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img alt="თეონა პეტრიაშვილი" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" data-alt="Close up detailed corporate identity badge photo of Teona Petriashvili, an experienced female lead operator in fintech banking collections department with professional friendly demeanor in a well-lit office." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZrbVuibC60TCFiFq0XcbMdca12UJa7dcOJT2WE72LpcXjtOeEN7n0x808KTbAuKJXzYlntzCnlLq1dnd0BgDSy4-XIUMalTplt3IBhmeIo3XJs6U8mc1npcKum1nW45dtPj_2xfOkgw-u7QiYg7Lcfy1e0BeiybNQt0atwllUA6mnU-rW-Yfxki4WAIdlu8zQmn-JKolLd-gWKzjr9zDNvjX0vuvyy4C5PvZwE3-2akuj-pTW2BwngQ" />
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-rating-b border-2 border-white rounded-full" title="1 აქტიური გაფრთხილება" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-headline-sm font-headline-sm text-text-primary">თეონა პეტრიაშვილი</h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rating-b/20 text-[#B45309]">
                        1 გაფრთხილება
                      </span>
                    </div>
                    <span className="text-body-sm font-body-sm text-text-muted">უფროსი ოპერატორი • ქოლ-ცენტრი</span>
                    <span className="text-label-sm font-label-sm text-text-muted font-mono mt-0.5">პ/ნ: 01024089912 | RS.GE ID: 884920</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-text-muted hover:bg-white hover:text-primary transition-colors" title="რედაქტირება">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button className="p-1.5 rounded-lg text-text-muted hover:bg-white hover:text-text-primary transition-colors" title="ბეჭდვა">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                </div>
              </div>
              {/* Quick Meta Row */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border-subtle/70 text-body-sm font-body-sm">
                <div>
                  <span className="text-label-sm font-label-sm text-text-muted block">მიღების თარიღი:</span>
                  <span className="font-medium text-text-primary">14.02.2023 (1.2 წელი)</span>
                </div>
                <div>
                  <span className="text-label-sm font-label-sm text-text-muted block">სამუშაო გრაფიკი:</span>
                  <span className="font-medium text-text-primary">სრული (10:00 - 19:00)</span>
                </div>
                <div>
                  <span className="text-label-sm font-label-sm text-text-muted block">სისტემური როლი:</span>
                  <span className="font-medium text-primary">Senior Operator</span>
                </div>
              </div>
            </div>
            {/* Dossier Navigation Tabs */}
            <div className="flex items-center border-b border-border-subtle px-4 bg-surface-card overflow-x-auto custom-scrollbar">
              <button className={`py-3 px-3 text-body-sm font-body-sm shrink-0 flex items-center gap-1.5 cursor-pointer border-b-2 ${activeDossierTab === 'tab-docs' ? 'font-semibold text-primary border-primary' : 'text-text-muted hover:text-text-primary border-transparent'}`} id="btn-tab-docs" onClick={() => setActiveDossierTab('tab-docs')}>
                <span className="material-symbols-outlined text-[16px]">folder</span>
                <span>დოკუმენტები &amp; კანცელარია</span>
              </button>
              <button className={`py-3 px-3 text-body-sm font-body-sm shrink-0 flex items-center gap-1.5 cursor-pointer border-b-2 ${activeDossierTab === 'tab-bank' ? 'font-semibold text-primary border-primary' : 'text-text-muted hover:text-text-primary border-transparent'}`} id="btn-tab-bank" onClick={() => setActiveDossierTab('tab-bank')}>
                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                <span>საბანკო &amp; ხელფასი</span>
              </button>
              <button className={`py-3 px-3 text-body-sm font-body-sm shrink-0 flex items-center gap-1.5 cursor-pointer border-b-2 ${activeDossierTab === 'tab-discipline' ? 'font-semibold text-primary border-primary' : 'text-text-muted hover:text-text-primary border-transparent'}`} id="btn-tab-discipline" onClick={() => setActiveDossierTab('tab-discipline')}>
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                <span>დისციპლინა (1)</span>
              </button>
              <button className={`py-3 px-3 text-body-sm font-body-sm shrink-0 flex items-center gap-1.5 cursor-pointer border-b-2 ${activeDossierTab === 'tab-access' ? 'font-semibold text-primary border-primary' : 'text-text-muted hover:text-text-primary border-transparent'}`} id="btn-tab-access" onClick={() => setActiveDossierTab('tab-access')}>
                <span className="material-symbols-outlined text-[16px]">devices</span>
                <span>როლები &amp; აპარატურა</span>
              </button>
            </div>
            {/* Dossier Tab Content Area */}
            <div className="p-4 flex flex-col gap-4 min-h-[360px]">
              {/* TAB 1: Documents & Chancery (Active) */}
              <div className={`flex flex-col gap-3 ${activeDossierTab === 'tab-docs' ? '' : 'hidden'}`} id="tab-docs">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-body-sm font-semibold text-text-primary">თანამშრომლის ციფრული არქივი</span>
                  <button className="text-primary hover:text-primary-container text-body-sm font-body-sm font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>ფაილის ატვირთვა</span>
                  </button>
                </div>
                {/* Document List Items */}
                <div className="flex flex-col gap-2">
                  {/* Doc 1 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-rating-c text-[22px]">picture_as_pdf</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-body-sm font-body-sm">შრომითი ხელშეკრულება 2024 (განახლებული).pdf</span>
                        <span className="text-label-sm font-label-sm text-text-muted">ხელმოწერილია • 1.4 MB • 14 იანვარი 2024</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-text-muted hover:text-primary" title="ჩამოტვირთვა">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                  {/* Doc 2 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-body-sm font-body-sm">პირადობის მოწმობის ასლი (ID Card).jpg</span>
                        <span className="text-label-sm font-label-sm text-[#059669] font-medium">ვალიდურია: 2028 წლამდე • 840 KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-text-muted hover:text-primary" title="ნახვა">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </div>
                  </div>
                  {/* Doc 3 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-rating-c text-[22px]">lock</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-body-sm font-body-sm">კონფიდენციალურობის შეთანხმება (NDA).pdf</span>
                        <span className="text-label-sm font-label-sm text-text-muted">საბანკო საიდუმლოება • 512 KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-text-muted hover:text-primary">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                  {/* Doc 4 */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#0284C7] text-[22px]">school</span>
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-body-sm font-body-sm">უმაღლესი განათლების დიპლომი (თსუ).pdf</span>
                        <span className="text-label-sm font-label-sm text-text-muted">ბიზნეს ადმინისტრირება • 2.1 MB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-text-muted hover:text-primary">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Drag and drop zone */}
                <div className="mt-2 border-2 border-dashed border-border-subtle rounded-lg p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-text-muted text-[28px] mb-1">cloud_upload</span>
                  <p className="text-body-sm font-body-sm text-text-primary font-medium">ჩააგდეთ დოკუმენტი ან დააჭირეთ ასატვირთად</p>
                  <p className="text-[11px] text-text-muted mt-0.5">PDF, DOCX, JPG, PNG (მაქს. 15MB)</p>
                </div>
              </div>
              {/* TAB 2: Banking & Payroll (Hidden by default, toggled via JS) */}
              <div className={`flex flex-col gap-3 ${activeDossierTab === 'tab-bank' ? '' : 'hidden'}`} id="tab-bank">
                <div className="bg-surface-bg border border-border-subtle rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-label-sm text-text-muted uppercase">საბანკო ანგარიში (IBAN)</span>
                    <span className="text-label-sm font-label-sm text-[#047857] bg-accent-mint/20 px-2 py-0.5 rounded font-semibold">TBC Bank</span>
                  </div>
                  <div className="mt-1 font-mono font-semibold text-text-primary text-body-md font-body-md select-all">
                    GE29TB7894561230123456
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-border-subtle rounded-lg bg-surface-bg">
                    <span className="text-label-sm font-label-sm text-text-muted block">ფიქსირებული ანაზღაურება:</span>
                    <span className="text-headline-sm font-headline-sm font-bold text-text-primary font-mono mt-1 block">2,400 ₾</span>
                    <span className="text-[11px] text-text-muted">დარიცხული (Gross)</span>
                  </div>
                  <div className="p-3 border border-border-subtle rounded-lg bg-surface-bg">
                    <span className="text-label-sm font-label-sm text-text-muted block">მიმდინარე KPI ბონუსი:</span>
                    <span className="text-headline-sm font-headline-sm font-bold text-[#059669] font-mono mt-1 block">+450 ₾</span>
                    <span className="text-[11px] text-text-muted">აღდგენილი პორტფელი</span>
                  </div>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-slate-50 flex items-center justify-between text-body-sm font-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#059669]">verified</span>
                    <div>
                      <span className="font-medium text-text-primary block">RS.GE საშემოსავლო დეკლარაცია</span>
                      <span className="text-[11px] text-text-muted">ავტომატურად იგზავნება ყოველი თვის 15-ში</span>
                    </div>
                  </div>
                  <span className="text-label-sm font-label-sm text-[#059669] font-semibold bg-[#ECFDF5] px-2 py-1 rounded">სინქრონშია</span>
                </div>
              </div>
              {/* TAB 3: Discipline & Warnings (Hidden by default) */}
              <div className={`flex flex-col gap-3 ${activeDossierTab === 'tab-discipline' ? '' : 'hidden'}`} id="tab-discipline">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-body-sm font-semibold text-text-primary">დისციპლინური ისტორია</span>
                  <button className="text-rating-b hover:text-[#B45309] text-body-sm font-body-sm font-medium flex items-center gap-1 cursor-pointer" onClick={() => setIsWarningModalOpen(true)}>
                    <span className="material-symbols-outlined text-[16px]">add_alert</span>
                    <span>გაფრთხილების დამატება</span>
                  </button>
                </div>
                {/* Record 1 */}
                <div className="p-3 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm font-label-sm font-semibold text-[#B45309] px-2 py-0.5 rounded bg-[#FEF3C7]">
                      სიტყვიერი გაფრთხილება #1
                    </span>
                    <span className="text-label-sm font-label-sm text-text-muted font-mono">03.04.2024</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-[#78350F]">
                    <strong>მიზეზი:</strong> სამუშაო გრაფიკის დარღვევა (დაგვიანება 45 წთ საპატიო მიზეზის გარეშე).
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#92400E] border-t border-[#FDE68A]/60 pt-2">
                    <span>გამცემი: ნათია მაისურაძე (HR)</span>
                    <span className="font-medium">სტატუსი: ძალაშია (გასაჩივრების გარეშე)</span>
                  </div>
                </div>
              </div>
              {/* TAB 4: Roles & Hardware (Hidden by default) */}
              <div className={`flex flex-col gap-3 ${activeDossierTab === 'tab-access' ? '' : 'hidden'}`} id="tab-access">
                <div className="p-3 border border-border-subtle rounded-lg bg-surface-bg flex flex-col gap-2">
                  <span className="text-body-sm font-body-sm font-semibold text-text-primary">მინიჭებული ტექნიკა &amp; ინვენტარი</span>
                  <ul className="text-body-sm font-body-sm text-text-muted space-y-1.5">
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">laptop_mac</span> ლეპტოპი Lenovo ThinkPad L14 (ინვ. #NB-8821)</span>
                      <span className="text-label-sm font-label-sm text-[#059669]">გაცემულია</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">headset_mic</span> ყურსასმენი Jabra Evolve 40 (ინვ. #HD-104)</span>
                      <span className="text-label-sm font-label-sm text-[#059669]">გაცემულია</span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 border border-border-subtle rounded-lg bg-surface-bg flex flex-col gap-2">
                  <span className="text-body-sm font-body-sm font-semibold text-text-primary">Debitinfo.GE სისტემური წვდომები</span>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-surface-container text-primary text-[11px] font-semibold rounded">ქოლ-ცენტრის მოდული</span>
                    <span className="px-2 py-1 bg-surface-container text-primary text-[11px] font-semibold rounded">დებიტორთა რეესტრი (Read-Only)</span>
                    <span className="px-2 py-1 bg-surface-container text-primary text-[11px] font-semibold rounded">ზარების ჩაწერა (IP PBX)</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Dossier Footer Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-border-subtle flex items-center justify-between flex-wrap gap-2">
              <button className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-[#FDE68A] text-[#B45309] rounded-lg text-body-sm font-body-sm hover:bg-[#FEF3C7] transition-colors shadow-xs cursor-pointer" onClick={() => setIsWarningModalOpen(true)}>
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span>გაფრთხილების შედგენა</span>
              </button>
              <button className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-error text-error rounded-lg text-body-sm font-body-sm hover:bg-error-container/40 transition-colors shadow-xs cursor-pointer" onClick={confirmTermination}>
                <span className="material-symbols-outlined text-[16px]">person_remove</span>
                <span>შრომითი ურთიერთობის შეწყვეტა</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  {/* STATUS FOOTER */}
  <footer className="h-10 bg-surface-container-lowest border-t border-border-subtle px-space-lg flex items-center justify-between text-label-sm font-label-sm text-text-muted shrink-0 z-20">
    <div className="flex items-center gap-4">
      <span>© 2025 Debitinfo.GE • საქართველოს საკრედიტო &amp; დებიტორული მონაცემთა სისტემა</span>
      <span className="hidden md:inline text-border-subtle">|</span>
      <span className="hidden md:inline">სერვერის დრო: 14:38:19 (Tbilisi, GMT+4)</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1 text-[#059669]">
        <span className="material-symbols-outlined text-[14px]">lock</span> 256-Bit SSL დაცული კავშირი
      </span>
      <span className="text-border-subtle">|</span>
      <span className="text-text-primary font-medium">RS.GE API: v3.11 Connected</span>
    </div>
  </footer>
  {/* MODAL 1: REGISTRATION MODAL (+ ახალი თანამშრომლის რეგისტრაცია) */}
  <div className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 ${isRegisterModalOpen ? '' : 'hidden'}`} id="registerModal" onClick={() => setIsRegisterModalOpen(false)}>
    <div className="bg-surface-card border border-border-subtle rounded-xl shadow-2xl max-w-2xl w-full max-h-[921px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
      {/* Modal Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-bg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary">ახალი თანამშრომლის რეგისტრაცია</h3>
            <p className="text-body-sm font-body-sm text-text-muted">RS.GE ბაზაში გადამოწმება &amp; პერსონალის დოსიეს შექმნა</p>
          </div>
        </div>
        <button className="text-text-muted hover:text-text-primary p-1 rounded-lg cursor-pointer" onClick={() => setIsRegisterModalOpen(false)}>
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      {/* Modal Body Form */}
      <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
        {/* Step 1: Personal Data */}
        <div>
          <h4 className="text-body-md font-body-md font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">1</span>
            პერსონალური მონაცემები
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">სახელი *</label>
              <input className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20" placeholder="მაგ. ნიკოლოზ" type="text" />
            </div>
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">გვარი *</label>
              <input className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20" placeholder="მაგ. გელოვანი" type="text" />
            </div>
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">პირადი ნომერი (11 ნიშნა) *</label>
              <div className="relative">
                <input className="w-full bg-surface-card border border-border-subtle rounded-lg pl-3 pr-20 py-2 text-body-md font-body-md font-mono focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20" maxLength={11} placeholder="010240..." type="text" />
                <button className="absolute right-1.5 top-1.5 px-2 py-1 bg-surface-container text-primary rounded text-[11px] font-semibold hover:bg-surface-container-high" type="button">
                  RS.GE შემოწმება
                </button>
              </div>
            </div>
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">დაბადების თარიღი *</label>
              <input className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20" type="date" />
            </div>
          </div>
        </div>
        {/* Step 2: Position & Department */}
        <div className="pt-2 border-t border-border-subtle">
          <h4 className="text-body-md font-body-md font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">2</span>
            პოზიცია და დეპარტამენტი
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">დეპარტამენტი *</label>
              <select className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20">
                <option value="">აირჩიეთ დეპარტამენტი...</option>
                <option value="analyst">ანალიტიკოსთა გუნდი</option>
                <option value="legal">იურიდიული დეპარტამენტი</option>
                <option value="callcenter">ქოლ-ცენტრი &amp; მონიტორინგი</option>
                <option value="field">ვიზიტორები (Field)</option>
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">სამუშაო პოზიცია *</label>
              <input className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20" placeholder="მაგ. უმცროსი იურისტ-კონსულტანტი" type="text" />
            </div>
          </div>
        </div>
        {/* Step 3: Banking details */}
        <div className="pt-2 border-t border-border-subtle">
          <h4 className="text-body-md font-body-md font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">3</span>
            სახელფასო ბარათი &amp; ანაზღაურება
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">ბანკი</label>
              <select className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md">
                <option>თიბისი ბანკი (TBC)</option>
                <option>საქართველოს ბანკი (BOG)</option>
                <option>ლიბერთი ბანკი (LB)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">IBAN ანგარიში *</label>
              <input className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md font-mono" placeholder="GE..." type="text" />
            </div>
          </div>
        </div>
        {/* Step 4: System Roles & Password */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <input defaultChecked className="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4" id="sendSms" type="checkbox" />
            <label className="text-body-sm font-body-sm text-text-primary font-medium" htmlFor="sendSms">დროებითი პაროლის და სისტემაში წვდომის SMS-ით გაგზავნა</label>
          </div>
        </div>
      </div>
      {/* Modal Footer */}
      <div className="p-4 border-t border-border-subtle bg-slate-50 flex items-center justify-end gap-2">
        <button className="px-4 py-2 border border-border-subtle rounded-lg text-body-md font-body-md text-text-muted hover:bg-white transition-colors cursor-pointer" onClick={() => setIsRegisterModalOpen(false)}>
          გაუქმება
        </button>
        <button className="px-4 py-2 bg-primary-container text-white rounded-lg text-body-md font-body-md hover:bg-[#0A37CA] transition-colors shadow-sm font-medium cursor-pointer" onClick={saveEmployee}>
          თანამშრომლის რეგისტრაცია &amp; შენახვა
        </button>
      </div>
    </div>
  </div>
  {/* MODAL 2: DISCIPLINARY WARNING MODAL (+ გაფრთხილების გაცემა) */}
  <div className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 ${isWarningModalOpen ? '' : 'hidden'}`} id="warningModal" onClick={() => setIsWarningModalOpen(false)}>
    <div className="bg-surface-card border border-border-subtle rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
      {/* Warning Header */}
      <div className="p-4 border-b border-[#FDE68A] bg-[#FFFBEB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <h3 className="text-headline-sm font-headline-sm text-[#92400E]">დისციპლინური გაფრთხილების შედგენა</h3>
            <p className="text-body-sm font-body-sm text-[#B45309]">ოფიციალური ჩანაწერი პერსონალის დოსიეში</p>
          </div>
        </div>
        <button className="text-text-muted hover:text-text-primary p-1 rounded-lg cursor-pointer" onClick={() => setIsWarningModalOpen(false)}>
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      {/* Warning Body */}
      <div className="p-5 space-y-3">
        <div>
          <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">თანამშრომელი</label>
          <input className="w-full bg-slate-100 border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary font-medium" readOnly type="text" defaultValue="თეონა პეტრიაშვილი (ქოლ-ცენტრი)" />
        </div>
        <div>
          <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">გაფრთხილების ტიპი *</label>
          <select className="w-full bg-surface-card border border-border-subtle rounded-lg px-3 py-2 text-body-md font-body-md">
            <option>სიტყვიერი შენიშვნა</option>
            <option>წერილობითი გაფრთხილება</option>
            <option>მკაცრი საყვედური (ხელფასის დაკავებით)</option>
          </select>
        </div>
        <div>
          <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">დარღვევის აღწერა და საფუძველი *</label>
          <textarea className="w-full bg-surface-card border border-border-subtle rounded-lg p-3 text-body-md font-body-md focus:border-secondary-container" placeholder="დეტალურად აღწერეთ მომხდარი ფაქტი, დრო და გარემოებები..." rows={3} defaultValue={""} />
        </div>
        <div className="p-3 bg-error-container/30 border border-error/20 rounded-lg text-body-sm font-body-sm text-error">
          გაფრთხილება ავტომატურად გადაეგზავნება თანამშრომელს კორპორატიულ მეილზე და დაერთვება საქმეს.
        </div>
      </div>
      {/* Warning Footer */}
      <div className="p-4 border-t border-border-subtle bg-slate-50 flex items-center justify-end gap-2">
        <button className="px-4 py-2 border border-border-subtle rounded-lg text-body-md font-body-md text-text-muted hover:bg-white cursor-pointer" onClick={() => setIsWarningModalOpen(false)}>
          გაუქმება
        </button>
        <button className="px-4 py-2 bg-[#B45309] text-white rounded-lg text-body-md font-body-md hover:bg-[#92400E] shadow-sm font-medium cursor-pointer" onClick={issueWarning}>
          გაფრთხილების გაცემა &amp; გაგზავნა
        </button>
      </div>
    </div>
  </div>
  {/* INLINE JAVASCRIPT FOR INTERACTION */}
</div>

    </div>
  );
}
