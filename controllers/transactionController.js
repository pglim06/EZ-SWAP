const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
require('../models/User');

// @desc    1. 获取用户的交易列表 (GET /api/transactions)
// @query   userId, role ('buyer' | 'seller'), status, orderId, listingId
exports.getTransactions = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.query.userId;
        const { role, status, orderId, listingId } = req.query;

        let query = {};

        if (orderId) {
            query.orderId = orderId;
        }

        if (listingId) {
            query.listingId = listingId;
        }

        if (status) {
            query.status = status;
        }

        if (userId) {
            if (role === 'buyer') {
                query.buyerId = userId;
            } else if (role === 'seller') {
                query.sellerId = userId;
            } else if (!orderId && !listingId) {
                query.$or = [{ buyerId: userId }, { sellerId: userId }];
            }
        }

        const transactions = await Transaction.find(query)
            .populate('orderId', 'offeredPrice counterPrice transactionMethod notes status')
            .populate('listingId', 'title price images status category')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    2. 获取单个交易详情 (GET /api/transactions/:id)
// @param   id (MongoDB ObjectId or transactionCode)
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        let query;

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else {
            query = { transactionCode: id };
        }

        const transaction = await Transaction.findOne(query)
            .populate('orderId')
            .populate('listingId')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    3. 根据 Order ID 获取对应的 Transaction (GET /api/transactions/order/:orderId)
exports.getTransactionByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const transaction = await Transaction.findOne({ orderId })
            .populate('orderId')
            .populate('listingId')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId');

        if (!transaction) {
            return res.status(404).json({ message: 'No transaction found for this order' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    4. 设置/更新交接与面交安排 (PATCH /api/transactions/:id/handover)
// @body    meetupLocation, meetupTime, handoverMethod, meetupNotes, userId
exports.updateHandoverDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { meetupLocation, meetupTime, handoverMethod, meetupNotes } = req.body;
        const userId = req.user ? req.user._id : req.body.userId;

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // 仅买家或卖家有权更新交接信息
        if (userId) {
            const isParticipant =
                transaction.buyerId.toString() === userId.toString() ||
                transaction.sellerId.toString() === userId.toString();
            if (!isParticipant) {
                return res.status(403).json({
                    message: 'Only the buyer or seller can update handover details for this transaction',
                });
            }
        }

        // 更新交接字段
        if (meetupLocation !== undefined) {
            transaction.meetupLocation = meetupLocation;
        }
        if (meetupTime !== undefined) {
            transaction.meetupTime = meetupTime ? new Date(meetupTime) : null;
        }
        if (handoverMethod && ['meetup', 'delivery'].includes(handoverMethod)) {
            transaction.handoverMethod = handoverMethod;
        }
        if (meetupNotes !== undefined) {
            transaction.meetupNotes = meetupNotes;
        }

        await transaction.save();

        // 自动同步交接安排至买卖双方私信对话中
        try {
            const conv = await Conversation.findOne({
                listingId: transaction.listingId,
                buyerId: transaction.buyerId,
            });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();

                const formattedTime = transaction.meetupTime
                    ? new Date(transaction.meetupTime).toLocaleString()
                    : 'Time to be decided';
                const methodLabel = transaction.handoverMethod === 'meetup' ? 'Campus Meetup' : 'Delivery';

                await Message.create({
                    conversationId: conv._id,
                    senderId: userId || transaction.sellerId,
                    content: `📅 [HANDOVER SCHEDULED]\nTransaction: ${transaction.transactionCode}\nMethod: ${methodLabel}\n📍 Location: ${transaction.meetupLocation || 'Not specified'}\n⏰ Time: ${formattedTime}${transaction.meetupNotes ? `\nNote: "${transaction.meetupNotes}"` : ''}`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post handover schedule message to chat:', msgErr);
        }

        const populated = await Transaction.findById(transaction._id)
            .populate('orderId')
            .populate('listingId')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId');

        res.json({
            message: 'Handover details updated successfully',
            transaction: populated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
