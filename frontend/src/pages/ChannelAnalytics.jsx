import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard,
  Smartphone,
  Store,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { formatINR, formatNumber } from '../utils/formatters';

const PAYMENT_COLORS = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EF4444'];
const CHANNEL_COLORS = ['#2563EB', '#0D9488', '#8B5CF6'];

export default function ChannelAnalytics({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannelData();
  }, [filters]);

  const fetchChannelData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/channels', { params: filters });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load channel analytics:', err);
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

  const channels = data?.channels || [];
  const payments = data?.payments || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Channel & Payment Analytics</h2>
          <p className="text-xs text-slate-500">
            Omnichannel performance attribution, conversion patterns, and electronic payment adoption metrics.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg border border-violet-200">
          Dim_Channel × Dim_Payment
        </div>
      </div>

      {/* Row 1: Channel Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {channels.map((ch, idx) => (
          <div key={ch.channel_name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-slate-800">{ch.channel_name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                {ch.channel_type}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{formatINR(ch.net_revenue)}</div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                <span className="block text-[11px] text-slate-400">Transactions</span>
                <span className="font-semibold text-slate-700">{formatNumber(ch.transactions)}</span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Average Order</span>
                <span className="font-semibold text-blue-600">{formatINR(ch.avg_order_value)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Payment Methods Share & Channel Revenue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Payment Method Distribution</h3>
          <p className="text-[11px] text-slate-400 mb-3">Transaction volume breakdown by payment instrument</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={payments}
                  dataKey="transactions"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ payment_method, share_pct }) => `${payment_method} (${share_pct}%)`}
                >
                  {payments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val, name, entry) => [
                    `${formatNumber(val)} transactions (${entry.payload.share_pct}%)`,
                    entry.payload.payment_method
                  ]}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Payment Methods Audit Summary</h3>
          <p className="text-[11px] text-slate-400 mb-3">Electronic vs Cash settlements</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400">
                  <th className="pb-2">Payment Instrument</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Transactions</th>
                  <th className="pb-2 text-right">Volume Share</th>
                  <th className="pb-2 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pm, i) => (
                  <tr key={pm.payment_method} className="hover:bg-slate-50">
                    <td className="py-2.5 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }}></span>
                      {pm.payment_method}
                    </td>
                    <td className="py-2.5 text-slate-500">{pm.payment_category}</td>
                    <td className="py-2.5 text-right font-medium text-slate-700">{formatNumber(pm.transactions)}</td>
                    <td className="py-2.5 text-right font-bold text-blue-600">{pm.share_pct}%</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">{formatINR(pm.total_amount)}</td>
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
