const express = require('express');
const router = express.Router();
const {
  createPickup,
  getAllPickups,
  getMyPickups,
  getCollectorAssigned,
  acceptPickup,
  markCollected,
  markReceived,
} = require('../controllers/pickupController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', authorize('user'), createPickup);
router.get('/my-pickups', authorize('user'), getMyPickups);
router.get('/', authorize('collector', 'admin'), getAllPickups);
router.get('/collector/assigned', authorize('collector', 'admin'), getCollectorAssigned);
router.put('/:id/accept', authorize('collector', 'admin'), acceptPickup);
router.put('/:id/collected', authorize('collector', 'admin'), markCollected);
router.put('/:id/received', authorize('collector', 'technician', 'admin'), markReceived);

module.exports = router;
