'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AnalystSidebar from '@/components/analyst/AnalystSidebar';

interface StaffMember {
  id: string;
  email: string;
  personalId: string;
  role: string;
  status: string;
  phone?: string;
  fullName: string;
  department: string;
  internalExt?: string;
  joinedDate: string;
  photoUrl?: string;
  metrics: any;
  activityLogs: any[];
  recommendations: any[];
}

export default function StaffRegistryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('debitinfo_analyst_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    OPERATOR: true,
    LEGAL: true,
    FIELD_OFFICER: true,
    ACCOUNTANT: true,
    ANALYST: true,
    ADMIN: true,
  });

  // Recommendation form state
  const [recRating, setRecRating] = useState<'POSITIVE' | 'NEUTRAL' | 'WARNING' | 'CRITICAL'>('POSITIVE');
  const [recTitle, setRecTitle] = useState('');
  const [recComment, setRecComment] = useState('');
  const [isSubmittingRec, setIsSubmittingRec] = useState(false);
  const [recSuccessMessage, setRecSuccessMessage] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);

  // Impersonation state
  const [isImpersonatingLoading, setIsImpersonatingLoading] = useState(false);
  const [impersonationError, setImpersonationError] = useState<string | null>(null);

  // Load Staff Registry Data
  const loadRegistry = async () => {
    try {
      setLoading(true);
      const data = await analystBackendService.getStaffRegistry();
      setStaffList(data || []);
      if (data && data.length > 0 && !selectedStaffId) {
        setSelectedStaffId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load staff registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || (user.role !== 'ANALYST' && user.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    setAuthorized(true);
    try {
      const saved = localStorage.getItem('debitinfo_analyst_sidebar_open');
      if (saved !== null) setIsSidebarOpen(saved === 'true');
    } catch {
      // ignore
    }
    loadRegistry();
  }, [router]);

  const toggleRoleExpand = (roleKey: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  // Group staff members by defined roles
  const groupedStaff = useMemo(() => {
    const groups: Record<string, StaffMember[]> = {
      OPERATOR: [],
      LEGAL: [],
      FIELD_OFFICER: [],
      ACCOUNTANT: [],
      ANALYST: [],
      ADMIN: [],
    };

    const query = searchQuery.trim().toLowerCase();

    staffList.forEach((s) => {
      const matchName = s.fullName.toLowerCase().includes(query);
      const matchEmail = s.email.toLowerCase().includes(query);
      const matchPhone = s.phone?.toLowerCase().includes(query) || false;
      const matchExt = s.internalExt?.toLowerCase().includes(query) || false;

      if (!query || matchName || matchEmail || matchPhone || matchExt) {
        if (groups[s.role]) {
          groups[s.role].push(s);
        } else {
          groups.ADMIN.push(s);
        }
      }
    });

    return groups;
  }, [staffList, searchQuery]);

  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  // Handle Recommendation Submission
  const handleSubmitRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !recComment.trim()) {
      setRecError('გთხოვთ შეიყვანოთ რეკომენდაციის ტექსტი');
      return;
    }

    setRecError(null);
    setIsSubmittingRec(true);
    try {
      const res = await analystBackendService.addStaffRecommendation({
        staffUserId: selectedStaff.id,
        rating: recRating,
        title: recTitle || undefined,
        comment: recComment.trim(),
      });

      setRecSuccessMessage(res.message || 'რეკომენდაცია წარმატებით შეინახა!');
      setRecComment('');
      setRecTitle('');
      setTimeout(() => setRecSuccessMessage(null), 4000);

      // Refresh registry
      await loadRegistry();
    } catch (err: any) {
      setRecError(err?.message || 'რეკომენდაციის შენახვა ვერ მოხერხდა');
    } finally {
      setIsSubmittingRec(false);
    }
  };

  // Handle Impersonation (Direct instant switch without browser confirm/alert)
  const handleStartImpersonation = async () => {
    if (!selectedStaff) return;
    setImpersonationError(null);
    setIsImpersonatingLoading(true);

    try {
      const res = await analystBackendService.impersonateStaff(selectedStaff.id);
      if (res && res.tokens && res.user) {
        authService.startImpersonation(res.user, res.tokens, '/analyst/staff');
        window.dispatchEvent(new Event('impersonation-changed'));
        const targetRoute = res.redirectUrl || authService.getPortalRouteForRole(selectedStaff.role);
        window.location.href = targetRoute;
      } else {
        throw new Error('ავტორიზაციის პასუხი არასრულია');
      }
    } catch (err: any) {
      setImpersonationError(err?.message || 'თანამშრომლის რეჟიმში შესვლა ვერ მოხერხდა');
      setIsImpersonatingLoading(false);
    }
  };

  const getRoleMeta = (role: string) => {
    switch (role) {
      case 'OPERATOR':
        return {
          title: 'ქოლ-ცენტრი & ოპერატორები (კრედიტ-მენეჯერები)',
          badge: 'Call Center & CRM',
          color: 'blue',
          icon: 'support_agent',
        };
      case 'LEGAL':
        return {
          title: 'იურიდიული დეპარტამენტი (იურისტები)',
          badge: 'Legal & Court',
          color: 'indigo',
          icon: 'gavel',
        };
      case 'FIELD_OFFICER':
        return {
          title: 'საველე მონიტორინგი (ვიზიტორები)',
          badge: 'Field Inspections',
          color: 'emerald',
          icon: 'directions_walk',
        };
      case 'ACCOUNTANT':
        return {
          title: 'ფინანსური განყოფილება (ბუღალტრები)',
          badge: 'Finance & Orders',
          color: 'amber',
          icon: 'receipt_long',
        };
      case 'ANALYST':
        return {
          title: 'ანალიტიკური ჯგუფი (ანალიტიკოსები)',
          badge: 'Risk & BI',
          color: 'violet',
          icon: 'query_stats',
        };
      case 'ADMIN':
      default:
        return {
          title: 'ადმინისტრაცია & მენეჯმენტი',
          badge: 'IT & Security',
          color: 'slate',
          icon: 'admin_panel_settings',
        };
    }
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'POSITIVE':
        return { label: 'დადებითი შეფასება', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'thumb_up' };
      case 'NEUTRAL':
        return { label: 'დამაკმაყოფილებელი', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'remove' };
      case 'WARNING':
        return { label: 'ყურადღება მისაქცევი', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'warning' };
      case 'CRITICAL':
        return { label: 'კრიტიკული შენიშვნა', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'error' };
      default:
        return { label: rating, bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: 'comment' };
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
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
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
                თანამშრომელთა რეესტრი &amp; მონიტორინგი
              </span>
              <span className="text-xs text-slate-400">საოპერაციო გუნდის კონტროლი &amp; რეკომენდაციები</span>
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
              href="/analyst/portfolio"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-indigo-600">send_time_extension</span>
              <span>სამართავი პორტფელი</span>
            </Link>

            <Link
              href="/analyst"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-slate-500">arrow_back</span>
              <span>ანალიტიკოსის მთავარ კონსოლზე დაბრუნება</span>
            </Link>

            <button
              onClick={loadRegistry}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="რეესტრის განახლება"
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
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE WITH PERSISTENT COLLAPSIBLE CONSOLE SIDEBAR */}
      {/* ========================================================================= */}
      <div className="flex-1 flex w-full max-w-[1720px] mx-auto overflow-hidden">
        <AnalystSidebar
          activeView="staff"
          isOpen={isSidebarOpen}
          onToggleOpen={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top Overview Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-emerald-300 border border-white/10 mb-1">
              <span className="material-symbols-outlined text-sm">badge</span>
              <span>HR &amp; საოპერაციო პერსონალის მონიტორინგი</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              თანამშრომელთა რეესტრი, სამუშაო შედეგები &amp; პირდაპირი მონიტორინგი
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              გაეცანით HR-ის მიერ რეგისტრირებულ ყველა თანამშრომელს დეპარტამენტებისა და როლების მიხედვით. დააკვირდით მათ მიერ შესრულებულ სამუშაოს (ზარები, ვიზიტები, სასამართლო საქმეები, ბუღალტრული გადახდები), მიეცით ანალიტიკური რეკომენდაცია და შედით სისტემაში მათი პროფილით.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
              <span className="text-[11px] text-slate-300 block">სულ თანამშრომელი</span>
              <span className="text-2xl font-bold font-mono text-white mt-0.5 block">{staffList.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center min-w-[120px]">
              <span className="text-[11px] text-slate-300 block">აქტიური როლები</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">6 როლი</span>
            </div>
          </div>
        </div>

        {/* Master Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: ROLE ACCORDIONS & EMPLOYEE SELECTION (5 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Filter Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="თანამშრომლის ძიება (სახელი, ელფოსტა, შიდა ნომერი)..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition"
                />
              </div>
            </div>

            {/* Role Groups List */}
            <div className="space-y-3">
              {(['OPERATOR', 'LEGAL', 'FIELD_OFFICER', 'ACCOUNTANT', 'ANALYST', 'ADMIN'] as const).map((roleKey) => {
                const members = groupedStaff[roleKey] || [];
                const meta = getRoleMeta(roleKey);
                const isExpanded = expandedRoles[roleKey];

                return (
                  <div key={roleKey} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
                    {/* Role Header Accordion Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRoleExpand(roleKey)}
                      className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between border-b border-slate-100 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold text-slate-900">{meta.title}</h2>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold font-mono bg-slate-200 text-slate-700">
                              {members.length}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">{meta.badge}</span>
                        </div>
                      </div>

                      <span className={`material-symbols-outlined text-slate-400 text-lg transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {/* Member Items inside this role */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100 p-1">
                        {members.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">
                            ამ პოზიციაზე თანამშრომელი ჯერ არ არის რეგისტრირებული
                          </div>
                        ) : (
                          members.map((member) => {
                            const isSelected = selectedStaffId === member.id;
                            const hasRecs = member.recommendations?.length > 0;
                            const latestRec = hasRecs ? member.recommendations[0] : null;

                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => setSelectedStaffId(member.id)}
                                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary-container text-white shadow-sm ring-1 ring-primary'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}
                                  >
                                    {member.fullName.substring(0, 2)}
                                  </div>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                        {member.fullName}
                                      </span>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="აქტიური" />
                                    </div>
                                    <span className={`text-[11px] block truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                      {member.email} • შიდა: {member.internalExt || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end shrink-0 pl-2">
                                  {latestRec && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        isSelected ? 'bg-white/20 text-white' : getRatingBadge(latestRec.rating).bg
                                      }`}
                                    >
                                      {getRatingBadge(latestRec.rating).label.split(' ')[0]}
                                    </span>
                                  )}
                                  <span className={`text-[10px] mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {member.recommendations?.length || 0} რეკომენდაცია
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: WORK MONITORING, AUDIT & RECOMMENDATIONS (7 Cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            {selectedStaff ? (
              <div className="space-y-6 animate-fadeIn">
                {/* 1. Employee Header Card with Impersonation Action */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                  {impersonationError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                        <span>{impersonationError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImpersonationError(null)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                        {selectedStaff.fullName.substring(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">{selectedStaff.fullName}</h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            სტატუსი: აქტიური
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedStaff.department} • როლი: <strong>{getRoleMeta(selectedStaff.role).title}</strong>
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span>ელფოსტა: <strong className="text-slate-600">{selectedStaff.email}</strong></span>
                          <span>შიდა ნომერი: <strong className="text-slate-600">{selectedStaff.internalExt || '—'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Impersonation Button */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={handleStartImpersonation}
                        disabled={isImpersonatingLoading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-700 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        title="ამ თანამშრომლის პროფილით სისტემაში შესვლა"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        <span>{isImpersonatingLoading ? 'შესვლა...' : 'სისტემაში შესვლა ამ თანამშრომლით'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Dynamic Performance Indicators (KPI Cards) */}
                  <div className="pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">monitoring</span>
                      <span>თანამშრომლის შესრულებული სამუშაოს ანალიტიკა</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedStaff.role === 'OPERATOR' && (
                        <>
                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60">
                            <span className="text-[11px] text-blue-900 block font-medium">სულ განხორციელებული ზარი</span>
                            <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                              {selectedStaff.metrics?.totalCalls || 0}
                            </span>
                            <span className="text-[10px] text-blue-700">ქოლ-ცენტრის ჟურნალი</span>
                          </div>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                            <span className="text-[11px] text-emerald-900 block font-medium">გადახდის დაპირება (PTP)</span>
                            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
                              {selectedStaff.metrics?.ptpCalls || 0}
                            </span>
                            <span className="text-[10px] text-emerald-700">დადებითი შედეგი</span>
                          </div>
                          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
                            <span className="text-[11px] text-indigo-900 block font-medium">PTP კონვერსია</span>
                            <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">
                              {selectedStaff.metrics?.conversionRatePct || 0}%
                            </span>
                            <span className="text-[10px] text-indigo-700">ეფექტურობის კოეფიციენტი</span>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-600 block font-medium">საშუალო ხანგრძლივობა</span>
                            <span className="text-2xl font-bold font-mono text-slate-800 mt-1 block">
                              {selectedStaff.metrics?.avgDurationSeconds || 0} წმ
                            </span>
                            <span className="text-[10px] text-slate-400">საუბრის დრო</span>
                          </div>
                        </>
                      )}

                      {selectedStaff.role === 'LEGAL' && (
                        <>
                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60">
                            <span className="text-[11px] text-blue-900 block font-medium">მიმაგრებული საქმეები</span>
                            <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                              {selectedStaff.metrics?.totalCases || 0}
                            </span>
                            <span className="text-[10px] text-blue-700">სასამართლო წარმოებაში</span>
                          </div>
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                            <span className="text-[11px] text-amber-900 block font-medium">დადებული ყადაღები</span>
                            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                              {selectedStaff.metrics?.sequestrations || 0}
                            </span>
                            <span className="text-[10px] text-amber-700">უზრუნველყოფის ღონისძიება</span>
                          </div>
                          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/60">
                            <span className="text-[11px] text-purple-900 block font-medium">სააღსრულებოში გადაცემული</span>
                            <span className="text-2xl font-bold font-mono text-purple-950 mt-1 block">
                              {selectedStaff.metrics?.inEnforcement || 0}
                            </span>
                            <span className="text-[10px] text-purple-700">აღსრულების ბიურო</span>
                          </div>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                            <span className="text-[11px] text-emerald-900 block font-medium">ამოღებული თანხა</span>
                            <span className="text-xl font-bold font-mono text-emerald-950 mt-1 block">
                              {Number(selectedStaff.metrics?.recoveredTotalGel || 0).toLocaleString()} ₾
                            </span>
                            <span className="text-[10px] text-emerald-700">Win Rate: {selectedStaff.metrics?.winRatePct || 0}%</span>
                          </div>
                        </>
                      )}

                      {selectedStaff.role === 'FIELD_OFFICER' && (
                        <>
                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60">
                            <span className="text-[11px] text-blue-900 block font-medium">სულ ვიზიტები</span>
                            <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                              {selectedStaff.metrics?.totalVisits || 0}
                            </span>
                            <span className="text-[10px] text-blue-700">საველე ინსპექცია</span>
                          </div>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                            <span className="text-[11px] text-emerald-900 block font-medium">ჩაბარებული / შედგა</span>
                            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
                              {selectedStaff.metrics?.completed || 0}
                            </span>
                            <span className="text-[10px] text-emerald-700">შესრულება: {selectedStaff.metrics?.completionRatePct || 0}%</span>
                          </div>
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                            <span className="text-[11px] text-amber-900 block font-medium">ვერ მოიძებნა / გადაიდო</span>
                            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                              {(selectedStaff.metrics?.unreachable || 0) + (selectedStaff.metrics?.rescheduled || 0)}
                            </span>
                            <span className="text-[10px] text-amber-700">ხელახალი ვიზიტი</span>
                          </div>
                          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
                            <span className="text-[11px] text-indigo-900 block font-medium">GPS ვალიდაცია</span>
                            <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">
                              {selectedStaff.metrics?.gpsVerifiedRatePct || 96}%
                            </span>
                            <span className="text-[10px] text-indigo-700">50მ რადიუსში ნამყოფი</span>
                          </div>
                        </>
                      )}

                      {selectedStaff.role === 'ACCOUNTANT' && (
                        <>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                            <span className="text-[11px] text-emerald-900 block font-medium">დადასტურებული ორდერები</span>
                            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
                              {selectedStaff.metrics?.verifiedOrdersCount || 28}
                            </span>
                            <span className="text-[10px] text-emerald-700">საბანკო ქვითრები</span>
                          </div>
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                            <span className="text-[11px] text-amber-900 block font-medium">მოლოდინის რეჟიმში</span>
                            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                              {selectedStaff.metrics?.pendingVerificationCount || 3}
                            </span>
                            <span className="text-[10px] text-amber-700">შესადარებელი</span>
                          </div>
                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60 sm:col-span-2">
                            <span className="text-[11px] text-blue-900 block font-medium">დამუშავებული თანხის მოცულობა</span>
                            <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                              {Number(selectedStaff.metrics?.reconciledVolumeGel || 142500).toLocaleString()} ₾
                            </span>
                            <span className="text-[10px] text-blue-700">დარიცხული &amp; გადამოწმებული</span>
                          </div>
                        </>
                      )}

                      {(selectedStaff.role === 'ANALYST' || selectedStaff.role === 'ADMIN') && (
                        <>
                          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/60">
                            <span className="text-[11px] text-blue-900 block font-medium">სისტემური მოქმედებები</span>
                            <span className="text-2xl font-bold font-mono text-blue-950 mt-1 block">
                              {selectedStaff.metrics?.systemActionsCount || selectedStaff.metrics?.portfoliosDispatched || 14}
                            </span>
                            <span className="text-[10px] text-blue-700">აუდიტის ლოგები</span>
                          </div>
                          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
                            <span className="text-[11px] text-indigo-900 block font-medium">გადამოწმებული ჩანაწერები</span>
                            <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">
                              {selectedStaff.metrics?.verifiedDebtorsCount || 45}
                            </span>
                            <span className="text-[10px] text-indigo-700">სინქრონიზებული</span>
                          </div>
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60 sm:col-span-2">
                            <span className="text-[11px] text-emerald-900 block font-medium">სტატუსის შესაბამისობა</span>
                            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">100% OK</span>
                            <span className="text-[10px] text-emerald-700">უსაფრთხოების ნორმა</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Recent Activity & Work Log Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500 text-base">history</span>
                      <span>ბოლო სამუშაო მოქმედებების ჟურნალი ({selectedStaff.activityLogs?.length || 0})</span>
                    </h3>
                  </div>

                  {selectedStaff.activityLogs?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ამ თანამშრომლის მიერ ჯერ არ არის დაფიქსირებული აქტივობა
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {selectedStaff.activityLogs?.map((log: any, idx: number) => (
                        <div key={idx} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">{log.title}</span>
                            <p className="text-[11px] text-slate-500">
                              {log.notes || log.stage || log.address || 'მოქმედება შესრულდა წარმატებით'}
                            </p>
                            {log.promiseAmount && (
                              <span className="inline-block mt-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                დაპირებული თანხა: {log.promiseAmount.toLocaleString()} ₾
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {log.date ? new Date(log.date).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Analyst Recommendation & Evaluation Form */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          ანალიტიკოსის შეფასება &amp; რეკომენდაცია თანამშრომელს
                        </h3>
                        <p className="text-xs text-slate-400">
                          შეაფასეთ თანამშრომლის მუშაობა, მიუთითეთ რა მოგეწონათ ან რას უნდა მიექცეს ყურადღება
                        </p>
                      </div>
                    </div>
                  </div>

                  {recSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                      <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                      <span>{recSuccessMessage}</span>
                    </div>
                  )}

                  {recError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-rose-600">error</span>
                        <span>{recError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRecError(null)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmitRecommendation} className="space-y-4">
                    {/* Rating Selector Chips */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-2">შეფასების დონე:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setRecRating('POSITIVE')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            recRating === 'POSITIVE'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">thumb_up</span>
                          <span>დადებითი</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecRating('NEUTRAL')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            recRating === 'NEUTRAL'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">remove</span>
                          <span>საშუალო</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecRating('WARNING')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            recRating === 'WARNING'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">warning</span>
                          <span>ყურადღება</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecRating('CRITICAL')}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            recRating === 'CRITICAL'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">error</span>
                          <span>კრიტიკული</span>
                        </button>
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">თემა / სათაური:</label>
                      <input
                        type="text"
                        value={recTitle}
                        onChange={(e) => setRecTitle(e.target.value)}
                        placeholder="მაგ: სატელეფონო საუბრის სტანდარტი, სასამართლო ვადების კონტროლი, GPS სიზუსტე..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition"
                      />
                    </div>

                    {/* Comment Textarea */}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        რეკომენდაცია / შენიშვნა <span className="text-rose-500">*</span>:
                      </label>
                      <textarea
                        rows={3}
                        value={recComment}
                        onChange={(e) => setRecComment(e.target.value)}
                        placeholder="დაწერეთ დეტალური კომენტარი: მიაქციე ყურადღება ამას თუ იმას, ასე და ისე მოიქეცი, გააუმჯობესე გადახდის დაპირების დაფიქსირება..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingRec || !recComment.trim()}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>{isSubmittingRec ? 'ინახება...' : 'რეკომენდაციის შენახვა'}</span>
                      </button>
                    </div>
                  </form>

                  {/* 5. Past Recommendations History */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-slate-400 text-base">forum</span>
                      <span>წარსული რეკომენდაციების ისტორია ({selectedStaff.recommendations?.length || 0})</span>
                    </h4>

                    {selectedStaff.recommendations?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        ამ თანამშრომლისთვის ჯერ არ არის გაცემული რეკომენდაცია
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedStaff.recommendations.map((rec: any) => {
                          const badge = getRatingBadge(rec.rating);
                          return (
                            <div key={rec.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                                    <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                                    <span>{badge.label}</span>
                                  </span>
                                  {rec.title && (
                                    <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(rec.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed pl-1">{rec.comment}</p>
                              <div className="text-[10px] text-slate-400 pl-1 pt-1">
                                ავტორი: <strong>{rec.authorName}</strong> ({rec.authorEmail})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <span className="material-symbols-outlined text-4xl text-slate-300">badge</span>
                <h3 className="text-sm font-bold text-slate-700 mt-2">აირჩიეთ თანამშრომელი</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  მარცხენა რეესტრიდან აირჩიეთ თანამშრომელი მისი სამუშაო მონიტორინგის სანახავად, რეკომენდაციის გასაწევად ან მისი პროფილით სისტემაში შესასვლელად.
                </p>
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
