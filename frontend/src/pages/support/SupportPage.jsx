import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, CheckCircle2, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Workflow Automation');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/support/tickets', { category, subject, message });
      setSubject('');
      setMessage('');
      setSubmittedNotice(true);
      setTimeout(() => setSubmittedNotice(false), 4000);
      await fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Help & Technical Support</h2>
        <p className="text-sm text-gray-500 mt-1">
          Have questions about automated form submissions, policy tuning, or email synchronization? Submit a ticket below.
        </p>
      </div>

      {submittedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Support ticket submitted! Our engineering team will review it shortly.</span>
        </div>
      )}

      {/* Ticket Creation Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#05603a]" />
          Create Support Request
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
              >
                <option value="Workflow Automation">Workflow Automation</option>
                <option value="Email Integration">Email Integration (Gmail/Outlook)</option>
                <option value="Resume Matching">Resume Matching & Scoring</option>
                <option value="Billing & Plans">Billing & Plans</option>
                <option value="Other Inquiries">Other Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of request"
                className="w-full text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Message</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what occurred, opportunity URL if relevant, and what assistance you need..."
              className="w-full text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ticket History */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">Your Support Tickets</h3>
        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#05603a]" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No previous support tickets recorded.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {tickets.map((t) => (
              <div key={t.id || t._id} className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{t.subject}</h4>
                  <span className="text-[11px] text-gray-400">{t.category} • {new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#05603a]">
                  {t.status || 'OPEN'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
