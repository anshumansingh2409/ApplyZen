import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Clock
} from 'lucide-react';
import { applicationService } from '../../services/application.service';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const data = await applicationService.list();
      
      // Deduplicate applications
      const seen = new Set();
      const deduped = [];
      for (const a of (data || [])) {
        const idKey = a.id || a._id;
        const comp = (a.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const role = (a.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const key = comp && role ? `${comp}_${role}` : idKey;
        if (seen.has(idKey) || seen.has(key)) continue;
        seen.add(idKey);
        seen.add(key);
        deduped.push(a);
      }
      setApplications(deduped);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const isAdmitCard = (app) =>
    app.status === 'ADMIT_CARD' ||
    app.is_admit_card === true ||
    (app.role || '').toLowerCase().includes('admit card') ||
    (app.role || '').toLowerCase().includes('hall ticket') ||
    (app.role || '').toLowerCase().includes('assessment link');

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company?.toLowerCase().includes(search.toLowerCase()) ||
      app.role?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ADMIT_CARDS') return isAdmitCard(app);
    if (activeTab === 'SUBMITTED')
      return ['SUBMITTED', 'APPLIED', 'UNDER_REVIEW'].includes(app.status) && !isAdmitCard(app);
    if (activeTab === 'ACTION_REQUIRED')
      return ['READY_FOR_REVIEW', 'ACTION_REQUIRED'].includes(app.status);
    if (activeTab === 'INTERVIEWS')
      return ['INTERVIEW', 'ASSESSMENT', 'SHORTLISTED'].includes(app.status) && !isAdmitCard(app);
    if (activeTab === 'OFFERS') return app.status === 'OFFER';
    return true;
  });

  const submittedCount = applications.filter((a) =>
    ['SUBMITTED', 'APPLIED', 'UNDER_REVIEW'].includes(a.status) && !isAdmitCard(a)
  ).length;

  const admitCardCount = applications.filter(isAdmitCard).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Application Pipeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous form autofill & submission. Track recruitment drives, assessments, and verified hall tickets/admit cards.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-[#05603a]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
        {[
          { id: 'ALL', label: `All Applications (${applications.length})` },
          { id: 'ADMIT_CARDS', label: `🎫 Admit Cards (${admitCardCount})` },
          { id: 'SUBMITTED', label: `Submitted (${submittedCount})` },
          { id: 'ACTION_REQUIRED', label: 'Action Required' },
          { id: 'INTERVIEWS', label: 'Assessments & Interviews' },
          { id: 'OFFERS', label: 'Offers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#05603a] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#05603a]" />
          <p className="text-sm">Loading applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <FileCheck className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No applications in this view</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Applications appear here automatically when recruitment drive emails arrive.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {filtered.map((app) => {
            const formUrl = app.google_form_url || app.application_url;
            const admit = isAdmitCard(app);

            return (
              <div
                key={app.id || app._id}
                className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 transition-colors ${
                  admit ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                  <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border flex items-center justify-center font-bold text-xs sm:text-base shrink-0 ${
                    admit
                      ? 'bg-indigo-100 border-indigo-200 text-indigo-700'
                      : 'bg-emerald-50 border border-emerald-100 text-[#05603a]'
                  }`}>
                    {admit ? '🎫' : (app.company?.charAt(0) || 'C')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{app.company}</h4>
                      {admit ? (
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold shrink-0 border border-indigo-200">
                          🎫 Admit Card
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs px-1.5 py-0.2 rounded bg-emerald-50 text-[#05603a] font-bold shrink-0">
                          {app.match_score || 90}% Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
                      <span className="text-gray-700 font-medium truncate">{app.role}</span>
                      {admit ? (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-indigo-700 font-semibold text-[10px] sm:text-[11px] truncate">
                            Schedule: {app.admit_card_details?.exam_date || 'Scheduled'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-400 text-[10px] sm:text-[11px] truncate">
                            Resume: <strong className="font-semibold text-gray-600">{app.resume_used_name || 'Master Resume'}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
                  {/* Status Badge */}
                  {admit ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs shrink-0 whitespace-nowrap">
                      <span>Admit Card Active</span>
                    </span>
                  ) : app.status === 'SUBMITTED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-[#05603a] border border-emerald-200 shadow-2xs shrink-0 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 text-[#05603a]" />
                      <span>Submitted</span>
                    </span>
                  ) : (
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 whitespace-nowrap ${
                        app.status === 'READY_FOR_REVIEW'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : app.status === 'ACTION_REQUIRED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : app.status === 'INTERVIEW'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : app.status === 'OFFER'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {app.status}
                    </span>
                  )}

                  {/* Test Link or Form Link button if available */}
                  {formUrl && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border transition-colors shrink-0 whitespace-nowrap ${
                        admit
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                      }`}
                      title={admit ? "Launch Online Assessment" : "Open Google Form"}
                    >
                      <span>{admit ? '🚀 Launch Test' : '📝 Form'}</span>
                      <ExternalLink className={`w-2.5 h-2.5 ${admit ? 'text-indigo-200' : 'text-purple-400'}`} />
                    </a>
                  )}

                  {/* Check / Review & Edit Details */}
                  <Link
                    to={`/applications/${app.id || app._id}`}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#05603a] hover:bg-[#034a27] text-white text-[10px] sm:text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0 whitespace-nowrap"
                  >
                    <span>{admit ? 'View Details' : 'Check & Edit'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
