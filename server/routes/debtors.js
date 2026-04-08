const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/debtors
// Returns every customer that has at least one outstanding credit balance,
// with total_outstanding and a count of open debts.
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.id                                                          AS customer_id,
         c.name,
         c.phone,
         COUNT(DISTINCT t.id)                                          AS open_debts,
         SUM(t.total - t.amount_paid - COALESCE(dp_sum.paid, 0))      AS total_outstanding,
         MAX(t.created_at)                                             AS last_activity
       FROM customers c
       JOIN transactions t
         ON  t.customer_id = c.id
         AND t.owner_id    = c.owner_id
         AND t.payment_status IN ('credit', 'partial')
       LEFT JOIN (
         SELECT transaction_id, SUM(amount) AS paid
         FROM   debt_payments
         WHERE  owner_id = $1
         GROUP  BY transaction_id
       ) dp_sum ON dp_sum.transaction_id = t.id
       WHERE c.owner_id = $1
       GROUP BY c.id, c.name, c.phone
       HAVING SUM(t.total - t.amount_paid - COALESCE(dp_sum.paid, 0)) > 0
       ORDER BY total_outstanding DESC`,
      [req.user.ownerId]
    );

    res.json(
      rows.map((r) => ({
        customerId:       r.customer_id,
        name:             r.name,
        phone:            r.phone || null,
        openDebts:        parseInt(r.open_debts),
        totalOutstanding: parseFloat(r.total_outstanding),
        lastActivity:     r.last_activity,
      }))
    );
  } catch (err) {
    console.error('[debtors GET /]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/debtors/:customerId
// Returns all open credit transactions for this customer with their payment history.
router.get('/:customerId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.receipt_number,
         t.total,
         t.amount_paid,
         t.payment_status,
         t.created_at,
         COALESCE(dp_sum.paid, 0)                              AS payments_made,
         t.total - t.amount_paid - COALESCE(dp_sum.paid, 0)   AS outstanding
       FROM transactions t
       LEFT JOIN (
         SELECT transaction_id, SUM(amount) AS paid
         FROM   debt_payments
         WHERE  owner_id = $1
         GROUP  BY transaction_id
       ) dp_sum ON dp_sum.transaction_id = t.id
       WHERE t.customer_id = $2
         AND t.owner_id    = $1
         AND t.payment_status IN ('credit', 'partial')
       ORDER BY t.created_at DESC`,
      [req.user.ownerId, req.params.customerId]
    );

    // Also pull individual payment records for each transaction
    const txIds = rows.map((r) => r.id);
    let payments = [];
    if (txIds.length > 0) {
      const { rows: pRows } = await pool.query(
        `SELECT * FROM debt_payments
         WHERE owner_id = $1 AND transaction_id = ANY($2::uuid[])
         ORDER BY created_at ASC`,
        [req.user.ownerId, txIds]
      );
      payments = pRows;
    }

    const paymentsByTx = {};
    payments.forEach((p) => {
      if (!paymentsByTx[p.transaction_id]) paymentsByTx[p.transaction_id] = [];
      paymentsByTx[p.transaction_id].push({
        id:          p.id,
        amount:      parseFloat(p.amount),
        note:        p.note || null,
        recordedBy:  p.recorded_by || null,
        createdAt:   p.created_at,
      });
    });

    res.json(
      rows.map((r) => ({
        id:             r.id,
        receiptNumber:  r.receipt_number,
        total:          parseFloat(r.total),
        amountPaid:     parseFloat(r.amount_paid),
        paymentsMade:   parseFloat(r.payments_made),
        outstanding:    parseFloat(r.outstanding),
        paymentStatus:  r.payment_status,
        createdAt:      r.created_at,
        payments:       paymentsByTx[r.id] || [],
      }))
    );
  } catch (err) {
    console.error('[debtors GET /:customerId]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/debtors/payments
// Record a payment against an open credit transaction.
// Body: { transactionId, amount, note? }
router.post('/payments', requireAuth, requireRole('owner', 'manager'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { transactionId, amount, note } = req.body;

    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' });
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: 'amount must be a positive number' });

    await client.query('BEGIN');

    // Lock the transaction row
    const { rows: txRows } = await client.query(
      `SELECT id, total, amount_paid, payment_status
       FROM transactions
       WHERE id = $1 AND owner_id = $2 AND payment_status IN ('credit','partial')
       FOR UPDATE`,
      [transactionId, req.user.ownerId]
    );
    if (!txRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Credit transaction not found' });
    }

    const tx = txRows[0];

    // Sum existing debt payments
    const { rows: sumRows } = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS already_paid
       FROM debt_payments WHERE transaction_id = $1`,
      [transactionId]
    );
    const alreadyPaid = parseFloat(sumRows[0].already_paid);
    const outstanding = parseFloat(tx.total) - parseFloat(tx.amount_paid) - alreadyPaid;

    if (amt > outstanding + 0.001) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Payment (${amt}) exceeds outstanding balance (${outstanding.toFixed(2)})`,
      });
    }

    const recordedBy = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim() || null;

    // Insert the payment
    const { rows: payRows } = await client.query(
      `INSERT INTO debt_payments (owner_id, transaction_id, amount, note, recorded_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.ownerId, transactionId, amt, note?.trim() || null, recordedBy]
    );

    // Check if fully settled
    const newOutstanding = outstanding - amt;
    if (newOutstanding <= 0.001) {
      await client.query(
        `UPDATE transactions SET payment_status = 'paid' WHERE id = $1`,
        [transactionId]
      );
    } else if (tx.payment_status === 'credit') {
      // First partial payment — move to partial
      await client.query(
        `UPDATE transactions SET payment_status = 'partial' WHERE id = $1`,
        [transactionId]
      );
    }

    await client.query('COMMIT');

    const p = payRows[0];
    res.status(201).json({
      id:            p.id,
      transactionId: p.transaction_id,
      amount:        parseFloat(p.amount),
      note:          p.note || null,
      recordedBy:    p.recorded_by || null,
      createdAt:     p.created_at,
      nowPaid:       newOutstanding <= 0.001,
      outstanding:   Math.max(0, newOutstanding),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[debtors POST /payments]', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
