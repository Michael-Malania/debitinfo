'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Menu, 
  X, 
  ShieldCheck, 
  Search, 
  User, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<'GE' | 'EN' | 'RU'>('GE');
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'მთავარი გვერდი' },
    { href: '/#services', label: 'სერვისები' },
    { href: '/about', label: 'ჩვენს შესახებ' },
    { href: '/contact', label: 'კონტაქტი' },
    { href: '/dashboard', label: 'პირადი კაბინეტი' },
  ];

  return (
    <header className="bg-white sticky top-9 z-40 shadow-xs border-b border-border-subtle transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[22px]">assured_workload</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-xl font-bold text-text-primary tracking-tight">
                Debitinfo<span className="text-primary-container">.GE</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse ml-1.5" />
            </div>
            <span className="text-[10px] text-text-muted font-medium tracking-wider uppercase">
              დებიტორთა ეროვნული რეესტრი
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary font-semibold bg-primary-fixed/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold text-text-muted">
            {(['GE', 'EN', 'RU'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-md transition-all ${
                  lang === l
                    ? 'bg-white text-primary shadow-xs font-bold'
                    : 'hover:text-text-primary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Quick Login / Register */}
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-primary hover:bg-slate-100 transition-colors"
          >
            შესვლა
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-blue-700 transition-all shadow-xs flex items-center gap-1 active:scale-95"
          >
            <span>რეგისტრაცია</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-subtle bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-slate-50 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-lg border border-border-subtle text-sm font-medium text-text-primary hover:bg-slate-50"
            >
              შესვლა
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700"
            >
              რეგისტრაცია
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
