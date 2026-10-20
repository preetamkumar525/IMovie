const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get dashboard metrics & stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res, next) => {
  try {
    const totalMovies = await Movie.countDocuments();
    const totalShows = await Show.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalUsers = await User.countDocuments();

    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const totalRevenue = confirmedBookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate({ path: 'show', populate: { path: 'movie', select: 'title' } })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalMovies,
        totalShows,
        totalBookings,
        totalUsers,
        totalRevenue,
      },
      recentBookings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
