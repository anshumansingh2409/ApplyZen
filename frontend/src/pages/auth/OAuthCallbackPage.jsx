import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);

      const accessToken = params.get('access_token');
      const code = params.get('code');
      const error = params.get('error_description') || params.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        if (window.opener) {
          window.opener.postMessage(
            { type: 'MICROSOFT_AUTH_ERROR', error },
            window.location.origin
          );
          setTimeout(() => window.close(), 1200);
        }
        return;
      }

      if (accessToken || code) {
        setStatus('success');
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'MICROSOFT_AUTH_SUCCESS',
              access_token: accessToken,
              code
            },
            window.location.origin
          );
          setTimeout(() => window.close(), 500);
        } else {
          // If not in a popup, redirect to dashboard
          window.location.href = '/dashboard';
        }
      } else {
        setStatus('error');
        setErrorMessage('No authentication parameters received.');
      }
    } catch (e) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full">
        {status === 'processing' && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 text-[#05603a] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Completing Sign-In...</h3>
            <p className="text-xs text-gray-500">Connecting your account with ApplyZen...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Sign-In Approved!</h3>
            <p className="text-xs text-gray-500">Closing window and taking you to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Authentication Failed</h3>
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
