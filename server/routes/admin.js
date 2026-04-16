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

    const [ownerRes, teamRes, txRes, expRes, stockRes] = await Promise.all([
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
    });
  } catch (err) {
    console.error('Admin business detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
