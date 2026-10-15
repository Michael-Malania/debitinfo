'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { analyticsService } from '@/services';
import { MacroIndicator, DebtAgingBucket, SectorRisk } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Layers, 
  Download, 
  Filter, 
  Activity, 
  PieChart, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function AnalystConsole() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [aging, setAging] = useState<DebtAgingBucket[]>([]);
  const [sectors, setSectors] = useState<SectorRisk[]>([]);
  const [scoringThreshold, setScoringThreshold] = useState<number>(650);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    async function load() {
      const [macro, age, sec] = await Promise.all([
        analyticsService.getMacroIndicators(),
        analyticsService.getAgingBuckets(),
        analyticsService.getSectorRisks()
      ]);
      setIndicators(macro);
      setAging(age);
      setSectors(sec);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Console Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">საკრედიტო რისკების ანალიტიკოსის კონსოლი</h1>
            </div>
            <p className="text-xs text-text-muted mt-1">
              მაკროეკონომიკური ინდიკატორები, პორტფელის ხანდაზმულობა და სკოარინგის მოდელები.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsCalibrating(true);
                setTimeout(() => setIsCalibrating(false), 600);
              }}
              className="px-3 py-2 rounded-xl border border-border-subtle hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>მონაცემთა განახლება</span>
            </button>
            <button
              onClick={() => alert('ანალიტიკური რეპორტი ექსპორტირებულია (PDF / XLSX).')}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>რეპორტის ექსპორტი</span>
            </button>
          </div>
        </div>

        {/* 1. Macro Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicators.map((ind, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-2">
              <span className="text-xs text-text-muted block line-clamp-1">{ind.label}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-text-primary">{ind.value}</span>
                <span className={`text-xs font-bold font-mono flex items-center gap-0.5 ${ind.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ind.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {ind.changePercent > 0 ? `+${ind.changePercent}%` : `${ind.changePercent}%`}
                </span>
              </div>
              <div className="text-[11px] text-text-muted">{ind.benchmark}</div>
            </div>
          ))}
        </div>

        {/* 2. Debt Aging Curve & Distribution */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-text-primary">დებიტორული დავალიანების ხანდაზმულობის სტრუქტურა (Aging Curve)</h2>
              <p className="text-xs text-text-muted">აქტიური მოთხოვნების განაწილება ვადაგადაცილების დღეების მიხედვით.</p>
            </div>
            <span className="text-xs font-mono font-semibold text-text-muted">მთლიანი მოცულობა: 18.45M ₾</span>
          </div>

          <div className="space-y-4">
            {/* Multi-segment visual bar */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
              {aging.map((bucket, i) => (
                <div
                  key={i}
                  style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }}
                  title={`${bucket.period}: ${bucket.percentage}%`}
                  className="h-full hover:opacity-90 transition-opacity"
                />
              ))}
            </div>

            {/* Grid of Buckets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {aging.map((bucket, i) => (
                <div key={i} className="p-4 rounded-2xl border border-border-subtle bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">{bucket.period}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: bucket.color }}>{bucket.percentage}%</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-text-primary">{bucket.amount.toLocaleString()} ₾</div>
                  <div className="text-[11px] text-text-muted">{bucket.count} რეგისტრირებული საქმე</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Dynamic Scoring Model Calibration & Sector Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scoring Calibration Simulator */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">საკრედიტო სკოარინგის მოდელის კალიბრაცია</h3>
                <p className="text-xs text-text-muted">შეცვალეთ ბარიერი და იხილეთ სავარაუდო დეფოლტის ცვლილება.</p>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-border-subtle">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-text-muted">მინიმალური სკოარინგის ზღვარი:</span>
                  <span className="font-bold font-mono text-primary text-sm">{scoringThreshold} ქულა</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={800}
                  step={5}
                  value={scoringThreshold}
                  onChange={(e) => setScoringThreshold(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-muted font-mono">
                  <span>500 (მაღალი რისკი)</span>
                  <span>650 (სტანდარტული)</span>
                  <span>800 (პრაიმ)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-border-subtle">
                  <span className="text-text-muted block text-[11px]">დამტკიცების მაჩვენებელი</span>
                  <span className="text-base font-bold font-mono text-text-primary">
                    {Math.round(85 - ((scoringThreshold - 500) / 300) * 40)}%
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-border-subtle">
                  <span className="text-text-muted block text-[11px]">პროგნოზირებული დეფოლტი</span>
                  <span className="text-base font-bold font-mono text-emerald-600">
                    {(6.8 - ((scoringThreshold - 500) / 300) * 3.5).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sector Risk Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">სექტორული რისკების ანალიზი</h3>
                <p className="text-xs text-text-muted">ვადაგადაცილებების კონცენტრაცია ინდუსტრიების მიხედვით.</p>
              </div>
            </div>

            <div className="space-y-3">
              {sectors.map((sec, i) => (
                <div key={i} className="p-4 rounded-2xl border border-border-subtle flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <span className="font-semibold text-xs text-text-primary block">{sec.sector}</span>
                    <span className="text-[11px] text-text-muted font-mono">პორტფელი: {sec.activeDebt.toLocaleString()} ₾</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-red-600">{sec.defaultProbability}% რისკი</div>
                    <span className="text-[10px] text-text-muted">
                      ტრენდი: {sec.volumeTrend === 'up' ? '↑ იზრდება' : sec.volumeTrend === 'down' ? '↓ მცირდება' : '→ სტაბილური'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
