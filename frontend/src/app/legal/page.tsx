'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { authService, legalService } from '@/services';
import { DetailedLegalCase, LegalStats } from '@/types';
import LegalCaseModal from '@/components/legal/LegalCaseModal';
import LegalChartStudioModal from '@/components/legal/LegalChartStudioModal';

type WorkflowTab = 'all' | 'court' | 'lawsuit' | 'completed';
type EntityTab = 'ALL' | 'PHYSICAL' | 'LEGAL';

interface LegalFiltersState {
  search: string;
  caseNumber: string;
  identification: string;
  debtorName: string;
  directorName: string;
  phone: string;
  email: string;
  creditorName: string;
  legalAddress: string;
  actualAddress: string;
  stage: string;
  priority: string;
  rating: string;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: LegalFiltersState = {
  search: '',
  caseNumber: '',
  identification: '',
  debtorName: '',
  directorName: '',
  phone: '',
  email: '',
  creditorName: '',
  legalAddress: '',
  actualAddress: '',
  stage: 'ALL',
  priority: 'ALL',
  rating: 'ALL',
  minAmount: '',
  maxAmount: '',
  dateFrom: '',
  dateTo: '',
};

const STAGE_OPTIONS = [
  { value: 'ALL', label: 'ყველა სამართლებრივი ეტაპი' },
  { value: 'OFFICIAL_WARNING', label: 'ოფიციალური გაფრთხილება' },
  { value: 'LAWSUIT_PREPARATION', label: 'სარჩელის მომზადება' },
  { value: 'COURT_PROCEEDINGS', label: 'სასამართლო წარმოება' },
  { value: 'SETTLEMENT', label: 'მორიგების ეტაპი' },
  { value: 'ENFORCEMENT', label: 'სააღსრულებო ფურცელი' },
  { value: 'CLOSED', label: 'დასრულებული' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'ყველა პრიორიტეტი' },
  { value: 'HIGH', label: 'მაღალი (HIGH)' },
  { value: 'MEDIUM', label: 'საშუალო (MEDIUM)' },
  { value: 'LOW', label: 'დაბალი (LOW)' },
];

const RATING_OPTIONS = ['ALL', 'A', 'B', 'C', 'D', 'E'];

function getStageBadge(stage: string) {
  switch (stage) {
    case 'LAWSUIT_PREPARATION':
      return {
        label: 'სარჩელის მომზადება',
        cls: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'OFFICIAL_WARNING':
      return {
        label: 'ოფიციალური გაფრთხილება',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'COURT_PROCEEDINGS':
      return {
        label: 'სასამართლო წარმოება',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-600',
      };
    case 'SETTLEMENT':
      return {
        label: 'მორიგების ეტაპი',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'ENFORCEMENT':
      return {
        label: 'სააღსრულებო ფურცელი',
        cls: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-600',
      };
    case 'CLOSED':
      return {
        label: 'დასრულებული',
        cls: 'bg-slate-100 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: stage || 'უცნობი',
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'მაღალი',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'MEDIUM':
      return {
        label: 'საშუალო',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'LOW':
      return {
        label: 'დაბალი',
        cls: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    default:
      return {
        label: priority || 'სტანდარტული',
        cls: 'bg-slate-100 text-slate-600 border-slate-200',
      };
  }
}

function getRatingBadgeClass(rating: string): string {
  const grade = (rating || 'E').toUpperCase();
  if (grade === 'A') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (grade === 'B') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (grade === 'C') return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function splitPersonName(c: DetailedLegalCase): { firstName: string; lastName: string } {
  if (c.debtor.firstName || c.debtor.lastName) {
    return {
      firstName: c.debtor.firstName || '—',
      lastName: c.debtor.lastName || '—',
    };
  }
  const parts = (c.debtor.name || '').trim().split(/\s+/);
  return {
    firstName: parts[0] || '—',
    lastName: parts.slice(1).join(' ') || '—',
  };
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().split('T')[0];
}

function matchesLegalFilters(c: DetailedLegalCase, f: LegalFiltersState): boolean {
  const q = f.search.trim().toLowerCase();
  if (q) {
    const haystack = [
      c.caseNumber,
      c.courtCaseNumber,
      c.claimCaseNumber,
      c.agreementNumber,
      c.debtor.name,
      c.debtor.firstName,
      c.debtor.lastName,
      c.debtor.identification,
      c.debtor.phone,
      c.debtor.email,
      c.debtor.directorName,
      c.debtor.legalAddress,
      c.debtor.actualAddress,
      c.creditorName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (f.caseNumber.trim()) {
    const target = f.caseNumber.trim().toLowerCase();
    const casesStr = [c.caseNumber, c.courtCaseNumber, c.claimCaseNumber]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!casesStr.includes(target)) return false;
  }

  if (f.identification.trim() && !c.debtor.identification.toLowerCase().includes(f.identification.trim().toLowerCase())) {
    return false;
  }
  if (f.debtorName.trim() && !c.debtor.name.toLowerCase().includes(f.debtorName.trim().toLowerCase())) {
    return false;
  }
  if (f.directorName.trim() && !(c.debtor.directorName || '').toLowerCase().includes(f.directorName.trim().toLowerCase())) {
    return false;
  }
  if (
    f.phone.trim() &&
    !(c.debtor.phone || '').toLowerCase().includes(f.phone.trim().toLowerCase()) &&
    !(c.debtor.directorPhone || '').toLowerCase().includes(f.phone.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    f.email.trim() &&
    !(c.debtor.email || '').toLowerCase().includes(f.email.trim().toLowerCase()) &&
    !(c.debtor.directorEmail || '').toLowerCase().includes(f.email.trim().toLowerCase())
  ) {
    return false;
  }
  if (f.creditorName.trim() && !(c.creditorName || '').toLowerCase().includes(f.creditorName.trim().toLowerCase())) {
    return false;
  }
  if (f.legalAddress.trim() && !(c.debtor.legalAddress || '').toLowerCase().includes(f.legalAddress.trim().toLowerCase())) {
    return false;
  }
  if (f.actualAddress.trim() && !(c.debtor.actualAddress || '').toLowerCase().includes(f.actualAddress.trim().toLowerCase())) {
    return false;
  }
  if (f.stage !== 'ALL' && c.stage !== f.stage) {
    return false;
  }
  if (f.priority !== 'ALL' && c.priority !== f.priority) {
    return false;
  }
  if (f.rating !== 'ALL' && (c.amounts.riskRating || '').toUpperCase() !== f.rating) {
    return false;
  }

  const amount = Number(c.amounts.totalClaim || 0);
  if (f.minAmount.trim() !== '' && !Number.isNaN(Number(f.minAmount)) && amount < Number(f.minAmount)) {
    return false;
  }
  if (f.maxAmount.trim() !== '' && !Number.isNaN(Number(f.maxAmount)) && amount > Number(f.maxAmount)) {
    return false;
  }

  const dateStr = formatShortDate(c.debtOriginationDate || c.createdAt);
  if (f.dateFrom && dateStr !== '—' && dateStr < f.dateFrom) {
    return false;
  }
  if (f.dateTo && dateStr !== '—' && dateStr > f.dateTo) {
    return false;
  }

  return true;
}

function buildExcelRows(list: DetailedLegalCase[]) {
  return list.map((c, idx) => {
    const stageInfo = getStageBadge(c.stage);
    const priorityInfo = getPriorityBadge(c.priority);
    const { firstName, lastName } = splitPersonName(c);
    return {
      '#': idx + 1,
      'საქმის N': c.caseNumber,
      'სასამართლოს N': c.courtCaseNumber || '—',
      'ტიპი': c.debtor.isCompany ? 'იურიდიული პირი' : 'ფიზიკური პირი',
      'პ/ნ ან ს/კ': c.debtor.identification,
      'მოვალე / კომპანია': c.debtor.name,
      'სახელი': c.debtor.isCompany ? '—' : firstName,
      'გვარი': c.debtor.isCompany ? '—' : lastName,
      'დირექტორი': c.debtor.directorName || '—',
      'დირექტორის პ/ნ': c.debtor.directorPin || '—',
      'ტელეფონი': c.debtor.phone || c.debtor.directorPhone || '—',
      'ელ-ფოსტა': c.debtor.email || c.debtor.directorEmail || '—',
      'იურიდიული მისამართი': c.debtor.legalAddress || '—',
      'ფაქტობრივი მისამართი': c.debtor.actualAddress || '—',
      'კრედიტორი': c.creditorName || '—',
      'სადავო დავალიანება (₾)': Number(c.amounts.totalClaim || 0),
      'ძირი თანხა (₾)': Number(c.amounts.principalAmount || 0),
      'ჯარიმა / საურავი (₾)': Number(c.amounts.penaltyAmount || 0),
      'ვადაგადაცილება (დღე)': Number(c.amounts.daysOverdue || 0),
      'წარმოქმნის თარიღი': formatShortDate(c.debtOriginationDate || c.createdAt),
      'სამართლებრივი ეტაპი': stageInfo.label,
      'პრიორიტეტი': priorityInfo.label,
      'რეიტინგი': `Grade ${c.amounts.riskRating || 'E'}`,
      'მომდევნო სხდომა': formatShortDate(c.nextHearingDate),
      'სააღსრულებო ფურცელი': c.executionSheetNumber || '—',
    };
  });
}

export default function LegalPortalPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>('all');
  const [entityTab, setEntityTab] = useState<EntityTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<DetailedLegalCase[]>([]);
  const [stats, setStats] = useState<LegalStats | null>(null);

  const [filters, setFilters] = useState<LegalFiltersState>(INITIAL_FILTERS);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [modalCase, setModalCase] = useState<DetailedLegalCase | null>(null);
  const [isChartStudioOpen, setIsChartStudioOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (!u) {
          router.push('/ops?redirect=/legal');
          return;
        }
        if (u.role !== 'LEGAL' && u.role !== 'ADMIN') {
          router.push(authService.getPortalRouteForRole(u.role));
          return;
        }
        setUser(u);
      } catch {
        router.push('/ops?redirect=/legal');
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, casesRes] = await Promise.all([
        legalService.getStats(),
        legalService.getCases({ tab: workflowTab }),
      ]);
      setStats(statsRes);
      setCases(casesRes);
    } catch (err) {
      console.error('Failed to fetch legal portal data', err);
    } finally {
      setLoading(false);
    }
  }, [workflowTab]);

  useEffect(() => {
    if (!authChecking) {
      fetchDashboardData();
    }
  }, [authChecking, fetchDashboardData]);

  // Clear invalid selections when cases list reloads
  useEffect(() => {
    const validSet = new Set(cases.map((c) => c.id));
    setSelectedCaseIds((prev) => prev.filter((id) => validSet.has(id)));
  }, [cases]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/ops');
  };

  const physicalCount = useMemo(() => cases.filter((c) => !c.debtor.isCompany).length, [cases]);
  const legalCount = useMemo(() => cases.filter((c) => c.debtor.isCompany).length, [cases]);

  const totalRegistryDebt = useMemo(
    () => cases.reduce((sum, c) => sum + Number(c.amounts.totalClaim || 0), 0),
    [cases],
  );

  const entityBaseList = useMemo(() => {
    if (entityTab === 'PHYSICAL') return cases.filter((c) => !c.debtor.isCompany);
    if (entityTab === 'LEGAL') return cases.filter((c) => c.debtor.isCompany);
    return cases;
  }, [cases, entityTab]);

  const filteredCases = useMemo(
    () => entityBaseList.filter((c) => matchesLegalFilters(c, filters)),
    [entityBaseList, filters],
  );

  const filteredTotalAmount = useMemo(
    () => filteredCases.reduce((sum, c) => sum + Number(c.amounts.totalClaim || 0), 0),
    [filteredCases],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.caseNumber.trim()) count++;
    if (filters.identification.trim()) count++;
    if (filters.debtorName.trim()) count++;
    if (filters.directorName.trim()) count++;
    if (filters.phone.trim()) count++;
    if (filters.email.trim()) count++;
    if (filters.creditorName.trim()) count++;
    if (filters.legalAddress.trim()) count++;
    if (filters.actualAddress.trim()) count++;
    if (filters.stage !== 'ALL') count++;
    if (filters.priority !== 'ALL') count++;
    if (filters.rating !== 'ALL') count++;
    if (filters.minAmount.trim()) count++;
    if (filters.maxAmount.trim()) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const selectedCasesList = useMemo(() => {
    if (selectedCaseIds.length === 0) return [];
    const selectedSet = new Set(selectedCaseIds);
    return filteredCases.filter((c) => selectedSet.has(c.id));
  }, [filteredCases, selectedCaseIds]);

  const allFilteredSelected =
    filteredCases.length > 0 && filteredCases.every((c) => selectedCaseIds.includes(c.id));

  const toggleSelectCase = (id: string) => {
    setSelectedCaseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredCases.map((c) => c.id);
    if (allFilteredSelected) {
      const dropSet = new Set(filteredIds);
      setSelectedCaseIds((prev) => prev.filter((id) => !dropSet.has(id)));
    } else {
      setSelectedCaseIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const clearSelection = () => setSelectedCaseIds([]);

  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const updateFilter = <K extends keyof LegalFiltersState>(key: K, value: LegalFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopyId = (e: React.MouseEvent, idText: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId((prev) => (prev === idText ? null : prev)), 1500);
  };

  const exportCasesToExcel = (targetList: DetailedLegalCase[], customName?: string) => {
    if (targetList.length === 0) {
      alert('ექსპორტისთვის ჩანაწერები არ მოიძებნა.');
      return;
    }
    const rows = buildExcelRows(targetList);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'იურიდიული საქმეები');
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = customName || `debitinfo_legal_registry_${dateStamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleCaseUpdated = (updated: DetailedLegalCase) => {
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setModalCase(updated);
    legalService.getStats().then(setStats).catch(() => {});
  };

  const entityLabel =
    entityTab === 'PHYSICAL'
      ? 'ფიზიკური პირები'
      : entityTab === 'LEGAL'
        ? 'იურიდიული პირები'
        : 'ყველა ჩანაწერი';

  if (authChecking) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-3">
          sync
        </span>
        <p className="text-sm font-semibold text-text-secondary">
          იურიდიული პორტალის ავტორიზაციის შემოწმება...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-main text-text-primary min-h-screen flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-surface-card border-b border-border-subtle px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-9 bg-primary text-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-hover transition-colors">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none text-text-primary">
                Debitinfo.GE
              </span>
              <span className="text-[11px] font-medium text-text-muted">
                იურიდიული დეპარტამენტის პორტალი
              </span>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 ml-2 bg-slate-100/80 p-1 rounded-lg border border-border-subtle">
            <button
              onClick={() => setWorkflowTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                workflowTab === 'all'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              ყველა საქმე ({stats?.countsByStage?.all ?? cases.length})
            </button>
            <button
              onClick={() => setWorkflowTab('court')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                workflowTab === 'court'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              სასამართლო ({stats?.countsByStage?.court ?? 0})
            </button>
            <button
              onClick={() => setWorkflowTab('lawsuit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                workflowTab === 'lawsuit'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              სარჩელის მომზადება ({stats?.countsByStage?.lawsuit ?? 0})
            </button>
            <button
              onClick={() => setWorkflowTab('completed')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                workflowTab === 'completed'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              დასრულებული ({stats?.countsByStage?.closed ?? 0})
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="სწრაფი ძიება: საქმე, პ/ნ, ს/კ, მოვალე..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-border-subtle rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-muted"
            />
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-primary">
                {user?.name || 'მთავარი იურისტი'}
              </p>
              <p className="text-[11px] text-text-muted">
                {user?.role === 'ADMIN' ? 'HR / სისტემური ადმინისტრატორი' : 'სასამართლო წარმომადგენლობა'}
              </p>
            </div>
            <div className="size-9 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs border border-blue-200">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'იუ'}
            </div>
            <button
              onClick={handleLogout}
              title="სისტემიდან გასვლა"
              className="p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Workflow KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                აქტიური იურიდიული საქმეები
              </p>
              <p className="text-2xl font-extrabold text-text-primary mt-1 font-mono">
                {stats?.activeCases ?? cases.length}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                ჯამური სადავო პორტფელი
              </p>
              <p className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
                {(stats?.totalDisputedAmount ?? totalRegistryDebt).toLocaleString('ka-GE')} ₾
              </p>
            </div>
            <div className="size-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                წარმატებული მორიგება
              </p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
                {stats?.successfulSettlementRate ?? 0}%
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">handshake</span>
            </div>
          </div>

          <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                გადაუდებელი ვადები / სხდომები
              </p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
                {stats?.urgentDeadlinesCount ?? 0}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">event_upcoming</span>
            </div>
          </div>
        </section>

        {/* Debtors-Registry-Aligned Legal Cases Registry Card */}
        <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm space-y-5">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="size-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[22px]">balance</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    იურიდიული საქმეების რეესტრი
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-mono">
                    {cases.length} სულ საქმე
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
                    სადავო ჯამი: {totalRegistryDebt.toLocaleString('ka-GE')} ₾
                  </span>
                </div>
                <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                  იურიდიული დავების, სარჩელებისა და მოვალეთა მონაცემების ერთიანი რეესტრი (ფიზიკური და იურიდიული პირები)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-border-subtle text-xs font-semibold text-text-secondary">
                <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                ფიზიკური: <strong className="font-mono text-text-primary">{physicalCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-border-subtle text-xs font-semibold text-text-secondary">
                <span className="material-symbols-outlined text-[15px] text-indigo-600">business</span>
                იურიდიული: <strong className="font-mono text-text-primary">{legalCount}</strong>
              </span>
            </div>
          </div>

          {/* Mobile/Tablet Workflow Switch */}
          <div className="flex xl:hidden flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-border-subtle">
            {([
              { id: 'all', label: `ყველა (${stats?.countsByStage?.all ?? cases.length})` },
              { id: 'court', label: `სასამართლო (${stats?.countsByStage?.court ?? 0})` },
              { id: 'lawsuit', label: `სარჩელი (${stats?.countsByStage?.lawsuit ?? 0})` },
              { id: 'completed', label: `დასრულებული (${stats?.countsByStage?.closed ?? 0})` },
            ] as Array<{ id: WorkflowTab; label: string }>).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setWorkflowTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workflowTab === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Debtors-Registry Style Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
            {/* Entity Switcher */}
            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-border-subtle shadow-2xs">
              <button
                onClick={() => {
                  setEntityTab('ALL');
                  clearSelection();
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  entityTab === 'ALL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">layers</span>
                <span>ყველა</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    entityTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cases.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setEntityTab('PHYSICAL');
                  clearSelection();
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  entityTab === 'PHYSICAL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>ფიზიკური პირები</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    entityTab === 'PHYSICAL'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {physicalCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setEntityTab('LEGAL');
                  clearSelection();
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  entityTab === 'LEGAL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>იურიდიული პირები</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    entityTab === 'LEGAL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {legalCount}
                </span>
              </button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 px-1">
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[17px]">
                  search
                </span>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="ძიება (საქმე, სახელი, პ/ნ, კრედიტორი)..."
                  className="w-full h-9 pl-9 pr-3 bg-white border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-text-muted"
                />
              </div>

              <button
                onClick={() => setShowFilterDrawer((prev) => !prev)}
                className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showFilterDrawer || activeFiltersCount > 0
                    ? 'bg-blue-50 text-primary border-blue-200 shadow-2xs'
                    : 'bg-white text-text-secondary border-border-subtle hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">tune</span>
                <span>ფილტრები</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-mono">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                  <span>გასუფთავება</span>
                </button>
              )}

              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="h-9 px-3.5 rounded-xl bg-white border border-border-subtle text-text-secondary hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}
                >
                  refresh
                </span>
                <span>განახლება</span>
              </button>

              <button
                onClick={() => setIsChartStudioOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">bar_chart</span>
                <span>
                  {selectedCasesList.length > 0
                    ? `გრაფიკის აგება (${selectedCasesList.length})`
                    : 'გრაფიკების სტუდია'}
                </span>
              </button>

              <button
                onClick={() =>
                  exportCasesToExcel(
                    selectedCasesList.length > 0 ? selectedCasesList : filteredCases,
                  )
                }
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">download</span>
                <span>
                  {selectedCasesList.length > 0
                    ? `მონიშნულის ექსპორტი (${selectedCasesList.length})`
                    : 'Excel ექსპორტი (.xlsx)'}
                </span>
              </button>
            </div>
          </div>

          {/* Expandable Multi-Parameter Filter Panel */}
          {showFilterDrawer && (
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    manage_search
                  </span>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    მრავალპარამეტრიანი იურიდიული ფილტრაცია
                  </h3>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  ყველა ფილტრის გასუფთავება
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    საქმის N / სასამართლოს N
                  </label>
                  <input
                    type="text"
                    value={filters.caseNumber}
                    onChange={(e) => updateFilter('caseNumber', e.target.value)}
                    placeholder="#LEG-2025..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    პირადი ნომერი (პ/ნ) ან ს/კ
                  </label>
                  <input
                    type="text"
                    value={filters.identification}
                    onChange={(e) => updateFilter('identification', e.target.value)}
                    placeholder="010... / 204..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    მოვალე / კომპანია
                  </label>
                  <input
                    type="text"
                    value={filters.debtorName}
                    onChange={(e) => updateFilter('debtorName', e.target.value)}
                    placeholder="სახელი ან შპს..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    კრედიტორი
                  </label>
                  <input
                    type="text"
                    value={filters.creditorName}
                    onChange={(e) => updateFilter('creditorName', e.target.value)}
                    placeholder="კრედიტორის სახელი..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    სამართლებრივი ეტაპი
                  </label>
                  <select
                    value={filters.stage}
                    onChange={(e) => updateFilter('stage', e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {STAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    პრიორიტეტი
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => updateFilter('priority', e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    რეიტინგი
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) => updateFilter('rating', e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {RATING_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r === 'ALL' ? 'ყველა რეიტინგი' : `Grade ${r}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    ტელეფონი
                  </label>
                  <input
                    type="text"
                    value={filters.phone}
                    onChange={(e) => updateFilter('phone', e.target.value)}
                    placeholder="+995..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    ელ-ფოსტა
                  </label>
                  <input
                    type="text"
                    value={filters.email}
                    onChange={(e) => updateFilter('email', e.target.value)}
                    placeholder="mail@..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    დირექტორი
                  </label>
                  <input
                    type="text"
                    value={filters.directorName}
                    onChange={(e) => updateFilter('directorName', e.target.value)}
                    placeholder="დირექტორის სახელი..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    იურიდიული მისამართი
                  </label>
                  <input
                    type="text"
                    value={filters.legalAddress}
                    onChange={(e) => updateFilter('legalAddress', e.target.value)}
                    placeholder="ქალაქი, ქუჩა..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    ფაქტობრივი მისამართი
                  </label>
                  <input
                    type="text"
                    value={filters.actualAddress}
                    onChange={(e) => updateFilter('actualAddress', e.target.value)}
                    placeholder="ფაქტობრივი მისამართი..."
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    სადავო თანხა (₾ -დან)
                  </label>
                  <input
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => updateFilter('minAmount', e.target.value)}
                    placeholder="0"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                    სადავო თანხა (₾ -მდე)
                  </label>
                  <input
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => updateFilter('maxAmount', e.target.value)}
                    placeholder="100000"
                    className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      თარიღი (-დან)
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilter('dateFrom', e.target.value)}
                      className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-[11px] outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      თარიღი (-მდე)
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilter('dateTo', e.target.value)}
                      className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-[11px] outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Selection Action Banner — exact match with Debtors Registry */}
          {selectedCaseIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs font-medium animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  check_circle
                </span>
                <span>
                  მონიშნულია <strong className="font-mono">{selectedCasesList.length}</strong>{' '}
                  ჩანაწერი ({entityLabel}) — სულ {filteredCases.length}-დან
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!allFilteredSelected && (
                  <button
                    onClick={toggleSelectAllFiltered}
                    className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-primary font-bold text-[11px] transition-all cursor-pointer"
                  >
                    ყველას მონიშვნა ({filteredCases.length})
                  </button>
                )}

                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[11px] transition-all cursor-pointer"
                >
                  მონიშვნის მოხსნა
                </button>

                {/* Shown ONLY when strictly 1 record is selected */}
                {selectedCaseIds.length === 1 && selectedCasesList.length === 1 && (
                  <button
                    onClick={() => setModalCase(selectedCasesList[0])}
                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">badge</span>
                    <span>საქმის ბარათი</span>
                  </button>
                )}

                <button
                  onClick={() => setIsChartStudioOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                  <span>გრაფიკის აგება ({selectedCasesList.length})</span>
                </button>

                <button
                  onClick={() => exportCasesToExcel(selectedCasesList)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span>მონიშნულის ექსპორტი ({selectedCasesList.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Registry Summary Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted px-1">
            <div className="flex items-center gap-2">
              <span>
                ნაჩვენებია <strong className="text-text-primary">{filteredCases.length}</strong>{' '}
                ჩანაწერი {entityBaseList.length}-დან
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary text-[11px] font-semibold">
                  ფილტრი აქტიურია ({activeFiltersCount})
                </span>
              )}
              <span className="hidden md:inline text-[11px] text-text-muted/80">
                • 1 ჩანაწერის მონიშვნისას ან ორმაგი კლიკით იხსნება საქმის ბარათი
              </span>
            </div>
            <div>
              ნაჩვენები სადავო დავალიანების ჯამი:{' '}
              <span className="font-mono font-bold text-rose-600 text-sm">
                {filteredTotalAmount.toLocaleString('ka-GE')} ₾
              </span>
            </div>
          </div>

          {/* Registry Horizontal Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-3 w-11 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      title="ყველას მონიშვნა"
                      className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>

                  {entityTab === 'ALL' && (
                    <>
                      <th className="py-3.5 px-3">პ/ნ ან ს/კ</th>
                      <th className="py-3.5 px-3">მოვალე / კომპანია</th>
                      <th className="py-3.5 px-3">ტელეფონი</th>
                      <th className="py-3.5 px-3">ელ-ფოსტა</th>
                      <th className="py-3.5 px-3">იურიდიული მისამართი</th>
                      <th className="py-3.5 px-3">კრედიტორი</th>
                      <th className="py-3.5 px-3">სადავო დავალიანება</th>
                      <th className="py-3.5 px-3">საქმის N</th>
                      <th className="py-3.5 px-3">სამართლებრივი ეტაპი</th>
                      <th className="py-3.5 px-3">პრიორიტეტი</th>
                      <th className="py-3.5 px-3">რეიტინგი</th>
                      <th className="py-3.5 px-3">სხდომა / ვადა</th>
                    </>
                  )}

                  {entityTab === 'PHYSICAL' && (
                    <>
                      <th className="py-3.5 px-3">პირადი ნომერი (პ/ნ)</th>
                      <th className="py-3.5 px-3">სახელი</th>
                      <th className="py-3.5 px-3">გვარი</th>
                      <th className="py-3.5 px-3">ტელეფონი</th>
                      <th className="py-3.5 px-3">ელ-ფოსტა</th>
                      <th className="py-3.5 px-3">იურიდიული მისამართი</th>
                      <th className="py-3.5 px-3">ფაქტობრივი მისამართი</th>
                      <th className="py-3.5 px-3">სადავო დავალიანება</th>
                      <th className="py-3.5 px-3">წარმოქმნის თარიღი</th>
                      <th className="py-3.5 px-3">კრედიტორი</th>
                      <th className="py-3.5 px-3">საქმის N</th>
                      <th className="py-3.5 px-3">სამართლებრივი ეტაპი</th>
                      <th className="py-3.5 px-3">რეიტინგი</th>
                      <th className="py-3.5 px-3">სხდომა / ვადა</th>
                    </>
                  )}

                  {entityTab === 'LEGAL' && (
                    <>
                      <th className="py-3.5 px-3">საიდენტიფიკაციო კოდი (ს/კ)</th>
                      <th className="py-3.5 px-3">დასახელება</th>
                      <th className="py-3.5 px-3">ტელეფონი</th>
                      <th className="py-3.5 px-3">ელ-ფოსტა</th>
                      <th className="py-3.5 px-3">დირექტორი</th>
                      <th className="py-3.5 px-3">დირექტორის პ/ნ</th>
                      <th className="py-3.5 px-3">იურიდიული მისამართი</th>
                      <th className="py-3.5 px-3">სადავო დავალიანება</th>
                      <th className="py-3.5 px-3">წარმოქმნის თარიღი</th>
                      <th className="py-3.5 px-3">კრედიტორი</th>
                      <th className="py-3.5 px-3">საქმის N</th>
                      <th className="py-3.5 px-3">სამართლებრივი ეტაპი</th>
                      <th className="py-3.5 px-3">რეიტინგი</th>
                      <th className="py-3.5 px-3">სხდომა / ვადა</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border-subtle text-xs bg-white">
                {loading && (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-2xl animate-spin text-primary block mx-auto mb-2">
                        sync
                      </span>
                      იურიდიული საქმეების რეესტრი იტვირთება...
                    </td>
                  </tr>
                )}

                {!loading && filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-3xl text-slate-300 block mx-auto mb-2">
                        folder_off
                      </span>
                      მითითებული ფილტრებით იურიდიული საქმეები ვერ მოიძებნა
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredCases.map((c) => {
                    const isSelected = selectedCaseIds.includes(c.id);
                    const stageBadge = getStageBadge(c.stage);
                    const priorityBadge = getPriorityBadge(c.priority);
                    const ratingCls = getRatingBadgeClass(c.amounts.riskRating);
                    const { firstName, lastName } = splitPersonName(c);
                    const displayPhone = c.debtor.phone || c.debtor.directorPhone;
                    const displayEmail = c.debtor.email || c.debtor.directorEmail;
                    const hearingOrDeadline = c.nextHearingDate || c.deadlineDate;

                    const idCell = (
                      <td className="py-3.5 px-3 font-mono font-semibold text-text-primary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{c.debtor.identification}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, c.debtor.identification)}
                            title="კოპირება"
                            className="p-1 rounded hover:bg-slate-100 text-text-muted hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {copiedId === c.debtor.identification ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </td>
                    );

                    const phoneCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap text-text-secondary font-mono">
                        {displayPhone ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              call
                            </span>
                            {displayPhone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    );

                    const emailCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap text-text-secondary">
                        {displayEmail ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              mail
                            </span>
                            {displayEmail}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    );

                    const creditorCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {c.creditorName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                            <span className="material-symbols-outlined text-[14px] text-slate-500">
                              account_balance
                            </span>
                            {c.creditorName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    );

                    const debtCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <p className="font-mono font-bold text-rose-600 text-[13px]">
                          {Number(c.amounts.totalClaim || 0).toLocaleString('ka-GE')} ₾
                        </p>
                        <p className="text-[10px] text-text-muted font-mono">
                          ძირი: {Number(c.amounts.principalAmount || 0).toLocaleString('ka-GE')} ₾ •{' '}
                          {c.amounts.daysOverdue} დღე
                        </p>
                      </td>
                    );

                    const originationDateCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-text-secondary">
                        {formatShortDate(c.debtOriginationDate || c.createdAt)}
                      </td>
                    );

                    const caseNumberCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-primary">#{c.caseNumber}</span>
                        {c.courtCaseNumber && (
                          <span className="block text-[10px] font-mono text-text-muted mt-0.5">
                            სასამ.: {c.courtCaseNumber}
                          </span>
                        )}
                      </td>
                    );

                    const stageCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stageBadge.cls}`}
                        >
                          <span className={`size-1.5 rounded-full ${stageBadge.dot}`} />
                          {stageBadge.label}
                        </span>
                      </td>
                    );

                    const ratingCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono ${ratingCls}`}
                        >
                          • Grade {c.amounts.riskRating || 'E'}
                        </span>
                      </td>
                    );

                    const deadlineCell = (
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {hearingOrDeadline ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            {formatShortDate(hearingOrDeadline)}
                          </span>
                        ) : (
                          <span className="text-text-muted text-[11px]">მიმდინარე</span>
                        )}
                      </td>
                    );

                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleSelectCase(c.id)}
                        onDoubleClick={() => setModalCase(c)}
                        className={`cursor-pointer transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-50/80 hover:bg-blue-100/70 font-medium'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td
                          className="py-3.5 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCase(c.id)}
                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>

                        {entityTab === 'ALL' && (
                          <>
                            {idCell}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-6 rounded-md flex items-center justify-center shrink-0 ${
                                    c.debtor.isCompany
                                      ? 'bg-indigo-50 text-indigo-600'
                                      : 'bg-blue-50 text-primary'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {c.debtor.isCompany ? 'domain' : 'person'}
                                  </span>
                                </span>
                                <div className="min-w-[160px]">
                                  <p className="font-bold text-text-primary leading-snug">
                                    {c.debtor.name}
                                  </p>
                                  {c.debtor.isCompany && c.debtor.directorName && (
                                    <p className="text-[11px] text-text-muted">
                                      დირ.: {c.debtor.directorName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            {phoneCell}
                            {emailCell}
                            <td className="py-3.5 px-3 min-w-[200px] text-text-secondary">
                              {c.debtor.legalAddress || '—'}
                            </td>
                            {creditorCell}
                            {debtCell}
                            {caseNumberCell}
                            {stageCell}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${priorityBadge.cls}`}
                              >
                                {priorityBadge.label}
                              </span>
                            </td>
                            {ratingCell}
                            {deadlineCell}
                          </>
                        )}

                        {entityTab === 'PHYSICAL' && (
                          <>
                            {idCell}
                            <td className="py-3.5 px-3 font-semibold text-text-primary whitespace-nowrap">
                              {firstName}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-text-primary whitespace-nowrap">
                              {lastName}
                            </td>
                            {phoneCell}
                            {emailCell}
                            <td className="py-3.5 px-3 min-w-[200px] text-text-secondary">
                              {c.debtor.legalAddress || '—'}
                            </td>
                            <td className="py-3.5 px-3 min-w-[200px] text-text-secondary">
                              {c.debtor.actualAddress || '—'}
                            </td>
                            {debtCell}
                            {originationDateCell}
                            {creditorCell}
                            {caseNumberCell}
                            {stageCell}
                            {ratingCell}
                            {deadlineCell}
                          </>
                        )}

                        {entityTab === 'LEGAL' && (
                          <>
                            {idCell}
                            <td className="py-3.5 px-3 font-bold text-text-primary min-w-[190px]">
                              {c.debtor.name}
                            </td>
                            {phoneCell}
                            {emailCell}
                            <td className="py-3.5 px-3 whitespace-nowrap text-text-primary font-medium">
                              {c.debtor.directorName || '—'}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap font-mono text-text-secondary">
                              {c.debtor.directorPin || '—'}
                            </td>
                            <td className="py-3.5 px-3 min-w-[200px] text-text-secondary">
                              {c.debtor.legalAddress || '—'}
                            </td>
                            {debtCell}
                            {originationDateCell}
                            {creditorCell}
                            {caseNumberCell}
                            {stageCell}
                            {ratingCell}
                            {deadlineCell}
                          </>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border-subtle bg-surface-card text-[11px] text-text-muted flex flex-wrap justify-between items-center gap-2">
        <span>© 2026 Debitinfo.GE იურიდიული დეპარტამენტის სისტემა</span>
        <span className="font-mono text-slate-400">
          Legal Registry Unified Architecture • Real PostgreSQL Data
        </span>
      </footer>

      {/* Case File Modal ("საქმის ბარათი") — opens on single-record selection button or row double click */}
      <LegalCaseModal
        legalCase={modalCase}
        onClose={() => setModalCase(null)}
        onCaseUpdated={handleCaseUpdated}
        onExportSingle={(c) => exportCasesToExcel([c], `legal_case_${c.caseNumber}.xlsx`)}
      />

      {/* Chart Studio Modal ("გრაფიკების სტუდია") */}
      <LegalChartStudioModal
        isOpen={isChartStudioOpen}
        items={selectedCasesList.length > 0 ? selectedCasesList : filteredCases}
        onClose={() => setIsChartStudioOpen(false)}
      />
    </div>
  );
}
