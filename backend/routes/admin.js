const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, adminOnly, staffOrAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notify');

// GET /api/admin/orders
router.get('/orders', protect, staffOrAdmin, async (req, res) => {
  try {
    const { status, orderType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit))
      .populate('user', 'name email apartmentNumber block phone')
      .populate('assignedStaff', 'name phone');
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/orders/:id/status - Admin updates status + assigns staff
router.put('/orders/:id/status', protect, staffOrAdmin, async (req, res) => {
  try {
    const { status, note, assignedStaff } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email apartmentNumber block');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status, note: note || `Status updated to ${status}`, updatedBy: req.user.name });
    if (assignedStaff) order.assignedStaff = assignedStaff;
    await order.save();
    await order.populate('assignedStaff', 'name phone');

    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('order_status_update', { status, assignedStaff: order.assignedStaff });

    await sendEmail({ to: order.user.email, ...emailTemplates.orderStatusUpdate(order, order.user, status) });
    await createNotification(io, {
      userId: order.user._id,
      title: 'Order Updated 📦',
      message: `Your order #${order._id.toString().slice(-8).toUpperCase()} is now "${status.replace('_', ' ')}"`,
      type: 'order_update', link: `/orders/${order._id}`, icon: '📦',
    });

    // Notify staff when assigned
    if (assignedStaff && status === 'assigned') {
      await createNotification(io, {
        userId: assignedStaff,
        title: 'New Task Assigned! 🎯',
        message: `You have been assigned order #${order._id.toString().slice(-8).toUpperCase()} at Apt ${order.apartmentNumber}`,
        type: 'order_update', link: `/staff`, icon: '🎯',
      });
    }

    res.json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/admin/dashboard
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const [totalOrders, pendingOrders, completedOrders, inProgressOrders, totalResidents, totalStaff] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'in_progress' }),
      User.countDocuments({ role: 'resident' }),
      User.countDocuments({ role: 'staff' }),
    ]);
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'wallet', 'simulated'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const ordersByType = await Order.aggregate([{ $group: { _id: '$orderType', count: { $sum: 1 } } }]);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5)
      .populate('user', 'name apartmentNumber')
      .populate('assignedStaff', 'name');
    const avgRating = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);
    const issueOrders = await Order.countDocuments({ userRejected: true });
    const pendingConfirmation = await Order.countDocuments({ status: 'completed', userConfirmed: false, userRejected: false });

    res.json({
      totalOrders, pendingOrders, completedOrders, inProgressOrders,
      totalResidents, totalStaff,
      totalRevenue: revenueAgg[0]?.total || 0,
      ordersByType, recentOrders,
      avgRating: avgRating[0]?.avg?.toFixed(1) || 'N/A',
      issueOrders, pendingConfirmation,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['resident', 'staff'] } }).select('-password');
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/users/staff', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, apartmentNumber } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const staff = await User.create({ name, email, password, phone, apartmentNumber: apartmentNumber || 'STAFF', role: 'staff' });
    res.status(201).json({ _id: staff._id, name: staff.name, email: staff.email, role: staff.role });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/staff', protect, staffOrAdmin, async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password');
    res.json(staff);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/reviews', protect, adminOnly, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name apartmentNumber')
      .populate('order', 'orderType totalAmount')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/admin/issues - orders with reported issues
router.get('/issues', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({ userRejected: true })
      .sort({ updatedAt: -1 })
      .populate('user', 'name email apartmentNumber phone')
      .populate('assignedStaff', 'name phone');
    res.json(orders);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin account' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
