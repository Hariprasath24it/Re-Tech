import API from './api';

export const pickupService = {
  createPickup: async (pickupData) => {
    const res = await API.post('/pickups', pickupData);
    return res.data;
  },

  getMyPickups: async () => {
    const res = await API.get('/pickups/my-pickups');
    return res.data;
  },

  getAllPickups: async (params = {}) => {
    const res = await API.get('/pickups', { params });
    return res.data;
  },

  getCollectorAssigned: async (params = {}) => {
    const res = await API.get('/pickups/collector/assigned', { params });
    return res.data;
  },

  acceptPickup: async (id) => {
    const res = await API.put(`/pickups/${id}/accept`);
    return res.data;
  },

  markCollected: async (id) => {
    const res = await API.put(`/pickups/${id}/collected`);
    return res.data;
  },

  markReceived: async (id) => {
    const res = await API.put(`/pickups/${id}/received`);
    return res.data;
  },
};
