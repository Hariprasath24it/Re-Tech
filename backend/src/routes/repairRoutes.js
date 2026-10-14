const express = require('express');
const router = express.Router();
const {
  createRepair,
  updateRepair,
  getAllRepairs,
  getRepairById,
} = require('../controllers/repairController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('technician', 'admin'), createRepair);
router.put('/:id', authorize('technician', 'admin'), updateRepair);
router.get('/', authorize('technician', 'admin'), getAllRepairs);
router.get('/:id', authorize('technician', 'admin'), getRepairById);

module.exports = router;
