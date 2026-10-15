'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ShieldCheck, 
  Award, 
  Download, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Sparkles, 
  Share2 
} from 'lucide-react';

export default function CleanProfilePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Prime Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Award className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">მარიამ კობახიძე</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  Rating A (Prime)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                სრულიად სუფთა საკრედიტო ისტორია • 0.00 ₾ აქტიური დავალიანება რეესტრში.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('ცნობა გენერირებულია და იტვირთება PDF ფორმატში.')}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-emerald-50 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>ცნობის ჩამოტვირთვა</span>
            </button>
          </div>
        </div>

        {/* Official Certificate Card */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-border-subtle shadow-sm relative overflow-hidden">
          {/* Watermark / Seal */}
          <div className="border-4 border-double border-emerald-600/30 rounded-2xl p-6 sm:p-10 space-y-8 relative">
            <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-text-primary uppercase tracking-wider block">Debitinfo.GE</span>
                  <span className="text-[10px] text-text-muted">საქართველოს ეროვნული სადებიტო რეესტრი</span>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-text-muted">
                <div>რეგისტრირებული სერტიფიკატი: <strong>#CERT-2024-A8910</strong></div>
                <div>გაცემის თარიღი: 22 ოქტომბერი, 2024</div>
              </div>
            </div>

            <div className="text-center space-y-3 py-4 max-w-xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                ც ნ ო ბ ა
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-serif leading-relaxed">
                ეძლევა <strong>მარიამ კობახიძეს</strong> (პირადი ნომერი: <strong>01024056789</strong>) მასზედ, რომ Debitinfo.GE-ს მონაცემთა ბაზისა და RS.GE-ს ინტეგრირებული რეესტრის მიხედვით, მის სახელზე <strong>არ ფიქსირდება რაიმე სახის ვადაგადაცილებული დავალიანება</strong> ან სასამართლო სააღსრულებო წარმოება.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border-subtle gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div className="text-[11px] text-text-muted">
                  <div className="font-bold text-text-primary">ელექტრონული ვერიფიკაცია</div>
                  <div>დაასკანერეთ QR კოდი ნამდვილობის დასადასტურებლად.</div>
                  <div className="font-mono text-emerald-600">სტატუსი: ვერიფიცირებულია ✓</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-text-primary">სისტემური აუდიტორი & დირექტორატი</div>
                <div className="text-[10px] text-text-muted">Debitinfo.GE რეესტრის დეპარტამენტი</div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Offers for Rating A borrowers */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-text-primary">პარტნიორი ბანკების ექსკლუზიური შეთავაზებები (A-Rating)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-primary uppercase">სს "თიბისი ბანკი"</span>
                <h3 className="text-base font-bold text-text-primary">პრე-აპრუვ სამომხმარებლო სესხი</h3>
                <p className="text-xs text-text-muted">
                  თქვენი უმაღლესი რეიტინგის საფუძველზე დამტკიცებულია 15,000 ₾-მდე შეღავათიანი განაკვეთით (11.5%-დან).
                </p>
              </div>
              <button
                onClick={() => showToast('მოთხოვნა გადაგზავნილია თიბისი ბანკში.')}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                შეთავაზების მიღება
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-primary uppercase">სს "საქართველოს ბანკი"</span>
                <h3 className="text-base font-bold text-text-primary">ბიზნესის გაფართოების საკრედიტო ხაზი</h3>
                <p className="text-xs text-text-muted">
                  0% საკომისიო და სწრაფი გააქტიურება უზრუნველყოფის გარეშე Debitinfo რეესტრის A-სერტიფიკატით.
                </p>
              </div>
              <button
                onClick={() => showToast('მოთხოვნა გადაგზავნილია საქართველოს ბანკში.')}
                className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                პირობების გაცნობა
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
