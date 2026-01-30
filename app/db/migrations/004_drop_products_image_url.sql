-- Remove coluna image_url da tabela products
ALTER TABLE products
DROP COLUMN IF EXISTS image_url;
