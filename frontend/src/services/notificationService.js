import API from './api';

export const notificationService = {
  getNotifications: async () => {
    const res = await API.get('/notifications');
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await API.get('/notifications/unread-count');
    return res.data;
  },

  markNotificationRead: async (id) => {
    const res = await API.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await API.patch('/notifications/read-all');
    return res.data;
  },
};
