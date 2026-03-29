const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const { protect, staffOrAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notify');

// Generate 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// POST /api/orders - Place order
router.post('/', protect, async (req, res) => {
  try {
    const { items, orderType, notes, scheduledAt, paymentMethod, customerDetails } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'No order items' });

    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const otp = generateOTP();

    const order = await Order.create({
      user: req.user._id,
      items, orderType, totalAmount,
      currency: 'AED', notes, scheduledAt,
      apartmentNumber: customerDetails?.apartmentNumber || req.user.apartmentNumber,
      block: customerDetails?.block || req.user.block,
      customerDetails,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      paymentStatus: 'pending',
      deliveryOTP: otp,
      statusHistory: [{ status: 'pending', note: 'Order placed by resident', updatedBy: req.user.name }],
    });

    const io = req.app.get('io');

    if (paymentMethod === 'cash_on_delivery') {
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', note: 'Confirmed — Cash on Delivery', updatedBy: 'System' });
      await order.save();
      await sendEmail({ to: req.user.email, ...emailTemplates.orderConfirmed(order, req.user) });
      await createNotification(io, {
        userId: req.user._id,
        title: 'Order Placed! 📦',
        message: `Your ${orderType.replace('_', ' ')} order confirmed. OTP: ${otp}`,
        type: 'order_update', link: `/orders/${order._id}`, icon: '📦',
      });
    }

    res.status(201).json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/orders/:id/simulate-payment
router.post('/:id/simulate-payment', protect, async (req, res) => {
  try {
    const { cardHolder, cardLast4, cardExpiry } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substring(2,8).toUpperCase();
    order.paymentStatus = 'simulated';
    order.paymentMethod = 'simulated';
    order.status = 'confirmed';
    order.paidAt = new Date();
    order.paymentSimulation = { cardLast4, cardHolder, transactionId, paidAt: new Date() };
    order.statusHistory.push({ status: 'confirmed', note: `Payment simulated — Card ending ${cardLast4}`, updatedBy: 'System' });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'confirmed', paymentStatus: 'simulated' });
    await sendEmail({ to: order.user.email, ...emailTemplates.paymentSuccess(order, order.user) });
    await createNotification(io, {
      userId: order.user._id,
      title: 'Payment Successful! 💳',
      message: `AED ${order.totalAmount} paid. Your delivery OTP is: ${order.deliveryOTP}`,
      type: 'payment', link: `/orders/${order._id}`, icon: '💳',
    });

    res.json({ order, transactionId });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/orders/my
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedStaff', 'name phone');
    res.json(orders);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/orders/staff/assigned - Staff: get assigned orders
router.get('/staff/assigned', protect, async (req, res) => {
  try {
    if (req.user.role !== 'staff' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Staff only' });
    const orders = await Order.find({
      assignedStaff: req.user._id,
      status: { $in: ['assigned', 'in_progress', 'completed'] }
    }).sort({ updatedAt: -1 }).populate('user', 'name phone apartmentNumber block');
    res.json(orders);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email apartmentNumber block phone')
      .populate('assignedStaff', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' && req.user.role !== 'staff')
      return res.status(403).json({ message: 'Not authorized' });
    res.json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (!['pending', 'confirmed'].includes(order.status))
      return res.status(400).json({ message: 'Cannot cancel this order' });

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by resident', updatedBy: req.user.name });

    if (['simulated','paid','wallet'].includes(order.paymentStatus)) {
      let wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet) wallet = await Wallet.create({ user: req.user._id });
      await wallet.credit(order.totalAmount, `Refund for order #${order._id.toString().slice(-8).toUpperCase()}`, order._id.toString());
      order.paymentStatus = 'refunded';
      const io = req.app.get('io');
      await createNotification(io, {
        userId: req.user._id, title: 'Refund Processed 💰',
        message: `AED ${order.totalAmount} refunded to your wallet.`,
        type: 'wallet', link: '/wallet', icon: '💰',
      });
    }

    await order.save();
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'cancelled' });
    res.json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/orders/:id/staff-update - Staff updates order progress
router.put('/:id/staff-update', protect, async (req, res) => {
  try {
    if (req.user.role !== 'staff' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Staff only' });

    const { status, staffNotes, staffProofNote, cashCollected, cashAmount } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (staffNotes) order.staffNotes = staffNotes;
    if (staffProofNote) order.staffProofNote = staffProofNote;
    if (cashCollected !== undefined) order.cashCollected = cashCollected;
    if (cashAmount) order.cashAmount = cashAmount;

    if (status === 'in_progress') order.staffStartedAt = new Date();
    if (status === 'completed') order.staffCompletedAt = new Date();

    order.statusHistory.push({
      status, note: staffNotes || `Status updated to ${status} by staff`,
      updatedBy: req.user.name
    });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', {
      status, staffNotes, staffProofNote, cashCollected
    });

    // Notify user
    const statusMessages = {
      in_progress: `Your ${order.orderType.replace('_',' ')} service has started! Staff is on the way.`,
      completed: `Your service is completed! Please confirm receipt in the app.`,
    };
    if (statusMessages[status]) {
      await createNotification(io, {
        userId: order.user._id,
        title: status === 'in_progress' ? 'Service Started! 🚀' : 'Service Completed! ✅',
        message: statusMessages[status],
        type: 'order_update', link: `/orders/${order._id}`, icon: status === 'in_progress' ? '🚀' : '✅',
      });
    }

    res.json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/orders/:id/verify-otp - User verifies OTP to confirm delivery
router.put('/:id/verify-otp', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (order.deliveryOTP !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });

    order.otpVerified = true;
    order.userConfirmed = true;
    order.userConfirmedAt = new Date();
    order.status = 'completed';
    order.statusHistory.push({ status: 'completed', note: 'Delivery confirmed by resident via OTP', updatedBy: req.user.name });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'completed', userConfirmed: true });

    // Notify assigned staff
    if (order.assignedStaff) {
      await createNotification(io, {
        userId: order.assignedStaff,
        title: 'Delivery Confirmed! ✅',
        message: `Order #${order._id.toString().slice(-8).toUpperCase()} confirmed by resident.`,
        type: 'order_update', link: `/staff/orders`, icon: '✅',
      });
    }

    res.json({ message: 'OTP verified! Order confirmed.', order });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/orders/:id/user-confirm - User confirms receipt (without OTP)
router.put('/:id/user-confirm', protect, async (req, res) => {
  try {
    const { confirmationNote } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    order.userConfirmed = true;
    order.userConfirmedAt = new Date();
    order.userConfirmationNote = confirmationNote || 'Confirmed by resident';
    order.status = 'completed';
    order.statusHistory.push({ status: 'completed', note: 'Service confirmed received by resident', updatedBy: req.user.name });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'completed', userConfirmed: true });
    res.json({ message: 'Thank you! Order marked as received.', order });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/orders/:id/user-reject - User rejects/disputes delivery
router.put('/:id/user-reject', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    order.userRejected = true;
    order.userRejectionReason = reason || 'Issue reported by resident';
    order.statusHistory.push({ status: order.status, note: `Issue reported: ${reason}`, updatedBy: req.user.name });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_issue_reported', { reason });
    res.json({ message: 'Issue reported. Admin will contact you shortly.', order });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
