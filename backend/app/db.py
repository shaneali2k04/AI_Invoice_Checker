import json
import sqlite3
from pathlib import Path
from typing import Any, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "app.db"


def get_conn() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(
            """
            PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS documents (
              id TEXT PRIMARY KEY,
              filename TEXT NOT NULL,
              stored_path TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS jobs (
              id TEXT PRIMARY KEY,
              document_id TEXT NOT NULL,
              status TEXT NOT NULL, -- queued | running | completed | failed
              total_pages INTEGER,
              processed_pages INTEGER NOT NULL DEFAULT 0,
              message TEXT,
              error TEXT,
              invoice_ids_json TEXT,
              has_low_readability INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(document_id) REFERENCES documents(id)
            );

            CREATE TABLE IF NOT EXISTS parties (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL, -- supplier | buyer
              name_raw TEXT,
              name_norm TEXT,
              ntn_raw TEXT,
              ntn_norm TEXT,
              gst_raw TEXT,
              gst_norm TEXT,
              registration_raw TEXT,
              registration_norm TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS invoices (
              id TEXT PRIMARY KEY,
              document_id TEXT NOT NULL,
              page_no INTEGER NOT NULL,
              supplier_party_id TEXT,
              buyer_party_id TEXT,
              extracted_json TEXT NOT NULL,
              edited_json TEXT,
              status TEXT NOT NULL,
              needs_rescan INTEGER NOT NULL DEFAULT 0,
              unreadable_fields_json TEXT,
              reasons_json TEXT,
              model_avg_confidence REAL,
              system_confidence REAL,
              system_reasons_json TEXT,
              field_diagnostics_json TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(document_id) REFERENCES documents(id)
            );

            CREATE INDEX IF NOT EXISTS idx_invoices_document_id ON invoices(document_id);
            CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
            CREATE INDEX IF NOT EXISTS idx_jobs_document_id ON jobs(document_id);
            CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

            -- Prefer stable identifiers over names; normalize before storage.
            CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_type_ntn_unique
              ON parties(type, ntn_norm)
              WHERE ntn_norm IS NOT NULL AND ntn_norm <> '';
            CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_type_registration_unique
              ON parties(type, registration_norm)
              WHERE registration_norm IS NOT NULL AND registration_norm <> '';
            """
        )
        conn.commit()

        # If an older DB has non-partial UNIQUE indexes on identifiers, they can cause
        # failures for placeholder/blank-like IDs (or if we need to merge parties).
        # Drop those legacy indexes and ensure the partial ones exist.
        legacy = conn.execute(
            """
            SELECT name, sql
              FROM sqlite_master
             WHERE type = 'index'
               AND tbl_name = 'parties'
               AND sql LIKE 'CREATE UNIQUE INDEX%'
            """
        ).fetchall()
        for r in legacy:
            name = r["name"]
            sql = (r["sql"] or "").upper()
            if "REGISTRATION_NORM" in sql and "WHERE REGISTRATION_NORM IS NOT NULL" not in sql:
                conn.execute(f"DROP INDEX IF EXISTS {name}")
            if "NTN_NORM" in sql and "WHERE NTN_NORM IS NOT NULL" not in sql:
                conn.execute(f"DROP INDEX IF EXISTS {name}")
        # Recreate expected partial unique indexes (idempotent).
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_type_ntn_unique
              ON parties(type, ntn_norm)
              WHERE ntn_norm IS NOT NULL AND ntn_norm <> '';
            """
        )
        conn.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_parties_type_registration_unique
              ON parties(type, registration_norm)
              WHERE registration_norm IS NOT NULL AND registration_norm <> '';
            """
        )
        conn.commit()

        # Data hygiene: treat placeholder IDs as missing to avoid UNIQUE conflicts like "NA".
        # (Older DBs may already contain these.)
        conn.execute(
            """
            UPDATE parties
               SET registration_raw = NULL,
                   registration_norm = NULL,
                   updated_at = updated_at
             WHERE UPPER(COALESCE(registration_raw, '')) IN ('N/A','NA','N.A','N.A.','NOT APPLICABLE','NOTAPPLICABLE','NONE','NULL')
                OR UPPER(COALESCE(registration_norm, '')) IN ('NA','NONE','NULL');
            """
        )
        conn.execute(
            """
            UPDATE parties
               SET ntn_raw = NULL,
                   ntn_norm = NULL,
                   updated_at = updated_at
             WHERE UPPER(COALESCE(ntn_raw, '')) IN ('N/A','NA','N.A','N.A.','NOT APPLICABLE','NOTAPPLICABLE','NONE','NULL')
                OR UPPER(COALESCE(ntn_norm, '')) IN ('NA','NONE','NULL');
            """
        )
        conn.commit()

        # Lightweight migrations for existing DBs: add missing columns.
        existing_cols = {r["name"] for r in conn.execute("PRAGMA table_info(invoices)").fetchall()}
        desired = {
            "supplier_party_id": "TEXT",
            "buyer_party_id": "TEXT",
            "model_avg_confidence": "REAL",
            "system_confidence": "REAL",
            "system_reasons_json": "TEXT",
            "field_diagnostics_json": "TEXT",
        }
        for col, col_type in desired.items():
            if col not in existing_cols:
                conn.execute(f"ALTER TABLE invoices ADD COLUMN {col} {col_type}")
        conn.commit()

        # Create indexes that depend on migrated columns (avoid startup failures on old DBs).
        existing_cols = {r["name"] for r in conn.execute("PRAGMA table_info(invoices)").fetchall()}
        if "supplier_party_id" in existing_cols:
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_invoices_supplier_party_id ON invoices(supplier_party_id)"
            )
        if "buyer_party_id" in existing_cols:
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_invoices_buyer_party_id ON invoices(buyer_party_id)"
            )
        conn.commit()
    finally:
        conn.close()


def dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False)


def loads(s: Optional[str]) -> Any:
    if not s:
        return None
    return json.loads(s)

