import api from './api';
import { authService } from './auth.service';

/**
 * Real Google OAuth authentication using official Google Identity Services (GIS)
 */
export const googleAuthClient = {
  getClientId() {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('applyzen_google_client_id') ||
      '21011366721-l99g3sr57q1u6182b3qmbd04ba9j3ggu.apps.googleusercontent.com'
    );
  },

  setClientId(clientId) {
    if (clientId) {
      localStorage.setItem('applyzen_google_client_id', clientId.trim());
    }
  },

  /**
   * Triggers the real Google OAuth Popup flow for Login / Signup
   */
  startOAuthFlow({ mode = 'login', onSuccess, onError, onNeedsClientId }) {
    const clientId = this.getClientId();

    if (!clientId) {
      if (onNeedsClientId) {
        onNeedsClientId();
      } else {
        onError?.(
          'Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable real Google authentication.'
        );
      }
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      onError?.('Google Identity Services SDK is loading. Please refresh the page and try again.');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError?.(tokenResponse.error_description || tokenResponse.error);
            return;
          }

          try {
            // Post real Google Access Token to ApplyZen backend
            const authResult = await authService.googleAuth({
              access_token: tokenResponse.access_token,
              mode
            });
            onSuccess?.(authResult);
          } catch (backendErr) {
            onError?.(
              backendErr.response?.data?.message || 'Failed to authenticate Google account with ApplyZen server.'
            );
          }
        },
        error_callback: (err) => {
          onError?.(err?.message || 'Google OAuth prompt was cancelled or closed.');
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      onError?.(err.message || 'Error launching Google OAuth prompt.');
    }
  },

  /**
   * Connects Real Gmail Inbox for Opportunity & Email Ingestion
   * Requests read-only Gmail access scope to fetch career and job emails.
   */
  connectGmailInbox({ onSuccess, onError }) {
    const clientId = this.getClientId();

    if (!clientId) {
      onError?.('Google Client ID is missing. Please configure VITE_GOOGLE_CLIENT_ID in frontend/.env.');
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      onError?.('Google Identity Services SDK is not loaded yet. Please refresh the page and try again.');
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/gmail.readonly openid email profile',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            onError?.(tokenResponse.error_description || tokenResponse.error);
            return;
          }

          try {
            const res = await api.post('/integrations/google/connect', {
              access_token: tokenResponse.access_token
            });
            onSuccess?.(res.data);
          } catch (backendErr) {
            onError?.(
              backendErr.response?.data?.detail ||
              backendErr.response?.data?.message ||
              'Failed to link Gmail account with ApplyZen server.'
            );
          }
        },
        error_callback: (err) => {
          onError?.(err?.message || 'Google OAuth prompt was closed or cancelled.');
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      onError?.(err.message || 'Failed to initialize Google OAuth prompt.');
    }
  }
};
