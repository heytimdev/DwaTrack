const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Email transporter ─────────────────────────────────────────────────────────
function getMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function formatOwner(u) {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    role: 'owner',
    ownerId: u.id,
    businessName: u.business_name,
    businessEmail: u.business_email,
    phoneNumber: u.phone_number,
    city: u.city,
    country: u.country || 'Ghana',
    currency: u.currency || 'GH₵',
    businessLogo: u.business_logo,
    avatar: u.avatar || null,
    taxEnabled: u.tax_enabled || false,
    taxLabel: u.tax_label || 'VAT',
    taxRate: parseFloat(u.tax_rate) || 0,
    createdAt: u.created_at,
  };
}

function formatMember(m) {
  return {
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    role: m.role,
    ownerId: m.owner_id,
    status: m.status,
    businessName: m.business_name,
    businessEmail: m.business_email,
    phoneNumber: m.phone_number,
    city: m.city,
    country: m.country || 'Ghana',
    currency: m.currency || 'GH₵',
    businessLogo: m.business_logo,
    avatar: m.avatar || null,
    taxEnabled: m.tax_enabled || false,
    taxLabel: m.tax_label || 'VAT',
    taxRate: parseFloat(m.tax_rate) || 0,
  };
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const {
      businessName, businessEmail, phoneNumber, city, country, currency, businessLogo,
      firstName, lastName, email, password,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'firstName, lastName, email and password are required' });
    }

    const emailNorm = email.trim().toLowerCase();

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [emailNorm]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users
         (first_name, last_name, email, password_hash,
          business_name, business_email, phone_number, city, country, currency, business_logo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [firstName, lastName, emailNorm, passwordHash,
       businessName || null, businessEmail || null,
       phoneNumber || null, city || null,
       country || 'Ghana', currency || 'GH₵',
       businessLogo || null]
    );

    const user = rows[0];
    const token = makeToken({ id: user.id, role: 'owner', ownerId: user.id });
    res.status(201).json({ token, user: formatOwner(user) });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailNorm = email.trim().toLowerCase();

    // 1. Check owners
    const ownerRes = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [emailNorm]
    );
    if (ownerRes.rows.length > 0) {
      const u = ownerRes.rows[0];
      const match = await bcrypt.compare(password, u.password_hash);
      if (match) {
        const token = makeToken({ id: u.id, role: u.role, ownerId: u.id });
        return res.json({ token, user: formatOwner(u) });
      }
    }

    // 2. Check team members (join owner to get business info)
    const memberRes = await pool.query(
      `SELECT tm.*,
              u.business_name, u.business_email,
              u.phone_number,  u.city, u.business_logo,
              u.tax_enabled,   u.tax_label, u.tax_rate,
              u.country,       u.currency
       FROM   team_members tm
       JOIN   users u ON u.id = tm.owner_id
       WHERE  tm.email = $1 AND tm.status = 'active'
       LIMIT  1`,
      [emailNorm]
    );
    if (memberRes.rows.length > 0) {
      const m = memberRes.rows[0];
      const match = await bcrypt.compare(password, m.password_hash);
      if (match) {
        const token = makeToken({ id: m.id, role: m.role, ownerId: m.owner_id });
        return res.json({ token, user: formatMember(m) });
      }
    }

    res.status(401).json({ error: 'Invalid email or password' });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'owner') {
      const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      return res.json(formatOwner(rows[0]));
    }

    // Team member
    const { rows } = await pool.query(
      `SELECT tm.*,
              u.business_name, u.business_email,
              u.phone_number,  u.city, u.business_logo,
              u.tax_enabled,   u.tax_label, u.tax_rate,
              u.country,       u.currency
       FROM   team_members tm
       JOIN   users u ON u.id = tm.owner_id
       WHERE  tm.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(formatMember(rows[0]));
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const emailNorm = email.trim().toLowerCase();

    // Check owners first, then team members
    let user = null;
    const ownerRes = await pool.query('SELECT id, first_name FROM users WHERE email = $1', [emailNorm]);
    if (ownerRes.rows.length) {
      user = ownerRes.rows[0];
    } else {
      const memberRes = await pool.query(
        'SELECT id, first_name FROM team_members WHERE email = $1 AND status = $2',
        [emailNorm, 'active']
      );
      if (memberRes.rows.length) user = memberRes.rows[0];
    }

    // Always return success so we don't leak whether an email exists
    if (!user) return res.json({ success: true });

    // Generate a secure random token
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

    await getMailer().sendMail({
      from:    `"DwaTrack" <${process.env.SMTP_USER}>`,
      to:      emailNorm,
      subject: 'Reset your DwaTrack password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0d9488">Password Reset</h2>
          <p>Hi ${user.first_name},</p>
          <p>We received a request to reset your DwaTrack password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#9ca3af;font-size:12px">DwaTrack &mdash; Business tracking for every kobo.</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    const resetRecord = rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update whichever table this user belongs to
    const ownerUpdate = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, resetRecord.user_id]
    );
    if (ownerUpdate.rowCount === 0) {
      await pool.query(
        'UPDATE team_members SET password_hash = $1 WHERE id = $2',
        [passwordHash, resetRecord.user_id]
      );
    }
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetRecord.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
