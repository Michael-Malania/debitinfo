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
  const [staffViewMode, setStaffViewMode] = useState<'INDIVIDUAL' | 'DEPARTMENT_LEADERBOARD'>('INDIVIDUAL');
  const [staffDetailTab, setStaffDetailTab] = useState<'analytics' | 'hourly_load' | 'activity_logs' | 'recommendations'>('analytics');
  const [deptSubTab, setDeptSubTab] = useState<'operators' | 'lawyers' | 'visitors' | 'accountants'>('operators');
  const [hourlyScope, setHourlyScope] = useState<'employee' | 'department'>('employee');
  const [hourlyDistribution, setHourlyDistribution] = useState<any[]>([
    { hour: '08:00', callCount: 14, promiseToPayCount: 4 },
    { hour: '09:00', callCount: 38, promiseToPayCount: 11 },
    { hour: '10:00', callCount: 65, promiseToPayCount: 22 },
    { hour: '11:00', callCount: 88, promiseToPayCount: 31 },
    { hour: '12:00', callCount: 92, promiseToPayCount: 29 },
    { hour: '13:00', callCount: 54, promiseToPayCount: 16 },
    { hour: '14:00', callCount: 60, promiseToPayCount: 19 },
    { hour: '15:00', callCount: 84, promiseToPayCount: 28 },
    { hour: '16:00', callCount: 78, promiseToPayCount: 26 },
    { hour: '17:00', callCount: 52, promiseToPayCount: 15 },
    { hour: '18:00', callCount: 22, promiseToPayCount: 6 },
  ]);

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
    if (!user) {
      router.push('/ops?redirect=/analyst/staff');
      return;
    }
    if (user.role !== 'ANALYST' && user.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(user.role);
      router.push(dest);
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
          title: 'ქოლ-ცენტრი & კრედიტ მენეჯერები',
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
        <div className="w-full px-4 lg:px-6 h-16 flex items-center justify-between">
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

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE WITH PERSISTENT COLLAPSIBLE CONSOLE SIDEBAR */}
      {/* ========================================================================= */}
      <div className="flex-1 flex w-full overflow-hidden">
        <AnalystSidebar
          activeView="staff"
          isOpen={isSidebarOpen}
          onToggleOpen={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-xl">badge</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                თანამშრომელთა რეესტრი
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">HR მონიტორინგი</span>
              </h1>
              <p className="text-xs text-slate-500">საოპერაციო გუნდის პირდაპირი მონიტორინგი და ანალიტიკა</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <span className="text-slate-500">სულ:</span>
              <span className="font-bold font-mono text-slate-900">{staffList.length} თანამშრომელი</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold">6 აქტიური როლი</span>
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
            {staffViewMode === 'DEPARTMENT_LEADERBOARD' ? (
              /* ========================================================================= */
              /* DEPARTMENT LEADERBOARDS & COLLECTIVE ANALYTICS */
              /* ========================================================================= */
              <div className="space-y-6 animate-fadeIn">
                {/* Department Sub-Tabs */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDeptSubTab('operators')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      deptSubTab === 'operators'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    <span>📞 ქალ-ცენტრი & კრედიტ-მენეჯერები</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptSubTab('lawyers')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      deptSubTab === 'lawyers'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">gavel</span>
                    <span>⚖️ იურისტები & სასამართლო</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptSubTab('visitors')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      deptSubTab === 'visitors'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">directions_walk</span>
                    <span>🚶 საველე ვიზიტორები</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeptSubTab('accountants')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      deptSubTab === 'accountants'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>💼 ფინანსები & ბუღალტრები</span>
                  </button>
                </div>

                {/* 1. Operators Department Section */}
                {deptSubTab === 'operators' && (
                  <div className="space-y-6">
                    {/* Hourly Distribution Diagram */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            საათობრივი პიკური დატვირთვა (08:00 - 18:00)
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ზარების მოცულობა და გადახდის დაპირებები (Promise to Pay) საათების მიხედვით
                          </p>
                        </div>
                        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                          ⚡ პიკი: 11:00 - 13:00 და 15:00 - 17:00
                        </span>
                      </div>

                      {(() => {
                        const maxCalls = Math.max(...hourlyDistribution.map((d: any) => d.callCount || 0), 1);
                        return (
                          <div className="grid grid-cols-11 gap-2 pt-4 items-end">
                            {hourlyDistribution.map((item: any, idx: number) => {
                              const count = item.callCount || 0;
                              const ptp = item.promiseToPayCount || 0;
                              const barHeightPct = Math.max(16, Math.round((count / maxCalls) * 85));

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center group relative cursor-pointer"
                                  title={`${item.hour}: სულ ${count} ზარი • ${ptp} გადახდის დაპირება (PTP)`}
                                >
                                  <span className="text-[11px] font-bold text-slate-800 mb-1.5 transition group-hover:text-primary">
                                    {count}
                                  </span>
                                  <div className="w-full bg-slate-100 rounded-xl h-36 flex flex-col justify-end p-1 border border-slate-200/80 shadow-xs group-hover:border-primary transition-colors">
                                    <div
                                      style={{ height: `${barHeightPct}%` }}
                                      className="w-full bg-gradient-to-t from-primary to-blue-500 rounded-lg transition-all duration-300 flex flex-col items-center justify-between py-1 shadow-xs group-hover:from-blue-700 group-hover:to-blue-600"
                                    >
                                      {ptp > 0 ? (
                                        <span className="px-1 py-0.2 bg-white/25 text-white rounded text-[9px] font-extrabold tracking-tight">
                                          {ptp}
                                        </span>
                                      ) : (
                                        <span />
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-mono font-medium text-slate-600 text-center mt-2.5 block tracking-tight group-hover:text-slate-900">
                                    {item.hour}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Operators Leaderboard */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                        კრედიტ მენეჯერთა რეიტინგი
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">კრედიტ მენეჯერი</th>
                            <th className="py-3 px-4">განხორციელებული ზარები</th>
                            <th className="py-3 px-4">წარმატებული კონტაქტი</th>
                            <th className="py-3 px-4">დაპირება (PTP)</th>
                            <th className="py-3 px-4">კონვერსია %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { name: 'თეონა პეტრიაშვილი', calls: 168, contacted: 138, ptp: 62, rate: '45%' },
                            { name: 'მარიამ ჯაფარიძე', calls: 154, contacted: 122, ptp: 51, rate: '42%' },
                            { name: 'ანა ჩიქოვანი', calls: 142, contacted: 110, ptp: 44, rate: '40%' },
                          ].map((op, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-semibold text-slate-900">{op.name}</td>
                              <td className="py-3 px-4 font-mono">{op.calls} ზარი</td>
                              <td className="py-3 px-4 text-emerald-600 font-medium font-mono">{op.contacted}</td>
                              <td className="py-3 px-4 font-bold text-primary font-mono">{op.ptp} დაპირება</td>
                              <td className="py-3 px-4 font-bold text-slate-800 font-mono">{op.rate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Lawyers Department Section */}
                {deptSubTab === 'lawyers' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">სასამართლო სარჩელები</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">28</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">მომზადებული & შეტანილი</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">ყადაღები / უზრუნველყოფა</div>
                        <div className="text-xl font-bold font-mono text-blue-600 mt-1">14</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">დადებული ყადაღები</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">მოგებული საქმეები</div>
                        <div className="text-xl font-bold font-mono text-emerald-600 mt-1">19</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">წარმატების კოეფიციენტი 86%</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">ამოღებული მოცულობა</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">145,000 ₾</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">სასამართლოს გზით</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                        იურისტთა საქმეების შედეგიანობა & ამოღება
                      </div>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">იურისტი</th>
                            <th className="py-3 px-4">სარჩელები</th>
                            <th className="py-3 px-4">ყადაღა</th>
                            <th className="py-3 px-4">სასამართლოში</th>
                            <th className="py-3 px-4">მოგებული</th>
                            <th className="py-3 px-4 text-right">ამოღებული ₾</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { name: 'ნინო ბერიძე', lawsuits: 12, sequestrations: 6, inCourt: 5, won: 8, recovered: 64200 },
                            { name: 'გიორგი მაისურაძე', lawsuits: 9, sequestrations: 4, inCourt: 3, won: 6, recovered: 48900 },
                            { name: 'დავით კაპანაძე', lawsuits: 7, sequestrations: 4, inCourt: 4, won: 5, recovered: 31900 },
                          ].map((l, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-semibold text-slate-900">{l.name}</td>
                              <td className="py-3 px-4 font-mono">{l.lawsuits}</td>
                              <td className="py-3 px-4 font-mono">{l.sequestrations}</td>
                              <td className="py-3 px-4 font-mono">{l.inCourt}</td>
                              <td className="py-3 px-4 font-bold text-emerald-600 font-mono">{l.won}</td>
                              <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">{l.recovered.toLocaleString()} ₾</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Visitors Department Section */}
                {deptSubTab === 'visitors' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">სულ ვიზიტები</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">48</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">დაგეგმილი ინსპექცია</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">შედგენილი აქტები</div>
                        <div className="text-xl font-bold font-mono text-emerald-600 mt-1">39</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">წარმატებული შეხვედრები</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">კონტაქტი მოვალესთან</div>
                        <div className="text-xl font-bold font-mono text-blue-600 mt-1">81%</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ადგილზე ნახვის კოეფიციენტი</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">GPS დამოწმება</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">94%</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">ლოკაციის გადამოწმება</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Accountants Department Section */}
                {deptSubTab === 'accountants' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">დამოწმებული ქვითრები</div>
                        <div className="text-xl font-bold font-mono text-emerald-600 mt-1">64</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">საბოლოოდ დამტკიცებული</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">დადასტურებული თანხა</div>
                        <div className="text-xl font-bold font-mono text-slate-900 mt-1">182,400 ₾</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">საბანკო გადარიცხვები</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">ვერიფიკაციის სისწრაფე</div>
                        <div className="text-xl font-bold font-mono text-blue-600 mt-1">~1.4 სთ</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">საშუალო დრო</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="text-xs text-slate-500 font-semibold">უარყოფის პროცენტი</div>
                        <div className="text-xl font-bold font-mono text-amber-600 mt-1">4.2%</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">არასწორი ქვითრები</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedStaff ? (
              /* ========================================================================= */
              /* INDIVIDUAL EMPLOYEE PROFILE & ANALYTICS WORKSPACE */
              /* ========================================================================= */
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

                  {/* Smart Workspace Navigation Tabs */}
                  <div className="flex items-center gap-1.5 pt-4 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setStaffDetailTab('analytics')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        staffDetailTab === 'analytics'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">monitoring</span>
                      <span>📊 სამუშაოს ანალიტიკა & KPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffDetailTab('hourly_load')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        staffDetailTab === 'hourly_load'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">schedule</span>
                      <span>⚡ საათობრივი დატვირთვა (08:00 - 18:00)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffDetailTab('activity_logs')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        staffDetailTab === 'activity_logs'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">history</span>
                      <span>📋 სამუშაო ჟურნალი (${selectedStaff.activityLogs?.length || 0})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffDetailTab('recommendations')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        staffDetailTab === 'recommendations'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">rate_review</span>
                      <span>📝 რეკომენდაციები (${selectedStaff.recommendations?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* 2. TAB: ANALYTICS & KPI METRICS */}
                {staffDetailTab === 'analytics' && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-fadeIn">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
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
                            <span className="text-[10px] text-blue-700">ქალ-ცენტრის ჟურნალი</span>
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
                          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                            <span className="text-[11px] text-emerald-900 block font-medium">მოგებული საქმეები</span>
                            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
                              {selectedStaff.metrics?.wonCases || 0}
                            </span>
                            <span className="text-[10px] text-emerald-700">შესრულება: {selectedStaff.metrics?.winRatePct || 0}%</span>
                          </div>
                          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/60">
                            <span className="text-[11px] text-amber-900 block font-medium">ყადაღა / უზრუნველყოფა</span>
                            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">
                              {selectedStaff.metrics?.sequestrationCount || 0}
                            </span>
                            <span className="text-[10px] text-amber-700">აღსრულების ეტაპი</span>
                          </div>
                          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/60">
                            <span className="text-[11px] text-indigo-900 block font-medium">ამოღებული თანხა</span>
                            <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">
                              {Number(selectedStaff.metrics?.recoveredAmountGel || 0).toLocaleString()} ₾
                            </span>
                            <span className="text-[10px] text-indigo-700">სასამართლოს გზით</span>
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
                            <span className="text-[10px] text-blue-700">დარიცხული & გადამოწმებული</span>
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
                )}

                {/* 3. TAB: HOURLY LOAD STUDIO (08:00 - 18:00) */}
                {staffDetailTab === 'hourly_load' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-base">schedule</span>
                            <h4 className="text-sm font-bold text-slate-900">
                              საათობრივი პიკური დატვირთვა (08:00 - 18:00)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ზარების მოცულობა და გადახდის დაპირებები (Promise to Pay) საათების მიხედვით
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                            ⚡ პიკი: 11:00 - 13:00 და 15:00 - 17:00
                          </span>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                            <button
                              type="button"
                              onClick={() => setHourlyScope('employee')}
                              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                                hourlyScope === 'employee' ? 'bg-white text-primary font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              თანამშრომელი
                            </button>
                            <button
                              type="button"
                              onClick={() => setHourlyScope('department')}
                              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                                hourlyScope === 'department' ? 'bg-white text-primary font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              დეპარტამენტი
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4 Summary Performance Metrics for Hourly Load */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">⚡ პიკური საათი</span>
                          <span className="text-xl font-bold font-mono text-primary mt-1 block">12:00</span>
                          <span className="text-[10px] text-slate-400">92 ზარი • 29 PTP</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">📞 სულ ზარები დღეს</span>
                          <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                            {hourlyScope === 'employee' ? (selectedStaff.metrics?.totalCalls || 78) : 647}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">სამუშაო გრაფიკში</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">🎯 გადახდის დაპირება (PTP)</span>
                          <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">
                            {hourlyScope === 'employee' ? (selectedStaff.metrics?.ptpCalls || 26) : 207}
                          </span>
                          <span className="text-[10px] text-emerald-700">დაფიქსირებული</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] text-slate-500 block">📈 კონვერსიის ტემპი</span>
                          <span className="text-xl font-bold font-mono text-indigo-600 mt-1 block">
                            {hourlyScope === 'employee' ? (selectedStaff.metrics?.conversionRatePct || 33.3) : 32}%
                          </span>
                          <span className="text-[10px] text-indigo-700">შედეგიანი ზარები</span>
                        </div>
                      </div>

                      {/* 11-Column Visual Bar Track Diagram */}
                      {(() => {
                        const maxCalls = Math.max(...hourlyDistribution.map((d: any) => d.callCount || 0), 1);

                        return (
                          <div className="grid grid-cols-11 gap-2 pt-2 items-end">
                            {hourlyDistribution.map((item: any, idx: number) => {
                              const count = hourlyScope === 'employee' ? Math.round(item.callCount * 0.4) || 2 : item.callCount;
                              const ptp = hourlyScope === 'employee' ? Math.round(item.promiseToPayCount * 0.4) || 1 : item.promiseToPayCount;
                              const barHeightPct = Math.max(16, Math.round((count / (hourlyScope === 'employee' ? maxCalls * 0.4 : maxCalls)) * 85));

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-col items-center group relative cursor-pointer"
                                  title={`${item.hour}: სულ ${count} ზარი • ${ptp} გადახდის დაპირება (PTP)`}
                                >
                                  {/* Top call count badge */}
                                  <span className="text-[11px] font-bold text-slate-800 mb-1.5 transition group-hover:text-primary">
                                    {count}
                                  </span>

                                  {/* Bar Track Container */}
                                  <div className="w-full bg-slate-100 rounded-xl h-36 flex flex-col justify-end p-1 border border-slate-200/80 shadow-xs group-hover:border-primary/50 transition-colors">
                                    <div
                                      style={{ height: `${barHeightPct}%` }}
                                      className="w-full bg-gradient-to-t from-primary to-blue-500 rounded-lg transition-all duration-300 flex flex-col items-center justify-between py-1 shadow-xs group-hover:from-blue-700 group-hover:to-blue-600"
                                    >
                                      {/* PTP Indicator */}
                                      {ptp > 0 ? (
                                        <span className="px-1 py-0.2 bg-white/25 text-white rounded text-[9px] font-extrabold tracking-tight">
                                          {ptp}
                                        </span>
                                      ) : (
                                        <span />
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Full Hour Label */}
                                  <span className="text-[11px] font-mono font-medium text-slate-600 text-center mt-2.5 block tracking-tight group-hover:text-slate-900">
                                    {item.hour}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 4. TAB: RECENT ACTIVITY & WORK LOG TABLE */}
                {staffDetailTab === 'activity_logs' && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-fadeIn">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-base">history</span>
                        <span>ბოლო სამუშაო მოქმედებების ჟურნალი ({selectedStaff.activityLogs?.length || 0})</span>
                      </h3>
                    </div>

                    {selectedStaff.activityLogs?.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        ამ თანამშრომლის მიერ ჯერ არ არის დაფიქსირებული აქტივობა
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
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
                )}

                {/* 5. TAB: RECOMMENDATIONS & EVALUATION */}
                {staffDetailTab === 'recommendations' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Recommendation Form */}
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
                              <span>შენიშვნა</span>
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

                        {/* Title Input */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            რეკომენდაციის სათაური (არასავალდებულო):
                          </label>
                          <input
                            type="text"
                            value={recTitle}
                            onChange={(e) => setRecTitle(e.target.value)}
                            placeholder="მაგ: PTP კონვერსიის ზრდის ტაქტიკა..."
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition"
                          />
                        </div>

                        {/* Comment Textarea */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            დეტალური რეკომენდაცია / შენიშვნა <span className="text-rose-500">*</span>:
                          </label>
                          <textarea
                            rows={3}
                            value={recComment}
                            onChange={(e) => setRecComment(e.target.value)}
                            placeholder="ჩაწერეთ კონკრეტული რეკომენდაცია თანამშრომლისათვის..."
                            className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition"
                            required
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={isSubmittingRec || !recComment.trim()}
                            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            <span>{isSubmittingRec ? 'ინახება...' : 'რეკომენდაციის შენახვა & გაგზავნა'}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Historical Recommendations List */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-500 text-base">forum</span>
                        <span>ისტორიული შეფასებები &amp; რეკომენდაციები ({selectedStaff.recommendations?.length || 0})</span>
                      </h4>

                      {selectedStaff.recommendations?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          ამ თანამშრომელზე ჯერ არ არის გაცემული რეკომენდაცია
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedStaff.recommendations?.map((rec: any, idx: number) => {
                            const badge = getRatingBadge(rec.rating);
                            return (
                              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                                      <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                                      <span>{badge.label}</span>
                                    </span>
                                    {rec.title && (
                                      <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                    {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{rec.comment}</p>
                                <div className="text-[10px] text-slate-400 pt-1">
                                  ავტორი: <strong>{rec.authorName || 'მთავარი ანალიტიკოსი'}</strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
