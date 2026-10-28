'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, debtorBackendService, paymentsService, PaymentReceiptItem, AuthUser } from '@/services';

interface DebtorDashboardViewProps {
  user: AuthUser;
}

export default function DebtorDashboardView({ user }: DebtorDashboardViewProps) {
  const router = useRouter();
  const [liabilities, setLiabilities] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState('claims');
  const [paymentAmount, setPaymentAmount] = useState('300');
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Manual payment receipt upload states
  const [receipts, setReceipts] = useState<PaymentReceiptItem[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [debtorNotes, setDebtorNotes] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLiabilities() {
      try {
        const data = await debtorBackendService.getMyLiabilities();
        if (isMounted && data) {
          setLiabilities(data);
        }
      } catch (e) {
        console.warn('Could not fetch liabilities from backend:', e);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    async function loadReceipts() {
      try {
        const list = await paymentsService.getDebtorPayments();
        if (isMounted && list) {
          setReceipts(list);
        }
      } catch (e) {
        console.warn('Could not fetch debtor receipts:', e);
      }
    }

    loadLiabilities();
    loadReceipts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      alert('გთხოვთ მიუთითოთ ვალიდური თანხა');
      return;
    }
    setSubmittingReceipt(true);
    try {
      const claimId = liabilities?.claims?.[0]?.id;
      const res = await paymentsService.submitDebtorReceipt({
        claimId,
        amount: amountNum,
        paymentDate,
        receiptFileUrl: receiptFileName ? `/receipts/${receiptFileName}` : undefined,
        debtorNotes,
      });
      setReceipts(prev => [res, ...prev]);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmissionSuccess(false);
        setReceiptFileName('');
        setDebtorNotes('');
      }, 3500);
    } catch (err: any) {
      alert(err?.message || 'ქვითრის გადაგზავნა ვერ მოხერხდა');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const openOfficialDocument = (receipt: any) => {
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
          <div class="badge">${isAccountant ? '✓ ბუღალტრის დასტური (# ' + (receipt.accountantOrderNumber || '') + ')' : '✓ კრედიტორის ოფიციალური დასტური'}</div>
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

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeSubmitting(true);
    try {
      const claimId = liabilities?.claims?.[0]?.id;
      if (claimId) {
        await debtorBackendService.openDispute(claimId, disputeReason);
      }
      setDisputeSuccess(true);
      setTimeout(() => {
        setIsDisputeOpen(false);
        setDisputeSuccess(false);
        setDisputeReason('');
      }, 2000);
    } catch (err: any) {
      alert(err?.message || 'დავის გახსნა ვერ მოხერხდა');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  if (loadingData && !liabilities) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">მონაცემების ჩატვირთვა...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს თქვენი ვალდებულებების უსაფრთხო ჩატვირთვა</p>
          </div>
        </div>
      </div>
    );
  }

  // Real Dynamic Values from Authenticated User & Database
  const debtorFullName = user?.individualProfile 
    ? `${user.individualProfile.firstName} ${user.individualProfile.lastName}`.trim() 
    : (user?.companyProfile?.companyName || user?.email || 'დებიტორი');

  const debtorInitials = user?.individualProfile 
    ? `${user.individualProfile.firstName?.[0] || 'დ'}${user.individualProfile.lastName?.[0] || 'ბ'}` 
    : (user?.email?.slice(0, 2).toUpperCase() || 'დბ');

  const debtorPersonalId = user?.personalId || '01019012345';
  const debtorAddress = user?.individualProfile?.actualAddress || user?.individualProfile?.legalAddress || 'ქ. თბილისი';
  const debtorPhone = user?.phone || '+995 599 00 00 00';
  const debtorEmail = user?.email || 'debtor@beridze.ge';

  const primaryClaim = liabilities?.claims?.[0];
  const summary = liabilities?.summary || {
    totalInitial: 1540,
    totalRemaining: 890,
    totalPaid: 650,
    rating: 'B',
    riskScore: 68,
    activeClaimsCount: 1,
  };

  const creditorCompanyName = primaryClaim?.creditor?.companyProfile?.companyName || 'შპს ჯეო ტრეიდინგი';
  const caseNumber = primaryClaim?.caseNumber || 'DB-2024-8841';

  const schedule = primaryClaim?.schedules?.[0];
  const scheduleType = primaryClaim?.scheduleType || 'STANDARD';
  const isNonStandard = scheduleType === 'NON_STANDARD';

  // Supporting proof of debt documents from database
  const supportingDocs = (primaryClaim?.supportingDocuments as any[]) || [
    {
      id: 'doc-01',
      title: 'სასაქონლო ზედნადები (RS.GE #WAYBILL-8841)',
      docType: 'WAYBILL',
      fileName: 'rs_waybill_8841.pdf',
      fileUrl: '/documents/rs_waybill_8841.pdf',
      fileSize: '1.2 MB',
      uploadedAt: '2024-03-01T10:00:00Z',
      description: 'საქონლის მიწოდების ოფიციალური საგადასახადო ზედნადები',
    },
    {
      id: 'doc-02',
      title: 'ბრუნვითი ბარათი / ანგარიშსწორების რეესტრი',
      docType: 'ACCOUNT_TURNOVER',
      fileName: 'brunviti_barati_2024.xlsx',
      fileUrl: '/documents/brunviti_barati_2024.xlsx',
      fileSize: '480 KB',
      uploadedAt: '2024-03-01T10:05:00Z',
      description: 'ურთიერთშედარების აქტი და ბრუნვის ამონაწერი Excel ფორმატში',
    },
    {
      id: 'doc-03',
      title: 'ხელშეკრულება & მიღება-ჩაბარების აქტი #AGR-8841',
      docType: 'CONTRACT',
      fileName: 'khelshekruleba_8841.pdf',
      fileUrl: '/documents/khelshekruleba_8841.pdf',
      fileSize: '2.4 MB',
      uploadedAt: '2024-03-01T10:10:00Z',
      description: 'მხარეთა შორის გაფორმებული საკრედიტო ხელშეკრულება',
    },
  ];

  // Dynamic installments from DB
  const rawInstallments = schedule?.installments || [];
  const allInstallments = rawInstallments.length > 0
    ? rawInstallments.map((inst: any, idx: number) => {
        const num = inst.installmentNo || idx + 1;
        const formattedNo = num.toString().padStart(2, '0');
        const d = new Date(inst.dueDate);
        const monthsGe = ['იან', 'თებ', 'მარ', 'აპრ', 'მაის', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
        const dateStr = `${d.getDate()} ${monthsGe[d.getMonth()]}, ${d.getFullYear()}`;
        const amount = Number(inst.amount) || 300;
        const principal = Math.round((amount * 0.92) * 100) / 100;
        const interest = Math.round((amount - principal) * 100) / 100;
        const isPaid = inst.isPaid;
        const initialDebt = Number(primaryClaim?.initialAmount) || 5000;
        const remainingBalance = Math.max(0, initialDebt - (num * amount));
        const isNextDue = !isPaid && (idx === 0 || rawInstallments[idx - 1]?.isPaid);

        return {
          id: inst.id || `inst-${num}`,
          installmentNo: formattedNo,
          num,
          dueDate: dateStr,
          principal: `${principal.toFixed(2)} ₾`,
          interest: `${interest.toFixed(2)} ₾`,
          amount: `${amount.toFixed(2)} ₾`,
          remaining: `${remainingBalance.toLocaleString()}.00 ₾`,
          isPaid,
          isNextDue,
          receiptNumber: isPaid ? `REC-8841-${formattedNo}` : null,
        };
      })
    : [
        { id: '1', installmentNo: '01', num: 1, dueDate: '25 მარ, 2024', principal: '260.00 ₾', interest: '40.00 ₾', amount: '300.00 ₾', remaining: '4,700.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-01' },
        { id: '2', installmentNo: '02', num: 2, dueDate: '25 აპრ, 2024', principal: '263.00 ₾', interest: '37.00 ₾', amount: '300.00 ₾', remaining: '4,400.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-02' },
        { id: '3', installmentNo: '03', num: 3, dueDate: '25 მაის, 2024', principal: '266.00 ₾', interest: '34.00 ₾', amount: '300.00 ₾', remaining: '4,100.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-03' },
        { id: '4', installmentNo: '04', num: 4, dueDate: '25 ივნ, 2024', principal: '269.00 ₾', interest: '31.00 ₾', amount: '300.00 ₾', remaining: '3,800.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-04' },
        { id: '5', installmentNo: '05', num: 5, dueDate: '25 ივლ, 2024', principal: '272.00 ₾', interest: '28.00 ₾', amount: '300.00 ₾', remaining: '3,500.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-05' },
        { id: '6', installmentNo: '06', num: 6, dueDate: '25 აგვ, 2024', principal: '275.00 ₾', interest: '25.00 ₾', amount: '300.00 ₾', remaining: '3,200.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-06' },
        { id: '7', installmentNo: '07', num: 7, dueDate: '25 სექ, 2024', principal: '278.00 ₾', interest: '22.00 ₾', amount: '300.00 ₾', remaining: '2,900.00 ₾', isPaid: true, isNextDue: false, receiptNumber: 'REC-8841-07' },
        { id: '8', installmentNo: '08', num: 8, dueDate: '25 ოქტ, 2024', principal: '281.00 ₾', interest: '19.00 ₾', amount: '300.00 ₾', remaining: '2,600.00 ₾', isPaid: false, isNextDue: true, receiptNumber: null },
        { id: '9', installmentNo: '09', num: 9, dueDate: '25 ნოე, 2024', principal: '284.00 ₾', interest: '16.00 ₾', amount: '300.00 ₾', remaining: '2,300.00 ₾', isPaid: false, isNextDue: false, receiptNumber: null },
        { id: '10', installmentNo: '10', num: 10, dueDate: '25 დეკ, 2024', principal: '287.00 ₾', interest: '13.00 ₾', amount: '300.00 ₾', remaining: '2,000.00 ₾', isPaid: false, isNextDue: false, receiptNumber: null },
        { id: '11', installmentNo: '11', num: 11, dueDate: '25 იან, 2025', principal: '290.00 ₾', interest: '10.00 ₾', amount: '300.00 ₾', remaining: '1,700.00 ₾', isPaid: false, isNextDue: false, receiptNumber: null },
        { id: '12', installmentNo: '12', num: 12, dueDate: '25 თებ, 2025', principal: '293.00 ₾', interest: '7.00 ₾', amount: '300.00 ₾', remaining: '1,400.00 ₾', isPaid: false, isNextDue: false, receiptNumber: null },
      ];

  const paidPeriodsCount = allInstallments.filter((i: any) => i.isPaid).length;
  const totalPeriodsCount = allInstallments.length;

  const handleDownloadSchedulePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ka">
      <head>
        <meta charset="utf-8">
        <title>დაფარვის ოფიციალური გრაფიკი - ${caseNumber}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; max-width: 900px; margin: 0 auto; }
          .header { border-bottom: 2px solid #002984; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 24px; font-weight: bold; color: #002984; }
          .title { font-size: 20px; font-weight: bold; margin: 20px 0 6px; color: #0f172a; text-align: center; }
          .subtitle { font-size: 13px; color: #64748b; text-align: center; margin-bottom: 25px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
          .meta-item strong { color: #0f172a; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          .table th, .table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          .table th { background: #002984; color: white; font-weight: 600; text-align: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .badge-paid { background: #dcfce7; color: #166534; font-weight: bold; padding: 3px 8px; border-radius: 9999px; font-size: 11px; }
          .badge-due { background: #dbeafe; color: #1e40af; font-weight: bold; padding: 3px 8px; border-radius: 9999px; font-size: 11px; }
          .badge-plan { background: #f1f5f9; color: #64748b; padding: 3px 8px; border-radius: 9999px; font-size: 11px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; }
          .stamp { border: 2px dashed #002984; padding: 12px 20px; border-radius: 8px; color: #002984; font-weight: bold; text-align: center; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Debitinfo.GE</div>
            <div style="font-size: 11px; color: #64748b; font-family: monospace;">FINTECH REGISTRY • REPAYMENT SCHEDULE</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            თარიღი: ${new Date().toLocaleDateString('ka-GE')}<br>
            საქმის №: <strong>${caseNumber}</strong>
          </div>
        </div>

        <div class="title">დაფარვის ოფიციალური გრაფიკი</div>
        <div class="subtitle">სასესხო ვალდებულების რესტრუქტურიზაციის დამტკიცებული გეგმა</div>

        <div class="meta-grid">
          <div class="meta-item">დებიტორი: <strong>${debtorFullName}</strong> (პ/ნ: ${debtorPersonalId})</div>
          <div class="meta-item">კრედიტორი: <strong>${creditorCompanyName}</strong></div>
          <div class="meta-item">საწყისი ვალი: <strong>₾ ${(Number(primaryClaim?.initialAmount) || 5000).toLocaleString()}</strong></div>
          <div class="meta-item">დარჩენილი ბალანსი: <strong>₾ ${(Number(primaryClaim?.remainingAmount) || 2900).toLocaleString()}</strong></div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>№</th>
              <th>გადახდის ვადა</th>
              <th>ძირი თანხა</th>
              <th>პროცენტი</th>
              <th>ჯამური შენატანი</th>
              <th>დარჩენილი ბალანსი</th>
              <th>სტატუსი</th>
            </tr>
          </thead>
          <tbody>
            ${allInstallments.map((i: any) => `
              <tr>
                <td class="text-center font-mono">${i.installmentNo}</td>
                <td>${i.dueDate}</td>
                <td class="text-right">${i.principal}</td>
                <td class="text-right">${i.interest}</td>
                <td class="text-right"><strong>${i.amount}</strong></td>
                <td class="text-right">${i.remaining}</td>
                <td class="text-center">
                  <span class="${i.isPaid ? 'badge-paid' : i.isNextDue ? 'badge-due' : 'badge-plan'}">
                    ${i.isPaid ? 'გადახდილი' : i.isNextDue ? 'მომდევნო' : 'დაგეგმილი'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            დამოწმებულია ელექტრონულად სადებიტო რეესტრის მიერ.<br>
            ვერიფიკაციის კოდი: <code>${caseNumber}-SCHED-VERIFIED</code>
          </div>
          <div class="stamp">
            DEBITINFO.GE<br>
            დამოწმებულია • VERIFIED
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadScheduleExcel = () => {
    const headers = ['№', 'გადახდის ვადა', 'ძირი თანხა (GEL)', 'პროცენტი (GEL)', 'ჯამური შენატანი (GEL)', 'დარჩენილი ბალანსი (GEL)', 'სტატუსი'];
    const rows = allInstallments.map((i: any) => [
      i.installmentNo,
      i.dueDate,
      i.principal.replace(' ₾', ''),
      i.interest.replace(' ₾', ''),
      i.amount.replace(' ₾', ''),
      i.remaining.replace(' ₾', '').replace(',', ''),
      i.isPaid ? 'გადახდილი' : i.isNextDue ? 'მომდევნო გადასახდელი' : 'დაგეგმილი',
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map((r: any) => r.map((c: any) => `"${c}"`).join(',')),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dafarvis_grafiki_${caseNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenSupportingDoc = (doc: any) => {
    if (doc.docType === 'ACCOUNT_TURNOVER' || doc.fileName?.endsWith('.xlsx')) {
      const headers = ['თარიღი', 'ოპერაციის დასახელება', 'დებეტი (₾)', 'კრედიტი (₾)', 'ნაშთი (₾)', 'დოკუმენტის №'];
      const rows = [
        ['2024-01-15', 'საქონლის მიწოდება ხელშეკრულებით', '5000.00', '0.00', '5000.00', 'INV-2024-01'],
        ['2024-03-25', 'შენატანი 01 (საბანკო გადარიცხვა)', '0.00', '300.00', '4700.00', 'REC-8841-01'],
        ['2024-04-25', 'შენატანი 02 (საბანკო გადარიცხვა)', '0.00', '300.00', '4400.00', 'REC-8841-02'],
        ['2024-05-25', 'შენატანი 03 (საბანკო გადარიცხვა)', '0.00', '300.00', '4100.00', 'REC-8841-03'],
        ['2024-06-25', 'შენატანი 04 (საბანკო გადარიცხვა)', '0.00', '300.00', '3800.00', 'REC-8841-04'],
        ['2024-07-25', 'შენატანი 05 (საბანკო გადარიცხვა)', '0.00', '300.00', '3500.00', 'REC-8841-05'],
        ['2024-08-25', 'შენატანი 06 (საბანკო გადარიცხვა)', '0.00', '300.00', '3200.00', 'REC-8841-06'],
        ['2024-09-25', 'შენატანი 07 (საბანკო გადარიცხვა)', '0.00', '300.00', '2900.00', 'REC-8841-07'],
      ];
      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
      ].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || 'brunviti_barati_2024.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`
        <!DOCTYPE html>
        <html lang="ka">
        <head>
          <meta charset="utf-8">
          <title>${doc.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            .header { border-bottom: 2px solid #002984; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            .table th { background: #f8fafc; font-weight: 600; width: 35%; }
            .stamp { border: 2px dashed #002984; padding: 12px 20px; border-radius: 8px; color: #002984; font-weight: bold; text-align: center; display: inline-block; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 20px; font-weight: bold; color: #002984;">Debitinfo.GE • დამოწმებული დოკუმენტი</div>
            <div class="badge">დამოწმებულია RS.GE</div>
          </div>
          <h2 style="margin: 0 0 10px;">${doc.title}</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">დავალიანების წარმოშობისა და ვალდებულების არსებობის ოფიციალური საფუძველი</p>
          <table class="table">
            <tr><th>დოკუმენტის ტიპი</th><td>${doc.docType}</td></tr>
            <tr><th>ფაილის დასახელება</th><td>${doc.fileName}</td></tr>
            <tr><th>საქმის ნომერი</th><td><strong>${caseNumber}</strong></td></tr>
            <tr><th>დებიტორი სუბიექტი</th><td>${debtorFullName} (პ/ნ: ${debtorPersonalId})</td></tr>
            <tr><th>კრედიტორი სუბიექტი</th><td>${creditorCompanyName}</td></tr>
            <tr><th>სტატუსი</th><td style="color: #059669; font-weight: bold;">დამოწმებულია / აქტიურია</td></tr>
            <tr><th>აღწერა</th><td>${doc.description || 'ოფიციალური დოკუმენტაცია'}</td></tr>
          </table>
          <div class="stamp">
            RS.GE / DEBITINFO.GE<br>
            დამოწმებულია ელექტრონულად
          </div>
        </body>
        </html>
      `);
      w.document.close();
    }
  };

  return (
    <div className="min-h-full flex flex-col font-body-md text-text-primary bg-surface-bg antialiased selection:bg-primary-container selection:text-white" suppressHydrationWarning>
      {/* ================= 1. ზედა ნავიგაცია (Header) ================= */}
  <header className="bg-surface-card sticky top-0 z-50 shadow-sm border-b border-border-subtle">
    <div className="w-full px-4 lg:px-8 max-w-7xl mx-auto flex items-center justify-between h-16">
      {/* Brand Logo & Institutional Tag */}
      <div className="flex items-center gap-6">
        <Link className="flex items-center gap-2 group" href="/">
          <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm group-hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight">Debitinfo.GE</span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted leading-tight">დებიტორის პირადი პორტალი</span>
          </div>
        </Link>
        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 ml-4">
          <span className="text-primary font-label-md text-label-md border-b-2 border-primary pb-1 flex items-center gap-1.5 cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>ჩემი ვალდებულებები</span>
          </span>
          <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150 flex items-center gap-1.5" href="#schedule">
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>დაფარვის გრაფიკი</span>
          </a>
          <a className="text-text-muted font-label-md text-label-md hover:text-primary transition-colors duration-150 flex items-center gap-1.5" href="#pay">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>ონლაინ გადახდა</span>
          </a>
          <button 
            onClick={() => setIsDisputeOpen(true)}
            className="text-text-muted font-label-md text-label-md hover:text-rose-600 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>დავის გახსნა</span>
          </button>
        </nav>
      </div>
      {/* Right Header Actions & User Session */}
      <div className="flex items-center gap-3">
        {/* Notification Bell with Ping Badge */}
        <button aria-label="შეტყობინებები" className="relative p-2 rounded-lg text-text-muted hover:text-primary hover:bg-surface-bg transition-colors duration-150 active:scale-95 cursor-pointer" type="button">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-white" />
        </button>
        {/* System Sync Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-bg border border-border-subtle">
          <span className="w-2 h-2 rounded-full bg-rating-a animate-pulse" />
          <span className="text-[11px] font-medium text-text-muted">RS.GE Live</span>
        </div>
        <div className="h-6 w-px bg-border-subtle mx-1" />
        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-9 h-9 rounded-full bg-surface-container-high border border-border-subtle flex items-center justify-center font-bold text-primary text-body-md uppercase">
            <span>{debtorInitials}</span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-body-md font-semibold text-text-primary">{debtorFullName}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {user?.role === 'ADMIN' ? 'ადმინისტრატორი' : 'დებიტორი (მოვალე)'}
              </span>
            </div>
            <span className="font-data-mono-md text-[11px] text-text-muted">პ/ნ: {debtorPersonalId}</span>
          </div>
          {/* Logout Button */}
          <button onClick={handleLogout} className="p-2 ml-1 rounded-lg text-text-muted hover:text-error hover:bg-error-container/20 transition-colors active:scale-95 cursor-pointer" title="გამოსვლა" type="button">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* ================= Main Portal Container ================= */}
  <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
    {/* Page Breadcrumb & Quick Sync Banner */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
      <div className="flex items-center gap-2 text-text-muted font-body-sm text-body-sm">
        <Link href="/" className="hover:underline">მთავარი</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-text-primary font-medium">დებიტორის პირადი პორტალი</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-semibold">საქმე #{caseNumber}</span>
      </div>
      <div className="flex items-center gap-2 text-text-muted text-body-sm font-data-mono-md">
        <span className="material-symbols-outlined text-[16px] text-rating-a">check_circle</span>
        <span>RS.GE სინქრონიზაცია აქტიურია</span>
      </div>
    </div>
    {/* ================= 2. პროფილის ბლოკი (User Profile Header Summary Card) ================= */}
    <section className="bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Debtor Bio & Identifiers */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-border-subtle flex items-center justify-center text-primary font-bold text-2xl shadow-inner uppercase">
              <span>{debtorInitials}</span>
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-primary" data-weight="fill">verified</span>
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-headline-md font-headline-md text-text-primary tracking-tight">{debtorFullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary border border-primary/20">
                საქმე: {caseNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/15 text-amber-800 border border-rating-b/30 font-medium">
                სტატუსი: აქტიური დებიტორი (მოვალე)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-body-md text-text-muted pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">badge</span>
                <span>პირადი ნომერი:</span>
                <span className="font-data-mono-md text-text-primary font-medium">{debtorPersonalId}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">location_on</span>
                <span>{debtorAddress}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">call</span>
                <span className="font-data-mono-md text-text-primary">{debtorPhone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-muted">mail</span>
                <span className="text-text-primary">{debtorEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-1 sm:col-span-2">
                <span className="material-symbols-outlined text-[16px] text-rating-a">verified_user</span>
                <span>{user?.isRsVerified ? 'RS.GE რეესტრის აქტიური ჩანაწერი' : 'RS.GE ვერიფიკაცია მოლოდინში'}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Assigned Curator Card & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="lg:w-80 bg-surface-bg border border-border-subtle rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">მომსახურე კურატორი</span>
                <p className="font-headline-sm text-body-md font-semibold text-text-primary">ლევან მაისურაძე</p>
                <p className="text-[12px] font-data-mono-md text-text-muted">+995 32 2 100 200 (შიდა: 104)</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle text-primary hover:bg-primary-container hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer" title="დაკავშირება" type="button">
              <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
            </button>
          </div>
          <button
            onClick={() => setIsDisputeOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-body-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span>დავის გახსნა</span>
          </button>
        </div>
      </div>

      {/* Supporting Proof of Debt Documents (Point 6) */}
      <div className="w-full pt-4 mt-4 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
            <h4 className="text-body-sm font-bold text-text-primary">
              დავალიანების დამადასტურებელი დოკუმენტაცია
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              დამოწმებულია ანალიტიკოსის მიერ
            </span>
          </div>
          <span className="text-xs text-text-muted">
            საფუძველი: ხელშეკრულება &amp; RS.GE სასაქონლო ზედნადებები
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {supportingDocs.map((doc: any) => {
            const isExcel = doc.docType === 'ACCOUNT_TURNOVER' || doc.fileName?.endsWith('.xlsx');
            return (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-surface-bg border border-border-subtle hover:border-primary/40 transition-all flex flex-col justify-between gap-3 shadow-2xs group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    isExcel 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {isExcel ? 'table_view' : 'description'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-body-sm font-semibold text-text-primary truncate" title={doc.title}>
                      {doc.title}
                    </h5>
                    <p className="text-[11px] text-text-muted font-data-mono-md mt-0.5">
                      {doc.fileName} • {doc.fileSize}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSupportingDoc(doc)}
                  className="w-full py-1.5 px-3 rounded-lg border border-border-subtle hover:border-primary hover:bg-white text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {isExcel ? 'download' : 'visibility'}
                  </span>
                  <span>{isExcel ? 'Excel ჩამოტვირთვა' : 'დოკუმენტის ნახვა (PDF)'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
    {/* ================= 3. საკრედიტო რეიტინგის დიდი ვიზუალური ბარათი (Gauge Card) ================= */}
    <section className="bg-surface-card rounded-xl border border-border-subtle p-6 shadow-sm overflow-hidden relative">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left Gauge & Score Block (5 Cols) */}
        <div className="lg:col-span-5 bg-surface-bg border border-border-subtle rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rating-b text-[20px]" data-weight="fill">speed</span>
              <h2 className="font-headline-sm text-body-lg font-bold text-text-primary">საკრედიტო სანდოობის რეიტინგი</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-b/15 text-amber-800 font-bold border border-rating-b/30">
              Grade B (საშუალო რისკი)
            </span>
          </div>
          {/* Visual Multi-Grade Gauge */}
          <div className="my-6">
            <div className="space-y-2">
              <div className="flex justify-between text-body-sm font-label-sm text-text-muted">
                <span className="text-error font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" />Grade C (მაღალი რისკი)</span>
                <span className="text-amber-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rating-b" />Grade B (საშუალო)</span>
                <span className="text-teal-700 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rating-a" />Grade A (მაღალი სანდოობა)</span>
              </div>
              <div className="h-3.5 w-full bg-surface-container rounded-full overflow-hidden flex gap-1 p-0.5 border border-border-subtle">
                <div className="h-full w-1/3 rounded-l-full bg-rating-c/70" />
                <div className="h-full w-1/3 bg-rating-b relative">
                  <div className="absolute -top-1 right-1/4 w-3.5 h-5 bg-text-primary rounded-full ring-2 ring-white shadow flex items-center justify-center">
                    <span className="w-1 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="h-full w-1/3 rounded-r-full bg-rating-a/40" />
              </div>
              <div className="flex justify-between text-label-sm font-data-mono-md text-text-muted pt-1">
                <span>ქულა: 300 - 550</span>
                <span className="font-bold text-amber-700">მიმდინარე: 685 / 1000</span>
                <span>750 - 1000</span>
              </div>
            </div>
          </div>
          {/* Bottom Micro metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-subtle text-center">
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">დისციპლინა</span>
              <span className="text-body-md font-bold text-text-primary">88%</span>
            </div>
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">დაგვიანებები</span>
              <span className="text-body-md font-bold text-rating-c">0 დღე</span>
            </div>
            <div className="p-2 rounded bg-surface-card border border-border-subtle">
              <span className="text-[11px] text-text-muted block">პროგნოზი</span>
              <span className="text-body-md font-bold text-teal-700">ზრდადი</span>
            </div>
          </div>
        </div>
        {/* Right: Narrative & Actionable Recommendations (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-body-sm font-medium mb-3">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              ოფიციალური შეფასება Debitinfo-ს მიხედვით
            </div>
            <h3 className="text-headline-sm font-headline-sm text-text-primary mb-2">
              დებიტორის სანდოობის ანალიზი და რეკომენდაციები
            </h3>
            <p className="text-body-md font-body-md text-text-muted leading-relaxed">
              თქვენი მიმდინარე გადახდების დისციპლინა დამაკმაყოფილებელია. გრაფიკის დაცვის შემთხვევაში თქვენი რეიტინგი გაიზრდება <strong className="text-teal-700 font-semibold">Grade A</strong>-მდე, რაც გაგიხსნით გამარტივებულ საბანკო ლიმიტებს, პროცენტის შემცირების პერსპექტივას და სრულად მოხსნის შეზღუდვებს საჯარო რეესტრში.
            </p>
          </div>
          {/* Action Tips Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-lg border border-border-subtle bg-surface-bg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">event_available</span>
              </div>
              <div className="text-body-sm">
                <span className="font-semibold text-text-primary block">მომდევნო 2 შენატანი დროულად</span>
                <span className="text-text-muted">ავტომატურად გაზრდის ქულას +45 ერთეულით Grade A-მდე.</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-border-subtle bg-surface-bg flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">trending_down</span>
              </div>
              <div className="text-body-sm">
                <span className="font-semibold text-text-primary block">წინსწრებით დაფარვა</span>
                <span className="text-text-muted">ამცირებს დარჩენილ საპროცენტო ტვირთს 140 ₾-ით.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/* ================= 4. დავალიანების ძირითადი მიმოხილვა (Debt Financial Overview Cards - KPI Row) ================= */}
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
          პირადი ფინანსური ვალდებულება და ბალანსი
        </h2>
        <span className="text-body-sm text-text-muted">ვალუტა: GEL (₾)</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Initial Debt */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">საწყისი დავალიანება</span>
            <div className="w-8 h-8 rounded-lg bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-bold text-text-primary">{summary.totalInitial.toLocaleString()} <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>კრედიტორი (გამსესხებელი):</span>
              <span className="font-medium text-text-primary truncate max-w-[160px]">{creditorCompanyName}</span>
            </div>
            <div className="flex justify-between">
              <span>ხელშეკრულება:</span>
              <span className="font-data-mono-md">{primaryClaim?.agreementNumber || 'AGR-99214'}</span>
            </div>
          </div>
        </div>
        {/* KPI 2: Already Repaid */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">უკვე დაფარული თანხა</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-headline-lg font-data-mono-lg font-bold text-text-primary">{summary.totalPaid.toLocaleString()}</span>
              <span className="text-body-md text-text-muted">₾</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-rating-a/20 text-teal-800 ml-auto">
                {summary.totalInitial > 0 ? Math.round((summary.totalPaid / summary.totalInitial) * 100) : 0}% დაფარულია
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-rating-a h-full rounded-full" style={{width: `${summary.totalInitial > 0 ? Math.round((summary.totalPaid / summary.totalInitial) * 100) : 0}%`}} />
            </div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted flex justify-between">
            <span>სტატუსი:</span>
            <span className="font-data-mono-md font-semibold text-text-primary">{primaryClaim?.status || 'ACTIVE'}</span>
          </div>
        </div>
        {/* KPI 3: Remaining Balance */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-body-sm text-text-muted font-medium">მიმდინარე დარჩენილი თანხა</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">balance</span>
            </div>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-bold text-primary">{summary.totalRemaining.toLocaleString()} <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-body-sm text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>ვადაგადაცილება:</span>
              <span className="font-data-mono-md font-semibold text-text-primary">{primaryClaim?.daysOverdue || 0} დღე</span>
            </div>
            <div className="flex justify-between">
              <span>ჯარიმა / პირგასამტეხლო:</span>
              <span className="font-data-mono-md text-text-primary">{Number(primaryClaim?.penaltyAmount || 0)} ₾</span>
            </div>
          </div>
        </div>
        {/* KPI 4: Next Payment */}
        <div className="bg-surface-card rounded-xl border-2 border-primary-container/40 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-start justify-between">
            <span className="text-body-sm font-semibold text-primary">მომდევნო შენატანი</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold bg-amber-100 text-amber-800">
              დარჩენილია 4 დღე
            </span>
          </div>
          <div className="my-3">
            <div className="text-headline-lg font-data-mono-lg font-extrabold text-primary-container">300 <span className="text-body-md font-normal text-text-muted">₾</span></div>
          </div>
          <div className="pt-2 border-t border-blue-100 text-body-sm flex items-center justify-between">
            <span className="text-text-muted">გადახდის ბოლო დღე:</span>
            <span className="font-data-mono-md font-bold text-text-primary">25 ოქტ, 2024</span>
          </div>
        </div>
      </div>
    </section>
    {/* Main Content Layout (Table & Quick Pay Module) */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ================= 5. დაფარვის გრაფიკი (Repayment Schedule) ================= */}
      <section id="schedule" className="lg:col-span-8 bg-surface-card rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-5 border-b border-border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_view_month</span>
                დაფარვის ოფიციალური გრაფიკი
              </h2>
              <p className="text-body-sm text-text-muted mt-0.5">ინდივიდუალური რესტრუქტურიზაციის მიმდინარე ეტაპი</p>
            </div>
            {/* Export Buttons (Point 5) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSchedulePdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-surface-card text-text-primary text-body-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
                title="ოფიციალური PDF გრაფიკის გენერირება და ჩამოტვირთვა"
              >
                <span className="material-symbols-outlined text-[16px] text-error">picture_as_pdf</span>
                <span>PDF ჩამოტვირთვა</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadScheduleExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-bg hover:bg-surface-card text-text-primary text-body-sm font-medium transition-colors shadow-sm active:scale-95 cursor-pointer"
                title="Excel / CSV ამონაწერის ჩამოტვირთვა"
              >
                <span className="material-symbols-outlined text-[16px] text-teal-700">table_view</span>
                <span>Excel ამონაწერი</span>
              </button>
            </div>
          </div>
          {/* Interactive Schedule Toggle Tabs (Point 3) */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="inline-flex p-1 rounded-lg bg-surface-bg border border-border-subtle" role="tablist">
              <button aria-selected="true" className="px-3.5 py-1.5 rounded-md text-body-sm font-semibold bg-surface-card text-primary shadow-sm transition-all" role="tab" type="button">
                სტანდარტული გრაფიკი (12 თვემდე)
              </button>
              {isNonStandard && (
                <button aria-selected="false" className="px-3.5 py-1.5 rounded-md text-body-sm font-medium text-text-muted hover:text-text-primary transition-all" role="tab" type="button">
                  არასტანდარტული / გახანგრძლივებული (12 თვეზე მეტი)
                </button>
              )}
            </div>
            <div className="text-body-sm text-text-muted flex items-center gap-1 font-data-mono-md">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              სულ {totalPeriodsCount} პერიოდი ({paidPeriodsCount} დაფარული)
            </div>
          </div>
        </div>
        {/* Table Responsive Container (Point 2: All 12 Periods from Database) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-border-subtle text-text-muted font-label-md text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-12" scope="col">№</th>
                <th className="py-3 px-3.5" scope="col">გადახდის ვადა</th>
                <th className="py-3 px-3.5 text-right" scope="col">ძირი თანხა</th>
                <th className="py-3 px-3.5 text-right" scope="col">პროცენტი</th>
                <th className="py-3 px-3.5 text-right" scope="col">ჯამური შენატანი</th>
                <th className="py-3 px-3.5 text-right" scope="col">დარჩენილი ბალანსი</th>
                <th className="py-3 px-3.5 text-center" scope="col">სტატუსი</th>
                <th className="py-3 px-3.5 text-center" scope="col">ქვითარი</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-text-primary">
              {allInstallments.map((inst: any) => {
                const isPaid = inst.isPaid;
                const isNext = inst.isNextDue;

                return (
                  <tr
                    key={inst.id}
                    className={`transition-colors ${
                      isNext
                        ? 'bg-blue-50/60 hover:bg-blue-50 ring-1 ring-inset ring-primary/20'
                        : isPaid
                        ? 'bg-white hover:bg-slate-50/80'
                        : 'bg-slate-50/30 hover:bg-slate-50/80 text-text-muted'
                    }`}
                  >
                    <td className={`py-3 px-3.5 text-center font-data-mono-md ${isNext ? 'font-bold text-primary' : 'text-text-muted'}`}>
                      {inst.installmentNo}
                    </td>
                    <td className={`py-3 px-3.5 font-data-mono-md ${isNext ? 'font-bold text-text-primary flex items-center gap-1.5' : ''}`}>
                      <span>{inst.dueDate}</span>
                      {isNext && <span className="w-2 h-2 rounded-full bg-primary animate-ping" />}
                    </td>
                    <td className={`py-3 px-3.5 text-right font-data-mono-md ${isNext ? 'font-semibold text-text-primary' : ''}`}>
                      {inst.principal}
                    </td>
                    <td className="py-3 px-3.5 text-right font-data-mono-md text-text-muted">
                      {inst.interest}
                    </td>
                    <td className={`py-3 px-3.5 text-right font-data-mono-md ${isNext ? 'font-bold text-primary text-[15px]' : isPaid ? 'font-semibold' : ''}`}>
                      {inst.amount}
                    </td>
                    <td className={`py-3 px-3.5 text-right font-data-mono-md ${isNext ? 'font-semibold text-text-primary' : ''}`}>
                      {inst.remaining}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-rating-a/20 text-teal-800 font-semibold">
                          <span className="material-symbols-outlined text-[13px]">check</span> გადახდილი
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-primary text-white font-semibold shadow-xs">
                          <span className="material-symbols-outlined text-[13px]">schedule</span> მომდევნო გადასახდელი
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-slate-100 text-text-muted">
                          დაგეგმილი
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            openOfficialDocument({
                              id: inst.id,
                              debtorName: debtorFullName,
                              amount: 300,
                              paymentDate: new Date().toISOString(),
                              receiptNumber: inst.receiptNumber || `REC-8841-${inst.installmentNo}`,
                              status: 'CONFIRMED_BY_CREDITOR',
                              confirmedByRole: 'CREDITOR',
                              confirmedByUserName: creditorCompanyName,
                            });
                          }}
                          className="p-1 rounded text-primary hover:bg-blue-50 transition-colors cursor-pointer"
                          title={`ქვითრის ჩამოტვირთვა #${inst.receiptNumber || inst.installmentNo}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </button>
                      ) : isNext ? (
                        <span className="text-[11px] text-primary font-semibold italic">მოლოდინში</span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ================= PAYMENT RECEIPTS & CONFIRMATIONS LOG ================= */}
        <div className="p-4 sm:p-5 border-t border-border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">გადახდის ქვითრები &amp; სტატუსი</span>
              <h3 className="font-headline-sm text-body-lg font-bold text-text-primary">
                ატვირთული გადახდების რეესტრი
              </h3>
            </div>
            <span className="text-body-sm text-text-muted font-data-mono-md">
              სულ: {receipts.length} ჩანაწერი
            </span>
          </div>

          <div className="space-y-3">
            {receipts.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-body-sm bg-slate-50 rounded-lg">
                ატვირთული გადახდის ქვითარი ჯერ არ ფიქსირდება
              </div>
            ) : (
              receipts.map((r) => {
                const isConfirmedCreditor = r.status === 'CONFIRMED_BY_CREDITOR';
                const isConfirmedAccountant = r.status === 'CONFIRMED_BY_ACCOUNTANT';
                const isPending = r.status === 'PENDING_CONFIRMATION';

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-border-subtle hover:border-slate-300 bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : isConfirmedAccountant
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isPending ? 'pending' : isConfirmedAccountant ? 'account_balance' : 'verified'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-body-md text-text-primary font-data-mono-md">
                            +{Number(r.amount).toLocaleString('ka-GE')} ₾
                          </span>
                          <span className="text-xs text-text-muted font-data-mono-md">
                            • ქვითარი #{r.receiptNumber}
                          </span>
                          <span className="text-xs text-text-muted font-data-mono-md">
                            • {new Date(r.paymentDate).toLocaleDateString('ka-GE')}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {r.debtorNotes || 'გადახდა დაფიქსირებულია დებიტორის მიერ'}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              მოლოდინშია (დასტურდება კრედიტორის ან ბუღალტრის მიერ)
                            </span>
                          )}
                          {isConfirmedCreditor && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
                              დადასტურებულია კრედიტორის მიერ ({r.confirmedByUserName || 'შპს ჯეო ტრეიდინგი'})
                            </span>
                          )}
                          {isConfirmedAccountant && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                              <span className="material-symbols-outlined text-xs text-blue-600">verified</span>
                              დადასტურებულია ბუღალტრის მიერ ({r.accountantOrderNumber || 'ბრძანებით'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {!isPending && (
                        <button
                          onClick={() => openOfficialDocument(r)}
                          className="px-3.5 py-2 rounded-lg border border-border-subtle hover:bg-slate-50 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isConfirmedAccountant ? 'picture_as_pdf' : 'download'}
                          </span>
                          <span>
                            {isConfirmedAccountant
                              ? 'ბუღალტრის დასტურის ბრძანება (PDF)'
                              : 'ქვითრის ჩამოტვირთვა'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      {/* ================= 6. სწრაფი გადახდის ზონა (Quick Payment Module) ================= */}
      <section id="pay" className="lg:col-span-4 bg-surface-card rounded-xl border border-border-subtle p-5 lg:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">გადახდის დაფიქსირება</span>
            <h2 className="text-headline-sm font-headline-sm text-text-primary">ქვითრის ატვირთვა</h2>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleReceiptSubmit}>
          <div className="space-y-2">
            <label className="block text-body-sm font-semibold text-text-primary">
              გადახდილი თანხა (₾) *
            </label>
            <div className="relative rounded-lg shadow-sm">
              <input
                className="w-full rounded-lg border border-border-subtle bg-white px-3.5 py-2.5 font-data-mono-lg text-headline-sm font-bold text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-right pr-12"
                id="payment-amount"
                placeholder="0.00"
                type="number"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <span className="font-data-mono-md font-bold text-text-muted">₾</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                className={`px-2.5 py-1.5 rounded-lg text-body-sm font-medium transition-all text-center cursor-pointer ${
                  paymentAmount === '300'
                    ? 'border-2 border-primary/50 bg-blue-50 text-primary font-semibold shadow-xs'
                    : 'border border-border-subtle bg-surface-bg text-text-primary hover:bg-slate-200'
                }`}
                onClick={() => setPaymentAmount('300')}
                type="button"
              >
                მომდევნო: 300 ₾
              </button>
              <button
                className={`px-2.5 py-1.5 rounded-lg text-body-sm font-medium transition-all text-center cursor-pointer ${
                  paymentAmount === '2900'
                    ? 'border-2 border-primary/50 bg-blue-50 text-primary font-semibold shadow-xs'
                    : 'border border-border-subtle bg-surface-bg text-text-primary hover:bg-slate-200'
                }`}
                onClick={() => setPaymentAmount('2900')}
                type="button"
              >
                სრული: 2,900 ₾
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <label className="block text-body-sm font-semibold text-text-primary">
              გადახდის თარიღი *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-white px-3.5 py-2 text-body-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Receipt File Upload */}
          <div className="space-y-1.5">
            <label className="block text-body-sm font-semibold text-text-primary">
              გადახდის ქვითრის ატვირთვა *
            </label>
            <div className="border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-xl p-3.5 text-center bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setReceiptFileName(file.name);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1.5">
                <span className="material-symbols-outlined text-2xl text-primary">upload_file</span>
                <span className="text-body-sm font-medium text-text-primary">
                  {receiptFileName ? `არჩეულია: ${receiptFileName}` : 'დააჭირეთ ან ჩააგდეთ ქვითარი (PDF / სურათი)'}
                </span>
                <span className="text-[11px] text-text-muted">საბანკო დავალება, ჩეკი, გადარიცხვის ფოტო ან ამონაწერი</span>
              </div>
            </div>
          </div>

          {/* Debtor Note */}
          <div className="space-y-1.5">
            <label className="block text-body-sm font-semibold text-text-primary">
              დანიშნულება / კომენტარი
            </label>
            <input
              type="text"
              placeholder="მაგ: ოქტომბრის შენატანი / ხელშეკრულება #AGR-99214"
              value={debtorNotes}
              onChange={(e) => setDebtorNotes(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-white px-3.5 py-2 text-body-sm text-text-primary focus:border-primary"
            />
          </div>

          {submissionSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span>ქვითარი წარმატებით გადაიგზავნა! შეტყობინება მიუვიდა კრედიტორსა და ბუღალტერს.</span>
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={submittingReceipt}
              className="w-full py-3 px-4 rounded-lg bg-primary text-white font-headline-sm text-body-md font-semibold hover:bg-primary-container transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              type="submit"
            >
              {submittingReceipt ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>იგზავნება...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  <span>ქვითრის გადაგზავნა დასადასტურებლად</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-text-muted mt-2">
              მონაცემები გადაეგზავნება კრედიტორსა და ბუღალტერს თანხის გადამოწმებისა და დადასტურებისთვის
            </p>
          </div>
        </form>
      </section>
    </div>
  </main>

  {/* ================= Dispute Modal ================= */}
  {isDisputeOpen && (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 border border-border-subtle shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-rose-700">
            <span className="material-symbols-outlined">gavel</span>
            <h3 className="font-bold text-headline-sm">დავის გახსნა / გასაჩივრება</h3>
          </div>
          <button onClick={() => setIsDisputeOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-text-muted cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {disputeSuccess ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">check</span>
            </div>
            <h4 className="font-bold text-text-primary">დავა წარმატებით დარეგისტრირდა!</h4>
            <p className="text-body-sm text-text-muted">იურისტი განიხილავს თქვენს საჩივარს 2 სამუშაო დღის ვადაში.</p>
          </div>
        ) : (
          <form onSubmit={handleDisputeSubmit} className="space-y-4">
            <p className="text-body-sm text-text-muted">
              თუ არ ეთანხმებით დავალიანების ოდენობას ან თვლით რომ თანხა უკვე გადახდილი გაქვთ, მიუთითეთ მიზეზი და დაურთეთ მტკიცებულება.
            </p>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1">დავის საფუძველი *</label>
              <textarea
                required
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="აღწერეთ დავის დეტალები (მაგ: თანხა გადახდილია ბანკში 15 სექტემბერს...)"
                className="w-full p-3 bg-surface-bg border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1">თანდართული ქვითარი ან დოკუმენტი</label>
              <input type="file" className="w-full text-body-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-body-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setIsDisputeOpen(false)}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:bg-slate-100 text-body-sm"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-body-sm shadow-sm"
              >
                დავის რეგისტრაცია
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )}

  {/* ================= 7. ქვედა ფუტერი (Footer) ================= */}
  <footer className="mt-auto bg-surface-card border-t border-border-subtle">
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
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
      <div className="flex flex-col sm:flex-row items-center justify-between text-body-sm text-text-muted gap-3">
        <p>© 2024 Debitinfo.GE. ყველა უფლება დაცულია. ინტეგრირებულია RS.GE სისტემასთან.</p>
        <div className="flex items-center gap-4 text-[12px]">
          <span>სისტემის ვერსია: v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </div>
    </div>
  </footer>
    </div>
  );
}
