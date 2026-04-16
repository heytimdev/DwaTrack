const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, role: 'admin', email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── POST /api/admin/setup ─────────────────────────────────────────────────────
// One-time setup — only works when no admin exists yet.
router.post('/setup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await pool.query('SELECT id FROM admins LIMIT 1');
    if (existing.rows.length > 0) {
      return res.status(403).json({ error: 'Admin account already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO admins (name, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
      [name, email, hash]
    );

    const admin = rows[0];
    res.status(201).json({ admin, token: makeAdminToken(admin) });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/admin/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
      token: makeAdminToken(admin),
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
// Platform-wide summary numbers
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [businesses, transactions, revenue, team] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM transactions WHERE status = 'completed'"),
      pool.query("SELECT COALESCE(SUM(total),0) AS total FROM transactions WHERE status = 'completed'"),
      pool.query('SELECT COUNT(*) FROM team_members'),
    ]);

    res.json({
      totalBusinesses: parseInt(businesses.rows[0].count),
      totalTransactions: parseInt(transactions.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
      totalTeamMembers: parseInt(team.rows[0].count),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/businesses ─────────────────────────────────────────────────
// List all businesses with aggregated stats
router.get('/businesses', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.business_name,
        u.business_email,
        u.phone_number,
        u.country,
        u.currency,
        u.city,
        u.status,
        u.created_at,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed')           AS transaction_count,
        COALESCE(SUM(t.total) FILTER (WHERE t.status = 'completed'), 0)      AS total_revenue,
        COUNT(DISTINCT e.id)                                                  AS expense_count,
        COALESCE(SUM(e.amount), 0)                                            AS total_expenses,
        COUNT(DISTINCT tm.id)                                                 AS team_count,
        MAX(t.created_at)                                                     AS last_transaction_at
      FROM users u
      LEFT JOIN transactions  t  ON t.owner_id  = u.id
      LEFT JOIN expenses      e  ON e.owner_id  = u.id
      LEFT JOIN team_members  tm ON tm.owner_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json(rows.map(r => ({
      id:               r.id,
      ownerName:        `${r.first_name} ${r.last_name}`,
      email:            r.email,
      businessName:     r.business_name || 'Unnamed Business',
      businessEmail:    r.business_email,
      phoneNumber:      r.phone_number,
      country:          r.country,
      currency:         r.currency,
      city:             r.city,
      createdAt:        r.created_at,
      transactionCount: parseInt(r.transaction_count),
      totalRevenue:     parseFloat(r.total_revenue),
      expenseCount:     parseInt(r.expense_count),
      totalExpenses:    parseFloat(r.total_expenses),
      teamCount:        parseInt(r.team_count),
      lastTransactionAt: r.last_transaction_at,
      status:           r.status || 'active',
    })));
  } catch (err) {
    console.error('Admin businesses error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/businesses/:id ─────────────────────────────────────────────
// Detailed view: team members + recent transactions + recent expenses
router.get('/businesses/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [ownerRes, teamRes, txRes, expRes, stockRes, productsRes] = await Promise.all([
      pool.query(
        `SELECT u.*,
          COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'completed') AS transaction_count,
          COALESCE(SUM(t.total) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue,
          COALESCE(SUM(e.amount), 0) AS total_expenses
         FROM users u
         LEFT JOIN transactions t ON t.owner_id = u.id
         LEFT JOIN expenses     e ON e.owner_id = u.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      ),
      pool.query(
        `SELECT id, first_name, last_name, email, role, status, added_on
         FROM team_members WHERE owner_id = $1 ORDER BY added_on DESC`,
        [id]
      ),
      pool.query(
        `SELECT id, receipt_number, customer, total, payment_method,
                payment_status, added_by, status, created_at
         FROM transactions
         WHERE owner_id = $1
         ORDER BY created_at DESC LIMIT 20`,
        [id]
      ),
      pool.query(
        `SELECT id, description, amount, category, added_by, created_at
         FROM expenses WHERE owner_id = $1
         ORDER BY created_at DESC LIMIT 20`,
        [id]
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE quantity <= low_stock_threshold) AS low
         FROM stock WHERE owner_id = $1`,
        [id]
      ),
      pool.query(
        `SELECT p.id, p.name, p.price, p.cost_price, p.category,
                COALESCE(s.quantity, 0) AS stock_qty,
                COALESCE(s.low_stock_threshold, 0) AS threshold
         FROM products p
         LEFT JOIN stock s ON s.owner_id = p.owner_id AND LOWER(s.name) = LOWER(p.name)
         WHERE p.owner_id = $1
         ORDER BY p.name`,
        [id]
      ),
    ]);

    if (!ownerRes.rows.length) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const u = ownerRes.rows[0];
    res.json({
      business: {
        id:               u.id,
        ownerName:        `${u.first_name} ${u.last_name}`,
        email:            u.email,
        businessName:     u.business_name || 'Unnamed Business',
        businessEmail:    u.business_email,
        phoneNumber:      u.phone_number,
        country:          u.country,
        currency:         u.currency,
        city:             u.city,
        taxEnabled:       u.tax_enabled,
        taxLabel:         u.tax_label,
        taxRate:          parseFloat(u.tax_rate),
        createdAt:        u.created_at,
        transactionCount: parseInt(u.transaction_count),
        totalRevenue:     parseFloat(u.total_revenue),
        totalExpenses:    parseFloat(u.total_expenses),
        netProfit:        parseFloat(u.total_revenue) - parseFloat(u.total_expenses),
        stockTotal:       parseInt(stockRes.rows[0]?.total || 0),
        stockLow:         parseInt(stockRes.rows[0]?.low   || 0),
        status:           u.status || 'active',
      },
      team: teamRes.rows.map(m => ({
        id:        m.id,
        name:      `${m.first_name} ${m.last_name}`,
        email:     m.email,
        role:      m.role,
        status:    m.status,
        addedOn:   m.added_on,
      })),
      recentTransactions: txRes.rows,
      recentExpenses:     expRes.rows,
      products: productsRes.rows.map(p => ({
        id:        p.id,
        name:      p.name,
        price:     parseFloat(p.price),
        costPrice: parseFloat(p.cost_price),
        category:  p.category,
        stockQty:  parseInt(p.stock_qty),
        threshold: parseInt(p.threshold),
      })),
    });
  } catch (err) {
    console.error('Admin business detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/businesses/:id/status ────────────────────────────────────
router.patch('/businesses/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'status must be active or suspended' });
    }
    const { rows } = await pool.query(
      `UPDATE users SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Business not found' });
    res.json({ id: rows[0].id, status: rows[0].status });
  } catch (err) {
    console.error('Admin status update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/insights ───────────────────────────────────────────────────
router.get('/insights', requireAdmin, async (req, res) => {
  try {
    const [signupsRes, topRevenueRes, dormantRes, revenueByMonthRes] = await Promise.all([
      // Signups per month — last 6 months
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
               DATE_TRUNC('month', created_at) AS month_date,
               COUNT(*) AS count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_date, month
        ORDER BY month_date
      `),
      // Top 5 businesses by revenue
      pool.query(`
        SELECT u.id, u.business_name, u.first_name, u.last_name, u.currency,
               COALESCE(SUM(t.total) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue,
               COUNT(t.id) FILTER (WHERE t.status = 'completed') AS tx_count
        FROM users u
        LEFT JOIN transactions t ON t.owner_id = u.id
        GROUP BY u.id
        ORDER BY total_revenue DESC
        LIMIT 5
      `),
      // Dormant businesses — no transaction in last 30 days
      pool.query(`
        SELECT u.id, u.business_name, u.first_name, u.last_name,
               MAX(t.created_at) AS last_tx
        FROM users u
        LEFT JOIN transactions t ON t.owner_id = u.id
        GROUP BY u.id
        HAVING MAX(t.created_at) < NOW() - INTERVAL '30 days'
            OR MAX(t.created_at) IS NULL
        ORDER BY last_tx ASC NULLS FIRST
      `),
      // Platform revenue by month — last 6 months
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
               DATE_TRUNC('month', created_at) AS month_date,
               COALESCE(SUM(total), 0) AS revenue
        FROM transactions
        WHERE status = 'completed'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month_date, month
        ORDER BY month_date
      `),
    ]);

    res.json({
      signupsByMonth:   signupsRes.rows.map(r => ({ month: r.month, count: parseInt(r.count) })),
      topByRevenue:     topRevenueRes.rows.map(r => ({
        id:           r.id,
        businessName: r.business_name || 'Unnamed Business',
        ownerName:    `${r.first_name} ${r.last_name}`,
        currency:     r.currency,
        totalRevenue: parseFloat(r.total_revenue),
        txCount:      parseInt(r.tx_count),
      })),
      dormantBusinesses: dormantRes.rows.map(r => ({
        id:           r.id,
        businessName: r.business_name || 'Unnamed Business',
        ownerName:    `${r.first_name} ${r.last_name}`,
        lastTx:       r.last_tx,
      })),
      revenueByMonth: revenueByMonthRes.rows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) })),
    });
  } catch (err) {
    console.error('Admin insights error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/notifications ──────────────────────────────────────────────
router.get('/notifications', requireAdmin, async (req, res) => {
  try {
    const [newSignupsRes, highVoidRes] = await Promise.all([
      // New signups in last 7 days
      pool.query(`
        SELECT id, first_name, last_name, business_name, email, created_at
        FROM users
        WHERE created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
      `),
      // Businesses with high void rate (>= 20% of transactions voided, min 5 transactions)
      pool.query(`
        SELECT u.id, u.business_name, u.first_name, u.last_name,
               COUNT(*) AS total_tx,
               COUNT(*) FILTER (WHERE t.status = 'voided') AS voided_tx,
               ROUND(
                 COUNT(*) FILTER (WHERE t.status = 'voided')::numeric
                 / NULLIF(COUNT(*), 0) * 100, 1
               ) AS void_rate
        FROM users u
        JOIN transactions t ON t.owner_id = u.id
        GROUP BY u.id
        HAVING COUNT(*) >= 5
           AND (COUNT(*) FILTER (WHERE t.status = 'voided')::numeric / COUNT(*)) >= 0.2
        ORDER BY void_rate DESC
      `),
    ]);

    res.json({
      newSignups: newSignupsRes.rows.map(r => ({
        id:           r.id,
        name:         `${r.first_name} ${r.last_name}`,
        businessName: r.business_name || 'Unnamed Business',
        email:        r.email,
        createdAt:    r.created_at,
      })),
      highVoidRate: highVoidRes.rows.map(r => ({
        id:           r.id,
        businessName: r.business_name || 'Unnamed Business',
        ownerName:    `${r.first_name} ${r.last_name}`,
        totalTx:      parseInt(r.total_tx),
        voidedTx:     parseInt(r.voided_tx),
        voidRate:     parseFloat(r.void_rate),
      })),
    });
  } catch (err) {
    console.error('Admin notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
