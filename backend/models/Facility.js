const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['gym', 'pool', 'clubhouse', 'other'], required: true },
    description: { type: String },
    capacity: { type: Number, default: 10 },
    isAvailable: { type: Boolean, default: true },
    operatingHours: { type: String, default: '06:00 AM - 10:00 PM' },
    rules: [{ type: String }],
  },
  { timestamps: true }
);

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    apartmentNumber: { type: String },
    guestCount: { type: Number, default: 1 },
    notes: { type: String },
    adminNote: { type: String },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Facility, Booking };
