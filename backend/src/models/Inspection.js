const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
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
    deviceCondition: {
      type: String,
      required: true,
    },
    physicalDamage: {
      type: String,
      enum: ['None', 'Minor Scratches', 'Moderate Cracks', 'Severe Structural Damage'],
      default: 'None',
    },
    batteryCondition: {
      type: String,
      enum: ['Good', 'Degraded', 'Dead', 'Missing', 'N/A'],
      default: 'Good',
    },
    displayCondition: {
      type: String,
      enum: ['Flawless', 'Scratched', 'Cracked Screen', 'Dead Pixels / No Display', 'N/A'],
      default: 'Flawless',
    },
    motherboardCondition: {
      type: String,
      enum: ['Working', 'Minor Circuit Fault', 'Burnt / Damaged', 'Untested'],
      default: 'Working',
    },
    storageCondition: {
      type: String,
      enum: ['Healthy', 'Bad Sectors', 'Damaged', 'Removed / Sanitized', 'N/A'],
      default: 'Healthy',
    },
    ramCondition: {
      type: String,
      enum: ['Working', 'Defective', 'Missing', 'N/A'],
      default: 'Working',
    },
    otherIssues: {
      type: String,
      default: '',
    },
    estimatedRepairCost: {
      type: Number,
      default: 0,
    },
    repairPossible: {
      type: Boolean,
      default: false,
    },
    reusePossible: {
      type: Boolean,
      default: false,
    },
    recyclingRequired: {
      type: Boolean,
      default: false,
    },
    outcome: {
      type: String,
      enum: ['REPAIR', 'REUSE', 'RECYCLE'],
      required: true,
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

module.exports = mongoose.model('Inspection', inspectionSchema);
