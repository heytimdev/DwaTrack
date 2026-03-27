-- KoboTrack Database Schema
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
  business_name    VARCHAR(255) NOT NULL,
  business_email   VARCHAR(255) NOT NULL,
  phone_number     VARCHAR(50),
  city             VARCHAR(100),
  business_logo    TEXT,          -- stored as base64 data URI
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
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('manager', 'cashier')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
  added_on      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, email)
);

-- ── Transactions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_number  VARCHAR(50)   NOT NULL,
  items           JSONB         NOT NULL DEFAULT '[]',
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(50)   NOT NULL DEFAULT 'cash',
  added_by        VARCHAR(255),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_owner_id  ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ── Products ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
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
