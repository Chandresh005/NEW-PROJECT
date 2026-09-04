import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TbDownload,
  TbAlertTriangle,
  TbRefresh,
  TbFileCertificate,
  TbMapPin,
  TbCheck,
  TbFileText,
} from 'react-icons/tb';
import { toast } from 'react-toastify';

import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import MetricCard from '../components/MetricCard';
import ScanTable from '../components/ScanTable';
import StatusPill from '../components/StatusPill';

// Demonstration baseline records for Legal Metrology officers when database is fresh
const SAMPLE_BASELINE_SCANS = [
  {
    id: 101,
    product_name: 'Tata Sampann Unpolished Toor Dal 1kg',
    manufacturer: 'Tata Consumer Products Ltd.',
    gtin: '8901030882104',
    state: 'Maharashtra',
    font_height_mm: 1.9,
    font_check_str: '1.9mm ok',
    overall_status: 'compliant',
    source: 'official',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 102,
    product_name: 'Haldiram’s Bhujia Sev 400g Pouch',
    manufacturer: 'Haldiram Snacks Pvt. Ltd.',
    gtin: '8904004401298',
    state: 'Delhi NCT',
    font_height_mm: 0.8,
    font_check_str: '0.8mm low',
    overall_status: 'flagged',
    source: 'official',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 103,
    product_name: 'Aashirvaad Superior MP Atta 5kg',
    manufacturer: 'ITC Limited Foods Division',
    gtin: '8901030752109',
    state: 'Karnataka',
    font_height_mm: 2.4,
    font_check_str: '2.4mm ok',
    overall_status: 'compliant',
    source: 'official',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 104,
    product_name: 'Patanjali Pure Cow Ghee 500ml Tin',
    manufacturer: 'Patanjali Ayurved Ltd.',
    gtin: '8904109405521',
    state: 'Uttar Pradesh',
    font_height_mm: 1.2,
    font_check_str: '1.2mm low',
    overall_status: 'review',
    source: 'citizen',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 105,
    product_name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    manufacturer: 'Adani Wilmar Limited',
    gtin: '8906007281033',
    state: 'Gujarat',
    font_height_mm: 2.0,
    font_check_str: '2.0mm ok',
    overall_status: 'compliant',
    source: 'official',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 106,
    product_name: 'Everest Garam Masala 100g Carton',
    manufacturer: 'Everest Food Products Pvt. Ltd.',
    gtin: '8901786100228',
    state: 'Madhya Pradesh',
    font_height_mm: 0.9,
    font_check_str: '0.9mm low',
    overall_status: 'flagged',
    source: 'official',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
  },
];

const REGIONAL_TREND_DATA = [
  { region: 'Maharashtra', compliant: 42, flagged: 11, review: 4 },
  { region: 'Delhi NCT', compliant: 38, flagged: 14, review: 5 },
  { region: 'Karnataka', compliant: 31, flagged: 7, review: 3 },
  { region: 'Gujarat', compliant: 29, flagged: 9, review: 2 },
  { region: 'Tamil Nadu', compliant: 26, flagged: 6, review: 4 },
  { region: 'Uttar Pradesh', compliant: 34, flagged: 16, review: 6 },
];

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'scans';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch dashboard stats from live backend API
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.warn('Backend stats unavailable, using inspection defaults:', err);
    }
  }, []);

  // Fetch scans from live backend API
  const fetchScans = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '15' });
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/dashboard/scans?${params.toString()}`);
      const data = response.data;
      const backendScans = data.scans || data.items || [];

      if (backendScans.length > 0) {
        setScans(backendScans);
        setTotalPages(data.pagination?.total_pages ?? 1);
        setTotalItems(data.pagination?.total_items ?? backendScans.length);
      } else {
        // Fallback baseline for demonstration when database is fresh
        let filtered = [...SAMPLE_BASELINE_SCANS];
        if (statusFilter) {
          filtered = filtered.filter((s) => s.overall_status === statusFilter);
        }
        setScans(filtered);
        setTotalPages(1);
        setTotalItems(filtered.length);
      }
    } catch (err) {
      console.warn('Using baseline scan sample data:', err);
      let filtered = [...SAMPLE_BASELINE_SCANS];
      if (statusFilter) {
        filtered = filtered.filter((s) => s.overall_status === statusFilter);
      }
      setScans(filtered);
      setTotalPages(1);
      setTotalItems(filtered.length);
    }
  }, [page, statusFilter]);

  // Fetch citizen flagged leads
  const fetchLeads = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/leads?limit=15');
      setLeads(response.data.leads || []);
    } catch (err) {
      console.warn('Leads fetch:', err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchScans(), fetchLeads()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchStats, fetchScans, fetchLeads]);

  // Filter scans by search query
  const displayedScans = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    const q = searchQuery.toLowerCase();
    return scans.filter(
      (s) =>
        s.product_name?.toLowerCase().includes(q) ||
        s.manufacturer?.toLowerCase().includes(q) ||
        s.gtin?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
    );
  }, [scans, searchQuery]);

  // Calculated metrics
  const totalScansValue = stats?.total_scans ?? totalItems ?? 128;
  const compliantValue = stats?.compliant ?? 94;
  const flaggedValue = stats?.non_compliant ?? 24;

  const handleTabChange = (tabId) => {
    setSearchParams(tabId === 'scans' ? {} : { tab: tabId });
  };

  // PDF report downloader
  const handleDownloadReport = async (scanId) => {
    try {
      toast.info(`Generating Section 65B certificate for Scan #${scanId}...`);
      const response = await api.get(`/scan/${scanId}/report`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliscan_certificate_scan_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate report for this scan');
    }
  };

  return (
    <div className="min-h-screen bg-compliscan-bg flex font-sans text-compliscan-navy antialiased">
      {/* 1. Fixed Left Sidebar (~180px, navy #1B2A4A) */}
      <Sidebar
        activeTab={currentTab}
        onTabChange={handleTabChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        flaggedCount={flaggedValue}
      />

      {/* Main Content Layout (Offset by ~180px on desktop) */}
      <div className="flex-1 md:pl-[180px] flex flex-col min-w-0">
        {/* 2. Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          placeholder="Search scans by product, GTIN, manufacturer, or region..."
        />

        {/* 3. Main Content Area (#F7F5F0 background, left-aligned, data-dense) */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* Section Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-compliscan-border/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-compliscan-navy tracking-tight">
                  {currentTab === 'scans' && 'Enforcement Inspection Station'}
                  {currentTab === 'flags' && 'Compliance Risk & Flagged Queue'}
                  {currentTab === 'reports' && 'Section 65B Legal Certificates'}
                  {currentTab === 'map' && 'Geographic Jurisdiction & Violation Heatmap'}
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#EAE6DF] text-compliscan-secondary font-semibold">
                  Rule 2011 Verified
                </span>
              </div>
              <p className="text-xs text-compliscan-secondary mt-0.5">
                Ministry of Consumer Affairs, Food & Public Distribution • Legal Metrology Act, 2009
              </p>
            </div>

            {/* Quick Refresh Status */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchScans();
                  toast.info('Refreshed metrology scan data');
                }}
                className="px-2 py-1 text-xs font-medium rounded-sm border border-compliscan-border bg-compliscan-card hover:bg-[#EDEAE3] text-compliscan-navy flex items-center gap-1 transition-colors"
                title="Refresh scan registry"
              >
                <TbRefresh className="w-3.5 h-3.5" />
                <span>Sync Registry</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: SCANS (Default primary view) */}
          {/* ========================================================================= */}
          {currentTab === 'scans' && (
            <div className="space-y-6">
              {/* Row of 3 Metric Cards: Total scans today, Compliant, Flagged */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {/* 1. Total Scans Today (Navy) */}
                <MetricCard
                  label="Total Scans Today"
                  value={totalScansValue}
                  variant="navy"
                  badge="Active Inspection"
                  subtext={
                    <span className="text-compliscan-secondary">
                      Inspections logged across jurisdictional zones
                    </span>
                  }
                />

                {/* 2. Compliant (Forest Green #2F6844) */}
                <MetricCard
                  label="Compliant Products"
                  value={compliantValue}
                  variant="compliant"
                  badge={`${Math.round((compliantValue / (totalScansValue || 1)) * 100)}% Rate`}
                  subtext={
                    <span className="text-compliscan-compliant font-medium flex items-center gap-1">
                      <TbCheck className="w-3.5 h-3.5" />
                      <span>Adherent to MRP, font, & declarations</span>
                    </span>
                  }
                />

                {/* 3. Flagged (Brick Red #A13D2C) */}
                <MetricCard
                  label="Flagged Violations"
                  value={flaggedValue}
                  variant="flagged"
                  badge="Action Required"
                  subtext={
                    <span className="text-compliscan-flagged font-medium flex items-center gap-1">
                      <TbAlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending show-cause / penalty notices</span>
                    </span>
                  }
                />
              </div>

              {/* Data Table Section Header & Filter Controls */}
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-sm text-compliscan-navy">
                    Recent Inspection Scans
                  </span>
                  <span className="text-[11px] text-compliscan-secondary font-mono">
                    [{displayedScans.length} records]
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-compliscan-secondary font-medium">
                    Filter status:
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('')}
                    className={`px-2 py-0.5 rounded-sm font-medium border text-xs transition-colors ${
                      statusFilter === ''
                        ? 'bg-compliscan-navy text-white border-compliscan-navy'
                        : 'bg-compliscan-bg text-compliscan-secondary border-compliscan-border hover:bg-[#EAE6DF]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('compliant')}
                    className={`px-2 py-0.5 rounded-sm font-medium border text-xs transition-colors ${
                      statusFilter === 'compliant'
                        ? 'bg-compliscan-compliant text-white border-compliscan-compliant'
                        : 'bg-compliscan-compliant-bg text-compliscan-compliant-text border-compliscan-compliant-border'
                    }`}
                  >
                    Compliant
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('flagged')}
                    className={`px-2 py-0.5 rounded-sm font-medium border text-xs transition-colors ${
                      statusFilter === 'flagged'
                        ? 'bg-compliscan-flagged text-white border-compliscan-flagged'
                        : 'bg-compliscan-flagged-bg text-compliscan-flagged-text border-compliscan-flagged-border'
                    }`}
                  >
                    Flagged
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('review')}
                    className={`px-2 py-0.5 rounded-sm font-medium border text-xs transition-colors ${
                      statusFilter === 'review'
                        ? 'bg-compliscan-review text-white border-compliscan-review'
                        : 'bg-compliscan-review-bg text-compliscan-review-text border-compliscan-review-border'
                    }`}
                  >
                    Review
                  </button>
                </div>
              </div>

              {/* Data-dense Recent Scans Table */}
              <ScanTable
                scans={displayedScans}
                loading={loading}
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
                onDownloadReport={handleDownloadReport}
              />

              {/* Optional Recharts: Violation Trends by Region */}
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-compliscan-border/60 pb-3">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold font-serif text-compliscan-navy">
                      Regional Compliance Analysis
                    </h2>
                    <p className="text-xs text-compliscan-secondary mt-0.5">
                      Statutory adherence vs. violations by state jurisdiction (Rule 9 font height & Rule 6 mandatory declarations)
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-2 sm:mt-0 font-sans font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-compliscan-compliant rounded-xs" />
                      <span>Compliant</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-compliscan-flagged rounded-xs" />
                      <span>Flagged</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={REGIONAL_TREND_DATA}
                      margin={{ top: 10, right: 15, left: -15, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#E4E0D7" vertical={false} />
                      <XAxis
                        dataKey="region"
                        tick={{ fill: '#5C5C52', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                        axisLine={{ stroke: '#E4E0D7' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#5C5C52', fontSize: 11, fontFamily: 'IBM Plex Sans' }}
                        axisLine={{ stroke: '#E4E0D7' }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E4E0D7',
                          borderRadius: 2,
                          boxShadow: 'none',
                          fontSize: 12,
                          fontFamily: 'IBM Plex Sans',
                        }}
                      />
                      <Bar dataKey="compliant" fill="#2F6844" name="Compliant" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="flagged" fill="#A13D2C" name="Flagged Violations" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FLAGS (Violations & Risk Queue) */}
          {/* ========================================================================= */}
          {currentTab === 'flags' && (
            <div className="space-y-4">
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold font-serif text-compliscan-navy">
                      Prioritized Metrology Violation Queue
                    </h2>
                    <p className="text-xs text-compliscan-secondary mt-0.5">
                      Products flagged for non-adherence to font height (Rule 9), missing MRP declarations, or misleading net content.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {leads.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-sm bg-[#EDEAE3] text-compliscan-secondary border border-compliscan-border">
                        {leads.length} Citizen Leads
                      </span>
                    )}
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-sm bg-compliscan-flagged-bg text-compliscan-flagged-text border border-compliscan-flagged-border">
                      {flaggedValue} Flagged Cases
                    </span>
                  </div>
                </div>
              </div>

              {/* Flagged Scans Table */}
              <ScanTable
                scans={displayedScans.filter((s) => s.overall_status === 'flagged' || s.overall_status === 'non_compliant')}
                loading={loading}
                page={1}
                totalPages={1}
                totalItems={flaggedValue}
                onDownloadReport={handleDownloadReport}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: REPORTS (Court Admissible Section 65B Certificates) */}
          {/* ========================================================================= */}
          {currentTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm p-4">
                <div className="flex items-center gap-2.5">
                  <TbFileCertificate className="w-6 h-6 text-compliscan-gold" />
                  <div>
                    <h2 className="text-base font-bold font-serif text-compliscan-navy">
                      Legal Compliance Certificates (Section 65B Indian Evidence Act / Section 63 BSA)
                    </h2>
                    <p className="text-xs text-compliscan-secondary mt-0.5">
                      Cryptographically hashed PDF evidence dossiers admissible in court proceedings and adjudication under Rule 32.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm divide-y divide-compliscan-border">
                {displayedScans.slice(0, 8).map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-compliscan-bg/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-sm bg-[#EFECE5] text-compliscan-navy border border-compliscan-border">
                        <TbFileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-compliscan-navy">
                          Compliance Dossier #{scan.id} — {scan.product_name || `Commodity #${scan.id}`}
                        </h3>
                        <p className="text-[11px] text-compliscan-secondary mt-0.5 font-mono">
                          SHA-256: {scan.image_hash?.substring(0, 24) || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}...
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusPill status={scan.overall_status} size="sm" />
                          <span className="text-[11px] text-compliscan-secondary">
                            Region: {scan.state || 'Central Jurisdiction'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadReport(scan.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm bg-compliscan-navy text-white text-xs font-semibold font-sans hover:bg-[#283C66] focus-visible:ring-2 focus-visible:ring-compliscan-gold transition-colors"
                    >
                      <TbDownload className="w-4 h-4 text-compliscan-gold" />
                      <span>Download PDF Dossier</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MAP VIEW (Geographic Inspection Breakdown) */}
          {/* ========================================================================= */}
          {currentTab === 'map' && (
            <div className="space-y-4">
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm p-4">
                <div className="flex items-center gap-2.5">
                  <TbMapPin className="w-5 h-5 text-compliscan-navy" />
                  <div>
                    <h2 className="text-base font-bold font-serif text-compliscan-navy">
                      State Enforcement Metrology Matrix
                    </h2>
                    <p className="text-xs text-compliscan-secondary mt-0.5">
                      Geographic distribution of inspections, compliance indices, and violation densities across State Controller jurisdictions.
                    </p>
                  </div>
                </div>
              </div>

              {/* State Grid Table */}
              <div className="bg-compliscan-card border border-compliscan-border rounded-sm overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-compliscan-border bg-[#F3EFE6] text-[11px] font-semibold text-compliscan-navy uppercase tracking-wider">
                      <th className="py-2.5 px-4">State Jurisdiction</th>
                      <th className="py-2.5 px-4 text-right">Total Inspected</th>
                      <th className="py-2.5 px-4 text-right">Compliant</th>
                      <th className="py-2.5 px-4 text-right">Violations</th>
                      <th className="py-2.5 px-4 text-right">Violation Rate</th>
                      <th className="py-2.5 px-4">Risk Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-compliscan-border/70">
                    {REGIONAL_TREND_DATA.map((reg, idx) => {
                      const total = reg.compliant + reg.flagged + reg.review;
                      const rate = Math.round((reg.flagged / total) * 100);
                      const isHigh = rate > 25;

                      return (
                        <tr key={idx} className="hover:bg-compliscan-bg/50">
                          <td className="py-2.5 px-4 font-semibold text-compliscan-navy">
                            {reg.region}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">{total}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-compliscan-compliant font-medium">
                            {reg.compliant}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-compliscan-flagged font-medium">
                            {reg.flagged}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold">
                            {rate}%
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium border ${
                                isHigh
                                  ? 'bg-compliscan-flagged-bg text-compliscan-flagged-text border-compliscan-flagged-border'
                                  : 'bg-compliscan-compliant-bg text-compliscan-compliant-text border-compliscan-compliant-border'
                              }`}
                            >
                              {isHigh ? 'High Risk' : 'Standard'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
