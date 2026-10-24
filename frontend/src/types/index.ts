// ==========================================
// 1. REGISTRY & DEBTOR TYPES
// ==========================================

export type RiskRating = 'A' | 'B' | 'C';

export interface DebtorRecord {
  id: string;
  name: string;
  personalId: string; // Georgian 11-digit PIN or 9-digit Company Tax ID
  type: 'individual' | 'company';
  address: string;
  phone: string;
  email: string;
  totalDebt: number; // GEL
  overdueAmount: number; // GEL
  currency: 'GEL' | 'USD' | 'EUR';
  status: 'active' | 'in_litigation' | 'settled' | 'clean' | 'disputed';
  rating: RiskRating;
  riskScore: number; // e.g. 720/850 or 0-100
  caseNumber: string;
  lastUpdated: string;
  assignedCurator?: {
    name: string;
    phone: string;
    extension: string;
  };
  rsGeRecordNumber?: string;
}

export interface DebtorLiabilityItem {
  id: string;
  creditorName: string;
  creditorLogo?: string;
  agreementNumber: string;
  initialAmount: number;
  remainingAmount: number;
  penaltyAmount: number;
  daysOverdue: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  status: 'active' | 'overdue' | 'settled' | 'restructured';
}

// ==========================================
// 2. CREDITOR PORTFOLIO TYPES
// ==========================================

export interface CreditorKPIs {
  totalPortfolio: number; // e.g. 14,820,000 GEL
  activeClaimsCount: number; // e.g. 1,420
  recoveredThisMonth: number; // e.g. 430,000 GEL
  recoveryRatePercent: number; // e.g. 68.4%
  litigationCasesCount: number; // e.g. 84
}

export interface CreditorClaim {
  id: string;
  caseNumber: string;
  debtorName: string;
  personalId: string;
  claimAmount: number;
  daysOverdue: number;
  status: 'active' | 'legal' | 'settled' | 'in_negotiation';
  lastActivity: string;
  riskRating: RiskRating;
  curatorName: string;
}

// ==========================================
// 3. ANALYTICS & MACRO DATA TYPES
// ==========================================

export interface MacroIndicator {
  label: string;
  value: string | number;
  changePercent: number;
  isPositive: boolean;
  benchmark: string;
}

export interface DebtAgingBucket {
  period: string; // e.g. '0-30 დღე', '31-60 დღე', '61-90 დღე', '90+ დღე'
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export interface SectorRisk {
  sector: string;
  activeDebt: number;
  defaultProbability: number;
  volumeTrend: 'up' | 'down' | 'stable';
}

// ==========================================
// 4. LEGAL & ENFORCEMENT TYPES
// ==========================================

export interface LegalCase {
  id: string;
  caseNumber: string;
  courtInstance: string; // e.g. 'თბილისის საქალაქო სასამართლო'
  plaintiff: string;
  defendant: string;
  claimAmount: number;
  judgeName: string;
  enforcementOfficer?: string;
  status: 'pre_trial' | 'in_court' | 'decision_enforced' | 'appealed';
  nextHearingDate?: string;
  executionSheetNumber?: string;
  documentsCount: number;
}

export interface DetailedLegalCase {
  id: string;
  caseNumber: string;
  claimId: string;
  claimCaseNumber?: string;
  agreementNumber?: string;
  stage: string; // OFFICIAL_WARNING, LAWSUIT_PREPARATION, COURT_PROCEEDINGS, SETTLEMENT, ENFORCEMENT, CLOSED
  priority: string; // HIGH, MEDIUM, LOW
  status: string;
  courtInstance: string;
  courtCaseNumber?: string;
  judgeName?: string;
  enforcementOfficer?: string;
  courtDutyFee?: number | null;
  hasSequestration: boolean;
  settlementTerms?: string;
  nextHearingDate?: string | null;
  deadlineDate?: string | null;
  executionSheetNumber?: string | null;
  legalOpinion?: string | null;
  checklistWarningSent: boolean;
  checklistLawsuitDrafted: boolean;
  checklistDutyPaid: boolean;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
  debtor: {
    id?: string;
    name: string;
    identification: string;
    isCompany: boolean;
    legalAddress: string;
    actualAddress: string;
    directorName?: string;
    phone?: string;
    email?: string;
    hasMortgage?: boolean;
    hasSequestration?: boolean;
  };
  amounts: {
    totalClaim: number;
    principalAmount: number;
    penaltyAmount: number;
    daysOverdue: number;
    riskRating: string;
    riskScore: number;
    currency: string;
  };
  documents: Array<{
    id: string;
    title: string;
    documentType: string;
    fileUrl: string;
    fileSize?: string;
    isVerified: boolean;
    createdAt: string;
  }>;
  timelineEvents: Array<{
    id: string;
    department: string;
    authorRoleTitle: string;
    actionType: string;
    description: string;
    createdAt: string;
    author?: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  assignedLawyer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface LegalStats {
  activeCases: number;
  totalDisputedAmount: number;
  successfulSettlementRate: number;
  urgentDeadlinesCount: number;
  countsByStage: {
    all: number;
    court: number;
    lawsuit: number;
    settlement: number;
    enforcement: number;
    warning: number;
    closed: number;
  };
}

// ==========================================
// 5. CRM OPERATOR TYPES
// ==========================================

export interface CallQueueItem {
  id: string;
  debtorName: string;
  personalId: string;
  phone: string;
  priority: 'high' | 'medium' | 'normal';
  debtAmount: number;
  lastDisposition: string;
  nextScheduledCall: string;
}

export interface CallInteractionLog {
  id: string;
  timestamp: string;
  operatorName: string;
  disposition: 'promise_to_pay' | 'refused' | 'wrong_number' | 'callback' | 'voicemail';
  promisedDate?: string;
  promisedAmount?: number;
  notes: string;
}

// ==========================================
// 6. FIELD OFFICER TYPES
// ==========================================

export interface FieldVisitTask {
  id: string;
  debtorName: string;
  personalId: string;
  address: string;
  district: string;
  coordinates: { lat: number; lng: number };
  debtAmount: number;
  scheduledTime: string;
  priority: 'urgent' | 'high' | 'regular';
  status: 'pending' | 'completed' | 'rescheduled' | 'unreachable';
  notes?: string;
}

// ==========================================
// 7. HR & ADMIN TYPES
// ==========================================

export interface ContactPersonInfo {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  relationType?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'analyst' | 'legal' | 'operator' | 'field_officer' | 'auditor';
  roleKa: string;
  department: string;
  status: 'active' | 'suspended' | 'on_leave';
  assignedCasesCount: number;
  phone: string;
  joinedDate: string;
  lastActive: string;
  contactPerson?: ContactPersonInfo | null;
}

export interface SystemPermission {
  id: string;
  code: string;
  nameKa: string;
  category: string;
}

// ==========================================
// 8. CONTACT & INQUIRY TYPES
// ==========================================

export interface ContactInquiry {
  fullName: string;
  email: string;
  phone: string;
  department: 'general' | 'creditor' | 'debtor' | 'legal' | 'support';
  subject: string;
  message: string;
  caseNumber?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'registry' | 'payments' | 'disputes' | 'legal';
}

// ==========================================
// 9. BLOG & NEWS CMS TYPES (CRM PUBLISHING)
// ==========================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: 'financial_literacy' | 'credit_risks' | 'tax_updates' | 'legal_mediation' | 'news';
  categoryKa: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  authorName: string;
  authorRole: string;
  published: boolean;
  publishedAt: string;
  viewsCount: number;
  tags: string[];
}
