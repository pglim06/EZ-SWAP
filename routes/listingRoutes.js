const express = require('express');
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  seedSampleListings,
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

// Public listing discovery and search endpoints (T09)
router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/seed', seedSampleListings);

// Protected listing creation
router.post('/', protect, createListing);

module.exports = router;
