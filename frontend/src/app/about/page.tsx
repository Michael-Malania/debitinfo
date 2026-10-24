'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {

  return (
    <div className="bg-surface-bg text-text-primary antialiased selection:bg-primary selection:text-white">
<div>
  {/* ================= TOP NAVIGATION BAR (SHARED COMPONENT) ================= */}
  <header className="bg-surface-card dark:bg-inverse-surface docked full-width top-0 sticky z-50 shadow-sm border-b border-border-subtle dark:border-outline">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo */}
      <a className="flex items-center gap-2 group" href="/">
        <span className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-headline-sm shadow-sm transition-transform group-hover:scale-105">
          D
        </span>
        <span className="text-headline-sm font-headline-sm font-bold text-primary dark:text-inverse-primary tracking-tight flex items-baseline">
          Debitinfo<span className="text-secondary-container">.GE</span>
        </span>
      </a>
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="/">
          მთავარი გვერდი
        </Link>
        <Link className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="/#services">
          სერვისები
        </Link>
        {/* Active Nav: ჩვენს შესახებ */}
        <Link className="text-primary dark:text-inverse-primary font-label-md text-label-md border-b-2 border-primary dark:border-inverse-primary pb-1" href="/about">
          ჩვენს შესახებ
        </Link>
        <Link className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="/#pricing">
          ტარიფები
        </Link>
        <Link className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="/#blog">
          ბლოგი
        </Link>
        <Link className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="/contact">
          კონტაქტი
        </Link>
      </nav>
      {/* Trailing Action Cluster */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-primary hover:border-primary transition-colors text-label-sm font-label-sm">
          <span className="material-symbols-outlined text-[16px]">language</span>
          <span>GE</span>
        </button>
        {/* Secondary Action: შესვლა */}
        <Link className="text-text-muted hover:text-primary font-label-md text-label-md transition-colors px-2 py-1" href="/login">
          შესვლა
        </Link>
        {/* Primary Action: რეგისტრაცია */}
        <Link className="bg-primary-container text-white px-4 py-2 rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary active:scale-95 transition-all duration-150 flex items-center gap-1.5" href="/register">
          <span>რეგისტრაცია</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  </header>
  <main className="w-full">
    {/* ================= HERO SECTION ================= */}
    <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-surface-card to-surface-bg border-b border-border-subtle">
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#0D45FC 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-fixed/30 border border-primary-fixed text-primary font-label-md text-label-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            ფინანსური მედიაციის ინოვაციური პლატფორმა
          </div>
          {/* Main Title */}
          <h1 className="text-headline-xl font-headline-xl tracking-tight text-text-primary">
            ვაკავშირებთ მხარეებს, ვაგვარებთ <span className="text-primary underline decoration-secondary-container decoration-4 underline-offset-4">ჩიხურ ფინანსურ</span> დავებს
          </h1>
          {/* Subtitle */}
          <p className="text-body-lg font-body-lg text-text-muted leading-relaxed">
            Debitinfo.GE არის ნეიტრალური, ტექნოლოგიური მედიატორი, რომელიც ეხმარება კრედიტორებსა და დებიტორებს კონსტრუქციული შეთანხმების მიღწევაში, სასამართლო დავების თავიდან არიდებასა და რეპუტაციული რისკების მინიმიზაციაში.
          </p>
          {/* Interactive Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a className="bg-primary-container hover:bg-primary text-white font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-2" href="#mediation-process">
              <span>როგორ მუშაობს პროცესი</span>
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </a>
            <a className="bg-surface-card border border-border-subtle text-text-primary hover:border-secondary-container font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm transition-all flex items-center gap-2" href="#standards">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span>სტანდარტები &amp; უსაფრთხოება</span>
            </a>
          </div>
        </div>
        {/* Quick KPI Stats Bar (Bento-style Strip) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-surface-card rounded-xl border border-border-subtle shadow-sm">
          {/* KPI 1 */}
          <div className="p-4 rounded-lg bg-surface-bg border border-border-subtle/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-sm font-label-sm text-text-muted">მართული პორტფელი</span>
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
            </div>
            <div className="text-data-mono-lg font-data-mono-lg text-text-primary tracking-tight">₾64,800,000+</div>
            <span className="text-body-sm font-body-sm text-text-muted mt-1">სრულად ვერიფიცირებული</span>
          </div>
          {/* KPI 2 */}
          <div className="p-4 rounded-lg bg-surface-bg border border-border-subtle/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-sm font-label-sm text-text-muted">წარმატების მაჩვენებელი</span>
              <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold bg-accent-mint/15 text-on-surface">Rating A</span>
            </div>
            <div className="text-data-mono-lg font-data-mono-lg text-primary tracking-tight">94.2%</div>
            <span className="text-body-sm font-body-sm text-text-muted mt-1">დარეგულირებული მედიაცია</span>
          </div>
          {/* KPI 3 */}
          <div className="p-4 rounded-lg bg-surface-bg border border-border-subtle/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-sm font-label-sm text-text-muted">პარტნიორი ქსელი</span>
              <span className="material-symbols-outlined text-secondary-container text-[20px]">handshake</span>
            </div>
            <div className="text-data-mono-lg font-data-mono-lg text-text-primary tracking-tight">1,240+</div>
            <span className="text-body-sm font-body-sm text-text-muted mt-1">აქტიური იურიდიული პირი</span>
          </div>
          {/* KPI 4 */}
          <div className="p-4 rounded-lg bg-surface-bg border border-border-subtle/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-sm font-label-sm text-text-muted">სასამართლო რისკი</span>
              <span className="material-symbols-outlined text-accent-mint text-[20px]">gavel</span>
            </div>
            <div className="text-data-mono-lg font-data-mono-lg text-emerald-600 tracking-tight">0%</div>
            <span className="text-body-sm font-body-sm text-text-muted mt-1">შეთანხმების გაფორმებისას</span>
          </div>
        </div>
      </div>
    </section>
    {/* ================= MISSION & ROLE SECTION (3 PILLARS) ================= */}
    <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <span className="text-label-md font-label-md text-primary font-semibold tracking-wider">მედიატორის როლი</span>
        <h2 className="text-headline-lg font-headline-lg text-text-primary">
          ჩვენი როლი: ობიექტური მედიატორი ორ სუბიექტს შორის
        </h2>
        <p className="text-body-md font-body-md text-text-muted">
          დამოუკიდებელი ტექნოლოგიური არბიტრი, რომელიც აბალანსებს ფინანსურ ინტერესებს და ქმნის ორივე მხარისთვის უსაფრთხო სამართლებრივ გარემოს.
        </p>
      </div>
      {/* 3 Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pillar 1 */}
        <div className="bg-surface-card rounded-xl p-8 border border-border-subtle shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <span className="material-symbols-outlined text-[26px]">balance</span>
          </div>
          <h3 className="text-headline-sm font-headline-sm text-text-primary mb-3">
            ნეიტრალური პოზიცია და მიუკერძოებლობა
          </h3>
          <p className="text-body-md font-body-md text-text-muted leading-relaxed">
            არ ვართ კოლექტორები; ჩვენ ვართ დამოუკიდებელი მედიატორები, რომლებიც პატივს სცემენ ორივე მხარის კანონიერ უფლებებსა და ფინანსურ შესაძლებლობებს.
          </p>
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-2 text-label-sm font-label-sm text-primary">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>ინტერესთა კონფლიქტის გარეშე</span>
          </div>
        </div>
        {/* Pillar 2 */}
        <div className="bg-surface-card rounded-xl p-8 border border-border-subtle shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <span className="material-symbols-outlined text-[26px]">database</span>
          </div>
          <h3 className="text-headline-sm font-headline-sm text-text-primary mb-3">
            RS.GE &amp; საბანკო მონაცემთა ინტეგრაცია
          </h3>
          <p className="text-body-md font-body-md text-text-muted leading-relaxed">
            გადამოწმებული საგადასახადო და სამართლებრივი სტატუსი, რაც გამორიცხავს უსაფუძვლო პრეტენზიებს და აყალიბებს რეალურ რესტრუქტურიზაციის გეგმას.
          </p>
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-2 text-label-sm font-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>ოფიციალური სახელმწიფო წყაროები</span>
          </div>
        </div>
        {/* Pillar 3 */}
        <div className="bg-surface-card rounded-xl p-8 border border-border-subtle shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-lg bg-primary-fixed/40 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <span className="material-symbols-outlined text-[26px]">handshake</span>
          </div>
          <h3 className="text-headline-sm font-headline-sm text-text-primary mb-3">
            კონსტრუქციული შეთანხმება და რესტრუქტურიზაცია
          </h3>
          <p className="text-body-md font-body-md text-text-muted leading-relaxed">
            მოქნილი გრაფიკები, ურთიერთმისაღები კომპრომისები და ორმხრივად დამოწმებული შეთანხმების ოქმი, რომელსაც აქვს იურიდიული ძალა.
          </p>
          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-2 text-label-sm font-label-sm text-primary">
            <span className="material-symbols-outlined text-[16px]">draw</span>
            <span>ორმხრივი ელ-ხელმოწერა</span>
          </div>
        </div>
      </div>
    </section>
    {/* ================= HOW MEDIATION WORKS (4 PROCESS STEPS) ================= */}
    <section className="py-20 bg-surface-card border-y border-border-subtle" id="mediation-process">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-label-md font-label-md text-primary font-semibold tracking-wider">მეთოდოლოგია</span>
            <h2 className="text-headline-lg font-headline-lg text-text-primary">
              როგორ მუშაობს მედიაცია: 4 მარტივი ეტაპი
            </h2>
          </div>
          <p className="text-body-md font-body-md text-text-muted max-w-md">
            პროცესი სრულად ციფრულია, გამჭვირვალე და დაცული, საშუალოდ 7-დან 14 სამუშაო დღემდე ვადით.
          </p>
        </div>
        {/* 4 Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="relative bg-surface-bg p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-data-mono-md font-data-mono-md text-primary font-bold">01</span>
                <span className="w-8 h-8 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                </span>
              </div>
              <h4 className="text-headline-sm font-headline-sm text-text-primary mb-2">რეგისტრაცია და ანალიზი</h4>
              <p className="text-body-sm font-body-sm text-text-muted">
                RS.GE რეესტრის სინქრონიზაცია, მონაცემთა გადამოწმება და საქმის პირველადი იურიდიული აუდიტი.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-border-subtle/80 text-label-sm font-label-sm text-text-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>1 სამუშაო დღე</span>
            </div>
          </div>
          {/* Step 2 */}
          <div className="relative bg-surface-bg p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-data-mono-md font-data-mono-md text-primary font-bold">02</span>
                <span className="w-8 h-8 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </span>
              </div>
              <h4 className="text-headline-sm font-headline-sm text-text-primary mb-2">ნეიტრალური კომუნიკაცია</h4>
              <p className="text-body-sm font-body-sm text-text-muted">
                შეფასება ექსპერტისა და ანალიტიკოსის ჩართულობით, ორივე მხარის პოზიციის ობიექტური შეჯერება.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-border-subtle/80 text-label-sm font-label-sm text-text-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>2-4 სამუშაო დღე</span>
            </div>
          </div>
          {/* Step 3 */}
          <div className="relative bg-surface-bg p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-data-mono-md font-data-mono-md text-primary font-bold">03</span>
                <span className="w-8 h-8 rounded-full bg-primary-fixed/40 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                </span>
              </div>
              <h4 className="text-headline-sm font-headline-sm text-text-primary mb-2">პირობების მოდელირება</h4>
              <p className="text-body-sm font-body-sm text-text-muted">
                ციფრული შეთანხმების გეგმა, ინდივიდუალური გადახდის გრაფიკის სიმულაცია და კომპრომისების პაკეტი.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-border-subtle/80 text-label-sm font-label-sm text-text-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>3-5 სამუშაო დღე</span>
            </div>
          </div>
          {/* Step 4 */}
          <div className="relative bg-surface-bg p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-data-mono-md font-data-mono-md text-emerald-600 font-bold">04</span>
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                </span>
              </div>
              <h4 className="text-headline-sm font-headline-sm text-text-primary mb-2">შეთანხმების გაფორმება</h4>
              <p className="text-body-sm font-body-sm text-text-muted">
                ვალდებულების ეტაპობრივი დახურვა და ოფიციალურ რეესტრში სტატუსის მყისიერი განახლება.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-border-subtle/80 text-label-sm font-label-sm text-emerald-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>სრული ფინანსური რემედიაცია</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* ================= COMPANY VALUES & STANDARDS ================= */}
    <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8" id="standards">
      <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 lg:p-12 shadow-sm">
        <div className="max-w-2xl mb-12">
          <span className="text-label-md font-label-md text-primary font-semibold tracking-wider">ხარისხი და უსაფრთხოება</span>
          <h2 className="text-headline-lg font-headline-lg text-text-primary mt-2">
            უსაფრთხოების სტანდარტები და კორპორატიული პრინციპები
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Value 1 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary">კონფიდენციალურობა</h3>
            <p className="text-body-md font-body-md text-text-muted leading-relaxed">
              256-bit SSL დაშიფვრა, ISO 27001 პროტოკოლები და პერსონალურ მონაცემთა დაცვის შესახებ საქართველოს კანონმდებლობასთან სრული შესაბამისობა.
            </p>
            <ul className="space-y-2 pt-2 text-body-sm font-body-sm text-text-muted">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                <span>დაშიფრული კომუნიკაციის არხი</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                <span>ავტორიზებული წვდომა როლების მიხედვით</span>
              </li>
            </ul>
          </div>
          {/* Value 2 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary">ტექნოლოგიური სიზუსტე</h3>
            <p className="text-body-md font-body-md text-text-muted leading-relaxed">
              AI Smart Route &amp; Scoring ანალიტიკური მოდელები, რომლებიც აფასებენ გადახდისუნარიანობის დინამიკას ობიექტური ფაქტორების მიხედვით.
            </p>
            <ul className="space-y-2 pt-2 text-body-sm font-body-sm text-text-muted">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[16px]">check</span>
                <span>ავტომატური რისკ-შეფასება</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-container text-[16px]">check</span>
                <span>მოდელირების მაღალი სიზუსტე</span>
              </li>
            </ul>
          </div>
          {/* Value 3 */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-[22px]">trending_up</span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary">ეკონომიკური სტაბილურობა</h3>
            <p className="text-body-md font-body-md text-text-muted leading-relaxed">
              ბიზნეს ურთიერთობების შენარჩუნება, ჯაჭვური გაკოტრებების პრევენცია და ადგილობრივ ეკონომიკურ ეკოსისტემაში ნდობის განმტკიცება.
            </p>
            <ul className="space-y-2 pt-2 text-body-sm font-body-sm text-text-muted">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                <span>პარტნიორული კავშირების შენარჩუნება</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">check</span>
                <span>სასამართლო დანახარჯების 90%-მდე დაზოგვა</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    {/* ================= NEWS & MEDIA SECTION (3 NEWS CARDS) ================= */}
    <section className="py-20 bg-surface-bg border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-label-md font-label-md text-primary font-semibold tracking-wider">სიახლეები &amp; ანალიტიკა</span>
            <h2 className="text-headline-lg font-headline-lg text-text-primary mt-2">
              სიახლეები და ფინანსური ანალიტიკა
            </h2>
          </div>
          <a className="inline-flex items-center gap-1.5 text-primary hover:text-primary-container font-label-md text-label-md group transition-colors" href="#">
            <span>ყველა სიახლის ნახვა</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>
        {/* 3 News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <article className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-label-sm font-label-sm text-text-muted">
                <span className="px-2.5 py-1 rounded-full bg-primary-fixed/30 text-primary font-semibold">ანალიტიკა</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>5 წთ წასაკითხი</span>
                </span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                ფინანსური მედიაციის ახალი სტანდარტები საქართველოში: როგორ ავირიდოთ სასამართლო დავები
              </h3>
              <p className="text-body-sm font-body-sm text-text-muted line-clamp-3">
                სამართლებრივი რეფორმის ანალიზი და ალტერნატიული დავების გადაწყვეტის უპირატესობები მცირე და საშუალო საწარმოებისთვის 2024 წელს.
              </p>
            </div>
            <div className="p-6 pt-0 border-t border-border-subtle/40 flex items-center justify-between mt-auto">
              <span className="text-label-sm font-label-sm text-text-muted">14 მაისი, 2024</span>
              <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </span>
            </div>
          </article>
          {/* Card 2 */}
          <article className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-label-sm font-label-sm text-text-muted">
                <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-semibold">პლატფორმა</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>3 წთ წასაკითხი</span>
                </span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                RS.GE-ის ინტეგრაციის გაფართოება: იურიდიული პირების დავალიანების ავტომატური ვერიფიკაცია
              </h3>
              <p className="text-body-sm font-body-sm text-text-muted line-clamp-3">
                ახალი API მოდულის მეშვეობით პლატფორმაზე შესაძლებელი გახდა საგადასახადო ვალდებულებების პირდაპირი გადამოწმება რეალურ დროში.
              </p>
            </div>
            <div className="p-6 pt-0 border-t border-border-subtle/40 flex items-center justify-between mt-auto">
              <span className="text-label-sm font-label-sm text-text-muted">02 მაისი, 2024</span>
              <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </span>
            </div>
          </article>
          {/* Card 3 */}
          <article className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-label-sm font-label-sm text-text-muted">
                <span className="px-2.5 py-1 rounded-full bg-accent-mint/20 text-on-surface font-semibold">კვლევა</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>7 წთ წასაკითხი</span>
                </span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                ბიზნეს სექტორის დებიტორული დავალიანებების მართვა 2024 წელს - კვლევის შედეგები
              </h3>
              <p className="text-body-sm font-body-sm text-text-muted line-clamp-3">
                Debitinfo.GE-ის ექსპერტთა ჯგუფის მიერ მომზადებული ანგარიში ქართულ კომპანიებში ფულადი ნაკადების დაგვიანების მიზეზებზე.
              </p>
            </div>
            <div className="p-6 pt-0 border-t border-border-subtle/40 flex items-center justify-between mt-auto">
              <span className="text-label-sm font-label-sm text-text-muted">26 აპრილი, 2024</span>
              <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center">
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
    {/* ================= CTA BLOCK ================= */}
    <section className="py-20 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-8 lg:p-14 text-white relative overflow-hidden shadow-md">
        {/* Background accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-8 w-48 h-48 rounded-full bg-accent-mint/15 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="px-3 py-1 rounded-full bg-white/10 text-white font-label-sm text-label-sm backdrop-blur-sm border border-white/20">
            დაიწყეთ დღესვე
          </span>
          <h2 className="text-headline-xl font-headline-xl tracking-tight text-white">
            მზად ხართ გაამარტივოთ ფინანსური ურთიერთობები?
          </h2>
          <p className="text-body-lg font-body-lg text-white/90 leading-relaxed max-w-2xl">
            დაარეგისტრირეთ თქვენი კომპანია წამებში, მიიღეთ პირველადი უფასო ანალიტიკური კონსულტაცია და მოაგვარეთ დავები მშვიდობიანი მედიაციით.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <a className="bg-white text-primary font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2" href="#">
              <span>გაიარეთ რეგისტრაცია</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
            <a className="bg-transparent border border-white text-white font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-white/10 active:scale-95 transition-all" href="#">
              კონსულტაციის მოთხოვნა
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
  {/* ================= FOOTER (SHARED COMPONENT) ================= */}
  <footer className="bg-surface-card dark:bg-inverse-surface docked full-width bottom-0 border-t border-border-subtle dark:border-outline">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-8">
      {/* Top Row: Brand & Links */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border-subtle dark:border-outline">
        <a className="flex items-center gap-2" href="#">
          <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-headline-sm">
            D
          </span>
          <span className="text-headline-sm font-headline-sm font-bold text-primary dark:text-inverse-primary">
            Debitinfo.GE
          </span>
        </a>
        {/* Footer Links from JSON */}
        <nav className="flex flex-wrap items-center gap-6">
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">
            კონფიდენციალურობის პოლიტიკა
          </a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">
            მომსახურების პირობები
          </a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">
            რეკვიზიტები
          </a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">
            საგადასახადო შემოწმება
          </a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">
            საკონტაქტო პირი
          </a>
        </nav>
      </div>
      {/* Bottom Row: Copyright & Integration Notice */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-text-muted dark:text-outline-variant text-body-sm font-body-sm">
        <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-label-sm font-label-sm px-2.5 py-1 rounded bg-surface-bg border border-border-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>RS.GE Sync Active</span>
          </span>
          <span className="text-label-sm font-label-sm text-text-muted">SSL 256-Bit Secured</span>
        </div>
      </div>
    </div>
  </footer>
</div>

    </div>
  );
}
