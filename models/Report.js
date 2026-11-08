const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter is required'],
            index: true,
        },
        targetType: {
            type: String,
            required: [true, 'Target type is required'],
            enum: {
                values: ['listing', 'user', 'transaction'],
                message: '{VALUE} is not a valid target type',
            },
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Target ID is required'],
            index: true,
        },
        reason: {
            type: String,
            required: [true, 'Report reason is required'],
            trim: true,
            maxlength: [1000, 'Reason cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
            default: 'pending',
            index: true,
        },
        adminNotes: {
            type: String,
            default: '',
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Report', reportSchema);