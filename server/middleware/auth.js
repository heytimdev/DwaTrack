const jwt = require('jsonwebtoken');

/**
 * Attach decoded JWT payload to req.user.
 * Payload shape: { id, role, ownerId }
 *   - owners:       ownerId === id
 *   - team members: ownerId === their owner's id
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * After requireAuth — gate to specific roles only.
 * Usage: requireRole('owner') or requireRole('owner', 'manager')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
