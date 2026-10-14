const Reuse = require('../models/Reuse');
const Device = require('../models/Device');
const Reward = require('../models/Reward');
const User = require('../models/User');
const Inspection = require('../models/Inspection');
const Repair = require('../models/Repair');
const createNotification = require('../utils/createNotification');
const findDeviceByIdentifier = require('../utils/findDeviceByIdentifier');

// @desc    Register device for reuse / refurbishment / donation
// @route   POST /api/reuse
// @access  Private (Technician, Admin)
exports.createReuse = async (req, res, next) => {
  try {
    const {
      deviceId,
      reuseType,
      conditionAfterRepair,
      estimatedValue,
      finalDestination,
      notes,
    } = req.body;

    const device = await findDeviceByIdentifier(deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    if (device.status !== 'READY_FOR_REUSE') {
      return res.status(400).json({
        success: false,
        message: 'Device must be ready for reuse before a reuse allocation can be created.',
      });
    }

    if (req.user.role === 'technician') {
      const [assignedInspection, assignedRepair] = await Promise.all([
        Inspection.exists({ device: device._id, technician: req.user._id, outcome: 'REUSE' }),
        Repair.exists({ device: device._id, technician: req.user._id, status: 'READY FOR REUSE' }),
      ]);
      if (!assignedInspection && !assignedRepair) {
        return res.status(404).json({ success: false, message: 'Device not found in your assigned work.' });
      }
    }

    const reuseId = `REU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const reuse = await Reuse.create({
      reuseId,
      device: device._id,
      reuseType,
      conditionAfterRepair: conditionAfterRepair || 'Refurbished - Grade A Functional',
      estimatedValue: Number(estimatedValue) || 0,
      finalDestination,
      managedBy: req.user._id,
      notes: notes || '',
    });

    device.status = 'REUSED';
    device.currentStage = 'Device Reused';
    device.lifecycleHistory.push({
      stage: 'Device Reused',
      status: 'REUSED',
      title: `Allocated for Reuse (${reuseType})`,
      description: `Device assigned to: ${finalDestination}. Estimated economic value: ₹${estimatedValue}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await device.save();

    const existingReward = await Reward.findOne({
      user: device.owner,
      device: device._id,
      eventType: 'DEVICE_REUSED',
    });

    let earnedReward = null;
    if (!existingReward) {
      earnedReward = await Reward.create({
        user: device.owner,
        points: 150,
        type: 'EARNED',
        title: 'Eco-Hero: Device Reusable Bonus',
        description: `Your ${device.brand} ${device.model} was certified for reuse.`,
        device: device._id,
        eventType: 'DEVICE_REUSED',
      });
      await User.findByIdAndUpdate(device.owner, { $inc: { rewardPoints: 150 } });
    }

    await createNotification({
      user: device.owner,
      title: 'Device allocated for reuse',
      message: `${device.brand} ${device.model} has been allocated for reuse.`,
      type: 'SUCCESS',
      link: `/track/${device.deviceId}`,
      eventKey: `device-reused:${reuse._id}`,
    });
    if (earnedReward) {
      await createNotification({
        user: device.owner,
        title: 'Reward points awarded',
        message: 'You earned 150 points for your device being reused.',
        type: 'SUCCESS',
        link: '/user/rewards',
        eventKey: `reward-awarded:${earnedReward._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reuse allocation registered successfully.',
      reuse,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.device) {
      return res.status(409).json({
        success: false,
        message: 'A reuse allocation already exists for this device.',
      });
    }
    next(error);
  }
};

// @desc    Get all reuse records
// @route   GET /api/reuse
// @access  Private (Admin, Technician)
exports.getAllReuse = async (req, res, next) => {
  try {
    const reuseRecords = await Reuse.find()
      .populate('device', 'deviceId category brand model status image')
      .populate('managedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reuseRecords.length,
      reuseRecords,
    });
  } catch (error) {
    next(error);
  }
};
