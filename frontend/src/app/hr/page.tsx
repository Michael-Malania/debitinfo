'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, opsBackendService } from '@/services';

export interface QuotaAlert {
  id: string;
  level: 'CRITICAL' | 'WARNING' | 'NEUTRAL' | 'POSITIVE';
  badge: string;
  title: string;
  description: string;
  action: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
}

export interface StaffQuotas {
  critical: number;
  warning: number;
  neutral: number;
  positive: number;
  total: number;
  criticalLimit: number;
  warningLimit: number;
  neutralLimit: number;
  positiveLimit: number;
  criticalTriggered: boolean;
  warningTriggered: boolean;
  neutralTriggered: boolean;
  positiveTriggered: boolean;
  activeAlerts: QuotaAlert[];
}

export function getStaffQuotas(recommendations: any[] = []): StaffQuotas {
  const critical = recommendations.filter((r) => r.rating === 'CRITICAL').length;
  const warning = recommendations.filter((r) => r.rating === 'WARNING').length;
  const neutral = recommendations.filter((r) => r.rating === 'NEUTRAL').length;
  const positive = recommendations.filter((r) => r.rating === 'POSITIVE').length;
  const total = recommendations.length;

  const criticalLimit = 3;
  const warningLimit = 5;
  const neutralLimit = 10;
  const positiveLimit = 10;

  const criticalTriggered = critical >= criticalLimit;
  const warningTriggered = warning >= warningLimit;
  const neutralTriggered = neutral >= neutralLimit;
  const positiveTriggered = positive >= positiveLimit;

  const activeAlerts: QuotaAlert[] = [];

  if (criticalTriggered) {
    activeAlerts.push({
      id: 'critical',
      level: 'CRITICAL',
      badge: `🚨 ${critical} კრიტიკული შეფასება`,
      title: `კრიტიკული კვოტა გადაჭარბებულია (${critical}/${criticalLimit})`,
      description: 'თანამშრომელს დაუფიქსირდა 3 ან მეტი კრიტიკული შეფასება ანალიტიკოსისგან.',
      action: 'საჭიროა დაუყოვნებლივი დისციპლინური რეაგირება და შიდა გასაუბრების ოქმის წარმოება!',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
      textClass: 'text-rose-900',
      icon: 'dangerous',
    });
  }

  if (warningTriggered) {
    activeAlerts.push({
      id: 'warning',
      level: 'WARNING',
      badge: `⚠️ ${warning} შენიშვნა`,
      title: `შენიშვნების კვოტა გადაჭარბებულია (${warning}/${warningLimit})`,
      description: 'თანამშრომელმა მიიღო 5 ან მეტი გაფრთხილება / შენიშვნა.',
      action: 'საჭიროა გადამზადების კურსის გავლა ან ოფიციალური გაფრთხილება / საყვედური.',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      textClass: 'text-amber-900',
      icon: 'warning',
    });
  }

  if (neutralTriggered) {
    activeAlerts.push({
      id: 'neutral',
      level: 'NEUTRAL',
      badge: `🟡 ${neutral} საშუალო შეფასება`,
      title: `საშუალო შეფასებების ლიმიტი მიღწეულია (${neutral}/${neutralLimit})`,
      description: 'თანამშრომელს დაუგროვდა 10 საშუალო / ნეიტრალური შეფასება.',
      action: 'საჭიროა მოტივაციური ჩართულობა, მენტორობა და კვალიფიკაციის ამაღლება.',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      textClass: 'text-blue-900',
      icon: 'trending_flat',
    });
  }

  if (positiveTriggered) {
    activeAlerts.push({
      id: 'positive',
      level: 'POSITIVE',
      badge: `🌟 ${positive} დადებითი (ბონუსი)`,
      title: `წახალისების კვოტა შესრულებულია! (${positive}/${positiveLimit})`,
      description: 'თანამშრომელმა დააგროვა 10 ან მეტი მაღალი / დადებითი შეფასება!',
      action: 'თანამშრომელი წარდგენილია კვარტალურ ფულად ბონუსზე, მადლობის სიგელზე ან დაწინაურებაზე.',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      textClass: 'text-emerald-900',
      icon: 'military_tech',
    });
  }

  return {
    critical,
    warning,
    neutral,
    positive,
    total,
    criticalLimit,
    warningLimit,
    neutralLimit,
    positiveLimit,
    criticalTriggered,
    warningTriggered,
    neutralTriggered,
    positiveTriggered,
    activeAlerts,
  };
}

export function getRecommendationBadge(rating: string) {
  switch (rating) {
    case 'POSITIVE':
      return {
        label: 'დადებითი შეფასება',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: 'thumb_up',
      };
    case 'NEUTRAL':
      return {
        label: 'საშუალო / ნორმა',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: 'remove',
      };
    case 'WARNING':
      return {
        label: 'შენიშვნა / გაფრთხილება',
        bg: 'bg-amber-50 text-amber-900 border-amber-200',
        icon: 'warning',
      };
    case 'CRITICAL':
      return {
        label: 'კრიტიკული შეფასება',
        bg: 'bg-rose-50 text-rose-900 border-rose-200',
        icon: 'dangerous',
      };
    default:
      return {
        label: rating,
        bg: 'bg-slate-50 text-slate-800 border-slate-200',
        icon: 'info',
      };
  }
}

export default function HrPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);

  // Live Staff State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'tab-docs' | 'tab-bank' | 'tab-discipline' | 'tab-access'>('tab-docs');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New staff form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+995 599 ');
  const [newRole, setNewRole] = useState<'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL' | 'ADMIN'>('OPERATOR');
  const [newDepartment, setNewDepartment] = useState('ქოლ-ცენტრი & მოლაპარაკებები');
  const [newLegalAddress, setNewLegalAddress] = useState('');
  const [newActualAddress, setNewActualAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaffData = async () => {
    setLoadingStaff(true);
    try {
      const data = await opsBackendService.getStaff();
      setStaffList(data || []);
      if (data && data.length > 0) {
        setSelectedStaff((prev: any) => {
          if (!prev) return data[0];
          const found = data.find((s: any) => s.id === prev.id);
          return found || data[0];
        });
      }
    } catch (err) {
      console.warn('Could not load staff data:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/hr');
      return;
    }
    if (u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadStaffData();
  }, [router]);

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newPersonalId.trim() || !newEmail.trim()) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setIsSubmitting(true);
    try {
      await opsBackendService.createStaff({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        fullName: `${newFirstName.trim()} ${newLastName.trim()}`,
        personalId: newPersonalId.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        role: newRole,
        department: newDepartment,
        legalAddress: newLegalAddress.trim(),
        actualAddress: newActualAddress.trim() || newLegalAddress.trim(),
      });

      setActionSuccessMessage(`თანამშრომელი ${newFirstName} ${newLastName} წარმატებით დარეგისტრირდა!`);
      setIsRegisterModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPersonalId('');
      setNewEmail('');
      setNewLegalAddress('');
      setNewActualAddress('');
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'თანამშრომლის რეგისტრაცია ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    if (deptFilter !== 'ALL' && s.role !== deptFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = s.staffProfile?.fullName?.toLowerCase() || '';
    const email = s.email.toLowerCase();
    const pin = s.personalId || '';
    const dept = s.staffProfile?.department?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || pin.includes(q) || dept.includes(q);
  });

  const overallQuotaStats = useMemo(() => {
    let criticalQuotaCount = 0;
    let warningQuotaCount = 0;
    let bonusQuotaCount = 0;
    let neutralQuotaCount = 0;
    let totalRecommendationsCount = 0;

    staffList.forEach((s) => {
      const q = getStaffQuotas(s.recommendations || []);
      if (q.criticalTriggered) criticalQuotaCount++;
      if (q.warningTriggered) warningQuotaCount++;
      if (q.positiveTriggered) bonusQuotaCount++;
      if (q.neutralTriggered) neutralQuotaCount++;
      totalRecommendationsCount += q.total;
    });

    return {
      criticalQuotaCount,
      warningQuotaCount,
      bonusQuotaCount,
      neutralQuotaCount,
      totalRecommendationsCount,
    };
  }, [staffList]);

  const selectedQuotas = useMemo(() => {
    return getStaffQuotas(selectedStaff?.recommendations || []);
  }, [selectedStaff]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  const roleTitlesKa: Record<string, string> = {
    ADMIN: 'სისტემური ადმინისტრატორი',
    ANALYST: 'ფინანსური ანალიტიკოსი',
    LEGAL: 'იურისტი',
    OPERATOR: 'კრედიტ მენეჯერი',
    FIELD_OFFICER: 'საველე ვიზიტორი',
  };

  return (
    <div className="h-full text-text-primary bg-surface-bg flex flex-col font-body-md text-body-md antialiased overflow-hidden">
      <div>
        {/* TOP APP BAR */}
        <header className="docked full-width top-0 sticky z-40 border-b border-border-subtle shadow-sm flex justify-between items-center w-full px-space-lg h-16 bg-surface-container-lowest">
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-space-xs group cursor-pointer">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight group-hover:underline">
                Debitinfo.GE
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-[#047857] border border-accent-mint/30 ml-2 font-semibold">
                HR &amp; ადმინისტრატორი Live
              </span>
            </Link>
            {/* Search Bar */}
            <div className="relative w-80 md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                placeholder="მოძებნეთ თანამშრომელი სახელით, პ/ნ, როლით..."
                type="text"
              />
            </div>
          </div>

          {/* Trailing Actions & User info */}
          <div className="flex items-center gap-space-md">
            <Link
              href="/ops"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
              title="საოპერაციო ცენტრში გადასვლა"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
            </Link>

            <div className="h-6 w-px bg-border-subtle" />
            {/* Profile Section */}
            <div className="flex items-center gap-space-sm pl-1">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-body-sm border border-primary/20">
                HR
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-body-sm font-body-sm font-semibold text-text-primary leading-tight">
                  {currentUser?.name || currentUser?.email || 'ადმინისტრატორი'}
                </span>
                <span className="text-label-sm font-label-sm text-text-muted">HR &amp; Security</span>
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
        </header>

        {actionSuccessMessage && (
          <div className="max-w-[1720px] mx-auto px-4 lg:px-8 mt-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-medium">{actionSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* BODY CONTENT AREA */}
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
              <div>
                <h1 className="text-headline-lg font-headline-lg text-text-primary font-bold">
                  თანამშრომელთა მენეჯმენტი და პერსონალის დოსიე
                </h1>
                <p className="text-body-md font-body-md text-text-muted mt-0.5">
                  კადრების რეესტრი, როლები, საკონტაქტო პირები და ციფრული კანცელარია (Live PostgreSQL)
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-body-md font-body-md hover:bg-[#0A37CA] transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ ახალი თანამშრომლის რეგისტრაცია</span>
                </button>
              </div>
            </div>

            {/* 4 KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">სულ თანამშრომელი</span>
                <div className="mt-2 text-headline-lg font-bold text-text-primary">{staffList.length}</div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">
                  აქტიური შტატი: {staffList.filter((s) => s.status === 'ACTIVE').length} კადრი
                </div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">იურისტები &amp; სააღსრულებო</span>
                <div className="mt-2 text-headline-lg font-bold text-primary">
                  {staffList.filter((s) => s.role === 'LEGAL').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">სასამართლო &amp; აღსრულება</div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">კრედიტ მენეჯერები</span>
                <div className="mt-2 text-headline-lg font-bold text-emerald-700">
                  {staffList.filter((s) => s.role === 'OPERATOR').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">CRM კომუნიკაციები</div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">ვიზიტორები</span>
                <div className="mt-2 text-headline-lg font-bold text-amber-700">
                  {staffList.filter((s) => s.role === 'FIELD_OFFICER').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">ინსპექცია &amp; ვიზიტები</div>
              </div>
            </div>

            {/* HR Quota Alert Summary Bar */}
            {(overallQuotaStats.criticalQuotaCount > 0 ||
              overallQuotaStats.warningQuotaCount > 0 ||
              overallQuotaStats.bonusQuotaCount > 0) && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-xl">admin_panel_settings</span>
                  <span className="font-bold text-xs text-slate-900">
                    HR კვოტის შეტყობინებები გუნდზე:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {overallQuotaStats.criticalQuotaCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-bold shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">dangerous</span>
                      {overallQuotaStats.criticalQuotaCount} თანამშრომელი კრიტიკულ ზღვარზე (≥3)
                    </span>
                  )}
                  {overallQuotaStats.warningQuotaCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-bold shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {overallQuotaStats.warningQuotaCount} თანამშრომელი შენიშვნის ზღვარზე (≥5)
                    </span>
                  )}
                  {overallQuotaStats.bonusQuotaCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">military_tech</span>
                      {overallQuotaStats.bonusQuotaCount} თანამშრომელი წარდგენილია ბონუსზე (≥10)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* MAIN SPLIT WORKSPACE: Employee Registry (Left) + Dossier Preview (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT/CENTER: Employee Registry */}
              <div className="xl:col-span-7 flex flex-col gap-4">
                <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                  {/* Department Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3 border-b border-border-subtle">
                    {[
                      { key: 'ALL', label: `ყველა (${staffList.length})` },
                      { key: 'ANALYST', label: `ანალიტიკოსები (${staffList.filter((s) => s.role === 'ANALYST').length})` },
                      { key: 'LEGAL', label: `იურისტები (${staffList.filter((s) => s.role === 'LEGAL').length})` },
                      { key: 'OPERATOR', label: `ქოლ-ცენტრი (${staffList.filter((s) => s.role === 'OPERATOR').length})` },
                      { key: 'FIELD_OFFICER', label: `ვიზიტორები (${staffList.filter((s) => s.role === 'FIELD_OFFICER').length})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDeptFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-body-sm font-medium shrink-0 transition-colors cursor-pointer ${
                          deptFilter === tab.key
                            ? 'bg-primary text-on-primary font-semibold'
                            : 'text-text-muted hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Employee Table */}
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F1F5F9] text-text-muted text-label-sm font-label-sm uppercase tracking-wider">
                          <th className="py-2.5 px-3">თანამშრომელი</th>
                          <th className="py-2.5 px-3">პოზიცია &amp; დეპარტამენტი</th>
                          <th className="py-2.5 px-3">კონტაქტი</th>
                          <th className="py-2.5 px-3 text-center">სტატუსი</th>
                          <th className="py-2.5 px-3 text-right">ქმედებები</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-body-sm font-body-sm">
                        {loadingStaff && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-text-muted">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              თანამშრომლები იტვირთება...
                            </td>
                          </tr>
                        )}
                        {!loadingStaff && filteredStaff.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-text-muted">
                              თანამშრომლები არ მოიძებნა
                            </td>
                          </tr>
                        )}
                        {filteredStaff.map((staff) => {
                          const isSelected = selectedStaff?.id === staff.id;
                          const name = staff.staffProfile?.fullName || staff.email;
                          const quotas = getStaffQuotas(staff.recommendations || []);

                          return (
                            <tr
                              key={staff.id}
                              onClick={() => setSelectedStaff(staff)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#EFF6FF] border-l-4 border-l-primary'
                                  : 'hover:bg-surface-bg'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {name.substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-text-primary">{name}</span>
                                      {quotas.criticalTriggered && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                          <span className="material-symbols-outlined text-[11px]">dangerous</span>
                                          {quotas.critical} კრიტიკული
                                        </span>
                                      )}
                                      {quotas.warningTriggered && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                          <span className="material-symbols-outlined text-[11px]">warning</span>
                                          {quotas.warning} შენიშვნა
                                        </span>
                                      )}
                                      {quotas.positiveTriggered && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <span className="material-symbols-outlined text-[11px]">military_tech</span>
                                          ბონუსი ({quotas.positive})
                                        </span>
                                      )}
                                      {quotas.neutralTriggered && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                          10 საშუალო
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="font-label-sm text-label-sm text-text-muted font-mono">
                                        {staff.personalId}
                                      </span>
                                      {quotas.total > 0 && !quotas.criticalTriggered && !quotas.warningTriggered && !quotas.positiveTriggered && !quotas.neutralTriggered && (
                                        <span className="text-[10px] text-slate-500 font-medium">
                                          • {quotas.total} შეფასება
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-text-primary">{roleTitlesKa[staff.role] || staff.role}</span>
                                  <span className="text-text-muted text-[11px]">{staff.staffProfile?.department || 'დეპარტამენტი'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-label-sm text-label-sm">
                                <div className="flex flex-col">
                                  <span className="text-text-primary">{staff.phone || staff.email}</span>
                                  <span className="text-text-muted text-[11px]">{staff.email}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-mint/20 text-[#047857]">
                                  {staff.status === 'ACTIVE' ? 'აქტიური' : staff.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStaff(staff);
                                  }}
                                  className="p-1 rounded text-primary hover:bg-white shadow-xs cursor-pointer"
                                  title="დოსიეს ნახვა"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT: Selected Staff Dossier */}
              <div className="xl:col-span-5 flex flex-col gap-4">
                {selectedStaff ? (
                  <>
                    <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] border-b border-border-subtle">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {(selectedStaff.staffProfile?.fullName || selectedStaff.email).substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                              {selectedStaff.staffProfile?.fullName || selectedStaff.email}
                            </h2>
                            <span className="text-body-sm font-body-sm text-text-muted">
                              {roleTitlesKa[selectedStaff.role] || selectedStaff.role} • {selectedStaff.staffProfile?.department}
                            </span>
                            <span className="text-label-sm font-label-sm text-text-muted font-mono mt-0.5">
                              პ/ნ: {selectedStaff.personalId} | {selectedStaff.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-subtle/70 text-body-sm font-body-sm">
                        <div>
                          <span className="text-label-sm text-text-muted block">ტელეფონი:</span>
                          <span className="font-medium text-text-primary font-mono">{selectedStaff.phone || 'მითითებული არაა'}</span>
                        </div>
                        <div>
                          <span className="text-label-sm text-text-muted block">სისტემური როლი:</span>
                          <span className="font-medium text-primary font-semibold">{selectedStaff.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Address Snapshot */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-border-subtle text-xs space-y-1">
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">home</span>
                          მისამართის რეკვიზიტები
                        </div>
                        <p className="text-text-muted">
                          <strong>იურიდიული:</strong> {selectedStaff.staffProfile?.legalAddress || 'მითითებული არაა'}
                        </p>
                        <p className="text-text-muted">
                          <strong>ფაქტობრივი:</strong> {selectedStaff.staffProfile?.actualAddress || 'მითითებული არაა'}
                        </p>
                      </div>

                      {/* Contact Person Details */}
                      {selectedStaff.staffProfile?.contactPersons && selectedStaff.staffProfile.contactPersons.length > 0 ? (
                        <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-xs space-y-1">
                          <div className="font-semibold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">contact_emergency</span>
                            საკონტაქტო / სანდო პირი (მინდობილი)
                          </div>
                          {selectedStaff.staffProfile.contactPersons.map((cp: any, idx: number) => (
                            <div key={idx} className="pt-1 border-t border-blue-100 first:border-0 first:pt-0">
                              <p className="font-semibold text-slate-800">
                                {cp.firstName} {cp.lastName} ({cp.relationType})
                              </p>
                              <p className="text-slate-600 font-mono">ტელ: {cp.phone}</p>
                              {cp.email && <p className="text-slate-600">ელფოსტა: {cp.email}</p>}
                              {cp.address && <p className="text-slate-600">მისამართი: {cp.address}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border border-dashed border-border-subtle text-xs text-text-muted text-center">
                          საკონტაქტო პირი ჯერ არ არის დამატებული
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RECOMMENDATIONS & HR QUOTA MONITORING CARD */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[20px]">rate_review</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-text-primary">
                            ანალიტიკოსის შეფასებები & HR კვოტა
                          </h3>
                          <p className="text-[11px] text-text-muted">
                            კვოტები: 3 კრიტიკული • 5 შენიშვნა • 10 საშუალო • 10 დადებითი
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {selectedQuotas.total} შეფასება
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* 4 Quota Threshold Cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* 1. Critical Quota (Limit: 3) */}
                        <div
                          className={`p-3 rounded-lg border transition ${
                            selectedQuotas.criticalTriggered
                              ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30'
                              : 'bg-slate-50 border-border-subtle'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-rose-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">dangerous</span>
                              კრიტიკული
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                selectedQuotas.criticalTriggered ? 'text-rose-700' : 'text-slate-600'
                              }`}
                            >
                              {selectedQuotas.critical} / 3
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedQuotas.criticalTriggered ? 'bg-rose-600' : 'bg-rose-400'
                              }`}
                              style={{ width: `${Math.min(100, (selectedQuotas.critical / 3) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                            {selectedQuotas.criticalTriggered
                              ? '🚨 დისციპლინური კვოტა გადაჭარბებულია!'
                              : `დარჩენილია ${Math.max(0, 3 - selectedQuotas.critical)} კრიტიკული`}
                          </span>
                        </div>

                        {/* 2. Warning Quota (Limit: 5) */}
                        <div
                          className={`p-3 rounded-lg border transition ${
                            selectedQuotas.warningTriggered
                              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30'
                              : 'bg-slate-50 border-border-subtle'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">warning</span>
                              შენიშვნა
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                selectedQuotas.warningTriggered ? 'text-amber-700' : 'text-slate-600'
                              }`}
                            >
                              {selectedQuotas.warning} / 5
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedQuotas.warningTriggered ? 'bg-amber-600' : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.min(100, (selectedQuotas.warning / 5) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                            {selectedQuotas.warningTriggered
                              ? '⚠️ გადამზადების კვოტა გადაჭარბებულია!'
                              : `დარჩენილია ${Math.max(0, 5 - selectedQuotas.warning)} შენიშვნა`}
                          </span>
                        </div>

                        {/* 3. Neutral Quota (Limit: 10) */}
                        <div
                          className={`p-3 rounded-lg border transition ${
                            selectedQuotas.neutralTriggered
                              ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/30'
                              : 'bg-slate-50 border-border-subtle'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-blue-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">trending_flat</span>
                              საშუალო
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                selectedQuotas.neutralTriggered ? 'text-blue-700' : 'text-slate-600'
                              }`}
                            >
                              {selectedQuotas.neutral} / 10
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedQuotas.neutralTriggered ? 'bg-blue-600' : 'bg-blue-400'
                              }`}
                              style={{ width: `${Math.min(100, (selectedQuotas.neutral / 10) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                            {selectedQuotas.neutralTriggered
                              ? '🟡 მოტივაციის ლიმიტი მიღწეულია'
                              : `დარჩენილია ${Math.max(0, 10 - selectedQuotas.neutral)} საშუალო`}
                          </span>
                        </div>

                        {/* 4. Positive Quota (Limit: 10) */}
                        <div
                          className={`p-3 rounded-lg border transition ${
                            selectedQuotas.positiveTriggered
                              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30'
                              : 'bg-slate-50 border-border-subtle'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">military_tech</span>
                              დადებითი
                            </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                selectedQuotas.positiveTriggered ? 'text-emerald-700' : 'text-slate-600'
                              }`}
                            >
                              {selectedQuotas.positive} / 10
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedQuotas.positiveTriggered ? 'bg-emerald-600' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, (selectedQuotas.positive / 10) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                            {selectedQuotas.positiveTriggered
                              ? '🌟 ეკუთვნის ბონუსი / დაწინაურება!'
                              : `დარჩენილია ${Math.max(0, 10 - selectedQuotas.positive)} დადებითი`}
                          </span>
                        </div>
                      </div>

                      {/* Active Quota Action Alerts Banners */}
                      {selectedQuotas.activeAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-2xs animate-fadeIn ${alert.bgClass} ${alert.borderClass}`}
                        >
                          <span className={`material-symbols-outlined text-[24px] shrink-0 ${alert.textClass}`}>
                            {alert.icon}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-xs font-bold ${alert.textClass}`}>{alert.title}</h4>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/80 shadow-2xs">
                                {alert.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">{alert.description}</p>
                            <div className="text-[11px] font-semibold text-slate-900 pt-1.5 border-t border-black/5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-primary">task_alt</span>
                              <span>{alert.action}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Chronological List of Recommendations */}
                      <div className="space-y-2 pt-2 border-t border-border-subtle">
                        <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">history</span>
                            მიღებული შეფასებების რეესტრი
                          </span>
                          <span className="text-text-muted font-normal text-[11px]">
                            {selectedStaff.recommendations?.length || 0} ჩანაწერი
                          </span>
                        </div>

                        {(!selectedStaff.recommendations || selectedStaff.recommendations.length === 0) ? (
                          <div className="p-6 rounded-lg border border-dashed border-border-subtle text-center text-xs text-text-muted">
                            <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">chat</span>
                            თანამშრომელზე ანალიტიკოსის შეფასება ჯერ არ დაფიქსირებულა
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                            {selectedStaff.recommendations.map((rec: any) => {
                              const badge = getRecommendationBadge(rec.rating);
                              const dateStr = new Date(rec.createdAt).toLocaleDateString('ka-GE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              return (
                                <div
                                  key={rec.id}
                                  className="p-3 rounded-lg border border-border-subtle bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5 text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                                    >
                                      <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                                      {badge.label}
                                    </span>
                                    <span className="text-[10px] text-text-muted font-mono">{dateStr}</span>
                                  </div>

                                  {rec.title && (
                                    <h5 className="font-bold text-slate-900 text-xs">{rec.title}</h5>
                                  )}

                                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                                    {rec.notes}
                                  </p>

                                  {(rec.actionRequired || rec.recommendedAction) && (
                                    <div className="p-2 rounded bg-blue-50/80 border border-blue-200 text-blue-900 text-[11px] font-medium flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-sm text-primary">bolt</span>
                                      <span>რეკომენდებული ნაბიჯი: {rec.recommendedAction || 'აუცილებელი რეაგირება'}</span>
                                    </div>
                                  )}

                                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                    <span>ავტორი: <strong className="text-slate-600">{rec.authorName}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                  <div className="p-12 bg-surface-card rounded-xl border border-border-subtle text-center text-text-muted">
                    აირჩიეთ თანამშრომელი დოსიეს სანახავად
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* REGISTER EMPLOYEE MODAL */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="text-headline-sm font-bold text-text-primary">ახალი თანამშრომლის რეგისტრაცია</h3>
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-text-muted cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleRegisterEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">სახელი *</label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="მაგ: გიორგი"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">გვარი *</label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="მაგ: ბერიძე"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">პირადი ნომერი (11 ნიშნა) *</label>
                    <input
                      type="text"
                      required
                      value={newPersonalId}
                      onChange={(e) => setNewPersonalId(e.target.value)}
                      placeholder="01019012345"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">ელ. ფოსტა *</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="employee@debitinfo.ge"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">ტელეფონი</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">როლი *</label>
                    <select
                      value={newRole}
                      onChange={(e: any) => {
                        const r = e.target.value;
                        setNewRole(r);
                        if (r === 'ANALYST') setNewDepartment('რისკების ანალიტიკა & რეესტრი');
                        else if (r === 'LEGAL') setNewDepartment('იურიდიული დეპარტამენტი');
                        else if (r === 'OPERATOR') setNewDepartment('ქოლ-ცენტრი & მოლაპარაკებები');
                        else if (r === 'FIELD_OFFICER') setNewDepartment('საველე მონიტორინგი & ინსპექცია');
                      }}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    >
                      <option value="OPERATOR">კრედიტ მენეჯერი</option>
                      <option value="ANALYST">ფინანსური ანალიტიკოსი</option>
                      <option value="LEGAL">იურისტი</option>
                      <option value="FIELD_OFFICER">საველე ვიზიტორი</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">იურიდიული მისამართი</label>
                  <input
                    type="text"
                    value={newLegalAddress}
                    onChange={(e) => setNewLegalAddress(e.target.value)}
                    placeholder="ქ. თბილისი, რუსთაველის გამზ. #1"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'რეგისტრირდება...' : 'დარეგისტრირება'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
