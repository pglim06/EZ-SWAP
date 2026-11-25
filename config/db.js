const dns = require('dns');
// Set public DNS to avoid querySrv ECONNREFUSED on Windows / local router networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
    // Strip accidental surrounding quotes or "MONGODB_URI=" prefix pasted into hosting dashboards
    uri = uri.replace(/^['"]|['"]$/g, '').replace(/^MONGODB_URI=/i, '').trim();

    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error(
        `Invalid MONGODB_URI (length=${uri.length}, prefix="${uri.slice(0, 14)}"). Set MONGODB_URI in Render Environment to your mongodb+srv://... connection string.`
      );
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (app termination)');
  process.exit(0);
});

module.exports = connectDB;
