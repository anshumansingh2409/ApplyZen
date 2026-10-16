import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  Mail,
  Clock
} from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';
import JdPdfModal from '../../components/opportunities/JdPdfModal';

const formatEmailDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return null;
  }
};

const getTimeLeftInfo = (deadlineStr) => {
  if (!deadlineStr) {
    return { label: 'Time Left: Not given', isClosed: false, isMissing: true };
  }
  try {
    const target = new Date(deadlineStr);
    if (isNaN(target.getTime())) {
      return { label: 'Time Left: Not given', isClosed: false, isMissing: true };
    }
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) {
      return { label: 'Time Left: 0', isClosed: true, isMissing: false };
    }
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const remHours = diffHours % 24;
      return { label: `Time Left: ${diffDays}d ${remHours}h`, isClosed: false, isMissing: false };
    } else if (diffHours > 0) {
      const remMin = diffMin % 60;
      return { label: `Time Left: ${diffHours}h ${remMin}m`, isClosed: false, isMissing: false };
    } else {
      return { label: `Time Left: ${Math.max(1, diffMin)}m`, isClosed: false, isMissing: false };
    }
  } catch {
    return { label: 'Time Left: Not given', isClosed: false, isMissing: true };
  }
};


export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [stipendFilter, setStipendFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedJdOpp, setSelectedJdOpp] = useState(null);

  const fetchOpps = async () => {
    try {
      setLoading(true);
      const data = await opportunityService.list();
      setOpportunities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  const handleCleanupMock = async () => {
    if (!window.confirm('Do you want to purge all sample/mock opportunities (Stripe, Razorpay, Google records)?')) {
      return;
    }
    try {
      const res = await opportunityService.cleanupMock();
      setToastMessage(`Purged ${res.deleted_count} sample opportunities.`);
      await fetchOpps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Do you want to clear all opportunities and reset mail sync history for a fresh start?')) {
      return;
    }
    try {
      const res = await opportunityService.clearAll();
      setToastMessage(res.message || 'Cleared all opportunities.');
      await fetchOpps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncInbox = async () => {
    setSyncing(true);
    setToastMessage('');
    try {
      const res = await opportunityService.syncEmails('gmail');
      if (res.synced_count > 0) {
        setToastMessage(`Scanned ${res.scanned_count} career emails. Added ${res.synced_count} new opportunities!`);
      } else {
        setToastMessage(res.message || 'Scanned inbox. No new career opportunities found.');
      }
      await fetchOpps();
    } catch (err) {
      setToastMessage(err.response?.data?.message || err.response?.data?.detail || 'Inbox sync failed. Ensure Gmail is connected in Integrations.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteOpp = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await opportunityService.delete(id);
      setOpportunities((prev) => prev.filter((o) => (o.id || o._id) !== id));
      setToastMessage('Opportunity deleted successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualIngest = async (e) => {
    e.preventDefault();
    if (!emailText.trim()) return;
    setIngesting(true);
    try {
      await opportunityService.processEmail(emailText);
      setEmailText('');
      setShowIngestModal(false);
      setToastMessage('Career email processed and opportunity added!');
      await fetchOpps();
    } catch (err) {
      console.error(err);
      setToastMessage(err.response?.data?.detail || err.response?.data?.message || 'Failed to process email. Please verify format.');
    } finally {
      setIngesting(false);
    }
  };

  const filtered = opportunities.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      o.company?.toLowerCase().includes(q) ||
      o.role?.toLowerCase().includes(q) ||
      o.location?.toLowerCase().includes(q) ||
      (o.skills_required || []).some((s) => s.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === 'All' ||
      o.role?.toLowerCase().includes(roleFilter.toLowerCase()) ||
      (roleFilter === 'Internship' && (o.role?.toLowerCase().includes('intern') || o.work_mode?.toLowerCase().includes('intern')));

    const matchesLocation =
      locationFilter === 'All' ||
      o.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const stipendStr = (o.stipend || o.salary || '').toLowerCase();
    let matchesStipend = true;
    if (stipendFilter === '25k') {
      matchesStipend = stipendStr.includes('25') || stipendStr.includes('45') || stipendStr.includes('50') || stipendStr.includes('lakh') || stipendStr.includes('year') || stipendStr.includes('1,');
    } else if (stipendFilter === '50k') {
      matchesStipend = stipendStr.includes('50') || stipendStr.includes('1,25') || stipendStr.includes('year') || stipendStr.includes('lakh');
    } else if (stipendFilter === '1L') {
      matchesStipend = stipendStr.includes('1,25') || stipendStr.includes('1,00') || stipendStr.includes('year') || stipendStr.includes('18,') || stipendStr.includes('24,');
    }

    // Date Filter Logic
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const oppDate = new Date(o.email_received_at || o.email_timestamp || o.created_at);
      const now = new Date();
      if (dateFilter === 'Today') {
        matchesDate = oppDate.toDateString() === now.toDateString();
      } else if (dateFilter === '3days') {
        matchesDate = oppDate >= new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === '7days') {
        matchesDate = oppDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === '30days') {
        matchesDate = oppDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return matchesSearch && matchesRole && matchesLocation && matchesStipend && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Detected Opportunities</h2>
          <p className="text-sm text-gray-500 mt-1">
            Career opportunities extracted from your connected Gmail and Outlook inboxes with attached JDs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-700 hover:text-red-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Clear all opportunities and reset email ingestion"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Clear All Opportunities</span>
          </button>

          <button
            onClick={handleSyncInbox}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Scan connected inboxes for new career emails"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#05603a] ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Scanning...' : 'Sync Inboxes'}</span>
          </button>

          <button
            onClick={() => setShowIngestModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Career Email</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs">✕</button>
        </div>
      )}

      {/* Modern Filter & Search Bar matching website light theme */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles, companies, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/70 hover:bg-white text-gray-900 placeholder-gray-400 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] transition-all"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="w-full md:w-44">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-gray-50/70 hover:bg-white text-gray-700 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] transition-all cursor-pointer font-medium"
          >
            <option value="All">All Roles</option>
            <option value="Software Engineer">Software Engineer</option>
            <option value="Full Stack">Full Stack Developer</option>
            <option value="Backend">Backend Engineer</option>
            <option value="Frontend">Frontend Developer</option>
            <option value="Internship">Internships</option>
          </select>
        </div>

        {/* Stipend / Salary Filter */}
        <div className="w-full md:w-44">
          <select
            value={stipendFilter}
            onChange={(e) => setStipendFilter(e.target.value)}
            className="w-full py-2 px-3 bg-gray-50/70 hover:bg-white text-gray-700 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] transition-all cursor-pointer font-medium"
          >
            <option value="All">Stipend / CTC</option>
            <option value="25k">&gt; ₹25,000 / mo</option>
            <option value="50k">&gt; ₹50,000 / mo</option>
            <option value="1L">&gt; ₹1,00,000 / mo or 18LPA</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="w-full md:w-36">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full py-2 px-3 bg-gray-50/70 hover:bg-white text-gray-700 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] transition-all cursor-pointer font-medium"
          >
            <option value="All">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
          </select>
        </div>

        {/* Date Filter Dropdown */}
        <div className="w-full md:w-36">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full py-2 px-3 bg-gray-50/70 hover:bg-white text-gray-700 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] transition-all cursor-pointer font-medium"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="3days">Last 3 Days</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={fetchOpps}
          title="Refresh opportunities"
          className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-[#05603a] rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#05603a]' : ''}`} />
        </button>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#05603a]" />
          <p className="text-sm">Loading opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">No opportunities match criteria</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Try resetting your search or filters, or click "Sync Career Emails" in the header to import newly detected opportunities.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('All');
              setStipendFilter('All');
              setLocationFilter('All');
            }}
            className="text-xs font-bold text-[#05603a] hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((opp) => (
            <div
              key={opp.id || opp._id}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-2xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-[#05603a] text-lg">
                      {opp.company?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900 leading-snug">{opp.company}</h4>
                      <p className="text-xs text-gray-600 font-medium">{opp.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Time Left Badge */}
                    {(() => {
                      const tl = getTimeLeftInfo(opp.deadline);
                      return (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                            tl.isClosed
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : tl.isMissing
                              ? 'bg-gray-50 text-gray-500 border-gray-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title={tl.isClosed ? 'Registration is closed' : 'Registration time left'}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{tl.label}</span>
                        </span>
                      );
                    })()}

                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#05603a] font-bold text-xs border border-emerald-200">
                      {opp.match_score || 85}% Match
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteOpp(opp.id || opp._id);
                      }}
                      title="Delete opportunity"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form Badge, View JD Button & Recruiter Source (all unified in one inline strip) */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {(opp.google_form_url || (opp.application_url && opp.application_url.includes('forms'))) && (
                    <a
                      href={opp.google_form_url || opp.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 text-[11px] hover:underline transition-colors shadow-2xs"
                      title="Open attached Google Form in new tab"
                    >
                      <span>📝 Google Form Link</span>
                      <ExternalLink className="w-3 h-3 text-purple-600 shrink-0" />
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedJdOpp(opp)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 text-[11px] transition-colors cursor-pointer shadow-2xs"
                    title="Click to view full attached JD in PDF format"
                  >
                    <span className="w-3.5 h-3.5 rounded bg-red-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">
                      PDF
                    </span>
                    <span>View JD</span>
                  </button>

                  {opp.source_email && (
                    <a
                      href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(
                        (opp.source_email.match(/<([^>]+)>/)?.[1] || opp.source_email) + ' ' + (opp.company || '')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-600 hover:underline max-w-[240px] truncate transition-colors py-0.5"
                      title={`Click to view emails in Gmail from ${opp.source_email}`}
                    >
                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">
                        via {opp.source_email.includes('<') ? opp.source_email.split('<')[0].replace(/"/g, '').trim() || opp.source_email : opp.source_email}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Stipend & Metadata Strip */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  <span className="font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100">
                    💵 {opp.stipend || opp.salary || '4.5 LPA'}
                  </span>
                  <span>📍 {opp.location || 'Galgotias University'}</span>
                  <span>💼 {opp.work_mode || 'Physical Campus Drive'}</span>
                </div>

                {/* Skills Preview */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(opp.skills_required || []).slice(0, 4).map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Arrival and Form Deadline placed together at bottom */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#05603a] shrink-0" />
                    <span>Arrival: <strong className="font-semibold text-gray-900">{formatEmailDate(opp.email_received_at || opp.email_timestamp || opp.created_at) || 'Recent'}</strong></span>
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                    getTimeLeftInfo(opp.deadline).isClosed
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Deadline: <strong className="font-semibold">{opp.deadline_raw || (opp.deadline ? formatEmailDate(opp.deadline) : 'Not given') || 'Not given'}</strong>
                      {getTimeLeftInfo(opp.deadline).isClosed && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[9px] uppercase border border-red-200">
                          Closed (0 Left)
                        </span>
                      )}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  {(opp.google_form_url || (opp.application_url && opp.application_url.includes('forms'))) && (
                    <a
                      href={opp.google_form_url || opp.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-2xs"
                      title="Open Google Form directly"
                    >
                      <span>Open Form</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <Link
                    to={`/opportunities/${opp.id || opp._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#05603a] hover:underline"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JD PDF Preview Modal */}
      <JdPdfModal
        opportunity={selectedJdOpp}
        isOpen={!!selectedJdOpp}
        onClose={() => setSelectedJdOpp(null)}
      />

      {/* Manual Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Paste Career Email Content</h3>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualIngest} className="space-y-4">
              <p className="text-xs text-gray-500">
                Paste raw recruitment or job alert email body. The AI pipeline will extract the role, check eligibility, match resumes, and initialize workflow.
              </p>
              <textarea
                rows={7}
                required
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Subject: Opportunity at Google...
We are hiring Software Engineers..."
                className="w-full text-xs font-mono bg-gray-50 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#05603a]"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] disabled:opacity-50"
                >
                  {ingesting ? 'Processing...' : 'Run Extraction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
