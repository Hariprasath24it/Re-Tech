const Reward = require('../models/Reward');
const User = require('../models/User');

const AVAILABLE_CATALOG = [
  {
    id: 'rew_1',
    title: 'Rs. 100 Discount Coupon',
    cost: 200,
    category: 'Voucher',
    description: 'Valid across certified electronics refurbished partner stores.',
    icon: 'ticket',
  },
  {
    id: 'rew_2',
    title: 'Free Priority Pickup Service',
    cost: 300,
    category: 'Service',
    description: 'Instant priority doorstep pickup slot for bulky devices.',
    icon: 'truck',
  },
  {
    id: 'rew_3',
    title: 'Repair Service Discount (25%)',
    cost: 400,
    category: 'Discount',
    description: 'Get 25% off diagnostic and labour charges for any repair.',
    icon: 'wrench',
  },
  {
    id: 'rew_4',
    title: 'ReTech Eco Merchandise Kit',
    cost: 500,
    category: 'Merchandise',
    description: 'Organic cotton eco-bag, bamboo pen, and laptop stickers.',
    icon: 'gift',
  },
];

// @desc    Get user rewards balance and history
// @route   GET /api/rewards/my-rewards
// @access  Private
exports.getMyRewards = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints name email');
    const history = await Reward.find({ user: req.user._id }).sort({ createdAt: -1 });

    const totalEarned = history
      .filter((h) => h.type === 'EARNED')
      .reduce((sum, h) => sum + h.points, 0);

    const totalRedeemed = history
      .filter((h) => h.type === 'REDEEMED')
      .reduce((sum, h) => sum + h.points, 0);

    res.status(200).json({
      success: true,
      currentPoints: user.rewardPoints || 0,
      totalEarned,
      totalRedeemed,
      catalog: AVAILABLE_CATALOG,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem reward points
// @route   POST /api/rewards/redeem
// @access  Private
exports.redeemReward = async (req, res, next) => {
  try {
    const { rewardId } = req.body;

    const item = AVAILABLE_CATALOG.find((r) => r.id === rewardId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Reward item not found.' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, rewardPoints: { $gte: item.cost } },
      { $inc: { rewardPoints: -item.cost } },
      { new: true }
    );
    if (!user) {
      const currentUser = await User.findById(req.user._id).select('rewardPoints');
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need ${item.cost} points but have ${currentUser?.rewardPoints || 0}.`,
      });
    }

    // Generate coupon code
    const redeemCode = `RETECH-${item.category.slice(0, 3).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const rewardRecord = await Reward.create({
      user: user._id,
      points: item.cost,
      type: 'REDEEMED',
      title: item.title,
      description: `Redeemed for ${item.cost} points. Promo Code: ${redeemCode}`,
      rewardItem: item.title,
      redeemCode,
    });

    res.status(200).json({
      success: true,
      message: `Congratulations! You successfully redeemed: ${item.title}`,
      redeemCode,
      currentPoints: user.rewardPoints,
      rewardRecord,
    });
  } catch (error) {
    next(error);
  }
};
