import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Factory, ShieldAlert, 
  Settings, LogOut, Search, Bell, Activity, 
  Droplets, AlertTriangle, FileText, CheckCircle, 
  XCircle, ChevronRight, UserCog, Send, Check,
  ChevronLeft, Gauge, Clock, BellRing, CheckCircle2,
  Sparkles, Download, Eye, EyeOff, MapPin, X, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/lib/store";

export function Reports() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIndustries = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/industries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIndustries(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const handleDownloadCSV = () => {
    if (industries.length === 0) return;
    const headers = ["Industry Name", "Industry Email", "Contact Details", "Industry Status", "CTO Limit (L/day)", "CTO Validity", "Registration Date"];
    const rows = industries.map(ind => [
      `"${ind.industryName || 'N/A'}"`,
      `"${ind.email || 'N/A'}"`,
      `"${ind.location || 'N/A'}"`,
      `"${ind.status || 'N/A'}"`,
      `"${ind.ctolimit || 0}"`,
      `"${ind.ctovalidity || 'N/A'}"`,
      `"${new Date(ind.createdAt).toLocaleDateString()}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "industry_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">System Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate and download comprehensive industry reports.</p>
        </div>
        <button onClick={handleDownloadCSV} className="px-4 py-2 bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
             <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
             <p className="text-sm text-muted-foreground">Loading reports data...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Industry Name</th>
                  <th className="px-6 py-4 font-semibold">Industry Email</th>
                  <th className="px-6 py-4 font-semibold">Contact Details</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">CTO Information</th>
                  <th className="px-6 py-4 font-semibold">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {industries.map((ind, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{ind.industryName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{ind.email}</td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {ind.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${ind.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {ind.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <div>Limit: {ind.ctolimit || 0} L/day</div>
                      <div>Valid: {ind.ctovalidity || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(ind.createdAt).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}