import { apiFetch } from './apiClient';
import { 
  DebtorRecord, 
  DebtorLiabilityItem, 
  CreditorKPIs, 
  CreditorClaim, 
  MacroIndicator, 
  DebtAgingBucket, 
  SectorRisk,
  LegalCase,
  DetailedLegalCase,
  LegalStats,
  CallQueueItem,
  CallInteractionLog,
  FieldVisitTask,
  Employee,
  ContactPersonInfo,
  ContactInquiry
} from '@/types';

// ==========================================
// REGISTRY SERVICE
// ==========================================
export const registryService = {
  async search(query: string): Promise<DebtorRecord[]> {
    try {
      return await apiFetch<DebtorRecord[]>(`/api/v1/analyst/debtors-registry?search=${encodeURIComponent(query)}`);
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<DebtorRecord | undefined> {
    try {
      const items = await apiFetch<DebtorRecord[]>(`/api/v1/analyst/debtors-registry?search=${encodeURIComponent(id)}`);
      return items.find((d: any) => d.id === id || d.personalId === id || d.taxId === id);
    } catch {
      return undefined;
    }
  }
};

// ==========================================
// CREDITOR SERVICE
// ==========================================
export const creditorService = {
  async getKPIs(): Promise<CreditorKPIs> {
    try {
      const data = await apiFetch<any>('/api/v1/creditor/my-claims');
      return data?.kpis || {
        totalPrincipal: 0,
        totalRecovered: 0,
        recoveryRate: 0,
        activeClaimsCount: 0,
        activeDebtorsCount: 0,
      } as any;
    } catch {
      return {
        totalPrincipal: 0,
        totalRecovered: 0,
        recoveryRate: 0,
        activeClaimsCount: 0,
        activeDebtorsCount: 0,
      } as any;
    }
  },

  async getClaims(): Promise<CreditorClaim[]> {
    try {
      const data = await apiFetch<any>('/api/v1/creditor/my-claims');
      return data?.claims || [];
    } catch {
      return [];
    }
  }
};

// ==========================================
// DEBTOR SERVICE
// ==========================================
export const debtorService = {
  async getActiveProfile(): Promise<DebtorRecord | null> {
    try {
      return await apiFetch<DebtorRecord>('/api/v1/auth/me');
    } catch {
      return null;
    }
  },

  async getLiabilities(): Promise<DebtorLiabilityItem[]> {
    try {
      const res = await apiFetch<any>('/api/v1/debtor/my-liabilities');
      return res?.claims || [];
    } catch {
      return [];
    }
  },

  async submitPayment(liabilityId: string, amount: number): Promise<{ success: boolean; transactionId: string }> {
    const res = await apiFetch<any>('/api/v1/payments/submit-receipt', {
      method: 'POST',
      body: JSON.stringify({ claimId: liabilityId, amount })
    });
    return { success: true, transactionId: res?.receiptNumber || res?.id || '' };
  },

  async submitDispute(liabilityId: string, reason: string): Promise<{ success: boolean; disputeId: string }> {
    const res = await apiFetch<any>(`/api/v1/debtor/claims/${liabilityId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return { success: true, disputeId: res?.id || '' };
  }
};

// ==========================================
// ANALYTICS SERVICE
// ==========================================
export const analyticsService = {
  async getMacroIndicators(): Promise<MacroIndicator[]> {
    try {
      return await apiFetch<MacroIndicator[]>('/api/analytics/macro');
    } catch {
      return [];
    }
  },

  async getAgingBuckets(): Promise<DebtAgingBucket[]> {
    try {
      return await apiFetch<DebtAgingBucket[]>('/api/analytics/aging');
    } catch {
      return [];
    }
  },

  async getSectorRisks(): Promise<SectorRisk[]> {
    try {
      return await apiFetch<SectorRisk[]>('/api/analytics/sectors');
    } catch {
      return [];
    }
  }
};

// ==========================================
// LEGAL SERVICE
// ==========================================
export const legalService = {
  async getCases(params?: {
    stage?: string;
    tab?: string;
    search?: string;
    priority?: string;
  }): Promise<DetailedLegalCase[]> {
    try {
      const q = new URLSearchParams();
      if (params?.stage) q.append('stage', params.stage);
      if (params?.tab) q.append('tab', params.tab);
      if (params?.search) q.append('search', params.search);
      if (params?.priority) q.append('priority', params.priority);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return await apiFetch<DetailedLegalCase[]>(`/api/v1/legal/cases${queryStr}`);
    } catch (err) {
      console.warn('[legalService.getCases] Fetch failed:', err);
      return [];
    }
  },

  async getCaseById(id: string): Promise<DetailedLegalCase | null> {
    try {
      return await apiFetch<DetailedLegalCase>(`/api/v1/legal/cases/${id}`);
    } catch (err) {
      console.warn(`[legalService.getCaseById] Fetch ${id} failed:`, err);
      return null;
    }
  },

  async getStats(): Promise<LegalStats> {
    try {
      return await apiFetch<LegalStats>('/api/v1/legal/stats');
    } catch (err) {
      console.warn('[legalService.getStats] Fetch failed:', err);
      return {
        activeCases: 0,
        totalDisputedAmount: 0,
        successfulSettlementRate: 0,
        urgentDeadlinesCount: 0,
        countsByStage: {
          all: 0,
          court: 0,
          lawsuit: 0,
          settlement: 0,
          enforcement: 0,
          warning: 0,
          closed: 0,
        },
      };
    }
  },

  async updateCase(
    id: string,
    data: {
      stage?: string;
      legalOpinion?: string;
      checklistWarningSent?: boolean;
      checklistLawsuitDrafted?: boolean;
      checklistDutyPaid?: boolean;
      courtDutyFee?: number;
      hasSequestration?: boolean;
      settlementTerms?: string;
      nextHearingDate?: string;
      deadlineDate?: string;
      priority?: string;
    }
  ): Promise<DetailedLegalCase | null> {
    try {
      return await apiFetch<DetailedLegalCase>(`/api/v1/legal/cases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error(`[legalService.updateCase] Update ${id} failed:`, err);
      return null;
    }
  },

  async addTimelineEvent(
    id: string,
    event: {
      actionType: string;
      description: string;
      department?: string;
    }
  ): Promise<any> {
    try {
      return await apiFetch(`/api/v1/legal/cases/${id}/timeline`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (err) {
      console.error(`[legalService.addTimelineEvent] Failed:`, err);
      return null;
    }
  },

  async addDocument(
    id: string,
    doc: {
      title: string;
      documentType: string;
      fileUrl: string;
      fileSize?: string;
      isVerified?: boolean;
    }
  ): Promise<any> {
    try {
      return await apiFetch(`/api/v1/legal/cases/${id}/documents`, {
        method: 'POST',
        body: JSON.stringify(doc),
      });
    } catch (err) {
      console.error(`[legalService.addDocument] Failed:`, err);
      return null;
    }
  },
};

// ==========================================
// CRM SERVICE
// ==========================================
export const crmService = {
  async getCallQueue(): Promise<CallQueueItem[]> {
    try {
      return await apiFetch<CallQueueItem[]>('/api/v1/crm/queue');
    } catch {
      return [];
    }
  },

  async getCallLogs(): Promise<CallInteractionLog[]> {
    try {
      return await apiFetch<CallInteractionLog[]>('/api/crm/logs');
    } catch {
      return [];
    }
  },

  async logInteraction(log: Partial<CallInteractionLog>): Promise<{ success: boolean }> {
    try {
      return await apiFetch('/api/v1/crm/call-log', {
        method: 'POST',
        body: JSON.stringify(log)
      });
    } catch {
      return { success: false };
    }
  }
};

// ==========================================
// FIELD OFFICER SERVICE
// ==========================================
export const fieldOfficerService = {
  async getTasks(): Promise<FieldVisitTask[]> {
    try {
      return await apiFetch<FieldVisitTask[]>('/api/v1/visits/tasks');
    } catch {
      return [];
    }
  },

  async completeTask(taskId: string, outcome: { notes: string; signature: string }): Promise<{ success: boolean }> {
    try {
      return await apiFetch(`/api/v1/visits/tasks/${taskId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ status: 'COMPLETED', notes: outcome.notes, signatureUrl: outcome.signature })
      });
    } catch {
      return { success: false };
    }
  }
};

// ==========================================
// HR SERVICE
// ==========================================
export const hrService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      return await apiFetch<Employee[]>('/api/v1/ops/staff');
    } catch {
      return [];
    }
  }
};

// ==========================================
// CONTACT SERVICE
// ==========================================
export const contactService = {
  async submitInquiry(data: ContactInquiry): Promise<{ success: boolean; ticketNumber: string }> {
    try {
      return await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      return { success: true, ticketNumber: `TCK-${Math.floor(100000 + Math.random() * 900000)}` };
    }
  }
};

// ==========================================
// BLOG & NEWS CMS SERVICE (CRM PUBLISHING)
// ==========================================
export const INITIAL_BLOG_POSTS: import('@/types').BlogPost[] = [];

export const blogService = {
  async getPosts(): Promise<import('@/types').BlogPost[]> {
    try {
      return await apiFetch<import('@/types').BlogPost[]>('/api/v1/crm/blog');
    } catch {
      return [];
    }
  },

  async createPost(post: Omit<import('@/types').BlogPost, 'id' | 'viewsCount' | 'publishedAt'>): Promise<import('@/types').BlogPost> {
    return await apiFetch<import('@/types').BlogPost>('/api/v1/crm/blog', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    return await apiFetch(`/api/v1/crm/blog/${id}`, { method: 'DELETE' });
  }
};

// ==========================================
// AUTH & RS.GE INTEGRATION SERVICE
// ==========================================
export interface AuthUser {
  id: string;
  email: string;
  personalId: string;
  entityType: 'PHYSICAL' | 'LEGAL';
  role: 'ADMIN' | 'CREDITOR' | 'DEBTOR' | 'ANALYST' | 'LEGAL' | 'OPERATOR' | 'FIELD_OFFICER' | 'ACCOUNTANT' | 'REGULAR';
  status?: string;
  phone?: string;
  isRsVerified: boolean;
  companyProfile?: any;
  individualProfile?: any;
  staffProfile?: any;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  rsGeInfo?: any;
  isNewUser?: boolean;
}

export const authService = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.saveSession(res.user, res.tokens);
    return res;
  },

  async register(data: {
    email: string;
    password: string;
    personalId: string;
    entityType: 'PHYSICAL' | 'LEGAL';
    role?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    actualAddress?: string;
    legalAddress?: string;
    companyName?: string;
    legalForm?: string;
    directorName?: string;
    directorLastName?: string;
    directorPin?: string;
    directorPhone?: string;
    directorEmail?: string;
  }): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.saveSession(res.user, res.tokens);
    return res;
  },

  async rsGeVerify(authKey: string, role?: string): Promise<AuthResponse> {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/rs-ge/verify', {
      method: 'POST',
      body: JSON.stringify({ authKey, role }),
    });
    this.saveSession(res.user, res.tokens);
    return res;
  },

  async getTaxpayerInfo(identCode: string): Promise<any> {
    return await apiFetch(`/api/v1/auth/rs-ge/taxpayer/${identCode}`);
  },

  async getRsGeStatus(): Promise<{ sandboxMode: boolean; message: string }> {
    return await apiFetch<{ sandboxMode: boolean; message: string }>('/api/v1/auth/rs-ge/status');
  },

  async getMe(): Promise<AuthUser> {
    return await apiFetch<AuthUser>('/api/v1/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    } finally {
      this.clearSession();
    }
  },

  saveSession(user: AuthUser, tokens: { accessToken: string; refreshToken: string }) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('debitinfo_access_token', tokens.accessToken);
      localStorage.setItem('debitinfo_refresh_token', tokens.refreshToken);
      localStorage.setItem('debitinfo_user', JSON.stringify(user));
      document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `user_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    }
  },

  clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debitinfo_access_token');
      localStorage.removeItem('debitinfo_refresh_token');
      localStorage.removeItem('debitinfo_user');
      document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
    }
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('debitinfo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('debitinfo_access_token');
  },

  getPortalRouteForRole(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '/ops';
      case 'LEGAL':
        return '/legal';
      case 'ANALYST':
        return '/analyst';
      case 'OPERATOR':
        return '/crm';
      case 'FIELD_OFFICER':
        return '/field-officer';
      case 'ACCOUNTANT':
        return '/accountant';
      case 'CREDITOR':
      case 'DEBTOR':
      case 'REGULAR':
      default:
        return '/dashboard';
    }
  },

  startImpersonation(
    targetUser: AuthUser,
    tokens: { accessToken: string; refreshToken: string },
    returnUrl = '/analyst/staff',
  ) {
    if (typeof window !== 'undefined') {
      const origUser = this.getCurrentUser();
      const origToken = this.getToken();
      const origRefresh = localStorage.getItem('debitinfo_refresh_token') || '';
      localStorage.setItem(
        'debitinfo_impersonation_original',
        JSON.stringify({
          user: origUser,
          tokens: { accessToken: origToken, refreshToken: origRefresh },
          returnUrl,
          targetUser,
        }),
      );
      this.saveSession(targetUser, tokens);
    }
  },

  stopImpersonation(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('debitinfo_impersonation_original');
      if (stored) {
        try {
          const orig = JSON.parse(stored);
          if (orig.user && orig.tokens) {
            this.saveSession(orig.user, orig.tokens);
          }
          localStorage.removeItem('debitinfo_impersonation_original');
          return orig.returnUrl || '/analyst/staff';
        } catch (e) {
          console.error('Error stopping impersonation:', e);
        }
      }
    }
    return '/analyst/staff';
  },

  isImpersonating(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('debitinfo_impersonation_original');
  },

  getImpersonationInfo(): { isImpersonating: boolean; originalUser: any | null; targetUser: any | null; returnUrl: string } {
    if (typeof window === 'undefined') return { isImpersonating: false, originalUser: null, targetUser: null, returnUrl: '/analyst/staff' };
    const stored = localStorage.getItem('debitinfo_impersonation_original');
    if (!stored) return { isImpersonating: false, originalUser: null, targetUser: null, returnUrl: '/analyst/staff' };
    try {
      const parsed = JSON.parse(stored);
      return {
        isImpersonating: true,
        originalUser: parsed.user || null,
        targetUser: parsed.targetUser || null,
        returnUrl: parsed.returnUrl || '/analyst/staff',
      };
    } catch {
      return { isImpersonating: false, originalUser: null, targetUser: null, returnUrl: '/analyst/staff' };
    }
  },

  async getObservationStatus(): Promise<{
    isBeingObserved: boolean;
    observer: {
      analystId: string;
      analystName: string;
      analystEmail: string;
      startedAt: string;
    } | null;
  }> {
    try {
      return await apiFetch('/api/v1/auth/observation-status');
    } catch {
      return { isBeingObserved: false, observer: null };
    }
  },

  async sendObservationHeartbeat(data: {
    targetUserId?: string;
    analystName?: string;
    analystEmail?: string;
  }): Promise<any> {
    try {
      return await apiFetch('/api/v1/auth/observation-heartbeat', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return null;
    }
  },

  async stopObservationOnBackend(targetUserId?: string): Promise<any> {
    try {
      return await apiFetch('/api/v1/auth/observation-stop', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
      });
    } catch {
      return null;
    }
  },
};

// ==========================================
// REAL BACKEND CLAIMS & LIABILITIES SERVICES
// ==========================================
export const debtorBackendService = {
  async getMyLiabilities(): Promise<{
    summary: {
      totalInitial: number;
      totalRemaining: number;
      totalPaid: number;
      activeClaimsCount: number;
      activeDisputesCount: number;
      rating: string;
      riskScore: number;
    };
    claims: any[];
  }> {
    return await apiFetch('/api/v1/debtor/my-liabilities');
  },

  async openDispute(claimId: string, reason: string): Promise<any> {
    return await apiFetch(`/api/v1/debtor/claims/${claimId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }
};

export interface ClaimStatusConfigItem {
  code: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  colorHex: string;
  description?: string;
}

export const CLAIM_STATUS_CONFIGS: Record<string, ClaimStatusConfigItem> = {
  ACTIVE: {
    code: 'ACTIVE',
    label: 'აქტიური',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    colorHex: '#059669',
  },
  OVERDUE: {
    code: 'OVERDUE',
    label: 'ვადაგადაცილებული',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    colorHex: '#d97706',
  },
  IN_LITIGATION: {
    code: 'IN_LITIGATION',
    label: 'სამართლებრივი',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    colorHex: '#e11d48',
  },
  SETTLED: {
    code: 'SETTLED',
    label: 'დაფარული',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    colorHex: '#64748b',
  },
  CLEAN: {
    code: 'CLEAN',
    label: 'სუფთა',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    colorHex: '#10b981',
  },
  DISPUTED: {
    code: 'DISPUTED',
    label: 'სადავო',
    bgClass: 'bg-purple-100',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    colorHex: '#7c3aed',
  },
  RESTRUCTURED: {
    code: 'RESTRUCTURED',
    label: 'გრაფიკი',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    colorHex: '#2563eb',
  },
};

export function getClaimStatusBadge(
  statusCode: string,
  dynamicConfigs?: Record<string, ClaimStatusConfigItem>
): ClaimStatusConfigItem {
  const normalized = statusCode?.toUpperCase();
  if (dynamicConfigs && dynamicConfigs[normalized]) {
    return dynamicConfigs[normalized];
  }
  if (CLAIM_STATUS_CONFIGS[normalized]) {
    return CLAIM_STATUS_CONFIGS[normalized];
  }
  // Fallback for custom or Georgian text labels
  if (statusCode === 'აქტიური') return CLAIM_STATUS_CONFIGS.ACTIVE;
  if (statusCode === 'ვადაგადაცილებული') return CLAIM_STATUS_CONFIGS.OVERDUE;
  if (statusCode === 'სამართლებრივი') return CLAIM_STATUS_CONFIGS.IN_LITIGATION;
  if (statusCode === 'დაფარული') return CLAIM_STATUS_CONFIGS.SETTLED;
  if (statusCode === 'გრაფიკი') return CLAIM_STATUS_CONFIGS.RESTRUCTURED;
  if (statusCode === 'სადავო') return CLAIM_STATUS_CONFIGS.DISPUTED;

  return {
    code: statusCode,
    label: statusCode,
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    colorHex: '#64748b',
  };
}

export const creditorBackendService = {
  async getMyClaims(): Promise<{
    kpis: {
      totalPrincipal: number;
      totalRecovered: number;
      recoveryRate: number;
      activeClaimsCount: number;
      activeDebtorsCount: number;
    };
    statusConfigs?: Record<string, ClaimStatusConfigItem>;
    claims: any[];
  }> {
    return await apiFetch('/api/v1/creditor/my-claims');
  },

  async getStatusConfigs(): Promise<ClaimStatusConfigItem[]> {
    return await apiFetch('/api/v1/claims/status-configs');
  },

  async importDebtorsBatch(debtors: any[]): Promise<any> {
    return await apiFetch('/api/v1/creditor/debtors/import-batch', {
      method: 'POST',
      body: JSON.stringify({ debtors }),
    });
  },

  async getUploadedDebtors(): Promise<any[]> {
    return await apiFetch('/api/v1/creditor/uploaded-debtors');
  },
};

export const analystBackendService = {
  async getDebtorsRegistry(params?: Record<string, any>): Promise<any[]> {
    const query = params && Object.keys(params).length > 0 ? `?${new URLSearchParams(params as any).toString()}` : '';
    return await apiFetch(`/api/v1/analyst/debtors-registry${query}`);
  },

  async getCreditorsRegistry(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/creditors-registry');
  },

  async getExcelDebtors(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/debtors-registry');
  },

  async getExcelCreditors(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/creditors-registry');
  },

  async getStaffOptions(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/staff-options');
  },

  async getClaimsOptions(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/claims-options');
  },

  async getWorkloadStats(): Promise<any> {
    return await apiFetch('/api/v1/analyst/workload-stats');
  },

  async dispatchTask(data: {
    staffUserId: string;
    claimId?: string;
    claimIds?: string[];
    priority?: string;
    taskType?: string;
    instructions?: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/analyst/dispatch-task', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPendingDebtors(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/pending-debtors');
  },

  async verifyDebtor(id: string): Promise<any> {
    return await apiFetch(`/api/v1/analyst/verify-debtor/${id}`, {
      method: 'POST',
    });
  },

  async uploadCreditorDocument(file: File, category?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    const token = authService.getToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/v1/analyst/upload-document`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    return json?.data || json;
  },

  async registerCreditor(data: Record<string, any>): Promise<any> {
    return await apiFetch('/api/v1/analyst/register-creditor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async addDebtorsToCreditor(creditorTaxId: string, debtors: any[]): Promise<any> {
    return await apiFetch(`/api/v1/analyst/creditors/${creditorTaxId}/debtors`, {
      method: 'POST',
      body: JSON.stringify({ debtors }),
    });
  },

  // --------------------------------------------------
  // SMART BI & MULTI-PARAMETER ANALYTICS
  // --------------------------------------------------
  async getBiMetadata(): Promise<any> {
    return await apiFetch('/api/v1/analyst/bi/metadata');
  },

  async queryBi(filters: any): Promise<any> {
    return await apiFetch('/api/v1/analyst/bi/query', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  async getSchedulesComparison(params?: { dateFrom?: string; dateTo?: string; compareYoY?: boolean }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.append('dateTo', params.dateTo);
    if (params?.compareYoY) qs.append('compareYoY', 'true');
    return await apiFetch(`/api/v1/analyst/bi/schedules-comparison${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  async getLegalPerformance(params?: { dateFrom?: string; dateTo?: string; lawyerId?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.append('dateTo', params.dateTo);
    if (params?.lawyerId) qs.append('lawyerId', params.lawyerId);
    return await apiFetch(`/api/v1/analyst/bi/legal-performance${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  async getVisitorsPerformance(params?: { dateFrom?: string; dateTo?: string; officerId?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.append('dateTo', params.dateTo);
    if (params?.officerId) qs.append('officerId', params.officerId);
    return await apiFetch(`/api/v1/analyst/bi/visitors-performance${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  async getCallCenterPerformance(params?: {
    dateFrom?: string;
    dateTo?: string;
    hourFrom?: number;
    hourTo?: number;
    operatorId?: string;
    teamLeadId?: string;
  }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.append('dateTo', params.dateTo);
    if (params?.hourFrom !== undefined) qs.append('hourFrom', String(params.hourFrom));
    if (params?.hourTo !== undefined) qs.append('hourTo', String(params.hourTo));
    if (params?.operatorId) qs.append('operatorId', params.operatorId);
    if (params?.teamLeadId) qs.append('teamLeadId', params.teamLeadId);
    return await apiFetch(`/api/v1/analyst/bi/call-center-performance${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  async getStatuteLimitations(params?: { monthsLookback?: number; monthsLookahead?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.monthsLookback) qs.append('monthsLookback', String(params.monthsLookback));
    if (params?.monthsLookahead) qs.append('monthsLookahead', String(params.monthsLookahead));
    return await apiFetch(`/api/v1/analyst/bi/statute-limitations${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  async getStaffRegistry(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/staff-registry');
  },

  async addStaffRecommendation(data: {
    staffUserId: string;
    rating?: string;
    title?: string;
    comment: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/analyst/staff-recommendation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async impersonateStaff(userId: string): Promise<any> {
    return await apiFetch(`/api/v1/analyst/impersonate/${userId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // --------------------------------------------------
  // WRITTEN-OFF DEBTS REGISTRY (ჩამოწერილი ვალების რეესტრი)
  // --------------------------------------------------
  async getWrittenOffDebts(filters?: {
    search?: string;
    category?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ items: any[]; stats: any }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch<{ items: any[]; stats: any }>(`/api/v1/analyst/written-off-debts${qs}`);
  },

  async createWrittenOffDebt(data: {
    caseNumber?: string;
    debtorName: string;
    personalId: string;
    entityType?: string;
    creditorName: string;
    creditorTaxId?: string;
    claimId?: string;
    originalAmount: number;
    writtenOffAmount: number;
    currency?: string;
    reasonCategory: string;
    reasonDescription: string;
    actNumber?: string;
    proofDocumentName?: string;
    proofDocumentUrl?: string;
    proofDocumentType?: string;
    writtenOffByName?: string;
    writtenOffDate?: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/analyst/written-off-debts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async annulWrittenOffDebt(id: string, reason: string): Promise<any> {
    return await apiFetch(`/api/v1/analyst/written-off-debts/${id}/annul`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

export const visitsBackendService = {
  async getTasks(status?: string, district?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (district && district !== 'ALL') params.append('district', district);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/api/v1/visits/tasks${qs}`);
  },

  async getMetrics(): Promise<any> {
    return await apiFetch('/api/v1/visits/metrics');
  },

  async getTaskById(id: string): Promise<any> {
    return await apiFetch(`/api/v1/visits/tasks/${id}`);
  },

  async completeTask(
    id: string,
    data: {
      status: string;
      notes?: string;
      signatureUrl?: string;
      photos?: string[];
      collectedAmount?: number;
    }
  ): Promise<any> {
    return await apiFetch(`/api/v1/visits/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createTask(data: any): Promise<any> {
    return await apiFetch('/api/v1/visits/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const crmBackendService = {
  async getQueue(search?: string, priority?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (priority && priority !== 'ALL') params.append('priority', priority);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/api/v1/crm/queue${qs}`);
  },

  async getClaimForCall(id: string): Promise<any> {
    return await apiFetch(`/api/v1/crm/claims/${id}`);
  },

  async logCall(data: {
    claimId: string;
    disposition: string;
    promisedDate?: string;
    promisedAmount?: number;
    notes: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/crm/call-log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getStats(): Promise<any> {
    return await apiFetch('/api/v1/crm/stats');
  },
};

export const opsBackendService = {
  async getStaff(): Promise<any[]> {
    return await apiFetch('/api/v1/ops/staff');
  },

  async createStaff(data: {
    email: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    personalId: string;
    legalAddress?: string;
    actualAddress?: string;
    role: 'ADMIN' | 'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL' | 'ACCOUNTANT';
    department?: string;
    phone?: string;
    password?: string;
    contactPerson?: ContactPersonInfo;
  }): Promise<any> {
    return await apiFetch('/api/v1/ops/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStaff(
    id: string,
    data: {
      role?: string;
      department?: string;
      legalAddress?: string;
      actualAddress?: string;
      status?: string;
      phone?: string;
      contactPerson?: ContactPersonInfo;
    }
  ): Promise<any> {
    return await apiFetch(`/api/v1/ops/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteStaff(id: string): Promise<any> {
    return await apiFetch(`/api/v1/ops/staff/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats(): Promise<any> {
    return await apiFetch('/api/v1/ops/stats');
  },
};

// ==========================================
// PAYMENTS & RECEIPT VERIFICATION SERVICE
// ==========================================
export interface PaymentReceiptItem {
  id: string;
  claimId: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  receiptNumber: string;
  receiptFileUrl?: string;
  debtorNotes?: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED_BY_CREDITOR' | 'CONFIRMED_BY_ACCOUNTANT' | 'REJECTED';
  confirmedByRole?: 'CREDITOR' | 'ACCOUNTANT';
  confirmedByUserId?: string;
  confirmedByUserName?: string;
  confirmationReceiptUrl?: string;
  accountantOrderNumber?: string;
  accountantOrderNotes?: string;
  confirmedAt?: string;
  createdAt: string;
  claim?: {
    caseNumber?: string;
    remainingAmount?: number;
    initialAmount?: number;
  };
}

export const paymentsService = {
  async submitDebtorReceipt(data: {
    amount: number;
    paymentDate?: string;
    receiptFileUrl?: string;
    debtorNotes?: string;
    claimId?: string;
  }): Promise<PaymentReceiptItem> {
    return await apiFetch<PaymentReceiptItem>('/api/v1/payments/submit-receipt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDebtorPayments(): Promise<PaymentReceiptItem[]> {
    return await apiFetch<PaymentReceiptItem[]>('/api/v1/payments/debtor');
  },

  async getCreditorPayments(): Promise<{
    receipts: PaymentReceiptItem[];
    metrics: { totalReceipts: number; pendingCount: number; confirmedCount: number };
  }> {
    return await apiFetch<{
      receipts: PaymentReceiptItem[];
      metrics: { totalReceipts: number; pendingCount: number; confirmedCount: number };
    }>('/api/v1/payments/creditor');
  },

  async confirmByCreditor(receiptId: string, confirmationReceiptUrl?: string): Promise<PaymentReceiptItem> {
    return await apiFetch<PaymentReceiptItem>(`/api/v1/payments/${receiptId}/confirm-creditor`, {
      method: 'POST',
      body: JSON.stringify({ confirmationReceiptUrl }),
    });
  },

  async getAccountantPayments(): Promise<{
    receipts: PaymentReceiptItem[];
    metrics: {
      totalCount: number;
      pendingCount: number;
      confirmedByCreditorCount: number;
      confirmedByAccountantCount: number;
      totalConfirmedGEL: number;
    };
  }> {
    return await apiFetch<any>('/api/v1/payments/accountant');
  },

  async confirmByAccountant(receiptId: string, notes?: string): Promise<PaymentReceiptItem> {
    return await apiFetch<PaymentReceiptItem>(`/api/v1/payments/${receiptId}/confirm-accountant`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};
