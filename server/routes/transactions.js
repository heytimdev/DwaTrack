const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function generateReceiptNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${y}${m}${d}-${rand}`;
}

function format(tx) {
  const date = new Date(tx.created_at);
  return {
    id: tx.id,
    receiptNumber: tx.receipt_number,
    customer: tx.customer || 'Walk-in Customer',
    items: tx.items,
    total: parseFloat(tx.total),
    taxLabel: tx.tax_label || null,
    taxAmount: parseFloat(tx.tax_amount) || 0,
    paymentMethod: tx.payment_method,
    addedBy: tx.added_by,
    status: tx.status || 'completed',
    date: date.toLocaleDateString('en-GH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
    createdAt: tx.created_at,
  };
}

// GET /api/transactions
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM transactions WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.ownerId]
    );
    res.json(rows.map(format));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/transactions
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items, total, paymentMethod, customer } = req.body;
    const addedBy = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim()
      || 'Unknown';

    const receiptNumber = generateReceiptNumber();

    const { taxLabel, taxAmount } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO transactions (owner_id, receipt_number, customer, items, total, tax_label, tax_amount, payment_method, added_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [req.user.ownerId, receiptNumber, customer || 'Walk-in Customer',
       JSON.stringify(items || []), total || 0,
       taxLabel || null, parseFloat(taxAmount) || 0,
       paymentMethod || 'cash', addedBy]
    );

    // Deduct matching stock quantities
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.productName && item.qty) {
          await pool.query(
            `UPDATE stock
             SET    quantity = GREATEST(0, quantity - $1)
             WHERE  owner_id = $2 AND LOWER(name) = LOWER($3)`,
            [item.qty, req.user.ownerId, item.productName]
          );
        }
      }
    }

    res.status(201).json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/transactions/:id/void  (owner or manager)
router.patch('/:id/void', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A void reason is required' });
    }
    const { rows, rowCount } = await pool.query(
      `UPDATE transactions
       SET status = 'voided', void_reason = $1, voided_at = NOW()
       WHERE id = $2 AND owner_id = $3 AND status = 'completed'
       RETURNING *`,
      [reason.trim(), req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Transaction not found or already voided' });
    res.json(format(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/transactions/:id  (owner only)
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.ownerId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
