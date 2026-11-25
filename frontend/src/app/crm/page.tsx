'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { blogService, authService, crmBackendService } from '@/services';
import { BlogPost } from '@/types';
import CrmCaseModal, { CrmModalTab } from '@/components/crm/CrmCaseModal';
import CrmChartStudioModal from '@/components/crm/CrmChartStudioModal';

type CrmTab = 'calls' | 'blog';
type EntityTab = 'ALL' | 'PHYSICAL' | 'LEGAL';

interface CrmFiltersState {
  search: string;
  caseNumber: string;
  personalId: string;
  debtorName: string;
  creditorName: string;
  phone: string;
  directorName: string;
  address: string;
  disposition: string;
  priority: 'ALL' | 'HIGH' | 'CALLBACK';
  rating: string;
  scheduleFilter: 'ALL' | 'HAS_SCHEDULE' | 'NO_SCHEDULE';
  minAmount: string;
  maxAmount: string;
  minOverdue: string;
  maxOverdue: string;
}

const INITIAL_CRM_FILTERS: CrmFiltersState = {
  search: '',
  caseNumber: '',
  personalId: '',
  debtorName: '',
  creditorName: '',
  phone: '',
  directorName: '',
  address: '',
  disposition: 'ALL',
  priority: 'ALL',
  rating: 'ALL',
  scheduleFilter: 'ALL',
  minAmount: '',
  maxAmount: '',
  minOverdue: '',
  maxOverdue: '',
};

const DISPOSITION_LABELS: Record<string, { label: string; cls: string }> = {
  PROMISE_TO_PAY: {
    label: 'დათანხმდა',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CALLBACK: {
    label: 'გადარეკვა',
    cls: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  VOICEMAIL: {
    label: 'მიუწვდომელი',
    cls: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  REFUSED: {
    label: 'უარი',
    cls: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  DISPUTE_RAISED: {
    label: 'სადავო',
    cls: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  WRONG_NUMBER: {
    label: 'შეცვლილია',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

function getRatingBadgeClass(rating?: string): string {
  const grade = (rating || 'E').toUpperCase();
  if (grade === 'A') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (grade === 'B') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (grade === 'C') return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function splitPersonName(item: any): { firstName: string; lastName: string } {
  if (item.firstName || item.lastName) {
    return { firstName: item.firstName || '—', lastName: item.lastName || '—' };
  }
  const parts = String(item.debtorName || '').trim().split(/\s+/);
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

function matchesCrmFilters(item: any, f: CrmFiltersState): boolean {
  const q = f.search.trim().toLowerCase();
  if (q) {
    const haystack = [
      item.caseNumber,
      item.agreementNumber,
      item.debtorName,
      item.debtorPersonalId,
      item.debtorPhone,
      item.debtorEmail,
      item.creditorName,
      item.directorName,
      item.legalAddress,
      item.actualAddress,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (f.caseNumber.trim()) {
    const cStr = `${item.caseNumber || ''} ${item.agreementNumber || ''}`.toLowerCase();
    if (!cStr.includes(f.caseNumber.trim().toLowerCase())) return false;
  }
  if (
    f.personalId.trim() &&
    !String(item.debtorPersonalId || '').toLowerCase().includes(f.personalId.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    f.debtorName.trim() &&
    !String(item.debtorName || '').toLowerCase().includes(f.debtorName.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    f.creditorName.trim() &&
    !String(item.creditorName || '').toLowerCase().includes(f.creditorName.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    f.phone.trim() &&
    !String(item.debtorPhone || '').toLowerCase().includes(f.phone.trim().toLowerCase())
  ) {
    return false;
  }
  if (
    f.directorName.trim() &&
    !String(item.directorName || '').toLowerCase().includes(f.directorName.trim().toLowerCase())
  ) {
    return false;
  }
  if (f.address.trim()) {
    const addr = `${item.legalAddress || ''} ${item.actualAddress || ''}`.toLowerCase();
    if (!addr.includes(f.address.trim().toLowerCase())) return false;
  }

  if (f.disposition === 'NEW' && item.lastDisposition) return false;
  if (f.disposition !== 'ALL' && f.disposition !== 'NEW' && item.lastDisposition !== f.disposition) {
    return false;
  }

  if (f.priority === 'HIGH' && Number(item.daysOverdue || 0) < 60 && Number(item.remainingAmount || 0) < 10000) {
    return false;
  }
  if (f.priority === 'CALLBACK' && item.lastDisposition !== 'CALLBACK') {
    return false;
  }

  if (f.rating !== 'ALL' && String(item.rating || '').toUpperCase() !== f.rating) {
    return false;
  }

  if (f.scheduleFilter === 'HAS_SCHEDULE' && !item.hasActiveSchedule) return false;
  if (f.scheduleFilter === 'NO_SCHEDULE' && item.hasActiveSchedule) return false;

  const amount = Number(item.remainingAmount || 0);
  if (f.minAmount.trim() !== '' && !Number.isNaN(Number(f.minAmount)) && amount < Number(f.minAmount)) {
    return false;
  }
  if (f.maxAmount.trim() !== '' && !Number.isNaN(Number(f.maxAmount)) && amount > Number(f.maxAmount)) {
    return false;
  }

  const overdue = Number(item.daysOverdue || 0);
  if (f.minOverdue.trim() !== '' && !Number.isNaN(Number(f.minOverdue)) && overdue < Number(f.minOverdue)) {
    return false;
  }
  if (f.maxOverdue.trim() !== '' && !Number.isNaN(Number(f.maxOverdue)) && overdue > Number(f.maxOverdue)) {
    return false;
  }

  return true;
}

function buildCrmExcelRows(list: any[]) {
  return list.map((item, idx) => {
    const disp = item.lastDisposition
      ? DISPOSITION_LABELS[item.lastDisposition]?.label || item.lastDisposition
      : 'ახალი კონტაქტი';
    const { firstName, lastName } = splitPersonName(item);
    return {
      '#': idx + 1,
      'საქმის N': item.caseNumber,
      'ხელშეკრულება': item.agreementNumber || '—',
      'ტიპი': item.isCompany ? 'იურიდიული პირი' : 'ფიზიკური პირი',
      'პ/ნ ან ს/კ': item.debtorPersonalId,
      'მოვალე / კომპანია': item.debtorName,
      'სახელი': item.isCompany ? '—' : firstName,
      'გვარი': item.isCompany ? '—' : lastName,
      'დირექტორი': item.directorName || '—',
      'ტელეფონი': item.debtorPhone || '—',
      'ელ-ფოსტა': item.debtorEmail || '—',
      'იურიდიული მისამართი': item.legalAddress || '—',
      'ფაქტობრივი მისამართი': item.actualAddress || '—',
      'კრედიტორი': item.creditorName || '—',
      'მიმდინარე დავალიანება (₾)': Number(item.remainingAmount || 0),
      'ძირი თანხა (₾)': Number(item.initialAmount || 0),
      'ჯარიმა (₾)': Number(item.penaltyAmount || 0),
      'ვადაგადაცილება (დღე)': Number(item.daysOverdue || 0),
      'წარმოქმნის თარიღი': formatShortDate(item.debtOriginationDate),
      'ბოლო სტატუსი': disp,
      'გრაფიკი': item.hasActiveSchedule ? 'აქტიური გრაფიკი' : 'გრაფიკის გარეშე',
      'რეიტინგი': `Grade ${item.rating || 'E'}`,
      'ბოლო კომენტარი': item.lastCallNotes || '—',
    };
  });
}

export default function CrmPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [currentTab, setCurrentTab] = useState<CrmTab>('calls');
  const [entityTab, setEntityTab] = useState<EntityTab>('ALL');

  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [crmStats, setCrmStats] = useState<any>({
    callsToday: 0,
    dailyTarget: 60,
    promisesCount: 0,
    unreachableCount: 0,
    promisedAmountTotal: 0,
    activeQueueCount: 0,
  });

  const [filters, setFilters] = useState<CrmFiltersState>(INITIAL_CRM_FILTERS);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalClaim, setModalClaim] = useState<any | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<CrmModalTab>('call');
  const [isChartStudioOpen, setIsChartStudioOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Blog CMS State (Admin only)
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<
    'financial_literacy' | 'credit_risks' | 'tax_updates' | 'legal_mediation' | 'news'
  >('tax_updates');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCoverImage, setPostCoverImage] = useState('');
  const [postTags, setPostTags] = useState('RS.GE, დებიტორები, რისკები');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const loadQueueAndStats = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const [q, stats] = await Promise.all([
        crmBackendService.getQueue(),
        crmBackendService.getStats(),
      ]);
      setQueue(q || []);
      setCrmStats(stats || {});
    } catch (err) {
      console.warn('Could not load CRM queue/stats:', err);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/crm');
      return;
    }
    if (u.role !== 'OPERATOR' && u.role !== 'ADMIN') {
      router.replace(authService.getPortalRouteForRole(u.role));
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadQueueAndStats();
  }, [router, loadQueueAndStats]);

  useEffect(() => {
    if (currentTab === 'blog' && currentUser?.role !== 'ADMIN') {
      setCurrentTab('calls');
    }
  }, [currentTab, currentUser]);

  // Clear stale selections if queue reloads
  useEffect(() => {
    const valid = new Set(queue.map((item) => item.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [queue]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const physicalCount = useMemo(() => queue.filter((i) => !i.isCompany).length, [queue]);
  const legalCount = useMemo(() => queue.filter((i) => i.isCompany).length, [queue]);
  const totalQueueDebt = useMemo(
    () => queue.reduce((sum, i) => sum + Number(i.remainingAmount || 0), 0),
    [queue],
  );

  const entityBaseList = useMemo(() => {
    if (entityTab === 'PHYSICAL') return queue.filter((i) => !i.isCompany);
    if (entityTab === 'LEGAL') return queue.filter((i) => i.isCompany);
    return queue;
  }, [queue, entityTab]);

  const filteredQueue = useMemo(
    () => entityBaseList.filter((item) => matchesCrmFilters(item, filters)),
    [entityBaseList, filters],
  );

  const filteredTotalDebt = useMemo(
    () => filteredQueue.reduce((sum, i) => sum + Number(i.remainingAmount || 0), 0),
    [filteredQueue],
  );

  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / pageSize));
  const paginatedQueue = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [entityTab, filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.caseNumber.trim()) count++;
    if (filters.personalId.trim()) count++;
    if (filters.debtorName.trim()) count++;
    if (filters.creditorName.trim()) count++;
    if (filters.phone.trim()) count++;
    if (filters.directorName.trim()) count++;
    if (filters.address.trim()) count++;
    if (filters.disposition !== 'ALL') count++;
    if (filters.priority !== 'ALL') count++;
    if (filters.rating !== 'ALL') count++;
    if (filters.scheduleFilter !== 'ALL') count++;
    if (filters.minAmount.trim()) count++;
    if (filters.maxAmount.trim()) count++;
    if (filters.minOverdue.trim()) count++;
    if (filters.maxOverdue.trim()) count++;
    return count;
  }, [filters]);

  const selectedList = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const set = new Set(selectedIds);
    return filteredQueue.filter((item) => set.has(item.id));
  }, [filteredQueue, selectedIds]);

  const allFilteredSelected =
    filteredQueue.length > 0 && filteredQueue.every((item) => selectedIds.includes(item.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredQueue.map((i) => i.id);
    if (allFilteredSelected) {
      const drop = new Set(ids);
      setSelectedIds((prev) => prev.filter((id) => !drop.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const clearSelection = () => setSelectedIds([]);
  const resetFilters = () => setFilters(INITIAL_CRM_FILTERS);

  const updateFilter = <K extends keyof CrmFiltersState>(key: K, value: CrmFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopyId = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedId(value);
    setTimeout(() => setCopiedId((prev) => (prev === value ? null : prev)), 1500);
  };

  const openModalWithTab = (item: any, tab: CrmModalTab) => {
    setModalInitialTab(tab);
    setModalClaim(item);
  };

  const exportToExcel = (targetList: any[], customName?: string) => {
    if (targetList.length === 0) {
      alert('ექსპორტისთვის ჩანაწერები არ მოიძებნა.');
      return;
    }
    const rows = buildCrmExcelRows(targetList);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM სამუშაო რეესტრი');
    const dateStamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, customName || `debitinfo_crm_queue_${dateStamp}.xlsx`);
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const categoryNamesKa: Record<string, string> = {
      financial_literacy: 'ფინანსური განათლება',
      credit_risks: 'საკრედიტო რისკები',
      tax_updates: 'საგადასახადო სიახლეები',
      legal_mediation: 'მედიაცია & კანონმდებლობა',
      news: 'პლატფორმის სიახლეები',
    };

    const newPost = await blogService.createPost({
      title: postTitle,
      slug: postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || `post-${Date.now()}`,
      category: postCategory,
      categoryKa: categoryNamesKa[postCategory] || 'სიახლეები',
      excerpt: postExcerpt || postContent.slice(0, 150) + '...',
      content: postContent,
      coverImage:
        postCoverImage ||
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
      authorName: currentUser?.name || 'თამარ გიორგობიანი',
      authorRole: 'კრედიტ მენეჯერი / კონტენტ მენეჯერი',
      published: true,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setPosts([newPost, ...posts]);
    setPublishSuccess(true);
    setPostTitle('');
    setPostExcerpt('');
    setPostContent('');
    setPostCoverImage('');
    setTimeout(() => setPublishSuccess(false), 3500);
  };

  const handleDeletePost = async (id: string) => {
    await blogService.deletePost(id);
    setPosts(posts.filter((p) => p.id !== id));
  };

  const entityLabel =
    entityTab === 'PHYSICAL'
      ? 'ფიზიკური პირები'
      : entityTab === 'LEGAL'
        ? 'იურიდიული პირები'
        : 'ყველა ჩანაწერი';

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-bg-main text-text-primary min-h-screen flex flex-col" suppressHydrationWarning>
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 w-full px-6 py-3 flex items-center justify-between border-b border-border-subtle bg-surface-card shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none text-text-primary">
                Debitinfo.GE
              </span>
              <span className="text-[11px] font-medium text-text-muted">
                კრედიტ მენეჯერი &amp; CRM კონსოლი
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-2 bg-slate-100/80 p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setCurrentTab('calls')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                currentTab === 'calls'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>სამუშაო რეესტრი ({queue.length})</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setCurrentTab('blog')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  currentTab === 'blog'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">newspaper</span>
                <span>ბლოგი &amp; სიახლეები (CMS)</span>
              </button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-border-subtle rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span className="text-xs font-semibold text-text-primary">ონლაინ / მზადყოფნაში</span>
          </div>

          {isAdmin && (
            <Link
              href="/ops"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
            </Link>
          )}

          <div className="flex items-center gap-2.5 pl-3 border-l border-border-subtle">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-primary">
                {currentUser?.name || currentUser?.email || 'თამარ გიორგობიანი'}
              </p>
              <p className="text-[11px] text-text-muted">
                {isAdmin ? 'HR / სისტემური ადმინისტრატორი' : 'კრედიტ მენეჯერი & CRM'}
              </p>
            </div>
            <div className="size-9 rounded-full bg-blue-50 text-primary border border-blue-200 flex items-center justify-center font-bold text-xs">
              {currentUser?.name
                ? currentUser.name.substring(0, 2).toUpperCase()
                : currentUser?.email
                  ? currentUser.email.substring(0, 2).toUpperCase()
                  : 'OP'}
            </div>
            <button
              type="button"
              onClick={() => {
                authService.logout();
                window.location.href = '/ops';
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="სისტემიდან გამოსვლა"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {currentTab === 'blog' ? (
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">post_add</span>
              </span>
              <div>
                <h1 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                  ბლოგისა &amp; სიახლეების მართვის სტუდია
                </h1>
                <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                  გამოაქვეყნეთ სტატიები და სიახლეები Debitinfo.GE-ის მთავარ პორტალზე
                </p>
              </div>
            </div>
            <Link
              href="/#blog"
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-primary text-xs font-semibold flex items-center gap-1.5 self-start"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>საიტზე ნახვა</span>
            </Link>
          </div>

          {publishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>სტატია წარმატებით გამოქვეყნდა!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-primary">ახალი სტატიის დამატება</h3>
              <form onSubmit={handlePublishPost} className="space-y-4">
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="სათაური *"
                  className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs focus:border-primary outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={postCategory}
                    onChange={(e: any) => setPostCategory(e.target.value)}
                    className="px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs focus:border-primary outline-none"
                  >
                    <option value="tax_updates">საგადასახადო სიახლეები</option>
                    <option value="credit_risks">საკრედიტო რისკები</option>
                    <option value="financial_literacy">ფინანსური განათლება</option>
                    <option value="legal_mediation">მედიაცია &amp; კანონმდებლობა</option>
                    <option value="news">პლატფორმის სიახლეები</option>
                  </select>
                  <input
                    type="text"
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    placeholder="თეგები (მძიმით)"
                    className="px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs focus:border-primary outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  value={postExcerpt}
                  onChange={(e) => setPostExcerpt(e.target.value)}
                  placeholder="მოკლე ანოტაცია..."
                  className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs focus:border-primary outline-none"
                />
                <textarea
                  rows={6}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="სტატიის სრული ტექსტი *"
                  className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs focus:border-primary outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>გამოქვეყნება</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-text-primary">
                გამოქვეყნებული სტატიები ({posts.length})
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {posts.map((post) => (
                  <div key={post.id} className="p-3.5 rounded-xl border border-border-subtle bg-surface-bg space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-primary text-[10px] font-bold">
                        {post.categoryKa}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                    <h4 className="font-bold text-xs text-text-primary">{post.title}</h4>
                    <p className="text-[11px] text-text-muted line-clamp-2">{post.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Compact 4-Card KPI Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  დღის ინტერაქციები / გეგმა
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-text-primary">
                    {crmStats.callsToday || 0}
                    <span className="text-sm font-normal text-text-muted"> / {crmStats.dailyTarget || 60}</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-primary text-[11px] font-bold font-mono">
                    {Math.round(((crmStats.callsToday || 0) / Math.max(1, crmStats.dailyTarget || 60)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
            </div>

            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  შედეგიანი მოლაპარაკება
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-emerald-600">
                    {crmStats.promisesCount || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    დათანხმდა დაფარვას
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </div>
            </div>

            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  შეუმდგარი კავშირი
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold font-mono text-text-primary">
                    {crmStats.unreachableCount || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                    მიუწვდომელი
                  </span>
                </div>
              </div>
              <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">phone_missed</span>
              </div>
            </div>

            <div className="bg-surface-card rounded-xl border border-border-subtle p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  შეთანხმებული თანხა დღეს
                </p>
                <p className="text-2xl font-extrabold font-mono text-primary mt-1">
                  {Number(crmStats.promisedAmountTotal || 0).toLocaleString('ka-GE')} ₾
                </p>
              </div>
              <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
          </section>

          {/* Standardized Full-Width CRM Queue Registry Card */}
          <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="size-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">format_list_bulleted</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                      ქოლ-ცენტრის სამუშაო რეესტრი
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-mono">
                      {queue.length} სულ საქმე
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
                      პორტფელის ჯამი: {totalQueueDebt.toLocaleString('ka-GE')} ₾
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                    ზარების რიგი, მოვალეთა საკონტაქტო ბაზა, გადახდის გრაფიკები და კომუნიკაციების აღრიცხვა
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

            {/* Standardized Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
              {/* Entity Switcher */}
              <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-border-subtle shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setEntityTab('ALL');
                    clearSelection();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
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
                    {queue.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntityTab('PHYSICAL');
                    clearSelection();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
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
                  type="button"
                  onClick={() => {
                    setEntityTab('LEGAL');
                    clearSelection();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
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

              {/* Right Controls */}
              <div className="flex flex-wrap items-center gap-2 px-1">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[17px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    placeholder="ძიება (სახელი, პ/ნ, ტელეფონი, საქმე)..."
                    className="w-full h-9 pl-9 pr-3 bg-white border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition placeholder:text-text-muted"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilterDrawer((prev) => !prev)}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
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
                    type="button"
                    onClick={resetFilters}
                    className="h-9 px-3 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                    <span>გასუფთავება</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={loadQueueAndStats}
                  disabled={loadingQueue}
                  className="h-9 px-3.5 rounded-xl bg-white border border-border-subtle text-text-secondary hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[17px] ${loadingQueue ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                  <span>განახლება</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChartStudioOpen(true)}
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">bar_chart</span>
                  <span>
                    {selectedList.length > 0
                      ? `გრაფიკის აგება (${selectedList.length})`
                      : 'გრაფიკების სტუდია'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => exportToExcel(selectedList.length > 0 ? selectedList : filteredQueue)}
                  className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                  <span>
                    {selectedList.length > 0
                      ? `მონიშნულის ექსპორტი (${selectedList.length})`
                      : 'Excel ექსპორტი (.xlsx)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Priority & Callback Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: 'ALL', label: 'ყველა საქმე', cls: 'bg-primary text-white border-primary' },
                { id: 'HIGH', label: 'მაღალი პრიორიტეტი (ვადაგადაცილებული)', cls: 'bg-rose-600 text-white border-rose-600' },
                { id: 'CALLBACK', label: 'დანიშნული გადარეკვა', cls: 'bg-amber-600 text-white border-amber-600' },
              ] as const).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => updateFilter('priority', pill.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    filters.priority === pill.id
                      ? `${pill.cls} shadow-2xs`
                      : 'bg-slate-50 border-border-subtle text-text-secondary hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Expandable Multi-Parameter Filter Panel */}
            {showFilterDrawer && (
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">manage_search</span>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      მრავალპარამეტრიანი CRM ფილტრაცია
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                    ყველას გასუფთავება
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      საქმის N / ხელშეკრულება
                    </label>
                    <input
                      type="text"
                      value={filters.caseNumber}
                      onChange={(e) => updateFilter('caseNumber', e.target.value)}
                      placeholder="#DI-2025..."
                      className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      პ/ნ ან ს/კ
                    </label>
                    <input
                      type="text"
                      value={filters.personalId}
                      onChange={(e) => updateFilter('personalId', e.target.value)}
                      placeholder="010... / 405..."
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
                      კრედიტორი
                    </label>
                    <input
                      type="text"
                      value={filters.creditorName}
                      onChange={(e) => updateFilter('creditorName', e.target.value)}
                      placeholder="კრედიტორი..."
                      className="w-full h-9 px-3 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      ბოლო სტატუსი (Disposition)
                    </label>
                    <select
                      value={filters.disposition}
                      onChange={(e) => updateFilter('disposition', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">ყველა სტატუსი</option>
                      <option value="NEW">ახალი კონტაქტი</option>
                      <option value="PROMISE_TO_PAY">დათანხმდა გადახდას</option>
                      <option value="CALLBACK">დაინიშნა გადარეკვა</option>
                      <option value="VOICEMAIL">მიუწვდომელი / არ პასუხობს</option>
                      <option value="REFUSED">კატეგორიული უარი</option>
                      <option value="DISPUTE_RAISED">სადავო</option>
                      <option value="WRONG_NUMBER">არასწორი ნომერი</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      რეიტინგი
                    </label>
                    <select
                      value={filters.rating}
                      onChange={(e) => updateFilter('rating', e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">ყველა რეიტინგი</option>
                      {['A', 'B', 'C', 'D', 'E'].map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      გადახდის გრაფიკი
                    </label>
                    <select
                      value={filters.scheduleFilter}
                      onChange={(e) => updateFilter('scheduleFilter', e.target.value as any)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="ALL">ყველა</option>
                      <option value="HAS_SCHEDULE">აქტიური გრაფიკით</option>
                      <option value="NO_SCHEDULE">გრაფიკის გარეშე</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      დავალიანება (₾ -დან / -მდე)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        value={filters.minAmount}
                        onChange={(e) => updateFilter('minAmount', e.target.value)}
                        placeholder="მინ"
                        className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        value={filters.maxAmount}
                        onChange={(e) => updateFilter('maxAmount', e.target.value)}
                        placeholder="მაქს"
                        className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">
                      ვადაგადაცილება (დღე -დან / -მდე)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        value={filters.minOverdue}
                        onChange={(e) => updateFilter('minOverdue', e.target.value)}
                        placeholder="მინ"
                        className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        value={filters.maxOverdue}
                        onChange={(e) => updateFilter('maxOverdue', e.target.value)}
                        placeholder="მაქს"
                        className="w-full h-9 px-2 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Selection Action Banner — houses controls migrated from the old right panel */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs font-medium animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
                  <span>
                    მონიშნულია <strong className="font-mono">{selectedList.length}</strong> ჩანაწერი ({entityLabel}) — სულ {filteredQueue.length}-დან
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!allFilteredSelected && (
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-primary font-bold text-[11px] transition cursor-pointer"
                    >
                      ყველას მონიშვნა ({filteredQueue.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[11px] transition cursor-pointer"
                  >
                    მონიშვნის მოხსნა
                  </button>

                  {/* Single-Record CRM Action Buttons (replacing the old right panel sections) */}
                  {selectedIds.length === 1 && selectedList.length === 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => openModalWithTab(selectedList[0], 'call')}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>ზარის აღრიცხვა &amp; კონტაქტები</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openModalWithTab(selectedList[0], 'schedule')}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                        <span>გადახდის გრაფიკი</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openModalWithTab(selectedList[0], 'documents')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-primary font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">folder_shared</span>
                        <span>დოკუმენტები</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openModalWithTab(selectedList[0], 'history')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">history</span>
                        <span>ისტორია</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsChartStudioOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                    <span>გრაფიკის აგება ({selectedList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportToExcel(selectedList)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    <span>მონიშნულის ექსპორტი ({selectedList.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Summary Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted px-1">
              <div className="flex items-center gap-2">
                <span>
                  ნაჩვენებია <strong className="text-text-primary">{filteredQueue.length}</strong> ჩანაწერი {entityBaseList.length}-დან
                </span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary text-[11px] font-semibold">
                    ფილტრი აქტიურია ({activeFiltersCount})
                  </span>
                )}
                <span className="hidden md:inline text-[11px] text-text-muted/80">
                  • ჩანაწერის მონიშვნისას გამოჩნდება მოქმედებები • ორმაგი კლიკით იხსნება კონსოლი
                </span>
              </div>
              <div>
                ნაჩვენები დავალიანების ჯამი:{' '}
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {filteredTotalDebt.toLocaleString('ka-GE')} ₾
                </span>
              </div>
            </div>

            {/* Standardized Table */}
            <div className="overflow-x-auto rounded-xl border border-border-subtle shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-3 text-center w-10">
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
                        <th className="py-3 px-4">პ/ნ ან ს/კ</th>
                        <th className="py-3 px-4">მოვალე / კომპანია</th>
                        <th className="py-3 px-4">ტელეფონი</th>
                        <th className="py-3 px-4">ელ-ფოსტა</th>
                        <th className="py-3 px-4">კრედიტორი</th>
                        <th className="py-3 px-4">მიმდინარე დავალიანება</th>
                        <th className="py-3 px-4">ვადაგადაცილება</th>
                        <th className="py-3 px-4">საქმის N</th>
                        <th className="py-3 px-4">ბოლო სტატუსი</th>
                        <th className="py-3 px-4">გრაფიკი</th>
                        <th className="py-3 px-4">რეიტინგი</th>
                      </>
                    )}

                    {entityTab === 'PHYSICAL' && (
                      <>
                        <th className="py-3 px-4">პირადი ნომერი (პ/ნ)</th>
                        <th className="py-3 px-4">სახელი</th>
                        <th className="py-3 px-4">გვარი</th>
                        <th className="py-3 px-4">ტელეფონი</th>
                        <th className="py-3 px-4">ელ-ფოსტა</th>
                        <th className="py-3 px-4">იურიდიული მისამართი</th>
                        <th className="py-3 px-4">მიმდინარე დავალიანება</th>
                        <th className="py-3 px-4">ვადაგადაცილება</th>
                        <th className="py-3 px-4">კრედიტორი</th>
                        <th className="py-3 px-4">ბოლო სტატუსი</th>
                        <th className="py-3 px-4">რეიტინგი</th>
                      </>
                    )}

                    {entityTab === 'LEGAL' && (
                      <>
                        <th className="py-3 px-4">საიდენტიფიკაციო კოდი (ს/კ)</th>
                        <th className="py-3 px-4">დასახელება</th>
                        <th className="py-3 px-4">ტელეფონი</th>
                        <th className="py-3 px-4">დირექტორი</th>
                        <th className="py-3 px-4">იურიდიული მისამართი</th>
                        <th className="py-3 px-4">მიმდინარე დავალიანება</th>
                        <th className="py-3 px-4">ვადაგადაცილება</th>
                        <th className="py-3 px-4">კრედიტორი</th>
                        <th className="py-3 px-4">ბოლო სტატუსი</th>
                        <th className="py-3 px-4">რეიტინგი</th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-subtle bg-white text-text-primary">
                  {loadingQueue && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-text-muted">
                        <span className="material-symbols-outlined text-2xl animate-spin text-primary block mx-auto mb-2">
                          sync
                        </span>
                        CRM სამუშაო რეესტრი იტვირთება...
                      </td>
                    </tr>
                  )}

                  {!loadingQueue && paginatedQueue.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-text-muted">
                        <span className="material-symbols-outlined text-3xl text-slate-300 block mx-auto mb-2">
                          call_end
                        </span>
                        მითითებული ფილტრებით სამუშაო რიგში საქმეები არ მოიძებნა
                      </td>
                    </tr>
                  )}

                  {!loadingQueue &&
                    paginatedQueue.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const dispInfo = item.lastDisposition
                        ? DISPOSITION_LABELS[item.lastDisposition]
                        : null;
                      const ratingCls = getRatingBadgeClass(item.rating);
                      const { firstName, lastName } = splitPersonName(item);

                      const idCell = (
                        <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                          <div className="flex items-center gap-1.5">
                            <span>{item.debtorPersonalId}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(e, item.debtorPersonalId)}
                              title="კოპირება"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {copiedId === item.debtorPersonalId ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </td>
                      );

                      const phoneCell = (
                        <td className="py-3 px-4 font-mono text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              call
                            </span>
                            <span>{item.debtorPhone}</span>
                            {Number(item.contactsCount || 0) > 0 && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-primary text-[10px] font-bold"
                                title="დამატებითი მოძიებული ნომრები"
                              >
                                +{item.contactsCount}
                              </span>
                            )}
                          </div>
                        </td>
                      );

                      const emailCell = (
                        <td className="py-3 px-4 text-slate-600">
                          {item.debtorEmail ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">
                                mail
                              </span>
                              {item.debtorEmail}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      );

                      const creditorCell = (
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                            <span className="material-symbols-outlined text-[14px] text-slate-500">
                              account_balance
                            </span>
                            {item.creditorName || '—'}
                          </span>
                        </td>
                      );

                      const debtCell = (
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-rose-600 text-[13px]">
                            {Number(item.remainingAmount || 0).toLocaleString('ka-GE')} ₾
                          </span>
                          <span className="block text-[10px] text-text-muted font-mono">
                            ძირი: {Number(item.initialAmount || 0).toLocaleString('ka-GE')} ₾
                          </span>
                        </td>
                      );

                      const overdueCell = (
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                              Number(item.daysOverdue || 0) >= 60
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.daysOverdue} დღე
                          </span>
                        </td>
                      );

                      const dispositionCell = (
                        <td className="py-3 px-4">
                          {dispInfo ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${dispInfo.cls}`}
                            >
                              {dispInfo.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ახალი კონტაქტი
                            </span>
                          )}
                        </td>
                      );

                      const ratingCell = (
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${ratingCls}`}
                          >
                            • Grade {item.rating || 'E'}
                          </span>
                        </td>
                      );

                      return (
                        <tr
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          onDoubleClick={() => openModalWithTab(item, 'call')}
                          className={`cursor-pointer transition-colors whitespace-nowrap ${
                            isSelected
                              ? 'bg-blue-50/80 hover:bg-blue-100/70 font-medium'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.id)}
                              className="size-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            />
                          </td>

                          {entityTab === 'ALL' && (
                            <>
                              {idCell}
                              <td className="py-3 px-4 font-medium text-text-primary">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`size-6 rounded-md flex items-center justify-center shrink-0 ${
                                      item.isCompany
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'bg-blue-50 text-primary'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      {item.isCompany ? 'domain' : 'person'}
                                    </span>
                                  </span>
                                  <span>{item.debtorName}</span>
                                </div>
                              </td>
                              {phoneCell}
                              {emailCell}
                              {creditorCell}
                              {debtCell}
                              {overdueCell}
                              <td className="py-3 px-4 font-mono font-bold text-primary">
                                #{item.caseNumber}
                              </td>
                              {dispositionCell}
                              <td className="py-3 px-4">
                                {item.hasActiveSchedule ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                                    <span className="material-symbols-outlined text-[13px]">event_available</span>
                                    გრაფიკი
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-[11px]">—</span>
                                )}
                              </td>
                              {ratingCell}
                            </>
                          )}

                          {entityTab === 'PHYSICAL' && (
                            <>
                              {idCell}
                              <td className="py-3 px-4 font-medium text-text-primary">{firstName}</td>
                              <td className="py-3 px-4 font-medium text-text-primary">{lastName}</td>
                              {phoneCell}
                              {emailCell}
                              <td
                                className="py-3 px-4 text-slate-600 max-w-xs truncate"
                                title={item.legalAddress || ''}
                              >
                                {item.legalAddress || '—'}
                              </td>
                              {debtCell}
                              {overdueCell}
                              {creditorCell}
                              {dispositionCell}
                              {ratingCell}
                            </>
                          )}

                          {entityTab === 'LEGAL' && (
                            <>
                              {idCell}
                              <td className="py-3 px-4 font-semibold text-text-primary">
                                {item.debtorName}
                              </td>
                              {phoneCell}
                              <td className="py-3 px-4 text-slate-700">
                                {item.directorName || '—'}
                              </td>
                              <td
                                className="py-3 px-4 text-slate-600 max-w-xs truncate"
                                title={item.legalAddress || ''}
                              >
                                {item.legalAddress || '—'}
                              </td>
                              {debtCell}
                              {overdueCell}
                              {creditorCell}
                              {dispositionCell}
                              {ratingCell}
                            </>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
              <div className="flex items-center gap-3">
                <span>
                  გვერდი <strong className="text-text-primary font-mono">{currentPage}</strong> / {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <span>ჩანაწერი გვერდზე:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-border-subtle bg-white text-xs font-semibold text-text-primary cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-text-secondary cursor-pointer"
                >
                  წინა
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-text-secondary cursor-pointer"
                >
                  შემდეგი
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Case File & Control Console Modal (opened via selection action bar buttons or double-click) */}
      <CrmCaseModal
        claimSummary={modalClaim}
        initialTab={modalInitialTab}
        onClose={() => setModalClaim(null)}
        onUpdated={loadQueueAndStats}
        onExportSingle={(item) => exportToExcel([item], `crm_case_${item.caseNumber}.xlsx`)}
      />

      {/* Analytics Chart Studio Modal */}
      <CrmChartStudioModal
        isOpen={isChartStudioOpen}
        items={selectedList.length > 0 ? selectedList : filteredQueue}
        onClose={() => setIsChartStudioOpen(false)}
      />
    </div>
  );
}
