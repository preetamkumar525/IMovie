const Show = require('../models/Show');
const { emitSeatUpdate } = require('../sockets/seatSocket');

// Clean up expired holds for a specific show
const releaseExpiredHoldsForShow = async (showId) => {
  const now = new Date();
  const show = await Show.findById(showId);
  if (!show) return null;

  let releasedSeats = [];
  let modified = false;

  show.seats.forEach((seat) => {
    if (seat.status === 'held' && seat.heldUntil && new Date(seat.heldUntil) < now) {
      seat.status = 'available';
      seat.heldBy = null;
      seat.heldUntil = null;
      releasedSeats.push({ row: seat.row, number: seat.number });
      modified = true;
    }
  });

  if (modified) {
    await show.save();
    emitSeatUpdate(show._id, 'released', { seats: releasedSeats });
  }

  return show;
};

// Global periodic cleanup across all shows
const cleanupAllExpiredHolds = async () => {
  try {
    const now = new Date();
    // Find shows that have at least one expired held seat
    const shows = await Show.find({
      'seats': {
        $elemMatch: {
          status: 'held',
          heldUntil: { $lt: now },
        },
      },
    });

    for (const show of shows) {
      let releasedSeats = [];
      show.seats.forEach((seat) => {
        if (seat.status === 'held' && seat.heldUntil && new Date(seat.heldUntil) < now) {
          seat.status = 'available';
          seat.heldBy = null;
          seat.heldUntil = null;
          releasedSeats.push({ row: seat.row, number: seat.number });
        }
      });

      if (releasedSeats.length > 0) {
        await show.save();
        emitSeatUpdate(show._id, 'released', { seats: releasedSeats });
        console.log(`⏱️ Released ${releasedSeats.length} expired seats for show ${show._id}`);
      }
    }
  } catch (error) {
    console.error('Error during expired seat cleanup:', error.message);
  }
};

const startSeatCleanupJob = (intervalMs = 15000) => {
  setInterval(cleanupAllExpiredHolds, intervalMs);
};

module.exports = { releaseExpiredHoldsForShow, cleanupAllExpiredHolds, startSeatCleanupJob };
