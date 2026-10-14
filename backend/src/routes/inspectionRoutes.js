const express = require('express');
const router = express.Router();
const {
  createInspection,
  getAllInspections,
  getInspectionByDevice,
} = require('../controllers/inspectionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('technician', 'admin'), createInspection);
router.get('/', authorize('technician', 'admin'), getAllInspections);
router.get('/device/:deviceId', authorize('technician', 'admin'), getInspectionByDevice);

module.exports = router;
