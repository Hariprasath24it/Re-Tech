import API from './api';

export const deviceService = {
  createDevice: async (formData) => {
    // If sending FormData (with image file), headers need to be multipart/form-data
    const res = await API.post('/devices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getMyDevices: async (params = {}) => {
    const res = await API.get('/devices/my-devices', { params });
    return res.data;
  },

  getAllDevices: async (params = {}) => {
    const res = await API.get('/devices', { params });
    return res.data;
  },

  getDeviceById: async (id) => {
    const res = await API.get(`/devices/${id}`);
    return res.data;
  },

  trackDevice: async (deviceId) => {
    const res = await API.get(`/devices/track/${deviceId}`);
    return res.data;
  },

  updateDevice: async (id, data) => {
    const res = await API.put(`/devices/${id}`, data);
    return res.data;
  },

  deleteDevice: async (id) => {
    const res = await API.delete(`/devices/${id}`);
    return res.data;
  },
};
