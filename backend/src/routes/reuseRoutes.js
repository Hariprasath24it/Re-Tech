const express = require('express');
const router = express.Router();
const { createReuse, getAllReuse } = require('../controllers/reuseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('technician', 'admin'), createReuse);
router.get('/', authorize('technician', 'admin'), getAllReuse);

module.exports = router;
