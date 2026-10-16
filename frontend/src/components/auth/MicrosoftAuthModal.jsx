import React, { useState } from 'react';
import { X, ExternalLink, KeyRound, CheckCircle2 } from 'lucide-react';
import { microsoftAuthClient } from '../../services/microsoftAuth';

export default function MicrosoftAuthModal({ isOpen, onClose, onConfigured }) {
  const [clientIdInput, setClientIdInput] = useState(microsoftAuthClient.getClientId());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    microsoftAuthClient.setClientId(clientIdInput.trim());
    setSaved(true);
    setTimeout(() => {
      onConfigured?.();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div 
        className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Microsoft / Outlook OAuth</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Microsoft & Outlook OAuth authentication uses Microsoft Azure App Registration (Application Client ID).
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Microsoft Application (Client) ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. ea64387d-8153-43bb-a3ee-8ecf62c8e3aa"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#05603a] font-mono"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                You can also configure this in <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">frontend/.env</code> as <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">VITE_MICROSOFT_CLIENT_ID</code>.
              </p>
            </div>

            {saved ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Client ID saved! Launching Microsoft Sign-In...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#05603a] hover:bg-[#034a27] text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Save & Continue to Microsoft Sign-In
              </button>
            )}
          </form>

          {/* Setup Guide */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2">
            <div className="font-semibold text-gray-700">How to get a Microsoft Client ID:</div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
              <li>Visit <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-0.5">Azure Portal &rarr; App registrations <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li>Create New Registration &rarr; Supported account types: Accounts in any organizational directory and personal Microsoft accounts</li>
              <li>Add Redirect URI (Web or SPA): <code className="bg-gray-100 px-1 rounded text-gray-800">http://localhost:5173/auth/callback</code></li>
              <li>Copy Application (client) ID and paste here.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
