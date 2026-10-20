const express = require('express');
const router = express.Router();
const {
  getShowSeats,
  holdSeats,
  releaseUserHeldSeats,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), createShow);
router.route('/:id')
  .put(protect, authorize('admin'), updateShow)
  .delete(protect, authorize('admin'), deleteShow);

router.get('/:id/seats', optionalAuth, getShowSeats);
router.post('/:id/hold', protect, holdSeats);
router.post('/:id/release', protect, releaseUserHeldSeats);

module.exports = router;
