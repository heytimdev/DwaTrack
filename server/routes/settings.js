const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// PUT /api/settings/shop  (owner only)
router.put('/shop', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { businessName, businessEmail, phoneNumber, city, country, currency, businessLogo,
            taxEnabled, taxLabel, taxRate } = req.body;

    const { rows } = await pool.query(
      `UPDATE users
       SET business_name=$1, business_email=$2, phone_number=$3, city=$4, business_logo=$5,
           tax_enabled=$6, tax_label=$7, tax_rate=$8,
           country=$9, currency=$10
       WHERE id=$11
       RETURNING *`,
      [businessName, businessEmail, phoneNumber, city, businessLogo || null,
       taxEnabled || false, taxLabel || 'VAT', parseFloat(taxRate) || 0,
       country || 'Ghana', currency || 'GH₵',
       req.user.id]
    );

    const u = rows[0];
    res.json({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: 'owner',
      ownerId: u.id,
      businessName: u.business_name,
      businessEmail: u.business_email,
      phoneNumber: u.phone_number,
      city: u.city,
      country: u.country || 'Ghana',
      currency: u.currency || 'GH₵',
      businessLogo: u.business_logo,
      taxEnabled: u.tax_enabled,
      taxLabel: u.tax_label,
      taxRate: parseFloat(u.tax_rate),
      createdAt: u.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/password  (owner only)
router.put('/password', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
