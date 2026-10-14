const User = require('../models/User');
const Device = require('../models/Device');
const Pickup = require('../models/Pickup');
const Repair = require('../models/Repair');
const Recycling = require('../models/Recycling');
const Inspection = require('../models/Inspection');
const Reward = require('../models/Reward');
const {
  escapeRegex,
  parsePagination,
  parseDateRange,
  dateRangeCondition,
  parseSort,
  paginationMetadata,
} = require('../utils/queryFilters');

const REPAIR_COMPLETED_STATUSES = ['COMPLETED', 'QUALITY CHECK', 'READY FOR REUSE'];

const countByField = (Model, field) =>
  Model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

// @desc    Get aggregate stats for Admin Overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalDevices,
      totalPickups,
      pendingPickups,
      totalRepairRecords,
      totalRepaired,
      totalInspections,
      reusedCount,
      recycledCount,
      underRepairCount,
      pendingInspectionsCount,
      totalRewardPoints,
      totalRewardPointsRedeemed,
      totalRewardTransactions,
      recentDevices,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Device.countDocuments(),
      Pickup.countDocuments(),
      Pickup.countDocuments({ status: { $in: ['REQUESTED', 'ASSIGNED'] } }),
      Repair.countDocuments(),
      Repair.countDocuments({ status: { $in: REPAIR_COMPLETED_STATUSES } }),
      Inspection.countDocuments(),
      Device.countDocuments({ status: 'REUSED' }),
      Device.countDocuments({ status: 'RECYCLED' }),
      Device.countDocuments({ status: 'UNDER_REPAIR' }),
      Device.countDocuments({ status: { $in: ['COLLECTED', 'RECEIVED'] } }),
      Reward.aggregate([
        { $match: { type: 'EARNED' } },
        { $group: { _id: null, points: { $sum: '$points' } } },
      ]).then((rows) => rows[0]?.points || 0),
      Reward.aggregate([
        { $match: { type: 'REDEEMED' } },
        { $group: { _id: null, points: { $sum: '$points' } } },
      ]).then((rows) => rows[0]?.points || 0),
      Reward.countDocuments(),
      Device.find()
        .populate('owner', 'name')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    // Format recent activity items
    const recentActivities = recentDevices.map((d) => ({
      id: d._id,
      title: `${d.category} registered (${d.brand} ${d.model})`,
      subtitle: `By ${d.owner ? d.owner.name : 'User'} • ID: ${d.deviceId}`,
      status: d.status,
      timestamp: d.createdAt,
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalDevices,
        totalPickups,
        totalRepairRecords,
        totalRepaired,
        totalInspections,
        totalReused: reusedCount,
        totalRecycled: recycledCount,
        pendingPickups,
        underRepairCount,
        pendingInspectionsCount,
        totalRewardPoints,
        totalRewardPointsRedeemed,
        totalRewardTransactions,
      },
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visual analytics data for charts (Recharts)
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalDevices,
      deviceStatusCounts,
      categoryCounts,
      monthlyRegistrations,
      pickupStatusCounts,
      inspectionOutcomeCounts,
      repairStatusCounts,
      recyclingSummary,
      rewardTypeSummary,
    ] = await Promise.all([
      Device.countDocuments(),
      countByField(Device, 'status'),
      countByField(Device, 'category'),
      Device.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      countByField(Pickup, 'status'),
      countByField(Inspection, 'outcome'),
      countByField(Repair, 'status'),
      Recycling.aggregate([
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            totals: [
              {
                $group: {
                  _id: null,
                  records: { $sum: 1 },
                  weightKg: { $sum: { $ifNull: ['$weightKg', 0] } },
                  co2OffsetKg: { $sum: { $ifNull: ['$co2OffsetKg', 0] } },
                },
              },
            ],
          },
        },
      ]),
      Reward.aggregate([
        {
          $group: {
            _id: '$type',
            transactions: { $sum: 1 },
            points: { $sum: '$points' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const recyclingData = recyclingSummary[0] || { byStatus: [], totals: [] };
    const recyclingTotals = recyclingData.totals[0] || {
      records: 0,
      weightKg: 0,
      co2OffsetKg: 0,
    };
    const rewardTotals = rewardTypeSummary.reduce(
      (totals, row) => {
        totals.transactions += row.transactions;
        if (row._id === 'EARNED') totals.earnedPoints = row.points;
        if (row._id === 'REDEEMED') totals.redeemedPoints = row.points;
        return totals;
      },
      { transactions: 0, earnedPoints: 0, redeemedPoints: 0 }
    );
    const deviceStatusMap = new Map(deviceStatusCounts.map((row) => [row._id, row.count]));
    const devicesReused = deviceStatusMap.get('REUSED') || 0;
    const devicesRecycled = deviceStatusMap.get('RECYCLED') || 0;
    const pickupStatusMap = new Map(pickupStatusCounts.map((row) => [row._id, row.count]));
    const repairStatusMap = new Map(repairStatusCounts.map((row) => [row._id, row.count]));
    const totalPickups = pickupStatusCounts.reduce((sum, row) => sum + row.count, 0);
    const totalInspections = inspectionOutcomeCounts.reduce((sum, row) => sum + row.count, 0);
    const totalRepairRecords = repairStatusCounts.reduce((sum, row) => sum + row.count, 0);
    const completedRepairRecords = REPAIR_COMPLETED_STATUSES.reduce(
      (sum, status) => sum + (repairStatusMap.get(status) || 0),
      0
    );
    const pendingPickups = ['REQUESTED', 'ASSIGNED'].reduce(
      (sum, status) => sum + (pickupStatusMap.get(status) || 0),
      0
    );

    res.status(200).json({
      success: true,
      analytics: {
        devices: {
          total: totalDevices,
          statusDistribution: deviceStatusCounts.map((row) => ({
            status: row._id,
            count: row.count,
          })),
          terminalStatusCounts: {
            REUSED: devicesReused,
            RECYCLED: devicesRecycled,
          },
          categoryDistribution: categoryCounts.map((row) => ({
            category: row._id,
            count: row.count,
          })),
          monthlyRegistrations: monthlyRegistrations.map((row) => ({
            month: `${row._id.year}-${String(row._id.month).padStart(2, '0')}`,
            count: row.count,
          })),
        },
        pickups: {
          total: totalPickups,
          pending: pendingPickups,
          statusDistribution: pickupStatusCounts.map((row) => ({
            status: row._id,
            count: row.count,
          })),
        },
        inspections: {
          total: totalInspections,
          outcomeDistribution: inspectionOutcomeCounts.map((row) => ({
            outcome: row._id,
            count: row.count,
          })),
        },
        repairs: {
          total: totalRepairRecords,
          completed: completedRepairRecords,
          statusDistribution: repairStatusCounts.map((row) => ({
            status: row._id,
            count: row.count,
          })),
        },
        recycling: {
          totalRecords: recyclingTotals.records,
          totalWeightKg: +recyclingTotals.weightKg.toFixed(1),
          totalCo2OffsetKg: +recyclingTotals.co2OffsetKg.toFixed(1),
          statusDistribution: recyclingData.byStatus.map((row) => ({
            status: row._id,
            count: row.count,
          })),
        },
        rewards: {
          totalRewardPoints: rewardTotals.earnedPoints,
          totalRewardPointsRedeemed: rewardTotals.redeemedPoints,
          totalRewardTransactions: rewardTotals.transactions,
          transactionTypeDistribution: rewardTypeSummary.map((row) => ({
            type: row._id,
            transactions: row.transactions,
            points: row.points,
          })),
        },
        environmentalImpact: {
          landfillDivertedDevices: devicesReused + devicesRecycled,
          devicesReused,
          devicesRecycled,
          recoveredMaterialsKg: +recyclingTotals.weightKg.toFixed(1),
          co2OffsetKg: +recyclingTotals.co2OffsetKg.toFixed(1),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const allowedQueryKeys = new Set(['role', 'search', 'fromDate', 'toDate', 'page', 'limit', 'sort']);
    const unsupportedKey = Object.keys(req.query).find((key) => !allowedQueryKeys.has(key));
    if (unsupportedKey) {
      return res.status(400).json({ success: false, message: `Unsupported query parameter: ${unsupportedKey}.` });
    }

    const { role, search } = req.query;
    const pagination = parsePagination(req.query);
    const dateRange = parseDateRange(req.query);
    const sort = parseSort(req.query.sort, ['createdAt', 'name', 'email'], '-createdAt');
    if (pagination.error || dateRange.error || sort.error) {
      return res.status(400).json({
        success: false,
        message: pagination.error || dateRange.error || sort.error,
      });
    }
    const filter = {};
    if (search) {
      if (typeof search !== 'string' || !search.trim()) {
        return res.status(400).json({ success: false, message: 'search must be a non-empty string.' });
      }
      const regex = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
      ];
    }
    if (role) {
      if (!User.schema.path('role').enumValues.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }
      filter.role = role;
    }

    const dateCondition = dateRangeCondition('createdAt', dateRange.range);
    if (dateCondition) filter.createdAt = dateCondition.createdAt;

    const sortField = sort.value.startsWith('-') ? sort.value.slice(1) : sort.value;
    const sortDirection = sort.value.startsWith('-') ? -1 : 1;
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(pagination.skip)
        .limit(pagination.limit),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      users,
      pagination: paginationMetadata(pagination.page, pagination.limit, total),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Staff Member (Collector / Technician)
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, address } = req.body;

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof phone !== 'string' || !phone.trim() ||
      typeof password !== 'string' || password.length < 6 ||
      (role !== undefined && !['collector', 'technician'].includes(role))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid name, email, phone, password, and staff role are required.',
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password,
      role: role || 'collector',
      address: address || {},
    });

    res.status(201).json({
      success: true,
      message: `Staff member (${user.role}) created successfully!`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status / role
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};
