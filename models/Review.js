const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction is required'],
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewee is required'],
      index: true, // frequently queried to show a user's reviews
    },
    reviewerRole: {
      type: String,
      required: [true, 'Reviewer role is required'],
      enum: {
        values: ['buyer', 'seller'],
        message: '{VALUE} is not a valid reviewer role',
      },
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true, // createdAt
  }
);

// Compound unique index: each person can only review once per transaction
// A transaction can have at most 2 reviews (one from buyer, one from seller)
reviewSchema.index({ transactionId: 1, reviewerId: 1 }, { unique: true });

// Post-save hook: recalculate the reviewee's average rating
reviewSchema.post('save', async function () {
  const User = mongoose.model('User');
  const Review = mongoose.model('Review');

  // Aggregate all reviews for this reviewee
  const result = await Review.aggregate([
    { $match: { revieweeId: this.revieweeId } },
    {
      $group: {
        _id: '$revieweeId',
        averageRating: { $avg: '$rating' },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await User.findByIdAndUpdate(this.revieweeId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // round to 1 decimal
      ratingsCount: result[0].ratingsCount,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
