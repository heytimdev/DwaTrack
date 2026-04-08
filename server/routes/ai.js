const express = require('express');
const Groq = require('groq-sdk');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

let groq;
function getClient() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

const MODEL = 'llama-3.3-70b-versatile';

// ── POST /api/ai/daily-summary ────────────────────────────────────────────────
router.post('/daily-summary', requireAuth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [txResult, userResult] = await Promise.all([
      pool.query(
        'SELECT * FROM transactions WHERE owner_id = $1 AND created_at >= $2 ORDER BY created_at',
        [ownerId, today]
      ),
      pool.query('SELECT business_name, currency FROM users WHERE id = $1', [ownerId]),
    ]);

    const shopName = userResult.rows[0]?.business_name || 'your shop';
    const currency = userResult.rows[0]?.currency || 'GH₵';

    if (txResult.rows.length === 0) {
      return res.json({
        summary: `No sales have been recorded at ${shopName} today yet. Once you start making sales, I'll give you a full end-of-day summary here.`,
      });
    }

    const txs = txResult.rows;
    const totalRevenue = txs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);

    const productMap = {};
    let totalItemsSold = 0;
    txs.forEach((t) => {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
      items.forEach((item) => {
        const name = item.productName || 'Unknown';
        if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
        productMap[name].qty += item.qty || 0;
        productMap[name].revenue += (item.price || 0) * (item.qty || 0);
        totalItemsSold += item.qty || 0;
      });
    });

    const productLines = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, d]) => `  - ${name}: ${d.qty} units sold, ${currency}${d.revenue.toFixed(2)} revenue`)
      .join('\n');

    const paymentMethods = [...new Set(txs.map((t) => t.payment_method))].join(', ');

    const dataText = [
      `Shop: ${shopName}`,
      `Date: ${new Date().toDateString()}`,
      `Total transactions: ${txs.length}`,
      `Total revenue: ${currency}${totalRevenue.toFixed(2)}`,
      `Total items sold: ${totalItemsSold}`,
      `Payment methods used: ${paymentMethods}`,
      `Product breakdown:\n${productLines}`,
    ].join('\n');

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: `You are a no-nonsense business advisor who speaks like a trusted friend, not a bot. Given today's sales data, write exactly 2 sentences: the first states what the business made today and what sold most. The second gives one sharp, specific action the owner can take tomorrow based on the actual data. Be direct and confident. No greetings, no "Great job", no filler phrases, no markdown.\n\n${dataText}`,
        },
      ],
    });

    res.json({ summary: completion.choices[0].message.content });
  } catch (err) {
    console.error('[AI daily-summary]', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ── POST /api/ai/restock ──────────────────────────────────────────────────────
router.post('/restock', requireAuth, async (req, res) => {
  try {
    const ownerId = req.user.ownerId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stockResult, txResult, userResult] = await Promise.all([
      pool.query('SELECT * FROM stock WHERE owner_id = $1', [ownerId]),
      pool.query(
        'SELECT items FROM transactions WHERE owner_id = $1 AND created_at >= $2',
        [ownerId, thirtyDaysAgo]
      ),
      pool.query('SELECT currency FROM users WHERE id = $1', [ownerId]),
    ]);

    const currency = userResult.rows[0]?.currency || 'GH₵';

    if (stockResult.rows.length === 0) {
      return res.json({
        suggestions: 'No stock items are being tracked yet. Add items to your stock page and I can give you smart restock recommendations based on your sales velocity.',
      });
    }

    const salesMap = {};
    txResult.rows.forEach((t) => {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
      items.forEach((item) => {
        const name = (item.productName || '').toLowerCase();
        if (name) salesMap[name] = (salesMap[name] || 0) + (item.qty || 0);
      });
    });

    const stockLines = stockResult.rows
      .map((s) => {
        const sold30 = salesMap[s.name.toLowerCase()] || 0;
        const dailyRate = sold30 / 30;
        const daysLeft = dailyRate > 0 ? Math.floor(s.quantity / dailyRate) : null;
        const urgency =
          s.quantity === 0 ? 'OUT OF STOCK' :
          s.quantity <= s.low_stock_threshold ? 'LOW STOCK' : 'OK';
        return `- ${s.name} [${urgency}]: ${s.quantity} in stock (threshold: ${s.low_stock_threshold}), sold ${sold30} units in 30 days${daysLeft !== null ? `, ~${daysLeft} days of stock remaining` : ''}`;
      })
      .join('\n');

    const completion = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a sharp inventory advisor. Look at this stock data and tell the owner exactly what needs restocking and why — based on actual sales velocity, not guesses. Be specific: name the item, state the urgency, and say how much to restock if you can calculate it. Maximum 3 items. One sentence each. No bullet points, no markdown, no generic advice. If everything looks fine, say so in one sentence.\n\n${stockLines}`,
        },
      ],
    });

    res.json({ suggestions: completion.choices[0].message.content });
  } catch (err) {
    console.error('[AI restock]', err);
    res.status(500).json({ error: 'Failed to generate restock suggestions' });
  }
});

// ── POST /api/ai/chat  (streaming SSE) ───────────────────────────────────────
router.post('/chat', requireAuth, async (req, res) => {
  const ownerId = req.user.ownerId;
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const [txResult, productResult, expenseResult, stockResult, userResult] = await Promise.all([
      pool.query(
        'SELECT * FROM transactions WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 200',
        [ownerId]
      ),
      pool.query('SELECT * FROM products WHERE owner_id = $1', [ownerId]),
      pool.query(
        'SELECT * FROM expenses WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 100',
        [ownerId]
      ),
      pool.query('SELECT * FROM stock WHERE owner_id = $1', [ownerId]),
      pool.query('SELECT business_name, currency, country FROM users WHERE id = $1', [ownerId]),
    ]);

    const currency = userResult.rows[0]?.currency || 'GH₵';
    const shopName = userResult.rows[0]?.business_name || 'this shop';

    const txs = txResult.rows;
    const totalRevenue = txs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);
    const totalExpenses = expenseResult.rows.reduce((s, e) => s + parseFloat(e.amount), 0);

    const todayStr = new Date().toDateString();
    const todayTxs = txs.filter((t) => new Date(t.created_at).toDateString() === todayStr);
    const todayRevenue = todayTxs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);

    const productMap = {};
    txs.forEach((t) => {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
      items.forEach((item) => {
        const name = item.productName || 'Unknown';
        if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
        productMap[name].qty += item.qty || 0;
        productMap[name].revenue += (item.price || 0) * (item.qty || 0);
      });
    });

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([name, d]) => `${name}: ${d.qty} sold, ${currency}${d.revenue.toFixed(2)}`)
      .join('; ');

    const lowStock = stockResult.rows
      .filter((s) => s.quantity <= s.low_stock_threshold)
      .map((s) => `${s.name} (${s.quantity} left)`);

    const systemPrompt = `You are a sharp business advisor for "${shopName}". You speak like a trusted CFO — direct, confident, and data-driven. Never use filler phrases like "Great question" or "Certainly". Never use bullet points or markdown. Use ${currency} for money. Answer in 2–4 sentences max unless the question genuinely needs more. If the data shows something concerning, say it plainly.

Current business data:
- Total transactions: ${txs.length}
- All-time revenue: ${currency}${totalRevenue.toFixed(2)}
- All-time expenses: ${currency}${totalExpenses.toFixed(2)}
- Net profit: ${currency}${(totalRevenue - totalExpenses).toFixed(2)}
- Today's revenue: ${currency}${todayRevenue.toFixed(2)} (${todayTxs.length} sales today)
- Products in catalog: ${productResult.rows.length}
- Stock items tracked: ${stockResult.rows.length}
- Low stock alerts: ${lowStock.length > 0 ? lowStock.join(', ') : 'None'}
- Top products: ${topProducts || 'No sales data yet'}`;

    // Streaming SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const stream = await getClient().chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[AI chat]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
