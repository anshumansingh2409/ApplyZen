import api from './api';

export const applicationService = {
  async list(status) {
    const params = status ? { status } : {};
    const res = await api.get('/applications', { params });
    return res.data;
  },

  async get(id) {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },

  async reviewAndSubmit(id, updatedFields, approved = true) {
    const res = await api.post(`/applications/${id}/review`, {
      updated_fields: updatedFields,
      approved
    });
    return res.data;
  },

  async triggerCaptcha(id) {
    const res = await api.post(`/applications/${id}/trigger-captcha`);
    return res.data;
  },

  async resolveCaptcha(id) {
    const res = await api.post(`/applications/${id}/resolve-captcha`);
    return res.data;
  },

  async simulateEmailUpdate(id, updateType) {
    const res = await api.post(`/applications/${id}/simulate-email-update`, {
      update_type: updateType
    });
    return res.data;
  }
};
