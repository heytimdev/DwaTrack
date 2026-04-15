const fs = require('fs');

const W = 2400, H = 1500;
const cx = W / 2, cy = H / 2;

// ── External entities: [id, label lines, x, y, fill] ──────────────────────────
const entities = [
  { id: 'OW', lines: ['👤 Owner'],              x: cx,        y: 130,       fill: '#1e40af' },
  { id: 'MG', lines: ['👤 Manager'],            x: 220,       y: cy - 160,  fill: '#2563eb' },
  { id: 'CS', lines: ['👤 Cashier'],            x: 220,       y: cy + 160,  fill: '#7c3aed' },
  { id: 'GV', lines: ['🏛️ Tax Authority'],     x: cx,        y: H - 130,   fill: '#b45309' },
  { id: 'GR', lines: ['🤖 Groq AI'],           x: W - 220,   y: cy - 160,  fill: '#1f2937' },
  { id: 'SM', lines: ['📧 SMTP Email'],         x: W - 220,   y: cy + 160,  fill: '#be185d' },
];

const core = { x: cx, y: cy, w: 280, h: 110 };

// ── Arrows: [from, to, label] ──────────────────────────────────────────────────
const arrows = [
  {
    from: 'OW', to: 'CORE',
    label: 'Signup · Login · Settings\nManage Team · Record Sales\nExpenses · Reports · Debtors\nAvatar Upload',
  },
  {
    from: 'CORE', to: 'OW',
    label: 'Reports · Net Profit\nDebt Summaries · AI Insights\nReceipts',
  },
  {
    from: 'MG', to: 'CORE',
    label: 'Login · Record Sales\nManage Products & Stock\nView & Record Debt Payments',
  },
  {
    from: 'CORE', to: 'MG',
    label: 'Receipts · Stock Alerts\nDashboard Data',
  },
  {
    from: 'CS', to: 'CORE',
    label: 'Login · Record Sales\nView Transactions',
  },
  {
    from: 'CORE', to: 'CS',
    label: 'Transaction Receipts\nSales Confirmation',
  },
  {
    from: 'CORE', to: 'GV',
    label: 'VAT Amount Collected\non Each Sale',
  },
  {
    from: 'CORE', to: 'GR',
    label: 'Sales · Stock · Expense\nSummary Data',
  },
  {
    from: 'GR', to: 'CORE',
    label: 'AI Insights · Restock Tips\nChat Responses',
  },
  {
    from: 'CORE', to: 'SM',
    label: 'Password Reset\nEmail Request',
  },
  {
    from: 'SM', to: 'CORE',
    label: 'Reset Link Sent\nto User Inbox',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getPos(id) {
  if (id === 'CORE') return { x: core.x, y: core.y };
  return entities.find(e => e.id === id);
}

function drawArrow(x1, y1, x2, y2, label, offset = 0) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;

  const pad = 80;
  const sx = x1 + ux * pad + (-uy * offset);
  const sy = y1 + uy * pad + ( ux * offset);
  const ex = x2 - ux * pad + (-uy * offset);
  const ey = y2 - uy * pad + ( ux * offset);

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  const lx = mx - uy * 40;
  const ly = my + ux * 40;

  const lines = label.split('\n');
  const lineH = 22;
  const padX = 18;
  const totalH = lines.length * lineH;
  const maxLen = Math.max(...lines.map(l => l.length));
  const boxW = Math.max(200, maxLen * 9 + padX * 2);

  const labelSVG = lines.map((l, i) =>
    `<tspan x="${lx}" dy="${i === 0 ? 0 : lineH}">${l}</tspan>`
  ).join('');

  return `
  <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"
        stroke="#94a3b8" stroke-width="2.5"
        marker-end="url(#arrow)"/>
  <rect x="${lx - boxW / 2}" y="${ly - totalH + 4}" width="${boxW}" height="${totalH + 10}"
        rx="6" fill="white" fill-opacity="0.92" stroke="#e2e8f0" stroke-width="1"/>
  <text x="${lx}" y="${ly - totalH + lineH}"
        text-anchor="middle" font-size="15" fill="#1e293b" font-family="Arial, sans-serif">
    ${labelSVG}
  </text>`;
}

function drawBox(x, y, lines, fill) {
  const bw = 230;
  const lineH = 28;
  const padY = 18;
  const bh = lines.length * lineH + padY * 2 - 4;
  const rx = x - bw / 2;
  const ry = y - bh / 2;
  const textStartY = ry + padY + lineH * 0.7;

  const textLines = lines.map((l, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${l}</tspan>`
  ).join('');

  return `
  <rect x="${rx}" y="${ry}" width="${bw}" height="${bh}" rx="14"
        fill="${fill}" filter="url(#shadow)"/>
  <text x="${x}" y="${textStartY}"
        text-anchor="middle" font-size="18" fill="white"
        font-weight="bold" font-family="Arial, sans-serif">${textLines}</text>`;
}

// ── Build SVG ──────────────────────────────────────────────────────────────────
let arrowsSVG = '';
const seen = {};
arrows.forEach(a => {
  const key = [a.from, a.to].sort().join('-');
  const cnt  = seen[key] || 0;
  const offset = cnt === 0 ? -18 : 18;
  seen[key] = cnt + 1;
  const p1 = getPos(a.from);
  const p2 = getPos(a.to);
  arrowsSVG += drawArrow(p1.x, p1.y, p2.x, p2.y, a.label, offset);
});

let boxesSVG = '';
entities.forEach(e => {
  boxesSVG += drawBox(e.x, e.y, e.lines, e.fill);
});

// Core box
boxesSVG += `
  <rect x="${core.x - core.w / 2}" y="${core.y - core.h / 2}"
        width="${core.w}" height="${core.h}" rx="18"
        fill="#0f766e" stroke="#0d9488" stroke-width="4"
        filter="url(#shadow)"/>
  <text x="${core.x}" y="${core.y - 14}"
        text-anchor="middle" font-size="24" fill="white"
        font-weight="bold" font-family="Arial, sans-serif">DwaTrack</text>
  <text x="${core.x}" y="${core.y + 18}"
        text-anchor="middle" font-size="17" fill="#ccfbf1"
        font-family="Arial, sans-serif">Business Tracking System</text>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L9,3.5 z" fill="#94a3b8"/>
    </marker>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00000022"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#f8fafc"/>

  <!-- Title -->
  <text x="${cx}" y="58" text-anchor="middle" font-size="32"
        font-weight="bold" fill="#0f172a" font-family="Arial, sans-serif">
    DwaTrack — System Context Diagram
  </text>

  <!-- System boundary dashed circle -->
  <ellipse cx="${cx}" cy="${cy}" rx="400" ry="310"
           fill="none" stroke="#0d9488" stroke-width="1.5"
           stroke-dasharray="8 5" opacity="0.4"/>

  ${arrowsSVG}
  ${boxesSVG}
</svg>`;

fs.writeFileSync('context.svg', svg);
console.log('context.svg written');
