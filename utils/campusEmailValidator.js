/**
 * Email Validation & Verification Tier Utility
 * T07 Logic:
 * - Accepts any valid email address format.
 * - Emails ending in @graduate.utm.my (or @utm.my) grant 'verified' UTM campus student status.
 * - Other emails (e.g. @gmail.com, @yahoo.com) register as 'unverified' status.
 */

function validateAndTierEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please provide a valid email address.' };
  }

  const domain = trimmed.split('@')[1];
  const isUtmStudent = domain === 'graduate.utm.my' || domain === 'utm.my' || domain.endsWith('.utm.my');

  return {
    isValid: true,
    email: trimmed,
    domain,
    isUtmStudent,
    verificationStatus: isUtmStudent ? 'verified' : 'unverified',
    tierLabel: isUtmStudent ? 'Verified UTM Student' : 'Unverified User',
  };
}

// Backward compatibility alias for legacy tests
function validateCampusEmail(email) {
  const result = validateAndTierEmail(email);
  return {
    isValid: result.isValid,
    domain: result.domain,
    isUtmStudent: result.isUtmStudent,
    verificationStatus: result.verificationStatus,
    message: result.message,
  };
}

module.exports = {
  validateAndTierEmail,
  validateCampusEmail,
};
