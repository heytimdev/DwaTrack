const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

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
    ownerId: u.id,          // always equal to id for owners
    businessName: u.business_name,
    businessEmail: u.business_email,
    phoneNumber: u.phone_number,
    city: u.city,
    businessLogo: u.business_logo,
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
    // Business info from joined owner row
    businessName: m.business_name,
    businessEmail: m.business_email,
    phoneNumber: m.phone_number,
    city: m.city,
    businessLogo: m.business_logo,
  };
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const {
      businessName, businessEmail, phoneNumber, city, businessLogo,
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
          business_name, business_email, phone_number, city, business_logo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [firstName, lastName, emailNorm, passwordHash,
       businessName || null, businessEmail || null,
       phoneNumber || null, city || null, businessLogo || null]
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
              u.phone_number,  u.city, u.business_logo
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
              u.phone_number,  u.city, u.business_logo
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

module.exports = router;
