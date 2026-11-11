'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { blogService, authService, crmBackendService } from '@/services';
import { BlogPost } from '@/types';
import { downloadDebtorAccountTurnoverXLSX } from '@/utils/excel';

export default function CrmPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [currentTab, setCurrentTab] = useState<'calls' | 'blog' | 'queue'>('calls');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Live CRM State
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [claimDetail, setClaimDetail] = useState<any>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [crmStats, setCrmStats] = useState<any>({
    callsToday: 0,
    dailyTarget: 60,
    promisesCount: 0,
    unreachableCount: 0,
    promisedAmountTotal: 0,
    activeQueueCount: 0,
  });

  // Call logging form state
  const [disposition, setDisposition] = useState<string>('PROMISE_TO_PAY');
  const [callNotes, setCallNotes] = useState('');
  const [promisedDate, setPromisedDate] = useState('');
  const [promisedAmount, setPromisedAmount] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Splitter & Resizing State
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const [isResizing, setIsResizing] = useState(false);
  const splitContainerRef = React.useRef<HTMLElement | null>(null);

  // Debtor Contact Management State (INTERNAL ONLY)
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('+995 ');
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactPosition, setNewContactPosition] = useState('მთავარი ბუღალტერი');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);

  // Repayment Schedule Management State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit'>('create');
  const [scheduleType, setScheduleType] = useState<'STANDARD' | 'NON_STANDARD'>('STANDARD');
  const [scheduleMonths, setScheduleMonths] = useState<number>(12);
  const [schedulePaymentDay, setSchedulePaymentDay] = useState<number>(15);
  const [scheduleInstallments, setScheduleInstallments] = useState<Array<{ installmentNo: number; dueDate: string; amount: number }>>([]);
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);

  const generateInstallments = (
    type: 'STANDARD' | 'NON_STANDARD',
    months: number,
    day: number,
    totalDebt: number,
    existingList?: Array<{ installmentNo: number; dueDate?: string; amount: number }>
  ) => {
    const validMonths = type === 'STANDARD' ? Math.max(1, Math.min(12, months)) : Math.max(13, months);
    const validDay = Math.max(1, Math.min(31, day));
    const baseAmt = Math.floor((totalDebt / validMonths) * 100) / 100;
    const remainder = Math.round((totalDebt - baseAmt * validMonths) * 100) / 100;

    const now = new Date();
    const startMonth = now.getMonth() + 1;
    const startYear = now.getFullYear();

    const result: Array<{ installmentNo: number; dueDate: string; amount: number }> = [];
    for (let i = 0; i < validMonths; i++) {
      const d = new Date(startYear, startMonth + i, Math.min(validDay, 28));
      const dateStr = d.toISOString().split('T')[0];
      const customVal = existingList?.[i]?.amount;
      const amt = customVal !== undefined ? customVal : (i === 0 ? baseAmt + remainder : baseAmt);
      result.push({
        installmentNo: i + 1,
        dueDate: dateStr,
        amount: Math.round(amt * 100) / 100,
      });
    }
    return result;
  };

  const openScheduleModal = (mode: 'create' | 'edit') => {
    setScheduleModalMode(mode);
    const existingSched = activeClaim?.schedules?.[0];
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);

    if (mode === 'edit' && existingSched) {
      const type = existingSched.type === 'NON_STANDARD' ? 'NON_STANDARD' : 'STANDARD';
      const months = existingSched.totalMonths || (type === 'STANDARD' ? 12 : 18);
      const day = existingSched.paymentDay || 15;
      setScheduleType(type);
      setScheduleMonths(months);
      setSchedulePaymentDay(day);
      setScheduleNotes(existingSched.notes || '');

      if (existingSched.installments && existingSched.installments.length > 0) {
        setScheduleInstallments(
          existingSched.installments.map((inst: any, idx: number) => ({
            installmentNo: inst.installmentNo || idx + 1,
            dueDate: inst.dueDate ? new Date(inst.dueDate).toISOString().split('T')[0] : '',
            amount: Number(inst.amount) || 0,
          }))
        );
      } else {
        setScheduleInstallments(generateInstallments(type, months, day, totalDebt));
      }
    } else {
      setScheduleType('STANDARD');
      setScheduleMonths(12);
      setSchedulePaymentDay(15);
      setScheduleNotes('');
      setScheduleInstallments(generateInstallments('STANDARD', 12, 15, totalDebt));
    }
    setIsScheduleModalOpen(true);
  };

  const handleScheduleTypeChange = (type: 'STANDARD' | 'NON_STANDARD') => {
    setScheduleType(type);
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
    const newMonths = type === 'STANDARD' ? Math.min(12, Math.max(1, scheduleMonths)) : Math.max(13, scheduleMonths);
    setScheduleMonths(newMonths);
    setScheduleInstallments(generateInstallments(type, newMonths, schedulePaymentDay, totalDebt));
  };

  const handleScheduleMonthsChange = (months: number) => {
    const validMonths = scheduleType === 'STANDARD' ? Math.max(1, Math.min(12, months)) : Math.max(13, months);
    setScheduleMonths(validMonths);
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
    setScheduleInstallments(generateInstallments(scheduleType, validMonths, schedulePaymentDay, totalDebt));
  };

  const handleSchedulePaymentDayChange = (day: number) => {
    const validDay = Math.max(1, Math.min(31, day));
    setSchedulePaymentDay(validDay);
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
    setScheduleInstallments(generateInstallments(scheduleType, scheduleMonths, validDay, totalDebt, scheduleInstallments));
  };

  const handleInstallmentAmountChange = (idx: number, newAmount: number) => {
    const updated = [...scheduleInstallments];
    updated[idx] = {
      ...updated[idx],
      amount: Math.max(0, newAmount),
    };
    setScheduleInstallments(updated);
  };

  const handleAutoDistributeEvenly = () => {
    const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
    setScheduleInstallments(generateInstallments(scheduleType, scheduleMonths, schedulePaymentDay, totalDebt));
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim?.id) return;

    setSavingSchedule(true);
    try {
      await crmBackendService.saveClaimSchedule(activeClaim.id, {
        type: scheduleType,
        totalMonths: scheduleMonths,
        paymentDay: schedulePaymentDay,
        installments: scheduleInstallments,
        notes: scheduleNotes || undefined,
      });

      setScheduleSuccessMessage(
        `გადახდის გრაფიკი წარმატებით შედგა და გაიგზავნა დებიტორთან დასადასტურებლად!`
      );
      setTimeout(() => setScheduleSuccessMessage(null), 5000);
      setIsScheduleModalOpen(false);

      // Refresh claim detail & queue
      await Promise.all([loadClaimDetail(activeClaim.id), loadQueueAndStats()]);
    } catch (err: any) {
      alert(err?.message || 'გრაფიკის შენახვა ვერ მოხერხდა');
    } finally {
      setSavingSchedule(false);
    }
  };


  // Blog CMS State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState<'financial_literacy' | 'credit_risks' | 'tax_updates' | 'legal_mediation' | 'news'>('tax_updates');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCoverImage, setPostCoverImage] = useState('');
  const [postTags, setPostTags] = useState('RS.GE, დებიტორები, რისკები');
  const [publishSuccess, setPublishSuccess] = useState(false);

  const activeClaim = claimDetail || queue.find((q) => q.id === selectedClaimId);
  const isAdmin = currentUser?.role === 'ADMIN';

  const loadQueueAndStats = async () => {
    setLoadingQueue(true);
    try {
      const [q, stats] = await Promise.all([
        crmBackendService.getQueue(searchQuery, priorityFilter),
        crmBackendService.getStats(),
      ]);
      setQueue(q || []);
      setCrmStats(stats || {});

      if (q && q.length > 0 && !selectedClaimId) {
        setSelectedClaimId(q[0].id);
      }
    } catch (err) {
      console.warn('Could not load CRM queue/stats:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadClaimDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await crmBackendService.getClaimForCall(id);
      setClaimDetail(detail);
    } catch (err) {
      console.warn('Could not load claim detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) {
      router.replace('/ops?redirect=/crm');
      return;
    }
    if (u.role !== 'OPERATOR' && u.role !== 'ADMIN') {
      const dest = authService.getPortalRouteForRole(u.role);
      router.replace(dest);
      return;
    }
    setCurrentUser(u);
    setAuthorized(true);
    loadQueueAndStats();
  }, [router]);

  useEffect(() => {
    if (authorized) {
      loadQueueAndStats();
    }
  }, [priorityFilter]);

  useEffect(() => {
    if (selectedClaimId) {
      loadClaimDetail(selectedClaimId);
    }
  }, [selectedClaimId]);

  // Handle Debtor Selection with Auto-Shrink
  const handleSelectDebtor = (id: string) => {
    setSelectedClaimId(id);
    if (leftPanelWidth > 35) {
      setLeftPanelWidth(28); // Automatically shrink registry to give room to debtor details
    }
  };

  const toggleRegistryWidth = () => {
    if (leftPanelWidth <= 35) {
      setLeftPanelWidth(58);
    } else {
      setLeftPanelWidth(28);
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleAddDebtorContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim?.id) return;
    if (!newContactPhone.trim() || !newContactFirstName.trim()) {
      alert('გთხოვთ მიუთითოთ ტელეფონის ნომერი და სახელი');
      return;
    }

    setIsSavingContact(true);
    try {
      await crmBackendService.addDebtorContact(activeClaim.id, {
        firstName: newContactFirstName.trim(),
        lastName: newContactLastName.trim(),
        phone: newContactPhone.trim(),
        relationType: newContactPosition.trim(),
        notes: newContactNotes.trim(),
      });
      setActionSuccessMessage('ახალი საკონტაქტო ნომერი წარმატებით დაემატა!');
      setIsAddContactModalOpen(false);
      setNewContactPhone('+995 ');
      setNewContactFirstName('');
      setNewContactLastName('');
      setNewContactNotes('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await loadClaimDetail(activeClaim.id);
    } catch (err: any) {
      alert(err?.message || 'საკონტაქტო პირის დამატება ვერ მოხერხდა');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteDebtorContact = async (contactId: string) => {
    if (!activeClaim?.id) return;
    try {
      await crmBackendService.deleteDebtorContact(activeClaim.id, contactId);
      setActionSuccessMessage('საკონტაქტო ნომერი წაიშალა');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      await loadClaimDetail(activeClaim.id);
    } catch (err: any) {
      alert(err?.message || 'საკონტაქტო პირის წაშლა ვერ მოხერხდა');
    }
  };

  useEffect(() => {
    if (currentTab === 'blog' && currentUser?.role !== 'ADMIN') {
      setCurrentTab('calls');
    }
  }, [currentTab, currentUser]);

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;

    setSubmittingLog(true);
    try {
      await crmBackendService.logCall({
        claimId: selectedClaimId,
        disposition,
        promisedDate: promisedDate || undefined,
        promisedAmount: promisedAmount ? parseFloat(promisedAmount) : undefined,
        notes: callNotes || 'კომუნიკაცია განხორციელდა სტანდარტული სკრიპტით.',
      });

      setActionSuccessMessage(`ინტერაქციის შედეგი წარმატებით დაფიქსირდა CRM ბაზაში!`);
      setCallNotes('');
      setPromisedAmount('');
      setPromisedDate('');
      setTimeout(() => setActionSuccessMessage(null), 4000);

      // Refresh claim detail and stats
      await Promise.all([loadClaimDetail(selectedClaimId), loadQueueAndStats()]);
    } catch (err: any) {
      alert(err?.message || 'ჩანაწერის შენახვა ვერ მოხერხდა');
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleOpenDoc = async (doc: any) => {
    if (doc.docType === 'ACCOUNT_TURNOVER' || doc.fileName?.endsWith('.xlsx')) {
      try {
        await downloadDebtorAccountTurnoverXLSX({
          debtorName: activeClaim?.debtorName || 'დებიტორი',
          debtorPersonalId: activeClaim?.debtorPersonalId || '01019012345',
          creditorName: activeClaim?.creditorName || 'შპს დებიტინფო კრედიტორი',
          caseNumber: activeClaim?.caseNumber || 'DI-2024-8841',
          agreementNumber: activeClaim?.agreementNumber || 'AGR-8841',
          fileName: doc.fileName || `brunviti_barati_${activeClaim?.debtorPersonalId || '8841'}.xlsx`,
        });
      } catch (err) {
        console.error('Failed to download turnover Excel:', err);
        alert('Excel ბრუნვითი ბარათის გენერირება ვერ მოხერხდა.');
      }
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
            <div style="font-size: 20px; font-weight: bold; color: #002984;">Debitinfo.GE • კრედიტ მენეჯერის საქმის დოკუმენტი</div>
            <div class="badge">დამოწმებულია RS.GE</div>
          </div>
          <h2 style="margin: 0 0 10px;">${doc.title}</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">დებიტორის საქმის დამადასტურებელი ოფიციალური დოკუმენტაცია</p>
          <table class="table">
            <tr><th>დოკუმენტის ტიპი</th><td>${doc.docType}</td></tr>
            <tr><th>ფაილის დასახელება</th><td>${doc.fileName}</td></tr>
            <tr><th>საქმის ნომერი</th><td><strong>${activeClaim?.caseNumber || 'DI-2024-8841'}</strong></td></tr>
            <tr><th>დებიტორი</th><td>${activeClaim?.debtorName || 'დებიტორი'} (პ/ნ: ${activeClaim?.debtorPersonalId || '01019012345'})</td></tr>
            <tr><th>კრედიტორი</th><td>${activeClaim?.creditorName || 'კრედიტორი'}</td></tr>
            <tr><th>სტატუსი</th><td style="color: #059669; font-weight: bold;">დამოწმებულია / აქტიურია</td></tr>
            <tr><th>აღწერა</th><td>${doc.description || 'დავალიანების წარმოშობისა და ვალდებულების არსებობის ოფიციალური საფუძველი'}</td></tr>
          </table>
          <div class="stamp">
            RS.GE / DEBITINFO.GE<br>
            დამოწმებულია კრედიტ მენეჯერისთვის
          </div>
        </body>
        </html>
      `);
      w.document.close();
    }
  };

  const handlePublishPost = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const categoryNamesKa: Record<string, string> = {
      financial_literacy: 'ფინანსური განათლება',
      credit_risks: 'საკრედიტო რისკები',
      tax_updates: 'საგადასახადო სიახლეები',
      legal_mediation: 'მედიაცია & კანონმდებლობა',
      news: 'პლატფორმის სიახლეები',
    };

    const newPost = await blogService.createPost({
      title: postTitle,
      slug: postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || `post-${Date.now()}`,
      category: postCategory,
      categoryKa: categoryNamesKa[postCategory] || 'სიახლეები',
      excerpt: postExcerpt || postContent.slice(0, 150) + '...',
      content: postContent,
      coverImage: postCoverImage || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
      authorName: currentUser?.name || 'თამარ გიორგობიანი',
      authorRole: 'კრედიტ მენეჯერი / კონტენტ მენეჯერი',
      published: !isDraft,
      tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setPosts([newPost, ...posts]);
    setPublishSuccess(true);
    setPostTitle('');
    setPostExcerpt('');
    setPostContent('');
    setPostCoverImage('');
    setTimeout(() => setPublishSuccess(false), 3500);
  };

  const handleDeletePost = async (id: string) => {
    await blogService.deletePost(id);
    setPosts(posts.filter((p) => p.id !== id));
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-bg" suppressHydrationWarning>
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  return (
    <div className="bg-surface-bg text-text-primary h-full flex flex-col font-body-md antialiased overflow-hidden" suppressHydrationWarning>
      {/* TopNavBar */}
      <header className="w-full px-space-xl h-16 flex items-center justify-between border-b border-border-subtle bg-surface-card docked full-width top-0 sticky z-50 shadow-sm">
        <div className="flex items-center gap-space-lg">
          <Link href="/" className="flex items-center gap-space-sm group cursor-pointer">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">account_balance</span>
            </span>
            <span className="text-headline-sm font-headline-sm font-bold text-primary tracking-tight group-hover:underline">
              Debitinfo.GE კრედიტ მენეჯერი &amp; CRM
            </span>
          </Link>
          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-space-md ml-space-md">
            <button
              onClick={() => setCurrentTab('calls')}
              className={`font-headline-sm text-body-md pb-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                currentTab === 'calls'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <span>ინტერაქციის კონსოლი (CRM Console)</span>
              <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setCurrentTab('blog')}
                className={`font-headline-sm text-body-md pb-1 flex items-center gap-1.5 cursor-pointer transition-all ${
                  currentTab === 'blog'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'text-text-muted hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">newspaper</span>
                <span>ბლოგი &amp; სიახლეები (CMS)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Admin CMS</span>
              </button>
            )}
            <button
              onClick={() => {
                setCurrentTab('calls');
                loadQueueAndStats();
              }}
              className="font-body-md px-2 py-1 rounded text-text-muted hover:text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
            >
              სამუშაო რიგი ({queue.length})
            </button>
          </nav>
        </div>

        {/* Trailing Actions & Operator Badge */}
        <div className="flex items-center gap-space-md">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-bg border border-border-subtle rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rating-a opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#059669]" />
            </span>
            <span className="text-label-md font-label-md text-text-primary">ონლაინ / მზადყოფნაში</span>
          </div>
          <div className="h-6 w-[1px] bg-border-subtle hidden sm:block" />
          {/* Link to Ops (Admin Only) */}
          {currentUser?.role === 'ADMIN' && (
            <Link
              href="/ops"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
              title="საოპერაციო ცენტრში გადასვლა"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              <span className="hidden sm:inline">საოპერაციო ცენტრი</span>
            </Link>
          )}

          {/* Operator Profile */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20">
              {currentUser?.name ? currentUser.name.substring(0, 2) : (currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'OP')}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-body-sm font-label-md leading-none text-text-primary">
                {currentUser?.name || currentUser?.email || 'თამარ გიორგობიანი'}
              </p>
              <p className="text-label-sm font-label-sm text-text-muted mt-0.5">
                {currentUser?.role === 'ADMIN' ? 'სისტემური ადმინისტრატორი' : 'კრედიტ მენეჯერი & CRM'}
              </p>
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

      {/* KPI Metrics Ribbon (Top Dashboard Strip) */}
      <section className="w-full bg-surface-card border-b border-border-subtle px-space-xl py-space-sm shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          {/* KPI 1 */}
          <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
            <div>
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">
                დღის ინტერაქციები / გეგმა
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-data-mono-lg font-data-mono-lg text-text-primary">
                  {crmStats.callsToday}{' '}
                  <span className="text-text-muted font-normal text-sm">/ {crmStats.dailyTarget}</span>
                </span>
                <span className="text-label-sm font-label-sm text-secondary bg-surface-container px-1.5 py-0.5 rounded">
                  {Math.round((crmStats.callsToday / crmStats.dailyTarget) * 100)}%
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">support_agent</span>
            </div>
          </div>
          {/* KPI 2 */}
          <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
            <div>
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">
                შედეგიანი მოლაპარაკება
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-data-mono-lg font-data-mono-lg text-[#047857]">
                  {crmStats.promisesCount}
                </span>
                <span className="text-label-sm font-label-sm text-[#047857] bg-accent-mint/20 px-1.5 py-0.5 rounded font-medium">
                  დათანხმდა დაფარვას
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-accent-mint/15 flex items-center justify-center text-[#047857]">
              <span className="material-symbols-outlined text-lg">task_alt</span>
            </div>
          </div>
          {/* KPI 3 */}
          <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl">
            <div>
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">
                შეუმდგარი კავშირი
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-data-mono-lg font-data-mono-lg text-text-primary">
                  {crmStats.unreachableCount}
                </span>
                <span className="text-label-sm font-label-sm text-text-muted bg-border-subtle/60 px-1.5 py-0.5 rounded">
                  მიუწვდომელი
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-lg">phone_missed</span>
            </div>
          </div>
          {/* KPI 4 */}
          <div className="flex items-center justify-between p-2.5 bg-surface-bg border border-border-subtle rounded-xl ring-1 ring-accent-mint/50">
            <div>
              <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider block">
                შეთანხმებული თანხა დღეს
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-data-mono-lg font-data-mono-lg text-primary font-bold">
                  {Number(crmStats.promisedAmountTotal || 0).toLocaleString('ka-GE')} ₾
                </span>
                <span className="w-2 h-2 rounded-full bg-accent-mint ml-1 inline-block" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Switches between Call Console and Blog/News Studio */}
      {currentTab === 'blog' ? (
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Studio Header & Stats */}
          <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">post_add</span>
                </span>
                <div>
                  <h1 className="text-headline-md font-headline-md font-bold text-text-primary">
                    ბლოგისა &amp; სიახლეების მართვის სტუდია
                  </h1>
                  <p className="text-body-sm text-text-muted mt-0.5">
                    კრედიტ მენეჯერისა და ადმინისტრაციის პანელი — გამოაქვეყნეთ სტატიები და სიახლეები Debitinfo.GE-ის მთავარ პორტალზე
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-surface-bg rounded-xl border border-border-subtle text-center">
                <span className="text-xs text-text-muted block">გამოქვეყნებული</span>
                <span className="text-headline-sm font-bold text-primary font-data-mono-md">{posts.length}</span>
              </div>
              <div className="px-4 py-2 bg-surface-bg rounded-xl border border-border-subtle text-center">
                <span className="text-xs text-text-muted block">მკითხველი</span>
                <span className="text-headline-sm font-bold text-emerald-700 font-data-mono-md">
                  {posts.reduce((acc, p) => acc + p.viewsCount, 0).toLocaleString()}
                </span>
              </div>
              <Link
                href="/#blog"
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-text-primary text-body-sm font-medium transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                <span>საიტზე ნახვა</span>
              </Link>
            </div>
          </div>

          {publishSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              <span>სტატია წარმატებით გამოქვეყნდა საიტზე!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Post Creation Form (7 Cols) */}
            <div className="lg:col-span-7 bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm space-y-4">
              <h3 className="font-headline-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">edit_document</span>
                ახალი სტატიის დამატება
              </h3>

              <form onSubmit={handlePublishPost} className="space-y-4">
                <div>
                  <label className="block text-body-sm font-semibold text-text-primary mb-1">
                    სათაური <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="მაგ: როგორ დავიცვათ თავი ვადაგადაცილებული დებიტორული რისკებისგან"
                    className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-body-md focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-semibold text-text-primary mb-1">კატეგორია</label>
                    <select
                      value={postCategory}
                      onChange={(e: any) => setPostCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-body-md focus:border-primary focus:outline-none"
                    >
                      <option value="tax_updates">საგადასახადო სიახლეები</option>
                      <option value="credit_risks">საკრედიტო რისკები</option>
                      <option value="financial_literacy">ფინანსური განათლება</option>
                      <option value="legal_mediation">მედიაცია &amp; კანონმდებლობა</option>
                      <option value="news">პლატფორმის სიახლეები</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold text-text-primary mb-1">თეგები (მძიმით)</label>
                    <input
                      type="text"
                      value={postTags}
                      onChange={(e) => setPostTags(e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-body-md focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-primary mb-1">მოკლე ანოტაცია (Excerpt)</label>
                  <textarea
                    rows={2}
                    value={postExcerpt}
                    onChange={(e) => setPostExcerpt(e.target.value)}
                    placeholder="1-2 წინადადება მთავარ გვერდზე საჩვენებლად..."
                    className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-body-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-semibold text-text-primary mb-1">სტატიის სრული ტექსტი</label>
                  <textarea
                    rows={6}
                    required
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="დაწერეთ სტატიის დეტალური შინაარსი..."
                    className="w-full px-3.5 py-2 bg-surface-bg border border-border-subtle rounded-xl text-body-sm focus:border-primary focus:outline-none resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-white font-semibold text-body-md shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>სტატიის გამოქვეყნება საიტზე</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Published Posts List (5 Cols) */}
            <div className="lg:col-span-5 bg-surface-card rounded-2xl border border-border-subtle p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="font-headline-sm font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">library_books</span>
                  გამოქვეყნებული სტატიები ({posts.length})
                </h3>
                <span className="text-xs text-text-muted">Live Database</span>
              </div>

              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl border border-border-subtle bg-surface-bg hover:border-slate-300 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {post.categoryKa}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[13px]">visibility</span>
                          {post.viewsCount}
                        </span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="სტატიის წაშლა"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-text-primary text-body-md group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border-subtle/60">
                      <span>{post.publishedAt} • {post.authorName}</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {post.published ? 'საიტზეა' : 'დრაფტი'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Main Split Layout: Telephony Active Call Console */
        <main ref={splitContainerRef} className="flex-1 flex overflow-hidden relative">
          {/* LEFT SECTION: Queue Registry & Filters */}
          <section
            style={{ width: `${leftPanelWidth}%` }}
            className="border-r border-border-subtle flex flex-col bg-surface-card overflow-hidden shrink-0 transition-[width] duration-100"
          >
            {/* Section Header & Filter Cluster */}
            <div className="p-space-md border-b border-border-subtle bg-surface-card shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">format_list_bulleted</span>
                  <h2 className="text-headline-sm font-headline-sm text-text-primary">სამუშაო რეესტრი (Queue Registry)</h2>
                  <span className="px-2 py-0.5 bg-surface-container text-primary rounded-full text-label-sm font-label-sm">
                    {queue.length} საქმე
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRegistryWidth}
                    className="px-2.5 py-1 text-label-md font-label-md text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title={leftPanelWidth <= 35 ? 'რეესტრის გაფართოება (58%)' : 'რეესტრის შეკუმშვა (28%)'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {leftPanelWidth <= 35 ? 'dock_to_right' : 'vertical_split'}
                    </span>
                    <span className="hidden sm:inline">
                      {leftPanelWidth <= 35 ? 'გაფართოება' : 'შეკუმშვა'}
                    </span>
                  </button>
                  <button
                    onClick={loadQueueAndStats}
                    className="px-2.5 py-1 text-label-md font-label-md text-primary bg-primary/10 hover:bg-primary/15 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>განახლება</span>
                  </button>
                </div>
              </div>

              {/* Segmented Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-body-sm">
                <button
                  onClick={() => setPriorityFilter('ALL')}
                  className={`px-3 py-1.5 font-medium rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    priorityFilter === 'ALL'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>ყველა</span>
                  <span className="bg-white/20 text-xs px-1.5 py-0.2 rounded-full">{queue.length}</span>
                </button>
                <button
                  onClick={() => setPriorityFilter('HIGH')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    priorityFilter === 'HIGH'
                      ? 'bg-rating-c text-white'
                      : 'bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>მაღალი პრიორიტეტი</span>
                  <span className="bg-rating-c/15 text-rating-c text-xs font-bold px-1.5 py-0.2 rounded-full">ვადაგადაცილებული</span>
                </button>
                <button
                  onClick={() => setPriorityFilter('CALLBACK')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    priorityFilter === 'CALLBACK'
                      ? 'bg-amber-600 text-white'
                      : 'bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span>დანიშნული გადარეკვა</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-lg">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadQueueAndStats();
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all font-body-md"
                  placeholder="ძებნა: სახელი, გვარი, პირადი ნომერი ან ტელეფონი..."
                  type="text"
                />
              </div>
            </div>

            {/* Interactive Registry Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-[#F1F5F9] border-b border-border-subtle text-text-muted text-label-sm font-label-sm uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">მოვალე / პ/ნ</th>
                    <th className="py-2.5 px-3 font-semibold">ტელეფონი</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ვალის თანხა</th>
                    <th className="py-2.5 px-3 font-semibold">ვადაგადაცილება</th>
                    <th className="py-2.5 px-3 font-semibold text-center">ბოლო სტატუსი</th>
                    <th className="py-2.5 px-4 font-semibold text-right">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-body-sm">
                  {loadingQueue && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-muted">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>მონაცემები იტვირთება PostgreSQL ბაზიდან...</span>
                      </td>
                    </tr>
                  )}
                  {!loadingQueue && queue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-muted">
                        სამუშაო რიგში საქმეები არ მოიძებნა
                      </td>
                    </tr>
                  )}
                  {queue.map((item) => {
                    const isSelected = selectedClaimId === item.id;
                    const dispKa: Record<string, string> = {
                      PROMISE_TO_PAY: 'დათანხმდა',
                      REFUSED: 'უარი',
                      CALLBACK: 'გადარეკვა',
                      VOICEMAIL: 'მიუწვდომელი',
                      WRONG_NUMBER: 'შეცვლილია',
                      DISPUTE_RAISED: 'სადავო',
                    };

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleSelectDebtor(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-surface-container/60 border-l-4 border-l-primary'
                            : 'bg-surface-card hover:bg-surface-bg'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-text-primary flex items-center gap-1.5">
                            <span>{item.debtorName}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" title="არჩეული საქმე" />
                            )}
                          </div>
                          <div className="text-data-mono-md font-data-mono-md text-text-muted text-xs">
                            {item.debtorPersonalId} • #{item.caseNumber}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-data-mono-md font-data-mono-md text-text-primary font-medium">
                            {item.debtorPhone}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-data-mono-md font-data-mono-md font-semibold text-text-primary">
                            {item.remainingAmount.toLocaleString('ka-GE')} ₾
                          </span>
                          <span className="block text-label-sm text-text-muted">
                            ძირი: {item.initialAmount.toLocaleString('ka-GE')} ₾
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-1.5 py-0.2 text-[11px] font-bold rounded ${
                              item.daysOverdue > 60
                                ? 'bg-rating-c/10 text-rating-c'
                                : 'bg-rating-b/15 text-amber-800'
                            }`}
                          >
                            {item.daysOverdue} დღე
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.lastDisposition ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200">
                              {dispKa[item.lastDisposition] || item.lastDisposition}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ახალი კონტაქტი
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDebtor(item.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors flex items-center gap-1 ml-auto shadow-sm cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-on-primary hover:bg-[#0A37CA]'
                                : 'bg-surface-card border border-border-subtle text-primary hover:bg-slate-100'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{isSelected ? 'check_circle' : 'edit_note'}</span>
                            <span>{isSelected ? 'არჩეულია' : 'აღრიცხვა'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="px-4 py-2.5 bg-surface-bg border-t border-border-subtle flex items-center justify-between text-label-sm text-text-muted shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>მონაცემები სინქრონიზებულია Debitinfo Risk Engine-თან (PostgreSQL)</span>
              </div>
              <div>ნაჩვენებია: {queue.length} საქმე</div>
            </div>
          </section>

          {/* Vertical Resizable Splitter Divider */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            onDoubleClick={() => setLeftPanelWidth(50)}
            className={`relative w-2.5 -mx-1 z-30 cursor-col-resize select-none flex items-center justify-center transition-colors group shrink-0 ${
              isResizing ? 'bg-primary/20' : 'hover:bg-primary/10'
            }`}
            title="გაწიეთ მარცხნივ/მარჯვნივ რეესტრის ზომის შესაცვლელად (ორმაგი კლიკი: 50/50)"
          >
            {/* Divider central line */}
            <div
              className={`w-[2px] h-full transition-colors ${
                isResizing ? 'bg-primary' : 'bg-slate-300 group-hover:bg-primary'
              }`}
            />

            {/* Grab handle indicator */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-12 rounded-full border bg-white shadow-xs flex items-center justify-center transition-all ${
                isResizing
                  ? 'border-primary text-primary scale-110 shadow-md ring-2 ring-primary/20'
                  : 'border-slate-300 text-slate-400 group-hover:border-primary group-hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">drag_indicator</span>
            </div>
          </div>

          {/* RIGHT SECTION: Active Debtor Case & Call Logging */}
          <section
            style={{ width: `${100 - leftPanelWidth}%` }}
            className="flex flex-col bg-surface-bg overflow-hidden shrink-0 transition-[width] duration-100"
          >
            {activeClaim ? (
              <>
                {/* Debtor Case Header */}
                <div className="p-space-md bg-surface-card border-b border-border-subtle shrink-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded uppercase font-data-mono-md">
                          საქმე #{activeClaim.caseNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rating-b/20 text-[#B45309]">
                          Grade {activeClaim.rating} (სკორი {activeClaim.riskScore})
                        </span>
                      </div>
                      <h1 className="text-headline-md font-headline-md font-bold text-text-primary mt-1">
                        {activeClaim.debtorName}
                      </h1>
                      <p className="text-body-sm text-text-muted flex items-center gap-2 mt-0.5">
                        <span>
                          პ/ნ: <strong className="text-data-mono-md font-semibold text-text-primary">{activeClaim.debtorPersonalId}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          კრედიტორი: <strong className="text-text-primary font-medium">{activeClaim.creditorName}</strong>
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-label-sm font-label-sm text-text-muted uppercase">ჯამური დავალიანება</span>
                      <div className="text-headline-sm font-data-mono-lg font-bold text-primary mt-0.5">
                        {activeClaim.remainingAmount.toLocaleString('ka-GE')} ₾
                      </div>
                      <span className="text-xs text-text-muted">ხელშეკრულება #{activeClaim.agreementNumber}</span>
                    </div>
                  </div>

                  {/* Debtor Phone Contact & Outbound Coordinates */}
                  <div className="mt-3.5 p-3.5 bg-surface-container/40 border border-border-subtle rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-xl">contact_phone</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-body-md font-data-mono-lg font-bold text-text-primary tracking-wide">
                            {activeClaim.debtorPhone}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-primary text-[11px] font-semibold rounded-md">
                            გარე სატელეფონო კავშირი
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-xs text-slate-400">record_voice_over</span>
                          <span>განახორციელეთ ზარი სატელეფონო მოწყობილობით და შედეგი აღრიცხეთ ქვემოთ</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions: Fast Copy & Dial Link */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeClaim.debtorPhone) {
                            navigator.clipboard.writeText(activeClaim.debtorPhone);
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          copiedPhone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-text-primary border-border-subtle hover:bg-slate-50'
                        }`}
                        title="ტელეფონის ნომრის კოპირება"
                      >
                        <span className="material-symbols-outlined text-sm">{copiedPhone ? 'check' : 'content_copy'}</span>
                        <span>{copiedPhone ? 'დაკოპირდა!' : 'ნომრის კოპირება'}</span>
                      </button>

                      <a
                        href={`tel:${activeClaim.debtorPhone}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-[#0A37CA] transition-all flex items-center gap-1.5 shadow-2xs"
                        title="ტელეფონის აპლიკაციით დაკავშირება"
                      >
                        <span className="material-symbols-outlined text-sm">phone_forwarded</span>
                        <span>დაკავშირება</span>
                      </a>
                    </div>
                  </div>

                  {/* Discovered / Additional Contacts & Phone Numbers (INTERNAL ONLY) */}
                  <div className="mt-3 bg-white border border-border-subtle rounded-xl p-3 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">phone_in_talk</span>
                        <h4 className="font-bold text-xs text-text-primary">
                          დამატებითი საკონტაქტო ნომრები & მოძიებული პირები
                        </h4>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200"
                          title="ეს მონაცემები დებიტორისთვის დამალულია და მხოლოდ თანამშრომლებს (კრედიტ მენეჯერსა და ანალიტიკოსს) უჩანთ"
                        >
                          <span className="material-symbols-outlined text-[11px]">lock</span>
                          შიდა მონაცემი (კრედიტ მენეჯერი / ანალიტიკოსი)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddContactModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-container text-white hover:bg-primary transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">add_call</span>
                        <span>+ ახალი ნომრის დამატება</span>
                      </button>
                    </div>

                    {/* Contact items list */}
                    <div className="space-y-1.5 pt-1">
                      {/* 1. Primary Default Debtor Phone */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            №1
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                                {activeClaim.debtorPhone}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                ძირითადი / მოვალე
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {activeClaim.debtorName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(activeClaim.debtorPhone);
                              setCopiedPhone(true);
                              setTimeout(() => setCopiedPhone(false), 2000);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
                            title="კოპირება"
                          >
                            <span className="material-symbols-outlined text-[16px]">{copiedPhone ? 'check' : 'content_copy'}</span>
                          </button>
                          <a
                            href={`tel:${activeClaim.debtorPhone}`}
                            className="px-2.5 py-1 rounded bg-primary text-white text-[11px] font-semibold hover:bg-[#0A37CA] transition flex items-center gap-1 shadow-2xs"
                            title="დაკავშირება"
                          >
                            <span className="material-symbols-outlined text-[14px]">call</span>
                            <span>დაკავშირება</span>
                          </a>
                        </div>
                      </div>

                      {/* 2. Discovered / Additional Contacts */}
                      {activeClaim.contactPersons && activeClaim.contactPersons.length > 0 ? (
                        activeClaim.contactPersons.map((contact: any, idx: number) => {
                          const isCopied = copiedContactId === contact.id;
                          return (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-blue-50/40 hover:bg-blue-50/70 border border-blue-200/80 transition text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  №{idx + 2}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                                      {contact.phone}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                      {contact.relationType || 'საკონტაქტო პირი'}
                                    </span>
                                    <span className="text-slate-800 font-semibold text-xs">
                                      {contact.firstName} {contact.lastName}
                                    </span>
                                  </div>
                                  {contact.notes && (
                                    <p className="text-[11px] text-slate-600 mt-0.5">
                                      {contact.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(contact.phone);
                                    setCopiedContactId(contact.id);
                                    setTimeout(() => setCopiedContactId(null), 2000);
                                  }}
                                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer"
                                  title="კოპირება"
                                >
                                  <span className="material-symbols-outlined text-[16px]">{isCopied ? 'check' : 'content_copy'}</span>
                                </button>
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition flex items-center gap-1 shadow-2xs"
                                  title={`${contact.firstName} ${contact.lastName}-თან დაკავშირება`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">call</span>
                                  <span>დაკავშირება</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDebtorContact(contact.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="საკონტაქტოს წაშლა"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1 px-1">
                          დამატებითი მოძიებული ნომრები ჯერ არ არის შეყვანილი. ახალი ნომრის გამოვლენისას დააჭირეთ „+ ახალი ნომრის დამატება“-ს.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success Message Banner */}
                {actionSuccessMessage && (
                  <div className="p-3 mx-4 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                    <span>{actionSuccessMessage}</span>
                  </div>
                )}

                {/* Scrollable CRM Entry & Timeline Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-space-md space-y-space-md">
                  {/* Supporting Documents & Proofs Inspector */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-lg">folder_shared</span>
                        <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">
                          საქმის დამადასტურებელი დოკუმენტაცია &amp; ქვითრები
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        RS.GE / ბუღალტერია
                      </span>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-2">
                      {Array.isArray(activeClaim.supportingDocuments) && activeClaim.supportingDocuments.length > 0 ? (
                        activeClaim.supportingDocuments.map((doc: any, idx: number) => {
                          const isExcel = doc.docType === 'ACCOUNT_TURNOVER' || doc.fileName?.endsWith('.xlsx') || doc.fileName?.endsWith('.csv');
                          return (
                            <div
                              key={doc.id || idx}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-border-subtle bg-surface-bg hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isExcel ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  <span className="material-symbols-outlined text-base">
                                    {isExcel ? 'table_view' : 'picture_as_pdf'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-text-primary truncate">
                                    {doc.title}
                                  </p>
                                  <p className="text-[11px] text-text-muted truncate">
                                    {doc.fileName} • {doc.description || 'დამოწმებული ფაილი'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDoc(doc)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                                  isExcel
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100'
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {isExcel ? 'download' : 'visibility'}
                                </span>
                                <span>{isExcel ? 'XLSX ექსპორტი' : 'დათვალიერება'}</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 rounded-lg border border-dashed border-border-subtle bg-surface-bg text-center text-xs text-text-muted">
                          დამადასტურებელი დოკუმენტები ამ საქმეზე ატვირთული არ არის.
                        </div>
                      )}

                      {/* Debtor Uploaded Payment Receipts */}
                      {activeClaim.paymentReceipts && activeClaim.paymentReceipts.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border-subtle">
                          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                            დებიტორის მიერ ატვირთული გადახდის ქვითრები ({activeClaim.paymentReceipts.length})
                          </span>
                          <div className="space-y-1.5">
                            {activeClaim.paymentReceipts.map((rcpt: any) => (
                              <div
                                key={rcpt.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-emerald-700 text-base">receipt_long</span>
                                  <div>
                                    <span className="font-semibold text-text-primary">ქვითარი #{rcpt.id?.substring(0, 8)}</span>
                                    <span className="text-text-muted ml-2">{Number(rcpt.amount).toLocaleString('ka-GE')} ₾</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDoc({
                                    title: `გადახდის ქვითარი #${rcpt.id?.substring(0, 8)}`,
                                    docType: 'RECEIPT',
                                    fileName: rcpt.fileName || `receipt_${rcpt.id?.substring(0, 8)}.pdf`,
                                    description: `გადახდილი თანხა: ${rcpt.amount} ₾, თარიღი: ${new Date(rcpt.createdAt).toLocaleDateString('ka-GE')}`,
                                  })}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                                >
                                  ქვითრის ნახვა
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= REPAYMENT SCHEDULE MANAGEMENT CARD ================= */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
                        <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">
                          გადახდის გრაფიკის მართვა &amp; მიბმა
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        კრედიტ მენეჯერი
                      </span>
                    </div>

                    {scheduleSuccessMessage && (
                      <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                        <span>{scheduleSuccessMessage}</span>
                      </div>
                    )}

                    {activeClaim.schedules && activeClaim.schedules.length > 0 ? (
                      (() => {
                        const sched = activeClaim.schedules[0];
                        const isApproved = sched.approvalStatus === 'APPROVED';
                        const isPending = sched.approvalStatus === 'PENDING_DEBTOR_APPROVAL' || !sched.approvalStatus;
                        const isRejected = sched.approvalStatus === 'REJECTED';

                        return (
                          <div className="space-y-3">
                            {/* Schedule Status & Type Banner */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    sched.type === 'NON_STANDARD' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {sched.type === 'NON_STANDARD' ? 'არასტანდარტული გრაფიკი' : 'სტანდარტული გრაფიკი'}
                                  </span>
                                  {isApproved && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs">verified</span> დადასტურებულია დებიტორის მიერ
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      მოლოდინში (დებიტორის დასადასტურებელი)
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs">cancel</span> უარყოფილია დებიტორის მიერ
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1.5">
                                  ვადა: <strong>{sched.totalMonths} თვე</strong> • ყოველი თვის <strong>{sched.paymentDay || 15} რიცხვი</strong> • საშუალო: <strong>~{Number(sched.monthlyAmount || 0).toFixed(2)} ₾ / თვე</strong>
                                </p>
                                {sched.debtorRespondedAt && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    დებიტორის გადაწყვეტილების თარიღი: {new Date(sched.debtorRespondedAt).toLocaleString('ka-GE')}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openScheduleModal('edit')}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-[#0A37CA] transition flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                  <span>გრაფიკის რედაქტირება</span>
                                </button>
                              </div>
                            </div>

                            {/* Toggle breakdown table */}
                            <div>
                              <button
                                type="button"
                                onClick={() => setShowScheduleDetails(!showScheduleDetails)}
                                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {showScheduleDetails ? 'expand_less' : 'expand_more'}
                                </span>
                                <span>{showScheduleDetails ? 'გრაფიკის ცხრილის დამალვა' : `გრაფიკის პერიოდების ნახვა (${sched.installments?.length || sched.totalMonths} თვე)`}</span>
                              </button>

                              {showScheduleDetails && sched.installments && (
                                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 max-h-56">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] sticky top-0">
                                      <tr>
                                        <th className="py-1.5 px-2.5 text-center">№</th>
                                        <th className="py-1.5 px-3">გადახდის ვადა</th>
                                        <th className="py-1.5 px-3 text-right">შენატანი</th>
                                        <th className="py-1.5 px-3 text-center">სტატუსი</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {sched.installments.map((inst: any, idx: number) => (
                                        <tr key={inst.id || idx} className="hover:bg-slate-50">
                                          <td className="py-1.5 px-2.5 text-center font-mono text-slate-500">{inst.installmentNo || idx + 1}</td>
                                          <td className="py-1.5 px-3 font-mono text-slate-700">
                                            {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('ka-GE') : '—'}
                                          </td>
                                          <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">
                                            {Number(inst.amount || 0).toFixed(2)} ₾
                                          </td>
                                          <td className="py-1.5 px-3 text-center">
                                            {inst.isPaid ? (
                                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">გადახდილი</span>
                                            ) : (
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">დაგეგმილი</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border-subtle bg-surface-bg text-center space-y-2">
                        <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                        <p className="text-xs text-text-muted">
                          ამ მოვალეზე გადახდის გრაფიკი ჯერ არ არის შედგენილი.
                        </p>
                        <button
                          type="button"
                          onClick={() => openScheduleModal('create')}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-[#0A37CA] transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          <span>ახალი გადახდის გრაფიკის შედგენა</span>
                        </button>
                      </div>
                    )}
                  </div>

                  
                  {/* Communication Result Entry Form */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                        <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">
                          კომუნიკაციის შედეგის დაფიქსირება &amp; CRM ჩანაწერი
                        </h3>
                      </div>
                      <span className="text-label-sm text-text-muted">PostgreSQL Sync</span>
                    </div>

                    <form className="mt-3 space-y-3" onSubmit={handleLogCall}>
                      {/* Disposition Selection */}
                      <div>
                        <label className="block text-label-sm font-label-md text-text-muted mb-1.5">
                          ინტერაქციის სტატუსი / შედეგი *
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { value: 'PROMISE_TO_PAY', label: 'დათანხმდა გადახდას', color: 'text-emerald-700 border-emerald-400 bg-emerald-50' },
                            { value: 'CALLBACK', label: 'დაინიშნა გადარეკვა', color: 'text-amber-700 border-amber-400 bg-amber-50' },
                            { value: 'VOICEMAIL', label: 'არ იღებს ყურმილს', color: 'text-slate-700 border-slate-300 bg-slate-50' },
                            { value: 'REFUSED', label: 'კატეგორიული უარი', color: 'text-rose-700 border-rose-400 bg-rose-50' },
                            { value: 'DISPUTE_RAISED', label: 'სადავო მოთხოვნა', color: 'text-purple-700 border-purple-400 bg-purple-50' },
                            { value: 'WRONG_NUMBER', label: 'არასწორი ნომერი', color: 'text-slate-600 border-slate-300 bg-slate-50' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setDisposition(opt.value)}
                              className={`py-2 px-2.5 rounded-lg text-xs font-semibold text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                                disposition === opt.value
                                  ? `${opt.color} border-2 shadow-xs`
                                  : 'bg-surface-bg border border-border-subtle text-text-muted hover:text-text-primary'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-current" />
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Promised Terms */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-border-subtle">
                        <div>
                          <label className="block text-[11px] font-semibold text-text-muted mb-1">
                            შეთანხმებული თანხა (₾)
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={promisedAmount}
                            onChange={(e) => setPromisedAmount(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-text-muted mb-1">
                            დაფარვის თარიღი
                          </label>
                          <input
                            type="date"
                            value={promisedDate}
                            onChange={(e) => setPromisedDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-border-subtle rounded text-xs"
                          />
                        </div>
                      </div>

                      {/* Negotiated Terms / Notes */}
                      <div>
                        <label className="block text-label-sm font-label-md text-text-muted mb-1">
                          მოლაპარაკების დეტალური კომენტარი *
                        </label>
                        <textarea
                          rows={2}
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="ჩაწერეთ მოვალის პასუხი, შეთანხმებული პირობა ან მიზეზი..."
                          className="w-full p-2.5 bg-white border border-border-subtle rounded-lg text-body-sm text-text-primary focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 font-body-md"
                        />
                      </div>

                      {/* Save Action Button */}
                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={submittingLog}
                          className="w-full py-2.5 bg-primary hover:bg-[#0A37CA] disabled:opacity-50 text-on-primary font-medium text-body-md rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          <span>{submittingLog ? 'იგზავნება...' : 'შედეგის შენახვა და რეესტრში დაფიქსირება'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* CRM History / Interaction Timeline */}
                  <div className="bg-surface-card border border-border-subtle rounded-xl p-space-md shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-text-muted text-lg">history</span>
                        <h3 className="text-headline-sm font-headline-sm text-sm font-bold text-text-primary">
                          საქმის ისტორია &amp; CRM ქრონოლოგია
                        </h3>
                      </div>
                      <span className="text-label-sm text-text-muted">
                        {(claimDetail?.crmLogs?.length || 0) + (claimDetail?.timelineEvents?.length || 0)} ჩანაწერი
                      </span>
                    </div>

                    {/* Timeline items */}
                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle">
                      {claimDetail?.crmLogs && claimDetail.crmLogs.length > 0 ? (
                        claimDetail.crmLogs.map((log: any) => (
                          <div key={log.id} className="relative">
                            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-data-mono-md text-text-muted">
                                {new Date(log.createdAt).toLocaleString('ka-GE')}
                              </span>
                              <span className="px-1.5 py-0.2 bg-blue-50 text-primary border border-blue-200 text-[11px] font-semibold rounded">
                                {log.disposition}
                              </span>
                            </div>
                            <p className="text-body-sm text-text-primary font-medium">{log.notes}</p>
                            {log.promisedAmount && (
                              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                                შეპირებული თანხა: {log.promisedAmount} ₾ (ვადა: {log.promisedDate ? new Date(log.promisedDate).toLocaleDateString('ka-GE') : 'მითითებული არაა'})
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                              <span className="material-symbols-outlined text-xs">person</span>
                              <span>კრედიტ მენეჯერი: {log.operatorName}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-text-muted py-2">ამ საქმეზე კომუნიკაციის ისტორია ჯერ არ არის დაფიქსირებული.</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-text-muted m-auto">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">contact_phone</span>
                <p className="text-base font-medium">აირჩიეთ საქმე მარცხენა სიიდან კომუნიკაციისა და შედეგის აღსარიცხად</p>
              </div>
            )}
          </section>
        </main>
      )}
    
      {/* ================= PAYMENT SCHEDULE CONFIGURATION MODAL ================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {scheduleModalMode === 'edit' ? 'გადახდის გრაფიკის რედაქტირება' : 'ახალი გადახდის გრაფიკის შედგენა'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  მოვალე: <strong>{activeClaim?.debtorName}</strong> (საქმე #{activeClaim?.caseNumber}) • ვალის თანხა: <strong>{Number(activeClaim?.remainingAmount || 0).toLocaleString('ka-GE')} ₾</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSchedule} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  გრაფიკის ტიპი *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleScheduleTypeChange('STANDARD')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleType === 'STANDARD'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                        სტანდარტული გრაფიკი
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">1-12 თვე</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      ვადა 1-დან 12 თვემდე. თანხა ავტომატურად თანაბრად ნაწილდება თვეებზე.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScheduleTypeChange('NON_STANDARD')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      scheduleType === 'NON_STANDARD'
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-purple-600 text-base">tune</span>
                        არასტანდარტული გრაფიკი
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">≥13 თვე</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      მინიმუმ 13 თვე, შეუზღუდავი მაქსიმუმი. თანხის ხელით რედაქტირება თითოეულ თვეზე.
                    </p>
                  </button>
                </div>
              </div>

              {/* Month Count & Payment Day Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    გადახდის თვეების რაოდენობა {scheduleType === 'STANDARD' ? '(1 - 12)' : '(მინ. 13)'} *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={scheduleType === 'STANDARD' ? 1 : 13}
                      max={scheduleType === 'STANDARD' ? 12 : 120}
                      value={scheduleMonths}
                      onChange={(e) => handleScheduleMonthsChange(parseInt(e.target.value) || (scheduleType === 'STANDARD' ? 12 : 13))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500 shrink-0">თვე</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {scheduleType === 'STANDARD' ? 'მაქსიმუმ 12 თვე' : 'შეუზღუდავი მაქსიმალური ვადა'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    გადახდის დღე (ყოველი თვის რიცხვი) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      value={schedulePaymentDay}
                      onChange={(e) => handleSchedulePaymentDayChange(parseInt(e.target.value) || 15)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:border-primary focus:outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500 shrink-0">რიცხვი</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    მაგ: 15 (ყოველთვიურად ამ რიცხვში)
                  </span>
                </div>
              </div>

              {/* Installments Table / Preview with Editable Amounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>ყოველთვიური შენატანების განაწილება</span>
                    {scheduleType === 'NON_STANDARD' && (
                      <span className="text-[10px] font-normal text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                        თითოეული თვის თანხა რედაქტირებადია
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoDistributeEvenly}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    title="თანაბარი განაწილების აღდგენა"
                  >
                    <span className="material-symbols-outlined text-xs">restart_alt</span>
                    <span>თანაბრად გადანაწილება</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">№</th>
                        <th className="py-2 px-3">გადახდის თარიღი</th>
                        <th className="py-2 px-3 text-right">შენატანი (₾)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {scheduleInstallments.map((inst, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="py-1.5 px-3 text-center font-mono text-slate-500">{inst.installmentNo}</td>
                          <td className="py-1.5 px-3 font-mono text-slate-700">{inst.dueDate}</td>
                          <td className="py-1.5 px-3 text-right">
                            {scheduleType === 'NON_STANDARD' ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={inst.amount}
                                onChange={(e) => handleInstallmentAmountChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-28 px-2 py-1 bg-purple-50/50 border border-purple-200 rounded font-mono font-bold text-right text-xs focus:outline-none focus:border-purple-600"
                              />
                            ) : (
                              <span className="font-mono font-bold text-slate-900">{inst.amount.toFixed(2)} ₾</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Live Sum Calculation */}
                {(() => {
                  const totalDistributed = scheduleInstallments.reduce((s, i) => s + (Number(i.amount) || 0), 0);
                  const totalDebt = Number(activeClaim?.remainingAmount || activeClaim?.initialAmount || 0);
                  const diff = Math.round((totalDistributed - totalDebt) * 100) / 100;

                  return (
                    <div className="flex items-center justify-between p-2.5 mt-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="text-slate-600">
                        გადანაწილებული ჯამი: <strong className="text-slate-900">{totalDistributed.toFixed(2)} ₾</strong> / ვალის თანხა: <strong className="text-slate-900">{totalDebt.toFixed(2)} ₾</strong>
                      </span>
                      {diff === 0 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          ზუსტად ემთხვევა
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          სხვაობა: {diff > 0 ? `+${diff}` : diff} ₾
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  კომენტარი ან დამატებითი შეთანხმება (არასავალდებულო)
                </label>
                <textarea
                  rows={2}
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="მაგ: შეთანხმებულია სატელეფონო საუბრის შედეგად, მოვალე იღებს ვალდებულებას დაიცვას გრაფიკი..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#0A37CA] transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>{savingSchedule ? 'ინახება...' : 'გრაფიკის შენახვა & დებიტორისთვის გაგზავნა'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEBTOR CONTACT MODAL (INTERNAL ONLY) */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-subtle space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">add_call</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    ახალი საკონტაქტო ნომრის დამატება
                  </h3>
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    შიდა ჩანაწერი — დებიტორს არ გამოუჩნდება
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddContactModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDebtorContact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ტელეფონის ნომერი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="+995 599 00 00 00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    სახელი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactFirstName}
                    onChange={(e) => setNewContactFirstName(e.target.value)}
                    placeholder="მაგ: ნინო"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    გვარი
                  </label>
                  <input
                    type="text"
                    value={newContactLastName}
                    onChange={(e) => setNewContactLastName(e.target.value)}
                    placeholder="მაგ: გელაშვილი"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  თანამდებობა / როლი <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newContactPosition}
                  onChange={(e) => setNewContactPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                >
                  <option value="მთავარი ბუღალტერი">მთავარი ბუღალტერი</option>
                  <option value="დირექტორი">დირექტორი / ხელმძღვანელი</option>
                  <option value="დამფუძნებელი">დამფუძნებელი / მეწილე</option>
                  <option value="ფინანსური მენეჯერი">ფინანსური მენეჯერი</option>
                  <option value="იურისტი / ადვოკატი">იურისტი / ადვოკატი</option>
                  <option value="ოჯახის წევრი">ოჯახის წევრი (თავდები / ახლობელი)</option>
                  <option value="მენეჯერი / თანამშრომელი">მენეჯერი / თანამშრომელი</option>
                  <option value="სხვა საკონტაქტო პირი">სხვა საკონტაქტო პირი</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  შიდა შენიშვნა / კომენტარი
                </label>
                <textarea
                  rows={2}
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  placeholder="მაგ: მოძიებულია საჯარო რეესტრიდან / თანახმაა ინვოისის გადამოწმებაზე..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-[#0A37CA] transition flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingContact ? 'ინახება...' : 'შენახვა'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
