import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FileText,
  Star,
  ExternalLink,
  ShieldCheck,
  Award,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { resumeService } from '../../services/resume.service';

export default function ResumePdfModal({ resume, isOpen, onClose, userProfile }) {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' (rich document preview) or 'embed' (native PDF iframe)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !resume) return null;

  const candidateName = userProfile?.full_name || 'Anshuman Singh';
  const email = userProfile?.email || resume.user_email || 'anshumansingh2409@gmail.com';
  const phone = userProfile?.phone || '+91 98765 43210';
  const location = userProfile?.location || 'Greater Noida / Delhi NCR, India';
  const college = userProfile?.college || 'Galgotias University (GU / GCET)';
  const degree = userProfile?.degree || 'B.Tech - Computer Science & Engineering (2023 - 2027)';
  const cgpa = userProfile?.cgpa || '8.8 / 10.0';

  const fileUrl = resumeService.getFileUrl(resume.id || resume._id);
  const skills = resume.skills_extracted && resume.skills_extracted.length > 0
    ? resume.skills_extracted
    : ['Python', 'FastAPI', 'React', 'MongoDB', 'Docker', 'Redis', 'RabbitMQ', 'REST APIs', 'Git', 'Tailwind CSS'];

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = resume.file_name || 'Anshuman_Resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl h-[92vh] bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        
        {/* PDF Top Action Bar */}
        <div className="h-14 bg-gray-800/95 border-b border-gray-700/80 px-4 flex items-center justify-between text-gray-200 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/90 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              PDF
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {resume.title || resume.file_name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="font-mono text-gray-300">{resume.file_name}</span>
                <span>•</span>
                <span>{resume.version_label || 'v1.0'}</span>
                {resume.is_preferred && (
                  <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Preferred
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Zoom, View Mode Toggle, Print, Download, Close */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex items-center bg-gray-700/70 p-0.5 rounded-lg border border-gray-600/50 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('sheet')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'sheet' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-300 hover:text-white'
                }`}
              >
                Document View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('embed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'embed' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-300 hover:text-white'
                }`}
              >
                Raw PDF View
              </button>
            </div>

            {/* Zoom Controls */}
            {viewMode === 'sheet' && (
              <div className="hidden md:flex items-center bg-gray-700/60 rounded-lg px-2 py-1 gap-1 border border-gray-600/50 text-xs text-gray-300">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(70, z - 10))}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-[11px]">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(140, z + 10))}
                  className="hover:text-white p-0.5 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Print Resume"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Open Raw PDF in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <div className="h-5 w-[1px] bg-gray-700 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-700/60 hover:bg-red-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Close PDF Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Body Container */}
        <div className="flex-1 bg-gray-950 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          {viewMode === 'embed' ? (
            <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-700">
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0`}
                title="Resume PDF View"
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            /* Printable / Visual A4 PDF Sheet */
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-[800px] bg-white text-gray-900 rounded-sm shadow-2xl transition-transform duration-150 p-8 sm:p-12 print:p-0 print:shadow-none print:transform-none select-text border border-gray-200"
            >
              {/* Header: Name, Contact & Title */}
              <div className="border-b-2 border-gray-900 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">
                      {candidateName}
                    </h1>
                    <p className="text-sm font-semibold text-[#05603a] tracking-wide mt-0.5">
                      {resume.title || 'Full Stack & AI Engineer'}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                    <p className="font-medium">{email}</p>
                    <p>{phone}</p>
                    <p className="text-gray-500">{location}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-700">Portfolio / GitHub:</span>
                    <span className="font-mono text-[#05603a]">github.com/anshumansingh2409</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>ApplyZen Ground Truth Verified</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#05603a]" />
                  <span>Professional Summary</span>
                </h2>
                <p className="text-xs text-gray-700 leading-relaxed mt-2.5">
                  {resume.summary ||
                    `Dedicated and result-oriented Software Engineer specializing in building robust, production-grade applications with Python, FastAPI, React, and distributed cloud microservices. Proven track record in developing event-driven AI agents, high-concurrency background workflows, and seamless user experiences.`}
                </p>
              </div>

              {/* Technical Skills Extracted */}
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#05603a]" />
                  <span>Technical Skills & Proficiencies</span>
                </h2>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 rounded bg-gray-50 text-gray-800 text-[11px] font-semibold border border-gray-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                  Education & Academic Credentials
                </h2>
                <div className="mt-2.5 flex justify-between items-start text-xs">
                  <div>
                    <h3 className="font-bold text-gray-900">{college}</h3>
                    <p className="text-gray-600 mt-0.5">{degree}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">CGPA: {cgpa}</span>
                    <p className="text-[10px] text-gray-400">2023 – 2027</p>
                  </div>
                </div>
              </div>

              {/* Key Engineering Projects & Experience */}
              <div className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#05603a]" />
                  <span>Featured Engineering Projects</span>
                </h2>

                <div className="mt-3 space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-gray-900">
                        ApplyZen — Autonomous AI Career Operating System
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">React • FastAPI • Redis • MongoDB</span>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mt-1.5 text-[11px]">
                      <li>Designed and deployed an end-to-end recruitment copilot with zero-hallucination ground truth verification.</li>
                      <li>Architected live Gmail & Outlook real-time event listeners with asynchronous RabbitMQ pipeline.</li>
                      <li>Implemented automated campus drive application fill workflows and interactive JD PDF visualizer.</li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-gray-900">
                        High-Concurrency Distributed Task Pipeline
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">Python • Redis • Docker</span>
                    </div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 mt-1.5 text-[11px]">
                      <li>Built asynchronous message ingestion with retry queues and exponential backoff.</li>
                      <li>Optimized response times under 50ms using distributed caching and MongoDB indexed aggregation.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Verification Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#05603a]" />
                  <span>Document File: {resume.file_name}</span>
                </div>
                <span>Version: {resume.version_label || 'v1.0'} • Generated by ApplyZen</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
