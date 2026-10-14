const Recycling = require('../models/Recycling');
const Device = require('../models/Device');
const Reward = require('../models/Reward');
const User = require('../models/User');
const Inspection = require('../models/Inspection');
const createNotification = require('../utils/createNotification');
const findDeviceByIdentifier = require('../utils/findDeviceByIdentifier');
const {
  escapeRegex,
  parseEnumFilter,
  parsePagination,
  parseDateRange,
  dateRangeCondition,
  parseSort,
  paginationMetadata,
} = require('../utils/queryFilters');

// @desc    Process device into certified recycling
// @route   POST /api/recycling
// @access  Private (Technician, Admin)
exports.createRecycling = async (req, res, next) => {
  try {
    const {
      deviceId,
      partner,
      weightKg,
      materialsRecovered,
      notes,
    } = req.body;

    const device = await findDeviceByIdentifier(deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    if (device.status !== 'READY_FOR_RECYCLING') {
      return res.status(400).json({
        success: false,
        message: 'Device must be ready for recycling before a recycling record can be created.',
      });
    }

    if (req.user.role === 'technician') {
      const assignedInspection = await Inspection.exists({
        device: device._id,
        technician: req.user._id,
        outcome: 'RECYCLE',
      });
      if (!assignedInspection) {
        return res.status(404).json({ success: false, message: 'Device not found in your assigned work.' });
      }
    }

    const count = await Recycling.countDocuments();
    const recyclingId = `RCY-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
    const certNum = `CERT-ENV-${Date.now().toString().slice(-6)}`;
    const weight = Number(weightKg) || 1.8;
    const co2Offset = +(weight * 2.3).toFixed(2); // Avg 2.3 kg CO2 saved per kg of e-waste recycled

    const recycling = await Recycling.create({
      recyclingId,
      device: device._id,
      partner: partner || 'EcoEarth CleanTech Refineries',
      weightKg: weight,
      materialsRecovered: materialsRecovered || [
        { material: 'Plastic', percentage: 40, weightKg: +(weight * 0.4).toFixed(2) },
        { material: 'Copper', percentage: 15, weightKg: +(weight * 0.15).toFixed(2) },
        { material: 'Aluminium', percentage: 20, weightKg: +(weight * 0.2).toFixed(2) },
        { material: 'Circuit boards', percentage: 15, weightKg: +(weight * 0.15).toFixed(2) },
        { material: 'Steel', percentage: 10, weightKg: +(weight * 0.1).toFixed(2) },
      ],
      status: 'COMPLETED',
      co2OffsetKg: co2Offset,
      certificateNumber: certNum,
      notes: notes || '',
    });

    device.status = 'RECYCLED';
    device.currentStage = 'Recycled';
    device.lifecycleHistory.push({
      stage: 'Recycled',
      status: 'RECYCLED',
      title: 'Certified Eco-Friendly Recycling Completed',
      description: `Disassembled by ${recycling.partner}. ${weight} kg material safely diverted from landfill. Certificate: ${certNum}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await device.save();

    const existingReward = await Reward.findOne({
      user: device.owner,
      device: device._id,
      eventType: 'DEVICE_RECYCLED',
    });

    let earnedReward = null;
    if (!existingReward) {
      earnedReward = await Reward.create({
        user: device.owner,
        points: 75,
        type: 'EARNED',
        title: 'Zero-Waste: Material Recycling Bonus',
        description: `Your ${device.brand} ${device.model} was certified for recycling.`,
        device: device._id,
        eventType: 'DEVICE_RECYCLED',
      });
      await User.findByIdAndUpdate(device.owner, { $inc: { rewardPoints: 75 } });
    }

    await createNotification({
      user: device.owner,
      title: 'Device recycled',
      message: `${device.brand} ${device.model} has been processed for recycling.`,
      type: 'SUCCESS',
      link: `/track/${device.deviceId}`,
      eventKey: `device-recycled:${recycling._id}`,
    });
    if (earnedReward) {
      await createNotification({
        user: device.owner,
        title: 'Reward points awarded',
        message: 'You earned 75 points for your device being recycled.',
        type: 'SUCCESS',
        link: '/user/rewards',
        eventKey: `reward-awarded:${earnedReward._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Recycling record registered successfully.',
      recycling,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A recycling record or identifier already exists.',
      });
    }
    next(error);
  }
};

// @desc    Get all recycling records
// @route   GET /api/recycling
// @access  Private (Admin, Technician)
exports.getAllRecycling = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const statusFilter = parseEnumFilter(req.query.status, Recycling.schema.path('status').enumValues, 'recycling status');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'recyclingDate', 'weightKg'], '-createdAt');
    if (statusFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [];
    if (statusFilter.values.length) {
      conditions.push({ status: statusFilter.values.length === 1 ? statusFilter.values[0] : { $in: statusFilter.values } });
    }
    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'search must be a string.' });
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const matchingDevices = await Device.find({
        $or: [{ deviceId: regex }, { brand: regex }, { model: regex }],
      }).select('_id');
      conditions.push({
        $or: [
          { recyclingId: regex },
          { partner: regex },
          { certificateNumber: regex },
          { device: { $in: matchingDevices.map((device) => device._id) } },
        ],
      });
    }
    const dateCondition = dateRangeCondition('recyclingDate', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);
    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;

    const [total, records, totals] = await Promise.all([
      Recycling.countDocuments(filter),
      Recycling.find(filter)
        .populate('device', 'deviceId category brand model status image')
        .sort({ [sortField]: sortDirection })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Recycling.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalWeightKg: { $sum: { $ifNull: ['$weightKg', 0] } },
            totalCo2OffsetKg: { $sum: { $ifNull: ['$co2OffsetKg', 0] } },
          },
        },
      ]),
    ]);

    const totalWeight = totals[0]?.totalWeightKg || 0;
    const totalCo2Offset = totals[0]?.totalCo2OffsetKg || 0;

    res.status(200).json({
      success: true,
      count: total,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
      metrics: {
        totalWeightKg: +totalWeight.toFixed(1),
        totalCo2OffsetKg: +totalCo2Offset.toFixed(1),
      },
      records,
    });
  } catch (error) {
    next(error);
  }
};
