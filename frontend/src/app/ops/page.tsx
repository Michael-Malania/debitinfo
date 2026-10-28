'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, opsBackendService } from '@/services';

const STAFF_ROLE_OPTIONS = [
  {
    role: 'FIELD_OFFICER',
    department: 'საველე მონიტორინგი & ინსპექცია',
    label: '📍 საველე ვიზიტორი — საველე მონიტორინგი & ინსპექცია (Field Visits & Inspection)',
  },
  {
    role: 'ANALYST',
    department: 'რისკების ანალიტიკა & რეესტრი',
    label: '📊 ფინანსური ანალიტიკოსი — რისკების ანალიტიკა & რეესტრი (Risk Analysis & Registry)',
  },
  {
    role: 'OPERATOR',
    department: 'ქოლ-ცენტრი & მოლაპარაკებები (CRM)',
    label: '🎧 ქოლ-ცენტრის ოპერატორი — მოლაპარაკებები & CRM (Call Center)',
  },
  {
    role: 'LEGAL',
    department: 'იურიდიული დეპარტამენტი & სააღსრულებო',
    label: '⚖️ იურისტი — იურიდიული დეპარტამენტი & სააღსრულებო (Legal & Enforcement)',
  },
  {
    role: 'ACCOUNTANT',
    department: 'ფინანსური აღრიცხვა & ბუღალტერია',
    label: '💼 მთავარი ბუღალტერი — ფინანსური აღრიცხვა & გადახდების დასტური (Finance & Accounting)',
  },
  {
    role: 'ADMIN',
    department: 'მენეჯმენტი & IT ადმინისტრირება',
    label: '🛡️ სისტემური ადმინისტრატორი — მენეჯმენტი & IT (Management & IT)',
  },
];

export default function OpsPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Staff Management State
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Add / Invite Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPersonalId, setNewPersonalId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+995 599 ');
  const [newLegalAddress, setNewLegalAddress] = useState('');
  const [newActualAddress, setNewActualAddress] = useState('');
  const [isSameAddress, setIsSameAddress] = useState(true);
  const [newRole, setNewRole] = useState<'ANALYST' | 'OPERATOR' | 'FIELD_OFFICER' | 'LEGAL' | 'ACCOUNTANT' | 'ADMIN'>('FIELD_OFFICER');
  const [newDepartment, setNewDepartment] = useState('საველე მონიტორინგი & ინსპექცია');
  const [newPassword, setNewPassword] = useState('Debitinfo2024!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact Person for Add Modal (Collapsible Dropdown Section)
  const [isContactSectionOpen, setIsContactSectionOpen] = useState(false);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactPhone, setContactPhone] = useState('+995 ');
  const [contactEmail, setContactEmail] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactRelationType, setContactRelationType] = useState('EMERGENCY');

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('');
  const [editLegalAddress, setEditLegalAddress] = useState<string>('');
  const [editActualAddress, setEditActualAddress] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Contact Person for Edit Modal
  const [isEditContactSectionOpen, setIsEditContactSectionOpen] = useState(false);
  const [editContactFirstName, setEditContactFirstName] = useState('');
  const [editContactLastName, setEditContactLastName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('+995 ');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactAddress, setEditContactAddress] = useState('');
  const [editContactRelationType, setEditContactRelationType] = useState('EMERGENCY');

  // Check current session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      setCurrentUser(null);
      setAuthChecked(true);
      return;
    }

    // Strict role check: ONLY ADMIN is allowed on /ops
    if (user.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(user.role);
      router.replace(dest);
      return;
    }

    setCurrentUser(user);
    setAuthChecked(true);
  }, [router]);

  // Load Staff data when authenticated as admin
  const loadStaffData = async () => {
    setLoadingStaff(true);
    try {
      const data = await opsBackendService.getStaff();
      setStaffList(data || []);
    } catch (err: any) {
      console.warn('Could not load staff data:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      loadStaffData();
    }
  }, [currentUser]);

  // Handle Ops Login
  const handleOpsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('გთხოვთ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await authService.login(loginIdentifier, loginPassword);
      const user = res.user;

      if (!['ADMIN', 'ANALYST', 'OPERATOR', 'FIELD_OFFICER', 'LEGAL', 'ACCOUNTANT'].includes(user.role)) {
        authService.logout();
        setLoginError('🚫 წვდომა შეზღუდულია: თქვენი ანგარიში არ წარმოადგენს საოპერაციო პერსონალს. გამოიყენეთ საჯარო შესვლა /login გვერდზე.');
        setLoginLoading(false);
        return;
      }

      // If user is NOT ADMIN, redirect immediately to their specialized dashboard!
      if (user.role !== 'ADMIN') {
        const dest = authService.getPortalRouteForRole(user.role);
        router.push(dest);
        return;
      }

      // Only ADMIN remains on /ops
      setCurrentUser(user);
    } catch (err: any) {
      setLoginError(err?.message || 'ავტორიზაცია ვერ მოხერხდა. გადაამოწმეთ ელფოსტა ან პაროლი');
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick fill helper for dev testing
  const handleQuickFill = (role: 'admin' | 'analyst' | 'operator') => {
    if (role === 'admin') {
      setLoginIdentifier('admin@debitinfo.ge');
      setLoginPassword('Debitinfo2024!');
    } else if (role === 'analyst') {
      setLoginIdentifier('analyst@debitinfo.ge');
      setLoginPassword('Debitinfo2024!');
    } else {
      setLoginIdentifier('operator@debitinfo.ge');
      setLoginPassword('Debitinfo2024!');
    }
    setLoginError('');
  };

  // Handle Logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setStaffList([]);
    setLoginIdentifier('');
    setLoginPassword('');
  };

  // Handle Create Staff Member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPersonalId.trim()) {
      alert('გთხოვთ შეავსოთ სახელი, გვარი, ელფოსტა და პირადი ნომერი');
      return;
    }

    if (newPersonalId.trim().length !== 11) {
      alert('პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან');
      return;
    }

    const effectiveActualAddress = isSameAddress ? newLegalAddress.trim() : newActualAddress.trim();

    // Prepare Contact Person payload if entered
    const contactPersonPayload =
      contactFirstName.trim() && contactLastName.trim() && contactPhone.trim()
        ? {
            firstName: contactFirstName.trim(),
            lastName: contactLastName.trim(),
            phone: contactPhone.trim(),
            email: contactEmail.trim() || undefined,
            address: contactAddress.trim() || undefined,
            relationType: contactRelationType || 'EMERGENCY',
          }
        : undefined;

    setIsSubmitting(true);
    try {
      const res = await opsBackendService.createStaff({
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        fullName: `${newFirstName.trim()} ${newLastName.trim()}`,
        personalId: newPersonalId.trim(),
        email: newEmail.toLowerCase().trim(),
        phone: newPhone.trim(),
        legalAddress: newLegalAddress.trim() || undefined,
        actualAddress: effectiveActualAddress || undefined,
        role: newRole,
        department: newDepartment.trim() || (STAFF_ROLE_OPTIONS.find((o) => o.role === newRole)?.department || 'საოპერაციო დეპარტამენტი'),
        password: newPassword.trim() || undefined,
        contactPerson: contactPersonPayload,
      });

      setActionSuccessMessage(res?.message || `თანამშრომელი ${newFirstName} ${newLastName} წარმატებით დაემატა ბაზაში!`);
      setTimeout(() => setActionSuccessMessage(null), 5000);

      // Reset form
      setNewFirstName('');
      setNewLastName('');
      setNewPersonalId('');
      setNewEmail('');
      setNewPhone('+995 599 ');
      setNewLegalAddress('');
      setNewActualAddress('');
      setIsSameAddress(true);
      setNewRole('FIELD_OFFICER');
      setNewDepartment('საველე მონიტორინგი & ინსპექცია');
      setContactFirstName('');
      setContactLastName('');
      setContactPhone('+995 ');
      setContactEmail('');
      setContactAddress('');
      setContactRelationType('EMERGENCY');
      setIsContactSectionOpen(false);
      setIsAddModalOpen(false);

      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'თანამშრომლის დამატება ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Staff Member
  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    setIsUpdating(true);
    try {
      const editContactPayload =
        editContactFirstName.trim() && editContactLastName.trim() && editContactPhone.trim()
          ? {
              firstName: editContactFirstName.trim(),
              lastName: editContactLastName.trim(),
              phone: editContactPhone.trim(),
              email: editContactEmail.trim() || undefined,
              address: editContactAddress.trim() || undefined,
              relationType: editContactRelationType || 'EMERGENCY',
            }
          : undefined;

      await opsBackendService.updateStaff(editingStaff.id, {
        role: editRole,
        department: editDepartment,
        legalAddress: editLegalAddress,
        actualAddress: editActualAddress,
        status: editStatus,
        contactPerson: editContactPayload,
      });
      setActionSuccessMessage(`თანამშრომლის (${editingStaff.fullName}) მონაცემები წარმატებით განახლდა!`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      setEditingStaff(null);
      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'განახლება ვერ მოხერხდა');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Toggle Status (Active / Suspended)
  const handleToggleStatus = async (staff: any) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await opsBackendService.updateStaff(staff.id, { status: nextStatus });
      setActionSuccessMessage(`სტატუსი შეიცვალა: ${nextStatus === 'ACTIVE' ? 'აქტიური' : 'შეჩერებული'}`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'სტატუსის შეცვლა ვერ მოხერხდა');
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (staff: any) => {
    if (staff.email === 'admin@debitinfo.ge') {
      alert('მთავარი სისტემური ადმინისტრატორის წაშლა შეუძლებელია!');
      return;
    }

    if (!confirm(`ნამდვილად გსურთ თანამშრომლის წაშლა: ${staff.fullName} (${staff.email})?`)) {
      return;
    }

    try {
      await opsBackendService.deleteStaff(staff.id);
      setActionSuccessMessage(`თანამშრომელი ${staff.fullName} წაიშალა ბაზიდან`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadStaffData();
    } catch (err: any) {
      alert(err?.message || 'წაშლა ვერ მოხერხდა');
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.personalId?.includes(q) ||
      s.department?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const staffCounts = {
    total: staffList.length,
    analysts: staffList.filter((s) => s.role === 'ANALYST').length,
    operators: staffList.filter((s) => s.role === 'OPERATOR').length,
    fieldOfficers: staffList.filter((s) => s.role === 'FIELD_OFFICER').length,
    legals: staffList.filter((s) => s.role === 'LEGAL').length,
    admins: staffList.filter((s) => s.role === 'ADMIN').length,
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: OPS LOGIN SCREEN (When not authenticated as staff)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary selection:text-white">
        {/* Top Header */}
        <header className="bg-surface-card sticky top-0 z-40 border-b border-border-subtle shadow-sm">
          <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
                <span className="material-symbols-outlined text-accent-mint text-[20px]">account_balance</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                საოპერაციო ცენტრი • Ops Portal v2.4 Live
              </span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium text-text-muted hover:text-text-primary hover:bg-slate-100 transition"
                title="გადასვლა საჯარო კაბინეტში"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>საჯარო პორტალი</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Center Login Card Canvas */}
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-8">
            {/* Card Header */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-border-subtle">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 mb-4 shadow-sm relative text-primary">
                <span className="material-symbols-outlined text-3xl">shield_person</span>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-text-primary tracking-tight">
                საოპერაციო პორტალი (Ops)
              </h1>
              <p className="font-body-md text-body-sm text-text-muted mt-1.5">
                ავტორიზაცია კომპანიის უფლებამოსილი თანამშრომლებისა და ადმინისტრაციისთვის
              </p>
            </div>

            {/* Closed Registration Banner */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">lock</span>
              <div className="leading-relaxed">
                <strong>საჯარო რეგისტრაცია დახურულია.</strong> თანამშრომელთა ანგარიშების რეგისტრაციასა და წვდომების გაცემას ახორციელებს მხოლოდ სისტემის მფლობელი / ადმინისტრატორი.
              </div>
            </div>

            {/* Quick Presets for Staff */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-border-subtle text-xs">
              <span className="text-[11px] font-semibold text-text-muted block mb-2 uppercase tracking-wider">
                სწრაფი ტესტირება (Dev Staff Presets):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 transition shadow-2xs text-[11px] text-center"
                  title="სისტემური ადმინისტრატორი & HR მფლობელი"
                >
                  ⚡ ადმინი (HR)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('analyst')}
                  className="px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-primary font-semibold hover:bg-blue-100 transition shadow-2xs text-[11px] text-center"
                  title="ფინანსური ანალიტიკოსი (Excel & რეესტრები)"
                >
                  📊 ანალიტიკოსი
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('operator')}
                  className="px-2 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-semibold hover:bg-purple-100 transition shadow-2xs text-[11px] text-center"
                  title="ქოლ-ცენტრის ოპერატორი"
                >
                  📞 ოპერატორი
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form className="mt-5 space-y-4" onSubmit={handleOpsLogin}>
              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-body-sm flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-base mt-0.5">error</span>
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-body-sm font-body-sm font-medium text-text-primary mb-1">
                  სამსახურებრივი ელფოსტა / პირადი ნომერი
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]">badge</span>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="admin@debitinfo.ge"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-body-md font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-body-sm font-body-sm font-medium text-text-primary">
                    უსაფრთხო პაროლი
                  </label>
                  <span className="text-[11px] text-text-muted">256-Bit SSL დაცვა</span>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]">lock</span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-body-md shadow-md shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loginLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ავტორიზაცია...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    <span>საოპერაციო ცენტრში შესვლა</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-border-subtle text-center text-[11px] text-text-muted">
              ყველა ოპერაცია და შესვლა ფიქსირდება აუდიტის ჟურნალში (Audit Log).
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Security Guard: Non-admin staff members must never see the admin control console
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
        <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-lg max-w-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <h2 className="font-bold text-lg text-text-primary">გადამისამართება სამუშაო სივრცეში...</h2>
          <p className="text-xs text-text-muted">მიმდინარეობს თქვენი როლისთვის განკუთვნილ პანელზე გადასვლა.</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED OPS WORKSPACE (Staff & Employee Control Console)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary selection:text-white">
      {/* Top Header */}
      <header className="bg-surface-card sticky top-0 z-40 border-b border-border-subtle shadow-sm">
        <div className="w-full px-4 lg:px-8 max-w-[1720px] mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link className="flex items-center gap-2 group" href="/ops">
              <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
                <span className="material-symbols-outlined text-accent-mint text-[20px]">account_balance</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo</span>
                  <span className="text-headline-sm font-headline-sm font-bold text-secondary-container">.GE</span>
                </div>
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border-subtle">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                საოპერაციო ცენტრი • Ops Workspace
              </span>
              <span className="text-text-muted text-body-sm hidden md:inline">v2.4 Live</span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-text-muted text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="თანამშრომლის ძიება სახელით, პ/ნ, ელფოსტით..."
                className="w-full pl-10 pr-4 py-1.5 bg-surface-bg border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 border-l border-border-subtle">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-body-sm border border-primary/20">
                {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-body-sm font-semibold text-text-primary leading-tight">
                  {currentUser?.name || currentUser?.email}
                </span>
                <span className="text-label-sm text-text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {currentUser?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="სისტემიდან გამოსვლა"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex w-full max-w-[1720px] mx-auto overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-[260px] bg-surface-card border-r border-border-subtle flex-shrink-0 flex flex-col justify-between hidden md:flex py-5 px-3">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                საოპერაციო მოდულები
              </div>
              <nav className="space-y-1">
                {/* 1. Staff Management (Current View) */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-primary-container text-white shadow-sm font-body-md font-semibold text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                    <span>თანამშრომელთა მართვა</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[11px] font-mono">
                    {staffList.length}
                  </span>
                </button>

                {/* 2. Analyst & Excel Registry */}
                <Link
                  href="/analyst"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition font-body-md font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-sky-600">query_stats</span>
                    <span>ანალიტიკა &amp; Excel</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
                </Link>

                {/* 3. CRM & Call Center */}
                <Link
                  href="/crm"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition font-body-md font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-purple-600">headset_mic</span>
                    <span>ქოლ-ცენტრი &amp; CRM</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
                </Link>

                {/* 4. Field Inspections */}
                <Link
                  href="/field-officer"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition font-body-md font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">pin_drop</span>
                    <span>საველე ვიზიტები</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
                </Link>

                {/* 5. Legal Cases */}
                <Link
                  href="/legal"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition font-body-md font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-rose-600">gavel</span>
                    <span>იურიდიული საქმეები</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
                </Link>

                {/* 6. HR Dossier */}
                <Link
                  href="/hr"
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-slate-50 transition font-body-md font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-amber-600">folder_shared</span>
                    <span>კადრების დოსიე (HR)</span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[16px]">open_in_new</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Security Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">verified_user</span>
                Ops Access Level
              </span>
              <span className="font-mono text-emerald-700 font-bold">ROOT</span>
            </div>
            <div className="text-text-muted leading-relaxed">
              თქვენ შესული ხართ როგორც <strong>{currentUser?.role}</strong>. გაქვთ თანამშრომელთა რეგისტრაციის და როლების კონტროლის სრული უფლებამოსილება.
            </div>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 bg-surface-bg">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
            <div>
              <div className="flex items-center gap-2 text-label-sm font-label-sm text-text-muted mb-1">
                <span>Operations</span>
                <span>/</span>
                <span className="text-primary font-medium">თანამშრომელთა მართვა &amp; გუნდის კონტროლი</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg text-text-primary tracking-tight font-bold">
                თანამშრომელთა რეგისტრაცია და წვდომების მენეჯმენტი
              </h1>
              <p className="text-body-md text-text-muted mt-0.5">
                ანალიტიკოსების, ქოლ-ცენტრის ოპერატორების, საველე ვიზიტორებისა და იურისტების როლების მინიჭება და კონტროლი
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadStaffData}
                disabled={loadingStaff}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-card border border-border-subtle text-text-primary hover:bg-slate-50 transition text-body-sm font-medium shadow-sm cursor-pointer disabled:opacity-50"
                title="მონაცემების განახლება"
              >
                <span className={`material-symbols-outlined text-[18px] ${loadingStaff ? 'animate-spin' : ''}`}>
                  autorenew
                </span>
                <span>განახლება</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white transition-all shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 text-body-sm font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[19px]">person_add</span>
                <span>+ ახალი თანამშრომლის რეგისტრაცია</span>
              </button>
            </div>
          </div>

          {/* Success Notification Alert */}
          {actionSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span className="font-medium">{actionSuccessMessage}</span>
              </div>
              <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* KPI Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
              <div>
                <span className="text-body-sm text-text-muted">სულ თანამშრომელი</span>
                <div className="text-headline-md font-bold text-text-primary mt-1 font-mono">
                  {staffCounts.total}
                </div>
                <span className="text-xs text-emerald-600 font-medium">სრული შტატი</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
              <div>
                <span className="text-body-sm text-text-muted">ფინანსური ანალიტიკოსები</span>
                <div className="text-headline-md font-bold text-primary mt-1 font-mono">
                  {staffCounts.analysts}
                </div>
                <span className="text-xs text-text-muted">Scoring &amp; Excel რეესტრი</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <span className="material-symbols-outlined text-2xl">query_stats</span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
              <div>
                <span className="text-body-sm text-text-muted">ქოლ-ცენტრი &amp; ოპერატორები</span>
                <div className="text-headline-md font-bold text-purple-700 mt-1 font-mono">
                  {staffCounts.operators}
                </div>
                <span className="text-xs text-text-muted">CRM &amp; მოლაპარაკებები</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <span className="material-symbols-outlined text-2xl">headset_mic</span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="p-4 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
              <div>
                <span className="text-body-sm text-text-muted">საველე &amp; იურისტები</span>
                <div className="text-headline-md font-bold text-emerald-700 mt-1 font-mono">
                  {staffCounts.fieldOfficers + staffCounts.legals}
                </div>
                <span className="text-xs text-text-muted">ინსპექცია &amp; სასამართლო</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-2xl">gavel</span>
              </div>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'ALL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  ყველა ({staffCounts.total})
                </button>
                <button
                  onClick={() => setRoleFilter('ANALYST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'ANALYST'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  ანალიტიკოსები ({staffCounts.analysts})
                </button>
                <button
                  onClick={() => setRoleFilter('OPERATOR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'OPERATOR'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  ქოლ-ცენტრი ({staffCounts.operators})
                </button>
                <button
                  onClick={() => setRoleFilter('FIELD_OFFICER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'FIELD_OFFICER'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  საველე ({staffCounts.fieldOfficers})
                </button>
                <button
                  onClick={() => setRoleFilter('LEGAL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'LEGAL'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  იურისტები ({staffCounts.legals})
                </button>
                <button
                  onClick={() => setRoleFilter('ADMIN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    roleFilter === 'ADMIN'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-slate-100 text-text-muted hover:text-text-primary'
                  }`}
                >
                  ადმინები ({staffCounts.admins})
                </button>
              </div>

              <span className="text-xs text-text-muted font-mono">
                ნაჩვენებია: {filteredStaff.length} თანამშრომელი
              </span>
            </div>

            {/* Staff Data Table */}
            <div className="overflow-x-auto rounded-lg border border-border-subtle shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-subtle text-label-md font-label-md text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">თანამშრომელი &amp; ელფოსტა</th>
                    <th className="py-3 px-4">პირადი ნომერი</th>
                    <th className="py-3 px-4">პოზიცია / როლი</th>
                    <th className="py-3 px-4">დეპარტამენტი &amp; შიდა №</th>
                    <th className="py-3 px-4">სტატუსი</th>
                    <th className="py-3 px-4 text-right">ადმინისტრატორის მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-body-md font-body-md bg-white">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-muted text-body-sm">
                        თანამშრომელი ვერ მოიძებნა მითითებული ფილტრით
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => {
                      const isMasterAdmin = staff.email === 'admin@debitinfo.ge';

                      let roleBadge = (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
                          {staff.role}
                        </span>
                      );

                      if (staff.role === 'ADMIN') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">admin_panel_settings</span>
                            ადმინისტრატორი
                          </span>
                        );
                      } else if (staff.role === 'ANALYST') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">query_stats</span>
                            ფინანსური ანალიტიკოსი
                          </span>
                        );
                      } else if (staff.role === 'OPERATOR') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">headset_mic</span>
                            ქოლ-ცენტრი / ოპერატორი
                          </span>
                        );
                      } else if (staff.role === 'FIELD_OFFICER') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                            საველე ვიზიტორი
                          </span>
                        );
                      } else if (staff.role === 'LEGAL') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">gavel</span>
                            იურისტი
                          </span>
                        );
                      } else if (staff.role === 'ACCOUNTANT') {
                        roleBadge = (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">account_balance_wallet</span>
                            მთავარი ბუღალტერი
                          </span>
                        );
                      }

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {staff.fullName ? staff.fullName.substring(0, 2) : 'EM'}
                              </div>
                              <div>
                                <div className="font-semibold text-text-primary text-body-sm">
                                  {staff.fullName}
                                </div>
                                <div className="text-[12px] text-text-muted font-mono">
                                  {staff.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[13px] font-bold text-text-primary">
                            {staff.personalId}
                          </td>
                          <td className="py-3.5 px-4">
                            {roleBadge}
                          </td>
                          <td className="py-3.5 px-4 text-body-sm">
                            <div className="text-text-primary font-medium">{staff.department}</div>
                            <div className="text-xs text-text-muted font-mono">Ext: #{staff.internalExt}</div>
                            {staff.legalAddress && (
                              <div
                                className="text-[11px] text-text-muted mt-0.5 max-w-[220px] truncate"
                                title={`იურიდიული: ${staff.legalAddress}\nფაქტობრივი: ${staff.actualAddress || staff.legalAddress}`}
                              >
                                📍 {staff.legalAddress}
                              </div>
                            )}
                            {staff.contactPerson && (
                              <div
                                className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1 max-w-[240px] truncate"
                                title={`საკონტაქტო პირი: ${staff.contactPerson.firstName} ${staff.contactPerson.lastName}\nტელ: ${staff.contactPerson.phone}\nელფოსტა: ${staff.contactPerson.email || '—'}\nმისამართი: ${staff.contactPerson.address || '—'}\nსტატუსი: ${staff.contactPerson.relationType || 'საგანგებო'}`}
                              >
                                <span className="material-symbols-outlined text-[13px] shrink-0">contact_phone</span>
                                <span className="truncate">
                                  {staff.contactPerson.firstName} {staff.contactPerson.lastName} ({staff.contactPerson.phone})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {staff.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                აქტიური
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                შეჩერებული
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Role Button */}
                              <button
                                onClick={() => {
                                  setEditingStaff(staff);
                                  setEditRole(staff.role);
                                  setEditDepartment(staff.department);
                                  setEditLegalAddress(staff.legalAddress || '');
                                  setEditActualAddress(staff.actualAddress || '');
                                  setEditStatus(staff.status);
                                  if (staff.contactPerson) {
                                    setEditContactFirstName(staff.contactPerson.firstName || '');
                                    setEditContactLastName(staff.contactPerson.lastName || '');
                                    setEditContactPhone(staff.contactPerson.phone || '+995 ');
                                    setEditContactEmail(staff.contactPerson.email || '');
                                    setEditContactAddress(staff.contactPerson.address || '');
                                    setEditContactRelationType(staff.contactPerson.relationType || 'EMERGENCY');
                                    setIsEditContactSectionOpen(true);
                                  } else {
                                    setEditContactFirstName('');
                                    setEditContactLastName('');
                                    setEditContactPhone('+995 ');
                                    setEditContactEmail('');
                                    setEditContactAddress('');
                                    setEditContactRelationType('EMERGENCY');
                                    setIsEditContactSectionOpen(false);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-border-subtle hover:bg-slate-100 text-text-muted hover:text-primary transition cursor-pointer"
                                title="როლისა და დეპარტამენტის რედაქტირება"
                              >
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </button>

                              {/* Toggle Status (Active / Suspend) */}
                              {!isMasterAdmin && (
                                <button
                                  onClick={() => handleToggleStatus(staff)}
                                  className={`p-1.5 rounded-lg border border-border-subtle transition cursor-pointer ${
                                    staff.status === 'ACTIVE'
                                      ? 'text-amber-700 hover:bg-amber-50'
                                      : 'text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={staff.status === 'ACTIVE' ? 'წვდომის შეჩერება' : 'წვდომის აღდგენა'}
                                >
                                  <span className="material-symbols-outlined text-[17px]">
                                    {staff.status === 'ACTIVE' ? 'block' : 'check_circle'}
                                  </span>
                                </button>
                              )}

                              {/* Delete Staff Button */}
                              {!isMasterAdmin && (
                                <button
                                  onClick={() => handleDeleteStaff(staff)}
                                  className="p-1.5 rounded-lg border border-border-subtle hover:bg-red-50 text-text-muted hover:text-red-600 transition cursor-pointer"
                                  title="თანამშრომლის წაშლა"
                                >
                                  <span className="material-symbols-outlined text-[17px]">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER / INVITE NEW EMPLOYEE */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border-subtle z-10 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-body-lg">
                    ახალი თანამშრომლის რეგისტრაცია
                  </h3>
                  <p className="text-xs text-text-muted">
                    შეიყვანეთ პერსონალური მონაცემები, მისამართები და შეარჩიეთ დეპარტამენტი
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Step 1: Personal Data */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border-subtle">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">იდენტიფიკაცია</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      სახელი <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="მაგ: გიორგი"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      გვარი <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="მაგ: მახარაძე"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      პირადი ნომერი (11 ნიშნა) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={newPersonalId}
                      onChange={(e) => setNewPersonalId(e.target.value.replace(/\D/g, ''))}
                      placeholder="01019088776"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      სამსახურებრივი ელფოსტა <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="g.makharadze@debitinfo.ge"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      საკონტაქტო ტელეფონი
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+995 599 12 34 56"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Addresses */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-border-subtle">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">მისამართები</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      იურიდიული მისამართი (რეგისტრაციის ადგილი) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newLegalAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewLegalAddress(val);
                        if (isSameAddress) {
                          setNewActualAddress(val);
                        }
                      }}
                      placeholder="მაგ: თბილისი, ვაჟა-ფშაველას გამზ. 45, ბინა 12"
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-text-primary">
                        ფაქტობრივი მისამართი (საცხოვრებელი ადგილი) <span className="text-red-500">*</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-text-muted cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSameAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsSameAddress(checked);
                            if (checked) {
                              setNewActualAddress(newLegalAddress);
                            }
                          }}
                          className="rounded border-border-subtle text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>ემთხვევა იურიდიულს</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      disabled={isSameAddress}
                      value={isSameAddress ? newLegalAddress : newActualAddress}
                      onChange={(e) => setNewActualAddress(e.target.value)}
                      placeholder={isSameAddress ? 'ემთხვევა იურიდიულ მისამართს' : 'მაგ: თბილისი, ჭავჭავაძის გამზ. 18'}
                      className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary disabled:bg-slate-50 disabled:text-text-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Position & Department */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-1 border-b border-border-subtle">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">პოზიცია &amp; დეპარტამენტი</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საოპერაციო როლი &amp; დეპარტამენტი <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const selectedRole = e.target.value as any;
                      setNewRole(selectedRole);
                      const opt = STAFF_ROLE_OPTIONS.find((o) => o.role === selectedRole);
                      if (opt) {
                        setNewDepartment(opt.department);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary cursor-pointer font-medium text-text-primary shadow-2xs"
                  >
                    {STAFF_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text-muted mt-1">
                    განსაზღვრავს თანამშრომლის საოპერაციო დეპარტამენტს, სისტემურ უფლებებსა და სამუშაო პანელს.
                  </p>
                </div>
              </div>

              {/* Step 4: Contact Person (Collapsible Dropdown Accordion) */}
              <div className="pt-2">
                <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-bg/40">
                  <button
                    type="button"
                    onClick={() => setIsContactSectionOpen(!isContactSectionOpen)}
                    className="w-full px-4 py-3 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">contacts</span>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                          <span>საკონტაქტო პირის ინფორმაცია</span>
                          <span className="text-[10px] font-normal text-text-muted bg-white border border-border-subtle px-1.5 py-0.2 rounded">
                            არასავალდებულო • ჩამოსაშლელი
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted">
                          საგანგებო კონტაქტი, ნათესავი ან ნდობით აღჭურვილი პირი
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <span className="text-xs font-medium">
                        {isContactSectionOpen ? 'აკეცვა' : 'შევსება'}
                      </span>
                      <span
                        className={`material-symbols-outlined text-lg transition-transform duration-200 ${
                          isContactSectionOpen ? 'rotate-180 text-primary' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </div>
                  </button>

                  {isContactSectionOpen && (
                    <div className="p-4 space-y-3 bg-white border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            სახელი
                          </label>
                          <input
                            type="text"
                            value={contactFirstName}
                            onChange={(e) => setContactFirstName(e.target.value)}
                            placeholder="მაგ: ანა"
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            გვარი
                          </label>
                          <input
                            type="text"
                            value={contactLastName}
                            onChange={(e) => setContactLastName(e.target.value)}
                            placeholder="მაგ: მახარაძე"
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            ტელეფონის ნომერი
                          </label>
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+995 599 00 00 00"
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            ელფოსტა
                          </label>
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="contact@mail.ge"
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            მისამართი
                          </label>
                          <input
                            type="text"
                            value={contactAddress}
                            onChange={(e) => setContactAddress(e.target.value)}
                            placeholder="მაგ: ქ. თბილისი, პეკინის ქ. 12"
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-text-primary mb-1">
                            კავშირის ტიპი / სტატუსი
                          </label>
                          <select
                            value={contactRelationType}
                            onChange={(e) => setContactRelationType(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary cursor-pointer text-text-primary"
                          >
                            <option value="EMERGENCY">საგანგებო კონტაქტი (Emergency Contact)</option>
                            <option value="FAMILY">ოჯახის წევრი / ნათესავი (Family Member)</option>
                            <option value="REPRESENTATIVE">ნდობით აღჭურვილი პირი / წარმომადგენელი (Representative)</option>
                            <option value="GUARANTOR">თავდები / გარანტი (Guarantor)</option>
                            <option value="OTHER">სხვა (Other)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Password notice */}
              <div className="p-3 bg-slate-50 rounded-lg border border-border-subtle text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">საწყისი დროებითი პაროლი:</span>
                  <span className="font-mono font-bold text-primary">{newPassword}</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  თანამშრომელი პირველ შესვლაზე შეცვლის ამ პაროლს თავის პირად უსაფრთხო პაროლზე.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm font-medium cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-body-sm shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>თანამშრომლის რეგისტრაცია</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT EMPLOYEE ROLE, DEPARTMENT & ADDRESSES */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setEditingStaff(null)} />
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-subtle z-10 space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h3 className="font-bold text-text-primary text-body-lg">
                  თანამშრომლის რედაქტირება
                </h3>
                <p className="text-xs text-text-muted">{editingStaff.fullName} ({editingStaff.email})</p>
              </div>
              <button onClick={() => setEditingStaff(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  საოპერაციო როლი &amp; დეპარტამენტი <span className="text-red-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setEditRole(selectedRole);
                    const opt = STAFF_ROLE_OPTIONS.find((o) => o.role === selectedRole);
                    if (opt) {
                      setEditDepartment(opt.department);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary cursor-pointer font-medium text-text-primary"
                >
                  {STAFF_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">იურიდიული მისამართი</label>
                <input
                  type="text"
                  value={editLegalAddress}
                  onChange={(e) => setEditLegalAddress(e.target.value)}
                  placeholder="რეგისტრაციის ადგილი"
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">ფაქტობრივი მისამართი</label>
                <input
                  type="text"
                  value={editActualAddress}
                  onChange={(e) => setEditActualAddress(e.target.value)}
                  placeholder="საცხოვრებელი ადგილი"
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">სტატუსი</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                >
                  <option value="ACTIVE">აქტიური (ACTIVE)</option>
                  <option value="SUSPENDED">შეჩერებული (SUSPENDED)</option>
                </select>
              </div>

              {/* Contact Person (Collapsible Dropdown Accordion) */}
              <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-bg/40">
                <button
                  type="button"
                  onClick={() => setIsEditContactSectionOpen(!isEditContactSectionOpen)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">contacts</span>
                    <span className="text-xs font-bold text-text-primary">
                      საკონტაქტო პირი (საგანგებო)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-text-muted">
                    <span className="text-[11px] font-medium">
                      {isEditContactSectionOpen ? 'აკეცვა' : 'რედაქტირება'}
                    </span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform duration-200 ${
                        isEditContactSectionOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {isEditContactSectionOpen && (
                  <div className="p-3.5 space-y-2.5 bg-white border-t border-border-subtle animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">სახელი</label>
                        <input
                          type="text"
                          value={editContactFirstName}
                          onChange={(e) => setEditContactFirstName(e.target.value)}
                          placeholder="სახელი"
                          className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">გვარი</label>
                        <input
                          type="text"
                          value={editContactLastName}
                          onChange={(e) => setEditContactLastName(e.target.value)}
                          placeholder="გვარი"
                          className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">ტელეფონი</label>
                        <input
                          type="tel"
                          value={editContactPhone}
                          onChange={(e) => setEditContactPhone(e.target.value)}
                          placeholder="+995 ..."
                          className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-primary mb-1">ელფოსტა</label>
                        <input
                          type="email"
                          value={editContactEmail}
                          onChange={(e) => setEditContactEmail(e.target.value)}
                          placeholder="mail@ge"
                          className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">მისამართი</label>
                      <input
                        type="text"
                        value={editContactAddress}
                        onChange={(e) => setEditContactAddress(e.target.value)}
                        placeholder="საკონტაქტო პირის მისამართი"
                        className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-text-primary mb-1">სტატუსი / კავშირი</label>
                      <select
                        value={editContactRelationType}
                        onChange={(e) => setEditContactRelationType(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs focus:outline-none focus:border-primary text-text-primary"
                      >
                        <option value="EMERGENCY">საგანგებო კონტაქტი (Emergency Contact)</option>
                        <option value="FAMILY">ოჯახის წევრი / ნათესავი (Family Member)</option>
                        <option value="REPRESENTATIVE">ნდობით აღჭურვილი პირი (Representative)</option>
                        <option value="GUARANTOR">თავდები / გარანტი (Guarantor)</option>
                        <option value="OTHER">სხვა (Other)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm font-medium cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateStaff}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-body-sm shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUpdating && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>შენახვა</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
