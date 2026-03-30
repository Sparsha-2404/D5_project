const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notify');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route POST /api/payment/create-order
// Creates a Razorpay order for a given app order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${order._id}`,
      notes: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    // Store razorpay order id
    // NOTE: 'razorpay' is NOT in the Order enum; use 'card' which IS valid
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentMethod = 'card';
    await order.save();

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/payment/verify
// Verifies Razorpay payment signature
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update order
    const order = await Order.findById(orderId).populate('user', 'name email apartmentNumber block');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Razorpay' });
    await order.save();

    const io = req.app.get('io');

    // Emit real-time update
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'confirmed', paymentStatus: 'paid' });

    // Send email
    await sendEmail({ to: order.user.email, ...emailTemplates.paymentSuccess(order, order.user) });
    await sendEmail({ to: order.user.email, ...emailTemplates.orderConfirmed(order, order.user) });

    // In-app notification
    await createNotification(io, {
      userId: order.user._id,
      title: 'Payment Successful',
      message: `₹${order.totalAmount} paid for order #${order._id.toString().slice(-8).toUpperCase()}`,
      type: 'payment',
      link: `/orders/${order._id}`,
      icon: '💳',
    });

    res.json({ message: 'Payment verified', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/payment/pay-wallet
// Pay for an order using wallet balance
router.post('/pay-wallet', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name email apartmentNumber block');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'wallet')
      return res.status(400).json({ message: 'Order already paid' });

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(400).json({ message: 'Wallet not found' });

    await wallet.debit(order.totalAmount, `Payment for order #${order._id.toString().slice(-8).toUpperCase()}`, order._id.toString());

    order.paymentStatus = 'wallet';
    order.paymentMethod = 'wallet';
    order.paidAt = new Date();
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Wallet' });
    await order.save();

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status: 'confirmed', paymentStatus: 'wallet' });

    await sendEmail({ to: order.user.email, ...emailTemplates.paymentSuccess(order, order.user) });
    await createNotification(io, {
      userId: order.user._id,
      title: 'Paid via Wallet',
      message: `₹${order.totalAmount} deducted from wallet for order #${order._id.toString().slice(-8).toUpperCase()}`,
      type: 'wallet',
      link: `/orders/${order._id}`,
      icon: '💰',
    });

    res.json({ message: 'Payment successful via wallet', order, walletBalance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/payment/topup-wallet (admin or via Razorpay)
router.post('/topup-wallet', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = await Wallet.create({ user: req.user._id });

    await wallet.credit(amount, `Wallet top-up via Razorpay`, razorpay_payment_id);

    const user = await User.findById(req.user._id);
    const io = req.app.get('io');

    await sendEmail({ to: user.email, ...emailTemplates.walletTopup(user, amount, wallet.balance) });
    await createNotification(io, {
      userId: req.user._id,
      title: 'Wallet Topped Up',
      message: `₹${amount} added to your wallet. New balance: ₹${wallet.balance}`,
      type: 'wallet',
      link: '/wallet',
      icon: '💰',
    });

    res.json({ message: 'Wallet topped up', balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route POST /api/payment/create-topup-order
router.post('/create-topup-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: 'Invalid amount' });

    const razorpay = getRazorpay();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `topup_${req.user._id}_${Date.now()}`,
      notes: { type: 'wallet_topup', userId: req.user._id.toString() },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// @route POST /api/payment/simulate-topup
// Simulated wallet top-up — no Razorpay required (works without payment gateway keys)
router.post('/simulate-topup', protect, async (req, res) => {
  try {
    const { amount, cardHolder, cardLast4, cardExpiry } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ message: 'Minimum top-up is AED 10' });

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = await Wallet.create({ user: req.user._id, balance: 0 });

    const transactionId = 'SIM-TOPUP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const description = `Wallet top-up via card ending ${cardLast4 || 'XXXX'} — ${transactionId}`;

    await wallet.credit(amount, description, transactionId);

    const user = await User.findById(req.user._id);
    const io = req.app.get('io');

    // Send in-app notification
    await createNotification(io, {
      userId: req.user._id,
      title: 'Wallet Topped Up 💰',
      message: `AED ${amount} added to your wallet. New balance: AED ${wallet.balance}`,
      type: 'wallet',
      link: '/wallet',
      icon: '💰',
    });

    // Send email if email utils are configured
    try {
      if (user?.email && emailTemplates.walletTopup) {
        await sendEmail({ to: user.email, ...emailTemplates.walletTopup(user, amount, wallet.balance) });
      }
    } catch (_) { /* email is optional */ }

    res.json({ message: 'Wallet topped up successfully', balance: wallet.balance, transactionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
