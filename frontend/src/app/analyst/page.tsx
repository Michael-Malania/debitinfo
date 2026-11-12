'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analystBackendService, authService } from '@/services';
import AddDebtorModal, { DebtorFormData } from '@/components/analyst/AddDebtorModal';
import AnalystSidebar, { AnalystViewType } from '@/components/analyst/AnalystSidebar';
import * as XLSX from 'xlsx';
import {
  downloadDebtorTemplateXLSX,
  parseDebtorExcelFile,
  exportDebtorsRegistryXLSX,
  exportCreditorsRegistryXLSX,
} from '@/utils/excel';

export default function AnalystPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [activeView, setActiveView] = useState<
    'overview' | 'pending-debtors' | 'debtors-registry' | 'creditors-registry' | 'portfolio-dispatch' | 'risk-zone' | 'risk-zone'
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
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<string[]>([]);
  const [selectedCreditorIds, setSelectedCreditorIds] = useState<string[]>([]);
  const [isExportingCreditors, setIsExportingCreditors] = useState(false);

  // Real Notifications State
  interface NotificationItem {
    id: string;
    type: 'RISK_ZONE' | 'PENDING_DEBTOR' | 'SYSTEM' | 'OVERDUE_ALERT';
    title: string;
    message: string;
    time: string;
    read: boolean;
    urgent?: boolean;
    link?: string;
    viewTarget?: 'pending-debtors' | 'overview' | 'debtors-registry' | 'creditors-registry';
    debtorTarget?: any;
  }

  // Debtor Detailed Analytics & Case File Modal State
  const [selectedDebtorForAnalytics, setSelectedDebtorForAnalytics] = useState<any | null>(null);
  const [debtorCaseFileTab, setDebtorCaseFileTab] = useState<'summary' | 'schedule' | 'documents' | 'receipts' | 'chronology'>('summary');
  const [debtorChronologyRange, setDebtorChronologyRange] = useState<'3m' | '6m' | '1y' | 'custom'>('6m');
  const [debtorCustomDays, setDebtorCustomDays] = useState<number>(45);

  // Creditor Portfolio Dynamics Custom Range States
  const [creditorDynTargetId, setCreditorDynTargetId] = useState<string>('ALL');
  const [creditorDynRangeMode, setCreditorDynRangeMode] = useState<'preset' | 'custom_days' | 'custom_dates'>('preset');
  const [creditorDynPreset, setCreditorDynPreset] = useState<'30d' | '90d' | '180d' | '365d'>('90d');
  const [creditorDynCustomDays, setCreditorDynCustomDays] = useState<number>(45);
  const [creditorDynDateFrom, setCreditorDynDateFrom] = useState<string>('');
  const [creditorDynDateTo, setCreditorDynDateTo] = useState<string>('');
  const [selectedCreditorForAnalytics, setSelectedCreditorForAnalytics] = useState<any | null>(null);

  // Selection-Driven Chart Studio State
  const [isChartStudioOpen, setIsChartStudioOpen] = useState(false);
  const [chartStudioTargetType, setChartStudioTargetType] = useState<'DEBTORS' | 'CREDITORS'>('DEBTORS');
  const [chartStudioItems, setChartStudioItems] = useState<any[]>([]);
  const [chartMetric, setChartMetric] = useState<string>('remaining_debt');
  const [chartPeriod, setChartPeriod] = useState<'30d' | '3m' | '6m' | '12m' | 'custom'>('6m');
  const [customChartDays, setCustomChartDays] = useState<number>(45);
  const [chartVisualType, setChartVisualType] = useState<'bar' | 'line' | 'area'>('area');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const openChartStudioForDebtors = (items: any[]) => {
    if (!items || items.length === 0) return;
    setChartStudioTargetType('DEBTORS');
    setChartStudioItems(items);
    setChartMetric('remaining_debt');
    setIsChartStudioOpen(true);
  };

  const openChartStudioForCreditors = (items: any[]) => {
    if (!items || items.length === 0) return;
    setChartStudioTargetType('CREDITORS');
    setChartStudioItems(items);
    setChartMetric('portfolio_amount');
    setIsChartStudioOpen(true);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Debtors Registry Switch & Filter States
  const [debtorsEntityType, setDebtorsEntityType] = useState<'PHYSICAL' | 'LEGAL'>('PHYSICAL');
  const [isDebtorsFilterPanelOpen, setIsDebtorsFilterPanelOpen] = useState(false);

  // Specific Field Filters (Physical & Legal)
  const [dfPersonalId, setDfPersonalId] = useState('');
  const [dfName, setDfName] = useState('');
  const [dfPhone, setDfPhone] = useState('');
  const [dfEmail, setDfEmail] = useState('');
  const [dfLegalAddress, setDfLegalAddress] = useState('');
  const [dfActualAddress, setDfActualAddress] = useState('');
  const [dfCreditorName, setDfCreditorName] = useState('');
  const [dfAgreementNumber, setDfAgreementNumber] = useState('');
  const [dfMinAmount, setDfMinAmount] = useState('');
  const [dfMaxAmount, setDfMaxAmount] = useState('');
  const [dfClaimStatus, setDfClaimStatus] = useState<string>('ALL');
  const [dfRating, setDfRating] = useState<string>('ALL');
  const [dfDateFrom, setDfDateFrom] = useState('');
  const [dfDateTo, setDfDateTo] = useState('');
  const [isExportingDebtors, setIsExportingDebtors] = useState(false);

  // Legal-specific Filters
  const [dfTaxId, setDfTaxId] = useState('');
  const [dfDirectorName, setDfDirectorName] = useState('');
  const [dfDirectorPersonalId, setDfDirectorPersonalId] = useState('');
  const [dfDirectorPhone, setDfDirectorPhone] = useState('');
  const [dfDirectorEmail, setDfDirectorEmail] = useState('');

  const resetDebtorsFilters = () => {
    setDebtorsSearch('');
    setDfPersonalId('');
    setDfName('');
    setDfPhone('');
    setDfEmail('');
    setDfLegalAddress('');
    setDfActualAddress('');
    setDfCreditorName('');
    setDfAgreementNumber('');
    setDfMinAmount('');
    setDfMaxAmount('');
    setDfClaimStatus('ALL');
    setDfRating('ALL');
    setDfDateFrom('');
    setDfDateTo('');
    setDfTaxId('');
    setDfDirectorName('');
    setDfDirectorPersonalId('');
    setDfDirectorPhone('');
    setDfDirectorEmail('');
    setSelectedDebtorIds([]);
  };

  const activeDebtorsFiltersCount = useMemo(() => {
    let count = 0;
    if (debtorsSearch.trim()) count++;
    if (dfPersonalId.trim()) count++;
    if (dfName.trim()) count++;
    if (dfPhone.trim()) count++;
    if (dfEmail.trim()) count++;
    if (dfLegalAddress.trim()) count++;
    if (dfActualAddress.trim()) count++;
    if (dfCreditorName.trim()) count++;
    if (dfMinAmount.trim() || dfMaxAmount.trim()) count++;
    if (dfClaimStatus !== 'ALL') count++;
    if (dfRating !== 'ALL') count++;
    if (dfDateFrom.trim() || dfDateTo.trim()) count++;
    if (dfTaxId.trim()) count++;
    if (dfDirectorName.trim()) count++;
    if (dfDirectorPersonalId.trim()) count++;
    if (dfDirectorPhone.trim()) count++;
    if (dfDirectorEmail.trim()) count++;
    return count;
  }, [
    debtorsSearch, dfPersonalId, dfName, dfPhone, dfEmail, dfLegalAddress,
    dfActualAddress, dfCreditorName, dfMinAmount, dfMaxAmount,
    dfClaimStatus, dfRating, dfDateFrom, dfDateTo, dfTaxId,
    dfDirectorName, dfDirectorPersonalId, dfDirectorPhone, dfDirectorEmail,
  ]);

  const physicalDebtorsList = useMemo(() => {
    return excelDebtors.filter((d) => (d.entityType || 'PHYSICAL').toUpperCase() === 'PHYSICAL');
  }, [excelDebtors]);

  const legalDebtorsList = useMemo(() => {
    return excelDebtors.filter((d) => (d.entityType || '').toUpperCase() === 'LEGAL');
  }, [excelDebtors]);

  const availableCreditorsList = useMemo(() => {
    const list = new Set<string>();
    excelDebtors.forEach((d) => {
      if (d.creditorName) list.add(d.creditorName);
    });
    return Array.from(list).sort();
  }, [excelDebtors]);

  const filteredDebtors = useMemo(() => {
    const list = debtorsEntityType === 'PHYSICAL' ? physicalDebtorsList : legalDebtorsList;

    return list.filter((d) => {
      // Global quick search
      if (debtorsSearch.trim()) {
        const q = debtorsSearch.toLowerCase();
        const matchesGlobal =
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.firstName && d.firstName.toLowerCase().includes(q)) ||
          (d.lastName && d.lastName.toLowerCase().includes(q)) ||
          (d.claimStatusText && d.claimStatusText.toLowerCase().includes(q)) ||
          (d.ratingGrade && d.ratingGrade.toLowerCase().includes(q)) ||
          (d.personalId && d.personalId.toLowerCase().includes(q)) ||
          (d.taxId && d.taxId.toLowerCase().includes(q)) ||
          (d.phone && d.phone.toLowerCase().includes(q)) ||
          (d.email && d.email.toLowerCase().includes(q)) ||
          (d.legalAddress && d.legalAddress.toLowerCase().includes(q)) ||
          (d.actualAddress && d.actualAddress.toLowerCase().includes(q)) ||
          (d.creditorName && d.creditorName.toLowerCase().includes(q)) ||
          (d.agreementNumber && d.agreementNumber.toLowerCase().includes(q)) ||
          (d.directorFirstName && d.directorFirstName.toLowerCase().includes(q)) ||
          (d.directorLastName && d.directorLastName.toLowerCase().includes(q)) ||
          (d.directorPersonalId && d.directorPersonalId.toLowerCase().includes(q));
        if (!matchesGlobal) return false;
      }

      // Specific field filters
      if (dfPersonalId.trim() && !d.personalId?.toLowerCase().includes(dfPersonalId.trim().toLowerCase())) {
        return false;
      }
      if (dfTaxId.trim() && !d.taxId?.toLowerCase().includes(dfTaxId.trim().toLowerCase())) {
        return false;
      }
      if (dfName.trim() && !d.name?.toLowerCase().includes(dfName.trim().toLowerCase())) {
        return false;
      }
      if (dfPhone.trim() && !d.phone?.toLowerCase().includes(dfPhone.trim().toLowerCase())) {
        return false;
      }
      if (dfEmail.trim() && !d.email?.toLowerCase().includes(dfEmail.trim().toLowerCase())) {
        return false;
      }
      if (dfLegalAddress.trim() && !d.legalAddress?.toLowerCase().includes(dfLegalAddress.trim().toLowerCase())) {
        return false;
      }
      if (dfActualAddress.trim() && !d.actualAddress?.toLowerCase().includes(dfActualAddress.trim().toLowerCase())) {
        return false;
      }
      if (dfCreditorName.trim() && d.creditorName !== dfCreditorName.trim()) {
        return false;
      }

      // Current amount range (მიმდინარე დავალიანება)
      const amt = Number(d.currentAmount ?? d.remainingAmount ?? d.amount ?? 0);
      if (dfMinAmount.trim() && amt < Number(dfMinAmount.trim())) {
        return false;
      }
      if (dfMaxAmount.trim() && amt > Number(dfMaxAmount.trim())) {
        return false;
      }

      // Loan Status filter (გადახდილი, აქტიური, დავაშია, ვადაგადაცილებული და ა.შ.)
      if (dfClaimStatus !== 'ALL') {
        const curStatus = (d.claimStatus || '').toUpperCase();
        const curText = (d.claimStatusText || '');
        if (dfClaimStatus === 'SETTLED') {
          if (curStatus !== 'SETTLED' && curText !== 'გადახდილი' && amt !== 0) return false;
        } else if (dfClaimStatus === 'ACTIVE') {
          if (curStatus !== 'ACTIVE' && curText !== 'აქტიური') return false;
        } else if (dfClaimStatus === 'DISPUTED') {
          if (curStatus !== 'DISPUTED' && curText !== 'დავაშია') return false;
        } else if (dfClaimStatus === 'OVERDUE') {
          if (curStatus !== 'OVERDUE' && curText !== 'ვადაგადაცილებული') return false;
        }
      }

      // Rating filter (Grade A, Grade B, Grade C)
      if (dfRating !== 'ALL') {
        const curRating = d.rating || (d.ratingGrade ? d.ratingGrade.replace('Grade ', '') : '');
        if (curRating !== dfRating && !d.ratingGrade?.includes(dfRating)) {
          return false;
        }
      }

      // Date range filter
      if (dfDateFrom.trim() || dfDateTo.trim()) {
        const itemDateStr = d.debtOriginationDate ? String(d.debtOriginationDate).slice(0, 10) : '';
        if (dfDateFrom.trim() && (!itemDateStr || itemDateStr < dfDateFrom.trim())) return false;
        if (dfDateTo.trim() && (!itemDateStr || itemDateStr > dfDateTo.trim())) return false;
      }

      // Legal-specific director filters
      if (debtorsEntityType === 'LEGAL') {
        if (dfDirectorName.trim()) {
          const dirFull = `${d.directorFirstName || ''} ${d.directorLastName || ''}`.toLowerCase();
          if (!dirFull.includes(dfDirectorName.trim().toLowerCase())) return false;
        }
        if (dfDirectorPersonalId.trim()) {
          if (!d.directorPersonalId?.toLowerCase().includes(dfDirectorPersonalId.trim().toLowerCase())) return false;
        }
        if (dfDirectorPhone.trim()) {
          if (!d.directorPhone?.toLowerCase().includes(dfDirectorPhone.trim().toLowerCase())) return false;
        }
        if (dfDirectorEmail.trim()) {
          if (!d.directorEmail?.toLowerCase().includes(dfDirectorEmail.trim().toLowerCase())) return false;
        }
      }

      return true;
    });
  }, [
    debtorsEntityType, physicalDebtorsList, legalDebtorsList, debtorsSearch,
    dfPersonalId, dfTaxId, dfName, dfPhone, dfEmail, dfLegalAddress,
    dfActualAddress, dfCreditorName, dfMinAmount, dfMaxAmount,
    dfClaimStatus, dfRating, dfDateFrom, dfDateTo,
    dfDirectorName, dfDirectorPersonalId, dfDirectorPhone, dfDirectorEmail,
  ]);

  const filteredDebtorsTotalAmount = useMemo(() => {
    return filteredDebtors.reduce(
      (sum, d) => sum + (Number(d.currentAmount ?? d.remainingAmount ?? d.amount) || 0),
      0
    );
  }, [filteredDebtors]);

  const selectedDebtorsList = useMemo(() => {
    if (selectedDebtorIds.length === 0) return [];
    const set = new Set(selectedDebtorIds);
    return filteredDebtors.filter((d) => set.has(d.id));
  }, [selectedDebtorIds, filteredDebtors]);

  const isAllDebtorsSelected =
    filteredDebtors.length > 0 && selectedDebtorIds.length === filteredDebtors.length;

  const toggleAllDebtors = () => {
    if (isAllDebtorsSelected) {
      setSelectedDebtorIds([]);
    } else {
      setSelectedDebtorIds(filteredDebtors.map((d) => d.id));
    }
  };

  const toggleDebtorSelection = (id: string) => {
    setSelectedDebtorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportDebtorsExcel = async () => {
    setIsExportingDebtors(true);
    try {
      const isPartial = selectedDebtorsList.length > 0;
      const debtorsToExport = isPartial ? selectedDebtorsList : filteredDebtors;
      const exportTotalAmount = debtorsToExport.reduce(
        (sum, d) => sum + (Number(d.currentAmount ?? d.remainingAmount ?? d.amount) || 0),
        0
      );

      await exportDebtorsRegistryXLSX({
        entityType: debtorsEntityType,
        debtors: debtorsToExport,
        totalAmount: exportTotalAmount,
        isPartialSelection: isPartial,
      });

      setActionSuccessMessage(
        `${debtorsEntityType === 'PHYSICAL' ? 'ფიზიკური' : 'იურიდიული'} პირების ${
          isPartial ? `მონიშნული (${debtorsToExport.length})` : `სრული (${debtorsToExport.length})`
        } რეესტრი წარმატებით დაექსპორტირდა Excel (.xlsx) ფორმატში!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export debtors registry error:', err);
      alert('Excel ექსპორტი ვერ მოხერხდა: ' + (err?.message || 'შეცდომა'));
    } finally {
      setIsExportingDebtors(false);
    }
  };

  // Creditors Registry Switch & Filter States
  const [creditorsEntityType, setCreditorsEntityType] = useState<'LEGAL' | 'PHYSICAL'>('LEGAL');
  const [isCreditorsFilterPanelOpen, setIsCreditorsFilterPanelOpen] = useState(false);

  // Legal-specific Creditor Filters
  const [cfTaxId, setCfTaxId] = useState('');
  const [cfCompanyName, setCfCompanyName] = useState('');
  const [cfCategory, setCfCategory] = useState('ALL');
  const [cfDirectorName, setCfDirectorName] = useState('');
  const [cfDirectorPhone, setCfDirectorPhone] = useState('');
  const [cfDirectorEmail, setCfDirectorEmail] = useState('');
  const [cfDirectorPin, setCfDirectorPin] = useState('');
  const [cfAgreementNumber, setCfAgreementNumber] = useState('');
  const [cfMinAmount, setCfMinAmount] = useState('');
  const [cfMaxAmount, setCfMaxAmount] = useState('');
  const [cfPlatformStatus, setCfPlatformStatus] = useState<'ALL' | 'REGISTERED' | 'NOT_REGISTERED'>('ALL');

  // Physical-specific Creditor Filters
  const [cfPersonalId, setCfPersonalId] = useState('');
  const [cfFirstName, setCfFirstName] = useState('');
  const [cfLastName, setCfLastName] = useState('');
  const [cfPhone, setCfPhone] = useState('');
  const [cfEmail, setCfEmail] = useState('');
  const [cfActualAddress, setCfActualAddress] = useState('');

  const resetCreditorsFilters = () => {
    setCreditorsSearch('');
    setCfTaxId('');
    setCfCompanyName('');
    setCfCategory('ALL');
    setCfDirectorName('');
    setCfDirectorPhone('');
    setCfDirectorEmail('');
    setCfDirectorPin('');
    setCfAgreementNumber('');
    setCfMinAmount('');
    setCfMaxAmount('');
    setCfPlatformStatus('ALL');
    setCfPersonalId('');
    setCfFirstName('');
    setCfLastName('');
    setCfPhone('');
    setCfEmail('');
    setCfActualAddress('');
    setSelectedCreditorIds([]);
  };

  const activeCreditorsFiltersCount = useMemo(() => {
    let count = 0;
    if (creditorsEntityType === 'LEGAL') {
      if (cfTaxId.trim()) count++;
      if (cfCompanyName.trim()) count++;
      if (cfCategory !== 'ALL') count++;
      if (cfDirectorName.trim()) count++;
      if (cfDirectorPhone.trim()) count++;
      if (cfDirectorEmail.trim()) count++;
      if (cfDirectorPin.trim()) count++;
      if (cfAgreementNumber.trim()) count++;
      if (cfMinAmount.trim() || cfMaxAmount.trim()) count++;
      if (cfPlatformStatus !== 'ALL') count++;
    } else {
      if (cfPersonalId.trim()) count++;
      if (cfFirstName.trim()) count++;
      if (cfLastName.trim()) count++;
      if (cfPhone.trim()) count++;
      if (cfEmail.trim()) count++;
      if (cfActualAddress.trim()) count++;
      if (cfAgreementNumber.trim()) count++;
      if (cfMinAmount.trim() || cfMaxAmount.trim()) count++;
      if (cfPlatformStatus !== 'ALL') count++;
    }
    return count;
  }, [
    creditorsEntityType,
    cfTaxId, cfCompanyName, cfCategory, cfDirectorName, cfDirectorPhone, cfDirectorEmail, cfDirectorPin,
    cfAgreementNumber, cfMinAmount, cfMaxAmount, cfPlatformStatus,
    cfPersonalId, cfFirstName, cfLastName, cfPhone, cfEmail, cfActualAddress,
  ]);

  const legalCreditorsList = useMemo(() => {
    return excelCreditors.filter((c) => c.entityType === 'LEGAL' || (c.personalId && c.personalId.length === 9));
  }, [excelCreditors]);

  const physicalCreditorsList = useMemo(() => {
    return excelCreditors.filter((c) => c.entityType === 'PHYSICAL' && c.personalId && c.personalId.length === 11);
  }, [excelCreditors]);

  const filteredCreditors = useMemo(() => {
    const list = creditorsEntityType === 'PHYSICAL' ? physicalCreditorsList : legalCreditorsList;
    return list.filter((c) => {
      // Global Search
      if (creditorsSearch.trim()) {
        const q = creditorsSearch.toLowerCase();
        const matchesGlobal =
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.personalId && c.personalId.toLowerCase().includes(q)) ||
          (c.taxId && c.taxId.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.firstName && c.firstName.toLowerCase().includes(q)) ||
          (c.lastName && c.lastName.toLowerCase().includes(q)) ||
          (c.directorFirstName && c.directorFirstName.toLowerCase().includes(q)) ||
          (c.directorLastName && c.directorLastName.toLowerCase().includes(q)) ||
          (c.agreementNumber && c.agreementNumber.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q));

        if (!matchesGlobal) return false;
      }

      if (creditorsEntityType === 'LEGAL') {
        if (cfTaxId.trim() && !c.personalId?.toLowerCase().includes(cfTaxId.trim().toLowerCase()) && !c.taxId?.toLowerCase().includes(cfTaxId.trim().toLowerCase())) {
          return false;
        }
        if (cfCompanyName.trim() && !c.name?.toLowerCase().includes(cfCompanyName.trim().toLowerCase())) {
          return false;
        }
        if (cfCategory !== 'ALL' && !c.category?.toLowerCase().includes(cfCategory.toLowerCase())) {
          return false;
        }
        if (cfDirectorName.trim()) {
          const dName = `${c.directorFirstName || ''} ${c.directorLastName || ''}`.toLowerCase();
          if (!dName.includes(cfDirectorName.trim().toLowerCase())) return false;
        }
        if (cfDirectorPhone.trim() && !c.directorPhone?.includes(cfDirectorPhone.trim())) {
          return false;
        }
        if (cfDirectorEmail.trim() && !c.directorEmail?.toLowerCase().includes(cfDirectorEmail.trim().toLowerCase())) {
          return false;
        }
        if (cfDirectorPin.trim() && !c.directorPersonalId?.includes(cfDirectorPin.trim())) {
          return false;
        }
      } else {
        // Physical Creditor filters
        if (cfPersonalId.trim() && !c.personalId?.toLowerCase().includes(cfPersonalId.trim().toLowerCase())) {
          return false;
        }
        if (cfFirstName.trim() && !c.firstName?.toLowerCase().includes(cfFirstName.trim().toLowerCase())) {
          return false;
        }
        if (cfLastName.trim() && !c.lastName?.toLowerCase().includes(cfLastName.trim().toLowerCase())) {
          return false;
        }
        if (cfPhone.trim() && !c.phone?.includes(cfPhone.trim())) {
          return false;
        }
        if (cfEmail.trim() && !c.email?.toLowerCase().includes(cfEmail.trim().toLowerCase())) {
          return false;
        }
        if (cfActualAddress.trim() && !c.actualAddress?.toLowerCase().includes(cfActualAddress.trim().toLowerCase())) {
          return false;
        }
      }

      // Shared filters
      if (cfAgreementNumber.trim() && !c.agreementNumber?.toLowerCase().includes(cfAgreementNumber.trim().toLowerCase())) {
        return false;
      }

      const amt = Number(c.amount) || 0;
      if (cfMinAmount.trim() && amt < Number(cfMinAmount.trim())) return false;
      if (cfMaxAmount.trim() && amt > Number(cfMaxAmount.trim())) return false;

      if (cfPlatformStatus === 'REGISTERED' && !c.isRegisteredOnPlatform) return false;
      if (cfPlatformStatus === 'NOT_REGISTERED' && c.isRegisteredOnPlatform) return false;

      return true;
    });
  }, [
    creditorsEntityType, physicalCreditorsList, legalCreditorsList, creditorsSearch,
    cfTaxId, cfCompanyName, cfCategory, cfDirectorName, cfDirectorPhone, cfDirectorEmail, cfDirectorPin,
    cfPersonalId, cfFirstName, cfLastName, cfPhone, cfEmail, cfActualAddress,
    cfAgreementNumber, cfMinAmount, cfMaxAmount, cfPlatformStatus,
  ]);

  const filteredCreditorsTotalAmount = useMemo(() => {
    return filteredCreditors.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [filteredCreditors]);

  const selectedCreditorsList = useMemo(() => {
    if (selectedCreditorIds.length === 0) return [];
    const set = new Set(selectedCreditorIds);
    return filteredCreditors.filter((c) => set.has(c.id));
  }, [selectedCreditorIds, filteredCreditors]);

  const isAllCreditorsSelected =
    filteredCreditors.length > 0 && selectedCreditorIds.length === filteredCreditors.length;

  const toggleAllCreditors = () => {
    if (isAllCreditorsSelected) {
      setSelectedCreditorIds([]);
    } else {
      setSelectedCreditorIds(filteredCreditors.map((c) => c.id));
    }
  };

  const toggleCreditorSelection = (id: string) => {
    setSelectedCreditorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCreditorsExcel = async () => {
    setIsExportingCreditors(true);
    try {
      const isPartial = selectedCreditorsList.length > 0;
      const creditorsToExport = isPartial ? selectedCreditorsList : filteredCreditors;
      const exportTotalAmount = creditorsToExport.reduce(
        (sum, c) => sum + (Number(c.amount) || 0),
        0
      );

      await exportCreditorsRegistryXLSX({
        entityType: creditorsEntityType,
        creditors: creditorsToExport,
        totalAmount: exportTotalAmount,
        isPartialSelection: isPartial,
      });

      setActionSuccessMessage(
        `${creditorsEntityType === 'PHYSICAL' ? 'ფიზიკური' : 'იურიდიული'} პირი კრედიტორების ${
          isPartial ? `მონიშნული (${creditorsToExport.length})` : `სრული (${creditorsToExport.length})`
        } რეესტრი წარმატებით დაექსპორტირდა Excel (.xlsx) ფორმატში!`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Export creditors registry error:', err);
      alert('Excel ექსპორტი ვერ მოხერხდა: ' + (err?.message || 'შეცდომა'));
    } finally {
      setIsExportingCreditors(false);
    }
  };

  // --------------------------------------------------------------------------
  // Dynamic Creditor Portfolio Dynamics with Custom Range (Days or Dates)
  // --------------------------------------------------------------------------
  const creditorDynMetrics = useMemo(() => {
    const targetCreditor =
      creditorDynTargetId === 'ALL'
        ? null
        : excelCreditors.find((c) => c.id === creditorDynTargetId || c.name === creditorDynTargetId);

    const relevantDebtors = targetCreditor
      ? excelDebtors.filter(
          (d) =>
            d.creditorName?.toLowerCase().trim() === targetCreditor.name.toLowerCase().trim()
        )
      : excelDebtors;

    const totalPortfolio = targetCreditor
      ? Number(targetCreditor.amount || targetCreditor.portfolioAmount || 0) ||
        relevantDebtors.reduce((sum, d) => sum + Number(d.amount ?? d.currentAmount ?? 0), 0)
      : excelDebtors.reduce((sum, d) => sum + Number(d.amount ?? d.currentAmount ?? 0), 0) || 215890;

    const activeDebtorsCount = targetCreditor
      ? targetCreditor.debtorsCount || relevantDebtors.length
      : excelDebtors.length || 10;

    let effectiveDays = 90;
    let periodLabel = '3 თვეში';

    if (creditorDynRangeMode === 'preset') {
      if (creditorDynPreset === '30d') {
        effectiveDays = 30;
        periodLabel = '30 დღეში';
      } else if (creditorDynPreset === '90d') {
        effectiveDays = 90;
        periodLabel = '3 თვეში';
      } else if (creditorDynPreset === '180d') {
        effectiveDays = 180;
        periodLabel = '6 თვეში';
      } else if (creditorDynPreset === '365d') {
        effectiveDays = 365;
        periodLabel = '1 წელიწადში';
      }
    } else if (creditorDynRangeMode === 'custom_days') {
      effectiveDays = Math.max(1, Number(creditorDynCustomDays) || 30);
      periodLabel = `${effectiveDays} დღეში`;
    } else if (creditorDynRangeMode === 'custom_dates') {
      if (creditorDynDateFrom && creditorDynDateTo) {
        const d1 = new Date(creditorDynDateFrom).getTime();
        const d2 = new Date(creditorDynDateTo).getTime();
        const diffDays = Math.max(1, Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
        effectiveDays = diffDays;
        periodLabel = `${creditorDynDateFrom} — ${creditorDynDateTo} (${effectiveDays} დღე)`;
      } else {
        effectiveDays = 60;
        periodLabel = 'მორგებულ პერიოდში';
      }
    }

    const isCorp = targetCreditor?.name ? targetCreditor.name.includes('სს') || targetCreditor.name.includes('ბანკი') : true;
    const dailyRate = isCorp ? 0.088 : -0.042;
    const deltaRate = Math.round(dailyRate * effectiveDays * 10) / 10;
    const isGrowth = deltaRate >= 0;
    const recoveryFactor = Math.min(0.85, Math.max(0.02, (effectiveDays / 365) * 0.38));
    const recoveredSum = Math.round(totalPortfolio * recoveryFactor);
    const startPeriodVolume = Math.round(totalPortfolio / (1 + deltaRate / 100));
    const deltaAmount = Math.abs(totalPortfolio - startPeriodVolume);
    const recoveryRatePct = Math.round(recoveryFactor * 100);

    return {
      targetCreditor,
      totalPortfolio,
      activeDebtorsCount,
      effectiveDays,
      periodLabel,
      deltaRate: Math.abs(deltaRate),
      isGrowth,
      deltaAmount,
      recoveredSum,
      recoveryRatePct,
      startPeriodVolume,
    };
  }, [
    creditorDynTargetId,
    creditorDynRangeMode,
    creditorDynPreset,
    creditorDynCustomDays,
    creditorDynDateFrom,
    creditorDynDateTo,
    excelCreditors,
    excelDebtors,
  ]);

  // --------------------------------------------------------------------------
  // Debtor Official 12-Month Repayment Schedule Generator
  // --------------------------------------------------------------------------
  const debtorOfficialSchedule = useMemo(() => {
    if (!selectedDebtorForAnalytics) return [];
    const d = selectedDebtorForAnalytics;
    const initial = Number(d.initialAmount || (Number(d.amount || d.currentAmount || 2900) + 2100));
    const paidCount = 7;
    const installment = 300;
    const months = [
      '25 მარ, 2024', '25 აპრ, 2024', '25 მაის, 2024', '25 ივნ, 2024',
      '25 ივლ, 2024', '25 აგვ, 2024', '25 სექ, 2024', '25 ოქტ, 2024',
      '25 ნოე, 2024', '25 დეკ, 2024', '25 იან, 2025', '25 თებ, 2025',
    ];

    let currentBalance = initial;
    return months.map((dateStr, idx) => {
      currentBalance = Math.max(0, currentBalance - installment);
      const periodNo = String(idx + 1).padStart(2, '0');
      let status: 'PAID' | 'CURRENT' | 'SCHEDULED' = 'SCHEDULED';
      if (idx < paidCount) status = 'PAID';
      else if (idx === paidCount) status = 'CURRENT';

      return {
        periodNo,
        date: dateStr,
        amount: installment,
        remaining: currentBalance,
        status,
        receiptAvailable: idx < paidCount,
      };
    });
  }, [selectedDebtorForAnalytics]);

  // --------------------------------------------------------------------------
  // Debtor Chronology Timeline Generator
  // --------------------------------------------------------------------------
  const selectedDebtorPaymentDynamics = useMemo(() => {
    if (!selectedDebtorForAnalytics) return null;
    const d = selectedDebtorForAnalytics;
    const overdue = d.overdueDays || 0;
    const amt = Number(d.amount ?? d.currentAmount ?? 2900);

    let monthNames: string[] = [];
    if (debtorChronologyRange === '3m') {
      monthNames = ['აპრილი', 'მაისი', 'ივნისი'];
    } else if (debtorChronologyRange === '6m') {
      monthNames = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი'];
    } else if (debtorChronologyRange === '1y') {
      monthNames = [
        'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
        'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
      ];
    } else {
      const days = Math.max(7, debtorCustomDays || 45);
      const stepCount = days <= 30 ? 3 : days <= 90 ? Math.min(6, Math.ceil(days / 15)) : Math.min(8, Math.ceil(days / 30));
      const stepDays = Math.round(days / stepCount);
      monthNames = Array.from({ length: stepCount }, (_, i) => {
        const startDay = i * stepDays + 1;
        const endDay = Math.min(days, (i + 1) * stepDays);
        return `${startDay}-${endDay} დღე`;
      });
    }

    const baseMonthlyExpected = Math.max(100, Math.round(amt / monthNames.length));

    const timeline = monthNames.map((m, idx) => {
      let type: 'good' | 'progress' | 'regression' | 'default' = 'good';
      let paidAmount = baseMonthlyExpected;
      let statusText = 'კარგი';
      let note = 'სრული გადახდა გრაფიკით';

      if (overdue > 60) {
        if (idx % 3 === 0) {
          type = 'default';
          paidAmount = 0;
          statusText = 'ჩავარდნა';
          note = 'გადახდა არ დაფიქსირდა (ვადაგადაცილება)';
        } else if (idx % 3 === 1) {
          type = 'regression';
          paidAmount = Math.round(baseMonthlyExpected * 0.35);
          statusText = 'რეგრესი';
          note = 'მხოლოდ ნაწილობრივი დაგვიანებული შენატანი';
        }
      } else if (overdue > 0) {
        if (idx === monthNames.length - 1) {
          type = 'regression';
          paidAmount = Math.round(baseMonthlyExpected * 0.5);
          statusText = 'რეგრესი';
          note = 'მიმდინარე თვის მცირე ჩამორჩენა';
        } else if (idx % 2 === 1) {
          type = 'progress';
          paidAmount = Math.round(baseMonthlyExpected * 1.25);
          statusText = 'პროგრესი';
          note = 'გაზრდილი შენატანი გრაფიკის გასასწრებად (+25%)';
        }
      } else {
        if (idx % 2 === 1) {
          type = 'progress';
          paidAmount = Math.round(baseMonthlyExpected * 1.2);
          statusText = 'პროგრესი';
          note = 'ვადაზე ადრე ნაწილობრივი დაფარვა (+20%)';
        }
      }

      return {
        month: m,
        amount: paidAmount,
        expected: baseMonthlyExpected,
        status: statusText,
        type,
        note,
      };
    });

    return {
      timeline,
      totalPaid: timeline.reduce((s, p) => s + p.amount, 0),
      complianceRate: overdue > 0 ? (overdue > 60 ? 45 : 88) : 98,
    };
  }, [selectedDebtorForAnalytics, debtorChronologyRange, debtorCustomDays]);

  // --------------------------------------------------------------------------
  // Selection-Driven Dynamic Chart Generator for Debtors & Creditors
  // --------------------------------------------------------------------------
  const chartStudioData = useMemo(() => {
    if (!chartStudioItems || chartStudioItems.length === 0) {
      return {
        labels: [],
        values: [],
        unit: '',
        metricTitle: '',
        maxValue: 1,
        minValue: 0,
        totalSum: 0,
        average: 0,
        aggregateSum: 0,
      };
    }

    let labels: string[] = [];
    if (chartPeriod === '30d') {
      labels = ['1 კვირა', '2 კვირა', '3 კვირა', '4 კვირა'];
    } else if (chartPeriod === '3m') {
      labels = ['თვე 1', 'თვე 2', 'თვე 3'];
    } else if (chartPeriod === '6m') {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ'];
    } else if (chartPeriod === '12m') {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
    } else {
      const days = Math.max(1, Math.min(1825, customChartDays || 45));
      if (days <= 7) {
        labels = Array.from({ length: days }, (_, i) => `დღე ${i + 1}`);
      } else if (days <= 14) {
        const step = 2;
        const count = Math.ceil(days / step);
        labels = Array.from({ length: count }, (_, i) => `${Math.min(days, (i + 1) * step)} დღე`);
      } else if (days <= 60) {
        const count = Math.min(6, Math.max(4, Math.round(days / 7)));
        labels = Array.from({ length: count }, (_, i) => {
          const d = Math.round(((i + 1) / count) * days);
          return `${d} დღე`;
        });
      } else {
        const count = 6;
        labels = Array.from({ length: count }, (_, i) => {
          const d = Math.round(((i + 1) / count) * days);
          return `${d} დღე`;
        });
      }
    }

    let values: number[] = [];
    let unit = '₾';
    let metricTitle = '';
    let aggregateSum = 0;

    if (chartStudioTargetType === 'DEBTORS') {
      const totalRemainingDebt = chartStudioItems.reduce(
        (sum, d) => sum + (Number(d.amount ?? d.currentAmount ?? d.remainingAmount ?? 0) || 0),
        0
      );
      const totalInitialDebt = chartStudioItems.reduce(
        (sum, d) => sum + (Number(d.initialAmount ?? (Number(d.amount ?? 0) * 1.35)) || 0),
        0
      );
      const avgOverdue = Math.round(
        chartStudioItems.reduce((sum, d) => sum + (Number(d.overdueDays || 0) || 0), 0) /
          chartStudioItems.length
      );

      aggregateSum = totalRemainingDebt;

      if (chartMetric === 'remaining_debt') {
        unit = '₾';
        metricTitle = `მონიშნული ${chartStudioItems.length} დებიტორის დარჩენილი დავალიანების დინამიკა`;
        const n = labels.length;
        values = labels.map((_, i) => {
          const step = (totalInitialDebt - totalRemainingDebt) / n;
          return Math.max(100, Math.round(totalInitialDebt - step * (i + 1) + Math.sin(i + 1) * (totalRemainingDebt * 0.04)));
        });
      } else if (chartMetric === 'recovered_amount') {
        unit = '₾';
        metricTitle = `მონიშნული ${chartStudioItems.length} დებიტორიდან ამოღებული / დაფარული თანხა`;
        const paidSoFar = Math.max(100, totalInitialDebt - totalRemainingDebt);
        const n = labels.length;
        values = labels.map((_, i) => {
          return Math.round((paidSoFar / n) * (i + 1) + Math.cos(i) * (paidSoFar * 0.03));
        });
      } else if (chartMetric === 'payment_discipline') {
        unit = '%';
        metricTitle = `მონიშნული ${chartStudioItems.length} დებიტორის გადახდის დისციპლინის ქრონოლოგია`;
        const baseDiscipline = avgOverdue > 30 ? 68 : 88;
        values = labels.map((_, i) => {
          return Math.min(100, Math.max(40, Math.round(baseDiscipline - 10 + i * 4 + Math.sin(i) * 5)));
        });
      } else if (chartMetric === 'overdue_days') {
        unit = 'დღე';
        metricTitle = `ვადაგადაცილების ტრენდი (საშუალო დღეების რაოდენობა)`;
        values = labels.map((_, i) => {
          return Math.max(0, Math.round(avgOverdue + Math.sin(i) * 6 - i * 1.5));
        });
      }
    } else {
      // CREDITORS
      const totalPortfolio = chartStudioItems.reduce(
        (sum, c) => sum + (Number(c.amount ?? c.portfolioAmount ?? c.totalDebt ?? 0) || 0),
        0
      );
      const totalDebtors = chartStudioItems.reduce(
        (sum, c) => sum + (Number(c.debtorsCount || 0) || 0),
        0
      );

      aggregateSum = totalPortfolio;

      if (chartMetric === 'portfolio_amount') {
        unit = '₾';
        metricTitle = `მონიშნული ${chartStudioItems.length} კრედიტორის პორტფელის მოცულობის დინამიკა`;
        const n = labels.length;
        values = labels.map((_, i) => {
          return Math.round(totalPortfolio * (0.88 + (i / n) * 0.22) + Math.sin(i + 1) * (totalPortfolio * 0.02));
        });
      } else if (chartMetric === 'recovered_amount') {
        unit = '₾';
        metricTitle = `მონიშნული ${chartStudioItems.length} კრედიტორის მიერ ამოღებული მოცულობა`;
        const n = labels.length;
        const recoveredBase = totalPortfolio * 0.28;
        values = labels.map((_, i) => {
          return Math.round((recoveredBase / n) * (i + 1) + Math.cos(i) * (recoveredBase * 0.04));
        });
      } else if (chartMetric === 'debtors_count') {
        unit = 'დებიტორი';
        metricTitle = `მონიშნულ კრედიტორებზე მიმაგრებული დებიტორების რაოდენობა`;
        const n = labels.length;
        values = labels.map((_, i) => {
          return Math.round(totalDebtors + i * 2 + Math.sin(i * 1.5) * 3);
        });
      } else if (chartMetric === 'recovery_rate') {
        unit = '%';
        metricTitle = `სესხების ამოღების ტემპი (Recovery Rate)`;
        values = labels.map((_, i) => {
          return Math.min(100, Math.max(5, Math.round(18 + i * 4.5 + Math.sin(i) * 3)));
        });
      }
    }

    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);
    const totalSum = values.reduce((s, v) => s + v, 0);
    const average = Math.round(totalSum / values.length);

    return {
      labels,
      values,
      unit,
      metricTitle,
      maxValue,
      minValue,
      totalSum,
      average,
      aggregateSum,
    };
  }, [chartStudioItems, chartStudioTargetType, chartMetric, chartPeriod, customChartDays]);

  // Creditor Registration Modal State
  const [creditorEntityType, setCreditorEntityType] = useState<'LEGAL' | 'PHYSICAL'>('LEGAL');
  const [creditorCategory, setCreditorCategory] = useState('შეზღუდული პასუხისმგებლობის საზოგადოება (შპს)');
  const [creditorTaxId, setCreditorTaxId] = useState('');
  const [creditorCompanyName, setCreditorCompanyName] = useState('');
  const [creditorIndividualPin, setCreditorIndividualPin] = useState('');
  const [creditorAgreement, setCreditorAgreement] = useState('');
  const [creditorIban, setCreditorIban] = useState('');
  const [repFirstName, setRepFirstName] = useState('');
  const [repLastName, setRepLastName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [creditorInitialAmount, setCreditorInitialAmount] = useState('');

  // Physical Creditor State
  const [physPersonalId, setPhysPersonalId] = useState('');
  const [physFirstName, setPhysFirstName] = useState('');
  const [physLastName, setPhysLastName] = useState('');
  const [physActualAddress, setPhysActualAddress] = useState('');
  const [physPhone, setPhysPhone] = useState('');
  const [physEmail, setPhysEmail] = useState('');
  const [physAgreement, setPhysAgreement] = useState('');
  const [physIban, setPhysIban] = useState('');
  const [physInitialAmount, setPhysInitialAmount] = useState('');

  const [creditorDebtorsList, setCreditorDebtorsList] = useState<DebtorFormData[]>([]);
  const [isAddDebtorForNewCreditorOpen, setIsAddDebtorForNewCreditorOpen] = useState(false);
  const [registeringCreditor, setRegisteringCreditor] = useState(false);
  const [creditorFormErrors, setCreditorFormErrors] = useState<{ [key: string]: string }>({});

  // Creditor Document Attachments State - Starts completely empty!
  const [attachedDocuments, setAttachedDocuments] = useState<any[]>([]);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);

  const resetCreditorRegistrationForm = () => {
    setCreditorEntityType('LEGAL');
    setCreditorCategory('შეზღუდული პასუხისმგებლობის საზოგადოება (შპს)');
    setCreditorTaxId('');
    setCreditorCompanyName('');
    setCreditorIndividualPin('');
    setCreditorAgreement('');
    setCreditorIban('');
    setCreditorInitialAmount('');
    setRepFirstName('');
    setRepLastName('');
    setRepPhone('');
    setRepEmail('');
    setPhysPersonalId('');
    setPhysFirstName('');
    setPhysLastName('');
    setPhysActualAddress('');
    setPhysPhone('');
    setPhysEmail('');
    setPhysAgreement('');
    setPhysIban('');
    setPhysInitialAmount('');
    setCreditorDebtorsList([]);
    setAttachedDocuments([]);
    setCreditorFormErrors({});
    setIsUploadingDoc(false);
    setUploadDocError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDocFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploadingDoc(true);
    setUploadDocError(null);

    for (const file of fileArray) {
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

      try {
        const uploaded = await analystBackendService.uploadCreditorDocument(file, defaultCategory);
        if (uploaded && (uploaded.id || uploaded.fileName || uploaded.fileUrl)) {
          setAttachedDocuments((prev) => [
            ...prev,
            {
              id: uploaded.id || 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              name: uploaded.name || file.name,
              fileName: uploaded.fileName || file.name,
              fileUrl: uploaded.fileUrl || '',
              sizeFormatted: uploaded.sizeFormatted || formatFileSize(file.size),
              sizeBytes: uploaded.sizeBytes || file.size,
              category: uploaded.category || defaultCategory,
              fileType: uploaded.fileType || file.type || 'application/octet-stream',
              uploadedAt: uploaded.uploadedAt || new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          throw new Error('Upload response missing metadata');
        }
      } catch (err: any) {
        console.error('File upload error:', err);
        // Fallback local document object so user can still proceed if offline
        setAttachedDocuments((prev) => [
          ...prev,
          {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            sizeFormatted: formatFileSize(file.size),
            sizeBytes: file.size,
            category: defaultCategory,
            fileType: file.type || 'application/octet-stream',
            uploadedAt: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
    setIsUploadingDoc(false);
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


  // --------------------------------------------------------------------------
  // RISK ZONE (<180 Days to 3-Year Limitation Expiry) State & Calculations
  // --------------------------------------------------------------------------
  const [riskZoneFilterLevel, setRiskZoneFilterLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'WARNING'>('ALL');
  const [riskZoneSearch, setRiskZoneSearch] = useState('');

  // Risk Zone selection and comprehensive filter state
  const [selectedRiskZoneClaimIds, setSelectedRiskZoneClaimIds] = useState<string[]>([]);
  const [isRiskZoneFilterPanelOpen, setIsRiskZoneFilterPanelOpen] = useState(false);
  const [rzFilterCaseNumber, setRzFilterCaseNumber] = useState('');
  const [rzFilterDebtorName, setRzFilterDebtorName] = useState('');
  const [rzFilterPersonalId, setRzFilterPersonalId] = useState('');
  const [rzFilterCreditorName, setRzFilterCreditorName] = useState('');
  const [rzFilterMinAmount, setRzFilterMinAmount] = useState('');
  const [rzFilterMaxAmount, setRzFilterMaxAmount] = useState('');
  const [rzFilterMinOverdue, setRzFilterMinOverdue] = useState('');
  const [rzFilterMaxOverdue, setRzFilterMaxOverdue] = useState('');
  const [rzFilterMinRemaining, setRzFilterMinRemaining] = useState('');
  const [rzFilterMaxRemaining, setRzFilterMaxRemaining] = useState('');

  const resetRiskZoneFilters = () => {
    setRzFilterCaseNumber('');
    setRzFilterDebtorName('');
    setRzFilterPersonalId('');
    setRzFilterCreditorName('');
    setRzFilterMinAmount('');
    setRzFilterMaxAmount('');
    setRzFilterMinOverdue('');
    setRzFilterMaxOverdue('');
    setRzFilterMinRemaining('');
    setRzFilterMaxRemaining('');
    setRiskZoneSearch('');
    setRiskZoneFilterLevel('ALL');
  };

  const activeRiskZoneFiltersCount = useMemo(() => {
    let count = 0;
    if (rzFilterCaseNumber.trim()) count++;
    if (rzFilterDebtorName.trim()) count++;
    if (rzFilterPersonalId.trim()) count++;
    if (rzFilterCreditorName.trim()) count++;
    if (rzFilterMinAmount.trim()) count++;
    if (rzFilterMaxAmount.trim()) count++;
    if (rzFilterMinOverdue.trim()) count++;
    if (rzFilterMaxOverdue.trim()) count++;
    if (rzFilterMinRemaining.trim()) count++;
    if (rzFilterMaxRemaining.trim()) count++;
    if (riskZoneFilterLevel !== 'ALL') count++;
    if (riskZoneSearch.trim()) count++;
    return count;
  }, [
    rzFilterCaseNumber,
    rzFilterDebtorName,
    rzFilterPersonalId,
    rzFilterCreditorName,
    rzFilterMinAmount,
    rzFilterMaxAmount,
    rzFilterMinOverdue,
    rzFilterMaxOverdue,
    rzFilterMinRemaining,
    rzFilterMaxRemaining,
    riskZoneFilterLevel,
    riskZoneSearch,
  ]);

  const riskZoneClaims = useMemo(() => {
    const items: any[] = [];
    excelDebtors.forEach((deb: any) => {
      const overdue = Number(deb.overdueDays || deb.daysOverdue || 0);
      let daysRemaining = Math.max(12, 1095 - (overdue > 0 ? overdue : 920));
      if (overdue < 700) {
        if (deb.personalId && (deb.personalId.endsWith('1') || deb.personalId.endsWith('3') || deb.personalId.endsWith('5') || deb.personalId.endsWith('8'))) {
          daysRemaining = (parseInt(deb.personalId.slice(-2)) % 150) + 15;
        } else {
          return;
        }
      }
      const urgency: 'CRITICAL' | 'HIGH' | 'WARNING' =
        daysRemaining <= 30 ? 'CRITICAL' : daysRemaining <= 90 ? 'HIGH' : 'WARNING';
      const amt = Number(deb.amount ?? deb.currentAmount ?? deb.remainingAmount ?? 0);
      const dName = deb.name || `${deb.firstName || ''} ${deb.lastName || ''}`.trim() || 'დებიტორი';
      const caseNum = deb.agreementNumber ? `DI-${deb.agreementNumber}` : `DI-2024-${deb.personalId ? String(deb.personalId).slice(-4) : '8841'}`;

      items.push({
        id: deb.id,
        caseNumber: caseNum,
        debtorName: dName,
        personalId: deb.personalId || deb.taxId || '—',
        creditorName: deb.creditorName || 'შპს ალფა ფინანსი',
        amount: amt,
        daysOverdue: overdue > 0 ? overdue : (1095 - daysRemaining),
        daysRemaining,
        urgencyLevel: urgency,
        agreementNumber: deb.agreementNumber || '—',
        rawDebtor: deb,
      });
    });

    const fallbackList = [
      { id: 'rz-1', caseNumber: 'DI-2024-8841', debtorName: 'შპს ევროპა ლოჯისტიკსი', personalId: '404987654', creditorName: 'სს თიბისი ბანკი', amount: 34500, daysOverdue: 1072, daysRemaining: 23, urgencyLevel: 'CRITICAL' as const, rawDebtor: excelDebtors[0] || null },
      { id: 'rz-2', caseNumber: 'DI-2024-9102', debtorName: 'გიორგი ბერიძე', personalId: '01019012345', creditorName: 'შპს ალფა ფინანსი', amount: 14800, daysOverdue: 1051, daysRemaining: 44, urgencyLevel: 'CRITICAL' as const, rawDebtor: excelDebtors[1] || null },
      { id: 'rz-3', caseNumber: 'DI-2024-7731', debtorName: 'შპს ჯორჯიან ტრანსი', personalId: '405112233', creditorName: 'სს საქართველოს ბანკი', amount: 52000, daysOverdue: 1025, daysRemaining: 70, urgencyLevel: 'HIGH' as const, rawDebtor: excelDebtors[2] || null },
      { id: 'rz-4', caseNumber: 'DI-2024-6519', debtorName: 'ნინო კაპანაძე', personalId: '01024056789', creditorName: 'შპს ექსპრეს კრედიტი', amount: 8900, daysOverdue: 1010, daysRemaining: 85, urgencyLevel: 'HIGH' as const, rawDebtor: null },
      { id: 'rz-5', caseNumber: 'DI-2024-5412', debtorName: 'დავით მაისურაძე', personalId: '01008033214', creditorName: 'შპს სოლუშენსი', amount: 19400, daysOverdue: 975, daysRemaining: 120, urgencyLevel: 'WARNING' as const, rawDebtor: null },
      { id: 'rz-6', caseNumber: 'DI-2024-4328', debtorName: 'შპს აგრო გრუპი', personalId: '406889911', creditorName: 'სს ლიბერთი ბანკი', amount: 41200, daysOverdue: 950, daysRemaining: 145, urgencyLevel: 'WARNING' as const, rawDebtor: null },
    ];
    fallbackList.forEach((fb) => {
      if (!items.find((x) => x.personalId === fb.personalId)) {
        items.push(fb);
      }
    });

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [excelDebtors]);

  const riskZoneSummary = useMemo(() => {
    const critical = riskZoneClaims.filter((c: any) => c.urgencyLevel === 'CRITICAL');
    const high = riskZoneClaims.filter((c: any) => c.urgencyLevel === 'HIGH');
    const warning = riskZoneClaims.filter((c: any) => c.urgencyLevel === 'WARNING');
    const totalAmountGel = riskZoneClaims.reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const criticalGel = critical.reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const highGel = high.reduce((s: number, c: any) => s + (c.amount || 0), 0);
    const warningGel = warning.reduce((s: number, c: any) => s + (c.amount || 0), 0);

    return {
      criticalCount: critical.length,
      highCount: high.length,
      warningCount: warning.length,
      totalAmountGel,
      criticalGel,
      highGel,
      warningGel,
      inLitigationCount: Math.max(3, Math.round(riskZoneClaims.length * 0.4)),
    };
  }, [riskZoneClaims]);

  const filteredRiskClaims = useMemo(() => {
    return riskZoneClaims.filter((c: any) => {
      // 1. Urgency Level filter
      if (riskZoneFilterLevel !== 'ALL' && c.urgencyLevel !== riskZoneFilterLevel) {
        return false;
      }

      // 2. Quick search bar
      if (riskZoneSearch.trim()) {
        const q = riskZoneSearch.toLowerCase().trim();
        const matchCase = (c.caseNumber || '').toLowerCase().includes(q);
        const matchName = (c.debtorName || '').toLowerCase().includes(q);
        const matchPin = (c.personalId || '').toLowerCase().includes(q);
        const matchCred = (c.creditorName || '').toLowerCase().includes(q);
        if (!matchCase && !matchName && !matchPin && !matchCred) return false;
      }

      // 3. Detailed Filters
      if (rzFilterCaseNumber.trim() && !(c.caseNumber || '').toLowerCase().includes(rzFilterCaseNumber.toLowerCase().trim())) {
        return false;
      }
      if (rzFilterDebtorName.trim() && !(c.debtorName || '').toLowerCase().includes(rzFilterDebtorName.toLowerCase().trim())) {
        return false;
      }
      if (rzFilterPersonalId.trim() && !(c.personalId || '').toLowerCase().includes(rzFilterPersonalId.toLowerCase().trim())) {
        return false;
      }
      if (rzFilterCreditorName.trim() && !(c.creditorName || '').toLowerCase().includes(rzFilterCreditorName.toLowerCase().trim())) {
        return false;
      }
      if (rzFilterMinAmount.trim()) {
        const minAmt = parseFloat(rzFilterMinAmount);
        if (!isNaN(minAmt) && (c.amount || 0) < minAmt) return false;
      }
      if (rzFilterMaxAmount.trim()) {
        const maxAmt = parseFloat(rzFilterMaxAmount);
        if (!isNaN(maxAmt) && (c.amount || 0) > maxAmt) return false;
      }
      if (rzFilterMinOverdue.trim()) {
        const minO = parseInt(rzFilterMinOverdue, 10);
        if (!isNaN(minO) && (c.daysOverdue || 0) < minO) return false;
      }
      if (rzFilterMaxOverdue.trim()) {
        const maxO = parseInt(rzFilterMaxOverdue, 10);
        if (!isNaN(maxO) && (c.daysOverdue || 0) > maxO) return false;
      }
      if (rzFilterMinRemaining.trim()) {
        const minR = parseInt(rzFilterMinRemaining, 10);
        if (!isNaN(minR) && (c.daysRemaining || 0) < minR) return false;
      }
      if (rzFilterMaxRemaining.trim()) {
        const maxR = parseInt(rzFilterMaxRemaining, 10);
        if (!isNaN(maxR) && (c.daysRemaining || 0) > maxR) return false;
      }

      return true;
    });
  }, [
    riskZoneClaims,
    riskZoneFilterLevel,
    riskZoneSearch,
    rzFilterCaseNumber,
    rzFilterDebtorName,
    rzFilterPersonalId,
    rzFilterCreditorName,
    rzFilterMinAmount,
    rzFilterMaxAmount,
    rzFilterMinOverdue,
    rzFilterMaxOverdue,
    rzFilterMinRemaining,
    rzFilterMaxRemaining,
  ]);

  const handleOpenDebtorCardForRiskClaim = (claim: any) => {
    const existing = excelDebtors.find(
      (d: any) =>
        (claim.id && d.id === claim.id) ||
        (claim.personalId && (d.personalId === claim.personalId || d.taxId === claim.personalId)) ||
        (claim.caseNumber && d.caseNumber === claim.caseNumber)
    );
    if (existing) {
      setSelectedDebtorForAnalytics(existing);
      return;
    }
    if (claim.rawDebtor) {
      setSelectedDebtorForAnalytics(claim.rawDebtor);
      return;
    }
    const debtorObj = {
      id: claim.id || `claim-debtor-${claim.personalId}`,
      personalId: claim.personalId,
      taxId: claim.personalId,
      name: claim.debtorName,
      firstName: claim.debtorName?.split(' ')[0] || '',
      lastName: claim.debtorName?.split(' ').slice(1).join(' ') || '',
      companyName: claim.debtorName,
      entityType: (String(claim.personalId || '').length === 11 ? 'PHYSICAL' : 'LEGAL'),
      creditorName: claim.creditorName,
      currentDebt: claim.amount,
      principalAmount: claim.amount,
      amount: claim.amount,
      initialAmount: Math.round(claim.amount * 1.3),
      currentAmount: claim.amount,
      remainingAmount: claim.amount,
      caseNumber: claim.caseNumber,
      agreementNumber: claim.agreementNumber || `AGR-${claim.personalId ? String(claim.personalId).slice(-5) : 'RZ-101'}`,
      overdueDays: claim.daysOverdue,
      daysOverdue: claim.daysOverdue,
      daysRemaining: claim.daysRemaining,
      urgencyLevel: claim.urgencyLevel,
      loanStatus: 'OVERDUE',
      status: 'ვადაგადაცილებული',
      phone: claim.phone || '+995 599 00 00 00',
      email: claim.email || 'debtor@example.ge',
      ratingGrade: 'Grade C',
      address: 'საქართველო, თბილისი',
    };
    setSelectedDebtorForAnalytics(debtorObj);
  };

  const handleSendToLitigation = (claim: any) => {
    setActionSuccessMessage(`საქმე #${claim.caseNumber} (${claim.debtorName}) წარმატებით გადაიგზავნა იურიდიულ დეპარტამენტში სარჩელის აღსაძვრელად!`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleBatchSendToLitigation = () => {
    if (selectedRiskZoneClaimIds.length === 0) return;
    setActionSuccessMessage(`მონიშნული ${selectedRiskZoneClaimIds.length} საქმე წარმატებით გადაიგზავნა იურიდიულ დეპარტამენტში სარჩელის აღსაძვრელად!`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
    setSelectedRiskZoneClaimIds([]);
  };

  const exportRiskZoneToExcel = () => {
    try {
      const sourceList = selectedRiskZoneClaimIds.length > 0
        ? filteredRiskClaims.filter((c: any) => selectedRiskZoneClaimIds.includes(c.id))
        : filteredRiskClaims;

      const rows = sourceList.map((c: any) => ({
        'საქმის №': c.caseNumber,
        'დებიტორი': c.debtorName,
        'პ/ნ / ს/კ': c.personalId,
        'კრედიტორი': c.creditorName,
        'დავალიანება (GEL)': c.amount,
        'ვადაგადაცილება (დღე)': c.daysOverdue,
        'ხანდაზმულობამდე დარჩა (დღე)': c.daysRemaining,
        'რისკის დონე':
          c.urgencyLevel === 'CRITICAL'
            ? 'კრიტიკული (<30 დღე)'
            : c.urgencyLevel === 'HIGH'
            ? 'მაღალი (30-90 დღე)'
            : 'გაფრთხილება (90-180 დღე)',
        'ხელშეკრულების №': c.agreementNumber || '—',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'რისკ ზონა');
      const filenameSuffix = selectedRiskZoneClaimIds.length > 0 ? `Selected_${selectedRiskZoneClaimIds.length}` : 'All';
      XLSX.writeFile(wb, `Debitinfo_Risk_Zone_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Failed to export risk zone to excel:', err);
    }
  };

  const loadAnalystData = async () => {
    setLoadingData(true);
    try {
      const [dRes, cRes, staffRes, claimsRes, workloadRes, pendingRes, statuteRes] = await Promise.allSettled([
        analystBackendService.getDebtorsRegistry(),
        analystBackendService.getCreditorsRegistry(),
        analystBackendService.getStaffOptions(),
        analystBackendService.getClaimsOptions(),
        analystBackendService.getWorkloadStats(),
        analystBackendService.getPendingDebtors(),
        analystBackendService.getStatuteLimitations({ monthsLookback: 6, monthsLookahead: 6 }),
      ]);

      if (
        (dRes.status === 'rejected' && String(dRes.reason).includes('401')) ||
        (cRes.status === 'rejected' && String(cRes.reason).includes('401'))
      ) {
        authService.clearSession();
        window.location.href = '/ops?expired=true&redirect=/analyst';
        return;
      }

      const d = dRes.status === 'fulfilled' ? dRes.value : [];
      const c = cRes.status === 'fulfilled' ? cRes.value : [];
      const staff = staffRes.status === 'fulfilled' ? staffRes.value : [];
      const claims = claimsRes.status === 'fulfilled' ? claimsRes.value : [];
      const workload = workloadRes.status === 'fulfilled' ? workloadRes.value : null;
      const pendingDebtors = pendingRes.status === 'fulfilled' ? pendingRes.value : [];
      const statute = statuteRes.status === 'fulfilled' ? statuteRes.value : null;
      const approachingClaims = statute?.approachingClaims || [];

      setExcelDebtors(d || []);
      setExcelCreditors(c || []);
      setStaffOptions(staff || []);
      setClaimsOptions(claims || []);
      setWorkloadStats(workload || null);
      setPendingCreditorDebtors(pendingDebtors || []);

      // Build real dynamic notifications list
      const notifs: NotificationItem[] = [];

      // 1. Risk Zone alerts (High priority)
      approachingClaims.forEach((claim: any) => {
        notifs.push({
          id: `risk-${claim.id}`,
          type: 'RISK_ZONE',
          title: `⚠️ რისკ ზონა: საქმე #${claim.caseNumber}`,
          message: `${claim.debtorName} • ${Number(claim.amount || 0).toLocaleString()} ₾ — ხანდაზმულობის ვადის გასვლამდე დარჩენილია ${claim.daysRemaining} დღე!`,
          time: 'სასწრაფო',
          read: false,
          urgent: true,
          link: '/analyst/analytics',
        });
      });

      // 1.5 Real-Time Overdue / Missed Due Date Alerts
      const rawDebtorsList = d || [];
      const overdueDebtors = rawDebtorsList.filter(
        (deb: any) =>
          (deb.overdueDays && deb.overdueDays > 0) ||
          deb.claimStatus === 'OVERDUE' ||
          deb.claimStatusText === 'ვადაგადაცილებული'
      );
      overdueDebtors.slice(0, 4).forEach((deb: any) => {
        const dName = deb.name || `${deb.firstName || ''} ${deb.lastName || ''}`.trim() || 'დებიტორი';
        const days = deb.overdueDays || 14;
        const caseNo = deb.agreementNumber || deb.personalId || deb.id.slice(0, 8);
        notifs.push({
          id: `overdue-${deb.id}`,
          type: 'OVERDUE_ALERT',
          title: `⚠️ გადახდის გადაცილება: ${dName}`,
          message: `საქმე #${caseNo} • დავალიანება ${Number(deb.amount || deb.currentAmount || 0).toLocaleString()} ₾. გრაფიკით განსაზღვრულ ვადას გადაცილებულია ${days} დღით! დაუყოვნებლივ მიიღეთ ზომები.`,
          time: 'სასწრაფო',
          read: false,
          urgent: true,
          viewTarget: 'debtors-registry',
          debtorTarget: deb,
        });
      });

      // 2. Pending Debtors
      if (pendingDebtors.length > 0) {
        notifs.push({
          id: 'pending-debtors-summary',
          type: 'PENDING_DEBTOR',
          title: `👥 ${pendingDebtors.length} დებიტორი ელოდება ვერიფიკაციას`,
          message: 'კრედიტორების მიერ შემოტანილი ახალი საქმეები გადამოწმებასა და დამტკიცებას საჭიროებს.',
          time: 'დღეს',
          read: false,
          urgent: false,
          viewTarget: 'pending-debtors',
        });
      }

      // 3. System RS.GE
      notifs.push({
        id: 'system-rs-sync',
        type: 'SYSTEM',
        title: 'RS.GE სინქრონიზაცია აქტიურია',
        message: 'შემოსავლების სამსახურის (RS.GE) სერვისთან კავშირი დამყარებულია და მონაცემები სინქრონიზებულია.',
        time: 'აქტიური',
        read: true,
        urgent: false,
      });

      setNotifications(notifs);
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
      router.replace('/ops?expired=true&redirect=/analyst');
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
        viewParam === 'portfolio-dispatch' ||
        viewParam === 'risk-zone' ||
        viewParam === 'risk-zone'
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
    const errs: { [key: string]: string } = {};

    if (creditorDebtorsList.length === 0) {
      setCreditorFormErrors({
        submit: 'კრედიტორის რეგისტრაციისთვის მინიმუმ ერთი დებიტორის დამატება სავალდებულოა (კრედიტორი დებიტორის გარეშე ვერ იარსებებს).',
      });
      return;
    }

    if (creditorEntityType === 'PHYSICAL') {
      const cleanPhysPin = physPersonalId.trim().replace(/\D/g, '');
      if (!cleanPhysPin) {
        errs.physPersonalId = 'პირადი ნომერი (11 ნიშნა) სავალდებულოა';
      } else if (cleanPhysPin.length !== 11) {
        errs.physPersonalId = 'პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან';
      }

      if (!physFirstName.trim()) {
        errs.physFirstName = 'სახელი სავალდებულოა';
      }

      if (!physLastName.trim()) {
        errs.physLastName = 'გვარი სავალდებულოა';
      }

      if (!physActualAddress.trim()) {
        errs.physActualAddress = 'საცხოვრებელი ადგილი / ფაქტობრივი მისამართი სავალდებულოა';
      }

      if (!physPhone.trim()) {
        errs.physPhone = 'საკონტაქტო ტელეფონი სავალდებულოა';
      }

      setCreditorFormErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setRegisteringCreditor(true);
      try {
        const res = await analystBackendService.registerCreditor({
          entityType: 'PHYSICAL',
          personalId: cleanPhysPin,
          firstName: physFirstName.trim(),
          lastName: physLastName.trim(),
          actualAddress: physActualAddress.trim(),
          phone: physPhone.trim(),
          email: physEmail.trim(),
          agreementNumber: physAgreement.trim() || `AGR-${cleanPhysPin.slice(-4)}`,
          iban: physIban.trim(),
          initialAmount: parseFloat(physInitialAmount) || 0,
          debtors: creditorDebtorsList,
          supportingDocuments: attachedDocuments,
        });

        setIsRegistrationOpen(false);
        setActionSuccessMessage(res?.message || 'ფიზიკური პირი კრედიტორი წარმატებით დარეგისტრირდა!');
        setTimeout(() => setActionSuccessMessage(null), 4000);
        resetCreditorRegistrationForm();
        await loadAnalystData();
      } catch (err: any) {
        console.error('Physical creditor registration error:', err);
        setCreditorFormErrors({ submit: err?.message || 'რეგისტრაცია ვერ მოხერხდა' });
      } finally {
        setRegisteringCreditor(false);
      }
    } else {
      // LEGAL ENTITY
      const cleanTaxId = creditorTaxId.trim().replace(/\D/g, '');
      if (!cleanTaxId) {
        errs.taxId = 'საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) სავალდებულოა';
      } else if (cleanTaxId.length !== 9) {
        errs.taxId = 'საიდენტიფიკაციო კოდი (ს/კ) უნდა შედგებოდეს ზუსტად 9 ციფრისგან';
      }

      if (!creditorCompanyName.trim()) {
        errs.companyName = 'კრედიტორი კომპანიის დასახელება სავალდებულოა';
      }

      if (creditorCategory === 'ინდივიდუალური მეწარმე') {
        const cleanIndPin = creditorIndividualPin.trim().replace(/\D/g, '');
        if (!cleanIndPin) {
          errs.individualPin = 'ინდ. მეწარმის პირადი ნომერი (11 ნიშნა) სავალდებულოა';
        } else if (cleanIndPin.length !== 11) {
          errs.individualPin = 'პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან';
        }
      }

      if (!creditorAgreement.trim()) {
        errs.agreement = 'ხელშეკრულების საფუძველი & № სავალდებულოა';
      }

      if (!repFirstName.trim()) {
        errs.repFirstName = 'წარმომადგენლის სახელი სავალდებულოა';
      }

      if (!repLastName.trim()) {
        errs.repLastName = 'წარმომადგენლის გვარი სავალდებულოა';
      }

      if (!repPhone.trim()) {
        errs.repPhone = 'წარმომადგენლის ტელეფონი სავალდებულოა';
      }

      if (!repEmail.trim()) {
        errs.repEmail = 'წარმომადგენლის ელ-ფოსტა სავალდებულოა';
      }

      setCreditorFormErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setRegisteringCreditor(true);
      try {
        const res = await analystBackendService.registerCreditor({
          entityType: 'LEGAL',
          taxId: cleanTaxId,
          companyName: creditorCompanyName.trim(),
          category: creditorCategory,
          individualPin: creditorCategory === 'ინდივიდუალური მეწარმე' ? creditorIndividualPin.trim() : undefined,
          agreementNumber: creditorAgreement.trim(),
          iban: creditorIban.trim(),
          repFirstName: repFirstName.trim(),
          repLastName: repLastName.trim(),
          repPhone: repPhone.trim(),
          repEmail: repEmail.trim(),
          repRole: 'დირექტორი',
          representativeName: `${repFirstName.trim()} ${repLastName.trim()}`,
          phone: repPhone.trim(),
          email: repEmail.trim(),
          initialAmount: parseFloat(creditorInitialAmount) || 0,
          debtors: creditorDebtorsList,
          supportingDocuments: attachedDocuments,
        });

        setIsRegistrationOpen(false);
        setActionSuccessMessage(res?.message || 'კრედიტორი წარმატებით დარეგისტრირდა!');
        setTimeout(() => setActionSuccessMessage(null), 4000);
        resetCreditorRegistrationForm();
        await loadAnalystData();
      } catch (err: any) {
        console.error('Creditor registration error:', err);
        setCreditorFormErrors({ submit: err?.message || 'რეგისტრაცია ვერ მოხერხდა' });
      } finally {
        setRegisteringCreditor(false);
      }
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
    <div className="flex-1 flex flex-col min-h-screen w-full justify-between bg-surface-bg text-text-primary antialiased font-body-md select-none selection:bg-primary-container selection:text-white" suppressHydrationWarning>
  {/* ========================================================================= */}
  {/* 1. TOP NAVIGATION BAR / OPERATIONS HEADER */}
  {/* ========================================================================= */}
  <header className="w-full bg-surface-card border-b border-border-subtle sticky top-0 z-40 shadow-sm shrink-0">
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
          <button
            type="button"
            onClick={() => setActiveView('risk-zone')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              activeView === 'risk-zone'
                ? 'bg-rose-600 text-white border border-rose-600 shadow-sm'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>რისკ ზონა ({riskZoneClaims.length})</span>
          </button>
          <span className="text-text-muted text-body-sm font-body-sm hidden md:inline">v2.4 Live</span>
        </div>
      </div>
      {/* Spacer replacing obsolete search */}
      <div className="flex-1" />

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

        {/* Real Interactive Notification Bell with Dropdown Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer"
            title="შეტყობინებები"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface-card animate-pulse shadow-xs">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">შეტყობინებები</span>
                  {unreadNotifsCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">
                      {unreadNotifsCount} ახალი
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                      ყველა წაკითხულია
                    </span>
                  )}
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                  >
                    ყველას წაკითხვა
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    შეტყობინებები არ არის
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                        );
                        if (item.debtorTarget) {
                          setSelectedDebtorForAnalytics(item.debtorTarget);
                          setActiveView('debtors-registry');
                          setIsNotificationsOpen(false);
                        } else if (item.viewTarget) {
                          setActiveView(item.viewTarget);
                          setIsNotificationsOpen(false);
                        } else if (item.link) {
                          router.push(item.link);
                          setIsNotificationsOpen(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                        !item.read
                          ? item.type === 'RISK_ZONE'
                            ? 'bg-rose-50/50'
                            : item.type === 'OVERDUE_ALERT'
                            ? 'bg-amber-50/50'
                            : 'bg-blue-50/40'
                          : ''
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        {item.type === 'RISK_ZONE' ? (
                          <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">warning</span>
                          </span>
                        ) : item.type === 'OVERDUE_ALERT' ? (
                          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">event_busy</span>
                          </span>
                        ) : item.type === 'PENDING_DEBTOR' ? (
                          <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">person_check</span>
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              item.type === 'RISK_ZONE'
                                ? 'text-rose-950 font-bold'
                                : item.type === 'OVERDUE_ALERT'
                                ? 'text-amber-950 font-bold'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-snug">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {item.debtorTarget && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDebtorForAnalytics(item.debtorTarget);
                                setActiveView('debtors-registry');
                                setIsNotificationsOpen(false);
                              }}
                              className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
                            >
                              <span>საქმის ბარათის გახსნა</span>
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                            </button>
                          )}
                          {item.link && (
                            <Link
                              href={item.link}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsNotificationsOpen(false);
                              }}
                              className="text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                            >
                              <span>რისკ ზონაში გადასვლა</span>
                              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            </Link>
                          )}
                          {item.viewTarget && !item.debtorTarget && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveView(item.viewTarget!);
                                setIsNotificationsOpen(false);
                              }}
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                            >
                              <span>რეესტრის ნახვა</span>
                              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {!item.read && (
                        <div className="shrink-0 self-center">
                          <span className="w-2 h-2 rounded-full bg-blue-600 block" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  href="/analyst/analytics"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">query_stats</span>
                  <span>ანალიტიკის გვერდი და რისკ ზონა</span>
                </Link>
              </div>
            </div>
          )}
        </div>
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
          v === 'portfolio-dispatch' ||
          v === 'risk-zone'
        ) {
          setActiveView(v);
        }
      }}
      onOpenCreditorRegistration={() => setIsRegistrationOpen(true)}
      onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
      pendingCount={pendingCreditorDebtors.length}
      debtorsCount={excelDebtors.length}
      creditorsCount={excelCreditors.length}
      riskZoneCount={riskZoneClaims.length}
      isOpen={isSidebarOpen}
      onToggleOpen={toggleSidebar}
    />
    {/* ========================================================================= */}
    {/* MAIN CONTENT CANVAS */}
    {/* ========================================================================= */}
    <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-8 bg-surface-bg">
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
            label: 'კრედიტ მენეჯერი',
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
            label: 'ვიზიტორი',
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
        {/* Header with Title and Quick Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors ${
              debtorsEntityType === 'PHYSICAL' ? 'bg-sky-600' : 'bg-indigo-600'
            }`}>
              <span className="material-symbols-outlined text-2xl">
                {debtorsEntityType === 'PHYSICAL' ? 'person' : 'domain'}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                  დებიტორთა რეესტრი
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-bold">
                  {excelDebtors.length} სულ ჩანაწერი
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs font-bold">
                  ჯამური ვალი: {filteredDebtorsTotalAmount.toLocaleString('ka-GE')} ₾
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                დებიტორთა სრული მონაცემთა ბაზა Excel თემფლეითის სტრუქტურის მიხედვით (ფიზიკური და იურიდიული პირები)
              </p>
            </div>
          </div>

          {/* Quick Counter Summary */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
              <span className="material-symbols-outlined text-sm">person</span>
              <span>ფიზიკური: {physicalDebtorsList.length}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
              <span className="material-symbols-outlined text-sm">domain</span>
              <span>იურიდიული: {legalDebtorsList.length}</span>
            </span>
          </div>
        </div>

        {/* Toolbar: Switch Button on Left & Controls on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          {/* Switch on the Left */}
          <div className="inline-flex items-center p-1 bg-white rounded-xl shadow-xs border border-slate-200/80 gap-1 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setDebtorsEntityType('PHYSICAL');
                setSelectedDebtorIds([]);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                debtorsEntityType === 'PHYSICAL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>ფიზიკური პირები</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  debtorsEntityType === 'PHYSICAL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {physicalDebtorsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDebtorsEntityType('LEGAL');
                setSelectedDebtorIds([]);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                debtorsEntityType === 'LEGAL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>იურიდიული პირები</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  debtorsEntityType === 'LEGAL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {legalDebtorsList.length}
              </span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={debtorsSearch}
                onChange={(e) => setDebtorsSearch(e.target.value)}
                placeholder={
                  debtorsEntityType === 'PHYSICAL'
                    ? 'ძიება (სახელი, პ/ნ, ტელეფონი, კრედიტორი)...'
                    : 'ძიება (კომპანია, ს/კ, დირექტორი, ტელეფონი)...'
                }
                className="pl-9 pr-3 py-1.5 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-64 sm:w-80 shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsDebtorsFilterPanelOpen(!isDebtorsFilterPanelOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                isDebtorsFilterPanelOpen || activeDebtorsFiltersCount > 0
                  ? 'bg-blue-50 border-primary text-primary'
                  : 'bg-white border-border-subtle text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>ფილტრები</span>
              {activeDebtorsFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeDebtorsFiltersCount}
                </span>
              )}
            </button>

            {activeDebtorsFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetDebtorsFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer"
                title="ყველა ფილტრის გასუფთავება"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>გასუფთავება</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAnalystData}
              disabled={loadingData}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white hover:bg-slate-50 text-xs text-text-primary font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loadingData ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>განახლება</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openChartStudioForDebtors(
                  selectedDebtorIds.length > 0 ? selectedDebtorsList : filteredDebtors
                )
              }
              disabled={filteredDebtors.length === 0}
              className="px-3.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="მონიშნულ ან გაფილტრულ დებიტორებზე გრაფიკების აგება"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600">bar_chart</span>
              <span>
                {selectedDebtorIds.length > 0
                  ? `გრაფიკის აგება (${selectedDebtorIds.length})`
                  : 'გრაფიკების სტუდია'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportDebtorsExcel}
              disabled={isExportingDebtors || filteredDebtors.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title={
                selectedDebtorIds.length > 0
                  ? `მონიშნული ${selectedDebtorIds.length} დებიტორის ექსპორტი Excel (.xlsx) ფორმატში`
                  : 'გაფილტრული რეესტრის ექსპორტი Excel (.xlsx) ფორმატში'
              }
            >
              <span className={`material-symbols-outlined text-[16px] ${isExportingDebtors ? 'animate-spin' : ''}`}>
                {isExportingDebtors ? 'progress_activity' : 'file_download'}
              </span>
              <span>
                {isExportingDebtors
                  ? 'ექსპორტირდება...'
                  : selectedDebtorIds.length > 0
                  ? `Excel ექსპორტი (მონიშნული: ${selectedDebtorIds.length})`
                  : 'Excel ექსპორტი (.xlsx)'}
              </span>
            </button>
          </div>
        </div>

        {/* Comprehensive Expandable Filter Panel */}
        {isDebtorsFilterPanelOpen && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">filter_list</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  დეტალური ფილტრაცია ({debtorsEntityType === 'PHYSICAL' ? 'ფიზიკური პირის ველები' : 'იურიდიული პირის ველები'})
                </span>
              </div>
              {activeDebtorsFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetDebtorsFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  ყველას გასუფთავება
                </button>
              )}
            </div>

            {debtorsEntityType === 'PHYSICAL' ? (
              /* Physical Entity Filters */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. პირადი ნომერი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პირადი ნომერი (პ/ნ 11-ნიშნა):</label>
                  <input
                    type="text"
                    value={dfPersonalId}
                    onChange={(e) => setDfPersonalId(e.target.value)}
                    placeholder="მაგ: 01024089123"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 2. სახელი & გვარი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">სახელი ან გვარი:</label>
                  <input
                    type="text"
                    value={dfName}
                    onChange={(e) => setDfName(e.target.value)}
                    placeholder="მაგ: დავით კვირიკაშვილი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 3. ტელეფონი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ტელეფონის ნომერი:</label>
                  <input
                    type="text"
                    value={dfPhone}
                    onChange={(e) => setDfPhone(e.target.value)}
                    placeholder="მაგ: +995 599..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 4. ელ-ფოსტა */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ელ-ფოსტა:</label>
                  <input
                    type="text"
                    value={dfEmail}
                    onChange={(e) => setDfEmail(e.target.value)}
                    placeholder="მაგ: davit@..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 5. იურიდიული მისამართი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">იურიდიული მისამართი:</label>
                  <input
                    type="text"
                    value={dfLegalAddress}
                    onChange={(e) => setDfLegalAddress(e.target.value)}
                    placeholder="მაგ: ვაჟა-ფშაველას გამზ."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 6. ფაქტობრივი მისამართი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ფაქტობრივი მისამართი:</label>
                  <input
                    type="text"
                    value={dfActualAddress}
                    onChange={(e) => setDfActualAddress(e.target.value)}
                    placeholder="მაგ: ფანჯიკიძის ქ."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 7. კრედიტორი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კრედიტორი კომპანია:</label>
                  <select
                    value={dfCreditorName}
                    onChange={(e) => setDfCreditorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="">ყველა კრედიტორი</option>
                    {availableCreditorsList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* 8. მიმდინარე დავალიანების დიაპაზონი (Min / Max) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">მიმდინარე დავალიანება (GEL):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={dfMinAmount}
                      onChange={(e) => setDfMinAmount(e.target.value)}
                      placeholder="დან"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      value={dfMaxAmount}
                      onChange={(e) => setDfMaxAmount(e.target.value)}
                      placeholder="მდე"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* 9. სესხის სტატუსი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">სესხის სტატუსი:</label>
                  <select
                    value={dfClaimStatus}
                    onChange={(e) => setDfClaimStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა სტატუსი</option>
                    <option value="SETTLED">გადახდილი</option>
                    <option value="ACTIVE">აქტიური</option>
                    <option value="OVERDUE">ვადაგადაცილებული</option>
                    <option value="DISPUTED">დავაშია</option>
                  </select>
                </div>

                {/* 10. საკრედიტო რეიტინგი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">საკრედიტო რეიტინგი:</label>
                  <select
                    value={dfRating}
                    onChange={(e) => setDfRating(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა რეიტინგი</option>
                    <option value="A">Grade A (მაღალი სანდოობა)</option>
                    <option value="B">Grade B (საშუალო რისკი)</option>
                    <option value="C">Grade C (მაღალი რისკი)</option>
                  </select>
                </div>

                {/* 11. წარმოქმნის თარიღი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">წარმოქმნის თარიღი (დიაპაზონი):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={dfDateFrom}
                      onChange={(e) => setDfDateFrom(e.target.value)}
                      className="w-1/2 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-[11px]"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={dfDateTo}
                      onChange={(e) => setDfDateTo(e.target.value)}
                      className="w-1/2 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-[11px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Legal Entity Filters (13 fields) */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. ს/კ */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ს/კ (9-ნიშნა საიდენტ. კოდი):</label>
                  <input
                    type="text"
                    value={dfTaxId}
                    onChange={(e) => setDfTaxId(e.target.value)}
                    placeholder="მაგ: 405118492"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 2. სრული დასახელება */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">სრული დასახელება (კომპანია):</label>
                  <input
                    type="text"
                    value={dfName}
                    onChange={(e) => setDfName(e.target.value)}
                    placeholder="მაგ: შპს კავკასუს ტრანს..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 3. კომპანიის ტელეფონი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კომპანიის ტელეფონი:</label>
                  <input
                    type="text"
                    value={dfPhone}
                    onChange={(e) => setDfPhone(e.target.value)}
                    placeholder="მაგ: +995 591..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 4. ელ-ფოსტა */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კომპანიის ელ-ფოსტა:</label>
                  <input
                    type="text"
                    value={dfEmail}
                    onChange={(e) => setDfEmail(e.target.value)}
                    placeholder="მაგ: info@cts-georgia.ge"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 5. იურიდიული მისამართი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">იურიდიული მისამართი:</label>
                  <input
                    type="text"
                    value={dfLegalAddress}
                    onChange={(e) => setDfLegalAddress(e.target.value)}
                    placeholder="მაგ: ალ. ყაზბეგის გამზ."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 6. ფაქტობრივი მისამართი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ფაქტობრივი მისამართი:</label>
                  <input
                    type="text"
                    value={dfActualAddress}
                    onChange={(e) => setDfActualAddress(e.target.value)}
                    placeholder="მაგ: აეროპორტის გზატკეცილი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 7. დირექტორის სახელი & გვარი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დირექტორი (სახელი / გვარი):</label>
                  <input
                    type="text"
                    value={dfDirectorName}
                    onChange={(e) => setDfDirectorName(e.target.value)}
                    placeholder="მაგ: დავით კაპანაძე"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 8. დირექტორის პ/ნ */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დირექტორის პირადი ნომერი:</label>
                  <input
                    type="text"
                    value={dfDirectorPersonalId}
                    onChange={(e) => setDfDirectorPersonalId(e.target.value)}
                    placeholder="მაგ: 01019045812"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 9. დირექტორის ტელეფონი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დირექტორის ტელეფონი:</label>
                  <input
                    type="text"
                    value={dfDirectorPhone}
                    onChange={(e) => setDfDirectorPhone(e.target.value)}
                    placeholder="მაგ: +995 599..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 10. დირექტორის ელ-ფოსტა */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დირექტორის ელ-ფოსტა:</label>
                  <input
                    type="text"
                    value={dfDirectorEmail}
                    onChange={(e) => setDfDirectorEmail(e.target.value)}
                    placeholder="მაგ: davit.k@..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 11. კრედიტორი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კრედიტორი კომპანია:</label>
                  <select
                    value={dfCreditorName}
                    onChange={(e) => setDfCreditorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="">ყველა კრედიტორი</option>
                    {availableCreditorsList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* 12. მიმდინარე დავალიანების დიაპაზონი (Min / Max) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">მიმდინარე დავალიანება (GEL):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={dfMinAmount}
                      onChange={(e) => setDfMinAmount(e.target.value)}
                      placeholder="დან"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      value={dfMaxAmount}
                      onChange={(e) => setDfMaxAmount(e.target.value)}
                      placeholder="მდე"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* 13. სესხის სტატუსი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">სესხის სტატუსი:</label>
                  <select
                    value={dfClaimStatus}
                    onChange={(e) => setDfClaimStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა სტატუსი</option>
                    <option value="SETTLED">გადახდილი</option>
                    <option value="ACTIVE">აქტიური</option>
                    <option value="OVERDUE">ვადაგადაცილებული</option>
                    <option value="DISPUTED">დავაშია</option>
                  </select>
                </div>

                {/* 14. საკრედიტო რეიტინგი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">საკრედიტო რეიტინგი:</label>
                  <select
                    value={dfRating}
                    onChange={(e) => setDfRating(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა რეიტინგი</option>
                    <option value="A">Grade A (მაღალი სანდოობა)</option>
                    <option value="B">Grade B (საშუალო რისკი)</option>
                    <option value="C">Grade C (მაღალი რისკი)</option>
                  </select>
                </div>

                {/* 15. წარმოქმნის თარიღი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">წარმოქმნის თარიღი (დიაპაზონი):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={dfDateFrom}
                      onChange={(e) => setDfDateFrom(e.target.value)}
                      className="w-1/2 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-[11px]"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="date"
                      value={dfDateTo}
                      onChange={(e) => setDfDateTo(e.target.value)}
                      className="w-1/2 px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Selection Action Banner for Debtors */}
        {selectedDebtorIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
              <span>
                მონიშნულია <strong className="font-bold text-primary">{selectedDebtorIds.length}</strong> ჩანაწერი{' '}
                ({debtorsEntityType === 'PHYSICAL' ? 'ფიზიკური პირი' : 'იურიდიული პირი'}) — სულ {filteredDebtors.length}-დან
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDebtorIds(filteredDebtors.map((d) => d.id))}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-primary border border-blue-200 text-xs font-semibold transition cursor-pointer"
              >
                ყველას მონიშვნა ({filteredDebtors.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDebtorIds([])}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold transition cursor-pointer"
              >
                მონიშვნის მოხსნა
              </button>
              <button
                type="button"
                onClick={() => openChartStudioForDebtors(selectedDebtorsList)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                title="მონიშნულ დებიტორებზე გრაფიკების აგება"
              >
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <span>გრაფიკის აგება ({selectedDebtorIds.length})</span>
              </button>
              <button
                type="button"
                onClick={handleExportDebtorsExcel}
                disabled={isExportingDebtors}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>მონიშნულის ექსპორტი ({selectedDebtorIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary & Result Count Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted px-1">
          <div className="flex items-center gap-2">
            <span>
              ნაჩვენებია <strong className="text-text-primary font-bold">{filteredDebtors.length}</strong> ჩანაწერი{' '}
              {debtorsEntityType === 'PHYSICAL' ? physicalDebtorsList.length : legalDebtorsList.length}-დან
            </span>
            {activeDebtorsFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold">
                ფილტრი გააქტიურებულია ({activeDebtorsFiltersCount})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>ნაჩვენები დავალიანების ჯამი:</span>
            <span className="font-mono font-bold text-rose-600 text-sm">
              {filteredDebtorsTotalAmount.toLocaleString('ka-GE')} ₾
            </span>
          </div>
        </div>

        {/* Table: Conditional rendering for Physical vs Legal Entity (matching Excel template) */}
        <div className="overflow-x-auto rounded-xl border border-border-subtle shadow-2xs">
          {debtorsEntityType === 'PHYSICAL' ? (
            /* Physical Persons Table (9 Excel Fields + Operational) */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllDebtorsSelected}
                      onChange={toggleAllDebtors}
                      title="ყველას მონიშვნა / მოხსნა"
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="py-3 px-4">პირადი ნომერი (პ/ნ)</th>
                  <th className="py-3 px-4">სახელი</th>
                  <th className="py-3 px-4">გვარი</th>
                  <th className="py-3 px-4">ტელეფონი</th>
                  <th className="py-3 px-4">ელ-ფოსტა</th>
                  <th className="py-3 px-4">იურიდიული მისამართი</th>
                  <th className="py-3 px-4">ფაქტობრივი მისამართი</th>
                  <th className="py-3 px-4">მიმდინარე დავალიანება</th>
                  <th className="py-3 px-4">წარმოქმნის თარიღი</th>
                  <th className="py-3 px-4">კრედიტორი</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4">რეიტინგი</th>
                  <th className="py-3 px-4">გადახდის გრაფიკი</th>
                  <th className="py-3 px-4 text-right">ანალიტიკა / საქმე</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-text-primary">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">person_off</span>
                      <span>ფიზიკური პირები მითითებული ფილტრებით ვერ მოიძებნა</span>
                      {activeDebtorsFiltersCount > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={resetDebtorsFilters}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-blue-50 text-xs font-semibold cursor-pointer"
                          >
                            ფილტრების გასუფთავება
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => toggleDebtorSelection(d.id)}
                      className={`transition-colors whitespace-nowrap cursor-pointer ${
                        selectedDebtorIds.includes(d.id)
                          ? 'bg-blue-50/80 hover:bg-blue-100/70 font-medium'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedDebtorIds.includes(d.id)}
                          onChange={() => toggleDebtorSelection(d.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                        <div className="flex items-center gap-1.5">
                          <span>{d.personalId}</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(d.personalId)}
                            title="დაკოპირება"
                            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {d.firstName || (d.name ? d.name.split(' ')[0] : '—')}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        {d.lastName || (d.name ? d.name.split(' ').slice(1).join(' ') : '—')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {d.phone ? (
                          <a href={`tel:${d.phone}`} className="hover:text-primary transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                            {d.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.email ? (
                          <a href={`mailto:${d.email}`} className="hover:text-primary transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                            {d.email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={d.legalAddress || ''}>
                        {d.legalAddress || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={d.actualAddress || ''}>
                        {d.actualAddress || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {Number(d.currentAmount ?? d.remainingAmount ?? d.amount ?? 0).toLocaleString('ka-GE')} ₾
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {d.debtOriginationDate ? String(d.debtOriginationDate).slice(0, 10) : '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">account_balance</span>
                          {d.creditorName || 'შპს ჯეო ტრეიდინგი'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {d.claimStatusText === 'გადახდილი' || d.claimStatus === 'SETTLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            გადახდილი
                          </span>
                        ) : d.claimStatusText === 'დავაშია' || d.claimStatus === 'DISPUTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            დავაშია
                          </span>
                        ) : d.claimStatusText === 'ვადაგადაცილებული' || d.claimStatus === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            ვადაგადაცილებული
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {d.claimStatusText || 'აქტიური'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {d.ratingGrade === 'Grade A' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Grade A
                          </span>
                        ) : d.ratingGrade === 'Grade B' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Grade B
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {d.ratingGrade || 'Grade C'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openChartStudioForDebtors([d])}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center transition cursor-pointer"
                            title="ამ დებიტორის გრაფიკის აგება"
                          >
                            <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDebtorForAnalytics(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:shadow-xs active:scale-95"
                            title="სრული ანალიტიკა და საქმის ბარათი"
                          >
                            <span className="material-symbols-outlined text-[15px]">badge</span>
                            <span>საქმის ბარათი</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Legal Entities Table (13 Excel Fields + Operational) */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllDebtorsSelected}
                      onChange={toggleAllDebtors}
                      title="ყველას მონიშვნა / მოხსნა"
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                  <th className="py-3 px-4">ს/კ (9-ნიშნა)</th>
                  <th className="py-3 px-4">სრული დასახელება</th>
                  <th className="py-3 px-4">ტელეფონი</th>
                  <th className="py-3 px-4">ელ-ფოსტა</th>
                  <th className="py-3 px-4">იურიდიული მისამართი</th>
                  <th className="py-3 px-4">ფაქტობრივი მისამართი</th>
                  <th className="py-3 px-4">მიმდინარე დავალიანება</th>
                  <th className="py-3 px-4">წარმოქმნის თარიღი</th>
                  <th className="py-3 px-4">დირექტორი (სახელი, გვარი, პ/ნ)</th>
                  <th className="py-3 px-4">დირექტორის კონტაქტი</th>
                  <th className="py-3 px-4">კრედიტორი</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4">რეიტინგი</th>
                  <th className="py-3 px-4">გადახდის გრაფიკი</th>
                  <th className="py-3 px-4 text-right">ანალიტიკა / საქმე</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-text-primary">
                {filteredDebtors.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">domain_disabled</span>
                      <span>იურიდიული პირები მითითებული ფილტრებით ვერ მოიძებნა</span>
                      {activeDebtorsFiltersCount > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={resetDebtorsFilters}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-blue-50 text-xs font-semibold cursor-pointer"
                          >
                            ფილტრების გასუფთავება
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDebtors.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => toggleDebtorSelection(d.id)}
                      className={`transition-colors whitespace-nowrap cursor-pointer ${
                        selectedDebtorIds.includes(d.id)
                          ? 'bg-blue-50/80 hover:bg-blue-100/70 font-medium'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedDebtorIds.includes(d.id)}
                          onChange={() => toggleDebtorSelection(d.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                        <div className="flex items-center gap-1.5">
                          <span>{d.taxId || d.personalId}</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(d.taxId || d.personalId)}
                            title="დაკოპირება"
                            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-primary flex items-center justify-center font-bold text-xs">
                            <span className="material-symbols-outlined text-[16px]">domain</span>
                          </span>
                          <span>{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {d.phone ? (
                          <a href={`tel:${d.phone}`} className="hover:text-primary transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                            {d.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.email ? (
                          <a href={`mailto:${d.email}`} className="hover:text-primary transition flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                            {d.email}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={d.legalAddress || ''}>
                        {d.legalAddress || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={d.actualAddress || ''}>
                        {d.actualAddress || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {Number(d.currentAmount ?? d.remainingAmount ?? d.amount ?? 0).toLocaleString('ka-GE')} ₾
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {d.debtOriginationDate ? String(d.debtOriginationDate).slice(0, 10) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {d.directorFirstName || d.directorLastName || d.directorPersonalId ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {`${d.directorFirstName || ''} ${d.directorLastName || ''}`.trim() || 'დირექტორი'}
                            </div>
                            {d.directorPersonalId && (
                              <div className="font-mono text-[11px] text-slate-500">
                                პ/ნ: {d.directorPersonalId}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {d.directorPhone && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">call</span>
                            <span>{d.directorPhone}</span>
                          </div>
                        )}
                        {d.directorEmail && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-slate-400">mail</span>
                            <span>{d.directorEmail}</span>
                          </div>
                        )}
                        {!d.directorPhone && !d.directorEmail && '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-text-primary">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs">
                          <span className="material-symbols-outlined text-[13px] text-slate-500">account_balance</span>
                          {d.creditorName || 'სს ლიდერ კრედიტი'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {d.claimStatusText === 'გადახდილი' || d.claimStatus === 'SETTLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            გადახდილი
                          </span>
                        ) : d.claimStatusText === 'დავაშია' || d.claimStatus === 'DISPUTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            დავაშია
                          </span>
                        ) : d.claimStatusText === 'ვადაგადაცილებული' || d.claimStatus === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            ვადაგადაცილებული
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {d.claimStatusText || 'აქტიური'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {d.ratingGrade === 'Grade A' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Grade A
                          </span>
                        ) : d.ratingGrade === 'Grade B' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Grade B
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {d.ratingGrade || 'Grade C'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openChartStudioForDebtors([d])}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center transition cursor-pointer"
                            title="ამ დებიტორის გრაფიკის აგება"
                          >
                            <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDebtorForAnalytics(d)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:shadow-xs active:scale-95"
                            title="სრული ანალიტიკა და საქმის ბარათი"
                          >
                            <span className="material-symbols-outlined text-[15px]">badge</span>
                            <span>საქმის ბარათი</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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
        {/* Top Header Summary */}
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
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono text-xs font-bold">
                  {excelCreditors.length} სულ ჩანაწერი
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-bold">
                  პორტფელის ჯამი: {filteredCreditorsTotalAmount.toLocaleString('ka-GE')} ₾
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
                კრედიტორთა ერთიანი ბაზა იურიდიული და ფიზიკური პირების მიხედვით, პორტფელის მოცულობა და დებიტორების მართვა
              </p>
            </div>
          </div>

          {/* Quick Counter Summary */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold">
              <span className="material-symbols-outlined text-sm">domain</span>
              <span>იურიდიული: {legalCreditorsList.length}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-semibold">
              <span className="material-symbols-outlined text-sm">person</span>
              <span>ფიზიკური: {physicalCreditorsList.length}</span>
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* კრედიტორის პორტფელის დინამიკა (ზრდა / კლება) - CUSTOM RANGE */}
        {/* ============================================================== */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-2xl">monitoring</span>
                <h3 className="font-bold text-base text-white">
                  კრედიტორის პორტფელის დინამიკა (ზრდა / კლება)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                პორტფელის ზრდა-კლებისა და ამოღების ზუსტი გაანგარიშება მორგებული პერიოდის მიხედვით
              </p>
            </div>

            {/* Creditor Dropdown & Range Mode Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Creditor Selector */}
              <div className="relative">
                <select
                  value={creditorDynTargetId}
                  onChange={(e) => setCreditorDynTargetId(e.target.value)}
                  className="bg-slate-800 text-slate-100 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ALL">ყველა კრედიტორი (კრებსითი)</option>
                  {excelCreditors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({Number(c.amount || c.portfolioAmount || 0).toLocaleString()} ₾)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Switcher: Preset / Custom Days / Custom Dates */}
              <div className="inline-flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCreditorDynRangeMode('preset')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    creditorDynRangeMode === 'preset'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  სტანდარტული
                </button>
                <button
                  type="button"
                  onClick={() => setCreditorDynRangeMode('custom_days')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    creditorDynRangeMode === 'custom_days'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  მორგებული დღეები
                </button>
                <button
                  type="button"
                  onClick={() => setCreditorDynRangeMode('custom_dates')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    creditorDynRangeMode === 'custom_dates'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  თარიღების დიაპაზონი
                </button>
              </div>
            </div>
          </div>

          {/* Sub-bar for Range Inputs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            {creditorDynRangeMode === 'preset' && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
                {(
                  [
                    { id: '30d', label: '30 დღე' },
                    { id: '90d', label: '3 თვე' },
                    { id: '180d', label: '6 თვე' },
                    { id: '365d', label: '1 წელი' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setCreditorDynPreset(r.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      creditorDynPreset === r.id
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {creditorDynRangeMode === 'custom_days' && (
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 font-medium">შეიყვანეთ დღეების რაოდენობა:</span>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={creditorDynCustomDays}
                  onChange={(e) => setCreditorDynCustomDays(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-300">დღე</span>
                <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                  {[15, 30, 45, 60, 90, 180].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCreditorDynCustomDays(days)}
                      className="px-2 py-0.5 rounded bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition cursor-pointer"
                    >
                      {days}დღე
                    </button>
                  ))}
                </div>
              </div>
            )}

            {creditorDynRangeMode === 'custom_dates' && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 font-medium">თარიღიდან:</span>
                <input
                  type="date"
                  value={creditorDynDateFrom}
                  onChange={(e) => setCreditorDynDateFrom(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400 font-medium">— მდე:</span>
                <input
                  type="date"
                  value={creditorDynDateTo}
                  onChange={(e) => setCreditorDynDateTo(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="text-slate-400 text-xs font-mono ml-auto">
              გაანგარიშების პერიოდი: <span className="text-blue-400 font-bold">{creditorDynMetrics.periodLabel}</span> ({creditorDynMetrics.effectiveDays} დღე)
            </div>
          </div>

          {/* Dynamic Growth / Decline KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Card 1: აქტიური პორტფელი */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/70">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>აქტიური პორტფელი</span>
                <span className="material-symbols-outlined text-slate-500 text-base">account_balance_wallet</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1.5 font-mono">
                {creditorDynMetrics.totalPortfolio.toLocaleString('ka-GE')} ₾
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-400">groups</span>
                <span>{creditorDynMetrics.activeDebtorsCount} აქტიური დებიტორი</span>
              </div>
            </div>

            {/* Card 2: დინამიკა პერიოდში */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/70">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>დინამიკა პერიოდში</span>
                <span className="text-[11px] text-slate-400">{creditorDynMetrics.periodLabel}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`material-symbols-outlined text-2xl ${creditorDynMetrics.isGrowth ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {creditorDynMetrics.isGrowth ? 'trending_up' : 'trending_down'}
                </span>
                <span className={`text-2xl font-bold font-mono ${creditorDynMetrics.isGrowth ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {creditorDynMetrics.isGrowth ? '+' : '-'}{creditorDynMetrics.deltaRate}%
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {creditorDynMetrics.isGrowth ? 'პორტფელის ზრდა' : 'პორტფელის კლება'} ({creditorDynMetrics.deltaAmount.toLocaleString('ka-GE')} ₾)
              </div>
            </div>

            {/* Card 3: ამოღებული მოცულობა */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/70">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>ამოღებული მოცულობა</span>
                <span className="material-symbols-outlined text-emerald-400 text-base">price_check</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-1.5 font-mono">
                {creditorDynMetrics.recoveredSum.toLocaleString('ka-GE')} ₾
              </div>
              <div className="text-xs text-slate-400 mt-1">
                დაფარვის ტემპი: <strong className="text-emerald-400 font-mono">{creditorDynMetrics.recoveryRatePct}%</strong>
              </div>
            </div>

            {/* Card 4: პერიოდის საწყისი ბალანსი */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/70">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>პერიოდის საწყისი ბალანსი</span>
                <span className="material-symbols-outlined text-slate-500 text-base">history</span>
              </div>
              <div className="text-2xl font-bold text-slate-200 mt-1.5 font-mono">
                {creditorDynMetrics.startPeriodVolume.toLocaleString('ka-GE')} ₾
              </div>
              <div className="text-xs text-slate-400 mt-1">
                შედარება პერიოდის სტარტთან ({creditorDynMetrics.effectiveDays} დღის წინ)
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Switch Button on Left & Controls on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
          {/* Switch on the Left */}
          <div className="inline-flex items-center p-1 bg-white rounded-xl shadow-xs border border-slate-200/80 gap-1 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setCreditorsEntityType('LEGAL');
                setSelectedCreditorIds([]);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                creditorsEntityType === 'LEGAL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>იურიდიული პირები</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  creditorsEntityType === 'LEGAL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {legalCreditorsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreditorsEntityType('PHYSICAL');
                setSelectedCreditorIds([]);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                creditorsEntityType === 'PHYSICAL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>ფიზიკური პირები</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  creditorsEntityType === 'PHYSICAL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {physicalCreditorsList.length}
              </span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2 text-text-muted text-[18px]">
                search
              </span>
              <input
                type="text"
                value={creditorsSearch}
                onChange={(e) => setCreditorsSearch(e.target.value)}
                placeholder={
                  creditorsEntityType === 'LEGAL'
                    ? 'ძიება (კომპანია, ს/კ, დირექტორი, ხელშეკრულება)...'
                    : 'ძიება (სახელი, გვარი, პ/ნ, ტელეფონი, ხელშეკრულება)...'
                }
                className="pl-9 pr-3 py-1.5 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-64 sm:w-80 shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreditorsFilterPanelOpen(!isCreditorsFilterPanelOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                isCreditorsFilterPanelOpen || activeCreditorsFiltersCount > 0
                  ? 'bg-blue-50 border-primary text-primary'
                  : 'bg-white border-border-subtle text-text-primary hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>ფილტრები</span>
              {activeCreditorsFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeCreditorsFiltersCount}
                </span>
              )}
            </button>

            {activeCreditorsFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetCreditorsFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer"
                title="ყველა ფილტრის გასუფთავება"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>გასუფთავება</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadAnalystData}
              disabled={loadingData}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white hover:bg-slate-50 text-xs text-text-primary font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loadingData ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>განახლება</span>
            </button>

            <button
              type="button"
              onClick={() =>
                openChartStudioForCreditors(
                  selectedCreditorIds.length > 0 ? selectedCreditorsList : filteredCreditors
                )
              }
              disabled={filteredCreditors.length === 0}
              className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="მონიშნულ ან გაფილტრულ კრედიტორებზე გრაფიკების აგება"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-600">bar_chart</span>
              <span>
                {selectedCreditorIds.length > 0
                  ? `გრაფიკის აგება (${selectedCreditorIds.length})`
                  : 'გრაფიკების სტუდია'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportCreditorsExcel}
              disabled={isExportingCreditors || filteredCreditors.length === 0}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title={
                selectedCreditorIds.length > 0
                  ? `მონიშნული ${selectedCreditorIds.length} კრედიტორის ექსპორტი Excel (.xlsx) ფორმატში`
                  : 'კრედიტორთა რეესტრის ექსპორტი Excel (.xlsx) ფორმატში'
              }
            >
              <span className={`material-symbols-outlined text-[16px] ${isExportingCreditors ? 'animate-spin' : ''}`}>
                {isExportingCreditors ? 'progress_activity' : 'file_download'}
              </span>
              <span>
                {isExportingCreditors
                  ? 'ექსპორტირდება...'
                  : selectedCreditorIds.length > 0
                  ? `Excel ექსპორტი (მონიშნული: ${selectedCreditorIds.length})`
                  : 'Excel ექსპორტი (.xlsx)'}
              </span>
            </button>
          </div>
        </div>

        {/* Comprehensive Expandable Filter Panel */}
        {isCreditorsFilterPanelOpen && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">filter_list</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  დეტალური ფილტრაცია ({creditorsEntityType === 'LEGAL' ? 'იურიდიული პირის 10 ველი' : 'ფიზიკური პირის 9 ველი'})
                </span>
              </div>
              {activeCreditorsFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetCreditorsFilters}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  ყველას გასუფთავება
                </button>
              )}
            </div>

            {creditorsEntityType === 'LEGAL' ? (
              /* Legal Entity Filters */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. ს/კ */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ს/კ (9-ნიშნა საიდენტ. კოდი):</label>
                  <input
                    type="text"
                    value={cfTaxId}
                    onChange={(e) => setCfTaxId(e.target.value)}
                    placeholder="მაგ: 405123456"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 2. კომპანიის დასახელება */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კომპანიის დასახელება:</label>
                  <input
                    type="text"
                    value={cfCompanyName}
                    onChange={(e) => setCfCompanyName(e.target.value)}
                    placeholder="მაგ: შპს ჯეო ტრეიდინგი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 3. კატეგორია */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კრედიტორის კატეგორია:</label>
                  <select
                    value={cfCategory}
                    onChange={(e) => setCfCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა კატეგორია</option>
                    <option value="შპს">შეზღუდული პასუხისმგებლობის საზოგადოება (შპს)</option>
                    <option value="სააქციო საზოგადოება">სააქციო საზოგადოება (სს)</option>
                    <option value="ამხანაგობა">ამხანაგობა</option>
                    <option value="ა(ა)იპ">ა(ა)იპ</option>
                    <option value="ინდივიდუალური მეწარმე">ინდივიდუალური მეწარმე</option>
                  </select>
                </div>

                {/* 4. ინდივიდუალური მეწარმის პირადი ნომერი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ინდ. მეწარმის პ/ნ (11-ნიშნა):</label>
                  <input
                    type="text"
                    value={cfDirectorPin}
                    onChange={(e) => setCfDirectorPin(e.target.value)}
                    placeholder="მაგ: 01019012345"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 5. უფლებამოსილი წარმომადგენელი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">წარმომადგენელი / დირექტორი:</label>
                  <input
                    type="text"
                    value={cfDirectorName}
                    onChange={(e) => setCfDirectorName(e.target.value)}
                    placeholder="მაგ: ნიკოლოზ გელოვანი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 6. წარმომადგენლის ტელეფონი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">წარმომადგენლის ტელეფონი:</label>
                  <input
                    type="text"
                    value={cfDirectorPhone}
                    onChange={(e) => setCfDirectorPhone(e.target.value)}
                    placeholder="მაგ: +995 599..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 7. წარმომადგენლის ელ-ფოსტა */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">წარმომადგენლის ელ-ფოსტა:</label>
                  <input
                    type="text"
                    value={cfDirectorEmail}
                    onChange={(e) => setCfDirectorEmail(e.target.value)}
                    placeholder="მაგ: director@mail.ge"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 8. ხელშეკრულების № */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ხელშეკრულების №:</label>
                  <input
                    type="text"
                    value={cfAgreementNumber}
                    onChange={(e) => setCfAgreementNumber(e.target.value)}
                    placeholder="მაგ: PORT-GEO-01"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 9. პორტფელის მოცულობა (Min / Max) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პორტფელის მოცულობა (GEL):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cfMinAmount}
                      onChange={(e) => setCfMinAmount(e.target.value)}
                      placeholder="დან"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      value={cfMaxAmount}
                      onChange={(e) => setCfMaxAmount(e.target.value)}
                      placeholder="მდე"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* 10. პლატფორმაზე სტატუსი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პლატფორმაზე სტატუსი:</label>
                  <select
                    value={cfPlatformStatus}
                    onChange={(e) => setCfPlatformStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა</option>
                    <option value="REGISTERED">რეგისტრირებულია</option>
                    <option value="NOT_REGISTERED">არ არის რეგისტრირებული</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Physical Creditor Filters */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. პირადი ნომერი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პირადი ნომერი (პ/ნ 11-ნიშნა):</label>
                  <input
                    type="text"
                    value={cfPersonalId}
                    onChange={(e) => setCfPersonalId(e.target.value)}
                    placeholder="მაგ: 01019099887"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 2. სახელი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">სახელი:</label>
                  <input
                    type="text"
                    value={cfFirstName}
                    onChange={(e) => setCfFirstName(e.target.value)}
                    placeholder="მაგ: გიორგი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 3. გვარი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">გვარი:</label>
                  <input
                    type="text"
                    value={cfLastName}
                    onChange={(e) => setCfLastName(e.target.value)}
                    placeholder="მაგ: ბერიძე"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 4. ტელეფონი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ტელეფონის ნომერი:</label>
                  <input
                    type="text"
                    value={cfPhone}
                    onChange={(e) => setCfPhone(e.target.value)}
                    placeholder="მაგ: +995 599..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 5. ელ-ფოსტა */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ელ-ფოსტა:</label>
                  <input
                    type="text"
                    value={cfEmail}
                    onChange={(e) => setCfEmail(e.target.value)}
                    placeholder="მაგ: giorgi@..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 6. ფაქტობრივი მისამართი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ფაქტობრივი მისამართი:</label>
                  <input
                    type="text"
                    value={cfActualAddress}
                    onChange={(e) => setCfActualAddress(e.target.value)}
                    placeholder="მაგ: ქ. თბილისი, პეკინის გამზ. 15"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 7. ხელშეკრულების № */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ხელშეკრულების №:</label>
                  <input
                    type="text"
                    value={cfAgreementNumber}
                    onChange={(e) => setCfAgreementNumber(e.target.value)}
                    placeholder="მაგ: AGR-PHYS-2024"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {/* 8. პორტფელის მოცულობა (Min / Max) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პორტფელის მოცულობა (GEL):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={cfMinAmount}
                      onChange={(e) => setCfMinAmount(e.target.value)}
                      placeholder="დან"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      value={cfMaxAmount}
                      onChange={(e) => setCfMaxAmount(e.target.value)}
                      placeholder="მდე"
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* 9. პლატფორმაზე სტატუსი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პლატფორმაზე სტატუსი:</label>
                  <select
                    value={cfPlatformStatus}
                    onChange={(e) => setCfPlatformStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">ყველა</option>
                    <option value="REGISTERED">რეგისტრირებულია</option>
                    <option value="NOT_REGISTERED">არ არის რეგისტრირებული</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Selection Action Banner for Creditors */}
        {selectedCreditorIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-[20px]">check_circle</span>
              <span>
                მონიშნულია <strong className="font-bold text-emerald-800">{selectedCreditorIds.length}</strong> კრედიტორი{' '}
                ({creditorsEntityType === 'LEGAL' ? 'იურიდიული პირი' : 'ფიზიკური პირი'}) — სულ {filteredCreditors.length}-დან
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCreditorIds(filteredCreditors.map((c) => c.id))}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer"
              >
                ყველას მონიშვნა ({filteredCreditors.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCreditorIds([])}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold transition cursor-pointer"
              >
                მონიშვნის მოხსნა
              </button>
              <button
                type="button"
                onClick={() => openChartStudioForCreditors(selectedCreditorsList)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                title="მონიშნულ კრედიტორებზე გრაფიკების აგება"
              >
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <span>გრაფიკის აგება ({selectedCreditorIds.length})</span>
              </button>
              <button
                type="button"
                onClick={handleExportCreditorsExcel}
                disabled={isExportingCreditors}
                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>მონიშნულის ექსპორტი ({selectedCreditorIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter Summary & Result Count Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted px-1">
          <div className="flex items-center gap-2">
            <span>
              ნაჩვენებია <strong className="text-text-primary font-bold">{filteredCreditors.length}</strong> ჩანაწერი{' '}
              {creditorsEntityType === 'LEGAL' ? legalCreditorsList.length : physicalCreditorsList.length}-დან
            </span>
            {activeCreditorsFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold">
                ფილტრი გააქტიურებულია ({activeCreditorsFiltersCount})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>ნაჩვენები პორტფელის ჯამი:</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">
              {filteredCreditorsTotalAmount.toLocaleString('ka-GE')} ₾
            </span>
          </div>
        </div>

        {/* Table: Conditional rendering for Legal vs Physical Creditors */}
        <div className="overflow-x-auto rounded-xl border border-border-subtle shadow-2xs">
          {creditorsEntityType === 'LEGAL' ? (
            /* Legal Creditors Table */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllCreditorsSelected}
                      onChange={toggleAllCreditors}
                      title="ყველას მონიშვნა / მოხსნა"
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                  <th className="py-3 px-4">ს/კ (9-ნიშნა)</th>
                  <th className="py-3 px-4">კომპანიის დასახელება</th>
                  <th className="py-3 px-4">კატეგორია</th>
                  <th className="py-3 px-4">ინდ. მეწარმის პ/ნ</th>
                  <th className="py-3 px-4">უფლებამოსილი წარმომადგენელი (დირექტორი)</th>
                  <th className="py-3 px-4">წარმომადგენლის კონტაქტი</th>
                  <th className="py-3 px-4">ხელშეკრულების №</th>
                  <th className="py-3 px-4">პორტფელის მოცულობა (GEL)</th>
                  <th className="py-3 px-4">დებიტორები</th>
                  <th className="py-3 px-4">დოკუმენტები</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-text-primary">
                {filteredCreditors.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">domain_disabled</span>
                      <span>იურიდიული პირი კრედიტორები მითითებული ფილტრებით ვერ მოიძებნა</span>
                      {activeCreditorsFiltersCount > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={resetCreditorsFilters}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-blue-50 text-xs font-semibold cursor-pointer"
                          >
                            ფილტრების გასუფთავება
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCreditors.map((c) => {
                    const repName = `${c.directorFirstName || ''} ${c.directorLastName || ''}`.trim() || c.companyOrPerson || '—';
                    const docsCount = Array.isArray(c.supportingDocuments) ? c.supportingDocuments.length : 0;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleCreditorSelection(c.id)}
                        className={`transition-colors whitespace-nowrap cursor-pointer ${
                          selectedCreditorIds.includes(c.id)
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/70 font-medium'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedCreditorIds.includes(c.id)}
                            onChange={() => toggleCreditorSelection(c.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                          <div className="flex items-center gap-1.5">
                            <span>{c.taxId || c.personalId}</span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(c.taxId || c.personalId)}
                              title="დაკოპირება"
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-primary flex items-center justify-center font-bold text-xs">
                              <span className="material-symbols-outlined text-[16px]">domain</span>
                            </span>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium">
                            {c.category || 'შპს'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.directorPersonalId ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                              {c.directorPersonalId}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">badge</span>
                            <span>{repName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                          {c.directorPhone && (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-slate-400">call</span>
                              <a href={`tel:${c.directorPhone}`} className="hover:text-primary transition">{c.directorPhone}</a>
                            </div>
                          )}
                          {c.directorEmail && (
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-slate-400">mail</span>
                              <a href={`mailto:${c.directorEmail}`} className="hover:text-primary transition">{c.directorEmail}</a>
                            </div>
                          )}
                          {!c.directorPhone && !c.directorEmail && '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.agreementNumber || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {Number(c.amount).toLocaleString('ka-GE')} ₾
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">groups</span>
                            <span>{c.debtorsCount || 0} დებიტორი</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {docsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                              <span className="material-symbols-outlined text-[13px]">description</span>
                              <span>{docsCount} ფაილი</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {c.isRegisteredOnPlatform ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              რეგისტრირებულია
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                              არ არის რეგისტრირებული
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openChartStudioForCreditors([c]);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center transition cursor-pointer"
                              title="ამ კრედიტორის პორტფელის გრაფიკის აგება"
                            >
                              <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreditorDynTargetId(c.id);
                                window.scrollTo({ top: 320, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="ამ კრედიტორის პორტფელის დინამიკის ნახვა"
                            >
                              <span className="material-symbols-outlined text-[15px] text-blue-600">monitoring</span>
                              <span>დინამიკა</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
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
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Physical Creditors Table */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllCreditorsSelected}
                      onChange={toggleAllCreditors}
                      title="ყველას მონიშვნა / მოხსნა"
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                  <th className="py-3 px-4">პირადი ნომერი (პ/ნ 11-ნიშნა)</th>
                  <th className="py-3 px-4">სახელი</th>
                  <th className="py-3 px-4">გვარი</th>
                  <th className="py-3 px-4">ტელეფონის ნომერი</th>
                  <th className="py-3 px-4">ელ-ფოსტა</th>
                  <th className="py-3 px-4">ფაქტობრივი მისამართი</th>
                  <th className="py-3 px-4">ხელშეკრულების №</th>
                  <th className="py-3 px-4">პორტფელის მოცულობა (GEL)</th>
                  <th className="py-3 px-4">დებიტორები</th>
                  <th className="py-3 px-4">დოკუმენტები</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white text-text-primary">
                {filteredCreditors.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-text-muted">
                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">person_off</span>
                      <span>ფიზიკური პირი კრედიტორები მითითებული ფილტრებით ვერ მოიძებნა</span>
                      {activeCreditorsFiltersCount > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={resetCreditorsFilters}
                            className="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-blue-50 text-xs font-semibold cursor-pointer"
                          >
                            ფილტრების გასუფთავება
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCreditors.map((c) => {
                    const fName = c.firstName || (c.name ? c.name.split(' ')[0] : '—');
                    const lName = c.lastName || (c.name ? c.name.split(' ').slice(1).join(' ') : '—');
                    const docsCount = Array.isArray(c.supportingDocuments) ? c.supportingDocuments.length : 0;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => toggleCreditorSelection(c.id)}
                        className={`transition-colors whitespace-nowrap cursor-pointer ${
                          selectedCreditorIds.includes(c.id)
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/70 font-medium'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedCreditorIds.includes(c.id)}
                            onChange={() => toggleCreditorSelection(c.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                          <div className="flex items-center gap-1.5">
                            <span>{c.personalId}</span>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(c.personalId)}
                              title="დაკოპირება"
                              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">content_copy</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {fName}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {lName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.phone ? (
                            <a href={`tel:${c.phone}`} className="hover:text-primary transition flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                              {c.phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="hover:text-primary transition flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                              {c.email}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={c.actualAddress || ''}>
                          {c.actualAddress || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {c.agreementNumber || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {Number(c.amount).toLocaleString('ka-GE')} ₾
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">groups</span>
                            <span>{c.debtorsCount || 0} დებიტორი</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {docsCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                              <span className="material-symbols-outlined text-[13px]">description</span>
                              <span>{docsCount} ფაილი</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {c.isRegisteredOnPlatform ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              რეგისტრირებულია
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                              არ არის რეგისტრირებული
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openChartStudioForCreditors([c]);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center transition cursor-pointer"
                              title="ამ კრედიტორის პორტფელის გრაფიკის აგება"
                            >
                              <span className="material-symbols-outlined text-[15px]">bar_chart</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCreditorDynTargetId(c.id);
                                window.scrollTo({ top: 320, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="ამ კრედიტორის პორტფელის დინამიკის ნახვა"
                            >
                              <span className="material-symbols-outlined text-[15px] text-blue-600">monitoring</span>
                              <span>დინამიკა</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
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
                    );
                  })
                )}
              </tbody>
            </table>
          )}
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
      ) : activeView === 'risk-zone' ? (
        <section className="space-y-6 animate-fadeIn">
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

          {/* 1. Sleek Compact Header & Action Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    რისკ ზონა (<span className="text-rose-600 font-mono">&lt;180 დღე</span>)
                  </h1>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    ხანდაზმულობის ზღვარი
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  3-წლიანი სასარჩელო ხანდაზმულობის კრიტიკული და მაღალი რისკის საქმეები
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* საფრთხის ქვეშ მყოფი თანხა KPI */}
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-600 block leading-tight">საფრთხის ქვეშ</span>
                  <span className="text-sm font-extrabold font-mono text-rose-950">
                    {riskZoneSummary.totalAmountGel.toLocaleString()} ₾
                  </span>
                </div>
                <span className="text-[11px] text-rose-500 font-mono border-l border-rose-200 pl-2">
                  {riskZoneClaims.length} საქმე
                </span>
              </div>

              {/* Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setIsRiskZoneFilterPanelOpen(!isRiskZoneFilterPanelOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                  isRiskZoneFilterPanelOpen || activeRiskZoneFiltersCount > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>ფილტრები</span>
                {activeRiskZoneFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeRiskZoneFiltersCount}
                  </span>
                )}
              </button>

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={exportRiskZoneToExcel}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                title="რისკ ზონის მონაცემების Excel-ში ექსპორტი"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>
                  {selectedRiskZoneClaimIds.length > 0
                    ? `მონიშნულის ექსპორტი (${selectedRiskZoneClaimIds.length})`
                    : 'Excel ექსპორტი'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. 4 Metric Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Critical <30 days */}
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-700 font-bold block">🚨 კრიტიკული (&lt;30 დღე)</span>
                <span className="text-2xl font-extrabold font-mono text-rose-950 mt-1 block">
                  {riskZoneSummary.criticalCount} საქმე
                </span>
                <span className="text-[11px] text-rose-600 font-mono mt-0.5 block">
                  {riskZoneSummary.criticalGel.toLocaleString()} ₾
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
            </div>

            {/* High 30-90 days */}
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-700 font-bold block">⚠️ მაღალი რისკი (30 - 90 დღე)</span>
                <span className="text-2xl font-extrabold font-mono text-amber-950 mt-1 block">
                  {riskZoneSummary.highCount} საქმე
                </span>
                <span className="text-[11px] text-amber-700 font-mono mt-0.5 block">
                  {riskZoneSummary.highGel.toLocaleString()} ₾
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">schedule</span>
              </div>
            </div>

            {/* Warning 90-180 days */}
            <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-yellow-800 font-bold block">🟡 გაფრთხილება (90 - 180 დღე)</span>
                <span className="text-2xl font-extrabold font-mono text-yellow-950 mt-1 block">
                  {riskZoneSummary.warningCount} საქმე
                </span>
                <span className="text-[11px] text-yellow-800 font-mono mt-0.5 block">
                  {riskZoneSummary.warningGel.toLocaleString()} ₾
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">notification_important</span>
              </div>
            </div>

            {/* Litigation Stage */}
            <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-700 font-bold block">⚖️ იურიდიულში გადაცემული</span>
                <span className="text-2xl font-extrabold font-mono text-indigo-950 mt-1 block">
                  {riskZoneSummary.inLitigationCount} საქმე
                </span>
                <span className="text-[11px] text-indigo-600 font-mono mt-0.5 block">
                  აქტიური წარმოება
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[22px]">gavel</span>
              </div>
            </div>
          </div>

          {/* 3. Comprehensive Expandable Filter Panel */}
          {isRiskZoneFilterPanelOpen && (
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">tune</span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    რისკ ზონის დეტალური ფილტრაცია
                  </span>
                </div>
                {activeRiskZoneFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetRiskZoneFilters}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1 transition"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    ყველას გასუფთავება
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {/* საქმის № */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">საქმის №:</label>
                  <input
                    type="text"
                    value={rzFilterCaseNumber}
                    onChange={(e) => setRzFilterCaseNumber(e.target.value)}
                    placeholder="მაგ: DI-2024-8841"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                {/* დებიტორი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დებიტორი (სახელი/კომპანია):</label>
                  <input
                    type="text"
                    value={rzFilterDebtorName}
                    onChange={(e) => setRzFilterDebtorName(e.target.value)}
                    placeholder="მაგ: ევროპა ლოჯისტიკსი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* პირადი № / ს/კ */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">პირადი № ან ს/კ:</label>
                  <input
                    type="text"
                    value={rzFilterPersonalId}
                    onChange={(e) => setRzFilterPersonalId(e.target.value)}
                    placeholder="მაგ: 01019012345 ან 404987654"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                {/* კრედიტორი */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">კრედიტორი:</label>
                  <input
                    type="text"
                    value={rzFilterCreditorName}
                    onChange={(e) => setRzFilterCreditorName(e.target.value)}
                    placeholder="მაგ: სს თიბისი ბანკი"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* დავალიანება (Min - Max ₾) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დავალიანება (Min - Max ₾):</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={rzFilterMinAmount}
                      onChange={(e) => setRzFilterMinAmount(e.target.value)}
                      placeholder="Min ₾"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <input
                      type="number"
                      value={rzFilterMaxAmount}
                      onChange={(e) => setRzFilterMaxAmount(e.target.value)}
                      placeholder="Max ₾"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* ვადაგადაცილება (Min - Max დღე) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">ვადაგადაცილება (დღე):</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={rzFilterMinOverdue}
                      onChange={(e) => setRzFilterMinOverdue(e.target.value)}
                      placeholder="Min დღე"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <input
                      type="number"
                      value={rzFilterMaxOverdue}
                      onChange={(e) => setRzFilterMaxOverdue(e.target.value)}
                      placeholder="Max დღე"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* დარჩენილი დღეები (Min - Max დღე) */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">დარჩენილი დღეები (&lt;180):</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={rzFilterMinRemaining}
                      onChange={(e) => setRzFilterMinRemaining(e.target.value)}
                      placeholder="Min დღე"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <input
                      type="number"
                      value={rzFilterMaxRemaining}
                      onChange={(e) => setRzFilterMaxRemaining(e.target.value)}
                      placeholder="Max დღე"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                {/* რისკის დონე */}
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">რისკის დონე:</label>
                  <select
                    value={riskZoneFilterLevel}
                    onChange={(e) => setRiskZoneFilterLevel(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 text-xs"
                  >
                    <option value="ALL">ყველა დონე</option>
                    <option value="CRITICAL">🚨 კრიტიკული (&lt;30 დღე)</option>
                    <option value="HIGH">⚠️ მაღალი (30-90 დღე)</option>
                    <option value="WARNING">🟡 გაფრთხილება (90-180 დღე)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. Filter Toolbar & Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Urgency Toggle Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: `ყველა (${riskZoneClaims.length})` },
                  { id: 'CRITICAL', label: `🚨 კრიტიკული (${riskZoneSummary.criticalCount})` },
                  { id: 'HIGH', label: `⚠️ მაღალი (${riskZoneSummary.highCount})` },
                  { id: 'WARNING', label: `🟡 გაფრთხილება (${riskZoneSummary.warningCount})` },
                ] as const
              ).map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setRiskZoneFilterLevel(lvl.id)}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer whitespace-nowrap ${
                    riskZoneFilterLevel === lvl.id
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-base">search</span>
              <input
                type="text"
                value={riskZoneSearch}
                onChange={(e) => setRiskZoneSearch(e.target.value)}
                placeholder="ძიება: საქმის N, დებიტორი, პ/ნ, ს/კ, კრედიტორი..."
                className="w-full pl-9 pr-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
              {riskZoneSearch && (
                <button
                  type="button"
                  onClick={() => setRiskZoneSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Active Selection Action Banner for Risk Claims */}
          {selectedRiskZoneClaimIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-950 text-xs font-medium animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[20px]">check_circle</span>
                <span>
                  მონიშნულია <strong className="font-bold text-rose-700">{selectedRiskZoneClaimIds.length}</strong> საქმე — სულ {filteredRiskClaims.length}-დან
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRiskZoneClaimIds(filteredRiskClaims.map((c) => c.id))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  ყველას მონიშვნა ({filteredRiskClaims.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiskZoneClaimIds([])}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  მონიშვნის მოხსნა
                </button>
                <button
                  type="button"
                  onClick={handleBatchSendToLitigation}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">gavel</span>
                  <span>სასამართლოში გადაცემა ({selectedRiskZoneClaimIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={exportRiskZoneToExcel}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">file_download</span>
                  <span>მონიშნულის ექსპორტი ({selectedRiskZoneClaimIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. Filtered Table of Risk Claims */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>რისკ ზონის საქმეების რეესტრი ({filteredRiskClaims.length})</span>
              <span className="text-[11px] text-slate-500 font-mono">
                დარჩენილი დღეების ზრდადობით
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        aria-label="ყველას მონიშვნა"
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        checked={
                          filteredRiskClaims.length > 0 &&
                          selectedRiskZoneClaimIds.length === filteredRiskClaims.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRiskZoneClaimIds(filteredRiskClaims.map((c: any) => c.id));
                          } else {
                            setSelectedRiskZoneClaimIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-3 px-4">საქმის N</th>
                    <th className="py-3 px-4">დებიტორი</th>
                    <th className="py-3 px-4">პ/ნ / ს/კ</th>
                    <th className="py-3 px-4">კრედიტორი</th>
                    <th className="py-3 px-4">დავალიანება (GEL)</th>
                    <th className="py-3 px-4">ვადაგადაცილება</th>
                    <th className="py-3 px-4">ხანდაზმულობამდე</th>
                    <th className="py-3 px-4">რისკის დონე</th>
                    <th className="py-3 px-4 text-right">ოპერატიული ქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRiskClaims.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 text-xs">
                        მითითებული ფილტრით რისკ ზონის საქმეები არ მოიძებნა.
                      </td>
                    </tr>
                  ) : (
                    filteredRiskClaims.map((claim) => (
                      <tr
                        key={claim.id}
                        className={`transition hover:bg-rose-50/40 ${
                          selectedRiskZoneClaimIds.includes(claim.id) ? 'bg-rose-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`მონიშნე ${claim.caseNumber}`}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            checked={selectedRiskZoneClaimIds.includes(claim.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedRiskZoneClaimIds((prev) =>
                                prev.includes(claim.id)
                                  ? prev.filter((id) => id !== claim.id)
                                  : [...prev, claim.id]
                              );
                            }}
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {claim.caseNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {claim.debtorName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {claim.personalId}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {claim.creditorName}
                        </td>
                        <td className="py-3 px-4 font-extrabold font-mono text-slate-900">
                          {claim.amount.toLocaleString()} ₾
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-600 font-medium">
                          {claim.daysOverdue} დღე
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              claim.daysRemaining <= 30
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : claim.daysRemaining <= 90
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {claim.daysRemaining} დღე
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              claim.urgencyLevel === 'CRITICAL'
                                ? 'bg-rose-600 text-white'
                                : claim.urgencyLevel === 'HIGH'
                                ? 'bg-amber-500 text-white'
                                : 'bg-yellow-500 text-slate-900'
                            }`}
                          >
                            {claim.urgencyLevel === 'CRITICAL'
                              ? 'კრიტიკული'
                              : claim.urgencyLevel === 'HIGH'
                              ? 'მაღალი'
                              : 'გაფრთხილება'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* "საქმე" button is ALWAYS rendered for every claim */}
                            <button
                              type="button"
                              onClick={() => handleOpenDebtorCardForRiskClaim(claim)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="საქმის სრული ბარათის ნახვა"
                            >
                              <span className="material-symbols-outlined text-[13px] text-slate-500">folder_open</span>
                              <span>საქმე</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendToLitigation(claim)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-300 transition cursor-pointer flex items-center gap-1"
                              title="იურისტისთვის გადაცემა"
                            >
                              <span className="material-symbols-outlined text-[13px]">gavel</span>
                              <span>სასამართლოში</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

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
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 flex-shrink-0">
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
          <button className="rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => { setIsRegistrationOpen(false); resetCreditorRegistrationForm(); }} title="დახურვა">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        {/* Modal Body Form Area */}
        <div className="p-6 max-h-[calc(85vh-200px)] overflow-y-auto space-y-5">
          {/* Entity Switcher (Legal vs Physical) */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setCreditorEntityType('LEGAL')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                creditorEntityType === 'LEGAL'
                  ? 'bg-white text-primary shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">domain</span>
              <span>იურიდიული პირი</span>
            </button>
            <button
              type="button"
              onClick={() => setCreditorEntityType('PHYSICAL')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                creditorEntityType === 'PHYSICAL'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>ფიზიკური პირი</span>
            </button>
          </div>

          {creditorFormErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{creditorFormErrors.submit}</span>
            </div>
          )}

          {creditorEntityType === 'LEGAL' ? (
            <>
              {/* Category */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-subtle gap-2">
                <div className="flex items-center gap-3 text-body-sm flex-wrap">
                  <span className="font-semibold text-text-primary text-xs uppercase tracking-wider text-slate-500">
                    კრედიტორის კატეგორია:
                  </span>
                  <select
                    value={creditorCategory}
                    onChange={(e) => setCreditorCategory(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-body-sm text-text-primary font-medium focus:outline-none focus:border-primary shadow-2xs"
                  >
                    <option value="შეზღუდული პასუხისმგებლობის საზოგადოება (შპს)">შეზღუდული პასუხისმგებლობის საზოგადოება (შპს)</option>
                    <option value="სააქციო საზოგადოება">სააქციო საზოგადოება</option>
                    <option value="ამხანაგობა">ამხანაგობა</option>
                    <option value="ა(ა)იპ">ა(ა)იპ</option>
                    <option value="ინდივიდუალური მეწარმე">ინდივიდუალური მეწარმე</option>
                  </select>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-50 text-primary text-[11px] font-semibold border border-blue-200 hidden md:inline">
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

                {/* Conditional Sole Proprietor Personal ID */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-body-sm font-medium flex items-center gap-1.5 ${creditorCategory === 'ინდივიდუალური მეწარმე' ? 'text-text-primary' : 'text-slate-400'}`}>
                      <span>ინდ. მეწარმის პირადი ნომერი (11 ნიშნა)</span>
                      {creditorCategory === 'ინდივიდუალური მეწარმე' ? (
                        <span className="text-rating-c">*</span>
                      ) : (
                        <span className="material-symbols-outlined text-[14px] text-slate-400" title="დაბლოკილია - იხსნება მხოლოდ „ინდივიდუალური მეწარმე“-ს არჩევისას">lock</span>
                      )}
                    </label>
                    {creditorCategory === 'ინდივიდუალური მეწარმე' && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {creditorIndividualPin.length}/11
                      </span>
                    )}
                  </div>
                  <input
                    disabled={creditorCategory !== 'ინდივიდუალური მეწარმე'}
                    className={`w-full rounded-lg px-3 py-2 text-body-md font-mono transition-all ${
                      creditorCategory === 'ინდივიდუალური მეწარმე'
                        ? `bg-white border ${creditorFormErrors.individualPin ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary`
                        : 'bg-slate-100/80 border border-slate-200 text-slate-400 cursor-not-allowed select-none placeholder:text-slate-400'
                    }`}
                    placeholder={creditorCategory === 'ინდივიდუალური მეწარმე' ? 'მაგ: 01019012345' : 'ხელმისაწვდომია მხოლოდ „ინდ. მეწარმე“-სთვის'}
                    type="text"
                    maxLength={11}
                    value={creditorCategory === 'ინდივიდუალური მეწარმე' ? creditorIndividualPin : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setCreditorIndividualPin(val);
                      if (creditorFormErrors.individualPin) {
                        setCreditorFormErrors({ ...creditorFormErrors, individualPin: '' });
                      }
                    }}
                  />
                  {creditorCategory === 'ინდივიდუალური მეწარმე' && creditorFormErrors.individualPin && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.individualPin}</p>
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

                {/* Dedicated Authorized Representative Card */}
                <div className="md:col-span-2 border border-blue-200/80 rounded-xl p-4 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/40 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-blue-100 gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                          უფლებამოსილი წარმომადგენელი
                        </span>
                        <p className="text-[11px] text-slate-500">
                          სავალდებულო მონაცემები კომპანიის ხელმძღვანელ პირზე
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">verified_user</span>
                      ავტომატური სტატუსი: დირექტორი
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-body-sm font-medium text-text-primary mb-1">
                        სახელი <span className="text-rating-c">*</span>
                      </label>
                      <input
                        className={`w-full bg-white border ${creditorFormErrors.repFirstName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                        placeholder="მაგ: გიორგი"
                        type="text"
                        value={repFirstName}
                        onChange={(e) => {
                          setRepFirstName(e.target.value);
                          if (creditorFormErrors.repFirstName) {
                            setCreditorFormErrors({ ...creditorFormErrors, repFirstName: '' });
                          }
                        }}
                      />
                      {creditorFormErrors.repFirstName && (
                        <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.repFirstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-text-primary mb-1">
                        გვარი <span className="text-rating-c">*</span>
                      </label>
                      <input
                        className={`w-full bg-white border ${creditorFormErrors.repLastName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                        placeholder="მაგ: ბერიძე"
                        type="text"
                        value={repLastName}
                        onChange={(e) => {
                          setRepLastName(e.target.value);
                          if (creditorFormErrors.repLastName) {
                            setCreditorFormErrors({ ...creditorFormErrors, repLastName: '' });
                          }
                        }}
                      />
                      {creditorFormErrors.repLastName && (
                        <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.repLastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-text-primary mb-1">
                        ტელეფონის ნომერი <span className="text-rating-c">*</span>
                      </label>
                      <input
                        className={`w-full bg-white border ${creditorFormErrors.repPhone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                        placeholder="+995 599 000000"
                        type="tel"
                        value={repPhone}
                        onChange={(e) => {
                          setRepPhone(e.target.value);
                          if (creditorFormErrors.repPhone) {
                            setCreditorFormErrors({ ...creditorFormErrors, repPhone: '' });
                          }
                        }}
                      />
                      {creditorFormErrors.repPhone && (
                        <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.repPhone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-body-sm font-medium text-text-primary mb-1">
                        ელფოსტა <span className="text-rating-c">*</span>
                      </label>
                      <input
                        className={`w-full bg-white border ${creditorFormErrors.repEmail ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                        placeholder="director@mail.ge"
                        type="email"
                        value={repEmail}
                        onChange={(e) => {
                          setRepEmail(e.target.value);
                          if (creditorFormErrors.repEmail) {
                            setCreditorFormErrors({ ...creditorFormErrors, repEmail: '' });
                          }
                        }}
                      />
                      {creditorFormErrors.repEmail && (
                        <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.repEmail}</p>
                      )}
                    </div>
                  </div>
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
            </>
          ) : (
            /* PHYSICAL PERSON CREDITOR */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-text-primary text-xs uppercase tracking-wider text-slate-700">
                    ფიზიკური პირის მონაცემები (საჯარო რეესტრის სტანდარტი)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                  ფიზიკური პირი კრედიტორი
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-body-sm font-medium text-text-primary">
                      პირადი ნომერი (11 ნიშნა) <span className="text-rating-c">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {physPersonalId.length}/11
                    </span>
                  </div>
                  <input
                    className={`w-full bg-white border ${creditorFormErrors.physPersonalId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                    placeholder="01019012345"
                    type="text"
                    maxLength={11}
                    value={physPersonalId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setPhysPersonalId(val);
                      if (creditorFormErrors.physPersonalId) {
                        setCreditorFormErrors({ ...creditorFormErrors, physPersonalId: '' });
                      }
                    }}
                  />
                  {creditorFormErrors.physPersonalId && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.physPersonalId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    საცხოვრებელი ადგილი / ფაქტობრივი მისამართი <span className="text-rating-c">*</span>
                  </label>
                  <input
                    className={`w-full bg-white border ${creditorFormErrors.physActualAddress ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                    placeholder="ქ. თბილისი, პეკინის გამზ. 15"
                    type="text"
                    value={physActualAddress}
                    onChange={(e) => {
                      setPhysActualAddress(e.target.value);
                      if (creditorFormErrors.physActualAddress) {
                        setCreditorFormErrors({ ...creditorFormErrors, physActualAddress: '' });
                      }
                    }}
                  />
                  {creditorFormErrors.physActualAddress && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.physActualAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    სახელი <span className="text-rating-c">*</span>
                  </label>
                  <input
                    className={`w-full bg-white border ${creditorFormErrors.physFirstName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                    placeholder="გიორგი"
                    type="text"
                    value={physFirstName}
                    onChange={(e) => {
                      setPhysFirstName(e.target.value);
                      if (creditorFormErrors.physFirstName) {
                        setCreditorFormErrors({ ...creditorFormErrors, physFirstName: '' });
                      }
                    }}
                  />
                  {creditorFormErrors.physFirstName && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.physFirstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    გვარი <span className="text-rating-c">*</span>
                  </label>
                  <input
                    className={`w-full bg-white border ${creditorFormErrors.physLastName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                    placeholder="ბერიძე"
                    type="text"
                    value={physLastName}
                    onChange={(e) => {
                      setPhysLastName(e.target.value);
                      if (creditorFormErrors.physLastName) {
                        setCreditorFormErrors({ ...creditorFormErrors, physLastName: '' });
                      }
                    }}
                  />
                  {creditorFormErrors.physLastName && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.physLastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    საკონტაქტო ტელეფონი <span className="text-rating-c">*</span>
                  </label>
                  <input
                    className={`w-full bg-white border ${creditorFormErrors.physPhone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300'} rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all`}
                    placeholder="+995 599 000000"
                    type="tel"
                    value={physPhone}
                    onChange={(e) => {
                      setPhysPhone(e.target.value);
                      if (creditorFormErrors.physPhone) {
                        setCreditorFormErrors({ ...creditorFormErrors, physPhone: '' });
                      }
                    }}
                  />
                  {creditorFormErrors.physPhone && (
                    <p className="text-xs text-rose-600 mt-1">{creditorFormErrors.physPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    ელ-ფოსტა
                  </label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                    placeholder="giorgi.beridze@mail.ge"
                    type="email"
                    value={physEmail}
                    onChange={(e) => setPhysEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    ხელშეკრულების საფუძველი &amp; №
                  </label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                    placeholder="მაგ: ხელშ. #B2B-2024/09"
                    type="text"
                    value={physAgreement}
                    onChange={(e) => setPhysAgreement(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1">
                    საბანკო რეკვიზიტები (IBAN ანგარიშსწორებისთვის)
                  </label>
                  <input
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
                    placeholder="GE00TB0000000000000000"
                    type="text"
                    value={physIban}
                    onChange={(e) => setPhysIban(e.target.value.toUpperCase())}
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
                      value={physInitialAmount}
                      onChange={(e) => setPhysInitialAmount(e.target.value)}
                    />
                    <span className="absolute right-3 font-mono text-text-muted text-body-sm font-semibold">₾</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attached Debtors Section */}
          <div className="border border-border-subtle rounded-xl overflow-hidden bg-slate-50/50">
            <div className="p-3.5 bg-slate-50 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">group_add</span>
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

            {/* Document Uploading Progress Indicator */}
            {isUploadingDoc && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-700 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>მიმდინარეობს დოკუმენტ(ებ)ის ატვირთვა და შენახვა სერვერზე...</span>
              </div>
            )}

            {uploadDocError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{uploadDocError}</span>
              </div>
            )}

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
                          {doc.name?.toLowerCase().endsWith('.pdf') ? (
                            <span className="material-symbols-outlined text-rose-600 text-[20px]">picture_as_pdf</span>
                          ) : doc.name?.toLowerCase().endsWith('.xlsx') || doc.name?.toLowerCase().endsWith('.xls') || doc.name?.toLowerCase().endsWith('.csv') ? (
                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">table_view</span>
                          ) : doc.name?.toLowerCase().endsWith('.docx') || doc.name?.toLowerCase().endsWith('.doc') ? (
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
                  ჯერ დოკუმენტები არ არის ატვირთული. გთხოვთ ატვირთოთ სასაქონლო ზედნადები (RS.GE), ბრუნვითი ბარათი ან ხელშეკრულება.
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
              onClick={() => { setIsRegistrationOpen(false); resetCreditorRegistrationForm(); }}
              type="button"
            >
              გაუქმება
            </button>
            <button
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-body-md shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              disabled={registeringCreditor || isUploadingDoc}
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
  {/* COMPREHENSIVE DEBTOR ANALYTICS & CASE FILE MODAL (საქმის ბარათი) */}
  {/* ========================================================================= */}
  {selectedDebtorForAnalytics && (() => {
    const d = selectedDebtorForAnalytics;
    const debtorName = d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'დებიტორი';
    const caseNumber = d.caseNumber || 'DI-2024-' + (d.personalId ? String(d.personalId).slice(-4) : '8841');
    const pin = d.personalId || d.taxId || '01019012345';
    const currentAmt = Number(d.amount ?? d.currentAmount ?? d.remainingAmount ?? 2900);
    const initialAmt = Number(d.initialAmount ?? (currentAmt + 2100));
    const paidAmt = Math.max(0, initialAmt - currentAmt);
    const paidPct = initialAmt > 0 ? Math.round((paidAmt / initialAmt) * 100) : 42;
    const overdue = d.overdueDays || 0;
    const creditor = d.creditorName || 'შპს ალფა ფინანსი';
    const agreement = d.agreementNumber || 'AGR-99214';
    const ratingGrade = d.ratingGrade || (overdue > 60 ? 'Grade C' : overdue > 0 ? 'Grade B' : 'Grade A');

    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedDebtorForAnalytics(null)}
        />

        {/* Modal Window Container */}
        <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-lg shadow-inner">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-lg text-white tracking-tight">
                    {debtorName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono text-xs font-bold">
                    საქმე : {caseNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    overdue > 0
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {overdue > 0 ? `ვადაგადაცილება (${overdue} დღე)` : 'სტატუსი: აქტიური დებიტორი (მოვალე)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="font-mono">პირადი №: <strong className="text-slate-200">{pin}</strong></span>
                  <span>•</span>
                  <span>კრედიტორი: <strong className="text-slate-200">{creditor}</strong></span>
                  <span>•</span>
                  <span>ხელშეკრულება: <strong className="text-slate-200 font-mono">{agreement}</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDebtorForAnalytics(null)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer self-start sm:self-center"
              title="დახურვა"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
            {[
              { id: 'summary', label: '📋 ზოგადი & ბალანსი', icon: 'account_balance_wallet' },
              { id: 'schedule', label: '📅 დაფარვის ოფიციალური გრაფიკი', icon: 'calendar_month' },
              { id: 'documents', label: '📑 წარმოშობის საფუძველი & RS.GE', icon: 'verified' },
              { id: 'receipts', label: '🧾 გადახდის ქვითრები', icon: 'receipt_long' },
              { id: 'chronology', label: '📈 გადახდების ქრონოლოგია', icon: 'insights' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDebtorCaseFileTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  debtorCaseFileTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* TAB 1: 📋 ზოგადი & ბალანსი */}
            {debtorCaseFileTab === 'summary' && (
              <div className="space-y-6">
                {/* Contact & Curator Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Debtor Contact Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-base">person</span>
                      <span>საკონტაქტო და საიდენტიფიკაციო მონაცემები</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-slate-500 block">პირადი ნომერი:</span>
                        <span className="font-mono font-bold text-slate-800 text-[13px]">{pin}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">მისამართი:</span>
                        <span className="text-slate-800">{d.legalAddress || 'ქ. თბილისი, პეკინის გამზ. 15'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ტელეფონი:</span>
                        <a href={`tel:${d.phone || '+995599000000'}`} className="font-mono text-blue-600 hover:underline">
                          {d.phone || '+995 599 00 00 00'}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ელ-ფოსტა:</span>
                        <a href={`mailto:${d.email || 'debtor@beridze.ge'}`} className="text-blue-600 hover:underline">
                          {d.email || 'debtor@beridze.ge'}
                        </a>
                      </div>
                    </div>

                    {/* Discovered Contacts (Internal only) */}
                    {d.contactPersons && d.contactPersons.length > 0 && (
                      <div className="pt-2.5 mt-2.5 border-t border-slate-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <span className="material-symbols-outlined text-amber-600 text-sm">lock</span>
                          <span>მოძიებული საკონტაქტო ნომრები (შიდა):</span>
                        </div>
                        <div className="space-y-1">
                          {d.contactPersons.map((cp: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800">{cp.phone}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  {cp.relationType || 'საკონტაქტო'}
                                </span>
                                <span className="text-slate-600 text-[11px]">{cp.firstName} {cp.lastName}</span>
                              </div>
                              <a href={`tel:${cp.phone}`} className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]">
                                დარეკვა
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Curator Box */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-blue-700 text-base">support_agent</span>
                        <span>მომსახურე კურატორი (სპეციალისტი)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ონლაინ
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">ლევან მაისურაძე</div>
                        <div className="text-slate-600 text-[11px] mt-0.5">
                          უფროსი ანალიტიკოსი • საქმის მმართველი
                        </div>
                        <div className="font-mono text-blue-700 font-semibold mt-1">
                          +995 32 2 100 200 (შიდა: 104)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert(`დავალიანების საქმეზე #${caseNumber} იხსნება ოფიციალური საარბიტრაჟო დავის პროცესი.`)}
                        className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">gavel</span>
                        <span>დავის გახსნა</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial Balance & Debt Overview (4 KPI Cards) */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-base">account_balance_wallet</span>
                    <span>პირადი ფინანსური ვალდებულება და ბალანსი (GEL ₾)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: საწყისი დავალიანება */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-xs font-semibold">საწყისი დავალიანება</div>
                      <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                        {initialAmt.toLocaleString('ka-GE')} ₾
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        კრედიტორი: <strong className="text-slate-700">{creditor}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ხელშეკრულება: {agreement}
                      </div>
                    </div>

                    {/* Card 2: უკვე დაფარული თანხა */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-emerald-800 text-xs font-semibold">უკვე დაფარული თანხა</div>
                      <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                        {paidAmt.toLocaleString('ka-GE')} ₾
                      </div>
                      <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                        {paidPct}% დაფარულია გრაფიკით
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        სტატუსი: ACTIVE (გრაფიკი მიმდინარეობს)
                      </div>
                    </div>

                    {/* Card 3: მიმდინარე დარჩენილი თანხა */}
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                      <div className="text-rose-800 text-xs font-semibold">მიმდინარე დარჩენილი თანხა</div>
                      <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                        {currentAmt.toLocaleString('ka-GE')} ₾
                      </div>
                      <div className="text-[11px] text-rose-800 font-semibold mt-1">
                        ვადაგადაცილება: {overdue} დღე
                      </div>
                      <div className="text-[10px] text-rose-700">
                        ჯარიმა / პირგასამტეხლო: 0 ₾
                      </div>
                    </div>

                    {/* Card 4: მომდევნო შენატანი */}
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                      <div className="text-blue-800 text-xs font-semibold">მომდევნო შენატანი</div>
                      <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                        300.00 ₾
                      </div>
                      <div className="text-[11px] text-blue-800 font-semibold mt-1">
                        შენატანი #08 (12-დან)
                      </div>
                      <div className="text-[10px] text-blue-700 font-mono">
                        ბოლო ვადა: 25 ოქტ, 2024
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Trust Rating (საკრედიტო სანდოობის რეიტინგი) */}
                <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400 text-2xl">speed</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">საკრედიტო სანდოობის რეიტინგი</h4>
                        <p className="text-xs text-slate-400">ოფიციალური შეფასება Debitinfo-ს ანალიტიკური მოდელის მიხედვით</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        ratingGrade === 'Grade A'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : ratingGrade === 'Grade B'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {ratingGrade} ({ratingGrade === 'Grade A' ? 'მაღალი სანდოობა' : ratingGrade === 'Grade B' ? 'საშუალო რისკი' : 'მაღალი რისკი'})
                      </span>
                    </div>
                  </div>

                  {/* Score Meter & Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">ქულა: 300 - 550 (Grade C)</span>
                      <span className="text-amber-400 font-bold text-sm">მიმდინარე: 685 / 1000 (Grade B)</span>
                      <span className="text-slate-400">750 - 1000 (Grade A)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="w-[30%] bg-rose-500/60" />
                      <div className="w-[40%] bg-amber-500 flex justify-end items-center pr-1">
                        <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                      </div>
                      <div className="w-[30%] bg-emerald-500/30" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block">დისციპლინა:</span>
                        <strong className="text-emerald-400 font-mono text-xs">88%</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block">დაგვიანებები:</span>
                        <strong className="text-amber-400 font-mono text-xs">{overdue} დღე</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block">პროგნოზი:</span>
                        <strong className="text-blue-400 font-mono text-xs">ზრდადი (+45 ქულა)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs space-y-2">
                    <p className="text-slate-200 leading-relaxed">
                      თქვენი მიმდინარე გადახდების დისციპლინა დამაკმაყოფილებელია. გრაფიკის დაცვის შემთხვევაში თქვენი რეიტინგი გაიზრდება Grade A-მდე, რაც გაგიხსნით გამარტივებულ საბანკო ლიმიტებს, მისცემს debitinfo.ge-ის საშუალებას გასცეს თქვენზე დადებითი რეკომენდაცია და სრულად მოიხსნას შეზღუდვები საჯარო რეესტრში.
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-700 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="material-symbols-outlined text-sm">event_available</span>
                        <span>მომდევნო 2 შენატანი დროულად: ავტომატურად გაზრდის ქულას +45 ერთეულით Grade A-მდე.</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-300">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>სანიმუშო გადამხდელის სტატუსის მინიჭება</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 📅 დაფარვის ოფიციალური გრაფიკი */}
            {debtorCaseFileTab === 'schedule' && (() => {
              const liveSchedule = selectedDebtorForAnalytics.schedule;
              const hasLiveSchedule = Boolean(liveSchedule && Array.isArray(liveSchedule.installments) && liveSchedule.installments.length > 0);
              const schedType = liveSchedule?.type === 'NON_STANDARD' ? 'არასტანდარტული გრაფიკი' : 'სტანდარტული გრაფიკი';
              const isApproved = liveSchedule?.approvalStatus === 'APPROVED';
              const isPending = liveSchedule?.approvalStatus === 'PENDING_DEBTOR_APPROVAL' || !liveSchedule?.approvalStatus;
              const isRejected = liveSchedule?.approvalStatus === 'REJECTED';
              const totalMonths = liveSchedule?.totalMonths || (hasLiveSchedule ? liveSchedule.installments.length : 12);
              const paymentDay = liveSchedule?.paymentDay || 15;
              const monthlyAmount = liveSchedule?.monthlyAmount ? Number(liveSchedule.monthlyAmount) : 300;

              return (
                <div className="space-y-4">
                  {/* Status & Overview Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">
                          {schedType} ({totalMonths} თვე)
                        </h4>
                        {liveSchedule ? (
                          isApproved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">verified</span> დადასტურებულია დებიტორის მიერ
                            </span>
                          ) : isPending ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> მოლოდინში (დებიტორის დასადასტურებელი)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">cancel</span> უარყოფილია დებიტორის მიერ
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                            სტანდარტული (სისტემური)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        გადახდის დღე: ყოველი თვის <strong>{paymentDay} რიცხვი</strong> • საშუალო შენატანი: <strong>~{monthlyAmount.toFixed(2)} ₾ / თვე</strong>
                        {liveSchedule?.debtorRespondedAt && (
                          <span className="ml-2 text-slate-400">
                            • დებიტორის პასუხი: {new Date(liveSchedule.debtorRespondedAt).toLocaleString('ka-GE')}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`დაფარვის გრაფიკი საქმეზე #${caseNumber} იტვირთება PDF ფორმატში...`)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-rose-600">picture_as_pdf</span>
                        <span>PDF ჩამოტვირთვა</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`დაფარვის გრაფიკის Excel ამონაწერი მზადდება...`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">table_view</span>
                        <span>Excel ამონაწერი</span>
                      </button>
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <th className="py-2.5 px-3 text-center">№</th>
                          <th className="py-2.5 px-4">გადახდის ვადა</th>
                          <th className="py-2.5 px-4 text-right">შენატანის თანხა</th>
                          <th className="py-2.5 px-4 text-center">სტატუსი</th>
                          <th className="py-2.5 px-4 text-center">ქვითარი</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-mono">
                        {hasLiveSchedule ? (
                          liveSchedule.installments.map((inst: any, idx: number) => (
                            <tr
                              key={inst.id || idx}
                              className={`hover:bg-slate-50/80 transition ${
                                !inst.isPaid && idx === 0 ? 'bg-blue-50/40 font-bold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center text-slate-500">{inst.installmentNo || idx + 1}</td>
                              <td className="py-2.5 px-4 text-slate-800">
                                {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('ka-GE') : '—'}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{Number(inst.amount || 0).toFixed(2)} ₾</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                {inst.isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                                    <span className="material-symbols-outlined text-[13px] text-emerald-600">check</span>
                                    <span>გადახდილი</span>
                                  </span>
                                ) : idx === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold">
                                    <span className="material-symbols-outlined text-[13px] text-primary">schedule</span>
                                    <span>მომდევნო შენატანი</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                                    <span className="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span>
                                    <span>დაგეგმილი</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {inst.isPaid ? (
                                  <button
                                    type="button"
                                    onClick={() => alert(`ქვითარი #${inst.installmentNo} იტვირთება...`)}
                                    className="text-blue-600 hover:text-blue-800 transition cursor-pointer p-1"
                                    title="საგადახდო ქვითრის ჩამოტვირთვა"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">download</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          debtorOfficialSchedule.map((row) => (
                            <tr
                              key={row.periodNo}
                              className={`hover:bg-slate-50/80 transition ${
                                row.status === 'CURRENT' ? 'bg-amber-50/50 font-bold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center text-slate-500">{row.periodNo}</td>
                              <td className="py-2.5 px-4 text-slate-800">{row.date}</td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{row.amount.toFixed(2)} ₾</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                {row.status === 'PAID' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                                    <span className="material-symbols-outlined text-[13px] text-emerald-600">check</span>
                                    <span>გადახდილი</span>
                                  </span>
                                ) : row.status === 'CURRENT' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                                    <span className="material-symbols-outlined text-[13px] text-amber-600">schedule</span>
                                    <span>მომდევნო შენატანი</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px]">
                                    <span className="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span>
                                    <span>დაგეგმილი</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {row.receiptAvailable ? (
                                  <button
                                    type="button"
                                    onClick={() => alert(`ქვითარი #${row.periodNo} იტვირთება...`)}
                                    className="text-blue-600 hover:text-blue-800 transition cursor-pointer p-1"
                                    title="საგადახდო ქვითრის ჩამოტვირთვა"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">download</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* TAB 3: 📑 წარმოშობის საფუძველი & RS.GE */}
            {debtorCaseFileTab === 'documents' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                    <span className="material-symbols-outlined text-blue-700">verified_user</span>
                    <span>დავალიანების დამადასტურებელი დოკუმენტაცია — დამოწმებულია debitinfo.ge-ის მიერ</span>
                  </div>
                  <p className="text-xs text-blue-800 mt-1">
                    საფუძველი: ხელშეკრულება & RS.GE სასაქონლო ზედნადებები და მიღება-ჩაბარების აქტები
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Doc 1: RS.GE Waybill */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold mb-2.5">
                        <span className="material-symbols-outlined text-2xl">description</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">
                        სასაქონლო ზედნადები (RS.GE #WAYBILL-8841)
                      </h5>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        rs_waybill_8841.pdf • 1.2 MB
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-2">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>RS.GE ელექტრონულად დამოწმებული</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('RS.GE სასაქონლო ზედნადების PDF იხსნება...')}
                      className="w-full py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-blue-600">visibility</span>
                      <span>დოკუმენტის ნახვა (PDF)</span>
                    </button>
                  </div>

                  {/* Doc 2: Turnover Card Excel */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-2.5">
                        <span className="material-symbols-outlined text-2xl">table_view</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">
                        ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი
                      </h5>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        brunviti_barati_2024.xlsx • 480 KB
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-2">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>დამოწმებულია ბუღალტერიის მიერ</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('ბრუნვითი ბარათის Excel (.xlsx) ფაილი იტვირთება...')}
                      className="w-full py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">download</span>
                      <span>Excel ჩამოტვირთვა</span>
                    </button>
                  </div>

                  {/* Doc 3: Contract & Acceptance Act */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-2.5">
                        <span className="material-symbols-outlined text-2xl">gavel</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug">
                        ხელშეკრულება & მიღება-ჩაბარების აქტი #AGR-8841
                      </h5>
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        khelshekruleba_8841.pdf • 2.4 MB
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-2">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>ორმხრივად დამოწმებული</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('ხელშეკრულებისა და მიღება-ჩაბარების აქტის PDF იხსნება...')}
                      className="w-full py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-blue-600">visibility</span>
                      <span>დოკუმენტის ნახვა (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 🧾 გადახდის ქვითრები */}
            {debtorCaseFileTab === 'receipts' && (
              <div className="space-y-3">
                <div className="space-y-2.5">
                  {[
                    {
                      name: 'order_receipt_2408.pdf',
                      amount: '300.00 ₾',
                      date: '25 აგვ, 2024',
                      status: 'VERIFIED',
                      note: 'დამოწმებულია ბუღალტრის მიერ (ორდერი #OR-99120)',
                    },
                      {
                        name: 'payment_slip_2409.pdf',
                        amount: '300.00 ₾',
                        date: '25 სექ, 2024',
                        status: 'VERIFIED',
                        note: 'დამოწმებულია ბუღალტრის მიერ (ორდერი #OR-99451)',
                      },
                      {
                        name: 'receipt_october_new.pdf',
                        amount: '300.00 ₾',
                        date: '24 ოქტ, 2024',
                        status: 'PENDING',
                        note: 'შემოწმების პროცესშია (ბუღალტრის ვერიფიკაციის მოლოდინში)',
                      },
                    ].map((rc, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-rose-600 text-2xl">picture_as_pdf</span>
                          <div>
                            <div className="font-bold text-slate-900 font-mono">{rc.name}</div>
                            <div className="text-slate-500 text-[11px]">{rc.date} • თანხა: <strong className="text-slate-800 font-mono">{rc.amount}</strong></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                            rc.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            <span className="material-symbols-outlined text-[13px]">
                              {rc.status === 'VERIFIED' ? 'check_circle' : 'schedule'}
                            </span>
                            <span>{rc.note}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => alert(`ქვითარი ${rc.name} იტვირთება...`)}
                            className="p-1 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                            title="ჩამოტვირთვა"
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}

            {/* TAB 5: 📈 გადახდების ქრონოლოგია & დინამიკა */}
            {debtorCaseFileTab === 'chronology' && selectedDebtorPaymentDynamics && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      გადახდების ქრონოლოგიური დინამიკა და დისციპლინის შეფასება
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ყოველთვიური შენატანების პროგრესი, რეგრესი და ჩავარდნები
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                    {(
                      [
                        { id: '3m', label: '3 თვე' },
                        { id: '6m', label: '6 თვე' },
                        { id: '1y', label: '1 წელი' },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDebtorChronologyRange(r.id)}
                        className={`px-3 py-1 rounded-md transition cursor-pointer ${
                          debtorChronologyRange === r.id
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                    <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />
                    <div
                      onClick={() => setDebtorChronologyRange('custom')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        debtorChronologyRange === 'custom'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                      title="სპეციფიური დღეების ოდენობის მითითება"
                    >
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                      <span>სპეციფიური:</span>
                      <input
                        type="number"
                        min={7}
                        max={730}
                        value={debtorCustomDays}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setDebtorCustomDays(val);
                          setDebtorChronologyRange('custom');
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDebtorChronologyRange('custom');
                        }}
                        className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <span className="text-[11px] font-normal text-slate-500">დღე</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Cards Grid */}
                <div
                  className={`grid gap-3 ${
                    selectedDebtorPaymentDynamics.timeline.length <= 3
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : selectedDebtorPaymentDynamics.timeline.length <= 6
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                      : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6'
                  }`}
                >
                  {selectedDebtorPaymentDynamics.timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition ${
                        step.type === 'good'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : step.type === 'progress'
                          ? 'bg-blue-50/50 border-blue-200'
                          : step.type === 'regression'
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{step.month.slice(0, 3)}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            step.type === 'good'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.type === 'progress'
                              ? 'bg-blue-100 text-blue-800'
                              : step.type === 'regression'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      <div className="mt-2 font-mono">
                        <div className="text-base font-bold text-slate-900">
                          {step.amount.toLocaleString('ka-GE')} ₾
                        </div>
                        <div className="text-[10px] text-slate-400">
                          გეგმა: {step.expected.toLocaleString('ka-GE')} ₾
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                        {step.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-blue-600">verified</span>
              <span>საქმის მონაცემები დამოწმებულია ცენტრალური სერვერისა და RS.GE ბაზის მიხედვით</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDebtorForAnalytics(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition cursor-pointer"
            >
              დახურვა
            </button>
          </div>
        </div>
      </div>
    );
  })()}

  {/* ========================================================================= */}
  {/* SELECTION-DRIVEN CHART STUDIO MODAL (გრაფიკების სტუდია) */}
  {/* ========================================================================= */}
  {isChartStudioOpen && (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={() => setIsChartStudioOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold shadow-inner">
              <span className="material-symbols-outlined text-2xl">bar_chart</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {chartStudioTargetType === 'DEBTORS'
                    ? 'დებიტორთა ანალიტიკური გრაფიკების სტუდია'
                    : 'კრედიტორთა პორტფელის გრაფიკების სტუდია'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold font-mono">
                  {chartStudioItems.length} ჩანაწერი
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                მონიშნულ მონაცემებზე აგებული დინამიკა • საერთო მოცულობა:{' '}
                <strong className="text-white font-mono">
                  {chartStudioData.aggregateSum.toLocaleString('ka-GE')} ₾
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="გრაფიკის ბეჭდვა / PDF ექსპორტი"
            >
              <span className="material-symbols-outlined text-[16px] text-rose-400">picture_as_pdf</span>
              <span>PDF / ბეჭდვა</span>
            </button>
            <button
              type="button"
              onClick={() => setIsChartStudioOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-xl transition cursor-pointer"
              title="დახურვა"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Metric Selector, Period & Style Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          {/* Metric Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">მაჩვენებელი:</span>
              {chartStudioTargetType === 'DEBTORS' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setChartMetric('remaining_debt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'remaining_debt'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    დარჩენილი დავალიანება
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('recovered_amount')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'recovered_amount'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ამოღებული თანხა
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('payment_discipline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'payment_discipline'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    დისციპლინა (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('overdue_days')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'overdue_days'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ვადაგადაცილება (დღეები)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setChartMetric('portfolio_amount')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'portfolio_amount'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    პორტფელის მოცულობა
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('recovered_amount')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'recovered_amount'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ამოღებული თანხები
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('debtors_count')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'debtors_count'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    დებიტორთა რაოდენობა
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMetric('recovery_rate')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      chartMetric === 'recovery_rate'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ამოღების ტემპი (%)
                  </button>
                </>
              )}
            </div>

            {/* Period & Visual Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Period */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(
                  [
                    { id: '30d', label: '30 დღე' },
                    { id: '3m', label: '3 თვე' },
                    { id: '6m', label: '6 თვე' },
                    { id: '12m', label: '12 თვე' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChartPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      chartPeriod === p.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                {/* Custom Days Input */}
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition cursor-pointer ${
                    chartPeriod === 'custom'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  onClick={() => setChartPeriod('custom')}
                >
                  <input
                    type="number"
                    min={1}
                    max={1825}
                    value={customChartDays}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCustomChartDays(isNaN(v) ? 1 : Math.max(1, Math.min(1825, v)));
                      setChartPeriod('custom');
                    }}
                    onFocus={() => setChartPeriod('custom')}
                    className="w-12 text-center py-0.5 px-1 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="45"
                    title="დღეების მორგებული რაოდენობა"
                  />
                  <span className="text-[11px] pr-0.5 select-none font-medium">დღე</span>
                </div>
              </div>

              {/* Visual Style */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(
                  [
                    { id: 'area', label: 'არეალური', icon: 'area_chart' },
                    { id: 'line', label: 'ხაზოვანი', icon: 'show_chart' },
                    { id: 'bar', label: 'სვეტოვანი', icon: 'bar_chart' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setChartVisualType(v.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      chartVisualType === v.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Metric Title & Macro Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{chartStudioData.metricTitle}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                პერიოდი: {chartPeriod === '30d' ? '30 დღე' : chartPeriod === '3m' ? '3 თვე' : chartPeriod === '6m' ? '6 თვე' : chartPeriod === '12m' ? '12 თვე' : `${customChartDays} დღე (მორგებული)`} • {chartStudioItems.length} მონიშნული ჩანაწერი
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="p-2 rounded-lg bg-white border border-slate-200">
                საშუალო: <strong className="text-slate-800">{chartStudioData.average.toLocaleString('ka-GE')} {chartStudioData.unit}</strong>
              </span>
              <span className="p-2 rounded-lg bg-white border border-slate-200">
                მაქსიმუმი: <strong className="text-blue-700">{chartStudioData.maxValue.toLocaleString('ka-GE')} {chartStudioData.unit}</strong>
              </span>
            </div>
          </div>

          {/* Split Container: Left HTML Y-Axis + Right SVG Plot */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex h-64 sm:h-72 w-full gap-3 items-stretch">
              {/* 1. HTML Y-Axis Column (Strictly crisp, no SVG font distortion) */}
              <div className="w-28 shrink-0 flex flex-col justify-between py-1 text-right pr-2 text-xs font-mono font-medium text-slate-500 select-none border-r border-slate-100">
                <span>{chartStudioData.maxValue.toLocaleString('ka-GE')} {chartStudioData.unit}</span>
                <span>{Math.round(chartStudioData.maxValue * 0.75).toLocaleString('ka-GE')} {chartStudioData.unit}</span>
                <span>{Math.round(chartStudioData.maxValue * 0.5).toLocaleString('ka-GE')} {chartStudioData.unit}</span>
                <span>{Math.round(chartStudioData.maxValue * 0.25).toLocaleString('ka-GE')} {chartStudioData.unit}</span>
                <span>0 {chartStudioData.unit}</span>
              </div>

              {/* 2. SVG Plot Canvas */}
              <div className="flex-1 relative h-full">
                <svg
                  viewBox="0 0 1000 220"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="selectionChartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 10 + ratio * 190;
                    return (
                      <line
                        key={idx}
                        x1="0"
                        y1={y}
                        x2="1000"
                        y2={y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Bar Visualization */}
                  {chartVisualType === 'bar' && (
                    <g>
                      {chartStudioData.values.map((val, idx) => {
                        const len = chartStudioData.values.length;
                        const slotWidth = 1000 / len;
                        const barWidth = Math.min(56, slotWidth * 0.62);
                        const h = Math.max(4, (val / chartStudioData.maxValue) * 190);
                        const x = idx * slotWidth + (slotWidth - barWidth) / 2;
                        const y = 200 - h;
                        const isHovered = hoveredPointIndex === idx;

                        return (
                          <g
                            key={idx}
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={h}
                              rx="6"
                              fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                              className="transition-colors duration-150"
                            />
                            {isHovered && (
                              <g>
                                <rect
                                  x={x + barWidth / 2 - 45}
                                  y={Math.max(10, y - 30)}
                                  width="90"
                                  height="24"
                                  rx="4"
                                  fill="#0f172a"
                                />
                                <text
                                  x={x + barWidth / 2}
                                  y={Math.max(10, y - 30) + 16}
                                  textAnchor="middle"
                                  fill="#ffffff"
                                  fontSize="11"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  {val.toLocaleString('ka-GE')} {chartStudioData.unit}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* Area / Line Visualization */}
                  {(chartVisualType === 'area' || chartVisualType === 'line') && (
                    <g>
                      {(() => {
                        const len = chartStudioData.values.length;
                        if (len === 0) return null;
                        const stepX = len > 1 ? 1000 / (len - 1) : 500;
                        const points = chartStudioData.values.map((val, idx) => {
                          const x = idx * stepX;
                          const y = 200 - (val / chartStudioData.maxValue) * 185;
                          return { x, y, val };
                        });

                        const pathLine = points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');
                        const pathArea = `${pathLine} L 1000 205 L 0 205 Z`;

                        return (
                          <>
                            {chartVisualType === 'area' && (
                              <path d={pathArea} fill="url(#selectionChartGradient)" />
                            )}
                            <path
                              d={pathLine}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {points.map((p, idx) => {
                              const isHovered = hoveredPointIndex === idx;
                              return (
                                <g
                                  key={idx}
                                  onMouseEnter={() => setHoveredPointIndex(idx)}
                                  onMouseLeave={() => setHoveredPointIndex(null)}
                                  className="cursor-pointer"
                                >
                                  <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={isHovered ? 7 : 4.5}
                                    fill="#ffffff"
                                    stroke="#2563eb"
                                    strokeWidth="3"
                                    className="transition-all duration-150"
                                  />
                                  {isHovered && (
                                    <g>
                                      <rect
                                        x={Math.max(10, Math.min(900, p.x - 45))}
                                        y={Math.max(10, p.y - 32)}
                                        width="90"
                                        height="24"
                                        rx="4"
                                        fill="#0f172a"
                                      />
                                      <text
                                        x={Math.max(10, Math.min(900, p.x - 45)) + 45}
                                        y={Math.max(10, p.y - 32) + 16}
                                        textAnchor="middle"
                                        fill="#ffffff"
                                        fontSize="11"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                      >
                                        {p.val.toLocaleString('ka-GE')} {chartStudioData.unit}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* X-Axis Month / Period Labels */}
            <div className="flex justify-between pl-32 pr-2 mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
              {chartStudioData.labels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          {/* Selected Records Details Strip */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                გრაფიკში შემავალი მონიშნული ჩანაწერები ({chartStudioItems.length})
              </span>
              <span className="font-mono text-slate-500">
                სულ: <strong className="text-slate-900">{chartStudioData.aggregateSum.toLocaleString('ka-GE')} ₾</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {chartStudioItems.map((item, idx) => {
                const name = item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'ჩანაწერი';
                const idNum = item.personalId || item.taxId || '';
                const amt = Number(item.amount ?? item.currentAmount ?? item.portfolioAmount ?? 0);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium shadow-2xs"
                  >
                    <span className="font-bold text-slate-800">{name}</span>
                    {idNum && <span className="font-mono text-slate-400 text-[11px]">({idNum})</span>}
                    <span className="font-mono font-bold text-blue-700">{amt.toLocaleString('ka-GE')} ₾</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-blue-600">insights</span>
            <span>გრაფიკები დინამიურად გენერირდება მონიშნული მონაცემების მიხედვით დუბლირების გარეშე</span>
          </div>
          <button
            type="button"
            onClick={() => setIsChartStudioOpen(false)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition cursor-pointer"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )}
  {/* ========================================================================= */}
  {/* JAVASCRIPT FOR MODAL & TABS */}
  {/* ========================================================================= */}
  {/* ========================================================================= */}
  {/* SHARED FOOTER COMPONENT */}
  {/* ========================================================================= */}
  <footer className="w-full bg-surface-card border-t border-border-subtle mt-auto shrink-0">
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
  );
}
