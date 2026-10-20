const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema(
  {
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seats: [bookingSeatSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    paymentDetails: {
      method: { type: String, default: 'Credit/Debit Card' },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date, default: Date.now },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
