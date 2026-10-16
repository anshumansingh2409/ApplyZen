import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Code,
  Briefcase,
  Layers,
  Shield,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  MapPin,
  Globe,
  Languages,
  DollarSign,
  Building,
  Camera,
  Upload,
  Check
} from 'lucide-react';
import { profileService } from '../../services/assistant.service';

const TABS = [
  { id: 'personal', label: 'Personal & Contact', icon: User },
  { id: 'work_auth', label: 'Work Auth & Pay', icon: DollarSign },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: Layers },
  { id: 'education', label: 'Education & Gaps', icon: GraduationCap },
  { id: 'skills', label: 'Skills & Languages', icon: Code },
  { id: 'portfolios', label: 'Links & Portfolios', icon: Globe },
  { id: 'eeo', label: 'EEO & Disclosures', icon: Shield },
  { id: 'policies', label: 'AI Policies', icon: Sparkles },
];

const COUNTRY_CODES = [
  { code: '+91', label: '+91 (India)' },
  { code: '+1', label: '+1 (USA / Canada)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+61', label: '+61 (Australia)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+65', label: '+65 (Singapore)' },
  { code: '+971', label: '+971 (UAE)' },
  { code: '+33', label: '+33 (France)' },
  { code: '+81', label: '+81 (Japan)' },
  { code: '+41', label: '+41 (Switzerland)' },
  { code: '+31', label: '+31 (Netherlands)' },
  { code: '+353', label: '+353 (Ireland)' },
  { code: '+966', label: '+966 (Saudi Arabia)' },
  { code: '+880', label: '+880 (Bangladesh)' },
  { code: '+977', label: '+977 (Nepal)' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CareerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Technical', level: 'Intermediate' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        const sanitized = {
          ...data,
          avatar_url: data.avatar_url || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone_country_code: data.phone_country_code || '+91',
          phone: data.phone ? data.phone.replace(/^\+\d+\s*/, '') : '',
          alt_phone_country_code: data.alt_phone_country_code || '+91',
          alt_phone: data.alt_phone ? data.alt_phone.replace(/^\+\d+\s*/, '') : '',

          // Current Address
          street_address: data.street_address || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || 'India',

          // Permanent Address
          same_as_permanent: data.same_as_permanent ?? true,
          permanent_street_address: data.permanent_street_address || data.street_address || '',
          permanent_city: data.permanent_city || data.city || '',
          permanent_state: data.permanent_state || data.state || '',
          permanent_postal_code: data.permanent_postal_code || data.postal_code || '',
          permanent_country: data.permanent_country || data.country || 'India',

          is_fresher: data.is_fresher ?? false,
          work_authorization: data.work_authorization || {
            authorized_in_target_country: true,
            requires_sponsorship: false,
            visa_status: 'Citizen / Permanent Resident',
            notice_period_days: 15,
            serving_notice: false,
            last_working_day: '',
            current_ctc: '',
            expected_ctc: '₹18,00,000 (18 LPA)',
            currency: 'INR'
          },
          eeo_disclosures: data.eeo_disclosures || {
            gender: 'Male',
            veteran_status: 'I am not a protected veteran',
            disability_status: 'No, I do not have a disability',
            ethnicity: 'Asian'
          },
          languages: data.languages && data.languages.length > 0 ? data.languages : [
            { name: 'English', proficiency: 'Fluent' },
            { name: 'Hindi', proficiency: 'Native' }
          ],
          education: data.education && data.education.length > 0 ? data.education : [
            {
              institution: 'Delhi Public School',
              degree: '10th',
              board_or_university: 'CBSE',
              major: 'General',
              start_year: 2017,
              end_year: 2019,
              score_type: 'percentage',
              percentage: 91.5,
              cgpa: null,
              active_backlogs: 0
            },
            {
              institution: 'Delhi Public School',
              degree: '12th',
              board_or_university: 'CBSE',
              major: 'Science (PCM)',
              start_year: 2019,
              end_year: 2021,
              score_type: 'percentage',
              percentage: 89.2,
              cgpa: null,
              active_backlogs: 0
            },
            {
              institution: 'National Institute of Technology',
              degree: 'Undergraduate',
              board_or_university: 'NIT Trichy',
              major: 'Computer Science & Engineering',
              start_month: 'August',
              start_year: 2021,
              end_month: 'May',
              end_year: 2025,
              graduation_year: 2025,
              score_type: 'cgpa',
              cgpa: 8.85,
              percentage: null,
              active_backlogs: 0,
              total_backlogs: 0
            }
          ],
          experience: data.experience || [
            {
              company: 'Tech Innovators Inc',
              role: 'Software Engineering Intern',
              employment_type: 'Internship',
              location: 'Bengaluru / Remote',
              is_current: false,
              start_date: '2024-05',
              end_date: '2024-08',
              description: 'Architected event-driven microservices, accelerated query throughput by 40%, and created automated regression test pipelines.',
              skills_used: ['Python', 'FastAPI', 'MongoDB', 'Docker']
            }
          ],
          projects: data.projects && data.projects.length > 0 ? data.projects : [
            {
              title: 'ApplyZen Autonomous Career Copilot',
              description: 'Autonomous career management platform that automates application workflows with zero hallucinations and real-time DOM form filling.',
              technologies: ['React', 'FastAPI', 'MongoDB', 'Playwright'],
              github_url: 'https://github.com/applicant/applyzen',
              live_url: 'https://applyzen.dev'
            }
          ],
          certifications: data.certifications || [],
          skills: data.skills && data.skills.length > 0 ? data.skills : [
            { name: 'Python', category: 'Technical', level: 'Expert' },
            { name: 'FastAPI', category: 'Technical', level: 'Advanced' },
            { name: 'React.js', category: 'Technical', level: 'Advanced' },
            { name: 'MongoDB', category: 'Technical', level: 'Advanced' }
          ],
          linkedin_url: data.linkedin_url || 'https://linkedin.com/in/applicant',
          github_url: data.github_url || 'https://github.com/applicant',
          portfolio_url: data.portfolio_url || 'https://applicant.dev',
          bio: data.bio || 'Software Engineer with expertise in scalable microservices, backend architectures, and AI-driven automation.',
          gap_year: data.gap_year || { has_gap: false, gap_years: 0, reason: '' },
          preferences: data.preferences || {
            desired_roles: ['Software Engineer', 'Full Stack Developer'],
            preferred_locations: ['Bengaluru', 'Remote', 'Hyderabad'],
            work_modes: ['Remote', 'Hybrid'],
            will_relocate: true,
            notice_period_days: 15
          },
          automation_policy: data.automation_policy || {
            application_mode: 'APPROVAL_MODE',
            salary_policy: 'ASK_USER',
            relocation_policy: 'ALLOW',
            legal_declaration_policy: 'ASK_USER'
          }
        };
        setProfile(sanitized);
      } catch (err) {
        console.error('Error fetching career profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Validation function for each tab (Only for tab header tick marks)
  const getTabStatus = (tabId) => {
    if (!profile) return false;
    switch (tabId) {
      case 'personal':
        return Boolean(
          profile.first_name?.trim() &&
          profile.phone?.trim() &&
          profile.city?.trim() &&
          profile.country?.trim() &&
          profile.postal_code?.trim()
        );
      case 'work_auth':
        return Boolean(
          profile.work_authorization?.visa_status &&
          (profile.work_authorization?.expected_ctc?.trim() || profile.work_authorization?.current_ctc?.trim()) &&
          profile.work_authorization?.notice_period_days !== undefined
        );
      case 'experience':
        return Boolean(
          profile.is_fresher ||
          (profile.experience && profile.experience.length > 0 && profile.experience[0]?.company?.trim() && profile.experience[0]?.role?.trim())
        );
      case 'projects':
        return Boolean(
          profile.projects &&
          profile.projects.length > 0 &&
          profile.projects[0]?.title?.trim() &&
          profile.projects[0]?.description?.trim()
        );
      case 'education':
        return Boolean(
          profile.education &&
          profile.education.length >= 2 &&
          profile.education.every((e) => e.institution?.trim())
        );
      case 'skills':
        return Boolean(
          profile.skills &&
          profile.skills.length >= 3 &&
          profile.languages &&
          profile.languages.length >= 1 &&
          profile.languages[0]?.name?.trim()
        );
      case 'portfolios':
        return Boolean(
          profile.linkedin_url?.trim() &&
          (profile.github_url?.trim() || profile.portfolio_url?.trim())
        );
      case 'eeo':
        return Boolean(
          profile.eeo_disclosures?.veteran_status &&
          profile.eeo_disclosures?.disability_status &&
          profile.eeo_disclosures?.ethnicity
        );
      case 'policies':
        return Boolean(
          profile.automation_policy?.application_mode &&
          profile.automation_policy?.salary_policy
        );
      default:
        return false;
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCurrentAddressChange = (field, value) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      if (prev.same_as_permanent) {
        if (field === 'street_address') updated.permanent_street_address = value;
        if (field === 'city') updated.permanent_city = value;
        if (field === 'state') updated.permanent_state = value;
        if (field === 'postal_code') updated.permanent_postal_code = value;
        if (field === 'country') updated.permanent_country = value;
      }
      return updated;
    });
  };

  const handleSameAsPermanentToggle = (checked) => {
    setProfile((prev) => ({
      ...prev,
      same_as_permanent: checked,
      permanent_street_address: checked ? prev.street_address : prev.permanent_street_address,
      permanent_city: checked ? prev.city : prev.permanent_city,
      permanent_state: checked ? prev.state : prev.permanent_state,
      permanent_postal_code: checked ? prev.postal_code : prev.permanent_postal_code,
      permanent_country: checked ? prev.country : prev.permanent_country
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const updated = await profileService.updateProfile(profile);
      setProfile(updated);
      setNotice('Profile updated successfully! All verified details are ready for auto-filling.');
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error(err);
      setNotice('Failed to update profile. Please verify required fields.');
    } finally {
      setSaving(false);
    }
  };

  const completedCount = TABS.filter((t) => getTabStatus(t.id)).length;

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-[#05603a] mb-2" />
        <p className="text-xs font-semibold text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Career Profile</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {completedCount} of {TABS.length} completed
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Fill your details once. ApplyZen uses this verified data to autofill job applications with zero errors.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* Tabs Bar with Clean Tick Marks (Only on Tabs) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xs p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isComplete = getTabStatus(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${isActive
                  ? 'bg-[#05603a] text-white shadow-2xs'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              {isComplete && (
                <span
                  className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white text-[#05603a]' : 'bg-[#05603a] text-white'
                    }`}
                  title="Completed"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <form onSubmit={handleSave} className="space-y-5">

        {/* 1. PERSONAL & CONTACT */}
        {activeTab === 'personal' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
              {/* Header without internal tick mark badge */}
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Personal & Contact Coordinates</h2>
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-200/60">
                <div className="relative w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 overflow-hidden shrink-0 flex items-center justify-center text-emerald-800 font-bold text-xl shadow-xs">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-xs font-bold text-gray-900">Profile Photo</h3>
                  <p className="text-[11px] text-gray-500">
                    PNG, JPG, or GIF up to 5MB. Used for identity verification and company profile previews.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05603a] text-white text-xs font-semibold hover:bg-[#034a27] cursor-pointer transition-colors shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{profile?.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    {profile?.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, avatar_url: '' })}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anshuman"
                    value={profile?.first_name || ''}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Singh"
                    value={profile?.last_name || ''}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    placeholder="As on Government ID"
                    value={profile?.legal_name || ''}
                    onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  />
                </div>

                {/* Primary Phone with Country Code Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Phone *</label>
                  <div className="flex rounded-lg border border-gray-200 bg-gray-50/70 overflow-hidden focus-within:bg-white focus-within:border-[#05603a]">
                    <select
                      value={profile?.phone_country_code || '+91'}
                      onChange={(e) => setProfile({ ...profile, phone_country_code: e.target.value })}
                      className="text-xs bg-transparent border-r border-gray-200 px-2.5 py-2 text-gray-800 font-semibold focus:outline-none shrink-0"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="9876543210"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full text-xs bg-transparent p-2 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Alternate Phone with Country Code Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Alternate Contact No.</label>
                  <div className="flex rounded-lg border border-gray-200 bg-gray-50/70 overflow-hidden focus-within:bg-white focus-within:border-[#05603a]">
                    <select
                      value={profile?.alt_phone_country_code || '+91'}
                      onChange={(e) => setProfile({ ...profile, alt_phone_country_code: e.target.value })}
                      className="text-xs bg-transparent border-r border-gray-200 px-2.5 py-2 text-gray-800 font-semibold focus:outline-none shrink-0"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>{item.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="9123456780"
                      value={profile?.alt_phone || ''}
                      onChange={(e) => setProfile({ ...profile, alt_phone: e.target.value })}
                      className="w-full text-xs bg-transparent p-2 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profile?.dob || ''}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={profile?.gender || 'Male'}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality *</label>
                  <input
                    type="text"
                    required
                    placeholder="Indian"
                    value={profile?.nationality || 'Indian'}
                    onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                  />
                </div>
              </div>

              {/* CURRENT ADDRESS */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#05603a]" />
                  <span>Current Residential Address</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address / House No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Green Glen Layout, Bellandur"
                      value={profile?.street_address || ''}
                      onChange={(e) => handleCurrentAddressChange('street_address', e.target.value)}
                      className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={profile?.city || ''}
                      onChange={(e) => handleCurrentAddressChange('city', e.target.value)}
                      className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="Karnataka"
                      value={profile?.state || ''}
                      onChange={(e) => handleCurrentAddressChange('state', e.target.value)}
                      className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">PIN / Postal Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="560103"
                      value={profile?.postal_code || ''}
                      onChange={(e) => handleCurrentAddressChange('postal_code', e.target.value)}
                      className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      placeholder="India"
                      value={profile?.country || 'India'}
                      onChange={(e) => handleCurrentAddressChange('country', e.target.value)}
                      className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                    />
                  </div>
                </div>
              </div>

              {/* PERMANENT ADDRESS WITH 'SAME AS CURRENT' FEATURE */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Permanent Address</span>
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <input
                      type="checkbox"
                      checked={profile?.same_as_permanent || false}
                      onChange={(e) => handleSameAsPermanentToggle(e.target.checked)}
                      className="rounded text-[#05603a] focus:ring-[#05603a] w-4 h-4"
                    />
                    <span className="text-xs font-bold text-emerald-900">Same as current address</span>
                  </label>
                </div>

                {profile?.same_as_permanent ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-600 font-medium">
                      ✓ Permanent address is automatically matched with current address. No need to fill again.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent Street Address</label>
                      <input
                        type="text"
                        placeholder="Permanent Street / House No."
                        value={profile?.permanent_street_address || ''}
                        onChange={(e) => setProfile({ ...profile, permanent_street_address: e.target.value })}
                        className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent City</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={profile?.permanent_city || ''}
                        onChange={(e) => setProfile({ ...profile, permanent_city: e.target.value })}
                        className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={profile?.permanent_state || ''}
                        onChange={(e) => setProfile({ ...profile, permanent_state: e.target.value })}
                        className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent PIN / Postal Code</label>
                      <input
                        type="text"
                        placeholder="PIN Code"
                        value={profile?.permanent_postal_code || ''}
                        onChange={(e) => setProfile({ ...profile, permanent_postal_code: e.target.value })}
                        className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Permanent Country</label>
                      <input
                        type="text"
                        placeholder="India"
                        value={profile?.permanent_country || 'India'}
                        onChange={(e) => setProfile({ ...profile, permanent_country: e.target.value })}
                        className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 focus:bg-white focus:outline-none focus:border-[#05603a]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. WORK AUTH & PAY */}
        {activeTab === 'work_auth' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Work Authorization & Compensation</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Visa / Citizenship Status *</label>
                  <select
                    value={profile?.work_authorization?.visa_status || 'Citizen / Permanent Resident'}
                    onChange={(e) => setProfile({
                      ...profile,
                      work_authorization: { ...profile.work_authorization, visa_status: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="Citizen / Permanent Resident">Citizen / Permanent Resident (India / Local)</option>
                    <option value="F-1 OPT / STEM OPT">F-1 Student Visa (OPT / STEM OPT)</option>
                    <option value="H-1B Visa">H-1B Specialty Occupation</option>
                    <option value="EU Blue Card">EU Blue Card</option>
                    <option value="Other / Not Applicable">Other / Not Applicable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notice Period *</label>
                  <select
                    value={profile?.work_authorization?.notice_period_days ?? 15}
                    onChange={(e) => setProfile({
                      ...profile,
                      work_authorization: { ...profile.work_authorization, notice_period_days: parseInt(e.target.value) }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value={0}>Immediate Joiner (0 days)</option>
                    <option value={15}>15 Days or less</option>
                    <option value={30}>1 Month (30 Days)</option>
                    <option value={60}>2 Months (60 Days)</option>
                    <option value={90}>3 Months (90 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Annual CTC</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹12,00,000 or 12 LPA"
                    value={profile?.work_authorization?.current_ctc || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      work_authorization: { ...profile.work_authorization, current_ctc: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Annual CTC *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18,00,000 or 18 LPA"
                    value={profile?.work_authorization?.expected_ctc || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      work_authorization: { ...profile.work_authorization, expected_ctc: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200 font-bold text-emerald-800"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile?.work_authorization?.requires_sponsorship || false}
                      onChange={(e) => setProfile({
                        ...profile,
                        work_authorization: { ...profile.work_authorization, requires_sponsorship: e.target.checked }
                      })}
                      className="rounded text-[#05603a]"
                    />
                    <span>Will require Visa Sponsorship now or in future</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. WORK EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Work Experience & Internships</h2>
                </div>
              </div>

              {/* Fresher Mode Toggle */}
              <div className="p-3 bg-gray-50/80 rounded-xl flex items-center justify-between border border-gray-200/70">
                <span className="text-xs font-semibold text-gray-700">I am a fresher / entry-level candidate (No corporate experience required)</span>
                <input
                  type="checkbox"
                  checked={profile?.is_fresher || false}
                  onChange={(e) => setProfile({ ...profile, is_fresher: e.target.checked })}
                  className="rounded text-[#05603a] w-4 h-4"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const currentExp = profile?.experience || [];
                    setProfile({
                      ...profile,
                      experience: [
                        ...currentExp,
                        {
                          company: '',
                          role: '',
                          employment_type: 'Full-time',
                          location: '',
                          start_date: '2023-01',
                          end_date: 'Present',
                          description: ''
                        }
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#05603a] text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              <div className="space-y-4">
                {(profile?.experience || []).map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-bold text-gray-700">#{idx + 1} {exp.role || 'Role'} at {exp.company || 'Company'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = profile.experience.filter((_, i) => i !== idx);
                          setProfile({ ...profile, experience: updated });
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Company *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Google"
                          value={exp.company || ''}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[idx].company = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Job Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="Software Engineer"
                          value={exp.role || ''}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[idx].role = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Employment Type</label>
                        <select
                          value={exp.employment_type || 'Full-time'}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[idx].employment_type = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Internship">Internship</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Description / Key Responsibilities</label>
                        <textarea
                          rows={2}
                          placeholder="Describe responsibilities and impact..."
                          value={exp.description || ''}
                          onChange={(e) => {
                            const updated = [...profile.experience];
                            updated[idx].description = e.target.value;
                            setProfile({ ...profile, experience: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. PROJECTS SECTION */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Key Technical Projects</h2>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const currentProj = profile?.projects || [];
                    setProfile({
                      ...profile,
                      projects: [
                        ...currentProj,
                        {
                          title: '',
                          description: '',
                          technologies: [],
                          github_url: '',
                          live_url: ''
                        }
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#05603a] text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {(profile?.projects || []).map((proj, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-xs font-bold text-gray-800">#{idx + 1} {proj.title || 'Untitled Project'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = profile.projects.filter((_, i) => i !== idx);
                          setProfile({ ...profile, projects: updated });
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Project Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Distributed Task Scheduler"
                          value={proj.title || ''}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].title = e.target.value;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tech Stack (comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Python, FastAPI, Docker, Redis"
                          value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].technologies = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">GitHub / Code Repo URL</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username/project"
                          value={proj.github_url || ''}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].github_url = e.target.value;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Live Demo / Deployed Link</label>
                        <input
                          type="url"
                          placeholder="https://project-demo.com"
                          value={proj.live_url || ''}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].live_url = e.target.value;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Project Description & Highlights *</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Explain what the project does, key technical architecture, and impact..."
                          value={proj.description || ''}
                          onChange={(e) => {
                            const updated = [...profile.projects];
                            updated[idx].description = e.target.value;
                            setProfile({ ...profile, projects: updated });
                          }}
                          className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. EDUCATION & GAPS (Conditional Algorithm for UG/PG vs 10th/12th) */}
        {activeTab === 'education' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Education & Academic Qualifications</h2>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const currentEdu = profile?.education || [];
                    setProfile({
                      ...profile,
                      education: [
                        ...currentEdu,
                        {
                          degree: 'Undergraduate',
                          institution: '',
                          board_or_university: '',
                          major: '',
                          start_month: 'August',
                          start_year: 2021,
                          end_month: 'May',
                          end_year: 2025,
                          graduation_year: 2025,
                          score_type: 'cgpa',
                          cgpa: 8.5,
                          percentage: null,
                          active_backlogs: 0
                        }
                      ]
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#05603a] text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Qualification</span>
                </button>
              </div>

              <div className="space-y-4">
                {(profile?.education || []).map((edu, idx) => {
                  const isSchool = edu.degree === '10th' || edu.degree === '12th';
                  const isCollege = edu.degree === 'Undergraduate' || edu.degree === 'Postgraduate';

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                        <span className="text-xs font-bold text-gray-800">
                          #{idx + 1} {edu.degree} — {edu.institution || (isSchool ? 'School' : 'College / University')}
                        </span>
                        {profile.education.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = profile.education.filter((_, i) => i !== idx);
                              setProfile({ ...profile, education: updated });
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Level Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">Education Level *</label>
                          <select
                            value={edu.degree || 'Undergraduate'}
                            onChange={(e) => {
                              const updated = [...profile.education];
                              const newDeg = e.target.value;
                              updated[idx].degree = newDeg;
                              if (newDeg === '10th' || newDeg === '12th') {
                                updated[idx].score_type = 'percentage';
                                updated[idx].cgpa = null;
                                updated[idx].percentage = updated[idx].percentage || 85.0;
                              } else {
                                updated[idx].score_type = 'cgpa';
                                updated[idx].percentage = null;
                                updated[idx].cgpa = updated[idx].cgpa || 8.5;
                              }
                              setProfile({ ...profile, education: updated });
                            }}
                            className="w-full text-xs bg-white p-2.5 rounded-lg border border-gray-200 font-semibold text-gray-900"
                          >
                            <option value="10th">10th (Secondary School)</option>
                            <option value="12th">12th (Higher Secondary)</option>
                            <option value="Undergraduate">Undergraduate (B.Tech / B.E. / B.Sc)</option>
                            <option value="Postgraduate">Postgraduate (M.Tech / M.S. / MCA)</option>
                          </select>
                        </div>

                        {/* ============================================================== */}
                        {/* CONDITIONAL BRANCH A: COLLEGE (UG or PG) */}
                        {/* ============================================================== */}
                        {isCollege && (
                          <>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">College / University Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. National Institute of Technology, Trichy"
                                value={edu.institution || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].institution = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2.5 rounded-lg border border-gray-200"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">Degree / Branch *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. B.Tech Computer Science"
                                value={edu.major || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].major = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2.5 rounded-lg border border-gray-200"
                              />
                            </div>

                            {/* Start Month & Year */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Month</label>
                              <select
                                value={edu.start_month || 'August'}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].start_month = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                              >
                                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Year</label>
                              <input
                                type="number"
                                placeholder="2021"
                                value={edu.start_year || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].start_year = parseInt(e.target.value) || null;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                              />
                            </div>

                            {/* End Month & Year */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">End Month</label>
                              <select
                                value={edu.end_month || 'May'}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].end_month = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                              >
                                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">End / Graduation Year *</label>
                              <input
                                type="number"
                                required
                                placeholder="2025"
                                value={edu.end_year || edu.graduation_year || 2025}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 2025;
                                  const updated = [...profile.education];
                                  updated[idx].end_year = val;
                                  updated[idx].graduation_year = val;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200 font-bold"
                              />
                            </div>

                            {/* CGPA */}
                            <div>
                              <label className="block text-[11px] font-bold text-gray-800 mb-1">CGPA (out of 10) *</label>
                              <input
                                type="number"
                                step="0.01"
                                max="10"
                                min="0"
                                required
                                placeholder="8.85"
                                value={edu.cgpa || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  const score = parseFloat(e.target.value) || 0;
                                  updated[idx].cgpa = score;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200 font-bold text-emerald-800"
                              />
                            </div>

                            {/* Active Backlogs */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Active Backlogs Count</label>
                              <input
                                type="number"
                                min="0"
                                value={edu.active_backlogs ?? 0}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].active_backlogs = parseInt(e.target.value) || 0;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200 font-medium"
                              />
                            </div>
                          </>
                        )}

                        {/* ============================================================== */}
                        {/* CONDITIONAL BRANCH B: 10th & 12th (School with Percentage) */}
                        {/* ============================================================== */}
                        {isSchool && (
                          <>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">School Name *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Delhi Public School"
                                value={edu.institution || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].institution = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2.5 rounded-lg border border-gray-200"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">Board / Stream</label>
                              <input
                                type="text"
                                placeholder={edu.degree === '12th' ? "CBSE - Science (PCM)" : "CBSE - General"}
                                value={edu.major || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].major = e.target.value;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2.5 rounded-lg border border-gray-200"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Start Year</label>
                              <input
                                type="number"
                                placeholder="2017"
                                value={edu.start_year || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  updated[idx].start_year = parseInt(e.target.value) || null;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">End / Passing Year *</label>
                              <input
                                type="number"
                                required
                                placeholder="2019"
                                value={edu.end_year || edu.graduation_year || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 2019;
                                  const updated = [...profile.education];
                                  updated[idx].end_year = val;
                                  updated[idx].graduation_year = val;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-gray-800 mb-1">Score Percentage (%) *</label>
                              <input
                                type="number"
                                step="0.01"
                                max="100"
                                min="0"
                                required
                                placeholder="91.5"
                                value={edu.percentage || ''}
                                onChange={(e) => {
                                  const updated = [...profile.education];
                                  const score = parseFloat(e.target.value) || 0;
                                  updated[idx].percentage = score;
                                  setProfile({ ...profile, education: updated });
                                }}
                                className="w-full text-xs bg-white p-2 rounded-lg border border-gray-200 font-bold text-emerald-800"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 6. SKILLS & LANGUAGES */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Code className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Technical Skills & Languages</h2>
                </div>
              </div>

              {/* Add Skill */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Docker, TypeScript, AWS)..."
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="flex-1 text-xs bg-gray-50 p-2 rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSkill.name.trim()) return;
                    setProfile({
                      ...profile,
                      skills: [...(profile.skills || []), { ...newSkill }]
                    });
                    setNewSkill({ name: '', category: 'Technical', level: 'Intermediate' });
                  }}
                  className="px-3.5 py-2 bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(profile?.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#05603a] text-xs font-bold border border-emerald-200"
                  >
                    <span>{sk.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = profile.skills.filter((_, i) => i !== idx);
                        setProfile({ ...profile, skills: updated });
                      }}
                      className="text-emerald-700 hover:text-red-600 font-bold ml-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. LINKS & PORTFOLIOS */}
        {activeTab === 'portfolios' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Links & Online Footprint</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">LinkedIn Profile *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://linkedin.com/in/username"
                    value={profile?.linkedin_url || ''}
                    onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">GitHub Profile *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/username"
                    value={profile?.github_url || ''}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Portfolio / Website</label>
                  <input
                    type="url"
                    placeholder="https://yourname.dev"
                    value={profile?.portfolio_url || ''}
                    onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">LeetCode / Coding Profile</label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/username"
                    value={profile?.leetcode_url || ''}
                    onChange={(e) => setProfile({ ...profile, leetcode_url: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bio / Professional Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Summary of background and expertise..."
                    value={profile?.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. EEO & DISCLOSURES */}
        {activeTab === 'eeo' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">Equal Opportunity Disclosures (EEO)</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Veteran Status</label>
                  <select
                    value={profile?.eeo_disclosures?.veteran_status || 'I am not a protected veteran'}
                    onChange={(e) => setProfile({
                      ...profile,
                      eeo_disclosures: { ...profile.eeo_disclosures, veteran_status: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="I am not a protected veteran">I am not a protected veteran</option>
                    <option value="I identify as a protected veteran">I identify as a protected veteran</option>
                    <option value="I choose not to disclose">I choose not to disclose</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Disability Status</label>
                  <select
                    value={profile?.eeo_disclosures?.disability_status || 'No, I do not have a disability'}
                    onChange={(e) => setProfile({
                      ...profile,
                      eeo_disclosures: { ...profile.eeo_disclosures, disability_status: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="No, I do not have a disability">No, I do not have a disability</option>
                    <option value="Yes, I have a disability">Yes, I have a disability</option>
                    <option value="I choose not to answer">I choose not to answer</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ethnicity / Race</label>
                  <select
                    value={profile?.eeo_disclosures?.ethnicity || 'Asian'}
                    onChange={(e) => setProfile({
                      ...profile,
                      eeo_disclosures: { ...profile.eeo_disclosures, ethnicity: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="Asian">Asian (including Indian subcontinent)</option>
                    <option value="White">White</option>
                    <option value="Black or African American">Black or African American</option>
                    <option value="Decline to self-identify">Decline to self-identify</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. AI POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#05603a]" />
                  <h2 className="text-sm font-bold text-gray-900">AI Safety & Approval Policies</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Mode</label>
                  <select
                    value={profile?.automation_policy?.application_mode || 'APPROVAL_MODE'}
                    onChange={(e) => setProfile({
                      ...profile,
                      automation_policy: { ...profile.automation_policy, application_mode: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="APPROVAL_MODE">Manual Approval Mode (Pause for review)</option>
                    <option value="AUTOMATIC_MODE">Automatic Mode (Submit automatically)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Salary Disclosure Policy</label>
                  <select
                    value={profile?.automation_policy?.salary_policy || 'ASK_USER'}
                    onChange={(e) => setProfile({
                      ...profile,
                      automation_policy: { ...profile.automation_policy, salary_policy: e.target.value }
                    })}
                    className="w-full text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-200"
                  >
                    <option value="ASK_USER">Ask User (Never disclose automatically)</option>
                    <option value="ALLOW">Allow (Use expected CTC from profile)</option>
                    <option value="BLOCK">Block (Leave blank / Negotiable)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          {activeTab !== 'personal' ? (
            <button
              type="button"
              onClick={() => {
                const currIdx = TABS.findIndex((t) => t.id === activeTab);
                if (currIdx > 0) setActiveTab(TABS[currIdx - 1].id);
              }}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              ← Previous Section
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {activeTab !== 'policies' && (
              <button
                type="button"
                onClick={() => {
                  const currIdx = TABS.findIndex((t) => t.id === activeTab);
                  if (currIdx < TABS.length - 1) setActiveTab(TABS[currIdx + 1].id);
                }}
                className="px-4 py-2 text-xs font-bold text-[#05603a] hover:bg-emerald-50 rounded-lg cursor-pointer"
              >
                Next Section →
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
