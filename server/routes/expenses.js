const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function format(e) {
  const date = new Date(e.created_at);
  return {
    id: e.id,
    description: e.description,
    amount: parseFloat(e.amount),
    category: e.category,
    addedBy: e.added_by,
    date: date.toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' }),
    createdAt: e.created_at,
  };
}

// GET /api/expenses
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/expenses  (owner or manager)
router.post('/', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { description, amount, category } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    const addedBy = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim() || 'Unknown';

    const { rows } = await pool.query(
      `INSERT INTO expenses (owner_id, description, amount, category, added_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.ownerId, description, amount || 0, category || null, addedBy]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/expenses/:id  (owner or manager)
router.delete('/:id', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM expenses WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
