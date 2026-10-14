const express = require('express');
const router = express.Router();
const {
  createDevice,
  getMyDevices,
  getAllDevices,
  trackDevice,
  getDeviceById,
  updateDevice,
  deleteDevice,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public tracking route - anyone with Device ID or QR code can view device journey!
router.get('/track/:deviceId', trackDevice);

// Protected routes
router.use(protect);

router.post('/', authorize('user'), upload, createDevice);
router.get('/my-devices', authorize('user'), getMyDevices);
router.get('/', authorize('admin', 'collector', 'technician'), getAllDevices);
router.get('/:id', getDeviceById);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

module.exports = router;
