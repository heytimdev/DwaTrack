const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function format(m) {
  return {
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    role: m.role,
    status: m.status,
    addedOn: new Date(m.added_on).toLocaleDateString('en-GH', {
      year: 'numeric', month: 'short', day: 'numeric',
    }),
  };
}

// GET /api/team  (owner only)
router.get('/', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM team_members WHERE owner_id = $1 ORDER BY added_on ASC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/team  (owner only)
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['manager', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Role must be manager or cashier' });
    }

    const emailNorm = email.trim().toLowerCase();

    // Check duplicate within this owner's team
    const existing = await pool.query(
      'SELECT id FROM team_members WHERE owner_id=$1 AND email=$2',
      [req.user.ownerId, emailNorm]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already used by a team member' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO team_members (owner_id, first_name, last_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.ownerId, firstName, lastName, emailNorm, passwordHash, role]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/team/:id/status  — deactivate (owner only)
router.patch('/:id/status', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE team_members SET status = 'inactive'
       WHERE id=$1 AND owner_id=$2 RETURNING *`,
      [req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Team member not found' });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
