import csv
import os
from dotenv import load_dotenv
import psycopg2
from io import StringIO

load_dotenv()

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DB = os.getenv("PG_DB")
PG_USER = os.getenv("PG_USER")
PG_PASSWORD = os.getenv("PG_PASSWORD")

CSV_PATH = "amostra_GTIN.csv"  # ajuste se estiver em outro caminho

'''
def format_ncm(raw: str) -> tuple[str | None, str | None]:
    raw = (raw or "").strip().replace(".", "")
    if not raw:
        return None, None
    raw = raw.zfill(8)[:8]
    ncm = raw
    ncm_formatted = f"{raw[0:4]}.{raw[4:6]}.{raw[6:8]}"
    return ncm, ncm_formatted
'''

def format_ncm(raw: str) -> str | None:
    raw = (raw or "").strip().replace(".", "")
    if not raw:
        return None
    raw = raw.zfill(8)[:8]
    return raw  # só o NCM limpo com 8 dígitos


def parse_cest(row: dict) -> list[str] | None:
    cest_fields = [row.get("CEST_1", ""), row.get("CEST_2", ""), row.get("CEST_3", "")]
    cest_list = [c.strip() for c in cest_fields if c and c.strip()]
    return cest_list if cest_list else None

def parse_weight(value: str) -> float | None:
    if not value:
        return None
    value = value.replace(",", ".").strip()
    try:
        return float(value)
    except ValueError:
        return None

def normalize_gtin(raw: str) -> str | None:
    if not raw:
        return None
    digits = "".join(ch for ch in raw if ch.isdigit())
    return digits or None

def main():
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        dbname=PG_DB,
        user=PG_USER,
        password=PG_PASSWORD,
    )
    conn.autocommit = False

    # Vamos usar COPY via CSV em memória
    buffer = StringIO()
    writer = csv.writer(buffer, delimiter=";")

    # Ordem das colunas deve bater com COPY
    columns = [
        "gtin",
        "gtin_type",
        "brand",
        "product_name",
        "owner_tax_id",
        "origin_country",
        "ncm",
        #"ncm_formatted",
        "cest",
        "gross_weight_value",
        "gross_weight_unit",
    ]

    with open(CSV_PATH, "r", encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            gtin = normalize_gtin(row.get("GTIN"))
            if not gtin:
                continue  # pula registros sem GTIN

            # TPGTIN -> smallint
            gtin_type_raw = (row.get("TPGTIN") or "").strip()
            try:
                gtin_type = int(gtin_type_raw) if gtin_type_raw else None
            except ValueError:
                gtin_type = None

            brand = (row.get("MARCA") or "").strip() or None
            product_name = (row.get("XPROD") or "").strip() or None

            owner_tax_id = (
                row.get("CNPJ_CPF") or ""
            ).strip().replace(".", "").replace("/", "").replace("-", "") or None

            origin_country = (row.get("XORIGEM") or "").strip() or None

            #ncm, ncm_formatted = format_ncm(row.get("NCM"))
            ncm = format_ncm(row.get("NCM"))

            cest_list = parse_cest(row)
            cest_pg = "{" + ",".join(cest_list) + "}" if cest_list else None

            gross_weight_value = parse_weight(row.get("PESOB"))
            gross_weight_unit = (row.get("UNIDPESOB") or "").strip() or None

            writer.writerow([
                gtin,
                gtin_type,
                brand,
                product_name,
                owner_tax_id,
                origin_country,
                ncm,
                #ncm_formatted,
                cest_pg,
                gross_weight_value,
                gross_weight_unit,
            ])


    buffer.seek(0)

    with conn.cursor() as cur:
        # você pode limpar antes se for um load inicial:
        # cur.execute("TRUNCATE TABLE products;")

        copy_sql = f"""
            COPY products ({", ".join(columns)})
            FROM STDIN WITH (FORMAT csv, DELIMITER ';', NULL '');
        """

        cur.copy_expert(copy_sql, buffer)

    conn.commit()
    conn.close()
    print("Carga concluída com sucesso.")

if __name__ == "__main__":
    main()
