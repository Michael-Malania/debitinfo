'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Globe, 
  Briefcase, 
  UserCheck, 
  User, 
  BarChart3, 
  Scale, 
  Headphones, 
  ShieldCheck, 
  MapPin, 
  Info, 
  PhoneCall, 
  Users, 
  ChevronDown, 
  ChevronUp,
  Layers
} from 'lucide-react';

interface PortalLink {
  href: string;
  nameKa: string;
  badge: string;
  icon: React.ReactNode;
  category: 'Public' | 'Client' | 'Operations';
}

const PORTALS: PortalLink[] = [
  { href: '/', nameKa: 'მთავარი (Landing)', badge: 'Public', icon: <Globe className="w-3.5 h-3.5" />, category: 'Public' },
  { href: '/about', nameKa: 'ჩვენს შესახებ', badge: 'Public', icon: <Info className="w-3.5 h-3.5" />, category: 'Public' },
  { href: '/contact', nameKa: 'კონტაქტი', badge: 'Public', icon: <PhoneCall className="w-3.5 h-3.5" />, category: 'Public' },
  { href: '/register', nameKa: 'რეგისტრაცია', badge: 'Auth', icon: <UserCheck className="w-3.5 h-3.5" />, category: 'Public' },
  
  { href: '/creditor', nameKa: 'კრედიტორის კაბინეტი', badge: 'Client', icon: <Briefcase className="w-3.5 h-3.5" />, category: 'Client' },
  { href: '/debtor', nameKa: 'დებიტორის კაბინეტი', badge: 'Client', icon: <User className="w-3.5 h-3.5" />, category: 'Client' },
  { href: '/profile', nameKa: 'სუფთა პროფილი (A)', badge: 'Client', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />, category: 'Client' },
  
  { href: '/analyst', nameKa: 'ანალიტიკოსის კონსოლი', badge: 'Ops', icon: <BarChart3 className="w-3.5 h-3.5" />, category: 'Operations' },
  { href: '/legal', nameKa: 'იურისტის კაბინეტი', badge: 'Ops', icon: <Scale className="w-3.5 h-3.5" />, category: 'Operations' },
  { href: '/crm', nameKa: 'CRM ოპერატორი', badge: 'Ops', icon: <Headphones className="w-3.5 h-3.5" />, category: 'Operations' },
  { href: '/field-officer', nameKa: 'საველე ოფიცერი', badge: 'Ops', icon: <MapPin className="w-3.5 h-3.5" />, category: 'Operations' },
  { href: '/hr', nameKa: 'HR & ადმინი', badge: 'Admin', icon: <Users className="w-3.5 h-3.5" />, category: 'Operations' },
];

export default function PortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const currentPortal = PORTALS.find(p => p.href === pathname) || PORTALS[0];

  return (
    <div className="sticky top-0 z-[100] bg-slate-900 text-white text-xs border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-primary-fixed">
            <Layers className="w-4 h-4 text-accent-mint" />
            <span>Debitinfo.GE სისტემის პორტალები:</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-white font-medium text-[11px] flex items-center gap-1">
              {currentPortal.icon}
              {currentPortal.nameKa}
            </span>
            <span className="text-slate-400 text-[11px] font-mono">12 აქტიური მოდული</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-[11px]"
          >
            <span>გვერდების ჩამონათვალი ({PORTALS.length})</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PORTALS.map((portal) => {
              const isActive = pathname === portal.href;
              return (
                <Link
                  key={portal.href}
                  href={portal.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-400 group-hover:text-white">{portal.icon}</span>
                    <span className="truncate">{portal.nameKa}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {portal.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
