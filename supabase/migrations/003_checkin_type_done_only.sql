-- Remove any legacy grace check-ins before tightening the constraint
DELETE FROM check_ins WHERE type = 'grace';
-- Drop the inline CHECK constraint Postgres auto-named at table creation
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_type_check;
-- Re-add allowing only 'done' — grace is inferred, never stored
ALTER TABLE check_ins ADD CONSTRAINT check_ins_type_check CHECK (type IN ('done'));
