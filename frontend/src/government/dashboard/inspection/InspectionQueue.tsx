import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, AlertOctagon, Calendar, Clock, 
  ChevronRight, X, Mail, MapPin, Factory, AlertTriangle, 
  FileText, CheckCircle, Check, Timer, Plus, ShieldCheck, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// District to Region mapping for Tamil Nadu
const districtRegionMap: Record<string, "North" | "South" | "East" | "West"> = {
  // North
  chennai: "North",
  tiruvallur: "North",
  kanchipuram: "North",
  chengalpattu: "North",
  vellore: "North",
  ranipet: "North",
  tirupathur: "North",
  tiruvannamalai: "North",
  dharmapuri: "North",
  krishnagiri: "North",
  
  // South
  madurai: "South",
  dindigul: "South",
  theni: "South",
  virudhunagar: "South",
  sivaganga: "South",
  ramanathapuram: "South",
  tirunelveli: "South",
  tenkasi: "South",
  thoothukudi: "South",
  kannyakumari: "South",
  kanyakumari: "South",

  // East
  cuddalore: "East",
  villupuram: "East",
  kallakurichi: "East",
  mayiladuthurai: "East",
  nagapattinam: "East",
  tiruvarur: "East",
  thanjavur: "East",
  pudukkottai: "East",
  ariyalur: "East",
  perambalur: "East",
  chidambaram: "East",
  trichy: "East",
  tiruchirappalli: "East",

  // West
  coimbatore: "West",
  cbe: "West",
  pattanam: "West",
  tirupur: "West",
  tiruppur: "West",
  erode: "West",
  salem: "West",
  namakkal: "West",
  nilgiris: "West",
  karur: "West",
};

export function getRegionForDistrict(district?: string): "North" | "South" | "East" | "West" {
  if (!district) return "South";
  const key = district.trim().toLowerCase();
  return districtRegionMap[key] || "West";
}

export interface ScheduledInspection {
  id: string;
  industryName: string;
  email: string;
  district: string;
  region: "North" | "South" | "East" | "West";
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: "Scheduled" | "Completed" | "Missed";
  completedAt?: string;
  reason?: string;
}

export function InspectionQueue() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [scheduledInspections, setScheduledInspections] = useState<ScheduledInspection[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<any | null>(null);
  
  // Modal / Scheduling state
  const [scheduling, setScheduling] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<any | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Filters State for Queue
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Live timer tick every second for real-time countdown calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Inspection Queue and Scheduled Inspections from Supabase Database
  const fetchInspectionQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('industry').select('*');
      if (error) {
        console.error("Error fetching industries:", error);
        setLoading(false);
        return;
      }

      // Load stored inspections from localStorage
      let localSchedules: ScheduledInspection[] = [];
      try {
        const stored = localStorage.getItem('hydronexa_scheduled_inspections');
        if (stored) {
          localSchedules = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error parsing local inspections", e);
      }

      const activeQueue: any[] = [];
      const dbSchedules: ScheduledInspection[] = [];

      (data || []).forEach((dbRow, idx) => {
        if (!dbRow.industry_name && !dbRow.email) return;

        const notices = Number(dbRow.warning_count) || 0;
        let priority = "Low";
        if (notices > 0 && notices < 4) priority = "Medium";
        if (notices >= 4 || dbRow.compliance_status === 'Critical') priority = "High";

        let reason = "Compliance Audit";
        if (Number(dbRow.current_cto_consumption) >= Number(dbRow.daily_cto_limit)) {
          reason = 'CTO Limit Exceeded';
        } else if (Number(dbRow.current_reuse_percentage) <= (Number(dbRow.daily_reuse_target) - 15)) {
          reason = 'Reuse Target Not Achieved';
        } else if (dbRow.current_workflow_stage === 'Target Missed') {
          reason = 'Zero Discharge Target Missed';
        }

        const districtName = dbRow.district || 'Coimbatore';
        const regionName = getRegionForDistrict(districtName);

        // Check if database row already carries a Scheduled / Completed / Missed workflow stage
        const stage = dbRow.current_workflow_stage || "";
        let existingStatus: "Scheduled" | "Completed" | "Missed" | "Pending" = "Pending";
        let datePart = "";
        let timePart = "10:00";

        if (stage.startsWith("Scheduled|")) {
          const parts = stage.split("|");
          existingStatus = "Scheduled";
          datePart = parts[1] || "";
          timePart = parts[2] || "10:00";
        } else if (stage === "Completed" || dbRow.compliance_status === "Completed") {
          existingStatus = "Completed";
        } else if (stage.startsWith("Missed|") || stage === "Missed") {
          existingStatus = "Missed";
          const parts = stage.split("|");
          datePart = parts[1] || "";
          timePart = parts[2] || "10:00";
        }

        // Check matching schedule from local store if not encoded in stage
        const localMatch = localSchedules.find(s => s.email === dbRow.email || s.industryName === dbRow.industry_name);
        if (localMatch) {
          datePart = localMatch.scheduledDate || datePart;
          timePart = localMatch.scheduledTime || timePart;
          if (localMatch.status === "Completed") existingStatus = "Completed";
          else if (localMatch.status === "Missed") existingStatus = "Missed";
          else if (localMatch.status === "Scheduled" && existingStatus === "Pending") existingStatus = "Scheduled";
        }

        const item = {
          id: dbRow.email || `IND-${1000 + idx}`,
          name: dbRow.industry_name || 'Industry Facility',
          district: districtName,
          region: regionName,
          address: `${districtName} Industrial Zone, Tamil Nadu`,
          email: dbRow.email || 'compliance@industry.tn.gov',
          complianceIssue: reason,
          warningsSent: notices,
          priority: priority,
          lastNoticeDate: dbRow.last_warning_date ? new Date(dbRow.last_warning_date).toLocaleDateString() : new Date().toLocaleDateString(),
          status: existingStatus,
          scheduledDate: datePart,
          scheduledTime: timePart,
          ctoConsumption: `${Number(dbRow.current_cto_consumption) || 0} L`,
          ctoLimit: `${Number(dbRow.daily_cto_limit) || 0} L`,
          reusePercent: `${Number(dbRow.current_reuse_percentage) || 0}%`,
          reuseTarget: `${Number(dbRow.daily_reuse_target) || 0}%`,
          warningHistory: [
            { date: dbRow.last_warning_date ? new Date(dbRow.last_warning_date).toLocaleDateString() : new Date().toLocaleDateString(), reason: reason }
          ]
        };

        // If it's scheduled, completed, or missed, include in scheduled inspections list
        if (datePart || existingStatus === "Completed" || existingStatus === "Scheduled" || existingStatus === "Missed") {
          dbSchedules.push({
            id: item.id,
            industryName: item.name,
            email: item.email,
            district: item.district,
            region: item.region,
            scheduledDate: datePart || new Date().toISOString().split("T")[0],
            scheduledTime: timePart || "10:00",
            status: existingStatus === "Pending" ? "Scheduled" : existingStatus,
            reason: reason,
          });
        }

        // Add to main queue (only if pending or high priority/inspection stage)
        activeQueue.push(item);
      });

      // Merge with any offline local schedules not in active DB list
      localSchedules.forEach(ls => {
        if (!dbSchedules.some(ds => ds.email === ls.email || ds.industryName === ls.industryName)) {
          dbSchedules.push(ls);
        }
      });

      setIndustries(activeQueue);
      setScheduledInspections(dbSchedules);
      localStorage.setItem('hydronexa_scheduled_inspections', JSON.stringify(dbSchedules));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectionQueue();
    
    // Realtime Postgres subscription on industry table
    const subscription = supabase
      .channel('inspection_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry' }, () => {
        fetchInspectionQueue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Check for expired scheduled inspections and automatically mark them as 'Missed'
  useEffect(() => {
    if (scheduledInspections.length === 0) return;

    let hasUpdates = false;
    const now = Date.now();

    const updated = scheduledInspections.map(item => {
      if (item.status === "Scheduled" && item.scheduledDate) {
        const schedTimeStr = item.scheduledTime || "10:00";
        const targetMs = new Date(`${item.scheduledDate}T${schedTimeStr}`).getTime();
        
        // If the date and time have passed without completion -> mark as Missed
        if (targetMs < now) {
          hasUpdates = true;
          (async () => {
            try {
              await supabase.from('industry')
                .update({ 
                  current_workflow_stage: `Missed|${item.scheduledDate}|${item.scheduledTime}`,
                  compliance_status: 'Critical'
                })
                .eq('email', item.email);
            } catch (err) {
              console.error("Error setting missed in DB:", err);
            }
          })();

          return { ...item, status: "Missed" as const };
        }
      }
      return item;
    });

    if (hasUpdates) {
      setScheduledInspections(updated);
      localStorage.setItem('hydronexa_scheduled_inspections', JSON.stringify(updated));
    }
  }, [currentTime, scheduledInspections]);

  // Open Schedule Modal for a high-priority industry
  const openScheduleModal = (ind: any) => {
    setScheduleTarget(ind);
    // Default date to tomorrow, 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
    setScheduleTime("10:00");
    setScheduling(true);
  };

  // Confirm and Save Inspection Schedule
  const handleConfirmSchedule = async () => {
    if (!scheduleTarget || !scheduleDate || !scheduleTime) return;

    const newSchedule: ScheduledInspection = {
      id: scheduleTarget.id || scheduleTarget.email,
      industryName: scheduleTarget.name,
      email: scheduleTarget.email,
      district: scheduleTarget.district,
      region: scheduleTarget.region || getRegionForDistrict(scheduleTarget.district),
      scheduledDate: scheduleDate,
      scheduledTime: scheduleTime,
      status: "Scheduled",
      reason: scheduleTarget.complianceIssue || "High Priority Physical Inspection"
    };

    // Update in Supabase database
    try {
      await supabase.from('industry').update({
        current_workflow_stage: `Scheduled|${scheduleDate}|${scheduleTime}`,
        compliance_status: 'Scheduled'
      }).eq('email', scheduleTarget.email);
    } catch (e) {
      console.error("Failed to save schedule to Supabase:", e);
    }

    // Update local state
    const existingIdx = scheduledInspections.findIndex(s => s.email === scheduleTarget.email || s.id === scheduleTarget.id);
    let updatedList: ScheduledInspection[];
    if (existingIdx >= 0) {
      updatedList = [...scheduledInspections];
      updatedList[existingIdx] = newSchedule;
    } else {
      updatedList = [newSchedule, ...scheduledInspections];
    }

    setScheduledInspections(updatedList);
    localStorage.setItem('hydronexa_scheduled_inspections', JSON.stringify(updatedList));

    // Update queue industry status
    setIndustries(prev => prev.map(ind => 
      ind.email === scheduleTarget.email 
        ? { ...ind, status: "Scheduled", scheduledDate: scheduleDate, scheduledTime: scheduleTime } 
        : ind
    ));

    setScheduling(false);
    setScheduleTarget(null);
    if (selectedIndustry && selectedIndustry.email === scheduleTarget.email) {
      setSelectedIndustry({ ...selectedIndustry, status: "Scheduled", scheduledDate: scheduleDate, scheduledTime: scheduleTime });
    }
  };

  // Complete an inspection
  const handleCompleteInspection = async (inspection: ScheduledInspection) => {
    const updatedStatus = "Completed";
    const completedAt = new Date().toISOString();

    // 1. Save completion in Supabase
    try {
      await supabase.from('industry').update({
        current_workflow_stage: 'Completed',
        compliance_status: 'Completed'
      }).eq('email', inspection.email);
    } catch (e) {
      console.error("Error updating completion in Supabase:", e);
    }

    // 2. Update scheduled inspections list
    const updated = scheduledInspections.map(item => {
      if (item.id === inspection.id || item.email === inspection.email) {
        return { ...item, status: "Completed" as const, completedAt };
      }
      return item;
    });

    setScheduledInspections(updated);
    localStorage.setItem('hydronexa_scheduled_inspections', JSON.stringify(updated));

    // 3. Update queue state
    setIndustries(prev => prev.map(ind => {
      if (ind.email === inspection.email || ind.id === inspection.id) {
        return { ...ind, status: "Completed" };
      }
      return ind;
    }));

    if (selectedIndustry && (selectedIndustry.email === inspection.email || selectedIndustry.id === inspection.id)) {
      setSelectedIndustry({ ...selectedIndustry, status: "Completed" });
    }
  };

  const closePanel = () => {
    setSelectedIndustry(null);
  };

  // Calculate live countdown for any scheduled date & time
  const getCountdown = useCallback((dateStr: string, timeStr: string, status: string) => {
    if (status === "Completed") {
      return { text: "Completed", isCompleted: true, isMissed: false };
    }
    if (status === "Missed") {
      return { text: "Time Passed (Missed)", isCompleted: false, isMissed: true };
    }
    if (!dateStr) return { text: "—", isCompleted: false, isMissed: false };

    const targetMs = new Date(`${dateStr}T${timeStr || "10:00"}`).getTime();
    const diff = targetMs - currentTime;

    if (diff <= 0) {
      return { text: "00d 00h 00m 00s", isCompleted: false, isMissed: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      text: `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
      isCompleted: false,
      isMissed: false
    };
  }, [currentTime]);

  // Region-wise Completed Inspections Calculation
  const regionCompletedCounts = useMemo(() => {
    const counts = { North: 0, South: 0, East: 0, West: 0 };
    scheduledInspections.forEach(item => {
      if (item.status === "Completed") {
        const reg = item.region || getRegionForDistrict(item.district);
        if (counts[reg] !== undefined) {
          counts[reg]++;
        }
      }
    });
    return counts;
  }, [scheduledInspections]);

  const totalCompleted = useMemo(() => {
    return regionCompletedCounts.North + regionCompletedCounts.South + regionCompletedCounts.East + regionCompletedCounts.West;
  }, [regionCompletedCounts]);

  // Filter Logic for Queue
  const filteredIndustries = useMemo(() => {
    return industries.filter(ind => {
      const matchesSearch = ind.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ind.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ind.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter ? ind.region === regionFilter : true;
      const matchesDistrict = districtFilter ? ind.district.toLowerCase() === districtFilter.toLowerCase() : true;
      const matchesPriority = priorityFilter ? ind.priority === priorityFilter : true;
      const matchesStatus = statusFilter ? ind.status === statusFilter : true;
      
      return matchesSearch && matchesRegion && matchesDistrict && matchesPriority && matchesStatus;
    });
  }, [industries, searchQuery, regionFilter, districtFilter, priorityFilter, statusFilter]);
  
  // KPI Metrics
  const totalPending = industries.filter(i => i.status === 'Pending').length;
  const highPriority = industries.filter(i => i.priority === 'High' && i.status !== 'Completed').length;
  const activeScheduled = scheduledInspections.filter(i => i.status === 'Scheduled').length;
  const totalCompletedKPI = scheduledInspections.filter(i => i.status === 'Completed').length;

  return (
    <div className="space-y-10 p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            Inspection Queue & Scheduling
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Live TN Audit
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Schedule high-priority on-site inspections, track real-time countdowns, and verify regional compliance completions.
          </p>
        </div>
        
        <button 
          onClick={fetchInspectionQueue}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh Sync
        </button>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Queue Pending</div>
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

        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Active Scheduled</div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{activeScheduled}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Total Completed</div>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalCompletedKPI}</div>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      {/* SECTION 1: SCHEDULED INSPECTIONS TABLE (Requirements 2, 3, 4) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Scheduled Inspections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live scheduled inspection audits with active countdown timer, status tracking, and completion verification.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start">
            Total Scheduled Records: {scheduledInspections.length}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Industry Name</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">District</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Scheduled Date</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Scheduled Time</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Countdown</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-center">Inspection Status</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {scheduledInspections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="h-8 w-8 text-slate-400" />
                        <p>No inspections have been scheduled yet.</p>
                        <p className="text-xs text-slate-400">Click "Schedule Inspection" on any high-priority industry in the queue below.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  scheduledInspections.map((item) => {
                    const cd = getCountdown(item.scheduledDate, item.scheduledTime, item.status);
                    return (
                      <tr 
                        key={item.id + item.scheduledDate} 
                        className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Industry Name */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.industryName}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.email}</div>
                        </td>

                        {/* District */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {item.district}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">Region: {item.region}</div>
                        </td>

                        {/* Scheduled Date */}
                        <td className="py-4 px-6">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            {item.scheduledDate}
                          </div>
                        </td>

                        {/* Scheduled Time */}
                        <td className="py-4 px-6">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            {item.scheduledTime || "10:00"}
                          </div>
                        </td>

                        {/* Countdown */}
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border ${
                            cd.isCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50' 
                              : cd.isMissed 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 animate-pulse'
                          }`}>
                            <Timer className="h-3.5 w-3.5" />
                            {cd.text}
                          </div>
                        </td>

                        {/* Inspection Status */}
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            item.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : item.status === 'Missed'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}>
                            {item.status === 'Completed' && <Check className="h-3 w-3 stroke-[3]" />}
                            {item.status === 'Missed' && <AlertTriangle className="h-3 w-3 stroke-[3]" />}
                            {item.status === 'Scheduled' && <Clock className="h-3 w-3 stroke-[3]" />}
                            {item.status}
                          </span>
                        </td>

                        {/* Complete Button */}
                        <td className="py-4 px-6 text-right">
                          {item.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                              <CheckCircle className="h-4 w-4" /> Verified ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCompleteInspection(item)}
                              title="Mark this inspection as completed"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" /> Complete ✓
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: REGION-WISE COMPLETED INSPECTIONS SUMMARY TABLE (Requirement 5) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Region-wise Completed Inspections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated completion tally across North, South, East, and West Tamil Nadu zones derived from actual inspection completions.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg">
            Total State Completions: {totalCompleted}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Region</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Representative Districts</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-center">Completed Inspections</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Completion Share</th>
                </tr>
              </thead>
              <tbody>
                {/* North */}
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">North</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    Chennai, Dharmapuri, Tiruvallur, Ranipet, Kanchipuram
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-black text-sm">
                      {regionCompletedCounts.North}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalCompleted > 0 ? `${Math.round((regionCompletedCounts.North / totalCompleted) * 100)}%` : "0%"}
                  </td>
                </tr>

                {/* South */}
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">South</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    Madurai, Kanyakumari, Tirunelveli, Thoothukudi, Dindigul
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-black text-sm">
                      {regionCompletedCounts.South}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalCompleted > 0 ? `${Math.round((regionCompletedCounts.South / totalCompleted) * 100)}%` : "0%"}
                  </td>
                </tr>

                {/* East */}
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">East</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    Ariyalur, Perambalur, Chidambaram, Cuddalore, Thanjavur
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-black text-sm">
                      {regionCompletedCounts.East}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalCompleted > 0 ? `${Math.round((regionCompletedCounts.East / totalCompleted) * 100)}%` : "0%"}
                  </td>
                </tr>

                {/* West */}
                <tr className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">West</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                    Coimbatore, Erode, Tiruppur, Salem, Namakkal
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                      {regionCompletedCounts.West}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalCompleted > 0 ? `${Math.round((regionCompletedCounts.West / totalCompleted) * 100)}%` : "0%"}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                  <td colSpan={2} className="py-4 px-6 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Total State Completed Inspections
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[36px] px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-sm shadow-sm">
                      {totalCompleted}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: PRIORITY AUDIT QUEUE & INDUSTRIES TABLE */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Factory className="h-5 w-5 text-red-600 dark:text-red-400" />
              High-Priority Inspection Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Industries with repeat warning notices, CTO excess, or critical zero-discharge deviations awaiting scheduling.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Industry or District..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500" 
              />
            </div>
            
            <select 
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>

            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
            </select>
          </div>
        </div>

        {/* Main Queue Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Industry Name</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Location</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Compliance Issue</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-center">Warnings</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Priority</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Status</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Actions</th>
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
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{ind.name}</div>
                        <div className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{ind.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-semibold flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {ind.district}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Region: {ind.region}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {ind.complianceIssue}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          ind.warningsSent >= 4 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {ind.warningsSent}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ind.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/40' :
                          ind.priority === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                        }`}>
                          {ind.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          ind.status === 'Scheduled' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                          ind.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          ind.status === 'Missed' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {ind.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openScheduleModal(ind)}
                            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                          >
                            <Calendar className="h-3.5 w-3.5" /> Schedule
                          </button>
                          <button 
                            onClick={() => setSelectedIndustry(ind)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Details <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SCHEDULE INSPECTION MODAL (Requirement 1: Select date and time) */}
      <AnimatePresence>
        {scheduling && scheduleTarget && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setScheduling(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        {scheduleTarget.priority || "High"} Priority
                      </span>
                      <span className="text-xs font-mono text-slate-500">{scheduleTarget.district}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Schedule Physical Inspection
                    </h3>
                  </div>
                  <button 
                    onClick={() => setScheduling(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Industry</div>
                    <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">{scheduleTarget.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{scheduleTarget.email}</div>
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 pt-1">
                      Reason: {scheduleTarget.complianceIssue}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-blue-500" /> Inspection Date
                      </label>
                      <input 
                        type="date" 
                        value={scheduleDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-500" /> Inspection Time
                      </label>
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <span>
                      Scheduling this inspection will activate the live countdown timer on the Government Dashboard and notify field compliance officers in the {scheduleTarget.region || "designated"} zone.
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setScheduling(false)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmSchedule}
                    disabled={!scheduleDate || !scheduleTime}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4 stroke-[3]" /> Confirm Schedule
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SLIDE-OVER SIDE DETAILS PANEL */}
      <AnimatePresence>
        {selectedIndustry && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closePanel}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }}
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
                    <span className="text-xs font-bold text-slate-500">Region: {selectedIndustry.region}</span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedIndustry.name}</h2>
                </div>
                <button 
                  onClick={closePanel} 
                  className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-6 flex-1">
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
                <button 
                  onClick={() => openScheduleModal(selectedIndustry)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" /> Schedule Inspection Date & Time
                </button>

                <button 
                  onClick={() => {
                    const match = scheduledInspections.find(s => s.email === selectedIndustry.email);
                    if (match) {
                      handleCompleteInspection(match);
                    } else {
                      handleCompleteInspection({
                        id: selectedIndustry.id,
                        industryName: selectedIndustry.name,
                        email: selectedIndustry.email,
                        district: selectedIndustry.district,
                        region: selectedIndustry.region,
                        scheduledDate: new Date().toISOString().split("T")[0],
                        scheduledTime: "10:00",
                        status: "Scheduled"
                      });
                    }
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4 stroke-[3]" /> Complete ✓
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
