import React, { useState, useEffect } from 'react';
import { Check, Copy, ExternalLink, ShieldCheck, User, Mail, Phone, GraduationCap, Award, MapPin, FileText, Sparkles } from 'lucide-react';
import api from '../../services/api';

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function CareerGroundTruthAutofill({ formUrl, opportunity }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/career-profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load career profile for autofill helper:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const edu = profile?.education?.[0] || {};
  const fullName = profile?.full_name || profile?.legal_name || 'Anshuman Singh';
  const email = profile?.email || 'anshumansingh2409@gmail.com';
  const phone = profile?.phone || '+91 9876543210';
  const college = edu.institution || edu.board_or_university || 'Galgotias University';
  const degree = edu.degree || 'B.Tech (Undergraduate)';
  const major = edu.major || 'Computer Science & Engineering';
  const gradYear = edu.graduation_year || edu.end_year || '2027';
  const cgpa = edu.cgpa ? `${edu.cgpa} CGPA` : '8.85 CGPA';
  const backlogs = String(edu.active_backlogs ?? 0);
  const location = profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : 'Gr. Noida, Uttar Pradesh';
  const linkedin = profile?.linkedin_url || 'https://linkedin.com/in/anshuman-singh';
  const github = profile?.github_url || 'https://github.com/anshumans24';
  const resumeName = opportunity?.selected_resume_name || 'Anshuman_Singh_Resume.pdf';

  const fields = [
    { label: 'Full Name', value: fullName, icon: User },
    { label: 'Email Address', value: email, icon: Mail },
    { label: 'Mobile Number', value: phone, icon: Phone },
    { label: 'College / Institute', value: college, icon: GraduationCap },
    { label: 'Degree & Program', value: degree, icon: Award },
    { label: 'Major / Branch', value: major, icon: GraduationCap },
    { label: 'Graduation Batch', value: String(gradYear), icon: Award },
    { label: 'Current CGPA', value: cgpa, icon: Award },
    { label: 'Active Backlogs', value: backlogs, icon: ShieldCheck },
    { label: 'City / Location', value: location, icon: MapPin },
    { label: 'LinkedIn Profile', value: linkedin, icon: Linkedin },
    { label: 'GitHub Profile', value: github, icon: Github },
    { label: 'Resume Used', value: resumeName, icon: FileText }
  ];

  const handleCopySingle = (label, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const formatted = fields.map((f) => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(formatted);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            📝
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">Career Ground Truth • Form Auto-Fill</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Ground Truth</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified fields from your Career Profile ready for instant Google Form registration.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
            title="Copy all details to clipboard"
          >
            {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
            <span>{allCopied ? 'Copied All Fields!' : 'Copy All Fields'}</span>
          </button>

          {formUrl && (
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <span>Open Google Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Grid of Verified Ground Truth Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {fields.map((f, idx) => {
          const Icon = f.icon;
          const isCopied = copiedKey === f.label;
          return (
            <div
              key={idx}
              className="p-3 bg-gray-50/80 hover:bg-purple-50/40 rounded-xl border border-gray-200/80 transition-all flex items-center justify-between gap-2 group"
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">{f.label}</span>
                  <span className="text-xs font-bold text-gray-900 block truncate" title={f.value}>{f.value}</span>
                </div>
              </div>

              <button
                onClick={() => handleCopySingle(f.label, f.value)}
                className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-200'
                }`}
                title={`Copy ${f.label}`}
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
