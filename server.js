require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const initSocketIO = require('./socket/socketHandler');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// ─── CORS origins (shared between Express and Socket.IO) ─────────────────────
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  ...envOrigins,
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

// ─── Socket.IO initialization (T11: Real-Time Messaging) ────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Allow session cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));   // T15: Mutual Rating & Review System
app.use('/api/bookmarks', require('./routes/bookmarkRoutes')); // T10: Bookmark & Wishlist System
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));      // T16: Admin Dashboard & Moderation
app.use('/api/chat', require('./routes/chatRoutes'));

// Initialize Socket.IO event handlers
app.set('io', io);
initSocketIO(io);

// Serve built React frontend in production when client/dist exists
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      !req.path.startsWith('/api') &&
      !req.path.startsWith('/socket.io')
    ) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`EZ Swap Server running on port ${PORT}`);
  console.log(`Socket.IO ready for real-time messaging`);
});

module.exports = app;
