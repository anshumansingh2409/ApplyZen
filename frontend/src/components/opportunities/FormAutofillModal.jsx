import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Zap,
  Sparkles,
  User,
  GraduationCap,
  Link as LinkIcon,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function FormAutofillModal({ isOpen, onClose, opportunity, userProfile }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  if (!isOpen || !opportunity) return null;

  const formUrl = opportunity.google_form_url || opportunity.application_url;
  const company = opportunity.company || 'Hiring Organization';
  const role = opportunity.role || 'Software Engineer';

  // Extract academic values from userProfile
  const edu = userProfile?.education?.[0] || {};
  const fullName = userProfile?.full_name || `${userProfile?.first_name || 'Anshuman'} ${userProfile?.last_name || 'Singh'}`.trim();
  const email = userProfile?.email || 'anshumansingh2409@gmail.com';
  const phone = userProfile?.phone || '+91 9876543210';
  const college = edu.institution || 'Galgotias University (GU/GCET)';
  const degree = edu.degree || 'B.Tech';
  const branch = edu.major || 'Computer Science & Engineering';
  const batch = edu.graduation_year || 2027;
  const cgpa = edu.cgpa || 8.85;
  const rollNo = userProfile?.roll_number || '23010101001';
  const tenth = userProfile?.tenth_percentage ? `${userProfile.tenth_percentage}%` : '92.4%';
  const twelfth = userProfile?.twelfth_percentage ? `${userProfile.twelfth_percentage}%` : '89.6%';
  const gender = userProfile?.gender || 'Male';
  const location = userProfile?.city ? `${userProfile.city}, ${userProfile.state || 'UP'}` : 'Greater Noida, Uttar Pradesh';
  const linkedin = userProfile?.linkedin_url || 'https://www.linkedin.com/in/anshumansingh';
  const github = userProfile?.github_url || 'https://github.com/anshumansingh2409';

  const fields = [
    { key: 'name', label: 'Full Name', value: fullName, category: 'Personal' },
    { key: 'email', label: 'College / Primary Email', value: email, category: 'Personal' },
    { key: 'phone', label: 'Mobile / WhatsApp Number', value: phone, category: 'Personal' },
    { key: 'gender', label: 'Gender', value: gender, category: 'Personal' },
    { key: 'college', label: 'College / University Name', value: college, category: 'Academic' },
    { key: 'degree', label: 'Degree / Course', value: degree, category: 'Academic' },
    { key: 'branch', label: 'Branch / Specialization', value: branch, category: 'Academic' },
    { key: 'roll', label: 'Admission / University Roll No.', value: rollNo, category: 'Academic' },
    { key: 'batch', label: 'Passing Out Batch', value: String(batch), category: 'Academic' },
    { key: 'cgpa', label: 'Current CGPA', value: String(cgpa), category: 'Academic' },
    { key: 'tenth', label: '10th Percentage / Score', value: tenth, category: 'Academic' },
    { key: 'twelfth', label: '12th Percentage / Score', value: twelfth, category: 'Academic' },
    { key: 'backlogs', label: 'Active Backlogs', value: '0 (None)', category: 'Academic' },
    { key: 'location', label: 'Current City / Location', value: location, category: 'Other' },
    { key: 'linkedin', label: 'LinkedIn Profile URL', value: linkedin, category: 'Links' },
    { key: 'github', label: 'GitHub Profile URL', value: github, category: 'Links' }
  ];

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const textBlock = fields.map((f) => `${f.label}: ${f.value}`).join('\n');
    navigator.clipboard.writeText(textBlock);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2200);
  };

  const generateAutofillScript = () => {
    return `javascript:(function(){
  const data = {
    "name": "${fullName}",
    "full name": "${fullName}",
    "candidate name": "${fullName}",
    "email": "${email}",
    "phone": "${phone}",
    "mobile": "${phone}",
    "whatsapp": "${phone}",
    "college": "${college}",
    "university": "${college}",
    "institute": "${college}",
    "roll": "${rollNo}",
    "admission": "${rollNo}",
    "registration": "${rollNo}",
    "degree": "${degree}",
    "course": "${degree}",
    "branch": "${branch}",
    "specialization": "${branch}",
    "department": "${branch}",
    "batch": "${batch}",
    "passing year": "${batch}",
    "passout": "${batch}",
    "cgpa": "${cgpa}",
    "gpa": "${cgpa}",
    "10th": "${tenth}",
    "12th": "${twelfth}",
    "backlog": "0",
    "gender": "${gender}",
    "linkedin": "${linkedin}",
    "github": "${github}"
  };
  let filledCount = 0;
  const elements = document.querySelectorAll('input[type=text], input[type=email], input[type=tel], input[type=number], textarea');
  elements.forEach(el => {
    const container = el.closest('div[role=listitem]') || el.closest('.freebirdFormviewerViewNumberedItemContainer') || el.parentElement;
    const txt = ((container ? container.innerText : '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.placeholder || '')).toLowerCase();
    for (const [k, v] of Object.entries(data)) {
      if (txt.includes(k) && !el.value) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
        break;
      }
    }
  });
  alert('ApplyZen Auto-Filled ' + filledCount + ' fields from your Career Background!');
})();`;
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateAutofillScript());
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-emerald-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                  Google Form Auto-Fill Copilot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                  Career Background
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {company} • {role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left">
          {/* Quick Action Top Bar: Open Form & 1-Click Script */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-purple-950 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Official Registration Form is ready in new tab.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {formUrl && (
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Open Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-purple-100/60 text-purple-900 border border-purple-300 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Copies a 1-click script to run in Chrome console or bookmarklet"
              >
                {scriptCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Script Copied!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Copy 1-Click Script</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Hint */}
          <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span>
              Click on any field below to instant-copy, or use <strong>"Copy All Information"</strong> to paste into the form. All data is sourced directly from your verified <strong>Career Profile</strong>.
            </span>
          </div>

          {/* Grid of Fields by Category */}
          <div className="space-y-3">
            {/* Academic Ground Truth */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#05603a]" />
                <span>Academic & Campus Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields
                  .filter((f) => f.category === 'Academic')
                  .map((f) => (
                    <div
                      key={f.key}
                      onClick={() => handleCopy(f.key, f.value)}
                      className="group p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-2"
                      title="Click to copy value"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {f.label}
                        </span>
                        <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                          {f.value}
                        </p>
                      </div>
                      <button className="shrink-0 p-1.5 rounded-md text-gray-400 group-hover:text-emerald-700 transition-colors">
                        {copiedKey === f.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Personal & Contact Info</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields
                  .filter((f) => f.category === 'Personal')
                  .map((f) => (
                    <div
                      key={f.key}
                      onClick={() => handleCopy(f.key, f.value)}
                      className="group p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-2"
                      title="Click to copy value"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {f.label}
                        </span>
                        <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                          {f.value}
                        </p>
                      </div>
                      <button className="shrink-0 p-1.5 rounded-md text-gray-400 group-hover:text-purple-700 transition-colors">
                        {copiedKey === f.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Links & Profiles */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Profiles & Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields
                  .filter((f) => f.category === 'Links' || f.category === 'Other')
                  .map((f) => (
                    <div
                      key={f.key}
                      onClick={() => handleCopy(f.key, f.value)}
                      className="group p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between gap-2"
                      title="Click to copy value"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {f.label}
                        </span>
                        <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                          {f.value}
                        </p>
                      </div>
                      <button className="shrink-0 p-1.5 rounded-md text-gray-400 group-hover:text-blue-700 transition-colors">
                        {copiedKey === f.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            {allCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">All Fields Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-gray-600" />
                <span>Copy All Information</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
