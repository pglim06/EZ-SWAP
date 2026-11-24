const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionById,
    getTransactionByOrderId,
    updateHandoverDetails,
    confirmHandover,
    disputeTransaction,
} = require('../controllers/transactionController');

// 1. 获取交易列表与单个交易
router.get('/', getTransactions);
router.get('/order/:orderId', getTransactionByOrderId);
router.get('/:id', getTransactionById);

// 2. T13: 设置与更新 Handover 及 Meetup 安排
router.patch('/:id/handover', updateHandoverDetails);

// 3. T14: 双向交接确认 (Dual Handover Confirmation)
router.patch('/:id/confirm-handover', confirmHandover);
router.post('/:id/confirm-handover', confirmHandover);

// 4. T14: 发起争议投诉 (Dispute Flag & Report)
router.post('/:id/dispute', disputeTransaction);

module.exports = router;
