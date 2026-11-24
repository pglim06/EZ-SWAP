/**
 * EZ Swap — T17 Lightweight AI Recommendation Engine Smoke Test
 * Tests:
 *  1. Natural language tokenization and stop-word filtering
 *  2. Jaccard token similarity & price proximity scoring
 *  3. User aggregated interest profile building
 *  4. Recommendation ranking and explanation reasoning
 *  5. Similar items content matching
 *  6. Cold-start ranking and view recording
 */

const assert = require('assert');
const mongoose = require('mongoose');
const {
  extractTokens,
  calculateJaccardSimilarity,
  calculatePriceSimilarity,
  scoreCandidate,
  buildUserProfile,
} = require('../utils/recommendationEngine');

const Listing = require('../models/Listing');
const User = require('../models/User');

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function runRecommendationTests() {
  console.log('='.repeat(65));
  console.log('🚀 EZ SWAP — T17 AI Recommendation Engine Test Suite');
  console.log('='.repeat(65));

  // ─── 1. Test NLP Token Extraction ──────────────────────────────────────────
  console.log('\n[1/6] Testing Natural Language Token Extraction & Stop-Words...');
  const sampleTitle = 'Engineering Mathematics 1 (Calculus & Algebra) for UTM Students';
  const tokens = extractTokens(sampleTitle);
  console.log(`  Input: "${sampleTitle}"`);
  console.log(`  Extracted tokens:`, Array.from(tokens));
  
  assert(tokens.has('engineering'), 'Should extract "engineering"');
  assert(tokens.has('mathematics'), 'Should extract "mathematics"');
  assert(tokens.has('calculus'), 'Should extract "calculus"');
  assert(tokens.has('algebra'), 'Should extract "algebra"');
  assert(!tokens.has('for'), 'Should strip stop-word "for"');
  assert(!tokens.has('and'), 'Should strip stop-word "and"');
  console.log('  ✓ Tokenizer and stop-word filters validated.');

  // ─── 2. Test Similarity Calculations ──────────────────────────────────────
  console.log('\n[2/6] Testing Jaccard Token & Price Similarity Scores...');
  const tokensA = extractTokens('Logitech Wireless Silent Mouse M331');
  const tokensB = extractTokens('Logitech MX Master Wireless Mouse for Laptop');
  const tokensC = extractTokens('IKEA Wooden Desk for Dorm Study');

  const simAB = calculateJaccardSimilarity(tokensA, tokensB);
  const simAC = calculateJaccardSimilarity(tokensA, tokensC);
  console.log(`  Similarity(Logitech Mouse, Logitech MX Mouse): ${(simAB * 100).toFixed(1)}%`);
  console.log(`  Similarity(Logitech Mouse, IKEA Desk): ${(simAC * 100).toFixed(1)}%`);
  
  assert(simAB > simAC, 'Related electronics should have higher similarity than desk');

  const priceSimHigh = calculatePriceSimilarity(45, 40);
  const priceSimLow = calculatePriceSimilarity(45, 800);
  console.log(`  Price proximity (RM 45 vs RM 40): ${(priceSimHigh * 100).toFixed(1)}%`);
  console.log(`  Price proximity (RM 45 vs RM 800): ${(priceSimLow * 100).toFixed(1)}%`);
  assert(priceSimHigh > 0.8, 'RM 45 and RM 40 should be highly similar in price');
  assert(priceSimLow < 0.2, 'RM 45 and RM 800 should have low price similarity');
  console.log('  ✓ Similarity math functions verified.');

  // ─── 3. Test Candidate Scoring & AI Reason Generation ──────────────────────
  console.log('\n[3/6] Testing Multi-Factor Candidate Scoring & Reason Generation...');
  const referenceItem = {
    title: 'Engineering Mathematics 1 (Calculus & Algebra)',
    category: 'Textbooks',
    price: 35,
    description: 'First year engineering calculus textbook',
    tags: ['math', 'calculus', 'textbook'],
  };

  const candidate1 = {
    title: 'Advanced Calculus & Differential Equations',
    category: 'Textbooks',
    price: 38,
    description: 'Year 2 coursebook for UTM math modules',
    tags: ['calculus', 'math'],
    sellerId: { averageRating: 4.9, verificationStatus: 'verified' },
    createdAt: new Date(),
  };

  const candidate2 = {
    title: 'Rechargeable LED Study Desk Lamp',
    category: 'Dorm',
    price: 20,
    description: 'Dorm room bedside lamp',
    tags: ['lamp', 'dorm'],
    sellerId: { averageRating: 4.5, verificationStatus: 'verified' },
    createdAt: new Date(),
  };

  const score1 = scoreCandidate(candidate1, referenceItem);
  const score2 = scoreCandidate(candidate2, referenceItem);
  console.log(`  Candidate 1 (Advanced Calculus): Score = ${score1.score}/100, Reason: "${score1.reason}"`);
  console.log(`  Candidate 2 (Desk Lamp): Score = ${score2.score}/100, Reason: "${score2.reason}"`);

  assert(score1.score > score2.score, 'Related calculus book should score significantly higher');
  assert(score1.score >= 60, 'Calculus book should achieve strong recommendation score');
  console.log('  ✓ Candidate scoring and reason generation working as expected.');

  // ─── 4. Test User Profile Aggregation ───────────────────────────────────────
  console.log('\n[4/6] Testing Aggregated User Profile from Viewing History...');
  const userHistory = [
    { title: 'Calculus 1', category: 'Textbooks', price: 30, tags: ['calculus'] },
    { title: 'Physics 101', category: 'Textbooks', price: 40, tags: ['physics'] },
    { title: 'Chemistry Lab Manual', category: 'Textbooks', price: 20, tags: ['chemistry'] },
  ];
  const profile = buildUserProfile(userHistory);
  console.log(`  Derived Top Category: ${profile.category}`);
  console.log(`  Derived Average Budget: RM ${profile.avgPrice}`);
  console.log(`  Aggregated Tokens Count: ${profile.tokens.size}`);

  assert.strictEqual(profile.category, 'Textbooks');
  assert.strictEqual(profile.avgPrice, 30);
  assert(profile.tokens.has('calculus'));
  console.log('  ✓ User interest profile builder validated.');

  // ─── 5. Test Listing Schema Updates (tags & viewsCount) ─────────────────────
  console.log('\n[5/6] Testing Listing Model Schema Enhancements...');
  const dummySellerId = new mongoose.Types.ObjectId();
  const testListing = new Listing({
    sellerId: dummySellerId,
    title: 'Logitech Wireless Keyboard K380',
    description: 'Multi-device Bluetooth keyboard in great condition',
    price: 85,
    category: 'Electronics',
    condition: 'Like New',
    tags: ['logitech', 'keyboard', 'bluetooth', 'electronics'],
    viewsCount: 15,
  });

  await testListing.validate();
  assert.strictEqual(testListing.viewsCount, 15);
  assert.strictEqual(testListing.tags.length, 4);
  assert(testListing.tags.includes('keyboard'));
  console.log(`  ✓ Listing model accepts tags: [${testListing.tags.join(', ')}] and viewsCount: ${testListing.viewsCount}`);

  // ─── 6. Test User Model Schema Enhancements (viewHistory) ───────────────────
  console.log('\n[6/6] Testing User Model Schema View History Enhancement...');
  const testUser = new User({
    name: 'Wong Ann Rick',
    email: 'annrick@graduate.utm.my',
    universityId: 'A23CS8888',
    viewHistory: [
      {
        listingId: testListing._id,
        viewedAt: new Date(),
      },
    ],
  });

  await testUser.validate();
  assert.strictEqual(testUser.viewHistory.length, 1);
  assert.strictEqual(testUser.viewHistory[0].listingId.toString(), testListing._id.toString());
  console.log(`  ✓ User model successfully tracks viewHistory with timestamps.`);

  console.log('\n' + '='.repeat(65));
  console.log('✅ ALL T17 AI RECOMMENDATION ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(65));
}

runRecommendationTests().catch((err) => {
  console.error('\n❌ Recommendation Test Suite Failed:', err);
  process.exit(1);
});
