const fs = require('fs');

const W = 4000, H = 2400;

// ── Drawing helpers ────────────────────────────────────────────────────────────
function process(x, y, num, label) {
  const lines = label.split('\n');
  const r = 80;
  const lh = 20;
  const startY = y - ((lines.length - 1) * lh) / 2 + 6;
  return `
  <circle cx="${x}" cy="${y}" r="${r}" fill="#0f766e" stroke="#0d9488" stroke-width="3" filter="url(#shadow)"/>
  <text x="${x}" y="${y - r + 20}" text-anchor="middle" font-size="13" fill="#ccfbf1" font-family="Arial, sans-serif" font-weight="bold">${num}</text>
  ${lines.map((l, i) => `<text x="${x}" y="${startY + i * lh}" text-anchor="middle" font-size="16" fill="white" font-weight="bold" font-family="Arial, sans-serif">${l}</text>`).join('')}`;
}

function entity(x, y, lines, fill) {
  const bw = 200, lh = 26, pad = 18;
  const bh = lines.length * lh + pad * 2 - 4;
  return `
  <rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="14" fill="${fill}" filter="url(#shadow)"/>
  ${lines.map((l, i) => `<text x="${x}" y="${y - (lines.length - 1) * lh / 2 + i * lh + 7}" text-anchor="middle" font-size="17" fill="white" font-weight="bold" font-family="Arial, sans-serif">${l}</text>`).join('')}`;
}

function dataStore(x, y, lines) {
  const bw = 240, lh = 22, pad = 14;
  const bh = lines.length * lh + pad * 2;
  const lx = x - bw / 2, rx = x + bw / 2;
  const ty = y - bh / 2, by = y + bh / 2;
  return `
  <rect x="${lx}" y="${ty}" width="${bw}" height="${bh}" fill="#fef3c7" fill-opacity="0.95" stroke="none"/>
  <line x1="${lx}" y1="${ty}" x2="${rx}" y2="${ty}" stroke="#b45309" stroke-width="3"/>
  <line x1="${lx}" y1="${ty + 12}" x2="${rx}" y2="${ty + 12}" stroke="#b45309" stroke-width="1.5"/>
  <line x1="${lx}" y1="${by}" x2="${rx}" y2="${by}" stroke="#b45309" stroke-width="3"/>
  <line x1="${lx}" y1="${ty}" x2="${lx}" y2="${by}" stroke="#b45309" stroke-width="2.5"/>
  <line x1="${rx}" y1="${ty}" x2="${rx}" y2="${by}" stroke="#b45309" stroke-width="2.5"/>
  ${lines.map((l, i) => `<text x="${x}" y="${ty + pad + lh * 0.8 + i * lh}" text-anchor="middle" font-size="15" fill="#92400e" font-weight="bold" font-family="Arial, sans-serif">${l}</text>`).join('')}`;
}

// Quadratic bezier arrow. `bow` bends the path perpendicular to the line.
// Positive bow = bend left, negative = bend right.
function arrow(x1, y1, x2, y2, label, bow) {
  bow = bow || 0;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const ux = dx/len, uy = dy/len;

  const pad = 84;
  const sx = x1 + ux*pad, sy = y1 + uy*pad;
  const ex = x2 - ux*pad, ey = y2 - uy*pad;

  // Quadratic bezier control point — offset perpendicular to the chord
  const cpx = (sx+ex)/2 - uy*bow;
  const cpy = (sy+ey)/2 + ux*bow;

  // Point at t=0.5 on the bezier for label placement
  const t = 0.5;
  const bx = (1-t)*(1-t)*sx + 2*(1-t)*t*cpx + t*t*ex;
  const by = (1-t)*(1-t)*sy + 2*(1-t)*t*cpy + t*t*ey;

  // Tangent at t=0.5
  const tanx = 2*(1-t)*(cpx-sx) + 2*t*(ex-cpx);
  const tany = 2*(1-t)*(cpy-sy) + 2*t*(ey-cpy);
  const tlen = Math.sqrt(tanx*tanx + tany*tany) || 1;
  // Normal (perpendicular to tangent) — push label to the bowed side
  const sign = bow >= 0 ? 1 : -1;
  const nx = -tany/tlen * sign;
  const ny =  tanx/tlen * sign;
  const labelDist = 58;
  const llx = bx + nx*labelDist;
  const lly = by + ny*labelDist;

  const lines = label.split('\n');
  const lh = 20;
  const bw = Math.max(190, Math.max(...lines.map(l => l.length)) * 10 + 36);
  const bh = lines.length * lh + 14;
  const ls = lines.map((l, i) => `<tspan x="${llx}" dy="${i===0?0:lh}">${l}</tspan>`).join('');

  return `
  <path d="M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}" fill="none" stroke="#64748b" stroke-width="2.2" marker-end="url(#arrow)"/>
  <rect x="${llx-bw/2}" y="${lly - bh/2 - 1}" width="${bw}" height="${bh}" rx="7" fill="white" fill-opacity="0.96" stroke="#cbd5e1" stroke-width="1.2"/>
  <text x="${llx}" y="${lly - (lines.length-1)*lh/2 + 6}" text-anchor="middle" font-size="14" fill="#1e293b" font-family="Arial, sans-serif">${ls}</text>`;
}

// ── Node positions ─────────────────────────────────────────────────────────────
//
//  Layout (3 horizontal bands):
//
//  BAND 1 (y≈420):  P1   P2   P3   P4
//  BAND 2 (y≈840):  DS1  DS2  DS3  DS4  DS5  DS6   ← data stores
//  BAND 3 (y≈1380): P5   P6   P7   P8
//
//  LEFT  (x≈180): OW, MG, CS (external actors)
//  TOP   (x≈1180,y≈120): CU (customer)
//  RIGHT (x≈3220): GR, SM (external systems)

// Process rows
const PY1 = 440, PY2 = 1580;
const DSY  = 1010;

// Processes spread across 4 evenly spaced columns
const PX = [1000, 1800, 2600, 3400];

const nodes = {
  P1: { x: PX[0], y: PY1 }, P2: { x: PX[1], y: PY1 },
  P3: { x: PX[2], y: PY1 }, P4: { x: PX[3], y: PY1 },
  P5: { x: PX[0], y: PY2 }, P6: { x: PX[1], y: PY2 },
  P7: { x: PX[2], y: PY2 }, P8: { x: PX[3], y: PY2 },

  // OW sits centrally between both process rows on the left
  OW: { x: 260,  y: DSY  },
  // MG at top-left, CS at bottom-left
  MG: { x: 260,  y: 260  },
  CS: { x: 260,  y: 1760 },
  // Customer above P2
  CU: { x: PX[1], y: 130 },
  // External systems on the far right
  GR: { x: 3780, y: PY2  },
  SM: { x: 3780, y: PY1  },

  // Data stores — one per column, centred between the two process rows
  DS1: { x: PX[0], y: DSY },
  DS2: { x: PX[1], y: DSY },
  DS3: { x: PX[2], y: DSY },
  DS4: { x: PX[3], y: DSY },
  DS5: { x: PX[1], y: 1900 },
  DS6: { x: PX[3] + 200, y: DSY },
};

const n = id => nodes[id];

// ── Arrows ─────────────────────────────────────────────────────────────────────
// Strategy: merge shared-actor flows into single labeled arrows to reduce clutter.
// OW is centre-left; MG top-left; CS bottom-left — arrows spread naturally.
// bow = curve bend in pixels (+ = bow left/up, - = bow right/down)
const arrows = [
  // ── AUTH (P1) ─────────────────────────────────────────────────────────────
  { f:'MG', t:'P1', label:'Credentials',             bow: 60  },
  { f:'OW', t:'P1', label:'Credentials / Signup',    bow: 0   },
  { f:'CS', t:'P1', label:'Credentials',             bow:-60  },
  { f:'P1', t:'DS1',label:'Read/Write User Record',  bow: 0   },
  { f:'P1', t:'OW', label:'JWT Token',               bow:-80  },

  // ── RECORD SALE (P2) ──────────────────────────────────────────────────────
  { f:'OW', t:'P2', label:'Sale Items & Payment',    bow: 80  },
  { f:'MG', t:'P2', label:'Sale Items & Payment',    bow: 0   },
  { f:'CS', t:'P2', label:'Sale Items & Payment',    bow:-80  },
  { f:'CU', t:'P2', label:'Name & Phone (Credit)',   bow: 0   },
  { f:'P2', t:'DS2',label:'Write Transaction',       bow:-60  },
  { f:'P2', t:'DS3',label:'Read Prices / Deduct',    bow: 60  },
  { f:'P2', t:'DS5',label:'Write Credit Debt',       bow: 0   },
  { f:'P2', t:'OW', label:'Receipt',                 bow:-100 },

  // ── INVENTORY (P3) ────────────────────────────────────────────────────────
  { f:'OW', t:'P3', label:'Add / Edit / Restock',    bow: 120 },
  { f:'MG', t:'P3', label:'Add / Edit / Restock',    bow: 60  },
  { f:'P3', t:'DS3',label:'Read/Write Stock',        bow: 0   },
  { f:'P3', t:'OW', label:'Low Stock Alert',         bow:-120 },

  // ── EXPENSES (P4) ─────────────────────────────────────────────────────────
  { f:'OW', t:'P4', label:'Expense Details',         bow: 160 },
  { f:'P4', t:'DS4',label:'Write Expense',           bow: 0   },

  // ── REPORTS (P5) ──────────────────────────────────────────────────────────
  { f:'OW', t:'P5', label:'Report Request',          bow: 0   },
  { f:'P5', t:'DS2',label:'Read Sales Data',         bow:-60  },
  { f:'P5', t:'DS3',label:'Read Stock Data',         bow: 60  },
  { f:'P5', t:'DS4',label:'Read Expense Data',       bow: 0   },
  { f:'P5', t:'OW', label:'Revenue & Profit Report', bow:-80  },

  // ── DEBTORS (P6) ──────────────────────────────────────────────────────────
  { f:'OW', t:'P6', label:'View / Record Payment',   bow: 80  },
  { f:'MG', t:'P6', label:'View / Record Payment',   bow: 0   },
  { f:'P6', t:'DS5',label:'Read/Write Debts',        bow:-60  },
  { f:'P6', t:'DS2',label:'Update Payment Status',   bow: 60  },
  { f:'P6', t:'OW', label:'Debt Summary',            bow:-80  },

  // ── AI ASSISTANT (P7) ─────────────────────────────────────────────────────
  { f:'OW', t:'P7', label:'Chat / Query',            bow: 140 },
  { f:'P7', t:'DS2',label:'Read Sales Data',         bow: 0   },
  { f:'P7', t:'GR', label:'Summarised Data',         bow:-60  },
  { f:'GR', t:'P7', label:'AI Response',             bow: 60  },
  { f:'P7', t:'OW', label:'Insights & Tips',         bow:-140 },

  // ── RESET PASSWORD (P8) ───────────────────────────────────────────────────
  { f:'OW', t:'P8', label:'Email Address',           bow: 200 },
  { f:'MG', t:'P8', label:'Email Address',           bow: 100 },
  { f:'CS', t:'P8', label:'Email Address',           bow:-100 },
  { f:'P8', t:'DS1',label:'Read User Record',        bow:-60  },
  { f:'P8', t:'DS6',label:'Write Reset Token',       bow: 60  },
  { f:'P8', t:'SM', label:'Email Request',           bow:-60  },
  { f:'SM', t:'OW', label:'Reset Link',              bow: 200 },
];

// ── Build SVG ──────────────────────────────────────────────────────────────────
let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3.5" orient="auto">
    <path d="M0,0 L0,7 L10,3.5 z" fill="#64748b"/>
  </marker>
  <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
    <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#00000018"/>
  </filter>
</defs>
<rect width="${W}" height="${H}" fill="#f8fafc"/>

<!-- Title -->
<text x="${W/2}" y="58" text-anchor="middle" font-size="34" font-weight="bold" fill="#0f172a" font-family="Arial, sans-serif">DwaTrack — Data Flow Diagram (Level 1)</text>

<!-- Legend -->
<circle cx="340" cy="100" r="14" fill="#0f766e"/>
<text x="362" y="105" font-size="16" fill="#475569" font-family="Arial, sans-serif">Process</text>
<rect x="480" y="88" width="60" height="24" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
<text x="548" y="105" font-size="16" fill="#475569" font-family="Arial, sans-serif">Data Store</text>
<rect x="690" y="86" width="90" height="28" rx="8" fill="#1e40af"/>
<text x="788" y="105" font-size="16" fill="#475569" font-family="Arial, sans-serif">External Entity</text>

<!-- Band separators -->
<line x1="460" y1="720" x2="${W-80}" y2="720" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="10 6"/>
<line x1="460" y1="1280" x2="${W-80}" y2="1280" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="10 6"/>

<!-- Band labels -->
<text x="90" y="480" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Arial, sans-serif" transform="rotate(-90,90,480)">PROCESSES — TOP</text>
<text x="90" y="1010" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Arial, sans-serif" transform="rotate(-90,90,1010)">DATA STORES</text>
<text x="90" y="1580" text-anchor="middle" font-size="13" fill="#94a3b8" font-family="Arial, sans-serif" transform="rotate(-90,90,1580)">PROCESSES — BOTTOM</text>
`;

// Arrows (drawn first, behind nodes)
arrows.forEach(a => {
  const p1 = n(a.f), p2 = n(a.t);
  if (p1 && p2) svg += arrow(p1.x, p1.y, p2.x, p2.y, a.label, a.bow || 0);
});

// Data stores
[
  { id:'DS1', x:nodes.DS1.x, y:nodes.DS1.y, lines:['D1: Users &', 'Team Members'] },
  { id:'DS2', x:nodes.DS2.x, y:nodes.DS2.y, lines:['D2: Transactions', '& Receipts'] },
  { id:'DS3', x:nodes.DS3.x, y:nodes.DS3.y, lines:['D3: Products', '& Stock'] },
  { id:'DS4', x:nodes.DS4.x, y:nodes.DS4.y, lines:['D4: Expenses'] },
  { id:'DS5', x:nodes.DS5.x, y:nodes.DS5.y, lines:['D5: Customers', '& Debts'] },
  { id:'DS6', x:nodes.DS6.x, y:nodes.DS6.y, lines:['D6: Reset', 'Tokens'] },
].forEach(d => { svg += dataStore(d.x, d.y, d.lines); });

// External entities
[
  { x:nodes.OW.x, y:nodes.OW.y, lines:['👤 Owner'],    fill:'#1e40af' },
  { x:nodes.MG.x, y:nodes.MG.y, lines:['👤 Manager'],  fill:'#2563eb' },
  { x:nodes.CS.x, y:nodes.CS.y, lines:['👤 Cashier'],  fill:'#7c3aed' },
  { x:nodes.CU.x, y:nodes.CU.y, lines:['👥 Customer'], fill:'#0891b2' },
  { x:nodes.GR.x, y:nodes.GR.y, lines:['🤖 Groq AI'],  fill:'#1f2937' },
  { x:nodes.SM.x, y:nodes.SM.y, lines:['📧 SMTP'],     fill:'#be185d' },
].forEach(e => { svg += entity(e.x, e.y, e.lines, e.fill); });

// Processes
[
  { x:nodes.P1.x, y:nodes.P1.y, num:'1.0', label:'Authenticate\nUser' },
  { x:nodes.P2.x, y:nodes.P2.y, num:'2.0', label:'Record\nSale' },
  { x:nodes.P3.x, y:nodes.P3.y, num:'3.0', label:'Manage\nInventory' },
  { x:nodes.P4.x, y:nodes.P4.y, num:'4.0', label:'Manage\nExpenses' },
  { x:nodes.P5.x, y:nodes.P5.y, num:'5.0', label:'Generate\nReports' },
  { x:nodes.P6.x, y:nodes.P6.y, num:'6.0', label:'Manage\nDebtors' },
  { x:nodes.P7.x, y:nodes.P7.y, num:'7.0', label:'AI\nAssistant' },
  { x:nodes.P8.x, y:nodes.P8.y, num:'8.0', label:'Reset\nPassword' },
].forEach(p => { svg += process(p.x, p.y, p.num, p.label); });

svg += `</svg>`;
fs.writeFileSync('dfd.svg', svg);
console.log('dfd.svg written');
