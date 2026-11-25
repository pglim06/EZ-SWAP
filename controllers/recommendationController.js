const Listing = require('../models/Listing');
const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const {
  scoreCandidate,
  buildUserProfile,
  callGeminiForInsights,
} = require('../utils/recommendationEngine');

/**
 * @desc    Get personalized AI recommendations based on user viewing history and bookmarks
 * @route   GET /api/listings/recommendations
 * @access  Public (Guest support via recentIds query parameter or JWT user)
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { userId, recentIds, limit = 6 } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 20);

    const historyListingIds = new Set();

    // 1. Collect history from authenticated user or userId parameter
    const effectiveUserId = req.user ? req.user._id : userId;
    if (effectiveUserId) {
      try {
        const user = await User.findById(effectiveUserId).select('viewHistory');
        if (user && user.viewHistory && user.viewHistory.length > 0) {
          user.viewHistory.forEach((v) => {
            if (v.listingId) historyListingIds.add(v.listingId.toString());
          });
        }

        // Also incorporate bookmarks as high-intent signals
        const bookmarks = await Bookmark.find({ userId: effectiveUserId }).select('listingId');
        bookmarks.forEach((b) => {
          if (b.listingId) historyListingIds.add(b.listingId.toString());
        });
      } catch (err) {
        console.warn('Could not load user history:', err.message);
      }
    }

    // 2. Collect history from client-side recentIds (for guest or fresh session)
    if (recentIds) {
      const ids = recentIds.split(',').map((id) => id.trim()).filter(Boolean);
      ids.forEach((id) => historyListingIds.add(id));
    }

    const historyIdArray = Array.from(historyListingIds);

    // ─── Scenario A: User has viewing history / bookmarks ──────────────────────
    if (historyIdArray.length > 0) {
      const historyListings = await Listing.find({
        _id: { $in: historyIdArray },
      }).select('title category price description tags');

      if (historyListings.length > 0) {
        const userProfile = buildUserProfile(historyListings);

        // Fetch candidate active listings (exclude already viewed/bookmarked items)
        const candidates = await Listing.find({
          _id: { $nin: historyIdArray },
          status: 'active',
        })
          .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl verificationStatus')
          .limit(40);

        if (candidates.length > 0) {
          // Score and rank all candidate listings
          let scored = candidates.map((cand) => {
            const candObj = cand.toObject();
            const { score, reason } = scoreCandidate(candObj, userProfile);
            return {
              ...candObj,
              recommendationScore: score,
              recommendationReason: reason,
            };
          });

          // Sort descending by recommendation score
          scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

          const topRecommendations = scored.slice(0, limitNum);

          // Optional AI enhancement via Gemini if API key is present
          try {
            const aiInsights = await callGeminiForInsights(userProfile, topRecommendations);
            if (Array.isArray(aiInsights) && aiInsights.length > 0) {
              const reasonMap = new Map();
              aiInsights.forEach((entry) => {
                if (entry.title && entry.reason) reasonMap.set(entry.title.toLowerCase(), entry.reason);
              });
              topRecommendations.forEach((item) => {
                const lowerTitle = item.title.toLowerCase();
                for (const [key, val] of reasonMap.entries()) {
                  if (lowerTitle.includes(key) || key.includes(lowerTitle)) {
                    item.recommendationReason = `✨ AI Insight: ${val}`;
                    break;
                  }
                }
              });
            }
          } catch (e) {
            // Non-blocking fallback
          }

          return res.status(200).json({
            success: true,
            source: 'personalized_history',
            insights: userProfile.category
              ? `Personalized based on your interest in ${userProfile.category}`
              : 'Personalized based on your campus browsing pattern',
            count: topRecommendations.length,
            recommendations: topRecommendations,
          });
        }
      }
    }

    // ─── Scenario B: Cold Start (No viewing history yet) ─────────────────────────
    // Return trending/popular listings sorted by viewsCount and seller rating
    const popularListings = await Listing.find({ status: 'active' })
      .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl verificationStatus')
      .sort({ viewsCount: -1, createdAt: -1 })
      .limit(limitNum);

    const coldStartRecommendations = popularListings.map((item, idx) => {
      const obj = item.toObject();
      let reason = 'Trending on UTM campus';
      if (idx === 0) reason = 'Most popular among students';
      else if (obj.sellerId?.verificationStatus === 'verified') reason = 'Verified student seller';
      else if (obj.category === 'Textbooks') reason = 'Essential semester course material';

      return {
        ...obj,
        recommendationScore: 85 - idx * 3,
        recommendationReason: reason,
      };
    });

    return res.status(200).json({
      success: true,
      source: 'cold_start',
      insights: 'Popular and trending listings across UTM campus',
      count: coldStartRecommendations.length,
      recommendations: coldStartRecommendations,
    });
  } catch (error) {
    console.error('getRecommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating recommendations',
    });
  }
};

/**
 * @desc    Get similar listings for a specific item (Item-to-Item content recommendation)
 * @route   GET /api/listings/:id/similar
 * @access  Public
 */
exports.getSimilarListings = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 4, 1), 10);

    const targetListing = await Listing.findById(id);
    if (!targetListing || targetListing.status === 'removed') {
      return res.status(404).json({ success: false, message: 'Target listing not found' });
    }

    // Find other active listings
    const candidates = await Listing.find({
      _id: { $ne: targetListing._id },
      status: 'active',
    })
      .populate('sellerId', 'name email averageRating ratingsCount universityId profilePictureUrl verificationStatus')
      .limit(30);

    const targetObj = targetListing.toObject();

    const scored = candidates.map((cand) => {
      const candObj = cand.toObject();
      const { score, reason } = scoreCandidate(candObj, targetObj);
      return {
        ...candObj,
        similarityScore: score,
        matchReason: reason,
      };
    });

    // Sort descending by similarity score
    scored.sort((a, b) => b.similarityScore - a.similarityScore);
    const topSimilar = scored.slice(0, limitNum);

    res.status(200).json({
      success: true,
      count: topSimilar.length,
      targetId: id,
      similar: topSimilar,
    });
  } catch (error) {
    console.error('getSimilarListings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching similar listings',
    });
  }
};

/**
 * @desc    Record a view event for a listing and append to user view history
 * @route   POST /api/listings/:id/view
 * @access  Public / Authenticated
 */
exports.recordListingView = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const effectiveUserId = req.user ? req.user._id : userId;

    // Increment listing viewsCount
    const listing = await Listing.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { returnDocument: 'after', select: 'viewsCount title' }
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // If student user is identified, log to User viewHistory (bounded to latest 30)
    if (effectiveUserId) {
      try {
        await User.findByIdAndUpdate(effectiveUserId, {
          $push: {
            viewHistory: {
              $each: [{ listingId: id, viewedAt: new Date() }],
              $slice: -30, // Keeps only the last 30 views
            },
          },
        });
      } catch (uErr) {
        console.warn('Could not record user viewHistory:', uErr.message);
      }
    }

    res.status(200).json({
      success: true,
      viewsCount: listing.viewsCount,
    });
  } catch (error) {
    console.error('recordListingView error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error recording view',
    });
  }
};
