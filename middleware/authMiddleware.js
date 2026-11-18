const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware: Ensures the request is authenticated via JWT cookie or header.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization: Bearer <token>
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please sign in with your student account.',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'ezswap_super_secret_jwt_key_2026_campus_marketplace';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account for this session no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session is invalid or expired. Please sign in again.',
    });
  }
};

/**
 * Authorize middleware: Restrict route to specific roles (e.g. 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
