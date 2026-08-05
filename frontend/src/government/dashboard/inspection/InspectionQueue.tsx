import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, AlertOctagon, Calendar, Clock, 
  ChevronRight, X, Mail, MapPin, Factory, AlertTriangle, FileText, CheckCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Initial Mock Data (used if localStorage is empty)
const mockIndustries = [
  {
    id: "IND-001",
    name: "ABC Dyeing Unit",
    district: "Tirupur",
    region: "West",
    address: "123 SIPCOT Industrial Estate, Tirupur, TN",
    email: "compliance@abcdyeing.com",
    complianceIssue: "CTO Limit Exceeded",
    warningsSent: 3,
    priority: "High",
    lastNoticeDate: "2026-08-01",
    status: "Pending",
    ctoConsumption: "1250 L",
    ctoLimit: "1000 L",
    reusePercent: "45%",
    reuseTarget: "60%",
    warningHistory: [
      { date: "2026-07-15", reason: "CTO Warning" },
      { date: "2026-07-25", reason: "CTO Limit Exceeded" },
      { date: "2026-08-01", reason: "Final Warning - Critical" }
    ]
  },
  {
    id: "IND-002",
    name: "GreenTech Papers",
    district: "Erode",
    region: "West",
    address: "45 River View Road, Erode, TN",
    email: "admin@greentechpapers.in",
    complianceIssue: "Reuse Target Not Achieved",
    warningsSent: 2,
    priority: "Medium",
    lastNoticeDate: "2026-07-28",
    status: "Scheduled",
    ctoConsumption: "800 L",
    ctoLimit: "1000 L",
    reusePercent: "30%",
    reuseTarget: "50%",
    warningHistory: [
      { date: "2026-07-10", reason: "Below Reuse Target" },
      { date: "2026-07-28", reason: "Reuse Target Not Achieved" }
    ]
  },
  {
    id: "IND-003",
    name: "ChemCo Industries",
    district: "Coimbatore",
    region: "West",
    address: "Plot 88, KINFRA Park, Coimbatore, TN",
    email: "safety@chemco.co.in",
    complianceIssue: "Abnormal Water Quality",
    warningsSent: 4,
    priority: "High",
    lastNoticeDate: "2026-08-02",
    status: "Pending",
    ctoConsumption: "550 L",
    ctoLimit: "600 L",
    reusePercent: "65%",
    reuseTarget: "60%",
    warningHistory: [
      { date: "2026-06-15", reason: "pH Level Deviation" },
      { date: "2026-07-02", reason: "Temperature Deviation" },
      { date: "2026-07-20", reason: "TDS Above Limits" },
      { date: "2026-08-02", reason: "Critical Quality Breach" }
    ]
  }
];

export function InspectionQueue() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<any | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInspectionQueue = async () => {
    try {
      const { data, error } = await supabase.from('industry').select('*').eq('current_workflow_stage', 'Inspection');
      if (error) {
        console.error("Error fetching inspection queue:", error);
        return;
      }
      
      const formattedData = (data || []).map(dbRow => {
        let priority = "Low";
        const notices = Number(dbRow.warning_count) || 0;
        if (notices > 0 && notices < 3) priority = "Medium";
        if (notices >= 4) priority = "High";
        
        let reason = "Compliance Audit";
        if (Number(dbRow.current_cto_consumption) >= Number(dbRow.daily_cto_limit)) reason = 'CTO Limit Exceeded';
        else if (Number(dbRow.current_reuse_percentage) <= (Number(dbRow.daily_reuse_target) - 15)) reason = 'Reuse Target Not Achieved';
        
        return {
          id: dbRow.user_id || `IND-${Math.floor(1000 + Math.random() * 9000)}`,
          name: dbRow.industry_name || 'Unknown Industry',
          district: dbRow.district || 'Unknown',
          region: "South", // Default or derived
          address: `${dbRow.district || 'Industrial'} Sector, Tamil Nadu`,
          email: dbRow.email || 'N/A',
          complianceIssue: reason,
          warningsSent: notices,
          priority: priority,
          lastNoticeDate: dbRow.last_warning_date ? new Date(dbRow.last_warning_date).toLocaleDateString() : new Date().toLocaleDateString(),
          status: "Pending", // Assuming all new in queue are Pending
          ctoConsumption: `${Number(dbRow.current_cto_consumption) || 0} L`,
          ctoLimit: `${Number(dbRow.daily_cto_limit) || 0} L`,
          reusePercent: `${Number(dbRow.current_reuse_percentage) || 0}%`,
          reuseTarget: `${Number(dbRow.daily_reuse_target) || 0}%`,
          warningHistory: [
            { date: dbRow.last_warning_date ? new Date(dbRow.last_warning_date).toLocaleDateString() : new Date().toLocaleDateString(), reason: reason }
          ]
        };
      });
      setIndustries(formattedData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInspectionQueue();
    
    const subscription = supabase
      .channel('inspection_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry', filter: "current_workflow_stage=eq.Inspection" }, (payload) => {
        fetchInspectionQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleMarkCompleted = async () => {
    if (!selectedIndustry) return;
    try {
      await supabase.from('industry').update({ current_workflow_stage: 'Normal' }).eq('user_id', selectedIndustry.id);
      const updated = industries.filter(ind => ind.id !== selectedIndustry.id);
      setIndustries(updated);
      closePanel();
    } catch (e) {
      console.error("Error marking complete:", e);
    }
  };

  const handleSchedule = async () => {
    if (!selectedIndustry || !scheduleDate) return;
    // For now we just update local state since there is no 'scheduled_date' column,
    // but a fully persistent app would add a column to Supabase.
    const updated = industries.map(ind => {
      if (ind.id === selectedIndustry.id) {
        return { ...ind, status: 'Scheduled', scheduledDate: scheduleDate };
      }
      return ind;
    });
    setIndustries(updated);
    setScheduling(false);
    setScheduleDate("");
    setSelectedIndustry({ ...selectedIndustry, status: 'Scheduled', scheduledDate: scheduleDate });
  };

  const closePanel = () => {
    setSelectedIndustry(null);
    setScheduling(false);
    setScheduleDate("");
  };

  // Filter Logic
  const filteredIndustries = useMemo(() => {
    return industries.filter(ind => {
      const matchesSearch = ind.name.toLowerCase().includes(searchQuery.toLowerCase()) || ind.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter ? ind.region === regionFilter : true;
      const matchesDistrict = districtFilter ? ind.district === districtFilter : true;
      const matchesPriority = priorityFilter ? ind.priority === priorityFilter : true;
      const matchesStatus = statusFilter ? ind.status === statusFilter : true;
      
      return matchesSearch && matchesRegion && matchesDistrict && matchesPriority && matchesStatus;
    });
  }, [industries, searchQuery, regionFilter, districtFilter, priorityFilter, statusFilter]);
  
  // KPI Metrics (Calculated from all industries, or filtered? Usually all active queue items)
  const totalPending = industries.filter(i => i.status === 'Pending').length;
  const highPriority = industries.filter(i => i.priority === 'High').length;
  const mediumPriority = industries.filter(i => i.priority === 'Medium').length;
  const scheduledToday = industries.filter(i => i.status === 'Scheduled').length;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Inspection Queue</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Identify and manage industries requiring physical inspection.</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Pending</div>
            <div className="text-3xl font-black">{totalPending}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Clock className="h-6 w-6 text-slate-600 dark:text-slate-300" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">High Priority</div>
            <div className="text-3xl font-black text-red-700 dark:text-red-300">{highPriority}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertOctagon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-900/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Medium Priority</div>
            <div className="text-3xl font-black text-orange-700 dark:text-orange-300">{mediumPriority}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Scheduled Today</div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{scheduledToday}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Industry..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" 
            />
          </div>
          <select 
            value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All Regions</option>
            <option value="West">West</option>
            <option value="East">East</option>
          </select>
          <select 
            value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All Districts</option>
            <option value="Tirupur">Tirupur</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Erode">Erode</option>
            <option value="Unknown">Unknown</option>
          </select>
          <select 
            value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select 
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Status</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Industry Name</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Location</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Compliance Issue</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-center">Warnings</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Priority</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Status</th>
                <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndustries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No industries match the current filters.
                  </td>
                </tr>
              ) : (
                filteredIndustries.map((ind) => (
                  <tr key={ind.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm">{ind.name}</div>
                      <div className="text-xs text-slate-500">{ind.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium">{ind.district}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{ind.address}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">{ind.complianceIssue}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {ind.warningsSent}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ind.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        ind.priority === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {ind.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-bold ${
                        ind.status === 'Pending' ? 'text-slate-500' : 'text-blue-500'
                      }`}>
                        {ind.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setSelectedIndustry(ind)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Side Panel */}
      <AnimatePresence>
        {selectedIndustry && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePanel}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-black ${
                      selectedIndustry.priority === 'High' ? 'bg-red-600 text-white' : 
                      selectedIndustry.priority === 'Medium' ? 'bg-orange-500 text-white' : 
                      'bg-emerald-500 text-white'
                    }`}>
                      {selectedIndustry.priority} Priority
                    </span>
                    <span className="text-xs font-bold text-slate-500">{selectedIndustry.id}</span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedIndustry.name}</h2>
                </div>
                <button onClick={closePanel} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-8 flex-1">
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-5 w-5 shrink-0 text-slate-400" />
                    <span>{selectedIndustry.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="h-5 w-5 shrink-0 text-slate-400" />
                    <span>{selectedIndustry.email}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CTO Consumed</div>
                    <div className="text-lg font-black text-blue-600">{selectedIndustry.ctoConsumption} <span className="text-xs text-slate-500 font-medium">/ {selectedIndustry.ctoLimit}</span></div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reuse %</div>
                    <div className="text-lg font-black text-emerald-600">{selectedIndustry.reusePercent} <span className="text-xs text-slate-500 font-medium">/ {selectedIndustry.reuseTarget}</span></div>
                  </div>
                </div>

                {/* Inspection Reason */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Reason for Inspection
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-800 dark:text-red-300 text-sm font-medium">
                    {selectedIndustry.complianceIssue}
                  </div>
                </div>

                {/* Warning History */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <Factory className="h-4 w-4 text-slate-400" /> Warning History
                  </h3>
                  <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                    {selectedIndustry.warningHistory?.map((w: any, idx: number) => (
                      <div key={idx} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 w-6 h-6 bg-white dark:bg-slate-900 rounded-full border-4 border-slate-200 dark:border-slate-700" />
                        <div className="text-sm font-bold">{w.reason}</div>
                        <div className="text-xs text-slate-500 font-medium">{w.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                
                {scheduling ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Inspection Date</label>
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => setScheduling(false)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSchedule}
                        disabled={!scheduleDate}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : selectedIndustry.status === 'Scheduled' ? (
                  <div className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" /> Scheduled for {selectedIndustry.scheduledDate}
                  </div>
                ) : (
                  <button 
                    onClick={() => setScheduling(true)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" /> Schedule Inspection
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleMarkCompleted}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" /> Mark Completed
                  </button>
                  <button className="w-full py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4" /> Report
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
