import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  Database,
  Table as TableIcon,
  Key,
  ExternalLink,
  Play,
  Terminal,
  Sparkles,
  Info,
  Network,
  Share2,
  GitFork
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export default function WarehouseExplorer() {
  const [schemaData, setSchemaData] = useState(null);
  const [activeSchemaTab, setActiveSchemaTab] = useState('star'); // 'star', 'snowflake', 'constellation'
  const [selectedTable, setSelectedTable] = useState('fact_sales');
  const [loading, setLoading] = useState(true);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState(
    "SELECT dp.category, ds.city, SUM(fs.net_amount) AS revenue, COUNT(*) AS txns\nFROM fact_sales fs\nJOIN dim_product dp ON fs.product_key = dp.product_key\nJOIN dim_store ds ON fs.store_key = ds.store_key\nGROUP BY dp.category, ds.city\nORDER BY revenue DESC\nLIMIT 10;"
  );
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/warehouse/schemas');
      setSchemaData(res.data.schemas);
    } catch (err) {
      console.error('Failed to load schemas:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeSql = async (queryToRun) => {
    const q = queryToRun || sqlQuery;
    setQueryLoading(true);
    setQueryError(null);
    try {
      const res = await axios.post('/api/warehouse/query', { query: q });
      setQueryResult(res.data);
    } catch (err) {
      setQueryError(err.response?.data?.error || 'Query execution failed');
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleTemplateClick = (templateSql) => {
    setSqlQuery(templateSql);
    executeSql(templateSql);
  };

  if (loading || !schemaData) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const star = schemaData.star;
  const snowflake = schemaData.snowflake;
  const constellation = schemaData.constellation;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Warehouse Schema & Model Explorer</h2>
          <p className="text-xs text-slate-500">
            Interactive structural diagrams and live query engine for Star, Snowflake, and Fact Constellation schemas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
            DWDM Academic & Enterprise Standard
          </span>
        </div>
      </div>

      {/* Schema Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { setActiveSchemaTab('star'); setSelectedTable('fact_sales'); }}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSchemaTab === 'star'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Star Schema</span>
        </button>

        <button
          onClick={() => { setActiveSchemaTab('snowflake'); setSelectedTable('dim_city_snow'); }}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSchemaTab === 'snowflake'
              ? 'border-teal-600 text-teal-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Snowflake Schema</span>
        </button>

        <button
          onClick={() => { setActiveSchemaTab('constellation'); setSelectedTable('fact_inventory'); }}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSchemaTab === 'constellation'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Fact Constellation (Galaxy)</span>
        </button>
      </div>

      {/* Schema Architectural Diagram & Relationships */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {activeSchemaTab === 'star' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Star Schema Architecture (De-normalized Dimensions)
              </h3>
              <p className="text-xs text-slate-500 mt-1">{star.description}</p>
            </div>

            {/* Visual Schema Layout */}
            <div className="p-6 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              {/* Central Fact Card */}
              <div 
                onClick={() => setSelectedTable('fact_sales')}
                className="cursor-pointer bg-blue-600 text-white rounded-xl p-4 shadow-lg shadow-blue-500/20 max-w-sm w-full text-center border-2 border-blue-400 hover:scale-[1.02] transition-transform"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Central Fact Table</div>
                <div className="text-base font-bold">FACT_SALES</div>
                <div className="text-[11px] text-blue-100 mt-1">
                  Foreign Keys: date_key, customer_key, product_key, store_key, channel_key, payment_key
                </div>
                <div className="mt-2 text-[10px] bg-blue-700/80 rounded py-1 px-2 font-mono">
                  Measures: quantity, gross_amount, discount_amount, net_amount, tax_amount
                </div>
              </div>

              {/* Connecting lines label */}
              <div className="my-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>↑ 1-to-Many Direct Joins ↓</span>
              </div>

              {/* Satellite Dimension Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
                {star.dimension_tables.map((dim) => (
                  <div
                    key={dim.name}
                    onClick={() => setSelectedTable(dim.name)}
                    className={`cursor-pointer rounded-lg p-3 border transition-all text-left ${
                      selectedTable === dim.name
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Dimension</div>
                    <div className="text-xs font-bold text-slate-800 truncate uppercase mt-0.5">{dim.name}</div>
                    <div className="text-[10px] text-blue-600 font-mono mt-1 font-semibold truncate">
                      FK: {dim.foreign_key_in_fact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSchemaTab === 'snowflake' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                Snowflake Schema Architecture (Normalized Dimension Hierarchies)
              </h3>
              <p className="text-xs text-slate-500 mt-1">{snowflake.description}</p>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-2">Category Normalization</div>
                  <div className="text-xs font-mono text-slate-600 space-y-1">
                    <div className="p-2 bg-slate-100 rounded">fact_sales (FK: product_key)</div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="p-2 bg-blue-50 text-blue-700 rounded font-semibold">dim_product</div>
                    <div className="text-center text-slate-400">↓ (normalized)</div>
                    <div 
                      onClick={() => setSelectedTable('dim_category_snow')}
                      className="p-2 bg-teal-50 text-teal-800 rounded font-semibold cursor-pointer hover:underline border border-teal-200"
                    >
                      dim_category_snow (PK: category_key)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-2">Geographic Location Hierarchy</div>
                  <div className="text-xs font-mono text-slate-600 space-y-1">
                    <div className="p-2 bg-slate-100 rounded">fact_sales (FK: store_key)</div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="p-2 bg-blue-50 text-blue-700 rounded font-semibold">dim_store</div>
                    <div className="text-center text-slate-400">↓ (normalized)</div>
                    <div 
                      onClick={() => setSelectedTable('dim_city_snow')}
                      className="p-2 bg-teal-50 text-teal-800 rounded font-semibold cursor-pointer hover:underline border border-teal-200"
                    >
                      dim_city_snow
                    </div>
                    <div className="text-center text-slate-400">↓ (normalized)</div>
                    <div 
                      onClick={() => setSelectedTable('dim_region_snow')}
                      className="p-2 bg-teal-50 text-teal-800 rounded font-semibold cursor-pointer hover:underline border border-teal-200"
                    >
                      dim_region_snow (PK: region_key)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-2">Academic Trade-Off Analysis</div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                    <li><strong>Advantage:</strong> Eliminates storage redundancy and update anomalies in dimension tables.</li>
                    <li><strong>Disadvantage:</strong> Requires multi-table relational joins during OLAP queries, slightly slower than de-normalized Star Schema.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSchemaTab === 'constellation' && (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                Fact Constellation Schema (Galaxy Schema with Shared Dimensions)
              </h3>
              <p className="text-xs text-slate-500 mt-1">{constellation.description}</p>
            </div>

            <div className="p-6 bg-slate-50/80 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Fact Table 1 */}
                <div 
                  onClick={() => setSelectedTable('fact_sales')}
                  className="p-4 rounded-xl bg-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-400"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Fact Table 1</span>
                  <h4 className="text-base font-bold">FACT_SALES</h4>
                  <p className="text-xs text-blue-100 mt-1">Measures: Gross, Discounts, Net Amount, Units Sold</p>
                </div>

                {/* Fact Table 2 */}
                <div 
                  onClick={() => setSelectedTable('fact_inventory')}
                  className="p-4 rounded-xl bg-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-400"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Fact Table 2</span>
                  <h4 className="text-base font-bold">FACT_INVENTORY</h4>
                  <p className="text-xs text-purple-100 mt-1">Measures: Opening Stock, Stock Received, Stock Sold, Closing Stock</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-700 block mb-3 uppercase tracking-wider">
                  Shared (Conformed) Dimensions Linked to Both Fact Tables:
                </span>
                <div className="flex flex-wrap justify-center gap-3">
                  {constellation.shared_dimensions.map(d => (
                    <div 
                      key={d.name}
                      onClick={() => setSelectedTable(d.name)}
                      className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer border border-slate-300"
                    >
                      {d.name.toUpperCase()}
                      <span className="block font-normal text-[10px] text-slate-500 mt-0.5">{d.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Sample Records for Selected Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-600" />
              Live Sample Records: <span className="font-mono text-blue-600 uppercase">{selectedTable}</span>
            </h3>
            <p className="text-[11px] text-slate-400">Queried directly from SQLite warehouse</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['fact_sales', 'fact_inventory', 'dim_product', 'dim_store', 'dim_customer', 'dim_date', 'dim_channel', 'dim_payment', 'dim_city_snow', 'dim_region_snow', 'dim_category_snow'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedTable(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                  selectedTable === t
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic sample query fetch */}
        <TableSampleViewer tableName={selectedTable} />
      </div>

      {/* Interactive SQL Query Console */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              Interactive DWDM SQL Analytical Console
            </h3>
            <p className="text-[11px] text-slate-400">Execute custom OLAP queries against SQLite warehouse</p>
          </div>
          <button
            onClick={() => executeSql()}
            disabled={queryLoading}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Query
          </button>
        </div>

        {/* Pre-built DWDM OLAP Templates */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="font-semibold text-slate-500 text-[11px] self-center">Templates:</span>
          <button
            onClick={() => handleTemplateClick(
              "SELECT dd.year, dd.quarter, dp.category, SUM(fs.net_amount) AS revenue\nFROM fact_sales fs\nJOIN dim_date dd ON fs.date_key = dd.date_key\nJOIN dim_product dp ON fs.product_key = dp.product_key\nGROUP BY dd.year, dd.quarter, dp.category\nORDER BY dd.year, dd.quarter, revenue DESC\nLIMIT 15;"
            )}
            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] border border-blue-200"
          >
            Quarterly ROLLUP by Category
          </button>

          <button
            onClick={() => handleTemplateClick(
              "SELECT ds.region, dc.channel_name, SUM(fs.net_amount) AS sales_volume, COUNT(*) AS orders\nFROM fact_sales fs\nJOIN dim_store ds ON fs.store_key = ds.store_key\nJOIN dim_channel dc ON fs.channel_key = dc.channel_key\nGROUP BY ds.region, dc.channel_name\nORDER BY ds.region, sales_volume DESC;"
            )}
            className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-[11px] border border-teal-200"
          >
            CUBE: Region × Channel Matrix
          </button>

          <button
            onClick={() => handleTemplateClick(
              "SELECT dp.product_name, SUM(fs.net_amount) AS sales, fi.closing_stock, fi.reorder_level\nFROM fact_sales fs\nJOIN dim_product dp ON fs.product_key = dp.product_key\nJOIN fact_inventory fi ON fs.product_key = fi.product_key\nGROUP BY dp.product_key\nORDER BY sales DESC\nLIMIT 8;"
            )}
            className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium text-[11px] border border-purple-200"
          >
            Fact Constellation Cross-Join (Sales & Stock)
          </button>
        </div>

        {/* Code Editor */}
        <div className="rounded-lg border border-slate-300 overflow-hidden font-mono text-xs">
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={5}
            className="w-full p-3 bg-slate-900 text-emerald-400 font-mono outline-none resize-y"
            placeholder="Type SELECT SQL query here..."
          />
        </div>

        {/* Error message */}
        {queryError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-mono">
            Error: {queryError}
          </div>
        )}

        {/* Query Result Grid */}
        {queryResult && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Results: {queryResult.count} rows returned
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-100">
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    {queryResult.columns.map(c => (
                      <th key={c} className="p-2 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queryResult.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 font-mono">
                      {queryResult.columns.map(c => (
                        <td key={c} className="p-2 whitespace-nowrap text-slate-700">
                          {String(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Child component to fetch and render sample table rows
function TableSampleViewer({ tableName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSample();
  }, [tableName]);

  const fetchSample = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/warehouse/query', {
        query: `SELECT * FROM ${tableName} LIMIT 6;`
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-center text-xs text-slate-400">Loading {tableName} rows...</div>;
  }

  if (!data || !data.rows.length) {
    return <div className="py-6 text-center text-xs text-slate-400">No records found in {tableName}.</div>;
  }

  return (
    <div className="overflow-x-auto max-h-56 overflow-y-auto">
      <table className="w-full text-xs text-left">
        <thead className="sticky top-0 bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600 font-semibold">
            {data.columns.map(c => (
              <th key={c} className="p-2 whitespace-nowrap font-mono">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 font-mono text-[11px]">
              {data.columns.map(c => (
                <td key={c} className="p-2 whitespace-nowrap text-slate-700">
                  {String(r[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
