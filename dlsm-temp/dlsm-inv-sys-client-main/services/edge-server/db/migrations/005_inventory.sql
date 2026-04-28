-- services/edge-server/db/migrations/005_inventory.sql
SET search_path = inventory, public;

CREATE SCHEMA IF NOT EXISTS inventory;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS inventory.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  safety_stock integer,
  reorder_point integer,
  status text NOT NULL DEFAULT 'OK',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES inventory.locations(id) ON DELETE CASCADE,
  qty integer NOT NULL DEFAULT 0,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, location_id, expires_at)
);

CREATE TABLE IF NOT EXISTS inventory.logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  item_id uuid NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES inventory.locations(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('IN','OUT')),
  qty integer NOT NULL,
  actor text,
  reason text,
  work_order text
);

CREATE TABLE IF NOT EXISTS inventory.rfid_mappings (
  card_hex text PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES inventory.items(id) ON DELETE CASCADE,
  last_location_id uuid REFERENCES inventory.locations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'TAGGED',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.rfid_unknown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  card_hex text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('IN','OUT')),
  qty integer NOT NULL DEFAULT 1,
  actor text NOT NULL DEFAULT 'unknown',
  location_id uuid REFERENCES inventory.locations(id) ON DELETE SET NULL,
  error text NOT NULL DEFAULT 'CARD_NOT_MAPPED'
);

CREATE TABLE IF NOT EXISTS inventory.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  vendor text NOT NULL,
  status text NOT NULL,
  expected integer NOT NULL DEFAULT 0,
  counted integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES inventory.shipments(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  expected integer NOT NULL DEFAULT 0,
  counted integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS inventory.containers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 0,
  used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.container_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id uuid NOT NULL REFERENCES inventory.containers(id) ON DELETE CASCADE,
  item_sku text NOT NULL,
  item_name text
);

CREATE TABLE IF NOT EXISTS inventory.moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_container text,
  to_container text,
  reason text,
  source_context text,
  dest_context text,
  status text NOT NULL DEFAULT 'COMPLETED',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory.stow_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  shelf text NOT NULL,
  depth text NOT NULL,
  level text NOT NULL,
  status text NOT NULL DEFAULT 'empty',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
