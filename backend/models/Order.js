const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const customerDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  apartmentNumber: { type: String, required: true },
  block: { type: String },
  serviceDate: { type: Date },
  serviceTime: { type: String },
  specialInstructions: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    orderType: {
      type: String,
      required: true,
      enum: ['grocery', 'housekeeping', 'maintenance', 'utility', 'spa_wellness'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'AED' },
    notes: { type: String, trim: true },
    scheduledAt: { type: Date, default: null },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    apartmentNumber: { type: String, required: true },
    block: { type: String },
    customerDetails: { type: customerDetailsSchema },
    statusHistory: [
      { status: String, updatedAt: { type: Date, default: Date.now }, note: String, updatedBy: String },
    ],

    // Payment
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'wallet', 'simulated'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'cash_on_delivery', 'simulated'],
      default: 'cash_on_delivery',
    },
    paymentSimulation: {
      cardLast4: String, cardHolder: String, transactionId: String, paidAt: Date,
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    paidAt: { type: Date, default: null },

    // Staff tracking
    staffNotes: { type: String, default: '' },
    staffStartedAt: { type: Date, default: null },
    staffCompletedAt: { type: Date, default: null },
    staffProofNote: { type: String, default: '' }, // staff's completion note
    cashCollected: { type: Boolean, default: false },
    cashAmount: { type: Number, default: 0 },

    // User confirmation / validation
    userConfirmed: { type: Boolean, default: false },
    userConfirmedAt: { type: Date, default: null },
    userConfirmationNote: { type: String, default: '' },
    userRejected: { type: Boolean, default: false },
    userRejectionReason: { type: String, default: '' },

    // OTP for delivery confirmation
    deliveryOTP: { type: String, default: null },
    otpVerified: { type: Boolean, default: false },

    isReviewed: { type: Boolean, default: false },
    estimatedDelivery: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
