/**
 * EZ Swap — T09 Product Discovery & Search/Filter Engine Smoke Test
 * Tests keyword search, category filtering, price range, and sorting.
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');

async function testSearchFilter() {
  console.log('='.repeat(60));
  console.log('EZ SWAP — T09 Search & Filter Engine Smoke Test');
  console.log('='.repeat(60));

  // 1. Connect to MongoDB Atlas
  console.log('\n[1/5] Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`  ✓ Connected to: ${mongoose.connection.name}`);

  // Create or retrieve a demo seller
  let seller = await User.findOne({ email: 'test_seller_t09@graduate.utm.my' });
  if (!seller) {
    seller = await User.create({
      name: 'Tan Wei Ming',
      email: 'test_seller_t09@graduate.utm.my',
      universityId: 'A23CS9999',
      verificationStatus: 'verified',
      role: 'student',
      averageRating: 4.8,
    });
  }

  // Insert isolated test listings
  console.log('\n[2/5] Creating test listings for search/filter evaluation...');
  await Listing.deleteMany({ sellerId: seller._id });

  const items = await Listing.insertMany([
    {
      sellerId: seller._id,
      title: 'Calculus 1 Mathematics Book',
      description: 'First year engineering calculus textbook with notes',
      price: 30,
      category: 'Textbooks',
      condition: 'Like New',
      status: 'active',
    },
    {
      sellerId: seller._id,
      title: 'Physics for Scientists and Engineers',
      description: 'Mechanics and thermal physics reference book',
      price: 60,
      category: 'Textbooks',
      condition: 'Good',
      status: 'active',
    },
    {
      sellerId: seller._id,
      title: 'Logitech Wireless Keyboard K380',
      description: 'Bluetooth multi-device keyboard for iPad and laptop',
      price: 90,
      category: 'Electronics',
      condition: 'New',
      status: 'active',
    },
    {
      sellerId: seller._id,
      title: 'Dorm Study Desk Lamp',
      description: 'LED warm desk light with flexible stand',
      price: 15,
      category: 'Dorm',
      condition: 'Fair',
      status: 'active',
    },
  ]);
  console.log(`  ✓ Created ${items.length} test listings`);

  // 3. Test Keyword Search
  console.log('\n[3/5] Testing Keyword Search (Regex query)...');
  const searchKeyword = 'calculus';
  const keywordResults = await Listing.find({
    sellerId: seller._id,
    status: 'active',
    $or: [
      { title: { $regex: searchKeyword, $options: 'i' } },
      { description: { $regex: searchKeyword, $options: 'i' } },
    ],
  });
  console.log(`  ✓ Search for '${searchKeyword}' returned: ${keywordResults.length} item(s)`);
  if (keywordResults.length !== 1 || !keywordResults[0].title.includes('Calculus')) {
    throw new Error('Keyword search failed to match Calculus book');
  }

  // 4. Test Category and Price Range Filtering
  console.log('\n[4/5] Testing Category & Price Range Filter...');
  // Category = Textbooks, Price between 20 and 50
  const filtered = await Listing.find({
    sellerId: seller._id,
    category: 'Textbooks',
    price: { $gte: 20, $lte: 50 },
    status: 'active',
  });
  console.log(`  ✓ Category='Textbooks' & Price RM 20-50 returned: ${filtered.length} item(s) (Price: RM ${filtered[0].price})`);
  if (filtered.length !== 1 || filtered[0].price !== 30) {
    throw new Error('Filter by category and price range failed');
  }

  // 5. Test Sorting Logic
  console.log('\n[5/5] Testing Sorting (Price: Low to High)...');
  const sortedAsc = await Listing.find({ sellerId: seller._id, status: 'active' }).sort({ price: 1 });
  const prices = sortedAsc.map((i) => i.price);
  console.log(`  ✓ Sorted prices: ${prices.join(', ')}`);
  if (prices[0] !== 15 || prices[prices.length - 1] !== 90) {
    throw new Error('Sort price asc failed');
  }

  // Cleanup test data
  await Listing.deleteMany({ sellerId: seller._id });
  await User.deleteOne({ _id: seller._id });
  console.log('  ✓ Cleaned up test records');

  await mongoose.connection.close();
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL T09 SEARCH & FILTER TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(60));
}

testSearchFilter().catch((err) => {
  console.error('\n❌ Test failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
