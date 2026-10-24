'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, visitsBackendService } from '@/services';

export default function FieldOfficerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);

  // Live Tasks & Metrics
  const [tasks, setTasks] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalScheduled: 0,
    completed: 0,
    pending: 0,
    unreachable: 0,
    totalAmount: 0,
    recoveredAmount: 0,
    completionRate: 0,
  });
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Form submission
  const [reportStatus, setReportStatus] = useState<string>('COMPLETED');
  const [reportNotes, setReportNotes] = useState('');
  const [reportAgreedDate, setReportAgreedDate] = useState('');
  const [reportAgreedAmount, setReportAgreedAmount] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoadingTasks(true);
    try {
      const [tList, m] = await Promise.all([
        visitsBackendService.getTasks(statusFilter, districtFilter),
        visitsBackendService.getMetrics(),
      ]);
      setTasks(tList || []);
      setMetrics(m || {});
      if (tList && tList.length > 0) {
        setSelectedTask((prev: any) => {
          if (!prev) return tList[0];
          const found = tList.find((item: any) => item.id === prev.id);
          return found || tList[0];
        });
      }
    } catch (err) {
      console.warn('Could not load field officer data:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/field-officer');
      return;
    }
    if (u.role !== 'FIELD_OFFICER' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadData();
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [statusFilter, districtFilter]);

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmittingReport(true);
    try {
      const finalNotes = `${reportNotes} ${reportAgreedAmount ? `[შეთანხმებული თანხა: ${reportAgreedAmount} ₾, ვადა: ${reportAgreedDate}]` : ''}`.trim();
      await visitsBackendService.completeTask(selectedTask.id, {
        status: reportStatus,
        notes: finalNotes || 'ვიზიტი წარმატებით შესრულდა ადგილზე.',
        collectedAmount: reportAgreedAmount ? parseFloat(reportAgreedAmount) : undefined,
      });

      setActionSuccessMessage(`ვიზიტის ანგარიში #${selectedTask.caseNumber} წარმატებით გაიგზავნა და დარეგისტრირდა!`);
      setReportNotes('');
      setReportAgreedAmount('');
      setReportAgreedDate('');
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'ანგარიშის გაგზავნა ვერ მოხერხდა');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.debtorName.toLowerCase().includes(q) ||
      t.debtorPersonalId.includes(q) ||
      t.addressSnapshot.toLowerCase().includes(q) ||
      t.caseNumber.toLowerCase().includes(q)
    );
  });

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const officerName = currentUser?.name || currentUser?.email || 'ლევან ხუციშვილი';

  return (
    <div className="min-h-full bg-surface-bg flex flex-col font-body-md text-text-primary antialiased selection:bg-primary-container selection:text-white">
      <div>
        {/* ==================== TOP NAVIGATION ==================== */}
        <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
          <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
            {/* Brand & Module Badge */}
            <div className="flex items-center gap-3">
              <a className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight flex items-center gap-2" href="/">
                <span className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  DI
                </span>
                <span>Debitinfo.GE</span>
              </a>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border-subtle">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary uppercase tracking-wider font-semibold">
                  საველე ოფიცერი
                </span>
                <span className="text-text-muted text-body-sm font-body-sm">Field Officer Console</span>
              </div>
            </div>
            {/* Officer Info & Daily Progress Pill */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-3 bg-surface-bg py-1.5 px-3 rounded-lg border border-border-subtle">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-mint ring-4 ring-accent-mint/20" />
                </div>
                <div className="text-left">
                  <div className="text-label-md font-label-md text-text-primary flex items-center gap-1.5">
                    <span>{officerName}</span>
                    <span className="text-text-muted text-body-sm font-body-sm">
                      • {currentUser?.role === 'ADMIN' ? 'სისტემური ადმინისტრატორი' : 'საველე მონიტორინგი & ინსპექცია'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-body-sm font-body-sm text-text-muted">
                      გეგმა: {metrics.completed}/{metrics.totalScheduled} ვიზიტი ({metrics.completionRate}%)
                    </span>
                    <div className="w-24 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${metrics.completionRate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Actions & Sync */}
            <div className="flex items-center gap-2 lg:gap-3">
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

              {/* GPS Status Pill */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-label-md bg-accent-mint/15 text-slate-800 border border-accent-mint/30" title="GPS სიგნალი აქტიურია">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 animate-pulse" style={{ fontVariationSettings: '"FILL" 1' }}>
                  my_location
                </span>
                <span className="text-body-sm font-body-sm font-medium">GPS აქტიური</span>
              </div>
              {/* Officer Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
                <button
                  onClick={() => {
                    authService.logout();
                    window.location.href = '/ops';
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-error hover:border-error/30 hover:bg-error-container/20 transition-all duration-150 text-body-sm font-body-sm active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="hidden sm:inline font-medium">გამოსვლა</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Global Success Notification */}
        {actionSuccessMessage && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600 text-[22px]">verified</span>
              <span className="font-medium">{actionSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* ==================== MAIN CONTENT WRAPPER ==================== */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
          {/* KPI / DAILY ROUTE SUMMARY METRICS */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {/* Card 1 */}
            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-body-sm font-body-sm font-medium">დაგეგმილი რეესტრი</span>
                <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-headline-lg font-bold text-text-primary">
                  {metrics.totalScheduled}
                </span>
                <span className="text-label-md font-label-md text-text-muted">მისამართი</span>
              </div>
              <div className="mt-2 text-body-sm font-body-sm text-text-muted flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">navigation</span>
                <span>მარშრუტი ოპტიმიზებულია</span>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-accent-mint transition-colors">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-body-sm font-body-sm font-medium">შესრულებული / ჩაბარებული</span>
                <div className="w-8 h-8 rounded-lg bg-accent-mint/15 flex items-center justify-center text-emerald-700">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                    check_circle
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-headline-lg font-bold text-slate-900">
                  {metrics.completed}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-emerald-800 font-bold">
                  {metrics.completionRate}% შესრულდა
                </span>
              </div>
              <div className="mt-2 text-body-sm font-body-sm text-emerald-700 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">done_all</span>
                <span>დარჩენილია {metrics.pending} ობიექტი</span>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-primary-container transition-colors">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-body-sm font-body-sm font-medium">ამოღებული / შეთანხმებული</span>
                <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-headline-lg font-headline-lg font-bold font-data-mono-lg text-primary">
                  {Number(metrics.recoveredAmount || 0).toLocaleString('ka-GE')}
                </span>
                <span className="text-headline-sm font-headline-sm font-semibold text-text-primary">₾</span>
              </div>
              <div className="mt-2 text-body-sm font-body-sm text-text-muted flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
                <span>დღიური ინკასაციის ლიმიტი: OK</span>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 lg:p-5 shadow-sm hover:border-rating-b transition-colors">
              <div className="flex items-center justify-between text-text-muted mb-2">
                <span className="text-body-sm font-body-sm font-medium">პრობლემური / ესკალაცია</span>
                <div className="w-8 h-8 rounded-lg bg-rating-b/15 flex items-center justify-center text-amber-700">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-headline-lg font-bold text-text-primary">
                  {metrics.unreachable}
                </span>
                <span className="text-label-md font-label-md text-text-muted">საქმე</span>
              </div>
              <div className="mt-2 text-body-sm font-body-sm text-amber-700 flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                <span>მიუწვდომელი / იურისტთან</span>
              </div>
            </div>
          </section>

          {/* ==================== MAIN SPLIT VIEW (35% / 65%) ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: ROUTE & VISITS WORKLIST */}
            <section className="lg:col-span-5 space-y-4">
              <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">route</span>
                    <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">ვიზიტების მარშრუტი</h2>
                  </div>
                  <span className="text-label-sm font-label-sm font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    სულ: {filteredTasks.length}
                  </span>
                </div>
                {/* Search Bar */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">search</span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-body-sm font-body-sm rounded-lg border border-border-subtle focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 placeholder:text-text-muted"
                    placeholder="ძებნა მისამართით, კომპანიით, პ/ნ..."
                    type="text"
                  />
                </div>
                {/* District Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-body-sm font-body-sm">
                  {['ALL', 'საბურთალო', 'ვაკე', 'დიდუბე'].map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setDistrictFilter(dist)}
                      className={`px-3 py-1 rounded-full text-label-md font-label-md shrink-0 transition-colors cursor-pointer ${
                        districtFilter === dist
                          ? 'bg-primary-container text-white font-semibold'
                          : 'bg-surface-bg text-text-muted hover:text-text-primary border border-border-subtle'
                      }`}
                    >
                      {dist === 'ALL' ? 'ყველა რაიონი' : dist}
                    </button>
                  ))}
                </div>
                {/* Status Filter */}
                <div className="flex items-center gap-2 text-label-md font-label-md text-text-muted pt-1">
                  <span>სტატუსი:</span>
                  {['ALL', 'PENDING', 'COMPLETED', 'UNREACHABLE'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`cursor-pointer transition-colors ${
                        statusFilter === st ? 'text-primary font-bold underline' : 'hover:text-text-primary'
                      }`}
                    >
                      {st === 'ALL' ? 'ყველა' : st === 'PENDING' ? 'აქტიური' : st === 'COMPLETED' ? 'შესრულებული' : 'მიუწვდომელი'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ROUTE CARDS LIST */}
              <div className="space-y-3">
                {loadingTasks && (
                  <div className="p-8 text-center text-text-muted">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>ვიზიტები იტვირთება...</span>
                  </div>
                )}
                {!loadingTasks && filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-text-muted bg-surface-card rounded-xl border border-border-subtle">
                    <span>მითითებული ფილტრით ვიზიტები არ მოიძებნა</span>
                  </div>
                )}
                {filteredTasks.map((t) => {
                  const isSelected = selectedTask?.id === t.id;
                  const isCompleted = t.status === 'COMPLETED';
                  const isUnreachable = t.status === 'UNREACHABLE';

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={`bg-surface-card rounded-xl p-4 shadow-sm relative transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-2 border-primary-container ring-2 ring-primary-container/10'
                          : 'border border-border-subtle hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -left-1 top-4 bottom-4 w-1.5 bg-primary-container rounded-r-full" />
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold ${
                                isCompleted
                                  ? 'bg-accent-mint/20 text-emerald-800'
                                  : isUnreachable
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-secondary-container/20 text-secondary'
                              }`}
                            >
                              {isCompleted
                                ? 'შესრულებული / ოქმი'
                                : isUnreachable
                                ? 'ვერ მოიძებნა'
                                : 'აქტიური ვიზიტი'}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold ${
                                t.priority === 'HIGH' || t.priority === 'URGENT'
                                  ? 'bg-rating-c/15 text-rating-c'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.priority === 'URGENT'
                                ? 'სასწრაფო'
                                : t.priority === 'HIGH'
                                ? 'მაღალი'
                                : 'ჩვეულებრივი'}
                            </span>
                          </div>
                          <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary mt-1">
                            {t.debtorName}
                          </h3>
                          <p className="text-body-sm font-body-sm text-text-muted">
                            პ/ნ/ს/კ: {t.debtorPersonalId}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-headline-sm font-headline-sm font-bold font-data-mono-lg text-primary">
                            {t.remainingAmount.toLocaleString('ka-GE')} ₾
                          </div>
                          <div className="text-label-sm font-label-sm text-rating-c font-medium">
                            ვადაგადაცილება: {t.daysOverdue} დღე
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-start gap-2 text-body-sm font-body-sm text-slate-700">
                        <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                          location_on
                        </span>
                        <div className="flex-1">
                          <span className="font-medium text-text-primary">{t.addressSnapshot}</span>
                          <span className="text-text-muted block text-label-md font-label-md">
                            რაიონი: {t.district}
                          </span>
                        </div>
                        <span className="text-label-sm font-label-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          #{t.caseNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* RIGHT COLUMN: SELECTED DEBTOR PROFILE & REPORT FORM */}
            <section className="lg:col-span-7 space-y-6">
              {selectedTask ? (
                <>
                  {/* DEBTOR HEADER & QUICK ACTION BAR */}
                  <div className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary font-bold">
                            საქმის #{selectedTask.caseNumber}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/20 text-amber-800 font-bold">
                            რეიტინგი {selectedTask.rating} (სკორი {selectedTask.riskScore})
                          </span>
                          <span className="text-label-sm font-label-sm text-text-muted">
                            ს/კ/პ/ნ: {selectedTask.debtorPersonalId}
                          </span>
                        </div>
                        <h1 className="text-headline-md font-headline-md font-bold text-text-primary mt-1.5">
                          {selectedTask.debtorName}
                        </h1>
                        {selectedTask.directorInfo && (
                          <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                            {selectedTask.directorInfo}
                          </p>
                        )}
                      </div>
                      {/* Debt Balance Widget */}
                      <div className="bg-surface-bg p-3.5 rounded-xl border border-border-subtle text-right sm:min-w-[180px]">
                        <span className="text-label-md font-label-md text-text-muted block">ვალის ჯამური ნაშთი</span>
                        <div className="text-headline-md font-headline-md font-bold font-data-mono-lg text-primary tracking-tight">
                          {selectedTask.remainingAmount.toLocaleString('ka-GE')}{' '}
                          <span className="text-body-lg font-body-lg">₾</span>
                        </div>
                        <span className="text-label-sm font-label-sm text-rating-c font-medium block mt-0.5">
                          {selectedTask.daysOverdue} დღე ვადაგადაცილება
                        </span>
                      </div>
                    </div>
                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <a
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-white text-body-md font-body-md font-medium hover:bg-primary transition-colors shadow-sm active:scale-95"
                        href={`tel:${selectedTask.debtorPhone}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        <span>დარეკვა ({selectedTask.debtorPhone})</span>
                      </a>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          selectedTask.addressSnapshot
                        )}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-secondary-container text-primary text-body-md font-body-md font-medium bg-transparent hover:bg-secondary-container/10 transition-colors active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px] text-secondary">explore</span>
                        <span>Google Maps ნავიგაცია</span>
                      </a>
                      <div className="ml-auto text-xs text-text-muted font-mono">
                        ოფიცერი: {selectedTask.officerName}
                      </div>
                    </div>
                  </div>

                  {/* LOCATION & ADDRESS DETAILS */}
                  <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">pin_drop</span>
                        <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                          მისამართის რეკვიზიტები &amp; GPS
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-mint/20 text-emerald-800 text-label-sm font-label-sm font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span>GPS კოორდინატი: {selectedTask.latitude}, {selectedTask.longitude}</span>
                      </div>
                    </div>
                    <div className="bg-surface-bg p-3 rounded-lg border border-border-subtle">
                      <div className="text-label-md font-label-md text-text-muted mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">apartment</span>
                        ვიზიტის ობიექტის მისამართი (PostgreSQL)
                      </div>
                      <p className="font-semibold text-text-primary text-base">{selectedTask.addressSnapshot}</p>
                      <p className="text-text-muted text-label-md font-label-md mt-0.5">
                        რაიონი: {selectedTask.district} • საქმის სტატუსი: {selectedTask.status}
                      </p>
                      {selectedTask.notes && (
                        <div className="mt-2 pt-2 border-t border-border-subtle text-xs text-slate-700 bg-white p-2 rounded">
                          <strong>დისპეტჩერის ინსტრუქცია:</strong> {selectedTask.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FIELD VISIT REPORT & PROTOCOL FORM */}
                  <div className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px]">assignment</span>
                        </div>
                        <div>
                          <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                            ადგილზე ვიზიტის ანგარიშის შედგენა &amp; ოქმი
                          </h3>
                          <p className="text-body-sm font-body-sm text-text-muted">
                            დააფიქსირეთ მოლაპარაკების შედეგი — მონაცემები შეინახება PostgreSQL ბაზაში
                          </p>
                        </div>
                      </div>
                      <span className="text-label-sm font-label-sm font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-semibold">
                        LIVE_DB_SYNC
                      </span>
                    </div>

                    <form className="space-y-5" onSubmit={handleCompleteTask}>
                      {/* Outcome Radio Options */}
                      <div className="space-y-2">
                        <label className="block text-body-md font-body-md font-semibold text-text-primary">
                          მოლაპარაკების შედეგი <span className="text-rating-c">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-body-sm font-body-sm">
                          {/* Option 1: COMPLETED */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              reportStatus === 'COMPLETED'
                                ? 'border-primary-container bg-primary-container/5'
                                : 'border-border-subtle hover:bg-surface-bg'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visit_status"
                              value="COMPLETED"
                              checked={reportStatus === 'COMPLETED'}
                              onChange={() => setReportStatus('COMPLETED')}
                              className="mt-0.5 text-primary-container focus:ring-primary-container"
                            />
                            <div>
                              <span className="font-semibold text-text-primary block">
                                შედგა მოლაპარაკება - დათანხმდა დაფარვას
                              </span>
                              <span className="text-label-md font-label-md text-text-muted">
                                გაფორმდა ოქმი და შეთანხმდა ვადები
                              </span>
                            </div>
                          </label>

                          {/* Option 2: RESCHEDULED */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              reportStatus === 'RESCHEDULED'
                                ? 'border-amber-400 bg-amber-50'
                                : 'border-border-subtle hover:bg-surface-bg'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visit_status"
                              value="RESCHEDULED"
                              checked={reportStatus === 'RESCHEDULED'}
                              onChange={() => setReportStatus('RESCHEDULED')}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500"
                            />
                            <div>
                              <span className="font-semibold text-text-primary block">
                                ვიზიტი გადაიდო მოვალის თხოვნით
                              </span>
                              <span className="text-label-md font-label-md text-text-muted">
                                მოითხოვა დრო დოკუმენტების წარმოსადგენად
                              </span>
                            </div>
                          </label>

                          {/* Option 3: UNREACHABLE */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              reportStatus === 'UNREACHABLE'
                                ? 'border-red-400 bg-red-50'
                                : 'border-border-subtle hover:bg-surface-bg'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visit_status"
                              value="UNREACHABLE"
                              checked={reportStatus === 'UNREACHABLE'}
                              onChange={() => setReportStatus('UNREACHABLE')}
                              className="mt-0.5 text-red-600 focus:ring-red-500"
                            />
                            <div>
                              <span className="font-semibold text-text-primary block text-rating-c">
                                ვერ მოიძებნა / დაკეტილი კარი
                              </span>
                              <span className="text-label-md font-label-md text-text-muted">
                                დატოვებულია შეტყობინება, საჭიროა ესკალაცია
                              </span>
                            </div>
                          </label>

                          {/* Option 4: PENDING */}
                          <label
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              reportStatus === 'PENDING'
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-border-subtle hover:bg-surface-bg'
                            }`}
                          >
                            <input
                              type="radio"
                              name="visit_status"
                              value="PENDING"
                              checked={reportStatus === 'PENDING'}
                              onChange={() => setReportStatus('PENDING')}
                              className="mt-0.5 text-primary"
                            />
                            <div>
                              <span className="font-semibold text-text-primary block">
                                პროცესშია / მოლოდინი
                              </span>
                              <span className="text-label-md font-label-md text-text-muted">
                                დამატებითი გადამოწმება მიმდინარეობს
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Agreement Inputs: Date & Amount */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-bg p-4 rounded-xl border border-border-subtle">
                        <div>
                          <label className="block text-label-md font-label-md font-semibold text-text-primary mb-1">
                            შეთანხმებული გადახდის ვადა
                          </label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">
                              event
                            </span>
                            <input
                              value={reportAgreedDate}
                              onChange={(e) => setReportAgreedDate(e.target.value)}
                              placeholder="მაგ: 15.11.2025"
                              className="w-full pl-9 pr-3 py-2 text-body-sm font-body-sm font-data-mono-md rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary"
                              type="text"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-label-md font-label-md font-semibold text-text-primary mb-1">
                            შესატანი თანხა (₾)
                          </label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">
                              payments
                            </span>
                            <input
                              value={reportAgreedAmount}
                              onChange={(e) => setReportAgreedAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-9 pr-8 py-2 text-body-sm font-body-sm font-data-mono-md rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary"
                              type="number"
                            />
                            <span className="absolute right-3 top-2.5 text-text-muted font-bold text-body-sm">₾</span>
                          </div>
                        </div>
                      </div>

                      {/* Description / Officer Comments */}
                      <div>
                        <label className="block text-body-md font-body-md font-semibold text-text-primary mb-1">
                          დეტალური აღწერა / ვიზიტის კომენტარი <span className="text-rating-c">*</span>
                        </label>
                        <textarea
                          value={reportNotes}
                          onChange={(e) => setReportNotes(e.target.value)}
                          placeholder="შეხვედრა შედგა მოვალესთან, განიხილეს დავალიანების გრაფიკი..."
                          className="w-full p-3 text-body-sm font-body-sm rounded-lg border border-border-subtle bg-white focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 text-text-primary placeholder:text-text-muted resize-y"
                          rows={3}
                        />
                      </div>

                      {/* Form Action Footer Buttons */}
                      <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              setReportNotes('მოვალე უარს აცხადებს თანამშრომლობაზე. საქმე გადაეცეს იურიდიულ დეპარტამენტს.');
                              setReportStatus('UNREACHABLE');
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-rating-c/40 text-rating-c hover:bg-rating-c/10 text-body-sm font-body-sm transition-colors active:scale-95 cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">gavel</span>
                            <span>ესკალაცია იურისტზე</span>
                          </button>
                        </div>
                        <button
                          disabled={submittingReport}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container disabled:opacity-50 text-white text-body-md font-body-md font-semibold hover:bg-primary transition-colors shadow-md active:scale-95 cursor-pointer"
                          type="submit"
                        >
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                            check_circle
                          </span>
                          <span>{submittingReport ? 'იგზავნება...' : 'ვიზიტის დასრულება & ანგარიშის გაგზავნა'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="bg-surface-card rounded-xl border border-border-subtle p-12 text-center text-text-muted">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">touch_app</span>
                  <p className="text-base font-medium">აირჩიეთ ვიზიტი მარცხენა სიიდან დეტალების სანახავად</p>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer className="bg-surface-card border-t border-border-subtle mt-12">
          <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-text-muted">
            <div className="flex items-center gap-3">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
              <span className="text-border-subtle">|</span>
              <span>საველე ოპერაციების მართვის სისტემა (Live PostgreSQL)</span>
            </div>
            <div className="text-label-sm font-label-sm text-slate-400">
              © 2026 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
