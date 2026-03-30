const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order_update', 'payment', 'wallet', 'booking', 'promo', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' }, // e.g. /orders/:id
    icon: { type: String, default: '🔔' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
