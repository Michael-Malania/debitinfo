'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function RegisterPage() {
  const router = useRouter();
  const [entityType, setEntityType] = useState<'legal' | 'physical'>('legal');

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [personalId, setPersonalId] = useState('');
  const [actualAddress, setActualAddress] = useState('');
  const [legalAddress, setLegalAddress] = useState('');

  // Legal Entity Fields
  const [companyName, setCompanyName] = useState('');
  const [legalForm, setLegalForm] = useState('შპს');
  const [directorName, setDirectorName] = useState('');
  const [directorLastName, setDirectorLastName] = useState('');
  const [directorPin, setDirectorPin] = useState('');
  const [directorPhone, setDirectorPhone] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');

  // Physical Person Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [rsChecking, setRsChecking] = useState(false);
  const [rsVerifiedBadge, setRsVerifiedBadge] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-verify / Inspect with RS.GE
  const handleCheckRsGe = async () => {
    const id = personalId.trim();
    if (!id || (id.length !== 9 && id.length !== 11)) {
      setError('გთხოვთ მიუთითოთ 9-ნიშნა ს/კ (იურიდიული პირი) ან 11-ნიშნა პ/ნ (ფიზიკური პირი)');
      return;
    }
    setError('');
    setRsChecking(true);
    try {
      const data = await authService.getTaxpayerInfo(id);
      if (data?.fullName) {
        if (entityType === 'legal') {
          setCompanyName(data.fullName);
          if (data.registeredSubject) setLegalForm(data.registeredSubject);
        } else {
          const parts = data.fullName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        setRsVerifiedBadge(`RS.GE დადასტურებულია: ${data.fullName} (${data.status})`);
      }
    } catch (e: any) {
      setError(e?.message || 'RS.GE-დან მონაცემების მიღება ვერ მოხერხდა');
    } finally {
      setRsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('შეყვანილი პაროლები ერთმანეთს არ ემთხვევა');
      return;
    }

    if (password.length < 6) {
      setError('პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        password,
        personalId: personalId.trim(),
        entityType: entityType === 'legal' ? 'LEGAL' : 'PHYSICAL',
        role: 'REGULAR',
        phone: phone.trim() || undefined,
        actualAddress: actualAddress.trim() || 'ქ. თბილისი',
        legalAddress: legalAddress.trim() || actualAddress.trim() || 'ქ. თბილისი',
      };

      if (entityType === 'legal') {
        payload.companyName = companyName.trim() || `შპს ${personalId}`;
        payload.legalForm = legalForm;
        payload.directorName = directorName.trim() || 'დირექტორი';
        payload.directorLastName = directorLastName.trim() || 'გვარი';
        payload.directorPin = directorPin.trim() || '01019012345';
        payload.directorPhone = directorPhone.trim() || phone.trim() || '+995 599 00 00 00';
        payload.directorEmail = directorEmail.trim() || email.trim();
      } else {
        payload.firstName = firstName.trim() || 'სახელი';
        payload.lastName = lastName.trim() || 'გვარი';
      }

      const res = await authService.register(payload);
      setSuccess(true);
      setTimeout(() => {
        const target = authService.getPortalRouteForRole(res.user.role);
        router.push(target);
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'რეგისტრაცია ვერ მოხერხდა. გადაამოწმეთ შეყვანილი ველები');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary selection:text-white" suppressHydrationWarning>
      {/* TopNavBar */}
      <header className="bg-surface-card docked full-width top-0 sticky z-50 border-b border-border-subtle shadow-sm">
        <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link className="flex items-center gap-2 group" href="/">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
              <span className="material-symbols-outlined text-accent-mint">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted leading-none">Fintech Registry</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/">მთავარი გვერდი</Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/#services">სერვისები</Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/#pricing">ტარიფები</Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/#blog">ბლოგი</Link>
            <Link className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150" href="/contact">კონტაქტი</Link>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-3">
            <Link className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-label-md font-label-md text-primary hover:bg-slate-100 rounded-lg transition active:scale-95 duration-100" href="/login">
              შესვლა
            </Link>
            <Link className="inline-flex items-center justify-center px-4 py-2 text-label-md font-label-md bg-primary-container text-white rounded-lg shadow-sm hover:bg-[#0A37CA] transition active:scale-95 duration-100" href="/register">
              რეგისტრაცია
            </Link>
          </div>
        </div>
      </header>

      {/* Main Canvas / Content Container */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative flex items-center justify-center">
        {/* Registration Card */}
        <div className="w-full max-w-4xl bg-surface-card rounded-2xl shadow-xl border border-border-subtle p-6 sm:p-10 transition-all duration-300">
          {/* Card Header */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-border-subtle">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-border-subtle mb-4 shadow-sm relative">
              <span className="material-symbols-outlined text-3xl text-primary">shield_person</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-mint rounded-full border-2 border-white" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">რეგისტრაცია</h1>
            <p className="font-body-md text-text-muted mt-2 max-w-md">
              დარეგისტრირდით და მიიღეთ წვდომა Debitinfo.GE-ის სადებიტო და საკრედიტო რეესტრზე
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-lg mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>რეგისტრაცია წარმატებით დასრულდა! გადამისამართება...</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            {/* SUB-TOGGLE: Legal Entity vs Physical Person */}
            <div className="p-4 bg-slate-50 border border-border-subtle rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {entityType === 'legal' ? 'domain' : 'person'}
                </span>
                <span className="font-headline-sm text-sm text-text-primary font-semibold">სუბიექტის ტიპი</span>
              </div>
              <div className="inline-flex p-1 bg-white border border-border-subtle rounded-lg shadow-2xs self-start sm:self-auto" role="tablist">
                <button
                  type="button"
                  onClick={() => { setEntityType('legal'); setError(''); }}
                  className={`px-4 py-1.5 text-xs rounded-md transition-all duration-150 cursor-pointer ${
                    entityType === 'legal'
                      ? 'font-semibold bg-primary-container text-white shadow-xs'
                      : 'font-medium text-text-muted hover:text-text-primary'
                  }`}
                >
                  🏢 იურიდიული პირი
                </button>
                <button
                  type="button"
                  onClick={() => { setEntityType('physical'); setError(''); }}
                  className={`px-4 py-1.5 text-xs rounded-md transition-all duration-150 cursor-pointer ${
                    entityType === 'physical'
                      ? 'font-semibold bg-primary-container text-white shadow-xs'
                      : 'font-medium text-text-muted hover:text-text-primary'
                  }`}
                >
                  👤 ფიზიკური პირი
                </button>
              </div>
            </div>

            {/* Quick Identifier & RS.GE Inspection Row */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block font-label-md text-label-md text-text-primary font-semibold">
                  {entityType === 'legal' ? 'საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) *' : 'პირადი ნომერი (11 ნიშნა) *'}
                </label>
                <button
                  type="button"
                  onClick={handleCheckRsGe}
                  disabled={rsChecking}
                  className="px-3 py-1 rounded-lg bg-white border border-blue-300 hover:border-blue-500 text-primary text-xs font-semibold flex items-center gap-1.5 shadow-2xs self-start transition active:scale-95"
                >
                  {rsChecking ? (
                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-xs">sync</span>
                  )}
                  <span>RS.GE მონაცემების შემოწმება &amp; ავტოშევსება</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={entityType === 'legal' ? 9 : 11}
                  value={personalId}
                  onChange={(e) => {
                    setPersonalId(e.target.value);
                    setRsVerifiedBadge(null);
                  }}
                  placeholder={entityType === 'legal' ? '405123456' : '01019012345'}
                  required
                  className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                />
              </div>

              {rsVerifiedBadge && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                  <span>{rsVerifiedBadge}</span>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SECTION GROUP 1: LEGAL ENTITY                            */}
            {/* ======================================================== */}
            {entityType === 'legal' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Block 1: ორგანიზაციის მონაცემები */}
                <div className="space-y-4">
                  <div className="border-b border-border-subtle pb-2">
                    <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      ორგანიზაციის მონაცემები
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">სამართლებრივი ფორმა *</label>
                      <select
                        value={legalForm}
                        onChange={(e) => setLegalForm(e.target.value)}
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2.5 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                      >
                        <option value="შპს">შპს (შეზღუდული პასუხისმგებლობის საზოგადოება)</option>
                        <option value="ინდ. მეწარმე">ინდ. მეწარმე</option>
                        <option value="სს">სს (სააქციო საზოგადოება)</option>
                        <option value="ა(ა)იპ">ა(ა)იპ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">კომპანიის დასახელება *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="მაგ: შპს ჯეო ტრეიდინგი"
                        required
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">იურიდიული და ფაქტობრივი მისამართი</label>
                      <input
                        type="text"
                        value={actualAddress}
                        onChange={(e) => { setActualAddress(e.target.value); setLegalAddress(e.target.value); }}
                        placeholder="ქ. თბილისი, ჭავჭავაძის გამზ. 29"
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Block 2: დირექტორის მონაცემები */}
                <div className="space-y-4 pt-4 border-t border-border-subtle">
                  <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    დირექტორის / ხელმძღვანელის მონაცემები
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">დირექტორის სახელი</label>
                      <input
                        type="text"
                        value={directorName}
                        onChange={(e) => setDirectorName(e.target.value)}
                        placeholder="ირაკლი"
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">დირექტორის გვარი</label>
                      <input
                        type="text"
                        value={directorLastName}
                        onChange={(e) => setDirectorLastName(e.target.value)}
                        placeholder="ნადირაძე"
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-text-muted mb-1.5">დირექტორის პ/ნ</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={directorPin}
                        onChange={(e) => setDirectorPin(e.target.value)}
                        placeholder="01019088776"
                        className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION GROUP 2: INDIVIDUAL / PHYSICAL PERSON             */}
            {/* ======================================================== */}
            {entityType === 'physical' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-border-subtle pb-2">
                  <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    ფიზიკური პირის მონაცემები
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md text-text-muted mb-1.5">სახელი *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="გიორგი"
                      required
                      className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md text-text-muted mb-1.5">გვარი *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="ბერიძე"
                      required
                      className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-label-md text-label-md text-text-muted mb-1.5">საცხოვრებელი ადგილი / ფაქტობრივი მისამართი</label>
                    <input
                      type="text"
                      value={actualAddress}
                      onChange={(e) => setActualAddress(e.target.value)}
                      placeholder="ქ. თბილისი, პეკინის გამზ. 15"
                      className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Credentials */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h2 className="font-headline-sm text-sm text-text-primary flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-primary" />
                სისტემური ავტორიზაციის რეკვიზიტები
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-md text-label-md text-text-muted mb-1.5">ელექტრონული ფოსტა *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.ge"
                    required
                    className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-text-muted mb-1.5">მობილური ტელეფონი</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+995 599 00 00 00"
                    className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 font-mono text-text-primary focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-text-muted mb-1.5">პაროლი * (მინ. 6 სიმბოლო)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-text-muted mb-1.5">გაიმეორეთ პაროლი *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-border-subtle rounded-lg px-3 py-2 text-body-md text-text-primary focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submission Block */}
            <div className="pt-6 border-t border-border-subtle space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input defaultChecked className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle" type="checkbox" required />
                <span className="text-body-sm text-text-muted leading-relaxed">
                  ვეთანხმები Debitinfo.GE-ის წესებს, მომსახურების პირობებსა და პერსონალურ მონაცემთა დამუშავების პოლიტიკას.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-lg bg-primary-container text-white font-headline-sm text-sm font-semibold hover:bg-[#0A37CA] active:scale-[0.99] transition duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>მიმდინარეობს რეგისტრაცია...</span>
                  </>
                ) : (
                  <>
                    <span>რეგისტრაციის დასრულება</span>
                    <span className="material-symbols-outlined text-accent-mint">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-body-md text-text-muted">
                  უკვე გაქვთ ანგარიში?{' '}
                  <Link className="text-primary font-semibold hover:underline ml-1" href="/login">
                    შედით სისტემაში
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
