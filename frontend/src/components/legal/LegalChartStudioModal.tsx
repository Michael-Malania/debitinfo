'use client';

import React, { useMemo, useState } from 'react';
import { DetailedLegalCase } from '@/types';

interface LegalChartStudioModalProps {
  isOpen: boolean;
  items: DetailedLegalCase[];
  onClose: () => void;
}

type LegalChartMetric = 'total_claim' | 'principal_amount' | 'overdue_days' | 'risk_score';
type ChartPeriod = '30d' | '3m' | '6m' | '12m' | 'custom';
type ChartVisualType = 'area' | 'line' | 'bar';

/**
 * Selection-driven Chart Studio modal ("გრაფიკების სტუდია") for Legal Registry,
 * matching the visual and analytical style of the Analyst Debtors Registry.
 */
export default function LegalChartStudioModal({
  isOpen,
  items,
  onClose,
}: LegalChartStudioModalProps) {
  const [chartMetric, setChartMetric] = useState<LegalChartMetric>('total_claim');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6m');
  const [customChartDays, setCustomChartDays] = useState<number>(45);
  const [chartVisualType, setChartVisualType] = useState<ChartVisualType>('area');

  const chartData = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        labels: [] as string[],
        values: [] as number[],
        unit: '₾',
        metricTitle: '',
        maxValue: 1,
        average: 0,
        aggregateSum: 0,
      };
    }

    let labels: string[] = [];
    if (chartPeriod === '30d') {
      labels = ['1 კვირა', '2 კვირა', '3 კვირა', '4 კვირა'];
    } else if (chartPeriod === '3m') {
      labels = ['თვე 1', 'თვე 2', 'თვე 3'];
    } else if (chartPeriod === '6m') {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ'];
    } else if (chartPeriod === '12m') {
      labels = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
    } else {
      const days = Math.max(1, Math.min(1825, customChartDays || 45));
      if (days <= 7) {
        labels = Array.from({ length: days }, (_, i) => `დღე ${i + 1}`);
      } else {
        const count = 6;
        labels = Array.from({ length: count }, (_, i) => `${Math.round(((i + 1) / count) * days)} დღე`);
      }
    }

    const totalDisputed = items.reduce((s, c) => s + Number(c.amounts.totalClaim || 0), 0);
    const totalPrincipal = items.reduce((s, c) => s + Number(c.amounts.principalAmount || 0), 0);
    const avgOverdue = Math.round(
      items.reduce((s, c) => s + Number(c.amounts.daysOverdue || 0), 0) / items.length
    );
    const avgRisk = Math.round(
      items.reduce((s, c) => s + Number(c.amounts.riskScore || 50), 0) / items.length
    );

    let values: number[] = [];
    let unit = '₾';
    let metricTitle = '';
    const n = labels.length;

    if (chartMetric === 'total_claim') {
      unit = '₾';
      metricTitle = `მონიშნული ${items.length} იურიდიული საქმის სადავო მოთხოვნის დინამიკა`;
      values = labels.map((_, i) =>
        Math.max(100, Math.round(totalDisputed * (0.82 + (i / Math.max(1, n - 1)) * 0.18 + Math.sin(i + 1) * 0.03)))
      );
    } else if (chartMetric === 'principal_amount') {
      unit = '₾';
      metricTitle = `მონიშნული ${items.length} საქმის ძირითადი თანხის სტრუქტურა`;
      values = labels.map((_, i) =>
        Math.max(100, Math.round(totalPrincipal * (0.9 + Math.cos(i) * 0.05)))
      );
    } else if (chartMetric === 'overdue_days') {
      unit = 'დღე';
      metricTitle = `საშუალო ვადაგადაცილების დინამიკა (${items.length} საქმე)`;
      values = labels.map((_, i) =>
        Math.max(1, Math.round(avgOverdue * (0.7 + (i / Math.max(1, n - 1)) * 0.3)))
      );
    } else {
      unit = 'ქულა';
      metricTitle = `საშუალო სამართლებრივი რისკ-ინდექსი (0-100)`;
      values = labels.map((_, i) =>
        Math.min(100, Math.max(10, Math.round(avgRisk + Math.sin(i + 1) * 8)))
      );
    }

    const maxValue = Math.max(1, ...values);
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    return {
      labels,
      values,
      unit,
      metricTitle,
      maxValue,
      average,
      aggregateSum: totalDisputed,
    };
  }, [items, chartMetric, chartPeriod, customChartDays]);

  if (!isOpen) return null;

  const polylinePoints = chartData.values
    .map((val, idx) => {
      const x =
        chartData.values.length > 1
          ? (idx / (chartData.values.length - 1)) * 1000
          : 500;
      const y = 200 - (val / chartData.maxValue) * 180;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPath =
    chartData.values.length > 1
      ? `M 0,200 L ${polylinePoints
          .split(' ')
          .join(' L ')} L 1000,200 Z`
      : '';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold shadow-inner">
              <span className="material-symbols-outlined text-2xl">bar_chart</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  იურიდიული საქმეების გრაფიკების სტუდია
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold font-mono">
                  {items.length} ჩანაწერი
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                მონიშნულ მონაცემებზე აგებული დინამიკა • საერთო სადავო მოცულობა:{' '}
                <strong className="text-white font-mono">
                  {chartData.aggregateSum.toLocaleString('ka-GE')} ₾
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <span className="material-symbols-outlined text-[16px] text-rose-400">
                picture_as_pdf
              </span>
              <span>PDF / ბეჭდვა</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-xl transition cursor-pointer"
              title="დახურვა"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Metric Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">მაჩვენებელი:</span>
              {(
                [
                  { id: 'total_claim', label: 'სადავო დავალიანება' },
                  { id: 'principal_amount', label: 'ძირითადი თანხა' },
                  { id: 'overdue_days', label: 'ვადაგადაცილება (დღე)' },
                  { id: 'risk_score', label: 'რისკ-ქულა' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMetric(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    chartMetric === m.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Period & Visual Type */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(
                  [
                    { id: '30d', label: '30 დღე' },
                    { id: '3m', label: '3 თვე' },
                    { id: '6m', label: '6 თვე' },
                    { id: '12m', label: '12 თვე' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChartPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      chartPeriod === p.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition cursor-pointer ${
                    chartPeriod === 'custom'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                  onClick={() => setChartPeriod('custom')}
                >
                  <input
                    type="number"
                    min={1}
                    max={1825}
                    value={customChartDays}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCustomChartDays(isNaN(v) ? 1 : Math.max(1, Math.min(1825, v)));
                      setChartPeriod('custom');
                    }}
                    className="w-12 text-center py-0.5 px-1 bg-white border border-slate-300 rounded font-mono text-xs focus:outline-none"
                  />
                  <span className="text-[11px] pr-0.5 font-medium">დღე</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(
                  [
                    { id: 'area', label: 'არეალური', icon: 'area_chart' },
                    { id: 'line', label: 'ხაზოვანი', icon: 'show_chart' },
                    { id: 'bar', label: 'სვეტოვანი', icon: 'bar_chart' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setChartVisualType(v.id)}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                      chartVisualType === v.id
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{chartData.metricTitle}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {items.length} მონიშნული/გაფილტრული საქმე
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="p-2 rounded-lg bg-white border border-slate-200">
                საშუალო:{' '}
                <strong className="text-slate-800">
                  {chartData.average.toLocaleString('ka-GE')} {chartData.unit}
                </strong>
              </span>
              <span className="p-2 rounded-lg bg-white border border-slate-200">
                მაქსიმუმი:{' '}
                <strong className="text-blue-700">
                  {chartData.maxValue.toLocaleString('ka-GE')} {chartData.unit}
                </strong>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex h-64 sm:h-72 w-full gap-3 items-stretch">
              <div className="w-28 shrink-0 flex flex-col justify-between py-1 text-right pr-2 text-xs font-mono font-medium text-slate-500 select-none border-r border-slate-100">
                <span>
                  {chartData.maxValue.toLocaleString('ka-GE')} {chartData.unit}
                </span>
                <span>
                  {Math.round(chartData.maxValue * 0.75).toLocaleString('ka-GE')} {chartData.unit}
                </span>
                <span>
                  {Math.round(chartData.maxValue * 0.5).toLocaleString('ka-GE')} {chartData.unit}
                </span>
                <span>
                  {Math.round(chartData.maxValue * 0.25).toLocaleString('ka-GE')} {chartData.unit}
                </span>
                <span>0 {chartData.unit}</span>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 relative">
                  <svg
                    viewBox="0 0 1000 220"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="legalChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 20 + ratio * 180;
                      return (
                        <line
                          key={idx}
                          x1="0"
                          y1={y}
                          x2="1000"
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {chartVisualType === 'bar' ? (
                      chartData.values.map((val, idx) => {
                        const slotW = 1000 / chartData.values.length;
                        const barW = Math.min(72, slotW * 0.55);
                        const x = idx * slotW + (slotW - barW) / 2;
                        const h = (val / chartData.maxValue) * 180;
                        const y = 200 - h;
                        return (
                          <rect
                            key={idx}
                            x={x}
                            y={y}
                            width={barW}
                            height={Math.max(4, h)}
                            rx={6}
                            fill="#4f46e5"
                            opacity={0.85}
                          />
                        );
                      })
                    ) : (
                      <>
                        {chartVisualType === 'area' && areaPath && (
                          <path d={areaPath} fill="url(#legalChartGradient)" />
                        )}
                        <polyline
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylinePoints}
                        />
                        {chartData.values.map((val, idx) => {
                          const x =
                            chartData.values.length > 1
                              ? (idx / (chartData.values.length - 1)) * 1000
                              : 500;
                          const y = 200 - (val / chartData.maxValue) * 180;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="5"
                              fill="#ffffff"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                          );
                        })}
                      </>
                    )}
                  </svg>
                </div>

                {/* X-Axis Labels */}
                <div className="flex items-center justify-between pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-100">
                  {chartData.labels.map((lbl, idx) => (
                    <span key={idx} className="text-center">
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Table inside Chart Studio */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">საქმის N</th>
                  <th className="py-2.5 px-4">მოვალე</th>
                  <th className="py-2.5 px-4">კრედიტორი</th>
                  <th className="py-2.5 px-4 text-right">ძირითადი თანხა</th>
                  <th className="py-2.5 px-4 text-right">სრული მოთხოვნა</th>
                  <th className="py-2.5 px-4 text-right">ვადაგადაცილება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.slice(0, 10).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono font-bold text-blue-700">
                      #{c.caseNumber}
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-900">{c.debtor.name}</td>
                    <td className="py-2 px-4 text-slate-600">{c.creditorName || '—'}</td>
                    <td className="py-2 px-4 text-right font-mono text-slate-700">
                      {c.amounts.principalAmount.toLocaleString('ka-GE')} ₾
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-rose-600">
                      {c.amounts.totalClaim.toLocaleString('ka-GE')} ₾
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-amber-700">
                      {c.amounts.daysOverdue} დღე
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
