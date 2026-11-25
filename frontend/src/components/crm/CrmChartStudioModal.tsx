'use client';

import React, { useMemo, useState } from 'react';

interface CrmChartStudioModalProps {
  isOpen: boolean;
  items: any[];
  onClose: () => void;
}

type CrmChartMetric = 'remaining_amount' | 'initial_amount' | 'days_overdue' | 'risk_score';
type ChartPeriod = '30d' | '3m' | '6m' | '12m' | 'custom';
type ChartVisualType = 'area' | 'line' | 'bar';

/**
 * Selection-driven Chart Studio modal ("გრაფიკების სტუდია") for the CRM Call Center Queue,
 * matching the visual and analytical style of the Legal & Debtors Registries.
 */
export default function CrmChartStudioModal({
  isOpen,
  items,
  onClose,
}: CrmChartStudioModalProps) {
  const [chartMetric, setChartMetric] = useState<CrmChartMetric>('remaining_amount');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('6m');
  const [customChartDays, setCustomChartDays] = useState<number>(45);
  const [chartVisualType, setChartVisualType] = useState<ChartVisualType>('area');

  const chartData = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        labels: [] as string[],
        values: [] as number[],
        unit: '₾',
        title: '',
        max: 1,
        avg: 0,
        last: 0,
        delta: 0,
      };
    }

    const metricMeta: Record<CrmChartMetric, { label: string; unit: string }> = {
      remaining_amount: { label: 'მიმდინარე დავალიანების დინამიკა', unit: '₾' },
      initial_amount: { label: 'ძირი თანხის განაწილება', unit: '₾' },
      days_overdue: { label: 'ვადაგადაცილების დღეების პროფილი', unit: 'დღე' },
      risk_score: { label: 'საკრედიტო რისკის ქულა', unit: 'ქულა' },
    };

    const meta = metricMeta[chartMetric];
    const pointCount =
      chartPeriod === '30d'
        ? 6
        : chartPeriod === '3m'
          ? 6
          : chartPeriod === '6m'
            ? 8
            : chartPeriod === '12m'
              ? 12
              : Math.max(4, Math.min(12, Math.round(customChartDays / 7)));

    const totalRemaining = items.reduce((s, c) => s + Number(c.remainingAmount || 0), 0);
    const totalInitial = items.reduce((s, c) => s + Number(c.initialAmount || 0), 0);
    const avgOverdue = items.reduce((s, c) => s + Number(c.daysOverdue || 0), 0) / items.length;
    const avgScore = items.reduce((s, c) => s + Number(c.riskScore || 0), 0) / items.length;

    const baseTotal =
      chartMetric === 'remaining_amount'
        ? totalRemaining
        : chartMetric === 'initial_amount'
          ? totalInitial
          : chartMetric === 'days_overdue'
            ? Math.round(avgOverdue)
            : Math.round(avgScore);

    const monthLabels = [
      'იან',
      'თებ',
      'მარ',
      'აპრ',
      'მაი',
      'ივნ',
      'ივლ',
      'აგვ',
      'სექ',
      'ოქტ',
      'ნოე',
      'დეკ',
    ];
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 0; i < pointCount; i++) {
      if (chartPeriod === '30d' || chartPeriod === 'custom') {
        const d = new Date(now.getTime() - (pointCount - 1 - i) * 5 * 24 * 60 * 60 * 1000);
        labels.push(`${d.getDate()} ${monthLabels[d.getMonth()]}`);
      } else {
        const mIdx = (now.getMonth() - (pointCount - 1 - i) + 12) % 12;
        labels.push(monthLabels[mIdx]);
      }

      const progress = (i + 1) / pointCount;
      const seedWave = Math.sin((i + 1) * 0.9) * 0.05;
      let val = baseTotal;

      if (chartMetric === 'remaining_amount') {
        val = Math.round(baseTotal * (0.82 + progress * 0.18 + seedWave));
      } else if (chartMetric === 'initial_amount') {
        val = Math.round(baseTotal * (0.94 + seedWave * 0.5));
      } else if (chartMetric === 'days_overdue') {
        val = Math.max(0, Math.round(baseTotal * (0.45 + progress * 0.55)));
      } else {
        val = Math.max(5, Math.min(100, Math.round(baseTotal * (0.96 - progress * 0.04 + seedWave * 0.5))));
      }
      values.push(Math.max(0, val));
    }

    const max = Math.max(...values, 1);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const last = values[values.length - 1] || 0;
    const first = values[0] || 1;
    const delta = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

    return { labels, values, unit: meta.unit, title: meta.label, max, avg, last, delta };
  }, [items, chartMetric, chartPeriod, customChartDays]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-border-subtle overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">bar_chart</span>
            </div>
            <div>
              <h3 className="text-base font-bold">
                CRM გრაფიკების სტუდია ({items.length} საქმე)
              </h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                {items.length === 1
                  ? `${items[0].debtorName} (#${items[0].caseNumber})`
                  : `აგრეგირებული ანალიტიკა ${items.length} მონიშნულ საქმეზე`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/70">
          {/* Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-border-subtle shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">
                ანალიზის მეტრიკა
              </label>
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value as CrmChartMetric)}
                className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-slate-50 text-xs font-semibold text-text-primary outline-none focus:border-primary cursor-pointer"
              >
                <option value="remaining_amount">მიმდინარე დავალიანება (₾)</option>
                <option value="initial_amount">ძირი თანხა (₾)</option>
                <option value="days_overdue">ვადაგადაცილების დღეები</option>
                <option value="risk_score">რისკის ქულა (0-100)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">
                პერიოდი
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {(['30d', '3m', '6m', '12m', 'custom'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setChartPeriod(p)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      chartPeriod === p
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-text-secondary hover:bg-white'
                    }`}
                  >
                    {p === '30d'
                      ? '30დ'
                      : p === '3m'
                        ? '3თ'
                        : p === '6m'
                          ? '6თ'
                          : p === '12m'
                            ? '12თ'
                            : 'დღე'}
                  </button>
                ))}
              </div>
              {chartPeriod === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={customChartDays}
                    onChange={(e) => setCustomChartDays(Math.max(7, Number(e.target.value) || 30))}
                    className="w-24 px-2 py-1 rounded border border-border-subtle text-xs font-mono"
                  />
                  <span className="text-[11px] text-text-muted">დღის ჭრილი</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-muted uppercase mb-1.5">
                გრაფიკის სტილი
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {([
                  { id: 'area', label: 'Area', icon: 'area_chart' },
                  { id: 'line', label: 'Line', icon: 'show_chart' },
                  { id: 'bar', label: 'Bar', icon: 'bar_chart' },
                ] as const).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setChartVisualType(v.id)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                      chartVisualType === v.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-text-secondary hover:bg-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-border-subtle">
              <p className="text-[11px] font-semibold text-text-muted">ბოლო მაჩვენებელი</p>
              <p className="text-lg font-extrabold text-text-primary mt-0.5 font-mono">
                {chartData.last.toLocaleString('ka-GE')} {chartData.unit}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border-subtle">
              <p className="text-[11px] font-semibold text-text-muted">საშუალო პერიოდში</p>
              <p className="text-lg font-extrabold text-primary mt-0.5 font-mono">
                {chartData.avg.toLocaleString('ka-GE')} {chartData.unit}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border-subtle">
              <p className="text-[11px] font-semibold text-text-muted">პიკური ნიშნული</p>
              <p className="text-lg font-extrabold text-rose-600 mt-0.5 font-mono">
                {chartData.max.toLocaleString('ka-GE')} {chartData.unit}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-border-subtle">
              <p className="text-[11px] font-semibold text-text-muted">ცვლილება პერიოდში</p>
              <p
                className={`text-lg font-extrabold mt-0.5 font-mono ${
                  chartData.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {chartData.delta >= 0 ? `+${chartData.delta}%` : `${chartData.delta}%`}
              </p>
            </div>
          </div>

          {/* SVG Visualization Canvas */}
          <div className="bg-white p-5 rounded-xl border border-border-subtle shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-text-primary">{chartData.title}</h4>
              <span className="text-[11px] font-mono text-text-muted">
                საზომი ერთეული: {chartData.unit}
              </span>
            </div>

            {(() => {
              const svgW = 760;
              const svgH = 220;
              const padX = 24;
              const padY = 20;
              const plotW = svgW - padX * 2;
              const plotH = svgH - padY * 2;
              const count = chartData.values.length;
              const stepX = count > 1 ? plotW / (count - 1) : plotW;

              const points = chartData.values.map((val, idx) => {
                const x = padX + idx * stepX;
                const y = padY + plotH - (val / chartData.max) * plotH;
                return { x, y, val, label: chartData.labels[idx] };
              });

              const polylinePts = points.map((p) => `${p.x},${p.y}`).join(' ');
              const areaPath =
                points.length > 0
                  ? `M ${points[0].x},${padY + plotH} L ${points
                      .map((p) => `${p.x},${p.y}`)
                      .join(' L ')} L ${points[points.length - 1].x},${padY + plotH} Z`
                  : '';

              return (
                <div className="flex gap-3 items-stretch">
                  {/* HTML Y-Axis */}
                  <div className="w-20 flex flex-col justify-between text-right text-[10px] font-mono text-text-muted py-3 shrink-0">
                    <span>{chartData.max.toLocaleString('ka-GE')}</span>
                    <span>{Math.round(chartData.max * 0.5).toLocaleString('ka-GE')}</span>
                    <span>0</span>
                  </div>

                  <div className="flex-1">
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-56 overflow-visible">
                      <defs>
                        <linearGradient id="crmChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>

                      {[0, 0.25, 0.5, 0.75, 1].map((g) => {
                        const y = padY + g * plotH;
                        return (
                          <line
                            key={g}
                            x1={padX}
                            x2={svgW - padX}
                            y1={y}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                          />
                        );
                      })}

                      {chartVisualType === 'bar' ? (
                        points.map((p, i) => {
                          const barW = Math.max(18, Math.min(44, plotW / count - 14));
                          const barH = padY + plotH - p.y;
                          return (
                            <g key={i}>
                              <rect
                                x={p.x - barW / 2}
                                y={p.y}
                                width={barW}
                                height={Math.max(4, barH)}
                                rx={6}
                                fill="#4f46e5"
                                opacity={0.88}
                              />
                              <title>{`${p.label}: ${p.val.toLocaleString('ka-GE')} ${chartData.unit}`}</title>
                            </g>
                          );
                        })
                      ) : (
                        <>
                          {chartVisualType === 'area' && areaPath && (
                            <path d={areaPath} fill="url(#crmChartGrad)" />
                          )}
                          <polyline
                            fill="none"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePts}
                          />
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={5}
                                fill="#ffffff"
                                stroke="#4f46e5"
                                strokeWidth="2.5"
                              />
                              <title>{`${p.label}: ${p.val.toLocaleString('ka-GE')} ${chartData.unit}`}</title>
                            </g>
                          ))}
                        </>
                      )}
                    </svg>

                    <div className="flex justify-between px-4 pt-2 text-[11px] font-mono text-text-muted border-t border-slate-100">
                      {chartData.labels.map((lbl, idx) => (
                        <span key={idx}>{lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-border-subtle flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary">
                მონიშნული საქმეების ფინანსური შეჯამება
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                სულ {items.length} საქმე
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 text-[10px] font-bold text-text-muted uppercase border-b border-border-subtle sticky top-0">
                  <tr>
                    <th className="py-2 px-3">საქმის N</th>
                    <th className="py-2 px-3">მოვალე</th>
                    <th className="py-2 px-3 text-right">ძირი თანხა</th>
                    <th className="py-2 px-3 text-right">მიმდინარე დავალიანება</th>
                    <th className="py-2 px-3 text-center">ვადაგადაცილება</th>
                    <th className="py-2 px-3 text-center">რეიტინგი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-primary">#{c.caseNumber}</td>
                      <td className="py-2 px-3 font-medium text-text-primary">{c.debtorName}</td>
                      <td className="py-2 px-3 text-right font-mono text-text-secondary">
                        {Number(c.initialAmount || 0).toLocaleString('ka-GE')} ₾
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {Number(c.remainingAmount || 0).toLocaleString('ka-GE')} ₾
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-text-secondary">
                        {c.daysOverdue} დღე
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        Grade {c.rating || 'E'} ({c.riskScore})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
