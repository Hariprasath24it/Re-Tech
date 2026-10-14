const mongoose = require('mongoose');

const recyclingSchema = new mongoose.Schema(
  {
    recyclingId: {
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
    partner: {
      type: String,
      required: true, // e.g. 'GreenTech Eco-Recyclers', 'EcoEarth Refineries'
    },
    recyclingDate: {
      type: Date,
      default: Date.now,
    },
    weightKg: {
      type: Number,
      required: true,
      default: 1.5,
    },
    materialsRecovered: [
      {
        material: {
          type: String,
          enum: [
            'Plastic',
            'Copper',
            'Aluminium',
            'Steel',
            'Glass',
            'Circuit boards',
            'Batteries',
            'Precious Metals',
            'Other',
          ],
          required: true,
        },
        percentage: { type: Number, default: 0 },
        weightKg: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROCESS', 'COMPLETED'],
      default: 'SCHEDULED',
    },
    co2OffsetKg: {
      type: Number,
      default: 0,
    },
    certificateNumber: {
      type: String,
      default: '',
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

module.exports = mongoose.model('Recycling', recyclingSchema);
