const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');

// ─── GET /api/chat/conversations ─────────────────────────────────────────────
// Fetch all conversations for the logged-in user (as buyer OR seller)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate('buyerId', 'name email profilePictureUrl')
      .populate('sellerId', 'name email profilePictureUrl')
      .populate('listingId', 'title price images status')
      .sort({ lastMessageAt: -1 });

    // Attach unread count and last message preview for each conversation
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: userId },
          isRead: false,
        });

        const lastMessage = await Message.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .select('content senderId createdAt');

        return {
          ...conv.toObject(),
          unreadCount,
          lastMessage: lastMessage || null,
        };
      })
    );

    res.json({ success: true, conversations: enriched });
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
};

// ─── POST /api/chat/conversations ────────────────────────────────────────────
// Start (or return existing) conversation for a listing between buyer and seller
exports.startConversation = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'listingId is required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const sellerId = listing.sellerId;

    // Prevent chatting with yourself
    if (buyerId.toString() === sellerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a conversation on your own listing.',
      });
    }

    // Upsert: find existing or create new
    let conversation = await Conversation.findOne({ listingId, buyerId });

    if (!conversation) {
      conversation = await Conversation.create({ listingId, buyerId, sellerId });
    }

    // Populate for the response
    conversation = await Conversation.findById(conversation._id)
      .populate('buyerId', 'name email profilePictureUrl')
      .populate('sellerId', 'name email profilePictureUrl')
      .populate('listingId', 'title price images status');

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    console.error('startConversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to start conversation.' });
  }
};

// ─── GET /api/chat/conversations/:conversationId/messages ────────────────────
// Fetch message history for a conversation (paginated)
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (
      conversation.buyerId.toString() !== userId.toString() &&
      conversation.sellerId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const total = await Message.countDocuments({ conversationId });

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name profilePictureUrl')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Mark messages from the other user as read
    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
};

// ─── POST /api/chat/conversations/:conversationId/messages ───────────────────
// Send a message via REST (fallback if Socket.IO is unavailable)
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (
      conversation.buyerId.toString() !== userId.toString() &&
      conversation.sellerId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content: content.trim(),
    });

    // Update conversation's lastMessageAt timestamp
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(message._id).populate(
      'senderId',
      'name profilePictureUrl'
    );

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// ─── GET /api/chat/unread-count ──────────────────────────────────────────────
// Get total unread message count for the navbar badge
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all conversations where this user is a participant
    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }).select('_id');

    const conversationIds = conversations.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      isRead: false,
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count.' });
  }
};
