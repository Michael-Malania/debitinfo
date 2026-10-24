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
import {
  MOCK_DEBTORS,
  MOCK_LIABILITIES,
  MOCK_CREDITOR_KPIS,
  MOCK_CREDITOR_CLAIMS,
  MOCK_MACRO_INDICATORS,
  MOCK_AGING_BUCKETS,
  MOCK_SECTOR_RISKS,
  MOCK_LEGAL_CASES,
  MOCK_CALL_QUEUE,
  MOCK_CALL_LOGS,
  MOCK_FIELD_TASKS,
  MOCK_EMPLOYEES
} from '@/data/mockData';

// ==========================================
// REGISTRY SERVICE
// ==========================================
export const registryService = {
  async search(query: string): Promise<DebtorRecord[]> {
    try {
      return await apiFetch<DebtorRecord[]>(`/api/registry?q=${encodeURIComponent(query)}`);
    } catch {
      const q = query.trim().toLowerCase();
      if (!q) return MOCK_DEBTORS;
      return MOCK_DEBTORS.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.personalId.includes(q) ||
        d.caseNumber.toLowerCase().includes(q)
      );
    }
  },

  async getById(id: string): Promise<DebtorRecord | undefined> {
    try {
      return await apiFetch<DebtorRecord>(`/api/registry/${id}`);
    } catch {
      return MOCK_DEBTORS.find(d => d.id === id || d.personalId === id);
    }
  }
};

// ==========================================
// CREDITOR SERVICE
// ==========================================
export const creditorService = {
  async getKPIs(): Promise<CreditorKPIs> {
    try {
      return await apiFetch<CreditorKPIs>('/api/creditor/kpis');
    } catch {
      return MOCK_CREDITOR_KPIS;
    }
  },

  async getClaims(): Promise<CreditorClaim[]> {
    try {
      return await apiFetch<CreditorClaim[]>('/api/creditor/claims');
    } catch {
      return MOCK_CREDITOR_CLAIMS;
    }
  }
};

// ==========================================
// DEBTOR SERVICE
// ==========================================
export const debtorService = {
  async getActiveProfile(): Promise<DebtorRecord> {
    try {
      return await apiFetch<DebtorRecord>('/api/debtor/profile');
    } catch {
      return MOCK_DEBTORS[0]; // Giorgi Beridze
    }
  },

  async getLiabilities(): Promise<DebtorLiabilityItem[]> {
    try {
      return await apiFetch<DebtorLiabilityItem[]>('/api/debtor/liabilities');
    } catch {
      return MOCK_LIABILITIES;
    }
  },

  async submitPayment(liabilityId: string, amount: number): Promise<{ success: boolean; transactionId: string }> {
    try {
      return await apiFetch('/api/debtor/pay', {
        method: 'POST',
        body: JSON.stringify({ liabilityId, amount })
      });
    } catch {
      return { success: true, transactionId: `TX-${Date.now()}` };
    }
  },

  async submitDispute(liabilityId: string, reason: string): Promise<{ success: boolean; disputeId: string }> {
    try {
      return await apiFetch('/api/debtor/dispute', {
        method: 'POST',
        body: JSON.stringify({ liabilityId, reason })
      });
    } catch {
      return { success: true, disputeId: `DISP-${Date.now()}` };
    }
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
      return MOCK_MACRO_INDICATORS;
    }
  },

  async getAgingBuckets(): Promise<DebtAgingBucket[]> {
    try {
      return await apiFetch<DebtAgingBucket[]>('/api/analytics/aging');
    } catch {
      return MOCK_AGING_BUCKETS;
    }
  },

  async getSectorRisks(): Promise<SectorRisk[]> {
    try {
      return await apiFetch<SectorRisk[]>('/api/analytics/sectors');
    } catch {
      return MOCK_SECTOR_RISKS;
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
        activeCases: 14,
        totalDisputedAmount: 284500,
        successfulSettlementRate: 78,
        urgentDeadlinesCount: 3,
        countsByStage: {
          all: 14,
          court: 6,
          lawsuit: 5,
          settlement: 1,
          enforcement: 1,
          warning: 1,
          closed: 32,
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
      return await apiFetch<CallQueueItem[]>('/api/crm/queue');
    } catch {
      return MOCK_CALL_QUEUE;
    }
  },

  async getCallLogs(): Promise<CallInteractionLog[]> {
    try {
      return await apiFetch<CallInteractionLog[]>('/api/crm/logs');
    } catch {
      return MOCK_CALL_LOGS;
    }
  },

  async logInteraction(log: Partial<CallInteractionLog>): Promise<{ success: boolean }> {
    try {
      return await apiFetch('/api/crm/logs', {
        method: 'POST',
        body: JSON.stringify(log)
      });
    } catch {
      return { success: true };
    }
  }
};

// ==========================================
// FIELD OFFICER SERVICE
// ==========================================
export const fieldOfficerService = {
  async getTasks(): Promise<FieldVisitTask[]> {
    try {
      return await apiFetch<FieldVisitTask[]>('/api/field-officer/tasks');
    } catch {
      return MOCK_FIELD_TASKS;
    }
  },

  async completeTask(taskId: string, outcome: { notes: string; signature: string }): Promise<{ success: boolean }> {
    try {
      return await apiFetch(`/api/field-officer/tasks/${taskId}`, {
        method: 'POST',
        body: JSON.stringify(outcome)
      });
    } catch {
      return { success: true };
    }
  }
};

// ==========================================
// HR SERVICE
// ==========================================
export const hrService = {
  async getEmployees(): Promise<Employee[]> {
    try {
      return await apiFetch<Employee[]>('/api/hr/employees');
    } catch {
      return MOCK_EMPLOYEES;
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
export const INITIAL_BLOG_POSTS: import('@/types').BlogPost[] = [
  {
    id: 'post-1',
    title: 'რა იცვლება ელექტრონულ დეკლარირებასა და დებიტორული დავალიანებების საგადასახადო აღრიცხვაში',
    slug: 'tax-changes-debt-accounting-2024',
    category: 'tax_updates',
    categoryKa: 'საგადასახადო სიახლეები',
    excerpt: 'შემოსავლების სამსახურის (RS.GE) ახალი რეგულაციები და ვადაგადაცილებული მოთხოვნების ჩამოწერის წესები.',
    content: 'საქართველოს საგადასახადო კოდექსში შესული ცვლილებების მიხედვით, უიმედო ვალების აღიარებისა და ჩამოწერის პროცედურები მნიშვნელოვნად გამარტივდა...',
    authorName: 'თეონა პეტრიაშვილი',
    authorRole: 'CRM & მედიაციის სპეციალისტი',
    published: true,
    publishedAt: '2024-10-20',
    viewsCount: 1420,
    tags: ['RS.GE', 'საგადასახადო', 'დებიტორები']
  },
  {
    id: 'post-2',
    title: 'პრაქტიკული გზამკვლევი: დებიტორული დავალიანებების ეფექტური მართვა და პრევენცია',
    slug: 'practical-guide-debt-management-prevention',
    category: 'credit_risks',
    categoryKa: 'საკრედიტო რისკები',
    excerpt: 'როგორ შევამოწმოთ კონტრაგენტის სანდოობა ხელშეკრულების დადებამდე და რა პრევენციული ზომები მივიღოთ.',
    content: 'ბიზნესის უწყვეტობისთვის გადამწყვეტია კონტრაგენტის რისკ-პროფილის გადამოწმება Debitinfo.GE-ის ერთიან ეროვნულ ბაზაში...',
    authorName: 'გიორგი მაისურაძე',
    authorRole: 'საკრედიტო ანალიტიკოსი',
    published: true,
    publishedAt: '2024-10-18',
    viewsCount: 2890,
    tags: ['რისკების მართვა', 'სკორინგი', 'მედიაცია']
  }
];

export const blogService = {
  async getPosts(): Promise<import('@/types').BlogPost[]> {
    try {
      return await apiFetch<import('@/types').BlogPost[]>('/api/blog');
    } catch {
      return INITIAL_BLOG_POSTS;
    }
  },

  async createPost(post: Omit<import('@/types').BlogPost, 'id' | 'viewsCount' | 'publishedAt'>): Promise<import('@/types').BlogPost> {
    const newPost: import('@/types').BlogPost = {
      ...post,
      id: `post-${Date.now()}`,
      viewsCount: 0,
      publishedAt: new Date().toISOString().split('T')[0]
    };
    try {
      return await apiFetch<import('@/types').BlogPost>('/api/crm/blog', {
        method: 'POST',
        body: JSON.stringify(newPost)
      });
    } catch {
      INITIAL_BLOG_POSTS.unshift(newPost);
      return newPost;
    }
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    try {
      return await apiFetch(`/api/crm/blog/${id}`, { method: 'DELETE' });
    } catch {
      const idx = INITIAL_BLOG_POSTS.findIndex(p => p.id === id);
      if (idx !== -1) INITIAL_BLOG_POSTS.splice(idx, 1);
      return { success: true };
    }
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
  role: 'ADMIN' | 'CREDITOR' | 'DEBTOR' | 'ANALYST' | 'LEGAL' | 'OPERATOR' | 'FIELD_OFFICER' | 'REGULAR';
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
      case 'CREDITOR':
      case 'DEBTOR':
      case 'REGULAR':
      default:
        return '/dashboard';
    }
  }
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

export const creditorBackendService = {
  async getMyClaims(): Promise<{
    kpis: {
      totalPrincipal: number;
      totalRecovered: number;
      recoveryRate: number;
      activeClaimsCount: number;
      activeDebtorsCount: number;
    };
    claims: any[];
  }> {
    return await apiFetch('/api/v1/creditor/my-claims');
  }
};

export const analystBackendService = {
  async getUsers(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/users');
  },

  async getExcelDebtors(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/excel-registry/debtors');
  },

  async getExcelCreditors(): Promise<any[]> {
    return await apiFetch('/api/v1/analyst/excel-registry/creditors');
  },

  async assignRole(data: {
    userId: string;
    targetRole: 'DEBTOR' | 'CREDITOR';
    registryItemId?: string;
    agreementNumber?: string;
    amount?: number;
    creditorId?: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/analyst/assign-role', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async syncExcelData(items?: any[]): Promise<any> {
    return await apiFetch('/api/v1/analyst/excel-sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
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
    claimId: string;
    priority?: string;
    taskType?: string;
    instructions: string;
  }): Promise<any> {
    return await apiFetch('/api/v1/analyst/dispatch-task', {
      method: 'POST',
      body: JSON.stringify(data),
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
    role: 'ADMIN' | 'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL';
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
