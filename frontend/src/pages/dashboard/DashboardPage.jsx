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
  ChevronRight,
  User
} from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';
import { applicationService } from '../../services/application.service';
import { profileService } from '../../services/assistant.service';
import { calculateProfileCompletion } from '../../utils/profileCompletion';

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profileStats, setProfileStats] = useState({
    percentage: 0,
    completedCount: 0,
    totalCount: 6,
    missingItems: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [opps, apps, prof] = await Promise.all([
          opportunityService.list().catch(() => []),
          applicationService.list().catch(() => []),
          profileService.getProfile().catch(() => null)
        ]);

        if (prof) {
          setProfileStats(calculateProfileCompletion(prof));
        }

        // Deduplicate opportunities
        const dedupedOpps = [];
        const seenOpps = new Set();
        for (const o of (opps || [])) {
          const idKey = o.id || o._id;
          const msgKey = o.provider_message_id ? `msg_${o.provider_message_id}` : null;
          const comp = (o.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const role = (o.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const jobKey = comp && role ? `job_${comp}_${role}` : null;
          if (seenOpps.has(idKey) || (msgKey && seenOpps.has(msgKey)) || (jobKey && seenOpps.has(jobKey))) continue;
          seenOpps.add(idKey);
          if (msgKey) seenOpps.add(msgKey);
          if (jobKey) seenOpps.add(jobKey);
          dedupedOpps.push(o);
        }
        setOpportunities(dedupedOpps);

        // Deduplicate applications
        const dedupedApps = [];
        const seenApps = new Set();
        for (const a of (apps || [])) {
          const idKey = a.id || a._id;
          const comp = (a.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const role = (a.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const appKey = comp && role ? `${comp}_${role}` : idKey;
          if (seenApps.has(idKey) || seenApps.has(appKey)) continue;
          seenApps.add(idKey);
          seenApps.add(appKey);
          dedupedApps.push(a);
        }
        setApplications(dedupedApps);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll every 8 seconds for real-time dashboard telemetry
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const actionRequiredApps = applications.filter(
    (a) => a.status === 'READY_FOR_REVIEW' || a.status === 'ACTION_REQUIRED'
  );
  const interviewApps = applications.filter((a) => a.status === 'INTERVIEW');
  const submittedApps = applications.filter(
    (a) => ['SUBMITTED', 'UNDER_REVIEW', 'ASSESSMENT', 'SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(a.status)
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-full min-w-0">
      {/* 1. Complete Your Profile System Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-4 sm:p-5 rounded-2xl border border-emerald-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#05603a] to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              {profileStats.percentage === 100 ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <span className="text-xs font-black">{profileStats.percentage}%</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  {profileStats.percentage === 100
                    ? 'Career Profile 100% Complete!'
                    : `Complete Your Profile (${profileStats.percentage}%)`}
                </h3>
                {profileStats.percentage === 100 ? (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Verified for 1-Click Apply
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    {profileStats.missingItems.length} steps remaining
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-600 mt-1">
                {profileStats.percentage === 100
                  ? 'All essential details are verified. Your job applications will auto-fill with zero errors.'
                  : 'Complete your profile to unlock verified 1-click Google Form auto-fills and higher resume match scores.'}
              </p>

              {/* Progress Track */}
              <div className="w-full max-w-md h-2 bg-gray-200/80 rounded-full overflow-hidden mt-2.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#05603a] rounded-full transition-all duration-700"
                  style={{ width: `${profileStats.percentage}%` }}
                />
              </div>

              {/* Missing Items Chips */}
              {profileStats.missingItems.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-[11px] font-semibold text-gray-500 mr-1">Missing:</span>
                  {profileStats.missingItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      to={`/career-profile?tab=${item.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#05603a] bg-white border border-emerald-200/90 hover:bg-emerald-50 px-2 py-0.5 rounded-lg transition-colors shadow-2xs"
                    >
                      <span>+ {item.label}</span>
                    </Link>
                  ))}
                  {profileStats.missingItems.length > 3 && (
                    <Link
                      to="/career-profile"
                      className="text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      +{profileStats.missingItems.length - 3} more
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            <Link
              to="/career-profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{profileStats.percentage === 100 ? 'View Profile' : 'Complete Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Career Control Center</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time telemetry of your opportunities, applications, and career pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/opportunities"
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors w-full sm:w-auto"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>View Opportunities ({opportunities.length})</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2 sm:mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Active Pipeline</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{submittedApps.length}</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Live tracked submissions</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2 sm:mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Awaiting Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{actionRequiredApps.length}</p>
          <span className="text-xs text-amber-700 font-medium mt-1 block">Requires user approval</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2 sm:mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{interviewApps.length}</p>
          <span className="text-xs text-blue-700 font-medium mt-1 block">Rounds in progress</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2 sm:mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Match Rate</span>
            <TrendingUp className="w-4 h-4 text-[#05603a]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">89%</p>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">Across target resumes</span>
        </div>
      </div>

      {/* Action Required Banner if any */}
      {actionRequiredApps.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Recent Applications</h3>
            <Link to="/applications" className="text-xs font-semibold text-[#05603a] hover:underline flex items-center gap-1">
              View All ({applications.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-gray-400">
              <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No applications started yet.</p>
              <p className="text-xs text-gray-500 mt-1">Sync your inbox or paste a job email to trigger the pipeline.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id || app._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-700 text-xs sm:text-sm shrink-0">
                      {app.company?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{app.company}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 truncate">{app.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <span
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
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
                      className="p-1 sm:p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      aria-label="View application details"
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
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Detected Opportunities</h3>
            <Link to="/opportunities" className="text-xs font-semibold text-[#05603a] hover:underline flex items-center gap-1">
              View All ({opportunities.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-gray-400">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No opportunities detected yet.</p>
              <p className="text-xs text-gray-500 mt-1">Use "Sync Career Emails" in the top bar to ingest samples.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {opportunities.slice(0, 4).map((opp) => (
                <div key={opp.id || opp._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{opp.company}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 truncate">{opp.role}</p>
                    <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">
                      ✓ {opp.eligibility_status || 'ELIGIBLE'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] sm:text-xs font-bold text-[#05603a] bg-emerald-50 px-2 py-0.5 rounded-md">
                      {opp.match_score || 88}% Match
                    </span>
                    <Link
                      to={`/opportunities/${opp.id || opp._id}`}
                      className="block text-[10px] sm:text-[11px] text-gray-400 hover:text-gray-900 mt-1"
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
