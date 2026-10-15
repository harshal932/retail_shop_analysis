import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  HelpCircle,
  BookOpen,
  Award,
  Layers,
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

const VIVA_QUESTIONS = [
  {
    q: "1. What is the difference between OLTP and OLAP systems?",
    a: "OLTP (Online Transaction Processing) is optimized for day-to-day transactional speed, high concurrency, and normalized tables (3NF) to prevent write anomalies. OLAP (Online Analytical Processing) is designed for historical data aggregation, complex analytical querying, and de-normalized dimensional schemas (Star/Snowflake) with high read performance."
  },
  {
    q: "2. Explain the 3 stages of the ETL Pipeline implemented in this project.",
    a: "• Extraction: Ingests raw CSV retail streams into memory DataFrames.\n• Transformation: Cleans missing values, casts data types, validates positive pricing/quantities, parses timestamps into date keys (year, quarter, month, day), and isolates duplicate/invalid records into an audit log.\n• Loading: Upserts dimension tables to avoid redundancy and populates Fact_Sales and Fact_Inventory with surrogate foreign keys."
  },
  {
    q: "3. What is a Star Schema and why is it preferred for BI dashboards?",
    a: "A Star Schema contains a centralized Fact table surrounded by de-normalized Dimension tables directly linked via foreign keys. It is preferred because it minimizes the number of joins needed to calculate metrics, making analytical SQL queries significantly faster and easier for BI engines to optimize."
  },
  {
    q: "4. How does a Snowflake Schema differ from a Star Schema?",
    a: "In a Snowflake Schema, the dimension tables are normalized into sub-dimension hierarchies (e.g., Dim_Product splits into Dim_Category; Dim_Store splits into Dim_City and Dim_Region). This reduces data redundancy and storage space, but requires more table joins during analytical queries."
  },
  {
    q: "5. What is a Fact Constellation (Galaxy) Schema?",
    a: "A Fact Constellation schema contains multiple fact tables (e.g., Fact_Sales and Fact_Inventory) that share common 'conformed dimensions' (like Dim_Date, Dim_Product, Dim_Store). This enables enterprise cross-functional analysis, such as stock-to-sales ratios."
  },
  {
    q: "6. What is the Granularity of Fact_Sales in this project?",
    a: "The granularity is at the individual line-item transaction level: one record per unique transaction SKU purchase made by a customer at a given store, channel, and timestamp."
  },
  {
    q: "7. What are Additive, Semi-additive, and Non-additive facts?",
    a: "• Additive: Measures that can be meaningfully summed across all dimensions (e.g., Gross Amount, Quantity Sold, Net Amount).\n• Semi-additive: Measures that can be summed across some dimensions but not others, such as time (e.g., Inventory closing stock balance).\n• Non-additive: Measures that cannot be summed across any dimension (e.g., Unit Price, Discount Percentage)."
  },
  {
    q: "8. Name the common OLAP operations and how they are used here.",
    a: "• Roll-up: Aggregating data up a hierarchy (e.g., daily sales rolled up into monthly/quarterly revenue).\n• Drill-down: Navigating from summarized to detailed data (e.g., from Category down to individual SKU products).\n• Slice: Selecting a single dimension slice (e.g., analyzing only Online channel).\n• Dice: Selecting a sub-cube by filtering multiple dimensions (e.g., Electronics in West Region during Q4).\n• Pivot: Rotating the query axes to view data from different analytical perspectives."
  },
  {
    q: "9. How did you handle dirty data and invalid records during ETL?",
    a: "The pipeline detects duplicate transaction IDs, negative quantities/prices, invalid date formats, and missing foreign keys. Invalid rows are rejected, recorded with a specific error reason in table 'etl_rejected_records', and exported as a CSV report for data cleansing review."
  },
  {
    q: "10. What is a Surrogate Key versus a Natural/Business Key?",
    a: "A Natural Key is the business identifier from the source system (e.g., transaction_id 'TXN_001', customer_id 'CUST_01'). A Surrogate Key is a system-generated, integer primary key created inside the warehouse (e.g., date_key '20250115', product_key '42') to decouple the warehouse from source system changes."
  }
];

export default function ReportsPage({ dashboardData }) {
  const [openFaq, setOpenFaq] = useState(0);

  const handlePrint = () => {
    window.print();
  };

  const kpis = dashboardData?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports, Viva Guide & Project Documentation</h2>
          <p className="text-xs text-slate-500">
            Official project documentation, printable executive BI report, and DWDM Viva Voce examination handbook.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
          <a
            href="/api/export"
            download
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export Data (CSV)
          </a>
        </div>
      </div>

      {/* Printable Executive BI Report Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm printable-area">
        <div className="border-b border-slate-200 pb-4 mb-5 flex justify-between items-start">
          <div>
            <div className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
              Executive Business Intelligence Summary
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Retail Sales Data Warehouse Performance Report (FY 2025)
            </h1>
            <p className="text-xs text-slate-500">
              Generated for Department of Computer Science / Engineering • DWDM Coursework
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Status: <span className="text-emerald-600 font-semibold">Audited</span></div>
            <div>Database: SQLite 3 Mart</div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Net Realized Sales</span>
            <span className="text-lg font-bold text-slate-900">{formatINR(kpis.net_sales)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Gross Merchandise Value</span>
            <span className="text-lg font-bold text-slate-900">{formatINR(kpis.gross_sales)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Transactions Audited</span>
            <span className="text-lg font-bold text-slate-900">{kpis.transactions?.toLocaleString('en-IN') || '12,893'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Average Order Value (AOV)</span>
            <span className="text-lg font-bold text-slate-900">{formatINR(kpis.avg_transaction_value)}</span>
          </div>
        </div>

        {/* Architecture Specifications */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Architectural Implementation Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <strong className="block text-slate-800">1. Dimensional Schema</strong>
              <span>Star Schema with 6 Dimension tables (Date, Customer, Product, Store, Channel, Payment) and 1 centralized Fact_Sales table.</span>
            </div>
            <div>
              <strong className="block text-slate-800">2. Normalization & Extensions</strong>
              <span>Snowflake hierarchy for Region and Category, plus Galaxy Schema with conformed Fact_Inventory table.</span>
            </div>
            <div>
              <strong className="block text-slate-800">3. ETL Integrity</strong>
              <span>Pandas ingestion pipeline enforcing type checks, date key generation, deduplication, and rejected row auditing.</span>
            </div>
          </div>
        </div>
      </div>

      {/* College Practical & Viva Voce Q&A Guide */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">DWDM Viva Voce Examination Questions & Answers</h3>
            <p className="text-[11px] text-slate-400">Curated questions and model answers for project presentation and external viva</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {VIVA_QUESTIONS.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100/70 text-left flex items-center justify-between transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {openFaq === idx && (
                <div className="p-3 bg-white text-xs text-slate-700 leading-relaxed border-t border-slate-100 whitespace-pre-line">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
