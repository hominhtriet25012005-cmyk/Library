SELECT DATABASE() AS active_schema, VERSION() AS mysql_version;
SHOW CREATE TABLE book_loans;
SHOW CREATE TABLE reservations;
SELECT status, COUNT(*) AS total FROM book_loans GROUP BY status ORDER BY status;
SELECT status, COUNT(*) AS total FROM reservations GROUP BY status ORDER BY status;
SELECT version, applied_at FROM lr_schema_migrations WHERE version = 'LR1_RESERVED_COPIES';
SELECT table_name, column_name, column_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'library_db1' AND table_name IN ('book_loans','reservations') ORDER BY table_name, ordinal_position;