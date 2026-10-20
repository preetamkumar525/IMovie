const Show = require('../models/Show');
const Movie = require('../models/Movie');
const { releaseExpiredHoldsForShow } = require('../services/seatCleanupService');
const { emitSeatUpdate } = require('../sockets/seatSocket');
const { generateSeatLayout } = require('../services/tmdbService');

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// @desc    Get seats layout and availability for a show
// @route   GET /api/shows/:id/seats
// @access  Public (or Authenticated)
const getShowSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;

    // First auto-release any expired holds
    await releaseExpiredHoldsForShow(showId);

    const show = await Show.findById(showId).populate('movie', 'title poster backdrop rating genres');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Determine current user ID if token present (for highlighting user's own held seats)
    const currentUserId = req.user ? req.user._id.toString() : null;

    // Map seats to return clean state
    const formattedSeats = show.seats.map((s) => {
      const isHeldByMe = currentUserId && s.heldBy && s.heldBy.toString() === currentUserId;
      return {
        _id: s._id,
        row: s.row,
        number: s.number,
        type: s.type,
        price: s.price,
        status: s.status,
        isHeldByMe: Boolean(isHeldByMe),
        heldUntil: s.heldUntil,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        _id: show._id,
        date: show.date,
        time: show.time,
        screen: show.screen,
        movie: show.movie,
        seats: formattedSeats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hold selected seats for 5 minutes
// @route   POST /api/shows/:id/hold
// @access  Private
const holdSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seats } = req.body; // array of { row, number }
    const userId = req.user._id;

    if (!Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one seat to hold',
      });
    }

    if (seats.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'You can select a maximum of 10 seats at a time',
      });
    }

    // Release any expired holds first for atomic accuracy
    await releaseExpiredHoldsForShow(showId);

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    const now = new Date();
    const holdUntil = new Date(now.getTime() + HOLD_DURATION_MS);

    // Atomic validation: ensure every requested seat is available or already held by this user
    for (const requested of seats) {
      const targetSeat = show.seats.find(
        (s) => s.row === requested.row && s.number === Number(requested.number)
      );

      if (!targetSeat) {
        return res.status(404).json({
          success: false,
          message: `Seat ${requested.row}${requested.number} does not exist in this auditorium`,
        });
      }

      if (targetSeat.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat ${requested.row}${requested.number} has already been booked`,
        });
      }

      if (
        targetSeat.status === 'held' &&
        targetSeat.heldBy &&
        targetSeat.heldBy.toString() !== userId.toString()
      ) {
        return res.status(409).json({
          success: false,
          message: `Seat ${requested.row}${requested.number} is currently held by another user. Please choose another seat.`,
        });
      }
    }

    // Mark seats as held
    const heldSeatsList = [];
    show.seats.forEach((seat) => {
      const match = seats.some(
        (reqSeat) => reqSeat.row === seat.row && Number(reqSeat.number) === seat.number
      );

      if (match) {
        seat.status = 'held';
        seat.heldBy = userId;
        seat.heldUntil = holdUntil;
        heldSeatsList.push({
          row: seat.row,
          number: seat.number,
          type: seat.type,
          price: seat.price,
        });
      }
    });

    await show.save();

    // Broadcast real-time update to everyone in this show's room
    emitSeatUpdate(show._id, 'held', {
      heldBy: userId.toString(),
      seats: heldSeatsList.map((s) => ({ row: s.row, number: s.number })),
      heldUntil: holdUntil.toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Seats held successfully for 5 minutes',
      heldUntil: holdUntil.toISOString(),
      expiresInSeconds: 300,
      seats: heldSeatsList,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release seats held by current user
// @route   POST /api/shows/:id/release
// @access  Private
const releaseUserHeldSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const userId = req.user._id;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    const releasedSeats = [];
    show.seats.forEach((seat) => {
      if (
        seat.status === 'held' &&
        seat.heldBy &&
        seat.heldBy.toString() === userId.toString()
      ) {
        seat.status = 'available';
        seat.heldBy = null;
        seat.heldUntil = null;
        releasedSeats.push({ row: seat.row, number: seat.number });
      }
    });

    if (releasedSeats.length > 0) {
      await show.save();
      emitSeatUpdate(show._id, 'released', { seats: releasedSeats });
    }

    res.status(200).json({
      success: true,
      message: 'Seats released',
      releasedSeats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new show (Admin)
// @route   POST /api/shows
// @access  Private/Admin
const createShow = async (req, res, next) => {
  try {
    const { movieId, date, time, screen } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const show = await Show.create({
      movie: movieId,
      date,
      time,
      screen: screen || 'Screen 1 (Dolby Cinema)',
      seats: generateSeatLayout(),
    });

    res.status(201).json({
      success: true,
      message: 'Show created successfully',
      data: show,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update show (Admin)
// @route   PUT /api/shows/:id
// @access  Private/Admin
const updateShow = async (req, res, next) => {
  try {
    const { date, time, screen } = req.body;
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    if (date) show.date = date;
    if (time) show.time = time;
    if (screen) show.screen = screen;

    await show.save();

    res.status(200).json({
      success: true,
      message: 'Show updated successfully',
      data: show,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete show (Admin)
// @route   DELETE /api/shows/:id
// @access  Private/Admin
const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    await Show.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Show deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShowSeats,
  holdSeats,
  releaseUserHeldSeats,
  createShow,
  updateShow,
  deleteShow,
};
