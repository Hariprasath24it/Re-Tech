const mongoose = require('mongoose');
const Device = require('../models/Device');

const findDeviceByIdentifier = (identifier) => {
  if (typeof identifier !== 'string' || !identifier.trim()) return null;

  const value = identifier.trim();
  return mongoose.isValidObjectId(value)
    ? Device.findById(value)
    : Device.findOne({ deviceId: value.toUpperCase() });
};

module.exports = findDeviceByIdentifier;