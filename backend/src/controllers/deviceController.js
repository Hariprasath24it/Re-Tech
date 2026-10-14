const QRCode = require('qrcode');
const Device = require('../models/Device');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Pickup = require('../models/Pickup');
const Inspection = require('../models/Inspection');
const Repair = require('../models/Repair');
const Reuse = require('../models/Reuse');
const Recycling = require('../models/Recycling');
const generateDeviceId = require('../utils/generateDeviceId');
const getTrackingUrl = require('../utils/trackingUrl');
const createNotification = require('../utils/createNotification');
const {
  escapeRegex,
  parseEnumFilter,
  parsePagination,
  parseDateRange,
  dateRangeCondition,
  parseSort,
  paginationMetadata,
} = require('../utils/queryFilters');

const getStaffVisibleDeviceIds = async (user) => {
  if (user.role === 'collector') {
    return Pickup.find({
      $or: [
        { status: 'REQUESTED', collector: null },
        { collector: user._id },
      ],
    }).distinct('device');
  }

  if (user.role === 'technician') {
    const [intakeIds, inspectionIds, repairIds] = await Promise.all([
      Device.find({ status: { $in: ['COLLECTED', 'RECEIVED'] } }).distinct('_id'),
      Inspection.distinct('device', { technician: user._id }),
      Repair.distinct('device', { technician: user._id }),
    ]);
    return [...new Set([...intakeIds, ...inspectionIds, ...repairIds].map(String))];
  }

  return [];
};

// Point values based on device category
const calculateDevicePoints = (category) => {
  switch (category) {
    case 'Laptop':
      return 100;
    case 'Desktop':
      return 100;
    case 'Mobile Phone':
      return 50;
    case 'Tablet':
      return 60;
    case 'Television':
    case 'Monitor':
      return 80;
    case 'Printer':
      return 70;
    case 'Keyboard':
    case 'Mouse':
    case 'Charger':
    case 'Headphones':
      return 25;
    default:
      return 40;
  }
};

// @desc    Register a new e-waste device
// @route   POST /api/devices
// @access  Private (User)
exports.createDevice = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      model,
      serialNumber,
      condition,
      issueDescription,
      purchaseYear,
      estimatedAge,
    } = req.body;

    const deviceId = await generateDeviceId();
    const trackingUrl = getTrackingUrl(deviceId);

    // Generate scannable QR Code as Data URI
    const qrCode = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#0f3d2e', // Deep emerald brand color
        light: '#ffffff',
      },
    });

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    const device = await Device.create({
      deviceId,
      owner: req.user._id,
      category,
      brand,
      model,
      serialNumber: serialNumber || '',
      condition,
      issueDescription: issueDescription || '',
      purchaseYear: purchaseYear || new Date().getFullYear(),
      estimatedAge: estimatedAge || '',
      image: imageUrl,
      qrCode,
      status: 'REGISTERED',
      currentStage: 'Device Registered',
      lifecycleHistory: [
        {
          stage: 'Device Registered',
          status: 'REGISTERED',
          title: 'Device Registered in System',
          description: `Device details logged by ${req.user.name}. Unique ID assigned: ${deviceId}`,
          timestamp: new Date(),
          updatedBy: req.user._id,
        },
      ],
    });

    // Award initial submission reward points
    const pointsAwarded = calculateDevicePoints(category);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { rewardPoints: pointsAwarded },
    });

    const submissionReward = await Reward.create({
      user: req.user._id,
      points: pointsAwarded,
      type: 'EARNED',
      title: `E-Waste Submission: ${brand} ${model}`,
      description: `Earned ${pointsAwarded} points for submitting a ${category} for eco-friendly handling.`,
      device: device._id,
      eventType: 'DEVICE_SUBMISSION',
    });

    await createNotification({
      user: req.user._id,
      title: 'Device registered',
      message: `${brand} ${model} was registered with ID ${deviceId}.`,
      type: 'SUCCESS',
      link: `/track/${deviceId}`,
      eventKey: `device-registered:${device._id}`,
    });
    await createNotification({
      user: req.user._id,
      title: 'Reward points awarded',
      message: `You earned ${submissionReward.points} points for registering ${brand} ${model}.`,
      type: 'SUCCESS',
      link: '/user/rewards',
      eventKey: `reward-awarded:${submissionReward._id}`,
    });

    res.status(201).json({
      success: true,
      message: `Device registered successfully with ID ${deviceId}! You earned ${pointsAwarded} reward points.`,
      device,
      pointsAwarded,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all devices owned by logged-in user
// @route   GET /api/devices/my-devices
// @access  Private (User)
exports.getMyDevices = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'category', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const statusFilter = parseEnumFilter(req.query.status, Device.schema.path('status').enumValues, 'device status');
    const categoryFilter = parseEnumFilter(req.query.category, Device.schema.path('category').enumValues, 'device category');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'deviceId', 'purchaseYear'], '-createdAt');
    if (statusFilter.error || categoryFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || categoryFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }
    if (categoryFilter.values.length > 1) {
      return res.status(400).json({ success: false, message: 'Only one device category may be specified.' });
    }

    const conditions = [{ owner: req.user._id }];
    if (statusFilter.values.length) {
      conditions.push({ status: statusFilter.values.length === 1 ? statusFilter.values[0] : { $in: statusFilter.values } });
    }
    if (categoryFilter.values.length) conditions.push({ category: categoryFilter.values[0] });
    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'search must be a string.' });
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      conditions.push({ $or: [{ deviceId: regex }, { brand: regex }, { model: regex }] });
    }
    const dateCondition = dateRangeCondition('createdAt', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);

    const filter = { $and: conditions };
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    const [total, devices] = await Promise.all([
      Device.countDocuments(filter),
      Device.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      devices,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all devices (for Admin, Collector, Technician)
// @route   GET /api/devices
// @access  Private (Admin, Collector, Technician)
exports.getAllDevices = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'category', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const statusFilter = parseEnumFilter(
      req.query.status,
      Device.schema.path('status').enumValues,
      'device status'
    );
    if (statusFilter.error) {
      return res.status(400).json({ success: false, message: statusFilter.error });
    }

    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'deviceId', 'purchaseYear'], '-createdAt');
    if (pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [];
    if (req.user.role !== 'admin') {
      const visibleDeviceIds = await getStaffVisibleDeviceIds(req.user);
      conditions.push({ _id: { $in: visibleDeviceIds } });
    }

    if (statusFilter.values.length) {
      conditions.push({
        status: statusFilter.values.length === 1
          ? statusFilter.values[0]
          : { $in: statusFilter.values },
      });
    }

    if (req.query.category) {
      const categoryFilter = parseEnumFilter(
        req.query.category,
        Device.schema.path('category').enumValues,
        'device category'
      );
      if (categoryFilter.error || categoryFilter.values.length !== 1) {
        return res.status(400).json({
          success: false,
          message: categoryFilter.error || 'Only one device category may be specified.',
        });
      }
      conditions.push({ category: categoryFilter.values[0] });
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'search must be a string.' });
    }
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      conditions.push({ $or: [{ deviceId: regex }, { brand: regex }, { model: regex }] });
    }

    const dateCondition = dateRangeCondition('createdAt', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);

    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    let query = Device.find(filter)
      .populate('owner', req.user.role === 'admin' ? 'name email phone address' : 'name')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit);
    const [total, devices] = await Promise.all([Device.countDocuments(filter), query]);

    res.status(200).json({
      success: true,
      count: total,
      devices,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track device by deviceId (e.g. RET-2026-000001)
// @route   GET /api/devices/track/:deviceId
// @access  Public
exports.trackDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const formattedId = deviceId.trim().toUpperCase();

    const device = await Device.findOne({ deviceId: formattedId });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device with ID "${formattedId}" was not found. Please verify the ID.`,
      });
    }

    // Return only status and date fields needed by the public tracking page.
    const [pickup, inspection, repair, reuse, recycling] = await Promise.all([
      Pickup.findOne({ device: device._id }),
      Inspection.findOne({ device: device._id }),
      Repair.findOne({ device: device._id }),
      Reuse.findOne({ device: device._id }),
      Recycling.findOne({ device: device._id }),
    ]);

    const publicDevice = {
      deviceId: device.deviceId,
      category: device.category,
      brand: device.brand,
      model: device.model,
      qrCode: device.qrCode,
      status: device.status,
      currentStage: device.currentStage,
      lifecycleHistory: device.lifecycleHistory.map((event) => ({
        stage: event.stage,
        status: event.status,
        title: event.title,
        timestamp: event.timestamp,
      })),
    };

    const publicDetails = {
      pickup: pickup && {
        status: pickup.status,
        createdAt: pickup.createdAt,
        collectedAt: pickup.collectedAt,
        receivedAt: pickup.receivedAt,
      },
      inspection: inspection && {
        outcome: inspection.outcome,
        createdAt: inspection.createdAt,
      },
      repair: repair && {
        status: repair.status,
        startedAt: repair.startedAt,
        completedAt: repair.completedAt,
      },
      reuse: reuse && {
        reuseType: reuse.reuseType,
        reuseDate: reuse.reuseDate,
      },
      recycling: recycling && {
        status: recycling.status,
        recyclingDate: recycling.recyclingDate,
      },
    };

    res.status(200).json({
      success: true,
      device: publicDevice,
      details: publicDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single device by mongo _id
// @route   GET /api/devices/:id
// @access  Private
exports.getDeviceById = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id).populate(
      'owner',
      req.user.role === 'admin' ? 'name email phone address' : 'name'
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }

    // Verify user owns device or is authorized staff
    if (
      req.user.role === 'user' &&
      device.owner._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this device.',
      });
    }

    if (['collector', 'technician'].includes(req.user.role)) {
      const visibleDeviceIds = await getStaffVisibleDeviceIds(req.user);
      if (!visibleDeviceIds.some((id) => id.toString() === device._id.toString())) {
        return res.status(404).json({ success: false, message: 'Device not found.' });
      }
    }

    res.status(200).json({
      success: true,
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device information
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res, next) => {
  try {
    let device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    // Check authorization
    if (
      req.user.role === 'user' &&
      device.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this device.',
      });
    }

    if (['collector', 'technician'].includes(req.user.role)) {
      const visibleDeviceIds = await getStaffVisibleDeviceIds(req.user);
      if (!visibleDeviceIds.some((id) => id.toString() === device._id.toString())) {
        return res.status(404).json({ success: false, message: 'Device not found.' });
      }
    }

    const protectedFields = ['owner', 'deviceId', 'status', 'currentStage', 'lifecycleHistory'];
    if (protectedFields.some((field) => Object.hasOwn(req.body, field))) {
      return res.status(403).json({
        success: false,
        message: 'Device lifecycle fields can only be updated through workflow actions.',
      });
    }

    const editableFields = [
      'brand',
      'model',
      'serialNumber',
      'condition',
      'issueDescription',
      'purchaseYear',
      'estimatedAge',
      'image',
    ];
    const updates = Object.fromEntries(
      editableFields
        .filter((field) => Object.hasOwn(req.body, field))
        .map((field) => [field, req.body[field]])
    );

    device = await Device.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Device updated successfully.',
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private (Admin or Owner before pickup)
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    if (
      req.user.role !== 'admin' &&
      (device.owner.toString() !== req.user._id.toString() ||
        device.status !== 'REGISTERED')
    ) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete device once pickup has been requested or processed.',
      });
    }

    await device.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Device removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
