'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Target, 
  Users, 
  CheckCircle2, 
  Scale, 
  Award, 
  Building2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Debitinfo.GE ეკოსისტემა</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            ფინანსური გამჭვირვალობა და ციფრული მედიაცია
          </h1>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            ჩვენ ვქმნით საქართველოს ყველაზე სანდო და ტექნოლოგიურ სადებიტო ინფრასტრუქტურას, რომელიც აკავშირებს კრედიტორებსა და მოვალეებს სამართლიანი, ავტომატიზებული პროცესებით.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-border-subtle shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">ჩვენი მისია</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              ფინანსური რისკების მინიმიზაცია ბიზნესებისთვის და მოვალეთათვის ხელმისაწვდომი, ცივილიზებული დავის გადაწყვეტის მექანიზმების შეთავაზება სასამართლომდე.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-border-subtle shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">მედიაციის ეკოსისტემა</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              დავების 80%-ზე მეტი წყდება წინასასამართლო მედიაციით. ჩვენ ვეხმარებით მხარეებს შეთანხმდნენ მოქნილ გრაფიკზე და ჩამოაწერონ დარიცხული საურავები.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-border-subtle shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">მონაცემთა უსაფრთხოება</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              პერსონალურ მონაცემთა დაცვის ინსპექტორის სტანდარტებთან სრული შესაბამისობა და პირდაპირი სინქრონიზაცია RS.GE-ს საგადასახადო ბაზებთან.
            </p>
          </div>
        </div>

        {/* Milestone stats */}
        <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold font-mono text-accent-mint">2021</div>
              <div className="text-xs text-slate-400">დაარსების წელი</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white">184M+ ₾</div>
              <div className="text-xs text-slate-400">დამუშავებული პორტფელი</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold font-mono text-accent-mint">3,800+</div>
              <div className="text-xs text-slate-400">პარტნიორი კომპანია</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold font-mono text-white">72.4%</div>
              <div className="text-xs text-slate-400">მედიაციის წარმატება</div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <div className="text-center space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-text-primary">გსურთ გახდეთ პლატფორმის პარტნიორი?</h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            შეუერთდით საქართველოს წამყვან ბანკებს, საფინანსო ინსტიტუტებსა და კომერციულ ორგანიზაციებს.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
            >
              <span>დაგვიკავშირდით კონსულტაციისთვის</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
