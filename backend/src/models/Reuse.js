const mongoose = require('mongoose');

const reuseSchema = new mongoose.Schema(
  {
    reuseId: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      unique: true,
    },
    reuseType: {
      type: String,
      enum: ['Donate', 'Resell', 'Internal reuse', 'Refurbished'],
      required: true,
    },
    conditionAfterRepair: {
      type: String,
      default: 'Refurbished - Fully Functional',
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
    finalDestination: {
      type: String,
      required: true, // e.g., 'NGO School Education Program', 'Community Library', 'Refurbished Marketplace'
    },
    reuseDate: {
      type: Date,
      default: Date.now,
    },
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reuse', reuseSchema);
