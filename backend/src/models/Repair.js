const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema(
  {
    repairId: {
      type: String,
      required: true,
      unique: true,
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problem: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    partsRequired: [
      {
        partName: { type: String, required: true },
        cost: { type: Number, default: 0 },
      },
    ],
    partsCost: {
      type: Number,
      default: 0,
    },
    labourCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN PROGRESS', 'COMPLETED', 'QUALITY CHECK', 'READY FOR REUSE'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate total cost before saving
repairSchema.pre('save', function (next) {
  this.totalCost = (this.partsCost || 0) + (this.labourCost || 0);
  next();
});

module.exports = mongoose.model('Repair', repairSchema);
