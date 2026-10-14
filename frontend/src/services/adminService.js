import API from './api';

export const adminService = {
  getDashboardStats: async () => {
    const res = await API.get('/admin/dashboard');
    return res.data;
  },

  getAnalytics: async () => {
    const res = await API.get('/admin/analytics');
    return res.data;
  },

  getAllDevices: async (params = {}) => {
    const res = await API.get('/devices', { params });
    return res.data;
  },

  getAllPickups: async (params = {}) => {
    const res = await API.get('/pickups', { params });
    return res.data;
  },

  getAllRepairs: async (params = {}) => {
    const res = await API.get('/repairs', { params });
    return res.data;
  },

  getAllRecycling: async (params = {}) => {
    const res = await API.get('/recycling', { params });
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await API.get('/admin/users', { params });
    return res.data;
  },

  getAllUsers: async (params = {}) => {
    const res = await API.get('/admin/users', { params });
    return res.data;
  },

  createStaff: async (staffData) => {
    const res = await API.post('/admin/users', staffData);
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await API.put(`/admin/users/${id}`, data);
    return res.data;
  },

  toggleUserStatus: async (id, isActive) => {
    const res = await API.put(`/admin/users/${id}`, { isActive });
    return res.data;
  },
};
