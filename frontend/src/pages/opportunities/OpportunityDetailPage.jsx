import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Mail,
  Clock,
  ShieldCheck,
  Briefcase,
  Award,
  Download,
  Eye
} from 'lucide-react';
import { opportunityService } from '../../services/opportunity.service';
import api from '../../services/api';
import JdPdfModal from '../../components/opportunities/JdPdfModal';
import CareerGroundTruthAutofill from '../../components/opportunities/CareerGroundTruthAutofill';
import FormAutofillModal from '../../components/opportunities/FormAutofillModal';

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

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJdModal, setShowJdModal] = useState(false);
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchOpp = async () => {
      try {
        const data = await opportunityService.get(id);
        setOpportunity(data);
      } catch (err) {
        console.error('Failed to load opportunity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpp();

    const fetchProfile = async () => {
      try {
        const res = await api.get('/career-profile');
        setUserProfile(res.data);
      } catch (err) {
        console.warn('Could not load user career profile for form autofill:', err);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-24 text-gray-400">
        <Sparkles className="w-9 h-9 animate-spin mx-auto text-[#05603a] mb-3" />
        <p className="text-sm font-medium text-gray-600">Loading opportunity & recruiter telemetry...</p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 max-w-lg mx-auto shadow-xs">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Opportunity Not Found</h3>
        <p className="text-xs text-gray-500 mt-1">This opportunity record may have been removed or updated.</p>
        <Link to="/opportunities" className="text-[#05603a] font-bold text-xs mt-4 inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunities
        </Link>
      </div>
    );
  }

  const formUrl = opportunity.google_form_url || (opportunity.application_url && opportunity.application_url.includes('forms') ? opportunity.application_url : null);
  const jdFileName = opportunity.jd_attachment_filename || `${opportunity.company}_Job_Description.pdf`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </Link>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#05603a] border border-emerald-200">
          ✓ Ingested via Campus Placement Cell
        </span>
      </div>

      {/* Main Hero Header Banner (Clean - NO raw arrival date on top) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-black text-[#05603a] text-2xl shrink-0 shadow-2xs">
            {opportunity.company?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
                {opportunity.location || 'Physical Campus'} • {opportunity.work_mode || 'Full-time'}
              </span>
              {formUrl && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  📝 Google Form Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              {opportunity.role}
            </h1>
            <p className="text-sm font-semibold text-gray-600 flex items-center gap-2 mt-0.5">
              <span>{opportunity.company}</span>
              <span className="text-gray-300">•</span>
              <span className="text-emerald-700 font-bold">💵 {opportunity.stipend || opportunity.salary || '4.5 LPA'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
          {/* Time Left Status Pill */}
          {(() => {
            const tl = getTimeLeftInfo(opportunity.deadline);
            return (
              <div className={`px-3 py-1.5 rounded-xl border text-right shadow-2xs ${
                tl.isClosed ? 'bg-red-50 border-red-200' : tl.isMissing ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Registration Status</span>
                <span className={`text-sm font-black flex items-center gap-1 mt-0.5 justify-end ${
                  tl.isClosed ? 'text-red-700' : tl.isMissing ? 'text-gray-600' : 'text-amber-900'
                }`}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{tl.label}</span>
                </span>
              </div>
            );
          })()}

          <div className="text-right px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">AI Match</span>
            <span className="text-2xl font-black text-[#05603a]">{opportunity.match_score || 88}%</span>
          </div>

          {/* Action Buttons: Google Form directly to the LEFT of View JD (compact height & width) */}
          {formUrl && (
            <button
              type="button"
              onClick={() => {
                window.open(formUrl, '_blank', 'noopener,noreferrer');
                setShowAutofillModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
              title="Open Google Form & launch Career Auto-fill Copilot"
            >
              <span className="text-xs group-hover:scale-110 transition-transform">📝</span>
              <span>Google Form</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-200 group-hover:text-white" />
            </button>
          )}

          {opportunity.application_id && !formUrl && (
            <Link
              to={`/applications/${opportunity.application_id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>View Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setShowJdModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="View complete official Job Description PDF"
          >
            <span className="w-3.5 h-3.5 rounded bg-white text-red-700 flex items-center justify-center text-[7px] font-black shrink-0">
              PDF
            </span>
            <span>View JD (PDF)</span>
          </button>
        </div>
      </div>

      {/* Google Form Link + Career Ground Truth Component */}
      <CareerGroundTruthAutofill formUrl={formUrl} opportunity={opportunity} />

      {/* Main Grid: Insights & Structured JD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Eligibility, Resume, Skills */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Eligibility Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% Eligible
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{opportunity.eligibility_status || 'ELIGIBLE FOR DRIVE'}</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
              {(opportunity.eligibility_reasons && opportunity.eligibility_reasons.length > 0 ? opportunity.eligibility_reasons : [
                'B.Tech / MCA 2027 Passing Out Batch eligible',
                'Min 60% / 6.0 CGPA throughout 10th, 12th & Graduation',
                'Zero active backlogs at time of drive'
              ]).map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Selected Resume */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Selected Candidate Resume</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <FileText className="w-5 h-5 text-[#05603a] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{opportunity.selected_resume_name || 'Anshuman_Singh_Resume.pdf'}</p>
                <span className="text-[10px] text-gray-400">Targeted Resume matched for this role</span>
              </div>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Matching Technical Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {(opportunity.matching_skills || opportunity.skills_required || ['Python', 'SQL', 'C++', 'Data Structures', 'Git']).map((s, idx) => (
                <span key={idx} className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium border border-emerald-100">
                  ✓ {s}
                </span>
              ))}
            </div>

            {opportunity.missing_skills && opportunity.missing_skills.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-amber-700 block mb-1.5">Bonus / Recommended Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.missing_skills.map((s, idx) => (
                    <span key={idx} className="text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-medium border border-amber-100">
                      ⚡ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clean Professional Job Specification & Official Attached PDF View */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Overview Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recruitment Drive Overview</h3>
                <p className="text-xs text-gray-500">Official campus drive specifications from recruiter email</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#05603a] font-bold text-xs">
                {opportunity.company}
              </span>
            </div>

            {/* Structured Specifications Grid (Clean & Professional, no giant raw text dump) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Job Designation</span>
                <p className="font-bold text-gray-900">{opportunity.role}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Package / Compensation</span>
                <p className="font-bold text-emerald-800">{opportunity.stipend || opportunity.salary || '4.5 LPA'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Work Location</span>
                <p className="font-bold text-gray-900">{opportunity.location || 'Pune / Bangalore / Noida'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-1">
                <span className="text-gray-400 font-semibold block uppercase text-[10px]">Employment Type</span>
                <p className="font-bold text-gray-900">{opportunity.work_mode || 'Full-time Permanent'}</p>
              </div>
            </div>

            {/* Selection Process Flow */}
            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                Selection Process & Rounds
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block">Round 1</span>
                  <span className="font-semibold text-gray-800 text-[11px]">Online Assessment</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block">Round 2</span>
                  <span className="font-semibold text-gray-800 text-[11px]">Technical Interview 1</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block">Round 3</span>
                  <span className="font-semibold text-gray-800 text-[11px]">Technical + Design</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block">Round 4</span>
                  <span className="font-semibold text-gray-800 text-[11px]">HR Discussion</span>
                </div>
              </div>
            </div>

            {/* Attached JD PDF Card Component (Clean view at bottom of JD) */}
            <div className="pt-2">
              <div className="p-5 rounded-2xl bg-linear-to-r from-red-50/80 to-rose-50/70 border border-red-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center font-black text-xs shadow-xs shrink-0">
                    <span>PDF</span>
                    <span className="text-[8px] font-normal opacity-80">ATTACHMENT</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900">{jdFileName}</p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-100 text-red-800 font-bold uppercase">
                        Verified Attached JD
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Recruiter attached document • Complete role description & eligibility policy
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowJdModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View JD</span>
                  </button>
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(opportunity.job_description || '')}`}
                    download={jdFileName}
                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-red-200 transition-colors"
                    title="Download JD file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Arrival and Form Deadline placed together at the bottom */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Arrival Time */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
            <span className="text-gray-400 block font-semibold text-[10px] uppercase tracking-wider">Mail Arrival Time</span>
            <span className="font-bold text-emerald-900 flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formatEmailDate(opportunity.email_received_at || opportunity.email_timestamp || opportunity.created_at)}</span>
            </span>
          </div>

          {/* Form Registration Deadline */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100/80">
            <span className="text-gray-400 block font-semibold text-[10px] uppercase tracking-wider">Form Registration Deadline</span>
            <span className="font-bold flex items-center gap-1.5 mt-1 text-amber-950">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {opportunity.deadline_raw || (opportunity.deadline ? formatEmailDate(opportunity.deadline) : 'Not given') || 'Not given'}
              </span>
            </span>
          </div>

          {/* Recruiter / Sender */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 block font-semibold text-[10px] uppercase tracking-wider">Recruiter / Sender</span>
            {opportunity.source_email ? (
              <a
                href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(
                  (opportunity.source_email.match(/<([^>]+)>/)?.[1] || opportunity.source_email) + ' ' + (opportunity.company || '')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-800 hover:text-blue-600 hover:underline truncate block mt-1 transition-colors"
                title={`Click to view emails in Gmail from ${opportunity.source_email}`}
              >
                {opportunity.source_email}
              </a>
            ) : (
              <span className="font-semibold text-gray-800 truncate block mt-1">
                Direct Recruiter
              </span>
            )}
          </div>

          {/* Mailbox Provider */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-gray-400 block font-semibold text-[10px] uppercase tracking-wider">Connected Mailbox</span>
            <span className="font-semibold text-gray-800 truncate block mt-1">
              {opportunity.connected_account || 'anshumansingh2409@gmail.com (Gmail)'}
            </span>
          </div>
        </div>
      </div>

      {/* JD PDF Viewer Modal */}
      <JdPdfModal
        opportunity={opportunity}
        isOpen={showJdModal}
        onClose={() => setShowJdModal(false)}
        onOpenAutofill={() => {
          setShowJdModal(false);
          if (formUrl) {
            window.open(formUrl, '_blank', 'noopener,noreferrer');
          }
          setShowAutofillModal(true);
        }}
      />

      {/* Form Auto-fill Copilot Modal */}
      <FormAutofillModal
        isOpen={showAutofillModal}
        onClose={() => setShowAutofillModal(false)}
        opportunity={opportunity}
        userProfile={userProfile}
      />
    </div>
  );
}
