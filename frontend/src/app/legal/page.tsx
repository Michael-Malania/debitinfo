'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { legalService } from '@/services';
import { LegalCase } from '@/types';
import { 
  Scale, 
  FileText, 
  Gavel, 
  Calendar, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Download, 
  User, 
  Building2,
  ChevronRight,
  X
} from 'lucide-react';

export default function LegalCabinet() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [selectedCaseForNotice, setSelectedCaseForNotice] = useState<LegalCase | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await legalService.getCases();
      setCases(data);
    }
    load();
  }, []);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Workspace Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">იურიდიული საქმისწარმოება & სააღსრულებო ბიურო</h1>
              <p className="text-xs text-text-muted">სასამართლო სარჩელები, სააღსრულებო ფურცლები და მედიაციის პროცესები.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('სააღსრულებო ბიუროს ბაზასთან სინქრონიზაცია წარმატებით განხორციელდა.')}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>სააღსრულებო სინქრონიზაცია</span>
            </button>
          </div>
        </div>

        {/* 1. Legal KPI summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">აქტიური სასამართლო სარჩელი</span>
            <div className="text-2xl font-bold font-mono text-primary">112 საქმე</div>
            <div className="text-[11px] text-text-muted">მოთხოვნის საერთო მოცულობა: 4.8M ₾</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">სააღსრულებო ფურცლები</span>
            <div className="text-2xl font-bold font-mono text-emerald-600">48 ფურცელი</div>
            <div className="text-[11px] text-text-muted">აღსრულების ეროვნულ ბიუროში წარმოებაში</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">წინასასამართლო მედიაცია</span>
            <div className="text-2xl font-bold font-mono text-amber-600">34 შეთანხმება</div>
            <div className="text-[11px] text-text-muted">მიღწეულია მორიგება 70% პირგასამტეხლოს დათმობით</div>
          </div>
        </div>

        {/* 2. Court Cases Table */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">მიმდინარე სასამართლო & სააღსრულებო საქმეები</h2>
            <span className="text-xs text-text-muted font-mono">{cases.length} აქტიური საქმე</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-subtle text-text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">საქმე #</th>
                  <th className="py-3 px-4">ინსტანცია</th>
                  <th className="py-3 px-4">მოსარჩელე</th>
                  <th className="py-3 px-4">მოპასუხე</th>
                  <th className="py-3 px-4">თანხა</th>
                  <th className="py-3 px-4">მოსამართლე / მედიატორი</th>
                  <th className="py-3 px-4">სხდომის თარიღი</th>
                  <th className="py-3 px-4 text-right">ქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{c.caseNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-text-muted">{c.courtInstance}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">{c.plaintiff}</td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">{c.defendant}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">{c.claimAmount.toLocaleString()} ₾</td>
                    <td className="py-3.5 px-4 text-text-muted">{c.judgeName}</td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">
                      {c.nextHearingDate ? new Date(c.nextHearingDate).toLocaleDateString('ka-GE') : 'განხილვაში'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCaseForNotice(c)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-primary hover:bg-primary hover:text-white transition-colors font-medium text-[11px] whitespace-nowrap"
                      >
                        შეტყობინების გენერაცია
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pre-trial Notice Generation Modal */}
        {selectedCaseForNotice && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-border-subtle shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">წინასასამართლო გაფრთხილების შეტყობინება</h3>
                </div>
                <button onClick={() => setSelectedCaseForNotice(null)} className="text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Document Preview */}
              <div className="border border-slate-300 rounded-xl p-6 bg-slate-50 space-y-4 text-xs font-serif leading-relaxed text-slate-800">
                <div className="text-center font-bold font-sans text-sm pb-2 border-b border-slate-300">
                  ოფიციალური გაფრთხილება სასამართლო დავის დაწყების შესახებ
                </div>

                <div className="space-y-1">
                  <div><strong>ადრესატი (მოპასუხე):</strong> {selectedCaseForNotice.defendant}</div>
                  <div><strong>მოსარჩელე:</strong> {selectedCaseForNotice.plaintiff}</div>
                  <div><strong>საქმის ნომერი:</strong> {selectedCaseForNotice.caseNumber}</div>
                  <div><strong>ვადაგადაცილებული მოთხოვნის ოდენობა:</strong> {selectedCaseForNotice.claimAmount.toLocaleString()} ლარი</div>
                </div>

                <p>
                  გაცნობებთ, რომ თუ წინამდებარე შეტყობინების მიღებიდან 7 (შვიდი) კალენდარული დღის ვადაში არ მოხდება არსებული დავალიანების სრულად დაფარვა ან გადახდის შეთანხმებული გრაფიკის გაფორმება, საქმე დაუყოვნებლივ გადაეცემა {selectedCaseForNotice.courtInstance}-ს იძულებითი წესით ამოსაღებად.
                </p>

                <p>
                  სასამართლო გადაწყვეტილების მიღების შემდგომ თქვენ დაგეკისრებათ სასამართლო ბაჟის, ადვოკატის მომსახურებისა და სააღსრულებო ბიუროს ხარჯების (მოთხოვნილი თანხის 7%) ანაზღაურება.
                </p>

                <div className="pt-4 flex justify-between font-sans text-[11px] text-slate-600">
                  <div>თარიღი: 21 ოქტ, 2024</div>
                  <div>იურიდიული დეპარტამენტის ხელმძღვანელი</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedCaseForNotice(null)}
                  className="px-4 py-2 rounded-xl text-xs text-text-muted hover:bg-slate-100"
                >
                  დახურვა
                </button>
                <button
                  onClick={() => {
                    showToast('შეტყობინება დაბეჭდილია და გაგზავნილია რეგისტრირებულ მისამართზე.');
                    setSelectedCaseForNotice(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ბეჭდვა / გაგზავნა</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
