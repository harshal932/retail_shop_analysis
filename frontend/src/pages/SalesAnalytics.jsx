import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Calendar,
  Percent,
  DollarSign,
  ArrowUpRight,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { formatINR, formatNumber } from '../utils/formatters';

export default function SalesAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, [filters]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/sales', { params: filters });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load sales analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const quarterly = data?.quarterly || [];
  const dayDistribution = data?.day_distribution || [];
  const weekendSplit = data?.weekend_split || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales & Revenue Analytics</h2>
          <p className="text-xs text-slate-500">
            Multi-dimensional analysis across fiscal quarters, weekly demand cycles, and margin retention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            OLAP Granularity: Day & Quarter
          </span>
        </div>
      </div>

      {/* Row 1: Quarterly Sales Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Quarterly Performance (Gross vs Net Sales)</h3>
          <p className="text-[11px] text-slate-400 mb-4">Comparison of gross revenue against discount deductions</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => formatINR(val, true)} />
                <Tooltip 
                  formatter={(val, name) => [formatINR(val), name === 'gross_sales' ? 'Gross Sales' : 'Net Sales']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend />
                <Bar dataKey="gross_sales" name="Gross Sales" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net_sales" name="Net Sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Weekend vs Weekday Split</h3>
            <p className="text-[11px] text-slate-400 mb-4">Customer shopping pattern by calendar day</p>
            <div className="space-y-4">
              {weekendSplit.map((item) => (
                <div key={item.day_type} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-xs">{item.day_type}</span>
                    <span className="font-semibold text-blue-600 text-xs">{formatINR(item.net_revenue, true)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Transactions: {formatNumber(item.transactions)}</span>
                    <span>Avg Ticket: {formatINR(item.avg_ticket)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800">
            <strong>Key Insight:</strong> Weekend average ticket value is typically higher due to combined family shopping baskets.
          </div>
        </div>
      </div>

      {/* Row 2: Day of Week Trend Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Daily Footfall & Revenue by Day of Week</h3>
          <p className="text-[11px] text-slate-400 mb-4">Total revenue captured on each day</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dayDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day_name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => formatINR(val, true)} />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="total_revenue" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Quarterly Metrics Table</h3>
          <p className="text-[11px] text-slate-400 mb-3">Audited financial aggregates across 2025</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400">
                  <th className="pb-2">Quarter</th>
                  <th className="pb-2 text-right">Transactions</th>
                  <th className="pb-2 text-right">Gross Sales</th>
                  <th className="pb-2 text-right">Discounts</th>
                  <th className="pb-2 text-right">Net Sales</th>
                  <th className="pb-2 text-right">AOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quarterly.map((q) => (
                  <tr key={q.quarter} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-800">{q.quarter}</td>
                    <td className="py-2.5 text-right font-medium text-slate-600">{formatNumber(q.transactions)}</td>
                    <td className="py-2.5 text-right font-medium text-slate-600">{formatINR(q.gross_sales)}</td>
                    <td className="py-2.5 text-right font-medium text-amber-600">{formatINR(q.discounts)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(q.net_sales)}</td>
                    <td className="py-2.5 text-right font-semibold text-blue-600">{formatINR(q.aov)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
