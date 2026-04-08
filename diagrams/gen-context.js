const fs = require('fs');

const W = 1400, H = 900;
const cx = W / 2, cy = H / 2;

// External entities: [id, label lines, x, y, fill]
const entities = [
  { id: 'OW', lines: ['👤 Owner'],                          x: cx,        y: 80,      fill: '#1e40af' },
  { id: 'MG', lines: ['👤 Manager'],                        x: 120,       y: cy - 90, fill: '#2563eb' },
  { id: 'CS', lines: ['👤 Cashier'],                        x: 120,       y: cy + 90, fill: '#7c3aed' },
  { id: 'GV', lines: ['🏛️ Government', 'Tax Authority'],   x: cx,        y: H - 70,  fill: '#b45309' },
  { id: 'GR', lines: ['🤖 Groq AI', 'Service'],            x: W - 120,   y: cy - 90, fill: '#1f2937' },
  { id: 'GE', lines: ['📍 Nominatim', 'Geolocation API'],  x: W - 120,   y: cy + 90, fill: '#065f46' },
];

const core = { x: cx, y: cy, w: 160, h: 70 };

// Arrows: [fromId, toId, label, side] side = 'out'|'in'|'both'
const arrows = [
  { from: 'OW', to: 'CORE', label: 'Signup · Login · Settings\nManage Team · Record Sales\nManage Expenses · View Reports', dir: 'to' },
  { from: 'CORE', to: 'OW', label: 'Sales Reports · Net Profit\nExpense Summary · AI Insights', dir: 'to' },
  { from: 'MG', to: 'CORE', label: 'Login · Record Sales\nManage Products & Stock', dir: 'to' },
  { from: 'CORE', to: 'MG', label: 'Receipts · Stock Alerts\nDashboard Data', dir: 'to' },
  { from: 'CS', to: 'CORE', label: 'Login · Record Sales\nView Transactions', dir: 'to' },
  { from: 'CORE', to: 'CS', label: 'Transaction Receipts\nSales Confirmation', dir: 'to' },
  { from: 'CORE', to: 'GV', label: 'VAT Amount Collected\non Each Sale', dir: 'to' },
  { from: 'CORE', to: 'GR', label: 'Sales · Stock · Expense Data', dir: 'to' },
  { from: 'GR',   to: 'CORE', label: 'AI Insights · Restock Tips\nChat Responses', dir: 'to' },
  { from: 'CORE', to: 'GE', label: 'Country from Signup', dir: 'to' },
  { from: 'GE',   to: 'CORE', label: 'Auto-detected Currency', dir: 'to' },
];

function getPos(id) {
  if (id === 'CORE') return { x: core.x, y: core.y };
  return entities.find(e => e.id === id);
}

function drawArrow(x1, y1, x2, y2, label, offset = 0) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;

  // Shorten line at both ends
  const pad = 52;
  const sx = x1 + ux * pad + (-uy * offset);
  const sy = y1 + uy * pad + (ux * offset);
  const ex = x2 - ux * pad + (-uy * offset);
  const ey = y2 - uy * pad + (ux * offset);

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  // Label offset — push label to side
  const lx = mx - uy * 18;
  const ly = my + ux * 18;

  const lines = label.split('\n');
  const labelSVG = lines.map((l, i) =>
    `<tspan x="${lx}" dy="${i === 0 ? 0 : 14}">${l}</tspan>`
  ).join('');

  return `
  <line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="${lx}" y="${ly - (lines.length - 1) * 7}" text-anchor="middle" font-size="10" fill="#475569" font-family="Arial">${labelSVG}</text>
  `;
}

function drawBox(x, y, lines, fill) {
  const bw = 140, bh = lines.length > 1 ? 60 : 44;
  const rx = x - bw / 2, ry = y - bh / 2;
  const textY = lines.length > 1 ? y - 8 : y + 5;
  const textLines = lines.map((l, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : 18}">${l}</tspan>`
  ).join('');
  return `
  <rect x="${rx}" y="${ry}" width="${bw}" height="${bh}" rx="10" fill="${fill}" />
  <text x="${x}" y="${textY}" text-anchor="middle" font-size="13" fill="white" font-weight="bold" font-family="Arial">${textLines}</text>
  `;
}

// Build arrows SVG
let arrowsSVG = '';
const seen = {};
arrows.forEach(a => {
  const key = [a.from, a.to].sort().join('-');
  const offset = seen[key] ? 14 : -14;
  seen[key] = true;

  const p1 = getPos(a.from);
  const p2 = getPos(a.to);
  arrowsSVG += drawArrow(p1.x, p1.y, p2.x, p2.y, a.label, offset);
});

// Build boxes SVG
let boxesSVG = '';
entities.forEach(e => {
  boxesSVG += drawBox(e.x, e.y, e.lines, e.fill);
});

// Core box
boxesSVG += `
  <rect x="${core.x - core.w / 2}" y="${core.y - core.h / 2}" width="${core.w}" height="${core.h}" rx="12" fill="#0f766e" stroke="#0d9488" stroke-width="3"/>
  <text x="${core.x}" y="${core.y - 6}" text-anchor="middle" font-size="15" fill="white" font-weight="bold" font-family="Arial">DwaTrack</text>
  <text x="${core.x}" y="${core.y + 14}" text-anchor="middle" font-size="13" fill="#ccfbf1" font-family="Arial">System</text>
`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="white"/>
  <!-- Title -->
  <text x="${cx}" y="38" text-anchor="middle" font-size="20" font-weight="bold" fill="#0f172a" font-family="Arial">DwaTrack System — Context Diagram</text>

  ${arrowsSVG}
  ${boxesSVG}
</svg>`;

fs.writeFileSync('context.svg', svg);
console.log('context.svg written');
