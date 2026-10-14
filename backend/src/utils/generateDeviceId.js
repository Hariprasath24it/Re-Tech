const Device = require('../models/Device');

const generateDeviceId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `RET-${currentYear}-`;

  // Count existing devices with prefix to make sequential
  const count = await Device.countDocuments({
    deviceId: new RegExp(`^${prefix}`),
  });

  const nextNumber = (count + 1).toString().padStart(6, '0');
  let candidate = `${prefix}${nextNumber}`;

  // Double check uniqueness
  const exists = await Device.findOne({ deviceId: candidate });
  if (exists) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    candidate = `${prefix}${randomSuffix}`;
  }

  return candidate;
};

module.exports = generateDeviceId;
