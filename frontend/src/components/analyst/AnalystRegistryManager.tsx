'use client';

import React, { useState } from 'react';

interface AnalystRegistryManagerProps {
  users: any[];
  excelDebtors: any[];
  excelCreditors: any[];
  syncingExcel: boolean;
  loadingData: boolean;
  actionSuccessMessage: string | null;
  onSyncExcel: () => void;
  onRefreshData: () => void;
  onDismissMessage: () => void;
  onAssignRole: (
    user: any,
    role: 'DEBTOR' | 'CREDITOR',
    agreement?: string,
    amount?: number,
    registryItemId?: string
  ) => Promise<void>;
}

export default function AnalystRegistryManager({
  users,
  excelDebtors,
  excelCreditors,
  syncingExcel,
  loadingData,
  actionSuccessMessage,
  onSyncExcel,
  onRefreshData,
  onDismissMessage,
  onAssignRole,
}: AnalystRegistryManagerProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'debtors' | 'creditors'>('users');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [targetRole, setTargetRole] = useState<'DEBTOR' | 'CREDITOR'>('DEBTOR');
  const [assignAmount, setAssignAmount] = useState('1540');
  const [assignAgreement, setAssignAgreement] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  const regularUsersCount = users.filter((u) => u.role === 'REGULAR').length;

  const handleOpenAssignModal = (user: any, role: 'DEBTOR' | 'CREDITOR') => {
    setTargetUser(user);
    setTargetRole(role);
    setAssignAmount('1540');
    setAssignAgreement(`AGR-${Math.floor(10000 + Math.random() * 90000)}`);
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!targetUser) return;
    setAssigningLoading(true);
    try {
      await onAssignRole(
        targetUser,
        targetRole,
        assignAgreement,
        Number(assignAmount)
      );
      setAssignModalOpen(false);
    } finally {
      setAssigningLoading(false);
    }
  };

  return (
    <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm space-y-5">
      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button onClick={onDismissMessage} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Header & Major Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
              მომხმარებელთა &amp; Excel რეესტრების მართვა
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-label-sm font-mono font-bold">
              ანალიტიკოსის კონსოლი
            </span>
          </div>
          <p className="text-body-sm font-body-sm text-text-muted mt-0.5">
            მომხმარებლები რეგისტრირდებიან როგორც ჩვეულებრივი მომხმარებლები. ანალიტიკოსი ახდენს მათ რეგისტრაციას დებიტორად ან კრედიტორად Excel-ის ცხრილებთან სინქრონიზაციით.
          </p>
        </div>

        {/* Action: Excel Synchronization & Refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onSyncExcel}
            disabled={syncingExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-body-sm shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Excel-ის დებიტორებისა და კრედიტორების ცხრილების სინქრონიზაცია ბაზასთან"
          >
            <span className={`material-symbols-outlined text-[18px] ${syncingExcel ? 'animate-spin' : ''}`}>
              {syncingExcel ? 'sync' : 'cloud_sync'}
            </span>
            <span>{syncingExcel ? 'სინქრონიზაცია...' : 'Excel რეესტრის სინქრონიზაცია'}</span>
          </button>
          <button
            onClick={onRefreshData}
            disabled={loadingData}
            className="p-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-text-muted hover:text-text-primary transition cursor-pointer"
            title="მონაცემების განახლება"
          >
            <span className={`material-symbols-outlined text-[18px] ${loadingData ? 'animate-spin' : ''}`}>
              autorenew
            </span>
          </button>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-body-sm font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'users'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>მომხმარებელთა როლები &amp; რეგისტრაცია</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
            {regularUsersCount} მოლოდინში
          </span>
        </button>

        <button
          onClick={() => setActiveTab('debtors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-body-sm font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'debtors'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>დებიტორთა რეესტრი (Excel ცხრილი)</span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-mono">
            {excelDebtors.length} ჩანაწერი
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creditors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-body-sm font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'creditors'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          <span>კრედიტორთა რეესტრი (Excel ცხრილი)</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-mono">
            {excelCreditors.length} ჩანაწერი
          </span>
        </button>
      </div>

      {/* TAB 1: USERS & ROLE ASSIGNMENT TABLE */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body-sm text-text-muted">
            <span>პლატფორმაზე რეგისტრირებული ყველა მომხმარებელი (სტატუსის მინიჭებამდე არიან ჩვეულებრივი მომხმარებლები).</span>
            <span className="font-mono text-xs">სულ: {users.length} მომხმარებელი</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">მომხმარებელი &amp; ელფოსტა</th>
                  <th className="py-3 px-4">პირადი ნომერი / ს/კ</th>
                  <th className="py-3 px-4">სუბიექტის ტიპი</th>
                  <th className="py-3 px-4">მიმდინარე როლი</th>
                  <th className="py-3 px-4">RS.GE სტატუსი</th>
                  <th className="py-3 px-4 text-right">ანალიტიკოსის მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
                {users.map((u) => {
                  const isRegular = u.role === 'REGULAR';
                  const isDebtor = u.role === 'DEBTOR';
                  const isCreditor = u.role === 'CREDITOR';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary text-body-sm">{u.name}</div>
                        <div className="text-[12px] text-text-muted font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] font-bold text-text-primary">
                        {u.personalId}
                      </td>
                      <td className="py-3.5 px-4 text-body-sm">
                        {u.entityType === 'LEGAL' ? (
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <span className="material-symbols-outlined text-[16px]">domain</span> იურიდიული პირი
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <span className="material-symbols-outlined text-[16px]">person</span> ფიზიკური პირი
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isRegular && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            ჩვეულებრივი მომხმარებელი (A)
                          </span>
                        )}
                        {isDebtor && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            დებიტორი (აქტიური ვალი)
                          </span>
                        )}
                        {isCreditor && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            კრედიტორი (გამსესხებელი)
                          </span>
                        )}
                        {!isRegular && !isDebtor && !isCreditor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isRsVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">verified</span> დადასტურებული
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">მოლოდინში</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAssignModal(u, 'DEBTOR')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="მომხმარებლის დებიტორად რეგისტრაცია"
                          >
                            <span className="material-symbols-outlined text-[15px]">badge</span>
                            <span>დებიტორად რეგ.</span>
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(u, 'CREDITOR')}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="მომხმარებლის კრედიტორად რეგისტრაცია"
                          >
                            <span className="material-symbols-outlined text-[15px]">domain</span>
                            <span>კრედიტორად რეგ.</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEL DEBTORS REGISTRY TABLE */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body-sm text-text-muted">
            <span>დებიტორთა ოფიციალური ცხრილი (Excel რეესტრიდან დასინქრონირებული).</span>
            <span className="font-mono text-xs">სულ ჩანაწერი: {excelDebtors.length}</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">პირადი ნომერი</th>
                  <th className="py-3 px-4">მოვალის სახელი &amp; გვარი</th>
                  <th className="py-3 px-4">ორგანიზაცია / დამსაქმებელი</th>
                  <th className="py-3 px-4">ხელშეკრულების №</th>
                  <th className="py-3 px-4">დავალიანება (GEL)</th>
                  <th className="py-3 px-4">კრედიტორი</th>
                  <th className="py-3 px-4">ვადაგადაცილება</th>
                  <th className="py-3 px-4">საიტზე რეგისტრაცია</th>
                  <th className="py-3 px-4 text-right">ანალიტიკოსის მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
                {excelDebtors.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary text-[13px]">
                      {d.personalId}
                    </td>
                    <td className="py-3 px-4 font-medium text-text-primary">
                      {d.name}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-body-sm">
                      {d.companyOrPerson || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {d.agreementNumber || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {Number(d.amount).toLocaleString('ka-GE')} ₾
                    </td>
                    <td className="py-3 px-4 text-body-sm text-text-primary">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          საიტზეა ({d.matchedUser?.role})
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">არ არის რეგისტრირებული</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.isRegisteredOnPlatform ? (
                        <button
                          onClick={() =>
                            onAssignRole(
                              { id: d.matchedUser.id, name: d.name, email: d.matchedUser.email },
                              'DEBTOR',
                              d.agreementNumber,
                              Number(d.amount),
                              d.id
                            )
                          }
                          disabled={d.matchedUser.role === 'DEBTOR'}
                          className="px-3 py-1 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {d.matchedUser.role === 'DEBTOR' ? 'უკვე დებიტორია' : 'დებიტორად გააქტიურება'}
                        </button>
                      ) : (
                        <span className="text-text-muted text-xs italic">რეგისტრაციის მოლოდინში</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXCEL CREDITORS REGISTRY TABLE */}
      {activeTab === 'creditors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body-sm text-text-muted">
            <span>კრედიტორთა ოფიციალური ცხრილი (Excel რეესტრიდან დასინქრონირებული).</span>
            <span className="font-mono text-xs">სულ ჩანაწერი: {excelCreditors.length}</span>
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
                  <th className="py-3 px-4">საიტზე რეგისტრაცია</th>
                  <th className="py-3 px-4 text-right">ანალიტიკოსის მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
                {excelCreditors.map((c) => (
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
                      {c.isRegisteredOnPlatform ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          საიტზეა ({c.matchedUser?.role})
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">არ არის რეგისტრირებული</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.isRegisteredOnPlatform ? (
                        <button
                          onClick={() =>
                            onAssignRole(
                              { id: c.matchedUser.id, name: c.name, email: c.matchedUser.email },
                              'CREDITOR',
                              c.agreementNumber,
                              Number(c.amount),
                              c.id
                            )
                          }
                          disabled={c.matchedUser.role === 'CREDITOR'}
                          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {c.matchedUser.role === 'CREDITOR' ? 'უკვე კრედიტორია' : 'კრედიტორად გააქტიურება'}
                        </button>
                      ) : (
                        <span className="text-text-muted text-xs italic">რეგისტრაციის მოლოდინში</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLE ASSIGNMENT POPUP MODAL */}
      {assignModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setAssignModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border-subtle z-10 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${targetRole === 'DEBTOR' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {targetRole === 'DEBTOR' ? 'badge' : 'domain'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-body-lg">
                    {targetRole === 'DEBTOR' ? 'დებიტორის სტატუსის მინიჭება' : 'კრედიტორის სტატუსის მინიჭება'}
                  </h3>
                  <span className="text-xs text-text-muted">მომხმარებლის როლის განახლება ანალიტიკოსის მიერ</span>
                </div>
              </div>
              <button onClick={() => setAssignModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Target User Info Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-body-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">მომხმარებელი:</span>
                <span className="font-semibold text-text-primary">{targetUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">პირადი ნომერი / ს/კ:</span>
                <span className="font-mono font-bold text-primary">{targetUser.personalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">ელფოსტა:</span>
                <span className="font-mono text-text-muted">{targetUser.email}</span>
              </div>
            </div>

            {/* Target Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-body-sm font-semibold text-text-primary">სამიზნე როლი</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetRole('DEBTOR')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    targetRole === 'DEBTOR'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20'
                      : 'border-border-subtle text-text-muted hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>დებიტორი (DEBTOR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('CREDITOR')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                    targetRole === 'CREDITOR'
                      ? 'bg-purple-50 border-purple-600 text-purple-700 ring-2 ring-purple-600/20'
                      : 'border-border-subtle text-text-muted hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">domain</span>
                  <span>კრედიტორი (CREDITOR)</span>
                </button>
              </div>
            </div>

            {/* If Debtor: Contract & Amount */}
            {targetRole === 'DEBTOR' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">ხელშეკრულების ნომერი</label>
                  <input
                    type="text"
                    value={assignAgreement}
                    onChange={(e) => setAssignAgreement(e.target.value)}
                    placeholder="მაგ: AGR-99214"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">მოთხოვნის / დავალიანების თანხა (GEL)</label>
                  <input
                    type="number"
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    placeholder="1540"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm font-medium cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="button"
                disabled={assigningLoading}
                onClick={handleConfirmAssign}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-body-sm shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {assigningLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>დადასტურება &amp; როლის მინიჭება</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
