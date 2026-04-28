-- 006_dlsm_schema.sql
SET search_path = dlsm, public;

CREATE SCHEMA IF NOT EXISTS dlsm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dlsm.units (
  id text PRIMARY KEY,
  kind text NOT NULL,
  name text,
  category text,
  status text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_value text NOT NULL UNIQUE,
  actor text NOT NULL,
  ui_mode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.unit_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  value text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'NEEDS_VERIFY',
  unit_id text NOT NULL REFERENCES dlsm.units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.containment_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id text NOT NULL REFERENCES dlsm.units(id) ON DELETE CASCADE,
  child_id text NOT NULL REFERENCES dlsm.units(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  added_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS dlsm_containment_child_active
  ON dlsm.containment_edges (child_id)
  WHERE removed_at IS NULL;

CREATE TABLE IF NOT EXISTS dlsm.locations (
  id text PRIMARY KEY,
  shelf text NOT NULL,
  depth integer NOT NULL,
  slot text NOT NULL,
  row integer NOT NULL,
  col integer NOT NULL,
  UNIQUE (shelf, depth, slot)
);

CREATE TABLE IF NOT EXISTS dlsm.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL REFERENCES dlsm.locations(id) ON DELETE CASCADE,
  reason text,
  created_by text,
  expires_at timestamptz,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.location_state (
  location_id text PRIMARY KEY REFERENCES dlsm.locations(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'empty',
  label text,
  occupied_unit_id text REFERENCES dlsm.units(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES dlsm.reservations(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.shipments (
  id text PRIMARY KEY,
  supplier text NOT NULL,
  status text NOT NULL,
  processed_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.shipment_lines (
  shipment_id text NOT NULL REFERENCES dlsm.shipments(id) ON DELETE CASCADE,
  sku text NOT NULL,
  name text NOT NULL,
  expected_qty integer NOT NULL DEFAULT 0,
  counted_qty integer NOT NULL DEFAULT 0,
  issue_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shipment_id, sku)
);

CREATE TABLE IF NOT EXISTS dlsm.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  actor_id text,
  entity_type text,
  entity_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dlsm.moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text REFERENCES dlsm.units(id) ON DELETE SET NULL,
  from_path text,
  to_path text,
  reason text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  executed_by text,
  result jsonb
);

CREATE TABLE IF NOT EXISTS dlsm.irregular_footprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL REFERENCES dlsm.units(id) ON DELETE CASCADE,
  shelf text NOT NULL,
  slot_ids text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
