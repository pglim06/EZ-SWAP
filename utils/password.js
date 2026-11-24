const crypto = require('crypto');

/**
 * Hash password using Node.js built-in scrypt (or bcryptjs if available)
 * Produces salt:hash format using OWASP recommended parameters.
 */
function hashPassword(password) {
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 10);
  } catch {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${hash}`;
  }
}

/**
 * Verify a plain password against the stored hash
 */
function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  // If hashed with scrypt format: scrypt:salt:hash
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(derivedKey));
  }

  // Fallback to bcryptjs verification if hashed with bcrypt
  try {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
