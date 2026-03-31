const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function format(p) {
  return {
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    costPrice: parseFloat(p.cost_price) || 0,
    category: p.category,
    createdAt: p.created_at,
  };
}

// GET /api/products
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE owner_id = $1 ORDER BY created_at ASC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/products  (owner or manager)
router.post('/', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, price, costPrice, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const { rows } = await pool.query(
      `INSERT INTO products (owner_id, name, price, cost_price, category)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.ownerId, name, price || 0, costPrice || 0, category || null]
    );
    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/products/:id  (owner or manager)
router.put('/:id', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, price, costPrice, category } = req.body;
    const { rows, rowCount } = await pool.query(
      `UPDATE products SET name=$1, price=$2, cost_price=$3, category=$4
       WHERE id=$5 AND owner_id=$6 RETURNING *`,
      [name, price, costPrice || 0, category || null, req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/products/:id  (owner or manager)
router.delete('/:id', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
