"""
Data Warehouse Schemas & Database Initialization for Retail Analytics
Defines Star Schema, Snowflake Schema, and Fact Constellation Schema tables.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "warehouse.db")

def init_database(db_path=DB_PATH):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Enable foreign keys
    cur.execute("PRAGMA foreign_keys = ON;")

    # ==========================================
    # 1. STAR SCHEMA TABLES
    # ==========================================
    # Dimension: Date
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_date (
        date_key INTEGER PRIMARY KEY,
        full_date TEXT NOT NULL UNIQUE,
        day INTEGER NOT NULL,
        day_name TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        month INTEGER NOT NULL,
        month_name TEXT NOT NULL,
        quarter INTEGER NOT NULL,
        year INTEGER NOT NULL,
        is_weekend INTEGER NOT NULL
    );
    """)

    # Dimension: Product
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_product (
        product_key INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        brand TEXT NOT NULL,
        unit_price REAL NOT NULL
    );
    """)

    # Dimension: Customer
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_customer (
        customer_key INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        email TEXT,
        city TEXT
    );
    """)

    # Dimension: Store
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_store (
        store_key INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id TEXT NOT NULL UNIQUE,
        store_name TEXT NOT NULL,
        city TEXT NOT NULL,
        region TEXT NOT NULL
    );
    """)

    # Dimension: Channel
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_channel (
        channel_key INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_name TEXT NOT NULL UNIQUE,
        channel_type TEXT NOT NULL
    );
    """)

    # Dimension: Payment
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_payment (
        payment_key INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_method TEXT NOT NULL UNIQUE,
        payment_category TEXT NOT NULL
    );
    """)

    # Fact: Sales (Star Schema Center)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS fact_sales (
        sales_id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT NOT NULL UNIQUE,
        date_key INTEGER NOT NULL,
        customer_key INTEGER NOT NULL,
        product_key INTEGER NOT NULL,
        store_key INTEGER NOT NULL,
        channel_key INTEGER NOT NULL,
        payment_key INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        gross_amount REAL NOT NULL,
        discount_amount REAL NOT NULL,
        net_amount REAL NOT NULL,
        tax_amount REAL NOT NULL,
        FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
        FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key),
        FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
        FOREIGN KEY (store_key) REFERENCES dim_store(store_key),
        FOREIGN KEY (channel_key) REFERENCES dim_channel(channel_key),
        FOREIGN KEY (payment_key) REFERENCES dim_payment(payment_key)
    );
    """)

    # Create indexes for high-speed analytical queries
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fact_sales_date ON fact_sales(date_key);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fact_sales_product ON fact_sales(product_key);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fact_sales_store ON fact_sales(store_key);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fact_sales_channel ON fact_sales(channel_key);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fact_sales_payment ON fact_sales(payment_key);")

    # ==========================================
    # 2. SNOWFLAKE SCHEMA NORMALIZED DIMENSIONS
    # ==========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_category_snow (
        category_key INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_region_snow (
        region_key INTEGER PRIMARY KEY AUTOINCREMENT,
        region_name TEXT NOT NULL UNIQUE,
        country TEXT NOT NULL DEFAULT 'India'
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS dim_city_snow (
        city_key INTEGER PRIMARY KEY AUTOINCREMENT,
        city_name TEXT NOT NULL UNIQUE,
        region_key INTEGER NOT NULL,
        FOREIGN KEY (region_key) REFERENCES dim_region_snow(region_key)
    );
    """)

    # ==========================================
    # 3. FACT CONSTELLATION (GALAXY SCHEMA)
    # Additional Fact Table: Fact_Inventory sharing dim_date, dim_product, dim_store
    # ==========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS fact_inventory (
        inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_key INTEGER NOT NULL,
        product_key INTEGER NOT NULL,
        store_key INTEGER NOT NULL,
        opening_stock INTEGER NOT NULL,
        stock_received INTEGER NOT NULL,
        stock_sold INTEGER NOT NULL,
        closing_stock INTEGER NOT NULL,
        reorder_level INTEGER NOT NULL,
        FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
        FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
        FOREIGN KEY (store_key) REFERENCES dim_store(store_key)
    );
    """)

    # ==========================================
    # 4. ETL AUDIT & LOGGING TABLES
    # ==========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS etl_runs (
        run_id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_timestamp TEXT NOT NULL,
        source_file TEXT NOT NULL,
        rows_processed INTEGER NOT NULL,
        rows_loaded INTEGER NOT NULL,
        rows_rejected INTEGER NOT NULL,
        execution_time_sec REAL NOT NULL,
        status TEXT NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS etl_rejected_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        row_index INTEGER,
        raw_data_json TEXT,
        rejection_reason TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    init_database()
