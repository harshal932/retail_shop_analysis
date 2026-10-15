import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Layers,
  Tag,
  Percent,
  Smartphone,
  CreditCard,
  MapPin,
  Database,
  FileText,
  Download,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import KpiCard from '../components/KpiCard';
import { formatINR, formatNumber } from '../utils/formatters';

// Color palettes matching BI reference
const CHANNEL_COLORS = {
  'In-Store': '#2563EB',
  'Online': '#0D9488',
  'Mobile App': '#8B5CF6'
};

const STORE_COLORS = ['#2563EB', '#0D9488', '#8B5CF6', '#EC4899', '#F59E0B'];

const CATEGORY_COLORS = ['#2563EB', '#06B6D4', '#8B5CF6', '#D946EF', '#F59E0B', '#10B981'];

export default function Dashboard({ data, loading, setActivePage }) {
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Loading Enterprise Analytics Data...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const monthlyTrend = data?.monthly_trend || [];
  const categorySales = data?.category_sales || [];
  const channelSales = data?.channel_sales || [];
  const topProducts = data?.top_products || [];
  const storeSales = data?.store_sales || [];
  const recentTxns = data?.recent_transactions || [];
  const regionSales = data?.region_sales || [];
  const insights = data?.insights || [];

  const totalChannelRevenue = channelSales.reduce((acc, c) => acc + c.value, 0);

  const handleDownloadCSV = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KpiCard
          title="Total Net Sales"
          value={formatINR(kpis.net_sales)}
          trend={kpis.trends?.net_sales || '+12.5%'}
          icon={TrendingUp}
          colorTheme="blue"
        />
        <KpiCard
          title="Total Gross Sales"
          value={formatINR(kpis.gross_sales)}
          trend={kpis.trends?.gross_sales || '+11.8%'}
          icon={ShoppingBag}
          colorTheme="teal"
        />
        <KpiCard
          title="Total Transactions"
          value={formatNumber(kpis.transactions)}
          trend={kpis.trends?.transactions || '+9.6%'}
          icon={Receipt}
          colorTheme="violet"
        />
        <KpiCard
          title="Total Units Sold"
          value={formatNumber(kpis.units_sold)}
          trend={kpis.trends?.units_sold || '+14.2%'}
          icon={Layers}
          colorTheme="cyan"
        />
        <KpiCard
          title="Avg. Transaction Value"
          value={formatINR(kpis.avg_transaction_value)}
          trend={kpis.trends?.avg_transaction_value || '+2.8%'}
          icon={Tag}
          colorTheme="fuchsia"
        />
        <KpiCard
          title="Total Discounts"
          value={formatINR(kpis.discounts)}
          trend={kpis.trends?.discounts || '+18.7%'}
          icon={Percent}
          colorTheme="orange"
        />
      </div>

      {/* 2. Charts Row 1: Monthly Trend, Category Revenue, Channel Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Sales Trend */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Monthly Sales Trend</h2>
              <p className="text-[11px] text-slate-400">Net Sales vs Gross Sales (2025)</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-blue-600">
                <span className="w-2.5 h-0.5 bg-blue-600 rounded"></span> Net Sales
              </span>
              <span className="flex items-center gap-1.5 font-medium text-teal-600">
                <span className="w-2.5 h-0.5 bg-teal-500 rounded"></span> Gross Sales
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(val) => formatINR(val, true)}
                />
                <Tooltip 
                  formatter={(val, name) => [formatINR(val), name === 'net_sales' ? 'Net Sales' : 'Gross Sales']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="net_sales"
                  name="Net Sales"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563EB' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="gross_sales"
                  name="Gross Sales"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#14B8A6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Product Category */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Sales by Product Category</h2>
            <p className="text-[11px] text-slate-400">Total revenue realized across merchandise</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categorySales}
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(val) => formatINR(val, true)}
                />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#334155' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  width={90}
                />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel Donut */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Sales by Channel</h2>
            <p className="text-[11px] text-slate-400">Channel revenue share & distribution</p>
          </div>

          <div className="relative h-44 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelSales}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {channelSales.map((entry, index) => (
                    <Cell key={`ch-${index}`} fill={CHANNEL_COLORS[entry.name] || '#2563EB'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Sales']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-base font-bold text-slate-800">
                {formatINR(totalChannelRevenue, true)}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Sales</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {channelSales.map((item) => {
              const pct = totalChannelRevenue > 0 ? ((item.value / totalChannelRevenue) * 100).toFixed(1) : 0;
              const color = CHANNEL_COLORS[item.name] || '#2563EB';
              return (
                <div key={item.name} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="font-medium text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[11px] text-slate-800">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Row 2: Top Products, Sales by Store, Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top 5 Products Table */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Top 5 Products by Revenue</h2>
              <p className="text-[11px] text-slate-400">Leading SKUs sorted by net realized sales</p>
            </div>
            <button
              onClick={() => setActivePage('products')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold">
                  <th className="pb-2.5 font-medium">#</th>
                  <th className="pb-2.5 font-medium">Product Name</th>
                  <th className="pb-2.5 font-medium">Category</th>
                  <th className="pb-2.5 text-right font-medium">Revenue</th>
                  <th className="pb-2.5 text-right font-medium">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {topProducts.map((p) => (
                  <tr key={p.product_name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-400">{p.rank}</td>
                    <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Laptop className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate max-w-[150px]">{p.product_name}</span>
                    </td>
                    <td className="py-2.5 text-slate-500">{p.category}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(p.revenue)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-600">{formatNumber(p.units_sold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Store */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Sales by Store</h2>
            <p className="text-[11px] text-slate-400">Revenue performance across physical retail outlets</p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeSales} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="city" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  tickFormatter={(val) => formatINR(val, true)}
                />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {storeSales.map((entry, index) => (
                    <Cell key={`store-${index}`} fill={STORE_COLORS[index % STORE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Quick Insights</h2>
            </div>
            <div className="space-y-3">
              {insights.map((item, idx) => {
                const colorMap = {
                  blue: 'bg-blue-50 text-blue-600',
                  teal: 'bg-teal-50 text-teal-600',
                  violet: 'bg-purple-50 text-purple-600',
                  orange: 'bg-amber-50 text-amber-600'
                };
                return (
                  <div key={idx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorMap[item.color] || 'bg-blue-50 text-blue-600'}`}>
                      {idx === 0 && <TrendingUp className="w-3.5 h-3.5" />}
                      {idx === 1 && <ShoppingBag className="w-3.5 h-3.5" />}
                      {idx === 2 && <CreditCard className="w-3.5 h-3.5" />}
                      {idx === 3 && <MapPin className="w-3.5 h-3.5" />}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug font-medium">
                      {item.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Powered by SQLite OLAP aggregation engine
          </div>
        </div>
      </div>

      {/* 4. Row 3: Recent Transactions, Sales by Region, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Transactions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2>
              <p className="text-[11px] text-slate-400">Latest sales orders synchronized into warehouse</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-semibold">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTxns.map((tx) => {
                  const channelBadge = tx.channel === 'Online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tx.channel === 'Mobile App'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{tx.date}</td>
                      <td className="py-2.5 font-medium text-slate-800">{tx.customer}</td>
                      <td className="py-2.5 text-slate-600 max-w-[120px] truncate">{tx.product}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(tx.amount)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${channelBadge}`}>
                          {tx.channel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Region */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-800">Sales by Region</h2>
            <p className="text-[11px] text-slate-400">Geographic sales performance across India zones</p>
          </div>
          <div className="space-y-3 py-1">
            {regionSales.map((r, i) => {
              const regionColors = ['bg-blue-600', 'bg-teal-500', 'bg-purple-500', 'bg-amber-500', 'bg-slate-400'];
              return (
                <div key={r.region}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${regionColors[i % regionColors.length]}`}></span>
                      {r.region}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{formatINR(r.revenue, true)}</span>
                      <span className="font-bold text-slate-900 w-12 text-right">{r.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${regionColors[i % regionColors.length]}`}
                      style={{ width: `${r.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-center justify-between">
            <span>West Region leads with highest concentration (Pune & Mumbai).</span>
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-1">Quick Actions</h2>
            <p className="text-[11px] text-slate-400 mb-4">Direct operational workflows & exports</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setActivePage('etl')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Run ETL Process</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActivePage('warehouse')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-700 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>View Data Warehouse</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setActivePage('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Generate Report</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleDownloadCSV}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download Data</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Export format: CSV (RFC 4180 standard)
          </div>
        </div>
      </div>
    </div>
  );
}
