'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Building2, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  Check 
} from 'lucide-react';

export default function RegistrationPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [accountType, setAccountType] = useState<'company' | 'individual'>('company');
  const [taxId, setTaxId] = useState('');
  const [isVerifyingTaxId, setIsVerifyingTaxId] = useState(false);
  const [taxIdVerified, setTaxIdVerified] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business' | 'enterprise'>('business');
  const [formData, setFormData] = useState({
    companyName: 'შპს "ქართული კრედიტი"',
    representativeName: 'გიორგი მაისურაძე',
    email: 'info@geocredit.ge',
    phone: '+995 599 12 34 56',
    password: '',
    agreeTerms: true,
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleVerifyTaxId = () => {
    if (!taxId) return;
    setIsVerifyingTaxId(true);
    setTimeout(() => {
      setIsVerifyingTaxId(false);
      setTaxIdVerified(true);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Debitinfo.GE რეგისტრაცია</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-text-primary">
            ანგარიშის გახსნა პლატფორმაზე
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            მიიღეთ სრული წვდომა ეროვნულ სადებიტო რეესტრზე და საკრედიტო რისკების ინსტრუმენტებზე.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-0" />
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all ${
                step >= s
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border-2 border-slate-300 text-slate-400'
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-subtle shadow-sm">
          {isSuccess ? (
            <div className="text-center py-10 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary">რეგისტრაცია წარმატებით დასრულდა!</h2>
              <p className="text-sm text-text-muted max-w-md mx-auto">
                თქვენს ელფოსტაზე ({formData.email}) გამოგზავნილია ვერიფიკაციის ბმული და ხელშეკრულების ელექტრონული ასლი.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link
                  href="/creditor"
                  className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  კრედიტორის კაბინეტში გადასვლა
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl border border-border-subtle text-text-primary font-semibold text-sm hover:bg-slate-50 transition-colors"
                >
                  მთავარ გვერდზე
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Step 1: Account Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-text-primary text-center">აირჩიეთ ანგარიშის ტიპი</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAccountType('company')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-4 ${
                        accountType === 'company'
                          ? 'border-primary bg-blue-50/40 shadow-xs'
                          : 'border-border-subtle hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-text-primary">იურიდიული პირი (კომპანია)</div>
                        <p className="text-xs text-text-muted mt-1">ბანკები, მიკროსაფინანსოები, დისტრიბუტორები და კორპორატიული კრედიტორები.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('individual')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all flex flex-col justify-between space-y-4 ${
                        accountType === 'individual'
                          ? 'border-primary bg-blue-50/40 shadow-xs'
                          : 'border-border-subtle hover:border-slate-300'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-text-primary">ფიზიკური პირი / მოვალე</div>
                        <p className="text-xs text-text-muted mt-1">პირადი საკრედიტო ისტორიის ნახვა, დავალიანების გადახდა და დავის ინიცირება.</p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                      <span>გაგრძელება</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Identification */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    {accountType === 'company' ? 'კომპანიის საიდენტიფიკაციო კოდი' : 'პირადი ნომერი'}
                  </h3>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-muted">
                      {accountType === 'company' ? 'საიდენტიფიკაციო კოდი (9 ნიშნა)' : 'პირადი ნომერი (11 ნიშნა)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={taxId}
                        onChange={(e) => {
                          setTaxId(e.target.value);
                          setTaxIdVerified(false);
                        }}
                        placeholder={accountType === 'company' ? 'მაგ: 405123987' : 'მაგ: 01019012345'}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border-subtle text-sm focus:outline-none focus:border-primary font-mono text-text-primary"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyTaxId}
                        disabled={isVerifyingTaxId || !taxId}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                      >
                        {isVerifyingTaxId ? 'მოწმდება...' : 'შემოწმება (RS.GE)'}
                      </button>
                    </div>
                  </div>

                  {taxIdVerified && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">მონაცემები გადამოწმებულია საჯარო რეესტრში</div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          კომპანია: შპს "ქართული კრედიტი" • სტატუსი: აქტიური გადამხდელი
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-border-subtle text-text-muted text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>უკან</span>
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                    >
                      <span>გაგრძელება</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Package Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-text-primary">აირჩიეთ სატარიფო პაკეტი</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'starter', name: 'სტარტერი', price: '120 ₾', desc: '50-მდე დებიტორი' },
                      { id: 'business', name: 'ბიზნესი', price: '320 ₾', desc: '500-მდე საქმე, CSV იმპორტი' },
                      { id: 'enterprise', name: 'კორპორაციული', price: 'ინდივიდუალური', desc: 'შეუზღუდავი & API' },
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id as any)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedPlan === plan.id
                            ? 'border-primary bg-blue-50/50 shadow-xs'
                            : 'border-border-subtle hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-sm text-text-primary">{plan.name}</div>
                        <div className="text-base font-bold font-mono text-primary mt-1">{plan.price}</div>
                        <div className="text-[11px] text-text-muted mt-1">{plan.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl border border-border-subtle text-text-muted text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>უკან</span>
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                    >
                      <span>გაგრძელება</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Auth Details */}
              {step === 4 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-text-primary">საკონტაქტო და ავტორიზაციის მონაცემები</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">ორგანიზაციის დასახელება</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">უფლებამოსილი პირი</label>
                      <input
                        type="text"
                        value={formData.representativeName}
                        onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">სამუშაო ელფოსტა</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">საკონტაქტო ტელეფონი</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary font-mono text-text-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">პაროლი</label>
                    <input
                      type="password"
                      placeholder="მინიმუმ 8 სიმბოლო..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreeTerms}
                        onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        required
                      />
                      <span>ვეთანხმები პერსონალურ მონაცემთა დამუშავების წესებს და მომსახურების პირობებს.</span>
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-xl border border-border-subtle text-text-muted text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>უკან</span>
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                    >
                      რეგისტრაციის დასრულება
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
