const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: [true, 'Listing is required'],
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required'],
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Comment is required'],
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
    },
    { timestamps: true }
);

commentSchema.index({ listingId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
