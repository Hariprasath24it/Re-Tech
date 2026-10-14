const express = require('express');
const router = express.Router();
const {
  createRecycling,
  getAllRecycling,
} = require('../controllers/recyclingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('technician', 'admin'), createRecycling);
router.get('/', authorize('technician', 'admin'), getAllRecycling);

module.exports = router;
