const express  = require('express');
const pool     = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/audit?page=1&limit=50&action=transaction.delete
// Owner-only — shows all activity across their shop including team actions
router.get('/', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const action = req.query.action || null;

    const params  = [req.user.ownerId, limit, offset];
    const filter  = action ? `AND action = $4` : '';
    if (action) params.push(action);

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT * FROM audit_log
         WHERE owner_id = $1 ${filter}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM audit_log WHERE owner_id = $1 ${filter}`,
        action ? [req.user.ownerId, action] : [req.user.ownerId]
      ),
    ]);

    const total = parseInt(countRow.rows[0].count);

    res.json({
      entries: rows.rows.map((r) => ({
        id:         r.id,
        actorName:  r.actor_name,
        actorRole:  r.actor_role,
        action:     r.action,
        entityType: r.entity_type,
        entityId:   r.entity_id,
        detail:     r.detail,
        createdAt:  r.created_at,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
