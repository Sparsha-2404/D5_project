const express = require('express');
const router = express.Router();
const { Facility, Booking } = require('../models/Facility');
const { protect, adminOnly } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notify');

router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ isAvailable: true });
    res.json(facilities);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/book', protect, async (req, res) => {
  try {
    const { facilityId, date, timeSlot, guestCount, notes } = req.body;
    const existing = await Booking.findOne({
      facility: facilityId, date: new Date(date), timeSlot, status: { $in: ['pending','confirmed'] },
    });
    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const booking = await Booking.create({
      user: req.user._id, facility: facilityId,
      date: new Date(date), timeSlot,
      apartmentNumber: req.user.apartmentNumber,
      guestCount: guestCount || 1,
      notes,
    });
    await booking.populate('facility', 'name type');

    const io = req.app.get('io');
    await sendEmail({ to: req.user.email, ...emailTemplates.bookingConfirmed(booking, req.user, booking.facility) });
    await createNotification(io, {
      userId: req.user._id,
      title: 'Booking Request Submitted',
      message: `${booking.facility.name} booking for ${new Date(date).toLocaleDateString()} at ${timeSlot} is pending approval.`,
      type: 'booking', link: '/facilities', icon: '🏊',
    });
    res.status(201).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ date: -1 }).populate('facility', 'name type');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/bookings/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Admin: confirm or reject booking
router.put('/bookings/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNote } = req.body; // confirmed or rejected
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('facility', 'name type');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    booking.adminNote = adminNote;
    booking.confirmedBy = req.user._id;
    booking.confirmedAt = new Date();
    await booking.save();

    const io = req.app.get('io');
    const icon = status === 'confirmed' ? '✅' : '❌';
    await createNotification(io, {
      userId: booking.user._id,
      title: `Booking ${status === 'confirmed' ? 'Confirmed' : 'Rejected'}`,
      message: `Your ${booking.facility.name} booking for ${new Date(booking.date).toLocaleDateString()} has been ${status}.`,
      type: 'booking', link: '/facilities', icon,
    });

    // Send email
    if (status === 'confirmed') {
      await sendEmail({ to: booking.user.email, ...emailTemplates.bookingConfirmed(booking, booking.user, booking.facility) });
    }

    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/all-bookings', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const bookings = await Booking.find(filter).sort({ createdAt: -1 })
      .populate('user', 'name apartmentNumber email phone')
      .populate('facility', 'name type')
      .populate('confirmedBy', 'name');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
