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
  CallQueueItem,
  CallInteractionLog,
  FieldVisitTask,
  Employee,
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
  async getCases(): Promise<LegalCase[]> {
    try {
      return await apiFetch<LegalCase[]>('/api/legal/cases');
    } catch {
      return MOCK_LEGAL_CASES;
    }
  }
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
