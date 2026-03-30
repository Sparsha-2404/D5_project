const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/wallet — get my wallet
router.get('/', protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/wallet/transactions — paginated transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.json({ transactions: [], balance: 0 });

    const sorted = [...wallet.transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ transactions: sorted, balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: credit wallet for a user
router.post('/admin-credit', protect, adminOnly, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId });
    await wallet.credit(amount, description || 'Admin credit');
    res.json({ message: 'Credited', balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
