import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package,
  Search,
  ArrowUpDown,
  Tag,
  Percent,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { formatINR, formatNumber } from '../utils/formatters';

const CATEGORY_COLORS = ['#2563EB', '#0D9488', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export default function ProductAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('net_revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchProductData();
  }, [filters]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/products', { params: filters });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load product analytics:', err);
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

  const categories = data?.categories || [];
  let products = data?.products || [];

  if (searchTerm) {
    products = products.filter(p =>
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  products.sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Product & Category Analytics</h2>
          <p className="text-xs text-slate-500">
            Dimension analysis on merchandise performance, category contribution, and discount rates.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
          Dim_Product × Fact_Sales
        </div>
      </div>

      {/* Category Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((c, i) => (
          <div key={c.category} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{c.category}</div>
            <div className="text-base font-bold text-slate-900 mt-1">{formatINR(c.net_revenue, true)}</div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>{formatNumber(c.units_sold)} units</span>
              <span className="text-amber-600 font-semibold">{c.discount_pct}% disc</span>
            </div>
          </div>
        ))}
      </div>

      {/* Category Revenue Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Category Revenue & Discount Comparison</h3>
        <p className="text-[11px] text-slate-400 mb-4">Net Revenue vs Discount Given per Product Line</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => formatINR(val, true)} />
              <Tooltip 
                formatter={(val, name) => [formatINR(val), name === 'net_revenue' ? 'Net Revenue' : 'Discount Given']}
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              />
              <Bar dataKey="net_revenue" name="Net Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discounts" name="Discount Given" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Products Ranked Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">All Product SKUs Performance</h3>
            <p className="text-[11px] text-slate-400">Search, filter, and analyze individual catalog products</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product, category, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
              <tr className="text-[11px] text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('unit_price')}>
                  Unit Price <ArrowUpDown className="w-2.5 h-2.5 inline" />
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('units_sold')}>
                  Units Sold <ArrowUpDown className="w-2.5 h-2.5 inline" />
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('discount_given')}>
                  Discount <ArrowUpDown className="w-2.5 h-2.5 inline" />
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('net_revenue')}>
                  Net Revenue <ArrowUpDown className="w-2.5 h-2.5 inline" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.product_name} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-800">{p.product_name}</td>
                  <td className="py-2 px-3 text-slate-500">{p.category}</td>
                  <td className="py-2 px-3 text-slate-500">{p.brand}</td>
                  <td className="py-2 px-3 text-right text-slate-700">{formatINR(p.unit_price)}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-700">{formatNumber(p.units_sold)}</td>
                  <td className="py-2 px-3 text-right text-amber-600">{formatINR(p.discount_given)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(p.net_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
