'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { debtorService } from '@/services';
import { DebtorRecord, DebtorLiabilityItem } from '@/types';
import { 
  CreditCard, 
  AlertCircle, 
  Calculator, 
  FileCheck2, 
  HelpCircle, 
  Download, 
  CheckCircle2, 
  User, 
  Clock, 
  ShieldCheck, 
  Send,
  X
} from 'lucide-react';

export default function DebtorPortal() {
  const [debtor, setDebtor] = useState<DebtorRecord | null>(null);
  const [liabilities, setLiabilities] = useState<DebtorLiabilityItem[]>([]);
  const [repayMonths, setRepayMonths] = useState<number>(6);
  const [selectedLiabilityForPay, setSelectedLiabilityForPay] = useState<DebtorLiabilityItem | null>(null);
  const [selectedLiabilityForDispute, setSelectedLiabilityForDispute] = useState<DebtorLiabilityItem | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [deb, liab] = await Promise.all([
        debtorService.getActiveProfile(),
        debtorService.getLiabilities()
      ]);
      setDebtor(deb);
      setLiabilities(liab);
    }
    load();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalOutstanding = liabilities.reduce((sum, item) => sum + item.remainingAmount, 0);
  const calculatedMonthly = Math.round((totalOutstanding / repayMonths) * 1.02);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiabilityForPay) return;
    const res = await debtorService.submitPayment(selectedLiabilityForPay.id, selectedLiabilityForPay.remainingAmount);
    showToast(`გადახდა წარმატებით შესრულდა! ტრანზაქცია #${res.transactionId}`);
    setSelectedLiabilityForPay(null);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiabilityForDispute) return;
    const res = await debtorService.submitDispute(selectedLiabilityForDispute.id, disputeReason);
    showToast(`დავა დარეგისტრირდა #${res.disputeId}. საქმე გადაცემულია მედიატორს.`);
    setSelectedLiabilityForDispute(null);
    setDisputeReason('');
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Card */}
        {debtor && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-text-primary">{debtor.name}</h1>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      საკრედიტო რეიტინგი B ({debtor.riskScore} ქულა)
                    </span>
                  </div>
                  <div className="text-xs text-text-muted font-mono mt-1">
                    პირადი ნომერი: {debtor.personalId} • საქმე #{debtor.caseNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => showToast('ამონაწერი გენერირებულია და იტვირთება PDF ფორმატში.')}
                  className="px-4 py-2 rounded-xl border border-border-subtle hover:bg-slate-50 text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ამონაწერის ჩამოტვირთვა</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-border-subtle space-y-1">
                <span className="text-xs text-text-muted">მიმდინარე დავალიანება</span>
                <div className="text-2xl font-bold font-mono text-primary">{totalOutstanding.toLocaleString()} ₾</div>
                <div className="text-[11px] text-text-muted">3 აქტიური კრედიტორი ორგანიზაცია</div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="text-xs text-amber-800">შემდეგი შენატანი</span>
                <div className="text-2xl font-bold font-mono text-amber-800">380 ₾</div>
                <div className="text-[11px] text-amber-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> გადახდის ვადა: 5 ნოემბერი, 2024
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-xs text-emerald-800">შეღავათიანი პროგრამა</span>
                <div className="text-xl font-bold text-emerald-800">პირგასამტეხლოს 80% ჩამოწერა</div>
                <div className="text-[11px] text-emerald-700">ვადამდელი დაფარვის შემთხვევაში</div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Interactive Repayment Calculator */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">დაფარვის გრაფიკის კალკულატორი</h2>
              <p className="text-xs text-text-muted">შეარჩიეთ თქვენთვის სასურველი გადახდის პერიოდი და გადაანაწილეთ თანხა.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 p-6 rounded-2xl border border-border-subtle">
            <div className="space-y-4">
              <label className="text-xs font-semibold text-text-muted block">
                დაფარვის ხანგრძლივობა: <span className="text-primary font-bold font-mono">{repayMonths} თვე</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 12, 24].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRepayMonths(m)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      repayMonths === m
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white border border-border-subtle text-text-muted hover:border-slate-300'
                    }`}
                  >
                    {m} თვე
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                გრაფიკის დამტკიცების შემდეგ ჩერდება საურავების დარიცხვა და საქმე არ გადაეცემა სააღსრულებო ბიუროს.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border-subtle space-y-3 text-center sm:text-left">
              <span className="text-xs font-semibold text-text-muted block">სავარაუდო ყოველთვიური შენატანი</span>
              <div className="text-3xl font-bold font-mono text-primary">{calculatedMonthly.toLocaleString()} ₾</div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                ზოგავთ 1,020 ₾-მდე პირგასამტეხლოს თანხას
              </div>
              <button
                onClick={() => showToast(`გრაფიკი ${repayMonths} თვეზე გადაგზავნილია კრედიტორებთან დასადასტურებლად.`)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors mt-2"
              >
                გრაფიკის მოთხოვნა
              </button>
            </div>
          </div>
        </section>

        {/* 3. Detailed Liabilities Breakdown */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">აქტიური დავალიანებები კრედიტორების მიხედვით</h2>
            <span className="text-xs text-text-muted font-mono">{liabilities.length} ჩანაწერი</span>
          </div>

          <div className="space-y-4">
            {liabilities.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border-subtle hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text-primary">{item.creditorName}</span>
                    <span className="text-xs font-mono text-text-muted">({item.agreementNumber})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      ვადაგადაცილებული
                    </span>
                  </div>
                  <div className="text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1">
                    <span>საწყისი: {item.initialAmount.toLocaleString()} ₾</span>
                    <span>საურავი: <span className="text-red-600 font-mono">+{item.penaltyAmount} ₾</span></span>
                    <span>ვადა: <span className="font-mono text-text-primary">{item.daysOverdue} დღე</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-text-muted">გადასახდელი</div>
                    <div className="text-lg font-bold font-mono text-primary">{item.remainingAmount.toLocaleString()} ₾</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedLiabilityForDispute(item)}
                      className="px-3 py-2 rounded-xl border border-border-subtle hover:bg-white text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                    >
                      გასაჩივრება
                    </button>
                    <button
                      onClick={() => setSelectedLiabilityForPay(item)}
                      className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-xs"
                    >
                      გადახდა
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Modal */}
        {selectedLiabilityForPay && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-border-subtle shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-bold text-text-primary">ონლაინ გადახდა</h4>
                </div>
                <button onClick={() => setSelectedLiabilityForPay(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-1 text-xs">
                <div>კრედიტორი: <span className="font-bold text-text-primary">{selectedLiabilityForPay.creditorName}</span></div>
                <div>ხელშეკრულება: <span className="font-mono text-text-primary">{selectedLiabilityForPay.agreementNumber}</span></div>
                <div>თანხა: <span className="font-mono font-bold text-primary text-sm">{selectedLiabilityForPay.remainingAmount.toLocaleString()} ₾</span></div>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">ბარათის ნომერი</label>
                  <input
                    type="text"
                    defaultValue="4127 •••• •••• 8841"
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono text-text-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">ვადა</label>
                    <input type="text" defaultValue="08/28" className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono text-text-primary" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">CVC</label>
                    <input type="password" defaultValue="884" className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono text-text-primary" required />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  გადახდა ({selectedLiabilityForPay.remainingAmount.toLocaleString()} ₾)
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {selectedLiabilityForDispute && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-border-subtle shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-bold text-text-primary">დავის / გასაჩივრების ინიცირება</h4>
                </div>
                <button onClick={() => setSelectedLiabilityForDispute(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900">
                საქმე გადაეცემა ფინანსური მედიაციის პალატას. საქმის წარმოების პერიოდში საურავების დარიცხვა შეჩერდება.
              </div>

              <form onSubmit={handleDisputeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">გასაჩივრების საფუძველი</label>
                  <select
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary"
                    required
                  >
                    <option>არასწორად დარიცხული პროცენტი / პირგასამტეხლო</option>
                    <option>თანხა უკვე გადახდილია (ქვითარი თანდართულია)</option>
                    <option>ხელშეკრულების პირობების დარღვევა კრედიტორის მიერ</option>
                    <option>იდენტობის მოპარვა / არაავტორიზებული სესხი</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">დეტალური აღწერა</label>
                  <textarea
                    rows={3}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="მიუთითეთ დეტალური გარემოებები..."
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  დავის გაგზავნა მედიაციაში
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
