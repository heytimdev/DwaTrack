require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const productRoutes     = require('./routes/products');
const expenseRoutes     = require('./routes/expenses');
const teamRoutes        = require('./routes/team');
const stockRoutes       = require('./routes/stock');
const settingsRoutes    = require('./routes/settings');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// 5 MB limit to accommodate base64 business logo images
app.use(express.json({ limit: '5mb' }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/products',     productRoutes);
app.use('/api/expenses',     expenseRoutes);
app.use('/api/team',         teamRoutes);
app.use('/api/stock',        stockRoutes);
app.use('/api/settings',     settingsRoutes);

app.get('/', (_req, res) => res.json({ message: 'KoboTrack API is running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`KoboTrack server running on http://localhost:${PORT}`);
});
