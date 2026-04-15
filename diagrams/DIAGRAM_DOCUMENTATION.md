# DwaTrack — System Diagrams Documentation

---

## Table of Contents

1. System Context Diagram
2. Entity Relationship Diagram (ERD)
3. System Flowchart
4. Data Flow Diagram (DFD)
5. Use Case Diagram

---

## 1. System Context Diagram

### Overview

The System Context Diagram provides a high-level view of DwaTrack and its interactions with external entities. It defines the system boundary — showing what is inside DwaTrack and who or what communicates with it from the outside. It does not describe internal processes; its purpose is to establish the scope of the system and all external dependencies.

### External Entities

**Owner**
The primary user who registers and owns a DwaTrack account. The Owner has full access to all system features including team management, financial reports, the AI assistant, and all settings.

**Manager**
A team member assigned the Manager role by the Owner. Managers can record sales, manage products and stock, and view and record debt payments on behalf of the business.

**Cashier**
A team member assigned the Cashier role by the Owner. Cashiers have the most restricted access — they can record sales and view their own transactions only.

**Tax Authority**
Represents the government tax body (for example, the Ghana Revenue Authority). DwaTrack calculates VAT collected on each sale, which may be submitted to this authority by the Owner.

**Groq AI**
A third-party artificial intelligence service. DwaTrack sends summarised business data to Groq and receives AI-generated insights, restock recommendations, and chat responses in return.

**SMTP Email Service**
An external email delivery provider configured via SMTP (for example, Gmail). DwaTrack uses this service exclusively for sending time-limited password reset links to users who have forgotten their passwords.

### Data Flows

| From | To | Data Exchanged |
|------|----|----------------|
| Owner | DwaTrack | Signup details, login credentials, sale data, expense records, settings, team management, debtor payments, avatar photo |
| DwaTrack | Owner | Financial reports, net profit figures, receipts, debt summaries, AI insights |
| Manager | DwaTrack | Login credentials, sale items, product and stock updates, debt payments |
| DwaTrack | Manager | Transaction receipts, stock alerts, dashboard data |
| Cashier | DwaTrack | Login credentials, sale items |
| DwaTrack | Cashier | Transaction receipts, sales confirmation |
| DwaTrack | Tax Authority | VAT amount collected per sale |
| DwaTrack | Groq AI | Summarised sales, stock, and expense data |
| Groq AI | DwaTrack | AI insights, restock tips, chat responses |
| DwaTrack | SMTP Email Service | Password reset email request |
| SMTP Email Service | Owner / Manager / Cashier | Password reset link delivered to the user's inbox |

### Key Design Notes

- The PostgreSQL database is **not** shown as an external entity because it is part of DwaTrack's internal infrastructure, not an outside party.
- A Geolocation API was considered during design but is not used in the final system. Currency is instead set manually during signup based on the user's country selection.

---

## 2. Entity Relationship Diagram (ERD)

### Overview

The Entity Relationship Diagram describes the logical structure of DwaTrack's PostgreSQL database. It shows all nine tables (entities), their columns (attributes), data types, primary and foreign keys, and the relationships between tables. The ERD reflects the schema used in the live production database.

### Entities and Attributes

#### USERS

Stores the account information of business owners who register on DwaTrack.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the owner |
| first_name | VARCHAR | Owner's first name |
| last_name | VARCHAR | Owner's last name |
| email | VARCHAR | Owner's login email address (unique) |
| password_hash | VARCHAR | Bcrypt-hashed password |
| business_name | VARCHAR | Name of the business |
| business_email | VARCHAR | Business contact email |
| phone_number | VARCHAR | Business phone number |
| city | VARCHAR | Business city or address |
| country | VARCHAR | Country of operation |
| currency | VARCHAR | Currency symbol (e.g. GH₵) |
| business_logo | TEXT | Base64-encoded business logo image |
| avatar | TEXT | Base64-encoded profile photo |
| tax_enabled | BOOLEAN | Whether tax is applied on receipts |
| tax_label | VARCHAR | Tax label shown on receipts (e.g. VAT) |
| tax_rate | NUMERIC | Tax rate as a percentage |
| role | VARCHAR | Always 'owner' for records in this table |
| created_at | TIMESTAMPTZ | Account creation timestamp |

#### TEAM_MEMBERS

Stores managers and cashiers added by the Owner.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the team member |
| owner_id | UUID (FK → USERS) | The owner who added this team member |
| first_name | VARCHAR | Member's first name |
| last_name | VARCHAR | Member's last name |
| email | VARCHAR | Member's login email address |
| password_hash | VARCHAR | Bcrypt-hashed password |
| avatar | TEXT | Base64-encoded profile photo |
| role | VARCHAR | Either 'manager' or 'cashier' |
| status | VARCHAR | Either 'active' or 'inactive' |
| added_on | TIMESTAMPTZ | Timestamp when the member was added |

#### CUSTOMERS

Stores named customers associated with credit sales.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the customer |
| owner_id | UUID (FK → USERS) | The owner this customer belongs to |
| name | VARCHAR | Customer's full name |
| phone | VARCHAR | Customer's phone number |
| created_at | TIMESTAMPTZ | Record creation timestamp |

#### TRANSACTIONS

Records every sale made through DwaTrack — including cash, mobile money, card, partial payment, and credit sales.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the transaction |
| owner_id | UUID (FK → USERS) | The owner this transaction belongs to |
| customer_id | UUID (FK → CUSTOMERS) | Linked customer (used for credit sales) |
| receipt_number | VARCHAR | Auto-generated receipt reference (e.g. RCP-20240411-1234) |
| customer | VARCHAR | Customer display name (defaults to 'Walk-in Customer') |
| items | JSONB | JSON array of sold items with name, quantity, and price |
| total | NUMERIC | Total sale amount including tax |
| tax_amount | NUMERIC | Tax portion of the total |
| tax_label | VARCHAR | Tax label at the time of the sale |
| payment_method | VARCHAR | Payment method (cash, momo, card, or credit) |
| payment_status | VARCHAR | 'paid', 'partial', or 'credit' |
| amount_paid | NUMERIC | Amount paid upfront (relevant for partial and credit sales) |
| added_by | VARCHAR | Name or email of the staff member who recorded the sale |
| status | VARCHAR | 'completed' or 'voided' |
| void_reason | VARCHAR | Reason provided when a transaction is voided |
| voided_at | TIMESTAMPTZ | Timestamp when the transaction was voided |
| created_at | TIMESTAMPTZ | When the transaction was recorded |

#### DEBT_PAYMENTS

Records individual repayments made against a credit or partial-payment transaction.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the payment |
| transaction_id | UUID (FK → TRANSACTIONS) | The transaction being paid off |
| owner_id | UUID (FK → USERS) | The owner this payment belongs to |
| amount | NUMERIC | Amount paid in this instalment |
| note | VARCHAR | Optional note about the payment |
| recorded_by | VARCHAR | Name of the staff member who recorded it |
| created_at | TIMESTAMPTZ | Payment timestamp |

#### PRODUCTS

Stores products available for sale.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the product |
| owner_id | UUID (FK → USERS) | The owner this product belongs to |
| name | VARCHAR | Product name |
| price | NUMERIC | Selling price |
| cost_price | NUMERIC | Purchase or cost price (used for profit calculation) |
| category | VARCHAR | Product category |
| created_at | TIMESTAMPTZ | When the product was added |

#### EXPENSES

Records business expenses such as rent, utilities, and supplies.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the expense |
| owner_id | UUID (FK → USERS) | The owner this expense belongs to |
| description | VARCHAR | Description of the expense |
| amount | NUMERIC | Expense amount |
| category | VARCHAR | Expense category (e.g. Rent, Utilities, Supplies) |
| added_by | VARCHAR | Name of the staff member who recorded it |
| created_at | TIMESTAMPTZ | When the expense was recorded |

#### STOCK

Tracks inventory item quantities and low-stock alert thresholds.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the stock item |
| owner_id | UUID (FK → USERS) | The owner this stock item belongs to |
| name | VARCHAR | Item name |
| quantity | INTEGER | Current quantity in stock |
| low_stock_threshold | INTEGER | Quantity at which a low-stock alert is triggered |
| added_on | TIMESTAMPTZ | When the item was added |

#### PASSWORD_RESET_TOKENS

Stores secure, time-limited tokens used to authenticate password reset requests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier for the token |
| user_id | UUID (FK → USERS) | The user who requested the reset |
| token_hash | VARCHAR | SHA-256 hash of the reset token (the raw token is only sent via email and never stored) |
| expires_at | TIMESTAMPTZ | Token expiry time (1 hour from creation) |
| used_at | TIMESTAMPTZ | Timestamp when the token was consumed |
| created_at | TIMESTAMPTZ | When the token was generated |

### Relationships

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| USERS → TEAM_MEMBERS | One-to-Many | An owner can have many team members |
| USERS → CUSTOMERS | One-to-Many | An owner can have many customers |
| USERS → TRANSACTIONS | One-to-Many | An owner owns many transactions |
| USERS → PRODUCTS | One-to-Many | An owner owns many products |
| USERS → EXPENSES | One-to-Many | An owner owns many expense records |
| USERS → STOCK | One-to-Many | An owner manages many stock items |
| USERS → PASSWORD_RESET_TOKENS | One-to-Many | An owner can have multiple reset tokens over time |
| CUSTOMERS → TRANSACTIONS | One-to-Many | A customer can be linked to many credit transactions |
| TRANSACTIONS → DEBT_PAYMENTS | One-to-Many | A single credit transaction can have many debt payments recorded against it |

---

## 3. System Flowchart

### Overview

The System Flowchart describes the complete operational flow of DwaTrack from the moment a user visits the application. It covers account creation, authentication (including password reset), role-based access, all core business workflows, and automatic session timeout. The diagram uses subgraphs to distinguish the distinct experiences of each user role.

### Entry and Authentication

1. A user visits DwaTrack. If they do not yet have an account, they proceed to sign up by providing their name, email address, password, and country. The system checks for duplicate email addresses and automatically assigns a currency based on the selected country.
2. If the user already has an account, they proceed directly to the login screen.
3. On the login screen, a user who has forgotten their password can enter their email address to receive a time-limited password reset link. After clicking the link and setting a new password, they are redirected back to the login screen.
4. Valid credentials grant access and the system routes the user to the dashboard appropriate for their role.

### Owner — Full Access

Upon login, the Owner reaches a dashboard that includes an overview of today's sales, outstanding debt balances, and AI-powered business insights. From the dashboard, the Owner can:

- **Record Sales** — Add transactions using any payment method.
- **View, Void, and Delete Transactions** — Full transaction management with reason entry for voided sales.
- **Manage Products** — Add, edit, and remove products from the catalogue.
- **Manage Stock** — Track inventory quantities and receive alerts for low-stock items.
- **Manage Expenses** — Record and delete business expenditures.
- **View Reports** — Access revenue summaries, expense breakdowns, payment method analysis, and the monthly sales activity heatmap.
- **AI Assistant** — Submit natural language queries to receive sales summaries, restock recommendations, and general business advice.
- **Manage Debtors** — View outstanding customer debts and record repayments.
- **Settings** — Update shop information, configure tax settings, manage team members, and upload a profile avatar.

### Manager — Limited Access

Managers can record sales, view and void transactions, manage products and stock, view outstanding debts, and record debt payments. Managers cannot delete transactions, manage expenses, or access financial reports.

### Cashier — Basic Access

Cashiers can record sales and view their own transactions only. They cannot void or delete transactions, manage products, stock, or expenses, or access the reports section.

### Record Sale Flow (All Roles)

All three roles follow the same sale recording process:

1. Products and quantities are selected from the catalogue.
2. An optional discount is applied.
3. The system calculates the subtotal, tax (if enabled), and final total.
4. The user selects a payment method:
   - **Cash, Mobile Money, or Card** → The transaction is marked as **Paid**.
   - **Credit** → A customer must be selected from the customer list. If a deposit amount is entered, the status is set to **Partial**. If no deposit is provided, the status is set to **Credit**.
5. The transaction is submitted, stock quantities are automatically deducted, and a receipt is generated. The user may optionally send the receipt to the printer.

### Debtors Flow (Owner and Manager)

1. The user views a list of all customers with outstanding balances, including urgency indicators for overdue accounts.
2. A specific customer is selected to reveal their open credit transactions and full payment history.
3. A repayment is recorded against a chosen transaction.
4. If the payment clears the full outstanding balance, the transaction status automatically updates to **Paid**. Otherwise, the status becomes **Partial**.

### Stock Management Flow (Owner and Manager)

Stock management allows users to add new items with a defined low-stock threshold, restock existing items when supplies arrive, and view a list of items that have fallen below their threshold.

### Session Inactivity Timeout (All Roles)

All authenticated users are subject to a 15-minute inactivity timeout. After 15 minutes of no user interaction, a warning modal appears with a 60-second countdown. If the user acknowledges the warning, the timer resets and the session continues. If the countdown expires or the user clicks logout, the session is closed and the user is redirected to the login page.

---

## 4. Data Flow Diagram (DFD) — Level 1

### Overview

The Level 1 Data Flow Diagram decomposes DwaTrack into its eight core processes and illustrates how data moves between external entities, internal processes, and data stores. Unlike the System Flowchart, which describes the sequence of user actions, the DFD focuses exclusively on the movement and transformation of data within and around the system.

### Notation

- **Circles** represent Processes — named operations that receive, transform, or produce data.
- **Open-ended rectangles** represent Data Stores — the persistent storage locations (database tables) where data is held.
- **Rounded rectangles** represent External Entities — the people or systems outside DwaTrack's boundary that supply or consume data.

### External Entities

| Entity | Description |
|--------|-------------|
| Owner | Provides credentials, sale data, and management instructions; receives reports, receipts, and insights |
| Manager | Provides credentials and sale or stock data; receives receipts and stock alerts |
| Cashier | Provides credentials and sale data; receives receipts |
| Customer | Provides name and phone number when a credit sale is recorded |
| Groq AI | Receives summarised business data; returns AI-generated insights |
| SMTP Service | Receives email dispatch requests; delivers password reset links to users |

### Data Stores

| Store | Contents |
|-------|----------|
| D1: Users & Team Members | Owner and team member account records, hashed credentials, and avatar images |
| D2: Transactions & Receipts | All sales records including payment status, itemised products, totals, and void information |
| D3: Products & Stock | Product catalogue with selling prices, cost prices, categories, and current stock quantities |
| D4: Expenses | Business expense records with amounts, categories, and timestamps |
| D5: Customers & Debts | Customer profiles and all debt payment records linked to credit transactions |
| D6: Reset Tokens | SHA-256 hashed, time-limited tokens used for password reset verification |

### Processes

**1.0 — Authenticate User**
Receives login credentials from Owners, Managers, and Cashiers or a new account signup from an Owner. Reads user records from D1 to verify identity. On success, returns a signed JWT session token to the requesting user.

**2.0 — Record Sale**
Receives sale items, quantities, discounts, payment method, and optional customer details from any authenticated user. Reads product prices from D3. Writes the completed transaction record to D2. Deducts sold quantities from D3. Writes a credit debt entry to D5 when the payment method is credit. Returns a receipt to the recording user.

**3.0 — Manage Inventory**
Receives add, edit, and restock instructions from Owners and Managers. Reads and writes product and stock data in D3. Returns low-stock alerts when item quantities fall below their configured threshold.

**4.0 — Manage Expenses**
Receives expense details (description, amount, category) from the Owner. Writes the expense record to D4.

**5.0 — Generate Reports**
Receives a report request from the Owner. Reads sales data from D2, stock data from D3, and expense data from D4. Returns compiled revenue, profit, and expense reports to the Owner.

**6.0 — Manage Debtors**
Receives debt-viewing and payment-recording instructions from Owners and Managers. Reads and updates debt records in D5. Updates the payment status of the relevant transaction in D2 when a payment is recorded. Returns a debt summary to the requesting user.

**7.0 — AI Assistant**
Receives a natural language query from the Owner. Reads relevant sales data from D2. Sends summarised data to the Groq AI external service. Receives the AI-generated response and returns insights to the Owner.

**8.0 — Reset Password**
Receives an email address from any user requesting a password reset. Reads the corresponding user account from D1. Writes a hashed, time-limited token to D6. Sends a password reset email request to the SMTP service. When the user subsequently submits a new password, validates the token from D6 and writes the new password hash to D1.

---

## 5. Use Case Diagram

### Overview

The Use Case Diagram identifies all the functional capabilities of DwaTrack and maps them to the actors who can perform them. Each use case represents a discrete action a user can initiate within the system boundary. The diagram is organised into eight functional groups, and access control differences between roles are clearly represented.

### Actors

**Owner**
The business owner with full system access. Can perform every use case available in the system.

**Manager**
A staff member with intermediate access. Can record sales, manage inventory, view and record debts, and update their own account settings. Cannot manage expenses, access reports, or manage the team.

**Cashier**
A staff member with basic access. Can record sales, view their own transactions, and update their profile avatar only.

**Groq AI**
An external AI service that is involved as a secondary participant in all AI Assistant use cases.

**SMTP Service**
An external email service involved as a secondary participant in the Forgot Password and Reset Password use cases.

### Use Cases by Group

#### Authentication

| Use Case | Owner | Manager | Cashier | External Participant |
|----------|:-----:|:-------:|:-------:|----------------------|
| Sign Up | ✓ | — | — | — |
| Log In | ✓ | ✓ | ✓ | — |
| Log Out | ✓ | ✓ | ✓ | — |
| Forgot Password | ✓ | ✓ | ✓ | SMTP Service |
| Reset Password | ✓ | ✓ | ✓ | SMTP Service |
| Auto Session Timeout | ✓ | ✓ | ✓ | — |

#### Account & Settings

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| Update Shop Info | ✓ | — | — |
| Configure Tax | ✓ | — | — |
| Upload Avatar | ✓ | ✓ | ✓ |
| Add Team Member | ✓ | — | — |
| Deactivate Team Member | ✓ | — | — |

#### Sales & Transactions

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| Record Cash Sale | ✓ | ✓ | ✓ |
| Record Credit Sale | ✓ | ✓ | ✓ |
| Apply Discount | ✓ | ✓ | ✓ |
| Print Receipt | ✓ | ✓ | ✓ |
| Void Transaction | ✓ | ✓ | — |
| Delete Transaction | ✓ | — | — |
| Search Transactions | ✓ | ✓ | ✓ |

#### Products & Stock

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| Add / Edit Product | ✓ | ✓ | — |
| Delete Product | ✓ | — | — |
| Add Stock Item | ✓ | ✓ | — |
| Restock Item | ✓ | ✓ | — |
| View Low Stock Alerts | ✓ | ✓ | — |

#### Expenses

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| Record Expense | ✓ | — | — |
| Delete Expense | ✓ | — | — |

#### Debtors

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| View Outstanding Debts | ✓ | ✓ | — |
| Record Debt Payment | ✓ | ✓ | — |
| View Payment History | ✓ | ✓ | — |

#### Reports & Analytics

| Use Case | Owner | Manager | Cashier |
|----------|:-----:|:-------:|:-------:|
| View Revenue Report | ✓ | — | — |
| View Expense Breakdown | ✓ | — | — |
| View Sales Activity Heatmap | ✓ | — | — |
| View Product Analysis | ✓ | — | — |

#### AI Assistant

| Use Case | Owner | Manager | Cashier | External Participant |
|----------|:-----:|:-------:|:-------:|----------------------|
| Get Sales Summary | ✓ | — | — | Groq AI |
| Get Restock Tips | ✓ | — | — | Groq AI |
| Chat with Assistant | ✓ | — | — | Groq AI |

### Role Permission Summary

| Feature Area | Owner | Manager | Cashier |
|-------------|:-----:|:-------:|:-------:|
| Authentication & Account | Full | Partial | Basic |
| Sales Recording | Full | Full | Full |
| Transaction Management | Full | Partial | None |
| Products & Stock | Full | Partial | None |
| Expenses | Full | None | None |
| Debtors | Full | Full | None |
| Reports & Analytics | Full | None | None |
| AI Assistant | Full | None | None |
| Team Management | Full | None | None |

---

*Documentation prepared for the DwaTrack Business Tracking System project report.*
