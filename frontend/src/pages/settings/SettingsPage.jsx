import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Shield,
  Key,
  Bell,
  CheckCircle2,
  Lock,
  Download,
  Trash2,
  Mail,
  Sliders,
  Sun,
  Moon,
  Laptop,
  HardDrive,
  Sparkles,
  Zap,
  BarChart3,
  Bot
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // AI Settings State (Image 4)
  const [selectedModel, setSelectedModel] = useState('zen-4-turbo');
  const [temperature, setTemperature] = useState(80);
  const [responseLength, setResponseLength] = useState('Balanced');
  const [theme, setTheme] = useState('Light');

  // Connected Accounts State (Image 3)
  const [gmailConnected, setGmailConnected] = useState(true);
  const [outlookConnected, setOutlookConnected] = useState(false);

  // Automation Preferences State (Image 3)
  const [autoApply, setAutoApply] = useState(true);
  const [autoCoverLetters, setAutoCoverLetters] = useState(true);
  const [appStrategy, setAppStrategy] = useState('Quality Focused (Highly Targeted)');
  const [confidenceThreshold, setConfidenceThreshold] = useState('Very High (90%+ Match)');

  // Security & Privacy State (Image 2)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Temperature label calculation
  const getTemperatureLabel = (val) => {
    if (val < 35) return `${val}% (Conservative)`;
    if (val < 70) return `${val}% (Balanced)`;
    return `${val}% (Creative)`;
  };

  // Password Change Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // 2FA Toggle Handler
  const handleToggle2FA = async () => {
    try {
      const nextState = !twoFactorEnabled;
      await api.post('/auth/toggle-2fa', { enabled: nextState });
      setTwoFactorEnabled(nextState);
      if (updateUser) updateUser({ two_factor_enabled: nextState });
      showToast(`Two-Factor Authentication ${nextState ? 'Enabled' : 'Disabled'}!`);
    } catch (err) {
      showToast('Failed to update 2FA status.');
    }
  };

  // Export Data Handler
  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/export-data');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applyzen_profile_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Profile and application history exported successfully!');
    } catch (err) {
      showToast('Data export failed.');
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/');
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-700 text-white shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System & Account Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize AI models, connected accounts, automation policies, and account security.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AI SETTINGS (IMAGE 4) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#05603a]" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">AI SETTINGS</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Model Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-3">Model Selection</label>
            <div className="space-y-3">
              {/* Option 1: Zen-4 Turbo */}
              <div
                onClick={() => setSelectedModel('zen-4-turbo')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  selectedModel === 'zen-4-turbo'
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedModel === 'zen-4-turbo' ? 'border-emerald-600' : 'border-gray-300'
                  }`}
                >
                  {selectedModel === 'zen-4-turbo' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <span>⚡ Zen-4 Turbo (Default)</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mt-0.5">
                    FAST &amp; CREATIVE RESPONSE
                  </span>
                </div>
              </div>

              {/* Option 2: Zen-Pro Analyst */}
              <div
                onClick={() => setSelectedModel('zen-pro-analyst')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3.5 ${
                  selectedModel === 'zen-pro-analyst'
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedModel === 'zen-pro-analyst' ? 'border-emerald-600' : 'border-gray-300'
                  }`}
                >
                  {selectedModel === 'zen-pro-analyst' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                    <span>📊 Zen-Pro Analyst</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block mt-0.5">
                    DATA FOCUSED &amp; HIGHLY PRECISE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Creativity Temperature & Response Length */}
          <div className="space-y-6">
            {/* Creativity Level Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">Creativity level (Temperature)</label>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#05603a] font-bold text-xs border border-emerald-200">
                  {getTemperatureLabel(temperature)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#05603a]"
              />
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 mt-1.5">
                <span>Conservative</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Response Length Segmented Control */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-2">Response Length</label>
              <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
                {['Short', 'Balanced', 'Detailed'].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setResponseLength(len)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      responseLength === len
                        ? 'bg-[#05603a] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: THEME & STORAGE (IMAGE 4) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* THEME CARD */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Sun className="w-4 h-4 text-[#05603a]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">THEME</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Light Option */}
            <div
              onClick={() => setTheme('Light')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                theme === 'Light'
                  ? 'border-emerald-600 bg-white shadow-xs'
                  : 'border-gray-200 bg-gray-50 hover:bg-white'
              }`}
            >
              <Sun className="w-6 h-6 text-emerald-600 mb-2" />
              <span className="text-xs font-bold text-emerald-800">Light</span>
            </div>

            {/* Dark Option */}
            <div
              onClick={() => setTheme('Dark')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                theme === 'Dark'
                  ? 'border-emerald-600 bg-[#0f172a] text-white shadow-xs'
                  : 'border-gray-800 bg-[#1e293b] text-white hover:border-gray-700'
              }`}
            >
              <Moon className="w-6 h-6 text-gray-300 mb-2" />
              <span className="text-xs font-bold text-gray-200">Dark</span>
            </div>

            {/* System Option */}
            <div
              onClick={() => setTheme('System')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                theme === 'System'
                  ? 'border-emerald-600 bg-gradient-to-b from-gray-200 to-gray-400 text-gray-900 shadow-xs'
                  : 'border-gray-300 bg-gradient-to-b from-gray-100 to-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Laptop className="w-6 h-6 text-gray-600 mb-2" />
              <span className="text-xs font-bold text-gray-700">System</span>
            </div>
          </div>
        </div>

        {/* STORAGE CARD */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-[#05603a]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">STORAGE</h3>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
              <span>Resume Storage</span>
              <span>42.0 MB / 100 MB</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className="bg-emerald-600 h-3 rounded-full w-[42%]"></div>
            </div>

            <p className="text-xs text-gray-500">
              Includes 12 resume variants and 85 generated cover letters.
            </p>

            <div className="pt-1">
              <Link
                to="/resumes"
                className="text-xs font-bold text-[#05603a] hover:underline inline-flex items-center gap-1"
              >
                <span>Manage Storage</span>
                <span>&gt;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: CONNECTED ACCOUNTS & AUTOMATION PREFERENCES (IMAGE 3) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
            <Mail className="w-4 h-4 text-[#05603a]" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">CONNECTED ACCOUNTS</h3>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gmail */}
          <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-50/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-red-500 shadow-2xs">
                <Mail className="w-5 h-5 text-red-500" />
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
                CONNECTED
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Gmail</h4>
              <p className="text-xs text-gray-500 mt-0.5">Synced 2m ago</p>
            </div>
          </div>

          {/* Outlook */}
          <div
            onClick={() => {
              setOutlookConnected(!outlookConnected);
              showToast(outlookConnected ? 'Outlook disconnected' : 'Outlook connected');
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              outlookConnected
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-red-300 bg-red-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#001e3d] flex items-center justify-center text-blue-400 font-bold font-mono shadow-2xs">
                @
              </div>
              {outlookConnected ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
                  CONNECTED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold tracking-wider uppercase">
                  DISCONNECTED
                </span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Outlook</h4>
              <p className={`text-xs mt-0.5 ${outlookConnected ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
                {outlookConnected ? 'Synced just now' : 'Tap to connect'}
              </p>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/20 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#075e54] flex items-center justify-center text-white shadow-2xs">
                💬
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider uppercase">
                PENDING
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">WhatsApp</h4>
              <p className="text-xs text-amber-700 font-medium mt-0.5 italic">Pending</p>
            </div>
          </div>
        </div>

        {/* AUTOMATION PREFERENCES SUBSECTION */}
        <div className="pt-4 border-t border-gray-100 space-y-5">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#05603a]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">AUTOMATION PREFERENCES</h4>
          </div>

          {/* Toggle 1: Auto Apply */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 border border-gray-200">
            <div>
              <h5 className="text-xs font-bold text-gray-900">Auto Apply</h5>
              <p className="text-xs text-gray-500 mt-0.5">Automatically apply to jobs that match 95%+ criteria.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Toggle 2: Auto Generate Cover Letters */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 border border-gray-200">
            <div>
              <h5 className="text-xs font-bold text-gray-900">Auto Generate Cover Letters</h5>
              <p className="text-xs text-gray-500 mt-0.5">Use AI to craft bespoke responses for each application.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoCoverLetters}
                onChange={(e) => setAutoCoverLetters(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Application Strategy</label>
              <select
                value={appStrategy}
                onChange={(e) => setAppStrategy(e.target.value)}
                className="w-full text-xs bg-gray-50 p-3 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-none focus:border-[#05603a]"
              >
                <option value="Quality Focused (Highly Targeted)">Quality Focused (Highly Targeted)</option>
                <option value="Balanced Velocity">Balanced Velocity</option>
                <option value="Aggressive Volume">Aggressive Volume</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">AI Confidence Threshold</label>
              <select
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(e.target.value)}
                className="w-full text-xs bg-gray-50 p-3 rounded-xl border border-gray-200 font-semibold text-gray-900 focus:outline-none focus:border-[#05603a]"
              >
                <option value="Very High (90%+ Match)">Very High (90%+ Match)</option>
                <option value="High (80%+ Match)">High (80%+ Match)</option>
                <option value="Moderate (70%+ Match)">Moderate (70%+ Match)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: SECURITY & PRIVACY (IMAGE 2) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#05603a]" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">SECURITY &amp; PRIVACY</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Row 1: Password */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900">Password</h4>
              <p className="text-xs text-gray-500 mt-0.5">Last changed 3 months ago</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer w-fit"
            >
              Change Password
            </button>
          </div>

          {/* Row 2: Two-Factor Authentication */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900">Two-Factor Authentication</h4>
              <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account.</p>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer w-fit ${
                twoFactorEnabled
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>

          {/* Row 3: Data Export */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900">Data Export</h4>
              <p className="text-xs text-gray-500 mt-0.5">Download a copy of your application history and profile data.</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer w-fit"
            >
              Export All
            </button>
          </div>

          {/* Row 4: Delete Account */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-600">Delete Account</h4>
              <p className="text-xs text-gray-500 mt-0.5">Permanently remove all data and close your ApplyZen account.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer w-fit"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength="6"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] disabled:opacity-50 cursor-pointer"
                >
                  {pwdLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-red-200">
            <h3 className="font-bold text-red-600 text-base">Permanently Delete Account?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              This action cannot be undone. All your resumes, ground truth records, detected opportunities, and autonomous submission histories will be permanently scrubbed.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
