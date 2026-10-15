"""
Retail Sales ETL Pipeline (Extraction, Transformation, Loading)
Handles CSV parsing, data validation, deduplication, missing value imputation,
schema population, rejected record tracking, and audit logging.
"""
import os
import json
import sqlite3
import time
from datetime import datetime
import pandas as pd
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "warehouse.db")
REJECTED_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "rejected_records_latest.csv")

class RetailETLPipeline:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path

    def get_connection(self):
        return sqlite3.connect(self.db_path)

    def extract(self, csv_filepath):
        """Extraction step: read CSV and check basic shape."""
        if not os.path.exists(csv_filepath):
            raise FileNotFoundError(f"File not found: {csv_filepath}")
        df = pd.read_csv(csv_filepath)
        return df

    def transform(self, df, missing_value_strategy="impute"):
        """
        Transformation step:
        - Schema alignment
        - Data type casting
        - Missing value handling
        - Duplicate detection
        - Business validation (positive quantities, valid dates)
        """
        valid_rows = []
        rejected_rows = []
        seen_txn_ids = set()

        # Check existing transaction IDs in DB to prevent duplicates
        conn = self.get_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT transaction_id FROM fact_sales")
            for r in cur.fetchall():
                seen_txn_ids.add(r[0])
        except Exception:
            pass
        finally:
            conn.close()

        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            rejection_reasons = []

            txn_id = str(row_dict.get("transaction_id", "")).strip()
            if not txn_id or txn_id.lower() == "nan":
                rejection_reasons.append("Missing transaction_id")
            elif txn_id in seen_txn_ids:
                rejection_reasons.append(f"Duplicate transaction_id: {txn_id}")
            else:
                seen_txn_ids.add(txn_id)

            # Date validation
            raw_date = row_dict.get("transaction_date")
            parsed_dt = None
            if pd.isna(raw_date) or not str(raw_date).strip():
                rejection_reasons.append("Missing transaction_date")
            else:
                for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S", "%d-%m-%Y"]:
                    try:
                        parsed_dt = datetime.strptime(str(raw_date).strip(), fmt)
                        break
                    except ValueError:
                        continue
                if parsed_dt is None:
                    rejection_reasons.append(f"Invalid transaction_date format: {raw_date}")

            # Product validation
            prod_name = str(row_dict.get("product_name", "")).strip()
            if not prod_name or prod_name.lower() == "nan":
                rejection_reasons.append("Missing product_name")

            # Quantity and amount validation
            try:
                qty = int(row_dict.get("quantity", 0))
                if qty <= 0:
                    rejection_reasons.append(f"Quantity must be greater than zero, found: {qty}")
            except (ValueError, TypeError):
                rejection_reasons.append("Invalid non-numeric quantity")
                qty = 0

            try:
                unit_price = float(row_dict.get("unit_price", 0.0))
                if unit_price <= 0:
                    rejection_reasons.append("Unit price must be positive")
            except (ValueError, TypeError):
                rejection_reasons.append("Invalid unit_price")
                unit_price = 0.0

            try:
                gross = float(row_dict.get("gross_amount", qty * unit_price))
                if gross < 0:
                    rejection_reasons.append("Negative gross amount")
            except (ValueError, TypeError):
                gross = qty * unit_price

            try:
                disc = float(row_dict.get("discount_amount", 0.0))
                if disc < 0:
                    rejection_reasons.append("Negative discount amount")
            except (ValueError, TypeError):
                disc = 0.0

            if disc > gross and gross > 0:
                rejection_reasons.append("Discount amount cannot exceed gross amount")

            # Missing value imputation or handling for other fields
            cust_name = str(row_dict.get("customer_name", "")).strip()
            if not cust_name or cust_name.lower() == "nan":
                if missing_value_strategy == "drop":
                    rejection_reasons.append("Missing customer_name (dropped per policy)")
                else:
                    cust_name = "Guest Customer"

            cust_id = str(row_dict.get("customer_id", "")).strip()
            if not cust_id or cust_id.lower() == "nan":
                cust_id = f"GUEST_{idx+1}"

            channel = str(row_dict.get("channel", "In-Store")).strip()
            if not channel or channel.lower() == "nan":
                channel = "In-Store"

            payment = str(row_dict.get("payment_method", "Cash on Delivery")).strip()
            if not payment or payment.lower() == "nan":
                payment = "Cash on Delivery"

            cat = str(row_dict.get("product_category", "General")).strip()
            if not cat or cat.lower() == "nan":
                cat = "General"

            brand = str(row_dict.get("brand", "Generic")).strip()
            if not brand or brand.lower() == "nan":
                brand = "Generic"

            store_id = str(row_dict.get("store_id", "STR_01")).strip()
            store_name = str(row_dict.get("store_name", "Flagship Store")).strip()
            store_city = str(row_dict.get("store_city", "Pune")).strip()
            store_region = str(row_dict.get("store_region", "West")).strip()

            if rejection_reasons:
                rejected_rows.append({
                    "row_index": idx + 1,
                    "raw_data": row_dict,
                    "rejection_reason": "; ".join(rejection_reasons)
                })
            else:
                net = round(gross - disc, 2)
                tax = round(net * 0.18, 2)
                date_key = int(parsed_dt.strftime("%Y%m%d"))

                valid_rows.append({
                    "transaction_id": txn_id,
                    "datetime": parsed_dt,
                    "date_key": date_key,
                    "customer_id": cust_id,
                    "customer_name": cust_name,
                    "customer_email": str(row_dict.get("customer_email", f"{cust_id.lower()}@example.com")),
                    "product_name": prod_name,
                    "product_category": cat,
                    "brand": brand,
                    "unit_price": unit_price,
                    "quantity": qty,
                    "gross_amount": gross,
                    "discount_amount": disc,
                    "net_amount": net,
                    "tax_amount": tax,
                    "payment_method": payment,
                    "channel": channel,
                    "store_id": store_id,
                    "store_name": store_name,
                    "store_city": store_city,
                    "store_region": store_region
                })

        return valid_rows, rejected_rows

    def load(self, valid_rows, rejected_rows, source_filename="data_feed.csv"):
        """
        Loading step:
        Inserts dimension and fact records into SQLite DW.
        Saves rejected rows and updates audit logs.
        """
        start_time = time.time()
        conn = self.get_connection()
        cur = conn.cursor()

        # Cache dimension lookups to avoid slow per-row queries
        date_cache = {}
        prod_cache = {}
        cust_cache = {}
        store_cache = {}
        channel_cache = {}
        payment_cache = {}

        # Preload caches
        cur.execute("SELECT date_key FROM dim_date")
        for r in cur.fetchall():
            date_cache[r[0]] = r[0]

        cur.execute("SELECT product_name, product_key FROM dim_product")
        for r in cur.fetchall():
            prod_cache[r[0]] = r[1]

        cur.execute("SELECT customer_id, customer_key FROM dim_customer")
        for r in cur.fetchall():
            cust_cache[r[0]] = r[1]

        cur.execute("SELECT store_id, store_key FROM dim_store")
        for r in cur.fetchall():
            store_cache[r[0]] = r[1]

        cur.execute("SELECT channel_name, channel_key FROM dim_channel")
        for r in cur.fetchall():
            channel_cache[r[0]] = r[1]

        cur.execute("SELECT payment_method, payment_key FROM dim_payment")
        for r in cur.fetchall():
            payment_cache[r[0]] = r[1]

        cur.execute("SELECT category_name, category_key FROM dim_category_snow")
        snow_cat_cache = {r[0]: r[1] for r in cur.fetchall()}

        cur.execute("SELECT region_name, region_key FROM dim_region_snow")
        snow_reg_cache = {r[0]: r[1] for r in cur.fetchall()}

        cur.execute("SELECT city_name, city_key FROM dim_city_snow")
        snow_city_cache = {r[0]: r[1] for r in cur.fetchall()}

        # Insert dimensions
        for row in valid_rows:
            # 1. Dim Date
            dk = row["date_key"]
            if dk not in date_cache:
                dt = row["datetime"]
                cur.execute("""
                INSERT OR IGNORE INTO dim_date (date_key, full_date, day, day_name, day_of_week, month, month_name, quarter, year, is_weekend)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    dk,
                    dt.strftime("%Y-%m-%d"),
                    dt.day,
                    dt.strftime("%A"),
                    dt.weekday() + 1,
                    dt.month,
                    dt.strftime("%B"),
                    (dt.month - 1) // 3 + 1,
                    dt.year,
                    1 if dt.weekday() >= 5 else 0
                ))
                date_cache[dk] = dk

            # 2. Dim Product & Snowflake Dim Category
            pname = row["product_name"]
            pcat = row["product_category"]
            if pcat not in snow_cat_cache:
                cur.execute("INSERT OR IGNORE INTO dim_category_snow (category_name, department) VALUES (?, ?)", (pcat, "Retail Merchandise"))
                snow_cat_cache[pcat] = cur.lastrowid

            if pname not in prod_cache:
                cur.execute("""
                INSERT OR IGNORE INTO dim_product (product_name, category, brand, unit_price)
                VALUES (?, ?, ?, ?)
                """, (pname, pcat, row["brand"], row["unit_price"]))
                cur.execute("SELECT product_key FROM dim_product WHERE product_name = ?", (pname,))
                prod_cache[pname] = cur.fetchone()[0]

            # 3. Dim Customer
            cid = row["customer_id"]
            if cid not in cust_cache:
                cur.execute("""
                INSERT OR IGNORE INTO dim_customer (customer_id, customer_name, gender, age, email, city)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (cid, row["customer_name"], "Unknown", 30, row["customer_email"], row["store_city"]))
                cur.execute("SELECT customer_key FROM dim_customer WHERE customer_id = ?", (cid,))
                cust_cache[cid] = cur.fetchone()[0]

            # 4. Dim Store & Snowflake Dim Region / City
            sid = row["store_id"]
            sreg = row["store_region"]
            scity = row["store_city"]
            if sreg not in snow_reg_cache:
                cur.execute("INSERT OR IGNORE INTO dim_region_snow (region_name, country) VALUES (?, 'India')", (sreg,))
                cur.execute("SELECT region_key FROM dim_region_snow WHERE region_name = ?", (sreg,))
                snow_reg_cache[sreg] = cur.fetchone()[0]

            if scity not in snow_city_cache:
                cur.execute("INSERT OR IGNORE INTO dim_city_snow (city_name, region_key) VALUES (?, ?)", (scity, snow_reg_cache[sreg]))
                cur.execute("SELECT city_key FROM dim_city_snow WHERE city_name = ?", (scity,))
                snow_city_cache[scity] = cur.fetchone()[0]

            if sid not in store_cache:
                cur.execute("""
                INSERT OR IGNORE INTO dim_store (store_id, store_name, city, region)
                VALUES (?, ?, ?, ?)
                """, (sid, row["store_name"], scity, sreg))
                cur.execute("SELECT store_key FROM dim_store WHERE store_id = ?", (sid,))
                store_cache[sid] = cur.fetchone()[0]

            # 5. Dim Channel
            ch = row["channel"]
            if ch not in channel_cache:
                ch_type = "Physical" if ch == "In-Store" else "Digital"
                cur.execute("INSERT OR IGNORE INTO dim_channel (channel_name, channel_type) VALUES (?, ?)", (ch, ch_type))
                cur.execute("SELECT channel_key FROM dim_channel WHERE channel_name = ?", (ch,))
                channel_cache[ch] = cur.fetchone()[0]

            # 6. Dim Payment
            pm = row["payment_method"]
            if pm not in payment_cache:
                cat_pm = "Electronic" if pm in ["UPI", "Credit Card", "Debit Card", "Net Banking"] else "Cash"
                cur.execute("INSERT OR IGNORE INTO dim_payment (payment_method, payment_category) VALUES (?, ?)", (pm, cat_pm))
                cur.execute("SELECT payment_key FROM dim_payment WHERE payment_method = ?", (pm,))
                payment_cache[pm] = cur.fetchone()[0]

        # Insert Fact Sales batch
        sales_records = [
            (
                row["transaction_id"],
                row["date_key"],
                cust_cache[row["customer_id"]],
                prod_cache[row["product_name"]],
                store_cache[row["store_id"]],
                channel_cache[row["channel"]],
                payment_cache[row["payment_method"]],
                row["quantity"],
                row["unit_price"],
                row["gross_amount"],
                row["discount_amount"],
                row["net_amount"],
                row["tax_amount"]
            )
            for row in valid_rows
        ]

        cur.executemany("""
        INSERT OR IGNORE INTO fact_sales (
            transaction_id, date_key, customer_key, product_key, store_key, channel_key, payment_key,
            quantity, unit_price, gross_amount, discount_amount, net_amount, tax_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sales_records)

        # Generate Fact Inventory snapshot records (Fact Constellation)
        # Sample representative inventory points
        cur.execute("SELECT COUNT(*) FROM fact_inventory")
        inv_count = cur.fetchone()[0]
        if inv_count == 0 and len(valid_rows) > 0:
            inv_records = []
            distinct_products = list(prod_cache.values())
            distinct_stores = list(store_cache.values())
            distinct_dates = list(date_cache.keys())[:30] # first 30 days
            for d in distinct_dates:
                for s in distinct_stores:
                    for p in distinct_products[:8]: # top 8 products
                        opening = 100
                        rcv = 20
                        sold = 15
                        closing = opening + rcv - sold
                        inv_records.append((d, p, s, opening, rcv, sold, closing, 25))
            cur.executemany("""
            INSERT INTO fact_inventory (date_key, product_key, store_key, opening_stock, stock_received, stock_sold, closing_stock, reorder_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, inv_records)

        elapsed = round(time.time() - start_time, 2)
        status = "SUCCESS" if len(rejected_rows) == 0 else "COMPLETED_WITH_WARNINGS"

        # Log ETL Run
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute("""
        INSERT INTO etl_runs (run_timestamp, source_file, rows_processed, rows_loaded, rows_rejected, execution_time_sec, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (now_str, source_filename, len(valid_rows) + len(rejected_rows), len(valid_rows), len(rejected_rows), elapsed, status))
        run_id = cur.lastrowid

        # Log Rejected Records
        rejected_csv_data = []
        for rej in rejected_rows:
            raw_json = json.dumps(rej["raw_data"], default=str)
            cur.execute("""
            INSERT INTO etl_rejected_records (run_id, row_index, raw_data_json, rejection_reason, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (run_id, rej["row_index"], raw_json, rej["rejection_reason"], now_str))
            
            flat_rej = dict(rej["raw_data"])
            flat_rej["_rejection_reason"] = rej["rejection_reason"]
            flat_rej["_row_index"] = rej["row_index"]
            rejected_csv_data.append(flat_rej)

        conn.commit()
        conn.close()

        # Save rejected records CSV for export download
        os.makedirs(os.path.dirname(REJECTED_CSV_PATH), exist_ok=True)
        if rejected_csv_data:
            pd.DataFrame(rejected_csv_data).to_csv(REJECTED_CSV_PATH, index=False)
        elif os.path.exists(REJECTED_CSV_PATH):
            pd.DataFrame(columns=["row_index", "rejection_reason"]).to_csv(REJECTED_CSV_PATH, index=False)

        return {
            "run_id": run_id,
            "status": status,
            "timestamp": now_str,
            "rows_processed": len(valid_rows) + len(rejected_rows),
            "rows_loaded": len(valid_rows),
            "rows_rejected": len(rejected_rows),
            "execution_time_sec": elapsed
        }

    def run_pipeline(self, csv_filepath, missing_value_strategy="impute"):
        df = self.extract(csv_filepath)
        valid, rejected = self.transform(df, missing_value_strategy)
        summary = self.load(valid, rejected, source_filename=os.path.basename(csv_filepath))
        return summary, rejected

if __name__ == "__main__":
    from schema import init_database
    init_database()
    pipeline = RetailETLPipeline()
    clean_csv = os.path.join(os.path.dirname(__file__), "..", "data", "retail_sales_clean.csv")
    summary, rejected = pipeline.run_pipeline(clean_csv)
    print("ETL Run Complete:", summary)
