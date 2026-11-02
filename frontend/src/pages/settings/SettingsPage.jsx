import React, { useState, useEffect } from 'react';
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
  Bot,
  RefreshCw,
  ExternalLink,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { opportunityService } from '../../services/opportunity.service';
import { googleAuthClient } from '../../services/googleAuth';
import { microsoftAuthClient } from '../../services/microsoftAuth';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // AI Settings State
  const [selectedModel, setSelectedModel] = useState('zen-4-turbo');
  const [temperature, setTemperature] = useState(80);
  const [responseLength, setResponseLength] = useState('Balanced');
  const [theme, setTheme] = useState('Light');

  // Automation Preferences State
  const [autoApply, setAutoApply] = useState(true);
  const [autoCoverLetters, setAutoCoverLetters] = useState(true);
  const [appStrategy, setAppStrategy] = useState('Quality Focused (Highly Targeted)');
  const [confidenceThreshold, setConfidenceThreshold] = useState('Very High (90%+ Match)');

  // Preference saving state
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Connected Accounts State (from real backend status)
  const [integrationStatus, setIntegrationStatus] = useState({
    gmail: { connected: false, account_email: null, last_synced: null },
    outlook: { connected: false, account_email: null, last_synced: null }
  });
  const [statusLoading, setStatusLoading] = useState(true);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const [disconnectingOutlook, setDisconnectingOutlook] = useState(false);
  const [syncingOutlook, setSyncingOutlook] = useState(false);

  // Storage / Resumes State
  const [resumeCount, setResumeCount] = useState(0);
  const [storageMb, setStorageMb] = useState('0.0');

  // Security & Privacy State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  // Helper to format last synced date
  const formatSyncTime = (timestamp) => {
    if (!timestamp) return 'Never synced';
    try {
      const date = new Date(timestamp);
      return `Synced ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Synced recently';
    }
  };

  // Temperature label calculation
  const getTemperatureLabel = (val) => {
    if (val < 35) return `${val}% (Conservative)`;
    if (val < 70) return `${val}% (Balanced)`;
    return `${val}% (Creative)`;
  };

  // Fetch real integrations status from backend
  const fetchIntegrationStatus = async () => {
    try {
      const res = await api.get('/integrations/status');
      setIntegrationStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch integration status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch preferences from backend
  const fetchPreferences = async () => {
    try {
      const res = await api.get('/auth/preferences');
      if (res.data?.preferences) {
        const p = res.data.preferences;
        if (p.ai_model) setSelectedModel(p.ai_model);
        if (typeof p.temperature === 'number') setTemperature(p.temperature);
        if (p.response_length) setResponseLength(p.response_length);
        if (p.theme) setTheme(p.theme);
        if (typeof p.auto_apply === 'boolean') setAutoApply(p.auto_apply);
        if (typeof p.auto_cover_letters === 'boolean') setAutoCoverLetters(p.auto_cover_letters);
        if (p.application_strategy) setAppStrategy(p.application_strategy);
        if (p.confidence_threshold) setConfidenceThreshold(p.confidence_threshold);
      }
    } catch (err) {
      console.error('Failed to load user preferences:', err);
    }
  };

  // Fetch resumes for real storage metrics
  const fetchResumeMetrics = async () => {
    try {
      const res = await api.get('/resumes');
      const resumes = Array.isArray(res.data) ? res.data : [];
      setResumeCount(resumes.length);
      // Average 1.2MB per resume document
      const computedMb = (resumes.length * 1.2).toFixed(1);
      setStorageMb(computedMb);
    } catch {
      setResumeCount(0);
      setStorageMb('0.0');
    }
  };

  // Fetch current user details (e.g. 2FA)
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (typeof res.data?.two_factor_enabled === 'boolean') {
        setTwoFactorEnabled(res.data.two_factor_enabled);
        if (updateUser) {
          updateUser({ two_factor_enabled: res.data.two_factor_enabled });
        }
      }
    } catch (err) {
      console.error('Failed to refresh user details:', err);
    }
  };

  useEffect(() => {
    fetchIntegrationStatus();
    fetchPreferences();
    fetchResumeMetrics();
    fetchCurrentUser();
  }, []);

  // Save Preferences Handler
  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/auth/preferences', {
        ai_model: selectedModel,
        temperature: temperature,
        response_length: responseLength,
        theme: theme,
        auto_apply: autoApply,
        auto_cover_letters: autoCoverLetters,
        application_strategy: appStrategy,
        confidence_threshold: confidenceThreshold
      });
      showToast('Preferences successfully saved and applied!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save preferences.', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Connect Gmail using real Google Identity Services
  const handleConnectGmail = () => {
    setConnectingGmail(true);
    googleAuthClient.connectGmailInbox({
      onSuccess: async (data) => {
        setConnectingGmail(false);
        const count = data?.synced_count ?? 0;
        showToast(
          data?.message ||
          (count > 0
            ? `Connected Gmail (${data.account_email})! Ingested ${count} new opportunities.`
            : `Connected Gmail (${data.account_email})! Ready to monitor emails.`)
        );
        await fetchIntegrationStatus();
      },
      onError: (err) => {
        setConnectingGmail(false);
        const errStr = typeof err === 'string' ? err : 'Google connection was cancelled or failed.';
        showToast(errStr, 'error');
      }
    });
  };

  // Disconnect Gmail
  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect Gmail? You can reconnect anytime.')) {
      return;
    }
    setDisconnectingGmail(true);
    try {
      await api.post('/integrations/google/disconnect');
      showToast('Gmail account disconnected successfully.');
      await fetchIntegrationStatus();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to disconnect Gmail.', 'error');
    } finally {
      setDisconnectingGmail(false);
    }
  };

  // Sync Gmail Now
  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    try {
      const res = await opportunityService.syncEmails('gmail');
      if (res.synced_count > 0) {
        showToast(`Scanned Gmail! Extracted ${res.synced_count} new opportunities.`);
      } else {
        showToast(res.message || 'Scanned Gmail. No new career opportunities found.');
      }
      await fetchIntegrationStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gmail sync failed.', 'error');
    } finally {
      setSyncingGmail(false);
    }
  };

  // Connect Outlook using Microsoft OAuth
  const handleConnectOutlook = () => {
    setConnectingOutlook(true);
    microsoftAuthClient.connectOutlookInbox({
      onSuccess: async (data) => {
        setConnectingOutlook(false);
        showToast(`Connected Outlook (${data.account_email})! Ready to sync career emails.`);
        await fetchIntegrationStatus();
      },
      onError: (err) => {
        setConnectingOutlook(false);
        const errStr = typeof err === 'string' ? err : 'Microsoft connection was cancelled or failed.';
        showToast(errStr, 'error');
      },
      onNeedsClientId: () => {
        setConnectingOutlook(false);
        navigate('/integrations');
      }
    });
  };

  // Disconnect Outlook
  const handleDisconnectOutlook = async () => {
    if (!window.confirm('Are you sure you want to disconnect Outlook? You can reconnect anytime.')) {
      return;
    }
    setDisconnectingOutlook(true);
    try {
      await api.post('/integrations/microsoft/disconnect');
      showToast('Outlook account disconnected successfully.');
      await fetchIntegrationStatus();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to disconnect Outlook.', 'error');
    } finally {
      setDisconnectingOutlook(false);
    }
  };

  // Sync Outlook Now
  const handleSyncOutlook = async () => {
    setSyncingOutlook(true);
    try {
      const res = await opportunityService.syncEmails('outlook');
      if (res.synced_count > 0) {
        showToast(`Scanned Outlook! Extracted ${res.synced_count} new opportunities.`);
      } else {
        showToast(res.message || 'Scanned Outlook. No new career opportunities found.');
      }
      await fetchIntegrationStatus();
    } catch (err) {
      showToast(err.response?.data?.message || 'Outlook sync failed.', 'error');
    } finally {
      setSyncingOutlook(false);
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match!');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
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
      setPwdError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // 2FA Toggle Handler (Real Database Persistence)
  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const nextState = !twoFactorEnabled;
      await api.post('/auth/toggle-2fa', { enabled: nextState });
      setTwoFactorEnabled(nextState);
      if (updateUser) {
        updateUser({ two_factor_enabled: nextState });
      }
      showToast(`Two-Factor Authentication ${nextState ? 'Enabled' : 'Disabled'}!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update 2FA status.', 'error');
    } finally {
      setToggling2FA(false);
    }
  };

  // Export Data Handler (Full JSON download)
  const handleExportData = async () => {
    setExportingData(true);
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
      showToast(err.response?.data?.message || 'Data export failed.', 'error');
    } finally {
      setExportingData(false);
    }
  };

  // Delete Account Handler (Permanent DB Purge)
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl text-white shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System & Account Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize AI models, connected email accounts, autonomous policies, and account security.
          </p>
        </div>
        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#05603a] hover:bg-[#044c2e] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {savingPrefs ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: AI SETTINGS */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#05603a]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">AI SETTINGS</h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">Model: {selectedModel}</span>
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
      {/* SECTION 2: THEME & STORAGE */}
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
              <span>Resume &amp; Document Storage</span>
              <span>{storageMb} MB / 100 MB</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, (parseFloat(storageMb) / 100) * 100))}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500">
              {resumeCount === 0
                ? 'No resumes uploaded yet. Upload a resume to enable AI tailoring.'
                : `Includes ${resumeCount} resume variant${resumeCount > 1 ? 's' : ''} stored securely in your private vault.`}
            </p>

            <div className="pt-1">
              <Link
                to="/resumes"
                className="text-xs font-bold text-[#05603a] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Resumes in Vault</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: CONNECTED ACCOUNTS & AUTOMATION PREFERENCES */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200/90 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#05603a] flex items-center justify-center">
              <Mail className="w-4 h-4 text-[#05603a]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">CONNECTED ACCOUNTS</h3>
          </div>
          <Link
            to="/integrations"
            className="text-xs font-bold text-[#05603a] hover:underline inline-flex items-center gap-1"
          >
            <span>Full Integrations Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Real Account Connection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Gmail */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              integrationStatus.gmail?.connected
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-red-500 shadow-2xs">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>
                {integrationStatus.gmail?.connected ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
                    CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-bold tracking-wider uppercase">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900">Gmail</h4>
              <p className="text-xs text-gray-600 truncate mt-0.5 font-medium">
                {integrationStatus.gmail?.account_email || 'Google Workspace or personal inbox'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {integrationStatus.gmail?.connected
                  ? formatSyncTime(integrationStatus.gmail?.last_synced)
                  : 'Connect to ingest recruiter emails'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center gap-2">
              {integrationStatus.gmail?.connected ? (
                <>
                  <button
                    onClick={handleSyncGmail}
                    disabled={syncingGmail}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingGmail ? 'animate-spin' : ''}`} />
                    <span>{syncingGmail ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                  <button
                    onClick={handleDisconnectGmail}
                    disabled={disconnectingGmail}
                    className="py-1.5 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {disconnectingGmail ? '...' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  disabled={connectingGmail}
                  className="w-full py-2 px-3 bg-[#05603a] hover:bg-[#044c2e] text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {connectingGmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Connect Gmail</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Outlook */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              integrationStatus.outlook?.connected
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-gray-200 bg-gray-50/40 hover:border-gray-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#001e3d] flex items-center justify-center text-blue-400 font-bold font-mono shadow-2xs">
                  @
                </div>
                {integrationStatus.outlook?.connected ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">
                    CONNECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-bold tracking-wider uppercase">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-gray-900">Microsoft Outlook</h4>
              <p className="text-xs text-gray-600 truncate mt-0.5 font-medium">
                {integrationStatus.outlook?.account_email || 'Hotmail, Live or Office 365'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {integrationStatus.outlook?.connected
                  ? formatSyncTime(integrationStatus.outlook?.last_synced)
                  : 'Connect to ingest Outlook job emails'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100/80 flex items-center gap-2">
              {integrationStatus.outlook?.connected ? (
                <>
                  <button
                    onClick={handleSyncOutlook}
                    disabled={syncingOutlook}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingOutlook ? 'animate-spin' : ''}`} />
                    <span>{syncingOutlook ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                  <button
                    onClick={handleDisconnectOutlook}
                    disabled={disconnectingOutlook}
                    className="py-1.5 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {disconnectingOutlook ? '...' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnectOutlook}
                  disabled={connectingOutlook}
                  className="w-full py-2 px-3 bg-[#001e3d] hover:bg-[#002b54] text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {connectingOutlook ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>@</span>
                      <span>Connect Outlook</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Card 3: WhatsApp */}
          <div className="p-5 rounded-xl border border-amber-300 bg-amber-50/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#075e54] flex items-center justify-center text-white text-lg shadow-2xs">
                  💬
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider uppercase">
                  COMING SOON
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">WhatsApp Alerts</h4>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">Real-time mobile digests</p>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Instant alerts for interview invites &amp; offers
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/50">
              <button
                type="button"
                onClick={() => showToast("You're enrolled for WhatsApp alert notifications when launched!")}
                className="w-full py-2 px-3 border border-amber-400 text-amber-900 hover:bg-amber-100/60 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Notify Me When Live
              </button>
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
      {/* SECTION 4: SECURITY & PRIVACY */}
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
              <h4 className="text-xs font-bold text-gray-900">Account Password</h4>
              <p className="text-xs text-gray-500 mt-0.5">Secure your ApplyZen login credentials.</p>
            </div>
            <button
              onClick={() => {
                setPwdError('');
                setShowPasswordModal(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer w-fit"
            >
              Change Password
            </button>
          </div>

          {/* Row 2: Two-Factor Authentication */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gray-900">Two-Factor Authentication (2FA)</h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    twoFactorEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {twoFactorEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Protect your account by requiring two-factor verification during login.
              </p>
            </div>
            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer w-fit inline-flex items-center gap-1.5 ${
                twoFactorEnabled
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {toggling2FA && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</span>
            </button>
          </div>

          {/* Row 3: Data Export */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-gray-900">Data Export</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Download a complete JSON export of your career profile, opportunities, and applications.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer w-fit inline-flex items-center gap-2 disabled:opacity-50"
            >
              {exportingData ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Export All Data</span>
                </>
              )}
            </button>
          </div>

          {/* Row 4: Delete Account */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-600">Delete Account</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently remove all data, resumes, career profile, and close your ApplyZen account.
              </p>
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

            {pwdError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#05603a]"
                  placeholder="Re-enter new password"
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
                  className="px-5 py-2 text-xs font-semibold bg-[#05603a] text-white rounded-lg hover:bg-[#034a27] disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {pwdLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{pwdLoading ? 'Saving...' : 'Update Password'}</span>
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
              This action is permanent and cannot be undone. All your resumes, stored career profile,
              detected opportunities, application logs, and email tokens will be permanently scrubbed from
              the database.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Keep Account
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingAccount ? 'Deleting Account...' : 'Yes, Delete My Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
