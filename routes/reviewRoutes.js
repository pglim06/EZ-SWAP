const express = require('express');
const router  = express.Router();
const {
  submitReview,
  getReviewsForUser,
  checkReviewStatus,
  getReviewsForTransaction,
} = require('../controllers/reviewController');

// T15: Mutual Rating & Review System
// POST   /api/reviews                          — submit a review
// GET    /api/reviews/user/:userId             — reviews received by a user
// GET    /api/reviews/check?transactionId=...  — check if current user already reviewed
// GET    /api/reviews/transaction/:txId        — all reviews for one transaction

router.post('/',                              submitReview);
router.get('/check',                          checkReviewStatus);
router.get('/user/:userId',                   getReviewsForUser);
router.get('/transaction/:transactionId',     getReviewsForTransaction);

module.exports = router;
