const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['Silver', 'Gold', 'Premium'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'held', 'booked'],
      default: 'available',
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    heldUntil: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    time: {
      type: String, // e.g., '10:30 AM', '02:00 PM', '06:30 PM', '09:45 PM'
      required: true,
      index: true,
    },
    screen: {
      type: String,
      default: 'Screen 1',
    },
    seats: [seatSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for quick lookups
showSchema.index({ movie: 1, date: 1, time: 1 });

module.exports = mongoose.model('Show', showSchema);
