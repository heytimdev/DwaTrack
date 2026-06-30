const express   = require('express');
const pool      = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const logAction = require('../helpers/audit');

const router = express.Router();

function format(s) {
  return {
    id: s.id,
    name: s.name,
    quantity: s.quantity,
    unit: s.unit || 'pcs',
    lowStockThreshold: s.low_stock_threshold,
    addedOn: new Date(s.added_on).toLocaleDateString('en-GH', {
      year: 'numeric', month: 'short', day: 'numeric',
    }),
  };
}

// GET /api/stock
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM stock WHERE owner_id = $1 ORDER BY added_on ASC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/stock  (owner or manager)
// Also creates a matching product entry if one doesn't already exist.
router.post('/', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, quantity, unit, lowStockThreshold, price, costPrice, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await pool.query(
      `INSERT INTO stock (owner_id, name, quantity, unit, low_stock_threshold)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.ownerId, name, Number(quantity) || 0, unit || 'pcs', Number(lowStockThreshold) || 5]
    );
    const s = rows[0];

    // Cross-create a product entry if none exists with this name for this owner
    await pool.query(
      `INSERT INTO products (owner_id, name, price, cost_price, category)
       SELECT $1::uuid, $2::text, $3::numeric, $4::numeric, $5::text
       WHERE NOT EXISTS (
         SELECT 1 FROM products WHERE owner_id = $1::uuid AND LOWER(name) = LOWER($2::text)
       )`,
      [req.user.ownerId, name, Number(price) || 0, Number(costPrice) || 0, category || null]
    );

    logAction(req, 'stock.add', 'stock', s.id, { name: s.name, quantity: s.quantity });
    res.status(201).json(format(s));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/stock/:id  (owner or manager)
router.put('/:id', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, quantity, unit, lowStockThreshold } = req.body;
    const { rows, rowCount } = await pool.query(
      `UPDATE stock SET name=$1, quantity=$2, unit=$3, low_stock_threshold=$4
       WHERE id=$5 AND owner_id=$6 RETURNING *`,
      [name, Number(quantity) || 0, unit || 'pcs', Number(lowStockThreshold) || 5,
       req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Stock item not found' });
    logAction(req, 'stock.update', 'stock', req.params.id, { name, quantity, lowStockThreshold });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/stock/:id/restock  (owner or manager)
router.patch('/:id/restock', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { addQty } = req.body;
    if (!addQty || isNaN(addQty)) {
      return res.status(400).json({ error: 'addQty must be a number' });
    }
    const { rows, rowCount } = await pool.query(
      `UPDATE stock SET quantity = quantity + $1
       WHERE id=$2 AND owner_id=$3 RETURNING *`,
      [Number(addQty), req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Stock item not found' });
    logAction(req, 'stock.restock', 'stock', req.params.id, { addQty: Number(addQty) });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/stock/:id  (owner or manager)
router.delete('/:id', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM stock WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Stock item not found' });
    logAction(req, 'stock.delete', 'stock', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
