const getTrackingUrl = (deviceId) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return `${clientUrl}/track/${encodeURIComponent(deviceId)}`;
};

module.exports = getTrackingUrl;