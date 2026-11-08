const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            index: true,
        },
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: [true, 'Listing is required'],
            index: true,
        },
    },
    {
        timestamps: true, // 自动生成 createdAt 和 updatedAt
    }
);

// 复合唯一索引：确保同一个学生不能重复收藏同一个商品
bookmarkSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);