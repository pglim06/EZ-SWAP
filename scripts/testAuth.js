/**
 * EZ Swap — T07 Auth Smoke Test
 * Tests campus email verification, password hashing, and user authentication.
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateCampusEmail } = require('../utils/campusEmailValidator');
const { hashPassword, verifyPassword } = require('../utils/password');

const TEST_EMAIL = '__test_student__@graduate.utm.my';
const TEST_PASSWORD = 'Password123!';

async function runAuthTests() {
  console.log('='.repeat(55));
  console.log('EZ SWAP — T07 User Auth & Email Verification Test');
  console.log('='.repeat(55));

  // 1. Campus Email Domain Tier Validator
  console.log('\n[1/5] Testing Email Domain Tier Validator (T07)...');
  const gmailCheck = validateCampusEmail('fake_student@gmail.com');
  if (gmailCheck.isValid && gmailCheck.verificationStatus === 'unverified') {
    console.log('  ✓ Correctly accepted standard email (gmail.com) as unverified user');
  } else {
    throw new Error('Failed to classify gmail as unverified user');
  }

  const validEmail = validateCampusEmail(TEST_EMAIL);
  if (validEmail.isValid && validEmail.verificationStatus === 'verified') {
    console.log('  ✓ Correctly accepted official UTM student email (@graduate.utm.my) as verified user');
  } else {
    throw new Error('Failed to accept valid UTM email as verified user');
  }

  // 2. Password Hashing & Verification
  console.log('\n[2/5] Testing Password Security (Hashing & Verify)...');
  const hashed = hashPassword(TEST_PASSWORD);
  console.log('  ✓ Password hashed successfully (never stored in plaintext)');

  const matchCorrect = verifyPassword(TEST_PASSWORD, hashed);
  const matchWrong = verifyPassword('WrongPassword!', hashed);
  if (matchCorrect && !matchWrong) {
    console.log('  ✓ Password verification succeeds with correct credentials and rejects incorrect ones');
  } else {
    throw new Error('Password verification logic failed');
  }

  // 3. Connect to MongoDB
  console.log('\n[3/5] Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`  ✓ Connected to database: ${mongoose.connection.name}`);

  // 4. Test User Registration in MongoDB
  console.log('\n[4/5] Testing User Registration & Model Validation...');
  // Clean up any old test user
  await User.deleteOne({ email: TEST_EMAIL });

  const testUser = await User.create({
    name: 'Test Student Lim',
    email: TEST_EMAIL,
    passwordHash: hashed,
    universityId: 'A23CS0001',
    verificationStatus: 'verified',
    role: 'student',
  });
  console.log(`  ✓ Test student registered with ID: ${testUser._id}`);
  console.log(`  ✓ Verification status: ${testUser.verificationStatus}`);

  // 5. JWT Generation & Verification
  console.log('\n[5/5] Testing JWT Session Token...');
  const token = jwt.sign(
    { id: testUser._id },
    process.env.JWT_SECRET || 'ezswap_super_secret_jwt_key_2026_campus_marketplace',
    { expiresIn: '7d' }
  );
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'ezswap_super_secret_jwt_key_2026_campus_marketplace'
  );
  if (decoded.id.toString() === testUser._id.toString()) {
    console.log('  ✓ JWT token generated and verified with user ID payload');
  } else {
    throw new Error('JWT payload mismatch');
  }

  // Clean up
  await User.deleteOne({ _id: testUser._id });
  console.log('  ✓ Test user cleaned up from database');

  await mongoose.connection.close();
  console.log('\n' + '='.repeat(55));
  console.log('✅ ALL T07 BACKEND AUTH TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(55));
}

runAuthTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
