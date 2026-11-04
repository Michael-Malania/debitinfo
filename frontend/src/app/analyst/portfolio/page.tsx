'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AnalystSidebar from '@/components/analyst/AnalystSidebar';

export default function PortfolioDispatchPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Dynamic state
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [claimsOptions, setClaimsOptions] = useState<any[]>([]);
  const [workloadStats, setWorkloadStats] = useState<any>(null);

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [dispatchPriority, setDispatchPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMessage, setDispatchSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [claimSearch, setClaimSearch] = useState('');

  // Authentication check
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ANALYST' && user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setAuthorized(true);
  }, [router]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [staff, claims, workload] = await Promise.all([
        analystBackendService.getStaffOptions(),
        analystBackendService.getClaimsOptions(),
        analystBackendService.getWorkloadStats(),
      ]);

      setStaffOptions(staff || []);
      setClaimsOptions(claims || []);
      setWorkloadStats(workload || null);

      if (staff && staff.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staff[0].id);
      }
      if (claims && claims.length > 0 && !selectedClaimId) {
        setSelectedClaimId(claims[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load portfolio dispatch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('გთხოვთ აირჩიოთ პასუხისმგებელი თანამშრომელი');
      return;
    }
    if (!selectedClaimId) {
      alert('გთხოვთ აირჩიოთ გასანაწილებელი საქმე');
      return;
    }

    setIsDispatching(true);
    try {
      const res = await analystBackendService.dispatchTask({
        staffUserId: selectedStaffId,
        claimId: selectedClaimId,
        priority: dispatchPriority,
        instructions: dispatchInstructions.trim(),
      });

      setDispatchSuccessMessage(res?.message || 'საქმე წარმატებით გადანაწილდა თანამშრომელზე!');
      setDispatchInstructions('');
      setTimeout(() => setDispatchSuccessMessage(null), 5000);

      await loadData();
    } catch (err: any) {
      alert(err?.message || 'დავალების გაცემა ვერ მოხერხდა');
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredStaff = staffOptions.filter((s) => {
    if (roleFilter === 'ALL') return true;
    return s.role === roleFilter;
  });

  const filteredClaims = claimsOptions.filter((c) => {
    if (!claimSearch.trim()) return true;
    const q = claimSearch.toLowerCase();
    return (
      c.caseNumber?.toLowerCase().includes(q) ||
      c.debtorName?.toLowerCase().includes(q) ||
      c.creditorName?.toLowerCase().includes(q)
    );
  });

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>ავტორიზაცია...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="w-full px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/analyst" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-all">
                <span className="material-symbols-outlined text-[20px]">send_time_extension</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                  <span className="text-headline-sm font-bold text-secondary-container">.GE</span>
                </div>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                სამართავი პორტფელის განაწილება
              </span>
              <span className="text-xs text-slate-400">
                საქმეების დისპეტჩერიზაცია ოპერატორებზე, იურისტებსა და ვიზიტორებზე
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/analyst/written-off"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-rose-600">assignment_turned_in</span>
              <span>ჩამოწერილი ვალები</span>
            </Link>

            <Link
              href="/analyst/staff"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-emerald-600">badge</span>
              <span>თანამშრომელთა რეესტრი</span>
            </Link>

            <Link
              href="/analyst"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">arrow_back</span>
              <span>მთავარ კონსოლზე დაბრუნება</span>
            </Link>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="განახლება"
            >
              <span className="material-symbols-outlined text-base text-primary">sync</span>
              <span className="hidden md:inline">{loading ? 'განახლება...' : 'განახლება'}</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                {currentUser?.email?.substring(0, 2).toUpperCase() || 'AN'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser?.name || currentUser?.email || 'ანალიტიკოსი'}
                </span>
                <span className="text-[10px] text-slate-400">მთავარი ანალიტიკოსი</span>
              </div>
            </div>

            <button
              onClick={() => {
                authService.logout();
                window.location.href = '/ops';
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              title="სისტემიდან გამოსვლა"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout with AnalystSidebar */}
      <div className="flex-1 flex w-full overflow-hidden">
        <AnalystSidebar
          activeView="portfolio-dispatch"
          isOpen={isSidebarOpen}
          onToggleOpen={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Success Alert */}
        {dispatchSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm font-semibold shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
              <span>{dispatchSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDispatchSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Workload KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">ქოლ-ცენტრი &amp; CRM</span>
              <span className="material-symbols-outlined text-blue-600 text-[20px]">support_agent</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {workloadStats?.OPERATOR || 0}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">აქტიური საქმე</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">კრედიტ-მენეჯერების სამუშაო დატვირთვა</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">იურიდიული წარმოება</span>
              <span className="material-symbols-outlined text-indigo-600 text-[20px]">gavel</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {workloadStats?.LEGAL || 0}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">სასამართლო საქმე</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">სარჩელები, ბრძანებები &amp; სააღსრულებო</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">საველე მონიტორინგი</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">directions_walk</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {workloadStats?.FIELD_OFFICER || 0}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">ვიზიტის დავალება</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">მისამართზე ინსპექცია &amp; ფოტოფიქსაცია</div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">გასანაწილებელი საქმეები</span>
              <span className="material-symbols-outlined text-amber-600 text-[20px]">pending_actions</span>
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {claimsOptions.length}{' '}
              <span className="text-xs font-sans text-slate-500 font-normal">მზად დისპეტჩერიზაციისთვის</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">აქტიური დებიტორული მოთხოვნები</div>
          </div>
        </div>

        {/* Dispatch Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Dispatch Panel */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[22px]">hub</span>
                <h2 className="text-base font-bold text-slate-900">საქმის მიმაგრება თანამშრომელზე</h2>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold">
                Smart Dispatch
              </span>
            </div>

            <form onSubmit={handleDispatch} className="space-y-4">
              {/* Select Staff Member */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">badge</span>
                    პასუხისმგებელი თანამშრომელი:
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">როლი:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold text-[10px]"
                    >
                      <option value="ALL">ყველა როლი</option>
                      <option value="OPERATOR">ოპერატორები (ქოლ-ცენტრი)</option>
                      <option value="LEGAL">იურისტები</option>
                      <option value="FIELD_OFFICER">ვიზიტორები (საველე)</option>
                    </select>
                  </div>
                </div>

                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {filteredStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} ({staff.roleTitle}) — დატვირთვა: {staff.activeClaimsCount} საქმე [{staff.email}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Claim */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">folder_open</span>
                  გასანაწილებელი საქმე (პორტფელიდან):
                </label>
                <select
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {claimsOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} • მოვალე: {c.debtorName} • კრედიტორი: {c.creditorName} • ნაშთი: ₾{' '}
                      {Number(c.remainingAmount).toLocaleString('ka-GE')} [{c.daysOverdue} ვადაგად.]
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  პრიორიტეტი &amp; რეაგირების SLA
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDispatchPriority('high')}
                    className={`p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dispatchPriority === 'high'
                        ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-rose-600 text-lg">priority_high</span>
                    <span>მაღალი (სასწრაფო)</span>
                    <span className="text-[10px] text-slate-400 font-normal">SLA: 24 საათი</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchPriority('medium')}
                    className={`p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dispatchPriority === 'medium'
                        ? 'border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-amber-600 text-lg">schedule</span>
                    <span>საშუალო</span>
                    <span className="text-[10px] text-slate-400 font-normal">SLA: 72 საათი</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchPriority('low')}
                    className={`p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      dispatchPriority === 'low'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-emerald-600 text-lg">low_priority</span>
                    <span>სტანდარტული</span>
                    <span className="text-[10px] text-slate-400 font-normal">SLA: 5 სამუშაო დღე</span>
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ანალიტიკოსის ინსტრუქცია &amp; ამოცანის დეტალები:
                </label>
                <textarea
                  rows={3}
                  value={dispatchInstructions}
                  onChange={(e) => setDispatchInstructions(e.target.value)}
                  placeholder="მაგ: გთხოვთ დაუკავშირდეთ მოვალეს, გადაამოწმოთ უძრავი ქონების არსებობა, მოითხოვოთ საგარანტიო წერილი ან მოამზადოთ სარჩელი სასამართლოსთვის..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isDispatching ? 'მიმდინარეობს განაწილება...' : 'დავალების გაცემა & საქმის მიმაგრება'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Claims Quick View */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
                <span>საქმეების პორტფელი ({filteredClaims.length})</span>
              </h3>
              <input
                type="text"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                placeholder="ძიება..."
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 w-36 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedClaimId === claim.id
                      ? 'border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                    <span>{claim.caseNumber}</span>
                    <span className="text-indigo-700">₾ {Number(claim.remainingAmount).toLocaleString('ka-GE')}</span>
                  </div>
                  <div className="font-semibold text-slate-800 mt-1 truncate">
                    {claim.debtorName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>კრედიტორი: {claim.creditorName}</span>
                    <span className="text-rose-600 font-semibold">{claim.daysOverdue} დღე ვადაგად.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
