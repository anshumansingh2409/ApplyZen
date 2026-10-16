import api from './api';
import { authService } from './auth.service';

/**
 * Microsoft Outlook & Office 365 OAuth 2.0 Client (Microsoft Identity Platform)
 */
export const microsoftAuthClient = {
  getClientId() {
    const id = import.meta.env.VITE_MICROSOFT_CLIENT_ID || localStorage.getItem('applyzen_microsoft_client_id');
    if (!id || id.trim() === 'ea64387d-8153-43bb-a3ee-8ecf62c8e3aa') {
      return '';
    }
    return id.trim();
  },

  setClientId(clientId) {
    if (clientId) {
      localStorage.setItem('applyzen_microsoft_client_id', clientId.trim());
    }
  },

  getRedirectUri() {
    return `${window.location.origin}/auth/callback`;
  },

  /**
   * Helper to open OAuth popup and listen for postMessage / URL redirect
   */
  _openOAuthPopup({ url, redirectUri, onToken, onError }) {
    const width = 550;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      'applyzen_microsoft_auth',
      `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      onError?.('Popup blocked! Please allow popups for this site and try again.');
      return;
    }

    let resolved = false;

    // Listen for postMessage from /auth/callback
    const messageListener = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'MICROSOFT_AUTH_SUCCESS') {
        resolved = true;
        window.removeEventListener('message', messageListener);
        clearInterval(timer);
        try {
          popup.close();
        } catch (e) {}
        onToken({
          access_token: event.data.access_token,
          code: event.data.code
        });
      } else if (event.data?.type === 'MICROSOFT_AUTH_ERROR') {
        resolved = true;
        window.removeEventListener('message', messageListener);
        clearInterval(timer);
        try {
          popup.close();
        } catch (e) {}
        onError?.(event.data.error || 'Microsoft authentication failed.');
      }
    };

    window.addEventListener('message', messageListener);

    // Watch popup closing and check same-origin redirect
    const timer = setInterval(() => {
      if (resolved) {
        clearInterval(timer);
        return;
      }

      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', messageListener);
        if (!resolved) {
          onError?.('Microsoft login window was closed before completion.');
        }
        return;
      }

      try {
        if (popup.location.href.startsWith(redirectUri)) {
          resolved = true;
          clearInterval(timer);
          window.removeEventListener('message', messageListener);

          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash || popup.location.search);
          const token = params.get('access_token');
          const code = params.get('code');
          const error = params.get('error_description') || params.get('error');

          try {
            popup.close();
          } catch (e) {}

          if (token || code) {
            onToken({ access_token: token, code: code });
          } else if (error) {
            onError?.(error);
          } else {
            onError?.('No authentication token received from Microsoft.');
          }
        }
      } catch (e) {
        // Cross-origin restriction until redirected back to our domain
      }
    }, 500);
  },

  /**
   * Starts Microsoft / Outlook Sign-in / Sign-up flow
   */
  startOAuthFlow({ mode = 'login', onSuccess, onError, onNeedsClientId }) {
    const clientId = this.getClientId();

    if (!clientId) {
      if (onNeedsClientId) {
        onNeedsClientId();
      } else {
        onError?.('Microsoft Client ID is missing. Please set VITE_MICROSOFT_CLIENT_ID.');
      }
      return;
    }

    const redirectUri = this.getRedirectUri();
    const scope = 'openid profile email User.Read';
    const state = `applyzen_ms_${mode}_${Date.now()}`;
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}&response_mode=fragment&state=${state}&prompt=select_account`;

    this._openOAuthPopup({
      url: authUrl,
      redirectUri,
      onToken: async ({ access_token, code }) => {
        try {
          const authResult = await authService.microsoftAuth({
            access_token,
            code,
            redirect_uri: redirectUri,
            mode
          });
          onSuccess?.(authResult);
        } catch (backendErr) {
          onError?.(
            backendErr.response?.data?.message ||
            backendErr.response?.data?.detail ||
            'Failed to authenticate Microsoft account with ApplyZen server.'
          );
        }
      },
      onError
    });
  },

  /**
   * Connects Real Microsoft Outlook / Office 365 Inbox for Opportunity Ingestion
   */
  connectOutlookInbox({ onSuccess, onError, onNeedsClientId }) {
    const clientId = this.getClientId();

    if (!clientId) {
      if (onNeedsClientId) {
        onNeedsClientId();
      } else {
        onError?.('Microsoft Client ID is missing. Please set VITE_MICROSOFT_CLIENT_ID.');
      }
      return;
    }

    const redirectUri = this.getRedirectUri();
    const scope = 'openid profile email https://graph.microsoft.com/Mail.Read offline_access';
    const state = `applyzen_ms_inbox_${Date.now()}`;
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=token&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}&response_mode=fragment&state=${state}&prompt=select_account`;

    this._openOAuthPopup({
      url: authUrl,
      redirectUri,
      onToken: async ({ access_token, code }) => {
        try {
          const res = await api.post('/integrations/microsoft/connect', {
            access_token,
            code,
            redirect_uri: redirectUri
          });
          onSuccess?.(res.data);
        } catch (backendErr) {
          onError?.(
            backendErr.response?.data?.detail ||
            backendErr.response?.data?.message ||
            'Failed to link Outlook account with ApplyZen server.'
          );
        }
      },
      onError
    });
  }
};
