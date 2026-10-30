'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function LoginPage() {
  const router = useRouter();
  const [entityType, setEntityType] = useState<'legal' | 'physical'>('physical');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(identifier, password);
      const targetPortal = authService.getPortalRouteForRole(res.user.role);
      router.push(targetPortal);
    } catch (err: any) {
      setError(err?.message || 'ავტორიზაცია ვერ მოხერხდა. გადაამოწმეთ პაროლი ან პირადი ნომერი/საგადასახადო კოდი');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (type: 'regular' | 'regular_company' | 'creditor' | 'debtor') => {
    if (type === 'regular') {
      setEntityType('physical');
      setIdentifier('01024089123'); // დავით კვირიკაშვილი
      setPassword('Debitinfo2024!');
    } else if (type === 'regular_company') {
      setEntityType('legal');
      setIdentifier('404899120'); // შპს ბათუმი თრეიდი
      setPassword('Debitinfo2024!');
    } else if (type === 'creditor') {
      setEntityType('legal');
      setIdentifier('creditor@geotrading.ge');
      setPassword('Debitinfo2024!');
    } else if (type === 'debtor') {
      setEntityType('physical');
      setIdentifier('01019012345');
      setPassword('Debitinfo2024!');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary selection:text-white" suppressHydrationWarning>
      {/* TopNavBar */}
      <header className="bg-surface-card sticky top-0 z-50 border-b border-border-subtle shadow-sm">
        <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link className="flex items-center gap-2 group" href="/">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
              <span className="material-symbols-outlined text-accent-mint">assured_workload</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-text-primary tracking-tight">
                Debitinfo<span className="text-primary-container">.GE</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted leading-none">
                Fintech Registry
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/">
              მთავარი გვერდი
            </Link>
            <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/#services">
              სერვისები
            </Link>
            <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/#pricing">
              ტარიფები
            </Link>
            <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/#blog">
              ბლოგი &amp; სიახლეები
            </Link>
            <Link className="text-text-muted hover:text-primary-container transition-colors duration-150 font-label-md text-label-md" href="/contact">
              კონტაქტი
            </Link>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center p-1 bg-surface-bg rounded-lg border border-border-subtle text-body-sm font-label-md">
              <button className="px-2 py-0.5 rounded bg-surface-card text-primary-container font-semibold shadow-xs" type="button">GE</button>
              <button className="px-2 py-0.5 text-text-muted hover:text-text-primary transition-colors" type="button">EN</button>
            </div>
            <Link
              className="px-3 py-1.5 rounded-lg text-body-md font-body-md text-primary-container bg-primary-container/10 font-semibold transition-colors duration-150"
              href="/login"
            >
              შესვლა
            </Link>
            <Link
              className="px-4 py-1.5 rounded-lg text-body-md font-body-md bg-primary-container text-on-primary hover:bg-primary transition-colors duration-150 shadow-sm font-medium active:scale-95 flex items-center gap-1"
              href="/register"
            >
              <span>რეგისტრაცია</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-8">
          {/* Card Header */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-border-subtle">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-border-subtle mb-4 shadow-sm relative">
              <span className="material-symbols-outlined text-3xl text-primary-container">login</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-mint rounded-full border-2 border-white" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">სისტემაში შესვლა</h1>
            <p className="font-body-md text-body-sm text-text-muted mt-1.5">
              გაიარეთ ავტორიზაცია პირად კაბინეტსა და რეესტრის ბაზაზე წვდომისთვის
            </p>
          </div>

          {/* Quick Preset Selector for Developer Testing */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-border-subtle text-xs">
            <span className="text-[11px] font-semibold text-text-muted block mb-2 uppercase tracking-wider">
              სატესტო ანგარიშები (Dev Preset):
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('regular')}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 transition shadow-2xs text-[11px] truncate"
                title="ჩვეულებრივი მომხმარებელი (სუფთა პროფილი)"
              >
                👤 მომხმარებელი (A)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('regular_company')}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 transition shadow-2xs text-[11px] truncate"
                title="ჩვეულებრივი იურიდიული პირი (შპს ბათუმი თრეიდი)"
              >
                🏢 იურიდიული პირი
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('debtor')}
                className="px-2 py-1.5 rounded-lg bg-white border border-border-subtle hover:border-primary-container text-text-primary font-medium hover:text-primary transition shadow-2xs text-[11px] truncate"
                title="გიორგი ბერიძე (დებიტორი)"
              >
                👤 დებიტორი
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('creditor')}
                className="px-2 py-1.5 rounded-lg bg-white border border-border-subtle hover:border-primary-container text-text-primary font-medium hover:text-primary transition shadow-2xs text-[11px] truncate"
                title="შპს ჯეო ტრეიდინგი (კრედიტორი)"
              >
                🏢 კრედიტორი
              </button>
            </div>
          </div>

          {/* Entity Type Switch */}
          <div className="mt-4 grid grid-cols-2 gap-1 p-1 bg-surface-bg rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setEntityType('physical')}
              className={`py-2 text-label-md font-label-md rounded-lg text-center transition-all cursor-pointer ${
                entityType === 'physical'
                  ? 'bg-surface-card text-primary-container shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              ფიზიკური პირი
            </button>
            <button
              type="button"
              onClick={() => setEntityType('legal')}
              className={`py-2 text-label-md font-label-md rounded-lg text-center transition-all cursor-pointer ${
                entityType === 'legal'
                  ? 'bg-surface-card text-primary-container shadow-xs font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              იურიდიული პირი
            </button>
          </div>

          {/* Login Form */}
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-body-sm flex items-start gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-base mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block font-label-md text-label-md text-text-primary mb-1.5">
                {entityType === 'physical'
                  ? 'პირადი ნომერი (11 ნიშნა) ან ელფოსტა *'
                  : 'საიდენტიფიკაციო კოდი (9 ნიშნა) ან ელფოსტა *'}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                  {entityType === 'physical' ? 'badge' : 'domain'}
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={entityType === 'physical' ? '01019012345 ან user@mail.ge' : '405123456 ან info@company.ge'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-subtle rounded-lg text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-label-md text-label-md text-text-primary">პაროლი *</label>
                <a href="#" className="text-body-sm text-primary-container hover:underline text-xs">
                  დაგავიწყდათ პაროლი?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="შეიყვანეთ პაროლი"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-subtle rounded-lg text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md text-body-md font-semibold transition-all duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>მოწმდება...</span>
                </>
              ) : (
                <>
                  <span>შესვლა</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Register CTA */}
          <div className="mt-4 pt-4 border-t border-border-subtle text-center">
            <p className="text-body-md text-text-muted text-sm">
              არ გაქვთ ანგარიში?{' '}
              <Link href="/register" className="text-primary-container font-semibold hover:underline ml-1">
                გაიარეთ რეგისტრაცია
              </Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-text-muted text-xs">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-base">lock</span>
              256-bit SSL
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-primary-container text-base">verified_user</span>
              RS.GE ინტეგრაცია
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
