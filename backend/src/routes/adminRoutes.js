const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics,
  getUsers,
  createStaff,
  updateUser,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication and role === 'admin'
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/users', createStaff);
router.put('/users/:id', updateUser);

module.exports = router;
