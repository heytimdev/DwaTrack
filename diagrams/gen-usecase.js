const fs = require('fs');

const W = 2600, H = 2000;
const cx = W / 2;

function txt(x, y, str, size, color, weight, anchor) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor||'middle'}" font-size="${size}" fill="${color}" font-weight="${weight||'normal'}" font-family="Arial, sans-serif">${str}</text>`;
}

function actorBox(x, y, lines, fill) {
  // Stick figure proportions
  const hr = 22;   // head radius
  const hy = y - 70; // head centre y
  const neck = hy + hr;
  const shoulder = neck + 18;
  const hip = shoulder + 50;
  const foot = hip + 48;
  const armSpan = 44;

  const label = lines.join(' ').replace(/[👤👥🤖📧]/gu, '').trim();

  return `
  <!-- head -->
  <circle cx="${x}" cy="${hy}" r="${hr}" fill="${fill}" stroke="white" stroke-width="2"/>
  <!-- body -->
  <line x1="${x}" y1="${neck}" x2="${x}" y2="${hip}" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
  <!-- arms -->
  <line x1="${x-armSpan}" y1="${shoulder+10}" x2="${x+armSpan}" y2="${shoulder+10}" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
  <!-- left leg -->
  <line x1="${x}" y1="${hip}" x2="${x-armSpan}" y2="${foot}" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
  <!-- right leg -->
  <line x1="${x}" y1="${hip}" x2="${x+armSpan}" y2="${foot}" stroke="${fill}" stroke-width="4" stroke-linecap="round"/>
  <!-- label -->
  <text x="${x}" y="${foot+26}" text-anchor="middle" font-size="17" fill="${fill}" font-weight="bold" font-family="Arial, sans-serif">${label}</text>`;
}

function ucBox(x, y, label, w) {
  w = w || 240;
  const h = 50;
  return `
  <ellipse cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" fill="white" stroke="#0d9488" stroke-width="2" filter="url(#shadow)"/>
  <text x="${x}" y="${y+6}" text-anchor="middle" font-size="14" fill="#0f172a" font-family="Arial, sans-serif">${label}</text>`;
}

function line(x1, y1, x2, y2, color) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color||'#94a3b8'}" stroke-width="1.5" stroke-dasharray="6 3"/>`;
}

function solidLine(x1, y1, x2, y2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#94a3b8" stroke-width="1.5"/>`;
}

function groupBox(x, y, w, h, label, fill, stroke) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-dasharray="8 4"/>
  <text x="${x+16}" y="${y+28}" text-anchor="start" font-size="16" fill="${stroke}" font-weight="bold" font-family="Arial, sans-serif">${label}</text>`;
}

// ── Use cases grouped by category ─────────────────────────────────────────────
// Column x positions for use cases
const UC_X = cx; // center column

const groups = [
  {
    label: 'Authentication', fill: '#f0fdf4', stroke: '#16a34a',
    y: 140, ucs: [
      { id:'UC1',  label:'Sign Up',              roles:['OW'] },
      { id:'UC2',  label:'Log In',               roles:['OW','MG','CS'] },
      { id:'UC3',  label:'Log Out',              roles:['OW','MG','CS'] },
      { id:'UC4',  label:'Forgot Password',      roles:['OW','MG','CS'], ext:['SM'] },
      { id:'UC5',  label:'Reset Password',       roles:['OW','MG','CS'], ext:['SM'] },
      { id:'UC6',  label:'Auto Session Timeout', roles:['OW','MG','CS'] },
    ],
  },
  {
    label: 'Account & Settings', fill: '#eff6ff', stroke: '#2563eb',
    ucs: [
      { id:'UC7',  label:'Update Shop Info',     roles:['OW'] },
      { id:'UC8',  label:'Configure Tax',        roles:['OW'] },
      { id:'UC9',  label:'Upload Avatar',        roles:['OW','MG','CS'] },
      { id:'UC10', label:'Add Team Member',      roles:['OW'] },
      { id:'UC11', label:'Deactivate Member',    roles:['OW'] },
    ],
  },
  {
    label: 'Sales & Transactions', fill: '#fef9c3', stroke: '#ca8a04',
    ucs: [
      { id:'UC12', label:'Record Cash Sale',     roles:['OW','MG','CS'] },
      { id:'UC13', label:'Record Credit Sale',   roles:['OW','MG','CS'] },
      { id:'UC14', label:'Apply Discount',       roles:['OW','MG','CS'] },
      { id:'UC15', label:'Print Receipt',        roles:['OW','MG','CS'] },
      { id:'UC16', label:'Void Transaction',     roles:['OW','MG'] },
      { id:'UC17', label:'Delete Transaction',   roles:['OW'] },
      { id:'UC18', label:'Search Transactions',  roles:['OW','MG','CS'] },
    ],
  },
  {
    label: 'Products & Stock', fill: '#fff7ed', stroke: '#ea580c',
    ucs: [
      { id:'UC19', label:'Add / Edit Product',  roles:['OW','MG'] },
      { id:'UC20', label:'Delete Product',      roles:['OW'] },
      { id:'UC21', label:'Add Stock Item',      roles:['OW','MG'] },
      { id:'UC22', label:'Restock Item',        roles:['OW','MG'] },
      { id:'UC23', label:'View Low Stock Alerts',roles:['OW','MG'] },
    ],
  },
  {
    label: 'Expenses', fill: '#fdf4ff', stroke: '#9333ea',
    ucs: [
      { id:'UC24', label:'Record Expense',      roles:['OW'] },
      { id:'UC25', label:'Delete Expense',      roles:['OW'] },
    ],
  },
  {
    label: 'Debtors', fill: '#fff1f2', stroke: '#e11d48',
    ucs: [
      { id:'UC26', label:'View Outstanding Debts',  roles:['OW','MG'] },
      { id:'UC27', label:'Record Debt Payment',     roles:['OW','MG'] },
      { id:'UC28', label:'View Payment History',    roles:['OW','MG'] },
    ],
  },
  {
    label: 'Reports & Analytics', fill: '#f0fdfa', stroke: '#0d9488',
    ucs: [
      { id:'UC29', label:'View Revenue Report',    roles:['OW'] },
      { id:'UC30', label:'View Expense Breakdown', roles:['OW'] },
      { id:'UC31', label:'View Sales Heatmap',     roles:['OW'] },
      { id:'UC32', label:'View Product Analysis',  roles:['OW'] },
    ],
  },
  {
    label: 'AI Assistant', fill: '#1e293b', stroke: '#475569',
    ucs: [
      { id:'UC33', label:'Get Sales Summary',   roles:['OW'], ext:['GR'] },
      { id:'UC34', label:'Get Restock Tips',    roles:['OW'], ext:['GR'] },
      { id:'UC35', label:'Chat with Assistant', roles:['OW'], ext:['GR'] },
    ],
  },
];

// Layout: two columns of groups side by side
const COL1_X = cx - 320; // use case center for left column
const COL2_X = cx + 320;
const UC_GAP = 58;
const GROUP_PAD = 20;
const GROUP_TOP_PAD = 44;
const GROUP_MARGIN = 24;

// Assign groups to columns
const col1Groups = groups.slice(0, 4);
const col2Groups = groups.slice(4);

function layoutColumn(grps, colX, startY) {
  let y = startY;
  grps.forEach(g => {
    const count = g.ucs.length;
    const groupH = GROUP_TOP_PAD + count * UC_GAP + GROUP_PAD;
    g.boxX = colX - 200;
    g.boxY = y;
    g.boxW = 400;
    g.boxH = groupH;
    g.ucs.forEach((uc, i) => {
      uc.x = colX;
      uc.y = y + GROUP_TOP_PAD + i * UC_GAP + UC_GAP / 2;
    });
    y += groupH + GROUP_MARGIN;
  });
  return y;
}

layoutColumn(col1Groups, COL1_X, 140);
layoutColumn(col2Groups, COL2_X, 140);

// Compute total height needed
const allGroups = [...col1Groups, ...col2Groups];
const allUCs = allGroups.flatMap(g => g.ucs);
const ucMap = {};
allUCs.forEach(uc => ucMap[uc.id] = uc);

// Actor x positions
const LEFT_ACTORS_X = 80;
const RIGHT_ACTORS_X = W - 80;

const actors = [
  { id:'OW', label:'Owner',   fill:'#1e40af', x:LEFT_ACTORS_X,   y:580  },
  { id:'MG', label:'Manager', fill:'#2563eb', x:LEFT_ACTORS_X,   y:1000 },
  { id:'CS', label:'Cashier', fill:'#7c3aed', x:LEFT_ACTORS_X,   y:1420 },
  { id:'GR', label:'Groq AI', fill:'#1f2937', x:RIGHT_ACTORS_X,  y:780  },
  { id:'SM', label:'SMTP',    fill:'#be185d', x:RIGHT_ACTORS_X,  y:1200 },
];
const actorMap = {};
actors.forEach(a => actorMap[a.id] = a);

// ── Build SVG ──────────────────────────────────────────────────────────────────
let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00000018"/>
  </filter>
</defs>
<rect width="${W}" height="${H}" fill="#f8fafc"/>
${txt(cx, 54, 'DwaTrack — Use Case Diagram', 34, '#0f172a', 'bold')}
${txt(cx, 90, 'Dashed lines = actor associations   |   Ellipses = use cases   |   Coloured boxes = system groupings', 18, '#64748b')}
`;

// System boundary
const SYS_X1 = 260, SYS_X2 = W - 260;
const SYS_Y1 = 120, SYS_Y2 = H - 60;
svg += `<rect x="${SYS_X1}" y="${SYS_Y1}" width="${SYS_X2-SYS_X1}" height="${SYS_Y2-SYS_Y1}" rx="20" fill="none" stroke="#0d9488" stroke-width="3" stroke-dasharray="12 6"/>`;
svg += txt(cx, SYS_Y1 + 22, 'DwaTrack System', 20, '#0d9488', 'bold');

// Group boxes
allGroups.forEach(g => {
  svg += groupBox(g.boxX, g.boxY, g.boxW, g.boxH, g.label, g.fill, g.stroke);
});

// Connection lines from actors to use cases
allUCs.forEach(uc => {
  uc.roles.forEach(role => {
    const actor = actorMap[role];
    if (!actor) return;
    const ax = actor.x < cx ? actor.x + 50 : actor.x - 50;
    svg += line(ax, actor.y, uc.x - 120, uc.y);
  });
  (uc.ext || []).forEach(extId => {
    const actor = actorMap[extId];
    if (!actor) return;
    const ax = actor.x < cx ? actor.x + 50 : actor.x - 50;
    svg += line(ax, actor.y, uc.x + 120, uc.y);
  });
});

// Use case ellipses
allUCs.forEach(uc => { svg += ucBox(uc.x, uc.y, uc.label); });

// Actors (drawn on top)
actors.forEach(a => {
  svg += actorBox(a.x, a.y, [a.label], a.fill);
});

svg += `</svg>`;
fs.writeFileSync('usecase.svg', svg);
console.log('usecase.svg written');
