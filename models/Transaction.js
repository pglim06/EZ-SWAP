const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true, // One transaction per accepted order
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

module.exports = mongoose.model('Transaction', transactionSchema);
