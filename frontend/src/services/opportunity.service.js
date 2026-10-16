import api from './api';

export const opportunityService = {
  async list() {
    const res = await api.get('/opportunities');
    return res.data;
  },

  async get(id) {
    const res = await api.get(`/opportunities/${id}`);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/opportunities/${id}`);
    return res.data;
  },

  async cleanupMock() {
    const res = await api.delete('/opportunities/cleanup-mock');
    return res.data;
  },

  async clearAll() {
    const res = await api.delete('/opportunities/clear-all');
    return res.data;
  },

  async processEmail(emailText, sourceEmail) {
    const res = await api.post('/opportunities/process-email', {
      email_text: emailText,
      source_email: sourceEmail || 'recruiter@company.com'
    });
    return res.data;
  },

  async syncEmails(provider = 'gmail') {
    const res = await api.post('/integrations/sync', { provider });
    return res.data;
  },

  async syncDemoEmails() {
    return this.syncEmails('gmail');
  }
};
