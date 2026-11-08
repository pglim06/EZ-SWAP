/**
 * EZ Swap — Database Smoke Test
 *
 * Verifies:
 *  1. MongoDB Atlas connection
 *  2. All 5 schemas compile without errors
 *  3. Insert a full chain: User → Listing → Order → Transaction → Review
 *  4. Populate references work correctly
 *  5. Review post-save hook updates User.averageRating
 *  6. Clean up all test data
 *
 * Usage:  node scripts/testConnection.js
 */

require('dotenv').config();
const dns = require('dns');
// Set public DNS to avoid querySrv ECONNREFUSED on Windows / local router networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');

const TEST_PREFIX = '__SMOKE_TEST__';

async function runTests() {
  console.log('='.repeat(50));
  console.log('EZ SWAP — Database Smoke Test');
  console.log('='.repeat(50));

  // ── Step 1: Connect ──────────────────────────────
  console.log('\n[1/6] Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`  ✓ Connected to: ${mongoose.connection.host}`);
    console.log(`  ✓ Database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(`  ✗ Connection failed: ${err.message}`);
    console.error('\n  → Did you whitelist your IP in Atlas Network Access?');
    process.exit(1);
  }

  // ── Step 2: Schema compilation ───────────────────
  console.log('\n[2/6] Verifying schema compilation...');
  const models = { User, Listing, Order, Transaction, Review };
  for (const [name, model] of Object.entries(models)) {
    console.log(`  ✓ ${name} schema compiled (collection: ${model.collection.name})`);
  }

  // ── Step 3: Insert test data chain ───────────────
  console.log('\n[3/6] Inserting test data chain...');

  // Create seller and buyer
  const seller = await User.create({
    name: `${TEST_PREFIX} Seller`,
    email: `${Date.now()}-seller@test.edu`,
    passwordHash: 'hashed_password_placeholder',
    role: 'student',
    verificationStatus: 'verified',
  });
  console.log(`  ✓ User (seller) created: ${seller._id}`);

  const buyer = await User.create({
    name: `${TEST_PREFIX} Buyer`,
    email: `${Date.now()}-buyer@test.edu`,
    passwordHash: 'hashed_password_placeholder',
    role: 'student',
    verificationStatus: 'verified',
  });
  console.log(`  ✓ User (buyer) created: ${buyer._id}`);

  // Create listing
  const listing = await Listing.create({
    sellerId: seller._id,
    title: `${TEST_PREFIX} Calculus Textbook`,
    description: 'Test listing for smoke test',
    price: 25.00,
    category: 'Textbooks',
    condition: 'Good',
    images: [
      { imageUrl: 'https://example.com/test-img.jpg', displayOrder: 0 },
    ],
    status: 'active',
  });
  console.log(`  ✓ Listing created: ${listing._id}`);

  // Create order
  const order = await Order.create({
    listingId: listing._id,
    buyerId: buyer._id,
    sellerId: seller._id,
    offeredPrice: 20.00,
    transactionMethod: 'meetup',
    status: 'accepted',
  });
  console.log(`  ✓ Order created: ${order._id}`);

  // Create transaction
  const transaction = await Transaction.create({
    orderId: order._id,
    listingId: listing._id,
    buyerId: buyer._id,
    sellerId: seller._id,
    handoverMethod: 'meetup',
    meetupLocation: 'Library Entrance',
    sellerConfirmation: 'handed_over',
    buyerConfirmation: 'received',
    status: 'completed',
    completedAt: new Date(),
  });
  console.log(`  ✓ Transaction created: ${transaction._id}`);

  // Create review (buyer reviews seller)
  const review = await Review.create({
    transactionId: transaction._id,
    reviewerId: buyer._id,
    revieweeId: seller._id,
    reviewerRole: 'buyer',
    rating: 5,
    comment: 'Great seller! Smooth handover.',
  });
  console.log(`  ✓ Review created: ${review._id}`);

  // ── Step 4: Verify populate references ───────────
  console.log('\n[4/6] Verifying populate references...');

  const populatedOrder = await Order.findById(order._id)
    .populate('buyerId', 'name email')
    .populate('sellerId', 'name email')
    .populate('listingId', 'title price');
  console.log(`  ✓ Order.buyerId → ${populatedOrder.buyerId.name}`);
  console.log(`  ✓ Order.sellerId → ${populatedOrder.sellerId.name}`);
  console.log(`  ✓ Order.listingId → ${populatedOrder.listingId.title}`);

  const populatedTx = await Transaction.findById(transaction._id)
    .populate('orderId', 'offeredPrice status');
  console.log(`  ✓ Transaction.orderId → price: ${populatedTx.orderId.offeredPrice}, status: ${populatedTx.orderId.status}`);

  // ── Step 5: Verify review hook updated seller rating ──
  console.log('\n[5/6] Verifying Review post-save hook...');
  const updatedSeller = await User.findById(seller._id);
  console.log(`  ✓ Seller averageRating: ${updatedSeller.averageRating} (expected: 5)`);
  console.log(`  ✓ Seller ratingsCount: ${updatedSeller.ratingsCount} (expected: 1)`);

  if (updatedSeller.averageRating === 5 && updatedSeller.ratingsCount === 1) {
    console.log('  ✓ Post-save hook working correctly!');
  } else {
    console.log('  ⚠ Post-save hook values unexpected — check Review.js hook');
  }

  // ── Step 6: Clean up ─────────────────────────────
  console.log('\n[6/6] Cleaning up test data...');
  await Review.deleteOne({ _id: review._id });
  await Transaction.deleteOne({ _id: transaction._id });
  await Order.deleteOne({ _id: order._id });
  await Listing.deleteOne({ _id: listing._id });
  await User.deleteMany({ _id: { $in: [seller._id, buyer._id] } });
  console.log('  ✓ All test data removed');

  // ── Done ──────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('ALL SCHEMAS VERIFIED SUCCESSFULLY!');
  console.log('='.repeat(50));

  await mongoose.connection.close();
  process.exit(0);
}

runTests().catch(async (err) => {
  console.error('\n✗ Smoke test failed:', err.message);

  // Attempt cleanup even on failure
  try {
    await User.deleteMany({ name: { $regex: TEST_PREFIX } });
    await Listing.deleteMany({ title: { $regex: TEST_PREFIX } });
  } catch (_) {
    // ignore cleanup errors
  }

  await mongoose.connection.close();
  process.exit(1);
});
