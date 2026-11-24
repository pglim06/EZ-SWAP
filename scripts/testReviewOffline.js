/**
 * T15: Mutual Rating & Review System — Offline Smoke Test
 * Tests Review model validation logic without MongoDB connection.
 *
 * Run: node scripts/testReviewOffline.js
 */

console.log('\n=== T15: Rating & Review System — Offline Tests ===\n');

// ── Simulate review data ───────────────────────────────────────────────────
const mockReviews = [
  {
    transactionId: '674a0000000000000000aaaa',
    reviewerId:    '674b0000000000000000bbbb',  // buyer
    revieweeId:    '674c0000000000000000cccc',  // seller
    reviewerRole:  'buyer',
    rating:        5,
    comment:       'Great seller! Item exactly as described. Fast response.',
  },
  {
    transactionId: '674a0000000000000000aaaa',
    reviewerId:    '674c0000000000000000cccc',  // seller
    revieweeId:    '674b0000000000000000bbbb',  // buyer
    reviewerRole:  'seller',
    rating:        4,
    comment:       'Smooth transaction, buyer was punctual for meetup.',
  },
];

// ── Validation logic (mirrors controller) ─────────────────────────────────
function validateReview(review) {
  const errors = [];
  if (!review.transactionId)              errors.push('transactionId required');
  if (!review.reviewerId)                 errors.push('reviewerId required');
  if (!review.revieweeId)                 errors.push('revieweeId required');
  if (!['buyer','seller'].includes(review.reviewerRole)) errors.push('reviewerRole must be buyer or seller');
  const r = Number(review.rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) errors.push('rating must be integer 1–5');
  if (review.comment && review.comment.length > 1000) errors.push('comment exceeds 1000 chars');
  return errors;
}

let pass = 0, fail = 0;

mockReviews.forEach((r, i) => {
  const errors = validateReview(r);
  if (errors.length === 0) {
    console.log(`  ✅ Review ${i + 1} (${r.reviewerRole}) — valid  ★${r.rating}  "${r.comment.slice(0,40)}..."`);
    pass++;
  } else {
    console.log(`  ❌ Review ${i + 1} — INVALID: ${errors.join(', ')}`);
    fail++;
  }
});

// ── Edge cases ─────────────────────────────────────────────────────────────
const edgeCases = [
  { desc: 'rating = 0 (too low)',  rating: 0,  role: 'buyer'  },
  { desc: 'rating = 6 (too high)', rating: 6,  role: 'buyer'  },
  { desc: 'rating = 2.5 (float)',  rating: 2.5, role: 'seller' },
  { desc: 'invalid role',          rating: 4,  role: 'admin'  },
];

console.log('\n── Edge Cases ──');
edgeCases.forEach(({ desc, rating, role }) => {
  const review = {
    transactionId: '674a0000000000000000aaaa',
    reviewerId:    '674b0000000000000000bbbb',
    revieweeId:    '674c0000000000000000cccc',
    reviewerRole:  role,
    rating,
    comment: '',
  };
  const errors = validateReview(review);
  if (errors.length > 0) {
    console.log(`  ✅ Correctly rejected — ${desc}: ${errors.join(', ')}`);
    pass++;
  } else {
    console.log(`  ❌ Should have been rejected — ${desc}`);
    fail++;
  }
});

// ── averageRating calculation simulation ───────────────────────────────────
console.log('\n── averageRating Calculation ──');
const ratingsForUser = [5, 4, 3, 5, 2];
const avg = ratingsForUser.reduce((a, b) => a + b, 0) / ratingsForUser.length;
const rounded = Math.round(avg * 10) / 10;
console.log(`  Ratings: [${ratingsForUser.join(', ')}]`);
console.log(`  Raw avg: ${avg}`);
console.log(`  Rounded to 1dp: ${rounded} ${rounded === 3.8 ? '✅' : '❌'}`);
if (rounded === 3.8) pass++; else fail++;

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail > 0 ? 1 : 0);
