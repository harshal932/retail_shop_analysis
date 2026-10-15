import React, { useState } from 'react';
import axios from 'axios';
import {
  Settings,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Code2
} from 'lucide-react';

export default function SettingsPage({ meta, onResetSuccess }) {
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset the Data Warehouse? This will reinitialize all tables and reload clean baseline records.")) {
      return;
    }
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await axios.post('/api/etl/reset');
      setResetMsg({ type: 'success', text: res.data.message || 'Database successfully reset to clean state.' });
      if (onResetSuccess) onResetSuccess();
    } catch (err) {
      setResetMsg({ type: 'error', text: err.response?.data?.error || 'Database reset failed.' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h2 className="text-lg font-bold text-slate-900">System & Database Settings</h2>
        <p className="text-xs text-slate-500">
          Environment configuration, schema storage management, and database reset controls.
        </p>
      </div>

      {/* Database Management Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Warehouse Storage & Baseline Reset
        </h3>
        <p className="text-[11px] text-slate-400 mb-4">
          Manage SQLite 3 relational data warehouse instance (`backend/warehouse.db`).
        </p>

        {resetMsg && (
          <div className={`p-3 rounded-lg text-xs font-semibold mb-4 flex items-center gap-2 ${
            resetMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {resetMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{resetMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[11px]">Database Type</span>
            <span className="font-bold text-slate-800">SQLite 3 (Relational Mart)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[11px]">Primary Fact Records</span>
            <span className="font-bold text-slate-800">{meta?.total_dw_rows?.toLocaleString('en-IN') || '12,893'} rows</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 block text-[11px]">Pipeline Status</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online & Synchronized
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Factory Reset Warehouse</h4>
            <p className="text-[11px] text-slate-400">Reinitializes DDL schemas and reloads initial clean dataset</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset to Clean State'}</span>
          </button>
        </div>
      </div>

      {/* Technical Architecture Stack */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-600" /> Technology Stack Specifications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800">Frontend Presentation Tier</strong>
            <span className="text-slate-600">React 19, Vite, Tailwind CSS v4, Recharts, Lucide Icons, Axios</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="block text-slate-800">Analytics & Warehouse Backend</strong>
            <span className="text-slate-600">Python 3.14, Flask REST API, Flask-CORS, Pandas, SQLite 3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
