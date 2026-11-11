'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DecommissionedAnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Seamless automatic redirect to the unified analyst console
    router.replace('/analyst');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center shadow-lg space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">hub</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          ანალიტიკა ინტეგრირებულია მთავარ კონსოლში
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          მონაცემთა დუბლირების თავიდან ასაცილებლად, მომხმარებელთა და კრედიტორთა გრაფიკები გადატანილია მთავარ რეესტრში, რისკ ზონა — მთავარ კონსოლში, ხოლო პერსონალის ანალიტიკა — თანამშრომელთა რეესტრში.
        </p>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <span>გადამისამართება მთავარ კონსოლზე...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
