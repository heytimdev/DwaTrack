const express   = require('express');
const pool      = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const logAction = require('../helpers/audit');

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
// Also creates a matching stock entry if one doesn't already exist.
router.post('/', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, price, costPrice, category, quantity, unit, lowStockThreshold } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const { rows } = await pool.query(
      `INSERT INTO products (owner_id, name, price, cost_price, category)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.ownerId, name, price || 0, costPrice || 0, category || null]
    );
    const p = rows[0];

    // Cross-create a stock entry if none exists with this name for this owner
    await pool.query(
      `INSERT INTO stock (owner_id, name, quantity, unit, low_stock_threshold)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM stock WHERE owner_id = $1 AND LOWER(name) = LOWER($2)
       )`,
      [req.user.ownerId, name, Number(quantity) || 0, unit || 'pcs', Number(lowStockThreshold) || 5]
    );

    logAction(req, 'product.add', 'product', p.id, { name: p.name, price: p.price });
    res.status(201).json(format(p));
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
    logAction(req, 'product.update', 'product', parseInt(req.params.id), { name, price, costPrice });
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
    logAction(req, 'product.delete', 'product', parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
