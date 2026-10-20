const Booking = require('../models/Booking');
const Show = require('../models/Show');
const { releaseExpiredHoldsForShow } = require('../services/seatCleanupService');
const { emitSeatUpdate } = require('../sockets/seatSocket');

// Generate human-friendly unique booking ID (e.g. IMV-8K2A-94B1)
const generateBookingId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seg1 = '';
  let seg2 = '';
  for (let i = 0; i < 4; i++) {
    seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
    seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IMV-${seg1}-${seg2}`;
};

// @desc    Create a new booking after mock payment confirmation
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const { showId, seats, paymentDetails } = req.body;
    const userId = req.user._id;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking data. Please specify showId and seats.',
      });
    }

    // Release any expired holds first
    await releaseExpiredHoldsForShow(showId);

    const show = await Show.findById(showId).populate('movie', 'title poster backdrop rating');
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Selected show was not found',
      });
    }

    // Double-booking check: ensure each seat is available OR held by this specific user
    const confirmedSeats = [];
    let totalPrice = 0;

    for (const reqSeat of seats) {
      const seatInShow = show.seats.find(
        (s) => s.row === reqSeat.row && s.number === Number(reqSeat.number)
      );

      if (!seatInShow) {
        return res.status(404).json({
          success: false,
          message: `Seat ${reqSeat.row}${reqSeat.number} not found`,
        });
      }

      if (seatInShow.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat ${reqSeat.row}${reqSeat.number} has already been booked by another customer`,
        });
      }

      if (
        seatInShow.status === 'held' &&
        seatInShow.heldBy &&
        seatInShow.heldBy.toString() !== userId.toString()
      ) {
        return res.status(409).json({
          success: false,
          message: `Seat ${reqSeat.row}${reqSeat.number} is held by another customer`,
        });
      }

      confirmedSeats.push({
        row: seatInShow.row,
        number: seatInShow.number,
        type: seatInShow.type,
        price: seatInShow.price,
      });

      totalPrice += seatInShow.price;
    }

    // Update seat statuses in the show document to 'booked'
    show.seats.forEach((seat) => {
      const isTarget = seats.some(
        (rs) => rs.row === seat.row && Number(rs.number) === seat.number
      );

      if (isTarget) {
        seat.status = 'booked';
        seat.heldBy = null;
        seat.heldUntil = null;
      }
    });

    await show.save();

    const bookingId = generateBookingId();

    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: confirmedSeats,
      totalPrice,
      bookingId,
      status: 'confirmed',
      paymentDetails: {
        method: paymentDetails?.method || 'Mock Card / Payment Gateway',
        transactionId: paymentDetails?.transactionId || `TXN-${Date.now()}`,
        paidAt: new Date(),
      },
    });

    // Broadcast booked seats to all users in this show room
    emitSeatUpdate(show._id, 'booked', {
      bookingId,
      seats: confirmedSeats.map((s) => ({ row: s.row, number: s.number })),
    });

    // Populate show and movie details for response
    const populatedBooking = await Booking.findById(booking._id).populate({
      path: 'show',
      populate: { path: 'movie', select: 'title poster backdrop rating genres trailerKey' },
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'show',
        populate: { path: 'movie', select: 'title poster backdrop rating genres' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'show',
      populate: { path: 'movie', select: 'title poster backdrop rating genres' },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ensure user owns booking or is admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking and free up the seats
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ensure user owns booking or is admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Mark booking as cancelled
    booking.status = 'cancelled';
    await booking.save();

    // Free seats in show
    const show = await Show.findById(booking.show);
    if (show) {
      const freedSeats = [];
      show.seats.forEach((seat) => {
        const wasBookedInThis = booking.seats.some(
          (bs) => bs.row === seat.row && Number(bs.number) === seat.number
        );

        if (wasBookedInThis) {
          seat.status = 'available';
          seat.heldBy = null;
          seat.heldUntil = null;
          freedSeats.push({ row: seat.row, number: seat.number });
        }
      });

      await show.save();

      // Broadcast released seats in real-time
      emitSeatUpdate(show._id, 'released', { seats: freedSeats });
    }

    const updatedBooking = await Booking.findById(booking._id).populate({
      path: 'show',
      populate: { path: 'movie', select: 'title poster backdrop rating' },
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been made available.',
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email role')
      .populate({
        path: 'show',
        populate: { path: 'movie', select: 'title poster' },
      })
      .sort({ createdAt: -1 });

    // Calculate quick stats
    const totalRevenue = bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      count: bookings.length,
      totalRevenue,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
};
