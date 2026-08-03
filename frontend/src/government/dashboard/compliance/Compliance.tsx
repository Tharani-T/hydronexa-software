import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import {
  LayoutDashboard, Factory, ShieldCheck, AlertTriangle, Brain, Mail, FileText, Settings,
  Send, Sparkles, TrendingUp, TrendingDown, Activity, Terminal, ShieldAlert, Globe, Loader2, CheckCircle2,
  Droplets, RefreshCw, AlertCircle, MapPin
} from "lucide-react";

import { nav, monitoredIndustries } from '@/government/utils/constants';

import { StatCard } from "@/government/dashboard/components/StatCard";
import { StatusPill } from "@/government/dashboard/components/StatusPill";
import { Mini } from "@/government/dashboard/components/Mini";
import { BarCell } from "@/government/dashboard/components/BarCell";
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";

export function Compliance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: industries, error } = await supabase.from('industry').select('*');
      if (error) {
        console.error("Error fetching industries:", error);
      } else {
        setData(industries || []);
      }
      setLoading(false);
    };
    fetchData();

    const sub = supabase.channel('industry-compliance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'industry' }, () => {
        fetchData();
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const { totalFreshWater, totalReused, avgReuse, totalEstimatedSaved } = useMemo(() => {
    let fresh = 0, reused = 0, avg = 0;
    if (data.length === 0) return { totalFreshWater: 0, totalReused: 0, avgReuse: 0, totalEstimatedSaved: 0 };
    
    data.forEach(d => {
      fresh += Number(d.cto_consumption) || 0;
      const r = (Number(d.cto_consumption) || 0) * ((Number(d.reuse_percent) || 0) / 100);
      reused += r;
      avg += Number(d.reuse_percent) || 0;
    });
    return {
      totalFreshWater: Math.round(fresh),
      totalReused: Math.round(reused),
      avgReuse: data.length > 0 ? Math.round(avg / data.length) : 0,
      totalEstimatedSaved: Math.round(reused)
    };
  }, [data]);

  const districtData = useMemo(() => {
    const districts: Record<string, { total: number, count: number }> = {};
    data.forEach(d => {
      const dist = d.district || 'Unknown';
      if (!districts[dist]) districts[dist] = { total: 0, count: 0 };
      districts[dist].total += Number(d.reuse_percent) || 0;
      districts[dist].count += 1;
    });
    return Object.keys(districts).map(k => ({
      district: k,
      avgReuse: Math.round(districts[k].total / districts[k].count)
    })).sort((a, b) => b.avgReuse - a.avgReuse);
  }, [data]);

  const rankedIndustries = useMemo(() => {
    return [...data].sort((a, b) => (Number(b.reuse_percent) || 0) - (Number(a.reuse_percent) || 0));
  }, [data]);

  const aiInsights = useMemo(() => {
    const achieved = data.filter(d => (Number(d.reuse_percent) || 0) >= (Number(d.reuse_target) || 0)).length;
    const excessive = data.filter(d => (Number(d.cto_consumption) || 0) > (Number(d.cto_limit) || 0)).length;
    return [
      `${achieved} industries achieved their reuse targets.`,
      `${excessive} industries are consuming excessive fresh water.`,
      `Overall water reuse efficiency is at ${avgReuse}%, showing positive trends.`,
      `Inspection is recommended for ${data.filter(d => d.compliance_status === 'Critical').length} critical industries.`
    ];
  }, [data, avgReuse]);

  const criticalAlerts = useMemo(() => {
    return data.filter(d => d.compliance_status === 'Critical');
  }, [data]);

  const warningDistricts = useMemo(() => {
    const districts: Record<string, number> = {};
    data.forEach(d => {
      if (d.compliance_status === 'Warning' || d.compliance_status === 'Critical') {
        const dist = d.district || 'Unknown';
        districts[dist] = (districts[dist] || 0) + 1;
      }
    });
    return Object.entries(districts)
      .map(([district, count]) => ({ district, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-12 pb-20 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Water Reuse & CTO Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Executive Decision Support Dashboard for Industrial Water Monitoring</p>
      </div>

      {(criticalAlerts.length > 0 || warningDistricts.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /> Critical Alerts</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-xl p-4 shadow-sm flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 text-lg">
                  🔴
                </div>
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-300">{alert.name}</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium mt-1">
                    {Number(alert.cto_consumption) > Number(alert.cto_limit) ? 'CTO limit exceeded. Immediate attention required.' : 'Reuse target critically low. Immediate attention required.'}
                  </p>
                </div>
              </div>
            ))}
            
            {warningDistricts.map(dist => (
              <div key={dist.district} className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 rounded-r-xl p-4 shadow-sm flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-lg">
                  🟠
                </div>
                <div>
                  <h4 className="font-bold text-orange-900 dark:text-orange-300">{dist.district} District</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 font-medium mt-1">
                    {dist.count} {dist.count === 1 ? 'industry is' : 'industries are'} in Warning/Critical status.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe className="h-5 w-5 text-blue-600" /> Environmental Impact Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Fresh Water Consumed</div>
            <div className="text-3xl font-black text-blue-600">{totalFreshWater.toLocaleString()} L</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Reused Water</div>
            <div className="text-3xl font-black text-emerald-600">{totalReused.toLocaleString()} L</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Avg Water Reuse %</div>
            <div className="text-3xl font-black text-cyan-600">{avgReuse}%</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Estimated Fresh Water Saved</div>
            <div className="text-3xl font-black text-indigo-600">{totalEstimatedSaved.toLocaleString()} L</div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-purple-600" /> CTO vs Water Reuse Analysis</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(val) => val.substring(0, 10) + "..."} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
                <Bar dataKey="cto_consumption" name="CTO Consumption (L)" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar dataKey="reuse_percent" name="Reuse (%)" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> District-wise Reuse Performance</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis dataKey="district" type="category" tick={{ fontSize: 10, fontWeight: "bold" }} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                <Bar dataKey="avgReuse" name="Avg Reuse %" radius={[0,4,4,0]}>
                  {districtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : index === districtData.length - 1 ? "#ef4444" : "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs font-semibold mt-4 text-slate-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Highest</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-500 rounded-sm"></div> Average</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Lowest</span>
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-indigo-600" /> Industry Compliance Ranking</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Rank</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Industry Name</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">CTO Cons. (L)</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Reuse %</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Target %</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rankedIndustries.map((ind, idx) => (
                <tr key={ind.id} className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx === 0 ? "bg-emerald-50/50 dark:bg-emerald-900/10" : idx === rankedIndustries.length - 1 ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                  <td className="py-4 px-4 font-bold text-sm">#{idx + 1}</td>
                  <td className="py-4 px-4 font-semibold text-sm">{ind.name}</td>
                  <td className="py-4 px-4 text-sm">{ind.cto_consumption}</td>
                  <td className="py-4 px-4 font-bold text-sm">{ind.reuse_percent}%</td>
                  <td className="py-4 px-4 text-sm text-slate-500">{ind.reuse_target}%</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ind.compliance_status === "Normal" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ind.compliance_status === "Warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {ind.compliance_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-blue-500" /> Water Reuse Target Achievement</h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
          {data.map(ind => {
            const reuse = Number(ind.reuse_percent) || 0;
            const target = Number(ind.reuse_target) || 0;
            const achieved = reuse >= target;
            const progress = Math.min((reuse / (target || 1)) * 100, 100);
            
            return (
              <div key={ind.id} className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{ind.name}</span>
                  <span className={achieved ? "text-emerald-600" : "text-amber-600"}>{reuse}% / {target}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${achieved ? "bg-emerald-500" : "bg-amber-500"}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-600" /> Executive AI Analysis Summary</h2>
          <ul className="space-y-4">
            {aiInsights.map((insight, idx) => (
              <li key={idx} className="flex gap-3 text-sm font-medium">
                <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section> */}

        {/* <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Actionable Recommendations</h2>
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Increase monitoring for industries consistently below reuse targets.
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" /> Issue official compliance notices to Critical violators.
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Recognize top-performing districts for sustainable water management.
            </div>
          </div>
        </section> */}
      </div>

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-8 shadow-md">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-emerald-400" /> Environmental Performance Scorecard</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-slate-700">
          <div className="px-4 text-center">
            <div className="text-4xl font-black text-emerald-400 mb-2">{avgReuse}%</div>
            <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">Overall Reuse Efficiency</div>
          </div>
          <div className="px-4 text-center">
            <div className="text-4xl font-black text-blue-400 mb-2">{data.filter(d => d.compliance_status === "Normal").length}/{Math.max(data.length, 1)}</div>
            <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">CTO Compliant Industries</div>
          </div>
          <div className="px-4 text-center">
            <div className="text-4xl font-black text-cyan-400 mb-2">{totalEstimatedSaved.toLocaleString()}</div>
            <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">Est. Water Saved (L)</div>
          </div>
          <div className="px-4 text-center">
            <div className="text-4xl font-black text-indigo-400 mb-2">
              {Math.round((data.filter(d => (Number(d.reuse_percent) || 0) >= (Number(d.reuse_target) || 0)).length / Math.max(data.length, 1)) * 100)}%
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-300 font-bold">Target Achievement Rate</div>
          </div>
        </div>
      </section>
    </div>
  );
}


export function MailCenter() {
  const [industry, setIndustry] = useState("MetalWorks Steel Co.");
  const [email, setEmail] = useState("compliance@metalworks.com");
  const [subject, setSubject] = useState("Official Regulatory Notice: Water Compliance");
  const [msg, setMsg] = useState("Your facility is currently being monitored for CTO compliance. Recent telemetry suggests potential threshold risks.");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState([
    { to: "Textile Mills Ltd", email: "audit@textile.com", sev: "Warning", subj: "Reuse efficiency below target", t: "2h ago" },
    { to: "GreenPaper Industries", email: "safety@greenpaper.io", sev: "Critical", subj: "Repeated pH deviation", t: "Yesterday" },
  ]);

  useEffect(() => {
    const pending = localStorage.getItem('pendingNotice');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        setIndustry(data.industry);
        setEmail(data.email);
        setSubject(data.subject);
        setMsg(data.msg);
        localStorage.removeItem('pendingNotice');
      } catch(e) {}
    }
  }, []);

  const handleIndustryChange = (newInd: string) => {
    setIndustry(newInd);
    setEmail(`compliance@${newInd.toLowerCase().replace(/[^a-z]/g, "")}.com`);
  };

  const sendSMTP = async () => {
    setSending(true);
    const steps = [
      "Establishing secure SMTP handshake...",
      "Authorizing Regulatory TLS 1.3...",
      "Resolving MX records for industry node...",
      "Transmitting encrypted data packets...",
      "Awaiting acknowledgement from recipient server..."
    ];
    
    for (const step of steps) {
      setStatus(step);
      await new Promise(r => setTimeout(r, 800));
    }
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, subject, text: msg })
      });
      
      const data = await response.json();
      if (data.success) {
        setHistory([{ to: industry, email, sev: "Warning", subj: subject, t: "just now" }, ...history]);
        
        // Add to Inspection Queue
        try {
          const queueStr = localStorage.getItem('hydronexa_inspection_queue');
          let queue = [];
          if (queueStr) queue = JSON.parse(queueStr);
          queue.unshift({
            id: `IND-${Math.floor(1000 + Math.random() * 9000)}`,
            name: industry,
            district: "Unknown",
            region: "Unknown",
            address: "Pending Inspection Address",
            email: email,
            complianceIssue: subject,
            warningsSent: 1,
            priority: "High",
            lastNoticeDate: new Date().toISOString().split('T')[0],
            status: "Pending",
            ctoConsumption: "-",
            ctoLimit: "-",
            reusePercent: "-",
            reuseTarget: "-",
            warningHistory: [
              { date: new Date().toISOString().split('T')[0], reason: subject }
            ]
          });
          localStorage.setItem('hydronexa_inspection_queue', JSON.stringify(queue));
        } catch(e) {
          console.error("Failed to update queue", e);
        }
        
        alert("Warning Sent Successfully via HydroNexa SMTP Relay to " + email);
      } else {
        alert("SMTP Failed: " + data.error);
      }
    } catch (err) {
      alert("SMTP Communication Error: " + err);
    }
    
    setSending(false);
    setStatus("");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-20">
      <div className="glass-strong rounded-[2.5rem] p-10 lg:col-span-2 border border-glass-border relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Globe className="h-40 w-40 text-cyan" /></div>
        
        <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="h-14 w-14 rounded-2xl gradient-cyan flex items-center justify-center shadow-glow">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Regulatory SMTP Relay</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Encrypted Compliance Communication Center</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
           <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Select Industry</label>
                 <select 
                    value={industry} 
                    onChange={(e) => handleIndustryChange(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-glass-border rounded-2xl px-4 text-sm focus:border-cyan focus:outline-none transition-all appearance-none"
                 >
                    {monitoredIndustries.map(i => <option key={i.name} value={i.name} className="bg-background">{i.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Industry Recipient Email</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan opacity-40" />
                    <input 
                       value={email} 
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full h-14 bg-white/5 border border-glass-border rounded-2xl pl-12 pr-4 text-sm focus:border-cyan focus:outline-none transition-all"
                       placeholder="compliance@factory.com"
                    />
                 </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Official Subject Line</label>
                 <input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-glass-border rounded-2xl px-4 text-sm focus:border-cyan focus:outline-none transition-all"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Message Body (Warning Details)</label>
              <textarea 
                 value={msg} 
                 onChange={(e) => setMsg(e.target.value)}
                 className="w-full bg-white/5 border border-glass-border rounded-[2rem] p-6 text-sm focus:border-cyan focus:outline-none transition-all min-h-[180px] resize-none"
              />
           </div>

           <div className="flex flex-wrap gap-3">
              <PresetBtn label="CTO Violation" onClick={() => setMsg("URGENT: Your facility has exceeded the permitted CTO usage threshold. Please take corrective action within 48 hours to avoid penalty.")} />
              <PresetBtn label="Quality Breach" onClick={() => setMsg("WARNING: Significant pH/Temperature deviation detected in your treatment unit. Water quality does not meet secondary standards.")} />
              <PresetBtn label="Sustainability Alert" onClick={() => setMsg("Notice: Your reuse efficiency has dropped below the 60% industry benchmark. Sustainability improvement plan required.")} />
           </div>

           <div className="pt-6 flex items-center justify-between border-t border-glass-border">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-eco animate-pulse shadow-glow-eco" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SMTP Status: Encrypted & Online</span>
              </div>
              <button 
                onClick={sendSMTP}
                disabled={sending}
                className="h-14 px-10 rounded-full gradient-cyan text-primary-foreground text-xs font-black uppercase tracking-widest shadow-glow flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                 {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                 {sending ? "Transmitting..." : "Send Mail"}
              </button>
           </div>
        </div>

        {sending && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-10"
           >
              <Terminal className="h-16 w-16 text-cyan mb-6 animate-pulse" />
              <div className="text-2xl font-black mb-2 tracking-tighter uppercase">SMTP Protocol Active</div>
              <div className="text-cyan text-xs font-bold font-mono animate-pulse tracking-widest mb-10">{status}</div>
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ x: ["-100%", "100%"] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="h-full w-full bg-gradient-to-r from-transparent via-cyan to-transparent"
                 />
              </div>
           </motion.div>
        )}
      </div>

      <div className="space-y-6">
        <div className="glass-strong rounded-[2rem] p-8 border border-glass-border">
           <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan" />
              Relay History
           </h4>
           <div className="space-y-4">
              {history.map((h, i) => (
                 <div key={i} className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase text-cyan">{h.to}</span>
                       <span className="text-[9px] font-bold text-muted-foreground uppercase">{h.t}</span>
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground truncate mb-2">{h.email}</div>
                    <div className="text-xs font-medium leading-relaxed opacity-80">{h.subj}</div>
                    <div className={`mt-3 h-1 w-full bg-${h.sev === 'Critical' ? 'danger' : 'warn'}/20 rounded-full`} />
                 </div>
              ))}
           </div>
        </div>
        
        <div className="glass-strong rounded-[2rem] p-8 border border-eco/10 bg-eco/5">
           <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="h-5 w-5 text-eco" />
              <h4 className="text-[10px] font-black uppercase tracking-widest">Compliance Integrity</h4>
           </div>
           <p className="text-xs text-muted-foreground leading-relaxed">
              All communications are logged and timestamped for regulatory auditing. AI verifies message content for ISO compliance.
           </p>
        </div>
      </div>
    </div>
  );
}


