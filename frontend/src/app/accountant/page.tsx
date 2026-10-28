'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, paymentsService, PaymentReceiptItem, AuthUser } from '@/services';

export default function AccountantDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [receipts, setReceipts] = useState<PaymentReceiptItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    pendingCount: 0,
    confirmedByCreditorCount: 0,
    confirmedByAccountantCount: 0,
    totalConfirmedGEL: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Accountant Confirmation Modal
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptItem | null>(null);
  const [orderRationale, setOrderRationale] = useState('კრედიტორის სატელეფონო დასტურის საფუძველზე');
  const [orderNotes, setOrderNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const me = await authService.getMe();
        if (!isMounted) return;
        if (!me) {
          router.replace('/login?redirect=/accountant');
          return;
        }
        // Admin or Accountant only
        if (me.role !== 'ACCOUNTANT' && me.role !== 'ADMIN') {
          const target = authService.getPortalRouteForRole(me.role);
          router.replace(target);
          return;
        }
        setCurrentUser(me);

        const data = await paymentsService.getAccountantPayments();
        if (isMounted && data) {
          setReceipts(data.receipts);
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.warn('Could not load accountant data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const handleConfirmByAccountant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;
    setConfirming(true);
    try {
      const fullNotes = `${orderRationale}${orderNotes ? ' - ' + orderNotes : ''}`;
      const updated = await paymentsService.confirmByAccountant(selectedReceipt.id, fullNotes);
      setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
      setMetrics(prev => ({
        ...prev,
        pendingCount: Math.max(0, prev.pendingCount - 1),
        confirmedByAccountantCount: prev.confirmedByAccountantCount + 1,
        totalConfirmedGEL: prev.totalConfirmedGEL + Number(updated.amount),
      }));
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        setSelectedReceipt(null);
        setOrderNotes('');
        openOfficialDocument(updated);
      }, 1200);
    } catch (err: any) {
      alert(err?.message || 'ბრძანების დამოწმება ვერ მოხერხდა');
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

  const filteredReceipts = receipts.filter((r) => {
    if (filterStatus === 'PENDING' && r.status !== 'PENDING_CONFIRMATION') return false;
    if (filterStatus === 'CREDITOR' && r.status !== 'CONFIRMED_BY_CREDITOR') return false;
    if (filterStatus === 'ACCOUNTANT' && r.status !== 'CONFIRMED_BY_ACCOUNTANT') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.debtorName.toLowerCase().includes(q) ||
        r.creditorName.toLowerCase().includes(q) ||
        r.receiptNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingList = receipts.filter(r => r.status === 'PENDING_CONFIRMATION');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg">
        <div className="p-8 rounded-2xl bg-surface-card border border-border-subtle shadow-xl flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md font-semibold text-text-primary">ბუღალტერიის კონსოლის ჩატვირთვა...</h3>
            <p className="text-body-sm text-text-muted mt-1">მიმდინარეობს საგადახდო რეესტრის მონაცემების სინქრონიზაცია</p>
          </div>
        </div>
      </div>
    );
  }

  const staffName = currentUser?.staffProfile?.fullName || 'მარიამ წიკლაური';
  const staffDept = currentUser?.staffProfile?.department || 'Financial & Accounting';

  return (
    <div className="bg-surface-bg text-text-primary antialiased min-h-screen flex flex-col font-body-md text-body-md">
      {/* HEADER */}
      <header className="bg-surface-card sticky top-0 z-40 border-b border-border-subtle shadow-xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-headline-sm font-bold text-text-primary">Debitinfo</span>
                <span className="font-headline-sm font-bold text-amber-600">.Finance</span>
              </div>
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold">
              ბუღალტერიის პორტალი
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-body-sm font-semibold text-text-primary">{staffName}</span>
              <span className="text-[11px] text-text-muted">{staffDept}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-slate-100 text-text-muted hover:text-text-primary text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">გასვლა</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* HERO TITLE & WORKFLOW EXPLANATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-card p-6 rounded-2xl border border-border-subtle shadow-xs">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              ფინანსური აღრიცხვა &amp; გადახდის დასტურის მართვა
            </span>
            <h1 className="text-2xl font-bold text-text-primary mt-1">
              ბუღალტრული საგადახდო რეესტრი &amp; ბრძანებები
            </h1>
            <p className="text-body-sm text-text-muted mt-1 max-w-2xl">
              დებიტორების მიერ ატვირთული ქვითრების მონიტორინგი, კრედიტორის ნაცვლად სატელეფონო დასტურის საფუძველზე თანხის ასახვა და ოფიციალური ბრძანებების გენერირება.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              სისტემა აქტიურია
            </span>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase">ჯამური ჩარიცხვები</span>
              <span className="material-symbols-outlined text-emerald-600">payments</span>
            </div>
            <div className="text-2xl font-bold font-data-mono-md text-text-primary mt-2">
              {metrics.totalConfirmedGEL.toLocaleString('ka-GE')} ₾
            </div>
            <span className="text-xs text-text-muted mt-1 block">დადასტურებული თანხა</span>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-amber-300 bg-amber-50/30 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-900 uppercase">დასადასტურებელი</span>
              <span className="material-symbols-outlined text-amber-700">pending_actions</span>
            </div>
            <div className="text-2xl font-bold font-data-mono-md text-amber-900 mt-2">
              {metrics.pendingCount} ქვითარი
            </div>
            <span className="text-xs text-amber-800 mt-1 block">დებიტორების მიერ შემოტანილი</span>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase">კრედიტორის დასტური</span>
              <span className="material-symbols-outlined text-emerald-600">verified</span>
            </div>
            <div className="text-2xl font-bold font-data-mono-md text-emerald-700 mt-2">
              {metrics.confirmedByCreditorCount}
            </div>
            <span className="text-xs text-text-muted mt-1 block">საიტიდან დამოწმებული</span>
          </div>

          <div className="bg-surface-card p-5 rounded-xl border border-border-subtle shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted uppercase">ბუღალტრის ბრძანება</span>
              <span className="material-symbols-outlined text-blue-600">gavel</span>
            </div>
            <div className="text-2xl font-bold font-data-mono-md text-blue-700 mt-2">
              {metrics.confirmedByAccountantCount}
            </div>
            <span className="text-xs text-text-muted mt-1 block">გაცემული ოქმით</span>
          </div>
        </div>

        {/* PENDING CONFIRMATIONS QUEUE (Point 5 & 6) */}
        {pendingList.length > 0 && (
          <section className="bg-surface-card rounded-2xl border-2 border-dashed border-amber-300 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                </div>
                <div>
                  <h2 className="font-bold text-body-lg text-text-primary">
                    დასადასტურებელი გადახდების რიგი (კრედიტორის ნაცვლად დადასტურება)
                  </h2>
                  <p className="text-xs text-text-muted">
                    დებიტორმა ატვირთა ქვითარი. თუ კრედიტორი პირადად არ ადასტურებს, ბუღალტერი ამოწმებს და გასცემს ბრძანებას.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold font-data-mono-md self-start sm:self-auto">
                {pendingList.length} მოლოდინში
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingList.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-xl border border-border-subtle hover:border-amber-400 shadow-2xs space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-text-muted font-data-mono-md block">ქვითარი #{p.receiptNumber}</span>
                      <h4 className="font-bold text-body-md text-text-primary mt-0.5">{p.debtorName}</h4>
                      <span className="text-xs text-text-muted">კრედიტორი: {p.creditorName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold font-data-mono-md text-emerald-700 block">
                        +{Number(p.amount).toLocaleString('ka-GE')} ₾
                      </span>
                      <span className="text-[11px] text-text-muted font-data-mono-md">
                        {new Date(p.paymentDate).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                  </div>

                  {p.debtorNotes && (
                    <div className="p-2 rounded-lg bg-slate-50 text-xs text-text-muted italic border border-slate-200">
                      „{p.debtorNotes}“
                    </div>
                  )}

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md font-medium border border-amber-200">
                      მოლოდინშია
                    </span>
                    <button
                      onClick={() => setSelectedReceipt(p)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>თანხის დადასტურება (ბრძანებით)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* COMPREHENSIVE PAYMENTS ARCHIVE & LEDGER */}
        <section className="bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <h2 className="font-bold text-body-lg text-text-primary">სრული საგადახდო არქივი</h2>
              <p className="text-xs text-text-muted">ყველა დაფიქსირებული, კრედიტორის და ბუღალტრის მიერ დადასტურებული ტრანზაქცია</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="ძიება: დებიტორი, კრედიტორი, #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-border-subtle bg-white text-xs focus:border-amber-600 focus:outline-none w-48 sm:w-60"
              />
              <div className="inline-flex rounded-lg border border-border-subtle bg-surface-bg p-0.5 text-xs">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    filterStatus === 'ALL' ? 'bg-white shadow-2xs text-text-primary font-bold' : 'text-text-muted'
                  }`}
                  type="button"
                >
                  ყველა
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    filterStatus === 'PENDING' ? 'bg-white shadow-2xs text-amber-900 font-bold' : 'text-text-muted'
                  }`}
                  type="button"
                >
                  მოლოდინში
                </button>
                <button
                  onClick={() => setFilterStatus('CREDITOR')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    filterStatus === 'CREDITOR' ? 'bg-white shadow-2xs text-emerald-800 font-bold' : 'text-text-muted'
                  }`}
                  type="button"
                >
                  კრედიტორით
                </button>
                <button
                  onClick={() => setFilterStatus('ACCOUNTANT')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    filterStatus === 'ACCOUNTANT' ? 'bg-white shadow-2xs text-blue-800 font-bold' : 'text-text-muted'
                  }`}
                  type="button"
                >
                  ბუღალტერიით
                </button>
              </div>
            </div>
          </div>

          {/* TABLE OF RECEIPTS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3.5">ქვითრის # / თარიღი</th>
                  <th className="py-3 px-3.5">დებიტორი</th>
                  <th className="py-3 px-3.5">კრედიტორი</th>
                  <th className="py-3 px-3.5 text-right">თანხა</th>
                  <th className="py-3 px-3.5 text-center">სტატუსი &amp; დასტური</th>
                  <th className="py-3 px-3.5 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-body-sm text-text-primary">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      ჩანაწერი ვერ მოიძებნა
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => {
                    const isConfirmedCreditor = r.status === 'CONFIRMED_BY_CREDITOR';
                    const isConfirmedAccountant = r.status === 'CONFIRMED_BY_ACCOUNTANT';
                    const isPending = r.status === 'PENDING_CONFIRMATION';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5 font-data-mono-md">
                          <span className="font-bold text-text-primary block">#{r.receiptNumber}</span>
                          <span className="text-[11px] text-text-muted">
                            {new Date(r.paymentDate).toLocaleDateString('ka-GE')}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-medium">{r.debtorName}</td>
                        <td className="py-3 px-3.5 text-text-muted">{r.creditorName}</td>
                        <td className="py-3 px-3.5 text-right font-data-mono-md font-bold text-emerald-700">
                          +{Number(r.amount).toLocaleString('ka-GE')} ₾
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              მოლოდინშია
                            </span>
                          )}
                          {isConfirmedCreditor && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                              <span className="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span>
                              კრედიტორის მიერ
                            </span>
                          )}
                          {isConfirmedAccountant && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
                              <span className="material-symbols-outlined text-[13px] text-blue-600">verified</span>
                              ბუღალტრის ბრძანება
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedReceipt(r)}
                              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              type="button"
                            >
                              დადასტურება
                            </button>
                          ) : (
                            <button
                              onClick={() => openOfficialDocument(r)}
                              className="px-2.5 py-1 rounded-md border border-border-subtle hover:bg-slate-100 text-primary text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isConfirmedAccountant ? 'picture_as_pdf' : 'download'}
                              </span>
                              <span>{isConfirmedAccountant ? 'ბრძანება' : 'ქვითარი'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ACCOUNTANT CONFIRMATION & ORDER GENERATION MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 border border-border-subtle shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                <h3 className="font-bold text-headline-sm text-text-primary">
                  ბუღალტრული დასტურის ბრძანების გაცემა
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
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
                <h4 className="font-bold text-text-primary">ბრძანება წარმატებით გაფორმდა!</h4>
                <p className="text-body-sm text-text-muted">თანხა ასახულია რეესტრში და კრედიტორსაც გამოუჩნდება დადასტურებულად.</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmByAccountant} className="space-y-4">
                <p className="text-body-sm text-text-muted">
                  კრედიტორთან შეთანხმებით ან სატელეფონო დასტურის საფუძველზე, დაადასტურეთ დებიტორის ჩარიცხვა. სისტემა დააგენერირებს ოფიციალურ ბრძანებას.
                </p>

                {/* Details summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-border-subtle space-y-2 text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">დებიტორი:</span>
                    <span className="font-semibold text-text-primary">{selectedReceipt.debtorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">კრედიტორი:</span>
                    <span className="font-semibold text-text-primary">{selectedReceipt.creditorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">გადახდილი თანხა:</span>
                    <span className="font-bold font-data-mono-md text-emerald-700 text-body-md">
                      +{Number(selectedReceipt.amount).toLocaleString('ka-GE')} ₾
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">თარიღი &amp; ქვითარი:</span>
                    <span className="font-data-mono-md text-text-primary">
                      #{selectedReceipt.receiptNumber} • {new Date(selectedReceipt.paymentDate).toLocaleDateString('ka-GE')}
                    </span>
                  </div>
                  {selectedReceipt.debtorNotes && (
                    <div className="pt-1 text-xs text-text-muted italic border-t border-slate-200">
                      „{selectedReceipt.debtorNotes}“
                    </div>
                  )}
                </div>

                {/* Confirmation Rationale */}
                <div className="space-y-1.5">
                  <label className="block text-body-sm font-semibold text-text-primary">
                    დადასტურების საფუძველი *
                  </label>
                  <select
                    value={orderRationale}
                    onChange={(e) => setOrderRationale(e.target.value)}
                    className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-body-sm text-text-primary focus:border-amber-600 focus:outline-none"
                  >
                    <option value="კრედიტორის სატელეფონო დასტურის საფუძველზე">
                      კრედიტორის სატელეფონო დასტურის საფუძველზე
                    </option>
                    <option value="საბანკო ამონაწერის პირდაპირი შემოწმებით">
                      საბანკო ამონაწერის პირდაპირი შემოწმებით
                    </option>
                    <option value="კრედიტორის წერილობითი მომართვის საფუძველზე">
                      კრედიტორის წერილობითი მომართვის საფუძველზე
                    </option>
                  </select>
                </div>

                {/* Extra Notes */}
                <div className="space-y-1.5">
                  <label className="block text-body-sm font-semibold text-text-primary">
                    დამატებითი შენიშვნა / ოქმის დეტალი
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: კრედიტორის წარმომადგენელმა ირაკლი ნადირაძემ დაადასტურა თანხა 14:20-ზე"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-body-sm text-text-primary focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-subtle">
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 rounded-lg border border-border-subtle text-text-primary hover:bg-slate-50 text-body-sm font-medium transition-colors cursor-pointer"
                    type="button"
                  >
                    გაუქმება
                  </button>
                  <button
                    disabled={confirming}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-body-sm font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
                    type="submit"
                  >
                    {confirming ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>ფორმდება...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">gavel</span>
                        <span>ბრძანების დამოწმება &amp; ასახვა</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-surface-card border-t border-border-subtle py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© 2026 Debitinfo.GE. ფინანსური მართვისა და აღრიცხვის ქვესისტემა.</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <span className="material-symbols-outlined text-[14px]">lock</span> SSL დაშიფრული
            </span>
            <span>•</span>
            <span>თბილისი, საქართველო</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
