/**
 * EZ-SWAP Database Inspector CLI
 * Run: npm run db:check  OR  node scripts/checkDb.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function inspect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('\n🔍 Connecting to MongoDB Atlas...');
  try {
    const conn = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`✅ Connected successfully to: ${conn.connection.host}`);
    console.log(`📦 Database: ${db.databaseName}\n`);

    const collections = await db.listCollections().toArray();
    console.log('───────────────────────────────────────────────────────');
    console.log('  Collection Name        | Document Count');
    console.log('───────────────────────────────────────────────────────');
    for (const c of collections.sort((a, b) => a.name.localeCompare(b.name))) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  📁 ${c.name.padEnd(20)} | ${count}`);
    }
    console.log('───────────────────────────────────────────────────────\n');

    // Sample overview of Users
    const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1, verificationStatus: 1 } }).toArray();
    console.log('👥 Users preview:');
    users.forEach(u => console.log(`   • [${u.role.toUpperCase()}] ${u.name} (${u.email}) - status: ${u.verificationStatus}`));

    // Sample overview of Listings
    const listings = await db.collection('listings').find({}, { projection: { title: 1, price: 1, status: 1, category: 1 } }).limit(5).toArray();
    console.log('\n🛍️ Recent Listings (up to 5):');
    listings.forEach(l => console.log(`   • RM ${l.price} - ${l.title} [${l.category}] (${l.status})`));

    console.log('\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }
}

inspect();
