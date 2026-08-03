import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, ShieldAlert, Search, AlertTriangle, 
  CheckCircle, XCircle, ChevronRight, Send, Check,
  ChevronLeft, Eye, EyeOff, X, Save, Trash2, Plus, Edit, CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export function GovernmentManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('government_users').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching gov users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Exception fetching gov users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this government officer?")) return;
    try {
      const { error } = await supabase.from('government_users').delete().eq('id', id);
      if (error) {
        alert("Failed to delete user.");
      } else {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Government Officers</h3>
          <p className="text-sm text-muted-foreground">Manage regional and district regulatory officers</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-cyan hover:bg-cyan/90 text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-lg shadow-cyan/20 flex items-center gap-2 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Government Officer
        </button>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No government officers found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-cyan bg-white/5 hover:bg-cyan/10 rounded-lg transition-colors" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 text-muted-foreground hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddGovModal 
            onClose={() => setIsAddModalOpen(false)} 
            onSuccess={() => {
              setIsAddModalOpen(false);
              fetchUsers();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddGovModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Regional Officer' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      setError("All fields are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      
      const { error: dbError } = await supabase.from('government_users').insert([
        { 
          name: form.name, 
          email: form.email, 
          password: form.password, 
          role: form.role,
          status: 'Active'
        }
      ]).select();

      if (dbError) {
        if (dbError.code === '42P01') {
           setError("Table 'government_users' does not exist in Supabase. Please run the migration script to create it.");
        } else {
           setError(dbError.message);
        }
        setSaving(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md glass-strong border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Add Government Officer</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Officer Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan placeholder:text-muted-foreground/50" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Government Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan placeholder:text-muted-foreground/50" placeholder="officer@tnpcb.gov.in" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan appearance-none">
              <option value="Regional Officer">Regional Officer</option>
              <option value="District Officer">District Officer</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan pr-10 placeholder:text-muted-foreground/50" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan"><Eye className="h-4 w-4" /></button>
            </div>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-400/10 p-2.5 rounded border border-red-400/20">{error}</div>}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan hover:bg-cyan/90 text-primary-foreground shadow-lg shadow-cyan/20 disabled:opacity-50 flex items-center gap-2 transition-colors">
              {saving ? 'Creating...' : <><Save className="h-4 w-4" /> Create Officer</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function PlaceholderView({ title, icon }: any) { return <div>{title}</div>; }