const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, type = 'INFO', link = '', eventKey }) => {
  if (!user) return null;

  try {
    return await Notification.create({
      user,
      title,
      message,
      type,
      link,
      ...(eventKey ? { eventKey } : {}),
    });
  } catch (error) {
    if (error.code !== 11000) {
      console.error('Notification creation failed:', error.name);
    }
    return null;
  }
};

module.exports = createNotification;