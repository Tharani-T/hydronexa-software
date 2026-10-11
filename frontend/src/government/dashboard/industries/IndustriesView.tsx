import { useState, useMemo, useEffect } from "react";
import { 
  Search, X, Building, MapPin, Calendar, 
  FileText, Droplets, Brain, AlertCircle, ShieldCheck,
  Factory, Mail, Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export function IndustriesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [validityFilter, setValidityFilter] = useState("All");
  
  const [industries, setIndustries] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notice Mail States
  const [mailForm, setMailForm] = useState({ subject: '', body: '', to: '', industryName: '', status: '', reason: '' });

  const handleIssueNotice = (industry: any) => {
    let subject = '';
    let body = '';
    let reason = industry.warningReason || 'Compliance Violation';
    
    if (reason === 'CTO Limit Exceeded') {
       subject = 'Compliance Notice – CTO Limit Exceeded';
       body = `Dear Industry Management,

Our monitoring system has detected that your industry has exceeded the approved CTO water consumption limit. Please review your water usage immediately and take corrective action to comply with regulatory requirements.

Kindly submit your compliance report at the earliest.

Regards,
HydroNexa Government Monitoring Team`;
    } else if (reason === 'Reuse Target Not Achieved') {
       subject = 'Compliance Notice – Water Reuse Target Not Achieved';
       body = `Dear Industry Management,

Our monitoring system indicates that your industry has not achieved the required water reuse target. Please improve your water reuse practices to meet the prescribed compliance requirements.

Kindly take the necessary corrective actions and update your compliance status.

Regards,
HydroNexa Government Monitoring Team`;
    } else if (reason === 'CTO Expired') {
       subject = 'Compliance Notice – CTO Certificate Expired';
       body = `Dear Industry Management,

Our records indicate that your CTO certificate has expired. Please renew your CTO certificate immediately to maintain regulatory compliance.

Regards,
HydroNexa Government Monitoring Team`;
    } else {
       subject = `Compliance Notice – ${reason}`;
       body = `Dear Industry Management,\n\nOur system has detected a compliance issue: ${reason}. Please take immediate corrective action.\n\nRegards,\nHydroNexa Government Monitoring Team`;
    }

    localStorage.setItem('pendingNotice', JSON.stringify({
       industry: industry.name,
       id: industry.id,
       email: industry.email_id || '',
       subject,
       msg: body
    }));

    window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'mail' }));
  };

  const fetchIndustries = async () => {
    try {
      const { data, error } = await supabase.from('industry').select('*');
      if (error) {
        console.error("Error fetching industries:", error);
        return;
      }

      // Sort by warning_count descending to get Critical -> Warning -> Safe
      const activeData = (data || []).filter((d: any) => d.current_workflow_stage !== 'Inspection');
      const sortedData = activeData.sort((a, b) => (b.warning_count || 0) - (a.warning_count || 0));
      
      const formattedData = sortedData.map(dbRow => {
        let ctoValidity = 'Valid';
        if (dbRow.cto_valid_until) {
          const ctoEnd = new Date(dbRow.cto_valid_until);
          const now = new Date();
          if (ctoEnd < now) ctoValidity = 'Expired';
          else if (ctoEnd.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) ctoValidity = 'Expiring Soon';
        }

        let aiSummary = "Industry is stable and operating efficiently. No anomalies detected.";
        let govRecommendation = "Operating Within Limits";
        if (dbRow.compliance_status === 'Warning') {
           aiSummary = "Industry is approaching its limits or missing minor targets. Close monitoring required.";
           govRecommendation = "Monitor Closely";
        } else if (dbRow.compliance_status === 'Critical') {
           aiSummary = "Critical violation detected. Immediate action and inspection required to prevent environmental harm.";
           govRecommendation = "Inspection Recommended";
        }

        let warningReason = '-';
        if (dbRow.compliance_status === 'Critical') {
          if (Number(dbRow.current_cto_consumption) >= Number(dbRow.daily_cto_limit)) warningReason = 'CTO Limit Exceeded';
          else if (Number(dbRow.current_reuse_percentage) <= (Number(dbRow.daily_reuse_target) - 15)) warningReason = 'Reuse Target Not Achieved';
          else if (dbRow.water_quality_abnormal) warningReason = 'Abnormal Water Quality';
          else warningReason = 'CTO Expired';
        } else if (dbRow.compliance_status === 'Warning') {
          if (Number(dbRow.current_cto_consumption) >= (Number(dbRow.daily_cto_limit) * 0.85)) warningReason = 'Approaching CTO Limit';
          else if (Number(dbRow.current_reuse_percentage) < Number(dbRow.daily_reuse_target)) warningReason = 'Slightly Below Target';
          else warningReason = 'CTO Expiring Soon';
        }

        return {
          id: dbRow.user_id || crypto.randomUUID(),
          name: dbRow.industry_name || 'Unknown Industry',
          email_id: dbRow.email || 'N/A',
          district: dbRow.district || 'Unknown',
          ctoConsumption: Number(dbRow.current_cto_consumption) || 0,
          ctoLimit: Number(dbRow.daily_cto_limit) || 0,
          reusePercent: Number(dbRow.current_reuse_percentage) || 0,
          reuseTarget: Number(dbRow.daily_reuse_target) || 0,
          status: dbRow.compliance_status || 'Safe',
          warningReason,
          ctoValidity: ctoValidity,
          lastUpdated: new Date(dbRow.last_warning_date || new Date()).toLocaleString(),
          
          address: `${dbRow.district || 'Industrial'} Sector, Tamil Nadu`,
          type: "Manufacturing",
          ctoNumber: `CTO-${(dbRow.user_id || 'XXXX').toString().substring(0, 8).toUpperCase()}`,
          ctoValidUntil: dbRow.cto_valid_until ? new Date(dbRow.cto_valid_until).toLocaleDateString() : 'N/A',
          dailyFreshUsage: Number(dbRow.current_cto_consumption || 0).toFixed(1),
          dailyReusedWater: (Number(dbRow.current_cto_consumption || 0) * (Number(dbRow.current_reuse_percentage || 0) / 100)).toFixed(1),
          monthlyFreshUsage: Number(dbRow.monthly_cto_limit || 0).toFixed(1),
          monthlyReusedWater: Number(dbRow.monthly_reuse_target || 0).toFixed(1),
          lastInspection: new Date().toLocaleDateString(),
          aiSummary,
          govRecommendation,
          warningCount: Number(dbRow.warning_count) || 0
        };
      });

      setIndustries(formattedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();

    // Subscribe to realtime changes on the industry table
    const subscription = supabase
      .channel('industry_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry' }, (payload) => {
        // We can just refetch all to ensure consistency, 
        // especially useful to compute all derived fields easily.
        fetchIndustries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredData = useMemo(() => {
    return industries.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.ctoNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchDistrict = districtFilter === "All" || item.district === districtFilter;
      const matchValidity = validityFilter === "All" || item.ctoValidity === validityFilter;
      return matchSearch && matchStatus && matchDistrict && matchValidity;
    });
  }, [searchTerm, statusFilter, districtFilter, validityFilter, industries]);

  const openDrawer = (industry: any) => {
    setSelectedIndustry(industry);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedIndustry(null), 300); // Allow animation to finish
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'Safe') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">🟢 Safe</span>;
    if (status === 'Warning') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">🟠 Warning</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">🔴 Critical</span>;
  };

  const renderValidityBadge = (validity: string) => {
    if (validity === 'Valid') return <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">✅ Valid</span>;
    if (validity === 'Expiring Soon') return <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-sm">⚠️ Expiring Soon</span>;
    return <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-sm">❌ Expired</span>;
  };

  const renderRecommendation = (rec: string) => {
    if (rec === 'Operating Within Limits') return <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-md border border-emerald-100 dark:border-emerald-500/20 w-full"><ShieldCheck className="w-5 h-5"/> ✅ Operating Within Limits</span>;
    if (rec === 'Monitor Closely') return <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-md border border-amber-100 dark:border-amber-500/20 w-full"><AlertCircle className="w-5 h-5"/> ⚠️ Monitor Closely</span>;
    return <span className="inline-flex items-center gap-2 text-red-700 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-md border border-red-100 dark:border-red-500/20 w-full"><AlertCircle className="w-5 h-5"/> 🚨 Inspection Recommended</span>;
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 flex flex-col h-[calc(100vh-80px)] overflow-hidden relative">
      
      {/* Top Control Bar */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-6 shadow-sm shrink-0 flex flex-col md:flex-row gap-4 items-end md:items-center">
        
        <div className="w-full md:w-1/3 relative">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Search Industry</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or CTO..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-1/5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Filter by Status</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Safe">Safe</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="w-full md:w-1/5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Filter by District</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
          >
            <option value="All">All Districts</option>
            {Array.from(new Set(industries.map(i => i.district).filter(Boolean))).sort().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">CTO Validity</label>
          <select 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={validityFilter}
            onChange={e => setValidityFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col relative">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Industry Name</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">District</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">CTO Consumption</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">CTO Limit</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Water Reuse %</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Water Reuse Target</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">CTO Valid Until</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap text-center">Compliance Status</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap">Registered Email ID</th>
                <th className="px-5 py-4 font-semibold whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="font-semibold text-lg">Loading Live Data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-500">
                    <Factory className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-lg">No industries found</p>
                    <p className="text-sm">Waiting for data or try adjusting your search/filters.</p>
                  </td>
                </tr>
              ) : filteredData.map((ind) => (
                <tr key={ind.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">{ind.name}</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{ind.district}</td>
                  <td className="px-5 py-4">
                    <span className={`font-semibold ${ind.ctoConsumption > 80 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {ind.ctoConsumption}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{ind.ctoLimit} ML</td>
                  <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">{ind.reusePercent}%</td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{ind.reuseTarget}%</td>
                  <td className="px-5 py-4">{renderValidityBadge(ind.ctoValidity)}</td>
                  <td className="px-5 py-4 text-center">{renderStatusBadge(ind.status)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{ind.email_id}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <button 
                        onClick={() => openDrawer(ind)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold text-xs border border-blue-200 dark:border-blue-800/50 px-3 py-2 rounded transition-colors whitespace-nowrap"
                      >
                        View Details
                      </button>
                      {ind.status === 'Critical' && (
                        <button 
                          onClick={() => handleIssueNotice(ind)}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-2 rounded shadow-sm transition-colors whitespace-nowrap w-full"
                        >
                          Issue Official Notice
                        </button>
                      )}
                      {ind.status === 'Warning' && (
                        <button 
                          onClick={() => handleIssueNotice(ind)}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-2 rounded shadow-sm transition-colors whitespace-nowrap w-full"
                        >
                          Inspect Official Notice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel (Drawer) Overlay */}
      {isDrawerOpen && (
        <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/40 z-20 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />
      )}

      {/* Side Panel (Drawer) Content */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1E293B] shadow-2xl z-30 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-700 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedIndustry && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedIndustry.name}</h2>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {selectedIndustry.district}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {selectedIndustry.email_id}</p>
              </div>
              <button onClick={closeDrawer} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Industry Profile</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Industry Type</p>
                    <p className="font-semibold">{selectedIndustry.type}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">CTO Number</p>
                    <p className="font-semibold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-500" /> {selectedIndustry.ctoNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Address</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedIndustry.address}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">CTO Valid Until</p>
                    <p className="font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {selectedIndustry.ctoValidUntil}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Last Inspection</p>
                    <p className="font-semibold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> {selectedIndustry.lastInspection}</p>
                  </div>
                </div>
              </div>

              {/* Consumption Metrics */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> Water Metrics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded border border-slate-100 dark:border-slate-600">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Daily Fresh</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedIndustry.dailyFreshUsage} ML</p>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded border border-slate-100 dark:border-slate-600">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Daily Reused</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedIndustry.dailyReusedWater} ML</p>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded border border-slate-100 dark:border-slate-600">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Monthly Fresh</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedIndustry.monthlyFreshUsage} ML</p>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded border border-slate-100 dark:border-slate-600">
                    <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Monthly Reused</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{selectedIndustry.monthlyReusedWater} ML</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Reuse Target</p>
                    <p className="font-bold">{selectedIndustry.reuseTarget}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Current Reuse</p>
                    <p className={`font-bold text-lg ${selectedIndustry.reusePercent < selectedIndustry.reuseTarget ? 'text-red-500' : 'text-emerald-500'}`}>
                      {selectedIndustry.reusePercent}%
                    </p>
                  </div>
                </div>
              </div>

              {/* AI & Recommendations */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Brain className="w-4 h-4" /> Compliance Summary</h3>
                  <p className="text-sm text-blue-900 dark:text-blue-200 font-medium leading-relaxed">{selectedIndustry.aiSummary}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Government Recommendation</h3>
                  {renderRecommendation(selectedIndustry.govRecommendation)}
                </div>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
               <button className="flex-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-2.5 rounded transition-colors text-sm">Download Full Report</button>
               {selectedIndustry.status === 'Critical' && (
                 <button onClick={() => handleIssueNotice(selectedIndustry)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm">Issue Official Notice</button>
               )}
               {selectedIndustry.status === 'Warning' && (
                 <button onClick={() => handleIssueNotice(selectedIndustry)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded transition-colors text-sm shadow-sm">Inspect Official Notice</button>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
