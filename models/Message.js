const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation is required'],
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required'],
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // 自动生成 sentAt (对应 createdAt)
    }
);

// 索引优化：按照会话 ID + 发送时间升序排列，方便极速拉取历史聊天记录
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);