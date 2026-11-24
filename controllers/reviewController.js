const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const mongoose = require('mongoose');

// ─── Helper ───────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    1. Submit a rating & review for a completed transaction
// @route   POST /api/reviews
// @body    transactionId, rating (1-5), comment
// @access  Authenticated buyer or seller of the transaction
exports.submitReview = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    const { transactionId, rating, comment } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    if (!transactionId || !isValidId(transactionId)) {
      return res.status(400).json({ message: 'A valid transactionId is required' });
    }
    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5' });
    }

    // Fetch the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Only completed transactions can be reviewed
    if (transaction.status !== 'completed') {
      return res.status(400).json({
        message: 'You can only leave a review after the transaction is completed (dual handover confirmed)',
      });
    }

    const isBuyer  = transaction.buyerId.toString()  === userId.toString();
    const isSeller = transaction.sellerId.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Only the buyer or seller of this transaction can leave a review' });
    }

    // Reviewer rates the OTHER party
    const revieweeId   = isBuyer ? transaction.sellerId : transaction.buyerId;
    const reviewerRole = isBuyer ? 'buyer' : 'seller';

    // Check duplicate (unique index will also enforce this, but give a friendly message)
    const existing = await Review.findOne({ transactionId, reviewerId: userId });
    if (existing) {
      return res.status(409).json({ message: 'You have already submitted a review for this transaction' });
    }

    const review = await Review.create({
      transactionId,
      reviewerId:   userId,
      revieweeId,
      reviewerRole,
      rating:  Number(rating),
      comment: comment ? comment.trim() : '',
    });

    // Populate for the response
    const populated = await Review.findById(review._id)
      .populate('reviewerId', 'name profilePictureUrl')
      .populate('revieweeId', 'name profilePictureUrl');

    res.status(201).json({
      message: 'Review submitted successfully! Thank you for your feedback.',
      review: populated,
    });
  } catch (error) {
    // Duplicate key error from MongoDB unique index
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already submitted a review for this transaction' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    2. Get all reviews received by a user (shown on their Profile page)
// @route   GET /api/reviews/user/:userId
// @query   page, limit
exports.getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ revieweeId: userId })
        .populate('reviewerId', 'name profilePictureUrl averageRating')
        .populate('transactionId', 'transactionCode completedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ revieweeId: userId }),
    ]);

    res.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    3. Check if the current user has already reviewed a specific transaction
// @route   GET /api/reviews/check?transactionId=...&userId=...
exports.checkReviewStatus = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.query.userId;
    const { transactionId } = req.query;

    if (!userId || !transactionId) {
      return res.status(400).json({ message: 'userId and transactionId are required' });
    }

    // Check what this user has submitted
    const myReview = await Review.findOne({ transactionId, reviewerId: userId });

    // Check if the other party has also submitted
    const transaction = await Transaction.findById(transactionId);
    let otherPartyRevieweeId = null;
    if (transaction) {
      const isBuyer = transaction.buyerId.toString() === userId.toString();
      otherPartyRevieweeId = isBuyer ? transaction.buyerId : transaction.sellerId;
      // The other party's review is where they are the reviewer
      // other party = the one who is NOT userId
    }

    const totalReviews = await Review.countDocuments({ transactionId });

    res.json({
      hasReviewed:   !!myReview,
      bothReviewed:  totalReviews >= 2,
      myReview:      myReview || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    4. Get reviews for a specific transaction (up to 2 — one per party)
// @route   GET /api/reviews/transaction/:transactionId
exports.getReviewsForTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!isValidId(transactionId)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const reviews = await Review.find({ transactionId })
      .populate('reviewerId', 'name profilePictureUrl')
      .populate('revieweeId', 'name profilePictureUrl')
      .sort({ createdAt: 1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
