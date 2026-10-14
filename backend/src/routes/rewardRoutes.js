const express = require('express');
const router = express.Router();
const {
  getMyRewards,
  redeemReward,
} = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my-rewards', getMyRewards);
router.post('/redeem', redeemReward);

module.exports = router;
