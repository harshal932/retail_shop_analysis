import React, { useState } from 'react';
import { Menu, Calendar, RotateCw, Bell, ChevronDown, Check, User } from 'lucide-react';

export default function Header({
  filters,
  setFilters,
  filterOptions,
  onRefresh,
  loading,
  setIsMobileOpen
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'ETL Pipeline successfully processed 12,893 records', time: '10 mins ago', unread: true },
    { id: 2, text: 'UPI transaction volume reached peak in West region', time: '1 hour ago', unread: false },
    { id: 3, text: 'Database backup synchronized to warehouse.db', time: '3 hours ago', unread: false }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title area */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(prev => !prev)}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Retail Sales Data Warehouse & Analytics
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Insights for Better Decisions
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.datePreset || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'q1') {
                  setFilters({ ...filters, datePreset: val, startDate: '2025-01-01', endDate: '2025-03-31' });
                } else if (val === 'q2') {
                  setFilters({ ...filters, datePreset: val, startDate: '2025-04-01', endDate: '2025-06-30' });
                } else if (val === 'q3') {
                  setFilters({ ...filters, datePreset: val, startDate: '2025-07-01', endDate: '2025-09-30' });
                } else if (val === 'q4') {
                  setFilters({ ...filters, datePreset: val, startDate: '2025-10-01', endDate: '2025-12-31' });
                } else {
                  setFilters({ ...filters, datePreset: 'all', startDate: '2025-01-01', endDate: '2025-12-31' });
                }
              }}
              className="bg-transparent border-none outline-none text-xs text-slate-700 cursor-pointer pr-1"
            >
              <option value="all">01 Jan 2025 - 31 Dec 2025</option>
              <option value="q1">Q1 (Jan - Mar 2025)</option>
              <option value="q2">Q2 (Apr - Jun 2025)</option>
              <option value="q3">Q3 (Jul - Sep 2025)</option>
              <option value="q4">Q4 (Oct - Dec 2025)</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category || 'All Categories'}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {(filterOptions?.categories || ['All Categories']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Store Dropdown */}
          <div className="relative">
            <select
              value={filters.store || 'All Stores'}
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer max-w-[130px] truncate"
            >
              {(filterOptions?.stores || ['All Stores']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Channel Dropdown */}
          <div className="relative">
            <select
              value={filters.channel || 'All Channels'}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {(filterOptions?.channels || ['All Channels']).map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Data"
            className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all disabled:opacity-60 shadow-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-xs text-slate-800">Notifications</span>
                  <button 
                    onClick={markAllRead} 
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 px-1">
                      <p className="text-xs text-slate-700 leading-snug">{n.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold ring-2 ring-slate-100">
              AD
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-800">Admin</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
