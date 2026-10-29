'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INITIAL_BLOG_POSTS, blogService, authService, crmBackendService } from '@/services';
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

  // Blog CMS State
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
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
            <div style="font-size: 20px; font-weight: bold; color: #002984;">Debitinfo.GE • ოპერატორის საქმის დოკუმენტი</div>
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
            დამოწმებულია ოპერატორისთვის
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
      authorRole: 'CRM ოპერატორი / კონტენტ მენეჯერი',
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
              Debitinfo.GE Operator &amp; CRM
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
                {currentUser?.role === 'ADMIN' ? 'სისტემური ადმინისტრატორი' : 'დებიტ ოფიცერი & CRM'}
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
                    CRM ოპერატორისა და ადმინისტრაციის პანელი — გამოაქვეყნეთ სტატიები და სიახლეები Debitinfo.GE-ის მთავარ პორტალზე
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
        <main className="flex-1 flex overflow-hidden">
          {/* LEFT SECTION: Queue Registry & Filters */}
          <section className="w-7/12 border-r border-border-subtle flex flex-col bg-surface-card overflow-hidden">
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
                <button
                  onClick={loadQueueAndStats}
                  className="px-2.5 py-1 text-label-md font-label-md text-primary bg-primary/10 hover:bg-primary/15 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>განახლება</span>
                </button>
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
                        onClick={() => setSelectedClaimId(item.id)}
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
                              setSelectedClaimId(item.id);
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

          {/* RIGHT SECTION: Active Debtor Case & Call Logging */}
          <section className="w-5/12 flex flex-col bg-surface-bg overflow-hidden">
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
                      {((activeClaim.supportingDocuments && activeClaim.supportingDocuments.length > 0)
                        ? activeClaim.supportingDocuments
                        : [
                            {
                              id: 'doc-01',
                              title: `სასაქონლო ზედნადები (RS.GE #${activeClaim.caseNumber})`,
                              docType: 'RS_WAYBILL',
                              fileName: `rs_waybill_${activeClaim.caseNumber}.pdf`,
                              description: 'ოფიციალური სასაქონლო ზედნადები RS.GE დამოწმებით',
                            },
                            {
                              id: 'doc-02',
                              title: 'საბუღალტრო ბრუნვითი ბარათი (XLSX)',
                              docType: 'ACCOUNT_TURNOVER',
                              fileName: `brunviti_barati_${activeClaim.debtorPersonalId}.xlsx`,
                              description: 'ურთიერთშედარების აქტი და ბრუნვის ამონაწერი Excel-ში',
                            },
                            {
                              id: 'doc-03',
                              title: `საკრედიტო ხელშეკრულება #${activeClaim.agreementNumber}`,
                              docType: 'CONTRACT',
                              fileName: `contract_${activeClaim.agreementNumber}.pdf`,
                              description: 'კრედიტორთან გაფორმებული ხელშეკრულება',
                            },
                          ]
                      ).map((doc: any, idx: number) => {
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
                      })}

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
                              <span>ოპერატორი: {log.operatorName}</span>
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
    </div>
  );
}
