const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
require('../models/User'); // 确保 User 模型已被注册用于 populate

// @desc    1. Buyer 创建/发送报价 (Make Offer)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
    try {
        const { listingId, offeredPrice, transactionMethod, notes } = req.body;
        const buyerId = req.user ? req.user._id : req.body.buyerId;

        if (!buyerId) {
            return res.status(400).json({ message: 'buyerId is required' });
        }

        if (!listingId || offeredPrice === undefined || !transactionMethod) {
            return res.status(400).json({
                message: 'listingId, offeredPrice, and transactionMethod are required'
            });
        }

        // 检查 Listing 是否存在
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // 检查 Listing 状态是否为 active
        if (listing.status !== 'active') {
            return res.status(400).json({
                message: `Cannot make offer on a listing with status '${listing.status}'`
            });
        }

        // 检查 Buyer 不能向自己的 Listing 报价
        if (listing.sellerId.toString() === buyerId.toString()) {
            return res.status(400).json({
                message: 'You cannot make an offer on your own listing'
            });
        }

        // 检查是否已经存在对该 Listing 处于 pending 或 countered 的有效报价（避免刷单重复发送）
        const existingActiveOrder = await Order.findOne({
            listingId,
            buyerId,
            status: { $in: ['pending', 'countered'] },
        });

        if (existingActiveOrder) {
            return res.status(400).json({
                message: 'You already have an active offer for this listing. Please wait or cancel the previous one.'
            });
        }

        // 创建新 Order
        const newOrder = await Order.create({
            listingId,
            buyerId,
            sellerId: listing.sellerId,
            offeredPrice: Number(offeredPrice),
            transactionMethod,
            notes: notes || '',
            status: 'pending',
        });

        // 自动将报价同步发送至买卖双方的私信消息中 (In-App Messaging)
        try {
            let conv = await Conversation.findOne({ listingId, buyerId });
            if (!conv) {
                conv = await Conversation.create({
                    listingId,
                    buyerId,
                    sellerId: listing.sellerId,
                });
            }
            conv.lastMessageAt = new Date();
            await conv.save();

            const methodLabel = transactionMethod === 'meetup' ? 'Campus Meetup' : 'Delivery';
            const offerContent = `🤝 [OFFER] Proposed an offer of RM ${offeredPrice} (${methodLabel})${notes ? `\nNote: "${notes}"` : ''}`;

            await Message.create({
                conversationId: conv._id,
                senderId: buyerId,
                content: offerContent,
            });
        } catch (msgErr) {
            console.error('Failed to auto-send offer message to chat:', msgErr);
        }

        // 关联信息返回
        const populatedOrder = await Order.findById(newOrder._id)
            .populate('listingId', 'title price images status')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar');

        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    2. 获取用户的订单列表 (作为 Buyer 或 Seller 或按 Listing 查询)
// @route   GET /api/orders
// @query   role ('buyer' | 'seller'), status, listingId, buyerId
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.query.userId;
        const { role, status, listingId, buyerId } = req.query;

        let query = {};

        if (listingId) {
            query.listingId = listingId;
        }

        if (buyerId) {
            query.buyerId = buyerId;
        }

        if (!listingId && !userId) {
            return res.status(400).json({ message: 'userId or listingId is required (query parameter or auth token)' });
        }

        if (userId && !buyerId) {
            if (role === 'buyer') {
                query.buyerId = userId;
            } else if (role === 'seller') {
                query.sellerId = userId;
            } else if (!listingId) {
                query.$or = [{ buyerId: userId }, { sellerId: userId }];
            }
        }

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('listingId', 'title price images status category')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar')
            .sort({ updatedAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    3. 获取单个 Order 详情
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('listingId')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    4. 接受报价 (Accept Offer)
// @route   PATCH /api/orders/:id/accept
exports.acceptOrder = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.body.userId;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // 仅在 pending 或 countered 状态下允许接受
        if (!['pending', 'countered'].includes(order.status)) {
            return res.status(400).json({
                message: `Cannot accept an order with status '${order.status}'`
            });
        }

        // 权限校验：
        // 如果当前是 pending，只有 Seller 可以 Accept；
        // 如果当前是 countered，只有 Buyer 可以 Accept
        if (userId) {
            if (order.status === 'pending' && order.sellerId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Only the seller can accept a pending offer' });
            }
            if (order.status === 'countered' && order.buyerId.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Only the buyer can accept a counter-offer' });
            }
        }

        order.status = 'accepted';
        await order.save();

        // T13: Generate unique Transaction upon accepted offer
        let transaction = await Transaction.findOne({ orderId: order._id });
        if (!transaction) {
            transaction = await Transaction.create({
                orderId: order._id,
                listingId: order.listingId,
                buyerId: order.buyerId,
                sellerId: order.sellerId,
                handoverMethod: order.transactionMethod || 'meetup',
                status: 'in_progress',
            });
        }

        // T13: Reserve listing so other users know a deal is in progress (except for 'Services', which remain active for ongoing bookings)
        const targetListing = await Listing.findById(order.listingId);
        if (targetListing && targetListing.category !== 'Services') {
            await Listing.findByIdAndUpdate(order.listingId, { status: 'reserved' });
        }

        // 同步消息通知到私信对话 (通知交易已建立并附带唯一 Transaction ID)
        try {
            const conv = await Conversation.findOne({ listingId: order.listingId, buyerId: order.buyerId });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();
                const finalPrice = order.counterPrice || order.offeredPrice;
                await Message.create({
                    conversationId: conv._id,
                    senderId: userId || order.sellerId,
                    content: `🎉 [OFFER ACCEPTED] The offer of RM ${finalPrice} has been accepted!\n🔖 Transaction ID: ${transaction.transactionCode}\n📍 Handover setup is now open. You can arrange the meetup time and campus location here.`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post accept message:', msgErr);
        }

        const updatedOrder = await Order.findById(order._id)
            .populate('listingId')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar');

        res.json({
            ...updatedOrder.toObject(),
            transaction,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    5. 拒绝报价 (Reject Offer - 仅 Seller)
// @route   PATCH /api/orders/:id/reject
exports.rejectOrder = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.body.userId;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({
                message: `Cannot reject an order with status '${order.status}'`
            });
        }

        if (userId && order.sellerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the seller can reject an offer' });
        }

        order.status = 'rejected';
        await order.save();

        // 同步消息通知到私信对话
        try {
            const conv = await Conversation.findOne({ listingId: order.listingId, buyerId: order.buyerId });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();
                await Message.create({
                    conversationId: conv._id,
                    senderId: userId || order.sellerId,
                    content: `❌ [OFFER DECLINED] The offer has been declined by the seller.`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post reject message:', msgErr);
        }

        res.json({ message: 'Offer rejected successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    6. Seller 提出还价 (Counter Offer)
// @route   PATCH /api/orders/:id/counter
exports.counterOrder = async (req, res) => {
    try {
        const { counterPrice, notes } = req.body;
        const userId = req.user ? req.user._id : req.body.userId;

        if (counterPrice === undefined || Number(counterPrice) < 0) {
            return res.status(400).json({ message: 'Valid counterPrice is required' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({
                message: `Can only counter an order that is currently 'pending'`
            });
        }

        if (userId && order.sellerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the seller can propose a counter-offer' });
        }

        order.counterPrice = Number(counterPrice);
        if (notes) {
            order.notes = notes;
        }
        order.status = 'countered';
        await order.save();

        // 同步消息通知到私信对话
        try {
            const conv = await Conversation.findOne({ listingId: order.listingId, buyerId: order.buyerId });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();
                await Message.create({
                    conversationId: conv._id,
                    senderId: userId || order.sellerId,
                    content: `🔄 [COUNTER-OFFER] Proposed a counter-offer of RM ${counterPrice}${notes ? `\nNote: "${notes}"` : ''}`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post counter-offer message:', msgErr);
        }

        const updatedOrder = await Order.findById(order._id)
            .populate('listingId')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar');

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    7. Buyer 取消报价 (Cancel Offer)
// @route   PATCH /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.body.userId;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // 仅在 pending 或 countered 状态下允许取消
        if (!['pending', 'countered'].includes(order.status)) {
            return res.status(400).json({
                message: `Cannot cancel an order with status '${order.status}'`
            });
        }

        if (userId && order.buyerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the buyer can cancel this offer' });
        }

        order.status = 'cancelled';
        await order.save();

        // 同步消息通知到私信对话
        try {
            const conv = await Conversation.findOne({ listingId: order.listingId, buyerId: order.buyerId });
            if (conv) {
                conv.lastMessageAt = new Date();
                await conv.save();
                await Message.create({
                    conversationId: conv._id,
                    senderId: userId || order.buyerId,
                    content: `🚫 [OFFER CANCELLED] The buyer has cancelled the offer.`,
                });
            }
        } catch (msgErr) {
            console.error('Failed to post cancel message:', msgErr);
        }

        res.json({ message: 'Offer cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
