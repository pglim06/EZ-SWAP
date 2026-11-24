const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  seedSampleListings,
} = require('../controllers/listingController');
const {
  getRecommendations,
  getSimilarListings,
  recordListingView,
} = require('../controllers/recommendationController');

// Public listing discovery and search endpoints (T09)
router.get('/', getListings);
router.post('/seed', seedSampleListings);

// T17: Lightweight AI Recommendation & Similar Items Endpoints
router.get('/recommendations', getRecommendations);
router.get('/:id/similar', getSimilarListings);
router.post('/:id/view', recordListingView);

// Single listing details
router.get('/:id', getListingById);

// Create, update, delete routes (with upload middleware)
router.post('/', upload.array('images', 5), createListing);
router.put('/:id', upload.array('images', 5), updateListing);
router.delete('/:id', deleteListing);

module.exports = router;
