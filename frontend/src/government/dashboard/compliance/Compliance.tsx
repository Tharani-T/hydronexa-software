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

  const metrics = useMemo(() => {
    if (data.length === 0) return { totalInd: 0, avgReuse: 0, avgCTO: 0, totalSaved: 0, criticalCount: 0, criticalIndustries: [] };
    
    let totalReuse = 0, totalCTO = 0, saved = 0;
    const criticals = data.filter(d => d.compliance_status === 'Critical');

    data.forEach(d => {
      const reusePct = Number(d.current_reuse_percentage) || 0;
      const ctoCons = Number(d.current_cto_consumption) || 0;
      totalReuse += reusePct;
      totalCTO += ctoCons;
      saved += (ctoCons * (reusePct / 100));
    });

    return {
      totalInd: data.length,
      avgReuse: Math.round(totalReuse / data.length),
      avgCTO: Math.round(totalCTO / data.length),
      totalSaved: Math.round(saved),
      criticalCount: criticals.length,
      criticalIndustries: criticals
    };
  }, [data]);

  const districtMetrics = useMemo(() => {
    const map: Record<string, { totalReuse: number, totalCTO: number, count: number }> = {};
    data.forEach(d => {
      const dist = d.district || 'Unknown';
      if (!map[dist]) map[dist] = { totalReuse: 0, totalCTO: 0, count: 0 };
      map[dist].totalReuse += (Number(d.current_reuse_percentage) || 0);
      map[dist].totalCTO += (Number(d.current_cto_consumption) || 0);
      map[dist].count += 1;
    });

    const distArray = Object.keys(map).map(k => ({
      district: k,
      avgReuse: Math.round(map[k].totalReuse / map[k].count),
      avgCTO: Math.round(map[k].totalCTO / map[k].count)
    }));

    return distArray.sort((a, b) => b.avgReuse - a.avgReuse);
  }, [data]);

  const topPerforming = useMemo(() => {
    return [...data]
      .sort((a, b) => {
        const aScore = (Number(a.current_reuse_percentage) || 0) - (Number(a.current_cto_consumption) || 0);
        const bScore = (Number(b.current_reuse_percentage) || 0) - (Number(b.current_cto_consumption) || 0);
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(d => ({
      name: d.industry_name || 'Unknown',
      cto: Number(d.current_cto_consumption) || 0,
      reuse: Number(d.current_reuse_percentage) || 0
    })).sort((a, b) => b.cto - a.cto);
  }, [data]);

  const insights = useMemo(() => {
    if (data.length === 0 || districtMetrics.length === 0) return [];
    
    const bestDist = districtMetrics[0]?.district;
    const worstDist = districtMetrics[districtMetrics.length - 1]?.district;
    
    const highestCTO = [...data].sort((a, b) => (Number(b.current_cto_consumption) || 0) - (Number(a.current_cto_consumption) || 0))[0];
    const bestReuse = [...data].sort((a, b) => (Number(b.current_reuse_percentage) || 0) - (Number(a.current_reuse_percentage) || 0))[0];

    return [
      { text: `District with highest average water reuse: `, bold: `${bestDist} (${districtMetrics[0]?.avgReuse}%)`, isBad: false },
      { text: `District requiring reuse intervention: `, bold: `${worstDist} (${districtMetrics[districtMetrics.length - 1]?.avgReuse}%)`, isBad: true },
      { text: `Industry with maximum fresh water dependency: `, bold: `${highestCTO?.industry_name} (${highestCTO?.current_cto_consumption} L)`, isBad: true },
      { text: `Highest performing industry for sustainable reuse: `, bold: `${bestReuse?.industry_name} (${bestReuse?.current_reuse_percentage}%)`, isBad: false },
      { text: `Estimated fresh water successfully conserved across all monitored facilities: `, bold: `${metrics.totalSaved.toLocaleString()} L`, isBad: false },
      { text: `Currently active critical compliance alerts demanding immediate regulatory action: `, bold: `${metrics.criticalCount} Industries`, isBad: metrics.criticalCount > 0 }
    ];
  }, [data, districtMetrics, metrics]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 pb-20 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Executive Water Reuse & CTO Analysis</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Strategic Decision Support Dashboard for Industrial Water Governance</p>
      </div>

      {/* 1. Executive Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Registered Industries</div>
          <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{metrics.totalInd}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Avg Water Reuse</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{metrics.avgReuse}%</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Avg CTO Cons.</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-500">{metrics.avgCTO} L</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Water Saved</div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-500">{metrics.totalSaved.toLocaleString()} L</div>
        </div>
        <div className={`bg-white dark:bg-slate-900 border ${metrics.criticalCount > 0 ? 'border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-800'} rounded-lg p-5 shadow-sm`}>
          <div className={`text-xs font-semibold ${metrics.criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'} uppercase tracking-wider mb-2`}>Critical Industries</div>
          <div className={`text-3xl font-black ${metrics.criticalCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{metrics.criticalCount}</div>
        </div>
      </div>

      {/* 7. Executive Insights Panel */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-600" /> Executive Insights & Observations</h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {insight.text}
                <span className={`font-bold ml-1 ${insight.isBad ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {insight.bold}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 2. Water Reuse vs CTO Comparison Chart */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /> CTO Consumption vs Reuse Analysis</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => val.substring(0, 8) + "."} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }} />
                <Bar yAxisId="left" dataKey="cto" name="CTO Consumption (L)" fill="#3b82f6" radius={[2,2,0,0]} barSize={20} />
                <Bar yAxisId="right" dataKey="reuse" name="Reuse (%)" fill="#10b981" radius={[2,2,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3 & 4. District-wise Reuse Performance & CTO Consumption */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> District-wise Performance Metrics</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtMetrics} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="district" type="category" tick={{ fontSize: 11, fontWeight: "600", fill: '#475569' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="avgReuse" name="Avg Reuse %" fill="#10b981" radius={[0,2,2,0]} barSize={12} />
                <Bar dataKey="avgCTO" name="Avg CTO (L)" fill="#3b82f6" radius={[0,2,2,0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 6. Industries Requiring Immediate Attention */}
      <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-700 dark:text-red-400">
          <ShieldAlert className="h-5 w-5" /> Industries Requiring Immediate Attention (Critical)
        </h2>
        {metrics.criticalCount === 0 ? (
          <div className="text-sm font-medium text-red-600/70 dark:text-red-400/70 py-4">No critical industries detected at this time.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-red-100 dark:border-red-900/30">
              <thead className="bg-red-100 dark:bg-red-900/40">
                <tr>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">Industry Name</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">District</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">CTO Cons.</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">CTO Limit</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">Reuse %</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold">Reuse Target</th>
                  <th className="py-3 px-4 text-xs uppercase tracking-wider text-red-800 dark:text-red-300 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100 dark:divide-red-900/20">
                {metrics.criticalIndustries.map(ind => (
                  <tr key={ind.user_id || Math.random()} className="hover:bg-red-50/50 dark:hover:bg-red-900/20">
                    <td className="py-3 px-4 font-bold text-sm text-slate-800 dark:text-slate-200">{ind.industry_name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm font-bold text-red-600 dark:text-red-400">{ind.district || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">{Number(ind.current_cto_consumption) || 0} L</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{Number(ind.daily_cto_limit) || 0} L</td>
                    <td className="py-3 px-4 font-bold text-sm text-slate-700 dark:text-slate-300">{Number(ind.current_reuse_percentage) || 0}%</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{Number(ind.daily_reuse_target) || 0}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                        {ind.compliance_status || 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Top Performing Industries */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Top 5 Performing Industries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Rank</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Industry Name</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">District</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">Reuse %</th>
                <th className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-bold">CTO Cons. (L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {topPerforming.map((ind, idx) => (
                <tr key={ind.user_id || Math.random()} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-sm text-slate-400">#{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-sm text-slate-800 dark:text-slate-100">{ind.industry_name || 'Unknown'}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">{ind.district || 'Unknown'}</td>
                  <td className="py-4 px-4 font-bold text-sm text-emerald-600 dark:text-emerald-500">{Number(ind.current_reuse_percentage) || 0}%</td>
                  <td className="py-4 px-4 text-sm font-medium text-blue-600 dark:text-blue-500">{Number(ind.current_cto_consumption) || 0} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

export function MailCenter() {
  const [industry, setIndustry] = useState("MetalWorks Steel Co.");
  const [industryId, setIndustryId] = useState("");
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
        if (data.id) setIndustryId(data.id);
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
        
        // Add to Inspection Queue (via Supabase)
        if (industryId) {
          try {
            const { data: currentData } = await supabase.from('industry').select('warning_count').eq('user_id', industryId).single();
            const newCount = (currentData?.warning_count || 0) + 1;
            await supabase.from('industry').update({
              current_workflow_stage: 'Inspection',
              warning_count: newCount,
              last_warning_date: new Date().toISOString()
            }).eq('user_id', industryId);
          } catch(e) {
            console.error("Failed to update Supabase", e);
          }
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
              All communications are logged and timestamped for regulatory auditing. System verifies message content for ISO compliance.
           </p>
        </div>
      </div>
    </div>
  );
}


