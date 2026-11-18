const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    acceptOrder,
    rejectOrder,
    counterOrder,
    cancelOrder,
} = require('../controllers/orderController');

// 1. 基础订单 CRUD 路由
router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);

// 2. 状态机流转路由 (State Transitions)
router.patch('/:id/accept', acceptOrder);
router.patch('/:id/reject', rejectOrder);
router.patch('/:id/counter', counterOrder);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;