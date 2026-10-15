import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapPin,
  Building2,
  TrendingUp,
  ShoppingBag,
  Compass,
  Store
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

const STORE_COLORS = ['#2563EB', '#0D9488', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

export default function StoreAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreData();
  }, [filters]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/stores', { params: filters });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load store analytics:', err);
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

  const stores = data?.stores || [];
  const regions = data?.regions || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Store & Regional Analytics</h2>
          <p className="text-xs text-slate-500">
            Spatial dimension analysis comparing outlet revenue, regional demand clustering, and basket sizes.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
          Dim_Store × Dim_Region_Snow
        </div>
      </div>

      {/* Row 1: Regional Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {regions.map((r, i) => (
          <div key={r.region} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{r.region} Region</span>
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1.5">{formatINR(r.net_revenue, true)}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>{r.store_count} Outlets</span>
              <span>{formatNumber(r.transactions)} orders</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Store Revenue Chart & Regional Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Outlet Net Revenue by City</h3>
          <p className="text-[11px] text-slate-400 mb-4">Ranked sales contribution per retail location</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stores} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => formatINR(val, true)} />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Net Revenue']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="net_revenue" radius={[4, 4, 0, 0]}>
                  {stores.map((entry, index) => (
                    <Cell key={`store-bar-${index}`} fill={STORE_COLORS[index % STORE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Store Performance Highlights</h3>
            <p className="text-[11px] text-slate-400 mb-4">Executive summary of retail outlets</p>
            <div className="space-y-3">
              {stores.slice(0, 4).map((s) => (
                <div key={s.store_id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-600" /> {s.city}
                    </span>
                    <span className="text-blue-600">{formatINR(s.net_revenue, true)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>AOV: {formatINR(s.avg_basket_value)}</span>
                    <span>Units: {formatNumber(s.units_sold)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Source: dim_store integrated with sales mart
          </div>
        </div>
      </div>

      {/* Row 3: Full Stores Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Complete Store Audit Register</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400">
                <th className="pb-2.5 font-medium">Store ID</th>
                <th className="pb-2.5 font-medium">Store Name</th>
                <th className="pb-2.5 font-medium">City</th>
                <th className="pb-2.5 font-medium">Region</th>
                <th className="pb-2.5 text-right font-medium">Transactions</th>
                <th className="pb-2.5 text-right font-medium">Units Sold</th>
                <th className="pb-2.5 text-right font-medium">Avg Basket Value</th>
                <th className="pb-2.5 text-right font-medium">Net Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((s) => (
                <tr key={s.store_id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono text-slate-500">{s.store_id}</td>
                  <td className="py-2.5 font-semibold text-slate-800">{s.store_name}</td>
                  <td className="py-2.5 text-slate-600">{s.city}</td>
                  <td className="py-2.5 text-slate-600">{s.region}</td>
                  <td className="py-2.5 text-right font-medium text-slate-700">{formatNumber(s.transactions)}</td>
                  <td className="py-2.5 text-right font-medium text-slate-700">{formatNumber(s.units_sold)}</td>
                  <td className="py-2.5 text-right text-blue-600 font-semibold">{formatINR(s.avg_basket_value)}</td>
                  <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(s.net_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
