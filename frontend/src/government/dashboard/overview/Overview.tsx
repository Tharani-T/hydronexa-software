import { useEffect, useState } from "react";
import { 
  Factory, Activity, ShieldCheck, AlertTriangle, 
  ChevronRight, FileText, Download, Send, Clock, 
  Droplets, AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Overview() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const kpis = [
    { label: "Registered Industries", value: "10", icon: Factory, color: "text-blue-600 dark:text-blue-400" },
    { label: "Active Monitoring", value: "8", icon: Activity, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Within Compliance", value: "85%", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Inspection Required", value: "7", icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
  ];

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
              {/* Safe: 60% */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.60)} />
              {/* Warning: 25% */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.25)} className="origin-center" style={{ transform: 'rotate(216deg)' }} />
              {/* Critical: 15% */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#EF4444" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.15)} className="origin-center" style={{ transform: 'rotate(306deg)' }} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold">20</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-6 text-sm font-medium w-full">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Safe</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Warning</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Critical</div>
          </div>
        </div>

        {/* SECTION 3 – Water Reuse Analytics */}
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" /> Water Reuse Analytics (ML/day)</h3>
          <div className="h-48 w-full relative flex items-end justify-between px-2">
             {[
               { name: "Textile", fresh: 80, reused: 50 },
               { name: "Paper", fresh: 60, reused: 70 },
               { name: "Steel", fresh: 100, reused: 40 },
               { name: "Food", fresh: 40, reused: 60 },
               { name: "Pharma", fresh: 30, reused: 80 },
             ].map((d, i) => (
               <div key={i} className="flex flex-col items-center gap-2 w-1/5">
                 <div className="flex gap-1.5 h-36 items-end w-full justify-center">
                   <div className="w-4 sm:w-6 bg-blue-600 rounded-t-sm" style={{ height: `${d.fresh}%` }} title={`Fresh: ${d.fresh}`} />
                   <div className="w-4 sm:w-6 bg-emerald-500 rounded-t-sm" style={{ height: `${d.reused}%` }} title={`Reused: ${d.reused}`} />
                 </div>
                 <span className="text-xs text-slate-500 font-medium">{d.name}</span>
               </div>
             ))}
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600" /> Fresh Water Intake</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Reused Water</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Table + Line Chart) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* SECTION 4 – Monthly Compliance Trend */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Monthly Compliance Trend</h3>
            <div className="h-40 w-full relative">
               <svg viewBox="0 0 400 100" className="w-full h-full preserve-aspect-ratio-none overflow-visible">
                 <path d="M0,80 Q50,90 100,60 T200,40 T300,50 T400,20" fill="none" stroke="#0F6CBD" strokeWidth="3" />
                 <path d="M0,100 L0,80 Q50,90 100,60 T200,40 T300,50 T400,20 L400,100 Z" fill="#0F6CBD" fillOpacity="0.1" />
                 {[0, 100, 200, 300, 400].map((x, i) => (
                   <circle key={i} cx={x} cy={i === 0 ? 80 : i === 1 ? 60 : i === 2 ? 40 : i === 3 ? 50 : 20} r="5" fill="#0F6CBD" className="stroke-white dark:stroke-[#1E293B]" strokeWidth="2" />
                 ))}
               </svg>
               <div className="flex justify-between text-xs font-semibold text-slate-500 mt-4 px-1">
                 <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
               </div>
            </div>
          </div>

          {/* SECTION 5 – Industry Monitoring Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-base font-semibold">Live Industry Monitoring</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">View All &rarr;</button>
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
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-medium">Loading data...</td></tr>
                  ) : industries.map((ind, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{ind.name || ind.company || `Industry ${i+1}`}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 w-full max-w-[120px]">
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${ind.ctoUsage > 80 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${ind.ctoUsage || 50}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{ind.ctoUsage || 50}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{ind.reuse || 0}%</td>
                      <td className="px-5 py-4">
                        {ind.status === 'Safe' ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Safe</span> :
                         ind.status === 'Warning' ? <span className="text-amber-600 dark:text-amber-400 font-bold">Warning</span> :
                         <span className="text-red-600 dark:text-red-400 font-bold">Critical</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs font-medium">{ind.lastUpdated || 'Just now'}</td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-800/50 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 transition-colors">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Recommendations, Activity, Actions) */}
        <div className="space-y-6">
          
          {/* SECTION 6 – Inspection Recommendations */}
          <div className="bg-white dark:bg-[#1E293B] border-l-4 border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200 dark:border-t-slate-700 dark:border-r-slate-700 dark:border-b-slate-700 rounded-r-lg p-5 shadow-sm">
            <h3 className="text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5" /> Inspection Recommendations</h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-md p-4">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">ABC Dyeing</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> Monthly CTO exceeded by 15%</div>
                <div className="text-xs text-red-700 dark:text-red-400 mt-3 font-bold bg-red-100 dark:bg-red-500/20 inline-block px-2 py-1 rounded">Recommendation: Inspection Recommended</div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-md p-4">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">XYZ Mills</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5"><span className="font-semibold text-slate-700 dark:text-slate-300">Reason:</span> Low Water Reuse (&lt; 30%)</div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-3 font-bold bg-amber-100 dark:bg-amber-500/20 inline-block px-2 py-1 rounded">Recommendation: Issue Warning Notice</div>
              </div>
            </div>
          </div>

          {/* SECTION 8 – Quick Actions */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 gap-2">
                <Factory className="w-5 h-5 text-blue-600 dark:text-blue-400" /> View All Industries
              </button>
              <button className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Generate Report
              </button>
              <button className="flex flex-col items-center justify-center p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 gap-2">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Export PDF
              </button>
              <button className="flex flex-col items-center justify-center p-4 border border-red-200 dark:border-red-900/50 rounded-md bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-xs font-bold text-red-700 dark:text-red-400 gap-2 shadow-sm">
                <Send className="w-5 h-5" /> Issue Notice
              </button>
            </div>
          </div>

          {/* SECTION 7 – Recent Activity */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-base font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100"><Clock className="w-5 h-5 text-blue-600" /> Recent Activity</h3>
            <div className="space-y-6 pl-2 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              
              <div className="relative pl-6">
                <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white dark:border-[#1E293B] shadow-sm" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">CTO limit exceeded</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">ABC Dyeing • 10 mins ago</p>
              </div>

              <div className="relative pl-6">
                <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1E293B] shadow-sm" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Reuse target achieved</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Global Pharma • 2 hours ago</p>
              </div>

              <div className="relative pl-6">
                <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-[#1E293B] shadow-sm" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Water quality alert (pH)</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">SteelTech Ind • 4 hours ago</p>
              </div>

              <div className="relative pl-6">
                <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-[#1E293B] shadow-sm" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">New industry registered</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">EcoFoods Ltd • 1 day ago</p>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
