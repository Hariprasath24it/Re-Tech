const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Device category is required'],
      enum: [
        'Mobile Phone',
        'Laptop',
        'Desktop',
        'Monitor',
        'Television',
        'Printer',
        'Tablet',
        'Keyboard',
        'Mouse',
        'Charger',
        'Headphones',
        'Other',
      ],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    condition: {
      type: String,
      required: true,
      enum: ['Working', 'Partially Working', 'Damaged', 'Not Working'],
      default: 'Not Working',
    },
    issueDescription: {
      type: String,
      trim: true,
      default: '',
    },
    purchaseYear: {
      type: Number,
      default: new Date().getFullYear(),
    },
    estimatedAge: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    qrCode: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'REGISTERED',
        'PICKUP_REQUESTED',
        'ASSIGNED',
        'COLLECTED',
        'RECEIVED',
        'UNDER_INSPECTION',
        'UNDER_REPAIR',
        'REPAIRED',
        'QUALITY_CHECK',
        'READY_FOR_REUSE',
        'REUSED',
        'READY_FOR_RECYCLING',
        'RECYCLED',
      ],
      default: 'REGISTERED',
    },
    currentStage: {
      type: String,
      default: 'Device Registered',
    },
    lifecycleHistory: [
      {
        stage: { type: String, required: true },
        status: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Device', deviceSchema);
