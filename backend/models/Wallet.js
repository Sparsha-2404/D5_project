const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  reference: { type: String }, // order id or payment id
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

// Helper: credit wallet
walletSchema.methods.credit = async function (amount, description, reference = '') {
  this.balance += amount;
  this.transactions.push({ type: 'credit', amount, description, reference, balanceAfter: this.balance });
  return this.save();
};

// Helper: debit wallet
walletSchema.methods.debit = async function (amount, description, reference = '') {
  if (this.balance < amount) throw new Error('Insufficient wallet balance');
  this.balance -= amount;
  this.transactions.push({ type: 'debit', amount, description, reference, balanceAfter: this.balance });
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);
