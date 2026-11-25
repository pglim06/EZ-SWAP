const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

/**
 * Initialize Socket.IO event handlers for real-time messaging (T11).
 *
 * Events:
 *   client → server:
 *     join_conversation   { conversationId }
 *     leave_conversation  { conversationId }
 *     send_message        { conversationId, content }
 *     typing              { conversationId }
 *     stop_typing         { conversationId }
 *     mark_read           { conversationId }
 *
 *   server → client:
 *     new_message         { message }         — to room members
 *     user_typing         { conversationId, userId, userName }
 *     user_stop_typing    { conversationId, userId }
 *     unread_update       { unreadCount }     — to individual user
 *     error               { message }
 */
function initSocketIO(io) {
  // ─── Authentication middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('token='))
          ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const jwtSecret =
        process.env.JWT_SECRET || 'ezswap_super_secret_jwt_key_2026_campus_marketplace';
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  // ─── Connection handler ────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${socket.user.name} (${userId})`);

    // Join a personal room for direct notifications (unread badges, etc.)
    socket.join(`user:${userId}`);

    // ── Join a conversation room ──────────────────────────────────────
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit('error', { message: 'Conversation not found.' });

        // Verify membership
        if (
          conv.buyerId.toString() !== userId &&
          conv.sellerId.toString() !== userId
        ) {
          return socket.emit('error', { message: 'Access denied.' });
        }

        socket.join(`conv:${conversationId}`);

        // Mark messages as read when user opens the conversation
        await Message.updateMany(
          { conversationId, senderId: { $ne: socket.user._id }, isRead: false },
          { isRead: true }
        );

        // Send updated unread count back to the user
        await emitUnreadCount(io, userId);
      } catch (err) {
        console.error('join_conversation error:', err);
        socket.emit('error', { message: 'Failed to join conversation.' });
      }
    });

    // ── Leave a conversation room ─────────────────────────────────────
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── Send a message (real-time) ────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message content is required.' });
        }

        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit('error', { message: 'Conversation not found.' });

        // Verify membership
        if (
          conv.buyerId.toString() !== userId &&
          conv.sellerId.toString() !== userId
        ) {
          return socket.emit('error', { message: 'Access denied.' });
        }

        // Persist the message
        const message = await Message.create({
          conversationId,
          senderId: socket.user._id,
          content: content.trim(),
        });

        // Update conversation timestamp and un-hide for participants on new message
        conv.lastMessageAt = new Date();
        if (conv.deletedBy && conv.deletedBy.length > 0) {
          conv.deletedBy = [];
        }
        await conv.save();

        // Populate sender info
        const populated = await Message.findById(message._id).populate(
          'senderId',
          'name profilePictureUrl'
        );

        // Broadcast to the conversation room (including sender for confirmation)
        io.to(`conv:${conversationId}`).emit('new_message', {
          message: populated,
        });

        // Send unread badge update to the OTHER participant
        const otherUserId =
          conv.buyerId.toString() === userId
            ? conv.sellerId.toString()
            : conv.buyerId.toString();
        await emitUnreadCount(io, otherUserId);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── Typing indicators ─────────────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName: socket.user.name,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    // ── Mark messages as read ─────────────────────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversationId, senderId: { $ne: socket.user._id }, isRead: false },
          { isRead: true }
        );
        await emitUnreadCount(io, userId);
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${userId})`);
    });
  });
}

/**
 * Helper: compute and emit updated unread count to a specific user.
 */
async function emitUnreadCount(io, userId) {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }).select('_id');

    const conversationIds = conversations.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: userId },
      isRead: false,
    });

    io.to(`user:${userId}`).emit('unread_update', { unreadCount });
  } catch (err) {
    console.error('emitUnreadCount error:', err);
  }
}

module.exports = initSocketIO;
