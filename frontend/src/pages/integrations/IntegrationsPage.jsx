import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Trash2, Key, HelpCircle, ExternalLink, X } from 'lucide-react';
import api from '../../services/api';
import { opportunityService } from '../../services/opportunity.service';
import { googleAuthClient } from '../../services/googleAuth';
import { microsoftAuthClient } from '../../services/microsoftAuth';
import MicrosoftAuthModal from '../../components/auth/MicrosoftAuthModal';

export default function IntegrationsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Gmail App Password Modal State
  const [showAppPasswordModal, setShowAppPasswordModal] = useState(false);
  const [appEmail, setAppEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [appLoading, setAppLoading] = useState(false);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);

  // Outlook / Microsoft State
  const [outlookConnecting, setOutlookConnecting] = useState(false);
  const [showOutlookAppPasswordModal, setShowOutlookAppPasswordModal] = useState(false);
  const [outlookAppEmail, setOutlookAppEmail] = useState('');
  const [outlookAppPassword, setOutlookAppPassword] = useState('');
  const [outlookAppLoading, setOutlookAppLoading] = useState(false);
  const [showMicrosoftOAuthModal, setShowMicrosoftOAuthModal] = useState(false);
  const [syncingOutlook, setSyncingOutlook] = useState(false);
  const [disconnectingOutlook, setDisconnectingOutlook] = useState(false);

  // Google Test User Help Modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/integrations/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch integrations status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectGmailOAuth = () => {
    setErrorMsg('');
    setMessage('');
    setConnecting(true);

    googleAuthClient.connectGmailInbox({
      onSuccess: async (data) => {
        setMessage(`Successfully connected Gmail: ${data.account_email}! Ready to sync.`);
        setConnecting(false);
        await fetchStatus();
      },
      onError: (err) => {
        const errStr = typeof err === 'string' ? err : 'Google OAuth permission was cancelled or failed.';
        setErrorMsg(errStr);
        setConnecting(false);
        if (errStr.includes('blocked') || errStr.includes('403') || errStr.includes('access_denied') || errStr.includes('verification')) {
          setShowHelpModal(true);
        }
      }
    });
  };

  const handleConnectAppPassword = async (e) => {
    e.preventDefault();
    if (!appEmail.trim() || !appPassword.trim()) return;

    setAppLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const res = await api.post('/integrations/gmail/app-password', {
        email: appEmail.trim(),
        app_password: appPassword.trim()
      });
      setMessage(`Successfully connected Gmail via App Password: ${res.data.account_email}!`);
      setShowAppPasswordModal(false);
      setAppPassword('');
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to connect Gmail via App Password.');
    } finally {
      setAppLoading(false);
    }
  };

  const handleSyncGmail = async () => {
    if (!status?.gmail?.connected) {
      setErrorMsg('Please connect your Gmail account first before running email sync.');
      return;
    }

    setSyncingGmail(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await opportunityService.syncEmails('gmail');
      if (res.synced_count > 0) {
        setMessage(`Scanned ${res.scanned_count} career emails from ${res.account_email}. Extracted ${res.synced_count} new opportunities!`);
      } else {
        setMessage(res.message || `Scanned Gmail inbox for ${res.account_email}. No new career opportunities found.`);
      }
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.detail || 'Gmail sync failed.');
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Gmail account? You can reconnect anytime.')) {
      return;
    }
    setDisconnectingGmail(true);
    setErrorMsg('');
    setMessage('');
    try {
      await api.post('/integrations/google/disconnect');
      setMessage('Gmail account disconnected successfully.');
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to disconnect Gmail.');
    } finally {
      setDisconnectingGmail(false);
    }
  };

  // Outlook Handlers
  const handleConnectOutlookOAuth = () => {
    setErrorMsg('');
    setMessage('');
    setOutlookConnecting(true);

    microsoftAuthClient.connectOutlookInbox({
      onSuccess: async (data) => {
        setMessage(`Successfully connected Outlook: ${data.account_email}! Ready to sync.`);
        setOutlookConnecting(false);
        await fetchStatus();
      },
      onError: (err) => {
        const errStr = typeof err === 'string' ? err : 'Microsoft OAuth permission was cancelled or failed.';
        setErrorMsg(errStr);
        setOutlookConnecting(false);
      },
      onNeedsClientId: () => {
        setOutlookConnecting(false);
        setShowMicrosoftOAuthModal(true);
      }
    });
  };

  const handleConnectOutlookAppPassword = async (e) => {
    e.preventDefault();
    if (!outlookAppEmail.trim() || !outlookAppPassword.trim()) return;

    setOutlookAppLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const res = await api.post('/integrations/outlook/app-password', {
        email: outlookAppEmail.trim(),
        app_password: outlookAppPassword.trim()
      });
      setMessage(`Successfully connected Outlook via App Password: ${res.data.account_email}!`);
      setShowOutlookAppPasswordModal(false);
      setOutlookAppPassword('');
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to connect Outlook via App Password.');
    } finally {
      setOutlookAppLoading(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Outlook account? You can reconnect anytime.')) {
      return;
    }
    setDisconnectingOutlook(true);
    setErrorMsg('');
    setMessage('');
    try {
      await api.post('/integrations/microsoft/disconnect');
      setMessage('Outlook account disconnected successfully.');
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to disconnect Outlook.');
    } finally {
      setDisconnectingOutlook(false);
    }
  };

  const handleSyncOutlook = async () => {
    if (!status?.outlook?.connected) {
      setErrorMsg('Please connect your Outlook account first before running email sync.');
      return;
    }

    setSyncingOutlook(true);
    setMessage('');
    setErrorMsg('');
    try {
      const res = await opportunityService.syncEmails('outlook');
      if (res.synced_count > 0) {
        setMessage(`Scanned ${res.scanned_count} career emails from ${res.account_email}. Extracted ${res.synced_count} new opportunities!`);
      } else {
        setMessage(res.message || `Scanned Outlook inbox for ${res.account_email}. No new career opportunities found.`);
      }
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.detail || 'Outlook sync failed.');
    } finally {
      setSyncingOutlook(false);
    }
  };

  const handleSyncEmails = async () => {
    const isGmail = status?.gmail?.connected;
    const isOutlook = status?.outlook?.connected;

    if (!isGmail && !isOutlook) {
      setErrorMsg('Please connect your Gmail or Outlook account first before running email sync.');
      return;
    }

    setSyncing(true);
    setMessage('');
    setErrorMsg('');
    try {
      const targetProvider = isGmail && isOutlook ? 'all' : (isOutlook ? 'outlook' : 'gmail');
      const res = await opportunityService.syncEmails(targetProvider);
      if (res.synced_count > 0) {
        setMessage(`Scanned connected inboxes. Extracted ${res.synced_count} new career opportunities!`);
      } else {
        setMessage(res.message || 'Scanned connected inboxes. No new career opportunities found.');
      }
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.detail || 'Inbox sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanupMock = async () => {
    if (!window.confirm('Do you want to purge all sample/mock opportunities (Stripe, Razorpay, Google records)?')) {
      return;
    }
    try {
      const res = await opportunityService.cleanupMock();
      setMessage(`Purged ${res.deleted_count} sample/mock opportunities from your dashboard.`);
    } catch (err) {
      setErrorMsg('Failed to cleanup sample opportunities.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Email Inboxes & Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your real Gmail inbox to scan recruiter emails & job alerts directly into opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCleanupMock}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Remove sample/demo opportunities"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Purge Sample Data</span>
          </button>

          <button
            onClick={handleSyncEmails}
            disabled={syncing || (!status?.gmail?.connected && !status?.outlook?.connected)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#05603a] hover:bg-[#034a27] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Scanning Inboxes...' : 'Run Email Sync Now'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-xs text-red-700 underline font-bold shrink-0 hover:text-red-900"
          >
            How to fix?
          </button>
        </div>
      )}

      {/* Security Note & Quick Methods */}
      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#05603a] shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700 leading-relaxed">
            <strong className="text-gray-900">Real Ingestion Guarantee:</strong> ApplyZen scans strictly for career & recruitment messages. Personal emails are ignored and never stored. You can connect via <strong>Google OAuth</strong> or instantly using a <strong>16-letter Gmail App Password</strong>.
          </div>
        </div>
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-xs font-bold text-[#05603a] hover:underline flex items-center gap-1 shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>OAuth Guide</span>
        </button>
      </div>

      {/* Inboxes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Gmail Card */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${status?.gmail?.connected
            ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs'
            : 'border-gray-200 bg-white shadow-2xs'
            }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-2xs flex items-center justify-center text-red-500">
                <Mail className="w-6 h-6 text-red-500" />
              </div>
              {status?.gmail?.connected ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
                  CONNECTED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wide uppercase">
                  DISCONNECTED
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-gray-900">Gmail</h4>
            <p className={`text-xs mt-1 ${status?.gmail?.connected ? 'text-gray-500' : 'text-gray-400 font-medium'}`}>
              {status?.gmail?.connected
                ? status?.gmail?.last_synced
                  ? `Last synced: ${new Date(status.gmail.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Connected'
                : 'Connect via OAuth or App Password'}
            </p>
            <p className="text-[12px] font-medium text-gray-700 mt-2 truncate">
              {status?.gmail?.connected ? status?.gmail?.account_email : 'No account connected'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100/80 space-y-2">
            {status?.gmail?.connected ? (
              <>
                <button
                  onClick={handleSyncGmail}
                  disabled={syncingGmail}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGmail ? 'animate-spin' : ''}`} />
                  <span>{syncingGmail ? 'Scanning Gmail...' : 'Sync Gmail Emails'}</span>
                </button>

                <button
                  onClick={handleDisconnectGmail}
                  disabled={disconnectingGmail}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{disconnectingGmail ? 'Disconnecting...' : 'Disconnect Gmail'}</span>
                </button>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setShowAppPasswordModal(true)}
                    className="text-gray-500 hover:text-emerald-700 underline font-medium cursor-pointer"
                  >
                    Switch to App Password
                  </button>
                  <button
                    onClick={handleConnectGmailOAuth}
                    disabled={connecting}
                    className="text-gray-500 hover:text-emerald-700 underline font-medium cursor-pointer"
                  >
                    Reconnect OAuth
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleConnectGmailOAuth}
                  disabled={connecting}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{connecting ? 'Authorizing Google...' : 'Connect via Google OAuth'}</span>
                </button>

                <button
                  onClick={() => setShowAppPasswordModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Connect with App Password</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Outlook Card */}
        <div
          className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${status?.outlook?.connected
            ? 'border-blue-500 bg-blue-50/20 shadow-2xs'
            : 'border-gray-200 bg-white shadow-2xs'
            }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#001e3d] flex items-center justify-center text-blue-400 shadow-2xs">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </div>
              {status?.outlook?.connected ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
                  CONNECTED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-bold tracking-wide uppercase">
                  DISCONNECTED
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-gray-900">Microsoft Outlook</h4>
            <p className={`text-xs mt-1 ${status?.outlook?.connected ? 'text-gray-500' : 'text-gray-400 font-medium'}`}>
              {status?.outlook?.connected
                ? status?.outlook?.last_synced
                  ? `Last synced: ${new Date(status.outlook.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Connected'
                : 'Connect via OAuth or App Password'}
            </p>
            <p className="text-[12px] font-medium text-gray-700 mt-2 truncate">
              {status?.outlook?.connected ? status?.outlook?.account_email : 'No account connected'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100/80 space-y-2">
            {status?.outlook?.connected ? (
              <>
                <button
                  onClick={handleSyncOutlook}
                  disabled={syncingOutlook}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingOutlook ? 'animate-spin' : ''}`} />
                  <span>{syncingOutlook ? 'Scanning Outlook...' : 'Sync Outlook Emails'}</span>
                </button>

                <button
                  onClick={handleDisconnectOutlook}
                  disabled={disconnectingOutlook}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-white border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{disconnectingOutlook ? 'Disconnecting...' : 'Disconnect Outlook'}</span>
                </button>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => setShowOutlookAppPasswordModal(true)}
                    className="text-gray-500 hover:text-blue-700 underline font-medium cursor-pointer"
                  >
                    Switch to App Password
                  </button>
                  <button
                    onClick={handleConnectOutlookOAuth}
                    disabled={outlookConnecting}
                    className="text-gray-500 hover:text-blue-700 underline font-medium cursor-pointer"
                  >
                    Reconnect OAuth
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleConnectOutlookOAuth}
                  disabled={outlookConnecting}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-[#0078d4] hover:bg-[#006cbd] text-white shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{outlookConnecting ? 'Authorizing Microsoft...' : 'Connect via Microsoft OAuth'}</span>
                </button>

                <button
                  onClick={() => setShowOutlookAppPasswordModal(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-blue-700" />
                  <span>Connect with App Password</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* WhatsApp Notification Card */}
        <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#075e54] flex items-center justify-center text-white shadow-2xs">
                <span className="text-lg">💬</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide uppercase">
                OPTIONAL
              </span>
            </div>

            <h4 className="text-base font-bold text-gray-900">WhatsApp Alerts</h4>
            <p className="text-xs text-gray-400 mt-1">Instant recruiter alert pings</p>
            <p className="text-[11px] text-gray-500 mt-2">
              Receive notifications when a recruiter invites you to an interview.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100/80">
            <button
              onClick={() => alert('WhatsApp alerts will notify you instantly when recruiters email you!')}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-colors"
            >
              Configure Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Gmail App Password Modal */}
      {showAppPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#05603a]" />
                <h3 className="text-base font-bold text-gray-900">Connect Gmail via App Password</h3>
              </div>
              <button
                onClick={() => setShowAppPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Bypasses Google verification screen completely! Generate a 16-letter App Password in your Google Account:
            </p>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">How to generate 16-letter password:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-[#05603a] inline-flex items-center gap-0.5">Google App Passwords <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>App name enter karein: <code className="bg-amber-100 px-1 py-0.5 rounded">ApplyZen</code></li>
                <li>Click <strong>Create</strong> and copy the 16-letter password.</li>
              </ol>
            </div>

            <form onSubmit={handleConnectAppPassword} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Gmail Address</label>
                <input
                  type="email"
                  required
                  placeholder="anshumansingh2409@gmail.com"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">16-letter App Password</label>
                <input
                  type="password"
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-[#05603a] outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppPasswordModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#05603a] hover:bg-[#034a27] rounded-xl shadow-xs disabled:opacity-50"
                >
                  {appLoading ? 'Connecting...' : 'Connect Gmail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google OAuth Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-gray-900">How to Fix "Access Blocked (Error 403)"</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-700 space-y-3 leading-relaxed">
              <p>
                Google Cloud Console mein app jab <strong>"Testing"</strong> mode mein hoti hai, tab Google security policy ke mutabiq sirf unhi emails ko allow karta hai jo <strong>Test Users</strong> list mein add ki gayi hon.
              </p>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <p className="font-bold text-gray-900">Option 1: Add as Test User in Google Cloud (1 Minute Fix)</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px]">
                  <li>
                    Open <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" className="text-[#05603a] font-bold underline inline-flex items-center gap-0.5">Google Cloud OAuth Consent Screen <ExternalLink className="w-2.5 h-2.5" /></a>
                  </li>
                  <li>Scroll down to <strong>"Test users"</strong> section.</li>
                  <li>Click <strong>"+ ADD USERS"</strong>.</li>
                  <li>Enter your email: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-bold">anshumansingh2409@gmail.com</code></li>
                  <li>Click <strong>SAVE</strong>.</li>
                  <li>Wapas aakar "Connect via Google OAuth" click karein. (Popup mein "Advanced" &gt; "Go to applyzen" click karke continue karein).</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <p className="font-bold text-emerald-900">Option 2: Use Gmail App Password (Zero Setup)</p>
                <p className="text-[11px] text-emerald-800">
                  Aapko Google Cloud Console kholne ki bhi zarurat nahi padegi. Seedhe <strong>"Connect with App Password"</strong> button use karein aur 10 seconds mein connect ho jayega!
                </p>
                <button
                  onClick={() => {
                    setShowHelpModal(false);
                    setShowAppPasswordModal(true);
                  }}
                  className="px-3 py-1.5 bg-[#05603a] text-white rounded-lg font-bold text-[11px]"
                >
                  Use App Password Instead
                </button>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outlook App Password Modal */}
      {showOutlookAppPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Connect Outlook via Password / App Password</h3>
              </div>
              <button
                onClick={() => setShowOutlookAppPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Connect directly via Outlook IMAP (<code className="bg-gray-100 px-1 py-0.5 rounded font-mono">outlook.office365.com</code>).
              If your Microsoft account has 2-Step Verification enabled, generate an App Password from Microsoft Security.
            </p>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-bold">For Microsoft Accounts with 2FA:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                <li>Visit <a href="https://account.live.com/proofs/manage" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 inline-flex items-center gap-0.5">Microsoft Security <ExternalLink className="w-2.5 h-2.5" /></a></li>
                <li>Go to <strong>App Passwords</strong> &rarr; Create a new app password.</li>
                <li>Enter the generated app password below.</li>
              </ol>
            </div>

            <form onSubmit={handleConnectOutlookAppPassword} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Outlook / Hotmail / Office 365 Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@outlook.com or name@company.com"
                  value={outlookAppEmail}
                  onChange={(e) => setOutlookAppEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password or App Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={outlookAppPassword}
                  onChange={(e) => setOutlookAppPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutlookAppPasswordModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={outlookAppLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {outlookAppLoading ? 'Connecting...' : 'Connect Outlook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Microsoft OAuth Setup Modal */}
      <MicrosoftAuthModal
        isOpen={showMicrosoftOAuthModal}
        onClose={() => setShowMicrosoftOAuthModal(false)}
        onConfigured={handleConnectOutlookOAuth}
      />
    </div>
  );
}

