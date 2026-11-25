const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserBookmarks,
  toggleBookmark,
  checkBookmark,
} = require('../controllers/bookmarkController');

// All bookmark actions require authentication
router.get('/', protect, getUserBookmarks);
router.post('/toggle', protect, toggleBookmark);
router.get('/check/:listingId', protect, checkBookmark);

module.exports = router;
