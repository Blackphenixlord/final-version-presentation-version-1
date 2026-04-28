-- 007_dlsm_seed.sql
SET search_path = dlsm, public;

INSERT INTO dlsm.units (id, kind, name, category, status, metadata)
VALUES
  ('CTB-0001','CTB','CTB Standard','Container','ACTIVE', NULL),
  ('CTB-0002','CTB','CTB Nested','Container','ACTIVE', NULL),
  ('CTB-0044','CTB','CTB Payload','Container','ACTIVE', NULL),
  ('BOB-FOOD-01','Bob','Food Bob','Food','ACTIVE', NULL),
  ('MEAL-0001','Meal','Pasta Primavera','Food','ACTIVE', '{"type":"Vegetarian","calories":650,"expiry":"2026-08-01"}'),
  ('MEAL-0002','Meal','Veggie Curry','Food','ACTIVE', '{"type":"Vegetarian","calories":630,"expiry":"2026-08-06"}'),
  ('PKG-LAB-01','Package','Lab Pack','Lab','ACTIVE', NULL),
  ('ITEM-LAB-01','Item','Experiment Kit','Lab','ACTIVE', NULL),
  ('ITEM-MED-01','Item','Med Kit','Med','ACTIVE', NULL),
  ('IRR-001','Irregular','Oversize Panel','Irregular','ACTIVE', NULL),
  ('ITEM-0142','Item','Protein Bar (Vanilla)','Food','ACTIVE','{"homeLocation":"S1D3L8/CTB-FOOD-07/BOB-DAY12/ITEM-0142"}'),
  ('ITEM-0311','Item','Multitool','Tools','ACTIVE','{"homeLocation":"S2D1L15/CTB-TOOLS-02/CTB-HAND-01/ITEM-0311"}'),
  ('ITEM-0904','Item','Cable (USB-C, 1m)','Electrical','ACTIVE','{"homeLocation":"S3D2L4/CTB-ELEC-01/CTB-CABLE-03/ITEM-0904"}'),
  ('ITEM-1007','Item','Notebook','Misc','ACTIVE','{"homeLocation":"IRAL8L12"}'),
  ('ITEM-2048','Item','Medical Tape','Medical','ACTIVE','{"homeLocation":"S1D4L13/CTB-MED-03/CTB-WOUND-02/ITEM-2048"}'),
  ('ITEM-0081','Item','Protein Bar','Waste','ACTIVE','{"trashType":"WET"}'),
  ('ITEM-0144','Item','Gloves (nitrile)','Waste','ACTIVE','{"trashType":"DRY"}'),
  ('ITEM-0207','Item','Lab Vial','Waste','ACTIVE','{"trashType":"SHARP"}'),
  ('ITEM-0330','Item','Solvent Wipe','Waste','ACTIVE','{"trashType":"CHEM"}'),
  ('ITEM-0412','Item','Packaging Film','Waste','ACTIVE','{"trashType":"REC"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO dlsm.unit_identifiers (type, value, status, unit_id)
VALUES
  ('RFID','CTB-0001','TAGGED','CTB-0001'),
  ('RFID','BOB-FOOD-01','TAGGED','BOB-FOOD-01'),
  ('RFID','MEAL-0001','TAGGED','MEAL-0001'),
  ('RFID','IRR-001','NEEDS_VERIFY','IRR-001'),
  ('RFID','RFID-7F3A-0142','TAGGED','ITEM-0142'),
  ('RFID','RFID-2C1D-0311','TAGGED','ITEM-0311'),
  ('RFID','RFID-99AA-0904','TAGGED','ITEM-0904'),
  ('RFID','RFID-0B77-1007','TAGGED','ITEM-1007'),
  ('RFID','RFID-6D20-2048','TAGGED','ITEM-2048'),
  ('RFID','RFID-0081','TAGGED','ITEM-0081'),
  ('RFID','RFID-0144','TAGGED','ITEM-0144'),
  ('RFID','RFID-0207','TAGGED','ITEM-0207'),
  ('RFID','RFID-0330','TAGGED','ITEM-0330'),
  ('RFID','RFID-0412','TAGGED','ITEM-0412')
ON CONFLICT (value) DO NOTHING;

INSERT INTO dlsm.containment_edges (parent_id, child_id)
VALUES
  ('CTB-0001','BOB-FOOD-01'),
  ('BOB-FOOD-01','MEAL-0001'),
  ('BOB-FOOD-01','MEAL-0002')
ON CONFLICT DO NOTHING;

INSERT INTO dlsm.shipments (id, supplier, status, metadata)
VALUES
  ('SHIP-8841','KSC Ground Freight','in-progress','{"po":"PO-KSC-ML-8841","carrier":"KSC Ground","dock":"Bay-2","containers":"4","handling":"Cold"}'),
  ('SHIP-8910','Med Supply','discrepancy','{"po":"PO-MED-8910","carrier":"Orbital","dock":"Bay-1","containers":"2","handling":"Sterile"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO dlsm.shipment_lines (shipment_id, sku, name, expected_qty, counted_qty, issue_flag)
VALUES
  ('SHIP-8841','MEAL-PASTA-PRIM','Pasta Primavera',18,12,false),
  ('SHIP-8841','MEAL-CURRY-VEG','Veggie Curry',18,18,false),
  ('SHIP-8841','MEAL-OAT-BFST','Oatmeal Breakfast',12,6,false),
  ('SHIP-8910','MED-KIT-ALPHA','Med Kit Alpha',10,8,true)
ON CONFLICT (shipment_id, sku) DO NOTHING;

INSERT INTO dlsm.irregular_footprints (unit_id, shelf, slot_ids)
VALUES ('IRR-001','C1',ARRAY['L1','L2','L5'])
ON CONFLICT DO NOTHING;

INSERT INTO dlsm.badges (badge_value, actor, ui_mode)
VALUES
  ('0003070837','crew','crew'),
  ('0003104127','ground','ground')
ON CONFLICT (badge_value) DO NOTHING;
