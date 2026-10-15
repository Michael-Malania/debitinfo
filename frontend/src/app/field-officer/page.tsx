'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fieldOfficerService } from '@/services';
import { FieldVisitTask } from '@/types';
import { 
  MapPin, 
  Navigation, 
  Camera, 
  PenTool, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  User, 
  FileCheck2,
  X
} from 'lucide-react';

export default function FieldOfficerPage() {
  const [tasks, setTasks] = useState<FieldVisitTask[]>([]);
  const [activeTask, setActiveTask] = useState<FieldVisitTask | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signNotes, setSignNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fieldOfficerService.getTasks();
      setTasks(data);
      if (data.length > 0) setActiveTask(data[0]);
    }
    load();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCompleteVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    showToast(`ვიზიტის ანგარიში #${activeTask.id} შენახულია ელექტრონული ხელმოწერით.`);
    setIsSignModalOpen(false);
    setSignNotes('');
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
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">საველე ოფიცრის სამუშაო პანელი</h1>
              <p className="text-xs text-text-muted">ადგილზე ინსპექცია, გეოლოკაცია, ფოტო-ფიქსაცია და ციფრული ხელმოწერა.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GPS ონლაინ რეჟიმი</span>
            </span>
          </div>
        </div>

        {/* 2-Column Route Itinerary + Inspector Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tasks Route List (4 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-border-subtle shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary">დღის მარშრუტი (Itinerary)</h3>
                <span className="text-xs font-mono text-primary font-bold">{tasks.length} მისამართი</span>
              </div>

              <div className="space-y-3">
                {tasks.map((task) => {
                  const isSelected = activeTask?.id === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setActiveTask(task)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2 ${
                        isSelected
                          ? 'border-primary bg-blue-50/50 shadow-xs'
                          : 'border-border-subtle hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-text-primary">{task.debtorName}</span>
                        <span className="text-xs font-bold font-mono text-primary">{task.scheduledTime}</span>
                      </div>
                      <div className="text-xs text-text-muted flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                        <span className="line-clamp-1">{task.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-text-muted font-mono">{task.district}</span>
                        <span className="font-bold font-mono text-primary">{task.debtAmount.toLocaleString()} ₾</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Inspection Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {activeTask ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border-subtle gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{activeTask.debtorName}</h2>
                    <span className="text-xs font-mono text-text-muted">პ/ნ: {activeTask.personalId} • დავალიანება: {activeTask.debtAmount.toLocaleString()} ₾</span>
                  </div>

                  <button
                    onClick={() => showToast(`მარშრუტი აგებულია Google Maps-ში: ${activeTask.address}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>ნავიგაცია (GPS)</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border-subtle space-y-2 text-xs">
                  <div className="font-semibold text-text-primary flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>მისამართი: {activeTask.address}</span>
                  </div>
                  <div className="text-text-muted">{activeTask.notes}</div>
                </div>

                {/* Inspection Actions Simulator */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">ადგილზე ინსპექციის პროტოკოლი</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => showToast('კამერა გააქტიურებულია: ფოტო მტკიცებულება ატვირთულია.')}
                      className="p-5 rounded-2xl border-2 border-dashed border-border-subtle hover:border-primary flex flex-col items-center justify-center gap-2 bg-slate-50 text-text-muted hover:text-primary transition-all"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-semibold">ფოტო-ფიქსაცია / ქონების აღწერა</span>
                    </button>

                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="p-5 rounded-2xl border-2 border-dashed border-border-subtle hover:border-emerald-500 flex flex-col items-center justify-center gap-2 bg-slate-50 text-text-muted hover:text-emerald-700 transition-all"
                    >
                      <PenTool className="w-6 h-6" />
                      <span className="text-xs font-semibold">ციფრული ხელმოწერა / შეტყობინება</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-text-muted border border-border-subtle">
                აირჩიეთ ვიზიტი მარშრუტიდან.
              </div>
            )}
          </div>
        </div>

        {/* Digital Signature Modal */}
        {isSignModalOpen && activeTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-border-subtle shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h4 className="text-sm font-bold text-text-primary">ინსპექციის ოქმი & ხელმოწერა</h4>
                <button onClick={() => setIsSignModalOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-text-muted">
                მოვალე: <strong>{activeTask.debtorName}</strong> ({activeTask.personalId})
              </div>

              <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-center space-y-2">
                <div className="text-[11px] text-slate-500">ხელმოწერის ველი (Touch / Stylus)</div>
                <div className="h-24 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center font-serif italic text-slate-400">
                  [ ელექტრონული ხელმოწერა ]
                </div>
              </div>

              <form onSubmit={handleCompleteVisit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">ინსპექციის შედეგი</label>
                  <textarea
                    rows={2}
                    value={signNotes}
                    onChange={(e) => setSignNotes(e.target.value)}
                    placeholder="ჩაბარდა პირადად / არ იმყოფებოდა ადგილზე..."
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:bg-slate-100"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700"
                  >
                    ოქმის დამტკიცება
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
