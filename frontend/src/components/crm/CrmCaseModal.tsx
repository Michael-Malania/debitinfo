'use client';

import React, { useState, useEffect } from 'react';
import { crmBackendService } from '@/services';
import { downloadDebtorAccountTurnoverXLSX } from '@/utils/excel';

export type CrmModalTab = 'call' | 'documents' | 'schedule' | 'history';

interface CrmCaseModalProps {
  claimSummary: any | null;
  initialTab?: CrmModalTab;
  onClose: () => void;
  onUpdated: () => void;
  onExportSingle: (item: any) => void;
}

const DISPOSITION_OPTIONS = [
  { value: 'PROMISE_TO_PAY', label: 'დათანხმდა გადახდას', color: 'text-emerald-700 border-emerald-400 bg-emerald-50' },
  { value: 'CALLBACK', label: 'დაინიშნა გადარეკვა', color: 'text-amber-700 border-amber-400 bg-amber-50' },
  { value: 'VOICEMAIL', label: 'არ იღებს ყურმილს', color: 'text-slate-700 border-slate-300 bg-slate-50' },
  { value: 'REFUSED', label: 'კატეგორიული უარი', color: 'text-rose-700 border-rose-400 bg-rose-50' },
  { value: 'DISPUTE_RAISED', label: 'სადავო მოთხოვნა', color: 'text-purple-700 border-purple-400 bg-purple-50' },
  { value: 'WRONG_NUMBER', label: 'არასწორი ნომერი', color: 'text-slate-600 border-slate-300 bg-slate-50' },
];

const CONTACT_POSITIONS = [
  'მთავარი ბუღალტერი',
  'დირექტორი',
  'დამფუძნებელი',
  'ფინანსური მენეჯერი',
  'იურისტი / ადვოკატი',
  'ოჯახის წევრი',
  'მენეჯერი / თანამშრომელი',
  'სხვა საკონტაქტო პირი',
];

function buildInstallments(
  type: 'STANDARD' | 'NON_STANDARD',
  months: number,
  day: number,
  totalDebt: number,
  existingList?: Array<{ installmentNo: number; dueDate?: string; amount: number }>,
  intervalMode: 'MONTHLY' | 'CUSTOM_DAYS' = 'MONTHLY',
  customIntervalDays: number = 30,
) {
  const validMonths = type === 'STANDARD' ? Math.max(1, Math.min(12, months)) : Math.max(1, months);
  const validDay = Math.max(1, Math.min(31, day));
  const baseAmt = Math.floor((totalDebt / validMonths) * 100) / 100;
  const remainder = Math.round((totalDebt - baseAmt * validMonths) * 100) / 100;

  const now = new Date();
  const result: Array<{ installmentNo: number; dueDate: string; amount: number }> = [];
  for (let i = 0; i < validMonths; i++) {
    let dateStr = '';
    if (type === 'NON_STANDARD' && intervalMode === 'CUSTOM_DAYS') {
      const d = new Date(now.getTime() + (i + 1) * Math.max(1, customIntervalDays) * 24 * 60 * 60 * 1000);
      dateStr = d.toISOString().split('T')[0];
    } else {
      const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, Math.min(validDay, 28));
      dateStr = d.toISOString().split('T')[0];
    }
    const customVal = existingList?.[i]?.amount;
    const amt = customVal !== undefined ? customVal : i === 0 ? baseAmt + remainder : baseAmt;
    result.push({
      installmentNo: i + 1,
      dueDate: dateStr,
      amount: Math.round(amt * 100) / 100,
    });
  }
  return result;
}

/**
 * Full CRM Case File & Interaction Modal ("საქმის ბარათი & კონსოლი").
 * Consolidates Call Logging, Discovered Internal Contacts, RS.GE Documents,
 * Payment Schedule Builder/Editor, and Interaction Timeline when selecting a row.
 */
export default function CrmCaseModal({
  claimSummary,
  initialTab = 'call',
  onClose,
  onUpdated,
  onExportSingle,
}: CrmCaseModalProps) {
  const [activeTab, setActiveTab] = useState<CrmModalTab>(initialTab);
  const [claimDetail, setClaimDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Add Contact Inline Panel
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('+995 ');
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('მთავარი ბუღალტერი');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Call Logging Form
  const [disposition, setDisposition] = useState<string>('PROMISE_TO_PAY');
  const [promisedAmount, setPromisedAmount] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  // Schedule Editor State
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState<'STANDARD' | 'NON_STANDARD'>('STANDARD');
  const [scheduleMonths, setScheduleMonths] = useState<number>(12);
  const [schedulePaymentDay, setSchedulePaymentDay] = useState<number>(15);
  const [scheduleIntervalMode, setScheduleIntervalMode] = useState<'MONTHLY' | 'CUSTOM_DAYS'>('MONTHLY');
  const [scheduleCustomIntervalDays, setScheduleCustomIntervalDays] = useState<number>(30);
  const [scheduleInstallments, setScheduleInstallments] = useState<
    Array<{ installmentNo: number; dueDate: string; amount: number }>
  >([]);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [showScheduleBreakdown, setShowScheduleBreakdown] = useState(true);

  const activeClaim = claimDetail || claimSummary;

  const flashBanner = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner((prev) => (prev === msg ? null : prev)), 4500);
  };

  const fetchDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await crmBackendService.getClaimForCall(id);
      setClaimDetail(detail);
    } catch (err) {
      console.warn('Could not load CRM claim detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (claimSummary?.id) {
      setClaimDetail(null);
      setIsEditingSchedule(false);
      setShowAddContactForm(false);
      fetchDetail(claimSummary.id);
    }
  }, [claimSummary?.id]);

  if (!claimSummary) return null;

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLog(true);
    try {
      await crmBackendService.logCall({
        claimId: activeClaim.id,
        disposition,
        promisedDate: promisedDate || undefined,
        promisedAmount: promisedAmount ? parseFloat(promisedAmount) : undefined,
        notes: callNotes || 'კომუნიკაცია განხორციელდა სტანდარტული სკრიპტით.',
      });
      setCallNotes('');
      setPromisedAmount('');
      setPromisedDate('');
      flashBanner('ინტერაქციის შედეგი წარმატებით დაფიქსირდა CRM ბაზაში!');
      await Promise.all([fetchDetail(activeClaim.id), Promise.resolve(onUpdated())]);
    } catch (err: any) {
      alert(err?.message || 'ჩანაწერის შენახვა ვერ მოხერხდა');
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactPhone.trim() || !newContactFirstName.trim()) {
      alert('გთხოვთ მიუთითოთ ტელეფონის ნომერი და სახელი');
      return;
    }
    setSavingContact(true);
    try {
      await crmBackendService.addDebtorContact(activeClaim.id, {
        firstName: newContactFirstName.trim(),
        lastName: newContactLastName.trim(),
        phone: newContactPhone.trim(),
        relationType: newContactPosition.trim(),
        notes: newContactNotes.trim(),
      });
      setNewContactPhone('+995 ');
      setNewContactFirstName('');
      setNewContactLastName('');
      setNewContactNotes('');
      setShowAddContactForm(false);
      flashBanner('ახალი საკონტაქტო ნომერი წარმატებით დაემატა!');
      await Promise.all([fetchDetail(activeClaim.id), Promise.resolve(onUpdated())]);
    } catch (err: any) {
      alert(err?.message || 'საკონტაქტო პირის დამატება ვერ მოხერხდა');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await crmBackendService.deleteDebtorContact(activeClaim.id, contactId);
      flashBanner('საკონტაქტო ნომერი წაიშალა');
      await Promise.all([fetchDetail(activeClaim.id), Promise.resolve(onUpdated())]);
    } catch (err: any) {
      alert(err?.message || 'საკონტაქტო პირის წაშლა ვერ მოხერხდა');
    }
  };

  const startScheduleEditor = (mode: 'create' | 'edit') => {
    const existingSched = activeClaim?.schedules?.[0];
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
    if (mode === 'edit' && existingSched) {
      const type = existingSched.type === 'NON_STANDARD' ? 'NON_STANDARD' : 'STANDARD';
      const months = existingSched.totalMonths || (type === 'STANDARD' ? 12 : 18);
      const day = existingSched.paymentDay || 15;
      setScheduleType(type);
      setScheduleMonths(months);
      setSchedulePaymentDay(day);
      setScheduleIntervalMode('MONTHLY');
      setScheduleNotes(existingSched.notes || '');
      if (existingSched.installments?.length) {
        setScheduleInstallments(
          existingSched.installments.map((inst: any, idx: number) => ({
            installmentNo: inst.installmentNo || idx + 1,
            dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : '',
            amount: Number(inst.amount) || 0,
          })),
        );
      } else {
        setScheduleInstallments(buildInstallments(type, months, day, totalDebt));
      }
    } else {
      setScheduleType('STANDARD');
      setScheduleMonths(12);
      setSchedulePaymentDay(15);
      setScheduleIntervalMode('MONTHLY');
      setScheduleCustomIntervalDays(30);
      setScheduleNotes('');
      setScheduleInstallments(buildInstallments('STANDARD', 12, 15, totalDebt));
    }
    setIsEditingSchedule(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    try {
      await crmBackendService.saveClaimSchedule(activeClaim.id, {
        type: scheduleType,
        totalMonths: scheduleMonths,
        paymentDay: schedulePaymentDay,
        installments: scheduleInstallments,
        notes: scheduleNotes || undefined,
      });
      setIsEditingSchedule(false);
      flashBanner('გადახდის გრაფიკი შედგა და გაიგზავნა დებიტორთან დასადასტურებლად!');
      await Promise.all([fetchDetail(activeClaim.id), Promise.resolve(onUpdated())]);
    } catch (err: any) {
      alert(err?.message || 'გრაფიკის შენახვა ვერ მოხერხდა');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleOpenDoc = async (doc: any) => {
    if (doc.docType === 'ACCOUNT_TURNOVER' || doc.fileName?.endsWith('.xlsx')) {
      try {
        await downloadDebtorAccountTurnoverXLSX({
          debtorName: activeClaim?.debtorName || 'დებიტორი',
          debtorPersonalId: activeClaim?.debtorPersonalId || '01019012345',
          creditorName: activeClaim?.creditorName || 'კრედიტორი',
          caseNumber: activeClaim?.caseNumber || 'DI-2025',
          agreementNumber: activeClaim?.agreementNumber || 'AGR-01',
          fileName: doc.fileName || `brunviti_barati_${activeClaim?.debtorPersonalId || 'case'}.xlsx`,
        });
      } catch (err) {
        console.error('Failed to download turnover Excel:', err);
        alert('Excel ბრუნვითი ბარათის გენერირება ვერ მოხერხდა.');
      }
      return;
    }

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html lang="ka">
      <head>
        <meta charset="utf-8">
        <title>${doc.title}</title>
        <style>
          body { font-family: 'Noto Sans Georgian', system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          .header { border-bottom: 2px solid #0032c6; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
          .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          .table th { background: #f8fafc; font-weight: 600; width: 35%; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-size: 20px; font-weight: bold; color: #0032c6;">Debitinfo.GE • საქმის დოკუმენტი</div>
          <div class="badge">დამოწმებულია RS.GE</div>
        </div>
        <h2>${doc.title}</h2>
        <table class="table">
          <tr><th>დოკუმენტის ტიპი</th><td>${doc.docType}</td></tr>
          <tr><th>ფაილი</th><td>${doc.fileName}</td></tr>
          <tr><th>საქმის N</th><td><strong>#${activeClaim?.caseNumber}</strong></td></tr>
          <tr><th>დებიტორი</th><td>${activeClaim?.debtorName} (${activeClaim?.debtorPersonalId})</td></tr>
          <tr><th>კრედიტორი</th><td>${activeClaim?.creditorName}</td></tr>
          <tr><th>აღწერა</th><td>${doc.description || 'საქმის დამადასტურებელი ოფიციალური დოკუმენტი'}</td></tr>
        </table>
      </body>
      </html>
    `);
    w.document.close();
  };

  const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
  const existingSchedule = activeClaim?.schedules?.[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface-bg rounded-2xl max-w-6xl w-full shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Case Header */}
        <div className="px-6 py-4 bg-white border-b border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-primary border border-blue-200 font-mono text-xs font-bold">
                საქმე #{activeClaim.caseNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                Grade {activeClaim.rating || 'E'} (სკორი {activeClaim.riskScore || 0})
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                {activeClaim.debtorPhone}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-text-primary mt-1.5">
              {activeClaim.debtorName}
            </h2>
            <p className="text-xs text-text-muted mt-0.5 flex flex-wrap items-center gap-2">
              <span>
                პ/ნ ან ს/კ: <strong className="font-mono text-text-primary">{activeClaim.debtorPersonalId}</strong>
              </span>
              <span>•</span>
              <span>
                კრედიტორი: <strong className="text-text-primary">{activeClaim.creditorName}</strong>
              </span>
              {activeClaim.agreementNumber && (
                <>
                  <span>•</span>
                  <span>
                    ხელშეკრულება: <strong className="font-mono">#{activeClaim.agreementNumber}</strong>
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-rose-50/70 border border-rose-200 text-right">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">
                მიმდინარე დავალიანება
              </span>
              <span className="text-lg font-extrabold font-mono text-rose-600">
                {Number(activeClaim.remainingAmount || 0).toLocaleString('ka-GE')} ₾
              </span>
            </div>

            <button
              type="button"
              onClick={() => onExportSingle(activeClaim)}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              title="დახურვა"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-border-subtle flex flex-wrap items-center gap-1.5 shrink-0">
          {([
            { id: 'call', icon: 'call', label: 'ზარის აღრიცხვა & კონტაქტები' },
            { id: 'documents', icon: 'folder_shared', label: `დოკუმენტაცია & ქვითრები (${(activeClaim.supportingDocuments?.length || 0) + (activeClaim.paymentReceipts?.length || 0)})` },
            { id: 'schedule', icon: 'calendar_month', label: 'გადახდის გრაფიკის მართვა' },
            { id: 'history', icon: 'history', label: `ისტორია & ქრონოლოგია (${(activeClaim.crmLogs?.length || 0) + (activeClaim.timelineEvents?.length || 0)})` },
          ] as Array<{ id: CrmModalTab; icon: string; label: string }>).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === t.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-text-secondary border border-border-subtle hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {feedbackBanner && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
            <span>{feedbackBanner}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loadingDetail && !claimDetail && (
            <div className="py-6 text-center text-xs text-text-muted">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl block mx-auto mb-1">
                sync
              </span>
              საქმის სრული მონაცემები იტვირთება...
            </div>
          )}

          {/* TAB 1: CALL LOGGING + INTERNAL CONTACTS */}
          {activeTab === 'call' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 6 cols: Outbound Phone & Discovered Internal Contacts */}
              <div className="lg:col-span-6 space-y-4">
                {/* Outbound Dial Strip */}
                <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">contact_phone</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-text-primary">
                          {activeClaim.debtorPhone}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200 text-[10px] font-bold">
                          ძირითადი ნომერი
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        დაკავშირების შემდეგ მარჯვნივ აღრიცხეთ ზარის შედეგი
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeClaim.debtorPhone || '');
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {copiedPhone ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedPhone ? 'დაკოპირდა' : 'კოპირება'}</span>
                    </button>
                    <a
                      href={`tel:${activeClaim.debtorPhone}`}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">call</span>
                      <span>დაკავშირება</span>
                    </a>
                  </div>
                </div>

                {/* Discovered Contacts List + Inline Form */}
                <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
                    <div>
                      <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[17px]">
                          phone_in_talk
                        </span>
                        <span>დამატებითი საკონტაქტო ნომრები &amp; მოძიებული პირები</span>
                      </h3>
                      <span className="text-[10px] text-amber-800 font-semibold inline-flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[11px]">lock</span>
                        შიდა მონაცემი — დებიტორს არ უჩანს
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm((prev) => !prev)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {showAddContactForm ? 'close' : 'add_call'}
                      </span>
                      <span>{showAddContactForm ? 'გაუქმება' : '+ ახალი ნომრის დამატება'}</span>
                    </button>
                  </div>

                  {showAddContactForm && (
                    <form
                      onSubmit={handleAddContact}
                      className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            ტელეფონი *
                          </label>
                          <input
                            type="tel"
                            required
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            placeholder="+995 599..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            თანამდებობა / როლი
                          </label>
                          <select
                            value={newContactPosition}
                            onChange={(e) => setNewContactPosition(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-primary"
                          >
                            {CONTACT_POSITIONS.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            სახელი *
                          </label>
                          <input
                            type="text"
                            required
                            value={newContactFirstName}
                            onChange={(e) => setNewContactFirstName(e.target.value)}
                            placeholder="სახელი"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            გვარი
                          </label>
                          <input
                            type="text"
                            value={newContactLastName}
                            onChange={(e) => setNewContactLastName(e.target.value)}
                            placeholder="გვარი"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={newContactNotes}
                        onChange={(e) => setNewContactNotes(e.target.value)}
                        placeholder="შიდა შენიშვნა (არასავალდებულო)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs outline-none focus:border-primary"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={savingContact}
                          className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition cursor-pointer disabled:opacity-50"
                        >
                          {savingContact ? 'ინახება...' : 'ნომრის შენახვა'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Contact rows */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {Array.isArray(activeClaim.contactPersons) &&
                    activeClaim.contactPersons.length > 0 ? (
                      activeClaim.contactPersons.map((cp: any, idx: number) => (
                        <div
                          key={cp.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                №{idx + 2}
                              </span>
                              <span className="font-mono font-bold text-slate-900">{cp.phone}</span>
                              <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                                {cp.relationType || 'საკონტაქტო პირი'}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                              {cp.firstName} {cp.lastName}
                            </p>
                            {cp.notes && <p className="text-[11px] text-slate-500">{cp.notes}</p>}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cp.phone);
                                setCopiedContactId(cp.id);
                                setTimeout(() => setCopiedContactId(null), 1800);
                              }}
                              className="p-1.5 rounded hover:bg-white text-slate-500 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {copiedContactId === cp.id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                            <a
                              href={`tel:${cp.phone}`}
                              className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
                            >
                              დარეკვა
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(cp.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="წაშლა"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted py-4 text-center border border-dashed border-border-subtle rounded-lg">
                        დამატებითი საკონტაქტო ნომრები ჯერ არ არის შეყვანილი.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right 6 cols: Call Disposition & Logging Form */}
              <div className="lg:col-span-6 bg-white border border-border-subtle rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                    <h3 className="text-sm font-bold text-text-primary">
                      ზარისა და კომუნიკაციის შედეგის დაფიქსირება
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted">PostgreSQL Sync</span>
                </div>

                <form onSubmit={handleLogCall} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-2">
                      ინტერაქციის სტატუსი *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DISPOSITION_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDisposition(opt.value)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold text-left flex items-center gap-2 transition cursor-pointer ${
                            disposition === opt.value
                              ? `${opt.color} border-2 shadow-2xs`
                              : 'bg-slate-50 border border-border-subtle text-text-secondary hover:bg-slate-100'
                          }`}
                        >
                          <span className="size-2 rounded-full bg-current shrink-0" />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-border-subtle">
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-1">
                        შეთანხმებული თანხა (₾)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={promisedAmount}
                        onChange={(e) => setPromisedAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-border-subtle text-xs font-mono outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-1">
                        დაფარვის დაპირებული თარიღი
                      </label>
                      <input
                        type="date"
                        value={promisedDate}
                        onChange={(e) => setPromisedDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-border-subtle text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">
                      მოლაპარაკების კომენტარი *
                    </label>
                    <textarea
                      rows={3}
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="ჩაწერეთ მოვალის პასუხი, შეთანხმებული პირობა ან უარის მიზეზი..."
                      className="w-full p-3 rounded-xl bg-white border border-border-subtle text-xs text-text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingLog}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>
                      {submittingLog ? 'ინახება...' : 'შედეგის შენახვა და რეესტრში დაფიქსირება'}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS & RECEIPTS */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">folder_shared</span>
                  <h3 className="text-sm font-bold text-text-primary">
                    საქმის დამადასტურებელი დოკუმენტაცია &amp; გადახდის ქვითრები
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  RS.GE / ბუღალტერია
                </span>
              </div>

              <div className="space-y-2.5">
                {Array.isArray(activeClaim.supportingDocuments) &&
                activeClaim.supportingDocuments.length > 0 ? (
                  activeClaim.supportingDocuments.map((doc: any, idx: number) => {
                    const isExcel =
                      doc.docType === 'ACCOUNT_TURNOVER' ||
                      doc.fileName?.endsWith('.xlsx') ||
                      doc.fileName?.endsWith('.csv');
                    return (
                      <div
                        key={doc.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div
                            className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isExcel ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isExcel ? 'table_view' : 'picture_as_pdf'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-text-muted truncate">
                              {doc.fileName} • {doc.description || 'დამოწმებული ფაილი'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenDoc(doc)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                            isExcel
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isExcel ? 'download' : 'visibility'}
                          </span>
                          <span>{isExcel ? 'XLSX ექსპორტი' : 'დათვალიერება'}</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-border-subtle text-center text-xs text-text-muted">
                    დამადასტურებელი დოკუმენტები ამ საქმეზე ატვირთული არ არის.
                  </div>
                )}
              </div>

              {Array.isArray(activeClaim.paymentReceipts) && activeClaim.paymentReceipts.length > 0 && (
                <div className="pt-4 border-t border-border-subtle space-y-2">
                  <h4 className="text-xs font-bold text-text-muted uppercase">
                    დებიტორის მიერ ატვირთული გადახდის ქვითრები ({activeClaim.paymentReceipts.length})
                  </h4>
                  {activeClaim.paymentReceipts.map((rcpt: any) => (
                    <div
                      key={rcpt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-emerald-700">receipt_long</span>
                        <div>
                          <span className="font-bold text-text-primary">
                            ქვითარი #{rcpt.id?.substring(0, 8)}
                          </span>
                          <span className="ml-2 font-mono font-semibold text-emerald-800">
                            {Number(rcpt.amount).toLocaleString('ka-GE')} ₾
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenDoc({
                            title: `გადახდის ქვითარი #${rcpt.id?.substring(0, 8)}`,
                            docType: 'RECEIPT',
                            fileName: rcpt.fileName || `receipt_${rcpt.id?.substring(0, 8)}.pdf`,
                            description: `გადახდილი თანხა: ${rcpt.amount} ₾`,
                          })
                        }
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        ქვითრის ნახვა
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPAYMENT SCHEDULE BUILDER & INSPECTOR */}
          {activeTab === 'schedule' && (
            <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                  <h3 className="text-sm font-bold text-text-primary">
                    გადახდის გრაფიკის მართვა &amp; მიბმა
                  </h3>
                </div>
                {!isEditingSchedule && (
                  <button
                    type="button"
                    onClick={() => startScheduleEditor(existingSchedule ? 'edit' : 'create')}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {existingSchedule ? 'edit' : 'add_circle'}
                    </span>
                    <span>
                      {existingSchedule ? 'გრაფიკის რედაქტირება' : 'ახალი გადახდის გრაფიკის შედგენა'}
                    </span>
                  </button>
                )}
              </div>

              {isEditingSchedule ? (
                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const months = Math.min(12, Math.max(1, scheduleMonths));
                        setScheduleType('STANDARD');
                        setScheduleMonths(months);
                        setScheduleInstallments(
                          buildInstallments('STANDARD', months, schedulePaymentDay, totalDebt),
                        );
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        scheduleType === 'STANDARD'
                          ? 'border-primary bg-blue-50/70 ring-2 ring-primary/20'
                          : 'border-border-subtle bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">
                          სტანდარტული გრაფიკი
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                          1-12 თვე
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        თანხა თანაბრად ნაწილდება თვეებზე.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const months = Math.max(1, scheduleMonths);
                        setScheduleType('NON_STANDARD');
                        setScheduleInstallments(
                          buildInstallments(
                            'NON_STANDARD',
                            months,
                            schedulePaymentDay,
                            totalDebt,
                            undefined,
                            scheduleIntervalMode,
                            scheduleCustomIntervalDays,
                          ),
                        );
                      }}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        scheduleType === 'NON_STANDARD'
                          ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-200'
                          : 'border-border-subtle bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">
                          არასტანდარტული გრაფიკი
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          ინდივიდუალური
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-1">
                        დღეების ინტერვალები ან ხელით რედაქტირებადი შენატანები.
                      </p>
                    </button>
                  </div>

                  {scheduleType === 'NON_STANDARD' && (
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                      <span className="font-bold text-purple-900 mr-2">ინტერვალი:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleIntervalMode('MONTHLY');
                          setScheduleInstallments(
                            buildInstallments(
                              scheduleType,
                              scheduleMonths,
                              schedulePaymentDay,
                              totalDebt,
                              scheduleInstallments,
                              'MONTHLY',
                              scheduleCustomIntervalDays,
                            ),
                          );
                        }}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                          scheduleIntervalMode === 'MONTHLY'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        ყოველთვიური
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleIntervalMode('CUSTOM_DAYS');
                          setScheduleInstallments(
                            buildInstallments(
                              scheduleType,
                              scheduleMonths,
                              schedulePaymentDay,
                              totalDebt,
                              scheduleInstallments,
                              'CUSTOM_DAYS',
                              scheduleCustomIntervalDays,
                            ),
                          );
                        }}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                          scheduleIntervalMode === 'CUSTOM_DAYS'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        ყოველ X დღეში
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-border-subtle">
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-1">
                        {scheduleType === 'NON_STANDARD' && scheduleIntervalMode === 'CUSTOM_DAYS'
                          ? 'შენატანების რაოდენობა'
                          : 'თვეების რაოდენობა'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={scheduleMonths}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10) || 1;
                          const m =
                            scheduleType === 'STANDARD' ? Math.max(1, Math.min(12, raw)) : Math.max(1, raw);
                          setScheduleMonths(m);
                          setScheduleInstallments(
                            buildInstallments(
                              scheduleType,
                              m,
                              schedulePaymentDay,
                              totalDebt,
                              scheduleInstallments,
                              scheduleIntervalMode,
                              scheduleCustomIntervalDays,
                            ),
                          );
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      {scheduleType === 'NON_STANDARD' && scheduleIntervalMode === 'CUSTOM_DAYS' ? (
                        <>
                          <label className="block text-[11px] font-bold text-text-muted mb-1">
                            დღეების ინტერვალი (ყოველ X დღეში)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={scheduleCustomIntervalDays}
                            onChange={(e) => {
                              const days = Math.max(1, parseInt(e.target.value, 10) || 30);
                              setScheduleCustomIntervalDays(days);
                              setScheduleInstallments(
                                buildInstallments(
                                  scheduleType,
                                  scheduleMonths,
                                  schedulePaymentDay,
                                  totalDebt,
                                  scheduleInstallments,
                                  'CUSTOM_DAYS',
                                  days,
                                ),
                              );
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-mono font-bold"
                          />
                        </>
                      ) : (
                        <>
                          <label className="block text-[11px] font-bold text-text-muted mb-1">
                            გადახდის რიცხვი (1-31)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={schedulePaymentDay}
                            onChange={(e) => {
                              const d = Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 15));
                              setSchedulePaymentDay(d);
                              setScheduleInstallments(
                                buildInstallments(
                                  scheduleType,
                                  scheduleMonths,
                                  d,
                                  totalDebt,
                                  scheduleInstallments,
                                  scheduleIntervalMode,
                                  scheduleCustomIntervalDays,
                                ),
                              );
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-xs font-mono font-bold"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border border-border-subtle rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] font-bold text-text-muted uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">№</th>
                          <th className="py-2 px-3">გადახდის თარიღი</th>
                          <th className="py-2 px-3 text-right">შენატანი (₾)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduleInstallments.map((inst, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 text-center font-mono text-text-muted">
                              {inst.installmentNo}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-text-primary">
                              {inst.dueDate}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              {scheduleType === 'NON_STANDARD' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={inst.amount}
                                  onChange={(e) => {
                                    const next = [...scheduleInstallments];
                                    next[idx] = {
                                      ...next[idx],
                                      amount: Math.max(0, parseFloat(e.target.value) || 0),
                                    };
                                    setScheduleInstallments(next);
                                  }}
                                  className="w-28 px-2 py-1 rounded border border-purple-200 bg-purple-50/40 text-right font-mono font-bold text-xs"
                                />
                              ) : (
                                <span className="font-mono font-bold text-text-primary">
                                  {inst.amount.toFixed(2)} ₾
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <textarea
                    rows={2}
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="კომენტარი ან დამატებითი შეთანხმება..."
                    className="w-full p-2.5 rounded-xl border border-border-subtle text-xs outline-none focus:border-primary"
                  />

                  <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                    <button
                      type="button"
                      onClick={() => setIsEditingSchedule(false)}
                      className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      disabled={savingSchedule}
                      className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>
                        {savingSchedule ? 'ინახება...' : 'გრაფიკის შენახვა & დებიტორთან გაგზავნა'}
                      </span>
                    </button>
                  </div>
                </form>
              ) : existingSchedule ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            existingSchedule.type === 'NON_STANDARD'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {existingSchedule.type === 'NON_STANDARD'
                            ? 'არასტანდარტული გრაფიკი'
                            : 'სტანდარტული გრაფიკი'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            existingSchedule.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : existingSchedule.approvalStatus === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {existingSchedule.approvalStatus === 'APPROVED'
                            ? 'დადასტურებულია დებიტორის მიერ'
                            : existingSchedule.approvalStatus === 'REJECTED'
                              ? 'უარყოფილია დებიტორის მიერ'
                              : 'მოლოდინში (დებიტორის დასადასტურებელი)'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        ვადა: <strong>{existingSchedule.totalMonths} თვე</strong> • გადახდის დღე:{' '}
                        <strong>ყოველი თვის {existingSchedule.paymentDay || 15} რიცხვი</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScheduleBreakdown((p) => !p)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {showScheduleBreakdown ? 'ცხრილის დამალვა' : 'პერიოდების ნახვა'}
                    </button>
                  </div>

                  {showScheduleBreakdown && existingSchedule.installments && (
                    <div className="overflow-x-auto rounded-xl border border-border-subtle max-h-64">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold text-text-muted uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-center">№</th>
                            <th className="py-2 px-3">გადახდის ვადა</th>
                            <th className="py-2 px-3 text-right">შენატანი</th>
                            <th className="py-2 px-3 text-center">სტატუსი</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {existingSchedule.installments.map((inst: any, idx: number) => (
                            <tr key={inst.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center font-mono text-text-muted">
                                {inst.installmentNo || idx + 1}
                              </td>
                              <td className="py-2 px-3 font-mono text-text-primary">
                                {inst.dueDate
                                  ? new Date(inst.dueDate).toLocaleDateString('ka-GE')
                                  : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-text-primary">
                                {Number(inst.amount || 0).toFixed(2)} ₾
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    inst.isPaid
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {inst.isPaid ? 'გადახდილი' : 'დაგეგმილი'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-border-subtle text-center space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                  <p className="text-xs text-text-muted">
                    ამ მოვალეზე გადახდის გრაფიკი ჯერ არ არის შედგენილი.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CRM HISTORY & TIMELINE */}
          {activeTab === 'history' && (
            <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">history</span>
                  <h3 className="text-sm font-bold text-text-primary">
                    საქმის ისტორია &amp; CRM კომუნიკაციების ქრონოლოგია
                  </h3>
                </div>
                <span className="text-xs font-mono text-text-muted">
                  {(activeClaim.crmLogs?.length || 0) + (activeClaim.timelineEvents?.length || 0)}{' '}
                  ჩანაწერი
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle">
                {activeClaim.crmLogs && activeClaim.crmLogs.length > 0 ? (
                  activeClaim.crmLogs.map((log: any) => (
                    <div key={log.id} className="relative p-3 rounded-xl bg-slate-50/70 border border-border-subtle">
                      <div className="absolute -left-[22px] top-4 size-2.5 rounded-full bg-primary ring-4 ring-white" />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
                        <span className="font-mono text-text-muted">
                          {new Date(log.createdAt).toLocaleString('ka-GE')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200 text-[11px] font-bold">
                          {log.disposition}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-text-primary">{log.notes}</p>
                      {log.promisedAmount && (
                        <p className="text-xs font-bold text-emerald-700 mt-1">
                          შეპირებული თანხა: {log.promisedAmount} ₾ (ვადა:{' '}
                          {log.promisedDate
                            ? new Date(log.promisedDate).toLocaleDateString('ka-GE')
                            : 'მითითებული არაა'}
                          )
                        </p>
                      )}
                      <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        <span>ოპერატორი: {log.operatorName}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted py-4">
                    ამ საქმეზე კომუნიკაციის ისტორია ჯერ არ არის დაფიქსირებული.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
