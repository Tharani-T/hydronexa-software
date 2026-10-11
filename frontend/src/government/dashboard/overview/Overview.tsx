import { useEffect, useState, useMemo } from "react";
import { 
  Factory, Activity, ShieldCheck, AlertTriangle, 
  ChevronRight, FileText, Download, Send, Clock, 
  Droplets, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TamilNaduComplianceMap } from "./TamilNaduComplianceMap";

export function Overview() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mapIndustries, setMapIndustries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'industry');
        if (!error && data && data.length > 0) {
           setIndustries(data);
        } else {
           // Fallback Mock Data
           setIndustries([
             { id: 1, name: "ABC Dyeing", sector: "Textile", ctoUsage: 92, reuse: 45, status: "Critical", lastUpdated: "2 mins ago" },
             { id: 2, name: "XYZ Mills", sector: "Paper", ctoUsage: 65, reuse: 30, status: "Warning", lastUpdated: "15 mins ago" },
             { id: 3, name: "Global Pharma", sector: "Pharmaceutical", ctoUsage: 45, reuse: 85, status: "Safe", lastUpdated: "1 hour ago" },
             { id: 4, name: "SteelTech Ind", sector: "Steel", ctoUsage: 78, reuse: 60, status: "Warning", lastUpdated: "2 hours ago" },
             { id: 5, name: "EcoFoods Ltd", sector: "Food Processing", ctoUsage: 35, reuse: 90, status: "Safe", lastUpdated: "3 hours ago" },
           ]);
        }
      } catch (e) {
           setIndustries([
             { id: 1, name: "ABC Dyeing", sector: "Textile", ctoUsage: 92, reuse: 45, status: "Critical", lastUpdated: "2 mins ago" },
             { id: 2, name: "XYZ Mills", sector: "Paper", ctoUsage: 65, reuse: 30, status: "Warning", lastUpdated: "15 mins ago" },
             { id: 3, name: "Global Pharma", sector: "Pharmaceutical", ctoUsage: 45, reuse: 85, status: "Safe", lastUpdated: "1 hour ago" },
             { id: 4, name: "SteelTech Ind", sector: "Steel", ctoUsage: 78, reuse: 60, status: "Warning", lastUpdated: "2 hours ago" },
             { id: 5, name: "EcoFoods Ltd", sector: "Food Processing", ctoUsage: 35, reuse: 90, status: "Safe", lastUpdated: "3 hours ago" },
           ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const fetchMapData = async () => {
      try {
        const { data, error } = await supabase.from('industry').select('*');
        if (!error && data) {
          setMapIndustries(data);
        }
      } catch(e) {}
    };
    fetchMapData();

    const subscription = supabase.channel('industry_map_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry' }, () => {
         fetchMapData();
      }).subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const totalRegistered = mapIndustries.length > 0 ? mapIndustries.length : industries.length;
  const inspectionRequired = mapIndustries.filter(i => i.current_workflow_stage === 'Inspection').length;
  const activeMonitoring = Math.max(0, totalRegistered - inspectionRequired);
  
  const safeCount = mapIndustries.filter(i => (i.compliance_status || 'Safe') === 'Safe').length;
  const warningCount = mapIndustries.filter(i => i.compliance_status === 'Warning').length;
  const criticalCount = mapIndustries.filter(i => i.compliance_status === 'Critical').length;
  
  const compliancePct = totalRegistered > 0 ? Math.round((safeCount / totalRegistered) * 100) : 85;

  const kpis = [
    { label: "Registered Industries", value: totalRegistered.toString(), icon: Factory, color: "text-blue-600 dark:text-blue-400" },
    { label: "Active Monitoring", value: activeMonitoring.toString(), icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Within Compliance", value: `${compliancePct}%`, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Inspection Required", value: inspectionRequired.toString(), icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
  ];

  const sectorData = useMemo(() => {
    if (mapIndustries.length === 0) {
      return [
        { name: "Textile", fresh: 80, reused: 50 },
        { name: "Paper", fresh: 60, reused: 70 },
        { name: "Steel", fresh: 100, reused: 40 },
        { name: "Food", fresh: 40, reused: 60 },
        { name: "Pharma", fresh: 30, reused: 80 },
      ];
    }
    const grouped: Record<string, { fresh: number, reusePct: number, count: number }> = {};
    mapIndustries.forEach(ind => {
      const key = ind.sector || ind.district || 'General';
      if (!grouped[key]) grouped[key] = { fresh: 0, reusePct: 0, count: 0 };
      grouped[key].fresh += Number(ind.current_cto_consumption || 0);
      grouped[key].reusePct += Number(ind.current_reuse_percentage || 0);
      grouped[key].count++;
    });
    const list = Object.keys(grouped).map(k => ({
      name: k.length > 9 ? k.substring(0, 9) : k,
      fresh: Math.min(100, Math.max(20, Math.round(grouped[k].fresh / (grouped[k].count * 80)))),
      reused: Math.min(100, Math.max(15, Math.round(grouped[k].reusePct / grouped[k].count)))
    })).slice(0, 5);
    return list.length >= 3 ? list : [
      { name: "Textile", fresh: 80, reused: 50 },
      { name: "Paper", fresh: 60, reused: 70 },
      { name: "Steel", fresh: 100, reused: 40 },
      { name: "Food", fresh: 40, reused: 60 },
      { name: "Pharma", fresh: 30, reused: 80 },
    ];
  }, [mapIndustries]);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 space-y-6">
      
      {/* SECTION 1 – Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </div>
            <div className={`p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 2 – Compliance Overview */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h3 className="text-base font-semibold mb-6 w-full flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> Compliance Overview</h3>
          <div className="relative flex justify-center items-center h-48 w-full">
            <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="20" className="dark:stroke-slate-700" />
              {/* Safe */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="20" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 * (1 - (safeCount / (totalRegistered || 1)))} 
              />
              {/* Warning */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="20" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 * (1 - (warningCount / (totalRegistered || 1)))} 
                className="origin-center" 
                style={{ transform: `rotate(${(safeCount / (totalRegistered || 1)) * 360}deg)` }} 
              />
              {/* Critical */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="20" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 * (1 - (criticalCount / (totalRegistered || 1)))} 
                className="origin-center" 
                style={{ transform: `rotate(${((safeCount + warningCount) / (totalRegistered || 1)) * 360}deg)` }} 
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">{totalRegistered}</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-6 text-sm font-medium w-full">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Safe ({safeCount})</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Warning ({warningCount})</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Critical ({criticalCount})</div>
          </div>
        </div>

        {/* SECTION 3 – Water Reuse Analytics */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" /> Water Reuse Analytics (ML/day)</h3>
          <div className="h-48 w-full relative flex items-end justify-between px-2">
             {sectorData.map((d, i) => (
               <div key={i} className="flex flex-col items-center gap-2 w-1/5">
                 <div className="flex gap-1.5 h-36 items-end w-full justify-center">
                   <div className="w-4 sm:w-6 bg-blue-600 rounded-t-sm" style={{ height: `${d.fresh}%` }} title={`Fresh: ${d.fresh}`} />
                   <div className="w-4 sm:w-6 bg-emerald-500 rounded-t-sm" style={{ height: `${d.reused}%` }} title={`Reused: ${d.reused}`} />
                 </div>
                 <span className="text-xs text-slate-500 font-medium truncate max-w-full">{d.name}</span>
               </div>
             ))}
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600" /> Fresh Water Intake</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Reused Water</div>
          </div>
        </div>
      </div>

      {/* SECTION 5 – Industry Monitoring Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden w-full">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-semibold">Live Industry Monitoring</h3>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'industries' }))}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View All ({totalRegistered}) &rarr;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-4 font-semibold">Industry Name</th>
                <th className="px-5 py-4 font-semibold">CTO Usage</th>
                <th className="px-5 py-4 font-semibold">Water Reuse</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Last Updated</th>
                <th className="px-5 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading && mapIndustries.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-medium">Loading data...</td></tr>
              ) : (mapIndustries.length > 0 ? mapIndustries.slice(0, 10) : industries).map((ind, i) => (
                <tr key={ind.user_id || ind.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div>
                      <div>{ind.industry_name || ind.name || `Industry ${i+1}`}</div>
                      <div className="text-xs text-slate-400 font-normal">{ind.district || 'Tamil Nadu'}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            (Number(ind.current_cto_consumption) || 0) > (Number(ind.daily_cto_limit) || 10000) * 0.8 ? 'bg-red-500' : 'bg-blue-600'
                          }`} 
                          style={{ 
                            width: `${Math.min(100, Math.round(((Number(ind.current_cto_consumption) || 0) / (Number(ind.daily_cto_limit) || 10000)) * 100))}%` 
                          }} 
                        />
                      </div>
                      <span className="text-xs font-semibold">
                        {Math.min(100, Math.round(((Number(ind.current_cto_consumption) || 0) / (Number(ind.daily_cto_limit) || 10000)) * 100))}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium">{ind.current_reuse_percentage || ind.reuse || 0}%</td>
                  <td className="px-5 py-4">
                    {ind.compliance_status === 'Safe' ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Safe</span> :
                     ind.compliance_status === 'Warning' ? <span className="text-amber-600 dark:text-amber-400 font-bold">● Warning</span> :
                     <span className="text-red-600 dark:text-red-400 font-bold">● Critical</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs font-medium">
                    {ind.last_warning_date ? new Date(ind.last_warning_date).toLocaleDateString() : 'Just now'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'industries' }))}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 1.5 - Tamil Nadu Industry Compliance Map */}
      <TamilNaduComplianceMap industries={mapIndustries} />

    </div>
  );
}
