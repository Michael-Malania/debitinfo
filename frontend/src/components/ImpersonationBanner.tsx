'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authService } from '@/services';

export default function ImpersonationBanner() {
  const pathname = usePathname();
  const [impersonation, setImpersonation] = useState<{
    isImpersonating: boolean;
    originalUser: any | null;
    targetUser: any | null;
    returnUrl: string;
  }>({
    isImpersonating: false,
    originalUser: null,
    targetUser: null,
    returnUrl: '/analyst/staff',
  });

  const [beingObserved, setBeingObserved] = useState<{
    isBeingObserved: boolean;
    observer: {
      analystId: string;
      analystName: string;
      analystEmail: string;
      startedAt: string;
    } | null;
  }>({
    isBeingObserved: false,
    observer: null,
  });

  const checkImpersonation = () => {
    const info = authService.getImpersonationInfo();
    setImpersonation(info);
  };

  useEffect(() => {
    checkImpersonation();
    const handleStorage = () => checkImpersonation();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('impersonation-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('impersonation-changed', handleStorage);
    };
  }, [pathname]);

  // Poll backend observation status for logged-in staff OR send heartbeat when analyst is impersonating
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setBeingObserved({ isBeingObserved: false, observer: null });
      return;
    }

    if (impersonation.isImpersonating && impersonation.targetUser?.id) {
      const analystName =
        impersonation.originalUser?.name ||
        impersonation.originalUser?.email ||
        'ფინანსური ანალიტიკოსი';
      const analystEmail = impersonation.originalUser?.email || 'analyst@debitinfo.ge';

      // Initial heartbeat
      authService.sendObservationHeartbeat({
        targetUserId: impersonation.targetUser.id,
        analystName,
        analystEmail,
      });

      const hbTimer = setInterval(() => {
        authService.sendObservationHeartbeat({
          targetUserId: impersonation.targetUser.id,
          analystName,
          analystEmail,
        });
      }, 10000);

      return () => clearInterval(hbTimer);
    } else {
      // Employee's own session: poll if an analyst is currently observing them
      let mounted = true;
      const pollStatus = async () => {
        const u = authService.getCurrentUser();
        if (!u) return;
        const status = await authService.getObservationStatus();
        if (mounted) {
          setBeingObserved(status);
        }
      };

      pollStatus();
      const pollTimer = setInterval(pollStatus, 4000);
      return () => {
        mounted = false;
        clearInterval(pollTimer);
      };
    }
  }, [impersonation.isImpersonating, impersonation.targetUser?.id, pathname]);

  const handleReturn = async () => {
    const targetId = impersonation.targetUser?.id;
    await authService.stopObservationOnBackend(targetId);
    const returnUrl = authService.stopImpersonation();
    window.dispatchEvent(new Event('impersonation-changed'));
    window.location.href = returnUrl || '/analyst/staff';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OPERATOR':
        return 'კრედიტ მენეჯერი (Call Center & CRM)';
      case 'LEGAL':
        return 'იურისტი / სააღსრულებო';
      case 'FIELD_OFFICER':
        return 'საველე ვიზიტორი';
      case 'ACCOUNTANT':
        return 'ბუღალტერი';
      case 'ANALYST':
        return 'ფინანსური ანალიტიკოსი';
      case 'ADMIN':
        return 'ადმინისტრატორი';
      default:
        return role;
    }
  };

  // Case 1: The employee is logged into their own session and is being observed live by an Analyst
  if (!impersonation.isImpersonating && beingObserved.isBeingObserved) {
    const analystName =
      beingObserved.observer?.analystName || 'უფროსი ფინანსური ანალიტიკოსი';
    return (
      <aside
        aria-label="ანალიტიკოსის დაკვირვების შეტყობინება"
        className="sticky top-0 z-50 w-full bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white shadow-md border-b border-white/20 select-none animate-fadeIn"
      >
        <div className="w-full px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
            </span>
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px] text-amber-300">
                visibility
              </span>
              <span className="px-2 py-0.5 rounded bg-white/15 text-amber-200 font-bold uppercase tracking-wider text-[10px]">
                LIVE მონიტორინგი
              </span>
              <span>
                ყურადღება: ამჟამად თქვენს სამუშაო გარემოს ათვალიერებს ფინანსური ანალიტიკოსი{' '}
                <strong className="underline underline-offset-2 decoration-white/60 font-bold">
                  {analystName}
                </strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-indigo-100 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>სესია სინქრონიზებულია რეალურ დროში</span>
          </div>
        </div>
      </aside>
    );
  }

  if (!impersonation.isImpersonating) {
    return null;
  }

  // Case 2: Analyst is actively observing the employee's workspace
  const targetName =
    impersonation.targetUser?.name || impersonation.targetUser?.email || 'თანამშრომელი';
  const targetRole = impersonation.targetUser?.role || 'თანამშრომელი';
  const analystName =
    impersonation.originalUser?.name ||
    impersonation.originalUser?.email ||
    'ფინანსური ანალიტიკოსი';

  return (
    <aside
      aria-label="მონიტორინგის რეჟიმის შეტყობინება"
      className="sticky top-0 z-50 w-full shadow-md select-none"
    >
      {/* Top Bar: Analyst Monitoring Controls */}
      <div className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white border-b border-white/20">
        <div className="w-full px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <div className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span className="font-bold tracking-wide">მონიტორინგის რეჟიმი:</span>
              <span>
                თქვენ აკვირდებით თანამშრომელ{' '}
                <strong className="underline underline-offset-2 decoration-white/60 font-bold">
                  {targetName}
                </strong>
                -ს ({getRoleLabel(targetRole)}) სამუშაო გარემოს
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-orange-900 font-bold hover:bg-orange-50 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>ანალიტიკოსის კაბინეტში დაბრუნება</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar: Employee-facing Live Notification (what the employee sees on their screen) */}
      <div className="w-full bg-indigo-950 text-indigo-100 border-b border-indigo-800/60">
        <div className="w-full px-4 lg:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="px-1.5 py-0.2 rounded bg-indigo-800 text-amber-300 font-bold text-[10px]">
              თანამშრომლის შეტყობინება (Live)
            </span>
            <span>
              თანამშრომელ <strong>{targetName}</strong>-ს საიტზე ყოფნისას ეკრანზე უჩანს:{' '}
              <em className="text-white font-semibold not-italic">
                „ყურადღება: ამჟამად თქვენს სამუშაო გარემოს ათვალიერებს ფინანსური ანალიტიკოსი ({analystName})“
              </em>
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-300">
            Live სიგნალი აქტიურია
          </span>
        </div>
      </div>
    </aside>
  );
}
