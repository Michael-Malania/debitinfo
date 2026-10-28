'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, legalService } from '@/services';
import { DetailedLegalCase, LegalStats } from '@/types';

export default function LegalPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);

  // Dynamic Case & Stats State from Database
  const [cases, setCases] = useState<DetailedLegalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<DetailedLegalCase | null>(null);
  const [stats, setStats] = useState<LegalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'court' | 'lawsuit' | 'completed'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ყველა სტატუსი');
  const [sortOption, setSortOption] = useState<string>('პრიორიტეტი (მაღალი-დაბალი)');
  const [searchQuery, setSearchQuery] = useState('');

  // Control Center Inputs
  const [currentStage, setCurrentStage] = useState<string>('LAWSUIT_PREPARATION');
  const [opinionText, setOpinionText] = useState<string>('');
  const [warningSent, setWarningSent] = useState(false);
  const [lawsuitDrafted, setLawsuitDrafted] = useState(false);
  const [dutyPaid, setDutyPaid] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // New Note Modal
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // New Case / Export Feedback
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/legal');
      return;
    }
    if (u.role !== 'LEGAL' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
  }, [router]);

  // 2. Fetch Cases and Stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedStats, fetchedCases] = await Promise.all([
        legalService.getStats(),
        legalService.getCases({
          tab: activeTab,
          stage: statusFilter,
          search: searchQuery,
          priority: sortOption.includes('პრიორიტეტი') ? undefined : undefined,
        }),
      ]);

      setStats(fetchedStats);
      setCases(fetchedCases);

      // Preserve currently selected case if present in results, otherwise pick first
      if (fetchedCases.length > 0) {
        setSelectedCase((prev) => {
          if (!prev) return fetchedCases[0];
          const found = fetchedCases.find((c) => c.id === prev.id);
          return found || fetchedCases[0];
        });
      } else {
        setSelectedCase(null);
      }
    } catch (err) {
      console.error('[loadData] Failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, searchQuery, sortOption]);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized, loadData]);

  // 3. Sync Control Center fields when selectedCase changes
  useEffect(() => {
    if (selectedCase) {
      setCurrentStage(selectedCase.stage);
      setOpinionText(selectedCase.legalOpinion || '');
      setWarningSent(selectedCase.checklistWarningSent);
      setLawsuitDrafted(selectedCase.checklistLawsuitDrafted);
      setDutyPaid(selectedCase.checklistDutyPaid);
    }
  }, [selectedCase]);

  // 4. Update Case in Backend
  const handleSaveControlCenter = async () => {
    if (!selectedCase) return;
    try {
      setSavingAction(true);
      const updated = await legalService.updateCase(selectedCase.id, {
        stage: currentStage,
        legalOpinion: opinionText,
        checklistWarningSent: warningSent,
        checklistLawsuitDrafted: lawsuitDrafted,
        checklistDutyPaid: dutyPaid,
      });

      if (updated) {
        setSelectedCase(updated);
        setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setFeedbackToast('საქმის სტატუსი და საკონტროლო ეტაპები წარმატებით შეინახა ბაზაში!');
        setTimeout(() => setFeedbackToast(null), 4000);
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // 5. Add Timeline Procedural Note
  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNoteText.trim()) return;

    try {
      setSavingNote(true);
      await legalService.addTimelineEvent(selectedCase.id, {
        actionType: 'NOTE_ADDED',
        description: newNoteText.trim(),
        department: 'LEGAL',
      });

      // Reload selected case to reflect new timeline log
      const refreshed = await legalService.getCaseById(selectedCase.id);
      if (refreshed) {
        setSelectedCase(refreshed);
        setCases((prev) => prev.map((c) => (c.id === refreshed.id ? refreshed : c)));
      }
      setNewNoteText('');
      setShowAddNoteModal(false);
      setFeedbackToast('ახალი საპროცესო ჩანაწერი დაფიქსირდა ისტორიაში!');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Timeline note failed:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // 6. Quick Export Action
  const handleExport = () => {
    if (cases.length === 0) return;
    const header = 'საქმის N,მოვალე,საიდენტ. კოდი,სამართლებრივი ეტაპი,სრული მოთხოვნა,ვადა\n';
    const rows = cases
      .map(
        (c) =>
          `"${c.caseNumber}","${c.debtor.name}","${c.debtor.identification}","${c.stage}","${c.amounts.totalClaim}","${c.deadlineDate || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `legal_cases_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice('რეესტრის ექსპორტი წარმატებით დასრულდა!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  // Stage label mapper
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'LAWSUIT_PREPARATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            სარჩელის მომზადება
          </span>
        );
      case 'OFFICIAL_WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            ოფიციალური გაფრთხილება
          </span>
        );
      case 'COURT_PROCEEDINGS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            სასამართლო წარმოება
          </span>
        );
      case 'SETTLEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            მორიგების ეტაპი
          </span>
        );
      case 'ENFORCEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            სააღსრულებო ფურცელი
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {stage}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col font-body-md text-text-primary antialiased bg-surface-bg">
      <div>
        {/* Top Navigation Bar */}
        <header className="bg-surface-card border-b border-border-subtle sticky top-0 z-50 shadow-sm">
          <div className="w-full px-4 lg:px-8 max-w-[1720px] mx-auto flex items-center justify-between h-16">
            {/* Brand & Status */}
            <div className="flex items-center gap-6">
              <Link className="flex items-center gap-2 group" href="/">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[22px]">balance</span>
                </div>
                <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">
                  Debitinfo.GE
                </span>
              </Link>
              {/* Telemetry Badge */}
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-body-sm font-body-sm text-emerald-800 font-medium">
                  სისტემა ონლაინში | PostgreSQL &amp; RS.GE აქტიური
                </span>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-[18px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-bg border border-border-subtle rounded-lg pl-10 pr-4 py-2 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                  placeholder="მოძებნე საქმე, მოვალე, პ/ნ ან ს/კ..."
                  type="text"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-text-muted hover:text-text-primary text-xs"
                  >
                    გასუფთავება
                  </button>
                )}
              </div>
            </div>

            {/* Header Actions & Profile */}
            <div className="flex items-center gap-3">
              {currentUser?.role === 'ADMIN' && (
                <Link
                  href="/ops"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
                  title="საოპერაციო ცენტრში გადასვლა"
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
                </Link>
              )}

              {/* Lawyer Badge */}
              <div className="flex items-center gap-3 pl-1 border-l border-border-subtle">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-body-md border border-rose-200">
                  {currentUser?.name
                    ? currentUser.name.substring(0, 2)
                    : currentUser?.email
                    ? currentUser.email.substring(0, 2).toUpperCase()
                    : 'იურ'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-body-md font-body-md font-semibold text-text-primary leading-tight">
                    {currentUser?.name || currentUser?.email || 'იურისტი'}
                  </span>
                  <span className="text-body-sm font-body-sm text-rose-700 font-medium leading-tight">
                    {currentUser?.role === 'ADMIN'
                      ? 'სისტემური ადმინისტრატორი'
                      : 'იურისტი (სამართლებრივი წარმოება)'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  authService.logout();
                  window.location.href = '/ops';
                }}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="სისტემიდან გამოსვლა"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Secondary Workflow Filter Tabs */}
        <nav className="bg-surface-card border-b border-border-subtle px-4 lg:px-8">
          <div className="max-w-[1720px] mx-auto flex items-center justify-between overflow-x-auto custom-scrollbar">
            <div className="flex items-center space-x-8 py-3">
              <button
                onClick={() => setActiveTab('all')}
                className={`font-label-md text-label-md pb-3.5 -mb-3 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'all'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">folder_shared</span>
                <span>მიმდინარე საქმეები ({stats?.countsByStage?.all || cases.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('court')}
                className={`font-label-md text-label-md pb-3.5 -mb-3 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'court'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span>სასამართლო წარმოებაში ({stats?.countsByStage?.court || 1})</span>
              </button>

              <button
                onClick={() => setActiveTab('lawsuit')}
                className={`font-label-md text-label-md pb-3.5 -mb-3 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'lawsuit'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">history_edu</span>
                <span>სარჩელის მომზადება ({stats?.countsByStage?.lawsuit || 1})</span>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`font-label-md text-label-md pb-3.5 -mb-3 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'completed'
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                <span>დასრულებული ({stats?.countsByStage?.closed || 0})</span>
              </button>
            </div>

            {/* Quick Export Action */}
            <div className="flex items-center gap-2 py-2 shrink-0">
              {exportNotice && (
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {exportNotice}
                </span>
              )}
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-bg text-text-primary text-body-sm font-body-sm font-medium transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-text-muted">file_download</span>
                <span>ექსპორტი (CSV/Excel)</span>
              </button>
              <button
                onClick={() => setShowAddNoteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-body-sm font-body-sm font-medium shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>საპროცესო ქმედების ჩაწერა</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Global Feedback Banner */}
        {feedbackToast && (
          <div className="max-w-[1720px] mx-auto px-4 lg:px-8 mt-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 shadow-xs">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span className="text-sm font-medium">{feedbackToast}</span>
            </div>
          </div>
        )}

        {/* Main Dual-Column Content Canvas */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Legal Cases Registry (approx 58-60% width -> 7 cols on xl) */}
            <section className="xl:col-span-7 flex flex-col gap-5">
              {/* Legal KPIs Mini Bar (Real PostgreSQL Aggregates) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-muted mb-1">
                    <span className="text-body-sm font-body-sm font-medium">აქტიური საქმეები</span>
                    <span className="material-symbols-outlined text-primary text-[18px]">folder_open</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-headline-md font-headline-md font-bold text-text-primary">
                      {stats?.activeCases ?? cases.length}
                    </span>
                    <span className="text-label-sm font-label-sm text-text-muted">ბაზიდან</span>
                  </div>
                </div>

                <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-muted mb-1">
                    <span className="text-body-sm font-body-sm font-medium">ჯამური სადავო თანხა</span>
                    <span className="material-symbols-outlined text-secondary-container text-[18px]">
                      account_balance_wallet
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-data-mono-lg font-data-mono-lg text-text-primary">
                      ₾{stats?.totalDisputedAmount?.toLocaleString() ?? '284,500'}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-text-muted mb-1">
                    <span className="text-body-sm font-body-sm font-medium">წარმატებული მორიგება</span>
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">handshake</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-headline-md font-headline-md font-bold text-emerald-600">
                      {stats?.successfulSettlementRate ?? 78}%
                    </span>
                    <span className="text-label-sm font-label-sm text-emerald-700">მიზანი 75%</span>
                  </div>
                </div>

                <div className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-sm flex flex-col justify-between border-l-4 border-l-rating-c">
                  <div className="flex items-center justify-between text-text-muted mb-1">
                    <span className="text-body-sm font-body-sm font-medium text-rating-c font-semibold">
                      გადაუდებელი ვადები
                    </span>
                    <span className="material-symbols-outlined text-rating-c text-[18px]">timer</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-headline-md font-headline-md font-bold text-rating-c">
                      {stats?.urgentDeadlinesCount ?? 3}
                    </span>
                    <span className="text-label-sm font-label-sm text-text-muted">&lt; 48 საათი</span>
                  </div>
                </div>
              </div>

              {/* Registry Table Container */}
              <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
                {/* Header & Filter Toolbar */}
                <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card">
                  <div>
                    <h2 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                      იურიდიული საქმეების რეესტრი
                    </h2>
                    <p className="text-body-sm font-body-sm text-text-muted">
                      მონიტორინგი და საპროცესო ქმედებების აღრიცხვა (PostgreSQL Real Data)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Stage Filter */}
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none bg-surface-bg border border-border-subtle rounded-lg pl-3 pr-8 py-1.5 text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container"
                      >
                        <option>ყველა სტატუსი</option>
                        <option>ოფიციალური გაფრთხილება</option>
                        <option>სარჩელის მომზადება</option>
                        <option>სასამართლო წარმოება</option>
                        <option>მორიგების ეტაპი</option>
                        <option>სააღსრულებო ფურცელი</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-2 text-text-muted pointer-events-none text-[16px]">
                        expand_more
                      </span>
                    </div>

                    {/* Sort Filter */}
                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="appearance-none bg-surface-bg border border-border-subtle rounded-lg pl-3 pr-8 py-1.5 text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container"
                      >
                        <option>პრიორიტეტი (მაღალი-დაბალი)</option>
                        <option>თანხა (კლებადობით)</option>
                        <option>ვადის ამოწურვა</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-2 text-text-muted pointer-events-none text-[16px]">
                        sort
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-border-subtle text-text-muted text-[11px] font-label-md tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">საქმის N / მოვალე</th>
                        <th className="py-2.5 px-3 font-semibold">სამართლებრივი ეტაპი</th>
                        <th className="py-2.5 px-3 font-semibold text-right">სადავო თანხა</th>
                        <th className="py-2.5 px-3 font-semibold">გადმოცემა / ვადა</th>
                        <th className="py-2.5 px-3 font-semibold text-center">ქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle text-body-sm font-body-sm">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-text-muted">
                            <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                            <p>იტვირთება მონაცემები ბაზიდან...</p>
                          </td>
                        </tr>
                      ) : cases.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-text-muted">
                            საქმეები ვერ მოიძებნა მითითებული ფილტრით.
                          </td>
                        </tr>
                      ) : (
                        cases.map((c) => {
                          const isSelected = selectedCase?.id === c.id;
                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedCase(c)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50/70 border-l-4 border-l-primary'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-start gap-2.5">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                                      c.priority === 'HIGH'
                                        ? 'bg-rating-c'
                                        : c.priority === 'MEDIUM'
                                        ? 'bg-rating-b'
                                        : 'bg-emerald-500'
                                    }`}
                                    title={`პრიორიტეტი: ${c.priority}`}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-data-mono-md text-data-mono-md text-primary font-bold">
                                        #{c.caseNumber}
                                      </span>
                                      {c.priority === 'HIGH' && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-medium">
                                          მაღალი
                                        </span>
                                      )}
                                      {c.courtCaseNumber && (
                                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono">
                                          {c.courtCaseNumber}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-medium text-text-primary mt-0.5">
                                      {c.debtor.name}
                                    </p>
                                    <p className="text-body-sm font-body-sm text-text-muted text-[11px]">
                                      {c.debtor.isCompany ? 'ს/კ' : 'პ/ნ'} {c.debtor.identification}
                                      {c.debtor.directorName && ` • დირ: ${c.debtor.directorName}`}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">{getStageBadge(c.stage)}</td>
                              <td className="py-3 px-3 text-right">
                                <span className="font-data-mono-md text-data-mono-md font-bold text-text-primary">
                                  ₾{c.amounts.totalClaim.toLocaleString()}
                                </span>
                                <span className="block text-[11px] text-text-muted">
                                  ძირი: ₾{c.amounts.principalAmount.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-text-primary block font-medium">
                                  {new Date(c.createdAt).toLocaleDateString('ka-GE', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                {c.nextHearingDate ? (
                                  <span className="text-blue-700 text-[11px] font-medium flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">event</span>
                                    სხდომა:{' '}
                                    {new Date(c.nextHearingDate).toLocaleDateString('ka-GE', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                ) : c.deadlineDate ? (
                                  <span className="text-rating-c text-[11px] font-medium flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                    ვადა დარჩა
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-[11px]">აქტიური</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCase(c);
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary text-white'
                                      : 'text-text-muted hover:text-primary hover:bg-slate-100'
                                  }`}
                                  title="დეტალების გახსნა"
                                >
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-3 border-t border-border-subtle bg-surface-card flex items-center justify-between text-body-sm font-body-sm text-text-muted">
                  <span className="text-[12px]">ნაჩვენებია {cases.length} საქმე ბაზიდან</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-text-muted px-2">გვერდი 1 / 1</span>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Selected Case Detail & Actions Workspace */}
            <section className="xl:col-span-5 flex flex-col gap-5">
              {selectedCase ? (
                <>
                  {/* CARD A: Debtor Dossier & Documents */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm relative overflow-hidden">
                    {/* Header Ribbon */}
                    <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono font-bold">
                          #{selectedCase.caseNumber}
                        </span>
                        <span className="text-body-sm font-body-sm text-text-muted font-medium">
                          საქმის სრული ანკეტა &amp; დოსიე
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          selectedCase.amounts.riskRating === 'C'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Grade {selectedCase.amounts.riskRating} (
                        {selectedCase.amounts.riskRating === 'C' ? 'High Risk' : 'Medium Risk'})
                      </span>
                    </div>

                    {/* Debtor Identity Details */}
                    <div className="pt-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                            {selectedCase.debtor.name}
                          </h3>
                          <p className="text-body-sm font-body-sm text-text-muted">
                            {selectedCase.debtor.isCompany
                              ? 'საიდენტიფიკაციო კოდი (ს/კ):'
                              : 'პირადი ნომერი (პ/ნ):'}{' '}
                            <span className="font-mono text-text-primary font-medium">
                              {selectedCase.debtor.identification}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-label-sm font-label-sm text-text-muted block">
                            სრული მოთხოვნა
                          </span>
                          <span className="text-headline-md font-headline-md font-bold text-rating-c font-data-mono-lg">
                            ₾{selectedCase.amounts.totalClaim.toLocaleString()}.00
                          </span>
                        </div>
                      </div>

                      {/* Quick Meta Attributes Grid */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-surface-bg rounded-lg border border-border-subtle text-[12px]">
                        <div>
                          <span className="text-text-muted block">ხელმძღვანელი პირი:</span>
                          <span className="font-medium text-text-primary">
                            {selectedCase.debtor.directorName || 'ფიზიკური პირი'}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block">იურიდიული მისამართი:</span>
                          <span className="font-medium text-text-primary">
                            {selectedCase.debtor.legalAddress || 'არ არის მითითებული'}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block">დავალიანების ხანდაზმულობა:</span>
                          <span className="font-medium text-amber-700">
                            {selectedCase.amounts.daysOverdue} დღე (ვადაგადაცილებული)
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block">წარმომადგენლობა:</span>
                          <span className="font-medium text-text-primary">სრულუფლებიანი</span>
                        </div>
                      </div>

                      {/* Dossier Attachment Links / Pills */}
                      <div className="pt-2">
                        <span className="text-label-sm font-label-sm text-text-muted block mb-2 font-medium">
                          დამოწმებული დოკუმენტაცია &amp; რეესტრები:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedCase.documents && selectedCase.documents.length > 0 ? (
                            selectedCase.documents.map((doc) => (
                              <a
                                key={doc.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-bg border border-border-subtle hover:border-primary text-text-primary hover:text-primary text-[11px] font-medium transition-colors"
                                href={doc.fileUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <span className="material-symbols-outlined text-[15px] text-emerald-600">
                                  {doc.isVerified ? 'verified' : 'description'}
                                </span>
                                <span>{doc.title}</span>
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-text-muted">დოკუმენტები არ არის მიბმული</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD B: Chronological Audit Trail & Interactions Log */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                      <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">history</span>
                        ქრონოლოგიური ისტორია &amp; ინტერაქციების ლოგი
                      </h3>
                      <button
                        onClick={() => setShowAddNoteModal(true)}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        ჩანაწერის დამატება
                      </button>
                    </div>

                    {/* Timeline Component */}
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {selectedCase.timelineEvents && selectedCase.timelineEvents.length > 0 ? (
                        selectedCase.timelineEvents.map((t) => {
                          const isLegal = t.department === 'LEGAL';
                          const isField = t.department === 'FIELD_VISIT';
                          const isCall = t.department === 'CALL_CENTER';

                          const iconName = isLegal
                            ? 'gavel'
                            : isField
                            ? 'pin_drop'
                            : isCall
                            ? 'call'
                            : 'assignment_ind';
                          const circleColor = isLegal
                            ? 'bg-purple-600'
                            : isField
                            ? 'bg-amber-500'
                            : isCall
                            ? 'bg-secondary'
                            : 'bg-slate-400';
                          const boxColor = isLegal
                            ? 'bg-purple-50/70 border-purple-100 text-purple-950'
                            : isField
                            ? 'bg-amber-50/60 border-amber-100 text-amber-950'
                            : 'bg-slate-50 border-border-subtle text-text-primary';

                          return (
                            <div key={t.id} className="relative">
                              <span
                                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full ${circleColor} text-white flex items-center justify-center ring-4 ring-white`}
                              >
                                <span className="material-symbols-outlined text-[12px]">{iconName}</span>
                              </span>
                              <div className="flex items-center justify-between text-[11px] mb-0.5">
                                <span className="font-semibold text-text-primary">{t.authorRoleTitle}</span>
                                <span className="text-text-muted font-mono">
                                  {new Date(t.createdAt).toLocaleDateString('ka-GE', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className={`text-body-sm font-body-sm p-2.5 rounded-lg border ${boxColor}`}>
                                {t.description}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-text-muted py-2">
                          ინტერაქციების ისტორია ჯერჯერობით ცარიელია.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CARD C: Legal Action Control Center */}
                  <div className="bg-surface-card border-2 border-primary/20 rounded-xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <h3 className="text-headline-sm font-headline-sm text-text-primary font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                        იურიდიული ქმედებების მართვის პანელი
                      </h3>
                      <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                        ოპერაციული ზონა
                      </span>
                    </div>

                    {/* Segmented Status Switcher */}
                    <div>
                      <label className="text-label-sm font-label-sm text-text-muted block mb-1.5 font-medium">
                        სამართლებრივი სტატუსის გადაყვანა:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-surface-bg border border-border-subtle rounded-lg text-center text-[11px] font-medium">
                        <button
                          type="button"
                          onClick={() => setCurrentStage('OFFICIAL_WARNING')}
                          className={`py-1.5 px-2 rounded transition-all cursor-pointer ${
                            currentStage === 'OFFICIAL_WARNING'
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'text-text-muted hover:text-text-primary hover:bg-white'
                          }`}
                        >
                          გაფრთხილება
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStage('LAWSUIT_PREPARATION')}
                          className={`py-1.5 px-2 rounded transition-all cursor-pointer ${
                            currentStage === 'LAWSUIT_PREPARATION'
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'text-text-muted hover:text-text-primary hover:bg-white'
                          }`}
                        >
                          სარჩელის მომზადება
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStage('COURT_PROCEEDINGS')}
                          className={`py-1.5 px-2 rounded transition-all cursor-pointer ${
                            currentStage === 'COURT_PROCEEDINGS'
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'text-text-muted hover:text-text-primary hover:bg-white'
                          }`}
                        >
                          სასამართლო
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStage('ENFORCEMENT')}
                          className={`py-1.5 px-2 rounded transition-all cursor-pointer ${
                            currentStage === 'ENFORCEMENT'
                              ? 'bg-primary text-white font-semibold shadow-sm'
                              : 'text-text-muted hover:text-text-primary hover:bg-white'
                          }`}
                        >
                          სააღსრულებო
                        </button>
                      </div>
                    </div>

                    {/* Action Checklist / Milestones */}
                    <div className="p-3 bg-surface-bg rounded-lg border border-border-subtle">
                      <span className="text-label-sm font-label-sm text-text-muted block mb-2 font-medium">
                        სავალდებულო საკონტროლო ეტაპები:
                      </span>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={warningSent}
                            onChange={(e) => setWarningSent(e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                          />
                          <span className={warningSent ? 'line-through text-text-muted' : 'font-medium'}>
                            გაფრთხილების წერილი გაგზავნილია (RS.GE ფოსტით)
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lawsuitDrafted}
                            onChange={(e) => setLawsuitDrafted(e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                          />
                          <span className="font-medium text-text-primary">
                            სარჩელის პროექტი შედგენილია
                          </span>
                        </label>
                        <label className="flex items-center gap-2.5 text-body-sm font-body-sm text-text-primary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dutyPaid}
                            onChange={(e) => setDutyPaid(e.target.checked)}
                            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                          />
                          <span className="font-medium text-rating-c">
                            სახელმწიფო ბაჟი (3% — ₾{selectedCase.courtDutyFee || '744'}) გადახდილია{' '}
                            {dutyPaid ? '[✓]' : '[ ]'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Legal Opinion / Notes Text Area */}
                    <div>
                      <label className="text-label-sm font-label-sm text-text-muted block mb-1 font-medium">
                        იურიდიული დასკვნა / სამართლებრივი შენიშვნა:
                      </label>
                      <textarea
                        value={opinionText}
                        onChange={(e) => setOpinionText(e.target.value)}
                        className="w-full bg-surface-card border border-border-subtle rounded-lg p-2.5 text-body-sm font-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                        placeholder="ჩაწერეთ იურიდიული კომენტარი ან დასკვნა საქმის მიმდინარეობის შესახებ..."
                        rows={3}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveControlCenter}
                        disabled={savingAction}
                        className="flex-1 py-2.5 px-4 bg-primary hover:bg-[#0A37CA] text-white font-medium text-body-sm font-body-sm rounded-lg shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>
                          {savingAction
                            ? 'ინახება ბაზაში...'
                            : 'სტატუსის განახლება და დაფიქსირება'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExport}
                        className="py-2.5 px-3 bg-surface-card border border-secondary-container text-primary hover:bg-sky-50 font-medium text-body-sm font-body-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        <span>უწყების გენერირება (PDF)</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface-card border border-border-subtle rounded-xl p-12 text-center text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
                    description
                  </span>
                  <p>აირჩიეთ საქმე რეესტრიდან დეტალური დოსიეს სანახავად.</p>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Modal: Add Procedural Note */}
        {showAddNoteModal && selectedCase && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-subtle">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                  საპროცესო ქმედების ჩაწერა (#{selectedCase.caseNumber})
                </h3>
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddTimelineNote} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">
                    ჩანაწერის შინაარსი / საპროცესო კომენტარი *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="მაგ: მომზადდა სარჩელი, გადამოწმდა მოპასუხის ქონებრივი მდგომარეობა..."
                    className="w-full bg-surface-bg border border-border-subtle rounded-lg p-3 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNoteModal(false)}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-muted hover:bg-slate-50 cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-[#0A37CA] disabled:opacity-50 cursor-pointer"
                  >
                    {savingNote ? 'იწერება...' : 'ისტორიაში დაფიქსირება'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Footer */}
        <footer className="bg-surface-card border-t border-border-subtle mt-10">
          <div className="w-full max-w-[1720px] mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-headline-sm font-headline-sm font-bold text-primary">Debitinfo.GE</span>
              <span className="text-text-muted text-body-sm font-body-sm hidden md:inline">|</span>
              <p className="text-text-muted text-body-sm font-body-sm">
                © 2026 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE და სასამართლო რეესტრებთან.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-text-muted text-body-sm font-body-sm">
              <a className="hover:text-primary transition-colors" href="#">კონფიდენციალურობის პოლიტიკა</a>
              <a className="hover:text-primary transition-colors" href="#">მომსახურების პირობები</a>
              <a className="hover:text-primary transition-colors" href="#">რეკვიზიტები</a>
              <a className="hover:text-primary transition-colors" href="#">საგადასახადო შემოწმება</a>
              <a className="hover:text-primary transition-colors" href="#">საკონტაქტო პირი</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
