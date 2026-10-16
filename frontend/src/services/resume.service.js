import api from './api';

export const resumeService = {
  async list() {
    const res = await api.get('/resumes');
    return res.data;
  },

  async upload(formData) {
    const res = await api.post('/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async setPreferred(id) {
    const res = await api.post(`/resumes/${id}/set-preferred`);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/resumes/${id}`);
    return res.data;
  }
};
