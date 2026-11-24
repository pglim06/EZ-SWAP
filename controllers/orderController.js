const Order = require('../models/Order');
const Listing = require('../models/Listing');
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

// @desc    2. 获取用户的订单列表 (作为 Buyer 或 Seller)
// @route   GET /api/orders
// @query   role ('buyer' | 'seller'), status (optional)
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.query.userId;
        const { role, status } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required (query parameter or auth token)' });
        }

        let query = {};

        if (role === 'buyer') {
            query.buyerId = userId;
        } else if (role === 'seller') {
            query.sellerId = userId;
        } else {
            // 如果未指定 role，则获取该用户相关的全部订单（无论是买家还是卖家）
            query.$or = [{ buyerId: userId }, { sellerId: userId }];
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

        const updatedOrder = await Order.findById(order._id)
            .populate('listingId')
            .populate('buyerId', 'name email avatar')
            .populate('sellerId', 'name email avatar');

        res.json(updatedOrder);
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

        res.json({ message: 'Offer cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};