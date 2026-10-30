'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  authService,
  creditorBackendService,
  paymentsService,
  PaymentReceiptItem,
  AuthUser,
  getClaimStatusBadge,
  ClaimStatusConfigItem,
} from '@/services';
import { downloadDebtorTemplateXLSX, parseDebtorExcelFile } from '@/utils/excel';

interface CreditorDashboardViewProps {
  user: AuthUser;
}

export default function CreditorDashboardView({ user }: CreditorDashboardViewProps) {
  const router = useRouter();
  const [claimsData, setClaimsData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Payment receipts & confirmation states
  const [receipts, setReceipts] = useState<PaymentReceiptItem[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PaymentReceiptItem[]>([]);
  const [selectedReceiptForConfirm, setSelectedReceiptForConfirm] = useState<PaymentReceiptItem | null>(null);
  const [confirmFile, setConfirmFile] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  // Debtor batch import & manual entry states
  const [uploadedDebtors, setUploadedDebtors] = useState<any[]>([]);
  const [isAddDebtorModalOpen, setIsAddDebtorModalOpen] = useState(false);
  const [newDebtorEntityType, setNewDebtorEntityType] = useState<'LEGAL' | 'PHYSICAL'>('LEGAL');
  const [newDebtorActualMatchesLegal, setNewDebtorActualMatchesLegal] = useState(false);
  const [newDebtorForm, setNewDebtorForm] = useState({
    // Legal fields
    taxId: '',
    name: '',
    phone: '',
    email: '',
    legalAddress: '',
    actualAddress: '',
    amount: '',
    debtOriginationDate: new Date().toISOString().split('T')[0],
    agreementNumber: '',
    directorFirstName: '',
    directorLastName: '',
    directorPersonalId: '',
    directorEmail: '',
    directorPhone: '',
    // Physical fields
    personalId: '',
    firstName: '',
    lastName: '',
  });
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Selected debtor for right sidebar details & payment history inspection
  const defaultSelectedDebtor = {
    id: 'default-giorgi',
    name: 'გიორგი გიორგაძე',
    personalId: '01019012345',
    entityType: 'PHYSICAL',
    phone: '+995 599 12 34 56',
    email: 'giorgi.g@gmail.com',
    actualAddress: 'თბილისი, ვაჟა-ფშაველას გამზ. 25, ბინა 42',
    legalAddress: 'თბილისი, ვაჟა-ფშაველას გამზ. 25, ბინა 42',
    amount: 5000,
    remainingAmount: 2200,
    paidAmount: 2800,
    rating: 'Grade B (ზომიერი რისკი)',
    overdueDays: 45,
    dueDate: '14 იან, 2025',
    status: 'RESTRUCTURED',
    agreementNumber: 'AGR-77142',
  };

  const [selectedDebtor, setSelectedDebtor] = useState<any>(defaultSelectedDebtor);

  const handleSelectDebtor = (debtor: any) => {
    const init = Number(debtor.amount || debtor.initialAmount || 0);
    const rem = debtor.remainingAmount !== undefined ? Number(debtor.remainingAmount) : (debtor.paidAmount !== undefined ? Math.max(0, init - Number(debtor.paidAmount)) : init);
    const paid = debtor.paidAmount !== undefined ? Number(debtor.paidAmount) : Math.max(0, init - rem);

    setSelectedDebtor({
      id: debtor.id || debtor.personalId || String(Math.random()),
      name: debtor.name,
      personalId: debtor.personalId || debtor.taxId || '—',
      taxId: debtor.taxId,
      entityType: debtor.entityType || (debtor.taxId ? 'LEGAL' : 'PHYSICAL'),
      phone: debtor.phone || '+995 599 00 00 00',
      email: debtor.email || '—',
      legalAddress: debtor.legalAddress || 'ქ. თბილისი',
      actualAddress: debtor.actualAddress || debtor.legalAddress || 'ქ. თბილისი',
      amount: init,
      remainingAmount: rem,
      paidAmount: paid,
      rating: debtor.rating || 'Grade B (ზომიერი რისკი)',
      overdueDays: debtor.overdueDays || 30,
      debtOriginationDate: debtor.debtOriginationDate,
      dueDate: debtor.dueDate || (debtor.debtOriginationDate ? new Date(debtor.debtOriginationDate).toLocaleDateString('ka-GE') : '14 იან, 2025'),
      agreementNumber: debtor.agreementNumber || 'AGR-GENERAL',
      directorFirstName: debtor.directorFirstName,
      directorLastName: debtor.directorLastName,
      directorPhone: debtor.directorPhone,
      status: debtor.status || 'ACTIVE',
    });
  };

  useEffect(() => {
    let isMounted = true;
    async function loadClaims() {
      try {
        const data = await creditorBackendService.getMyClaims();
        if (isMounted && data) {
          setClaimsData(data);
        }
      } catch (e) {
        console.warn('Could not fetch creditor claims:', e);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    async function loadReceipts() {
      try {
        const res = await paymentsService.getCreditorPayments();
        if (isMounted && res) {
          setReceipts(res.receipts);
          setPendingReceipts(res.receipts.filter((r) => r.status === 'PENDING_CONFIRMATION'));
        }
      } catch (err) {
        console.warn('Could not load creditor receipts:', err);
      }
    }

    async function loadUploaded() {
      try {
        const up = await creditorBackendService.getUploadedDebtors();
        if (isMounted && up) {
          setUploadedDebtors(up);
        }
      } catch (err) {
        console.warn('Could not load uploaded debtors:', err);
      }
    }

    loadClaims();
    loadReceipts();
    loadUploaded();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadDebtorTemplate = async () => {
    try {
      await downloadDebtorTemplateXLSX();
    } catch (err) {
      console.error('Failed to download template:', err);
      alert('შაბლონის ჩამოტვირთვა ვერ მოხერხდა.');
    }
  };

  const handleCreditorImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedDebtors = await parseDebtorExcelFile(file);
      if (parsedDebtors.length > 0) {
        await creditorBackendService.importDebtorsBatch(parsedDebtors);
        setImportSuccessMessage(
          `Excel (.xlsx) ფაილიდან წარმატებით ჩაიტვირთა ${parsedDebtors.length} დებიტორი! მონაცემები გადაეგზავნა ანალიტიკოსს RS.GE გადამოწმებისთვის (სტატუსი: დასადასტურებელი).`
        );
        setTimeout(() => setImportSuccessMessage(null), 6000);
        const latest = await creditorBackendService.getUploadedDebtors();
        setUploadedDebtors(latest && latest.length > 0 ? latest : parsedDebtors);
      } else {
        alert('ფაილში მონაცემები ვერ მოიძებნა. გთხოვთ გამოიყენოთ შაბლონი (.xlsx).');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('ფაილის წაკითხვა ვერ მოხერხდა. გადაამოწმეთ ფაილის ფორმატი (.xlsx / .xls).');
    } finally {
      e.target.value = '';
    }
  };

  const handleCreateDebtorManually = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newDebtorEntityType === 'LEGAL') {
      if (!newDebtorForm.taxId || !newDebtorForm.name || !newDebtorForm.phone || !newDebtorForm.amount) {
        alert('გთხოვთ შეავსოთ სავალდებულო ველები (საიდენტიფიკაციო კოდი, სრული დასახელება, ტელეფონი, საწყისი დავალიანება)');
        return;
      }
    } else {
      if (!newDebtorForm.personalId || !newDebtorForm.firstName || !newDebtorForm.lastName || !newDebtorForm.phone || !newDebtorForm.amount) {
        alert('გთხოვთ შეავსოთ სავალდებულო ველები (პირადი ნომერი, სახელი, გვარი, ტელეფონი, საწყისი დავალიანება)');
        return;
      }
    }

    const debtOrigDate = newDebtorForm.debtOriginationDate ? new Date(newDebtorForm.debtOriginationDate) : null;
    let overdueDays = 0;
    if (debtOrigDate && !isNaN(debtOrigDate.getTime())) {
      overdueDays = Math.max(0, Math.floor((Date.now() - debtOrigDate.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const debtorItem =
      newDebtorEntityType === 'LEGAL'
        ? {
            entityType: 'LEGAL',
            taxId: newDebtorForm.taxId,
            personalId: newDebtorForm.directorPersonalId || newDebtorForm.taxId,
            name: newDebtorForm.name,
            phone: newDebtorForm.phone,
            email: newDebtorForm.email || '',
            legalAddress: newDebtorForm.legalAddress || 'ქ. თბილისი',
            actualAddress: newDebtorActualMatchesLegal
              ? (newDebtorForm.legalAddress || 'ქ. თბილისი')
              : (newDebtorForm.actualAddress || newDebtorForm.legalAddress || 'ქ. თბილისი'),
            amount: parseFloat(newDebtorForm.amount) || 0,
            debtOriginationDate: newDebtorForm.debtOriginationDate || new Date().toISOString().split('T')[0],
            overdueDays,
            directorFirstName: newDebtorForm.directorFirstName || '',
            directorLastName: newDebtorForm.directorLastName || '',
            directorPersonalId: newDebtorForm.directorPersonalId || '',
            directorEmail: newDebtorForm.directorEmail || '',
            directorPhone: newDebtorForm.directorPhone || '',
            agreementNumber: newDebtorForm.agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
            status: 'PENDING_VERIFICATION',
            sourceFile: 'manual_entry',
          }
        : {
            entityType: 'PHYSICAL',
            taxId: '',
            personalId: newDebtorForm.personalId,
            firstName: newDebtorForm.firstName,
            lastName: newDebtorForm.lastName,
            name: `${newDebtorForm.firstName} ${newDebtorForm.lastName}`.trim(),
            phone: newDebtorForm.phone,
            email: newDebtorForm.email || '',
            legalAddress: newDebtorForm.legalAddress || 'ქ. თბილისი',
            actualAddress: newDebtorActualMatchesLegal
              ? (newDebtorForm.legalAddress || 'ქ. თბილისი')
              : (newDebtorForm.actualAddress || newDebtorForm.legalAddress || 'ქ. თბილისი'),
            amount: parseFloat(newDebtorForm.amount) || 0,
            debtOriginationDate: newDebtorForm.debtOriginationDate || new Date().toISOString().split('T')[0],
            overdueDays,
            agreementNumber: newDebtorForm.agreementNumber || `AGR-${Date.now().toString().slice(-5)}`,
            status: 'PENDING_VERIFICATION',
            sourceFile: 'manual_entry',
          };

    try {
      await creditorBackendService.importDebtorsBatch([debtorItem]);
      setImportSuccessMessage(
        `ახალი დებიტორი „${debtorItem.name}“ წარმატებით დარეგისტრირდა და გადაეგზავნა ანალიტიკოსს RS.GE გადამოწმებისთვის (სტატუსი: დასადასტურებელი)!`
      );
      setTimeout(() => setImportSuccessMessage(null), 6000);
      setIsAddDebtorModalOpen(false);
      setNewDebtorForm({
        taxId: '',
        name: '',
        phone: '',
        email: '',
        legalAddress: '',
        actualAddress: '',
        amount: '',
        debtOriginationDate: new Date().toISOString().split('T')[0],
        agreementNumber: '',
        directorFirstName: '',
        directorLastName: '',
        directorPersonalId: '',
        directorEmail: '',
        directorPhone: '',
        personalId: '',
        firstName: '',
        lastName: '',
      });
      const latest = await creditorBackendService.getUploadedDebtors();
      setUploadedDebtors(latest && latest.length > 0 ? latest : [debtorItem, ...uploadedDebtors]);
    } catch (err: any) {
      alert(err?.message || 'დებიტორის დამატება ვერ მოხერხდა');
    }
  };

  const handleConfirmByCreditor = async () => {
    if (!selectedReceiptForConfirm) return;
    setConfirming(true);
    try {
      const updated = await paymentsService.confirmByCreditor(
        selectedReceiptForConfirm.id,
        confirmFile ? `/receipts/${confirmFile}` : undefined,
      );
      setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
      setPendingReceipts(prev => prev.filter(r => r.id !== updated.id));
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        setSelectedReceiptForConfirm(null);
        setConfirmFile('');
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'დადასტურება ვერ მოხერხდა');
    } finally {
      setConfirming(false);
    }
  };

  const openOfficialDocument = (receipt: PaymentReceiptItem) => {
    const isAccountant = receipt.status === 'CONFIRMED_BY_ACCOUNTANT';
    const docWindow = window.open('', '_blank');
    if (!docWindow) return;

    docWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ka">
      <head>
        <meta charset="utf-8">
        <title>${isAccountant ? 'ბუღალტრის დასტურის ბრძანება' : 'თანხის მიღების დადასტურების ქვითარი'} - #${receipt.receiptNumber}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid ${isAccountant ? '#b45309' : '#002984'}; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 22px; font-weight: bold; color: ${isAccountant ? '#b45309' : '#002984'}; }
          .badge { background: ${isAccountant ? '#fef3c7' : '#ecfdf5'}; color: ${isAccountant ? '#92400e' : '#065f46'}; border: 1px solid ${isAccountant ? '#fde68a' : '#a7f3d0'}; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
          .title { font-size: 20px; font-weight: bold; text-align: center; margin: 25px 0 8px; color: #0f172a; }
          .subtitle { text-align: center; color: #64748b; font-size: 14px; margin-bottom: 25px; }
          .table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          .table th, .table td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; font-size: 14px; }
          .table th { background: #f8fafc; font-weight: 600; width: 38%; color: #475569; }
          .amount-tag { font-size: 18px; font-weight: bold; color: #059669; }
          .stamp-box { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .stamp { border: 2px dashed ${isAccountant ? '#b45309' : '#002984'}; padding: 15px 25px; border-radius: 8px; text-align: center; color: ${isAccountant ? '#b45309' : '#002984'}; font-weight: bold; font-size: 13px; line-height: 1.5; }
          .qr-box { font-size: 12px; color: #64748b; text-align: right; line-height: 1.5; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Debitinfo.GE • ფინანსური მოდული</div>
          <div class="badge">${isAccountant ? '✓ ბუღალტრის დასტური (#' + (receipt.accountantOrderNumber || '') + ')' : '✓ კრედიტორის ოფიციალური დასტური'}</div>
        </div>
        <div class="title">${isAccountant ? 'ბუღალტრული დასტურის ბრძანება' : 'თანხის მიღების დადასტურების ქვითარი'}</div>
        <div class="subtitle">ვალდებულების ნაწილობრივი/სრული დაფარვის აღრიცხვის აქტი</div>
        
        <table class="table">
          <tr><th>ქვითრის / ტრანზაქციის #</th><td><strong>#${receipt.receiptNumber}</strong></td></tr>
          <tr><th>დებიტორი (გადამხდელი)</th><td>${receipt.debtorName}</td></tr>
          <tr><th>კრედიტორი (მიმღები)</th><td>${receipt.creditorName}</td></tr>
          <tr><th>გადახდილი თანხა</th><td class="amount-tag">${Number(receipt.amount).toLocaleString('ka-GE')} ₾</td></tr>
          <tr><th>გადახდის თარიღი</th><td>${new Date(receipt.paymentDate).toLocaleDateString('ka-GE')}</td></tr>
          <tr><th>დადასტურების სტატუსი</th><td><strong style="color: #059669;">${isAccountant ? 'დადასტურებულია ბუღალტრის მიერ' : 'დადასტურებულია კრედიტორის მიერ'}</strong></td></tr>
          <tr><th>დამადასტურებელი პირი</th><td>${receipt.confirmedByUserName || 'ავტორიზებული პირი'}</td></tr>
          ${isAccountant ? `<tr><th>ბუღალტრის ბრძანების #</th><td><strong>${receipt.accountantOrderNumber || 'ACC-ORD-2026'}</strong></td></tr>` : ''}
          ${isAccountant && receipt.accountantOrderNotes ? `<tr><th>ბუღალტრის საფუძველი</th><td>${receipt.accountantOrderNotes}</td></tr>` : ''}
          ${receipt.debtorNotes ? `<tr><th>დებიტორის დანიშნულება</th><td>${receipt.debtorNotes}</td></tr>` : ''}
          <tr><th>დადასტურების თარიღი</th><td>${receipt.confirmedAt ? new Date(receipt.confirmedAt).toLocaleString('ka-GE') : new Date().toLocaleString('ka-GE')}</td></tr>
        </table>

        <p style="font-size: 13px; color: #475569; margin-top: 20px;">
          დოკუმენტი ადასტურებს, რომ დებიტორის მიერ განხორციელებული გადარიცხვის ქვითარი შემოწმებულია და თანხის მიღება ოფიციალურად ასახულია Debitinfo.GE-ის ერთიან რეესტრში.
        </p>

        <div class="stamp-box">
          <div class="stamp">
            DEBITINFO.GE<br>
            ${isAccountant ? 'ფინანსური & ბუღალტრული განყოფილება<br>✓ ბრძანება ძალაშია' : 'კრედიტორის დასტური<br>✓ გადახდა მიღებულია'}
          </div>
          <div class="qr-box">
            დოკუმენტის უნიკალური ID: ${receipt.id}<br>
            გენერირებულია სისტემიდან: ${new Date().toLocaleDateString('ka-GE')}
          </div>
        </div>

        <div class="no-print" style="margin-top: 35px; text-align: center;">
          <button onclick="window.print()" style="padding: 12px 28px; background: ${isAccountant ? '#b45309' : '#002984'}; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer;">
            🖨️ ბეჭდვა / PDF შენახვა
          </button>
        </div>
      </body>
      </html>
    `);
    docWindow.document.close();
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  if (loadingData && !claimsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">მონაცემების ჩატვირთვა...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს თქვენი ორგანიზაციის მოთხოვნების უსაფრთხო ჩატვირთვა</p>
          </div>
        </div>
      </div>
    );
  }

  // Real Dynamic Values from Authenticated User & Database
  const companyName = user?.companyProfile?.companyName || (user?.entityType === 'PHYSICAL' ? `${user.individualProfile?.firstName || ''} ${user.individualProfile?.lastName || ''}`.trim() : null) || user?.email || 'შპს ჯეო ტრეიდინგი';
  const companyInitials = companyName ? companyName.replace(/შპს|სს|ა\(ა\)იპ|"|„|“/g, '').trim().slice(0, 2).toUpperCase() : 'კრ';
  const taxId = user?.personalId || user?.companyProfile?.taxId || '405123456';

  const kpis = claimsData?.kpis || {
    totalPrincipal: 1540,
    totalRecovered: 650,
    recoveryRate: 42.2,
    activeClaimsCount: 1,
    activeDebtorsCount: 1,
  };

  return (
    <div className="bg-surface-bg text-text-primary antialiased font-body-md text-body-md min-h-screen flex flex-col" suppressHydrationWarning>
      {/* ========================================================================= */}
  {/* TopNavBar (Creditor Dashboard Context)                                   */}
  {/* ========================================================================= */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo + Segment Indicator */}
      <div className="flex items-center gap-6">
        <Link className="flex items-center gap-2 group" href="/dashboard">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]" data-icon="account_balance">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
            <span className="text-[9px] font-label-sm font-semibold tracking-wider text-text-muted uppercase">კრედიტორის კაბინეტი</span>
          </div>
        </Link>
        {/* Global Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6 ml-4">
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#services">სერვისები</Link>
          <span className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 font-semibold cursor-pointer">პორტფელი &amp; რეესტრი</span>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#pricing">ტარიფები</Link>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/#blog">ბლოგი</Link>
          <Link className="text-text-muted hover:text-primary transition-colors duration-150 font-label-md text-label-md" href="/contact">კონტაქტი</Link>
        </nav>
      </div>
      {/* Header Actions: Quick Search, Notifications & Organization Profile */}
      <div className="flex items-center gap-3">
        {/* Live Search Field in Header */}
        <div className="hidden xl:flex items-center relative w-72">
          <span className="material-symbols-outlined absolute left-3 text-text-muted text-[18px]" data-icon="search">search</span>
          <input className="w-full pl-9 pr-3 py-1.5 bg-surface-bg border border-border-subtle rounded-lg text-body-sm font-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all" placeholder="დებიტორის პ/ნ ან ს/კ..." type="text" />
        </div>
        {/* Notification Center with Pulse Indicator */}
        <button className="relative p-2 rounded-lg hover:bg-surface-container-high/40 text-text-muted hover:text-text-primary transition-colors" title="შეტყობინებები">
          <span className="material-symbols-outlined text-[22px]" data-icon="notifications">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rating-c ring-2 ring-white animate-pulse" />
        </button>
        {/* RS.GE Integration Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>RS.GE სინქრონიზაცია</span>
        </div>
        {/* Language Action */}
        <button className="p-2 text-text-muted hover:text-primary rounded-lg transition-colors hidden sm:block" title="ენა">
          <span className="material-symbols-outlined text-[20px]" data-icon="language">language</span>
        </button>
        <div className="h-6 w-px bg-border-subtle hidden sm:block" />
        {/* Client Profile Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-body-sm uppercase">
            <span>{companyInitials}</span>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-body-sm font-semibold text-text-primary leading-tight truncate max-w-[180px]">{companyName}</span>
            <span className="text-[10px] text-text-muted font-label-sm">ს/კ {taxId}</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 ml-1 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-colors active:scale-95 cursor-pointer" title="გამოსვლა" type="button">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* ========================================================================= */}
  {/* Contextual Sub-Header: Client Metadata & High-Value Batch Actions         */}
  {/* ========================================================================= */}
  <section className="bg-surface-card border-b border-border-subtle">
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Company Identity Card */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 text-primary">
            <span className="material-symbols-outlined text-[26px]" data-icon="domain">domain</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-headline-md font-headline-md font-bold text-text-primary">{companyName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 text-[11px] font-semibold border border-emerald-500/20">
                <span className="material-symbols-outlined text-[14px]" data-icon="verified">verified</span>
                {user?.isRsVerified ? 'აქტიური — ვერიფიცირებული RS.GE-ით' : 'RS.GE ვერიფიკაცია მოლოდინში'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-body-sm text-text-muted flex-wrap">
              <span>საიდენტიფიკაციო კოდი: <strong className="font-data-mono-md text-text-primary">{taxId}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>სისტემური როლი: <span className="font-semibold text-primary">კრედიტორი / დამკვეთი (გამსესხებელი)</span></span>
              <span className="hidden sm:inline">•</span>
              <span>სტატუსი: <span className="font-data-mono-md text-emerald-600 font-semibold">{user?.status || 'ACTIVE'}</span></span>
            </div>
          </div>
        </div>
        {/* High-Priority Operations / Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleDownloadDebtorTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-primary font-semibold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            title="ჩამოტვირთეთ დებიტორთა შევსების შაბლონი (.xlsx)"
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-600">download</span>
            <span>შაბლონის ჩამოტვირთვა (.xlsx)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle bg-surface-card hover:bg-slate-50 text-text-primary font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined text-[17px] text-emerald-600">upload_file</span>
            <span>დებიტორების იმპორტი (.xlsx / .xls)</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleCreditorImportExcel}
            />
          </label>

          <button
            type="button"
            onClick={() => setIsAddDebtorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white font-semibold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            <span>+ ახალი დებიტორის დამატება</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-bg text-text-primary font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-text-muted">file_download</span>
            <span>ექსპორტი</span>
          </button>
        </div>
      </div>
    </div>

    {importSuccessMessage && (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-3">
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 animate-fadeIn shadow-xs">
          <span className="material-symbols-outlined text-amber-600 text-base">hourglass_top</span>
          <span>{importSuccessMessage}</span>
        </div>
      </div>
    )}
  </section>
  {/* ========================================================================= */}
  {/* Main Operational Canvas                                                  */}
  {/* ========================================================================= */}
  <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
    {/* 1. Executive Financial KPI Cards Row */}
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Claimed */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">ჯამური მოთხოვნილი თანხა</span>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]" data-icon="payments">payments</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-text-primary font-data-mono-lg tracking-tight">
            ₾ {kpis.totalPrincipal.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-body-sm text-text-muted">
            <span className="inline-flex items-center text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span> რეალური ბაზა
            </span>
            <span>სულ {kpis.activeDebtorsCount} დებიტორი რეესტრში</span>
          </div>
        </div>
      </div>
      {/* Card 2: Recovered Amount with #0DFCC4 highlight */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent-mint/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">დაფარული / ამოღებული თანხა</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <span className="material-symbols-outlined text-[20px]" data-icon="price_check">price_check</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-emerald-800 font-data-mono-lg tracking-tight flex items-center gap-2">
            ₾ {kpis.totalRecovered.toLocaleString()}
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-mint/20 text-emerald-900 font-bold border border-accent-mint/40">{kpis.recoveryRate}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden border border-border-subtle">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{width: `${kpis.recoveryRate}%`}} />
          </div>
        </div>
      </div>
      {/* Card 3: Remaining Balance */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">დარჩენილი ბალანსი</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
            <span className="material-symbols-outlined text-[20px]" data-icon="pending_actions">pending_actions</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-amber-600 font-data-mono-lg tracking-tight">
            ₾ {Math.max(0, kpis.totalPrincipal - kpis.totalRecovered).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-body-sm text-text-muted">
            <span className="inline-flex items-center text-amber-700 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              <span className="material-symbols-outlined text-[13px] mr-0.5" data-icon="warning">warning</span> აქტიური მონიტორინგი
            </span>
          </div>
        </div>
      </div>
      {/* Card 4: Active Cases and Status Distribution */}
      <div className="bg-surface-card rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-muted">აქტიური საქმეები და სტატუსი</span>
          <div className="p-2 rounded-lg bg-blue-50 text-primary">
            <span className="material-symbols-outlined text-[20px]" data-icon="gavel">gavel</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-headline-lg font-headline-lg font-bold text-text-primary font-data-mono-lg tracking-tight">
            18 <span className="text-sm font-normal text-text-muted">აქტიური</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-body-sm font-medium">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs border border-rose-200">4 სამართლებრივი</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">2 დახურული</span>
          </div>
        </div>
      </div>
    </section>
    {/* 2. Dual Workspace: Master Data Table + Live Debtor Inspector Drawer */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left/Center Column: Master Debtors Registry (7 Cols on desktop) */}
      <div className="lg:col-span-7 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex flex-col">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-headline-sm font-headline-sm font-bold text-text-primary flex items-center gap-2">
              დებიტორთა (მოვალეთა) სრული რეესტრი
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-data-mono-md">24</span>
            </h2>
            <p className="text-body-sm text-text-muted mt-0.5">მონაცემები ავტომატურად განახლებულია სამოქალაქო რეესტრიდან</p>
          </div>
          {/* Quick Search Filter Inside Table */}
          <div className="relative w-full sm:w-56">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-text-muted text-[18px]" data-icon="filter_list">filter_list</span>
            <input className="w-full pl-8 pr-3 py-1.5 bg-surface-bg border border-border-subtle rounded-lg text-body-sm font-body-sm text-text-primary focus:outline-none focus:border-secondary-container" placeholder="ფილტრი სახელით..." type="text" />
          </div>
        </div>
        {/* Filter Tabs */}
        <div className="px-5 pt-3 border-b border-border-subtle flex items-center space-x-2 overflow-x-auto">
          <button className="px-3 py-2 text-body-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap">
            ყველა დებიტორი (24)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            ვადაგადაცილებული (9)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            მიმდინარე (13)
          </button>
          <button className="px-3 py-2 text-body-sm text-text-muted hover:text-text-primary whitespace-nowrap">
            დახურული (2)
          </button>
        </div>
        {/* Master Data Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">დებიტორი (მოვალე) / საიდენტ.</th>
                <th className="py-3 px-4 text-right">საწყისი ვალი</th>
                <th className="py-3 px-4 text-right">დარჩენილი</th>
                <th className="py-3 px-3 text-center">რისკი</th>
                <th className="py-3 px-3 text-center">სტატუსი</th>
                <th className="py-3 px-3 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-sm">
              {/* Uploaded / Imported Debtors by Creditor */}
              {uploadedDebtors.map((ud: any) => {
                const isSelected = selectedDebtor?.personalId === ud.personalId || selectedDebtor?.id === ud.id;
                const isLegal = ud.entityType === 'LEGAL' || (ud.taxId && ud.taxId.length === 9);
                return (
                  <tr
                    key={ud.id || ud.personalId}
                    onClick={() => handleSelectDebtor(ud)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'bg-amber-50/15 hover:bg-amber-50/35 border-l-4 border-l-amber-400'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-2">
                        <span>{ud.name}</span>
                        {isLegal ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <span className="material-symbols-outlined text-[12px]">apartment</span>
                            <span>იურიდიული</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            <span>ფიზიკური</span>
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>{isLegal ? 'ს/კ' : 'პ/ნ'}: {isLegal ? (ud.taxId || ud.personalId) : ud.personalId}</span>
                        {ud.phone && <span>• ტელ: {ud.phone}</span>}
                        {ud.debtOriginationDate && (
                          <span>• წარმოქმნის თარიღი: {String(ud.debtOriginationDate).split('T')[0]}</span>
                        )}
                        <span>• {ud.agreementNumber || 'AGR-88451'}</span>
                      </div>
                      {isLegal && (ud.directorFirstName || ud.directorLastName) && (
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <span className="font-medium text-slate-700">დირექტორი:</span>
                          <span>{ud.directorFirstName} {ud.directorLastName}</span>
                          {ud.directorPhone && <span className="font-mono text-slate-500">({ud.directorPhone})</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {Number(ud.amount || 0).toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-amber-700">₾ {Number(ud.remainingAmount ?? ud.amount ?? 0).toLocaleString('ka-GE')}.00</span>
                      <div className="text-[10px] text-text-muted font-data-mono-md">ვადა: {ud.overdueDays || 0} დღე</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                        {ud.rating || 'Grade B'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span>დასადასტურებელი</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(ud);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Sample Debtor: ლევან მაისურაძე (if not present in uploadedDebtors) */}
              {!uploadedDebtors.some((d) => d.personalId === '01015099882' || d.name?.includes('მაისურაძე')) && (
                (() => {
                  const levanItem = {
                    id: 'levan-maisuradze-sample',
                    name: 'ლევან მაისურაძე',
                    personalId: '01015099882',
                    agreementNumber: 'AGR-88451',
                    amount: 4500,
                    remainingAmount: 4500,
                    paidAmount: 0,
                    rating: 'Grade B (ზომიერი რისკი)',
                    overdueDays: 90,
                    phone: '+995 591 22 33 44',
                    email: 'levan.m@gmail.com',
                    actualAddress: 'ქ. თბილისი, პეკინის გამზ. #14',
                    legalAddress: 'ქ. თბილისი, პეკინის გამზ. #14',
                    status: 'დასადასტურებელი',
                    entityType: 'PHYSICAL',
                  };
                  const isSelected = selectedDebtor?.personalId === levanItem.personalId;
                  return (
                    <tr
                      key="sample-levan"
                      onClick={() => handleSelectDebtor(levanItem)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                          : 'bg-amber-50/15 hover:bg-amber-50/35 border-l-4 border-l-amber-400'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          <span>{levanItem.name}</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="material-symbols-outlined text-[12px]">person</span>
                            <span>ფიზიკური</span>
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                          )}
                        </div>
                        <div className="font-data-mono-md text-[11px] text-text-muted mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>პ/ნ: {levanItem.personalId}</span>
                          <span>• ტელ: {levanItem.phone}</span>
                          <span>• {levanItem.agreementNumber}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                        ₾ {levanItem.amount.toLocaleString('ka-GE')}.00
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-data-mono-md font-bold text-amber-700">₾ {levanItem.remainingAmount.toLocaleString('ka-GE')}.00</span>
                        <div className="text-[10px] text-text-muted font-data-mono-md">ვადა: {levanItem.overdueDays} დღე</div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                          Grade B
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          <span>დასადასტურებელი</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDebtor(levanItem);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isSelected ? 'text-primary bg-primary/15' : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                          }`}
                          title="დეტალები & გადახდების ისტორია"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })()
              )}

              {/* Row 1: გიორგი გიორგაძე */}
              {(() => {
                const giorgiItem = {
                  id: 'default-giorgi',
                  name: 'გიორგი გიორგაძე',
                  personalId: '01019012345',
                  entityType: 'PHYSICAL',
                  phone: '+995 599 12 34 56',
                  email: 'giorgi.g@gmail.com',
                  actualAddress: 'თბილისი, ვაჟა-ფშაველას გამზ. 25, ბინა 42',
                  legalAddress: 'თბილისი, ვაჟა-ფშაველას გამზ. 25, ბინა 42',
                  amount: 5000,
                  remainingAmount: 2200,
                  paidAmount: 2800,
                  rating: 'Grade B (ზომიერი რისკი)',
                  overdueDays: 45,
                  dueDate: '14 იან, 2025',
                  status: 'RESTRUCTURED',
                  agreementNumber: 'AGR-77142',
                };
                const isSelected = selectedDebtor?.personalId === giorgiItem.personalId;
                return (
                  <tr
                    key="row-giorgi"
                    onClick={() => handleSelectDebtor(giorgiItem)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{giorgiItem.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {giorgiItem.personalId} • {giorgiItem.agreementNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {giorgiItem.amount.toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-amber-600">₾ {giorgiItem.remainingAmount.toLocaleString('ka-GE')}.00</span>
                      <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: {giorgiItem.paidAmount.toLocaleString('ka-GE')}.00</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                        Grade B
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${getClaimStatusBadge('RESTRUCTURED', claimsData?.statusConfigs).badgeClass}`}>
                        {getClaimStatusBadge('RESTRUCTURED', claimsData?.statusConfigs).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(giorgiItem);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })()}

              {/* Row 2: ნინო აბაშიძე */}
              {(() => {
                const ninoItem = {
                  id: 'default-nino',
                  name: 'ნინო აბაშიძე',
                  personalId: '01024098765',
                  entityType: 'PHYSICAL',
                  amount: 18200,
                  remainingAmount: 18200,
                  paidAmount: 0,
                  rating: 'Grade C (მაღალი რისკი)',
                  overdueDays: 120,
                  phone: '+995 595 44 33 22',
                  email: 'nino.a@gmail.com',
                  actualAddress: 'ქ. თბილისი, რუსთაველის გამზ. 18',
                  legalAddress: 'ქ. თბილისი, რუსთაველის გამზ. 18',
                  status: 'IN_LITIGATION',
                  agreementNumber: 'AGR-99321',
                };
                const isSelected = selectedDebtor?.personalId === ninoItem.personalId;
                return (
                  <tr
                    key="row-nino"
                    onClick={() => handleSelectDebtor(ninoItem)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{ninoItem.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {ninoItem.personalId} • {ninoItem.agreementNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {ninoItem.amount.toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-rose-600">₾ {ninoItem.remainingAmount.toLocaleString('ka-GE')}.00</span>
                      <div className="text-[10px] text-text-muted font-data-mono-md">დაფარულია: 0.00</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/30">
                        Grade C
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${getClaimStatusBadge('IN_LITIGATION', claimsData?.statusConfigs).badgeClass}`}>
                        {getClaimStatusBadge('IN_LITIGATION', claimsData?.statusConfigs).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(ninoItem);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })()}

              {/* Row 3: შპს ალფა ლოჯისტიკსი */}
              {(() => {
                const alfaItem = {
                  id: 'default-alfa',
                  name: 'შპს ალფა ლოჯისტიკსი',
                  taxId: '405991823',
                  personalId: '405991823',
                  entityType: 'LEGAL',
                  amount: 42500,
                  remainingAmount: 12500,
                  paidAmount: 30000,
                  rating: 'Grade A (საიმედო)',
                  overdueDays: 15,
                  phone: '+995 591 88 77 66',
                  email: 'info@alfalogistics.ge',
                  actualAddress: 'ქ. თბილისი, აეროპორტის გზატკეცილი #4',
                  legalAddress: 'ქ. თბილისი, აეროპორტის გზატკეცილი #4',
                  directorFirstName: 'ნიკოლოზ',
                  directorLastName: 'სვანიძე',
                  directorPhone: '+995 591 88 77 66',
                  status: 'ACTIVE',
                  agreementNumber: 'AGR-44120',
                };
                const isSelected = selectedDebtor?.taxId === alfaItem.taxId;
                return (
                  <tr
                    key="row-alfa"
                    onClick={() => handleSelectDebtor(alfaItem)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{alfaItem.name}</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <span className="material-symbols-outlined text-[12px]">apartment</span>
                          <span>იურიდიული</span>
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted">ს/კ: {alfaItem.taxId} • {alfaItem.agreementNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {alfaItem.amount.toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-amber-600">₾ {alfaItem.remainingAmount.toLocaleString('ka-GE')}.00</span>
                      <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: {alfaItem.paidAmount.toLocaleString('ka-GE')}.00</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-mint/20 text-emerald-800 border border-accent-mint/40">
                        Grade A
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${getClaimStatusBadge('ACTIVE', claimsData?.statusConfigs).badgeClass}`}>
                        {getClaimStatusBadge('ACTIVE', claimsData?.statusConfigs).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(alfaItem);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })()}

              {/* Row 4: დავით კაპანაძე */}
              {(() => {
                const davitItem = {
                  id: 'default-davit',
                  name: 'დავით კაპანაძე',
                  personalId: '62001004321',
                  entityType: 'PHYSICAL',
                  amount: 4500,
                  remainingAmount: 0,
                  paidAmount: 4500,
                  rating: 'Grade A (საიმედო)',
                  overdueDays: 0,
                  phone: '+995 599 33 22 11',
                  email: 'davit.k@gmail.com',
                  actualAddress: 'ქ. ბათუმი, გორგილაძის ქ. 32',
                  legalAddress: 'ქ. ბათუმი, გორგილაძის ქ. 32',
                  status: 'SETTLED',
                  agreementNumber: 'AGR-11204',
                };
                const isSelected = selectedDebtor?.personalId === davitItem.personalId;
                return (
                  <tr
                    key="row-davit"
                    onClick={() => handleSelectDebtor(davitItem)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{davitItem.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {davitItem.personalId} • {davitItem.agreementNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {davitItem.amount.toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-emerald-700">₾ 0.00</span>
                      <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: {davitItem.paidAmount.toLocaleString('ka-GE')}.00</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-accent-mint/20 text-emerald-800 border border-accent-mint/40">
                        Grade A
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${getClaimStatusBadge('SETTLED', claimsData?.statusConfigs).badgeClass}`}>
                        {getClaimStatusBadge('SETTLED', claimsData?.statusConfigs).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(davitItem);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })()}

              {/* Row 5: მარიამ წიკლაური */}
              {(() => {
                const mariamItem = {
                  id: 'default-mariam',
                  name: 'მარიამ წიკლაური',
                  personalId: '01008022119',
                  entityType: 'PHYSICAL',
                  amount: 9800,
                  remainingAmount: 6300,
                  paidAmount: 3500,
                  rating: 'Grade B (ზომიერი რისკი)',
                  overdueDays: 55,
                  phone: '+995 577 66 55 44',
                  email: 'mariam.ts@gmail.com',
                  actualAddress: 'ქ. ქუთაისი, წერეთლის ქ. 12',
                  legalAddress: 'ქ. ქუთაისი, წერეთლის ქ. 12',
                  status: 'ACTIVE',
                  agreementNumber: 'AGR-55823',
                };
                const isSelected = selectedDebtor?.personalId === mariamItem.personalId;
                return (
                  <tr
                    key="row-mariam"
                    onClick={() => handleSelectDebtor(mariamItem)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-primary'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary flex items-center gap-1.5">
                        <span>{mariamItem.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-primary" title="შერჩეულია" />
                        )}
                      </div>
                      <div className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {mariamItem.personalId} • {mariamItem.agreementNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-data-mono-md font-semibold text-text-primary">
                      ₾ {mariamItem.amount.toLocaleString('ka-GE')}.00
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-data-mono-md font-bold text-amber-600">₾ {mariamItem.remainingAmount.toLocaleString('ka-GE')}.00</span>
                      <div className="text-[10px] text-emerald-700 font-data-mono-md">დაფარულია: {mariamItem.paidAmount.toLocaleString('ka-GE')}.00</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                        Grade B
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${getClaimStatusBadge('ACTIVE', claimsData?.statusConfigs).badgeClass}`}>
                        {getClaimStatusBadge('ACTIVE', claimsData?.statusConfigs).label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDebtor(mariamItem);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? 'text-primary bg-primary/15' : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                        }`}
                        title="დეტალები & გადახდების ისტორია"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
        {/* Table Pagination & Counter */}
        <div className="p-4 border-t border-border-subtle flex items-center justify-between text-body-sm text-text-muted">
          <span>ნაჩვენებია <strong>1-5</strong> / სულ <strong>24</strong> ჩანაწერი</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-[16px]" data-icon="chevron_left">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded bg-primary text-white font-semibold">1</button>
            <button className="px-3 py-1 rounded border border-border-subtle hover:bg-surface-bg">2</button>
            <button className="px-3 py-1 rounded border border-border-subtle hover:bg-surface-bg">3</button>
            <button className="px-2.5 py-1 rounded border border-border-subtle bg-surface-card hover:bg-surface-bg">
              <span className="material-symbols-outlined text-[16px]" data-icon="chevron_right">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
      {/* Right Column: Debtor Detail Card & Real-Time Settlement Ledger */}
      <div className="lg:col-span-5 bg-surface-card rounded-xl border border-border-subtle shadow-sm flex flex-col space-y-6 p-6">
        {/* Inspector Header: Identity & Contact Coordinates */}
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-headline-sm">
                {selectedDebtor?.name
                  ? selectedDebtor.name
                      .split(' ')
                      .filter(Boolean)
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join('')
                  : 'დბ'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-headline-sm font-headline-sm font-bold text-text-primary">
                    {selectedDebtor?.name || 'დებიტორი'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                    {selectedDebtor?.rating || 'Grade B (ზომიერი რისკი)'}
                  </span>
                </div>
                <div className="font-data-mono-md text-body-sm text-text-muted mt-0.5">
                  {selectedDebtor?.entityType === 'LEGAL' ? 'ს/კ' : 'პ/ნ'}: {selectedDebtor?.taxId || selectedDebtor?.personalId} (
                  {selectedDebtor?.entityType === 'LEGAL' ? 'იურიდიული პირი' : 'დებიტორი'})
                  {selectedDebtor?.agreementNumber && ` • ${selectedDebtor.agreementNumber}`}
                </div>
              </div>
            </div>
            {/* Detail Action Menu */}
            <button className="p-1 text-text-muted hover:text-text-primary rounded-lg" title="პარამეტრები">
              <span className="material-symbols-outlined text-[20px]" data-icon="more_vert">more_vert</span>
            </button>
          </div>
          {/* Contact & Domicile Details Grid */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-surface-bg rounded-lg border border-border-subtle text-body-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]" data-icon="call">call</span>
              <span className="font-data-mono-md text-text-primary">{selectedDebtor?.phone || '+995 599 00 00 00'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted text-[18px]" data-icon="calendar_month">calendar_month</span>
              <span className="text-text-muted">
                ვადა: <strong className="text-text-primary">{selectedDebtor?.dueDate || (selectedDebtor?.debtOriginationDate ? String(selectedDebtor.debtOriginationDate).split('T')[0] : '14 იან, 2025')}</strong>
                {selectedDebtor?.overdueDays !== undefined ? ` (${selectedDebtor.overdueDays} დღე)` : ''}
              </span>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <span className="material-symbols-outlined text-text-muted text-[18px] shrink-0" data-icon="location_on">location_on</span>
              <span className="text-text-muted truncate">
                {selectedDebtor?.actualAddress || selectedDebtor?.legalAddress || 'ქ. თბილისი'}
              </span>
            </div>
            {selectedDebtor?.entityType === 'LEGAL' && (selectedDebtor?.directorFirstName || selectedDebtor?.directorLastName) && (
              <div className="flex items-center gap-2 sm:col-span-2 pt-1 border-t border-border-subtle text-xs text-slate-700">
                <span className="material-symbols-outlined text-primary text-[16px]">badge</span>
                <span>
                  <strong>დირექტორი:</strong> {selectedDebtor.directorFirstName} {selectedDebtor.directorLastName}
                  {selectedDebtor.directorPhone && ` (ტელ: ${selectedDebtor.directorPhone})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Balance Dynamics & Progress Visualizer */}
        {(() => {
          const initAmount = Number(selectedDebtor?.amount || selectedDebtor?.initialAmount || 0);
          const remAmount = Number(selectedDebtor?.remainingAmount ?? initAmount);
          const paidAmount = Number(selectedDebtor?.paidAmount ?? Math.max(0, initAmount - remAmount));
          const paidPercent = initAmount > 0 ? Math.min(100, Math.round((paidAmount / initAmount) * 100)) : 0;

          return (
            <div className="p-4 rounded-xl bg-slate-50/80 border border-border-subtle space-y-3">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-text-muted font-medium">ვალის კლების დინამიკა</span>
                <span className="text-emerald-700 font-bold font-data-mono-md">{paidPercent}% დაფარულია</span>
              </div>
              {/* Visual Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-accent-mint h-2.5 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${paidPercent}%`, backgroundColor: '#0DFCC4' }}
                />
              </div>
              {/* Financial Breakdown Triplet */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                <div>
                  <div className="text-[11px] text-text-muted">მოთხოვნილი</div>
                  <div className="font-data-mono-md font-semibold text-text-primary text-[13px] mt-0.5">
                    ₾ {initAmount.toLocaleString('ka-GE')}.00
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted">გადახდილი</div>
                  <div className="font-data-mono-md font-bold text-emerald-600 text-[13px] mt-0.5">
                    ₾ {paidAmount.toLocaleString('ka-GE')}.00
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-text-muted">დარჩენილი</div>
                  <div className="font-data-mono-md font-bold text-amber-600 text-[13px] mt-0.5">
                    ₾ {remAmount.toLocaleString('ka-GE')}.00
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2.2 Payment Receipts & Pending Verifications */}
        {(() => {
          const debtorPending = pendingReceipts.filter(
            (pr) =>
              (selectedDebtor?.personalId && (pr as any).debtorPersonalId === selectedDebtor.personalId) ||
              (selectedDebtor?.name && pr.debtorName?.toLowerCase().includes(selectedDebtor.name.toLowerCase())) ||
              (selectedDebtor?.id && pr.claimId === selectedDebtor.id)
          );

          const debtorReceipts = receipts.filter(
            (r) =>
              (selectedDebtor?.personalId && (r as any).debtorPersonalId === selectedDebtor.personalId) ||
              (selectedDebtor?.name && r.debtorName?.toLowerCase().includes(selectedDebtor.name.toLowerCase())) ||
              (selectedDebtor?.id && r.claimId === selectedDebtor.id)
          );

          return (
            <div className="space-y-4 pt-1">
              {/* Real-time Notification Banner when debtor submits receipt */}
              {debtorPending.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-50/70 to-amber-500/10 border-2 border-dashed border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">notifications_active</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-body-md text-text-primary flex items-center gap-2">
                        <span>შეტყობინება გადახდის შესახებ</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold">
                          {debtorPending.length} ახალი ქვითარი
                        </span>
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        დებიტორმა განახორციელა თანხის შემოტანა და ატვირთა ქვითარი. გთხოვთ გადაამოწმოთ და დაადასტუროთ თანხის მიღება.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReceiptForConfirm(debtorPending[0])}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>მიღების დადასტურება</span>
                  </button>
                </div>
              )}

              {/* Pending Submissions Queue */}
              {debtorPending.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      დასადასტურებელი გადახდები (მოლოდინშია)
                    </span>
                    <span className="text-xs font-data-mono-md text-text-muted">
                      {debtorPending.length} განაცხადი
                    </span>
                  </div>
                  <div className="space-y-2">
                    {debtorPending.map((pr) => (
                      <div
                        key={pr.id}
                        className="p-3 rounded-lg bg-white border border-border-subtle hover:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-base">receipt</span>
                          </div>
                          <div>
                            <div className="text-body-sm font-semibold text-text-primary flex items-center gap-2">
                              <span>{pr.debtorName}</span>
                              <span className="font-data-mono-md font-bold text-emerald-700">+{Number(pr.amount).toLocaleString('ka-GE')} ₾</span>
                            </div>
                            <div className="text-[11px] text-text-muted font-data-mono-md">
                              #{pr.receiptNumber} • {new Date(pr.paymentDate).toLocaleDateString('ka-GE')} • {pr.debtorNotes || 'ქვითარი ატვირთულია'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => setSelectedReceiptForConfirm(pr)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>თანხის მიღების დადასტურება</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Payments Log */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <h4 className="font-semibold text-text-primary text-body-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary" data-icon="history">history</span>
                  გადახდების ქრონოლოგიური ისტორია &amp; დადასტურებები
                </h4>
                <span className="text-[11px] font-label-sm text-text-muted">
                  სულ {debtorReceipts.length || (selectedDebtor?.paidAmount > 0 ? 1 : 0)} ტრანზაქცია
                </span>
              </div>

              <div className="space-y-2.5">
                {debtorReceipts.length === 0 && (!selectedDebtor?.paidAmount || selectedDebtor.paidAmount === 0) ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                    <span className="material-symbols-outlined text-2xl text-slate-400">payments</span>
                    <div className="text-xs font-semibold text-slate-700">{selectedDebtor?.name} — გადახდების ისტორია ჯერ არ ფიქსირდება</div>
                    <div className="text-[11px] text-text-muted">
                      საწყისი დავალიანება (₾ {Number(selectedDebtor?.amount || 0).toLocaleString('ka-GE')}.00) სრულადაა დარჩენილი. დებიტორის მიერ გადახდის განხორციელებისას ჩანაწერი აქ ავტომატურად გამოჩნდება.
                    </div>
                  </div>
                ) : debtorReceipts.length > 0 ? (
                  debtorReceipts.map((r) => {
                    const isConfirmedCreditor = r.status === 'CONFIRMED_BY_CREDITOR';
                    const isConfirmedAccountant = r.status === 'CONFIRMED_BY_ACCOUNTANT';
                    const isPending = r.status === 'PENDING_CONFIRMATION';

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl bg-surface-card border border-border-subtle hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isConfirmedAccountant
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isPending ? 'schedule' : isConfirmedAccountant ? 'account_balance' : 'verified'}
                            </span>
                          </div>
                          <div>
                            <div className="text-body-sm font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                              <span>{r.debtorName}</span>
                              <span className="text-xs text-text-muted font-data-mono-md">
                                • {new Date(r.paymentDate).toLocaleDateString('ka-GE')}
                              </span>
                              <span className="text-xs text-text-muted font-data-mono-md">
                                • ტრანზაქცია #{r.receiptNumber}
                              </span>
                            </div>
                            <div className="text-xs mt-1">
                              {isPending && (
                                <span className="text-amber-700 font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  მოლოდინშია (დასადასტურებელია თქვენს ან ბუღალტრის მიერ)
                                </span>
                              )}
                              {isConfirmedCreditor && (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">check_circle</span>
                                  დადასტურებულია თქვენს (კრედიტორის) მიერ
                                </span>
                              )}
                              {isConfirmedAccountant && (
                                <span className="text-blue-700 font-medium flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">verified</span>
                                  დადასტურებულია ბუღალტრის მიერ (ბრძანება #{r.accountantOrderNumber || 'ACC-ORD'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <div className="font-data-mono-md font-bold text-emerald-600 text-body-sm">
                              +{Number(r.amount).toLocaleString('ka-GE')} ₾
                            </div>
                          </div>
                          {!isPending && (
                            <button
                              onClick={() => openOfficialDocument(r)}
                              className="px-2.5 py-1.5 rounded-lg border border-border-subtle hover:bg-slate-50 text-primary text-xs font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
                              type="button"
                              title={isConfirmedAccountant ? 'ბუღალტრის დასტურის ბრძანება (PDF)' : 'ქვითრის ჩამოტვირთვა'}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {isConfirmedAccountant ? 'picture_as_pdf' : 'download'}
                              </span>
                              <span className="hidden md:inline">
                                {isConfirmedAccountant ? 'ბრძანება (PDF)' : 'ქვითარი'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Fallback when debtor has recorded partial payment but no receipt entity */
                  <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <div>
                        <div className="text-body-sm font-semibold text-text-primary flex items-center gap-2 flex-wrap">
                          <span>{selectedDebtor?.name}</span>
                          <span className="text-xs text-text-muted font-data-mono-md">• {selectedDebtor?.dueDate || '12 იან, 2025'}</span>
                          <span className="text-xs text-text-muted font-data-mono-md">• ტრანზაქცია #{selectedDebtor?.agreementNumber || 'TX-8841'}</span>
                        </div>
                        <div className="text-xs mt-1 text-emerald-700 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          დადასტურებულია კრედიტორის მიერ
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-data-mono-md font-bold text-emerald-600 text-body-sm">
                        +₾ {Number(selectedDebtor?.paidAmount).toLocaleString('ka-GE')}.00
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Debtor Quick Interventions (SMS & Lawyer buttons removed as requested) */}
        <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-body-sm font-medium text-text-muted">ოპერატიული დოკუმენტები:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('სრული ამონაწერი (PDF) მომზადდა წარმატებით!')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-text-primary text-body-sm font-medium transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600" data-icon="picture_as_pdf">picture_as_pdf</span>
              <span>ამონაწერი PDF</span>
            </button>
            {pendingReceipts.length > 0 && (
              <button
                onClick={() => setSelectedReceiptForConfirm(pendingReceipts[0])}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-body-sm font-medium transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>თანხის მიღების დადასტურება</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </main>
  {/* Footer */}
  <footer className="bg-surface-card border-t border-border-subtle mt-12">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]" data-icon="account_balance">account_balance</span>
          </div>
          <span className="text-headline-sm font-headline-sm font-bold text-primary">Debitinfo.GE</span>
        </div>
        <nav className="flex flex-wrap items-center gap-6">
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">კონფიდენციალურობის პოლიტიკა</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">მომსახურების პირობები</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">რეკვიზიტები</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">საგადასახადო შემოწმება</a>
          <a className="text-text-muted text-body-sm font-body-sm hover:text-primary transition-colors duration-150 hover:underline" href="#">საკონტაქტო პირი</a>
        </nav>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-text-muted">
        <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-3 text-label-sm font-label-sm">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="material-symbols-outlined text-[14px]" data-icon="lock">lock</span> SSL 256-Bit Secure
          </span>
          <span>•</span>
          <span>Tbilisi, Georgia</span>
        </div>
      </div>
    </div>
  </footer>

  {/* ================= Creditor Payment Confirmation Modal ================= */}
  {selectedReceiptForConfirm && (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 border border-border-subtle shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-emerald-700">
            <span className="material-symbols-outlined text-2xl">verified</span>
            <h3 className="font-bold text-headline-sm text-text-primary">თანხის მიღების დადასტურება</h3>
          </div>
          <button
            onClick={() => {
              setSelectedReceiptForConfirm(null);
              setConfirmFile('');
            }}
            className="p-1 rounded-lg hover:bg-slate-100 text-text-muted cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {confirmSuccess ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <h4 className="font-bold text-text-primary">გადახდა წარმატებით დადასტურდა!</h4>
            <p className="text-body-sm text-text-muted">მონაცემები განახლდა დებიტორის, კრედიტორისა და ბუღალტრის ერთიან რეესტრში.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-body-sm text-text-muted">
              გადაამოწმეთ დებიტორის მიერ გადმორიცხული თანხა და ატვირთეთ თქვენი დადასტურების ქვითარი ან საბანკო ამონაწერი.
            </p>

            {/* Debtor Submission Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border-subtle space-y-2 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">დებიტორი:</span>
                <span className="font-semibold text-text-primary">{selectedReceiptForConfirm.debtorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">გადახდილი თანხა:</span>
                <span className="font-bold font-data-mono-md text-emerald-700 text-body-md">
                  +{Number(selectedReceiptForConfirm.amount).toLocaleString('ka-GE')} ₾
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">თარიღი &amp; ქვითარი:</span>
                <span className="font-data-mono-md text-text-primary">
                  #{selectedReceiptForConfirm.receiptNumber} • {new Date(selectedReceiptForConfirm.paymentDate).toLocaleDateString('ka-GE')}
                </span>
              </div>
              {selectedReceiptForConfirm.debtorNotes && (
                <div className="pt-1 text-xs text-text-muted italic border-t border-slate-200">
                  „{selectedReceiptForConfirm.debtorNotes}“
                </div>
              )}
            </div>

            {/* Confirmation proof upload */}
            <div className="space-y-1.5">
              <label className="block text-body-sm font-semibold text-text-primary">
                დადასტურების ქვითარი / საბანკო ამონაწერი (PDF, JPG)
              </label>
              <div className="border-2 border-dashed border-border-subtle hover:border-emerald-500 rounded-xl p-3 text-center bg-white cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setConfirmFile(file.name);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-xl text-emerald-600">upload_file</span>
                  <span className="text-xs font-medium text-text-primary">
                    {confirmFile ? `არჩეულია: ${confirmFile}` : 'დააჭირეთ ან ჩააგდეთ დადასტურების ფაილი'}
                  </span>
                  <span className="text-[10px] text-text-muted">საბანკო ამონაწერი ან ჩარიცხვის სქრინშოტი</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
              <button
                onClick={() => {
                  setSelectedReceiptForConfirm(null);
                  setConfirmFile('');
                }}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-primary hover:bg-slate-50 text-body-sm font-medium transition-colors cursor-pointer"
                type="button"
              >
                გაუქმება
              </button>
              <button
                onClick={handleConfirmByCreditor}
                disabled={confirming}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-body-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                type="button"
              >
                {confirming ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>მოწმდება...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>თანხის მიღების დადასტურება</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Add Debtor Modal (Manual Addition for Creditor - Exactly matching Excel Template) */}
  {isAddDebtorModalOpen && (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAddDebtorModalOpen(false)}
      />
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-border-subtle z-10 space-y-4 text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">person_add</span>
            </div>
            <div>
              <h3 className="font-bold text-headline-sm text-text-primary">ახალი დებიტორის დამატება რეესტრში</h3>
              <p className="text-xs text-text-muted">ველები ზუსტად ემთხვევა იმპორტის Excel შაბლონს (გადაეცემა RS.GE გადამოწმებისთვის)</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddDebtorModalOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Entity Type Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setNewDebtorEntityType('LEGAL')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              newDebtorEntityType === 'LEGAL'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">apartment</span>
            <span>იურიდიული პირი (LEGAL • 13 ველი)</span>
          </button>
          <button
            type="button"
            onClick={() => setNewDebtorEntityType('PHYSICAL')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              newDebtorEntityType === 'PHYSICAL'
                ? 'bg-[#0F172A] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>ფიზიკური პირი (PHYSICAL • 9 ველი)</span>
          </button>
        </div>

        <form onSubmit={handleCreateDebtorManually} className="space-y-4">
          {newDebtorEntityType === 'LEGAL' ? (
            /* ========================================================= */
            /* LEGAL ENTITY FORM (13 FIELDS)                             */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    1. საიდენტიფიკაციო კოდი (ს/კ 9 ნიშნა) <span className="text-rating-c">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ. 405118492"
                    value={newDebtorForm.taxId}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, taxId: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    2. სრული დასახელება <span className="text-rating-c">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ. შპს კავკასუს ტრანს სერვისი"
                    value={newDebtorForm.name}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    3. ტელეფონი <span className="text-rating-c">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+995 591 442299"
                    value={newDebtorForm.phone}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    4. ელ-ფოსტა
                  </label>
                  <input
                    type="email"
                    placeholder="info@cts-georgia.ge"
                    value={newDebtorForm.email}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    5. იურიდიული მისამართი
                  </label>
                  <input
                    type="text"
                    placeholder="ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა"
                    value={newDebtorForm.legalAddress}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, legalAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-primary">6. ფაქტობრივი მისამართი</label>
                    <label className="inline-flex items-center gap-1 cursor-pointer text-[11px] text-primary">
                      <input
                        type="checkbox"
                        checked={newDebtorActualMatchesLegal}
                        onChange={(e) => setNewDebtorActualMatchesLegal(e.target.checked)}
                        className="rounded border-slate-300 w-3 h-3 text-primary"
                      />
                      <span>ემთხვევა იურიდიულს</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="ქ. თბილისი, ალ. ყაზბეგის გამზ. #24ა"
                    disabled={newDebtorActualMatchesLegal}
                    value={newDebtorActualMatchesLegal ? newDebtorForm.legalAddress : newDebtorForm.actualAddress}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, actualAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    7. საწყისი დავალიანება (GEL) <span className="text-rating-c">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="48500.00"
                    value={newDebtorForm.amount}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">
                    8. ვალის წარმოქმნის თარიღი
                  </label>
                  <input
                    type="date"
                    value={newDebtorForm.debtOriginationDate}
                    onChange={(e) => setNewDebtorForm({ ...newDebtorForm, debtOriginationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                </div>
              </div>

              {/* Sub-card: Director Details (Fields 9 to 13) */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-1 border-b border-slate-200">
                  <span className="material-symbols-outlined text-sm text-primary">badge</span>
                  <span>დირექტორის მონაცემები (ველები 9 - 13)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      9. დირექტორის სახელი
                    </label>
                    <input
                      type="text"
                      placeholder="დავით"
                      value={newDebtorForm.directorFirstName}
                      onChange={(e) => setNewDebtorForm({ ...newDebtorForm, directorFirstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      10. დირექტორის გვარი
                    </label>
                    <input
                      type="text"
                      placeholder="კაპანაძე"
                      value={newDebtorForm.directorLastName}
                      onChange={(e) => setNewDebtorForm({ ...newDebtorForm, directorLastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      11. დირექტორის პირადი ნომერი (არასავალდებულო)
                    </label>
                    <input
                      type="text"
                      placeholder="01019045812 (11 ნიშნა)"
                      value={newDebtorForm.directorPersonalId}
                      onChange={(e) => setNewDebtorForm({ ...newDebtorForm, directorPersonalId: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      12. დირექტორის ემაილი
                    </label>
                    <input
                      type="email"
                      placeholder="davit.k@cts-georgia.ge"
                      value={newDebtorForm.directorEmail}
                      onChange={(e) => setNewDebtorForm({ ...newDebtorForm, directorEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-text-primary mb-1">
                      13. დირექტორის ტელეფონის ნომერი
                    </label>
                    <input
                      type="tel"
                      placeholder="+995 599 114477"
                      value={newDebtorForm.directorPhone}
                      onChange={(e) => setNewDebtorForm({ ...newDebtorForm, directorPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* PHYSICAL PERSON FORM (9 FIELDS)                           */
            /* ========================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  1. პირადი ნომერი (პ/ნ 11 ნიშნა) <span className="text-rating-c">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="01024089123"
                  value={newDebtorForm.personalId}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, personalId: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  2. სახელი <span className="text-rating-c">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="დავით"
                  value={newDebtorForm.firstName}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  3. გვარი <span className="text-rating-c">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="კვირიკაშვილი"
                  value={newDebtorForm.lastName}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  4. ტელეფონი <span className="text-rating-c">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+995 599 112233"
                  value={newDebtorForm.phone}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  5. ელ-ფოსტა
                </label>
                <input
                  type="email"
                  placeholder="davit.k@gmail.com"
                  value={newDebtorForm.email}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  6. იურიდიული მისამართი
                </label>
                <input
                  type="text"
                  placeholder="ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12"
                  value={newDebtorForm.legalAddress}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, legalAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-text-primary">7. ფაქტობრივი მისამართი</label>
                  <label className="inline-flex items-center gap-1 cursor-pointer text-[11px] text-primary">
                    <input
                      type="checkbox"
                      checked={newDebtorActualMatchesLegal}
                      onChange={(e) => setNewDebtorActualMatchesLegal(e.target.checked)}
                      className="rounded border-slate-300 w-3 h-3 text-primary"
                    />
                    <span>ემთხვევა იურიდიულს</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="ქ. თბილისი, ვაჟა-ფშაველას გამზ. #12"
                  disabled={newDebtorActualMatchesLegal}
                  value={newDebtorActualMatchesLegal ? newDebtorForm.legalAddress : newDebtorForm.actualAddress}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, actualAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs disabled:bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  8. საწყისი დავალიანება (GEL) <span className="text-rating-c">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="3200.00"
                  value={newDebtorForm.amount}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  9. ვალის წარმოქმნის თარიღი
                </label>
                <input
                  type="date"
                  value={newDebtorForm.debtOriginationDate}
                  onChange={(e) => setNewDebtorForm({ ...newDebtorForm, debtOriginationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-base">info</span>
            <span>დებიტორის წარდგენის შემდეგ მონაცემები გადაეცემა ანალიტიკოსს RS.GE გადამოწმებისთვის (სტატუსი: დასადასტურებელი).</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setIsAddDebtorModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-[#0A37CA] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>დებიტორის წარდგენა რეესტრში</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
    </div>
  );
}
