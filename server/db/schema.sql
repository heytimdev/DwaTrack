-- DwaTrack Database Schema
-- Run this once against your PostgreSQL database to create all tables.
-- psql $DATABASE_URL -f server/db/schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Owners ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       VARCHAR(100)  NOT NULL,
  last_name        VARCHAR(100)  NOT NULL,
  email            VARCHAR(255)  NOT NULL UNIQUE,
  password_hash    VARCHAR(255)  NOT NULL,
  business_name    VARCHAR(255),
  business_email   VARCHAR(255),
  phone_number     VARCHAR(50),
  city             VARCHAR(100),
  country          VARCHAR(100)  NOT NULL DEFAULT 'Ghana',
  currency         VARCHAR(20)   NOT NULL DEFAULT 'GH₵',
  business_logo    TEXT,          -- stored as base64 data URI
  avatar           TEXT,          -- stored as base64 data URI
  tax_enabled      BOOLEAN       NOT NULL DEFAULT FALSE,
  tax_label        VARCHAR(50)   NOT NULL DEFAULT 'VAT',
  tax_rate         NUMERIC(5,2)  NOT NULL DEFAULT 0,
  role             VARCHAR(20)   NOT NULL DEFAULT 'owner'
                     CHECK (role = 'owner'),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Team members (managers & cashiers) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar        TEXT,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('manager', 'cashier')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
  added_on      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, email)
);

-- ── Customers (named debtors / repeat customers) ──────────────────────────────
-- Must be defined before transactions so the FK reference resolves correctly.
CREATE TABLE IF NOT EXISTS customers (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(50),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);

-- ── Transactions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_number  VARCHAR(50)   NOT NULL,
  customer        VARCHAR(255)  DEFAULT 'Walk-in Customer',
  items           JSONB         NOT NULL DEFAULT '[]',
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_label       VARCHAR(50),
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(50)   NOT NULL DEFAULT 'cash',
  added_by        VARCHAR(255),
  status          VARCHAR(20)   NOT NULL DEFAULT 'completed'
                    CHECK (status IN ('completed', 'voided')),
  void_reason     VARCHAR(500),
  voided_at       TIMESTAMPTZ,
  -- Credit-sale fields
  customer_id     UUID          REFERENCES customers(id) ON DELETE SET NULL,
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'paid'
                    CHECK (payment_status IN ('paid', 'credit', 'partial')),
  amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_owner_id   ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);

-- ── Products ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    VARCHAR(100),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);

-- ── Expenses ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description VARCHAR(500)  NOT NULL,
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  category    VARCHAR(100),
  added_by    VARCHAR(255),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON expenses(owner_id);

-- ── Stock ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock (
  id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  quantity            INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  added_on            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_owner_id ON stock(owner_id);

-- ── Debt payments (subsequent payments against a credit transaction) ───────────
CREATE TABLE IF NOT EXISTS debt_payments (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID          NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  note           VARCHAR(500),
  recorded_by    VARCHAR(255),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_transaction_id ON debt_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_owner_id       ON debt_payments(owner_id);

-- ── Password reset tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- ── Upgrade scripts (run against an existing database) ────────────────────────
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS country       VARCHAR(100)  NOT NULL DEFAULT 'Ghana';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS currency      VARCHAR(20)   NOT NULL DEFAULT 'GH₵';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_enabled   BOOLEAN       NOT NULL DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_label     VARCHAR(50)   NOT NULL DEFAULT 'VAT';
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_rate      NUMERIC(5,2)  NOT NULL DEFAULT 0;
-- ALTER TABLE users ALTER COLUMN business_name DROP NOT NULL;
-- ALTER TABLE users ALTER COLUMN business_email DROP NOT NULL;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_label      VARCHAR(50);
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount     NUMERIC(12,2) NOT NULL DEFAULT 0;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer       VARCHAR(255)  DEFAULT 'Walk-in Customer';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status         VARCHAR(20)   NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','voided'));
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason    VARCHAR(500);
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS voided_at      TIMESTAMPTZ;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20)   NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','credit','partial'));
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_paid    NUMERIC(12,2) NOT NULL DEFAULT 0;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;
-- CREATE TABLE IF NOT EXISTS password_reset_tokens (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, token_hash VARCHAR(255) NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
ALTER TABLE users        ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS avatar TEXT;
