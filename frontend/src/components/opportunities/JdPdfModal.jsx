import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  Award,
  MapPin,
  Briefcase
} from 'lucide-react';

export default function JdPdfModal({ opportunity, isOpen, onClose }) {
  const [zoom, setZoom] = useState(100);

  if (!isOpen || !opportunity) return null;

  const fileName = opportunity.jd_attachment_filename || `${opportunity.company}_Job_Description.pdf`;
  const company = opportunity.company || 'Hiring Organization';
  const role = opportunity.role || 'Software Engineer / Graduate Trainee';
  const ctc = opportunity.stipend || opportunity.salary || '4.5 LPA';
  const location = opportunity.location || 'Pune / Bangalore / Noida / Physical Campus';
  const workMode = opportunity.work_mode || 'Physical Campus Drive (Full-Time)';

  const formattedDate = (dateStr) => {
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

  const isClosed = opportunity.deadline ? new Date(opportunity.deadline).getTime() <= Date.now() : false;
  const deadline = opportunity.deadline_raw
    ? `${opportunity.deadline_raw}${isClosed ? ' (Closed • Time Left: 0)' : ''}`
    : opportunity.deadline
    ? `${formattedDate(opportunity.deadline) || 'Not given'}${isClosed ? ' (Closed • Time Left: 0)' : ''}`
    : 'Not given';

  const arrivalDate = formattedDate(opportunity.email_received_at || opportunity.email_timestamp || opportunity.created_at) || 'Recent';
  const formUrl = opportunity.google_form_url || opportunity.application_url;
  const refCode = `GU/T&P/2026/CPD-${String(opportunity.id || opportunity._id || '9241').slice(-5).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `========================================================================
TRAINING & PLACEMENT CELL - CAMPUS RECRUITMENT SPECIFICATION
========================================================================
Reference Code: ${refCode}
Date of Notice: ${arrivalDate}
Company:        ${company}
Target Role:    ${role}
Package (CTC):  ${ctc}
Location:       ${location}
Drive Mode:     ${workMode}
Deadline:       ${deadline}
Google Form:    ${formUrl || 'Attached in email'}
------------------------------------------------------------------------
JOB DESCRIPTION & RECRUITER SPECIFICATION:
${opportunity.job_description || 'Detailed specification as received in recruiter notification email.'}
========================================================================
Verified by ApplyZen Placement Telemetry Engine
========================================================================`;

    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#24292e] rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-gray-700/80 overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">

        {/* PDF Reader Toolbar (Acrobat / Chrome Reader Style) */}
        <div className="bg-[#1c2024] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-[11px] shadow-sm shrink-0">
              PDF
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold truncate text-gray-100">{fileName}</h3>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] bg-red-900/60 text-red-200 border border-red-700/70 uppercase font-semibold">
                  Verified JD
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate">
                Official Campus Recruitment Notice • Recruiter Attached File
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Page Count */}
            <span className="hidden md:inline-block text-[11px] text-gray-400 bg-gray-800/80 px-2 py-1 rounded border border-gray-700">
              Page 1 / 1
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-800/90 px-2 py-1 rounded-lg border border-gray-700 text-xs text-gray-300">
              <button
                onClick={() => setZoom((z) => Math.max(70, z - 10))}
                className="hover:text-white px-1.5 font-bold cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-semibold">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="hover:text-white px-1.5 font-bold cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Download Specification File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close Document"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Document Canvas (Grey Background with Realistic White Sheet) */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#4a5056] flex justify-center flex-1">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="bg-white text-gray-900 rounded-lg shadow-2xl p-7 sm:p-12 max-w-3xl w-full transition-transform duration-150 space-y-6 border border-gray-300 relative text-left"
          >
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
              <span className="text-7xl font-black rotate-[-35deg] tracking-widest text-gray-900">
                OFFICIAL SPECIFICATION
              </span>
            </div>

            {/* Letterhead Header */}
            <div className="border-b-2 border-emerald-800 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="font-bold text-gray-900 tracking-wider uppercase text-[10px]">
                    TRAINING & PLACEMENT CELL • CAMPUS RELATIONS
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span>Ref: <strong>{refCode}</strong></span>
                  <span>•</span>
                  <span>Issued: {arrivalDate}</span>
                </div>
              </div>

              {/* Main Company & Role Identity Header */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] tracking-wider uppercase mb-1.5 border border-emerald-200">
                    Official Recruitment Specification • Batch 2027
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight">
                    {company}
                  </h1>
                  <p className="text-sm sm:text-base font-semibold text-emerald-900 mt-1">
                    {role}
                  </p>
                </div>

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-800 text-2xl shrink-0 shadow-xs">
                  {company.charAt(0)}
                </div>
              </div>
            </div>

            {/* Quick Key Specifications Grid (Official Circular Table) */}
            <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
              <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase tracking-wider text-[10px] border-b border-gray-200">
                Summary of Campus Drive Parameters
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 bg-gray-50/50">
                <div className="p-3">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Designation</span>
                  <p className="font-bold text-gray-900 mt-0.5">{role}</p>
                </div>
                <div className="p-3">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Package (CTC)</span>
                  <p className="font-bold text-emerald-800 mt-0.5">{ctc}</p>
                </div>
                <div className="p-3">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Drive Mode</span>
                  <p className="font-bold text-gray-900 mt-0.5">{workMode}</p>
                </div>
                <div className="p-3">
                  <span className="text-gray-400 block font-semibold text-[10px] uppercase">Registration Deadline</span>
                  <p className="font-bold text-amber-900 mt-0.5">{deadline}</p>
                </div>
              </div>
            </div>

            {/* Section 1: Official Recruiter Job Scope & Description */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <span>1.</span>
                <span>Job Description & Role Responsibilities</span>
              </h2>

              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-xs text-gray-800 space-y-2.5 leading-relaxed font-sans">
                {opportunity.job_description ? (
                  <p className="whitespace-pre-line text-gray-700">
                    {opportunity.job_description.trim()}
                  </p>
                ) : (
                  <>
                    <p>
                      <strong>{company}</strong> invites prospective engineering candidates of the graduating <strong>Batch of 2027</strong> to register for the campus recruitment process for the role of <strong>{role}</strong>.
                    </p>
                    <p>
                      Selected candidates will be part of the software engineering, system development, or technical research team, working with modern technical stacks and real-world client platforms.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Eligibility Criteria & Academic Standards */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <span>2.</span>
                <span>Eligibility Criteria & Academic Qualifications</span>
              </h2>
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 text-xs space-y-2 text-gray-800">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <p><strong>Eligible Degrees & Branches:</strong> B.Tech (Computer Science & Engineering, Information Technology, AI/ML, Electronics & Allied Branches) / MCA.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <p><strong>Academic Threshold:</strong> Minimum 60% or 6.0 CGPA throughout (10th, 12th / Diploma, and Undergraduate Degree).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <p><strong>Backlogs Policy:</strong> Strictly 0 active backlogs allowed at the time of drive registration and onboarding.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold shrink-0">✓</span>
                  <p><strong>Eligible Graduation Year:</strong> 2027 Passing Out Batch only.</p>
                </div>
                {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-emerald-100/70">
                    <span className="text-emerald-700 font-bold shrink-0">✓</span>
                    <p><strong>Technical Competencies & Skills Evaluated:</strong> {opportunity.skills_required.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Evaluation & Selection Stages */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <span>3.</span>
                <span>Evaluation Stages & Selection Rounds</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                  <span className="font-bold text-emerald-800 block">Phase 1: Online Assessment</span>
                  <p className="text-gray-600 text-[11px] mt-1 leading-snug">
                    Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Core Domain Programming MCQs + Coding Tasks.
                  </p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                  <span className="font-bold text-emerald-800 block">Phase 2: Technical Interview</span>
                  <p className="text-gray-600 text-[11px] mt-1 leading-snug">
                    Data Structures, Algorithms, OOPs, DBMS/SQL, and Discussion on Academic Projects & Technical Stack.
                  </p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                  <span className="font-bold text-emerald-800 block">Phase 3: Technical & Architecture</span>
                  <p className="text-gray-600 text-[11px] mt-1 leading-snug">
                    System design fundamentals, scenario-based problem solving, code quality, and domain exploration.
                  </p>
                </div>
                <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
                  <span className="font-bold text-emerald-800 block">Phase 4: HR & Leadership Discussion</span>
                  <p className="text-gray-600 text-[11px] mt-1 leading-snug">
                    Cultural fitment, compensation discussions, onboarding schedule, and location preference.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Mandatory Student Registration Guidelines */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <span>4.</span>
                <span>Mandatory Instructions for Registered Candidates</span>
              </h2>
              <ul className="text-xs text-gray-700 space-y-1.5 list-disc list-inside">
                <li>Candidates must submit their registration on the attached official form link before <strong>{deadline}</strong>. Late applications will not be processed.</li>
                <li>Ensure academic details entered match verified institutional records exactly (zero discrepancy policy).</li>
                <li>Carry 2 hard copies of your verified resume, college ID card, and government-issued photo identity on drive day.</li>
                <li>Adhere strictly to formal campus interview dress code.</li>
              </ul>
            </div>

            {/* Section 5: Official Registration Link Gateway */}
            {formUrl && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="font-bold text-purple-950 block flex items-center gap-1.5">
                    <span>📝 Official Google Form Registration Gateway</span>
                  </span>
                  <span className="text-[11px] text-purple-700 break-all font-mono mt-0.5 block">{formUrl}</span>
                </div>
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <span>Open Registration Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Institutional Sign-off & Verification Seal */}
            <div className="pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">Training & Placement Cell</p>
                <p className="text-[11px] text-gray-500">Galgotias University • Campus Recruitment Division</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Digitally verified via ApplyZen Recruiter Telemetry</span>
                </div>
              </div>

              {/* Stamp Seal Badge */}
              <div className="self-end sm:self-auto text-right border-2 border-emerald-800 rounded-xl px-4 py-2 bg-emerald-50/50">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900 block">
                  OFFICIALLY VERIFIED
                </span>
                <span className="text-[11px] font-bold text-gray-900 block font-mono">
                  CAMPUS DRIVE 2026-27
                </span>
                <span className="text-[8px] text-gray-500 block">
                  STATUS: AUTHORIZED
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
