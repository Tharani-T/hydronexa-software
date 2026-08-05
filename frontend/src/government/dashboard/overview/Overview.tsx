import { useEffect, useState, useMemo } from "react";
import { 
  Factory, Activity, ShieldCheck, AlertTriangle, 
  ChevronRight, FileText, Download, Send, Clock, 
  Droplets, AlertCircle, MapPin, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const getDistrictCoordinates = (district: string = '') => {
  const coords: Record<string, {x: number, y: number}> = {
    'Chennai': { x: 80, y: 15 },
    'Coimbatore': { x: 25, y: 50 },
    'Madurai': { x: 45, y: 70 },
    'Tirupur': { x: 30, y: 55 },
    'Erode': { x: 35, y: 45 },
    'Salem': { x: 50, y: 40 },
    'Tiruchirappalli': { x: 55, y: 55 },
    'Tirunelveli': { x: 40, y: 85 },
    'Vellore': { x: 70, y: 20 },
    'Thoothukudi': { x: 50, y: 80 },
    'Kanchipuram': { x: 75, y: 20 },
    'Chengalpattu': { x: 78, y: 25 },
    'Tiruvallur': { x: 75, y: 12 },
    'Cuddalore': { x: 70, y: 45 },
    'Villupuram': { x: 65, y: 35 },
    'Dindigul': { x: 40, y: 60 },
    'Thanjavur': { x: 65, y: 60 },
    'Kanyakumari': { x: 35, y: 95 },
    'Dharmapuri': { x: 45, y: 30 },
    'Krishnagiri': { x: 40, y: 20 }
  };
  
  const d = district.trim();
  if (!coords[d]) {
     let hash = 0;
     for (let i = 0; i < d.length; i++) hash = d.charCodeAt(i) + ((hash << 5) - hash);
     return { x: 30 + (Math.abs(hash) % 40), y: 30 + (Math.abs(hash >> 8) % 40) };
  }
  return coords[d];
};

const getMarkerPosition = (district: string, id: string) => {
   const base = getDistrictCoordinates(district);
   let hash = 0;
   for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
   const offsetX = (hash % 10) - 5;
   const offsetY = ((hash >> 4) % 10) - 5;
   return { x: base.x + (offsetX * 0.4), y: base.y + (offsetY * 0.4) };
};

export function Overview() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mapIndustries, setMapIndustries] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

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

  const mapMarkers = useMemo(() => {
    return mapIndustries.map(ind => {
        const pos = getMarkerPosition(ind.district || 'Unknown', ind.user_id || ind.id || Math.random().toString());
        let color = 'bg-emerald-500';
        let ringColor = 'ring-emerald-500/30';
        if (ind.compliance_status === 'Warning') { color = 'bg-amber-500'; ringColor = 'ring-amber-500/30'; }
        if (ind.compliance_status === 'Critical') { color = 'bg-red-500'; ringColor = 'ring-red-500/30'; }
        
        return {
           ...ind,
           pos,
           color,
           ringColor
        };
    });
  }, [mapIndustries]);

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

      {/* SECTION 5 – Industry Monitoring Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden w-full">
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

      {/* SECTION 1.5 - Tamil Nadu Industry Compliance Map (Moved to Bottom) */}
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6 w-full">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Tamil Nadu Industry Compliance Map</h3>
        <div className="relative w-full h-[500px] bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Abstract Map Background */}
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
             <svg viewBox="0 0 100 100" className="w-full h-full max-h-[600px] text-slate-900 dark:text-slate-100" fill="currentColor">
               <polygon points="40,5 60,5 80,15 90,25 85,45 80,65 70,75 60,85 55,95 40,98 30,95 25,85 30,70 25,60 15,55 5,45 15,35 30,25 40,15" />
             </svg>
          </div>
          
          {/* Markers */}
          {mapMarkers.map((m, i) => (
             <div 
               key={i} 
               className={`absolute w-3 h-3 rounded-full cursor-pointer ${m.color} ring-4 ${m.ringColor} hover:ring-8 transition-all z-10`}
               style={{ left: `${m.pos.x}%`, top: `${m.pos.y}%`, transform: 'translate(-50%, -50%)' }}
               onClick={() => setSelectedMarker(m)}
             />
          ))}

          {/* Popup */}
          {selectedMarker && (
             <div 
               className="absolute z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4 w-72"
               style={{ 
                 left: `${Math.min(Math.max(selectedMarker.pos.x, 10), 90)}%`, 
                 top: `${Math.min(Math.max(selectedMarker.pos.y, 10), 90)}%`,
                 transform: 'translate(-50%, -110%)'
               }}
             >
               <button onClick={() => setSelectedMarker(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                 <X className="w-4 h-4" />
               </button>
               <h4 className="font-bold text-slate-900 dark:text-slate-100 pr-6 truncate">{selectedMarker.industry_name || 'Unknown Industry'}</h4>
               <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1"><MapPin className="w-3 h-3"/> {selectedMarker.district || 'Unknown District'}</p>
               
               <div className="space-y-2 text-sm mb-4">
                 <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                   <span className="text-slate-600 dark:text-slate-400">Status</span>
                   <span className={`font-bold ${
                     selectedMarker.compliance_status === 'Safe' ? 'text-emerald-600' :
                     selectedMarker.compliance_status === 'Warning' ? 'text-amber-600' : 'text-red-600'
                   }`}>{selectedMarker.compliance_status || 'Unknown'}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                   <span className="text-slate-600 dark:text-slate-400">CTO Consumption</span>
                   <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMarker.current_cto_consumption || 0} L</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                   <span className="text-slate-600 dark:text-slate-400">Water Reuse</span>
                   <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedMarker.current_reuse_percentage || 0}%</span>
                 </div>
                 <div className="flex justify-between pb-1">
                   <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                   <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                     {selectedMarker.last_warning_date ? new Date(selectedMarker.last_warning_date).toLocaleDateString() : 'N/A'}
                   </span>
                 </div>
               </div>
               
               <button 
                 onClick={() => {
                   window.dispatchEvent(new CustomEvent('gov-navigate', { detail: 'industries' }));
                 }}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded text-xs transition-colors"
               >
                 View Details
               </button>
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
