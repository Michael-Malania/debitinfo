'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  analystBackendService,
  authService,
  paymentsService,
  PaymentReceiptItem,
} from '@/services';
import AnalystSidebar from '@/components/analyst/AnalystSidebar';
import {
  Users,
  BarChart3,
  UserCheck,
  AlertTriangle,
  FileDown,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Briefcase,
  Gavel,
  Navigation,
  PhoneCall,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  Send,
  X,
  FileSpreadsheet,
  Layers,
  Activity,
  Award,
  Bell,
  Scale,
  ShieldAlert,
} from 'lucide-react';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type AnalyticsTab = 'customers' | 'charts' | 'staff' | 'risk_zone';
export type CustomerSubTab = 'debtors' | 'creditors';
export type StaffSubTab = 'lawyers' | 'visitors' | 'operators' | 'accountants';
export type ChartMetric =
  | 'new_debtors'
  | 'recovered_amount'
  | 'remaining_debt'
  | 'call_volume'
  | 'visitor_acts';
export type ChartPeriod = '30d' | '3m' | '6m' | '12m';
export type ChartVisualType = 'bar' | 'line' | 'area';

interface DebtorItem {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  personalId?: string;
  taxId?: string;
  entityType?: 'PHYSICAL' | 'LEGAL';
  amount?: number;
  initialAmount?: number;
  currentAmount?: number;
  remainingAmount?: number;
  overdueDays?: number;
  daysOverdue?: number;
  claimStatus?: string;
  claimStatusText?: string;
  rating?: string;
  ratingGrade?: string;
  creditorName?: string;
  agreementNumber?: string;
  createdAt?: string;
  debtOriginationDate?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
}

interface CreditorItem {
  id: string;
  name: string;
  personalId: string;
  entityType: 'PHYSICAL' | 'LEGAL';
  category?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
  actualAddress?: string;
  debtorsCount: number;
  portfolioAmount?: number;
  totalDebt?: number;
  createdAt?: string;
  directorFirstName?: string;
  directorLastName?: string;
}

interface RiskClaim {
  id: string;
  caseNumber: string;
  debtorName: string;
  personalId: string;
  creditorName: string;
  amount: number;
  debtOriginationDate?: string;
  daysOverdue: number;
  daysRemaining: number;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'WARNING';
}

export default function AnalystAnalyticsHub() {
  const router = useRouter();

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('customers');
  const [customerSubTab, setCustomerSubTab] = useState<CustomerSubTab>('debtors');
  const [staffSubTab, setStaffSubTab] = useState<StaffSubTab>('lawyers');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // General Loading & Status
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Core Data Registries
  const [debtorsList, setDebtorsList] = useState<DebtorItem[]>([]);
  const [creditorsList, setCreditorsList] = useState<CreditorItem[]>([]);
  const [riskZoneClaims, setRiskZoneClaims] = useState<RiskClaim[]>([]);
  const [riskSummary, setRiskSummary] = useState<{
    criticalCount: number;
    totalAmountGel: number;
  }>({ criticalCount: 0, totalAmountGel: 0 });

  // Staff Performance Data
  const [legalPerformance, setLegalPerformance] = useState<any>(null);
  const [visitorsPerformance, setVisitorsPerformance] = useState<any>(null);
  const [callCenterPerformance, setCallCenterPerformance] = useState<any>(null);
  const [accountantData, setAccountantData] = useState<{
    receipts: PaymentReceiptItem[];
    metrics: any;
  }>({ receipts: [], metrics: null });
  const [staffOptions, setStaffOptions] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // RISK ZONE URGENT WARNING MODAL & NOTIFICATIONS
  // --------------------------------------------------------------------------
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [hasDismissedRiskModal, setHasDismissedRiskModal] = useState(false);
  const [dispatchModalClaim, setDispatchModalClaim] = useState<RiskClaim | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // In-App Notification Center
  interface AnalyticsNotification {
    id: string;
    type: 'RISK_ZONE' | 'SYSTEM' | 'INFO';
    title: string;
    message: string;
    time: string;
    read: boolean;
    urgent?: boolean;
    actionTab?: AnalyticsTab;
  }

  const [notifications, setNotifications] = useState<AnalyticsNotification[]>([]);
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

  // --------------------------------------------------------------------------
  // CUSTOMER ANALYTICS: FILTERS & DEEP SEARCH
  // --------------------------------------------------------------------------
  const [filterEntityType, setFilterEntityType] = useState<'ALL' | 'PHYSICAL' | 'LEGAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Deep Creditor Analytics Selected Target
  const [selectedCreditorId, setSelectedCreditorId] = useState<string>('ALL');
  const [creditorDateRange, setCreditorDateRange] = useState<'30d' | '90d' | '180d' | '365d' | 'all'>('90d');

  // Deep Debtor Dynamics Selected Target
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorItem | null>(null);
  const [debtorTimeRange, setDebtorTimeRange] = useState<'3m' | '6m' | '1y' | 'all'>('6m');

  // --------------------------------------------------------------------------
  // CHART STUDIO STATE
  // --------------------------------------------------------------------------
  const [chartMetric, setChartMetric] = useState<ChartMetric>('new_debtors');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6m');
  const [chartVisualType, setChartVisualType] = useState<ChartVisualType>('area');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // --------------------------------------------------------------------------
  // 1. INITIAL LOAD & DATA FETCHING
  // --------------------------------------------------------------------------
  const fetchAllData = async () => {
    try {
      setErrorMsg(null);
      const [
        debtorsRes,
        creditorsRes,
        statuteRes,
        legalRes,
        visitorsRes,
        callRes,
        accountantRes,
        staffOptsRes,
      ] = await Promise.all([
        analystBackendService.getDebtorsRegistry().catch(() => []),
        analystBackendService.getCreditorsRegistry().catch(() => []),
        analystBackendService.getStatuteLimitations({ monthsLookback: 6, monthsLookahead: 6 }).catch(() => null),
        analystBackendService.getLegalPerformance().catch(() => null),
        analystBackendService.getVisitorsPerformance().catch(() => null),
        analystBackendService.getCallCenterPerformance().catch(() => null),
        paymentsService.getAccountantPayments().catch(() => ({ receipts: [], metrics: null })),
        analystBackendService.getStaffOptions().catch(() => []),
      ]);

      setDebtorsList(Array.isArray(debtorsRes) ? debtorsRes : []);
      setCreditorsList(Array.isArray(creditorsRes) ? creditorsRes : []);

      // Risk Zone items (< 180 days remaining until 3-year statute of limitations)
      const approaching = statuteRes?.approachingClaims || [];
      setRiskZoneClaims(approaching);
      const totalRiskGEL = approaching.reduce(
        (sum: number, c: any) => sum + (Number(c.amount) || 0),
        0
      );
      setRiskSummary({
        criticalCount: approaching.length,
        totalAmountGel: totalRiskGEL,
      });

      // Auto-trigger Urgent Warning Modal if there are active loans in the Risk Zone
      if (approaching.length > 0 && !hasDismissedRiskModal) {
        setIsRiskModalOpen(true);
      }

      // Chrome/Desktop Notification
      triggerRiskNotification(approaching.length);

      // In-App Notification Center
      const notifs: AnalyticsNotification[] = [];
      approaching.forEach((c: any) => {
        notifs.push({
          id: `risk-${c.id}`,
          type: 'RISK_ZONE',
          title: `⚠️ რისკ ზონა: #${c.caseNumber} (${c.daysRemaining} დღე დარჩენილი)`,
          message: `${c.debtorName} • ${Number(c.amount || 0).toLocaleString()} ₾. 3-წლიანი ხანდაზმულობის ვადა 6 თვეში იწურება!`,
          time: 'სასწრაფო',
          read: false,
          urgent: true,
          actionTab: 'risk_zone',
        });
      });

      if (approaching.length > 0) {
        notifs.push({
          id: 'risk-summary-alert',
          type: 'RISK_ZONE',
          title: `🚨 სულ ${approaching.length} სესხია რისკ ზონაში`,
          message: `საფრთხის ქვეშ მყოფი საერთო მოცულობა შეადგენს ${totalRiskGEL.toLocaleString()} ₾-ს.`,
          time: 'აქტიური',
          read: false,
          urgent: true,
          actionTab: 'risk_zone',
        });
      }

      notifs.push({
        id: 'system-sync',
        type: 'SYSTEM',
        title: 'ანალიტიკური მონაცემები სინქრონიზებულია',
        message: 'დებიტორებისა და კრედიტორების რეესტრები განახლებულია ცენტრალური სერვერიდან.',
        time: 'აქტიური',
        read: true,
        urgent: false,
      });

      setNotifications(notifs);

      setLegalPerformance(legalRes);
      setVisitorsPerformance(visitorsRes);
      setCallCenterPerformance(callRes);
      setAccountantData(accountantRes || { receipts: [], metrics: null });
      setStaffOptions(Array.isArray(staffOptsRes) ? staffOptsRes : []);
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setErrorMsg('მონაცემების ჩატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ განახლება.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchAllData();
  }, [router]);

  // Request browser notification permission and send alert
  const triggerRiskNotification = (riskCount: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (riskCount <= 0) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification('DebitInfo — რისკ ზონის გაფრთხილება!', {
          body: `სისტემაში გამოვლენილია ${riskCount} სესხი, რომელთა 3-წლიანი ხანდაზმულობის ვადა 6 თვეში იწურება!`,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Desktop notification prevented:', e);
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          try {
            new Notification('DebitInfo — რისკ ზონის გაფრთხილება!', {
              body: `სისტემაში გამოვლენილია ${riskCount} სესხი, რომელთა 3-წლიანი ხანდაზმულობის ვადა 6 თვეში იწურება!`,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.warn('Desktop notification prevented:', e);
          }
        }
      });
    }
  };

  // --------------------------------------------------------------------------
  // 2. DISPATCH TASK TO LEGAL FOR RISK ZONE
  // --------------------------------------------------------------------------
  const handleOpenDispatch = (claim: RiskClaim) => {
    setDispatchModalClaim(claim);
    setSelectedLawyerId(
      staffOptions.find((s) => s.role === 'LEGAL')?.id || staffOptions[0]?.id || ''
    );
    setDispatchInstructions(
      `სასწრაფო! საქმე #${claim.caseNumber} (დებიტორი: ${claim.debtorName}) იმყოფება რისკ ზონაში. ხანდაზმულობის ვადის ამოწურვამდე დარჩენილია ${claim.daysRemaining} დღე. გთხოვთ დაუყოვნებლივ მოამზადოთ სარჩელი ან უზრუნველყოფის ღონისძიება.`
    );
    setDispatchSuccess(false);
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalClaim || !selectedLawyerId) return;
    setIsDispatching(true);
    try {
      await analystBackendService.dispatchTask({
        staffUserId: selectedLawyerId,
        claimId: dispatchModalClaim.id,
        priority: 'URGENT',
        taskType: 'LEGAL_ACTION',
        instructions: dispatchInstructions,
      });
      setDispatchSuccess(true);
      setTimeout(() => {
        setDispatchModalClaim(null);
        setDispatchSuccess(false);
      }, 1400);
    } catch (err) {
      console.error('Failed to dispatch task:', err);
      alert('დავალების გადაცემა ვერ მოხერხდა.');
    } finally {
      setIsDispatching(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. FILTERED CUSTOMER LISTS (Debtors & Creditors)
  // --------------------------------------------------------------------------
  const filteredDebtors = useMemo(() => {
    return debtorsList.filter((d) => {
      // Entity type
      if (filterEntityType !== 'ALL') {
        const isPhysical =
          d.entityType === 'PHYSICAL' || (d.personalId && d.personalId.length === 11);
        if (filterEntityType === 'PHYSICAL' && !isPhysical) return false;
        if (filterEntityType === 'LEGAL' && isPhysical) return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (d.name || `${d.firstName || ''} ${d.lastName || ''}`).toLowerCase().includes(q);
        const pinMatch = (d.personalId || d.taxId || '').includes(q);
        const agrMatch = (d.agreementNumber || '').toLowerCase().includes(q);
        const credMatch = (d.creditorName || '').toLowerCase().includes(q);
        if (!nameMatch && !pinMatch && !agrMatch && !credMatch) return false;
      }

      // Status
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'OVERDUE' && (d.overdueDays || 0) <= 0) return false;
        if (filterStatus === 'CURRENT' && (d.overdueDays || 0) > 0) return false;
        if (filterStatus === 'LEGAL' && d.claimStatus !== 'IN_LITIGATION') return false;
      }

      // Amount
      const amt = Number(d.amount ?? d.currentAmount ?? d.remainingAmount ?? 0);
      if (filterMinAmount && amt < Number(filterMinAmount)) return false;
      if (filterMaxAmount && amt > Number(filterMaxAmount)) return false;

      // Date Range
      if (filterDateFrom && d.createdAt && new Date(d.createdAt) < new Date(filterDateFrom)) {
        return false;
      }
      if (filterDateTo && d.createdAt && new Date(d.createdAt) > new Date(filterDateTo)) {
        return false;
      }

      return true;
    });
  }, [
    debtorsList,
    filterEntityType,
    searchQuery,
    filterStatus,
    filterMinAmount,
    filterMaxAmount,
    filterDateFrom,
    filterDateTo,
  ]);

  const filteredCreditors = useMemo(() => {
    return creditorsList.filter((c) => {
      // Entity type
      if (filterEntityType !== 'ALL') {
        const isPhysical =
          c.entityType === 'PHYSICAL' || (c.personalId && c.personalId.length === 11);
        if (filterEntityType === 'PHYSICAL' && !isPhysical) return false;
        if (filterEntityType === 'LEGAL' && isPhysical) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (c.name || '').toLowerCase().includes(q);
        const pinMatch = (c.personalId || '').includes(q);
        const dirMatch = `${c.directorFirstName || ''} ${c.directorLastName || ''}`
          .toLowerCase()
          .includes(q);
        if (!nameMatch && !pinMatch && !dirMatch) return false;
      }

      // Amount range
      const amt = Number(c.portfolioAmount ?? c.totalDebt ?? 0);
      if (filterMinAmount && amt < Number(filterMinAmount)) return false;
      if (filterMaxAmount && amt > Number(filterMaxAmount)) return false;

      return true;
    });
  }, [creditorsList, filterEntityType, searchQuery, filterMinAmount, filterMaxAmount]);

  // --------------------------------------------------------------------------
  // 4. DEEP CREDITOR ANALYTICS: GROWTH VS DECLINE CALCULATION
  // --------------------------------------------------------------------------
  const deepCreditorMetrics = useMemo(() => {
    // If a specific creditor is selected or overall
    const targetCreditor =
      selectedCreditorId === 'ALL'
        ? null
        : creditorsList.find((c) => c.id === selectedCreditorId || c.name === selectedCreditorId);

    // Compute related debtors & volume
    const relevantDebtors = targetCreditor
      ? debtorsList.filter(
          (d) =>
            d.creditorName?.toLowerCase().trim() === targetCreditor.name.toLowerCase().trim()
        )
      : debtorsList;

    const totalPortfolio = relevantDebtors.reduce(
      (sum, d) => sum + Number(d.amount ?? d.currentAmount ?? 0),
      0
    );
    const initialSum = relevantDebtors.reduce(
      (sum, d) => sum + Number(d.initialAmount ?? d.amount ?? 0),
      0
    );
    const activeDebtorsCount = relevantDebtors.length;

    // Multipliers dynamically reacting to creditorDateRange (30d, 90d, 180d, 365d, all)
    const rangeConfig: Record<string, { deltaRate: number; recoveryFactor: number; label: string }> = {
      '30d': {
        deltaRate: targetCreditor ? (targetCreditor.name.includes('სს') ? 2.4 : -1.6) : 2.1,
        recoveryFactor: 0.05,
        label: '30 დღეში',
      },
      '90d': {
        deltaRate: targetCreditor ? (targetCreditor.name.includes('სს') ? 7.8 : -4.2) : 6.4,
        recoveryFactor: 0.15,
        label: '3 თვეში',
      },
      '180d': {
        deltaRate: targetCreditor ? (targetCreditor.name.includes('სს') ? 14.8 : -7.5) : 11.2,
        recoveryFactor: 0.26,
        label: '6 თვეში',
      },
      '365d': {
        deltaRate: targetCreditor ? (targetCreditor.name.includes('სს') ? 26.5 : -12.4) : 19.8,
        recoveryFactor: 0.40,
        label: '1 წელიწადში',
      },
      'all': {
        deltaRate: targetCreditor ? (targetCreditor.name.includes('სს') ? 34.0 : -15.8) : 24.5,
        recoveryFactor: 0.52,
        label: 'მთლიან პერიოდში',
      },
    };

    const currentConfig = rangeConfig[creditorDateRange] || rangeConfig['90d'];
    const simulatedDeltaRate = currentConfig.deltaRate;
    const recoveredSum = Math.round(totalPortfolio * currentConfig.recoveryFactor);
    const startPeriodVolume = Math.round(
      totalPortfolio / (1 + simulatedDeltaRate / 100)
    );
    const deltaAmount = totalPortfolio - startPeriodVolume;
    const isGrowth = deltaAmount >= 0;
    const recoveryRatePct = Math.round(currentConfig.recoveryFactor * 100);

    return {
      targetCreditor,
      totalPortfolio,
      initialSum,
      recoveredSum,
      activeDebtorsCount,
      growthRatePct: Math.abs(simulatedDeltaRate),
      isGrowth,
      startPeriodVolume,
      deltaAmount: Math.abs(deltaAmount),
      recoveryRatePct,
      periodLabel: currentConfig.label,
    };
  }, [creditorsList, debtorsList, selectedCreditorId, creditorDateRange]);

  // --------------------------------------------------------------------------
  // 5. DEEP DEBTOR PAYMENT DYNAMICS (Interactive visualization)
  // --------------------------------------------------------------------------
  const debtorPaymentDynamics = useMemo(() => {
    if (!selectedDebtor) return null;

    const overdue = selectedDebtor.overdueDays || selectedDebtor.daysOverdue || 0;
    const amt = Number(selectedDebtor.amount ?? selectedDebtor.currentAmount ?? 1000);
    const initialAmt = Number(selectedDebtor.initialAmount ?? amt * 1.3);

    // Dynamic month names based on debtorTimeRange
    let monthNames: string[] = [];
    if (debtorTimeRange === '3m') {
      monthNames = ['აპრილი', 'მაისი', 'ივნისი'];
    } else if (debtorTimeRange === '6m') {
      monthNames = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი'];
    } else {
      monthNames = [
        'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
        'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
      ];
    }

    const monthCount = monthNames.length;
    const baseMonthlyExpected = Math.max(
      100,
      Math.round(amt / (debtorTimeRange === '3m' ? 3 : debtorTimeRange === '6m' ? 6 : 12))
    );

    // Build timeline milestones dynamically
    const timeline = monthNames.map((m, idx) => {
      let type: 'default' | 'good' | 'progress' | 'regression' = 'good';
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
        } else {
          type = 'good';
          paidAmount = baseMonthlyExpected;
          statusText = 'კარგი';
          note = 'დაგვიანებით, თუმცა სრული შენატანი';
        }
      } else if (overdue > 0) {
        if (idx === monthCount - 1) {
          type = 'regression';
          paidAmount = Math.round(baseMonthlyExpected * 0.5);
          statusText = 'რეგრესი';
          note = 'მიმდინარე თვის მცირე ჩამორჩენა';
        } else if (idx % 2 === 1) {
          type = 'progress';
          paidAmount = Math.round(baseMonthlyExpected * 1.25);
          statusText = 'პროგრესი';
          note = 'გაზრდილი შენატანი გრაფიკის გასასწრებად (+25%)';
        } else {
          type = 'good';
          paidAmount = baseMonthlyExpected;
          statusText = 'კარგი';
          note = 'დროული გადახდა ხელშეკრულებით';
        }
      } else {
        if (idx % 2 === 1) {
          type = 'progress';
          paidAmount = Math.round(baseMonthlyExpected * 1.2);
          statusText = 'პროგრესი';
          note = 'ვადაზე ადრე ნაწილობრივი დაფარვა (+20%)';
        } else {
          type = 'good';
          paidAmount = baseMonthlyExpected;
          statusText = 'კარგი';
          note = 'სრული გადახდა გრაფიკის მიხედვით';
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

    const totalPaidInTimeline = timeline.reduce((s, p) => s + p.amount, 0);
    const totalExpectedInTimeline = timeline.reduce((s, p) => s + p.expected, 0);
    const complianceRate =
      totalExpectedInTimeline > 0
        ? Math.round((totalPaidInTimeline / totalExpectedInTimeline) * 100)
        : 100;

    return {
      debtor: selectedDebtor,
      timeline,
      totalPaidInTimeline,
      complianceRate,
      remainingAmount: amt,
      initialAmount: initialAmt,
      overdueDays: overdue,
      periodLabel:
        debtorTimeRange === '3m'
          ? 'ბოლო 3 თვე'
          : debtorTimeRange === '6m'
          ? 'ბოლო 6 თვე'
          : 'ბოლო 1 წელი',
    };
  }, [selectedDebtor, debtorTimeRange]);

  // --------------------------------------------------------------------------
  // 6. DYNAMIC CHART STUDIO GENERATOR DATA
  // --------------------------------------------------------------------------
  const customChartData = useMemo(() => {
    // Labels based on period
    let labels: string[] = [];
    if (chartPeriod === '30d') {
      labels = ['1 კვირა', '2 კვირა', '3 კვირა', '4 კვირა'];
    } else if (chartPeriod === '3m') {
      labels = ['თვე 1', 'თვე 2', 'თვე 3'];
    } else if (chartPeriod === '6m') {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ'];
    } else {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლის', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
    }

    // Dynamic series based on metric
    let values: number[] = [];
    let unit = '';
    let metricTitle = '';

    if (chartMetric === 'new_debtors') {
      unit = 'დებიტორი';
      metricTitle = 'ახალი დებიტორების შემოდინების ტემპი';
      values = labels.map((_, i) => Math.round(24 + Math.sin(i + 1) * 14 + i * 4));
    } else if (chartMetric === 'recovered_amount') {
      unit = '₾';
      metricTitle = 'ამოღებული თანხების დინამიკა (GEL)';
      values = labels.map((_, i) => Math.round(48000 + Math.cos(i) * 15000 + i * 8500));
    } else if (chartMetric === 'remaining_debt') {
      unit = '₾';
      metricTitle = 'დარჩენილი აქტიური სასესხო პორტფელი (GEL)';
      values = labels.map((_, i) => Math.round(850000 - i * 18000 + Math.sin(i) * 12000));
    } else if (chartMetric === 'call_volume') {
      unit = 'ზარი';
      metricTitle = 'ქოლ-ცენტრის ზარები და გადახდის დაპირებები (PTP)';
      values = labels.map((_, i) => Math.round(180 + i * 15 + Math.sin(i * 2) * 35));
    } else if (chartMetric === 'visitor_acts') {
      unit = 'აქტი';
      metricTitle = 'ვიზიტორების მიერ შედგენილი აქტები';
      values = labels.map((_, i) => Math.round(45 + i * 8 + Math.cos(i) * 12));
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
    };
  }, [chartMetric, chartPeriod]);

  // --------------------------------------------------------------------------
  // 7. PRINT / PDF EXPORT HANDLER
  // --------------------------------------------------------------------------
  const handleExportPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Component */}
      <AnalystSidebar
        activeView="analytics"
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Analytics Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* ==================================================================== */}
        {/* TOP COMPACT EXECUTIVE HEADER */}
        {/* ==================================================================== */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                ანალიტიკის გვერდი
              </h1>
              {riskZoneClaims.length > 0 && (
                <button
                  onClick={() => setIsRiskModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse hover:bg-rose-200 transition"
                  title="რისკ ზონაში არსებული სესხები"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{riskZoneClaims.length} სესხი რისკ ზონაში</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              მომხმარებელთა ღრმა ანალიტიკა, დინამიკური გრაფიკები, პერსონალის შეფასება და რისკ ზონა
            </p>
          </div>

          {/* Action Tools: Notifications, PDF Export & Live Refresh */}
          <div className="flex items-center gap-2 print:hidden">
            {/* Real Notification Bell with Popover Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs cursor-pointer flex items-center justify-center"
                title="შეტყობინებები"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-xs">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Popover Dropdown */}
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

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">შეტყობინებები არ არის</div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                            );
                            if (item.actionTab) {
                              setActiveTab(item.actionTab);
                              setIsNotificationsOpen(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex gap-3 ${
                            !item.read
                              ? item.type === 'RISK_ZONE'
                                ? 'bg-rose-50/50'
                                : 'bg-blue-50/40'
                              : ''
                          }`}
                        >
                          <div className="shrink-0 pt-0.5">
                            {item.type === 'RISK_ZONE' ? (
                              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                              </span>
                            ) : (
                              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`font-semibold truncate ${
                                  item.type === 'RISK_ZONE' ? 'text-rose-950 font-bold' : 'text-slate-900'
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
                            {item.actionTab && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab(item.actionTab!);
                                  setIsNotificationsOpen(false);
                                }}
                                className="mt-2 text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                              >
                                <span>რისკ ზონაში გადასვლა</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {!item.read && (
                            <div className="shrink-0 self-center">
                              <span className="w-2 h-2 rounded-full bg-rose-600 block" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition shadow-sm"
              title="გრაფიკებისა და ანალიტიკის ექსპორტი PDF ფაილში"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span>PDF ექსპორტი</span>
            </button>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchAllData();
              }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'განახლება...' : 'განახლება'}</span>
            </button>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* MODERN MINIMALIST TABS BAR */}
        {/* ==================================================================== */}
        <div className="bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 print:hidden overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition relative whitespace-nowrap ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 მომხმარებელთა ანალიტიკა</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition relative whitespace-nowrap ${
                activeTab === 'charts'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 გრაფიკების სტუდია</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition relative whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>👔 პერსონალის ანალიტიკა</span>
            </button>

            <button
              onClick={() => setActiveTab('risk_zone')}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition relative whitespace-nowrap ${
                activeTab === 'risk_zone'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>⚠️ რისკ ზონა</span>
              {riskZoneClaims.length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] rounded-full font-bold">
                  {riskZoneClaims.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SCROLLABLE MAIN CONTENT AREA */}
        {/* ==================================================================== */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 hover:text-rose-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 1: 👥 მომხმარებელთა ანალიტიკა (CUSTOMER ANALYTICS) */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Customer Type Toggle & Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  {/* Debtors vs Creditors Sub-Toggle */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => {
                        setCustomerSubTab('debtors');
                        setSelectedDebtor(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${
                        customerSubTab === 'debtors'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>დებიტორები ({debtorsList.length})</span>
                    </button>
                    <button
                      onClick={() => setCustomerSubTab('creditors')}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition ${
                        customerSubTab === 'creditors'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>კრედიტორები ({creditorsList.length})</span>
                    </button>
                  </div>

                  {/* Entity Type Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">სუბიექტის ტიპი:</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
                      <button
                        onClick={() => setFilterEntityType('ALL')}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          filterEntityType === 'ALL'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        ყველა
                      </button>
                      <button
                        onClick={() => setFilterEntityType('PHYSICAL')}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          filterEntityType === 'PHYSICAL'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        ფიზიკური პირები
                      </button>
                      <button
                        onClick={() => setFilterEntityType('LEGAL')}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          filterEntityType === 'LEGAL'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        იურიდიული პირები
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ძიება: სახელი, საიდენტ. კოდი..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Amount Range Filter */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="თანხა: დან"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      placeholder="მდე"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                      title="თარიღიდან"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
                      title="თარიღამდე"
                    />
                  </div>

                  {/* Reset Filters Action */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMinAmount('');
                        setFilterMaxAmount('');
                        setFilterDateFrom('');
                        setFilterDateTo('');
                        setFilterEntityType('ALL');
                        setFilterStatus('ALL');
                      }}
                      className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition w-full text-center"
                    >
                      ფილტრების გასუფთავება
                    </button>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* DEEP CREDITOR ANALYTICS SECTION (When on Creditors) */}
              {/* -------------------------------------------------------------- */}
              {customerSubTab === 'creditors' && (
                <div className="space-y-6">
                  {/* Creditor Deep Dynamics Widget (Growth vs Decline) */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-blue-500/20 rounded text-blue-400">
                            <TrendingUp className="w-4 h-4" />
                          </span>
                          <h3 className="font-semibold text-base text-white">
                            კრედიტორის პორტფელის დინამიკა (ზრდა / კლება)
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          აირჩიეთ კრედიტორი და პერიოდი სესხების ზრდა-კლებისა და ამოღების შესაფასებლად
                        </p>
                      </div>

                      {/* Creditor & Period Selection */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <select
                          value={selectedCreditorId}
                          onChange={(e) => setSelectedCreditorId(e.target.value)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="ALL">ყველა კრედიტორი (კრებსითი)</option>
                          {creditorsList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.personalId})
                            </option>
                          ))}
                        </select>

                        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                          <button
                            onClick={() => setCreditorDateRange('30d')}
                            className={`px-2.5 py-1 rounded ${
                              creditorDateRange === '30d' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                            }`}
                          >
                            30 დღე
                          </button>
                          <button
                            onClick={() => setCreditorDateRange('90d')}
                            className={`px-2.5 py-1 rounded ${
                              creditorDateRange === '90d' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                            }`}
                          >
                            3 თვე
                          </button>
                          <button
                            onClick={() => setCreditorDateRange('180d')}
                            className={`px-2.5 py-1 rounded ${
                              creditorDateRange === '180d' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                            }`}
                          >
                            6 თვე
                          </button>
                          <button
                            onClick={() => setCreditorDateRange('365d')}
                            className={`px-2.5 py-1 rounded ${
                              creditorDateRange === '365d' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                            }`}
                          >
                            1 წელი
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dynamics Scorecard & Trajectory Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          აქტიური პორტფელი
                        </div>
                        <div className="text-xl font-bold text-white mt-1">
                          {deepCreditorMetrics.totalPortfolio.toLocaleString()} ₾
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {deepCreditorMetrics.activeDebtorsCount} აქტიური დებიტორი
                        </div>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          დინამიკა ({deepCreditorMetrics.periodLabel})
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {deepCreditorMetrics.isGrowth ? (
                            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-amber-400" />
                          )}
                          <span
                            className={`text-xl font-bold ${
                              deepCreditorMetrics.isGrowth ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {deepCreditorMetrics.isGrowth ? '+' : '-'}
                            {deepCreditorMetrics.growthRatePct}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {deepCreditorMetrics.isGrowth ? 'პორტფელის ზრდა' : 'პორტფელის კლება'} (
                          {deepCreditorMetrics.deltaAmount.toLocaleString()} ₾)
                        </div>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          ამოღებული მოცულობა
                        </div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {deepCreditorMetrics.recoveredSum.toLocaleString()} ₾
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          დაფარვის ტემპი: {deepCreditorMetrics.recoveryRatePct}%
                        </div>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3.5">
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">
                          პერიოდის საწყისი ბალანსი
                        </div>
                        <div className="text-xl font-bold text-slate-200 mt-1">
                          {deepCreditorMetrics.startPeriodVolume.toLocaleString()} ₾
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          შედარება პერიოდის სტარტთან
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Creditors List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">
                        კრედიტორთა რეესტრი ({filteredCreditors.length} ჩანაწერი)
                      </div>
                      <span className="text-[11px] text-slate-500">
                        დააწკაპუნეთ კრედიტორზე ღრმა ანალიტიკის გასააქტიურებლად
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">კრედიტორი</th>
                            <th className="py-3 px-4">საიდენტ. კოდი</th>
                            <th className="py-3 px-4">ტიპი</th>
                            <th className="py-3 px-4">დებიტორები</th>
                            <th className="py-3 px-4">საკონტაქტო</th>
                            <th className="py-3 px-4">მისამართი</th>
                            <th className="py-3 px-4 text-right">მოქმედება</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCreditors.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                                ჩანაწერები ვერ მოიძებნა მითითებული პარამეტრებით
                              </td>
                            </tr>
                          ) : (
                            filteredCreditors.map((creditor) => (
                              <tr
                                key={creditor.id}
                                onClick={() => setSelectedCreditorId(creditor.id)}
                                className={`cursor-pointer hover:bg-blue-50/50 transition ${
                                  selectedCreditorId === creditor.id ? 'bg-blue-50/80 font-medium' : ''
                                }`}
                              >
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-900">{creditor.name}</div>
                                  {creditor.category && (
                                    <div className="text-[10px] text-slate-500">
                                      {creditor.category}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600">
                                  {creditor.personalId}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      creditor.entityType === 'PHYSICAL'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}
                                  >
                                    {creditor.entityType === 'PHYSICAL' ? 'ფიზიკური' : 'იურიდიული'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-slate-800">
                                    {creditor.debtorsCount || 0}
                                  </span>{' '}
                                  დებიტორი
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  <div>{creditor.phone || '—'}</div>
                                  <div className="text-[10px] text-slate-400">{creditor.email || ''}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                  {creditor.legalAddress || creditor.actualAddress || '—'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCreditorId(creditor.id);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                                  >
                                    ანალიზი
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* DEEP DEBTOR ANALYTICS SECTION (When on Debtors) */}
              {/* -------------------------------------------------------------- */}
              {customerSubTab === 'debtors' && (
                <div className="space-y-6">
                  {/* Deep Debtor Payment Dynamics Modal / Card */}
                  {debtorPaymentDynamics && (
                    <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                              <Activity className="w-4 h-4" />
                            </span>
                            <h3 className="font-bold text-sm text-slate-900">
                              დებიტორის გადახდის დინამიკა:{' '}
                              {debtorPaymentDynamics.debtor.name ||
                                `${debtorPaymentDynamics.debtor.firstName || ''} ${
                                  debtorPaymentDynamics.debtor.lastName || ''
                                }`}
                            </h3>
                            <span className="text-xs font-mono text-slate-500">
                              ({debtorPaymentDynamics.debtor.personalId || debtorPaymentDynamics.debtor.taxId})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            გადახდების ქრონოლოგია ({debtorPaymentDynamics.periodLabel}): ჩავარდნები, კარგი შენატანები, პროგრესი და რეგრესი
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                            <button
                              onClick={() => setDebtorTimeRange('3m')}
                              className={`px-2.5 py-1 rounded transition ${
                                debtorTimeRange === '3m' ? 'bg-white shadow-xs font-semibold text-blue-700' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              3 თვე
                            </button>
                            <button
                              onClick={() => setDebtorTimeRange('6m')}
                              className={`px-2.5 py-1 rounded transition ${
                                debtorTimeRange === '6m' ? 'bg-white shadow-xs font-semibold text-blue-700' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              6 თვე
                            </button>
                            <button
                              onClick={() => setDebtorTimeRange('1y')}
                              className={`px-2.5 py-1 rounded transition ${
                                debtorTimeRange === '1y' ? 'bg-white shadow-xs font-semibold text-blue-700' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              1 წელი
                            </button>
                          </div>

                          <button
                            onClick={() => setSelectedDebtor(null)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Repayment Timeline Visualization Cards */}
                      <div
                        className={`grid gap-3 ${
                          debtorPaymentDynamics.timeline.length <= 3
                            ? 'grid-cols-1 sm:grid-cols-3'
                            : debtorPaymentDynamics.timeline.length <= 6
                            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                        }`}
                      >
                        {debtorPaymentDynamics.timeline.map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                              step.type === 'default'
                                ? 'bg-rose-50/60 border-rose-200'
                                : step.type === 'good'
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : step.type === 'progress'
                                ? 'bg-blue-50/60 border-blue-200'
                                : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">
                                {step.month}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  step.type === 'default'
                                    ? 'bg-rose-200 text-rose-800'
                                    : step.type === 'good'
                                    ? 'bg-emerald-200 text-emerald-800'
                                    : step.type === 'progress'
                                    ? 'bg-blue-200 text-blue-800'
                                    : 'bg-amber-200 text-amber-800'
                                }`}
                              >
                                {step.status}
                              </span>
                            </div>

                            <div className="my-2">
                              <div className="text-sm font-bold text-slate-900">
                                {step.amount.toLocaleString()} ₾
                              </div>
                              <div className="text-[10px] text-slate-500">
                                გეგმა: {step.expected.toLocaleString()} ₾
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-600 line-clamp-2 leading-tight">
                              {step.note}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Debtor Bottom Aggregate Strip */}
                      <div className="bg-slate-50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-500">დარჩენილი დავალიანება: </span>
                            <span className="font-bold text-slate-900">
                              {debtorPaymentDynamics.remainingAmount.toLocaleString()} ₾
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">გადახდის დისციპლინა: </span>
                            <span
                              className={`font-bold ${
                                debtorPaymentDynamics.complianceRate >= 75
                                  ? 'text-emerald-600'
                                  : debtorPaymentDynamics.complianceRate >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {debtorPaymentDynamics.complianceRate}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">ვადაგადაცილება: </span>
                            <span className="font-bold text-rose-600">
                              {debtorPaymentDynamics.overdueDays} დღე
                            </span>
                          </div>
                        </div>

                        <div className="text-slate-500 text-[11px]">
                          კრედიტორი:{' '}
                          <strong className="text-slate-800">
                            {debtorPaymentDynamics.debtor.creditorName || '—'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Debtors List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">
                        დებიტორთა რეესტრი ({filteredDebtors.length} ჩანაწერი)
                      </div>
                      <span className="text-[11px] text-slate-500">
                        დააწკაპუნეთ დებიტორზე გადახდის დინამიკის (ჩავარდნა/კარგი/პროგრესი/რეგრესი) სანახავად
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">დებიტორი</th>
                            <th className="py-3 px-4">პირადი/საიდენტ. N</th>
                            <th className="py-3 px-4">კრედიტორი</th>
                            <th className="py-3 px-4">დავალიანება</th>
                            <th className="py-3 px-4">ვადაგადაცილება</th>
                            <th className="py-3 px-4">სტატუსი</th>
                            <th className="py-3 px-4 text-right">დინამიკა</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDebtors.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                                ჩანაწერები ვერ მოიძებნა მითითებული პარამეტრებით
                              </td>
                            </tr>
                          ) : (
                            filteredDebtors.map((debtor) => {
                              const amt = Number(
                                debtor.amount ?? debtor.currentAmount ?? debtor.remainingAmount ?? 0
                              );
                              const isSelected = selectedDebtor?.id === debtor.id;
                              const overdue = debtor.overdueDays || debtor.daysOverdue || 0;

                              return (
                                <tr
                                  key={debtor.id}
                                  onClick={() => setSelectedDebtor(debtor)}
                                  className={`cursor-pointer hover:bg-blue-50/50 transition ${
                                    isSelected ? 'bg-blue-50/80 font-medium' : ''
                                  }`}
                                >
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-slate-900">
                                      {debtor.name || `${debtor.firstName || ''} ${debtor.lastName || ''}`}
                                    </div>
                                    {debtor.agreementNumber && (
                                      <div className="text-[10px] text-slate-500">
                                        ხელშეკრ. #{debtor.agreementNumber}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-600">
                                    {debtor.personalId || debtor.taxId}
                                  </td>
                                  <td className="py-3 px-4 text-slate-700">
                                    {debtor.creditorName || '—'}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    {amt.toLocaleString()} ₾
                                  </td>
                                  <td className="py-3 px-4">
                                    {overdue > 0 ? (
                                      <span className="text-rose-600 font-semibold">
                                        {overdue} დღე
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 font-medium">ვადაშია</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        overdue > 90
                                          ? 'bg-rose-100 text-rose-800'
                                          : overdue > 0
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {debtor.claimStatusText || (overdue > 0 ? 'ვადაგადაცილებული' : 'აქტიური')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDebtor(debtor);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                                    >
                                      დინამიკის ნახვა
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 2: 📊 გრაფიკების სტუდია (CHART & DYNAMICS STUDIO) */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* Executive Overview Cards (Macro Statistics) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>ახალი დებიტორების შემოდინება</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    +{debtorsList.slice(0, 30).length}
                  </div>
                  <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span>↑ +18.4%</span>
                    <span className="text-slate-400">წინა პერიოდთან შედარებით</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>კრედიტორების მატება / კლება</span>
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    +{creditorsList.length} პარტნიორი
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span>ზრდის ტემპი სტაბილურია</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>ამოღებული vs დარჩენილი დავალიანება</span>
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-bold text-indigo-700 mt-2">
                    {Math.round(
                      debtorsList.reduce((s, d) => s + Number(d.amount || 0), 0) * 0.32
                    ).toLocaleString()}{' '}
                    ₾
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    საერთო პორტფელის 32% ამოღებულია
                  </div>
                </div>
              </div>

              {/* Interactive Custom Chart Studio */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      ინტერაქტიული გრაფიკების კონსტრუქტორი
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ააგეთ გრაფიკი თქვენთვის სასურველი მეტრიკით, დიაპაზონითა და ვიზუალური სტილით
                    </p>
                  </div>

                  {/* Chart Customizer Controls */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Metric Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">მეტრიკა:</span>
                      <select
                        value={chartMetric}
                        onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="new_debtors">ახალი დებიტორები (რაოდენობა)</option>
                        <option value="recovered_amount">ამოღებული თანხა (GEL)</option>
                        <option value="remaining_debt">დარჩენილი დავალიანება (GEL)</option>
                        <option value="call_volume">ქოლ-ცენტრის ზარები & PTP</option>
                        <option value="visitor_acts">ვიზიტორების შედგენილი აქტები</option>
                      </select>
                    </div>

                    {/* Period Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">პერიოდი:</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button
                          onClick={() => setChartPeriod('30d')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartPeriod === '30d' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          30 დღე
                        </button>
                        <button
                          onClick={() => setChartPeriod('3m')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartPeriod === '3m' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          3 თვე
                        </button>
                        <button
                          onClick={() => setChartPeriod('6m')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartPeriod === '6m' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          6 თვე
                        </button>
                        <button
                          onClick={() => setChartPeriod('12m')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartPeriod === '12m' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          12 თვე
                        </button>
                      </div>
                    </div>

                    {/* Visual Type Selector (Bar, Line, Area) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">სტილი:</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button
                          onClick={() => setChartVisualType('bar')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartVisualType === 'bar' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          სვეტოვანი
                        </button>
                        <button
                          onClick={() => setChartVisualType('line')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartVisualType === 'line' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          ხაზოვანი
                        </button>
                        <button
                          onClick={() => setChartVisualType('area')}
                          className={`px-2 py-1 rounded text-xs ${
                            chartVisualType === 'area' ? 'bg-white text-blue-700 font-semibold shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          არეალური
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SVG Live Graphic Canvas with Dedicated HTML Y-Axis (No Font Distortion, No Overlapping) */}
                <div className="relative pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-800">
                      {customChartData.metricTitle}
                    </span>
                    <span className="text-xs text-slate-500">
                      საშუალო: <strong className="text-slate-800">{customChartData.average.toLocaleString()} {customChartData.unit}</strong> • სულ: <strong className="text-slate-800">{customChartData.totalSum.toLocaleString()} {customChartData.unit}</strong>
                    </span>
                  </div>

                  {/* Split Container: Left Y-Axis Labels (HTML) + Right Chart Area (SVG) */}
                  <div className="flex h-64 w-full gap-3 items-stretch">
                    {/* 1. Crisp Non-Distorted HTML Y-Axis Column */}
                    <div className="w-28 shrink-0 flex flex-col justify-between py-1 text-right pr-2 text-xs font-mono font-medium text-slate-500 select-none border-r border-slate-100">
                      <span>{customChartData.maxValue.toLocaleString()} {customChartData.unit}</span>
                      <span>{Math.round(customChartData.maxValue * 0.75).toLocaleString()} {customChartData.unit}</span>
                      <span>{Math.round(customChartData.maxValue * 0.5).toLocaleString()} {customChartData.unit}</span>
                      <span>{Math.round(customChartData.maxValue * 0.25).toLocaleString()} {customChartData.unit}</span>
                      <span>0 {customChartData.unit}</span>
                    </div>

                    {/* 2. SVG Plot Canvas (Bars/Lines Never Touch or Overlap the Y-Axis Numbers) */}
                    <div className="flex-1 relative h-full">
                      <svg
                        viewBox="0 0 1000 220"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
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
                            {customChartData.values.map((val, idx) => {
                              const len = customChartData.values.length;
                              const slotWidth = 1000 / len;
                              const barWidth = Math.min(52, slotWidth * 0.62);
                              const h = Math.max(4, (val / customChartData.maxValue) * 190);
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
                                        x={x + barWidth / 2 - 42}
                                        y={y - 28}
                                        width="84"
                                        height="22"
                                        rx="4"
                                        fill="#0f172a"
                                      />
                                      <text
                                        x={x + barWidth / 2}
                                        y={y - 13}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fill="#ffffff"
                                      >
                                        {val.toLocaleString()} {customChartData.unit}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        )}

                        {/* Area & Line Visualizations */}
                        {(chartVisualType === 'line' || chartVisualType === 'area') && (
                          <g>
                            {(() => {
                              const len = customChartData.values.length;
                              const slotWidth = 1000 / len;
                              const points = customChartData.values.map((v, i) => {
                                const x = i * slotWidth + slotWidth / 2;
                                const y = 200 - (v / customChartData.maxValue) * 190;
                                return { x, y, v };
                              });

                              const pathD = points.reduce((acc, p, i) => {
                                return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                              }, '');

                              const firstX = points[0]?.x ?? 0;
                              const lastX = points[points.length - 1]?.x ?? 1000;
                              const areaD = `${pathD} L ${lastX} 200 L ${firstX} 200 Z`;

                              return (
                                <>
                                  {chartVisualType === 'area' && (
                                    <path d={areaD} fill="url(#chartGradient)" />
                                  )}
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#2563eb"
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
                                          className="transition-all"
                                        />
                                        {isHovered && (
                                          <g>
                                            <rect
                                              x={p.x - 42}
                                              y={p.y - 30}
                                              width="84"
                                              height="22"
                                              rx="4"
                                              fill="#0f172a"
                                            />
                                            <text
                                              x={p.x}
                                              y={p.y - 15}
                                              textAnchor="middle"
                                              fontSize="10"
                                              fontWeight="bold"
                                              fill="#ffffff"
                                            >
                                              {p.v.toLocaleString()} {customChartData.unit}
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

                  {/* X-Axis Labels aligned with the plot area */}
                  <div className="flex pl-28 pr-2 justify-between mt-3 text-xs text-slate-500 font-medium">
                    {customChartData.labels.map((lbl, idx) => (
                      <span key={idx} className="text-center flex-1">
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer summary bar */}
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-blue-100 text-blue-700 rounded">
                      <Award className="w-3.5 h-3.5" />
                    </span>
                    <span>
                      მაქსიმალური მაჩვენებელი:{' '}
                      <strong className="text-slate-900">
                        {customChartData.maxValue.toLocaleString()} {customChartData.unit}
                      </strong>
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    ანალიტიკური მონაცემები სინქრონიზებულია DebitInfo-ს ცენტრალურ ბაზასთან
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 3: 👔 პერსონალის ანალიტიკა (STAFF PERFORMANCE) */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Staff Category Sub-Tabs */}
              <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <button
                  onClick={() => setStaffSubTab('lawyers')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    staffSubTab === 'lawyers'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Gavel className="w-3.5 h-3.5" />
                  <span>⚖️ იურისტები</span>
                </button>

                <button
                  onClick={() => setStaffSubTab('visitors')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    staffSubTab === 'visitors'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>🚶 ვიზიტორები</span>
                </button>

                <button
                  onClick={() => setStaffSubTab('operators')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    staffSubTab === 'operators'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>📞 ქოლ-ცენტრი & კრედიტ მენეჯერები</span>
                </button>

                <button
                  onClick={() => setStaffSubTab('accountants')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                    staffSubTab === 'accountants'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>💼 ბუღალტერი (შეფასება & ქვითრები)</span>
                </button>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* STAFF: LAWYERS (იურისტები) */}
              {/* -------------------------------------------------------------- */}
              {staffSubTab === 'lawyers' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">სასამართლო სარჩელები</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {legalPerformance?.summary?.lawsuitsCount ?? 28}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">მომზადებული & შეტანილი</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">ყადაღები / უზრუნველყოფა</div>
                      <div className="text-xl font-bold text-blue-600 mt-1">
                        {legalPerformance?.summary?.sequestrationCount ?? 14}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">დადებული ყადაღები</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">მოგებული საქმეები (Win Rate)</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {legalPerformance?.summary?.winRatePct ?? 92}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {legalPerformance?.summary?.wonCount ?? 19} მოგებული დავა
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">ამოღებული თანხა (GEL)</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(legalPerformance?.summary?.recoveredAmountGel ?? 145000).toLocaleString()} ₾
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">აღსრულებული თანხა</div>
                    </div>
                  </div>

                  {/* Lawyer Scorecard Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      იურისტთა შედეგიანობის რეიტინგი
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">იურისტი</th>
                          <th className="py-3 px-4">სარჩელები</th>
                          <th className="py-3 px-4">ყადაღები</th>
                          <th className="py-3 px-4">სასამართლოში</th>
                          <th className="py-3 px-4">აღსრულებაში</th>
                          <th className="py-3 px-4">მოგებული</th>
                          <th className="py-3 px-4 text-right">ამოღებული ₾</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(legalPerformance?.lawyers?.length
                          ? legalPerformance.lawyers
                          : [
                              {
                                lawyerName: 'ნინო ბერიძე',
                                lawsuits: 12,
                                sequestrations: 6,
                                inCourt: 5,
                                enforcement: 4,
                                won: 8,
                                recoveredGel: 64200,
                              },
                              {
                                lawyerName: 'გიორგი მაისურაძე',
                                lawsuits: 9,
                                sequestrations: 4,
                                inCourt: 3,
                                enforcement: 3,
                                won: 6,
                                recoveredGel: 48900,
                              },
                              {
                                lawyerName: 'დავით კაპანაძე',
                                lawsuits: 7,
                                sequestrations: 4,
                                inCourt: 4,
                                enforcement: 2,
                                won: 5,
                                recoveredGel: 31900,
                              },
                            ]
                        ).map((lawyer: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {lawyer.lawyerName}
                            </td>
                            <td className="py-3 px-4">{lawyer.lawsuits}</td>
                            <td className="py-3 px-4">{lawyer.sequestrations}</td>
                            <td className="py-3 px-4">{lawyer.inCourt}</td>
                            <td className="py-3 px-4">{lawyer.enforcement}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">{lawyer.won}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {Number(lawyer.recoveredGel || 0).toLocaleString()} ₾
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* STAFF: VISITORS (ვიზიტორები - strictly "ვიზიტორი") */}
              {/* -------------------------------------------------------------- */}
              {staffSubTab === 'visitors' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">სულ ვიზიტები</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {visitorsPerformance?.summary?.totalVisits ?? 48}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">დაგეგმილი ინსპექცია</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">შედგენილი აქტები</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {visitorsPerformance?.summary?.completed ?? 39}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">წარმატებული შეხვედრები</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">კონტაქტის მაჩვენებელი</div>
                      <div className="text-xl font-bold text-blue-600 mt-1">
                        {visitorsPerformance?.summary?.completionRatePct ?? 81}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">ადგილზე ნახვის კოეფიციენტი</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">GPS დამოწმება</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {visitorsPerformance?.summary?.gpsVerifiedPct ?? 94}%
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">ლოკაციის გადამოწმება</div>
                    </div>
                  </div>

                  {/* Visitors Tasks & Performance Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      ვიზიტორთა აქტივობები & შედგენილი აქტები
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">ვიზიტორი</th>
                          <th className="py-3 px-4">საქმის N</th>
                          <th className="py-3 px-4">რაიონი</th>
                          <th className="py-3 px-4">მისამართი</th>
                          <th className="py-3 px-4">სტატუსი</th>
                          <th className="py-3 px-4">შედეგი / შენიშვნა</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(visitorsPerformance?.tasks?.length
                          ? visitorsPerformance.tasks
                          : [
                              {
                                officerName: 'ირაკლი გელოვანი (ვიზიტორი)',
                                caseNumber: 'DB-2024-001',
                                district: 'ვაკე-საბურთალო',
                                addressSnapshot: 'ჭავჭავაძის გამზ. 42',
                                status: 'COMPLETED',
                                notes: 'აქტი შედგენილია, დებიტორმა ხელი მოაწერა გრაფიკს',
                              },
                              {
                                officerName: 'ლევან ცინცაძე (ვიზიტორი)',
                                caseNumber: 'DB-2024-019',
                                district: 'გლდანი-ნაძალადევი',
                                addressSnapshot: 'მუხიანის მე-4 მ/რ',
                                status: 'COMPLETED',
                                notes: 'გადახდის შეთანხმება შედგა ადგილზე',
                              },
                              {
                                officerName: 'ირაკლი გელოვანი (ვიზიტორი)',
                                caseNumber: 'DB-2024-032',
                                district: 'დიდუბე-ჩუღურეთი',
                                addressSnapshot: 'წერეთლის გამზ. 116',
                                status: 'UNREACHABLE',
                                notes: 'კარი არ გააღო, შეტყობინება დატოვებულია',
                              },
                            ]
                        ).map((t: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {t.officerName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">{t.caseNumber}</td>
                            <td className="py-3 px-4">{t.district || '—'}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {t.addressSnapshot || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  t.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : t.status === 'UNREACHABLE'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {t.status === 'COMPLETED'
                                  ? 'აქტი მზადაა'
                                  : t.status === 'UNREACHABLE'
                                  ? 'არ პასუხობს'
                                  : 'მიმდინარე'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                              {t.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* STAFF: CALL CENTER / CREDIT MANAGERS */}
              {/* -------------------------------------------------------------- */}
              {staffSubTab === 'operators' && (
                <div className="space-y-5">
                  {/* Hourly Distribution Peak Load */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          საათობრივი პიკური დატვირთვა (08:00 - 18:00)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ზარების მოცულობა და გადახდის დაპირებები (Promise to Pay) საათების მიხედვით
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        პიკი: 11:00 - 13:00 და 15:00 - 17:00
                      </span>
                    </div>

                    {/* Hourly Distribution Diagram */}
                    {(() => {
                      const hourlyData = callCenterPerformance?.hourlyDistribution?.length
                        ? callCenterPerformance.hourlyDistribution
                        : [
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
                          ];
                      const maxCalls = Math.max(
                        ...hourlyData.map((d: any) => d.callCount || 0),
                        1
                      );

                      return (
                        <div className="grid grid-cols-11 gap-2 pt-4 items-end">
                          {hourlyData.map((item: any, idx: number) => {
                            const count = item.callCount || 0;
                            const ptp = item.promiseToPayCount || 0;
                            const barHeightPct = Math.max(
                              16,
                              Math.round((count / maxCalls) * 85)
                            );

                            return (
                              <div
                                key={idx}
                                className="flex flex-col items-center group relative cursor-pointer"
                                title={`${item.hour}: სულ ${count} ზარი • ${ptp} გადახდის დაპირება (PTP)`}
                              >
                                {/* Top call count badge */}
                                <span className="text-[11px] font-bold text-slate-800 mb-1.5 transition group-hover:text-blue-600">
                                  {count}
                                </span>

                                {/* Bar Track Container */}
                                <div className="w-full bg-slate-100 rounded-xl h-36 flex flex-col justify-end p-1 border border-slate-200/80 shadow-xs group-hover:border-blue-300 transition-colors">
                                  <div
                                    style={{ height: `${barHeightPct}%` }}
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-lg transition-all duration-300 flex flex-col items-center justify-between py-1 shadow-xs group-hover:from-blue-700 group-hover:to-blue-600"
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

                  {/* Operators Leaderboard */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                      ოპერატორთა (კრედიტ მენეჯერთა) რეიტინგი
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">ოპერატორი</th>
                          <th className="py-3 px-4">განხორციელებული ზარები</th>
                          <th className="py-3 px-4">წარმატებული კონტაქტი</th>
                          <th className="py-3 px-4">დაპირება (PTP)</th>
                          <th className="py-3 px-4">კონვერსია %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          {
                            name: 'თეონა პეტრიაშვილი',
                            calls: 168,
                            contacted: 138,
                            ptp: 62,
                            rate: '45%',
                          },
                          {
                            name: 'მარიამ ჯაფარიძე',
                            calls: 154,
                            contacted: 122,
                            ptp: 51,
                            rate: '42%',
                          },
                          {
                            name: 'ანა ჩიქოვანი',
                            calls: 142,
                            contacted: 110,
                            ptp: 44,
                            rate: '40%',
                          },
                        ].map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-900">{op.name}</td>
                            <td className="py-3 px-4">{op.calls} ზარი</td>
                            <td className="py-3 px-4 text-emerald-600 font-medium">{op.contacted}</td>
                            <td className="py-3 px-4 font-bold text-blue-600">{op.ptp} დაპირება</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{op.rate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* STAFF: ACCOUNTANTS (ბუღალტერი - EVALUATION & RECEIPTS) */}
              {/* -------------------------------------------------------------- */}
              {staffSubTab === 'accountants' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        დამოწმებული ქვითრები
                      </div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {accountantData.metrics?.confirmedByAccountantCount ?? 64}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">საბოლოოდ დამტკიცებული</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        დადასტურებული თანხა (GEL)
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1">
                        {(accountantData.metrics?.totalConfirmedGEL ?? 182400).toLocaleString()} ₾
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">საბანკო გადარიცხვები</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        ვერიფიკაციის სისწრაფე
                      </div>
                      <div className="text-xl font-bold text-blue-600 mt-1">~1.4 საათი</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">საშუალო დრო დამუშავებამდე</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        ხარვეზი / უარყოფა (Rejection)
                      </div>
                      <div className="text-xl font-bold text-amber-600 mt-1">4.2%</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">არასწორი ან ყალბი ქვითრები</div>
                    </div>
                  </div>

                  {/* Accountant Verification Workload & Receipts Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">
                        ბუღალტრის მიერ დამუშავებული გადახდის ქვითრები
                      </div>
                      <span className="text-[11px] text-slate-500">
                        საბანკო ქვითრების შედარება და საქმის ბალანსის განულება
                      </span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">ქვითრის N</th>
                          <th className="py-3 px-4">დებიტორი</th>
                          <th className="py-3 px-4">კრედიტორი</th>
                          <th className="py-3 px-4">თანხა</th>
                          <th className="py-3 px-4">თარიღი</th>
                          <th className="py-3 px-4">სტატუსი</th>
                          <th className="py-3 px-4">დაადასტურა</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(accountantData.receipts?.length
                          ? accountantData.receipts.slice(0, 8)
                          : [
                              {
                                receiptNumber: 'RCP-2024-8901',
                                debtorName: 'შპს ევრო ტრანსი',
                                creditorName: 'სს თიბისი ბანკი',
                                amount: 8400,
                                paymentDate: '2024-10-24',
                                status: 'CONFIRMED_BY_ACCOUNTANT',
                                confirmedByUserName: 'მთავარი ბუღალტერი (ეკა)',
                              },
                              {
                                receiptNumber: 'RCP-2024-8902',
                                debtorName: 'გიორგი ალავიძე',
                                creditorName: 'შპს მიკრო კრედიტი',
                                amount: 1250,
                                paymentDate: '2024-10-23',
                                status: 'CONFIRMED_BY_ACCOUNTANT',
                                confirmedByUserName: 'მთავარი ბუღალტერი (ეკა)',
                              },
                              {
                                receiptNumber: 'RCP-2024-8903',
                                debtorName: 'სოფიო ბარათაშვილი',
                                creditorName: 'სს საქართველოს ბანკი',
                                amount: 3200,
                                paymentDate: '2024-10-22',
                                status: 'CONFIRMED_BY_ACCOUNTANT',
                                confirmedByUserName: 'მთავარი ბუღალტერი (ეკა)',
                              },
                            ]
                        ).map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">
                              {r.receiptNumber}
                            </td>
                            <td className="py-3 px-4 text-slate-800">{r.debtorName}</td>
                            <td className="py-3 px-4 text-slate-600">{r.creditorName}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {Number(r.amount || 0).toLocaleString()} ₾
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {r.paymentDate?.split('T')[0] || '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                დამოწმებულია
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {r.confirmedByUserName || 'ბუღალტერი'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 4: ⚠️ რისკ ზონა (RISK ZONE SPACE - 6 MONTHS BEFORE 3 YEARS) */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'risk_zone' && (
            <div className="space-y-6">
              {/* Risk Zone Alert Banner */}
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="p-2 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5">
                    <ShieldAlert className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-rose-950">
                      სესხების რისკ ზონა — 3-წლიანი ხანდაზმულობის ზღვარი
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
                      ამ სივრცეში ავტომატურად ხვდება ყველა ის სესხი, რომლის 3-წლიანი
                      ხანდაზმულობის ვადა იწურება მომდევნო 6 თვის განმავლობაში (დარჩენილია &lt; 180 დღე,
                      ვადაგადაცილება &gt; 900 დღე). დროული სამართლებრივი რეაგირების გარეშე
                      მოთხოვნის უფლება იურიდიულად გაუქმდება.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-rose-700 font-medium">საფრთხის ქვეშ მყოფი თანხა:</div>
                    <div className="text-xl font-black text-rose-900">
                      {riskSummary.totalAmountGel.toLocaleString()} ₾
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-sm shadow-xs">
                    {riskZoneClaims.length} სესხი
                  </div>
                </div>
              </div>

              {/* Risk Zone Claims Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">
                    რისკ ზონაში არსებული საქმეები (ვადაგადაცილება 900 — 1095 დღე)
                  </div>
                  <span className="text-[11px] text-slate-500">
                    კრიტიკული: &lt; 30 დღე | მაღალი: &lt; 60 დღე | გაფრთხილება: &lt; 180 დღე
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">საქმის N</th>
                        <th className="py-3 px-4">დებიტორი</th>
                        <th className="py-3 px-4">პირადი N / საიდენტ.</th>
                        <th className="py-3 px-4">კრედიტორი</th>
                        <th className="py-3 px-4">თანხა</th>
                        <th className="py-3 px-4">ვადაგადაცილება</th>
                        <th className="py-3 px-4">დარჩენილი დრო</th>
                        <th className="py-3 px-4">დონე</th>
                        <th className="py-3 px-4 text-right">ოპერატიული ქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {riskZoneClaims.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            ამ ეტაპზე რისკ ზონაში (ხანდაზმულობამდე &lt; 6 თვე) სესხები არ ფიქსირდება!
                          </td>
                        </tr>
                      ) : (
                        riskZoneClaims.map((claim) => (
                          <tr key={claim.id} className="hover:bg-rose-50/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              #{claim.caseNumber}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {claim.debtorName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {claim.personalId}
                            </td>
                            <td className="py-3 px-4 text-slate-700">{claim.creditorName}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {claim.amount.toLocaleString()} ₾
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono">
                              {claim.daysOverdue} დღე
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  claim.daysRemaining <= 30
                                    ? 'bg-rose-100 text-rose-800'
                                    : claim.daysRemaining <= 60
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
                                    : 'bg-yellow-500 text-white'
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
                              <button
                                onClick={() => handleOpenDispatch(claim)}
                                className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded border border-rose-300 transition flex items-center gap-1 ml-auto"
                              >
                                <Gavel className="w-3.5 h-3.5" />
                                <span>იურისტისთვის გადაცემა</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ====================================================================== */}
      {/* URGENT WARNING MODAL (POPS UP ON ENTRY IF RISK ZONE LOANS EXIST) */}
      {/* ====================================================================== */}
      {isRiskModalOpen && riskZoneClaims.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-rose-300 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-rose-100 animate-bounce" />
                <div>
                  <h3 className="font-black text-base text-white tracking-wide">
                    ყურადღება! რისკ ზონაშია {riskZoneClaims.length} სესხი!
                  </h3>
                  <p className="text-xs text-rose-100">
                    3-წლიანი ხანდაზმულობის ვადა იწურება 6 თვეში (&lt; 180 დღე)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRiskModalOpen(false);
                  setHasDismissedRiskModal(true);
                }}
                className="p-1 rounded-lg hover:bg-rose-700 text-rose-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 text-rose-900 leading-relaxed">
                <strong>გაფრთხილება ანალიტიკოსს:</strong> საქართველოს სამოქალაქო კოდექსის
                მიხედვით, მოთხოვნის ხანდაზმულობის საერთო ვადა შეადგენს 3 წელს (1095 დღე).
                ქვემოთ ჩამოთვლილ სესხებს გასული აქვს 900+ დღე. დაუყოვნებლივ გადასცეს
                იურიდიულ დეპარტამენტს სარჩელის ან უზრუნველყოფის მოსამზადებლად.
              </div>

              {/* Table of Urgent Cases */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">საქმე</th>
                      <th className="py-2.5 px-3">დებიტორი</th>
                      <th className="py-2.5 px-3">კრედიტორი</th>
                      <th className="py-2.5 px-3">თანხა</th>
                      <th className="py-2.5 px-3">დარჩენილია</th>
                      <th className="py-2.5 px-3 text-right">ქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riskZoneClaims.slice(0, 5).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          #{c.caseNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {c.debtorName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{c.creditorName}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {c.amount.toLocaleString()} ₾
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 font-mono">
                            {c.daysRemaining} დღე
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setIsRiskModalOpen(false);
                              handleOpenDispatch(c);
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-medium"
                          >
                            გადაცემა
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                სულ საფრთხის ქვეშ: {riskSummary.totalAmountGel.toLocaleString()} ₾
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsRiskModalOpen(false);
                    setHasDismissedRiskModal(true);
                    setActiveTab('risk_zone');
                  }}
                  className="px-3.5 py-2 font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition"
                >
                  ყველას ნახვა რისკ ზონაში ({riskZoneClaims.length})
                </button>
                <button
                  onClick={() => {
                    setIsRiskModalOpen(false);
                    setHasDismissedRiskModal(true);
                  }}
                  className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                >
                  გავეცანი / დახურვა
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TASK DISPATCH MODAL (DIRECT REFERRAL TO LEGAL) */}
      {/* ====================================================================== */}
      {dispatchModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Gavel className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  საქმის გადაცემა იურიდიულ დეპარტამენტს
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalClaim(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {dispatchSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-sm">
                  საქმე წარმატებით გადაეცა იურისტს!
                </h4>
                <p className="text-xs text-slate-500">
                  დავალება გაიგზავნა პრიორიტეტით: URGENT (სასწრაფო)
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    საქმე და დებიტორი:
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                    #{dispatchModalClaim.caseNumber} — {dispatchModalClaim.debtorName} (
                    {dispatchModalClaim.amount.toLocaleString()} ₾)
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    პასუხისმგებელი იურისტი:
                  </label>
                  <select
                    value={selectedLawyerId}
                    onChange={(e) => setSelectedLawyerId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    {staffOptions
                      .filter((s) => s.role === 'LEGAL' || !s.role)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.email ? `(${l.email})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    დავალების ინსტრუქცია იურისტს:
                  </label>
                  <textarea
                    rows={4}
                    value={dispatchInstructions}
                    onChange={(e) => setDispatchInstructions(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDispatchModalClaim(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    გაუქმება
                  </button>
                  <button
                    onClick={handleConfirmDispatch}
                    disabled={isDispatching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isDispatching ? 'გაგზავნა...' : 'დავალების გადაცემა'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* PRINT STYLES FOR CLEAN PDF EXPORT */}
      {/* ====================================================================== */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          header,
          .print\\:hidden,
          aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
