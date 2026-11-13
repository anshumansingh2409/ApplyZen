import React from 'react';
import {
  X,
  Printer,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Hash,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdmitCardModal({ isOpen, onClose, application }) {
  const { user } = useAuth();

  if (!isOpen || !application) return null;

  const details = application.admit_card_details || {};
  const company = application.company || details.company || 'Recruiting Company';
  const role = application.role || details.role || 'Assessment / Online Test';
  const examDate = details.exam_date || 'Scheduled Soon (Check email)';
  const testUrl = application.application_url || details.test_url || '';
  const candidateId = details.candidate_id || user?.roll_number || 'REG-2026-89410';
  const candidateName = user?.full_name || 'Candidate';
  const candidateEmail = user?.email || 'candidate@applyzen.ai';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              🎫
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Hall Ticket & Admit Card Viewer</h3>
              <p className="text-[11px] text-gray-500">Official Campus Recruitment Assessment Pass</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Admit Card Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 print:p-0">
          {/* Card Header Container */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-700/80 text-indigo-100 border border-indigo-600">
                  OFFICIAL ADMIT CARD • E-PASS
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1.5">{company}</h2>
                <p className="text-xs text-indigo-200 font-medium">{role}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Candidate</span>
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                Candidate Full Name
              </span>
              <p className="font-bold text-gray-900 text-sm">{candidateName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3 text-gray-400" />
                Registration / Roll Number
              </span>
              <p className="font-mono font-bold text-indigo-900 text-sm bg-indigo-50/60 px-2 py-0.5 rounded inline-block border border-indigo-100">
                {candidateId}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Candidate Email</span>
              <p className="font-medium text-gray-800 truncate">{candidateEmail}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Assessment Status</span>
              <p className="font-bold text-emerald-700">Admit Card Active • Slot Booked</p>
            </div>
          </div>

          {/* Exam Schedule & Venue */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assessment Schedule & Slot Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-indigo-100/80">
                <p className="text-[10px] font-semibold text-gray-500">Test Date & Time</p>
                <p className="font-bold text-gray-900 mt-0.5 text-sm">{examDate}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-indigo-100/80">
                <p className="text-[10px] font-semibold text-gray-500">Test Mode</p>
                <p className="font-bold text-gray-900 mt-0.5">Online Proctored Remote Assessment</p>
              </div>
            </div>

            {testUrl && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Direct Assessment Test Link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={testUrl}
                    className="flex-1 text-xs bg-white p-2 rounded-lg border border-gray-200 text-gray-700 font-mono select-all"
                  />
                  <a
                    href={testUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Important Examination Guidelines */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Important Instructions for Candidate</span>
            </div>
            <ul className="text-[11px] text-amber-900/90 space-y-1 list-disc list-inside">
              <li>Keep your original College ID / Govt Photo ID (Aadhaar / Voter ID / PAN) ready for verification.</li>
              <li>Ensure uninterrupted high-speed internet and continuous webcam & microphone access.</li>
              <li>Please login at least <strong>15 minutes</strong> before the scheduled assessment time.</li>
              <li>Multiple faces in camera view or browser tab switching will trigger automated proctor flags.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>ApplyZen Verified Recruiter Pass</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            {testUrl && (
              <a
                href={testUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <span>Launch Assessment</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

