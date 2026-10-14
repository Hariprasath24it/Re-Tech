const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    pickupId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      default: 'Morning (09:00 AM - 12:00 PM)',
    },
    contactNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'ASSIGNED', 'COLLECTED', 'RECEIVED', 'COMPLETED'],
      default: 'REQUESTED',
    },
    notes: {
      type: String,
      default: '',
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    receivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pickup', pickupSchema);
