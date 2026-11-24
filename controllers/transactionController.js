const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Report = require('../models/Report');
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

// @desc    5. T14: 双向交接确认 (Seller Confirms Handover, Buyer Confirms Received)
// @route   PATCH /api/transactions/:id/confirm-handover or POST /api/transactions/:id/confirm-handover
// @body    userId, role ('seller' | 'buyer', optional)
exports.confirmHandover = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : req.body.userId;
        const requestedRole = req.body.role;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to confirm handover' });
        }

        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { transactionCode: id };
        const transaction = await Transaction.findOne(query);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // 仅在 in_progress 状态下允许确认
        if (transaction.status === 'completed') {
            return res.status(400).json({ message: 'Transaction is already completed' });
        }
        if (['disputed', 'cancelled'].includes(transaction.status)) {
            return res.status(400).json({
                message: `Cannot confirm handover on a transaction with status '${transaction.status}'`,
            });
        }

        const isSeller = transaction.sellerId.toString() === userId.toString();
        const isBuyer = transaction.buyerId.toString() === userId.toString();

        if (!isSeller && !isBuyer) {
            return res.status(403).json({
                message: 'Only the buyer or seller of this transaction can confirm handover',
            });
        }

        // 验证 role 是否与身份匹配
        if (requestedRole && requestedRole === 'seller' && !isSeller) {
            return res.status(403).json({ message: 'You are not the seller of this transaction' });
        }
        if (requestedRole && requestedRole === 'buyer' && !isBuyer) {
            return res.status(403).json({ message: 'You are not the buyer of this transaction' });
        }

        const effectiveRole = requestedRole || (isSeller ? 'seller' : 'buyer');

        // 执行对应角色的确认操作
        if (effectiveRole === 'seller') {
            transaction.sellerConfirmation = 'handed_over';
        } else if (effectiveRole === 'buyer') {
            transaction.buyerConfirmation = 'received';
        }

        // 检查是否达成双方双向确认 (Dual Handover Confirmation)
        const isDualConfirmed =
            transaction.sellerConfirmation === 'handed_over' &&
            transaction.buyerConfirmation === 'received';

        if (isDualConfirmed) {
            transaction.status = 'completed';
            transaction.completedAt = new Date();

            // 将对应 Listing 状态标记为已售出 'sold'
            await Listing.findByIdAndUpdate(transaction.listingId, { status: 'sold' });
        }

        await transaction.save();

        // 自动同步状态通知至私信对话中
        try {
            const conv = await Conversation.findOne({
                listingId: transaction.listingId,
                buyerId: transaction.buyerId,
            });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();

                let chatContent = '';
                if (isDualConfirmed) {
                    chatContent = `🎉 [HANDOVER COMPLETED] Both seller and buyer have confirmed the handover!\n🔖 Transaction: ${transaction.transactionCode}\n✨ The item is now marked as SOLD. You may now leave a mutual rating & review!`;
                } else if (effectiveRole === 'seller') {
                    chatContent = `📦 [SELLER CONFIRMATION] The seller has confirmed item HANDOVER.\nBuyer, please inspect the item and confirm receipt to finalize this deal.`;
                } else {
                    chatContent = `✅ [BUYER CONFIRMATION] The buyer has confirmed RECEIPT of the item.\nSeller, please confirm handover to complete the transaction.`;
                }

                await Message.create({
                    conversationId: conv._id,
                    senderId: userId,
                    content: chatContent,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post confirmation message to chat:', msgErr);
        }

        const populated = await Transaction.findById(transaction._id)
            .populate('orderId')
            .populate('listingId')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId');

        res.json({
            message: isDualConfirmed
                ? 'Dual handover completed! Transaction is now marked as completed.'
                : `${effectiveRole === 'seller' ? 'Seller handover' : 'Buyer receipt'} confirmed successfully. Waiting for other party.`,
            isCompleted: isDualConfirmed,
            transaction: populated,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    6. T14: 发起争议投诉 (Dispute Transaction & Report Flag)
// @route   POST /api/transactions/:id/dispute
// @body    userId, reason
exports.disputeTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user ? req.user._id : req.body.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required to flag a dispute' });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'A reason must be provided to open a dispute' });
        }

        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { transactionCode: id };
        const transaction = await Transaction.findOne(query);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.status === 'completed') {
            return res.status(400).json({
                message: 'Cannot dispute a completed transaction. Please contact admin directly.',
            });
        }
        if (transaction.status === 'disputed') {
            return res.status(400).json({ message: 'A dispute is already active for this transaction' });
        }
        if (transaction.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot dispute a cancelled transaction' });
        }

        const isSeller = transaction.sellerId.toString() === userId.toString();
        const isBuyer = transaction.buyerId.toString() === userId.toString();

        if (!isSeller && !isBuyer) {
            return res.status(403).json({
                message: 'Only the buyer or seller can flag a dispute on this transaction',
            });
        }

        // 更新交易状态为 disputed
        transaction.status = 'disputed';
        await transaction.save();

        // 创建 Report 记录用于 Admin 介入和管理平台审核
        const report = await Report.create({
            reporterId: userId,
            targetType: 'transaction',
            targetId: transaction._id,
            reason: reason.trim(),
            status: 'pending',
        });

        // 自动同步争议警告消息到私信对话
        try {
            const conv = await Conversation.findOne({
                listingId: transaction.listingId,
                buyerId: transaction.buyerId,
            });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();

                const roleName = isSeller ? 'Seller' : 'Buyer';
                await Message.create({
                    conversationId: conv._id,
                    senderId: userId,
                    content: `⚠️ [DISPUTE FLAGGED] The ${roleName} has flagged a dispute on Transaction: ${transaction.transactionCode}.\nReason: "${reason.trim()}"\nPlatform admin team has been notified to arbitrate and resolve this issue.`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post dispute notification to chat:', msgErr);
        }

        const populated = await Transaction.findById(transaction._id)
            .populate('orderId')
            .populate('listingId')
            .populate('buyerId', 'name email avatar universityId')
            .populate('sellerId', 'name email avatar universityId');

        res.json({
            message: 'Dispute flagged successfully. Admin has been notified.',
            transaction: populated,
            report,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
