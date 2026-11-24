const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true, // One transaction per accepted order
    },
    transactionCode: {
      type: String,
      unique: true,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing is required'],
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    handoverMethod: {
      type: String,
      required: [true, 'Handover method is required'],
      enum: {
        values: ['meetup', 'delivery'],
        message: '{VALUE} is not a valid handover method',
      },
    },
    meetupLocation: {
      type: String,
      default: null,
    },
    meetupTime: {
      type: Date,
      default: null,
    },
    meetupNotes: {
      type: String,
      default: '',
    },
    sellerConfirmation: {
      type: String,
      enum: ['pending', 'handed_over'],
      default: 'pending',
    },
    buyerConfirmation: {
      type: String,
      enum: ['pending', 'received'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'disputed', 'cancelled'],
      default: 'in_progress',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// Auto-generate unique human-readable transactionCode (e.g. TRX-K92B-4A12) before validation
transactionSchema.pre('validate', function () {
  if (!this.transactionCode) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestampPart = Date.now().toString(36).toUpperCase().slice(-4);
    this.transactionCode = `TRX-${timestampPart}-${randomHex}`;
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
