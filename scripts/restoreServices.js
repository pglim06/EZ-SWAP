require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const Listing = require('../models/Listing');

async function restoreServices() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  const filter = { category: 'Services', status: { $in: ['sold', 'reserved'] } };

  try {
    await mongoose.connect(uri);

    if (dryRun) {
      const listings = await Listing.find(filter, 'title status').lean();
      console.log(`Dry run: ${listings.length} service listing(s) would be restored to active.`);
      listings.forEach((l) => console.log(`  - ${l.title} (${l.status})`));
    } else {
      const result = await Listing.updateMany(filter, { $set: { status: 'active' } });
      console.log(`Restored ${result.modifiedCount} service listing(s) to active.`);
    }
  } catch (err) {
    console.error('Failed to restore service listings:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

restoreServices();
