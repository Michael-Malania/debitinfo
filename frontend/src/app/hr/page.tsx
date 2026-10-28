'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, opsBackendService } from '@/services';

export default function HrPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);

  // Live Staff State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeDossierTab, setActiveDossierTab] = useState<'tab-docs' | 'tab-bank' | 'tab-discipline' | 'tab-access'>('tab-docs');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New staff form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+995 599 ');
  const [newRole, setNewRole] = useState<'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL' | 'ADMIN'>('OPERATOR');
  const [newDepartment, setNewDepartment] = useState('ქოლ-ცენტრი & მოლაპარაკებები');
  const [newLegalAddress, setNewLegalAddress] = useState('');
  const [newActualAddress, setNewActualAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaffData = async () => {
    setLoadingStaff(true);
    try {
      const data = await opsBackendService.getStaff();
      setStaffList(data || []);
      if (data && data.length > 0) {
        setSelectedStaff((prev: any) => {
          if (!prev) return data[0];
          const found = data.find((s: any) => s.id === prev.id);
          return found || data[0];
        });
      }
    } catch (err) {
      console.warn('Could not load staff data:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/hr');
      return;
    }
    if (u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadStaffData();
  }, [router]);

  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newPersonalId.trim() || !newEmail.trim()) {
      alert('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setIsSubmitting(true);
    try {
      await opsBackendService.createStaff({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        fullName: `${newFirstName.trim()} ${newLastName.trim()}`,
        personalId: newPersonalId.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        role: newRole,
        department: newDepartment,
        legalAddress: newLegalAddress.trim(),
        actualAddress: newActualAddress.trim() || newLegalAddress.trim(),
      });

      setActionSuccessMessage(`თანამშრომელი ${newFirstName} ${newLastName} წარმატებით დარეგისტრირდა!`);
      setIsRegisterModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPersonalId('');
      setNewEmail('');
      setNewLegalAddress('');
      setNewActualAddress('');
      setTimeout(() => setActionSuccessMessage(null), 5000);
      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'თანამშრომლის რეგისტრაცია ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    if (deptFilter !== 'ALL' && s.role !== deptFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = s.staffProfile?.fullName?.toLowerCase() || '';
    const email = s.email.toLowerCase();
    const pin = s.personalId || '';
    const dept = s.staffProfile?.department?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || pin.includes(q) || dept.includes(q);
  });

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  const roleTitlesKa: Record<string, string> = {
    ADMIN: 'სისტემური ადმინისტრატორი',
    ANALYST: 'ფინანსური ანალიტიკოსი',
    LEGAL: 'იურისტი',
    OPERATOR: 'ქოლ-ცენტრის ოპერატორი',
    FIELD_OFFICER: 'საველე ვიზიტორი',
  };

  return (
    <div className="h-full text-text-primary bg-surface-bg flex flex-col font-body-md text-body-md antialiased overflow-hidden">
      <div>
        {/* TOP APP BAR */}
        <header className="docked full-width top-0 sticky z-40 border-b border-border-subtle shadow-sm flex justify-between items-center w-full px-space-lg h-16 bg-surface-container-lowest">
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-space-xs group cursor-pointer">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight group-hover:underline">
                Debitinfo.GE
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-accent-mint/20 text-[#047857] border border-accent-mint/30 ml-2 font-semibold">
                HR &amp; ადმინისტრატორი Live
              </span>
            </Link>
            {/* Search Bar */}
            <div className="relative w-80 md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md font-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
                placeholder="მოძებნეთ თანამშრომელი სახელით, პ/ნ, როლით..."
                type="text"
              />
            </div>
          </div>

          {/* Trailing Actions & User info */}
          <div className="flex items-center gap-space-md">
            <Link
              href="/ops"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
              title="საოპერაციო ცენტრში გადასვლა"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
            </Link>

            <div className="h-6 w-px bg-border-subtle" />
            {/* Profile Section */}
            <div className="flex items-center gap-space-sm pl-1">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-body-sm border border-primary/20">
                HR
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-body-sm font-body-sm font-semibold text-text-primary leading-tight">
                  {currentUser?.name || currentUser?.email || 'ადმინისტრატორი'}
                </span>
                <span className="text-label-sm font-label-sm text-text-muted">HR &amp; Security</span>
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
        </header>

        {actionSuccessMessage && (
          <div className="max-w-[1720px] mx-auto px-4 lg:px-8 mt-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-medium">{actionSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* BODY CONTENT AREA */}
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
              <div>
                <h1 className="text-headline-lg font-headline-lg text-text-primary font-bold">
                  თანამშრომელთა მენეჯმენტი და პერსონალის დოსიე
                </h1>
                <p className="text-body-md font-body-md text-text-muted mt-0.5">
                  კადრების რეესტრი, როლები, საკონტაქტო პირები და ციფრული კანცელარია (Live PostgreSQL)
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary rounded-lg text-body-md font-body-md hover:bg-[#0A37CA] transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ ახალი თანამშრომლის რეგისტრაცია</span>
                </button>
              </div>
            </div>

            {/* 4 KPI SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">სულ თანამშრომელი</span>
                <div className="mt-2 text-headline-lg font-bold text-text-primary">{staffList.length}</div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">
                  აქტიური შტატი: {staffList.filter((s) => s.status === 'ACTIVE').length} კადრი
                </div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">იურისტები &amp; სააღსრულებო</span>
                <div className="mt-2 text-headline-lg font-bold text-primary">
                  {staffList.filter((s) => s.role === 'LEGAL').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">სასამართლო &amp; აღსრულება</div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">ქოლ-ცენტრის ოპერატორები</span>
                <div className="mt-2 text-headline-lg font-bold text-emerald-700">
                  {staffList.filter((s) => s.role === 'OPERATOR').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">CRM კომუნიკაციები</div>
              </div>
              <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                <span className="text-body-sm font-medium text-text-muted">საველე ოფიცრები</span>
                <div className="mt-2 text-headline-lg font-bold text-amber-700">
                  {staffList.filter((s) => s.role === 'FIELD_OFFICER').length}
                </div>
                <div className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">ინსპექცია &amp; ვიზიტები</div>
              </div>
            </div>

            {/* MAIN SPLIT WORKSPACE: Employee Registry (Left) + Dossier Preview (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT/CENTER: Employee Registry */}
              <div className="xl:col-span-7 flex flex-col gap-4">
                <div className="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-sm">
                  {/* Department Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3 border-b border-border-subtle">
                    {[
                      { key: 'ALL', label: `ყველა (${staffList.length})` },
                      { key: 'ANALYST', label: `ანალიტიკოსები (${staffList.filter((s) => s.role === 'ANALYST').length})` },
                      { key: 'LEGAL', label: `იურისტები (${staffList.filter((s) => s.role === 'LEGAL').length})` },
                      { key: 'OPERATOR', label: `ქოლ-ცენტრი (${staffList.filter((s) => s.role === 'OPERATOR').length})` },
                      { key: 'FIELD_OFFICER', label: `ვიზიტორები (${staffList.filter((s) => s.role === 'FIELD_OFFICER').length})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDeptFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-body-sm font-medium shrink-0 transition-colors cursor-pointer ${
                          deptFilter === tab.key
                            ? 'bg-primary text-on-primary font-semibold'
                            : 'text-text-muted hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Employee Table */}
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F1F5F9] text-text-muted text-label-sm font-label-sm uppercase tracking-wider">
                          <th className="py-2.5 px-3">თანამშრომელი</th>
                          <th className="py-2.5 px-3">პოზიცია &amp; დეპარტამენტი</th>
                          <th className="py-2.5 px-3">კონტაქტი</th>
                          <th className="py-2.5 px-3 text-center">სტატუსი</th>
                          <th className="py-2.5 px-3 text-right">ქმედებები</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-body-sm font-body-sm">
                        {loadingStaff && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-text-muted">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              თანამშრომლები იტვირთება...
                            </td>
                          </tr>
                        )}
                        {!loadingStaff && filteredStaff.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-text-muted">
                              თანამშრომლები არ მოიძებნა
                            </td>
                          </tr>
                        )}
                        {filteredStaff.map((staff) => {
                          const isSelected = selectedStaff?.id === staff.id;
                          const name = staff.staffProfile?.fullName || staff.email;

                          return (
                            <tr
                              key={staff.id}
                              onClick={() => setSelectedStaff(staff)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#EFF6FF] border-l-4 border-l-primary'
                                  : 'hover:bg-surface-bg'
                              }`}
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {name.substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-text-primary">{name}</span>
                                    <span className="font-label-sm text-label-sm text-text-muted font-mono">
                                      {staff.personalId}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-text-primary">{roleTitlesKa[staff.role] || staff.role}</span>
                                  <span className="text-text-muted text-[11px]">{staff.staffProfile?.department || 'დეპარტამენტი'}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-label-sm text-label-sm">
                                <div className="flex flex-col">
                                  <span className="text-text-primary">{staff.phone || staff.email}</span>
                                  <span className="text-text-muted text-[11px]">{staff.email}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-mint/20 text-[#047857]">
                                  {staff.status === 'ACTIVE' ? 'აქტიური' : staff.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStaff(staff);
                                  }}
                                  className="p-1 rounded text-primary hover:bg-white shadow-xs cursor-pointer"
                                  title="დოსიეს ნახვა"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RIGHT: Selected Staff Dossier */}
              <div className="xl:col-span-5 flex flex-col gap-4">
                {selectedStaff ? (
                  <div className="bg-surface-card border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF] border-b border-border-subtle">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            {(selectedStaff.staffProfile?.fullName || selectedStaff.email).substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                              {selectedStaff.staffProfile?.fullName || selectedStaff.email}
                            </h2>
                            <span className="text-body-sm font-body-sm text-text-muted">
                              {roleTitlesKa[selectedStaff.role] || selectedStaff.role} • {selectedStaff.staffProfile?.department}
                            </span>
                            <span className="text-label-sm font-label-sm text-text-muted font-mono mt-0.5">
                              პ/ნ: {selectedStaff.personalId} | {selectedStaff.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-subtle/70 text-body-sm font-body-sm">
                        <div>
                          <span className="text-label-sm text-text-muted block">ტელეფონი:</span>
                          <span className="font-medium text-text-primary font-mono">{selectedStaff.phone || 'მითითებული არაა'}</span>
                        </div>
                        <div>
                          <span className="text-label-sm text-text-muted block">სისტემური როლი:</span>
                          <span className="font-medium text-primary font-semibold">{selectedStaff.role}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Address Snapshot */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-border-subtle text-xs space-y-1">
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">home</span>
                          მისამართის რეკვიზიტები
                        </div>
                        <p className="text-text-muted">
                          <strong>იურიდიული:</strong> {selectedStaff.staffProfile?.legalAddress || 'მითითებული არაა'}
                        </p>
                        <p className="text-text-muted">
                          <strong>ფაქტობრივი:</strong> {selectedStaff.staffProfile?.actualAddress || 'მითითებული არაა'}
                        </p>
                      </div>

                      {/* Contact Person Details */}
                      {selectedStaff.staffProfile?.contactPersons && selectedStaff.staffProfile.contactPersons.length > 0 ? (
                        <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-xs space-y-1">
                          <div className="font-semibold text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">contact_emergency</span>
                            საკონტაქტო / სანდო პირი (მინდობილი)
                          </div>
                          {selectedStaff.staffProfile.contactPersons.map((cp: any, idx: number) => (
                            <div key={idx} className="pt-1 border-t border-blue-100 first:border-0 first:pt-0">
                              <p className="font-semibold text-slate-800">
                                {cp.firstName} {cp.lastName} ({cp.relationType})
                              </p>
                              <p className="text-slate-600 font-mono">ტელ: {cp.phone}</p>
                              {cp.email && <p className="text-slate-600">ელფოსტა: {cp.email}</p>}
                              {cp.address && <p className="text-slate-600">მისამართი: {cp.address}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border border-dashed border-border-subtle text-xs text-text-muted text-center">
                          საკონტაქტო პირი ჯერ არ არის დამატებული
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 bg-surface-card rounded-xl border border-border-subtle text-center text-text-muted">
                    აირჩიეთ თანამშრომელი დოსიეს სანახავად
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* REGISTER EMPLOYEE MODAL */}
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border-subtle space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="text-headline-sm font-bold text-text-primary">ახალი თანამშრომლის რეგისტრაცია</h3>
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-text-muted cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleRegisterEmployee} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">სახელი *</label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="მაგ: გიორგი"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">გვარი *</label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="მაგ: ბერიძე"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">პირადი ნომერი (11 ნიშნა) *</label>
                    <input
                      type="text"
                      required
                      value={newPersonalId}
                      onChange={(e) => setNewPersonalId(e.target.value)}
                      placeholder="01019012345"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">ელ. ფოსტა *</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="employee@debitinfo.ge"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">ტელეფონი</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">როლი *</label>
                    <select
                      value={newRole}
                      onChange={(e: any) => {
                        const r = e.target.value;
                        setNewRole(r);
                        if (r === 'ANALYST') setNewDepartment('რისკების ანალიტიკა & რეესტრი');
                        else if (r === 'LEGAL') setNewDepartment('იურიდიული დეპარტამენტი');
                        else if (r === 'OPERATOR') setNewDepartment('ქოლ-ცენტრი & მოლაპარაკებები');
                        else if (r === 'FIELD_OFFICER') setNewDepartment('საველე მონიტორინგი & ინსპექცია');
                      }}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                    >
                      <option value="OPERATOR">ქოლ-ცენტრის ოპერატორი</option>
                      <option value="ANALYST">ფინანსური ანალიტიკოსი</option>
                      <option value="LEGAL">იურისტი</option>
                      <option value="FIELD_OFFICER">საველე ვიზიტორი</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">იურიდიული მისამართი</label>
                  <input
                    type="text"
                    value={newLegalAddress}
                    onChange={(e) => setNewLegalAddress(e.target.value)}
                    placeholder="ქ. თბილისი, რუსთაველის გამზ. #1"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-primary-container hover:bg-primary text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'რეგისტრირდება...' : 'დარეგისტრირება'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
