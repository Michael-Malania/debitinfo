'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';

export default function AnalystAnalyticsHub() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedules' | 'lawyers' | 'visitors' | 'calls' | 'statute' | 'filtered_table'>('schedules');
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>({
    lawyers: [],
    operators: [],
    visitors: [],
    creditors: [],
    branches: [],
    products: [],
    sourceFiles: [],
  });

  // -------------------------------------------------------------------------
  // DUAL-COLUMN SMART FILTERS STATE (Matching image-3.png handwriting exactly)
  // -------------------------------------------------------------------------
  // Left Column
  const [filterName, setFilterName] = useState('');
  const [filterReceiptOrCaseNo, setFilterReceiptOrCaseNo] = useState('');
  const [filterPersonalId, setFilterPersonalId] = useState('');
  const [filterAddress, setFilterAddress] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterDebtOrigFrom, setFilterDebtOrigFrom] = useState('');
  const [filterDebtOrigTo, setFilterDebtOrigTo] = useState('');
  const [filterOverdueMoreThan3Years, setFilterOverdueMoreThan3Years] = useState(false);
  const [filterScheduleType, setFilterScheduleType] = useState('ALL');
  const [filterScheduleStatus, setFilterScheduleStatus] = useState('');
  const [filterLawyerId, setFilterLawyerId] = useState('');
  const [filterInCourt, setFilterInCourt] = useState(false);
  const [filterInEnforcement, setFilterInEnforcement] = useState(false);
  const [filterHasSequestration, setFilterHasSequestration] = useState(false);
  const [filterVisitorId, setFilterVisitorId] = useState('');
  const [filterOperatorId, setFilterOperatorId] = useState('');
  const [filterTeamLeadId, setFilterTeamLeadId] = useState('');
  const [filterHourFrom, setFilterHourFrom] = useState('8');
  const [filterHourTo, setFilterHourTo] = useState('18');
  const [filterOverdueDaysRange, setFilterOverdueDaysRange] = useState('');

  // Right Column
  const [filterYear, setFilterYear] = useState('2024');
  const [filterCompareYoY, setFilterCompareYoY] = useState(true);
  const [filterCreditorId, setFilterCreditorId] = useState('');
  const [filterProductType, setFilterProductType] = useState('');
  const [filterDirector, setFilterDirector] = useState('');
  const [filterFounder, setFilterFounder] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSourceFile, setFilterSourceFile] = useState('');

  // Active Date Preset
  const [datePreset, setDatePreset] = useState<'sep_oct' | 'last_6m' | 'may_week' | 'year' | 'custom'>('sep_oct');
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(true);

  // -------------------------------------------------------------------------
  // DATA STATES FOR THE 5 SCENARIOS
  // -------------------------------------------------------------------------
  const [schedulesData, setSchedulesData] = useState<any>(null);
  const [legalData, setLegalData] = useState<any>(null);
  const [visitorsData, setVisitorsData] = useState<any>(null);
  const [callCenterData, setCallCenterData] = useState<any>(null);
  const [statuteData, setStatuteData] = useState<any>(null);
  const [filteredQueryResult, setFilteredQueryResult] = useState<any>({ totalCount: 0, claims: [] });

  // -------------------------------------------------------------------------
  // LOAD ALL ANALYTICS DATA
  // -------------------------------------------------------------------------
  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const [meta, sched, leg, vis, calls, stat, qResult] = await Promise.all([
        analystBackendService.getBiMetadata(),
        analystBackendService.getSchedulesComparison({
          dateFrom: datePreset === 'sep_oct' ? '2024-09-01' : undefined,
          dateTo: datePreset === 'sep_oct' ? '2024-10-01' : undefined,
          compareYoY: filterCompareYoY,
        }),
        analystBackendService.getLegalPerformance({
          dateFrom: '2024-01-01',
          dateTo: '2024-06-01',
          lawyerId: filterLawyerId || undefined,
        }),
        analystBackendService.getVisitorsPerformance({
          dateFrom: '2024-05-12',
          dateTo: '2024-05-17',
          officerId: filterVisitorId || undefined,
        }),
        analystBackendService.getCallCenterPerformance({
          hourFrom: Number(filterHourFrom) || 8,
          hourTo: Number(filterHourTo) || 18,
          operatorId: filterOperatorId || undefined,
        }),
        analystBackendService.getStatuteLimitations({
          monthsLookback: 4,
          monthsLookahead: 4,
        }),
        analystBackendService.queryBi({
          name: filterName || undefined,
          receiptOrCaseNo: filterReceiptOrCaseNo || undefined,
          personalId: filterPersonalId || undefined,
          address: filterAddress || undefined,
          email: filterEmail || undefined,
          phone: filterPhone || undefined,
          debtOriginationFrom: filterDebtOrigFrom || undefined,
          debtOriginationTo: filterDebtOrigTo || undefined,
          overdueMoreThan3Years: filterOverdueMoreThan3Years || undefined,
          scheduleType: filterScheduleType,
          scheduleStatus: filterScheduleStatus || undefined,
          lawyerId: filterLawyerId || undefined,
          inCourt: filterInCourt || undefined,
          inEnforcement: filterInEnforcement || undefined,
          hasSequestration: filterHasSequestration || undefined,
          visitorId: filterVisitorId || undefined,
          operatorId: filterOperatorId || undefined,
          teamLeadId: filterTeamLeadId || undefined,
          overdueDaysRange: filterOverdueDaysRange || undefined,
          year: filterYear || undefined,
          creditorId: filterCreditorId || undefined,
          productType: filterProductType || undefined,
          director: filterDirector || undefined,
          founder: filterFounder || undefined,
          branch: filterBranch || undefined,
          sourceFile: filterSourceFile || undefined,
        }),
      ]);

      setMetadata(meta || {});
      setSchedulesData(sched || null);
      setLegalData(leg || null);
      setVisitorsData(vis || null);
      setCallCenterData(calls || null);
      setStatuteData(stat || null);
      setFilteredQueryResult(qResult || { totalCount: 0, claims: [] });
    } catch (err) {
      console.error('Failed to load BI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/analyst/analytics');
      return;
    }
    if (u.role !== 'ANALYST' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadAllAnalytics();
  }, [router]);

  const handleApplyFilters = async () => {
    setLoading(true);
    try {
      const qResult = await analystBackendService.queryBi({
        name: filterName || undefined,
        receiptOrCaseNo: filterReceiptOrCaseNo || undefined,
        personalId: filterPersonalId || undefined,
        address: filterAddress || undefined,
        email: filterEmail || undefined,
        phone: filterPhone || undefined,
        debtOriginationFrom: filterDebtOrigFrom || undefined,
        debtOriginationTo: filterDebtOrigTo || undefined,
        overdueMoreThan3Years: filterOverdueMoreThan3Years || undefined,
        scheduleType: filterScheduleType,
        scheduleStatus: filterScheduleStatus || undefined,
        lawyerId: filterLawyerId || undefined,
        inCourt: filterInCourt || undefined,
        inEnforcement: filterInEnforcement || undefined,
        hasSequestration: filterHasSequestration || undefined,
        visitorId: filterVisitorId || undefined,
        operatorId: filterOperatorId || undefined,
        teamLeadId: filterTeamLeadId || undefined,
        overdueDaysRange: filterOverdueDaysRange || undefined,
        year: filterYear || undefined,
        creditorId: filterCreditorId || undefined,
        productType: filterProductType || undefined,
        director: filterDirector || undefined,
        founder: filterFounder || undefined,
        branch: filterBranch || undefined,
        sourceFile: filterSourceFile || undefined,
      });
      setFilteredQueryResult(qResult);
      setActiveTab('filtered_table');
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterName('');
    setFilterReceiptOrCaseNo('');
    setFilterPersonalId('');
    setFilterAddress('');
    setFilterEmail('');
    setFilterPhone('');
    setFilterDebtOrigFrom('');
    setFilterDebtOrigTo('');
    setFilterOverdueMoreThan3Years(false);
    setFilterScheduleType('ALL');
    setFilterScheduleStatus('');
    setFilterLawyerId('');
    setFilterInCourt(false);
    setFilterInEnforcement(false);
    setFilterHasSequestration(false);
    setFilterVisitorId('');
    setFilterOperatorId('');
    setFilterTeamLeadId('');
    setFilterHourFrom('8');
    setFilterHourTo('18');
    setFilterOverdueDaysRange('');
    setFilterYear('2024');
    setFilterCompareYoY(true);
    setFilterCreditorId('');
    setFilterProductType('');
    setFilterDirector('');
    setFilterFounder('');
    setFilterBranch('');
    setFilterSourceFile('');
    loadAllAnalytics();
  };

  // Quick Preset Actions
  const handleSelectPreset = (preset: 'sep_oct' | 'last_6m' | 'may_week' | 'year') => {
    setDatePreset(preset);
    if (preset === 'sep_oct') {
      setActiveTab('schedules');
    } else if (preset === 'last_6m') {
      setActiveTab('lawyers');
    } else if (preset === 'may_week') {
      setActiveTab('visitors');
    } else if (preset === 'year') {
      setActiveTab('schedules');
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterName) count++;
    if (filterReceiptOrCaseNo) count++;
    if (filterPersonalId) count++;
    if (filterAddress) count++;
    if (filterEmail) count++;
    if (filterPhone) count++;
    if (filterDebtOrigFrom || filterDebtOrigTo) count++;
    if (filterOverdueMoreThan3Years) count++;
    if (filterScheduleType !== 'ALL') count++;
    if (filterScheduleStatus) count++;
    if (filterLawyerId) count++;
    if (filterInCourt) count++;
    if (filterInEnforcement) count++;
    if (filterHasSequestration) count++;
    if (filterVisitorId) count++;
    if (filterOperatorId) count++;
    if (filterTeamLeadId) count++;
    if (filterOverdueDaysRange) count++;
    if (filterCreditorId) count++;
    if (filterProductType) count++;
    if (filterDirector) count++;
    if (filterFounder) count++;
    if (filterBranch) count++;
    if (filterSourceFile) count++;
    return count;
  }, [
    filterName, filterReceiptOrCaseNo, filterPersonalId, filterAddress, filterEmail, filterPhone,
    filterDebtOrigFrom, filterDebtOrigTo, filterOverdueMoreThan3Years, filterScheduleType, filterScheduleStatus,
    filterLawyerId, filterInCourt, filterInEnforcement, filterHasSequestration, filterVisitorId,
    filterOperatorId, filterTeamLeadId, filterOverdueDaysRange, filterCreditorId, filterProductType,
    filterDirector, filterFounder, filterBranch, filterSourceFile,
  ]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-body-md selection:bg-primary-container selection:text-white antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-[1720px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/analyst" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm group-hover:bg-primary transition-all">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                  <span className="text-headline-sm font-bold text-secondary-container">.GE</span>
                </div>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold uppercase tracking-wider">
                BI &amp; Smart Analytics Hub
              </span>
              <span className="text-xs text-slate-400">ღრმა ანალიტიკა &amp; შედარებები</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link back to Analyst Dashboard */}
            <Link
              href="/analyst"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">arrow_back</span>
              <span>მთავარ რეესტრზე დაბრუნება</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="ამონაწერის ბეჭდვა"
            >
              <span className="material-symbols-outlined text-base text-primary">print</span>
              <span className="hidden md:inline">ბეჭდვა / PDF</span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                {currentUser?.email?.substring(0, 2).toUpperCase() || 'AN'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">დავით კაპანაძე</span>
                <span className="text-[10px] text-slate-400">მთავარი ანალიტიკოსი</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6 flex-1 flex flex-col gap-6">

        {/* 2. TOP BANNER & SCENARIO SHORTCUTS */}
        <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-blue-200">
                <span className="material-symbols-outlined text-sm text-emerald-400">query_stats</span>
                <span>ბიზნეს-დაზვერვის &amp; ანალიტიკის მართვის პანელი</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                ინტელექტუალური ფილტრაცია &amp; მრავალშრიანი შედარებები
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                გაანალიზეთ სტანდარტული და არასტანდარტული გრაფიკების ზრდის ტემპი (YoY), იურისტთა და საველე ოფიცერთა შედეგიანობა, ქოლ-ცენტრის საათობრივი დატვირთვა და 3-წლიანი ხანდაზმულობის რისკ-ფაქტორები.
              </p>
            </div>

            {/* Quick Scenario Buttons (Directly answering user's handwritten business questions) */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('sep_oct')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'schedules' ? 'bg-white text-blue-900 shadow-md ring-2 ring-white/50' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">calendar_month</span>
                <span>1 სექტ – 1 ოქტ (YoY გრაფიკები)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('last_6m')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'lawyers' ? 'bg-white text-blue-900 shadow-md ring-2 ring-white/50' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">gavel</span>
                <span>იურისტის 6 თვის შედეგები</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('may_week')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'visitors' ? 'bg-white text-blue-900 shadow-md ring-2 ring-white/50' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">directions_walk</span>
                <span>ვიზიტორი (12 მაისი – 17 მაისი)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calls')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'calls' ? 'bg-white text-blue-900 shadow-md ring-2 ring-white/50' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">call</span>
                <span>ზარები (08:00 – 18:00 ცვლა)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('statute')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'statute' ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-400' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">warning</span>
                <span>3-წლიანი ხანდაზმულობის რადარი</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. DUAL-COLUMN SMART FILTER COMMAND CENTER (Exact match to image-3.png) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">
                    ანალიტიკოსის ორსვეტიანი ჭკვიანი ფილტრი
                  </h2>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                      {activeFiltersCount} აქტიური
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  მარცხენა სვეტი: სუბიექტის, გრაფიკების, იურისტის, ვიზიტორისა და ზარების პარამეტრები • მარჯვენა სვეტი: წლის, პროდუქტის, დამფუძნებლის, დირექტორისა და ფილიალის პარამეტრები
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterPanelExpanded(!isFilterPanelExpanded)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">
                  {isFilterPanelExpanded ? 'unfold_less' : 'unfold_more'}
                </span>
                <span>{isFilterPanelExpanded ? 'აკეცვა' : 'გაშლა'}</span>
              </button>
            </div>
          </div>

          {isFilterPanelExpanded && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ===================== MARTSKHENA SVETI (LEFT COLUMN - 7 COLS) ===================== */}
                <div className="lg:col-span-7 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 pb-6 lg:pb-0 lg:pr-8">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      მარცხენა სვეტი: სუბიექტი, სტატუსები, გრაფიკები &amp; ოპერაციული გუნდი
                    </h3>
                  </div>

                  {/* Row 1: Search by Name, Surname/Receipt, PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ძიება სახელით</label>
                      <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="მაგ: გიორგი, ვახტანგი..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">გვარით / ქვითრით / საქმით</label>
                      <input
                        type="text"
                        value={filterReceiptOrCaseNo}
                        onChange={(e) => setFilterReceiptOrCaseNo(e.target.value)}
                        placeholder="მაგ: ბერიძე, REC-8841..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">პ/ნომრით (ან ს/კ)</label>
                      <input
                        type="text"
                        value={filterPersonalId}
                        onChange={(e) => setFilterPersonalId(e.target.value)}
                        placeholder="11 ან 9 ციფრი..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Address, Email, Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">მისამართით / უბნით</label>
                      <input
                        type="text"
                        value={filterAddress}
                        onChange={(e) => setFilterAddress(e.target.value)}
                        placeholder="ვაკე, საბურთალო..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">მაილით (ელ-ფოსტით)</label>
                      <input
                        type="text"
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        placeholder="example@corp.ge"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">T ნომრით (ტელეფონით)</label>
                      <input
                        type="text"
                        value={filterPhone}
                        onChange={(e) => setFilterPhone(e.target.value)}
                        placeholder="+995 5..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3: Origination Date & 3-Year Statute Switch */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ვალის წარმოშობის თარიღი (დან)</label>
                      <input
                        type="date"
                        value={filterDebtOrigFrom}
                        onChange={(e) => setFilterDebtOrigFrom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ვალის წარმოშობის თარიღი (მდე)</label>
                      <input
                        type="date"
                        value={filterDebtOrigTo}
                        onChange={(e) => setFilterDebtOrigTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200 cursor-pointer hover:bg-rose-100/70 transition-all">
                        <input
                          type="checkbox"
                          checked={filterOverdueMoreThan3Years}
                          onChange={(e) => setFilterOverdueMoreThan3Years(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className="text-[11px] font-bold text-rose-800">
                          გადაცილებაზე 3 წელზე მეტი
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Row 4: Schedule Type & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">გრაფიკის ტიპი</label>
                      <select
                        value={filterScheduleType}
                        onChange={(e) => setFilterScheduleType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="ALL">ყველა გრაფიკი</option>
                        <option value="STANDARD">სტანდარტული (12 თვემდე)</option>
                        <option value="NON_STANDARD">არასტანდარტული (12 თვეზე მეტი)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">გრაფიკის სტატუსი</label>
                      <select
                        value={filterScheduleStatus}
                        onChange={(e) => setFilterScheduleStatus(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ნებისმიერი სტატუსი</option>
                        <option value="ACTIVE">გრაფ. მიმდინარე</option>
                        <option value="OVERDUE">დარღვეული / ვადაგადაცილებული</option>
                        <option value="SETTLED">სრულად დაფარული</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 5: Lawyer & Legal Stages (Court, Enforcement, Sequestration) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">იურისტი</label>
                        <select
                          value={filterLawyerId}
                          onChange={(e) => setFilterLawyerId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary"
                        >
                          <option value="">ყველა იურისტი</option>
                          {metadata.lawyers?.map((l: any) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterInCourt}
                            onChange={(e) => setFilterInCourt(e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>სასამართლო</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterInEnforcement}
                            onChange={(e) => setFilterInEnforcement(e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>აღსრულება</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterHasSequestration}
                            onChange={(e) => setFilterHasSequestration(e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span className="font-semibold text-rose-700">ყადაღა</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Visitor, Credit Manager/Operator, Team Lead */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ვიზიტორი</label>
                      <select
                        value={filterVisitorId}
                        onChange={(e) => setFilterVisitorId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა ვიზიტორი</option>
                        {metadata.visitors?.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">კრედიტ მენეჯერი / ოპერატორი</label>
                      <select
                        value={filterOperatorId}
                        onChange={(e) => setFilterOperatorId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა ოპერატორი</option>
                        {metadata.operators?.map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ჯგუფის უფროსი (Team Lead)</label>
                      <input
                        type="text"
                        value={filterTeamLeadId}
                        onChange={(e) => setFilterTeamLeadId(e.target.value)}
                        placeholder="ნინო მეგრელიძე..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 7: Call Count Range & Daily Hours (08:00 - 18:00) & Period 1-60d */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">გამოსული ზარების საათი (დან–მდე)</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={filterHourFrom}
                          onChange={(e) => setFilterHourFrom(e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-800"
                        />
                        <span className="text-xs text-slate-400">:00 —</span>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={filterHourTo}
                          onChange={(e) => setFilterHourTo(e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-800"
                        />
                        <span className="text-xs text-slate-400">:00</span>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">პერიოდის მიხედვით (ვადაგადაცილება)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: '', label: 'ყველა' },
                          { id: '1-30', label: '1–30 დღე' },
                          { id: '1-60', label: '1–60 დღე' },
                          { id: '60-90', label: '60–90 დღე' },
                          { id: '90+', label: '90+ დღე' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setFilterOverdueDaysRange(p.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                              filterOverdueDaysRange === p.id
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===================== MARJVENA SVETI (RIGHT COLUMN - 5 COLS) ===================== */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      მარჯვენა სვეტი: წელი, კრედიტორი, დამფუძნებელი, დირექტორი &amp; ფილიალი
                    </h3>
                  </div>

                  {/* Year + YoY Comparison Toggle */}
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-950 block">წლის მიხედვით</label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="bg-white border border-indigo-300 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-900 mt-1 focus:outline-none"
                      >
                        <option value="2024">2024 წელი (მიმდინარე)</option>
                        <option value="2023">2023 წელი</option>
                        <option value="2025">2025 წელი (პროგნოზი)</option>
                      </select>
                    </div>

                    <div className="text-right">
                      <label className="text-[11px] font-bold text-indigo-950 block mb-1">YoY შედარება წინა წელთან</label>
                      <button
                        type="button"
                        onClick={() => setFilterCompareYoY(!filterCompareYoY)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          filterCompareYoY
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {filterCompareYoY ? '✓ აქტიურია (YoY Growth)' : 'გათიშულია'}
                      </button>
                    </div>
                  </div>

                  {/* Creditor & Product Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">კრედიტორის მიხედვით</label>
                      <select
                        value={filterCreditorId}
                        onChange={(e) => setFilterCreditorId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა კრედიტორი</option>
                        {metadata.creditors?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">პროდუქტის მიხედვით</label>
                      <select
                        value={filterProductType}
                        onChange={(e) => setFilterProductType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა პროდუქტი</option>
                        <option value="B2B_SUPPLY">B2B დისტრიბუცია &amp; ზედნადებები</option>
                        <option value="LOAN">სესხი / საკრედიტო ხაზი</option>
                        <option value="LEASING">ლიზინგი &amp; ტექნიკა</option>
                        <option value="SERVICE">კომერციული მომსახურება</option>
                      </select>
                    </div>
                  </div>

                  {/* Director & Founder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">დირექტორი (სახელი / პ/ნ)</label>
                      <input
                        type="text"
                        value={filterDirector}
                        onChange={(e) => setFilterDirector(e.target.value)}
                        placeholder="მაგ: ვახტანგ ჩხეიძე..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">დამფუძნებელი (ბენეფიციარი)</label>
                      <input
                        type="text"
                        value={filterFounder}
                        onChange={(e) => setFilterFounder(e.target.value)}
                        placeholder="მაგ: გიორგი კაპანაძე..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Branch & Source Excel File */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">ფილიალის მიხედვით</label>
                      <select
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა ფილიალი</option>
                        <option value="თბილისი - ვაკე">თბილისი - ვაკე</option>
                        <option value="თბილისი - საბურთალო">თბილისი - საბურთალო</option>
                        <option value="ბათუმი - ცენტრი">ბათუმი - ცენტრი</option>
                        <option value="ქუთაისი - ცენტრი">ქუთაისი - ცენტრი</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Excel ფაილის მიხედვით</label>
                      <select
                        value={filterSourceFile}
                        onChange={(e) => setFilterSourceFile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-primary focus:bg-white"
                      >
                        <option value="">ყველა წყარო ფაილი</option>
                        <option value="debtors_october_2024.xlsx">debtors_october_2024.xlsx</option>
                        <option value="registry_q3_import.xlsx">registry_q3_import.xlsx</option>
                        <option value="creditor_batch_01.xlsx">creditor_batch_01.xlsx</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter Action Buttons */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
                    >
                      გასუფთავება
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyFilters}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">filter_alt</span>
                      <span>ფილტრის გამოყენება &amp; ძიება</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 4. SCENARIO NAVIGATION TABS */}
        <section className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'schedules'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>1. გრაფიკების დინამიკა &amp; YoY ზრდა</span>
            </button>

            <button
              onClick={() => setActiveTab('lawyers')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'lawyers'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>2. იურისტების მიღწევები &amp; სასამართლო</span>
            </button>

            <button
              onClick={() => setActiveTab('visitors')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'visitors'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">directions_walk</span>
              <span>3. საველე ვიზიტორები (კვირის ჭრილი)</span>
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>4. ქოლ-ცენტრი (08:00–18:00 &amp; თეონა)</span>
            </button>

            <button
              onClick={() => setActiveTab('statute')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'statute'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">alarm_on</span>
              <span>5. 3-წლიანი ხანდაზმულობის რადარი</span>
            </button>

            <button
              onClick={() => setActiveTab('filtered_table')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'filtered_table'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
              <span>გაფილტრული საქმეები ({filteredQueryResult.totalCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {loading ? 'იტვირთება მონაცემები...' : 'მონაცემები აქტუალურია'}
          </div>
        </section>

        {/* 5. TAB 1: SCHEDULES DYNAMICS & YoY COMPARISON */}
        {activeTab === 'schedules' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">სტანდარტული გრაფიკები (&le;12 თვე)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {schedulesData?.current?.standardCount || 0} საქმე
                  </span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {Number(schedulesData?.current?.standardAmount || 0).toLocaleString()} ₾
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">1 სექტემბერი – 1 ოქტომბერი, 2024</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">არასტანდარტული გრაფიკები (&gt;12 თვე)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 font-mono">
                    {schedulesData?.current?.nonStandardCount || 0} საქმე
                  </span>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {Number(schedulesData?.current?.nonStandardAmount || 0).toLocaleString()} ₾
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">გახანგრძლივებული რესტრუქტურიზაცია</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">წინა წლის იგივე პერიოდი (2023)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-600 font-mono">
                    {schedulesData?.previousYear?.totalCount || 0} საქმე
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {Number(schedulesData?.previousYear?.totalAmount || 0).toLocaleString()} ₾
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-2 block">1 სექტემბერი – 1 ოქტომბერი, 2023</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl p-5 shadow-sm">
                <span className="text-xs font-medium text-emerald-100 block mb-1">YoY წლიური ზრდა (Growth Rate)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold font-mono">
                    +{schedulesData?.growth?.countGrowthPct || 0}%
                  </span>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-md text-white">
                    მოცულობა: +{schedulesData?.growth?.amountGrowthPct || 0}%
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 mt-2 block">სტანდარტული &amp; არასტანდარტულის ჯამი</span>
              </div>
            </div>

            {/* 12-Month Trend Visual Bar & Curve Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    12 თვის ჭრილში ზრდის დინამიკა (2024 წელი, თვეების მიხედვით)
                  </h3>
                  <p className="text-xs text-slate-500">
                    სტანდარტული (&le;12 თვე, ლურჯი) vs არასტანდარტული (&gt;12 თვე, იისფერი) გრაფიკების შედარება
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-blue-700">
                    <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" /> სტანდარტული
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-700">
                    <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> არასტანდარტული
                  </span>
                </div>
              </div>

              {/* Chart Visual Simulation */}
              <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
                {schedulesData?.monthlyTrend?.map((m: any, idx: number) => {
                  const maxH = 180;
                  const stdH = Math.min(maxH, (m.standardCount || 1) * 20);
                  const nonStdH = Math.min(maxH, (m.nonStandardCount || 1) * 22);

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="flex items-end gap-1 h-48 w-full justify-center">
                        <div
                          style={{ height: `${stdH}px` }}
                          className="w-3.5 bg-blue-600 rounded-t-sm group-hover:bg-blue-700 transition-all relative"
                          title={`სტანდარტული: ${m.standardCount} საქმე`}
                        />
                        <div
                          style={{ height: `${nonStdH}px` }}
                          className="w-3.5 bg-purple-500 rounded-t-sm group-hover:bg-purple-600 transition-all relative"
                          title={`არასტანდარტული: ${m.nonStandardCount} საქმე`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{m.monthName}</span>
                      <span className="text-[9px] font-mono text-slate-400">{Number(m.totalVolumeGel).toLocaleString()} ₾</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB 2: LAWYER PERFORMANCE (JAN 1 - JUN 1 / 6 MONTHS) */}
        {activeTab === 'lawyers' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">სულ სარჩელები</span>
                <span className="text-xl font-bold font-mono text-blue-700">{legalData?.summary?.lawsuitsCount || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-1">დაწერილი / შეტანილი</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">ყადაღა დადებული</span>
                <span className="text-xl font-bold font-mono text-amber-700">{legalData?.summary?.sequestrationCount || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-1">უზრუნველყოფის ღონისძიება</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">სასამართლოში</span>
                <span className="text-xl font-bold font-mono text-indigo-700">{legalData?.summary?.inCourtCount || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-1">განხილვის ეტაპი</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">აღსრულებაში</span>
                <span className="text-xl font-bold font-mono text-purple-700">{legalData?.summary?.inEnforcementCount || 0}</span>
                <span className="text-[10px] text-slate-400 block mt-1">სააღსრულებო ფურცელი</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">მოგებული საქმე</span>
                <span className="text-xl font-bold font-mono text-emerald-700">{legalData?.summary?.wonCount || 0}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Win-Rate: {legalData?.summary?.winRatePct || 0}%</span>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-800 block mb-1">ამოღებული თანხა</span>
                <span className="text-lg font-bold font-mono text-emerald-900">
                  {Number(legalData?.summary?.recoveredAmountGel || 0).toLocaleString()} ₾
                </span>
                <span className="text-[10px] text-emerald-700 block mt-1">სასამართლო გადაწყვეტილებით</span>
              </div>
            </div>

            {/* Lawyer Comparative Scorecard */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    იურისტთა შედარებითი შედეგები (1 იანვარი – 1 ივნისი / ბოლო 6 თვე)
                  </h3>
                  <p className="text-xs text-slate-500">ინდივიდუალური KPI, სარჩელები, ყადაღები და ამოღებული მოცულობები</p>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">იურისტი</th>
                    <th className="py-3 px-4 text-center">დაწერილი სარჩელები</th>
                    <th className="py-3 px-4 text-center">ყადაღა</th>
                    <th className="py-3 px-4 text-center">სასამართლოში</th>
                    <th className="py-3 px-4 text-center">აღსრულებაში</th>
                    <th className="py-3 px-4 text-center">მოგებული</th>
                    <th className="py-3 px-4 text-right">ამოღებული თანხა (₾)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {legalData?.lawyers?.map((lawyer: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                        <span>{lawyer.lawyerName}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">{lawyer.lawsuits}</td>
                      <td className="py-3 px-4 text-center font-mono text-amber-700 font-semibold">{lawyer.sequestrations}</td>
                      <td className="py-3 px-4 text-center font-mono">{lawyer.inCourt}</td>
                      <td className="py-3 px-4 text-center font-mono text-purple-700">{lawyer.enforcement}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {lawyer.won} მოგებული
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {Number(lawyer.recoveredGel).toLocaleString()} ₾
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. TAB 3: FIELD VISITOR PERFORMANCE (MAY 12 - MAY 17) */}
        {activeTab === 'visitors' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">სულ ვიზიტები (12–17 მაისი)</span>
                <span className="text-2xl font-bold font-mono text-slate-900">{visitorsData?.summary?.totalVisits || 0}</span>
                <span className="text-[11px] text-slate-400 block mt-1">დაგეგმილი ინსპექტირება</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">ჩაბარებული / შედგა</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">{visitorsData?.summary?.completed || 0}</span>
                <span className="text-[11px] text-emerald-600 block mt-1">შესრულება: {visitorsData?.summary?.completionRatePct || 0}%</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">ვერ მოიძებნა / უარი</span>
                <span className="text-2xl font-bold font-mono text-amber-700">
                  {(visitorsData?.summary?.unreachable || 0) + (visitorsData?.summary?.rescheduled || 0)}
                </span>
                <span className="text-[11px] text-amber-600 block mt-1">ხელახალი ვიზიტი დანიშნულია</span>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-blue-900 block mb-1">GPS გეოლოკაციის ვალიდაცია</span>
                <span className="text-2xl font-bold font-mono text-blue-800">{visitorsData?.summary?.gpsVerifiedPct || 94}%</span>
                <span className="text-[11px] text-blue-700 block mt-1">ობიექტის 50მ რადიუსში ნამყოფი</span>
              </div>
            </div>

            {/* Daily Visit Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                დღიური ვიზიტები კვირის განმავლობაში (12 მაისიდან 17 მაისის ჩათვლით)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {visitorsData?.dailyTimeline?.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-400 block">{d.date}</span>
                    <span className="text-xl font-bold font-mono text-primary mt-1 block">{d.count} ვიზიტი</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Inspection Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                საველე ინსპექტირების დეტალური ჟურნალი
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">ვიზიტორი</th>
                    <th className="py-2.5 px-4">საქმის №</th>
                    <th className="py-2.5 px-4">უბანი / ლოკაცია</th>
                    <th className="py-2.5 px-4">თარიღი</th>
                    <th className="py-2.5 px-4">სტატუსი</th>
                    <th className="py-2.5 px-4">შედეგი / კომენტარი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visitorsData?.tasks?.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{t.officerName}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">{t.caseNumber}</td>
                      <td className="py-2.5 px-4 text-slate-600">{t.district}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">{new Date(t.scheduledTime).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {t.status === 'COMPLETED' ? 'ჩაბარებულია' : t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. TAB 4: CALL CENTER & TEONA (08:00 - 18:00) */}
        {activeTab === 'calls' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">სულ გამოსული ზარები</span>
                <span className="text-2xl font-bold font-mono text-blue-700">{callCenterData?.totalCalls || 0}</span>
                <span className="text-[11px] text-slate-400 block mt-1">08:00-დან 18:00-მდე შუალედი</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">გადახდის დაპირება (PTP)</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">{callCenterData?.totalPromises || 0}</span>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">დადებითი შეთანხმება</span>
              </div>
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-indigo-900 block mb-1">თეონას (ოპერატორის) შედეგები</span>
                <span className="text-xl font-bold text-indigo-950 block">
                  {callCenterData?.leaderboard?.find((l: any) => l.operatorName.includes('თეონა'))?.totalCalls || 0} ზარი
                </span>
                <span className="text-[11px] text-indigo-700 font-bold block mt-1">
                  PTP კონვერსია: {callCenterData?.leaderboard?.find((l: any) => l.operatorName.includes('თეონა'))?.conversionRatePct || 0}%
                </span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block mb-1">სამუშაო ცვლის ინტერვალი</span>
                <span className="text-2xl font-bold font-mono text-slate-800">
                  {callCenterData?.hoursWindow?.from} — {callCenterData?.hoursWindow?.to}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">აქტიური სატელეფონო საათები</span>
              </div>
            </div>

            {/* Hourly Distribution Grid (08:00 - 18:00) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                ზარების საათობრივი განაწილება დილის 08:00-დან საღამოს 18:00-მდე
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                აჩვენებს დატვირთვის პიკურ საათებს და გადახდის დაპირებების (PTP) ეფექტურობას
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-11 gap-2 text-center">
                {callCenterData?.hourlyDistribution?.map((h: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{h.hour}</span>
                    <span className="text-lg font-bold font-mono text-blue-700 my-1">{h.callCount}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 py-0.5 rounded">
                      {h.promiseToPayCount} PTP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator Scorecard */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                ოპერატორთა შედარებითი რეიტინგი (Leaderboard)
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">ოპერატორი</th>
                    <th className="py-2.5 px-4 text-center">სულ ზარი</th>
                    <th className="py-2.5 px-4 text-center">გადახდის დაპირება (PTP)</th>
                    <th className="py-2.5 px-4 text-center">უარი</th>
                    <th className="py-2.5 px-4 text-center">კონვერსია (%)</th>
                    <th className="py-2.5 px-4 text-right">საუბრის დრო (წთ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {callCenterData?.leaderboard?.map((op: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm">support_agent</span>
                        <span>{op.operatorName}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-700">{op.totalCalls}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">{op.ptpCount}</td>
                      <td className="py-2.5 px-4 text-center font-mono text-rose-700">{op.refusedCount}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                          {op.conversionRatePct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">{op.totalDurationMinutes} წთ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. TAB 5: 3-YEAR STATUTE OF LIMITATIONS & 4-MONTH OVERDUE RADAR */}
        {activeTab === 'statute' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Critical Alert Banner */}
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[26px]">alarm_off</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-900">
                    ვალის მოთხოვნის ხანდაზმულობის რადარი (სამოქალაქო კოდექსის 3-წლიანი ვადა)
                  </h3>
                  <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                    საქართველოს სამოქალაქო კოდექსის შესაბამისად, სახელშეკრულებო ვალდებულებებზე მოთხოვნის ხანდაზმულობის საერთო ვადა შეადგენს <strong>3 წელს</strong> (1095 დღე). ვადის გასვლამდე აუცილებელია სასამართლო სარჩელის შეტანა მოთხოვნის უფლების შენარჩუნებისთვის.
                  </p>
                </div>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-rose-700 uppercase">დაკარგული მოთხოვნის უფლება</span>
                <span className="text-2xl font-bold font-mono text-rose-900">
                  {statuteData?.summary?.lostClaimsCount || 0} საქმე ({Number(statuteData?.summary?.lostAmountGel || 0).toLocaleString()} ₾)
                </span>
              </div>
            </div>

            {/* Expired Claims Table (Lost Right of Claim in the Last 4 Months) */}
            <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-rose-100/40 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-700 text-lg">cancel</span>
                  <h4 className="text-sm font-bold text-rose-950">
                    ბოლო 4 თვის განმავლობაში ხანდაზმულობაგასული საქმეები (3 წელი გასულია)
                  </h4>
                </div>
                <span className="text-xs text-rose-700 font-bold">
                  სულ {statuteData?.lostClaims?.length || 0} დაფიქსირებული ხანდაზმულობა
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">საქმის №</th>
                    <th className="py-2.5 px-4">მოვალე &amp; პ/ნ</th>
                    <th className="py-2.5 px-4">კრედიტორი</th>
                    <th className="py-2.5 px-4 text-right">თანხა (₾)</th>
                    <th className="py-2.5 px-4">წარმოშობის თარიღი</th>
                    <th className="py-2.5 px-4 text-center">გადაცილება (დღე)</th>
                    <th className="py-2.5 px-4 text-center">სტატუსი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statuteData?.lostClaims?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-rose-50/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-rose-800">{c.caseNumber}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {c.debtorName} <span className="text-[11px] text-slate-400 font-mono">({c.personalId})</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{c.creditorName}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-900">
                        {Number(c.amount).toLocaleString()} ₾
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {new Date(c.debtOriginationDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-700">
                        {c.daysOverdue} დღე (&gt;3 წელი)
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 text-[10px]">
                          მოთხოვნა გაუქმებულია
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Critical Radar: Approaching 3 Years (Countdown to Act!) */}
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-lg">notification_important</span>
                  <h4 className="text-sm font-bold text-amber-950">
                    კრიტიკული შეხსენების რადარი: 3 წელი სრულდება მომდევნო 4 თვეში
                  </h4>
                </div>
                <span className="text-xs text-amber-800 font-semibold">
                  მოითხოვს დაუყოვნებლივ სასამართლო სარჩელის აღძვრას
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">საქმის №</th>
                    <th className="py-2.5 px-4">მოვალე</th>
                    <th className="py-2.5 px-4">კრედიტორი</th>
                    <th className="py-2.5 px-4 text-right">თანხა (₾)</th>
                    <th className="py-2.5 px-4 text-center">დარჩენილი დრო</th>
                    <th className="py-2.5 px-4 text-center">რისკის დონე</th>
                    <th className="py-2.5 px-4 text-center">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statuteData?.approachingClaims?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-amber-50/40">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.caseNumber}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{c.debtorName}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.creditorName}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {Number(c.amount).toLocaleString()} ₾
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          {c.daysRemaining} დღე დარჩა
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.urgencyLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {c.urgencyLevel === 'CRITICAL' ? 'კრიტიკული (სასწრაფო)' : 'მაღალი ყურადღება'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => alert(`საქმე ${c.caseNumber} გადაეცა იურიდიულ სამსახურს სასწრაფო სარჩელის აღსაძვრელად!`)}
                          className="px-2.5 py-1 rounded-md bg-primary hover:bg-blue-700 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                        >
                          იურისტისთვის გადაცემა
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. TAB 6: FILTERED RESULTS TABLE */}
        {activeTab === 'filtered_table' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    გაფილტრული საქმეების სია ({filteredQueryResult.totalCount} შედეგი)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ჯამური მოცულობა: {Number(filteredQueryResult.totalAmount || 0).toLocaleString()} ₾ • დარჩენილი: {Number(filteredQueryResult.totalRemaining || 0).toLocaleString()} ₾
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">მაჩვენებლები განახლებულია</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] uppercase">
                    <tr>
                      <th className="py-3 px-3.5">საქმის №</th>
                      <th className="py-3 px-3.5">დებიტორი &amp; პ/ნ</th>
                      <th className="py-3 px-3.5">კრედიტორი</th>
                      <th className="py-3 px-3.5 text-right">თანხა (₾)</th>
                      <th className="py-3 px-3.5">გრაფიკი</th>
                      <th className="py-3 px-3.5">პროდუქტი</th>
                      <th className="py-3 px-3.5">ფილიალი</th>
                      <th className="py-3 px-3.5 text-center">გადაცილება</th>
                      <th className="py-3 px-3.5">იურისტი</th>
                      <th className="py-3 px-3.5 text-center">ზარი/ვიზიტი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQueryResult.claims?.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-primary">{c.caseNumber}</td>
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-slate-900 block">{c.debtorName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.debtorPin}</span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-700">{c.creditorName}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          {Number(c.initialAmount).toLocaleString()} ₾
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.scheduleType === 'STANDARD' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}>
                            {c.scheduleType === 'STANDARD' ? 'სტანდარტული' : 'არასტანდარტული'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">{c.productType}</td>
                        <td className="py-3 px-3.5 text-slate-600">{c.branch}</td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          <span className={c.daysOverdue > 1000 ? 'text-rose-600 font-bold' : ''}>
                            {c.daysOverdue} დღე
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">{c.lawyerName || '—'}</td>
                        <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                          {c.callsCount}ზ / {c.visitsCount}ვ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
