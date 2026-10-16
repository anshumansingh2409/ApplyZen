import api from './api';

export const authService = {
  async signup(email, password, full_name, username) {
    const res = await api.post('/auth/signup', { email, password, full_name, username });
    if (res.data.access_token) {
      localStorage.setItem('applyzen_token', res.data.access_token);
      localStorage.setItem('applyzen_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(identifier, password) {
    const res = await api.post('/auth/login', {
      username_or_email: identifier,
      email: identifier,
      username: identifier,
      password
    });
    if (res.data.access_token) {
      localStorage.setItem('applyzen_token', res.data.access_token);
      localStorage.setItem('applyzen_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async googleAuth(payload) {
    const res = await api.post('/auth/google', payload);
    if (res.data.access_token) {
      localStorage.setItem('applyzen_token', res.data.access_token);
      localStorage.setItem('applyzen_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async microsoftAuth(payload) {
    const res = await api.post('/auth/microsoft', payload);
    if (res.data.access_token) {
      localStorage.setItem('applyzen_token', res.data.access_token);
      localStorage.setItem('applyzen_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async verifyEmail({ token, email, otp }) {
    const res = await api.post('/auth/verify-email', { token, email, otp });
    if (res.data.access_token) {
      localStorage.setItem('applyzen_token', res.data.access_token);
      localStorage.setItem('applyzen_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async resendVerification(email) {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword({ email, otp, token, new_password }) {
    const res = await api.post('/auth/reset-password', { email, otp, token, new_password });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('applyzen_token');
    localStorage.removeItem('applyzen_user');
    window.location.href = '/login';
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('applyzen_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('applyzen_token');
  }
};
