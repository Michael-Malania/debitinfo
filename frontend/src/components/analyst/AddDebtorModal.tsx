'use client';

import React, { useState, useEffect } from 'react';

export interface DebtorFormData {
  entityType: 'PHYSICAL' | 'LEGAL';
  // Common
  phone: string;
  email: string;
  actualAddress: string;
  amount: number | string;
  remainingAmount: number | string;
  debtOriginationDate: string;
  overdueDays: number | string;
  agreementNumber: string;
  // Physical Person
  personalId?: string;
  firstName?: string;
  lastName?: string;
  // Legal Entity
  taxId?: string;
  companyName?: string;
  directorName?: string;
  legalAddress?: string;
  // Display name helper
  name?: string;
}

interface AddDebtorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (debtor: DebtorFormData) => Promise<void> | void;
  creditorName?: string;
  creditorTaxId?: string;
}

export default function AddDebtorModal({
  isOpen,
  onClose,
  onAdd,
  creditorName,
  creditorTaxId,
}: AddDebtorModalProps) {
  const [entityType, setEntityType] = useState<'PHYSICAL' | 'LEGAL'>('PHYSICAL');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<DebtorFormData>({
    entityType: 'PHYSICAL',
    phone: '',
    email: '',
    actualAddress: '',
    amount: '',
    remainingAmount: '',
    debtOriginationDate: new Date().toISOString().slice(0, 10),
    overdueDays: '0',
    agreementNumber: `AGR-${Math.floor(10000 + Math.random() * 90000)}`,
    // Physical
    personalId: '',
    firstName: '',
    lastName: '',
    // Legal
    taxId: '',
    companyName: '',
    directorName: '',
    legalAddress: '',
  });

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setFormData({
        entityType: 'PHYSICAL',
        phone: '',
        email: '',
        actualAddress: '',
        amount: '',
        remainingAmount: '',
        debtOriginationDate: new Date().toISOString().slice(0, 10),
        overdueDays: '0',
        agreementNumber: `AGR-${Math.floor(10000 + Math.random() * 90000)}`,
        personalId: '',
        firstName: '',
        lastName: '',
        taxId: '',
        companyName: '',
        directorName: '',
        legalAddress: '',
      });
      setEntityType('PHYSICAL');
    }
  }, [isOpen]);

  // Auto-calculate overdue days from debt origination date
  const handleDateChange = (dateStr: string) => {
    let overdue = 0;
    if (dateStr) {
      const dt = new Date(dateStr);
      if (!isNaN(dt.getTime())) {
        const diffMs = Date.now() - dt.getTime();
        overdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }
    setFormData((prev) => ({
      ...prev,
      debtOriginationDate: dateStr,
      overdueDays: overdue.toString(),
    }));
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (entityType === 'PHYSICAL') {
      const pin = (formData.personalId || '').trim();
      if (!pin) {
        errs.personalId = 'პირადი ნომერი სავალდებულოა';
      } else if (!/^\d{11}$/.test(pin)) {
        errs.personalId = 'პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან';
      }

      if (!formData.firstName?.trim()) {
        errs.firstName = 'სახელი სავალდებულოა';
      }
      if (!formData.lastName?.trim()) {
        errs.lastName = 'გვარი სავალდებულოა';
      }
    } else {
      const tax = (formData.taxId || '').trim();
      if (!tax) {
        errs.taxId = 'საიდენტიფიკაციო კოდი (ს/კ) სავალდებულოა';
      } else if (!/^\d{9}$/.test(tax)) {
        errs.taxId = 'ს/კ უნდა შედგებოდეს ზუსტად 9 ციფრისგან';
      }

      if (!formData.companyName?.trim()) {
        errs.companyName = 'ორგანიზაციის სრული დასახელება სავალდებულოა';
      }
      if (!formData.directorName?.trim()) {
        errs.directorName = 'დირექტორის სახელი და გვარი სავალდებულოა';
      }
      if (!formData.legalAddress?.trim()) {
        errs.legalAddress = 'იურიდიული მისამართი სავალდებულოა';
      }
    }

    // Common validations
    const phone = formData.phone.trim();
    if (!phone) {
      errs.phone = 'ტელეფონის ნომერი სავალდებულოა';
    } else if (!/^(\+995)?\s*5\d{8}$/.test(phone.replace(/\s+/g, '')) && phone.replace(/\D/g, '').length < 9) {
      errs.phone = 'შეიყვანეთ ვალიდური მობილურის ნომერი (+995 5XX XXXXXX)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'შეიყვანეთ ვალიდური ელ-ფოსტის მისამართი';
    }

    const amt = parseFloat(String(formData.amount));
    if (isNaN(amt) || amt <= 0) {
      errs.amount = 'საწყისი დავალიანება უნდა იყოს 0-ზე მეტი რიცხვი';
    }

    if (!formData.debtOriginationDate) {
      errs.debtOriginationDate = 'წარმოქმნის თარიღი სავალდებულოა';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const isLegal = entityType === 'LEGAL';
      const cleanData: DebtorFormData = {
        ...formData,
        entityType,
        amount: parseFloat(String(formData.amount)) || 0,
        remainingAmount: formData.remainingAmount ? parseFloat(String(formData.remainingAmount)) : parseFloat(String(formData.amount)) || 0,
        overdueDays: parseInt(String(formData.overdueDays), 10) || 0,
        name: isLegal
          ? formData.companyName?.trim()
          : `${formData.firstName?.trim() || ''} ${formData.lastName?.trim() || ''}`.trim(),
        personalId: isLegal ? formData.taxId?.trim() : formData.personalId?.trim(),
        taxId: isLegal ? formData.taxId?.trim() : undefined,
      };

      await onAdd(cleanData);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'დებიტორის დამატება ვერ მოხერხდა');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-border-subtle z-10 space-y-5 animate-in fade-in zoom-in-95 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">person_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-text-primary text-body-lg">
                  დებიტორის ხელით დამატება / მიბმა კრედიტორზე
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-primary text-[11px] font-mono font-bold">
                  Excel სტანდარტი
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {creditorName ? (
                  <>მიმაგრებული კრედიტორი: <strong className="text-text-primary">{creditorName}</strong> {creditorTaxId && <span className="font-mono">({creditorTaxId})</span>}</>
                ) : (
                  'შეიყვანეთ დებიტორის მონაცემები ზუსტად Excel შაბლონის ველების მიხედვით'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Segmented Entity Type Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setEntityType('PHYSICAL');
              setFormData((prev) => ({ ...prev, entityType: 'PHYSICAL' }));
              setErrors({});
            }}
            className={`py-2 px-3 rounded-lg text-body-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              entityType === 'PHYSICAL'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>ფიზიკური პირი (9 ველი)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEntityType('LEGAL');
              setFormData((prev) => ({ ...prev, entityType: 'LEGAL' }));
              setErrors({});
            }}
            className={`py-2 px-3 rounded-lg text-body-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              entityType === 'LEGAL'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">domain</span>
            <span>იურიდიული პირი (13 ველი)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-0.5">
          {/* ========================================================================= */}
          {/* 1. PHYSICAL PERSON FIELDS (9 FIELDS) */}
          {/* ========================================================================= */}
          {entityType === 'PHYSICAL' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Personal ID (Strict 11 digits) */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    პირადი ნომერი (პ/ნ 11 ნიშნა) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.personalId || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Digits only
                      setFormData({ ...formData, personalId: val });
                      if (errors.personalId) setErrors({ ...errors, personalId: '' });
                    }}
                    placeholder="01019012345"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono font-bold focus:outline-none transition ${
                      errors.personalId ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.personalId ? (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.personalId}</p>
                  ) : (
                    <p className="text-[10px] text-text-muted mt-0.5">ზუსტად 11 ციფრი ({formData.personalId?.length || 0}/11)</p>
                  )}
                </div>

                {/* 2. First Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    სახელი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (errors.firstName) setErrors({ ...errors, firstName: '' });
                    }}
                    placeholder="მაგ: გიორგი"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm focus:outline-none transition ${
                      errors.firstName ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.firstName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.firstName}</p>}
                </div>

                {/* 3. Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    გვარი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      if (errors.lastName) setErrors({ ...errors, lastName: '' });
                    }}
                    placeholder="მაგ: ბერიძე"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm focus:outline-none transition ${
                      errors.lastName ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.lastName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 4. Phone */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საკონტაქტო მობილური <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={13}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="+995 599 123456"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono focus:outline-none transition ${
                      errors.phone ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
                </div>

                {/* 5. Email */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ელ-ფოსტა
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="example@gmail.com"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono focus:outline-none transition ${
                      errors.email ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 mt-0.5">{errors.email}</p>}
                </div>
              </div>

              {/* 6. Actual Address */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  ფაქტობრივი მისამართი
                </label>
                <input
                  type="text"
                  value={formData.actualAddress}
                  onChange={(e) => setFormData({ ...formData, actualAddress: e.target.value })}
                  placeholder="ქ. თბილისი, რუსთაველის გამზ. #10"
                  className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 7. Debt Amount */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საწყისი დავალიანება (₾) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (errors.amount) setErrors({ ...errors, amount: '' });
                    }}
                    placeholder="3500.00"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono font-bold focus:outline-none transition ${
                      errors.amount ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.amount && <p className="text-[11px] text-rose-500 mt-0.5">{errors.amount}</p>}
                </div>

                {/* 8. Origination Date */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    წარმოქმნის თარიღი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.debtOriginationDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 9. Agreement Number */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ხელშეკრულების №
                  </label>
                  <input
                    type="text"
                    value={formData.agreementNumber}
                    onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })}
                    placeholder="AGR-8841"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. LEGAL ENTITY FIELDS (13 FIELDS) */}
          {/* ========================================================================= */}
          {entityType === 'LEGAL' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Tax ID (Strict 9 digits) */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    value={formData.taxId || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); // Digits only
                      setFormData({ ...formData, taxId: val });
                      if (errors.taxId) setErrors({ ...errors, taxId: '' });
                    }}
                    placeholder="405123456"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono font-bold focus:outline-none transition ${
                      errors.taxId ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.taxId ? (
                    <p className="text-[11px] text-rose-500 mt-0.5">{errors.taxId}</p>
                  ) : (
                    <p className="text-[10px] text-text-muted mt-0.5">ზუსტად 9 ციფრი ({formData.taxId?.length || 0}/9)</p>
                  )}
                </div>

                {/* 2. Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ორგანიზაციის სრული დასახელება <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      if (errors.companyName) setErrors({ ...errors, companyName: '' });
                    }}
                    placeholder="შპს ორიონ დეველოპმენტი"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm focus:outline-none transition ${
                      errors.companyName ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.companyName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.companyName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 3. Director Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    დირექტორის სახელი &amp; გვარი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.directorName || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, directorName: e.target.value });
                      if (errors.directorName) setErrors({ ...errors, directorName: '' });
                    }}
                    placeholder="ნიკოლოზ ხუციშვილი"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm focus:outline-none transition ${
                      errors.directorName ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.directorName && <p className="text-[11px] text-rose-500 mt-0.5">{errors.directorName}</p>}
                </div>

                {/* 4. Contact Phone */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საკონტაქტო ტელეფონი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={13}
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="+995 599 000000"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono focus:outline-none transition ${
                      errors.phone ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.phone && <p className="text-[11px] text-rose-500 mt-0.5">{errors.phone}</p>}
                </div>

                {/* 5. Email */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ელ-ფოსტა
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="info@company.ge"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 6. Legal Address */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    იურიდიული მისამართი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.legalAddress || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, legalAddress: e.target.value });
                      if (errors.legalAddress) setErrors({ ...errors, legalAddress: '' });
                    }}
                    placeholder="ქ. თბილისი, ჭავჭავაძის გამზ. #22"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm focus:outline-none transition ${
                      errors.legalAddress ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.legalAddress && <p className="text-[11px] text-rose-500 mt-0.5">{errors.legalAddress}</p>}
                </div>

                {/* 7. Actual Address */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ფაქტობრივი მისამართი
                  </label>
                  <input
                    type="text"
                    value={formData.actualAddress}
                    onChange={(e) => setFormData({ ...formData, actualAddress: e.target.value })}
                    placeholder="ქ. თბილისი, ვაჟა-ფშაველას გამზ. #14"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 8. Initial Amount */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    საწყისი დავალიანება (₾) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: e.target.value });
                      if (errors.amount) setErrors({ ...errors, amount: '' });
                    }}
                    placeholder="8500.00"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-body-sm font-mono font-bold focus:outline-none transition ${
                      errors.amount ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border-subtle focus:border-primary'
                    }`}
                  />
                  {errors.amount && <p className="text-[11px] text-rose-500 mt-0.5">{errors.amount}</p>}
                </div>

                {/* 9. Remaining Amount */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    დარჩენილი დავალიანება (₾)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.remainingAmount}
                    onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
                    placeholder={formData.amount ? String(formData.amount) : '8500.00'}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 10. Origination Date */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    წარმოქმნის თარიღი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.debtOriginationDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 11. Overdue Days */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ვადაგადაცილების დღეები
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.overdueDays}
                    onChange={(e) => setFormData({ ...formData, overdueDays: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                {/* 12. Agreement / Invoice */}
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    ხელშეკრულების / ინვოისის №
                  </label>
                  <input
                    type="text"
                    value={formData.agreementNumber}
                    onChange={(e) => setFormData({ ...formData, agreementNumber: e.target.value })}
                    placeholder="INV-2024-8841"
                    className="w-full px-3 py-2 bg-white border border-border-subtle rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm font-medium transition cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-body-sm shadow-sm flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>დებიტორის დამატება რეესტრში</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
