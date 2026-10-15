import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FooterStatusBar from './components/FooterStatusBar';

// Pages
import Dashboard from './pages/Dashboard';
import SalesAnalytics from './pages/SalesAnalytics';
import ProductAnalytics from './pages/ProductAnalytics';
import StoreAnalytics from './pages/StoreAnalytics';
import ChannelAnalytics from './pages/ChannelAnalytics';
import EtlPage from './pages/EtlPage';
import WarehouseExplorer from './pages/WarehouseExplorer';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    datePreset: 'all',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    category: 'All Categories',
    store: 'All Stores',
    channel: 'All Channels'
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: ['All Categories'],
    stores: ['All Stores'],
    channels: ['All Channels']
  });

  // Global Dashboard data
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get('/api/filters');
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/dashboard', { params: filters });
      setDashboardData(res.data);
    } catch (err) {
      setError('Failed to connect to Analytics API. Ensure backend is running.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased">
      {/* 1. Dark Navy Sidebar (Left Navigation) */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* 2. Main Workspace (Right Area) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header & Global Filters */}
        <Header
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          onRefresh={handleRefresh}
          loading={loading}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Workspace Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={handleRefresh} 
                className="underline hover:no-underline ml-4 text-rose-800"
              >
                Retry Connection
              </button>
            </div>
          )}

          {activePage === 'dashboard' && (
            <Dashboard
              data={dashboardData}
              loading={loading}
              setActivePage={setActivePage}
            />
          )}

          {activePage === 'sales' && (
            <SalesAnalytics filters={filters} />
          )}

          {activePage === 'products' && (
            <ProductAnalytics filters={filters} />
          )}

          {activePage === 'stores' && (
            <StoreAnalytics filters={filters} />
          )}

          {activePage === 'channels' && (
            <ChannelAnalytics filters={filters} />
          )}

          {activePage === 'etl' && (
            <EtlPage onEtlCompleted={fetchDashboardData} />
          )}

          {activePage === 'warehouse' && (
            <WarehouseExplorer />
          )}

          {activePage === 'reports' && (
            <ReportsPage dashboardData={dashboardData} />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              meta={dashboardData?.meta}
              onResetSuccess={fetchDashboardData}
            />
          )}

          {/* Persistent Footer Status Bar */}
          <FooterStatusBar meta={dashboardData?.meta} />
        </main>
      </div>
    </div>
  );
}
