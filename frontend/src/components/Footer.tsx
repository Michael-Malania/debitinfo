import React from 'react';
import Link from 'next/link';
import { Shield, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">assured_workload</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Debitinfo<span className="text-primary-container">.GE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              საქართველოს ეროვნული სადებიტო რეესტრი და საკრედიტო რისკების მონიტორინგის ერთიანი ციფრული ეკოსისტემა.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Shield className="w-4 h-4" />
              <span>RS.GE და საჯარო რეესტრთან სინქრონიზებული</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">მოდულები</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/creditor" className="hover:text-white transition-colors">კრედიტორის კაბინეტი</Link></li>
              <li><Link href="/debtor" className="hover:text-white transition-colors">მოვალის კაბინეტი & დავები</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">სუფთა საკრედიტო პროფილი (A)</Link></li>
              <li><Link href="/analyst" className="hover:text-white transition-colors">რისკების ანალიტიკოსის კონსოლი</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">იურიდიული საქმისწარმოება</Link></li>
            </ul>
          </div>

          {/* Operations & Public */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">სისტემა</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/crm" className="hover:text-white transition-colors">CRM ოპერატორის სამუშაო მაგიდა</Link></li>
              <li><Link href="/field-officer" className="hover:text-white transition-colors">საველე მონიტორინგის აპლიკაცია</Link></li>
              <li><Link href="/hr" className="hover:text-white transition-colors">HR & ადმინისტრატორი</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">მედიაციის პლატფორმის შესახებ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">ცხელი ხაზი და მხარდაჭერა</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider">კონტაქტი</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-container" />
                <span>+995 32 2 100 200</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-container" />
                <span>info@debitinfo.ge</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-container mt-0.5 shrink-0" />
                <span>ქ. თბილისი, ჭავჭავაძის გამზ. 37მ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Debitinfo.GE. ყველა უფლება დაცულია.</p>
          <div className="flex items-center gap-4">
            <span>კონფიდენციალურობის პოლიტიკა</span>
            <span>•</span>
            <span>მომსახურების პირობები</span>
            <span>•</span>
            <span>უსაფრთხოების სტანდარტები</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
