const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');
const Review = require('../models/Review');

// ═══════════════════════════════════════════════════════════════════════════════
// T16: Admin Dashboard & Moderation Portal — Controller
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Platform Overview Stats ────────────────────────────────────────────
// @route   GET /api/admin/stats
// @access  Admin only
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      pendingUsers,
      totalListings,
      activeListings,
      soldListings,
      removedListings,
      totalOrders,
      acceptedOrders,
      pendingOrders,
      totalTransactions,
      completedTransactions,
      inProgressTransactions,
      disputedTransactions,
      totalReports,
      pendingReports,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ verificationStatus: 'verified' }),
      User.countDocuments({ verificationStatus: 'unverified' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ status: 'sold' }),
      Listing.countDocuments({ status: 'removed' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'accepted' }),
      Order.countDocuments({ status: 'pending' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.countDocuments({ status: 'in_progress' }),
      Transaction.countDocuments({ status: 'disputed' }),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Review.countDocuments(),
    ]);

    // Revenue estimate: sum of accepted/completed order prices
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['accepted'] } } },
      { $group: { _id: null, total: { $sum: '$offeredPrice' } } },
    ]);
    const totalTradeVolume = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Category distribution
    const categoryAgg = await Listing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      users: { total: totalUsers, verified: verifiedUsers, unverified: unverifiedUsers, pending: pendingUsers, recentRegistrations },
      listings: { total: totalListings, active: activeListings, sold: soldListings, removed: removedListings },
      orders: { total: totalOrders, accepted: acceptedOrders, pending: pendingOrders },
      transactions: { total: totalTransactions, completed: completedTransactions, inProgress: inProgressTransactions, disputed: disputedTransactions },
      reports: { total: totalReports, pending: pendingReports },
      reviews: { total: totalReviews },
      trade: { totalVolume: totalTradeVolume },
      categories: categoryAgg.map((c) => ({ name: c._id, count: c.count })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 2. All Users List ─────────────────────────────────────────────────────
// @route   GET /api/admin/users
// @query   search, verificationStatus, role, page, limit
exports.getAllUsers = async (req, res) => {
  try {
    const { search, verificationStatus, role } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { universityId: { $regex: search, $options: 'i' } },
      ];
    }
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -viewHistory -emailVerificationToken -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 3. Update User Verification Status ────────────────────────────────────
// @route   PATCH /api/admin/users/:id/verify
// @body    verificationStatus ('verified' | 'rejected' | 'pending' | 'unverified')
exports.updateUserVerification = async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    const allowed = ['verified', 'rejected', 'pending', 'unverified'];
    if (!allowed.includes(verificationStatus)) {
      return res.status(400).json({ message: `verificationStatus must be one of: ${allowed.join(', ')}` });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verificationStatus },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User verification status updated to '${verificationStatus}'`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 4. Update User Role ───────────────────────────────────────────────────
// @route   PATCH /api/admin/users/:id/role
// @body    role ('student' | 'admin')
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: "role must be 'student' or 'admin'" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User role updated to '${role}'`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 5. All Reports (Moderation Queue) ─────────────────────────────────────
// @route   GET /api/admin/reports
// @query   status, targetType, page, limit
exports.getAllReports = async (req, res) => {
  try {
    const { status, targetType } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporterId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(query),
    ]);

    res.json({ reports, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 6. Resolve / Dismiss a Report ─────────────────────────────────────────
// @route   PATCH /api/admin/reports/:id
// @body    status ('reviewed' | 'resolved' | 'dismissed'), adminNotes
exports.updateReport = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['reviewed', 'resolved', 'dismissed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const update = { status };
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (['resolved', 'dismissed'].includes(status)) update.resolvedAt = new Date();

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('reporterId', 'name email');

    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json({ message: `Report marked as '${status}'`, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 7. All Listings (Admin View) ──────────────────────────────────────────
// @route   GET /api/admin/listings
// @query   search, status, category, page, limit
exports.getAllListings = async (req, res) => {
  try {
    const { search, status, category } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate('sellerId', 'name email verificationStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(query),
    ]);

    res.json({ listings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 8. Update Listing Status (Remove / Reinstate) ─────────────────────────
// @route   PATCH /api/admin/listings/:id/status
// @body    status ('active' | 'removed')
exports.updateListingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'removed'].includes(status)) {
      return res.status(400).json({ message: "status must be 'active' or 'removed'" });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('sellerId', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ message: `Listing status updated to '${status}'`, listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 9. All Disputed Transactions ──────────────────────────────────────────
// @route   GET /api/admin/disputes
// @query   page, limit
exports.getDisputedTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const query = { status: 'disputed' };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .populate('listingId', 'title price category')
        .populate('orderId', 'offeredPrice counterPrice')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
    ]);

    res.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 10. Resolve a Dispute ─────────────────────────────────────────────────
// @route   PATCH /api/admin/disputes/:id
// @body    status ('completed' | 'cancelled'), adminNotes (optional)
exports.resolveDispute = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: "status must be 'completed' or 'cancelled'" });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.status !== 'disputed') {
      return res.status(400).json({ message: 'Only disputed transactions can be resolved by admin' });
    }

    transaction.status = status;
    if (status === 'completed') transaction.completedAt = new Date();
    await transaction.save();

    // Update the listing status accordingly
    if (status === 'completed') {
      await Listing.findByIdAndUpdate(transaction.listingId, { status: 'sold' });
    } else if (status === 'cancelled') {
      await Listing.findByIdAndUpdate(transaction.listingId, { status: 'active' });
    }

    const populated = await Transaction.findById(transaction._id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('listingId', 'title price');

    res.json({ message: `Dispute resolved as '${status}'`, transaction: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
