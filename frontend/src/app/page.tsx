'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { registryService } from '@/services';
import { DebtorRecord } from '@/types';
import { 
  Search, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Scale, 
  Users, 
  ChevronRight, 
  HelpCircle,
  Award,
  AlertCircle
} from 'lucide-react';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DebtorRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await registryService.search(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-surface-bg to-surface-bg pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>საქართველოს ეროვნული სადებიტო რეესტრი</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.15]">
              საკრედიტო რისკების მართვა და <span className="text-primary">დებიტორთა აღრიცხვა</span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed">
              გადაამოწმეთ კონტრაგენტი, მართეთ დებიტორული პორტფელი და შეამცირეთ ვადაგადაცილების რისკები ერთიან ავტომატიზებულ პლატფორმაზე.
            </p>

            {/* Registry Search Widget */}
            <div className="pt-4 max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-lg border border-border-subtle">
                <div className="relative flex-1 flex items-center pl-3">
                  <Search className="w-5 h-5 text-text-muted absolute left-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="შეიყვანეთ პირადი ნომერი (11 ნიშნა) ან საიდენტიფიკაციო კოდი..."
                    className="w-full pl-8 pr-4 py-3 text-sm rounded-xl focus:outline-none placeholder:text-text-muted/70 text-text-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isSearching ? 'ძებნა...' : 'რეესტრში შემოწმება'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Instant Search Results Dropdown/Card */}
              {hasSearched && (
                <div className="mt-4 bg-white rounded-2xl p-5 shadow-xl border border-border-subtle text-left transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <span className="text-xs font-semibold text-text-muted uppercase">ძიების შედეგები ({searchResults.length})</span>
                    <button onClick={() => setHasSearched(false)} className="text-xs text-text-muted hover:text-text-primary">დახურვა</button>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center text-sm text-text-muted">
                      მოცემული პარამეტრებით ჩანაწერი არ მოიძებნა. პირი შესაძლოა არ ფიქსირდება მოვალეთა სიაში.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle">
                      {searchResults.map((d) => (
                        <div key={d.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text-primary">{d.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.rating === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                d.rating === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                Rating {d.rating}
                              </span>
                            </div>
                            <div className="text-xs text-text-muted font-mono mt-0.5">
                              {d.type === 'company' ? 'საიდენტიფიკაციო' : 'პ/ნ'}: {d.personalId} • საქმე: {d.caseNumber}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs text-text-muted">დავალიანება</div>
                              <div className="text-sm font-bold font-mono text-primary">{d.totalDebt.toLocaleString()} ₾</div>
                            </div>
                            <Link
                              href="/creditor"
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-xs font-medium transition-colors"
                            >
                              საქმის ნახვა
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Micro stats banner */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>RS.GE მონაცემთა ინტეგრაცია</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>სააღსრულებო ბიუროს რეესტრი</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>256-bit საბანკო შიფრაცია</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Bar */}
      <section className="border-y border-border-subtle bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-primary">48,200+</div>
              <div className="text-xs sm:text-sm text-text-muted">აქტიური დებიტორი რეესტრში</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">184,500,000 ₾</div>
              <div className="text-xs sm:text-sm text-text-muted">მონიტორინგის ქვეშ მყოფი პორტფელი</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-accent-mint text-emerald-600">72.4%</div>
              <div className="text-xs sm:text-sm text-text-muted">ამოღების წარმატების მაჩვენებელი</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">3,800+</div>
              <div className="text-xs sm:text-sm text-text-muted">აქტიური კრედიტორი კომპანია</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Portals Feature Grid */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
            ყველა ინსტრუმენტი ერთ სივრცეში
          </h2>
          <p className="text-sm sm:text-base text-text-muted">
            მრავალმხრივი ეკოსისტემა კრედიტორებისთვის, მოვალეებისთვის, იურისტებისა და ანალიტიკოსებისთვის.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Creditor Portal */}
          <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">კრედიტორის კაბინეტი</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                დებიტორული პორტფელის სრული მონიტორინგი, მასიური CSV იმპორტი, ავტომატური შეტყობინებები და გადახდების რეესტრი.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/creditor" className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center gap-1 group">
                <span>კაბინეტის გახსნა</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Debtor & Disputes */}
          <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">მოვალის თვითმომსახურება</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                აქტიური დავალიანებების ნახვა, დაფარვის გრაფიკის კალკულატორი, ონლაინ გადახდები და დავის ინიცირება.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/debtor" className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center gap-1 group">
                <span>დებიტორის პორტალი</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Risk Analytics */}
          <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">რისკ-ანალიტიკოსის კონსოლი</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                მაკროეკონომიკური სტატისტიკა, ვადაგადაცილების ხანდაზმულობის მრუდები, სექტორული რისკები და სკოარინგის კალიბრაცია.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/analyst" className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center gap-1 group">
                <span>ანალიტიკის ნახვა</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pricing Plans */}
      <section className="bg-slate-50 border-t border-border-subtle py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-bold text-text-primary tracking-tight">
              მოქნილი სატარიფო გეგმები
            </h2>
            <p className="text-sm sm:text-base text-text-muted">
              აირჩიეთ თქვენი ბიზნესის მასშტაბზე მორგებული პაკეტი.
            </p>

            {/* Toggle Billing */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-bold text-text-primary' : 'text-text-muted'}`}>თვიური</span>
              <button
                type="button"
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-6 rounded-full bg-primary p-0.5 relative transition-colors"
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                <span>წლიური</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">-20% ფასდაკლება</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border border-border-subtle shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">სტარტერი</span>
                <h3 className="text-xl font-bold text-text-primary">მცირე ბიზნესისთვის</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-text-primary">
                    {billingPeriod === 'annual' ? '120' : '150'} ₾
                  </span>
                  <span className="text-xs text-text-muted">/ თვეში</span>
                </div>
                <p className="text-xs text-text-muted">თვეში 50-მდე დებიტორის შემოწმება და მონიტორინგი.</p>
                <ul className="space-y-3 text-xs text-text-primary pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> რეესტრის შეუზღუდავი გადამოწმება</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> ავტომატური SMS შეხსენებები</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 მომხმარებლის დაშვება</li>
                </ul>
              </div>
              <Link href="/register" className="w-full text-center py-2.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-semibold">
                დაწყება
              </Link>
            </div>

            {/* Business (Popular) */}
            <div className="bg-white rounded-2xl p-8 border-2 border-primary shadow-lg space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wide">
                პოპულარული
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">ბიზნესი</span>
                <h3 className="text-xl font-bold text-text-primary">კომპანიებისთვის</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-primary">
                    {billingPeriod === 'annual' ? '320' : '390'} ₾
                  </span>
                  <span className="text-xs text-text-muted">/ თვეში</span>
                </div>
                <p className="text-xs text-text-muted">სრული პორტფელის მართვა და წინასასამართლო მედიაცია.</p>
                <ul className="space-y-3 text-xs text-text-primary pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 500-მდე აქტიური საქმე</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> CSV მასიური იმპორტი & ექსპორტი</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> წინასასამართლო შეტყობინების გენერატორი</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 მომხმარებლის ლიცენზია</li>
                </ul>
              </div>
              <Link href="/register" className="w-full text-center py-2.5 rounded-xl bg-primary text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-xs">
                არჩევა
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-border-subtle shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">კორპორაციული</span>
                <h3 className="text-xl font-bold text-text-primary">ბანკები & მსხვილი კრედიტორები</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono text-text-primary">ინდივიდუალური</span>
                </div>
                <p className="text-xs text-text-muted">სრული API ინტეგრაცია და დამოუკიდებელი ინფრასტრუქტურა.</p>
                <ul className="space-y-3 text-xs text-text-primary pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> შეუზღუდავი საქმეები და დებიტორები</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> პირდაპირი REST API & Webhook სინქრონიზაცია</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> პერსონალური კურატორი & 24/7 მხარდაჭერა</li>
                </ul>
              </div>
              <Link href="/contact" className="w-full text-center py-2.5 rounded-xl border border-border-subtle text-text-primary hover:bg-slate-50 transition-colors text-sm font-semibold">
                კონსულტაცია
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clean Profile Callout Banner */}
      <section className="py-12 bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">გაქვთ სუფთა საკრედიტო ისტორია?</h3>
              <p className="text-xs sm:text-sm text-emerald-200/80">ჩამოტვირთეთ ოფიციალური ცნობა QR ვერიფიკაციით და ისარგებლეთ პარტნიორი ბანკების შეღავათებით.</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            ცნობის ნახვა (Rating A)
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
