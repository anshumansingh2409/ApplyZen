import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  ChevronRight,
  RefreshCw,
  Clock,
  Sparkles
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
      console.error(err);
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
    if (activeTab === 'ACTION_REQUIRED')
      return ['READY_FOR_REVIEW', 'ACTION_REQUIRED'].includes(app.status);
    if (activeTab === 'SUBMITTED')
      return ['SUBMITTED', 'UNDER_REVIEW'].includes(app.status);
    if (activeTab === 'INTERVIEWS')
      return ['INTERVIEW', 'ASSESSMENT', 'SHORTLISTED'].includes(app.status);
    if (activeTab === 'OFFERS') return app.status === 'OFFER';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Application Pipeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete lifecycle tracking from AI form filling to recruiter interviews and offers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Applications' },
          { id: 'ACTION_REQUIRED', label: 'Awaiting Review / Action' },
          { id: 'SUBMITTED', label: 'Submitted' },
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
            Applications appear here automatically when detected opportunities are verified as eligible.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs divide-y divide-gray-100 overflow-hidden">
          {filtered.map((app) => (
            <div
              key={app.id || app._id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-800 text-lg">
                  {app.company?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-gray-900">{app.company}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-[#05603a] font-bold">
                      {app.match_score || 90}% Match
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{app.role}</p>
                  <span className="text-[11px] text-gray-400 block mt-1">
                    Resume: {app.resume_used_name || 'Resume_v1.pdf'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'SUBMITTED'
                      ? 'bg-emerald-50 text-[#05603a] border border-emerald-200'
                      : app.status === 'READY_FOR_REVIEW'
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

                <Link
                  to={`/applications/${app.id || app._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-[#05603a] hover:text-white text-gray-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200 hover:border-[#05603a]"
                >
                  <span>Review & Timeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
