'use client';

import React, { useState, useEffect } from 'react';
import { DetailedLegalCase } from '@/types';
import { legalService } from '@/services';

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
  const [opinionText, setOpinionText] = useState<string>('');
  const [warningSent, setWarningSent] = useState(false);
  const [lawsuitDrafted, setLawsuitDrafted] = useState(false);
  const [dutyPaid, setDutyPaid] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

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
    setOpinionText(legalCase.legalOpinion || '');
    setWarningSent(Boolean(legalCase.checklistWarningSent));
    setLawsuitDrafted(Boolean(legalCase.checklistLawsuitDrafted));
    setDutyPaid(Boolean(legalCase.checklistDutyPaid));
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
      const updated = await legalService.updateCase(legalCase.id, {
        stage: currentStage,
        priority,
        nextHearingDate: nextHearingDate || undefined,
        legalOpinion: opinionText,
        checklistWarningSent: warningSent,
        checklistLawsuitDrafted: lawsuitDrafted,
        checklistDutyPaid: dutyPaid,
      });

      if (updated) {
        onCaseUpdated(updated);
        showToast('საქმის სტატუსი და საკონტროლო ეტაპები წარმატებით შეინახა ბაზაში!');
      }
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSavingAction(false);
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
                  <div className="text-slate-500 text-xs font-semibold">ჯარიმა / პირგასამტეხლო</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                    {legalCase.amounts.penaltyAmount.toLocaleString('ka-GE')} ₾
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    ბაჟი (3%): {legalCase.courtDutyFee ? `${legalCase.courtDutyFee} ₾` : '—'}
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
                  <div className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-base">
                      verified_user
                    </span>
                    <span>დამოწმებული დოკუმენტაცია &amp; რეესტრები</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {legalCase.documents && legalCase.documents.length > 0 ? (
                      legalCase.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 text-slate-800 hover:text-blue-700 text-xs font-medium transition shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">
                            {doc.isVerified ? 'verified' : 'description'}
                          </span>
                          <span>{doc.title}</span>
                        </a>
                      ))
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    საქმის პრიორიტეტი:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="HIGH">მაღალი პრიორიტეტი</option>
                    <option value="MEDIUM">საშუალო პრიორიტეტი</option>
                    <option value="LOW">დაბალი პრიორიტეტი</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    მომდევნო სასამართლო სხდომა:
                  </label>
                  <input
                    type="date"
                    value={nextHearingDate}
                    onChange={(e) => setNextHearingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                  />
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
                    გაფრთხილების წერილი გაგზავნილია (RS.GE ფოსტით)
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
                    სახელმწიფო ბაჟი (3% — ₾{legalCase.courtDutyFee || '744'}) გადახდილია
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
