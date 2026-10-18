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
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.company?.toLowerCase().includes(search.toLowerCase()) ||
      app.role?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'SUBMITTED')
      return ['SUBMITTED', 'APPLIED', 'UNDER_REVIEW'].includes(app.status);
    if (activeTab === 'ACTION_REQUIRED')
      return ['READY_FOR_REVIEW', 'ACTION_REQUIRED'].includes(app.status);
    if (activeTab === 'INTERVIEWS')
      return ['INTERVIEW', 'ASSESSMENT', 'SHORTLISTED'].includes(app.status);
    if (activeTab === 'OFFERS') return app.status === 'OFFER';
    return true;
  });

  const submittedCount = applications.filter((a) =>
    ['SUBMITTED', 'APPLIED', 'UNDER_REVIEW'].includes(a.status)
  ).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Application Pipeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous form autofill & submission. Every application is pre-filled, verified, and can be edited or reviewed at any time.
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
            return (
              <div
                key={app.id || app._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-[#05603a] text-lg shrink-0">
                    {app.company?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 truncate">{app.company}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-[#05603a] font-bold shrink-0">
                        {app.match_score || 90}% Match
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">{app.role}</p>
                    <span className="text-[11px] text-gray-400 block mt-1 truncate">
                      Resume Used: <strong className="font-semibold text-gray-700">{app.resume_used_name || 'Anshuman_Resume.pdf'}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
                  {/* Status Badge */}
                  {app.status === 'SUBMITTED' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#05603a] border border-emerald-200 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#05603a]" />
                      <span>Submitted</span>
                    </span>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

                  {/* Form link button if available */}
                  {formUrl && (
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors"
                      title="Open Google Form"
                    >
                      <span>📝 Form</span>
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </a>
                  )}

                  {/* Check / Review & Edit Details */}
                  <Link
                    to={`/applications/${app.id || app._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs"
                  >
                    <span>Check & Edit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
