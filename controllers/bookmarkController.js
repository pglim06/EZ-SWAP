const Bookmark = require('../models/Bookmark');
const Listing = require('../models/Listing');

/**
 * @desc    Get user's bookmarked listings
 * @route   GET /api/bookmarks
 * @access  Private / Authenticated user
 */
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ message: 'User identification required' });
    }

    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: 'listingId',
        populate: { path: 'sellerId', select: 'name email averageRating verificationStatus' },
      })
      .sort({ createdAt: -1 });

    // Filter out deleted / missing listings
    const validBookmarks = bookmarks.filter((b) => b.listingId != null);

    res.json({
      success: true,
      bookmarks: validBookmarks,
      bookmarkedListingIds: validBookmarks.map((b) => b.listingId._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle bookmark for a listing (Add if not exists, remove if exists)
 * @route   POST /api/bookmarks/toggle
 * @body    listingId
 * @access  Private / Authenticated user
 */
exports.toggleBookmark = async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { listingId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }
    if (!listingId) {
      return res.status(400).json({ message: 'listingId is required' });
    }

    // Verify listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const existing = await Bookmark.findOne({ userId, listingId });

    if (existing) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existing._id);
      return res.json({
        success: true,
        bookmarked: false,
        message: 'Listing removed from bookmarks',
      });
    } else {
      // Add bookmark
      const newBookmark = await Bookmark.create({ userId, listingId });
      return res.status(201).json({
        success: true,
        bookmarked: true,
        message: 'Listing saved to bookmarks',
        bookmark: newBookmark,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Check if a specific listing is bookmarked by current user
 * @route   GET /api/bookmarks/check/:listingId
 * @access  Private / Authenticated user
 */
exports.checkBookmark = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId;
    const { listingId } = req.params;

    if (!userId) {
      return res.json({ isBookmarked: false });
    }

    const existing = await Bookmark.findOne({ userId, listingId });
    res.json({ isBookmarked: !!existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
