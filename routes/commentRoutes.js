const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getComments, addComment } = require('../controllers/commentController');

router.get('/:listingId', getComments);
router.post('/:listingId', protect, addComment);

module.exports = router;
