const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Generate a cryptographically secure 64-character hex token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and configure nodemailer transporter
 */
function createTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;

  if (!user || !pass) {
    console.warn('\n⚠️ [EMAIL SERVICE WARNING] EMAIL_USER / EMAIL_PASS not configured in .env!');
    console.warn('To send real emails to Gmail, please add your Gmail and App Password to EZ-SWAP/.env:');
    console.warn('  EMAIL_USER=your_gmail@gmail.com');
    console.warn('  EMAIL_PASS=your_16_character_google_app_password\n');
    return null;
  }

  return nodemailer.createTransport({
    service: host.includes('gmail') ? 'gmail' : undefined,
    host: host.includes('gmail') ? undefined : host,
    port: host.includes('gmail') ? undefined : port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send email via Resend HTTPS API (if RESEND_API_KEY is set) or Nodemailer SMTP.
 * HTTPS API is recommended on cloud hosts like Render free tier where outbound SMTP ports may be blocked.
 */
async function dispatchEmail({ to, subject, text, html, fallbackLabel, fallbackUrl }) {
  const senderEmail = process.env.EMAIL_USER || process.env.SMTP_USER || 'noreply@ezswap.utm.my';
  const fromAddress = process.env.EMAIL_FROM || `"EZ Swap UTM" <${senderEmail}>`;

  if (process.env.RESEND_API_KEY) {
    try {
      const resendFrom = process.env.EMAIL_FROM || 'EZ Swap UTM <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to],
          subject,
          text,
          html,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ [RESEND ERROR] Failed to send email to ${to}:`, data);
        return { success: false, error: data.message || 'Resend API error', email: to, realDelivery: false };
      }
      console.log(`✅ [EMAIL SENT via Resend] Delivered to ${to} (ID: ${data.id})`);
      return { success: true, email: to, messageId: data.id, realDelivery: true };
    } catch (err) {
      console.error(`❌ [RESEND ERROR] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message, email: to, realDelivery: false };
    }
  }

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ [EMAIL SENT] Delivered to ${to} (MessageID: ${info.messageId})`);
      return { success: true, email: to, messageId: info.messageId, realDelivery: true };
    } catch (err) {
      console.error(`❌ [EMAIL ERROR] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message, email: to, realDelivery: false };
    }
  }

  console.log('='.repeat(70));
  console.log(`✉️ [${fallbackLabel}] (Configure RESEND_API_KEY or EMAIL_USER & EMAIL_PASS for real delivery)`);
  console.log(`To: ${to}`);
  console.log(`URL: ${fallbackUrl}`);
  console.log('='.repeat(70));
  return { success: true, email: to, verificationUrl: fallbackUrl, resetUrl: fallbackUrl, realDelivery: false };
}

/**
 * Send real verification email to recipient's inbox
 */
async function sendVerificationEmail({ email, name, token, isUtmStudent }) {
  const clientUrl = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #2563eb; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${isUtmStudent ? '#eff6ff' : '#f1f5f9'}; color: ${isUtmStudent ? '#1d4ed8' : '#475569'}; margin-bottom: 16px; border: 1px solid ${isUtmStudent ? '#bfdbfe' : '#cbd5e1'}; }
        .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
        .link-text { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 20px; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EZ Swap · UTM Campus Marketplace</h1>
          <p>Official Student-to-Student Preloved Network</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${name || 'Student'}!</div>
          <div class="badge">
            ${isUtmStudent ? '🎓 Verified UTM Student Account' : '👤 Standard Student Account'}
          </div>
          <p class="message">
            Thank you for registering on EZ Swap UTM. To protect our community and verify that you own <strong>${email}</strong>, please confirm your email address by clicking the button below:
          </p>
          <div class="btn-wrapper">
            <a href="${verificationUrl}" class="btn" target="_blank">Verify My Email Address</a>
          </div>
          <p class="message" style="font-size: 12px; margin-bottom: 8px;">
            This link will expire in 24 hours. If the button doesn't work, copy and paste this link into your browser:
          </p>
          <div class="link-text">
            ${verificationUrl}
          </div>
        </div>
        <div class="footer">
          If you did not sign up for an EZ Swap account, you can safely ignore this email.<br>
          © 2026 EZ Swap UTM. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    to: email,
    subject: 'Verify your EZ Swap UTM Account',
    text: `Hello ${name}!\n\nPlease verify your email address for EZ Swap UTM by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: htmlContent,
    fallbackLabel: 'SIMULATED EMAIL DISPATCH',
    fallbackUrl: verificationUrl,
  });
}

/**
 * Send real password reset email
 */
async function sendPasswordResetEmail({ email, name, token }) {
  const clientUrl = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #2563eb; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; }
        .link-text { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 20px; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EZ Swap Password Reset</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${name || 'User'}!</div>
          <p class="message">
            We received a request to reset your password for your EZ Swap UTM account. Click the button below to choose a new password:
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p class="message" style="font-size: 12px; margin-bottom: 8px;">
            This link is valid for 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <div class="link-text">
            ${resetUrl}
          </div>
        </div>
        <div class="footer">
          © 2026 EZ Swap UTM. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return dispatchEmail({
    to: email,
    subject: 'Reset your EZ Swap Password',
    text: `Hello ${name}!\n\nReset your EZ Swap password here:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: htmlContent,
    fallbackLabel: 'PASSWORD RESET DISPATCH',
    fallbackUrl: resetUrl,
  });
}

module.exports = {
  generateToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
