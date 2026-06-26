const pool = require('../db');

/**
 * Insert one row into audit_log.
 * Always fire-and-forget — a logging failure must never break the calling route.
 *
 * @param {object} req  - Express request (provides actor info from req.user)
 * @param {string} action       - e.g. 'transaction.add', 'expense.delete'
 * @param {string} entityType   - e.g. 'transaction', 'expense'
 * @param {number} entityId     - PK of the affected row (optional)
 * @param {object} detail       - arbitrary JSON snapshot of the change (optional)
 */
function logAction(req, action, entityType, entityId, detail) {
  const { id, ownerId, role } = req.user;
  const actorName = `${req.body?.firstName || ''} ${req.body?.lastName || ''}`.trim() || null;

  pool.query(
    `INSERT INTO audit_log (owner_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, detail)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [ownerId, id, actorName || null, role, action, entityType || null, entityId || null, detail ? JSON.stringify(detail) : null]
  ).catch((err) => console.error('audit log insert failed:', err.message));
}

module.exports = logAction;
