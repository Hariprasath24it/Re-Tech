import API from './api';

export const authService = {
  register: async (userData) => {
    const res = await API.post('/auth/register', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await API.post('/auth/login', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await API.put('/auth/profile', profileData);
    return res.data;
  },
};
