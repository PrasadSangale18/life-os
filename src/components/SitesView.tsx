import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  ArrowUpDown, 
  FileText,
  X,
  Filter,
  ShieldCheck,
  MapPin
} from 'lucide-react';

export interface SiteAsset {
  id: string;
  rank: string;
  name: string;
  installationType: string;
  totalReports: number;
  sifPrecursors: number;
  sifDensity: number; // percentage
  trend: number; // +4.2 or -1.8
  status?: 'active' | 'maintenance' | 'review';
  location?: string;
  incidentFreeDays?: number;
}

const INITIAL_SITES: SiteAsset[] = [
  {
    id: 'site-1',
    rank: '01',
    name: 'Duliajan Central Processing Facility',
    installationType: 'Central Gathering & Gas Compression',
    totalReports: 324,
    sifPrecursors: 92,
    sifDensity: 28.4,
    trend: 4.2,
    status: 'active',
    location: 'Assam, India',
    incidentFreeDays: 142
  },
  {
    id: 'site-2',
    rank: '02',
    name: 'Digboi Field & Refinery Complex',
    installationType: 'Refinery & Distillation Units',
    totalReports: 281,
    sifPrecursors: 67,
    sifDensity: 23.8,
    trend: 2.1,
    status: 'active',
    location: 'Tinsukia, Assam',
    incidentFreeDays: 210
  },
  {
    id: 'site-3',
    rank: '03',
    name: 'Moran High-Pressure Basin',
    installationType: 'High-Pressure Gas Injection & Wellheads',
    totalReports: 412,
    sifPrecursors: 71,
    sifDensity: 17.2,
    trend: -1.8,
    status: 'active',
    location: 'Dibrugarh, Assam',
    incidentFreeDays: 365
  },
  {
    id: 'site-4',
    rank: '04',
    name: 'Naharkatiya Production Station',
    installationType: 'Oil Gathering & Water Injection',
    totalReports: 215,
    sifPrecursors: 39,
    sifDensity: 18.1,
    trend: 0.5,
    status: 'active',
    location: 'Dibrugarh, Assam',
    incidentFreeDays: 189
  },
  {
    id: 'site-5',
    rank: '05',
    name: 'Jorhat Crude Delivery Terminal',
    installationType: 'Crude Storage & Pipeline Dispatch',
    totalReports: 168,
    sifPrecursors: 22,
    sifDensity: 13.1,
    trend: -3.4,
    status: 'active',
    location: 'Jorhat, Assam',
    incidentFreeDays: 520
  },
  {
    id: 'site-6',
    rank: '06',
    name: 'Bagjan Deep Drilling Rig',
    installationType: 'Exploratory Deep Drilling Rig',
    totalReports: 194,
    sifPrecursors: 49,
    sifDensity: 25.3,
    trend: 5.7,
    status: 'maintenance',
    location: 'Tinsukia, Assam',
    incidentFreeDays: 98
  },
  {
    id: 'site-7',
    rank: '07',
    name: 'Kumchai Crude Gathering Station',
    installationType: 'Remote Mountain Gathering Complex',
    totalReports: 142,
    sifPrecursors: 24,
    sifDensity: 16.9,
    trend: -0.9,
    status: 'active',
    location: 'Changlang, Arunachal Pradesh',
    incidentFreeDays: 410
  },
  {
    id: 'site-8',
    rank: '08',
    name: 'Kusijan Early Production System',
    installationType: 'Temporary Skid Separator & Flare',
    totalReports: 120,
    sifPrecursors: 19,
    sifDensity: 15.8,
    trend: 1.2,
    status: 'active',
    location: 'Tinsukia, Assam',
    incidentFreeDays: 275
  }
];

export const SitesView: React.FC = () => {
  const [sites, setSites] = useState<SiteAsset[]>(INITIAL_SITES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<SiteAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<keyof SiteAsset>('sifDensity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // New site form state
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState('');
  const [newSiteReports, setNewSiteReports] = useState(100);
  const [newSitePrecursors, setNewSitePrecursors] = useState(20);
  const [newSiteLocation, setNewSiteLocation] = useState('Assam, India');

  const filteredSites = useMemo(() => {
    return sites
      .filter(site => 
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.installationType.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? (valA as string).localeCompare(valB as string) 
            : (valB as string).localeCompare(valA as string);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [sites, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: keyof SiteAsset) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    const density = Math.round((newSitePrecursors / Math.max(newSiteReports, 1)) * 1000) / 10;
    const newSite: SiteAsset = {
      id: `site-${Date.now()}`,
      rank: String(sites.length + 1).padStart(2, '0'),
      name: newSiteName.trim(),
      installationType: newSiteType.trim() || 'General Production Facility',
      totalReports: Number(newSiteReports),
      sifPrecursors: Number(newSitePrecursors),
      sifDensity: density,
      trend: 0.0,
      status: 'active',
      location: newSiteLocation.trim(),
      incidentFreeDays: 1
    };

    setSites(prev => [newSite, ...prev]);
    setShowAddModal(false);
    setNewSiteName('');
    setNewSiteType('');
  };

  // Color helper for SIF Density progress bars matching PRAHARI
  const getDensityColor = (density: number) => {
    if (density >= 22) return { bg: 'bg-[#EF4444]', track: 'bg-rose-100', text: 'text-rose-600' }; // Red
    if (density >= 15) return { bg: 'bg-[#F59E0B]', track: 'bg-amber-100', text: 'text-amber-600' }; // Orange / Amber
    return { bg: 'bg-[#10B981]', track: 'bg-emerald-100', text: 'text-emerald-600' }; // Green
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Section matching Prahari */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">
          Sites
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          Facility-level safety profiles. Benchmark SIF density, track incident-free days, and monitor localized hazard trends across all operating assets.
        </p>
      </div>

      {/* 2. Main Elevated Hero Card (Signature Prahari Card) */}
      <div className="bg-white dark:bg-[#131924] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
        
        {/* Card Header */}
        <div className="p-6 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              OPERATIONAL ASSET SIF DENSITY RANKINGS
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              Ranked by % of reported safety incidents containing serious injury/fatality precursors
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
              {sites.length} Active Installations
            </span>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#FF5A1F] hover:bg-[#E04F16] text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-[0_2px_12px_rgba(255,90,31,0.25)] flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add New Site</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by facility name or installation type..."
              className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-[#FF5A1F] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={13} />
            <span className="hidden sm:inline">Sorted by:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
              {sortBy === 'sifDensity' ? 'SIF Density' : String(sortBy)} ({sortOrder})
            </span>
          </div>
        </div>

        {/* Data Table matching Prahari */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('rank')}>
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Operating Asset</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6">
                  <span>Installation Type</span>
                </th>
                <th className="py-3.5 px-6 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('totalReports')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Total Reports</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('sifPrecursors')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>SIF Precursors</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('sifDensity')}>
                  <div className="flex items-center gap-1">
                    <span>SIF Density</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6 text-center cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('trend')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Trend</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3.5 px-6 text-right">
                  <span>Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs text-slate-700 dark:text-slate-300">
              {filteredSites.map((site) => {
                const color = getDensityColor(site.sifDensity);
                const isPositiveTrend = site.trend > 0;
                const isNegativeTrend = site.trend < 0;

                return (
                  <tr 
                    key={site.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {site.rank}
                    </td>

                    {/* Operating Asset with Orange Document Icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200/80 dark:border-orange-500/20 flex items-center justify-center text-[#FF5A1F] shrink-0">
                          <FileText size={14} strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white leading-snug">
                            {site.name}
                          </span>
                          {site.location && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />
                              {site.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Installation Type */}
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs">
                      {site.installationType}
                    </td>

                    {/* Total Reports */}
                    <td className="py-4 px-6 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {site.totalReports}
                    </td>

                    {/* SIF Precursors (Highlighted in Red) */}
                    <td className="py-4 px-6 text-center font-mono font-bold text-[#EF4444]">
                      {site.sifPrecursors}
                    </td>

                    {/* SIF Density with Progress Bar Pill */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full ${color.bg}`}
                            style={{ width: `${Math.min(site.sifDensity * 2.5, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {site.sifDensity}%
                        </span>
                      </div>
                    </td>

                    {/* Trend Indicator */}
                    <td className="py-4 px-6 text-center">
                      <span 
                        className={`font-mono font-semibold ${
                          isPositiveTrend 
                            ? 'text-[#EF4444]' 
                            : isNegativeTrend 
                            ? 'text-[#10B981]' 
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositiveTrend ? `+${site.trend}%` : `${site.trend}%`}
                      </span>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedSite(site)}
                        className="border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1A2230] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#FF5A1F] flex items-center justify-center">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedSite.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedSite.installationType}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSite(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">SIF Density</span>
                <div className="text-xl font-bold font-mono text-[#EF4444] mt-0.5">{selectedSite.sifDensity}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Precursors</span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-0.5">{selectedSite.sifPrecursors} / {selectedSite.totalReports}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Incident-Free Days</span>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{selectedSite.incidentFreeDays} days</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Trend Rate</span>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-0.5">
                  {selectedSite.trend > 0 ? `+${selectedSite.trend}%` : `${selectedSite.trend}%`}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 border border-orange-200/60 dark:border-orange-500/20 text-xs text-slate-700 dark:text-slate-300">
              <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-[#FF5A1F]">
                <ShieldCheck size={14} />
                <span>Localized HSE Mitigation Status</span>
              </div>
              Facility adheres to standard operating safety protocol. High-pressure sensors calibrated within benchmark parameters.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSite(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Generating comprehensive HSE report for ${selectedSite.name}...`);
                  setSelectedSite(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FF5A1F] hover:bg-[#E04F16] text-white shadow-sm transition-colors"
              >
                Download Safety Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <form 
            onSubmit={handleAddSite}
            className="bg-white dark:bg-[#131924] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Operating Installation
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Facility / Asset Name</label>
              <input
                type="text"
                required
                value={newSiteName}
                onChange={e => setNewSiteName(e.target.value)}
                placeholder="e.g. Moran Oil Field Rig 4"
                className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Installation Type</label>
              <input
                type="text"
                required
                value={newSiteType}
                onChange={e => setNewSiteType(e.target.value)}
                placeholder="e.g. Gas Injection & Separator"
                className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Field</label>
              <input
                type="text"
                required
                value={newSiteLocation}
                onChange={e => setNewSiteLocation(e.target.value)}
                placeholder="e.g. Tinsukia, Assam"
                className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF5A1F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Reports</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newSiteReports}
                  onChange={e => setNewSiteReports(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF5A1F]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SIF Precursors</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newSitePrecursors}
                  onChange={e => setNewSitePrecursors(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#FF5A1F]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FF5A1F] hover:bg-[#E04F16] text-white shadow-sm"
              >
                Create Installation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
