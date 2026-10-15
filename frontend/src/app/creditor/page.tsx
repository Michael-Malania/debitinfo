'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { creditorService, debtorService } from '@/services';
import { CreditorKPIs, CreditorClaim, DebtorLiabilityItem, DebtorRecord } from '@/types';
import { 
  Building2, 
  FileText, 
  Upload, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  User, 
  ShieldAlert, 
  Download, 
  Filter, 
  Search,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function CreditorCabinet() {
  const [kpis, setKpis] = useState<CreditorKPIs | null>(null);
  const [claims, setClaims] = useState<CreditorClaim[]>([]);
  const [liabilities, setLiabilities] = useState<DebtorLiabilityItem[]>([]);
  const [debtor, setDebtor] = useState<DebtorRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [kpiData, claimsData, liabData, debData] = await Promise.all([
        creditorService.getKPIs(),
        creditorService.getClaims(),
        debtorService.getLiabilities(),
        debtorService.getActiveProfile()
      ]);
      setKpis(kpiData);
      setClaims(claimsData);
      setLiabilities(liabData);
      setDebtor(debData);
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredClaims = claims.filter(c => {
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch = c.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) || c.personalId.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

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
        {/* Top Breadcrumb & Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>მთავარი</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-text-primary font-medium">კრედიტორის სამუშაო კაბინეტი</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary font-semibold font-mono">პორტფელი: სს "თიბისი ბანკი"</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-text-muted">RS.GE რეესტრთან სინქრონიზებული</span>
          </div>
        </div>

        {/* 1. Portfolio KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-2">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>მთლიანი პორტფელი</span>
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {kpis ? kpis.totalPortfolio.toLocaleString() : '18,450,000'} ₾
            </div>
            <div className="text-[11px] text-text-muted flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">+2.4%</span> წინა თვესთან შედარებით
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-2">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>აქტიური მოთხოვნები</span>
              <FileText className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {kpis ? kpis.activeClaimsCount : '1,642'} საქმე
            </div>
            <div className="text-[11px] text-text-muted">
              მონიტორინგის ქვეშ მყოფი მოვალეები
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-2">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>ამოღებული თანხა (მიმდ.)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {kpis ? kpis.recoveredThisMonth.toLocaleString() : '580,000'} ₾
            </div>
            <div className="text-[11px] text-text-muted">
              წარმატების მაჩვენებელი: <span className="font-semibold text-text-primary">{kpis ? kpis.recoveryRatePercent : '71.8'}%</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-2">
            <div className="flex items-center justify-between text-text-muted text-xs">
              <span>სასამართლო დავები</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-red-600">
              {kpis ? kpis.litigationCasesCount : '112'} საქმე
            </div>
            <div className="text-[11px] text-text-muted">
              გადაცემულია სააღსრულებო ბიუროს
            </div>
          </div>
        </div>

        {/* 2. Focused Debtor Profile Inspection Card (Giorgi Beridze Case DB-2024-8841) */}
        {debtor && (
          <section className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold text-2xl shadow-inner shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-text-primary">{debtor.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-primary border border-blue-200">
                      საქმე: {debtor.caseNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      სტატუსი: {debtor.status === 'active' ? 'აქტიური მოვალე' : debtor.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-text-muted pt-1">
                    <div>პირადი ნომერი: <span className="font-mono text-text-primary font-semibold">{debtor.personalId}</span></div>
                    <div>მისამართი: <span className="text-text-primary">{debtor.address}</span></div>
                    <div>ტელეფონი: <span className="font-mono text-text-primary">{debtor.phone}</span></div>
                  </div>
                </div>
              </div>

              {/* Curator Info */}
              {debtor.assignedCurator && (
                <div className="bg-slate-50 border border-border-subtle rounded-xl p-3.5 flex items-center justify-between gap-4 lg:w-80">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">მომსახურე კურატორი</span>
                    <div className="text-xs font-bold text-text-primary">{debtor.assignedCurator.name}</div>
                    <div className="text-[11px] font-mono text-text-muted">{debtor.assignedCurator.phone} (შიდა: {debtor.assignedCurator.extension})</div>
                  </div>
                  <button 
                    onClick={() => showToast(`ზარი ინიცირებულია კურატორთან (${debtor.assignedCurator?.phone})`)}
                    className="p-2 rounded-lg bg-white border border-border-subtle text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Credit Score Gauge Component */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="bg-slate-50 border border-border-subtle rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-muted">საკრედიტო რეიტინგი</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                    Grade {debtor.rating} (საშუალო რისკი)
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-1/3" title="Grade A" />
                    <div className="bg-amber-400 h-full w-1/3" title="Grade B (Current)" />
                    <div className="bg-red-500 h-full w-1/3 opacity-30" title="Grade C" />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-mono">
                    <span>Grade A (მაღალი)</span>
                    <span className="font-bold text-amber-700">Grade B (615 ქულა)</span>
                    <span>Grade C (დეფოლტი)</span>
                  </div>
                </div>
              </div>

              {/* Debt Snapshot */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-border-subtle">
                  <span className="text-xs text-text-muted block">სრული დავალიანება</span>
                  <span className="text-xl font-bold font-mono text-primary">{debtor.totalDebt.toLocaleString()} ₾</span>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-xs text-amber-800 block">ვადაგადაცილებული</span>
                  <span className="text-xl font-bold font-mono text-amber-700">{debtor.overdueAmount.toLocaleString()} ₾</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-border-subtle col-span-2 sm:col-span-1">
                  <span className="text-xs text-text-muted block">ვადაგადაცილების დღეები</span>
                  <span className="text-xl font-bold font-mono text-red-600">42 დღე</span>
                </div>
              </div>
            </div>

            {/* Debt Schedule Table for Giorgi Beridze */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">აქტიური საკრედიტო ვალდებულებები</h3>
                <span className="text-xs text-text-muted font-mono">{liabilities.length} რეგისტრირებული ხელშეკრულება</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-border-subtle text-text-muted uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">კრედიტორი</th>
                      <th className="py-3 px-4">ხელშეკრულება</th>
                      <th className="py-3 px-4">ნარჩენი ძირი</th>
                      <th className="py-3 px-4">პირგასამტეხლო</th>
                      <th className="py-3 px-4">ვადაგადაცილება</th>
                      <th className="py-3 px-4">შემდეგი გადახდა</th>
                      <th className="py-3 px-4 text-right">ქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-white">
                    {liabilities.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-text-primary">{item.creditorName}</td>
                        <td className="py-3.5 px-4 font-mono text-text-muted">{item.agreementNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{item.remainingAmount.toLocaleString()} ₾</td>
                        <td className="py-3.5 px-4 font-mono text-red-600">+{item.penaltyAmount.toLocaleString()} ₾</td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold">
                            {item.daysOverdue} დღე
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-text-muted">{item.nextPaymentDate}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => showToast(`შეხსენების SMS გაეგზავნა ${debtor.name}-ს (${item.agreementNumber})`)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-primary hover:bg-primary hover:text-white transition-colors font-medium text-[11px]"
                          >
                            SMS შეხსენება
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 3. Claims Registry Table & Management */}
        <section className="bg-white rounded-2xl p-6 border border-border-subtle shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">კრედიტორის სრული სადებიტო რეესტრი</h3>
              <p className="text-xs text-text-muted">მართეთ ყველა რეგისტრირებული მოთხოვნა და აკონტროლეთ გადახდის სტატუსები.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>CSV იმპორტი</span>
              </button>
              <button
                onClick={() => showToast('მოთხოვნების რეესტრი ექსპორტირებულია Excel ფაილად.')}
                className="px-3 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>რეესტრის ექსპორტი</span>
              </button>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="მოძებნეთ მოვალის სახელით ან პირადი ნომრით..."
                className="w-full pl-9 pr-4 py-2 border border-border-subtle rounded-xl text-xs focus:outline-none focus:border-primary text-text-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'active', 'legal', 'in_negotiation', 'settled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    filterStatus === st
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  {st === 'all' && 'ყველა'}
                  {st === 'active' && 'აქტიური'}
                  {st === 'legal' && 'სასამართლოში'}
                  {st === 'in_negotiation' && 'მედიაცია'}
                  {st === 'settled' && 'დაფარული'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-subtle text-text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">საქმე #</th>
                  <th className="py-3 px-4">დებიტორი</th>
                  <th className="py-3 px-4">საიდენტიფიკაციო / პ/ნ</th>
                  <th className="py-3 px-4">მოთხოვნის თანხა</th>
                  <th className="py-3 px-4">ვადაგადაცილება</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4">ბოლო აქტივობა</th>
                  <th className="py-3 px-4 text-right">ქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-text-primary">{claim.caseNumber}</td>
                    <td className="py-3 px-4 font-semibold text-text-primary">{claim.debtorName}</td>
                    <td className="py-3 px-4 font-mono text-text-muted">{claim.personalId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{claim.claimAmount.toLocaleString()} ₾</td>
                    <td className="py-3 px-4 font-mono">
                      {claim.daysOverdue > 0 ? (
                        <span className="text-red-600 font-semibold">{claim.daysOverdue} დღე</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        claim.status === 'active' ? 'bg-amber-100 text-amber-800' :
                        claim.status === 'legal' ? 'bg-red-100 text-red-800' :
                        claim.status === 'settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-text-muted">{claim.lastActivity}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => showToast(`საქმე ${claim.caseNumber} გადაცემულია იურიდიულ დეპარტამენტს.`)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-primary transition-colors"
                        title="იურიდიულში გადაცემა"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CSV Import Modal Simulation */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 border border-border-subtle shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h4 className="text-sm font-bold text-text-primary">დებიტორთა რეესტრის CSV იმპორტი</h4>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-xs text-text-muted hover:text-text-primary">✕</button>
              </div>
              <div className="border-2 border-dashed border-border-subtle rounded-xl p-8 text-center space-y-3 bg-slate-50">
                <Upload className="w-8 h-8 text-primary mx-auto" />
                <div className="text-xs font-semibold text-text-primary">ჩააგდეთ CSV ან XLSX ფაილი აქ</div>
                <div className="text-[11px] text-text-muted">ფაილი უნდა შეიცავდეს: პ/ნ, თანხა, ხელშეკრულების ნომერი, ვადაგადაცილების დღეები.</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-text-muted hover:bg-slate-100"
                >
                  გაუქმება
                </button>
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    showToast('CSV ფაილი წარმატებით დამუშავდა: 48 ახალი მოთხოვნა დამატებულია.');
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-700"
                >
                  იმპორტის დადასტურება
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
