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
        "SELECT * FROM transactions WHERE owner_id = $1 AND created_at >= $2 AND status != 'voided' ORDER BY created_at",
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
        "SELECT items FROM transactions WHERE owner_id = $1 AND created_at >= $2 AND status != 'voided'",
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

    const allTxs  = txResult.rows;
    const txs     = allTxs.filter((t) => t.status !== 'voided');
    const voidedCount = allTxs.length - txs.length;

    const totalRevenue  = txs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);
    const totalExpenses = expenseResult.rows.reduce((s, e) => s + parseFloat(e.amount), 0);

    // Today
    const todayStr    = new Date().toDateString();
    const todayTxs    = txs.filter((t) => new Date(t.created_at).toDateString() === todayStr);
    const todayRevenue = todayTxs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);

    // Month-over-month
    const now            = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const thisMonthTxs = txs.filter((t) => new Date(t.created_at) >= thisMonthStart);
    const lastMonthTxs = txs.filter((t) => {
      const d = new Date(t.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const thisMonthRevenue = thisMonthTxs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);
    const lastMonthRevenue = lastMonthTxs.reduce((s, t) => s + (parseFloat(t.total) - parseFloat(t.tax_amount || 0)), 0);

    // Day-of-week breakdown
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = {};
    txs.forEach((t) => {
      const day = DAY_NAMES[new Date(t.created_at).getDay()];
      if (!dayMap[day]) dayMap[day] = { revenue: 0, count: 0 };
      dayMap[day].revenue += parseFloat(t.total) - parseFloat(t.tax_amount || 0);
      dayMap[day].count++;
    });
    const bestDay = Object.entries(dayMap).sort((a, b) => b[1].revenue - a[1].revenue)[0];
    const dayBreakdown = DAY_NAMES
      .filter((d) => dayMap[d])
      .map((d) => `${d}: ${dayMap[d].count} sales, ${currency}${dayMap[d].revenue.toFixed(2)}`)
      .join('; ');

    // Payment method breakdown
    const payMap = {};
    txs.forEach((t) => {
      const rev = parseFloat(t.total) - parseFloat(t.tax_amount || 0);
      const m   = t.payment_method || 'cash';
      payMap[m] = (payMap[m] || 0) + rev;
    });
    const paymentBreakdown = Object.entries(payMap)
      .sort((a, b) => b[1] - a[1])
      .map(([m, v]) => `${m}: ${currency}${v.toFixed(2)}`)
      .join('; ');

    // All-time product map
    const productMap = {};
    txs.forEach((t) => {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
      items.forEach((item) => {
        const name = item.productName || 'Unknown';
        if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 };
        productMap[name].qty     += item.qty || 0;
        productMap[name].revenue += (item.price || 0) * (item.qty || 0);
      });
    });

    // This month's product map
    const thisMonthProductMap = {};
    thisMonthTxs.forEach((t) => {
      const items = typeof t.items === 'string' ? JSON.parse(t.items) : (t.items || []);
      items.forEach((item) => {
        const name = item.productName || 'Unknown';
        if (!thisMonthProductMap[name]) thisMonthProductMap[name] = { qty: 0, revenue: 0 };
        thisMonthProductMap[name].qty     += item.qty || 0;
        thisMonthProductMap[name].revenue += (item.price || 0) * (item.qty || 0);
      });
    });

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([name, d]) => `${name}: ${d.qty} sold, ${currency}${d.revenue.toFixed(2)}`)
      .join('; ');

    const thisMonthTopProducts = Object.entries(thisMonthProductMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([name, d]) => `${name}: ${d.qty} sold, ${currency}${d.revenue.toFixed(2)}`)
      .join('; ');

    // Expense categories
    const expCatMap = {};
    expenseResult.rows.forEach((e) => {
      expCatMap[e.category] = (expCatMap[e.category] || 0) + parseFloat(e.amount);
    });
    const expenseCategories = Object.entries(expCatMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: ${currency}${amt.toFixed(2)}`)
      .join('; ');

    const lowStock = stockResult.rows
      .filter((s) => s.quantity <= s.low_stock_threshold)
      .map((s) => `${s.name} (${s.quantity} left)`);

    const today   = new Date();
    const dateStr = today.toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const thisMonthName = today.toLocaleDateString('en-GH', { month: 'long' });
    const lastMonthName = new Date(today.getFullYear(), today.getMonth() - 1).toLocaleDateString('en-GH', { month: 'long' });

    const systemPrompt = `You are Kemi, the AI business assistant built into DwaTrack — a business tracking app used by small businesses in Ghana and across Africa. You were created to help business owners understand their numbers, make smarter decisions, and run better businesses.

Your personality:
- Warm, friendly, and conversational — like a smart friend who happens to know business and finance
- Direct and honest — if the numbers look bad, say so plainly without sugarcoating
- Encouraging without being fake — no hollow praise like "Great question!" or "Absolutely!"
- Concise — 1 to 4 sentences unless the question genuinely needs more detail
- Never use markdown, bullet points, or headers in your responses — plain conversational text only
- Use ${currency} whenever you mention money

How to handle different types of messages:
- Greetings → Greet back warmly, introduce yourself as Kemi the DwaTrack assistant, invite them to ask about their business, mention today's date naturally
- Small talk or personal questions → Respond briefly, then steer back to business
- Business questions → Answer using the exact data below. Be specific with numbers
- Questions you cannot answer from the data → Be honest, suggest what they could track to get the answer
- Rude or irrelevant messages → Respond calmly, redirect to how you can help

Today is ${dateStr}.
Business: "${shopName}"

=== BUSINESS DATA ===

OVERVIEW
- All-time completed transactions: ${txs.length} (${voidedCount} voided)
- All-time revenue: ${currency}${totalRevenue.toFixed(2)}
- All-time expenses: ${currency}${totalExpenses.toFixed(2)}
- Net profit (all-time): ${currency}${(totalRevenue - totalExpenses).toFixed(2)}
- Profit margin: ${totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%

TODAY
- Revenue today: ${currency}${todayRevenue.toFixed(2)} from ${todayTxs.length} sale${todayTxs.length !== 1 ? 's' : ''}

MONTH-OVER-MONTH
- ${thisMonthName} revenue: ${currency}${thisMonthRevenue.toFixed(2)} from ${thisMonthTxs.length} sales
- ${lastMonthName} revenue: ${currency}${lastMonthRevenue.toFixed(2)} from ${lastMonthTxs.length} sales
- Change: ${lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) + '%' : 'no comparison available'}

SALES BY DAY OF WEEK (all-time)
- ${dayBreakdown || 'Not enough data yet'}
- Busiest day: ${bestDay ? `${bestDay[0]} (${bestDay[1].count} sales, ${currency}${bestDay[1].revenue.toFixed(2)})` : 'Not enough data'}

PAYMENT METHODS (all-time revenue)
- ${paymentBreakdown || 'No sales recorded yet'}

PRODUCTS — THIS MONTH
- ${thisMonthTopProducts || 'No sales this month'}

PRODUCTS — ALL TIME (top 8)
- ${topProducts || 'No sales recorded yet'}

EXPENSES
- Total expenses: ${currency}${totalExpenses.toFixed(2)}
- By category: ${expenseCategories || 'No expenses recorded'}

STOCK
- Items tracked: ${stockResult.rows.length}
- Low stock alerts: ${lowStock.length > 0 ? lowStock.join(', ') : 'None'}
- Products in catalogue: ${productResult.rows.length}`;

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
      max_tokens: 800,
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
