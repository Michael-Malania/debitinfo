'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function ImpersonationBanner() {
  const pathname = usePathname();
  const router = useRouter();
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

  if (!impersonation.isImpersonating) {
    return null;
  }

  const handleReturn = () => {
    const returnUrl = authService.stopImpersonation();
    window.dispatchEvent(new Event('impersonation-changed'));
    window.location.href = returnUrl || '/analyst/staff';
  };

  const targetName = impersonation.targetUser?.name || impersonation.targetUser?.email || 'თანამშრომელი';
  const targetRole = impersonation.targetUser?.role || 'თანამშრომელი';

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OPERATOR':
        return 'ქოლ-ცენტრის ოპერატორი';
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

  return (
    <aside aria-label="მონიტორინგის რეჟიმის შეტყობინება" className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-md border-b border-white/20 select-none">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="font-bold tracking-wide">მონიტორინგის რეჟიმი:</span>
            <span>
              თქვენ აკვირდებით თანამშრომელ <strong className="underline underline-offset-2 decoration-white/60 font-bold">{targetName}</strong>-ს ({getRoleLabel(targetRole)}) სამუშაო გარემოს
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
    </aside>
  );
}
