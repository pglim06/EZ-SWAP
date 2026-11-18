/**
 * Campus Email Validation Utility
 * Enforces verified university email domains for EZ Swap marketplace safety.
 */

const APPROVED_DOMAINS = [
  'graduate.utm.my',
  'utm.my',
  'edu.my',
  'edu'
];

/**
 * Validates whether an email belongs to an approved university domain
 * @param {string} email
 * @returns {{ isValid: boolean, domain?: string, message?: string }}
 */
function validateCampusEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'University email is required.' };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Invalid email address format.' };
  }

  const domain = trimmed.split('@')[1];
  const isApproved = APPROVED_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith('.' + allowed)
  );

  if (!isApproved) {
    return {
      isValid: false,
      domain,
      message: `Registration requires a valid campus email (e.g. @graduate.utm.my, @utm.my, .edu). Domain '@${domain}' is not permitted.`
    };
  }

  return { isValid: true, domain };
}

module.exports = { validateCampusEmail, APPROVED_DOMAINS };
