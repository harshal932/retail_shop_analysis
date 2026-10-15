# Retail Sales Data Warehouse & Analytics Platform (DWDM Mini Project)

An enterprise-grade Business Intelligence (BI) and Data Warehousing platform built with **React 19 + Vite + Tailwind CSS**, **Python Flask**, and **SQLite 3** for retail sales analytics, dimensional modeling, and ETL pipeline demonstration.

![Dashboard Preview](file:///C:/Users/ADMIN/.gemini/antigravity-ide/brain/a5172aec-b752-4af5-a027-21d2aa4b8f82/dashboard_overview_1791911787539.png)

---

## 🌟 Key Features

1. **Enterprise BI Dashboard (Pixel-Perfect to Reference Spec)**
   - **6 Core KPIs**: Total Net Sales (₹), Gross Sales (₹), Transactions, Units Sold, Average Transaction Value (ATV), and Total Discounts (₹) with period-over-period trend badges.
   - **Monthly Sales Trend**: Interactive dual-line chart comparing Net Sales vs Gross Sales.
   - **Category Revenue Distribution**: Horizontal bar chart sorted by merchandise contribution.
   - **Omnichannel Donut Chart**: Physical In-Store vs Online vs Mobile App revenue split with center metric.
   - **Top 5 SKUs by Revenue**: Ranked tabular view with category attribution and units sold.
   - **Sales by Store**: City-level store comparison (Pune, Mumbai, Bengaluru, Delhi, Hyderabad).
   - **Automated Analytical Insights**: Rule-based AI insight cards on top categories, growth channels, and payment trends.
   - **Live Transactions Feed**: Real-time tabular sales feed with payment and channel badges.
   - **Geographic Regional Breakdown**: West, South, North, East, and Central India sales concentration.

2. **Dedicated Multi-Dimensional Analytics Pages**
   - **Sales Analytics**: Fiscal quarterly comparisons (`Q1`-`Q4`), weekday vs weekend basket analysis, and daily footfall distribution.
   - **Product Analytics**: Full catalog ranking, SKU search, unit pricing, and category discount retention rates.
   - **Store & Regional Analytics**: Individual store performance audit, outlet transaction density, and average basket sizes.
   - **Channel & Payment Analytics**: In-Store vs Digital performance and payment instrument breakdowns (UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery).

3. **Data Import & ETL Processing Engine**
   - **CSV Ingestion**: Drag & drop custom CSV files or load pre-packaged Clean (12,893 rows) and Dirty (500 rows with intentional errors) datasets.
   - **Dataset Preview & Schema Discovery**: In-browser inspection of source columns, data types, and null counts.
   - **Cleaning & Imputation Policies**: Configurable missing value strategies (impute defaults vs strict drop).
   - **Automated Validation**: Duplicate transaction ID elimination, negative quantity/price detection, and date string parsing into dimensional calendar keys.
   - **Stepped Pipeline Animation**: Real-time visual progress through Extraction ➔ Transformation ➔ Loading ➔ Auditing.
   - **Quality Control & Rejection Log**: Granular table detailing why specific rows were rejected with one-click **Download Rejected Records (CSV)**.

4. **Data Warehouse Schema & Model Explorer**
   - **Star Schema**: Centralized `fact_sales` surrounded by 6 de-normalized dimension tables (`dim_date`, `dim_product`, `dim_customer`, `dim_store`, `dim_channel`, `dim_payment`).
   - **Snowflake Schema**: Normalized dimensional hierarchies (`dim_product` ➔ `dim_category_snow`; `dim_store` ➔ `dim_city_snow` ➔ `dim_region_snow`).
   - **Fact Constellation (Galaxy Schema)**: Dual fact tables (`fact_sales` and `fact_inventory`) sharing conformed dimensions.
   - **Live Sample Row Inspector**: Dynamic inspection of actual records across all warehouse tables directly from SQLite.
   - **Interactive SQL OLAP Console**: Run analytical SQL queries with pre-configured templates for `ROLLUP`, `CUBE`, and cross-fact queries.

5. **College Practical & Viva Voce Guide**
   - Printable / PDF Executive BI Summary for FY 2025.
   - Top 10 curated DWDM Viva Voce examination questions with model academic answers.

---

## 🏗️ Architectural Overview

```
                      ┌───────────────────────────────────────┐
                      │    Raw CSV Feeds / Stream Datasets    │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                           ETL Pipeline (etl.py)                           │
  │   1. Extraction:    Ingest raw CSV records via pandas                     │
  │   2. Transformation: Clean nulls, validate types, generate date keys      │
  │   3. Quality Audit: Reject duplicate txn IDs & negative values            │
  │   4. Loading:       Upsert Dimensions & batch insert into Fact Tables     │
  └──────────────────┬─────────────────────────────────────┬──────────────────┘
                     │                                     │
                     ▼                                     ▼
        ┌─────────────────────────┐           ┌─────────────────────────┐
        │  Rejected Records CSV   │           │   SQLite 3 Warehouse    │
        │  (rejected_records.csv) │           │     (warehouse.db)      │
        └─────────────────────────┘           └────────────┬────────────┘
                                                           │
                                                           ▼
                                              ┌─────────────────────────┐
                                              │   Flask REST API Tier   │
                                              │        (app.py)         │
                                              └────────────┬────────────┘
                                                           │
                                                           ▼
                                              ┌─────────────────────────┐
                                              │   React 19 + Vite UI    │
                                              │ (Tailwind + Recharts)   │
                                              └─────────────────────────┘
```

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install flask flask-cors pandas

# (Optional) Regenerate fresh datasets & baseline warehouse
python generate_data.py
python etl.py

# Start the Flask API server (runs on http://127.0.0.1:5000)
python app.py
```

### 2. Frontend Setup
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`** to interact with the application.

---

## 📚 College Viva Voce Cheat Sheet

| Question | Short Model Answer |
|---|---|
| **OLTP vs OLAP** | OLTP is normalized (3NF) for fast transactional processing (writes). OLAP is de-normalized (Star/Snowflake) for fast analytical aggregation (reads). |
| **ETL Stages** | Extract (read raw data), Transform (clean, type-cast, calculate measures, parse dates), Load (insert into fact and dimension tables). |
| **Star Schema** | One centralized fact table joined directly to multiple dimension tables. Best for query speed and simplicity. |
| **Snowflake Schema** | Dimensions are normalized into hierarchies (e.g., City ➔ Region) to eliminate data redundancy at the cost of more joins. |
| **Fact Constellation** | Multiple fact tables (e.g., Sales and Inventory) sharing conformed dimensions. Also known as Galaxy schema. |
| **Surrogate Key** | System-generated integer primary key (e.g. `date_key`, `product_key`) that shields the data warehouse from source-system natural key changes. |
| **OLAP Operations** | Roll-up (aggregate up), Drill-down (navigate deeper), Slice (filter 1 dimension), Dice (filter multiple dimensions), Pivot (rotate axes). |

---

## 🛡️ Synthetic Data Disclosure
All demonstration data, transaction figures, customer names, and performance metrics are generated synthetically using `backend/generate_data.py` for educational and demonstrational purposes.
