const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/reviews — submit review for a completed order
router.post('/', protect, async (req, res) => {
  try {
    const { orderId, rating, comment, staffRating } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (order.status !== 'completed')
      return res.status(400).json({ message: 'Can only review completed orders' });
    if (order.isReviewed)
      return res.status(400).json({ message: 'Already reviewed this order' });

    const review = await Review.create({
      user: req.user._id,
      order: orderId,
      rating,
      comment,
      staffRating,
    });

    order.isReviewed = true;
    await order.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reviews/my — get my reviews
router.get('/my', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('order', 'orderType totalAmount createdAt')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reviews — admin: all reviews
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name apartmentNumber')
      .populate('order', 'orderType totalAmount')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
