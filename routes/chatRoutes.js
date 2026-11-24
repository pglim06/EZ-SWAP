const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations', startConversation);

// Messages within a conversation
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

// Unread badge count
router.get('/unread-count', getUnreadCount);

module.exports = router;
