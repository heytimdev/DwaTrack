const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function format(c) {
  return {
    id:        c.id,
    name:      c.name,
    phone:     c.phone || null,
    createdAt: c.created_at,
  };
}

// GET /api/customers
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE owner_id = $1 ORDER BY name ASC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/customers
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO customers (owner_id, name, phone)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.ownerId, name.trim(), phone?.trim() || null]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/customers/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const { rows, rowCount } = await pool.query(
      `UPDATE customers SET name=$1, phone=$2
       WHERE id=$3 AND owner_id=$4 RETURNING *`,
      [name?.trim(), phone?.trim() || null, req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Customer not found' });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
