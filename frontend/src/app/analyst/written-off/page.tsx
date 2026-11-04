'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AnalystSidebar from '@/components/analyst/AnalystSidebar';

export interface WrittenOffDebtItem {
  id: string;
  caseNumber: string;
  debtorName: string;
  personalId: string;
  entityType: string;
  creditorName: string;
  creditorTaxId?: string;
  claimId?: string;
  originalAmount: number | string;
  writtenOffAmount: number | string;
  currency: string;
  reasonCategory: string;
  reasonDescription: string;
  actNumber: string;
  proofDocumentName?: string;
  proofDocumentUrl?: string;
  proofDocumentType?: string;
  status: string;
  writtenOffByName?: string;
  writtenOffDate: string;
  createdAt: string;
}

export const REASON_CATEGORIES_META: Record<
  string,
  {
    title: string;
    shortTitle: string;
    badge: string;
    color: 'emerald' | 'purple' | 'indigo' | 'amber' | 'rose' | 'slate' | 'cyan';
    icon: string;
    legalBasis: string;
    description: string;
  }
> = {
  SOCIAL_VULNERABLE: {
    title: 'სოციალურად დაუცველი (საარსებო შემწეობა)',
    shortTitle: 'სოც. დაუცველი',
    badge: 'სოციალური შეღავათი',
    color: 'emerald',
    icon: 'health_and_safety',
    legalBasis: 'საქართველოს მთავრობის № 145 დადგენილება (სარეიტინგო ქულა < 70,000)',
    description: 'სოციალურად დაუცველთა ერთიან ბაზაში რეგისტრირებული პირი, მძიმე ეკონომიკური მდგომარეობა.',
  },
  DISABILITY_HEALTH: {
    title: 'შშმ პირი / მძიმე ჯანმრთელობის მდგომარეობა',
    shortTitle: 'შშმ / ჯანმრთელობა',
    badge: 'შშმ სტატუსი',
    color: 'purple',
    icon: 'accessible_forward',
    legalBasis: 'კანონი შშმ პირთა სოციალური დაცვის შესახებ (I/II ჯგუფი / შრომისუუნარობა)',
    description: 'მკვეთრად ან მნიშვნელოვნად გამოხატული შეზღუდული შესაძლებლობის სტატუსი, კრიტიკული დაავადება.',
  },
  INSOLVENCY_BANKRUPTCY: {
    title: 'გადახდისუუნარობა & სასამართლო გაკოტრება',
    shortTitle: 'გაკოტრება',
    badge: 'სასამართლო გაკოტრება',
    color: 'indigo',
    icon: 'gavel',
    legalBasis: 'კანონი გადახდისუუნარობის საქმის წარმოების შესახებ (სასამართლო განჩინება)',
    description: 'კომპანიის ან პირის მიმართ გაკოტრების რეჟიმის დასრულება და მოთხოვნათა დაკმაყოფილების შეუძლებლობა.',
  },
  STATUTE_EXPIRED: {
    title: '3-წლიანი ხანდაზმულობის გასვლა',
    shortTitle: 'ხანდაზმულობა (3 წელი)',
    badge: 'სსკ 129 (ხანდაზმული)',
    color: 'amber',
    icon: 'hourglass_bottom',
    legalBasis: 'საქართველოს სამოქალაქო კოდექსის 129-ე მუხლი (ხელშეკრულების 3 წლიანი ვადა)',
    description: 'დავალიანების წარმოშობიდან გასულია 3 წელი შეჩერება/შეწყვეტის გარეშე; მოთხოვნის უფლება ამოწურულია.',
  },
  UNCOLLECTIBLE_NAPE: {
    title: 'უიმედო ვალი / უქონლობის აქტი (NAPE)',
    shortTitle: 'უქონლობის აქტი',
    badge: 'NAPE უქონლობა',
    color: 'rose',
    icon: 'block',
    legalBasis: 'სააღსრულებო წარმოებათა შესახებ კანონი / აღსრულების ეროვნული ბიურო',
    description: 'აღსრულების ბიუროს ოფიციალური აქტი: მოვალეს არ გააჩნია აღსასრულებელი ქონება ან საბანკო ნაშთი.',
  },
  DECEASED: {
    title: 'მოვალის გარდაცვალება (უმემკვიდროდ)',
    shortTitle: 'გარდაცვალება',
    badge: 'გარდაცვალება',
    color: 'slate',
    icon: 'person_off',
    legalBasis: 'სამოქალაქო კოდექსი — ვალდებულების შეწყვეტა მოვალის გარდაცვალებით სამკვიდროს გარეშე',
    description: 'მოვალე გარდაიცვალა; სამკვიდრო მასა ან კანონიერი მემკვიდრეები არ გამოვლენილა.',
  },
  CREDITOR_FORGIVENESS: {
    title: 'კრედიტორის პატიება / ურთიერთმორიგება',
    shortTitle: 'ვალის პატიება',
    badge: 'კრედიტორის პატიება',
    color: 'cyan',
    icon: 'handshake',
    legalBasis: 'სამოქალაქო კოდექსის 448-ე მუხლი (ვალის პატიების ორმხრივი ხელშეკრულება)',
    description: 'კრედიტორსა და მოვალეს შორის ორმხრივი მორიგების აქტი, ნაწილობრივი დაფარვა ან სრული პატიება.',
  },
};

export default function WrittenOffDebtsPage() {
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
  const [items, setItems] = useState<WrittenOffDebtItem[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected item for official Act preview modal
  const [previewActItem, setPreviewActItem] = useState<WrittenOffDebtItem | null>(null);

  // Act Annulment (Reversal & Debt Restoration) Modal State
  const [annulTargetItem, setAnnulTargetItem] = useState<WrittenOffDebtItem | null>(null);
  const [annulReason, setAnnulReason] = useState('');
  const [submittingAnnul, setSubmittingAnnul] = useState(false);
  const [annulErrorMessage, setAnnulErrorMessage] = useState<string | null>(null);

  // New Write-off Modal State
  const [isNewWriteOffOpen, setIsNewWriteOffOpen] = useState(false);
  const [submittingWriteOff, setSubmittingWriteOff] = useState(false);
  const [writeOffSuccessMessage, setWriteOffSuccessMessage] = useState<string | null>(null);

  const [formDebtorName, setFormDebtorName] = useState('');
  const [formPersonalId, setFormPersonalId] = useState('');
  const [formEntityType, setFormEntityType] = useState<'PHYSICAL' | 'LEGAL'>('PHYSICAL');
  const [formCreditorName, setFormCreditorName] = useState('');
  const [formOriginalAmount, setFormOriginalAmount] = useState('');
  const [formWrittenOffAmount, setFormWrittenOffAmount] = useState('');
  const [formReasonCategory, setFormReasonCategory] = useState('SOCIAL_VULNERABLE');
  const [formReasonDescription, setFormReasonDescription] = useState('');
  const [formActNumber, setFormActNumber] = useState('');
  const [formProofFile, setFormProofFile] = useState<File | null>(null);
  const [formProofDocName, setFormProofDocName] = useState('');

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
    try {
      const saved = localStorage.getItem('debitinfo_analyst_sidebar_open');
      if (saved !== null) setIsSidebarOpen(saved === 'true');
    } catch {
      // ignore
    }
  }, [router]);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await analystBackendService.getWrittenOffDebts({
        search: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setItems(res?.items || []);
      setStats(res?.stats || null);
    } catch (err: any) {
      console.error('Failed to load written off debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized, selectedCategory, dateFrom, dateTo]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Open New Write-off modal with auto-generated Act Number
  const openNewWriteOffModal = () => {
    const currentYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormActNumber(`ACT-WO-${currentYear}-${randomSuffix}`);
    setFormDebtorName('');
    setFormPersonalId('');
    setFormEntityType('PHYSICAL');
    setFormCreditorName('');
    setFormOriginalAmount('');
    setFormWrittenOffAmount('');
    setFormReasonCategory('SOCIAL_VULNERABLE');
    setFormReasonDescription('');
    setFormProofFile(null);
    setFormProofDocName('');
    setIsNewWriteOffOpen(true);
  };

  // Submit new Write-off
  const handleSubmitWriteOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDebtorName.trim()) {
      alert('გთხოვთ მიუთითოთ მოვალის სახელი ან კომპანიის დასახელება');
      return;
    }
    if (!formPersonalId.trim()) {
      alert('გთხოვთ მიუთითოთ პირადი ნომერი (11 ციფრი) ან საიდენტიფიკაციო კოდი (9 ციფრი)');
      return;
    }
    if (!formCreditorName.trim()) {
      alert('გთხოვთ მიუთითოთ კრედიტორი ორგანიზაციის დასახელება');
      return;
    }
    const writtenOffAmt = parseFloat(formWrittenOffAmount);
    if (isNaN(writtenOffAmt) || writtenOffAmt <= 0) {
      alert('გთხოვთ მიუთითოთ ვალიდური ჩამოსაწერი თანხა');
      return;
    }

    setSubmittingWriteOff(true);
    try {
      const res = await analystBackendService.createWrittenOffDebt({
        debtorName: formDebtorName.trim(),
        personalId: formPersonalId.trim(),
        entityType: formEntityType,
        creditorName: formCreditorName.trim(),
        originalAmount: parseFloat(formOriginalAmount) || writtenOffAmt,
        writtenOffAmount: writtenOffAmt,
        currency: 'GEL',
        reasonCategory: formReasonCategory,
        reasonDescription: formReasonDescription.trim() || 'ოფიციალური დასაბუთება წარმოდგენილი დოკუმენტაციის საფუძველზე',
        actNumber: formActNumber.trim(),
        proofDocumentName: formProofDocName || (formProofFile ? formProofFile.name : 'proof_document.pdf'),
        proofDocumentType: formProofFile?.type || 'application/pdf',
        writtenOffByName: currentUser?.name || currentUser?.email || 'უფროსი ფინანსური ანალიტიკოსი',
      });

      setWriteOffSuccessMessage(res.message || 'ვალი წარმატებით ჩამოიწერა!');
      setTimeout(() => setWriteOffSuccessMessage(null), 4000);
      setIsNewWriteOffOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'ვალის ჩამოწერა ვერ მოხერხდა');
    } finally {
      setSubmittingWriteOff(false);
    }
  };

  // Open Act Annulment Modal
  const openAnnulModal = (item: WrittenOffDebtItem) => {
    setAnnulTargetItem(item);
    setAnnulReason('');
    setAnnulErrorMessage(null);
  };

  // Submit Act Annulment & Restore Debt
  const handleAnnulSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annulTargetItem) return;
    if (!annulReason.trim()) {
      setAnnulErrorMessage('გთხოვთ მიუთითოთ აქტის ანულირების / გაბათილების სამართლებრივი მიზეზი.');
      return;
    }

    setSubmittingAnnul(true);
    setAnnulErrorMessage(null);
    try {
      const res = await analystBackendService.annulWrittenOffDebt(
        annulTargetItem.id,
        annulReason.trim(),
      );
      setWriteOffSuccessMessage(
        res?.message ||
          `აქტი № ${annulTargetItem.actNumber} ანულირებულია! დავალიანება სრულად აღუდგა დებიტორსა და კრედიტორს.`,
      );
      setTimeout(() => setWriteOffSuccessMessage(null), 6000);
      setAnnulTargetItem(null);
      setPreviewActItem(null);
      await loadData();
    } catch (err: any) {
      setAnnulErrorMessage(err?.message || 'აქტის ანულირება ვერ მოხერხდა');
    } finally {
      setSubmittingAnnul(false);
    }
  };

  const getCategoryMeta = (cat: string) => {
    return (
      REASON_CATEGORIES_META[cat] || {
        title: 'სხვა საფუძველი',
        shortTitle: 'სხვა',
        badge: 'სხვა',
        color: 'slate',
        icon: 'folder',
        legalBasis: 'კანონით გათვალისწინებული სხვა საფუძველი',
        description: 'ჩამოწერილია კომისიის დასკვნის შესაბამისად.',
      }
    );
  };

  const formatGEL = (val: number | string) => {
    const num = Number(val) || 0;
    return `₾ ${num.toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!items.length) return;
    const headers = [
      'აქტის №',
      'საქმის №',
      'მოვალე',
      'პირადი/ს/კ',
      'კრედიტორი',
      'საწყისი ვალი',
      'ჩამოწერილი თანხა',
      'საფუძველი',
      'დასაბუთება',
      'თარიღი',
    ];
    const rows = items.map((i) => [
      `"${i.actNumber}"`,
      `"${i.caseNumber}"`,
      `"${i.debtorName}"`,
      `"${i.personalId}"`,
      `"${i.creditorName}"`,
      `"${i.originalAmount}"`,
      `"${i.writtenOffAmount}"`,
      `"${getCategoryMeta(i.reasonCategory).shortTitle}"`,
      `"${(i.reasonDescription || '').replace(/"/g, '""')}"`,
      `"${new Date(i.writtenOffDate).toLocaleDateString('ka-GE')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `written_off_debts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="w-full px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/analyst" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm group-hover:bg-rose-700 transition-all">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                  <span className="text-headline-sm font-bold text-secondary-container">.GE</span>
                </div>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                ჩამოწერილი ვალების რეესტრი
              </span>
              <span className="text-xs text-slate-400">
                სოციალური, შშმ, გაკოტრებისა და ხანდაზმულობის აქტები
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/analyst/staff"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-base text-emerald-600">badge</span>
              <span>თანამშრომელთა რეესტრი</span>
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
              <span>მთავარ კონსოლზე დაბრუნება</span>
            </Link>

            <button
              onClick={openNewWriteOffModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">post_add</span>
              <span>+ ვალის ჩამოწერა / აქტის გაფორმება</span>
            </button>

            <button
              onClick={loadData}
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

      {/* Main Content Area with Persistent Collapsible Console Sidebar */}
      <div className="flex-1 flex w-full overflow-hidden">
        <AnalystSidebar
          activeView="written-off"
          isOpen={isSidebarOpen}
          onToggleOpen={toggleSidebar}
        />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 w-full space-y-6">
        {/* Success Banner */}
        {writeOffSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
              <span>{writeOffSuccessMessage}</span>
            </div>
            <button
              onClick={() => setWriteOffSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. KPI METRICS CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Amount */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">საერთო ჩამოწერილი ვალი</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatGEL(stats?.totalAmount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>საწყისი პორტფელი: {formatGEL(stats?.totalOriginalAmount || 0)}</span>
              <span className="font-semibold text-rose-600">100% აღიარებული</span>
            </div>
          </div>

          {/* Card 2: Total Acts */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">გაფორმებული აქტები</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">description</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {stats?.totalCount || 0}{' '}
              <span className="text-sm font-normal text-slate-500 font-sans">საქმე</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>სრული იურიდიული დასაბუთებით</span>
            </div>
          </div>

          {/* Card 3: Social & Health Relief */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">სოციალური & შშმ შეღავათი</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">health_and_safety</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">
              {formatGEL((stats?.socialVulnerableAmount || 0) + (stats?.disabilityAmount || 0))}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {(stats?.socialVulnerableCount || 0) + (stats?.disabilityCount || 0)} მოწყვლადი პირი
            </div>
          </div>

          {/* Card 4: Bankruptcy & NAPE */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">გაკოტრება & უქონლობა</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-700 font-mono tracking-tight">
              {formatGEL((stats?.bankruptcyAmount || 0) + (stats?.uncollectibleNapeAmount || 0))}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {(stats?.bankruptcyCount || 0) + (stats?.uncollectibleNapeCount || 0)} სასამართლო/NAPE აქტი
            </div>
          </div>

          {/* Card 5: Statute of Limitations */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">3-წლიანი ხანდაზმულობა</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">hourglass_bottom</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono tracking-tight">
              {formatGEL(stats?.statuteExpiredAmount || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats?.statuteExpiredCount || 0} სსკ 129 ვადაგასული საქმე
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FILTER, CATEGORY PILLS & SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-4">
          {/* Category Filter Pills */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              ჩამოწერის იურიდიული საფუძველი (ფილტრი):
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ყველა საფუძველი ({stats?.totalCount || 0})
              </button>

              {Object.entries(REASON_CATEGORIES_META).map(([key, meta]) => {
                const count = stats?.byCategory?.[key]?.count || 0;
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                    <span>{meta.shortTitle}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ძიება: მოვალის სახელი, პირადი №, ს/კ, საქმის №, აქტის № ან კრედიტორი..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
              >
                ძიება
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(loadData, 50);
                  }}
                  className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                  title="გასუფთავება"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-[11px] text-slate-400">პერიოდი:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
                />
                <span>—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="მონაცემების ექსპორტი (CSV)"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">file_download</span>
                <span>ექსპორტი (CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. WRITTEN-OFF DEBTS REGISTRY TABLE */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">assignment</span>
              <h2 className="text-sm font-bold text-slate-800">
                ჩამოწერილი ვალების საქმეები ({items.length})
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              სულ ჩამოწერილი: <span className="font-bold text-slate-900 font-mono">{formatGEL(stats?.totalAmount || 0)}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">ჩამოწერილი ვალების მონაცემები იტვირთება...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
              <div className="text-sm font-semibold">ჩანაწერები არ მოიძებნა</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                არჩეული ფილტრების შესაბამისი ჩამოწერილი ვალი არ არის რეგისტრირებული.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">აქტი &amp; საქმის №</th>
                    <th className="py-3 px-4">მოვალე (დებიტორი)</th>
                    <th className="py-3 px-4">კრედიტორი</th>
                    <th className="py-3 px-4">საწყისი ვალი</th>
                    <th className="py-3 px-4">ჩამოწერილი თანხა</th>
                    <th className="py-3 px-4">ჩამოწერის საფუძველი</th>
                    <th className="py-3 px-4">დამადასტურებელი დოკუმენტი</th>
                    <th className="py-3 px-4">თარიღი &amp; პასუხისმგებელი</th>
                    <th className="py-3 px-4 text-right">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item) => {
                    const meta = getCategoryMeta(item.reasonCategory);
                    const isFullyWrittenOff =
                      Number(item.writtenOffAmount) >= Number(item.originalAmount);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Act & Case */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-rose-600">
                              receipt_long
                            </span>
                            <span>{item.actNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            საქმე: {item.caseNumber}
                          </div>
                        </td>

                        {/* Debtor */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.debtorName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{item.personalId}</span>
                            <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-sans">
                              {item.entityType === 'LEGAL' ? 'იურიდიული' : 'ფიზიკური'}
                            </span>
                          </div>
                        </td>

                        {/* Creditor */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.creditorName}</div>
                          {item.creditorTaxId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              ს/კ: {item.creditorTaxId}
                            </div>
                          )}
                        </td>

                        {/* Original Amount */}
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {formatGEL(item.originalAmount)}
                        </td>

                        {/* Written-off Amount */}
                        <td className="py-3 px-4">
                          <div
                            className={`font-mono font-bold text-sm ${
                              item.status === 'REVERSED'
                                ? 'text-slate-400 line-through'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatGEL(item.writtenOffAmount)}
                          </div>
                          {item.status === 'REVERSED' ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5 bg-amber-100 text-amber-800 border border-amber-300">
                              ანულირებულია (ვალი აღდგა)
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5 ${
                                isFullyWrittenOff
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isFullyWrittenOff ? '100% ჩამოწერილი' : 'ნაწილობრივი ჩამოწერა'}
                            </span>
                          )}
                        </td>

                        {/* Ground & Category */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                            <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                            <span>{meta.shortTitle}</span>
                          </div>
                          <div
                            className="text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-xs"
                            title={item.reasonDescription}
                          >
                            {item.reasonDescription}
                          </div>
                        </td>

                        {/* Attached Proof Document */}
                        <td className="py-3 px-4">
                          {item.proofDocumentName ? (
                            <button
                              type="button"
                              onClick={() => setPreviewActItem(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors cursor-pointer text-left"
                              title="დოკუმენტის დათვალიერება"
                            >
                              <span className="material-symbols-outlined text-[15px] text-rose-600">
                                description
                              </span>
                              <span className="truncate max-w-[140px]">{item.proofDocumentName}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">არ არის მიბმული</span>
                          )}
                        </td>

                        {/* Date & Officer */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700">
                            {new Date(item.writtenOffDate).toLocaleDateString('ka-GE')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                            {item.writtenOffByName || 'უფროსი ანალიტიკოსი'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewActItem(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-primary text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                              title="ოფიციალური აქტის გადახედვა & ბეჭდვა"
                            >
                              <span className="material-symbols-outlined text-[16px] text-primary">
                                print
                              </span>
                              <span>აქტის ნახვა</span>
                            </button>
                            {item.status !== 'REVERSED' ? (
                              <button
                                type="button"
                                onClick={() => openAnnulModal(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                                title="ჩამოწერის აქტის ანულირება და ვალის აღდგენა"
                              >
                                <span className="material-symbols-outlined text-[16px] text-amber-700">
                                  undo
                                </span>
                                <span>აქტის ანულირება</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200">
                                <span className="material-symbols-outlined text-[15px]">
                                  history
                                </span>
                                <span>აღდგენილია</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREATE NEW WRITTEN OFF DEBT ACT */}
      {/* ========================================================================= */}
      {isNewWriteOffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">post_add</span>
                <h3 className="font-bold text-base">ვალის ჩამოწერა &amp; ოფიციალური აქტის გაფორმება</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewWriteOffOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitWriteOff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Act Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    აქტის ნომერი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formActNumber}
                    onChange={(e) => setFormActNumber(e.target.value)}
                    required
                    className="w-full text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Entity Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    სუბიექტის ტიპი
                  </label>
                  <select
                    value={formEntityType}
                    onChange={(e) => setFormEntityType(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="PHYSICAL">ფიზიკური პირი (მოქალაქე)</option>
                    <option value="LEGAL">იურიდიული პირი (კომპანია)</option>
                  </select>
                </div>

                {/* Debtor Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    მოვალის დასახელება / სახელი და გვარი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDebtorName}
                    onChange={(e) => setFormDebtorName(e.target.value)}
                    required
                    placeholder="მაგ: გიორგი ბერიძე ან შპს ორიონი"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Personal ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    პირადი ნომერი ან ს/კ (9/11 ციფრი) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPersonalId}
                    onChange={(e) => setFormPersonalId(e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={11}
                    placeholder="01019012345 ან 405123456"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Creditor Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    კრედიტორი ორგანიზაცია <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCreditorName}
                    onChange={(e) => setFormCreditorName(e.target.value)}
                    required
                    placeholder="მაგ: სს თიბისი ბანკი, შპს სილქნეტი, შპს ალფა დისტრიბუცია..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Original Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    საწყისი ვალი (₾)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formOriginalAmount}
                    onChange={(e) => setFormOriginalAmount(e.target.value)}
                    placeholder="მაგ: 1500.00"
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Written Off Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ჩამოსაწერი თანხა (₾) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formWrittenOffAmount}
                    onChange={(e) => setFormWrittenOffAmount(e.target.value)}
                    required
                    placeholder="მაგ: 1500.00"
                    className="w-full text-xs font-mono font-bold text-rose-700 bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* Reason Category */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ჩამოწერის იურიდიული საფუძველი <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formReasonCategory}
                    onChange={(e) => setFormReasonCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {Object.entries(REASON_CATEGORIES_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.title} — ({meta.badge})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-slate-500 mt-1 italic">
                    {REASON_CATEGORIES_META[formReasonCategory]?.legalBasis}
                  </div>
                </div>

                {/* Reason Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    დასაბუთება &amp; გარემოებები
                  </label>
                  <textarea
                    rows={3}
                    value={formReasonDescription}
                    onChange={(e) => setFormReasonDescription(e.target.value)}
                    placeholder="აღწერეთ დოკუმენტური მტკიცებულება, სარეიტინგო ქულა, სამედიცინო აქტი, სასამართლო გადაწყვეტილების რეკვიზიტები ან უქონლობის გარემოება..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Proof Document Upload */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    დამადასტურებელი დოკუმენტის მიმაგრება (PDF, DOCX, სურათი)
                  </label>
                  <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 hover:bg-white transition-colors">
                    <input
                      type="file"
                      id="proof-upload-input"
                      accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormProofFile(e.target.files[0]);
                          setFormProofDocName(e.target.files[0].name);
                        }
                      }}
                    />
                    <label
                      htmlFor="proof-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[24px] text-primary">
                        attach_file
                      </span>
                      <span className="text-xs font-semibold text-primary underline">
                        {formProofDocName || 'აირჩიეთ ოფიციალური დოკუმენტი'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        სოც. ცნობა, შშმ აქტი, გაკოტრების განჩინება, NAPE უქონლობის აქტი, გარდაცვალების მოწმობა
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewWriteOffOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submittingWriteOff}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>{submittingWriteOff ? 'მიმდინარეობს ჩამოწერა...' : 'აქტის გაფორმება & ჩამოწერა'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: OFFICIAL LEGAL ACT PREVIEW & PRINT */}
      {/* ========================================================================= */}
      {previewActItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-[22px]">verified</span>
                <h3 className="font-bold text-base">ოფიციალური ჩამოწერის აქტის გადახედვა</h3>
              </div>
              <div className="flex items-center gap-2">
                {previewActItem.status !== 'REVERSED' && (
                  <button
                    type="button"
                    onClick={() => openAnnulModal(previewActItem)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">undo</span>
                    <span>აქტის ანულირება &amp; ვალის აღდგენა</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>ბეჭდვა / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewActItem(null)}
                  className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-slate-800 bg-white">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
                <div>
                  <div className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                    დებიტორული დავალიანების ჩამოწერის აქტი
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    საქმის ნომერი: {previewActItem.caseNumber} • აქტის №: {previewActItem.actNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">Debitinfo.GE</div>
                  <div className="text-[10px] text-slate-400">რისკ-ანალიტიკისა და მონიტორინგის დეპარტამენტი</div>
                  <div className="text-xs font-mono font-semibold text-slate-700 mt-1">
                    თარიღი: {new Date(previewActItem.writtenOffDate).toLocaleDateString('ka-GE')}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">verified</span>
                  <span className="font-semibold text-slate-800">იურიდიული სტატუსი:</span>
                  <span className="font-bold text-emerald-700">დამოწმებულია &amp; ძალაშია</span>
                </div>
                <div className="font-mono text-slate-500">
                  საფუძვლის კოდი: {previewActItem.reasonCategory}
                </div>
              </div>

              {/* Parties Table */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    კრედიტორი (უფლების მფლობელი)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{previewActItem.creditorName}</div>
                  {previewActItem.creditorTaxId && (
                    <div className="text-slate-600 font-mono">ს/კ: {previewActItem.creditorTaxId}</div>
                  )}
                  <div className="text-slate-500 text-[11px]">სისტემაში რეგისტრირებული პარტნიორი</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    მოვალე (დებიტორი)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{previewActItem.debtorName}</div>
                  <div className="text-slate-600 font-mono">
                    {previewActItem.entityType === 'LEGAL' ? 'ს/კ: ' : 'პირადი №: '}
                    {previewActItem.personalId}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    სუბიექტის ტიპი: {previewActItem.entityType === 'LEGAL' ? 'იურიდიული პირი' : 'ფიზიკური პირი'}
                  </div>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ფინანსური გაანგარიშება &amp; ჩამოწერილი მოცულობა
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-[11px] text-slate-500">საწყისი დავალიანება</div>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {formatGEL(previewActItem.originalAmount)}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="text-[11px] text-rose-700 font-semibold">ჩამოწერილი თანხა</div>
                    <div className="text-base font-bold text-rose-700 font-mono mt-0.5">
                      {formatGEL(previewActItem.writtenOffAmount)}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-[11px] text-emerald-700 font-semibold">დარჩენილი ვალდებულება</div>
                    <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                      {formatGEL(
                        Math.max(
                          0,
                          Number(previewActItem.originalAmount) - Number(previewActItem.writtenOffAmount)
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Grounds and Description */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
                  <span>ჩამოწერის სამართლებრივი საფუძველი:</span>
                </div>
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-blue-900 font-medium">
                  {getCategoryMeta(previewActItem.reasonCategory).title}
                  <div className="text-[11px] text-blue-700 mt-1 italic">
                    ნორმატიული ბაზა: {getCategoryMeta(previewActItem.reasonCategory).legalBasis}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-800">ფაქტობრივი გარემოებები და ანალიზი:</div>
                  <p className="leading-relaxed">{previewActItem.reasonDescription}</p>
                </div>
              </div>

              {/* Proof Document Reference */}
              {previewActItem.proofDocumentName && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-lg">
                      picture_as_pdf
                    </span>
                    <span className="font-semibold text-slate-800">
                      მიმაგრებული ოფიციალური დოკუმენტი:
                    </span>
                    <span className="font-mono text-slate-600">{previewActItem.proofDocumentName}</span>
                  </div>
                  <span className="text-emerald-700 font-semibold text-[11px]">✓ შემოწმებული</span>
                </div>
              )}

              {/* Signatures & Stamp Section */}
              <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-4">
                  <div className="font-semibold text-slate-700">აქტი შეადგინა / დაამტკიცა:</div>
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    {previewActItem.writtenOffByName || 'უფროსი ფინანსური ანალიტიკოსი'}
                  </div>
                  <div className="text-[10px] text-slate-400">ხელმოწერა / თარიღი</div>
                </div>

                <div className="space-y-4 text-right">
                  <div className="font-semibold text-slate-700">იურიდიული დეპარტამენტის ვიზა:</div>
                  <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                    დამოწმებულია ელექტრონულად (Debitinfo Legal)
                  </div>
                  <div className="text-[10px] text-slate-400">ბ.ა. / ელექტრონული შტამპი</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: ANNUL WRITTEN-OFF ACT & RESTORE DEBT ACROSS SYSTEM */}
      {/* ========================================================================= */}
      {annulTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8">
            <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[22px]">gavel</span>
                <div>
                  <h3 className="font-bold text-base">
                    ჩამოწერის აქტის ანულირება &amp; ვალის აღდგენა
                  </h3>
                  <p className="text-[11px] text-amber-100 font-mono">
                    აქტი № {annulTargetItem.actNumber} • საქმე: {annulTargetItem.caseNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnnulTargetItem(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAnnulSubmit} className="p-6 space-y-5">
              {/* Info Banner */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">
                    info
                  </span>
                  <span>რა მოხდება აქტის ანულირების შემდეგ:</span>
                </div>
                <p className="leading-relaxed">
                  ახალი გარემოების გამოვლენის საფუძველზე ჩამოწერის აქტი გაბათილდება, ხოლო დაფიქსირებული დავალიანება (
                  <strong className="font-mono">{formatGEL(annulTargetItem.writtenOffAmount)}</strong>) ავტომატურად კვლავ აისახება{' '}
                  <strong>დებიტორის გვერდზე</strong>, გამოუჩნდება <strong>კრედიტორს</strong> და აღდგება ყველა საოპერაციო რეესტრსა და პორტფელში.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">მოვალე (დებიტორი)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{annulTargetItem.debtorName}</div>
                  <div className="font-mono text-slate-500 text-[11px]">{annulTargetItem.personalId}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">კრედიტორი</div>
                  <div className="font-bold text-slate-900 mt-0.5">{annulTargetItem.creditorName}</div>
                  <div className="font-mono text-rose-700 font-bold text-sm mt-0.5">
                    აღსადგენი ვალი: {formatGEL(annulTargetItem.writtenOffAmount)}
                  </div>
                </div>
              </div>

              {annulErrorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                  <span>{annulErrorMessage}</span>
                </div>
              )}

              {/* Quick Reason Presets + Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  ანულირების საფუძველი / ახლად გამოვლენილი გარემოება <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'გამოვლინდა მოვალის ახალი ქონებრივი აქტივი და საბანკო ბრუნვა',
                    'წარმოდგენილი შეღავათის/უქონლობის დამადასტურებელი დოკუმენტი გაბათილდა',
                    'დადგინდა ხანდაზმულობის ვადის შეწყვეტის/აღდგენის სამართლებრივი გარემოება',
                    'კრედიტორის მომართვისა და ახალი აუდიტორული დასკვნის საფუძველზე',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAnnulReason(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 text-[11px] text-slate-700 transition-colors cursor-pointer text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={annulReason}
                  onChange={(e) => setAnnulReason(e.target.value)}
                  required
                  placeholder="დეტალურად მიუთითეთ გარემოება, რომელიც აბათილებს ვალის ჩამოწერის არგუმენტს..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAnnulTargetItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnul}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[17px]">undo</span>
                  <span>
                    {submittingAnnul ? 'მიმდინარეობს აღდგენა...' : 'აქტის ანულირება & ვალის აღდგენა'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
