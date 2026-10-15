import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  MapPin,
  CreditCard,
  Database,
  Layers,
  FileText,
  Settings,
  ShoppingCart
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
  { id: 'products', label: 'Product Analytics', icon: Package },
  { id: 'stores', label: 'Store & Regional Analytics', icon: MapPin },
  { id: 'channels', label: 'Channel & Payment Analytics', icon: CreditCard },
  { id: 'etl', label: 'Data Import & ETL', icon: Database },
  { id: 'warehouse', label: 'Data Warehouse Explorer', icon: Layers },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A1128] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-[#1E293B]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Retail Insights
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                Data Warehouse & Analytics
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (setIsMobileOpen) setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left
                    ${isActive 
                      ? 'bg-[#1E5BF8] text-white shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="font-medium text-slate-300">Retail Sales DW v1.0</div>
          <div className="text-slate-500 mt-0.5 flex items-center gap-1">
            Built with <span className="text-rose-500 text-xs">❤️</span> using React + Flask
          </div>
        </div>
      </aside>
    </>
  );
}
