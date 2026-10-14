const Pickup = require('../models/Pickup');
const Device = require('../models/Device');
const User = require('../models/User');
const findDeviceByIdentifier = require('../utils/findDeviceByIdentifier');
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

const PICKUP_STATUSES = ['REQUESTED', 'ASSIGNED', 'COLLECTED', 'RECEIVED', 'COMPLETED'];

// Helper to generate sequential pickup ID
const generatePickupId = async () => {
  const count = await Pickup.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `PCK-${new Date().getFullYear()}-${nextNum}`;
};

// @desc    Request a device pickup
// @route   POST /api/pickups
// @access  Private (User)
exports.createPickup = async (req, res, next) => {
  try {
    const { deviceId, address, preferredDate, preferredTime, contactNumber, notes } =
      req.body;

    // Verify device exists and belongs to user
    const device = await findDeviceByIdentifier(deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found.',
      });
    }

    if (
      req.user.role === 'user' &&
      device.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only request pickup for your own registered devices.',
      });
    }

    if (device.status !== 'REGISTERED') {
      return res.status(400).json({
        success: false,
        message: 'Pickup can only be requested for a registered device.',
      });
    }

    // Check if pickup already active for this device
    const existingPickup = await Pickup.findOne({
      device: device._id,
      status: { $in: ['REQUESTED', 'ASSIGNED', 'COLLECTED'] },
    });

    if (existingPickup) {
      return res.status(400).json({
        success: false,
        message: 'A pickup request is already pending or in progress for this device.',
      });
    }

    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      return res.status(400).json({ success: false, message: 'A valid pickup address is required.' });
    }
    if (preferredDate !== undefined && Number.isNaN(new Date(preferredDate).getTime())) {
      return res.status(400).json({ success: false, message: 'preferredDate must be a valid date.' });
    }

    const pickupId = await generatePickupId();

    const pickup = await Pickup.create({
      pickupId,
      device: device._id,
      user: req.user._id,
      address: {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
      },
      preferredDate: preferredDate || new Date(),
      preferredTime: preferredTime || 'Morning (09:00 AM - 12:00 PM)',
      contactNumber: contactNumber || req.user.phone,
      notes: notes || '',
      status: 'REQUESTED',
    });

    // Update device status and add to lifecycle
    device.status = 'PICKUP_REQUESTED';
    device.currentStage = 'Pickup Requested';
    device.lifecycleHistory.push({
      stage: 'Pickup Requested',
      status: 'PICKUP_REQUESTED',
      title: 'Pickup Requested by User',
      description: `Pickup requested for ${new Date(
        preferredDate
      ).toLocaleDateString()} at ${address.city}. Assigned ID: ${pickupId}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await device.save();

    await createNotification({
      user: pickup.user,
      title: 'Pickup requested',
      message: `Pickup for ${device.brand} ${device.model} has been requested.`,
      type: 'INFO',
      link: '/user/pickup',
      eventKey: `pickup-requested:${pickup._id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Pickup scheduled successfully! A collection agent will be assigned shortly.',
      pickup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pickups with filter
// @route   GET /api/pickups
// @access  Private (Admin, Collector)
exports.getAllPickups = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'collectorId', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const { status, collectorId } = req.query;
    const statusFilter = parseEnumFilter(status, PICKUP_STATUSES, 'pickup status');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'preferredDate', 'collectedAt'], '-createdAt');
    if (statusFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [];
    if (req.user.role === 'collector') {
      if (collectorId && collectorId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view pickups assigned to you.',
        });
      }
      conditions.push({
        $or: [
          { status: 'REQUESTED', collector: null },
          { collector: req.user._id },
        ],
      });
    } else if (collectorId) {
      if (typeof collectorId !== 'string' || !/^[a-f\d]{24}$/i.test(collectorId)) {
        return res.status(400).json({ success: false, message: 'Invalid collectorId.' });
      }
      conditions.push({ collector: collectorId });
    }

    if (statusFilter.values.length) {
      conditions.push({
        status: statusFilter.values.length === 1 ? statusFilter.values[0] : { $in: statusFilter.values },
      });
    }

    const dateCondition = dateRangeCondition('preferredDate', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);

    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'search must be a string.' });
    }
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const [matchingDevices, matchingUsers] = await Promise.all([
        Device.find({ $or: [{ deviceId: regex }, { brand: regex }, { model: regex }] }).select('_id'),
        User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).select('_id'),
      ]);
      conditions.push({
        $or: [
          { pickupId: regex },
          { 'address.street': regex },
          { 'address.city': regex },
          { 'address.state': regex },
          { 'address.pincode': regex },
          { device: { $in: matchingDevices.map((device) => device._id) } },
          { user: { $in: matchingUsers.map((user) => user._id) } },
        ],
      });
    }

    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};

    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
      .populate('device', 'deviceId category brand model condition status image')
      .populate('user', 'name email phone')
      .populate('collector', 'name email phone')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      pickups,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pickups for current user
// @route   GET /api/pickups/my-pickups
// @access  Private (User)
exports.getMyPickups = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }
    const statusFilter = parseEnumFilter(req.query.status, PICKUP_STATUSES, 'pickup status');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'preferredDate', 'collectedAt'], '-createdAt');
    if (statusFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [{ user: req.user._id }];
    if (statusFilter.values.length) {
      conditions.push({ status: statusFilter.values.length === 1 ? statusFilter.values[0] : { $in: statusFilter.values } });
    }
    const dateCondition = dateRangeCondition('preferredDate', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);
    const filter = { $and: conditions };
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
      .populate('device', 'deviceId category brand model condition status image')
      .populate('collector', 'name phone')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      pickups,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pickups assigned to logged-in collector
// @route   GET /api/pickups/collector/assigned
// @access  Private (Collector)
exports.getCollectorAssigned = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'collectorId', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const { status, collectorId } = req.query;
    const statusFilter = parseEnumFilter(status, PICKUP_STATUSES, 'pickup status');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'preferredDate', 'collectedAt'], 'preferredDate');
    if (statusFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const filter = {};
    if (req.user.role === 'collector') {
      if (collectorId && collectorId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view pickups assigned to you.',
        });
      }
      filter.collector = req.user._id;
    } else if (collectorId) {
      if (typeof collectorId !== 'string' || !/^[a-f\d]{24}$/i.test(collectorId)) {
        return res.status(400).json({ success: false, message: 'Invalid collectorId.' });
      }
      filter.collector = collectorId;
    } else {
      filter.collector = { $ne: null };
    }

    if (statusFilter.values.length) {
      filter.status = statusFilter.values.length === 1
        ? statusFilter.values[0]
        : { $in: statusFilter.values };
    }

    const dateCondition = dateRangeCondition('preferredDate', dateRange.range);
    if (dateCondition) filter.preferredDate = dateCondition.preferredDate;

    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    const [total, pickups] = await Promise.all([
      Pickup.countDocuments(filter),
      Pickup.find(filter)
      .populate('device', 'deviceId category brand model condition status image')
      .populate('user', 'name email phone address')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      pickups,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Collector accepts a pickup request
// @route   PUT /api/pickups/:id/accept
// @access  Private (Collector, Admin)
exports.acceptPickup = async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('device');
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found.' });
    }

    if (pickup.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept pickup in '${pickup.status}' status.`,
      });
    }
    if (pickup.device.status !== 'PICKUP_REQUESTED') {
      return res.status(409).json({ success: false, message: 'Device is not in the expected pickup stage.' });
    }

    if (
      req.user.role === 'collector' &&
      pickup.collector &&
      pickup.collector.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'This pickup is assigned to another collector.' });
    }

    const claimFilter = { _id: pickup._id, status: 'REQUESTED' };
    if (req.user.role === 'collector') {
      claimFilter.$or = [{ collector: null }, { collector: req.user._id }];
    }
    const claimedPickup = await Pickup.findOneAndUpdate(
      claimFilter,
      { $set: { collector: req.user._id, status: 'ASSIGNED' } },
      { new: true }
    ).populate('device');
    if (!claimedPickup) {
      return res.status(409).json({ success: false, message: 'This pickup has already been claimed.' });
    }
    Object.assign(pickup, claimedPickup.toObject());

    // Update Device Lifecycle
    const device = await Device.findById(pickup.device._id);
    if (device) {
      device.status = 'ASSIGNED';
      device.currentStage = 'Pickup Assigned';
      device.lifecycleHistory.push({
        stage: 'Pickup Assigned',
        status: 'ASSIGNED',
        title: 'Collection Agent Assigned',
        description: `Agent ${req.user.name} has been assigned to collect the item.`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await device.save();
    }

    await createNotification({
      user: pickup.user,
      title: 'Device collected',
      message: `Your device ${pickup.device.deviceId} has been collected and is in transit to the hub.`,
      type: 'INFO',
      link: `/track/${pickup.device.deviceId}`,
      eventKey: `pickup-collected:${pickup._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Pickup request accepted and assigned to you!',
      pickup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Collector marks item as collected from user
// @route   PUT /api/pickups/:id/collected
// @access  Private (Collector, Admin)
exports.markCollected = async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('device');
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup request not found.' });
    }

    if (req.user.role === 'collector') {
      if (pickup.collector?.toString() !== req.user._id.toString()) {
        return res.status(404).json({ success: false, message: 'Pickup request not found.' });
      }
      if (pickup.status !== 'ASSIGNED') {
        return res.status(400).json({ success: false, message: `Cannot collect pickup in '${pickup.status}' status.` });
      }
    } else if (pickup.status !== 'ASSIGNED') {
      return res.status(400).json({ success: false, message: `Cannot collect pickup in '${pickup.status}' status.` });
    }
    if (pickup.device.status !== 'ASSIGNED') {
      return res.status(409).json({ success: false, message: 'Device is not in the expected assigned stage.' });
    }

    pickup.status = 'COLLECTED';
    pickup.collectedAt = new Date();
    await pickup.save();

    // Update Device Lifecycle
    const device = await Device.findById(pickup.device._id);
    if (device) {
      device.status = 'COLLECTED';
      device.currentStage = 'Pickup Completed';
      device.lifecycleHistory.push({
        stage: 'Pickup Completed',
        status: 'COLLECTED',
        title: 'E-Waste Collected from User',
        description: `Device collected from user premises by Agent ${req.user.name}. In transit to inspection hub.`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await device.save();
    }

    await createNotification({
      user: pickup.user,
      title: 'Device received at hub',
      message: `Your device ${pickup.device.deviceId} has arrived at the sorting hub and is ready for inspection.`,
      type: 'INFO',
      link: `/track/${pickup.device.deviceId}`,
      eventKey: `pickup-received:${pickup._id}`,
    });

    res.status(200).json({
      success: true,
      message: 'Device marked as COLLECTED. Transit to hub initiated.',
      pickup,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark device as received at facility hub
// @route   PUT /api/pickups/:id/received
// @access  Private (Collector, Technician, Admin)
exports.markReceived = async (req, res, next) => {
  try {
    const pickup = await Pickup.findById(req.params.id).populate('device');
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup record not found.' });
    }

    if (req.user.role === 'collector') {
      if (pickup.collector?.toString() !== req.user._id.toString()) {
        return res.status(404).json({ success: false, message: 'Pickup record not found.' });
      }
      if (pickup.status !== 'COLLECTED') {
        return res.status(400).json({ success: false, message: `Cannot receive pickup in '${pickup.status}' status.` });
      }
    } else if (pickup.status !== 'COLLECTED') {
      return res.status(400).json({ success: false, message: `Cannot receive pickup in '${pickup.status}' status.` });
    }
    if (pickup.device.status !== 'COLLECTED') {
      return res.status(409).json({ success: false, message: 'Device is not in the expected collected stage.' });
    }

    pickup.status = 'RECEIVED';
    pickup.receivedAt = new Date();
    await pickup.save();

    const device = await Device.findById(pickup.device._id);
    if (device) {
      device.status = 'RECEIVED';
      device.currentStage = 'Device Received at Hub';
      device.lifecycleHistory.push({
        stage: 'Device Received',
        status: 'RECEIVED',
        title: 'Device Received at Sorting Hub',
        description: `Device checked into warehouse inventory. Queued for technical inspection.`,
        timestamp: new Date(),
        updatedBy: req.user._id,
      });
      await device.save();
    }

    res.status(200).json({
      success: true,
      message: 'Device marked as RECEIVED at hub. Ready for technician inspection.',
      pickup,
    });
  } catch (error) {
    next(error);
  }
};
