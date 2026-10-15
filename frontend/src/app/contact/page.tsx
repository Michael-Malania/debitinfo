'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { contactService } from '@/services';
import { MOCK_FAQS } from '@/data/mockData';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle 
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'general' as any,
    subject: '',
    message: '',
    caseNumber: '',
  });
  const [openFaq, setOpenFaq] = useState<string | null>(MOCK_FAQS[0]?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await contactService.submitInquiry(formData);
      setTicketResult(res.ticketNumber);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: 'general',
        subject: '',
        message: '',
        caseNumber: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-text-primary">
            კონტაქტი და მხარდაჭერა
          </h1>
          <p className="text-xs sm:text-sm text-text-muted">
            გაქვთ შეკითხვა რეესტრთან, საქმის წარმოებასთან ან გადახდებთან დაკავშირებით? დაგვიკავშირდით.
          </p>
        </div>

        {/* 2-Column: Contact Details & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Hotline & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-text-primary">საკონტაქტო არხები</h3>

              <div className="space-y-5 text-xs">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">ცხელი ხაზი</div>
                    <div className="text-sm font-mono font-semibold text-primary mt-0.5">+995 32 2 100 200</div>
                    <div className="text-[11px] text-text-muted mt-0.5">ორშაბათი - პარასკევი: 09:30 - 18:30</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">ელექტრონული ფოსტა</div>
                    <div className="font-mono text-text-primary mt-0.5">info@debitinfo.ge</div>
                    <div className="text-[11px] text-text-muted">იურიდიული დეპარტამენტი: legal@debitinfo.ge</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">მთავარი ოფისი</div>
                    <div className="text-text-primary mt-0.5">ქ. თბილისი, ი. ჭავჭავაძის გამზ. 37მ (Pixel Centre)</div>
                    <div className="text-[11px] text-text-muted">სართული 5, ოფისი 502</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary">სამუშაო საათები</div>
                    <div className="text-text-primary mt-0.5">სამუშაო დღეები: 09:30 — 18:30</div>
                    <div className="text-[11px] text-text-muted">შაბათ-კვირა: დასვენება</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-text-primary">ონლაინ შეტყობინების გაგზავნა</h3>

              {ticketResult ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900">შეტყობინება წარმატებით გაიგზავნა!</h4>
                  <p className="text-xs text-emerald-700">
                    თქვენს შეტყობინებას მიენიჭა ბილეთის ნომერი: <strong className="font-mono">{ticketResult}</strong>. ჩვენი ოპერატორი უახლოეს 2 საათში დაგიკავშირდებათ.
                  </p>
                  <button
                    onClick={() => setTicketResult(null)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                  >
                    ახალი შეტყობინება
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">სრული სახელი / ორგანიზაცია</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                        placeholder="მაგ: გიორგი ბერიძე"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">ელფოსტა</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                        placeholder="example@mail.ge"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">ტელეფონი</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs font-mono focus:outline-none focus:border-primary text-text-primary"
                        placeholder="+995 599 00 00 00"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-muted">საქმის ნომერი (არასავალდებულო)</label>
                      <input
                        type="text"
                        value={formData.caseNumber}
                        onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs font-mono focus:outline-none focus:border-primary text-text-primary"
                        placeholder="მაგ: DB-2024-8841"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">თემატიკა</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary"
                    >
                      <option value="general">ზოგადი ინფორმაცია & რეგისტრაცია</option>
                      <option value="debtor">მოვალის დავალიანების გარკვევა</option>
                      <option value="creditor">კრედიტორის პორტფელის მართვა</option>
                      <option value="legal">იურიდიული დავა & სააღსრულებო</option>
                      <option value="support">ტექნიკური მხარდაჭერა</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted">შეტყობინების ტექსტი</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle text-xs focus:outline-none focus:border-primary text-text-primary"
                      placeholder="აღწერეთ თქვენი საკითხი დეტალურად..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'იგზავნება...' : 'შეტყობინების გაგზავნა'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-border-subtle shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">ხშირად დასმული კითხვები (FAQ)</h2>
              <p className="text-xs text-text-muted">პასუხები ყველაზე გავრცელებულ კითხვებზე რეესტრის შესახებ.</p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="rounded-2xl border border-border-subtle overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-text-primary">{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white border-t border-border-subtle text-xs text-text-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
