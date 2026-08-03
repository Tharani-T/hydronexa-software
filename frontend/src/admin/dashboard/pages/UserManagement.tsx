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
import { ApproveCTOModal } from "./ContactRequests";


export function UserManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingCTO, setApprovingCTO] = useState<any>(null);

  const fetchRequests = async () => {
    try {
      let ctoReqs: any[] = [];
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/contact-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        ctoReqs = data.filter((r: any) => r.message?.startsWith("CTO Update Request"));
      }

      const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
      const formattedLocalReqs = localReqs.map((r: any) => ({
        _id: r.id.toString(),
        company: r.industryName,
        email: r.email,
        type: r.subject || "Change Request",
        message: r.message,
        created_at: r.date,
        status: r.status,
        isLocal: true
      }));

      setRequests([...ctoReqs, ...formattedLocalReqs]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
      const localReqIndex = localReqs.findIndex((r: any) => r.id.toString() === id.toString());
      
      if (localReqIndex !== -1) {
        localReqs[localReqIndex].status = status;
        localStorage.setItem('hydronexa:pendingRequests', JSON.stringify(localReqs));
        fetchRequests();
        return;
      }

      const res = await fetch('/api/admin/update-request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("adminToken")}` },
        body: JSON.stringify({ requestId: id, status })
      });
      if (res.ok) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-xl font-bold">User Management - Change Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and manage CTO modification requests from industries.</p>
        </div> */}
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <UserCog className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No Requests Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">There are currently no CTO change requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Industry Name</th>
                  <th className="px-6 py-4 font-semibold">Industry Email</th>
                  <th className="px-6 py-4 font-semibold">Request Type</th>
                  <th className="px-6 py-4 font-semibold">Request Message</th>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{req.company}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.email}</td>
                    <td className="px-6 py-4">{req.type || "CTO Change Request"}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate" title={req.message.replace("CTO Update Request:", "").trim()}>{req.message.replace("CTO Update Request:", "").trim()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${req.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <button onClick={() => setApprovingCTO(req)} disabled={req.status === 'Approved'} className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded disabled:opacity-50 transition-colors">Approve</button>
                      <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} disabled={req.status === 'Rejected'} className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50 transition-colors">Reject</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {approvingCTO && (
        <ApproveCTOModal request={approvingCTO} onClose={() => { setApprovingCTO(null); fetchRequests(); }} />
      )}
    </motion.div>
  );
}