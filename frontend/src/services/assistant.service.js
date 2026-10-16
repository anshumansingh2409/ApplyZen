import api from './api';

export const assistantService = {
  async query(question, conversationHistory = []) {
    const res = await api.post('/assistant/query', {
      question,
      conversation_history: conversationHistory
    });
    return res.data;
  }
};

export const profileService = {
  async getProfile() {
    const res = await api.get('/career-profile');
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/career-profile', profileData);
    return res.data;
  }
};
