const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
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
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// 确保针对同一个商品，同一个买家只能发起一个对话线程
conversationSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);