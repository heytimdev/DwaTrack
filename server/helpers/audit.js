const pool = require('../db');

/**
 * Insert one row into audit_log.
 * Always fire-and-forget — a logging failure must never break the calling route.
 */
async function logAction(req, action, entityType, entityId, detail) {
  try {
    const { id, ownerId, role } = req.user;

    // Prefer name from request body (add operations include it); fall back to DB
    let actorName =
      `${req.body?.firstName || ''} ${req.body?.lastName || ''}`.trim() || null;

    if (!actorName) {
      const table = role === 'owner' ? 'users' : 'team_members';
      const { rows } = await pool.query(
        `SELECT first_name, last_name FROM ${table} WHERE id = $1`,
        [id]
      );
      if (rows[0]) {
        actorName = `${rows[0].first_name} ${rows[0].last_name}`.trim();
      }
    }

    await pool.query(
      `INSERT INTO audit_log
         (owner_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        ownerId, id, actorName || null, role,
        action, entityType || null,
        entityId || null,
        detail || null,
      ]
    );
  } catch (err) {
    console.error('audit log insert failed:', err.message);
  }
}

module.exports = logAction;
