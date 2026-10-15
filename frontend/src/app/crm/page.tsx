'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { crmService } from '@/services';
import { CallQueueItem, CallInteractionLog } from '@/types';
import { 
  PhoneCall, 
  PhoneOff, 
  PhoneForwarded, 
  Clock, 
  User, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Send, 
  FileCheck2, 
  Headphones 
} from 'lucide-react';

export default function CrmOperatorPage() {
  const [queue, setQueue] = useState<CallQueueItem[]>([]);
  const [logs, setLogs] = useState<CallInteractionLog[]>([]);
  const [activeCall, setActiveCall] = useState<CallQueueItem | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [disposition, setDisposition] = useState<'promise_to_pay' | 'callback' | 'refused' | 'voicemail'>('promise_to_pay');
  const [ptpAmount, setPtpAmount] = useState<string>('1500');
  const [ptpDate, setPtpDate] = useState<string>('2024-10-28');
  const [callNote, setCallNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [q, l] = await Promise.all([
        crmService.getCallQueue(),
        crmService.getCallLogs()
      ]);
      setQueue(q);
      setLogs(l);
      if (q.length > 0) setActiveCall(q[0]);
    }
    load();
  }, []);

  useEffect(() => {
    let timer: any;
    if (activeCall) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCall) return;

    await crmService.logInteraction({
      operatorName: 'ოპერატორი #12',
      disposition,
      promisedAmount: disposition === 'promise_to_pay' ? Number(ptpAmount) : undefined,
      promisedDate: disposition === 'promise_to_pay' ? ptpDate : undefined,
      notes: callNote || 'კომუნიკაცია დასრულდა წარმატებით.'
    });

    showToast(`შედეგი შენახულია ${activeCall.debtorName}-ს საქმეში.`);
    setCallNote('');
    setCallDuration(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">CRM ოპერატორის საკოლცენტრე კონსოლი</h1>
              <p className="text-xs text-text-muted">მოვალეებთან კომუნიკაციის ისტორია, ზარების რიგი და დაპირებები.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white border border-border-subtle">
              ცვლა: <span className="font-bold text-emerald-600">აქტიური</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-border-subtle">
              შესრულებული ზარები: <span className="font-bold text-primary">34</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Left Queue, Right Active Call & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Caller Queue (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-border-subtle shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">ზარების რიგი (Queue)</h3>
                <span className="text-xs font-mono text-primary font-bold">{queue.length} მოვალე</span>
              </div>

              <div className="space-y-3">
                {queue.map((item) => {
                  const isSelected = activeCall?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveCall(item);
                        setCallDuration(0);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all space-y-1.5 ${
                        isSelected
                          ? 'border-primary bg-blue-50/50 shadow-xs'
                          : 'border-border-subtle hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-text-primary">{item.debtorName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority === 'high' ? 'მაღალი' : 'საშუალო'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-text-muted">პ/ნ: {item.personalId} • {item.phone}</div>
                      <div className="text-[11px] font-semibold text-primary font-mono">დავალიანება: {item.debtAmount.toLocaleString()} ₾</div>
                      <div className="text-[10px] text-text-muted italic truncate">{item.lastDisposition}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Active Softphone & Action Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activeCall ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
                {/* Active Call Status Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{activeCall.debtorName}</div>
                      <div className="text-xs text-slate-400 font-mono">{activeCall.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">საუბრის დრო</span>
                      <span className="text-lg font-mono font-bold text-emerald-400">{formatTimer(callDuration)}</span>
                    </div>
                    <button
                      onClick={() => showToast('ზარი დასრულებულია.')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>დასრულება</span>
                    </button>
                  </div>
                </div>

                {/* Call Disposition Form */}
                <form onSubmit={handleSaveInteraction} className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-2">ზარის შედეგი (Disposition)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'promise_to_pay', label: 'დაპირება (PTP)' },
                        { id: 'callback', label: 'გადარეკვა' },
                        { id: 'refused', label: 'უარი გადახდაზე' },
                        { id: 'voicemail', label: 'არ უპასუხა' }
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDisposition(d.id as any)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                            disposition === d.id
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-slate-100 text-text-muted hover:bg-slate-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {disposition === 'promise_to_pay' && (
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted">დაპირებული თანხა (₾)</label>
                        <input
                          type="number"
                          value={ptpAmount}
                          onChange={(e) => setPtpAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs font-mono font-bold text-text-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-text-muted">შეთანხმებული გადახდის თარიღი</label>
                        <input
                          type="date"
                          value={ptpDate}
                          onChange={(e) => setPtpDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs font-mono text-text-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">ოპერატორის კომენტარი / შენიშვნა</label>
                    <textarea
                      rows={3}
                      value={callNote}
                      onChange={(e) => setCallNote(e.target.value)}
                      placeholder="ჩაიწერეთ საუბრის დეტალები, შეთანხმებული პირობები ან მოვალის არგუმენტები..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => showToast(`შეხსენების SMS შაბლონი გაიგზავნა ${activeCall.phone}-ზე.`)}
                        className="px-3 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-text-primary hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>SMS შაბლონი</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      შედეგის შენახვა
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-text-muted border border-border-subtle">
                აირჩიეთ მოვალე რიგიდან ზარის დასაწყებად.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
