import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function KpiCard({ title, value, trend, icon: Icon, colorTheme }) {
  // Predefined color themes matching reference screenshot
  const themes = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      badgeBg: 'bg-blue-500 text-white'
    },
    teal: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      badgeBg: 'bg-emerald-500 text-white'
    },
    violet: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
      badgeBg: 'bg-purple-500 text-white'
    },
    cyan: {
      bg: 'bg-teal-500',
      text: 'text-teal-600',
      badgeBg: 'bg-teal-500 text-white'
    },
    fuchsia: {
      bg: 'bg-fuchsia-500',
      text: 'text-fuchsia-600',
      badgeBg: 'bg-fuchsia-500 text-white'
    },
    orange: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-500 text-white'
    }
  };

  const currentTheme = themes[colorTheme] || themes.blue;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${currentTheme.badgeBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-slate-500 leading-none truncate">
            {title}
          </p>
          <h3 className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight truncate">
            {value}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            <span>{trend} vs. previous period</span>
          </div>
        </div>
      </div>
    </div>
  );
}
