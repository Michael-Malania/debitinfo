'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {

  const [step, setStep] = useState(1);
  const [entityType, setEntityType] = useState<'legal' | 'physical'>('legal');

  return (
    <div className="min-h-screen flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary selection:text-white">
<div>
  {/* TopNavBar (Shared Component) */}
  <header className="bg-surface-card dark:bg-inverse-surface docked full-width top-0 sticky z-50 border-b border-border-subtle dark:border-outline shadow-sm">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo */}
      <a className="flex items-center gap-2 group" href="/">
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
          <span className="material-symbols-outlined text-accent-mint" data-icon="account_balance">account_balance</span>
        </div>
        <div className="flex flex-col">
          <span className="text-headline-sm font-headline-sm font-bold text-primary dark:text-inverse-primary tracking-tight">Debitinfo.GE</span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted leading-none">Fintech Registry</span>
        </div>
      </a>
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center space-x-6">
        <a className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="#">სერვისები</a>
        <a className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="#">რეესტრი</a>
        <a className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="#">ტარიფები</a>
        <a className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="#">ბლოგი</a>
        <a className="text-text-muted dark:text-outline-variant font-label-md text-label-md hover:text-primary dark:hover:text-inverse-primary transition-colors duration-150" href="#">კონტაქტი</a>
      </nav>
      {/* Trailing Actions */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-slate-100 text-text-muted hover:text-text-primary transition text-xs font-mono" type="button">
          <span className="material-symbols-outlined text-sm" data-icon="language">language</span>
          <span className="font-semibold">GE</span>
        </button>
        <a className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-label-md font-label-md text-primary dark:text-inverse-primary hover:bg-slate-100 rounded-lg transition active:scale-95 duration-100" href="#">
          შესვლა
        </a>
        <a className="inline-flex items-center justify-center px-4 py-2 text-label-md font-label-md bg-primary-container text-white rounded-lg shadow-sm hover:bg-[#0A37CA] transition active:scale-95 duration-100" href="#">
          რეგისტრაცია
        </a>
      </div>
    </div>
  </header>
  {/* Main Canvas / Content Container */}
  <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative flex items-center justify-center">
    {/* Registration Card */}
    <div className="w-full max-w-4xl bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-10 transition-all duration-300">
      {/* Card Header */}
      <div className="flex flex-col items-center text-center pb-8 border-b border-border-subtle">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-border-subtle mb-4 shadow-sm relative">
          <span className="material-symbols-outlined text-3xl text-primary" data-icon="shield_person">shield_person</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-mint rounded-full border-2 border-white" />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">რეგისტრაცია</h1>
        <p className="font-body-md text-text-muted mt-2 max-w-md">შეავსეთ მონაცემები პორტალზე წვდომისთვის</p>
      </div>
      {/* Registration Form */}
      <form className="mt-8 space-y-8" id="registrationForm" onSubmit={(e) => e.preventDefault()}>
        {/* SUB-TOGGLE: Legal Entity vs Physical Person */}
        <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="entityTypeToggleSection">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" data-icon="domain" id="entityToggleIcon">{entityType === 'legal' ? 'domain' : 'person'}</span>
            <span className="font-headline-sm text-sm text-text-primary font-semibold">სუბიექტის ტიპი</span>
          </div>
          <div className="inline-flex p-1 bg-white border border-border-subtle rounded-lg shadow-2xs self-start sm:self-auto" role="tablist">
            <button aria-selected={entityType === 'legal'} className={`px-4 py-1.5 text-xs rounded-md transition-all duration-150 cursor-pointer ${entityType === 'legal' ? 'font-semibold bg-primary-container text-white shadow-xs' : 'font-medium text-text-muted hover:text-text-primary'}`} id="btnLegalEntity" onClick={() => setEntityType('legal')} role="tab" type="button">იურიდიული პირი</button>
            <button aria-selected={entityType === 'physical'} className={`px-4 py-1.5 text-xs rounded-md transition-all duration-150 cursor-pointer ${entityType === 'physical' ? 'font-semibold bg-primary-container text-white shadow-xs' : 'font-medium text-text-muted hover:text-text-primary'}`} id="btnPhysicalEntity" onClick={() => setEntityType('physical')} role="tab" type="button">ფიზიკური პირი</button>
          </div>
        </div>
        {/* ======================================================== */}
        {/* SECTION GROUP 1: LEGAL ENTITY                            */}
        {/* ======================================================== */}
        <div className={`space-y-8 ${entityType === 'legal' ? '' : 'hidden'}`} id="legal-entity-fields">
          {/* Block 1: ორგანიზაციის მონაცემები */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary" />
                ორგანიზაციის მონაცემები
              </h2>
              <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-full bg-slate-100 text-text-muted border border-border-subtle flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary" data-icon="sync">sync</span>
                RS.GE სინქრონიზაცია
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სამართლებრივი ფორმა *</label>
                <div className="relative">
                  <select className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-body-md text-text-primary focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all">
                    <option value="ltd">შპს (შეზღუდული პასუხისმგებლობის საზოგადოება)</option>
                    <option value="ie">ინდ. მეწარმე</option>
                    <option value="jsc">სს (სააქციო საზოგადოება)</option>
                    <option value="nnle">ა(ა)იპ</option>
                    <option value="cl">კს (კომანდიტური საზოგადოება)</option>
                    <option value="gl">სპს (სოლიდარული პასუხისმგებლობის საზოგადოება)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">კომპანიის დასახელება *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="მაგ: შპს ჯეო ტრეიდინგ გრუპი" required type="text" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-md text-label-md text-text-muted">საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) *</label>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">RS.GE მოწმდება</span>
                </div>
                <div className="relative">
                  <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all pr-9" maxLength={9} placeholder="405123456" required type="text" />
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-base">verified</span>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">იურიდიული მისამართი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ქ. თბილისი, ჭავჭავაძის გამზ. 34" required type="text" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">ფაქტობრივი მისამართი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ქ. თბილისი, ვაჟა-ფშაველას გამზ. 12, ბლოკი B" required type="text" />
              </div>
            </div>
          </div>
          {/* Block 2: დირექტორის / ხელმძღვანელის მონაცემები */}
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              ხელმძღვანელის / დირექტორის მონაცემები
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">დირექტორის სახელი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="გიორგი" required type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">დირექტორის გვარი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ბერიძე" required type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">პირადი ნომერი (11 ნიშნა) *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" maxLength={11} placeholder="01019012345" required type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">მობილური ტელეფონი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="+995 599 00 00 00" required type="tel" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სამსახურებრივი ელფოსტა *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="director@company.ge" required type="email" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">იურიდიული მისამართი</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ქ. თბილისი, პეკინის 15" type="text" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სისტემის პაროლი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="მინიმუმ 8 სიმბოლო" required type="password" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">გაიმეორეთ პაროლი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="გაიმეორეთ პაროლი" required type="password" />
              </div>
            </div>
          </div>
          {/* Block 3: ბუღალტრის მონაცემები */}
          <div className="p-5 rounded-xl border border-border-subtle bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-muted" data-icon="calculate">calculate</span>
                <h3 className="font-headline-sm text-sm font-semibold text-text-primary">ბუღალტრის საკონტაქტო მონაცემები</h3>
              </div>
              <span className="text-label-sm font-label-sm px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                არასავალდებულო / რეკომენდებული
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1">სახელი</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary" placeholder="ნინო" type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1">გვარი</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary" placeholder="კაპანაძე" type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1">ტელეფონი</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary focus:outline-none focus:border-secondary" placeholder="+995 577 00 00 00" type="tel" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1">ელფოსტა</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary" placeholder="accountant@company.ge" type="email" />
              </div>
            </div>
          </div>
        </div>
        {/* ======================================================== */}
        {/* SECTION GROUP 2: INDIVIDUAL / PHYSICAL PERSON             */}
        {/* ======================================================== */}
        <div className={`space-y-8 ${entityType === 'physical' ? '' : 'hidden'}`} id="individual-fields">
          {/* Block 1: ფიზიკური პირის პერსონალური მონაცემები */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary" />
                ფიზიკური პირის პერსონალური მონაცემები
              </h2>
              <span className="text-label-sm font-label-sm px-2 py-0.5 rounded-full bg-slate-100 text-text-muted border border-border-subtle flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary" data-icon="badge">badge</span>
                სამოქალაქო რეესტრი
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სახელი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="დავით" required type="text" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">გვარი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="მაისურაძე" required type="text" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-md text-label-md text-text-muted">პირადი ნომერი (11 ნიშნა) *</label>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">RS.GE შემოწმება</span>
                </div>
                <div className="relative">
                  <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all pr-20" maxLength={11} placeholder="01024098765" required type="text" />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-text-primary rounded border border-border-subtle flex items-center gap-1 transition-colors" type="button">
                    <span className="material-symbols-outlined text-xs text-primary" data-icon="check_circle">check_circle</span>
                    შემოწმება
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">დაბადების თარიღი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" type="date" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">ფაქტობრივი მისამართი / საცხოვრებელი ადგილი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ქ. თბილისი, ვაჟა-ფშაველას გამზ. 45, ბ. 18" required type="text" />
              </div>
              <div className="md:col-span-3">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">რეგისტრირებული (იურიდიული) მისამართი</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="ქ. თბილისი, რუსთაველის გამზ. 24, ბინა 6 (თუ ემთხვევა ფაქტობრივს, დატოვეთ ცარიელი)" type="text" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-label-md text-label-md text-text-muted">მობილური ტელეფონი *</label>
                  <span className="text-[10px] font-mono text-primary bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">SMS ვერიფიკაცია</span>
                </div>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-data-mono-md text-data-mono-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="+995 555 12 34 56" required type="tel" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">ელექტრონული ფოსტა *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="user@gmail.com" required type="email" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სისტემის პაროლი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="მინიმუმ 8 სიმბოლო" required type="password" />
              </div>
              <div className="md:col-span-2">
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">გაიმეორეთ პაროლი *</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="გაიმეორეთ პაროლი" required type="password" />
              </div>
            </div>
          </div>
          {/* Block 2: დასაქმების / შემოსავლის ინფორმაცია */}
          <div className="p-5 rounded-xl border border-border-subtle bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-text-muted" data-icon="work">work</span>
                <h3 className="font-headline-sm text-sm font-semibold text-text-primary">დასაქმების / შემოსავლის ინფორმაცია</h3>
              </div>
              <span className="text-label-sm font-label-sm px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                არასავალდებულო / რეკომენდებული
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">სტატუსი</label>
                <select className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-body-md text-text-primary focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all">
                  <option value="employed">დასაქმებული (კერძო/საჯარო სექტორი)</option>
                  <option value="self_employed">თვითდასაქმებული</option>
                  <option value="individual_entrepreneur">ინდ. მეწარმე</option>
                  <option value="freelancer">ფრილანსერი / დისტანციური</option>
                  <option value="other">სხვა</option>
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-text-muted mb-1.5">დამსაქმებელი ორგანიზაცია</label>
                <input className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all" placeholder="მაგ: შპს ევექსი, სს თიბისი ბანკი" type="text" />
              </div>
            </div>
          </div>
        </div>
        {/* ======================================================== */}
        {/* FORM FOOTER & SUBMISSION BLOCK                           */}
        {/* ======================================================== */}
        <div className="pt-6 border-t border-border-subtle space-y-6">
          {/* Terms Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input defaultChecked className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle transition" type="checkbox" />
            <span className="text-body-sm font-body-sm text-text-muted leading-relaxed">
              ვეთანხმები Debitinfo.GE-ის 
              <a className="text-primary underline hover:text-blue-700 font-medium" href="#">წესებს</a>, 
              <a className="text-primary underline hover:text-blue-700 font-medium" href="#">მომსახურების პირობებსა</a> და 
              <a className="text-primary underline hover:text-blue-700 font-medium" href="#">კონფიდენციალურობის პოლიტიკას</a>.
            </span>
          </label>
          {/* Primary Submit Button */}
          <button className="w-full py-3.5 px-6 rounded-lg bg-primary-container text-white font-headline-sm text-sm font-semibold hover:bg-[#0A37CA] active:scale-[0.99] transition duration-150 shadow-md flex items-center justify-center gap-2 group" type="submit">
            <span className="">რეგისტრაციის დასრულება</span>
            <span className="material-symbols-outlined text-accent-mint transition group-hover:translate-x-1" data-icon="arrow_forward">arrow_forward</span>
          </button>
          {/* Login Link */}
          <div className="text-center">
            <p className="text-body-md text-text-muted">
              უკვე გაქვთ ანგარიში? 
              <a className="text-primary font-semibold hover:underline ml-1" href="#">შედით სისტემაში</a>
            </p>
          </div>
          {/* Trust Badges & Institutional Compliance */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-text-muted">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-emerald-600 text-lg" data-icon="lock">lock</span>
              <span className="font-mono text-[11px]">256-bit SSL დაშიფვრა</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-primary text-lg" data-icon="sync_alt">sync_alt</span>
              <span className="font-mono text-[11px]">RS.GE თავსებადობა</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="material-symbols-outlined text-secondary text-lg" data-icon="verified_user">verified_user</span>
              <span className="font-mono text-[11px]">პერსონალურ მონაცემთა დაცვა</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  </main>
  {/* Footer (Shared Component) */}
  <footer className="bg-surface-card dark:bg-inverse-surface docked full-width bottom-0 border-t border-border-subtle dark:border-outline">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-accent-mint text-xl" data-icon="account_balance">account_balance</span>
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary dark:text-inverse-primary">Debitinfo.GE</span>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">კონფიდენციალურობის პოლიტიკა</a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">მომსახურების პირობები</a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">რეკვიზიტები</a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">საგადასახადო შემოწმება</a>
          <a className="text-text-muted dark:text-outline-variant text-body-sm font-body-sm hover:text-primary dark:hover:text-inverse-primary hover:underline transition-colors duration-150" href="#">საკონტაქტო პირი</a>
        </nav>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <p className="">© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            სისტემა ონლაინ რეჟიმშია
          </span>
          <span className="font-mono text-slate-400">v2.4.0</span>
        </div>
      </div>
    </div>
  </footer>
  {/* Interactive Logic for Entity Type Switching */}
</div>

    </div>
  );
}
