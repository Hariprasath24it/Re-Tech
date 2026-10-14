import API from './api';

export const technicianService = {
  // Inspections
  createInspection: async (data) => {
    const res = await API.post('/inspections', data);
    return res.data;
  },
  getAllInspections: async (params = {}) => {
    const res = await API.get('/inspections', { params });
    return res.data;
  },
  getInspectionByDevice: async (deviceId) => {
    const res = await API.get(`/inspections/device/${deviceId}`);
    return res.data;
  },

  // Repairs
  createRepair: async (data) => {
    const res = await API.post('/repairs', data);
    return res.data;
  },
  updateRepair: async (id, data) => {
    const res = await API.put(`/repairs/${id}`, data);
    return res.data;
  },
  getAllRepairs: async (params = {}) => {
    const res = await API.get('/repairs', { params });
    return res.data;
  },
  getRepairById: async (id) => {
    const res = await API.get(`/repairs/${id}`);
    return res.data;
  },

  // Reuse
  createReuse: async (data) => {
    const res = await API.post('/reuse', data);
    return res.data;
  },
  getAllReuse: async () => {
    const res = await API.get('/reuse');
    return res.data;
  },

  // Recycling
  createRecycling: async (data) => {
    const res = await API.post('/recycling', data);
    return res.data;
  },
  getAllRecycling: async (params = {}) => {
    const res = await API.get('/recycling', { params });
    return res.data;
  },

  // Completed devices (Reused + Recycled)
  getCompletedDevices: async (params = {}) => {
    const res = await API.get('/devices', {
      params: { status: 'REUSED,RECYCLED', ...params },
    });
    return res.data;
  },
};
