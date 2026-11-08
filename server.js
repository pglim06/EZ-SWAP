require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (to be added later)
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/listings', require('./routes/listingRoutes'));
// app.use('/api/orders', require('./routes/orderRoutes'));
// app.use('/api/transactions', require('./routes/transactionRoutes'));
// app.use('/api/reviews', require('./routes/reviewRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
