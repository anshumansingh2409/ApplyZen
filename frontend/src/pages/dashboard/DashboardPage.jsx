import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  FileCheck,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';
import { applicationService } from '../../services/application.service';

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [opps, apps] = await Promise.all([
          opportunityService.list(),
          applicationService.list()
        ]);
        setOpportunities(opps);
        setApplications(apps);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const actionRequiredApps = applications.filter(
    (a) => a.status === 'READY_FOR_REVIEW' || a.status === 'ACTION_REQUIRED'
  );
  const interviewApps = applications.filter((a) => a.status === 'INTERVIEW');
  const submittedApps = applications.filter(
    (a) => ['SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT', 'SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(a.status)
  );

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Career Control Center</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time telemetry of your opportunities, applications, and AI automated workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>View Opportunities ({opportunities.length})</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Active Pipeline</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{submittedApps.length}</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Live tracked submissions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{actionRequiredApps.length}</p>
          <span className="text-xs text-amber-700 font-medium mt-1 block">Requires user approval</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{interviewApps.length}</p>
          <span className="text-xs text-blue-700 font-medium mt-1 block">Rounds in progress</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Match Rate</span>
            <TrendingUp className="w-4 h-4 text-[#05603a]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">89%</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Across target resumes</span>
        </div>
      </div>

      {/* Action Required Banner if any */}
      {actionRequiredApps.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">Human Approval Required</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                You have {actionRequiredApps.length} application(s) with pre-filled fields or security verification awaiting your review.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {actionRequiredApps.map((app) => (
                  <Link
                    key={app.id || app._id}
                    to={`/applications/${app.id || app._id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    <span>{app.company} ({app.role})</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Applications & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Recent Applications</h3>
            <Link to="/applications" className="text-xs font-semibold text-[#05603a] hover:underline flex items-center gap-1">
              View All ({applications.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No applications started yet.</p>
              <p className="text-xs text-gray-500 mt-1">Sync your inbox or paste a job email to trigger the pipeline.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id || app._id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-sm">
                      {app.company?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{app.company}</h4>
                      <p className="text-xs text-gray-500">{app.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'SUBMITTED'
                          ? 'bg-emerald-50 text-[#05603a]'
                          : app.status === 'READY_FOR_REVIEW'
                          ? 'bg-amber-50 text-amber-700'
                          : app.status === 'INTERVIEW'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {app.status}
                    </span>

                    <Link
                      to={`/applications/${app.id || app._id}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: New Opportunities & Matches */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Detected Opportunities</h3>
            <Link to="/opportunities" className="text-xs font-semibold text-[#05603a] hover:underline flex items-center gap-1">
              View All ({opportunities.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No opportunities detected yet.</p>
              <p className="text-xs text-gray-500 mt-1">Use "Sync Career Emails" in the top bar to ingest samples.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {opportunities.slice(0, 4).map((opp) => (
                <div key={opp.id || opp._id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{opp.company}</h4>
                    <p className="text-xs text-gray-500">{opp.role}</p>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      ✓ {opp.eligibility_status || 'ELIGIBLE'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#05603a] bg-emerald-50 px-2 py-0.5 rounded-md">
                      {opp.match_score || 88}% Match
                    </span>
                    <Link
                      to={`/opportunities/${opp.id || opp._id}`}
                      className="block text-[11px] text-gray-400 hover:text-gray-900 mt-1"
                    >
                      Inspect JD →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
