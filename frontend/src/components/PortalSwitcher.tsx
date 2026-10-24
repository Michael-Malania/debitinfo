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
  X,
  Layers
} from 'lucide-react';

interface PortalLink {
  href: string;
  nameKa: string;
  badge: string;
  icon: React.ReactNode;
}

const PORTALS: PortalLink[] = [
  { href: '/', nameKa: 'მთავარი გვერდი (Landing Page)', badge: 'Public', icon: <Globe className="w-4 h-4" /> },
  { href: '/login', nameKa: 'ავტორიზაცია (შესვლა)', badge: 'Auth', icon: <UserCheck className="w-4 h-4" /> },
  { href: '/register', nameKa: 'რეგისტრაცია', badge: 'Auth', icon: <UserCheck className="w-4 h-4" /> },
  { href: '/dashboard', nameKa: 'ერთიანი სამუშაო კაბინეტი (Dashboard)', badge: 'Dashboard', icon: <User className="w-4 h-4" /> },
  { href: '/analyst', nameKa: 'ანალიტიკოსის კონსოლი', badge: 'Analyst', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/legal', nameKa: 'იურისტის კაბინეტი & სააღსრულებო', badge: 'Legal', icon: <Scale className="w-4 h-4" /> },
  { href: '/crm', nameKa: 'CRM ოპერატორის საკოლცენტრე', badge: 'CRM', icon: <Headphones className="w-4 h-4" /> },
  { href: '/profile', nameKa: 'სუფთა საკრედიტო პროფილი (A)', badge: 'Prime', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
  { href: '/field-officer', nameKa: 'საველე ოფიცრის სამუშაო პანელი', badge: 'Field Ops', icon: <MapPin className="w-4 h-4" /> },
  { href: '/about', nameKa: 'ჩვენს შესახებ & მედიაცია', badge: 'About', icon: <Info className="w-4 h-4" /> },
  { href: '/contact', nameKa: 'კონტაქტი & ცხელი ხაზი', badge: 'Contact', icon: <PhoneCall className="w-4 h-4" /> },
  { href: '/hr', nameKa: 'HR & სისტემური ადმინისტრატორი', badge: 'Admin', icon: <Users className="w-4 h-4" /> },
];

export default function PortalSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const currentPortal = PORTALS.find(p => p.href === pathname) || PORTALS[0];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-2xl border border-slate-700 transition-all hover:scale-105 active:scale-95 text-xs font-semibold"
          title="პორტალების გადამრთველი"
        >
          <Layers className="w-4 h-4 text-accent-mint animate-pulse" />
          <span>პორტალები ({PORTALS.length})</span>
          <span className="w-2 h-2 rounded-full bg-accent-mint" />
        </button>
      </div>

      {/* Floating Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent-mint" />
                <h3 className="font-bold text-sm text-white">Debitinfo.GE სისტემის პორტალები</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {PORTALS.map((portal) => {
                const isActive = pathname === portal.href;
                return (
                  <Link
                    key={portal.href}
                    href={portal.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary text-white font-bold shadow-md ring-1 ring-white/20'
                        : 'bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{portal.icon}</span>
                      <span className="text-xs truncate">{portal.nameKa}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 ml-2 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {portal.badge}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
