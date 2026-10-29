'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isOps, setIsOps] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hostname.toLowerCase();
      const opsDomain =
        h.includes('ops.') ||
        h.includes('-ops') ||
        process.env.NEXT_PUBLIC_APP_TYPE === 'ops';

      if (opsDomain) {
        setIsOps(true);
        window.location.replace('/ops');
      }
    }
  }, []);

  const [currentSlide, setCurrentSlide] = useState(1);
  const [searchMode, setSearchMode] = useState('personal');
  const [searchValue, setSearchValue] = useState('');
  const [searchResultVisible, setSearchResultVisible] = useState(false);
  const [pricingTier, setPricingTier] = useState('individual');

  if (isOps) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-sm text-text-muted font-medium">გადამისამართება საოპერაციო პორტალზე...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-bg text-text-primary antialiased min-h-screen flex flex-col">
<div>
  {/* 1. Header (Navbar) */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo */}
      <a className="flex items-center gap-2 group" href="/">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold shadow-sm">
          <span className="material-symbols-outlined text-lg">assured_workload</span>
        </div>
        <span className="text-headline-sm font-headline-sm text-text-primary tracking-tight font-bold">
          Debitinfo<span className="text-primary-container">.GE</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse ml-0.5" />
      </a>
      {/* Desktop Navigation Menu */}
      <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
        <Link className="text-primary-container border-b-2 border-primary-container pb-1 font-label-md text-label-md" href="/">მთავარი გვერდი</Link>
        <a className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="#services">სერვისები</a>
        <a className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="#pricing">ტარიფები</a>
        <a className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="#blog">ბლოგი &amp; სიახლეები</a>
        <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/contact">კონტაქტი</Link>
      </nav>
      {/* Right Side Actions & Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="hidden sm:flex items-center p-1 bg-surface-bg rounded-lg border border-border-subtle text-body-sm font-label-md">
          <button className="px-2 py-0.5 rounded bg-surface-card text-primary-container font-semibold shadow-xs" type="button">GE</button>
          <button className="px-2 py-0.5 text-text-muted hover:text-text-primary transition-colors" type="button">EN</button>
          <button className="px-2 py-0.5 text-text-muted hover:text-text-primary transition-colors" type="button">RU</button>
        </div>
        {/* Auth Actions */}
        <div className="flex items-center gap-2">
          <Link className="px-3 py-1.5 rounded-lg text-body-md font-body-md text-text-primary hover:bg-surface-bg transition-colors duration-150 active:scale-95" href="/login">
            შესვლა
          </Link>
          <Link className="px-4 py-1.5 rounded-lg text-body-md font-body-md bg-primary-container text-on-primary hover:bg-primary transition-colors duration-150 shadow-sm font-medium active:scale-95 flex items-center gap-1" href="/register">
            <span>რეგისტრაცია</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  </header>
  {/* Main Content Flow */}
  <main className="flex-grow">
    {/* 2. Hero Section with Interactive Slider & Verification Search */}
    <section className="relative pt-8 pb-16 lg:py-20 bg-gradient-to-b from-surface-card to-surface-bg border-b border-border-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Slider & Mission Credo (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full pt-2">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-card border border-border-subtle w-fit mb-6 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-mint animate-ping" />
              <span className="text-body-sm font-body-sm text-text-muted flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary-container">verified_user</span>
                ოფიციალური მონაცემთა გადამცემი პლატფორმა
              </span>
            </div>
            {/* Interactive Slides Container */}
            <div className="relative min-h-[220px]">
              {/* Slide 1 */}
              <div className={`transition-opacity duration-300 ${currentSlide === 1 ? '' : 'hidden'}`} id="hero-slide-1">
                <h1 className="text-headline-xl lg:text-headline-xl font-headline-xl text-text-primary tracking-tight leading-tight mb-4">
                  მიიღე ინფორმაცია საკუთარ დებიტორულ დავალიანებაზე ან შენს სახელზე არსებულ დავალიანებაზე <span className="text-primary-container">უფასოდ</span> — ხელი რომ არ შეგეშალოს ბიზნეს საქმიანობაში
                </h1>
                <p className="text-body-lg font-body-lg text-text-muted max-w-2xl leading-relaxed">
                  გამჭვირვალე ფინანსური რისკების შემცირება, რეალურ დროში RS.GE ინტეგრაცია და დებიტორთა რეესტრის მონიტორინგი ერთიან ეროვნულ სივრცეში.
                </p>
              </div>
              {/* Slide 2 */}
              <div className={`transition-opacity duration-300 ${currentSlide === 2 ? '' : 'hidden'}`} id="hero-slide-2">
                <h1 className="text-headline-xl lg:text-headline-xl font-headline-xl text-text-primary tracking-tight leading-tight mb-4">
                  მართე <span className="text-primary-container">ფინანსური რისკები</span> და დაიცავი შენი ბიზნესი რეალურ დროში
                </h1>
                <p className="text-body-lg font-body-lg text-text-muted max-w-2xl leading-relaxed">
                  დებიტორული ანალიტიკა, ავტომატური სამართლებრივი შეტყობინებები და კონტრაგენტის საკრედიტო რეიტინგის მყისიერი შემოწმება.
                </p>
              </div>
            </div>
            {/* Slider Controls */}
            <div className="flex items-center gap-4 mt-8 pt-4">
              <div className="flex items-center gap-2">
                <button aria-label="Slide 1" className={`${currentSlide === 1 ? 'w-8 bg-primary-container' : 'w-3 bg-border-subtle hover:bg-outline-variant'} h-2 rounded-full transition-all duration-200 cursor-pointer`} id="slider-btn-1" onClick={() => setCurrentSlide(1)} />
                <button aria-label="Slide 2" className={`${currentSlide === 2 ? 'w-8 bg-primary-container' : 'w-3 bg-border-subtle hover:bg-outline-variant'} h-2 rounded-full transition-all duration-200 cursor-pointer`} id="slider-btn-2" onClick={() => setCurrentSlide(2)} />
              </div>
              <div className="flex items-center gap-1.5 ml-4">
                <button className="w-8 h-8 rounded-lg border border-border-subtle bg-surface-card flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-all cursor-pointer" onClick={() => setCurrentSlide(s => s === 1 ? 2 : 1)}>
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <button className="w-8 h-8 rounded-lg border border-border-subtle bg-surface-card flex items-center justify-center text-text-muted hover:text-text-primary hover:border-text-muted transition-all cursor-pointer" onClick={() => setCurrentSlide(s => s === 1 ? 2 : 1)}>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider ml-2">სისტემის ვერსია 2.4.0</span>
            </div>
            {/* Visual Rating Preview Card (Bento Component) */}
            <div className="mt-8 p-4 rounded-xl bg-surface-card border border-border-subtle shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-bg flex items-center justify-center border border-border-subtle text-primary-container">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <div>
                  <div className="text-body-sm font-body-sm text-text-muted">კონტრაგენტის რისკის მაჩვენებლები</div>
                  <div className="text-label-md font-label-md text-text-primary flex items-center gap-2">
                    აქტიური რეიტინგების სკალა
                    <span className="text-label-sm font-label-sm bg-surface-bg px-2 py-0.5 rounded text-text-muted">დღევანდელი ინდექსი</span>
                  </div>
                </div>
              </div>
              {/* Rating Badges */}
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-full bg-rating-a/20 border border-rating-a text-text-primary text-label-md font-label-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
                  Grade A (Prime)
                </div>
                <div className="px-2.5 py-1 rounded-full bg-rating-b/20 border border-rating-b/40 text-text-primary text-label-md font-label-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rating-b" />
                  Grade B
                </div>
                <div className="px-2.5 py-1 rounded-full bg-rating-c/20 border border-rating-c/40 text-text-primary text-label-md font-label-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rating-c" />
                  Grade C
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Verification Search Box (5 Cols) */}
          <div className="lg:col-span-5" id="registry">
            <div className="bg-surface-card rounded-xl border border-border-subtle shadow-lg p-6 lg:p-7 relative brand-glow">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-5">
                <div>
                  <h2 className="text-headline-sm font-headline-sm text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container">search_check</span>
                    გადამოწმება ბაზაში
                  </h2>
                  <p className="text-body-sm font-body-sm text-text-muted mt-0.5">შეამოწმეთ დავალიანების სტატუსი რეესტრში</p>
                </div>
                <span className="px-2 py-0.5 text-label-sm font-label-sm rounded bg-primary-container/10 text-primary-container uppercase font-semibold">Live DB</span>
              </div>
              {/* Segmented Selection Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-surface-bg rounded-lg border border-border-subtle mb-4">
                <button className={`py-2 text-label-md font-label-md rounded text-center transition-all cursor-pointer ${searchMode === 'personal' ? 'bg-surface-card text-primary-container shadow-xs font-semibold' : 'text-text-muted hover:text-text-primary'}`} id="tab-personal" onClick={() => { setSearchMode('personal'); setSearchResultVisible(false); }} type="button">
                  პირადი ნომერი (11 ნიშნა)
                </button>
                <button className={`py-2 text-label-md font-label-md rounded text-center transition-all cursor-pointer ${searchMode === 'corporate' ? 'bg-surface-card text-primary-container shadow-xs font-semibold' : 'text-text-muted hover:text-text-primary'}`} id="tab-corporate" onClick={() => { setSearchMode('corporate'); setSearchResultVisible(false); }} type="button">
                  საიდენტიფიკაციო (9 ნიშნა)
                </button>
              </div>
              {/* Search Form */}
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSearchResultVisible(true); }}>
                <div>
                  <label className="block text-label-md font-label-md text-text-primary mb-1.5" id="input-label">
                    {searchMode === 'personal' ? 'მოქალაქის პირადი ნომერი' : 'კომპანიის საიდენტიფიკაციო კოდი'}
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                      <span className="material-symbols-outlined text-lg">badge</span>
                    </div>
                    <input className="block w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border-subtle rounded-lg text-body-md font-data-mono-md text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-secondary-container/40 focus:border-secondary-container transition-all" id="search-input" maxLength={searchMode === 'personal' ? 11 : 9} placeholder={searchMode === 'personal' ? 'მაგ: 01024012345' : 'მაგ: 405123456'} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} type="text" />
                  </div>
                  <p className="text-body-sm font-body-sm text-text-muted mt-1.5 flex items-center gap-1" id="helper-text">
                    <span className="material-symbols-outlined text-xs">info</span>
                    {searchMode === 'personal' ? 'შეიყვანეთ ზუსტად 11 ციფრი RS.GE ავთენტიფიკაციისთვის' : 'შეიყვანეთ კომპანიის 9-ნიშნა საიდენტიფიკაციო კოდი'}
                  </p>
                </div>
                {/* Terms check */}
                <div className="flex items-start gap-2 pt-1">
                  <input defaultChecked className="mt-1 rounded border-border-subtle text-primary-container focus:ring-primary-container" id="consent" type="checkbox" />
                  <label className="text-body-sm font-body-sm text-text-muted" htmlFor="consent">
                    ვეთანხმები საჯარო მონაცემთა დამუშავების წესებს და კონფიდენციალურობის პოლიტიკას
                  </label>
                </div>
                {/* High-Emphasis CTA Button */}
                <button className="w-full py-3 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md text-body-md font-semibold transition-all duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer" id="search-cta" type="submit">
                  <span className="material-symbols-outlined text-lg">manage_search</span>
                  <span>გადამოწმება ბაზაში</span>
                </button>
              </form>
              {/* Registration Required Prompt on Search Click */}
              <div className={`${searchResultVisible ? '' : 'hidden'} mt-4 p-4 bg-amber-50/90 border border-amber-300 rounded-xl space-y-3 animate-in fade-in`} id="search-result-box">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">lock_person</span>
                  <div>
                    <h4 className="text-label-md font-label-md font-bold text-text-primary">
                      გადამოწმებისთვის საჭიროა რეგისტრაცია
                    </h4>
                    <p className="text-body-sm font-body-sm text-text-muted mt-0.5 leading-relaxed">
                      მონაცემთა ბაზაში სტატუსის სანახავად გთხოვთ გაიაროთ რეგისტრაცია ან შეხვიდეთ სისტემაში.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/register"
                    className="flex-1 py-2 px-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-label-md font-label-md font-semibold text-center transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>რეგისტრაციის გავლა</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                  <Link
                    href="/login"
                    className="py-2 px-3 rounded-lg bg-white hover:bg-surface-bg border border-border-subtle text-text-primary text-label-md font-label-md font-medium text-center transition-colors"
                  >
                    შესვლა
                  </Link>
                </div>
              </div>
              {/* Reassurance Trust Badges */}
              <div className="mt-5 pt-4 border-t border-border-subtle grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-base text-primary-container mb-0.5">lock</span>
                  <span className="text-label-sm font-label-sm text-text-muted leading-tight">256-bit SSL დაცვა</span>
                </div>
                <div className="flex flex-col items-center border-x border-border-subtle">
                  <span className="material-symbols-outlined text-base text-primary-container mb-0.5">sync_alt</span>
                  <span className="text-label-sm font-label-sm text-text-muted leading-tight">RS.GE სინქრონი</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-base text-primary-container mb-0.5">bolt</span>
                  <span className="text-label-sm font-label-sm text-text-muted leading-tight">მყისიერი შედეგი</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* 3. Live Stats & Trust Bar */}
    <section className="py-10 bg-surface-card border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Grid of 4 Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 pb-8 border-b border-border-subtle">
          <div className="flex flex-col">
            <span className="text-text-muted text-body-sm font-body-sm mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary-container">account_balance_wallet</span>
              მართული პორტფელი
            </span>
            <div className="text-headline-md lg:text-headline-lg font-data-mono-lg text-text-primary tracking-tight">
              ₾42M+
            </div>
            <span className="text-label-sm font-label-sm text-rating-a font-medium mt-1 flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">trending_up</span> +14.2% წინა კვარტალთან
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-body-sm font-body-sm mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary-container">history</span>
              აქტიური შემოწმება
            </span>
            <div className="text-headline-md lg:text-headline-lg font-data-mono-lg text-text-primary tracking-tight">
              18,400+
            </div>
            <span className="text-label-sm font-label-sm text-text-muted mt-1">ბოლო 30 დღე</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-body-sm font-body-sm mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary-container">verified</span>
              მონაცემთა სიზუსტე
            </span>
            <div className="text-headline-md lg:text-headline-lg font-data-mono-lg text-text-primary tracking-tight">
              99.4%
            </div>
            <span className="text-label-sm font-label-sm text-primary-container mt-1">RS.GE ოფიციალური წყარო</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-muted text-body-sm font-body-sm mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-primary-container">business</span>
              პარტნიორი კომპანია
            </span>
            <div className="text-headline-md lg:text-headline-lg font-data-mono-lg text-text-primary tracking-tight">
              350+
            </div>
            <span className="text-label-sm font-label-sm text-text-muted mt-1">საქართველოს მასშტაბით</span>
          </div>
        </div>
        {/* Institutional Trust Indicators */}
        <div className="pt-6 flex flex-wrap items-center justify-between gap-6">
          <span className="text-label-md font-label-md text-text-muted uppercase tracking-wider">
            სისტემური ინტეგრატორები და პარტნიორები:
          </span>
          <div className="flex flex-wrap items-center gap-6 lg:gap-10 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 font-headline-sm font-bold text-text-muted">
              <span className="w-6 h-6 rounded bg-primary-container text-on-primary flex items-center justify-center text-xs font-mono">RS</span>
              <span>RS.GE შემოსავლების სამსახური</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm font-semibold text-text-muted">
              <span className="material-symbols-outlined text-primary-container">account_balance</span>
              <span>საქართველოს ბანკი</span>
            </div>
            <div className="flex items-center gap-2 font-headline-sm font-semibold text-text-muted">
              <span className="material-symbols-outlined text-secondary-container">domain</span>
              <span>თიბისი ბანკი</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* 4. Pricing & Packages Section */}
    <section className="py-16 lg:py-24 bg-surface-bg" id="pricing">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header & Segmented Switch */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-label-md font-label-md text-primary-container mb-3 shadow-xs">
            <span className="material-symbols-outlined text-sm">payments</span>
            გამჭვირვალე ფასები
          </div>
          <h2 className="text-headline-xl font-headline-xl text-text-primary tracking-tight mb-4">
            მოქნილი ტარიფები ყველა ტიპის მომხმარებლისთვის
          </h2>
          <p className="text-body-lg font-body-lg text-text-muted">
            შეარჩიეთ თქვენს მოთხოვნებზე მორგებული პაკეტი პირადი საკრედიტო ისტორიის მონიტორინგისთვის ან კორპორაციული რისკების სამართავად.
          </p>
          {/* Toggle Control */}
          <div className="inline-flex items-center p-1.5 bg-surface-card rounded-xl border border-border-subtle mt-8 shadow-xs">
            <button className={`px-5 py-2 rounded-lg text-body-md font-body-md transition-all cursor-pointer ${pricingTier === 'individual' ? 'font-semibold bg-primary-container text-on-primary shadow-xs' : 'text-text-muted hover:text-text-primary'}`} id="pricing-btn-ind" onClick={() => setPricingTier('individual')} type="button">
              ფიზიკური პირი
            </button>
            <button className={`px-5 py-2 rounded-lg text-body-md font-body-md transition-all cursor-pointer ${pricingTier === 'corporate' ? 'font-semibold bg-primary-container text-on-primary shadow-xs' : 'text-text-muted hover:text-text-primary'}`} id="pricing-btn-corp" onClick={() => setPricingTier('corporate')} type="button">
              იურიდიული პირი (კომპანია)
            </button>
          </div>
        </div>
        {/* 3 Tier Pricing Cards (Bento style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: Free Tier */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-7 shadow-sm flex flex-col justify-between hover:border-text-muted transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-surface-bg border border-border-subtle text-label-md font-label-md text-text-muted">
                  საწყისი
                </span>
                <span className="material-symbols-outlined text-text-muted">person</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary mb-2">საბაზისო / სტარტი</h3>
              <p className="text-body-sm font-body-sm text-text-muted mb-6">იდეალურია მოქალაქეებისთვის საკუთარი სტატუსის შესამოწმებლად.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-border-subtle">
                <span className="text-headline-xl font-data-mono-lg text-text-primary">0 ₾</span>
                <span className="text-body-sm font-body-sm text-text-muted">/ უფასო</span>
              </div>
              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  პირადი შემოწმება
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  1 გადამოწმება თვეში
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  SMS შეტყობინება
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  საბაზისო რეიტინგი
                </li>
              </ul>
            </div>
            <Link className="w-full py-2.5 px-4 rounded-lg border border-border-subtle text-primary-container font-body-md text-body-md font-semibold hover:bg-surface-bg transition-colors text-center" href="/register">
              დაიწყე უფასოდ
            </Link>
          </div>
          {/* Card 2: Professional / Standard (Highlighted) */}
          <div className="bg-surface-card rounded-xl border-2 border-primary-container p-7 shadow-md flex flex-col justify-between relative transform md:-translate-y-2">
            {/* Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
              <span className="px-3 py-1 rounded-full bg-accent-mint text-text-primary font-label-md text-label-md font-bold uppercase tracking-wider shadow-xs border border-surface-card">
                რეკომენდებული
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-primary-container/10 text-label-md font-label-md text-primary-container font-medium">
                  პოპულარული
                </span>
                <span className="material-symbols-outlined text-primary-container">stars</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary mb-2">პროფესიონალი / ბიზნეს სტანდარტი</h3>
              <p className="text-body-sm font-body-sm text-text-muted mb-6">მცირე ბიზნესისა და აქტიური მეწარმეებისთვის.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-border-subtle">
                <span className="text-headline-xl font-data-mono-lg text-text-primary" id="price-card-2">{pricingTier === 'individual' ? '49 ₾' : '89 ₾'}</span>
                <span className="text-body-sm font-body-sm text-text-muted">/ თვე</span>
              </div>
              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check_circle</span>
                  <strong>ულიმიტო გადამოწმება</strong>
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check_circle</span>
                  დეტალური საკრედიტო ისტორია
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check_circle</span>
                  ავტომატური მონიტორინგი
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check_circle</span>
                  იურიდიული მხარდაჭერის კონსულტაცია
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check_circle</span>
                  PDF ოფიციალური ამონაწერი
                </li>
              </ul>
            </div>
            <Link className="w-full py-3 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md text-body-md font-semibold transition-colors shadow-sm cursor-pointer text-center" href="/register">
              პაკეტის არჩევა
            </Link>
          </div>
          {/* Card 3: Enterprise */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-7 shadow-sm flex flex-col justify-between hover:border-text-muted transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-surface-bg border border-border-subtle text-label-md font-label-md text-text-muted">
                  ენტერპრაიზი
                </span>
                <span className="material-symbols-outlined text-text-muted">apartment</span>
              </div>
              <h3 className="text-headline-md font-headline-md text-text-primary mb-2">კორპორაციული / ენტერპრაიზი</h3>
              <p className="text-body-sm font-body-sm text-text-muted mb-6">მსხვილი სადისტრიბუციო და ფინანსური ინსტიტუტებისთვის.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-border-subtle">
                <span className="text-headline-xl font-data-mono-lg text-text-primary" id="price-card-3">{pricingTier === 'individual' ? '199 ₾' : '349 ₾'}</span>
                <span className="text-body-sm font-body-sm text-text-muted">/ თვე</span>
              </div>
              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  API ინტეგრაცია (REST API)
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  მრავალმომხმარებლიანი წვდომა
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  პორტფელის მასიური ანალიზი
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  პერსონალური მენეჯერი
                </li>
                <li className="flex items-center gap-2 text-body-md font-body-md text-text-primary">
                  <span className="material-symbols-outlined text-accent-mint text-base">check</span>
                  24/7 პრიორიტეტული მხარდაჭერა
                </li>
              </ul>
            </div>
            <Link className="w-full py-2.5 px-4 rounded-lg border border-border-subtle text-primary-container font-body-md text-body-md font-semibold hover:bg-surface-bg transition-colors text-center" href="/contact">
              დაგვიკავშირდით
            </Link>
          </div>
        </div>
      </div>
    </section>
    {/* 5. Blog & News Section */}
    <section className="py-16 lg:py-24 bg-surface-card border-t border-b border-border-subtle" id="blog">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-bg border border-border-subtle text-label-md font-label-md text-primary-container mb-3">
              <span className="material-symbols-outlined text-sm">newspaper</span>
              ანალიტიკა და ცოდნის ბაზა
            </div>
            <h2 className="text-headline-xl font-headline-xl text-text-primary tracking-tight">
              სასარგებლო რესურსები და სიახლეები
            </h2>
          </div>
          {/* Filter tags */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary text-label-md font-label-md font-medium">ყველა</button>
            <button className="px-3.5 py-1.5 rounded-full bg-surface-bg hover:bg-border-subtle text-text-muted text-label-md font-label-md transition-colors">საკრედიტო განათლება</button>
            <button className="px-3.5 py-1.5 rounded-full bg-surface-bg hover:bg-border-subtle text-text-muted text-label-md font-label-md transition-colors">საგადასახადო სიახლეები</button>
            <button className="px-3.5 py-1.5 rounded-full bg-surface-bg hover:bg-border-subtle text-text-muted text-label-md font-label-md transition-colors">ტრენინგები</button>
          </div>
        </div>
        {/* 3 Rich Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Article 1 */}
          <article className="bg-surface-bg rounded-xl border border-border-subtle overflow-hidden flex flex-col group hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden relative bg-border-subtle">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Modern corporate financial dashboard interface displayed on high-resolution monitor in bright modern office space, showcasing blue credit score graphs, clear data cards, clean high-key ambient lighting, fintech analytic workspace." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBw042bPozb2YVyuya7uTw8Lmi2bSCThH_jd528e71cjyInSKZ4O1zHPoaSJMVQSd7dsc6ikN_RRbEHzW6KY3jTaGL1rbs-FPCTBGhkLv_AFK4hPYPL6Tyq78hC1eMtKttJmoYatDNFf0iuqf8jCb5Z_bR4DyesXc1HW3NQwIkfKituVQw1RUHewUhlCSlbRCBzOw4TSkvbKZ6SBP0qfFfGkwbSPUPq7z6uCac5ZjBePpjt9ByegpaCYw" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-card/90 backdrop-blur-xs text-primary-container text-label-sm font-label-sm font-semibold border border-border-subtle">
                საკრედიტო განათლება
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex items-center gap-2 text-text-muted text-body-sm font-body-sm mb-2">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  <span>12 ოქტომბერი, 2024</span>
                  <span>•</span>
                  <span>5 წთ საკითხავი</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary-container transition-colors line-clamp-2 mb-3">
                  როგორ ავიმაღლოთ საკრედიტო რეიტინგი და შევამციროთ დავალიანების რისკები
                </h3>
                <p className="text-body-md font-body-md text-text-muted line-clamp-3 mb-4">
                  პრაქტიკული რჩევები ბიზნესისთვის და ფიზიკური პირებისთვის: როგორ მოვახდინოთ დავალიანებების რესტრუქტურიზაცია და თავიდან ავირიდოთ უარყოფითი ჩანაწერები.
                </p>
              </div>
              <a className="inline-flex items-center gap-1.5 text-primary-container font-label-md text-label-md group-hover:gap-2 transition-all" href="#">
                სრულად წაკითხვა
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
          {/* Article 2 */}
          <article className="bg-surface-bg rounded-xl border border-border-subtle overflow-hidden flex flex-col group hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden relative bg-border-subtle">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Georgian business taxation and legal office setting with modern tablets displaying Revenue Service portal data charts, clean minimalist architecture with crisp white desks and subtle blue lighting reflections." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnaGcbiKn09T6ykq6X8vg6fXaOCYJTMlssZSf-8vlI1-jlOtEI3k7XoYlmGA2Q_G9BaH6I2gU4UjwXGqmlp5v70dcLU5fexnGJjyCvm_Eu8BVtz85eM1Hw9iJn6L8byCLiw_WwfbMnWwueMZY5hdQZaJPuY_2ICu69MKsNJYQo0DUDmTv0XQBdoHFMraDt1_jKBQk4x1-fkda0BeMffQmCocd7IFI_3C9xQlcL4A-RAL1v8OFW3e6m3Q" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-card/90 backdrop-blur-xs text-primary-container text-label-sm font-label-sm font-semibold border border-border-subtle">
                საგადასახადო სიახლეები
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex items-center gap-2 text-text-muted text-body-sm font-body-sm mb-2">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  <span>8 ოქტომბერი, 2024</span>
                  <span>•</span>
                  <span>7 წთ საკითხავი</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary-container transition-colors line-clamp-2 mb-3">
                  საგადასახადო კანონმდებლობის ცვლილებები და RS.GE-ს ახალი მოთხოვნები ბიზნესისთვის
                </h3>
                <p className="text-body-md font-body-md text-text-muted line-clamp-3 mb-4">
                  რა იცვლება ელექტრონულ დეკლარირებასა და დებიტორული დავალიანებების საგადასახადო აღრიცხვაში 2024 წლის ბოლოდან.
                </p>
              </div>
              <a className="inline-flex items-center gap-1.5 text-primary-container font-label-md text-label-md group-hover:gap-2 transition-all" href="#">
                სრულად წაკითხვა
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
          {/* Article 3 */}
          <article className="bg-surface-bg rounded-xl border border-border-subtle overflow-hidden flex flex-col group hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden relative bg-border-subtle">
              <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" data-alt="Professional financial workshop conference room with attendees reviewing risk analysis slides on widescreen projection, sleek corporate ambiance, bright natural daylight streaming through large commercial windows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsfF_HtUJWABH7ijPdNma_cUGWSGd_-eiaWVV_8DG1rYy-DkGhSil9iAiMqD0Nl295kX1HfYXv8T0KTfua0NxMMy7MKltGhC9FI-RvVVsBD30o4RLVPvLoTodpZw3udxCz9uM5frMGq04rArS2Dwyn76sJZRraU95ytIrLYAANZGIirqp48zkxNxGGQCae-4RADyopFMA49lOvj_EvtoeO8MM5wuZ8rlnu54XL55yqMNEOyG1FqJ9J8Q" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-card/90 backdrop-blur-xs text-primary-container text-label-sm font-label-sm font-semibold border border-border-subtle">
                ტრენინგები
              </span>
            </div>
            <div className="p-6 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex items-center gap-2 text-text-muted text-body-sm font-body-sm mb-2">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  <span>1 ოქტომბერი, 2024</span>
                  <span>•</span>
                  <span className="text-accent-mint font-semibold">რეგისტრაცია ღიაა</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-text-primary group-hover:text-primary-container transition-colors line-clamp-2 mb-3">
                  პრაქტიკული ვორქშოპი: დებიტორული დავალიანებების ეფექტური მართვა და პრევენცია
                </h3>
                <p className="text-body-md font-body-md text-text-muted line-clamp-3 mb-4">
                  ინტერაქტიული ონლაინ სესია მთავარ ბუღალტრებთან და იურისტებთან ერთად. გაეცანით დავალიანების ამოღების სამართლებრივ მექანიზმებს.
                </p>
              </div>
              <a className="inline-flex items-center gap-1.5 text-primary-container font-label-md text-label-md group-hover:gap-2 transition-all" href="#">
                სრულად წაკითხვა
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </article>
        </div>
        {/* View All Action Button */}
        <div className="text-center mt-12">
          <a className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border-subtle bg-surface-card text-text-primary hover:text-primary-container font-body-md text-body-md font-semibold transition-all shadow-xs" href="#">
            <span>ყველა სტატიის ნახვა</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  </main>
  {/* 6. Footer */}
  <footer className="bg-surface-card border-t border-border-subtle text-text-primary" id="contact">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-10">
      {/* 4 Columns Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {/* Col 1: Brand & Credo */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary-container flex items-center justify-center text-on-primary font-bold">
              <span className="material-symbols-outlined text-base">assured_workload</span>
            </div>
            <span className="text-headline-sm font-headline-sm font-bold text-text-primary tracking-tight">
              Debitinfo<span className="text-primary-container">.GE</span>
            </span>
          </div>
          <p className="text-body-sm font-body-sm text-text-muted leading-relaxed">
            საქართველოს წამყვანი ციფრული პლატფორმა საკრედიტო რისკების მონიტორინგისა და დებიტორული დავალიანებების საჯარო გამჭვირვალობისთვის.
          </p>
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-muted mt-2">
            <span className="w-2 h-2 rounded-full bg-accent-mint" />
            ინტეგრირებულია RS.GE სისტემასთან
          </div>
        </div>
        {/* Col 2: Navigation & Services */}
        <div className="flex flex-col gap-3">
          <h4 className="text-label-md font-label-md font-semibold text-text-primary uppercase tracking-wider">
            ნავიგაცია &amp; სერვისები
          </h4>
          <ul className="space-y-2 text-body-sm font-body-sm text-text-muted">
            <li><Link className="hover:text-primary-container transition-colors" href="/">მთავარი გვერდი</Link></li>
            <li><a className="hover:text-primary-container transition-colors" href="#services">საკრედიტო მონიტორინგი</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#">API დოკუმენტაცია</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#pricing">ტარიფები და პაკეტები</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#blog">სიახლეები და ბლოგი</a></li>
          </ul>
        </div>
        {/* Col 3: Legal & Regulatory */}
        <div className="flex flex-col gap-3">
          <h4 className="text-label-md font-label-md font-semibold text-text-primary uppercase tracking-wider">
            იურიდიული &amp; პოლიტიკა
          </h4>
          <ul className="space-y-2 text-body-sm font-body-sm text-text-muted">
            <li><a className="hover:text-primary-container transition-colors" href="#">კონფიდენციალურობის პოლიტიკა</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#">მომსახურების პირობები</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#">რეგულაციები და უსაფრთხოება</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#">საგადასახადო შემოწმება</a></li>
            <li><a className="hover:text-primary-container transition-colors" href="#">საკონტაქტო პირი</a></li>
          </ul>
        </div>
        {/* Col 4: Banking Requisites & Contact */}
        <div className="flex flex-col gap-3">
          <h4 className="text-label-md font-label-md font-semibold text-text-primary uppercase tracking-wider">
            საბანკო რეკვიზიტები &amp; კონტაქტი
          </h4>
          <div className="p-3 bg-surface-bg rounded-lg border border-border-subtle space-y-2 text-label-sm font-label-sm">
            <div>
              <div className="font-semibold text-text-primary">საქართველოს ბანკი:</div>
              <div className="text-text-muted select-all">GE79BG0000000123456789 (GEL)</div>
              <div className="text-text-muted">SWIFT: BOGAGE22</div>
            </div>
            <div className="pt-1 border-t border-border-subtle">
              <div className="font-semibold text-text-primary">თიბისი ბანკი:</div>
              <div className="text-text-muted select-all">GE02TB7000000987654321 (GEL)</div>
              <div className="text-text-muted">SWIFT: TBCBGE22</div>
            </div>
          </div>
          <div className="text-body-sm font-body-sm text-text-muted space-y-1 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-primary-container">call</span>
              <span>+995 (32) 2 100 200</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-primary-container">mail</span>
              <span>info@debitinfo.ge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-primary-container">location_on</span>
              <span>თბილისი, საქართველო</span>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Bar: Social & Copyright */}
      <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-body-sm font-body-sm text-text-muted text-center sm:text-left">
          © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
        </p>
        {/* Social Icons */}
        <div className="flex items-center gap-4">
          <a aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-text-muted hover:text-primary-container border border-border-subtle transition-colors" href="#">
            <span className="font-bold text-xs">in</span>
          </a>
          <a aria-label="Facebook" className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-text-muted hover:text-primary-container border border-border-subtle transition-colors" href="#">
            <span className="font-bold text-xs">fb</span>
          </a>
          <a aria-label="Telegram" className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-text-muted hover:text-primary-container border border-border-subtle transition-colors" href="#">
            <span className="material-symbols-outlined text-sm">send</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
  {/* Interactive Logic Scripts */}
</div>

    </div>
  );
}
