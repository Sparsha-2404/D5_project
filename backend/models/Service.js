const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'grocery',
        'housekeeping',
        'maintenance',
        'utility',
        'spa_wellness',
      ],
    },
    subCategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: '' }, // e.g. per kg, per session
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = unlimited (for services)
    estimatedTime: { type: String, default: '30-60 mins' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
