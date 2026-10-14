const Inspection = require('../models/Inspection');
const Device = require('../models/Device');
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

// @desc    Perform diagnostic inspection on a device
// @route   POST /api/inspections
// @access  Private (Technician, Admin)
exports.createInspection = async (req, res, next) => {
  try {
    const {
      deviceId,
      deviceCondition,
      physicalDamage,
      batteryCondition,
      displayCondition,
      motherboardCondition,
      storageCondition,
      ramCondition,
      otherIssues,
      estimatedRepairCost,
      repairPossible,
      reusePossible,
      recyclingRequired,
      outcome,
      notes,
    } = req.body;

    const device = await findDeviceByIdentifier(deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    if (device.status !== 'RECEIVED') {
      return res.status(400).json({ success: false, message: 'Only received devices can be inspected.' });
    }
    if (await Inspection.exists({ device: device._id })) {
      return res.status(409).json({ success: false, message: 'This device already has an inspection record.' });
    }

    const inspectionId = `INSP-${Date.now().toString().slice(-6)}`;

    const inspection = await Inspection.create({
      inspectionId,
      device: device._id,
      technician: req.user._id,
      deviceCondition,
      physicalDamage,
      batteryCondition,
      displayCondition,
      motherboardCondition,
      storageCondition,
      ramCondition,
      otherIssues,
      estimatedRepairCost: Number(estimatedRepairCost) || 0,
      repairPossible: Boolean(repairPossible),
      reusePossible: Boolean(reusePossible),
      recyclingRequired: Boolean(recyclingRequired),
      outcome,
      notes,
    });

    // Update Device status based on outcome
    let newStatus = 'UNDER_REPAIR';
    let newStage = 'Under Repair';
    let lifecycleTitle = 'Inspection Completed - Repair Initiated';
    let lifecycleDesc = `Diagnosed by ${req.user.name}. Component evaluation complete. Device routed for repair.`;

    if (outcome === 'REUSE') {
      newStatus = 'READY_FOR_REUSE';
      newStage = 'Ready for Reuse';
      lifecycleTitle = 'Inspection Completed - Ready for Reuse';
      lifecycleDesc = `Diagnosed by ${req.user.name}. Device meets high standard and is directly eligible for reuse / donation.`;

    } else if (outcome === 'RECYCLE') {
      newStatus = 'READY_FOR_RECYCLING';
      newStage = 'Recycling Required';
      lifecycleTitle = 'Inspection Completed - Routed to Recycling';
      lifecycleDesc = `Diagnosed by ${req.user.name}. Device cannot be salvaged. Routed to eco-friendly recycling refinery.`;

    }

    device.status = newStatus;
    device.currentStage = newStage;
    device.lifecycleHistory.push({
      stage: 'Inspection Completed',
      status: newStatus,
      title: lifecycleTitle,
      description: lifecycleDesc,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await device.save();

    res.status(201).json({
      success: true,
      message: `Device inspected successfully. Outcome designated as: ${outcome}`,
      inspection,
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inspections
// @route   GET /api/inspections
// @access  Private (Technician, Admin)
exports.getAllInspections = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['outcome', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const outcomeFilter = parseEnumFilter(
      req.query.outcome,
      Inspection.schema.path('outcome').enumValues,
      'inspection outcome'
    );
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt'], '-createdAt');
    if (outcomeFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: outcomeFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [];
    if (req.user.role === 'technician') conditions.push({ technician: req.user._id });
    if (outcomeFilter.values.length) {
      conditions.push({ outcome: outcomeFilter.values.length === 1
        ? outcomeFilter.values[0]
        : { $in: outcomeFilter.values } });
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
          { inspectionId: regex },
          { outcome: regex },
          { device: { $in: matchingDevices.map((device) => device._id) } },
        ],
      });
    }

    const dateCondition = dateRangeCondition('createdAt', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);
    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;

    const [total, inspections] = await Promise.all([
      Inspection.countDocuments(filter),
      Inspection.find(filter)
      .populate('device', 'deviceId category brand model status')
      .populate('technician', 'name email')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      inspections,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inspection for single device
// @route   GET /api/inspections/device/:deviceId
// @access  Private
exports.getInspectionByDevice = async (req, res, next) => {
  try {
    const requestedDeviceId = req.params.deviceId.trim();
    const deviceFilter = /^[a-f\d]{24}$/i.test(requestedDeviceId)
      ? { $or: [{ _id: requestedDeviceId }, { deviceId: requestedDeviceId.toUpperCase() }] }
      : { deviceId: requestedDeviceId.toUpperCase() };
    const device = await Device.findOne(deviceFilter);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    const filter = { device: device._id };
    if (req.user.role === 'technician') filter.technician = req.user._id;

    const inspection = await Inspection.findOne(filter).populate(
      'technician',
      'name email'
    );

    if (!inspection && req.user.role === 'technician') {
      const inspectionExists = await Inspection.exists({ device: device._id });
      if (inspectionExists) {
        return res.status(404).json({ success: false, message: 'Inspection record not found.' });
      }
    }

    res.status(200).json({
      success: true,
      inspection,
    });
  } catch (error) {
    next(error);
  }
};
