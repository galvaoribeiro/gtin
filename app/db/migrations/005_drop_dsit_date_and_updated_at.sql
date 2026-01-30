-- Remove colunas dsit_date e updated_at de todas as tabelas (idempotente)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT table_schema, table_name, column_name
        FROM information_schema.columns
        WHERE column_name IN ('dsit_date', 'updated_at')
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format(
            'ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I',
            rec.table_schema,
            rec.table_name,
            rec.column_name
        );
    END LOOP;
END;
$$;
