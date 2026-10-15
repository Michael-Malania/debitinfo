'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { hrService } from '@/services';
import { Employee } from '@/types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  MoreVertical,
  X
} from 'lucide-react';

export default function HrAdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({
    fullName: '',
    email: '',
    role: 'operator' as any,
    roleKa: 'CRM ოპერატორი',
    department: 'მოვალეთა მართვა',
    phone: '+995 599 00 00 00',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await hrService.getEmployees();
      setEmployees(data);
    }
    load();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Employee = {
      id: `emp-${Date.now()}`,
      fullName: newEmp.fullName,
      email: newEmp.email,
      role: newEmp.role,
      roleKa: newEmp.roleKa,
      department: newEmp.department,
      status: 'active',
      assignedCasesCount: 0,
      phone: newEmp.phone,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'ახლა'
    };
    setEmployees([created, ...employees]);
    showToast(`თანამშრომელი ${newEmp.fullName} წარმატებით დაემატა.`);
    setIsAddModalOpen(false);
    setNewEmp({
      fullName: '',
      email: '',
      role: 'operator',
      roleKa: 'CRM ოპერატორი',
      department: 'მოვალეთა მართვა',
      phone: '+995 599 00 00 00',
    });
  };

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.roleKa.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">HR & სისტემური ადმინისტრატორის კონსოლი</h1>
              <p className="text-xs text-text-muted">პერსონალის აღრიცხვა, როლები, წვდომის დონეები და აქტივობის მონიტორინგი.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>თანამშრომლის დამატება</span>
            </button>
          </div>
        </div>

        {/* 1. Quick HR stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">აქტიური პერსონალი</span>
            <div className="text-2xl font-bold font-mono text-primary">{employees.length} თანამშრომელი</div>
            <div className="text-[11px] text-emerald-600 font-semibold">100% ავტორიზებული წვდომა</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">ოპერატორები & საველე</span>
            <div className="text-2xl font-bold font-mono text-text-primary">32 აგენტი</div>
            <div className="text-[11px] text-text-muted">აქტიურ ცვლაში: 28</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">იურისტები & მედიატორები</span>
            <div className="text-2xl font-bold font-mono text-text-primary">8 ოფიცერი</div>
            <div className="text-[11px] text-text-muted">სასამართლო საქმეები: 112</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-border-subtle shadow-xs space-y-1">
            <span className="text-xs text-text-muted">სისტემური აუდიტი</span>
            <div className="text-2xl font-bold font-mono text-emerald-600">დაცულია</div>
            <div className="text-[11px] text-text-muted">2FA ჩართულია ყველა ანგარიშზე</div>
          </div>
        </div>

        {/* 2. Staff Roster Table */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-text-primary">თანამშრომელთა სია & როლები</h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="მოძებნეთ სახელით ან როლით..."
                className="w-full pl-9 pr-4 py-2 border border-border-subtle rounded-xl text-xs focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-subtle text-text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">თანამშრომელი</th>
                  <th className="py-3 px-4">როლი / თანამდებობა</th>
                  <th className="py-3 px-4">დეპარტამენტი</th>
                  <th className="py-3 px-4">აქტიური საქმეები</th>
                  <th className="py-3 px-4">ტელეფონი</th>
                  <th className="py-3 px-4">სტატუსი</th>
                  <th className="py-3 px-4">ბოლო აქტივობა</th>
                  <th className="py-3 px-4 text-right">ქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-white">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">{emp.fullName}</div>
                      <div className="text-[11px] text-text-muted font-mono">{emp.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-primary border border-blue-200">
                        {emp.roleKa}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">{emp.department}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-text-primary">{emp.assignedCasesCount} საქმე</td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">{emp.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {emp.status === 'active' ? 'აქტიური' : emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-text-muted">{emp.lastActive}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => showToast(`უფლებები განახლებულია ${emp.fullName}-სთვის.`)}
                        className="px-2.5 py-1 rounded-lg border border-border-subtle hover:bg-slate-100 text-[11px] text-text-muted hover:text-text-primary transition-colors"
                      >
                        მართვა
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add Employee Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-border-subtle shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h4 className="text-sm font-bold text-text-primary">ახალი თანამშრომლის დამატება</h4>
                <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">სრული სახელი</label>
                  <input
                    type="text"
                    value={newEmp.fullName}
                    onChange={(e) => setNewEmp({ ...newEmp, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary"
                    placeholder="მაგ: გიორგი ბერიძე"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted">ელფოსტა</label>
                  <input
                    type="email"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary"
                    placeholder="g.beridze@debitinfo.ge"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">როლი</label>
                    <select
                      value={newEmp.role}
                      onChange={(e) => {
                        const r = e.target.value;
                        const roleKaMap: any = {
                          operator: 'CRM ოპერატორი',
                          analyst: 'რისკ-ანალიტიკოსი',
                          legal: 'იურიდიული მრჩეველი',
                          field_officer: 'საველე ოფიცერი',
                          admin: 'ადმინისტრატორი'
                        };
                        setNewEmp({ ...newEmp, role: r as any, roleKa: roleKaMap[r] });
                      }}
                      className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs text-text-primary"
                    >
                      <option value="operator">CRM ოპერატორი</option>
                      <option value="analyst">რისკ-ანალიტიკოსი</option>
                      <option value="legal">იურისტი</option>
                      <option value="field_officer">საველე ოფიცერი</option>
                      <option value="admin">ადმინისტრატორი</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">ტელეფონი</label>
                    <input
                      type="text"
                      value={newEmp.phone}
                      onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-xl text-xs font-mono text-text-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:bg-slate-100"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700"
                  >
                    დამატება
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
