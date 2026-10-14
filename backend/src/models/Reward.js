const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['EARNED', 'REDEEMED'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
    },
    eventType: {
      type: String,
      enum: ['DEVICE_SUBMISSION', 'DEVICE_REUSED', 'DEVICE_RECYCLED'],
    },
    rewardItem: {
      type: String,
      default: '', // e.g. 'Rs. 100 Discount Coupon', 'Free Pickup Service'
    },
    redeemCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index(
  { user: 1, device: 1, eventType: 1 },
  {
    unique: true,
    partialFilterExpression: { eventType: { $exists: true } },
  }
);

module.exports = mongoose.model('Reward', rewardSchema);
