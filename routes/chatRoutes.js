const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  startConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  deleteMessage,
  getUnreadCount,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', startConversation);
router.delete('/conversations/:conversationId', deleteConversation);

// Messages within a conversation
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.delete('/messages/:messageId', deleteMessage);

// Unread badge count
router.get('/unread-count', getUnreadCount);

module.exports = router;
