const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: [true, 'Listing is required'],
      index: true,
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
    offeredPrice: {
      type: Number,
      required: [true, 'Offered price is required'],
      min: [0, 'Price cannot be negative'],
    },
    transactionMethod: {
      type: String,
      required: [true, 'Transaction method is required'],
      enum: {
        values: ['meetup', 'delivery'],
        message: '{VALUE} is not a valid transaction method',
      },
    },
    counterPrice: {
      type: Number,
      min: [0, 'Counter price cannot be negative'],
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

module.exports = mongoose.model('Order', orderSchema);
