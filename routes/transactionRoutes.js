const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionById,
    getTransactionByOrderId,
    updateHandoverDetails,
} = require('../controllers/transactionController');

// 1. 获取交易列表与单个交易
router.get('/', getTransactions);
router.get('/order/:orderId', getTransactionByOrderId);
router.get('/:id', getTransactionById);

// 2. T13: 设置与更新 Handover 及 Meetup 安排
router.patch('/:id/handover', updateHandoverDetails);

module.exports = router;
