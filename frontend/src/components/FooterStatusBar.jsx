import React from 'react';

export default function FooterStatusBar({ meta }) {
  const lastRun = meta?.last_etl_run || '2025-12-15 10:42';
  const totalRows = meta?.total_dw_rows?.toLocaleString('en-IN') || '12,893';

  return (
    <footer className="mt-8 border-t border-slate-200/80 bg-white/60 py-3 px-4 lg:px-6 rounded-lg text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <span>
          <strong className="font-semibold text-slate-700">Last ETL Run:</strong> {lastRun}
        </span>
        <span className="text-slate-300">|</span>
        <span>
          <strong className="font-semibold text-slate-700">Data Warehouse:</strong> {totalRows} rows
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-slate-700 text-xs">System Online</span>
      </div>
    </footer>
  );
}
