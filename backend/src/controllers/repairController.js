const Repair = require('../models/Repair');
const Device = require('../models/Device');
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

// Helper to generate repair ID
const generateRepairId = async () => {
  const count = await Repair.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `REP-${new Date().getFullYear()}-${nextNum}`;
};

// @desc    Initiate a new repair job
// @route   POST /api/repairs
// @access  Private (Technician, Admin)
exports.createRepair = async (req, res, next) => {
  try {
    const {
      deviceId,
      problem,
      diagnosis,
      partsRequired,
      partsCost,
      labourCost,
      notes,
    } = req.body;

    const device = await findDeviceByIdentifier(deviceId);

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    if (device.status !== 'UNDER_REPAIR') {
      return res.status(400).json({ success: false, message: 'Device must be assigned for repair before a repair job can be created.' });
    }
    if (req.user.role === 'technician') {
      const assignedInspection = await Inspection.exists({
        device: device._id,
        technician: req.user._id,
        outcome: 'REPAIR',
      });
      if (!assignedInspection) {
        return res.status(404).json({ success: false, message: 'Device not found in your assigned repair work.' });
      }
    }
    const activeRepair = await Repair.exists({
      device: device._id,
      status: { $in: ['PENDING', 'IN PROGRESS', 'COMPLETED', 'QUALITY CHECK'] },
    });
    if (activeRepair) {
      return res.status(409).json({ success: false, message: 'An active repair already exists for this device.' });
    }

    const repairId = await generateRepairId();

    const repair = await Repair.create({
      repairId,
      device: device._id,
      technician: req.user._id,
      problem,
      diagnosis,
      partsRequired: partsRequired || [],
      partsCost: Number(partsCost) || 0,
      labourCost: Number(labourCost) || 0,
      totalCost: (Number(partsCost) || 0) + (Number(labourCost) || 0),
      status: 'IN PROGRESS',
      notes: notes || '',
      startedAt: new Date(),
    });

    device.status = 'UNDER_REPAIR';
    device.currentStage = 'Repair in Progress';
    device.lifecycleHistory.push({
      stage: 'Repair in Progress',
      status: 'UNDER_REPAIR',
      title: 'Technician Started Repair Work',
      description: `Technician ${req.user.name} commenced repair. Job ID: ${repairId}. Diagnosis: ${diagnosis}`,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
    await device.save();

    res.status(201).json({
      success: true,
      message: 'Repair record initiated successfully.',
      repair,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update repair stage / costs / completion
// @route   PUT /api/repairs/:id
// @access  Private (Technician, Admin)
exports.updateRepair = async (req, res, next) => {
  try {
    const { status, partsRequired, partsCost, labourCost, notes } = req.body;

    const repairFilter = { _id: req.params.id };
    if (req.user.role === 'technician') repairFilter.technician = req.user._id;
    let repair = await Repair.findOne(repairFilter).populate('device');
    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair record not found.' });
    }

    const nextStatuses = {
      PENDING: ['IN PROGRESS'],
      'IN PROGRESS': ['COMPLETED'],
      COMPLETED: ['QUALITY CHECK'],
      'QUALITY CHECK': ['READY FOR REUSE'],
      'READY FOR REUSE': [],
    };
    if (status !== undefined) {
      if (!Repair.schema.path('status').enumValues.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid repair status.' });
      }
      if (status !== repair.status && !nextStatuses[repair.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change repair status from '${repair.status}' to '${status}'.`,
        });
      }
    }

    if (partsRequired) repair.partsRequired = partsRequired;
    if (partsCost !== undefined) repair.partsCost = Number(partsCost);
    if (labourCost !== undefined) repair.labourCost = Number(labourCost);
    if (notes) repair.notes = notes;

    if (status && status !== repair.status) {
      repair.status = status;

      const device = await Device.findById(repair.device._id);
      if (device) {
        if (status === 'IN PROGRESS') {
          if (device.status !== 'UNDER_REPAIR') {
            return res.status(409).json({ success: false, message: 'Device is not in the expected repair stage.' });
          }
          device.status = 'UNDER_REPAIR';
          device.currentStage = 'Repair in Progress';
        } else if (status === 'COMPLETED') {
          if (device.status !== 'UNDER_REPAIR') {
            return res.status(409).json({ success: false, message: 'Device is not in the expected repair stage.' });
          }
          repair.completedAt = new Date();
          device.status = 'REPAIRED';
          device.currentStage = 'Repair Completed';
          device.lifecycleHistory.push({
            stage: 'Repair Completed',
            status: 'REPAIRED',
            title: 'Repair Work Completed',
            description: 'Repair work is complete and awaiting final quality checks.',
            timestamp: new Date(),
            updatedBy: req.user._id,
          });
        } else if (status === 'QUALITY CHECK') {
          if (device.status !== 'REPAIRED') {
            return res.status(409).json({ success: false, message: 'Device is not in the expected repair stage.' });
          }
          device.status = 'QUALITY_CHECK';
          device.currentStage = 'Quality Check';
          device.lifecycleHistory.push({
            stage: 'Quality Check',
            status: 'QUALITY_CHECK',
            title: 'Bench Testing & Quality Check',
            description: `Hardware repairs complete. Final QA diagnostics in progress.`,
            timestamp: new Date(),
            updatedBy: req.user._id,
          });
        } else if (status === 'READY FOR REUSE') {
          if (device.status !== 'QUALITY_CHECK') {
            return res.status(409).json({ success: false, message: 'Device is not in the expected repair stage.' });
          }
          repair.completedAt = new Date();
          device.status = 'READY_FOR_REUSE';
          device.currentStage = 'Ready for Reuse';
          device.lifecycleHistory.push({
            stage: 'Ready for Reuse',
            status: 'READY_FOR_REUSE',
            title: 'Repair Complete - Ready for Reuse',
            description: `Quality check passed! Device restored to working order and certified for reuse.`,
            timestamp: new Date(),
            updatedBy: req.user._id,
          });
        }
        await device.save();
      }
    }

    await repair.save();

    if (['COMPLETED', 'READY FOR REUSE'].includes(status)) {
      await createNotification({
        user: repair.device.owner,
        title: 'Repair completed',
        message: `Repair work for ${repair.device.brand} ${repair.device.model} is complete.`,
        type: 'SUCCESS',
        link: `/track/${repair.device.deviceId}`,
        eventKey: `repair-completed:${repair._id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Repair record updated successfully.',
      repair,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all repairs
// @route   GET /api/repairs
// @access  Private (Technician, Admin)
exports.getAllRepairs = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['status', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const { status } = req.query;
    const statusFilter = parseEnumFilter(status, Repair.schema.path('status').enumValues, 'repair status');
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'startedAt', 'completedAt'], '-createdAt');
    if (statusFilter.error || pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: statusFilter.error || pagination.error || dateRange.error || sort.error,
      });
    }

    const conditions = [];
    if (req.user.role === 'technician') conditions.push({ technician: req.user._id });
    if (statusFilter.values.length) {
      conditions.push({
        status: statusFilter.values.length === 1 ? statusFilter.values[0] : { $in: statusFilter.values },
      });
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
          { repairId: regex },
          { problem: regex },
          { diagnosis: regex },
          { device: { $in: matchingDevices.map((device) => device._id) } },
        ],
      });
    }

    const dateCondition = dateRangeCondition('startedAt', dateRange.range);
    if (dateCondition) conditions.push(dateCondition);

    const filter = conditions.length > 1 ? { $and: conditions } : conditions[0] || {};
    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;

    const [total, repairs] = await Promise.all([
      Repair.countDocuments(filter),
      Repair.find(filter)
      .populate('device', 'deviceId category brand model condition status image')
      .populate('technician', 'name email')
      .sort({ [sortField]: sortDirection })
      .skip(pagination.skip)
      .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      repairs,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single repair by ID
// @route   GET /api/repairs/:id
// @access  Private
exports.getRepairById = async (req, res, next) => {
  try {
    const repairFilter = { _id: req.params.id };
    if (req.user.role === 'technician') repairFilter.technician = req.user._id;
    const repair = await Repair.findOne(repairFilter)
      .populate('device')
      .populate('technician', 'name email');

    if (!repair) {
      return res.status(404).json({ success: false, message: 'Repair record not found.' });
    }

    res.status(200).json({
      success: true,
      repair,
    });
  } catch (error) {
    next(error);
  }
};
