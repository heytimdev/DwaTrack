const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, ImageRun,
} = require('docx');
const fs = require('fs');

// ── Colour palette ─────────────────────────────────────────────────────────────
const TEAL    = '0f766e';
const GRAY    = '374151';
const LTGRAY  = 'f3f4f6';
const WHITE   = 'FFFFFF';
const DKGRAY  = '111827';

// ── Helpers ────────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 440, after: 200 },
    border: { bottom: { color: TEAL, size: 12, space: 6, style: BorderStyle.SINGLE } },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 140 },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 100 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: GRAY, ...opts })],
    spacing: { after: 140, line: 340 },
  });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: GRAY })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function note(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: '6b7280', italics: true })],
    spacing: { after: 140, before: 80 },
  });
}

function spacer() {
  return new Paragraph({ text: '', spacing: { after: 120 } });
}

function hr() {
  return new Paragraph({
    text: '',
    border: { bottom: { color: 'd1d5db', size: 6, space: 4, style: BorderStyle.SINGLE } },
    spacing: { after: 240 },
  });
}

// Embed a PNG diagram scaled to full page width (620px), preserving aspect ratio
function diagramImage(filename, origW, origH) {
  const w = 620;
  const h = Math.round(w * origH / origW);
  return new Paragraph({
    children: [new ImageRun({
      data: fs.readFileSync(filename),
      transformation: { width: w, height: h },
      type: 'png',
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 280 },
  });
}

// Table with header row
function makeTable(headers, rows, colWidths) {
  const total = 9300;
  const widths = colWidths || headers.map(() => Math.floor(total / headers.length));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: TEAL, type: ShadingType.CLEAR, color: TEAL },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: WHITE, size: 20 })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : LTGRAY, type: ShadingType.CLEAR, color: ri % 2 === 0 ? WHITE : LTGRAY },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell), size: 20, color: GRAY })],
      })],
    })),
  }));

  return new Table({
    width: { size: total, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

// ── Document sections ──────────────────────────────────────────────────────────
const children = [];

// ── TITLE PAGE ────────────────────────────────────────────────────────────────
children.push(
  spacer(), spacer(), spacer(),
  new Paragraph({
    children: [new TextRun({ text: 'DwaTrack', bold: true, size: 72, color: TEAL })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Business Tracking System', size: 40, color: GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'System Diagrams Documentation', bold: true, size: 32, color: DKGRAY })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Project Report — Technical Appendix', size: 24, color: '9ca3af', italics: true })],
    alignment: AlignmentType.CENTER,
  }),
  spacer(), spacer(),
  new Paragraph({ children: [new PageBreak()] }),
);

// ── TABLE OF CONTENTS (manual) ────────────────────────────────────────────────
children.push(
  h1('Table of Contents'),
  body('1.  System Context Diagram'),
  body('2.  Entity Relationship Diagram (ERD)'),
  body('3.  System Flowchart'),
  body('4.  Data Flow Diagram (DFD) — Level 1'),
  body('5.  Use Case Diagram'),
  new Paragraph({ children: [new PageBreak()] }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CONTEXT DIAGRAM
// ═══════════════════════════════════════════════════════════════════════════════
children.push(
  h1('1. System Context Diagram'),
  diagramImage('context.png', 7200, 4500),

  h2('Overview'),
  body('The System Context Diagram provides a high-level view of DwaTrack and its interactions with external entities. It defines the system boundary — showing what is inside DwaTrack and who or what communicates with it from the outside. It does not describe internal processes; its purpose is to establish the scope of the system and all external dependencies.'),

  h2('External Entities'),

  h3('Owner'),
  body('The primary user who registers and owns a DwaTrack account. The Owner has full access to all system features including team management, financial reports, the AI assistant, and all settings.'),

  h3('Manager'),
  body('A team member assigned the Manager role by the Owner. Managers can record sales, manage products and stock, and view and record debt payments on behalf of the business.'),

  h3('Cashier'),
  body('A team member assigned the Cashier role by the Owner. Cashiers have the most restricted access — they can record sales and view their own transactions only.'),

  h3('Tax Authority'),
  body('Represents the government tax body (for example, the Ghana Revenue Authority). DwaTrack calculates VAT collected on each sale, which may be submitted to this authority by the Owner.'),

  h3('Groq AI'),
  body('A third-party artificial intelligence service. DwaTrack sends summarised business data to Groq and receives AI-generated insights, restock recommendations, and chat responses in return.'),

  h3('SMTP Email Service'),
  body('An external email delivery provider configured via SMTP (for example, Gmail). DwaTrack uses this service exclusively for sending time-limited password reset links to users who have forgotten their passwords.'),

  h2('Data Flows'),
  spacer(),
  makeTable(
    ['From', 'To', 'Data Exchanged'],
    [
      ['Owner', 'DwaTrack', 'Signup details, credentials, sale data, expenses, settings, team management, debtor payments, avatar'],
      ['DwaTrack', 'Owner', 'Financial reports, net profit, receipts, debt summaries, AI insights'],
      ['Manager', 'DwaTrack', 'Login credentials, sale items, product and stock updates, debt payments'],
      ['DwaTrack', 'Manager', 'Transaction receipts, stock alerts, dashboard data'],
      ['Cashier', 'DwaTrack', 'Login credentials, sale items'],
      ['DwaTrack', 'Cashier', 'Transaction receipts, sales confirmation'],
      ['DwaTrack', 'Tax Authority', 'VAT amount collected per sale'],
      ['DwaTrack', 'Groq AI', 'Summarised sales, stock, and expense data'],
      ['Groq AI', 'DwaTrack', 'AI insights, restock tips, chat responses'],
      ['DwaTrack', 'SMTP Email Service', 'Password reset email request'],
      ['SMTP Email Service', 'Owner / Manager / Cashier', 'Password reset link delivered to user inbox'],
    ],
    [2000, 2000, 5300]
  ),
  spacer(),

  h2('Key Design Notes'),
  bullet('The PostgreSQL database is not shown as an external entity because it is part of DwaTrack\'s internal infrastructure, not an outside party.'),
  bullet('A Geolocation API was considered during design but is not used in the final system. Currency is set manually during signup based on the user\'s country selection.'),

  new Paragraph({ children: [new PageBreak()] }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ERD
// ═══════════════════════════════════════════════════════════════════════════════
children.push(
  h1('2. Entity Relationship Diagram (ERD)'),
  diagramImage('erd.png', 3136, 3432),

  h2('Overview'),
  body('The Entity Relationship Diagram describes the logical structure of DwaTrack\'s PostgreSQL database. It shows all nine tables, their columns, data types, primary and foreign keys, and the relationships between tables. The ERD reflects the schema used in the live production database.'),

  h2('Entities and Attributes'),

  h3('USERS'),
  body('Stores account information for business owners who register on DwaTrack.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the owner'],
      ['first_name', 'VARCHAR', "Owner's first name"],
      ['last_name', 'VARCHAR', "Owner's last name"],
      ['email', 'VARCHAR', "Owner's login email address (unique)"],
      ['password_hash', 'VARCHAR', 'Bcrypt-hashed password'],
      ['business_name', 'VARCHAR', 'Name of the business'],
      ['business_email', 'VARCHAR', 'Business contact email'],
      ['phone_number', 'VARCHAR', 'Business phone number'],
      ['city', 'VARCHAR', 'Business city or address'],
      ['country', 'VARCHAR', 'Country of operation'],
      ['currency', 'VARCHAR', 'Currency symbol (e.g. GH₵)'],
      ['business_logo', 'TEXT', 'Base64-encoded business logo image'],
      ['avatar', 'TEXT', 'Base64-encoded profile photo'],
      ['tax_enabled', 'BOOLEAN', 'Whether tax is applied on receipts'],
      ['tax_label', 'VARCHAR', 'Tax label shown on receipts (e.g. VAT)'],
      ['tax_rate', 'NUMERIC', 'Tax rate as a percentage'],
      ['role', 'VARCHAR', "Always 'owner' for records in this table"],
      ['created_at', 'TIMESTAMPTZ', 'Account creation timestamp'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('TEAM_MEMBERS'),
  body('Stores managers and cashiers added by the Owner.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the team member'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner who added this member'],
      ['first_name', 'VARCHAR', "Member's first name"],
      ['last_name', 'VARCHAR', "Member's last name"],
      ['email', 'VARCHAR', "Member's login email address"],
      ['password_hash', 'VARCHAR', 'Bcrypt-hashed password'],
      ['avatar', 'TEXT', 'Base64-encoded profile photo'],
      ['role', 'VARCHAR', "Either 'manager' or 'cashier'"],
      ['status', 'VARCHAR', "Either 'active' or 'inactive'"],
      ['added_on', 'TIMESTAMPTZ', 'Timestamp when the member was added'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('CUSTOMERS'),
  body('Stores named customers associated with credit sales.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the customer'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this customer belongs to'],
      ['name', 'VARCHAR', "Customer's full name"],
      ['phone', 'VARCHAR', "Customer's phone number"],
      ['created_at', 'TIMESTAMPTZ', 'Record creation timestamp'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('TRANSACTIONS'),
  body('Records every sale — cash, mobile money, card, partial payment, and credit sales.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the transaction'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this transaction belongs to'],
      ['customer_id', 'UUID (FK → CUSTOMERS)', 'Linked customer (for credit sales)'],
      ['receipt_number', 'VARCHAR', 'Auto-generated receipt reference (e.g. RCP-20240411-1234)'],
      ['customer', 'VARCHAR', "Customer display name (defaults to 'Walk-in Customer')"],
      ['items', 'JSONB', 'JSON array of sold items with name, quantity, and price'],
      ['total', 'NUMERIC', 'Total sale amount including tax'],
      ['tax_amount', 'NUMERIC', 'Tax portion of the total'],
      ['tax_label', 'VARCHAR', 'Tax label at the time of the sale'],
      ['payment_method', 'VARCHAR', 'Payment method (cash, momo, card, or credit)'],
      ['payment_status', 'VARCHAR', "'paid', 'partial', or 'credit'"],
      ['amount_paid', 'NUMERIC', 'Amount paid upfront (for partial and credit sales)'],
      ['added_by', 'VARCHAR', 'Name of the staff who recorded the sale'],
      ['status', 'VARCHAR', "'completed' or 'voided'"],
      ['void_reason', 'VARCHAR', 'Reason provided when a transaction is voided'],
      ['voided_at', 'TIMESTAMPTZ', 'Timestamp when the transaction was voided'],
      ['created_at', 'TIMESTAMPTZ', 'When the transaction was recorded'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('DEBT_PAYMENTS'),
  body('Records individual repayments made against a credit or partial-payment transaction.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the payment'],
      ['transaction_id', 'UUID (FK → TRANSACTIONS)', 'The transaction being paid off'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this payment belongs to'],
      ['amount', 'NUMERIC', 'Amount paid in this instalment'],
      ['note', 'VARCHAR', 'Optional note about the payment'],
      ['recorded_by', 'VARCHAR', 'Name of the staff who recorded it'],
      ['created_at', 'TIMESTAMPTZ', 'Payment timestamp'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('PRODUCTS'),
  body('Stores products available for sale.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the product'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this product belongs to'],
      ['name', 'VARCHAR', 'Product name'],
      ['price', 'NUMERIC', 'Selling price'],
      ['cost_price', 'NUMERIC', 'Purchase/cost price (for profit calculation)'],
      ['category', 'VARCHAR', 'Product category'],
      ['created_at', 'TIMESTAMPTZ', 'When the product was added'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('EXPENSES'),
  body('Records business expenses such as rent, utilities, and supplies.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the expense'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this expense belongs to'],
      ['description', 'VARCHAR', 'Description of the expense'],
      ['amount', 'NUMERIC', 'Expense amount'],
      ['category', 'VARCHAR', 'Expense category (e.g. Rent, Utilities, Supplies)'],
      ['added_by', 'VARCHAR', 'Name of the staff who recorded it'],
      ['created_at', 'TIMESTAMPTZ', 'When the expense was recorded'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('STOCK'),
  body('Tracks inventory item quantities and low-stock alert thresholds.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the stock item'],
      ['owner_id', 'UUID (FK → USERS)', 'The owner this stock item belongs to'],
      ['name', 'VARCHAR', 'Item name'],
      ['quantity', 'INTEGER', 'Current quantity in stock'],
      ['low_stock_threshold', 'INTEGER', 'Quantity at which a low-stock alert is triggered'],
      ['added_on', 'TIMESTAMPTZ', 'When the item was added'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h3('PASSWORD_RESET_TOKENS'),
  body('Stores secure, time-limited tokens used to authenticate password reset requests.'),
  spacer(),
  makeTable(
    ['Column', 'Type', 'Description'],
    [
      ['id', 'UUID (PK)', 'Unique identifier for the token'],
      ['user_id', 'UUID (FK → USERS)', 'The user who requested the reset'],
      ['token_hash', 'VARCHAR', 'SHA-256 hash of the reset token (raw token only sent via email, never stored)'],
      ['expires_at', 'TIMESTAMPTZ', 'Token expiry time (1 hour from creation)'],
      ['used_at', 'TIMESTAMPTZ', 'Timestamp when the token was consumed'],
      ['created_at', 'TIMESTAMPTZ', 'When the token was generated'],
    ],
    [2200, 1800, 5300]
  ),
  spacer(),

  h2('Relationships'),
  spacer(),
  makeTable(
    ['Relationship', 'Cardinality', 'Description'],
    [
      ['USERS → TEAM_MEMBERS', 'One-to-Many', 'An owner can have many team members'],
      ['USERS → CUSTOMERS', 'One-to-Many', 'An owner can have many customers'],
      ['USERS → TRANSACTIONS', 'One-to-Many', 'An owner owns many transactions'],
      ['USERS → PRODUCTS', 'One-to-Many', 'An owner owns many products'],
      ['USERS → EXPENSES', 'One-to-Many', 'An owner owns many expense records'],
      ['USERS → STOCK', 'One-to-Many', 'An owner manages many stock items'],
      ['USERS → PASSWORD_RESET_TOKENS', 'One-to-Many', 'An owner can have multiple reset tokens over time'],
      ['CUSTOMERS → TRANSACTIONS', 'One-to-Many', 'A customer can be linked to many credit transactions'],
      ['TRANSACTIONS → DEBT_PAYMENTS', 'One-to-Many', 'A credit transaction can have many debt payments recorded against it'],
    ],
    [3000, 1800, 4500]
  ),
  spacer(),
  new Paragraph({ children: [new PageBreak()] }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FLOWCHART
// ═══════════════════════════════════════════════════════════════════════════════
children.push(
  h1('3. System Flowchart'),
  diagramImage('flowchart.png', 10148, 10220),

  h2('Overview'),
  body('The System Flowchart describes the complete operational flow of DwaTrack from the moment a user visits the application. It covers account creation, authentication including password reset, role-based access, all core business workflows, and automatic session timeout. The diagram uses subgraphs to distinguish the distinct experience of each user role.'),

  h2('Entry and Authentication'),
  body('A user who does not yet have an account proceeds to sign up by providing their name, email address, password, and country. The system checks for duplicate email addresses and automatically assigns a currency based on the selected country. If the user already has an account, they proceed directly to the login screen.'),
  body('On the login screen, a user who has forgotten their password can enter their email address to receive a time-limited password reset link. After clicking the link and setting a new password, they are redirected back to the login screen. Valid credentials grant access and the system routes the user to the dashboard appropriate for their role.'),

  h2('Owner — Full Access'),
  body('Upon login, the Owner reaches a dashboard that includes an overview of today\'s sales, outstanding debt balances, and AI-powered business insights. From the dashboard, the Owner can perform the following actions:'),
  bullet('Record Sales — Add transactions using any payment method.'),
  bullet('View, Void, and Delete Transactions — Full transaction management with reason entry for voided sales.'),
  bullet('Manage Products — Add, edit, and remove products from the catalogue.'),
  bullet('Manage Stock — Track inventory quantities and receive alerts for low-stock items.'),
  bullet('Manage Expenses — Record and delete business expenditures.'),
  bullet('View Reports — Access revenue summaries, expense breakdowns, payment method analysis, and the monthly sales activity heatmap.'),
  bullet('AI Assistant — Submit natural language queries for sales summaries, restock recommendations, and business advice.'),
  bullet('Manage Debtors — View outstanding customer debts and record repayments.'),
  bullet('Settings — Update shop information, configure tax, manage team members, and upload a profile avatar.'),

  h2('Manager — Limited Access'),
  body('Managers can record sales, view and void transactions, manage products and stock, view outstanding debts, and record debt payments. Managers cannot delete transactions, manage expenses, or access financial reports.'),

  h2('Cashier — Basic Access'),
  body('Cashiers can record sales and view their own transactions only. They cannot void or delete transactions, manage products or stock, manage expenses, or access the reports section.'),

  h2('Record Sale Flow (All Roles)'),
  body('All three roles follow the same sale recording process:'),
  bullet('Products and quantities are selected from the product catalogue.'),
  bullet('An optional discount is applied to the order total.'),
  bullet('The system calculates the subtotal, tax (if enabled), and the final total automatically.'),
  bullet('The user selects a payment method. For Cash, Mobile Money, or Card payments, the transaction is marked as Paid. For Credit sales, a customer must be selected. If a deposit is entered, the status is set to Partial. If no deposit is provided, the status is set to Credit.'),
  bullet('The transaction is submitted, stock quantities are automatically deducted, and a receipt is generated. The user may optionally print the receipt.'),

  h2('Debtors Flow (Owner and Manager)'),
  bullet('The user views a list of all customers with outstanding balances, including urgency indicators for overdue accounts.'),
  bullet('A specific customer is selected to reveal their open credit transactions and full payment history.'),
  bullet('A repayment amount is recorded against a chosen transaction.'),
  bullet('If the payment clears the full outstanding balance, the transaction status automatically updates to Paid. Otherwise, the status becomes Partial.'),

  h2('Stock Management Flow (Owner and Manager)'),
  body('Stock management allows users to add new items with a defined low-stock threshold, restock existing items when supplies arrive, and view a list of items that have fallen below their threshold.'),

  h2('Session Inactivity Timeout (All Roles)'),
  body('All authenticated users are subject to a 15-minute inactivity timeout. After 15 minutes of no user interaction, a warning modal appears with a 60-second countdown. If the user acknowledges the warning, the timer resets and the session continues. If the countdown expires or the user clicks logout, the session is closed and the user is redirected to the login page.'),

  new Paragraph({ children: [new PageBreak()] }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 4. DFD
// ═══════════════════════════════════════════════════════════════════════════════
children.push(
  h1('4. Data Flow Diagram (DFD) — Level 1'),
  diagramImage('dfd.png', 8000, 4800),

  h2('Overview'),
  body('The Level 1 Data Flow Diagram decomposes DwaTrack into its eight core processes and illustrates how data moves between external entities, internal processes, and data stores. Unlike the System Flowchart, which describes the sequence of user actions and decisions, the DFD focuses exclusively on the movement and transformation of data within and around the system.'),

  h2('Notation'),
  bullet('Circles represent Processes — named operations that receive, transform, or produce data.'),
  bullet('Open-ended rectangles represent Data Stores — the persistent storage locations (database tables) where data is held at rest.'),
  bullet('Rounded rectangles represent External Entities — the people or systems outside DwaTrack\'s boundary that supply or consume data.'),

  h2('External Entities'),
  spacer(),
  makeTable(
    ['Entity', 'Description'],
    [
      ['Owner', 'Provides credentials, sale data, and management instructions; receives reports, receipts, and insights'],
      ['Manager', 'Provides credentials and sale or stock data; receives receipts and stock alerts'],
      ['Cashier', 'Provides credentials and sale data; receives receipts'],
      ['Customer', 'Provides name and phone number when a credit sale is being recorded'],
      ['Groq AI', 'Receives summarised business data; returns AI-generated insights and responses'],
      ['SMTP Service', 'Receives email dispatch requests; delivers password reset links to users'],
    ],
    [2000, 7300]
  ),
  spacer(),

  h2('Data Stores'),
  spacer(),
  makeTable(
    ['Store', 'Contents'],
    [
      ['D1: Users & Team Members', 'Owner and team member account records, hashed credentials, and avatar images'],
      ['D2: Transactions & Receipts', 'All sales records including payment status, itemised products, totals, and void information'],
      ['D3: Products & Stock', 'Product catalogue with selling prices, cost prices, categories, and current stock quantities'],
      ['D4: Expenses', 'Business expense records with amounts, categories, and timestamps'],
      ['D5: Customers & Debts', 'Customer profiles and all debt payment records linked to credit transactions'],
      ['D6: Reset Tokens', 'SHA-256 hashed, time-limited tokens used for password reset verification'],
    ],
    [2800, 6500]
  ),
  spacer(),

  h2('Processes'),

  h3('1.0 — Authenticate User'),
  body('Receives login credentials from Owners, Managers, and Cashiers, or a new account signup from an Owner. Reads user records from D1 to verify identity. On success, issues a signed JWT session token to the requesting user.'),

  h3('2.0 — Record Sale'),
  body('Receives sale items, quantities, discounts, payment method, and optional customer details from any authenticated user. Reads product prices from D3. Writes the completed transaction to D2. Deducts sold quantities from D3. Writes a credit debt entry to D5 when the payment method is credit. Returns a receipt to the recording user.'),

  h3('3.0 — Manage Inventory'),
  body('Receives add, edit, and restock instructions from Owners and Managers. Reads and writes product and stock data in D3. Returns low-stock alerts when item quantities fall below their configured thresholds.'),

  h3('4.0 — Manage Expenses'),
  body('Receives expense details including description, amount, and category from the Owner. Writes the expense record to D4.'),

  h3('5.0 — Generate Reports'),
  body('Receives a report request from the Owner. Reads sales data from D2, stock data from D3, and expense data from D4. Returns compiled revenue, profit, and expense reports to the Owner.'),

  h3('6.0 — Manage Debtors'),
  body('Receives debt-viewing and payment-recording instructions from Owners and Managers. Reads and updates debt records in D5. Updates the payment status of the relevant transaction in D2 when a payment is recorded. Returns a debt summary to the requesting user.'),

  h3('7.0 — AI Assistant'),
  body('Receives a natural language query from the Owner. Reads relevant sales data from D2. Sends summarised data to the Groq AI external service. Receives the AI-generated response and returns insights to the Owner.'),

  h3('8.0 — Reset Password'),
  body('Receives an email address from any user requesting a password reset. Reads the corresponding user account from D1. Writes a hashed, time-limited token to D6. Sends a password reset email request to the SMTP service. When the user subsequently submits a new password, validates the token from D6 and writes the new password hash to D1.'),

  new Paragraph({ children: [new PageBreak()] }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// 5. USE CASE
// ═══════════════════════════════════════════════════════════════════════════════
children.push(
  h1('5. Use Case Diagram'),
  diagramImage('usecase.png', 7800, 6000),

  h2('Overview'),
  body('The Use Case Diagram identifies all the functional capabilities of DwaTrack and maps them to the actors who can perform them. Each use case represents a discrete action a user can initiate within the system boundary. The diagram is organised into eight functional groups, and access control differences between the three user roles are clearly represented.'),

  h2('Actors'),

  h3('Owner'),
  body('The business owner with full system access. Can perform every use case available in the system.'),

  h3('Manager'),
  body('A staff member with intermediate access. Can record sales, manage inventory, view and record debts, and update their profile avatar. Cannot manage expenses, access reports, or administer the team.'),

  h3('Cashier'),
  body('A staff member with basic access. Can record sales, view their own transactions, and update their profile avatar only.'),

  h3('Groq AI'),
  body('An external AI service that participates as a secondary actor in all AI Assistant use cases.'),

  h3('SMTP Service'),
  body('An external email service that participates as a secondary actor in the Forgot Password and Reset Password use cases.'),

  h2('Use Cases by Group'),
  spacer(),

  h3('Authentication'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier', 'External Participant'],
    [
      ['Sign Up', '✓', '—', '—', '—'],
      ['Log In', '✓', '✓', '✓', '—'],
      ['Log Out', '✓', '✓', '✓', '—'],
      ['Forgot Password', '✓', '✓', '✓', 'SMTP Service'],
      ['Reset Password', '✓', '✓', '✓', 'SMTP Service'],
      ['Auto Session Timeout', '✓', '✓', '✓', '—'],
    ],
    [3400, 1100, 1100, 1100, 2600]
  ),
  spacer(),

  h3('Account & Settings'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['Update Shop Info', '✓', '—', '—'],
      ['Configure Tax', '✓', '—', '—'],
      ['Upload Avatar', '✓', '✓', '✓'],
      ['Add Team Member', '✓', '—', '—'],
      ['Deactivate Team Member', '✓', '—', '—'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('Sales & Transactions'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['Record Cash Sale', '✓', '✓', '✓'],
      ['Record Credit Sale', '✓', '✓', '✓'],
      ['Apply Discount', '✓', '✓', '✓'],
      ['Print Receipt', '✓', '✓', '✓'],
      ['Void Transaction', '✓', '✓', '—'],
      ['Delete Transaction', '✓', '—', '—'],
      ['Search Transactions', '✓', '✓', '✓'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('Products & Stock'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['Add / Edit Product', '✓', '✓', '—'],
      ['Delete Product', '✓', '—', '—'],
      ['Add Stock Item', '✓', '✓', '—'],
      ['Restock Item', '✓', '✓', '—'],
      ['View Low Stock Alerts', '✓', '✓', '—'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('Expenses'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['Record Expense', '✓', '—', '—'],
      ['Delete Expense', '✓', '—', '—'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('Debtors'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['View Outstanding Debts', '✓', '✓', '—'],
      ['Record Debt Payment', '✓', '✓', '—'],
      ['View Payment History', '✓', '✓', '—'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('Reports & Analytics'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier'],
    [
      ['View Revenue Report', '✓', '—', '—'],
      ['View Expense Breakdown', '✓', '—', '—'],
      ['View Sales Activity Heatmap', '✓', '—', '—'],
      ['View Product Analysis', '✓', '—', '—'],
    ],
    [4600, 1500, 1500, 1700]
  ),
  spacer(),

  h3('AI Assistant'),
  makeTable(
    ['Use Case', 'Owner', 'Manager', 'Cashier', 'External Participant'],
    [
      ['Get Sales Summary', '✓', '—', '—', 'Groq AI'],
      ['Get Restock Tips', '✓', '—', '—', 'Groq AI'],
      ['Chat with Assistant', '✓', '—', '—', 'Groq AI'],
    ],
    [3400, 1100, 1100, 1100, 2600]
  ),
  spacer(),

  h2('Role Permission Summary'),
  spacer(),
  makeTable(
    ['Feature Area', 'Owner', 'Manager', 'Cashier'],
    [
      ['Authentication & Account', 'Full', 'Partial', 'Basic'],
      ['Sales Recording', 'Full', 'Full', 'Full'],
      ['Transaction Management', 'Full', 'Partial', 'None'],
      ['Products & Stock', 'Full', 'Partial', 'None'],
      ['Expenses', 'Full', 'None', 'None'],
      ['Debtors', 'Full', 'Full', 'None'],
      ['Reports & Analytics', 'Full', 'None', 'None'],
      ['AI Assistant', 'Full', 'None', 'None'],
      ['Team Management', 'Full', 'None', 'None'],
    ],
    [4200, 1700, 1700, 1700]
  ),
  spacer(),

  hr(),
  note('Documentation prepared for the DwaTrack Business Tracking System project report.'),
);

// ── Generate .docx ─────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'DwaTrack',
  title: 'DwaTrack System Diagrams Documentation',
  description: 'Technical diagram documentation for the DwaTrack Business Tracking System',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: GRAY },
        paragraph: { spacing: { line: 340 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { bold: true, size: 40, color: TEAL, font: 'Calibri' },
        paragraph: { spacing: { before: 480, after: 240 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { bold: true, size: 30, color: DKGRAY, font: 'Calibri' },
        paragraph: { spacing: { before: 360, after: 160 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { bold: true, size: 24, color: '374151', font: 'Calibri' },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    ],
  },
  sections: [{ children }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('DwaTrack_Diagram_Documentation.docx', buffer);
  console.log('DwaTrack_Diagram_Documentation.docx written successfully.');
});
