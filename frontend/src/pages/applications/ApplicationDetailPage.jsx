import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  Sparkles,
  Bot,
  ExternalLink,
  Save,
  RefreshCw,
  Award,
  Calendar,
  XCircle
} from 'lucide-react';
import { applicationService } from '../../services/application.service';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchApp = async () => {
    try {
      const data = await applicationService.get(id);
      setApplication(data);
      setFields(data.form_fields || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleFieldChange = (idx, val) => {
    const updated = [...fields];
    updated[idx].user_edited_value = val;
    setFields(updated);
  };

  const handleReviewSubmit = async (approved) => {
    setSubmitting(true);
    setActionNotice('');
    try {
      const res = await applicationService.reviewAndSubmit(id, fields, approved);
      setActionNotice(res.message || 'Application updated successfully');
      await fetchApp();
    } catch (err) {
      console.error(err);
      setActionNotice('Failed to submit application review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerCaptcha = async () => {
    try {
      await applicationService.triggerCaptcha(id);
      await fetchApp();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveCaptcha = async () => {
    try {
      await applicationService.resolveCaptcha(id);
      await fetchApp();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateUpdate = async (type) => {
    try {
      await applicationService.simulateEmailUpdate(id, type);
      await fetchApp();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-[#05603a] mb-2" />
        <p className="text-sm">Loading application telemetry...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-10 text-center">
        <p className="text-gray-500">Application not found.</p>
        <Link to="/applications" className="text-[#05603a] font-semibold text-sm mt-2 inline-block">
          ← Back to Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Applications</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#05603a] text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {application.company?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{application.company}</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  application.status === 'SUBMITTED'
                    ? 'bg-emerald-50 text-[#05603a] border border-emerald-200'
                    : application.status === 'READY_FOR_REVIEW'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : application.status === 'ACTION_REQUIRED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {application.status}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 mt-1">{application.role}</p>
            <p className="text-xs text-gray-400 mt-0.5">Resume Used: {application.resume_used_name || 'Resume_v1.pdf'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Resume Match</span>
            <span className="text-2xl font-black text-[#05603a]">{application.match_score || 92}%</span>
          </div>

          {application.status === 'READY_FOR_REVIEW' && (
            <button
              onClick={() => handleReviewSubmit(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting via Playwright...' : 'Approve & Submit Application'}</span>
            </button>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* CAPTCHA / ACTION REQUIRED BANNER */}
      {application.status === 'ACTION_REQUIRED' && (
        <div className="bg-red-50/80 border-2 border-red-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900">Security Challenge (CAPTCHA) Encountered</h3>
              <p className="text-xs text-red-700 mt-1 leading-relaxed">
                Per ApplyZen Ethical Safety Policy, automated bypass of security challenges is strictly prohibited. The browser session has been paused safely. Please complete the verification in the job application portal below.
              </p>

              {application.captcha_context?.screenshot_url && (
                <div className="mt-4 p-3 bg-white rounded-xl border border-red-200 inline-block">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-2">Diagnostic CAPTCHA Challenge Image:</span>
                  <img
                    src={application.captcha_context.screenshot_url}
                    alt="CAPTCHA Challenge"
                    className="max-h-48 rounded-lg border border-gray-100 shadow-2xs"
                  />
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-red-200 flex items-center gap-3">
                <button
                  onClick={handleResolveCaptcha}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  ✓ I Have Completed the Verification — Resume Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TWO COLUMNS: Form Fields Review vs Timeline/Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Fields Review & Editing */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">AI Form Fields (Review & Edit)</h3>
              <p className="text-xs text-gray-500">Every value is grounded in your Career Knowledge Base.</p>
            </div>
            {application.status === 'READY_FOR_REVIEW' && (
              <button
                onClick={() => handleReviewSubmit(false)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Edits</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {fields.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">{f.field_label || f.field_name}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">Source: {f.source}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.confidence_level === 'HIGH'
                          ? 'bg-emerald-100 text-[#05603a]'
                          : f.confidence_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {Math.round((f.confidence || 1) * 100)}% Conf
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  value={f.user_edited_value !== null && f.user_edited_value !== undefined ? f.user_edited_value : f.value}
                  onChange={(e) => handleFieldChange(idx, e.target.value)}
                  disabled={application.status === 'SUBMITTED'}
                  className="w-full text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#05603a] font-medium text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Timeline & Testing Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive Diagnostic Testing Controls */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Workflow & Email Simulator</h4>
            <p className="text-xs text-gray-500">Test how incoming recruiter emails progress application states:</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleSimulateUpdate('assessment')}
                className="p-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer"
              >
                + Recruiter Assessment
              </button>
              <button
                onClick={() => handleSimulateUpdate('interview')}
                className="p-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
              >
                + Interview Invitation
              </button>
              <button
                onClick={() => handleSimulateUpdate('offer')}
                className="p-2 text-xs font-semibold rounded-lg bg-emerald-50 text-[#05603a] hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
              >
                + Official Job Offer 🎉
              </button>
              <button
                onClick={() => handleSimulateUpdate('rejection')}
                className="p-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                + Rejection Notice
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleTriggerCaptcha}
                className="w-full p-2 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate CAPTCHA Pause Event</span>
              </button>
            </div>
          </div>

          {/* Timeline View */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Application Timeline</h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {(application.timeline || []).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#05603a] border-2 border-white shadow-2xs"></div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{ev.title}</h5>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{ev.description}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(ev.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Activity Log */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#05603a]" />
              AI Activity Audit Log
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(application.ai_activity_log || []).map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-gray-50 text-xs border border-gray-100">
                  <div className="flex items-center justify-between text-gray-500 text-[10px]">
                    <span className="font-semibold text-emerald-800">{log.agent_name}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-gray-800 mt-1">{log.activity}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
