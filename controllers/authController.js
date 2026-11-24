const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Bookmark = require('../models/Bookmark');
const Review = require('../models/Review');
const Report = require('../models/Report');
const { hashPassword, verifyPassword } = require('../utils/password');
const { validateAndTierEmail } = require('../utils/campusEmailValidator');
const { generateToken, sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'ezswap_super_secret_jwt_key_2026_campus_marketplace';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Helper to generate JWT and send HTTP-only cookie response
 */
function sendTokenResponse(user, statusCode, res, extra = {}) {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    user: userObj,
    ...extra,
  });
}

/**
 * @desc    Register an account with email validation and tiering (T07)
 *          - @graduate.utm.my / @utm.my => verified user
 *          - other email => unverified user
 *          - Sends approval verification email
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, universityId } = req.body;

    // 1. Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email address, and password are required.',
      });
    }

    // 2. Validate password confirmation
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation password do not match.',
      });
    }

    // 3. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 4. Validate email format and determine verification status tier
    const emailCheck = validateAndTierEmail(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: emailCheck.message,
      });
    }

    const normalizedEmail = emailCheck.email;

    // 5. Check if email already registered
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered.',
      });
    }

    // 6. Generate email verification token (valid 24h)
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 7. Hash password
    const passwordHash = hashPassword(password);

    // 8. Create user in database
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      universityId: universityId ? universityId.trim() : undefined,
      verificationStatus: emailCheck.verificationStatus, // 'verified' for UTM, 'unverified' for others
      isEmailApproved: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      role: 'student',
    });

    // 9. Send verification email via SMTP to actual inbox
    const emailResult = await sendVerificationEmail({
      email: normalizedEmail,
      name: user.name,
      token: verificationToken,
      isUtmStudent: emailCheck.isUtmStudent,
    });

    res.status(201).json({
      success: true,
      requiresApproval: true,
      message: `Registration successful! A verification email has been sent to ${normalizedEmail}. Please check your Gmail inbox and click the verification link to activate your account.`,
      email: normalizedEmail,
      realDelivery: emailResult.realDelivery,
      isUtmStudent: emailCheck.isUtmStudent,
      tierLabel: emailCheck.tierLabel,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
        isEmailApproved: false,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

/**
 * @desc    Approve/Verify email registration via link token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification link. Please request a new one.',
      });
    }

    // Mark email as approved & clear token
    user.isEmailApproved = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    sendTokenResponse(user, 200, res, {
      message: 'Email approved successfully! Your account is now active.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying email.',
    });
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (user.isEmailApproved) {
      return res.status(400).json({ success: false, message: 'This email is already verified. You can sign in.' });
    }

    const verificationToken = generateToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const isUtm = user.verificationStatus === 'verified';
    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
      isUtmStudent: isUtm,
    });

    res.status(200).json({
      success: true,
      message: `A fresh verification link has been sent to ${user.email}. Please check your Gmail inbox.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Sign in with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user (we need the passwordHash field)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if user approved email verification
    if (user.isEmailApproved === false) {
      // Re-issue or reuse existing token
      let token = user.emailVerificationToken;
      if (!token || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
        token = generateToken();
        user.emailVerificationToken = token;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();
      }

      return res.status(403).json({
        success: false,
        requiresApproval: true,
        message: 'Please check your Gmail inbox and click the verification link to activate your account before signing in.',
        email: user.email,
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.',
    });
  }
};

/**
 * @desc    Request password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // For security, do not expose whether email exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token valid for 1 hour
    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token: resetToken,
    });

    res.status(200).json({
      success: true,
      message: `Password reset link has been sent to ${user.email}. Please check your Gmail inbox.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error requesting password reset.',
    });
  }
};

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    // Update password & clear reset tokens
    user.passwordHash = hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error resetting password.',
    });
  }
};

/**
 * @desc    Get current logged in student profile
 * @route   GET /api/auth/me
 * @access  Private (protected)
 */
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * @desc    Log out student and clear session cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Update profile details
 * @route   PUT /api/auth/profile
 * @access  Private (protected)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, universityId, profilePictureUrl } = req.body;
    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name.trim();
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (universityId !== undefined) fieldsToUpdate.universityId = universityId;
    if (profilePictureUrl !== undefined) fieldsToUpdate.profilePictureUrl = profilePictureUrl;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-passwordHash');

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

/**
 * @desc    Permanently delete account and all associated data from database
 * @route   DELETE /api/auth/account
 * @access  Private (protected)
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Delete all marketplace listings created by user
    await Listing.deleteMany({ sellerId: userId });

    // 2. Delete all orders where user was buyer or seller
    await Order.deleteMany({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    // 3. Delete all transactions where user was buyer or seller
    await Transaction.deleteMany({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    // 4. Delete user's conversations and all associated messages
    const convs = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });
    const convIds = convs.map((c) => c._id);
    if (convIds.length > 0) {
      await Message.deleteMany({ conversationId: { $in: convIds } });
    }
    await Message.deleteMany({ senderId: userId });
    await Conversation.deleteMany({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    });

    // 5. Delete bookmarks created by user
    await Bookmark.deleteMany({ userId });

    // 6. Delete reviews written by or given to this user
    await Review.deleteMany({
      $or: [{ reviewerId: userId }, { revieweeId: userId }],
    });

    // 7. Delete reports filed by user or targeting user
    await Report.deleteMany({
      $or: [{ reporterId: userId }, { targetId: userId }],
    });

    // 8. Delete the user document completely
    await User.findByIdAndDelete(userId);

    // 9. Clear session cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Account and all associated records have been permanently deleted from database.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting account.',
    });
  }
};
