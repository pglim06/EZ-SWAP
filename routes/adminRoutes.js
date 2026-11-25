const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPlatformStats,
  getAllUsers,
  updateUserVerification,
  updateUserRole,
  getAllReports,
  updateReport,
  getAllListings,
  updateListingStatus,
  getDisputedTransactions,
  resolveDispute,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

// T16: Admin Dashboard & Moderation Portal
router.get('/stats',                       getPlatformStats);

// User management
router.get('/users',                       getAllUsers);
router.patch('/users/:id/verify',          updateUserVerification);
router.patch('/users/:id/role',            updateUserRole);

// Report moderation
router.get('/reports',                     getAllReports);
router.patch('/reports/:id',               updateReport);

// Listing moderation
router.get('/listings',                    getAllListings);
router.patch('/listings/:id/status',       updateListingStatus);

// Dispute management
router.get('/disputes',                    getDisputedTransactions);
router.patch('/disputes/:id',              resolveDispute);

module.exports = router;
