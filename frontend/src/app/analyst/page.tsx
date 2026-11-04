'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AddDebtorModal, { DebtorFormData } from '@/components/analyst/AddDebtorModal';
import AnalystSidebar, { AnalystViewType } from '@/components/analyst/AnalystSidebar';
import { downloadDebtorTemplateXLSX, parseDebtorExcelFile } from '@/utils/excel';

export default function AnalystPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [activeView, setActiveView] = useState<
    'overview' | 'pending-debtors' | 'debtors-registry' | 'creditors-registry' | 'portfolio-dispatch'
  >('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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

  // Live Analyst Registries State
  const [excelDebtors, setExcelDebtors] = useState<any[]>([]);
  const [excelCreditors, setExcelCreditors] = useState<any[]>([]);
  const [debtorsSearch, setDebtorsSearch] = useState('');
  const [creditorsSearch, setCreditorsSearch] = useState('');
  const [addDebtorModalOpen, setAddDebtorModalOpen] = useState(false);
  const [targetCreditorForDebtor, setTargetCreditorForDebtor] = useState<any>(null);
  const [pendingCreditorDebtors, setPendingCreditorDebtors] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Creditor Registration Modal State
  const [creditorCategory, setCreditorCategory] = useState('კომერციული ორგანიზაცია / B2B');
  const [creditorTaxId, setCreditorTaxId] = useState('');
  const [creditorCompanyName, setCreditorCompanyName] = useState('');
  const [creditorAgreement, setCreditorAgreement] = useState('');
  const [creditorIban, setCreditorIban] = useState('');
  const [creditorRepresentative, setCreditorRepresentative] = useState('');
  const [creditorPhone, setCreditorPhone] = useState('');
  const [creditorEmail, setCreditorEmail] = useState('');
  const [creditorInitialAmount, setCreditorInitialAmount] = useState('');
  const [creditorDebtorsList, setCreditorDebtorsList] = useState<DebtorFormData[]>([]);
  const [isAddDebtorForNewCreditorOpen, setIsAddDebtorForNewCreditorOpen] = useState(false);
  const [registeringCreditor, setRegisteringCreditor] = useState(false);
  const [creditorFormErrors, setCreditorFormErrors] = useState<{ [key: string]: string }>({});

  // Creditor Document Attachments State
  const [attachedDocuments, setAttachedDocuments] = useState<any[]>([
    {
      id: 'doc_init_1',
      name: 'rs_waybill_8841.pdf',
      sizeFormatted: '1.2 MB',
      sizeBytes: 1258291,
      category: 'სასაქონლო ზედნადები (RS.GE)',
      fileType: 'application/pdf',
      uploadedAt: '12:40',
    },
    {
      id: 'doc_init_2',
      name: 'brunviti_barati_2024.xlsx',
      sizeFormatted: '480 KB',
      sizeBytes: 491520,
      category: 'ბრუნვითი უწყისი / ბარათი',
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: '12:42',
    },
  ]);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDocFilesSelected = (files: FileList | File[]) => {
    const newDocs: any[] = [];
    Array.from(files).forEach((file) => {
      let defaultCategory = 'სასაქონლო ზედნადები (RS.GE)';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('barat') || lowerName.includes('ბარათ') || lowerName.includes('უწყის') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        defaultCategory = 'ბრუნვითი უწყისი / ბარათი';
      } else if (lowerName.includes('khelsh') || lowerName.includes('ხელშეკრ') || lowerName.includes('contract')) {
        defaultCategory = 'ხელშეკრულება';
      } else if (lowerName.includes('akt') || lowerName.includes('აქტ') || lowerName.includes('act')) {
        defaultCategory = 'მიღება-ჩაბარების აქტი';
      } else if (lowerName.includes('bank') || lowerName.includes('საბანკო') || lowerName.includes('amonatseri')) {
        defaultCategory = 'საბანკო ამონაწერი';
      }

      newDocs.push({
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        sizeBytes: file.size,
        category: defaultCategory,
        fileType: file.type || 'application/octet-stream',
        uploadedAt: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
      });
    });

    setAttachedDocuments((prev) => [...prev, ...newDocs]);
  };

  const handleRemoveDocument = (id: string) => {
    setAttachedDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDocumentCategory = (id: string, category: string) => {
    setAttachedDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, category } : d))
    );
  };

  // Dynamic Staff, Claims & Workload Dispatcher State
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [claimsOptions, setClaimsOptions] = useState<any[]>([]);
  const [workloadStats, setWorkloadStats] = useState<any>(null);
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>('OPERATOR');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedCreditorName, setSelectedCreditorName] = useState<string>('');
  const [isCreditorDropdownOpen, setIsCreditorDropdownOpen] = useState<boolean>(false);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [portfolioDebtorSearch, setPortfolioDebtorSearch] = useState<string>('');
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [dispatchPriority, setDispatchPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMessage, setDispatchSuccessMessage] = useState<string | null>(null);
  const [dispatchErrorMessage, setDispatchErrorMessage] = useState<string | null>(null);

  const loadAnalystData = async () => {
    setLoadingData(true);
    try {
      const [dRes, cRes, staffRes, claimsRes, workloadRes, pendingRes] = await Promise.allSettled([
        analystBackendService.getDebtorsRegistry(),
        analystBackendService.getCreditorsRegistry(),
        analystBackendService.getStaffOptions(),
        analystBackendService.getClaimsOptions(),
        analystBackendService.getWorkloadStats(),
        analystBackendService.getPendingDebtors(),
      ]);

      const d = dRes.status === 'fulfilled' ? dRes.value : [];
      const c = cRes.status === 'fulfilled' ? cRes.value : [];
      const staff = staffRes.status === 'fulfilled' ? staffRes.value : [];
      const claims = claimsRes.status === 'fulfilled' ? claimsRes.value : [];
      const workload = workloadRes.status === 'fulfilled' ? workloadRes.value : null;
      const pendingDebtors = pendingRes.status === 'fulfilled' ? pendingRes.value : [];

      setExcelDebtors(d || []);
      setExcelCreditors(c || []);
      setStaffOptions(staff || []);
      setClaimsOptions(claims || []);
      setWorkloadStats(workload || null);
      setPendingCreditorDebtors(pendingDebtors || []);
    } catch (err) {
      console.warn('Could not load analyst data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDownloadDebtorTemplate = async () => {
    try {
      await downloadDebtorTemplateXLSX();
    } catch (err) {
      console.error('Failed to download template:', err);
    }
  };

  const handleVerifyDebtor = async (id: string) => {
    setVerifyingId(id);
    try {
      const res = await analystBackendService.verifyDebtor(id);
      setActionSuccessMessage(res?.message || 'დებიტორი წარმატებით გადამოწმდა RS.GE-ში და დადასტურდა!');
      setTimeout(() => setActionSuccessMessage(null), 5000);
      setPendingCreditorDebtors((prev) => prev.filter((d) => d.id !== id));
      await loadAnalystData();
    } catch (err: any) {
      console.error('Verification error:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAnalystImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseDebtorExcelFile(file);
      if (parsed.length > 0) {
        setCreditorDebtorsList((prev) => [...prev, ...(parsed as any[])]);
        setActionSuccessMessage(`Excel (.xlsx) ფაილიდან სიაში დაემატა ${parsed.length} დებიტორი!`);
        setTimeout(() => setActionSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Analyst import error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchErrorMessage(null);
    if (!selectedStaffId) {
      setDispatchErrorMessage('გთხოვთ შეარჩიოთ თანამშრომლის როლი და მიუთითოთ შემსრულებელი თანამშრომელი.');
      return;
    }
    if (selectedClaimIds.length === 0) {
      setDispatchErrorMessage('გთხოვთ შეარჩიოთ კრედიტორი და მონიშნოთ მინიმუმ ერთი დებიტორი.');
      return;
    }
    setIsDispatching(true);
    try {
      const res = await analystBackendService.dispatchTask({
        staffUserId: selectedStaffId,
        claimIds: selectedClaimIds,
        priority: dispatchPriority,
        instructions: dispatchInstructions || 'გადაამოწმეთ მოვალის სტატუსი და განახორციელეთ შესაბამისი მოქმედება.',
      });
      setDispatchSuccessMessage(res?.message || 'პორტფელი წარმატებით გადანაწილდა თანამშრომელზე!');
      setDispatchInstructions('');
      setSelectedClaimIds([]);
      setTimeout(() => setDispatchSuccessMessage(null), 6000);
      const [updatedWorkload, updatedStaff] = await Promise.all([
        analystBackendService.getWorkloadStats(),
        analystBackendService.getStaffOptions(),
      ]);
      setWorkloadStats(updatedWorkload);
      setStaffOptions(updatedStaff || []);
    } catch (err: any) {
      setDispatchErrorMessage(err?.message || 'პორტფელის გადაცემა ვერ მოხერხდა');
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/analyst');
      return;
    }
    if (u.role !== 'ANALYST' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    try {
      const saved = localStorage.getItem('debitinfo_analyst_sidebar_open');
      if (saved !== null) setIsSidebarOpen(saved === 'true');
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (
        viewParam === 'overview' ||
        viewParam === 'pending-debtors' ||
        viewParam === 'debtors-registry' ||
        viewParam === 'creditors-registry' ||
        viewParam === 'portfolio-dispatch'
      ) {
        setActiveView(viewParam);
      }
      if (params.get('registerCreditor') === '1') {
        setIsRegistrationOpen(true);
      }
      if (params.get('openFilter') === '1') {
        setIsFilterDrawerOpen(true);
      }
    } catch {
      // ignore
    }
    loadAnalystData();
  }, [router]);

  const handleAddDebtorToExistingCreditor = async (creditorTaxId: string, debtor: DebtorFormData) => {
    try {
      await analystBackendService.addDebtorsToCreditor(creditorTaxId, [debtor]);
      setActionSuccessMessage(`დებიტორი „${debtor.name}“ წარმატებით მიება კრედიტორს!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadAnalystData();
    } catch (err: any) {
      console.error('Failed to add debtor:', err);
    }
  };

  const handleRegisterCreditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTaxId = creditorTaxId.trim().replace(/\D/g, '');
    const errs: { [key: string]: string } = {};

    if (!cleanTaxId) {
      errs.taxId = 'საიდენტიფიკაციო კოდი (ს/კ) სავალდებულოა';
    } else if (cleanTaxId.length !== 9) {
      errs.taxId = 'საიდენტიფიკაციო კოდი (ს/კ) უნდა შედგებოდეს ზუსტად 9 ციფრისგან';
    }

    if (!creditorCompanyName.trim()) {
      errs.companyName = 'კომპანიის დასახელება სავალდებულოა';
    }

    if (!creditorAgreement.trim()) {
      errs.agreement = 'ხელშეკრულების საფუძველი & № სავალდებულოა';
    }

    setCreditorFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setRegisteringCreditor(true);
    try {
      const res = await analystBackendService.registerCreditor({
        taxId: cleanTaxId,
        companyName: creditorCompanyName.trim(),
        category: creditorCategory,
        agreementNumber: creditorAgreement.trim(),
        iban: creditorIban.trim(),
        representativeName: creditorRepresentative.trim(),
        phone: creditorPhone.trim(),
        email: creditorEmail.trim(),
        initialAmount: parseFloat(creditorInitialAmount) || 0,
        debtors: creditorDebtorsList,
        supportingDocuments: attachedDocuments,
      });

      setIsRegistrationOpen(false);
      setActionSuccessMessage(res?.message || 'კრედიტორი წარმატებით დარეგისტრირდა!');
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Reset form
      setCreditorTaxId('');
      setCreditorCompanyName('');
      setCreditorAgreement('');
      setCreditorIban('');
      setCreditorRepresentative('');
      setCreditorPhone('');
      setCreditorEmail('');
      setCreditorInitialAmount('');
      setCreditorDebtorsList([]);
      setAttachedDocuments([]);

      await loadAnalystData();
    } catch (err: any) {
      console.error('Creditor registration error:', err);
    } finally {
      setRegisteringCreditor(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRegistrationOpen(false);
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalDebtorsAmount = excelDebtors.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalCreditorsAmount = excelCreditors.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPortfolioAmount = totalDebtorsAmount + totalCreditorsAmount;
  const activeCasesCount = excelDebtors.length + excelCreditors.length;
  const totalRecoveredAmount = Math.round(totalPortfolioAmount * 0.438);

  const userName = currentUser?.name || currentUser?.email || 'დავით კაპანაძე';
  const userRoleTitle = currentUser?.role === 'ADMIN'
    ? 'სისტემური ადმინისტრატორი'
    : currentUser?.role === 'ANALYST'
    ? 'მთავარი ანალიტიკოსი'
    : currentUser?.role || 'ფინანსური ანალიტიკოსი';
  const userInitials = currentUser?.name
    ? currentUser.name.substring(0, 2)
    : currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : 'დკ';

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="bg-surface-bg text-text-primary min-h-screen antialiased flex flex-col font-body-md select-none selection:bg-primary-container selection:text-white" suppressHydrationWarning>
<div>
  {/* ========================================================================= */}
  {/* 1. TOP NAVIGATION BAR / OPERATIONS HEADER */}
  {/* ========================================================================= */}
  <header className="w-full bg-surface-card border-b border-border-subtle sticky top-0 z-40 shadow-sm">
    <div className="w-full px-4 lg:px-6 flex items-center justify-between h-16">
      {/* Brand & Operations Subtitle */}
      <div className="flex items-center gap-4">
        <a className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm shadow-primary/30 transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: '"FILL" 1'}}>account_balance</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
              <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
            </div>
          </div>
        </a>
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border-subtle">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
            ანალიტიკოსის კონსოლი
          </span>
          <Link
            href="/analyst/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">query_stats</span>
            <span>BI &amp; ღრმა ანალიტიკა</span>
          </Link>
          <span className="text-text-muted text-body-sm font-body-sm hidden md:inline">v2.4 Live</span>
        </div>
      </div>
      {/* Quick Search Bar */}
      <div className="flex-1 max-w-xl mx-6 hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-[18px]">search</span>
          <input className="w-full pl-10 pr-24 py-2 bg-surface-bg border border-border-subtle rounded-lg text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" placeholder="საქმის №, პ/ნ, ს/კ ან მოვალის ძიება..." type="text" />
          <div className="absolute right-2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-card rounded border border-border-subtle">⌘K</kbd>
          </div>
        </div>
      </div>
      {/* Live Telemetry, Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Live System Telemetry Pulse */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="flex flex-col">
            <span className="text-label-sm font-label-sm text-text-muted">RS.GE სინქრონიზაცია</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 leading-none">
              აქტიური • 0.14 წმ
            </span>
          </div>
        </div>
        {/* Notification Bell with Unread Badge */}
        <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-white font-label-sm text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-surface-card">
            3
          </span>
        </button>
        {/* Current Date Widget */}
        <div className="hidden lg:flex flex-col text-right pr-2">
          <span className="text-body-sm font-body-sm font-medium text-text-primary">24 ოქტომბერი, 2024</span>
          <span className="text-label-sm font-label-sm text-text-muted">14:38:02 (Tbilisi, GMT+4)</span>
        </div>
        {/* Link to Ops (Admin Only) */}
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

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-border-subtle group">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-body-md border border-primary/20 shadow-sm">
            {userInitials}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-body-sm font-body-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
              {userName}
            </span>
            <span className="text-label-sm font-label-sm text-text-muted">
              {userRoleTitle}
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
  {/* ========================================================================= */}
  {/* MAIN WORKSPACE LAYOUT (SIDEBAR + CONTENT CANVAS) */}
  {/* ========================================================================= */}
  <div className="flex-1 flex w-full overflow-hidden">
    {/* ========================================================================= */}
    {/* 2. LEFT COLLAPSIBLE NAVIGATION SIDEBAR */}
    {/* ========================================================================= */}
    <AnalystSidebar
      activeView={activeView}
      onSelectView={(v: AnalystViewType) => {
        if (
          v === 'overview' ||
          v === 'pending-debtors' ||
          v === 'debtors-registry' ||
          v === 'creditors-registry' ||
          v === 'portfolio-dispatch'
        ) {
          setActiveView(v);
        }
      }}
      onOpenCreditorRegistration={() => setIsRegistrationOpen(true)}
      onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
      pendingCount={pendingCreditorDebtors.length}
      debtorsCount={excelDebtors.length}
      creditorsCount={excelCreditors.length}
      isOpen={isSidebarOpen}
      onToggleOpen={toggleSidebar}
    />
    {/* ========================================================================= */}
    {/* MAIN CONTENT CANVAS */}
    {/* ========================================================================= */}
    <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-8 bg-surface-bg">
      {/* Operational Header Row with Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-muted">
            <span>პლატფორმა</span>
            <span>/</span>
            <span>ოპერაციული ცენტრი</span>
            <span>/</span>
            <span className="text-primary font-medium">
              {activeView === 'pending-debtors'
                ? 'კრედიტორების მიერ ატვირთული დებიტორები (დასადასტურებელი)'
                : activeView === 'debtors-registry'
                ? 'დებიტორთა რეესტრი'
                : activeView === 'creditors-registry'
                ? 'კრედიტორთა რეესტრი'
                : activeView === 'portfolio-dispatch'
                ? 'სამართავი პორტფელის განაწილება'
                : 'მთავარი გვერდი'}
            </span>
          </div>
        </div>
        {activeView !== 'overview' && (
          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-white hover:bg-slate-50 text-xs font-semibold text-text-primary transition-colors cursor-pointer self-start lg:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>უკან მთავარ პანელზე</span>
          </button>
        )}
      </div>

      {activeView === 'pending-debtors' ? (
      <>
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 4.5. CREDITORS PENDING DEBTORS (VERIFICATION QUEUE) */}
      {/* ========================================================================= */}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined text-[24px]">fact_check</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                  კრედიტორების მიერ ატვირთული დებიტორები (დასადასტურებელი)
                </h2>
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold font-mono inline-flex items-center justify-center shadow-xs">
                  {pendingCreditorDebtors.length}
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                კრედიტორების მიერ ექსელით ან ხელით დამატებული დებიტორების გადამოწმება RS.GE-ს რეესტრში და დადასტურება
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAnalystData}
            className="px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 text-body-sm text-text-primary font-medium flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>განახლება</span>
          </button>
        </div>

        <div className="mt-4">
          {pendingCreditorDebtors.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">task_alt</span>
              <p className="text-body-sm font-medium text-text-primary">ყველა დებიტორი გადამოწმებულია</p>
              <p className="text-xs text-text-muted mt-0.5">კრედიტორების მხრიდან დასადასტურებელი დებიტორების განაცხადები ამ ეტაპზე არ არის</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">კრედიტორი</th>
                    <th className="py-2.5 px-3">დებიტორი / სუბიექტის ტიპი</th>
                    <th className="py-2.5 px-3">საიდენტ. / დირექტორი</th>
                    <th className="py-2.5 px-3">თარიღი / ვადა</th>
                    <th className="py-2.5 px-3 text-right">დავალიანება</th>
                    <th className="py-2.5 px-3 text-center">სტატუსი</th>
                    <th className="py-2.5 px-3 text-right">RS.GE მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {pendingCreditorDebtors.map((item) => {
                    const isLegal = item.entityType === 'LEGAL' || (item.taxId && item.taxId.length === 9);
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-3 font-medium text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-primary">domain</span>
                            <span>{item.creditorName || 'კრედიტორი'}</span>
                          </div>
                          <span className="text-[11px] text-text-muted font-mono">{item.agreementNumber || 'AGR-GENERAL'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-text-primary flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {isLegal ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                <span className="material-symbols-outlined text-[11px]">apartment</span>
                                <span>იურიდიული</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <span className="material-symbols-outlined text-[11px]">person</span>
                                <span>ფიზიკური</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-muted flex items-center gap-2 mt-0.5">
                            {item.phone && <span>ტელ: {item.phone}</span>}
                            {item.legalAddress && <span>• {item.legalAddress}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-text-primary">
                          <div className="font-mono text-xs">
                            {isLegal ? `ს/კ: ${item.taxId || item.personalId}` : `პ/ნ: ${item.personalId}`}
                          </div>
                          {isLegal && (item.directorFirstName || item.directorLastName) && (
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              დირექტორი: {item.directorFirstName} {item.directorLastName}
                              {item.directorPhone && <span className="font-mono text-slate-500"> ({item.directorPhone})</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-xs text-text-primary">
                            {item.debtOriginationDate ? String(item.debtOriginationDate).split('T')[0] : '—'}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono">
                            {item.overdueDays ? `${item.overdueDays} დღე` : 'ახალი'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-text-primary">
                          {Number(item.amount).toLocaleString('ka-GE')} ₾
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>დასადასტურებელი</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            disabled={verifyingId === item.id}
                            onClick={() => handleVerifyDebtor(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">verified</span>
                            <span>{verifyingId === item.id ? 'მოწმდება...' : 'RS.GE გადამოწმება & დადასტურება'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      </>
      ) : activeView === 'portfolio-dispatch' ? (
      <>

      {/* ========================================================================= */}
      {/* 5. TASK DISPATCHER & PORTFOLIO ALLOCATION PANEL */}
      {/* ========================================================================= */}
      {(() => {
        const ROLE_OPTIONS = [
          {
            code: 'OPERATOR',
            label: 'კრედიტ-მენეჯერი (ოპერატორი)',
            subtitle: 'სატელეფონო კომუნიკაცია & მოლაპარაკება',
            icon: 'support_agent',
            color: 'blue',
          },
          {
            code: 'LEGAL',
            label: 'იურისტი',
            subtitle: 'სასამართლო წარმოება & აღსრულება',
            icon: 'gavel',
            color: 'indigo',
          },
          {
            code: 'FIELD_OFFICER',
            label: 'საველე ვიზიტორი / კურიერი',
            subtitle: 'ადგილზე ვიზიტი & ოქმის შედგენა',
            icon: 'directions_car',
            color: 'amber',
          },
        ];

        const filteredStaffByRole = staffOptions.filter((s) =>
          selectedStaffRole ? s.role === selectedStaffRole : true
        );
        const chosenStaff = staffOptions.find((s) => s.id === selectedStaffId) || null;

        // Group claims by creditorName
        const creditorGroupsMap = new Map<
          string,
          {
            creditorName: string;
            creditorTaxId: string;
            claims: any[];
            totalAmount: number;
          }
        >();

        claimsOptions.forEach((cl) => {
          const cName = cl.creditorName || 'შპს ჯეო ტრეიდინგი';
          const cTax = cl.creditorTaxId || '405123456';
          if (!creditorGroupsMap.has(cName)) {
            creditorGroupsMap.set(cName, {
              creditorName: cName,
              creditorTaxId: cTax,
              claims: [],
              totalAmount: 0,
            });
          }
          const grp = creditorGroupsMap.get(cName)!;
          grp.claims.push(cl);
          grp.totalAmount += Number(cl.remainingAmount || 0);
        });

        const creditorGroups = Array.from(creditorGroupsMap.values());
        const activeCreditorGroup =
          creditorGroups.find((g) => g.creditorName === selectedCreditorName) || null;

        const visibleCreditorClaims = (activeCreditorGroup?.claims || []).filter((cl) => {
          if (!portfolioDebtorSearch.trim()) return true;
          const q = portfolioDebtorSearch.toLowerCase();
          return (
            cl.debtorName?.toLowerCase().includes(q) ||
            cl.debtorPersonalId?.toLowerCase().includes(q) ||
            cl.caseNumber?.toLowerCase().includes(q) ||
            cl.agreementNumber?.toLowerCase().includes(q)
          );
        });

        const selectedClaimObjects = claimsOptions.filter((cl) =>
          selectedClaimIds.includes(cl.id)
        );
        const selectedTotalAmount = selectedClaimObjects.reduce(
          (sum, cl) => sum + Number(cl.remainingAmount || 0),
          0
        );

        const toggleClaimCheckbox = (claimId: string) => {
          setSelectedClaimIds((prev) =>
            prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
          );
        };

        const allVisibleIds = visibleCreditorClaims.map((c) => c.id);
        const areAllVisibleSelected =
          allVisibleIds.length > 0 &&
          allVisibleIds.every((id) => selectedClaimIds.includes(id));

        const toggleSelectAllVisible = () => {
          if (areAllVisibleSelected) {
            setSelectedClaimIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
          } else {
            setSelectedClaimIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
          }
        };

        return (
          <section
            id="portfolio-dispatch-section"
            className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm scroll-mt-20 space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">send_time_extension</span>
                </div>
                <div>
                  <h2 className="text-headline-sm font-headline-sm text-text-primary font-bold">
                    სამართავი პორტფელის განაწილება
                  </h2>
                  <p className="text-body-sm font-body-sm text-text-muted">
                    1) შეარჩიეთ როლი და თანამშრომელი • 2) შეარჩიეთ კრედიტორი • 3) მონიშნეთ დებიტორები ავტომატური დაჯამებით
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label-sm font-label-sm text-text-muted">ავტომატური დისპეტჩერი:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-mono border border-emerald-200 font-semibold">
                  Live PostgreSQL Connected
                </span>
              </div>
            </div>

            {dispatchSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  <span className="font-semibold">{dispatchSuccessMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchSuccessMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {dispatchErrorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-sm animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-[20px]">error</span>
                  <span className="font-semibold">{dispatchErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchErrorMessage(null)}
                  className="text-rose-700 hover:text-rose-900 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleDispatchTask}>
              {/* =============================================================== */}
              {/* STEP 1: ROLE CHECKBOXES & STAFF DROPDOWN -> SELECTED STAFF BOX */}
              {/* =============================================================== */}
              <div className="rounded-xl border border-border-subtle bg-slate-50/70 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center font-mono">
                      1
                    </span>
                    <div>
                      <h3 className="text-body-md font-bold text-text-primary">
                        თანამშრომლის ფუნქციის (როლის) და შემსრულებლის შერჩევა
                      </h3>
                      <p className="text-xs text-text-muted">
                        მონიშნეთ თანამშრომლის ფუნქცია სისტემაში, რათა გამოჩნდეს შესაბამისი თანამშრომლების სია
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map((r) => {
                    const isChecked = selectedStaffRole === r.code;
                    const countInRole = staffOptions.filter((s) => s.role === r.code).length;
                    return (
                      <div
                        key={r.code}
                        onClick={() => {
                          setSelectedStaffRole(r.code);
                          setIsStaffDropdownOpen(true);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'bg-blue-50/90 border-primary ring-2 ring-primary/15 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-text-primary truncate">{r.label}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                              {countInRole}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-tight">{r.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Staff Slot (Field where clicked employee drops in) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
                  <div className="lg:col-span-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      შერჩეული შემსრულებელი თანამშრომელი (ველი):
                    </label>
                    {chosenStaff ? (
                      <div className="p-3.5 rounded-xl bg-white border-2 border-emerald-500 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-300">
                            {chosenStaff.fullName?.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-text-primary truncate">
                                {chosenStaff.fullName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                არჩეულია
                              </span>
                            </div>
                            <div className="text-xs text-text-muted truncate">
                              {chosenStaff.roleTitle} • აქტიური საქმეები:{' '}
                              <strong className="font-mono text-text-primary">{chosenStaff.activeTaskCount}</strong>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 cursor-pointer"
                        >
                          {isStaffDropdownOpen ? 'სიის დამალვა' : 'შეცვლა'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border-2 border-dashed border-amber-300 text-amber-800 text-xs flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 text-[20px]">person_search</span>
                        <span>
                          მარჯვენა სიიდან აირჩიეთ სასურველი თანამშრომელი
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Staff List for the checked Role */}
                  <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        თანამშრომლების სია ({filteredStaffByRole.length}) — აირჩიეთ შემსრულებელი:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{isStaffDropdownOpen ? 'ჩაკეცვა' : 'ჩამოშლა'}</span>
                        <span className="material-symbols-outlined text-[16px]">
                          {isStaffDropdownOpen ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                    </div>

                    {isStaffDropdownOpen && (
                      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-56 overflow-y-auto shadow-2xs">
                        {filteredStaffByRole.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-muted">
                            ამ როლზე თანამშრომლები ვერ მოიძებნა
                          </div>
                        ) : (
                          filteredStaffByRole.map((s) => {
                            const isSelected = s.id === selectedStaffId;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStaffId(s.id);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                                  isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-slate-300 bg-white text-transparent'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-text-primary truncate">
                                      {s.fullName}
                                    </div>
                                    <div className="text-[11px] text-text-muted truncate">
                                      {s.roleTitle} • {s.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                                    {s.activeTaskCount} საქმე
                                  </span>
                                  <span className="text-xs font-semibold text-primary">
                                    {isSelected ? 'არჩეულია' : 'არჩევა →'}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =============================================================== */}
              {/* STEP 2: CREDITOR (CLIENT COMPANY) SELECTION                     */}
              {/* =============================================================== */}
              <div className="rounded-xl border border-border-subtle bg-slate-50/70 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center font-mono">
                      2
                    </span>
                    <div>
                      <h3 className="text-body-md font-bold text-text-primary">
                        კრედიტორის (დამკვეთი კომპანიის) პორტფელის შერჩევა
                      </h3>
                      <p className="text-xs text-text-muted">
                        აირჩიეთ კრედიტორი კომპანია, რათა გაიშალოს მისი დებიტორების რეესტრი
                      </p>
                    </div>
                  </div>
                  {activeCreditorGroup && (
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
                      არჩეული კრედიტორი: {activeCreditorGroup.creditorName} ({activeCreditorGroup.claims.length} დებიტორი)
                    </span>
                  )}
                </div>

                {/* Creditor Cards / Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {creditorGroups.map((grp) => {
                    const isSelectedCreditor = selectedCreditorName === grp.creditorName;
                    return (
                      <div
                        key={grp.creditorName}
                        onClick={() => {
                          setSelectedCreditorName(grp.creditorName);
                          setSelectedClaimIds([]);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isSelectedCreditor
                            ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-600/15 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelectedCreditor
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px]">domain</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-text-primary truncate">
                                {grp.creditorName}
                              </div>
                              <div className="text-[11px] font-mono text-text-muted">
                                ს/კ: {grp.creditorTaxId}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelectedCreditor
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white text-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            დებიტორები: <strong className="font-mono text-indigo-700">{grp.claims.length}</strong>
                          </span>
                          <span className="font-mono font-bold text-text-primary">
                            {grp.totalAmount.toLocaleString('ka-GE')} ₾
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =============================================================== */}
              {/* STEP 3: CREDITOR'S DEBTORS REGISTRY WITH CHECKBOXES & CALCULATOR*/}
              {/* =============================================================== */}
              <div className="rounded-xl border border-border-subtle bg-white p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center font-mono">
                      3
                    </span>
                    <div>
                      <h3 className="text-body-md font-bold text-text-primary">
                        {activeCreditorGroup
                          ? `„${activeCreditorGroup.creditorName}“-ს დებიტორების რეესტრი და კალკულატორი`
                          : 'დებიტორების რეესტრი და კალკულატორი'}
                      </h3>
                      <p className="text-xs text-text-muted">
                        მონიშნეთ სასურველი დებიტორები — კალკულატორი ავტომატურად დააჯამებს შერჩეულ თანხებს
                      </p>
                    </div>
                  </div>

                  {/* LIVE CALCULATOR WIDGET */}
                  <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-5 py-3 rounded-xl shadow-md border border-indigo-500/30">
                    <div className="flex items-center gap-2.5 pr-4 border-r border-white/15">
                      <span className="material-symbols-outlined text-amber-400 text-[24px]">calculate</span>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                          მონიშნული დებიტორები
                        </div>
                        <div className="text-base font-mono font-bold text-white">
                          {selectedClaimObjects.length}{' '}
                          <span className="text-xs font-normal text-slate-300">
                            / {activeCreditorGroup ? activeCreditorGroup.claims.length : 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">
                        ჯამური თანხა (კალკულაცია)
                      </div>
                      <div className="text-xl font-mono font-extrabold text-emerald-400 tracking-tight">
                        {selectedTotalAmount.toLocaleString('ka-GE')} ₾
                      </div>
                    </div>
                    {selectedClaimObjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedClaimIds([])}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-medium transition cursor-pointer"
                      >
                        განულება
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Calculation Breakdown Ribbon (shows e.g. 100 ₾ + 300 ₾ + 500 ₾ = 900 ₾) */}
                {selectedClaimObjects.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">functions</span>
                        <span>შერჩეული დებიტორების დაჯამების ლენტი:</span>
                      </span>
                      <span className="font-mono text-sm text-emerald-800">
                        სულ: {selectedTotalAmount.toLocaleString('ka-GE')} ₾
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedClaimObjects.map((cl, idx) => (
                        <React.Fragment key={cl.id}>
                          {idx > 0 && (
                            <span className="font-mono font-bold text-emerald-700 text-xs">+</span>
                          )}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-medium text-slate-800 shadow-2xs">
                            <span className="truncate max-w-[140px]">{cl.debtorName}</span>
                            <strong className="font-mono text-emerald-700">
                              {Number(cl.remainingAmount).toLocaleString('ka-GE')} ₾
                            </strong>
                            <button
                              type="button"
                              onClick={() => toggleClaimCheckbox(cl.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                              title="მოხსნა"
                            >
                              ×
                            </button>
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="font-mono font-bold text-emerald-900 text-xs ml-1">
                        = {selectedTotalAmount.toLocaleString('ka-GE')} ₾
                      </span>
                    </div>
                  </div>
                )}

                {!activeCreditorGroup ? (
                  <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <span className="material-symbols-outlined text-4xl text-indigo-400 mb-2">domain_verification</span>
                    <p className="text-body-md font-bold text-text-primary">
                      გთხოვთ ზემოთ (ნაბიჯი 2) აირჩიოთ კრედიტორი კომპანია
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      კრედიტორის არჩევისთანავე გამოჩნდება მისი დებიტორების სრული რეესტრი და კალკულატორი
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search & Select All Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={portfolioDebtorSearch}
                          onChange={(e) => setPortfolioDebtorSearch(e.target.value)}
                          placeholder="დებიტორის ძებნა სახელით, პ/ნ-ით ან საქმის №-ით..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleSelectAllVisible}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            {areAllVisibleSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span>
                            {areAllVisibleSelected
                              ? 'ყველას მოხსნა'
                              : `ყველას მონიშვნა (${visibleCreditorClaims.length})`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Debtors Table with Checkboxes */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-body-sm">
                        <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-bold">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={areAllVisibleSelected}
                                onChange={toggleSelectAllVisible}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </th>
                            <th className="py-3 px-3">დებიტორი</th>
                            <th className="py-3 px-3">პ/ნ ან ს/კ</th>
                            <th className="py-3 px-3">საქმე / ხელშეკრულება</th>
                            <th className="py-3 px-3 text-center">ვადაგადაცილება</th>
                            <th className="py-3 px-3 text-right">დავალიანება (ნაშთი)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleCreditorClaims.map((cl) => {
                            const isChecked = selectedClaimIds.includes(cl.id);
                            return (
                              <tr
                                key={cl.id}
                                onClick={() => toggleClaimCheckbox(cl.id)}
                                className={`transition-colors cursor-pointer ${
                                  isChecked ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleClaimCheckbox(cl.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-text-primary flex items-center gap-2">
                                    <span>{cl.debtorName}</span>
                                    {isChecked && (
                                      <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[10px] font-bold">
                                        + {Number(cl.remainingAmount).toLocaleString('ka-GE')} ₾
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-text-muted">{cl.debtorAddress}</div>
                                </td>
                                <td className="py-3 px-3 font-mono text-xs text-slate-700">
                                  {cl.debtorPersonalId}
                                </td>
                                <td className="py-3 px-3 font-mono text-xs text-slate-600">
                                  <div>#{cl.caseNumber}</div>
                                  <div className="text-[10px] text-text-muted">{cl.agreementNumber}</div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono text-xs font-semibold">
                                    {cl.daysOverdue} დღე
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-text-primary text-sm">
                                  {Number(cl.remainingAmount).toLocaleString('ka-GE')} ₾
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Priority & Instructions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-2">
                    დავალების პრიორიტეტი <span className="text-rating-c">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="high"
                        checked={dispatchPriority === 'high'}
                        onChange={() => setDispatchPriority('high')}
                        className="peer sr-only"
                      />
                      <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-red-50 peer-checked:text-red-700 peer-checked:border-red-300 transition-all flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rating-c" />
                        <span>სასწრაფო</span>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="medium"
                        checked={dispatchPriority === 'medium'}
                        onChange={() => setDispatchPriority('medium')}
                        className="peer sr-only"
                      />
                      <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-checked:border-amber-300 transition-all flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>საშუალო</span>
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value="low"
                        checked={dispatchPriority === 'low'}
                        onChange={() => setDispatchPriority('low')}
                        className="peer sr-only"
                      />
                      <div className="py-2.5 px-3 rounded-lg bg-surface-bg border border-slate-300 text-center text-body-sm font-body-sm font-medium text-slate-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 peer-checked:border-emerald-300 transition-all flex items-center justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>დაბალი</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-body-sm font-body-sm font-medium text-text-primary">
                      დავალების შინაარსი &amp; შიდა ინსტრუქცია (Internal Memo)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() =>
                          setDispatchInstructions(
                            'დაუკავშირდით მოვალეს, გადაამოწმეთ დაფარვის მზადყოფნა და დააფიქსირეთ შეთანხმებული თარიღი.'
                          )
                        }
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                        type="button"
                      >
                        + სატელეფონო შეხსენება
                      </button>
                      <button
                        onClick={() =>
                          setDispatchInstructions(
                            'მოვალეს გაეგზავნოს ოფიციალური გაფრთხილება და მომზადდეს სარჩელი სასამართლოში წარსადგენად.'
                          )
                        }
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                        type="button"
                      >
                        + სარჩელის მომზადება
                      </button>
                      <button
                        onClick={() =>
                          setDispatchInstructions(
                            'განახორციელეთ საველე ვიზიტი იურიდიულ/ფაქტობრივ მისამართზე, შეადგინეთ ინსპექციის ოქმი.'
                          )
                        }
                        className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-primary border border-border-subtle transition-colors cursor-pointer"
                        type="button"
                      >
                        + ადგილზე ვიზიტი
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={dispatchInstructions}
                    onChange={(e) => setDispatchInstructions(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="ჩაწერეთ კონკრეტული დავალება თანამშრომლისთვის..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Bottom Actions / Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    შემსრულებელი:{' '}
                    <strong className="text-text-primary">{chosenStaff ? chosenStaff.fullName : 'არ არის შერჩეული'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    შერჩეული დებიტორები:{' '}
                    <strong className="font-mono text-primary">{selectedClaimObjects.length}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ჯამური პორტფელი:{' '}
                    <strong className="font-mono text-emerald-700">
                      {selectedTotalAmount.toLocaleString('ka-GE')} ₾
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedClaimIds([]);
                      setDispatchInstructions('');
                    }}
                    className="w-1/2 sm:w-auto px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-50 text-body-md font-body-md transition-colors cursor-pointer"
                    type="button"
                  >
                    გასუფთავება
                  </button>
                  <button
                    disabled={isDispatching}
                    className="w-1/2 sm:w-auto px-6 py-2.5 rounded-lg bg-primary hover:bg-[#0A37CA] disabled:opacity-50 text-white font-medium text-body-md font-body-md shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>
                      {isDispatching
                        ? 'იგზავნება...'
                        : `პორტფელის გადაცემა (${selectedClaimObjects.length} დებიტორი • ${selectedTotalAmount.toLocaleString('ka-GE')} ₾)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </section>
        );
      })()}
      </>
      ) : activeView === 'debtors-registry' ? (
      <>
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                  დებიტორთა რეესტრი
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono text-xs font-bold">
                  {excelDebtors.length} ჩანაწერი
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                დებიტორთა სრული მონაცემთა ბაზა და დავალიანებების რეესტრი
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={debtorsSearch}
                onChange={(e) => setDebtorsSearch(e.target.value)}
                placeholder="ძიება სახელით, პ/ნ-ით, ს/კ-ით ან კრედიტორით..."
                className="pl-9 pr-4 py-2 bg-surface-bg border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-72"
              />
            </div>
            <button
              type="button"
              onClick={loadAnalystData}
              disabled={loadingData}
              className="px-3.5 py-2 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 text-body-sm text-text-primary font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loadingData ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>განახლება</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">პირადი ნომერი / ს/კ</th>
                <th className="py-3 px-4">მოვალის სახელი &amp; გვარი / კომპანია</th>
                <th className="py-3 px-4">სუბიექტის ტიპი</th>
                <th className="py-3 px-4">ხელშეკრულების №</th>
                <th className="py-3 px-4">დავალიანება (GEL)</th>
                <th className="py-3 px-4">კრედიტორი</th>
                <th className="py-3 px-4">ვადაგადაცილება</th>
                <th className="py-3 px-4">პლატფორმაზე სტატუსი</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
              {excelDebtors
                .filter((d) => {
                  if (!debtorsSearch.trim()) return true;
                  const q = debtorsSearch.toLowerCase();
                  return (
                    d.name?.toLowerCase().includes(q) ||
                    d.personalId?.toLowerCase().includes(q) ||
                    d.creditorName?.toLowerCase().includes(q) ||
                    d.agreementNumber?.toLowerCase().includes(q)
                  );
                })
                .map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                      {d.personalId}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {d.name}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-body-sm">
                      {d.companyOrPerson || 'ფიზიკური პირი'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {d.agreementNumber || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {Number(d.amount).toLocaleString('ka-GE')} ₾
                    </td>
                    <td className="py-3 px-4 text-body-sm text-text-primary font-medium">
                      {d.creditorName || 'შპს ჯეო ტრეიდინგი'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {d.overdueDays > 0 ? (
                        <span className="text-amber-700 font-semibold">{d.overdueDays} დღე</span>
                      ) : (
                        <span className="text-emerald-700">ვადაშია</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {d.isRegisteredOnPlatform ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          რეგისტრირებულია
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">არ არის რეგისტრირებული</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      </>
      ) : activeView === 'creditors-registry' ? (
      <>
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-800 text-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                  კრედიტორთა რეესტრი
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-mono text-xs font-bold">
                  {excelCreditors.length} კრედიტორი
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                კრედიტორ კომპანიათა მონაცემთა ბაზა, პორტფელის მოცულობა და დებიტორების მიბმა
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={creditorsSearch}
                onChange={(e) => setCreditorsSearch(e.target.value)}
                placeholder="ძიება კომპანიით, ს/კ-ით ან წარმომადგენლით..."
                className="pl-9 pr-4 py-2 bg-surface-bg border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-72"
              />
            </div>
            <button
              type="button"
              onClick={loadAnalystData}
              disabled={loadingData}
              className="px-3.5 py-2 rounded-lg border border-border-subtle bg-surface-bg hover:bg-slate-100 text-body-sm text-text-primary font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${loadingData ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>განახლება</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRegistrationOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-body-sm shadow-xs shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">domain_add</span>
              <span>+ კრედიტორის რეგისტრაცია</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-2xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">საიდენტიფიკაციო კოდი (ს/კ)</th>
                <th className="py-3 px-4">კომპანიის დასახელება</th>
                <th className="py-3 px-4">საკონტაქტო პირი / დირექტორი</th>
                <th className="py-3 px-4">პორტფელის მოცულობა (GEL)</th>
                <th className="py-3 px-4">ხელშეკრულების №</th>
                <th className="py-3 px-4">დებიტორები</th>
                <th className="py-3 px-4">პლატფორმაზე სტატუსი</th>
                <th className="py-3 px-4 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
              {excelCreditors
                .filter((c) => {
                  if (!creditorsSearch.trim()) return true;
                  const q = creditorsSearch.toLowerCase();
                  return (
                    c.name?.toLowerCase().includes(q) ||
                    c.personalId?.toLowerCase().includes(q) ||
                    c.companyOrPerson?.toLowerCase().includes(q) ||
                    c.agreementNumber?.toLowerCase().includes(q)
                  );
                })
                .map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                      {c.personalId}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-body-sm">
                      {c.companyOrPerson || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {Number(c.amount).toLocaleString('ka-GE')} ₾
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {c.agreementNumber || 'PORT-01'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        <span>{c.debtorsCount || 0} დებიტორი</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.isRegisteredOnPlatform ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          რეგისტრირებულია
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">არ არის რეგისტრირებული</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCreditorForDebtor(c);
                            setAddDebtorModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="დებიტორის დამატება ამ კრედიტორისთვის"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          <span>+ დებიტორის მიბმა</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {addDebtorModalOpen && targetCreditorForDebtor && (
        <AddDebtorModal
          isOpen={addDebtorModalOpen}
          onClose={() => {
            setAddDebtorModalOpen(false);
            setTargetCreditorForDebtor(null);
          }}
          creditorName={targetCreditorForDebtor.name}
          creditorTaxId={targetCreditorForDebtor.personalId}
          onAdd={async (debtorData: DebtorFormData) => {
            await handleAddDebtorToExistingCreditor(targetCreditorForDebtor.personalId, debtorData);
          }}
        />
      )}
      </>
      ) : (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center text-center px-4 select-none">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
          space_dashboard
        </span>
        <p className="text-base font-medium text-slate-400">
          ანალიტიკოსის მთავარი გვერდი
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          სამუშაოდ გთხოვთ მარცხენა „მთავარი კონსოლიდან“ აირჩიოთ სასურველი სექცია.
        </p>
      </div>
      )}
    </main>
  </div>
  {/* ========================================================================= */}
  {/* HIGH-FIDELITY SUBJECT REGISTRATION MODAL / POPUP DIALOG */}
  {/* ========================================================================= */}
  <div aria-labelledby="modal-title" aria-modal="true" className={`fixed inset-0 z-50 overflow-y-auto ${isRegistrationOpen ? '' : 'hidden'}`} id="subjectRegistrationModal" role="dialog">
    {/* Backdrop */}
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsRegistrationOpen(false)} />
    {/* Modal Center Container */}
    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
      <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-3xl border border-border-subtle" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-surface-card px-6 py-5 border-b border-border-subtle flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">domain_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary" id="modal-title">
                  ახალი კრედიტორის რეგისტრაცია
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-[11px] border border-emerald-200 font-semibold hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  RS.GE Sync
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                მოთხოვნის მფლობელი ორგანიზაციის რეგისტრაცია, პორტფელის გახსნა და დებიტორების მიბმა
              </p>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setIsRegistrationOpen(false)} title="დახურვა">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {/* Modal Body Form Area */}
        <div className="p-6 max-h-[calc(85vh-200px)] overflow-y-auto space-y-5">
          {/* Category */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3 text-body-sm">
              <span className="font-semibold text-text-primary text-xs uppercase tracking-wider text-slate-500">
                კრედიტორის კატეგორია:
              </span>
              <select
                value={creditorCategory}
                onChange={(e) => setCreditorCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-body-sm text-text-primary font-medium focus:outline-none focus:border-primary"
              >
                <option value="კომერციული ორგანიზაცია / B2B">კომერციული ორგანიზაცია / B2B</option>
                <option value="საბანკო ინსტიტუტი">საბანკო ინსტიტუტი</option>
                <option value="მიკროსაფინანსო ორგანიზაცია">მიკროსაფინანსო ორგანიზაცია</option>
                <option value="კერძო საინვესტიციო ფონდი">კერძო საინვესტიციო ფონდი</option>
              </select>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 hidden md:inline">
              მოთხოვნის მფლობელი ორგანიზაცია
            </span>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-body-sm font-medium text-text-primary">
                  საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) <span className="text-rating-c">*</span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {creditorTaxId.length}/9
                </span>
              </div>
              <input
                className={`w-full bg-white border ${creditorFormErrors.taxId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                placeholder="მაგ: 204876221"
                type="text"
                maxLength={9}
                value={creditorTaxId}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setCreditorTaxId(val);
                  if (creditorFormErrors.taxId) {
                    setCreditorFormErrors({ ...creditorFormErrors, taxId: '' });
                  }
                }}
              />
              {creditorFormErrors.taxId && (
                <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.taxId}</p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                კრედიტორი კომპანიის დასახელება <span className="text-rating-c">*</span>
              </label>
              <input
                className={`w-full bg-white border ${creditorFormErrors.companyName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                placeholder="მაგ: შპს „ალფა ფინანსი“"
                type="text"
                value={creditorCompanyName}
                onChange={(e) => {
                  setCreditorCompanyName(e.target.value);
                  if (creditorFormErrors.companyName) {
                    setCreditorFormErrors({ ...creditorFormErrors, companyName: '' });
                  }
                }}
              />
              {creditorFormErrors.companyName && (
                <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                ხელშეკრულების საფუძველი &amp; № <span className="text-rating-c">*</span>
              </label>
              <input
                className={`w-full bg-white border ${creditorFormErrors.agreement ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                placeholder="მაგ: ხელშ. #B2B-2024/09"
                type="text"
                value={creditorAgreement}
                onChange={(e) => {
                  setCreditorAgreement(e.target.value);
                  if (creditorFormErrors.agreement) {
                    setCreditorFormErrors({ ...creditorFormErrors, agreement: '' });
                  }
                }}
              />
              {creditorFormErrors.agreement && (
                <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.agreement}</p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                უფლებამოსილი წარმომადგენელი
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                placeholder="სახელი, გვარი, პოზიცია"
                type="text"
                value={creditorRepresentative}
                onChange={(e) => setCreditorRepresentative(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                საკონტაქტო ტელეფონი
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                placeholder="+995 599 000000"
                type="tel"
                value={creditorPhone}
                onChange={(e) => setCreditorPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                ელ-ფოსტა
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                placeholder="info@creditor.ge"
                type="email"
                value={creditorEmail}
                onChange={(e) => setCreditorEmail(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                საბანკო რეკვიზიტები (IBAN ანგარიშსწორებისთვის)
              </label>
              <input
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                placeholder="GE00TB0000000000000000"
                type="text"
                value={creditorIban}
                onChange={(e) => setCreditorIban(e.target.value.toUpperCase())}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                საწყისი მოთხოვნის დავალიანებული მოცულობა (GEL)
              </label>
              <div className="relative flex items-center">
                <input
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={creditorInitialAmount}
                  onChange={(e) => setCreditorInitialAmount(e.target.value)}
                />
                <span className="absolute right-3 font-mono text-text-muted text-body-sm font-semibold">₾</span>
              </div>
            </div>
          </div>

          {/* Attached Debtors Section */}
          <div className="border border-border-subtle rounded-xl overflow-hidden bg-slate-50/50">
            <div className="p-3.5 bg-slate-50 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">group_add</span>
                <span className="text-body-sm font-bold text-text-primary">
                  ამ კრედიტორზე მიმაგრებული დებიტორები ({creditorDebtorsList.length})
                </span>
                <span className="text-xs text-text-muted">
                  (სულ: {creditorDebtorsList.reduce((acc, d) => acc + (parseFloat(String(d.amount)) || 0), 0).toLocaleString()} ₾)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDebtorForNewCreditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ დებიტორის დამატება</span>
              </button>
            </div>

            <div className="p-4 bg-white">
              {creditorDebtorsList.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <span className="material-symbols-outlined text-[32px] text-slate-300">person_off</span>
                  <p className="text-xs mt-1">ჯერ დებიტორები არ არის დამატებული.</p>
                  <p className="text-[11px] text-slate-400">
                    დააჭირეთ „+ დებიტორის დამატება“-ს რათა გახსნათ 9/13 ველიანი ფორმა და მიაბათ დებიტორები.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {creditorDebtorsList.map((debtor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            debtor.entityType === 'LEGAL'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {debtor.entityType === 'LEGAL' ? 'იურიდიული (ს/კ)' : 'ფიზიკური (პ/ნ)'}
                        </span>
                        <span className="font-semibold text-text-primary">{debtor.name}</span>
                        <span className="text-text-muted font-mono">
                          {debtor.entityType === 'LEGAL' ? debtor.taxId : debtor.personalId}
                        </span>
                        <span className="text-slate-500 font-mono">
                          ვადა: {debtor.overdueDays || 0} დღე
                        </span>
                        <span className="text-primary font-mono font-bold">
                          {Number(debtor.amount || 0).toLocaleString()} ₾
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreditorDebtorsList(creditorDebtorsList.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="წაშლა"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Proof of Debt Attachment - Real Interactive Upload Panel */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">attach_file</span>
                დავალიანების დამადასტურებელი დოკუმენტები (სავალდებულო):
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>RS.GE / საბუღალტრო დასტური</span>
              </span>
            </div>
            <p className="text-xs text-text-muted">
              ატვირთეთ ნამდვილი დოკუმენტები, რაც დაადასტურებს დებიტორული დავალიანების რეალურ არსებობას (სასაქონლო ზედნადები, საბუღალტრო ბრუნვითი ბარათი, ხელშეკრულება, მიღება-ჩაბარების აქტი ან საბანკო ამონაწერი).
            </p>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingDocs(true);
              }}
              onDragLeave={() => setIsDraggingDocs(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingDocs(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleDocFilesSelected(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                isDraggingDocs
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                  : 'border-slate-300 hover:border-primary/60 bg-white'
              }`}
            >
              <input
                type="file"
                id="analyst-creditor-doc-upload"
                multiple
                accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleDocFilesSelected(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <label
                htmlFor="analyst-creditor-doc-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary hover:underline">
                    ჩააგდეთ ფაილები აქ
                  </span>
                  <span className="text-xs text-slate-500"> ან </span>
                  <span className="text-xs font-semibold text-slate-700 underline">
                    აირჩიეთ კომპიუტერიდან
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  მხარდაჭერილია: PDF, Excel (.xlsx, .xls), Word (.docx), სურათები (PNG, JPG)
                </div>
              </label>
            </div>

            {/* List of Attached Documents */}
            {attachedDocuments.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span>
                    ატვირთული დოკუმენტები ({attachedDocuments.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedDocuments([])}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    ყველას გასუფთავება
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {attachedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {doc.name.toLowerCase().endsWith('.pdf') ? (
                            <span className="material-symbols-outlined text-rose-600 text-[20px]">picture_as_pdf</span>
                          ) : doc.name.toLowerCase().endsWith('.xlsx') || doc.name.toLowerCase().endsWith('.xls') || doc.name.toLowerCase().endsWith('.csv') ? (
                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">table_view</span>
                          ) : doc.name.toLowerCase().endsWith('.docx') || doc.name.toLowerCase().endsWith('.doc') ? (
                            <span className="material-symbols-outlined text-blue-600 text-[20px]">article</span>
                          ) : (
                            <span className="material-symbols-outlined text-indigo-600 text-[20px]">description</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 truncate" title={doc.name}>
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{doc.sizeFormatted}</span>
                            <span>•</span>
                            <span>ატვირთულია: {doc.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <select
                          value={doc.category}
                          onChange={(e) => handleUpdateDocumentCategory(doc.id, e.target.value)}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="სასაქონლო ზედნადები (RS.GE)">ზედნადები (RS.GE)</option>
                          <option value="ბრუნვითი უწყისი / ბარათი">ბრუნვითი ბარათი</option>
                          <option value="ხელშეკრულება">ხელშეკრულება</option>
                          <option value="მიღება-ჩაბარების აქტი">მიღება-ჩაბარება</option>
                          <option value="საბანკო ამონაწერი">საბანკო ამონაწერი</option>
                          <option value="სასამართლო / სააღსრულებო აქტი">სასამართლო/სააღსრულებო</option>
                          <option value="სხვა დამადასტურებელი დოკუმენტი">სხვა დოკუმენტი</option>
                        </select>

                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200 whitespace-nowrap">
                          ✓ ატვირთულია
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="w-7 h-7 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="დოკუმენტის წაშლა"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
                <span>
                  გთხოვთ მიაბათ მინიმუმ ერთი დამადასტურებელი დოკუმენტი (RS.GE ზედნადები ან ბრუნვითი ბარათი) მოთხოვნის ვალიდურობისთვის.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-surface-bg px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadDebtorTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[#0A37CA] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="შაბლონის ჩამოტვირთვა (.xlsx)"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
              <span>შაბლონის ჩამოტვირთვა (.xlsx)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-primary bg-white border border-border-subtle px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">upload_file</span>
              <span>Excel ფაილის იმპორტი (.xlsx / .xls)</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleAnalystImportExcel}
              />
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              className="px-4 py-2 rounded-lg border border-border-subtle bg-white text-slate-700 hover:bg-slate-100 text-body-md font-medium transition-colors cursor-pointer"
              onClick={() => setIsRegistrationOpen(false)}
              type="button"
            >
              გაუქმება
            </button>
            <button
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-body-md shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              disabled={registeringCreditor}
              onClick={handleRegisterCreditorSubmit}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span>{registeringCreditor ? 'მიმდინარეობს რეგისტრაცია...' : 'კრედიტორის რეგისტრაცია & აქტივაცია'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Modal for adding Debtor to the new creditor being registered */}
  <AddDebtorModal
    isOpen={isAddDebtorForNewCreditorOpen}
    onClose={() => setIsAddDebtorForNewCreditorOpen(false)}
    creditorName={creditorCompanyName || 'ახალი კრედიტორი'}
    creditorTaxId={creditorTaxId}
    onAdd={(newDebtor: DebtorFormData) => {
      setCreditorDebtorsList((prev) => [...prev, newDebtor]);
    }}
  />
  {/* ========================================================================= */}
  {/* JAVASCRIPT FOR MODAL & TABS */}
  {/* ========================================================================= */}
  {/* ========================================================================= */}
  {/* SHARED FOOTER COMPONENT */}
  {/* ========================================================================= */}
  <footer className="w-full bg-surface-card border-t border-border-subtle mt-auto">
    <div className="w-full px-4 lg:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center">
          <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
          <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
        </div>
        <span className="hidden sm:inline text-slate-300">•</span>
        <p className="text-body-sm font-body-sm text-text-muted text-center sm:text-left">
          © 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-6 text-body-sm font-body-sm text-text-muted">
        <a className="hover:text-primary transition-colors hover:underline" href="#">კონფიდენციალურობის პოლიტიკა</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">მომსახურების პირობები</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">რეკვიზიტები</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">საგადასახადო შემოწმება</a>
        <a className="hover:text-primary transition-colors hover:underline" href="#">საკონტაქტო პირი</a>
      </nav>
    </div>
  </footer>
</div>

    </div>
  );
}
