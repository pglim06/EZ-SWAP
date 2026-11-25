const Comment = require('../models/Comment');
const Listing = require('../models/Listing');
require('../models/User');

exports.getComments = async (req, res) => {
    try {
        const { listingId } = req.params;
        const listing = await Listing.findById(listingId).select('category');
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.category !== 'Services') {
            return res.json({ success: true, comments: [] });
        }

        const comments = await Comment.find({ listingId })
            .populate('userId', 'name profilePictureUrl')
            .sort({ createdAt: 1 });
        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { listingId } = req.params;
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

        if (!userId) return res.status(401).json({ message: 'User authentication required' });
        if (!content) return res.status(400).json({ message: 'Comment cannot be empty' });
        if (content.length > 1000) {
            return res.status(400).json({ message: 'Comment cannot exceed 1000 characters' });
        }

        const listing = await Listing.findById(listingId).select('category');
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.category !== 'Services') {
            return res.status(400).json({ message: 'Comments are only available for service listings' });
        }

        const comment = await Comment.create({ listingId, userId, content });
        const populated = await Comment.findById(comment._id).populate('userId', 'name profilePictureUrl');
        res.status(201).json({ success: true, comment: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
