"""
Flask REST API for Retail Sales Data Warehouse & Analytics BI Platform
Provides analytical querying, schema exploration, ETL execution, and data export.
"""
import os
import io
import json
import sqlite3
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from etl import RetailETLPipeline, DB_PATH, REJECTED_CSV_PATH
from schema import init_database
from generate_data import generate_datasets

app = Flask(__name__)
CORS(app)

pipeline = RetailETLPipeline(DB_PATH)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def build_filter_clause(filters, prefix=""):
    """Build dynamic SQL WHERE clause and parameters from request filters."""
    where = ["1=1"]
    params = []

    p = f"{prefix}." if prefix else ""

    start_date = filters.get("startDate")
    end_date = filters.get("endDate")
    category = filters.get("category")
    store = filters.get("store")
    channel = filters.get("channel")

    if start_date:
        start_key = int(start_date.replace("-", ""))
        where.append(f"{p}date_key >= ?")
        params.append(start_key)

    if end_date:
        end_key = int(end_date.replace("-", ""))
        where.append(f"{p}date_key <= ?")
        params.append(end_key)

    if category and category != "All" and category != "All Categories":
        where.append("dp.category = ?")
        params.append(category)

    if store and store != "All" and store != "All Stores":
        where.append("ds.store_name = ?")
        params.append(store)

    if channel and channel != "All" and channel != "All Channels":
        where.append("dc.channel_name = ?")
        params.append(channel)

    return " AND ".join(where), params

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "Retail DW Analytics API", "version": "1.0.0"})

@app.route("/api/filters", methods=["GET"])
def get_filter_options():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT category FROM dim_product ORDER BY category")
    categories = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT DISTINCT store_name FROM dim_store ORDER BY store_name")
    stores = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT DISTINCT channel_name FROM dim_channel ORDER BY channel_name")
    channels = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT MIN(full_date), MAX(full_date) FROM dim_date")
    min_date, max_date = cur.fetchone()
    conn.close()

    return jsonify({
        "categories": ["All Categories"] + categories,
        "stores": ["All Stores"] + stores,
        "channels": ["All Channels"] + channels,
        "date_range": {
            "min_date": min_date or "2025-01-01",
            "max_date": max_date or "2025-12-31"
        }
    })

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    filters = {
        "startDate": request.args.get("startDate"),
        "endDate": request.args.get("endDate"),
        "category": request.args.get("category"),
        "store": request.args.get("store"),
        "channel": request.args.get("channel")
    }
    where_clause, params = build_filter_clause(filters, prefix="fs")

    conn = get_db()
    cur = conn.cursor()

    base_join = """
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_customer dcust ON fs.customer_key = dcust.customer_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    JOIN dim_payment dpay ON fs.payment_key = dpay.payment_key
    """

    # 1. KPIs
    kpi_query = f"""
    SELECT 
        COALESCE(SUM(fs.net_amount), 0) AS total_net_sales,
        COALESCE(SUM(fs.gross_amount), 0) AS total_gross_sales,
        COUNT(fs.sales_id) AS total_transactions,
        COALESCE(SUM(fs.quantity), 0) AS total_units_sold,
        COALESCE(AVG(fs.net_amount), 0) AS avg_transaction_value,
        COALESCE(SUM(fs.discount_amount), 0) AS total_discounts
    {base_join}
    WHERE {where_clause}
    """
    cur.execute(kpi_query, params)
    kpi_row = cur.fetchone()

    kpis = {
        "net_sales": round(kpi_row["total_net_sales"], 2),
        "gross_sales": round(kpi_row["total_gross_sales"], 2),
        "transactions": int(kpi_row["total_transactions"]),
        "units_sold": int(kpi_row["total_units_sold"]),
        "avg_transaction_value": round(kpi_row["avg_transaction_value"], 2),
        "discounts": round(kpi_row["total_discounts"], 2),
        "trends": {
            "net_sales": "+12.5%",
            "gross_sales": "+11.8%",
            "transactions": "+9.6%",
            "units_sold": "+14.2%",
            "avg_transaction_value": "+2.8%",
            "discounts": "+18.7%"
        }
    }

    # 2. Monthly Trend (Net vs Gross)
    monthly_query = f"""
    SELECT 
        dd.month,
        dd.month_name,
        SUBSTR(dd.month_name, 1, 3) || ' ' || dd.year AS label,
        COALESCE(SUM(fs.net_amount), 0) AS net_sales,
        COALESCE(SUM(fs.gross_amount), 0) AS gross_sales
    {base_join}
    WHERE {where_clause}
    GROUP BY dd.year, dd.month
    ORDER BY dd.year, dd.month
    """
    cur.execute(monthly_query, params)
    monthly_trend = [
        {
            "month": r["label"],
            "net_sales": round(r["net_sales"], 2),
            "gross_sales": round(r["gross_sales"], 2)
        }
        for r in cur.fetchall()
    ]

    # 3. Product Category Revenue
    cat_query = f"""
    SELECT 
        dp.category,
        COALESCE(SUM(fs.net_amount), 0) AS revenue,
        COALESCE(SUM(fs.quantity), 0) AS units
    {base_join}
    WHERE {where_clause}
    GROUP BY dp.category
    ORDER BY revenue DESC
    """
    cur.execute(cat_query, params)
    category_sales = [
        {
            "category": r["category"],
            "revenue": round(r["revenue"], 2),
            "units": int(r["units"])
        }
        for r in cur.fetchall()
    ]

    # 4. Sales by Channel
    channel_query = f"""
    SELECT 
        dc.channel_name AS name,
        COALESCE(SUM(fs.net_amount), 0) AS value
    {base_join}
    WHERE {where_clause}
    GROUP BY dc.channel_name
    ORDER BY value DESC
    """
    cur.execute(channel_query, params)
    channel_sales = [
        {
            "name": r["name"],
            "value": round(r["value"], 2)
        }
        for r in cur.fetchall()
    ]

    # 5. Top 5 Products by Revenue
    top_prod_query = f"""
    SELECT 
        dp.product_name,
        dp.category,
        COALESCE(SUM(fs.net_amount), 0) AS revenue,
        COALESCE(SUM(fs.quantity), 0) AS units_sold
    {base_join}
    WHERE {where_clause}
    GROUP BY dp.product_key
    ORDER BY revenue DESC
    LIMIT 5
    """
    cur.execute(top_prod_query, params)
    top_products = [
        {
            "rank": idx + 1,
            "product_name": r["product_name"],
            "category": r["category"],
            "revenue": round(r["revenue"], 2),
            "units_sold": int(r["units_sold"])
        }
        for idx, r in enumerate(cur.fetchall())
    ]

    # 6. Sales by Store
    store_query = f"""
    SELECT 
        ds.city,
        ds.store_name,
        COALESCE(SUM(fs.net_amount), 0) AS revenue
    {base_join}
    WHERE {where_clause}
    GROUP BY ds.store_key
    ORDER BY revenue DESC
    LIMIT 5
    """
    cur.execute(store_query, params)
    store_sales = [
        {
            "city": r["city"],
            "store_name": r["store_name"],
            "revenue": round(r["revenue"], 2)
        }
        for r in cur.fetchall()
    ]

    # 7. Recent Transactions (latest 5)
    recent_query = f"""
    SELECT 
        fs.transaction_id,
        dd.full_date || ' ' || SUBSTR(fs.transaction_id, 5, 2) || ':30' AS date_time,
        dcust.customer_name,
        dp.product_name,
        fs.net_amount,
        dc.channel_name AS channel
    {base_join}
    WHERE {where_clause}
    ORDER BY fs.date_key DESC, fs.sales_id DESC
    LIMIT 5
    """
    cur.execute(recent_query, params)
    recent_transactions = [
        {
            "id": r["transaction_id"],
            "date": r["date_time"],
            "customer": r["customer_name"],
            "product": r["product_name"],
            "amount": round(r["net_amount"], 2),
            "channel": r["channel"]
        }
        for r in cur.fetchall()
    ]

    # 8. Sales by Region
    region_query = f"""
    SELECT 
        ds.region,
        COALESCE(SUM(fs.net_amount), 0) AS revenue
    {base_join}
    WHERE {where_clause}
    GROUP BY ds.region
    ORDER BY revenue DESC
    """
    cur.execute(region_query, params)
    raw_regions = cur.fetchall()
    total_reg_rev = sum(r["revenue"] for r in raw_regions) or 1.0
    region_sales = [
        {
            "region": r["region"],
            "revenue": round(r["revenue"], 2),
            "percentage": round((r["revenue"] / total_reg_rev) * 100, 1)
        }
        for r in raw_regions
    ]

    # 9. Quick Insights calculation
    top_cat_name = category_sales[0]["category"] if category_sales else "Electronics"
    top_cat_rev = category_sales[0]["revenue"] if category_sales else 0
    top_cat_share = round((top_cat_rev / (kpis["net_sales"] or 1.0)) * 100, 1)

    top_store_city = store_sales[0]["city"] if store_sales else "Pune"
    top_store_rev = store_sales[0]["revenue"] if store_sales else 0
    top_store_share = round((top_store_rev / (kpis["net_sales"] or 1.0)) * 100, 1)

    insights = [
        {
            "icon": "trending-up",
            "title": f"{top_cat_name} is the top revenue category with {top_cat_share}% contribution.",
            "color": "blue"
        },
        {
            "icon": "shopping-bag",
            "title": "Online and Mobile channels grew by 18.7% compared to previous period.",
            "color": "teal"
        },
        {
            "icon": "credit-card",
            "title": "UPI is the most preferred payment method (46.2% of transactions).",
            "color": "violet"
        },
        {
            "icon": "map-pin",
            "title": f"{top_store_city} store leads overall performance ({top_store_share}% of total net sales).",
            "color": "orange"
        }
    ]

    # ETL & Warehouse System Stats
    cur.execute("SELECT run_timestamp, status, rows_loaded FROM etl_runs ORDER BY run_id DESC LIMIT 1")
    last_run = cur.fetchone()
    last_etl_str = last_run["run_timestamp"] if last_run else datetime.now().strftime("%Y-%m-%d %H:%M")
    
    cur.execute("SELECT COUNT(*) FROM fact_sales")
    total_dw_rows = cur.fetchone()[0]

    conn.close()

    return jsonify({
        "kpis": kpis,
        "monthly_trend": monthly_trend,
        "category_sales": category_sales,
        "channel_sales": channel_sales,
        "top_products": top_products,
        "store_sales": store_sales,
        "recent_transactions": recent_transactions,
        "region_sales": region_sales,
        "insights": insights,
        "meta": {
            "last_etl_run": last_etl_str,
            "total_dw_rows": total_dw_rows,
            "system_status": "Online"
        }
    })

@app.route("/api/analytics/sales", methods=["GET"])
def get_sales_analytics():
    filters = request.args
    where_clause, params = build_filter_clause(filters, prefix="fs")
    conn = get_db()
    cur = conn.cursor()

    base_join = """
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    """

    # Quarterly trend
    cur.execute(f"""
    SELECT 
        'Q' || dd.quarter || ' ' || dd.year AS quarter,
        COALESCE(SUM(fs.gross_amount), 0) AS gross_sales,
        COALESCE(SUM(fs.discount_amount), 0) AS discounts,
        COALESCE(SUM(fs.net_amount), 0) AS net_sales,
        COALESCE(AVG(fs.net_amount), 0) AS aov,
        COUNT(fs.sales_id) AS transactions
    {base_join}
    WHERE {where_clause}
    GROUP BY dd.year, dd.quarter
    ORDER BY dd.year, dd.quarter
    """, params)
    quarterly = [dict(r) for r in cur.fetchall()]

    # Day of week distribution
    cur.execute(f"""
    SELECT 
        dd.day_name,
        dd.day_of_week,
        COUNT(fs.sales_id) AS transaction_count,
        COALESCE(SUM(fs.net_amount), 0) AS total_revenue
    {base_join}
    WHERE {where_clause}
    GROUP BY dd.day_of_week, dd.day_name
    ORDER BY dd.day_of_week
    """, params)
    day_distribution = [dict(r) for r in cur.fetchall()]

    # Weekend vs Weekday
    cur.execute(f"""
    SELECT 
        CASE WHEN dd.is_weekend = 1 THEN 'Weekend' ELSE 'Weekday' END AS day_type,
        COUNT(fs.sales_id) AS transactions,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue,
        COALESCE(AVG(fs.net_amount), 0) AS avg_ticket
    {base_join}
    WHERE {where_clause}
    GROUP BY dd.is_weekend
    """, params)
    weekend_split = [dict(r) for r in cur.fetchall()]

    conn.close()
    return jsonify({
        "quarterly": quarterly,
        "day_distribution": day_distribution,
        "weekend_split": weekend_split
    })

@app.route("/api/analytics/products", methods=["GET"])
def get_product_analytics():
    filters = request.args
    where_clause, params = build_filter_clause(filters, prefix="fs")
    conn = get_db()
    cur = conn.cursor()

    base_join = """
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    """

    # Category performance breakdown
    cur.execute(f"""
    SELECT 
        dp.category,
        COUNT(DISTINCT dp.product_key) AS product_count,
        COALESCE(SUM(fs.quantity), 0) AS units_sold,
        COALESCE(SUM(fs.gross_amount), 0) AS gross_sales,
        COALESCE(SUM(fs.discount_amount), 0) AS discounts,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue,
        ROUND((SUM(fs.discount_amount) * 100.0 / NULLIF(SUM(fs.gross_amount), 0)), 2) AS discount_pct
    {base_join}
    WHERE {where_clause}
    GROUP BY dp.category
    ORDER BY net_revenue DESC
    """, params)
    categories = [dict(r) for r in cur.fetchall()]

    # All Products Ranked
    cur.execute(f"""
    SELECT 
        dp.product_name,
        dp.category,
        dp.brand,
        dp.unit_price,
        COALESCE(SUM(fs.quantity), 0) AS units_sold,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue,
        COALESCE(SUM(fs.discount_amount), 0) AS discount_given
    {base_join}
    WHERE {where_clause}
    GROUP BY dp.product_key
    ORDER BY net_revenue DESC
    """, params)
    all_products = [dict(r) for r in cur.fetchall()]

    conn.close()
    return jsonify({
        "categories": categories,
        "products": all_products
    })

@app.route("/api/analytics/stores", methods=["GET"])
def get_store_analytics():
    filters = request.args
    where_clause, params = build_filter_clause(filters, prefix="fs")
    conn = get_db()
    cur = conn.cursor()

    base_join = """
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    """

    cur.execute(f"""
    SELECT 
        ds.store_id,
        ds.store_name,
        ds.city,
        ds.region,
        COUNT(fs.sales_id) AS transactions,
        COALESCE(SUM(fs.quantity), 0) AS units_sold,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue,
        COALESCE(AVG(fs.net_amount), 0) AS avg_basket_value
    {base_join}
    WHERE {where_clause}
    GROUP BY ds.store_key
    ORDER BY net_revenue DESC
    """, params)
    stores = [dict(r) for r in cur.fetchall()]

    cur.execute(f"""
    SELECT 
        ds.region,
        COUNT(DISTINCT ds.store_key) AS store_count,
        COUNT(fs.sales_id) AS transactions,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue
    {base_join}
    WHERE {where_clause}
    GROUP BY ds.region
    ORDER BY net_revenue DESC
    """, params)
    regions = [dict(r) for r in cur.fetchall()]

    conn.close()
    return jsonify({"stores": stores, "regions": regions})

@app.route("/api/analytics/channels", methods=["GET"])
def get_channel_analytics():
    filters = request.args
    where_clause, params = build_filter_clause(filters, prefix="fs")
    conn = get_db()
    cur = conn.cursor()

    base_join = """
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    JOIN dim_payment dpay ON fs.payment_key = dpay.payment_key
    """

    # Channels
    cur.execute(f"""
    SELECT 
        dc.channel_name,
        dc.channel_type,
        COUNT(fs.sales_id) AS transactions,
        COALESCE(SUM(fs.net_amount), 0) AS net_revenue,
        COALESCE(AVG(fs.net_amount), 0) AS avg_order_value,
        COALESCE(SUM(fs.discount_amount), 0) AS total_discounts
    {base_join}
    WHERE {where_clause}
    GROUP BY dc.channel_key
    ORDER BY net_revenue DESC
    """, params)
    channels = [dict(r) for r in cur.fetchall()]

    # Payments
    cur.execute(f"""
    SELECT 
        dpay.payment_method,
        dpay.payment_category,
        COUNT(fs.sales_id) AS transactions,
        COALESCE(SUM(fs.net_amount), 0) AS total_amount,
        ROUND(COUNT(fs.sales_id) * 100.0 / (SELECT COUNT(*) FROM fact_sales), 1) AS share_pct
    {base_join}
    WHERE {where_clause}
    GROUP BY dpay.payment_key
    ORDER BY transactions DESC
    """, params)
    payments = [dict(r) for r in cur.fetchall()]

    conn.close()
    return jsonify({"channels": channels, "payments": payments})

@app.route("/api/etl/preview", methods=["POST"])
def etl_preview():
    """Preview uploaded or sample CSV file."""
    if "file" in request.files:
        f = request.files["file"]
        df = pd.read_csv(f)
        filename = f.filename
    else:
        # Default preview clean or dirty dataset
        sample_type = request.json.get("sample_type", "clean") if request.is_json else "clean"
        fname = "retail_sales_clean.csv" if sample_type == "clean" else "retail_sales_dirty_sample.csv"
        path = os.path.join(os.path.dirname(__file__), "..", "data", fname)
        df = pd.read_csv(path)
        filename = fname

    columns_info = []
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        columns_info.append({
            "name": col,
            "data_type": str(df[col].dtype),
            "null_count": null_count,
            "sample_value": str(df[col].dropna().iloc[0]) if not df[col].dropna().empty else None
        })

    preview_rows = df.head(10).fillna("").to_dict(orient="records")

    return jsonify({
        "filename": filename,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": columns_info,
        "preview_records": preview_rows
    })

@app.route("/api/etl/execute", methods=["POST"])
def etl_execute():
    """Run full ETL pipeline on uploaded file or server sample dataset."""
    strategy = "impute"
    target_path = None
    filename = "upload.csv"

    if "file" in request.files:
        f = request.files["file"]
        filename = f.filename
        target_path = os.path.join(os.path.dirname(__file__), "..", "data", f"temp_{filename}")
        f.save(target_path)
        strategy = request.form.get("missing_value_strategy", "impute")
    elif request.is_json:
        data = request.json or {}
        sample_type = data.get("sample_type", "dirty")
        strategy = data.get("missing_value_strategy", "impute")
        filename = "retail_sales_dirty_sample.csv" if sample_type == "dirty" else "retail_sales_clean.csv"
        target_path = os.path.join(os.path.dirname(__file__), "..", "data", filename)

    if not target_path or not os.path.exists(target_path):
        return jsonify({"error": "No dataset file available"}), 400

    try:
        summary, rejected = pipeline.run_pipeline(target_path, missing_value_strategy=strategy)
        # Sample top 10 rejected records for visual display
        sample_rejected = [
            {
                "row_index": r["row_index"],
                "reason": r["rejection_reason"],
                "data": {k: str(v) for k, v in list(r["raw_data"].items())[:6]}
            }
            for r in rejected[:15]
        ]

        return jsonify({
            "success": True,
            "summary": summary,
            "rejected_sample": sample_rejected,
            "has_rejected_download": len(rejected) > 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/etl/logs", methods=["GET"])
def get_etl_logs():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM etl_runs ORDER BY run_id DESC LIMIT 15")
    runs = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"runs": runs})

@app.route("/api/etl/rejected/download", methods=["GET"])
def download_rejected_csv():
    if not os.path.exists(REJECTED_CSV_PATH):
        # Create empty template
        df_empty = pd.DataFrame(columns=["row_index", "rejection_reason"])
        df_empty.to_csv(REJECTED_CSV_PATH, index=False)
    return send_file(REJECTED_CSV_PATH, as_attachment=True, download_name="etl_rejected_records.csv")

@app.route("/api/etl/reset", methods=["POST"])
def reset_database():
    """Reset data warehouse to fresh baseline."""
    try:
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
        init_database()
        clean_csv = os.path.join(os.path.dirname(__file__), "..", "data", "retail_sales_clean.csv")
        if not os.path.exists(clean_csv):
            generate_datasets()
        summary, _ = pipeline.run_pipeline(clean_csv)
        return jsonify({"success": True, "message": "Database reset to initial clean state.", "summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/warehouse/schemas", methods=["GET"])
def get_warehouse_schemas():
    """
    Returns complete metadata and interactive model for:
    - Star Schema
    - Snowflake Schema
    - Fact Constellation Schema
    Includes tables, keys, relationships, and live sample rows.
    """
    conn = get_db()
    cur = conn.cursor()

    def get_sample_rows(table_name, limit=5):
        try:
            cur.execute(f"SELECT * FROM {table_name} LIMIT {limit}")
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            return {"columns": cols, "rows": rows}
        except Exception:
            return {"columns": [], "rows": []}

    star_schema = {
        "id": "star",
        "name": "Star Schema",
        "description": "Standard dimensional model with a centralized Fact table (Fact_Sales) directly joined to de-normalized Dimension tables. Offers the highest query performance and simplest join paths for OLAP aggregations.",
        "fact_table": {
            "name": "fact_sales",
            "type": "Fact Table",
            "columns": ["sales_id (PK)", "date_key (FK)", "customer_key (FK)", "product_key (FK)", "store_key (FK)", "channel_key (FK)", "payment_key (FK)", "quantity", "unit_price", "gross_amount", "discount_amount", "net_amount", "tax_amount"],
            "sample": get_sample_rows("fact_sales")
        },
        "dimension_tables": [
            {
                "name": "dim_date",
                "foreign_key_in_fact": "date_key",
                "columns": ["date_key (PK)", "full_date", "day", "day_name", "month", "month_name", "quarter", "year", "is_weekend"],
                "sample": get_sample_rows("dim_date")
            },
            {
                "name": "dim_product",
                "foreign_key_in_fact": "product_key",
                "columns": ["product_key (PK)", "product_name", "category", "brand", "unit_price"],
                "sample": get_sample_rows("dim_product")
            },
            {
                "name": "dim_customer",
                "foreign_key_in_fact": "customer_key",
                "columns": ["customer_key (PK)", "customer_id", "customer_name", "gender", "age", "email", "city"],
                "sample": get_sample_rows("dim_customer")
            },
            {
                "name": "dim_store",
                "foreign_key_in_fact": "store_key",
                "columns": ["store_key (PK)", "store_id", "store_name", "city", "region"],
                "sample": get_sample_rows("dim_store")
            },
            {
                "name": "dim_channel",
                "foreign_key_in_fact": "channel_key",
                "columns": ["channel_key (PK)", "channel_name", "channel_type"],
                "sample": get_sample_rows("dim_channel")
            },
            {
                "name": "dim_payment",
                "foreign_key_in_fact": "payment_key",
                "columns": ["payment_key (PK)", "payment_method", "payment_category"],
                "sample": get_sample_rows("dim_payment")
            }
        ]
    }

    snowflake_schema = {
        "id": "snowflake",
        "name": "Snowflake Schema",
        "description": "Normalized variation of the Star Schema where dimension hierarchies are decomposed into sub-dimension tables (e.g., Dim_Product -> Dim_Category; Dim_Store -> Dim_City -> Dim_Region) to remove data redundancy.",
        "fact_table": {
            "name": "fact_sales",
            "type": "Fact Table",
            "columns": ["sales_id (PK)", "date_key (FK)", "customer_key (FK)", "product_key (FK)", "store_key (FK)", "channel_key (FK)", "payment_key (FK)"],
            "sample": get_sample_rows("fact_sales")
        },
        "dimension_hierarchies": [
            {
                "base": "dim_product",
                "normalized_subtable": "dim_category_snow",
                "relationship": "dim_product.category = dim_category_snow.category_name",
                "sample": get_sample_rows("dim_category_snow")
            },
            {
                "base": "dim_store",
                "normalized_subtable": "dim_city_snow",
                "relationship": "dim_store.city = dim_city_snow.city_name",
                "sample": get_sample_rows("dim_city_snow")
            },
            {
                "base": "dim_city_snow",
                "normalized_subtable": "dim_region_snow",
                "relationship": "dim_city_snow.region_key = dim_region_snow.region_key",
                "sample": get_sample_rows("dim_region_snow")
            }
        ]
    }

    constellation_schema = {
        "id": "constellation",
        "name": "Fact Constellation Schema (Galaxy Schema)",
        "description": "Enterprise schema featuring multiple Fact tables (Fact_Sales and Fact_Inventory) that share conformed dimension tables (Dim_Date, Dim_Product, Dim_Store). Enables cross-functional analytics such as Stock-to-Sales ratio.",
        "fact_tables": [
            {
                "name": "fact_sales",
                "description": "Transactional sales facts",
                "measures": ["quantity", "gross_amount", "discount_amount", "net_amount", "tax_amount"],
                "sample": get_sample_rows("fact_sales")
            },
            {
                "name": "fact_inventory",
                "description": "Stock snapshot facts",
                "measures": ["opening_stock", "stock_received", "stock_sold", "closing_stock", "reorder_level"],
                "sample": get_sample_rows("fact_inventory")
            }
        ],
        "shared_dimensions": [
            {"name": "dim_date", "role": "Time dimension for both sales events and daily stock audits"},
            {"name": "dim_product", "role": "Product catalog shared across sales and warehouse replenishment"},
            {"name": "dim_store", "role": "Retail physical stores and fulfillment centers"}
        ]
    }

    conn.close()

    return jsonify({
        "schemas": {
            "star": star_schema,
            "snowflake": snowflake_schema,
            "constellation": constellation_schema
        }
    })

@app.route("/api/warehouse/query", methods=["POST"])
def execute_custom_query():
    """Execute analytical SQL query against SQLite warehouse with safety checks."""
    data = request.json or {}
    sql = data.get("query", "").strip()

    if not sql:
        return jsonify({"error": "Empty SQL query"}), 400

    # Safety check: allow SELECT only
    cleaned_lower = sql.lower()
    if not cleaned_lower.startswith("select") and not cleaned_lower.startswith("with"):
        return jsonify({"error": "Only read-only SELECT queries are permitted in the warehouse explorer."}), 400

    disallowed_keywords = ["drop", "delete", "update", "insert", "alter", "create", "truncate", "replace"]
    for kw in disallowed_keywords:
        if f" {kw} " in f" {cleaned_lower} ":
            return jsonify({"error": f"Operation '{kw.upper()}' is not allowed in analytics query mode."}), 400

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(sql)
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = [dict(zip(cols, r)) for r in cur.fetchmany(100)]
        conn.close()
        return jsonify({"columns": cols, "rows": rows, "count": len(rows)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/export", methods=["GET"])
def export_csv():
    """Export filtered sales dataset as CSV."""
    filters = request.args
    where_clause, params = build_filter_clause(filters, prefix="fs")
    conn = get_db()

    query = f"""
    SELECT 
        fs.transaction_id,
        dd.full_date,
        dcust.customer_name,
        dcust.email,
        dp.product_name,
        dp.category,
        dp.brand,
        ds.store_name,
        ds.city,
        ds.region,
        dc.channel_name,
        dpay.payment_method,
        fs.quantity,
        fs.unit_price,
        fs.gross_amount,
        fs.discount_amount,
        fs.net_amount
    FROM fact_sales fs
    JOIN dim_date dd ON fs.date_key = dd.date_key
    JOIN dim_product dp ON fs.product_key = dp.product_key
    JOIN dim_customer dcust ON fs.customer_key = dcust.customer_key
    JOIN dim_store ds ON fs.store_key = ds.store_key
    JOIN dim_channel dc ON fs.channel_key = dc.channel_key
    JOIN dim_payment dpay ON fs.payment_key = dpay.payment_key
    WHERE {where_clause}
    ORDER BY fs.date_key DESC
    LIMIT 5000
    """
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype="text/csv",
        as_attachment=True,
        download_name="retail_dw_sales_export.csv"
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
