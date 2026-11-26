'use client';

import React, { useState, useEffect } from 'react';
import { DetailedLegalCase } from '@/types';
import { legalService } from '@/services';

const COURT_INSTANCE_OPTIONS = [
  'პირველი ინსტანცია',
  'მეორე ინსტანცია',
  'მესამე ინსტანცია',
  'არბიტრაჟი',
];

interface LegalCaseModalProps {
  legalCase: DetailedLegalCase | null;
  onClose: () => void;
  onCaseUpdated: (updated: DetailedLegalCase) => void;
  onExportSingle: (c: DetailedLegalCase) => void;
}

/**
 * Full-screen Case File Modal ("საქმის ბარათი") for Legal Officers.
 * Consolidates Debtor Dossier, Verified Documents, Chronological Audit Trail,
 * and Legal Procedural Control Panel into one spacious workspace.
 */
export default function LegalCaseModal({
  legalCase,
  onClose,
  onCaseUpdated,
  onExportSingle,
}: LegalCaseModalProps) {
  const [activeTab, setActiveTab] = useState<'dossier' | 'timeline' | 'control'>('dossier');

  // Control Center State
  const [currentStage, setCurrentStage] = useState<string>('LAWSUIT_PREPARATION');
  const [priority, setPriority] = useState<string>('HIGH');
  const [nextHearingDate, setNextHearingDate] = useState<string>('');
  const [penaltyAmountInput, setPenaltyAmountInput] = useState<string>('0');
  const [courtDutyFeeInput, setCourtDutyFeeInput] = useState<string>('');
  const [courtInstanceInput, setCourtInstanceInput] = useState<string>('');
  const [courtCaseNumberInput, setCourtCaseNumberInput] = useState<string>('');
  const [judgeNameInput, setJudgeNameInput] = useState<string>('');
  const [opinionText, setOpinionText] = useState<string>('');
  const [warningSent, setWarningSent] = useState(false);
  const [lawsuitDrafted, setLawsuitDrafted] = useState(false);
  const [dutyPaid, setDutyPaid] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  // Add Legal Document Form State
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [docAddMode, setDocAddMode] = useState<'file' | 'url'>('file');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('LAWSUIT');
  const [docUrl, setDocUrl] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  // Timeline Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [localToast, setLocalToast] = useState<string | null>(null);

  useEffect(() => {
    if (!legalCase) return;
    setCurrentStage(legalCase.stage || 'LAWSUIT_PREPARATION');
    setPriority(legalCase.priority || 'MEDIUM');
    setNextHearingDate(
      legalCase.nextHearingDate ? String(legalCase.nextHearingDate).slice(0, 10) : ''
    );
    setPenaltyAmountInput(
      legalCase.amounts?.penaltyAmount !== undefined ? String(legalCase.amounts.penaltyAmount) : '0'
    );
    setCourtDutyFeeInput(
      legalCase.courtDutyFee !== null && legalCase.courtDutyFee !== undefined
        ? String(legalCase.courtDutyFee)
        : ''
    );
    setCourtInstanceInput(legalCase.courtInstance || '');
    setCourtCaseNumberInput(legalCase.courtCaseNumber || '');
    setJudgeNameInput(legalCase.judgeName || '');
    setOpinionText(legalCase.legalOpinion || '');
    setWarningSent(Boolean(legalCase.checklistWarningSent));
    setLawsuitDrafted(Boolean(legalCase.checklistLawsuitDrafted));
    setDutyPaid(Boolean(legalCase.checklistDutyPaid));
    setShowAddDocForm(false);
    setActiveTab('dossier');
    setLocalToast(null);
  }, [legalCase]);

  if (!legalCase) return null;

  const showToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(null), 4000);
  };

  const handleSaveControlCenter = async () => {
    try {
      setSavingAction(true);
      const parsedPenalty = penaltyAmountInput.trim() === '' ? 0 : Number(penaltyAmountInput);
      const parsedDuty =
        courtDutyFeeInput.trim() === '' ? null : Number(courtDutyFeeInput);

      const updated = await legalService.updateCase(legalCase.id, {
        stage: currentStage,
        priority,
        nextHearingDate: nextHearingDate || null,
        penaltyAmount: Number.isNaN(parsedPenalty) ? undefined : Math.max(0, parsedPenalty),
        courtDutyFee:
          parsedDuty === null
            ? null
            : Number.isNaN(parsedDuty)
              ? undefined
              : Math.max(0, parsedDuty),
        courtInstance: courtInstanceInput.trim() || undefined,
        courtCaseNumber: courtCaseNumberInput.trim() || undefined,
        judgeName: judgeNameInput.trim() || undefined,
        legalOpinion: opinionText,
        checklistWarningSent: warningSent,
        checklistLawsuitDrafted: lawsuitDrafted,
        checklistDutyPaid: dutyPaid,
      });

      if (updated) {
        onCaseUpdated(updated);
        showToast('საქმის ფინანსური და საპროცესო მონაცემები წარმატებით შეინახა ბაზაში!');
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSavingAction(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingDoc(true);
      let created: any = null;

      if (docAddMode === 'file') {
        if (!docFile) {
          alert('გთხოვთ აირჩიოთ ლოკალური ფაილი ასატვირთად');
          setSavingDoc(false);
          return;
        }
        created = await legalService.uploadDocument(legalCase.id, docFile, {
          title: docTitle.trim() || docFile.name,
          documentType: docType,
        });
      } else {
        if (!docTitle.trim() || !docUrl.trim()) {
          alert('გთხოვთ მიუთითოთ დოკუმენტის დასახელება და გარე ბმული (URL)');
          setSavingDoc(false);
          return;
        }
        created = await legalService.addDocument(legalCase.id, {
          title: docTitle.trim(),
          documentType: docType,
          fileUrl: docUrl.trim(),
          isVerified: true,
        });
      }

      if (created) {
        const refreshed = await legalService.getCaseById(legalCase.id);
        if (refreshed) {
          onCaseUpdated(refreshed);
        }
        setDocFile(null);
        setDocTitle('');
        setDocUrl('');
        setShowAddDocForm(false);
        showToast(
          docAddMode === 'file'
            ? 'ლოკალური ფაილი წარმატებით აიტვირთა და მიემაგრა საქმეს!'
            : 'გარე ბმული წარმატებით დაემატა საქმეს!',
        );
      } else {
        alert('დოკუმენტის დამატება ვერ მოხერხდა');
      }
    } catch (err) {
      console.error('Add document failed:', err);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setSavingNote(true);
      await legalService.addTimelineEvent(legalCase.id, {
        actionType: 'NOTE_ADDED',
        description: newNoteText.trim(),
        department: 'LEGAL',
      });

      const refreshed = await legalService.getCaseById(legalCase.id);
      if (refreshed) {
        onCaseUpdated(refreshed);
      }
      setNewNoteText('');
      showToast('ახალი საპროცესო ჩანაწერი დაფიქსირდა ისტორიაში!');
    } catch (err) {
      console.error('Timeline note failed:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const ratingGrade = legalCase.amounts.riskRating || 'B';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold shadow-inner shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {legalCase.debtor.isCompany ? 'domain' : 'gavel'}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {legalCase.debtor.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono text-xs font-bold">
                  #{legalCase.caseNumber}
                </span>
                {legalCase.courtCaseNumber && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]">
                    სასამართლო: {legalCase.courtCaseNumber}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    ratingGrade === 'C'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : ratingGrade === 'B'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}
                >
                  Grade {ratingGrade}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="font-mono">
                  {legalCase.debtor.isCompany ? 'ს/კ' : 'პ/ნ'}:{' '}
                  <strong className="text-slate-200">{legalCase.debtor.identification}</strong>
                </span>
                <span>•</span>
                <span>
                  კრედიტორი:{' '}
                  <strong className="text-slate-200">
                    {legalCase.creditorName || 'სს ლიდერ კრედიტი'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  სრული მოთხოვნა:{' '}
                  <strong className="text-rose-300 font-mono">
                    {legalCase.amounts.totalClaim.toLocaleString('ka-GE')} ₾
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition cursor-pointer self-start sm:self-center"
            title="დახურვა"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
          {[
            { id: 'dossier', label: '📋 დოსიე & დოკუმენტაცია' },
            {
              id: 'timeline',
              label: `🕒 ქრონოლოგია & ლოგი (${legalCase.timelineEvents?.length || 0})`,
            },
            { id: 'control', label: '⚖️ იურიდიული ქმედებების მართვა' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {localToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-base">
                  check_circle
                </span>
                <span>{localToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocalToast(null)}
                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* TAB 1: DOSSIER & DOCUMENTS */}
          {activeTab === 'dossier' && (
            <div className="space-y-5">
              {/* 4 Financial & Procedural KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="text-rose-700 text-xs font-semibold">სრული სადავო მოთხოვნა</div>
                  <div className="text-xl font-extrabold font-mono text-rose-800 mt-1">
                    {legalCase.amounts.totalClaim.toLocaleString('ka-GE')} ₾
                  </div>
                  <div className="text-[11px] text-rose-700/80 mt-1 font-mono">
                    ძირი: {legalCase.amounts.principalAmount.toLocaleString('ka-GE')} ₾
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-xs font-semibold">ჯარიმა / პირგასამტეხლო</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('control')}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      რედაქტირება
                    </button>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {legalCase.amounts.penaltyAmount.toLocaleString('ka-GE')} ₾
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    სახელმწიფო ბაჟი:{' '}
                    {legalCase.courtDutyFee !== null && legalCase.courtDutyFee !== undefined
                      ? `${legalCase.courtDutyFee.toLocaleString('ka-GE')} ₾`
                      : 'მითითებული არაა'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="text-amber-800 text-xs font-semibold">ვადაგადაცილება</div>
                  <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                    {legalCase.amounts.daysOverdue} დღე
                  </div>
                  <div className="text-[11px] text-amber-700 mt-1">
                    წარმოქმნა:{' '}
                    {legalCase.debtOriginationDate
                      ? String(legalCase.debtOriginationDate).slice(0, 10)
                      : '—'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="text-blue-800 text-xs font-semibold">სასამართლო / სხდომა</div>
                  <div className="text-sm font-bold text-blue-950 mt-1.5">
                    {legalCase.nextHearingDate
                      ? new Date(legalCase.nextHearingDate).toLocaleDateString('ka-GE')
                      : 'ჩანიშვნის მოლოდინში'}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1 truncate">
                    {legalCase.courtInstance || 'საქალაქო სასამართლო'}
                  </div>
                </div>
              </div>

              {/* Identity & Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-base">
                      {legalCase.debtor.isCompany ? 'domain' : 'person'}
                    </span>
                    <span>მოვალის საიდენტიფიკაციო მონაცემები</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 block">იურიდიული მისამართი:</span>
                      <span className="font-semibold text-slate-900">
                        {legalCase.debtor.legalAddress || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ფაქტობრივი მისამართი:</span>
                      <span className="font-semibold text-slate-900">
                        {legalCase.debtor.actualAddress || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ტელეფონი:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {legalCase.debtor.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ელ-ფოსტა:</span>
                      <span className="font-semibold text-blue-700 break-all">
                        {legalCase.debtor.email || '—'}
                      </span>
                    </div>
                    {legalCase.debtor.isCompany && (
                      <>
                        <div>
                          <span className="text-slate-500 block">ხელმძღვანელი / დირექტორი:</span>
                          <span className="font-semibold text-slate-900">
                            {legalCase.debtor.directorName || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">დირექტორის პ/ნ:</span>
                          <span className="font-mono font-semibold text-slate-900">
                            {legalCase.debtor.directorPin || '—'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Verified Documents */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-600 text-base">
                        verified_user
                      </span>
                      <span>დამოწმებული დოკუმენტაცია &amp; რეესტრები</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddDocForm((p) => !p)}
                      className="px-2.5 py-1 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-hover transition cursor-pointer"
                    >
                      {showAddDocForm ? 'გაუქმება' : '+ დოკუმენტის დამატება'}
                    </button>
                  </div>

                  {showAddDocForm && (
                    <form
                      onSubmit={handleAddDocument}
                      className="p-3.5 rounded-xl bg-white border border-blue-200 space-y-3"
                    >
                      {/* Mode Switcher: Local File vs External Link */}
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100">
                        <button
                          type="button"
                          onClick={() => setDocAddMode('file')}
                          className={`py-1.5 px-2.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            docAddMode === 'file'
                              ? 'bg-primary text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">upload_file</span>
                          <span>ლოკალური ფაილის ატვირთვა</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocAddMode('url')}
                          className={`py-1.5 px-2.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            docAddMode === 'url'
                              ? 'bg-primary text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">link</span>
                          <span>გარე ბმული (URL)</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required={docAddMode === 'url'}
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder={
                            docAddMode === 'file'
                              ? 'დოკუმენტის დასახელება (არასავალდებულო, აიღებს ფაილის სახელს)'
                              : 'დოკუმენტის დასახელება *'
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-primary"
                        />
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="LAWSUIT">სასამართლო სარჩელი</option>
                          <option value="PAYMENT_RECEIPT">ბაჟის გადახდის ქვითარი</option>
                          <option value="COURT_RULING">სასამართლო განჩინება / გადაწყვეტილება</option>
                          <option value="ENFORCEMENT_WRIT">სააღსრულებო ფურცელი</option>
                          <option value="WARNING_LETTER">ოფიციალური გაფრთხილება</option>
                          <option value="OTHER">სხვა დოკუმენტი</option>
                        </select>
                      </div>

                      {docAddMode === 'file' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <label className="flex-1 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/50 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                                attach_file
                              </span>
                              <span className="text-xs font-semibold text-slate-700 truncate">
                                {docFile
                                  ? `${docFile.name} (${(docFile.size / 1024).toFixed(1)} KB)`
                                  : 'აირჩიეთ ფაილი კომპიუტერიდან (PDF, სურათი, Word, Excel)...'}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-white border border-blue-200 text-[11px] font-bold text-primary shrink-0">
                              არჩევა
                            </span>
                            <input
                              type="file"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setDocFile(f);
                                if (f && !docTitle.trim()) {
                                  setDocTitle(f.name);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={savingDoc || !docFile}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {savingDoc ? 'იტვირთება...' : 'ატვირთვა'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            required
                            value={docUrl}
                            onChange={(e) => setDocUrl(e.target.value)}
                            placeholder="https://example.com/document.pdf *"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={savingDoc}
                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {savingDoc ? 'ინახება...' : 'მიმაგრება'}
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {legalCase.documents && legalCase.documents.length > 0 ? (
                      legalCase.documents.map((doc) => {
                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                        const resolvedHref = doc.fileUrl?.startsWith('/uploads/')
                          ? `${apiBase}${doc.fileUrl}`
                          : doc.fileUrl || '#';
                        return (
                          <a
                            key={doc.id}
                            href={resolvedHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-800 hover:text-blue-700 text-xs font-medium transition shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                              {doc.isVerified ? 'verified' : 'description'}
                            </span>
                            <span>{doc.title}</span>
                            {doc.fileSize && (
                              <span className="text-[10px] font-mono text-slate-400">
                                ({doc.fileSize})
                              </span>
                            )}
                          </a>
                        );
                      })
                    ) : (
                      <div className="text-slate-500 py-4">
                        დოკუმენტები ჯერჯერობით მიბმული არ არის.
                      </div>
                    )}
                  </div>
                  {legalCase.legalOpinion && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        იურისტის დასკვნა:
                      </span>
                      <p className="leading-relaxed">{legalCase.legalOpinion}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & ADD PROCEDURAL NOTE */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              <form
                onSubmit={handleAddTimelineNote}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">
                    edit_note
                  </span>
                  <span>ახალი საპროცესო ჩანაწერის დამატება ისტორიაში</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="მაგ: მომზადდა სარჩელი, გადამოწმდა მოპასუხის ქონებრივი მდგომარეობა..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-primary hover:bg-[#0A37CA] text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer shrink-0 self-end sm:self-stretch"
                  >
                    {savingNote ? 'იწერება...' : '+ დაფიქსირება'}
                  </button>
                </div>
              </form>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {legalCase.timelineEvents && legalCase.timelineEvents.length > 0 ? (
                  legalCase.timelineEvents.map((t) => {
                    const isLegal = t.department === 'LEGAL';
                    const isField = t.department === 'FIELD_VISIT';
                    const isCall = t.department === 'CALL_CENTER';

                    const iconName = isLegal
                      ? 'gavel'
                      : isField
                      ? 'pin_drop'
                      : isCall
                      ? 'call'
                      : 'assignment_ind';
                    const circleColor = isLegal
                      ? 'bg-purple-600'
                      : isField
                      ? 'bg-amber-500'
                      : isCall
                      ? 'bg-sky-600'
                      : 'bg-slate-400';
                    const boxColor = isLegal
                      ? 'bg-purple-50/70 border-purple-100 text-purple-950'
                      : isField
                      ? 'bg-amber-50/60 border-amber-100 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800';

                    return (
                      <div key={t.id} className="relative">
                        <span
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full ${circleColor} text-white flex items-center justify-center ring-4 ring-white`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {iconName}
                          </span>
                        </span>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-slate-900">
                            {t.authorRoleTitle}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {new Date(t.createdAt).toLocaleDateString('ka-GE', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className={`text-xs p-2.5 rounded-lg border ${boxColor}`}>
                          {t.description}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-4">
                    ინტერაქციების ისტორია ჯერჯერობით ცარიელია.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LEGAL ACTION CONTROL CENTER */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  სამართლებრივი ეტაპის გადაყვანა:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-medium">
                  {[
                    { id: 'OFFICIAL_WARNING', label: 'გაფრთხილება' },
                    { id: 'LAWSUIT_PREPARATION', label: 'სარჩელის მომზადება' },
                    { id: 'COURT_PROCEEDINGS', label: 'სასამართლო' },
                    { id: 'SETTLEMENT', label: 'მორიგება' },
                    { id: 'ENFORCEMENT', label: 'სააღსრულებო' },
                    { id: 'CLOSED', label: 'დასრულებული' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setCurrentStage(st.id)}
                      className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                        currentStage === st.id
                          ? 'bg-primary text-white font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    პირგასამტეხლო, სახელმწიფო ბაჟი და სასამართლო რეკვიზიტები (ხელით მართვა)
                  </span>
                  <span className="text-[11px] font-mono text-slate-600">
                    ძირი: {legalCase.amounts.principalAmount.toLocaleString('ka-GE')} ₾ •{' '}
                    განახლებული მოთხოვნა:{' '}
                    <strong className="text-rose-700">
                      {Math.max(
                        0,
                        legalCase.amounts.totalClaim -
                          legalCase.amounts.penaltyAmount +
                          (Number(penaltyAmountInput) || 0),
                      ).toLocaleString('ka-GE')}{' '}
                      ₾
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      პირგასამტეხლო / ჯარიმა (₾):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={penaltyAmountInput}
                      onChange={(e) => setPenaltyAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      სახელმწიფო ბაჟი (₾):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={courtDutyFeeInput}
                      onChange={(e) => setCourtDutyFeeInput(e.target.value)}
                      placeholder="შეიყვანეთ ბაჟის თანხა"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      მომდევნო სასამართლო სხდომა:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={nextHearingDate}
                        onChange={(e) => setNextHearingDate(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                      />
                      {nextHearingDate && (
                        <button
                          type="button"
                          onClick={() => setNextHearingDate('')}
                          title="თარიღის გასუფთავება"
                          className="px-2 py-2 rounded-lg border border-slate-300 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      სასამართლო ინსტანცია:
                    </label>
                    <select
                      value={courtInstanceInput}
                      onChange={(e) => setCourtInstanceInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">აირჩიეთ სასამართლო ინსტანცია...</option>
                      {courtInstanceInput &&
                        !COURT_INSTANCE_OPTIONS.includes(courtInstanceInput) && (
                          <option value={courtInstanceInput}>{courtInstanceInput}</option>
                        )}
                      {COURT_INSTANCE_OPTIONS.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      სასამართლოს საქმის N:
                    </label>
                    <input
                      type="text"
                      value={courtCaseNumberInput}
                      onChange={(e) => setCourtCaseNumberInput(e.target.value)}
                      placeholder="მაგ: #3/1142-24"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      მოსამართლე / პრიორიტეტი:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={judgeNameInput}
                        onChange={(e) => setJudgeNameInput(e.target.value)}
                        placeholder="მოსამართლე"
                        className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="HIGH">მაღალი</option>
                        <option value="MEDIUM">საშუალო</option>
                        <option value="LOW">დაბალი</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">
                  სავალდებულო საკონტროლო ეტაპები:
                </span>
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warningSent}
                    onChange={(e) => setWarningSent(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                  />
                  <span className={warningSent ? 'line-through text-slate-500' : 'font-medium'}>
                    გაფრთხილების წერილი გაგზავნილია
                  </span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lawsuitDrafted}
                    onChange={(e) => setLawsuitDrafted(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                  />
                  <span className="font-medium">სარჩელის პროექტი შედგენილია</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-rose-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dutyPaid}
                    onChange={(e) => setDutyPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                  />
                  <span className="font-semibold">
                    სახელმწიფო ბაჟი (
                    {courtDutyFeeInput.trim() !== '' && !Number.isNaN(Number(courtDutyFeeInput))
                      ? `${Number(courtDutyFeeInput).toLocaleString('ka-GE')} ₾`
                      : 'თანხა მითითებული არაა'}
                    ) გადახდილია
                  </span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  იურიდიული დასკვნა / სამართლებრივი შენიშვნა:
                </label>
                <textarea
                  value={opinionText}
                  onChange={(e) => setOpinionText(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs focus:outline-none focus:border-primary"
                  placeholder="ჩაწერეთ იურიდიული კომენტარი ან დასკვნა საქმის მიმდინარეობის შესახებ..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveControlCenter}
                  disabled={savingAction}
                  className="px-5 py-2.5 bg-primary hover:bg-[#0A37CA] text-white font-bold text-xs rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>
                    {savingAction ? 'ინახება ბაზაში...' : 'სტატუსის განახლება და დაფიქსირება'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-blue-600">verified</span>
            <span>საქმის მონაცემები სინქრონიზებულია PostgreSQL და სასამართლო რეესტრთან</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => onExportSingle(legalCase)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Excel ექსპორტი</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition cursor-pointer"
            >
              დახურვა
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
