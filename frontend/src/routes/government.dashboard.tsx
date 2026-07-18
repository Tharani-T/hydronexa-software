import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import {
  LayoutDashboard, Factory, ShieldCheck, AlertTriangle, Brain, Mail, FileText, Settings,
  Send, Sparkles, TrendingUp, TrendingDown, Activity, Terminal, ShieldAlert, Globe, Loader2, CheckCircle2
} from "lucide-react";
import textileImg from "@/assets/industry-textile.jpg";
import paperImg from "@/assets/industry-paper.jpg";
import foodImg from "@/assets/industry-food.jpg";
import steelImg from "@/assets/industry-steel.jpg";
import pharmaImg from "@/assets/industry-pharma.jpg";

export const Route = createFileRoute("/government/dashboard")({
  component: GovDashboard,
});

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "industries", label: "Industries", icon: Factory },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "alerts", label: "Alerts Center", icon: AlertTriangle },
  { id: "ai", label: "AI Analytics", icon: Brain },
  { id: "mail", label: "Compliance Mail", icon: Mail },
  { id: "reports", label: "Reports", icon: FileText },
];

const monitoredIndustries = [
  { name: "Textile Mills Ltd", img: textileImg, sector: "Textile", cto: 78, reuse: 64, consumption: "12.4 ML", status: "warn" },
  { name: "GreenPaper Industries", img: paperImg, sector: "Pulp & Paper", cto: 62, reuse: 71, consumption: "18.2 ML", status: "ok" },
  { name: "FreshFoods Processing", img: foodImg, sector: "Food Processing", cto: 45, reuse: 82, consumption: "6.8 ML", status: "ok" },
  { name: "MetalWorks Steel Co.", img: steelImg, sector: "Steel & Metal", cto: 91, reuse: 58, consumption: "24.6 ML", status: "danger" },
  { name: "PharmaCare Labs", img: pharmaImg, sector: "Pharma", cto: 53, reuse: 76, consumption: "4.2 ML", status: "ok" },
];

function GovDashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");

  useEffect(() => {
    if (!state.govAuthed) navigate({ to: "/government/login" });
  }, [state.govAuthed]);

  return (
    <DashboardShell
      navItems={nav}
      active={section}
      onNavigate={setSection}
      accent="cyan"
      title="Regulatory Command Center"
      subtitle="Real-time AI-powered compliance intelligence"
      logoutTo="/government/login"
    >
      {section === "overview" && <Overview />}
      {section === "industries" && <IndustriesView />}
      {section === "compliance" && <Compliance />}
      {section === "alerts" && <Alerts />}
      {section === "ai" && <AIPanel />}
      {section === "mail" && <MailCenter />}
      {section === "reports" && <Reports />}
    </DashboardShell>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Active Industries" value="5" delta="+4" color="eco" icon={Factory} />
        <StatCard label="Warning Industries" value="3" delta="+1" color="warn" icon={AlertTriangle} />
        <StatCard label="Critical Industries" value="2" delta="-1" color="danger" icon={AlertTriangle} />
        <StatCard label="Avg Reuse Efficiency" value="71.4%" delta="+2.3%" color="cyan" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="glass-strong rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-4">National Water Compliance Trend</h3>
          <svg viewBox="0 0 600 200" className="w-full h-48">
            <defs>
              <linearGradient id="gv" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,150 Q60,100 120,120 T240,90 T360,80 T480,60 T600,70 L600,200 L0,200 Z" fill="url(#gv)" />
            <path d="M0,150 Q60,100 120,120 T240,90 T360,80 T480,60 T600,70" stroke="var(--cyan)" strokeWidth="2.5" fill="none" />
            {[0,1,2,3,4,5,6].map(i => (
              <circle key={i} cx={i * 100} cy={150 - i * 13} r="3" fill="var(--cyan)" />
            ))}
          </svg>
        </div>
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="font-bold mb-4">Sector Distribution</h3>
          <div className="space-y-3">
            {[
              { l: "Textile", v: 34, c: "var(--cyan)" },
              { l: "Pulp & Paper", v: 22, c: "var(--eco)" },
              { l: "Steel", v: 18, c: "var(--warn)" },
              { l: "Pharma", v: 14, c: "var(--cyan-glow)" },
              { l: "Food", v: 12, c: "var(--danger)" },
            ].map(s => (
              <div key={s.l}>
                <div className="flex justify-between text-xs mb-1"><span>{s.l}</span><span className="text-muted-foreground">{s.v}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.v * 2.5}%` }} transition={{ duration: 1 }} className="h-full" style={{ background: s.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <IndustriesGrid />
    </div>
  );
}

function StatCard({ label, value, delta, color, icon: Ic }: any) {
  const c = `var(--${color})`;
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: c }} />
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Ic className="h-4 w-4" style={{ color: c }} />
      </div>
      <div className="text-3xl font-bold mt-2 font-display">{value}</div>
      <div className="text-xs mt-1" style={{ color: c }}>{delta} vs last week</div>
      {/* Glowing ring */}
      <svg className="absolute bottom-2 right-2 h-12 w-12" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" stroke="var(--glass-border)" strokeWidth="2" fill="none" />
        <motion.circle cx="18" cy="18" r="14" stroke={c} strokeWidth="2" fill="none" strokeDasharray="88" initial={{ strokeDashoffset: 88 }} animate={{ strokeDashoffset: 22 }} transition={{ duration: 1.5 }} strokeLinecap="round" transform="rotate(-90 18 18)" />
      </svg>
    </motion.div>
  );
}

function IndustriesGrid() {
  return (
    <div>
      <h3 className="font-bold mb-4">Live Industry Monitoring</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {monitoredIndustries.map((ind, i) => (
          <motion.div key={ind.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-2xl overflow-hidden border border-glass-border hover:border-cyan/40 transition">
            <div className="relative h-32 bg-slate-900 overflow-hidden">
              <img src={ind.img} alt={ind.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent dark:from-card dark:via-card/40" />
              <div className="absolute top-3 right-3">
                <StatusPill status={ind.status} />
              </div>
              <div className="absolute bottom-3 left-3">
                <div className="text-xs text-cyan font-bold drop-shadow-md">{ind.sector}</div>
                <div className="font-bold text-sm text-white drop-shadow-md">{ind.name}</div>
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <Mini label="CTO" value={`${ind.cto}%`} bar={ind.cto} color={ind.cto > 80 ? "danger" : ind.cto > 60 ? "warn" : "eco"} />
              <Mini label="Reuse" value={`${ind.reuse}%`} bar={ind.reuse} color="cyan" />
              <Mini label="Use" value={ind.consumption} bar={70} color="cyan" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value, bar, color }: any) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
      <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${bar}%` }} className="h-full" style={{ background: `var(--${color})` }} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: any = { ok: { c: "eco", t: "Stable" }, warn: { c: "warn", t: "Warning" }, danger: { c: "danger", t: "Critical" } };
  const m = map[status];
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold glass border" style={{ borderColor: `var(--${m.c})`, color: `var(--${m.c})` }}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${m.c})` }} />{m.t}
    </div>
  );
}

function IndustriesView() {
  return (
    <div className="space-y-6">
      <h3 className="font-bold">Industry Comparison Center</h3>
      <div className="glass-strong rounded-2xl p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-glass-border text-xs text-muted-foreground uppercase">
              <th className="text-left py-3">Industry</th><th className="text-left">Sector</th><th>CTO</th><th>Reuse</th><th>Compliance</th><th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {monitoredIndustries.map(i => (
              <tr key={i.name} className="border-b border-glass-border last:border-0">
                <td className="py-3 font-medium">{i.name}</td>
                <td className="text-muted-foreground">{i.sector}</td>
                <td className="text-center"><BarCell v={i.cto} color={i.cto > 80 ? "danger" : "cyan"} /></td>
                <td className="text-center"><BarCell v={i.reuse} color="eco" /></td>
                <td className="text-center font-bold">{100 - Math.floor(i.cto / 4)}%</td>
                <td className="text-center"><StatusPill status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IndustriesGrid />
    </div>
  );
}
function BarCell({ v, color }: any) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-xs">{v}%</span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full" style={{ width: `${v}%`, background: `var(--${color})` }} />
      </div>
    </div>
  );
}

function Compliance() {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {monitoredIndustries.map(i => (
        <div key={i.name} className="glass-strong rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-muted-foreground">{i.sector}</div>
              <div className="font-bold">{i.name}</div>
            </div>
            <StatusPill status={i.status} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <WaterTank fill={i.cto} label="CTO Usage" status={i.cto > 80 ? "danger" : i.cto > 60 ? "warn" : "ok"} />
            <WaterTank fill={i.reuse} label="Reuse" status="ok" />
            <WaterTank fill={100 - Math.floor(i.cto / 4)} label="Compliance" status="ok" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Alerts() {
  const alerts = [
    { t: "CTO Threshold Exceeded", desc: "MetalWorks Steel Co. exceeded 90% CTO limit", sev: "danger", time: "2m ago" },
    { t: "Abnormal Consumption", desc: "Textile Mills Ltd water usage +18% above baseline", sev: "warn", time: "12m ago" },
    { t: "pH Imbalance", desc: "PharmaCare Labs pH dropped to 5.8", sev: "warn", time: "34m ago" },
    { t: "Low Reuse Efficiency", desc: "GreenPaper Industries reuse fell below target", sev: "warn", time: "1h ago" },
    { t: "Compliance Restored", desc: "FreshFoods Processing back within limits", sev: "ok", time: "2h ago" },
  ];
  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          className="glass-strong rounded-2xl p-5 flex items-start gap-4 border-l-4" style={{ borderLeftColor: `var(--${a.sev})` }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in oklab, var(--${a.sev}) 20%, transparent)` }}>
            <AlertTriangle className="h-5 w-5" style={{ color: `var(--${a.sev})` }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{a.t}</div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AIPanel() {
  const insights = [
    { t: "Pharma may exceed CTO limits within 48h", c: "warn", icon: TrendingUp },
    { t: "Textile reuse can improve by 12% with cycle adjustment", c: "cyan", icon: Sparkles },
    { t: "Steel sector water saving opportunity: 4.2 ML/day", c: "eco", icon: TrendingDown },
    { t: "Anomaly detected in Food Processing pH variance", c: "warn", icon: Activity },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="glass-strong rounded-2xl p-6 md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl gradient-cyan flex items-center justify-center"><Brain className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="font-bold">HydroNexa AI · Predictive Engine</div>
            <div className="text-xs text-muted-foreground">Live model · v3.2 · Confidence 94%</div>
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-xs text-eco"><span className="h-1.5 w-1.5 rounded-full bg-eco animate-pulse" /> Active</div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 border-l-2" style={{ borderLeftColor: `var(--${ins.c})` }}>
              <ins.icon className="h-4 w-4 mt-0.5" style={{ color: `var(--${ins.c})` }} />
              <div className="text-sm">{ins.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-strong rounded-2xl p-6">
        <h4 className="font-bold mb-4">Sustainability Score Forecast</h4>
        <div className="text-5xl font-bold text-gradient">82.4</div>
        <div className="text-xs text-muted-foreground">Projected 30-day national score</div>
        <div className="mt-6 space-y-2">
          {["Water Saved", "Reuse Efficiency", "Compliance Adherence"].map((l, i) => (
            <div key={l}>
              <div className="flex justify-between text-xs"><span>{l}</span><span className="text-cyan">{[78, 84, 91][i]}</span></div>
              <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${[78, 84, 91][i]}%` }} className="h-full gradient-cyan" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-strong rounded-2xl p-6">
        <h4 className="font-bold mb-4">Anomaly Heatmap</h4>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 84 }).map((_, i) => {
            const v = Math.random();
            return <div key={i} className="aspect-square rounded-sm" style={{ background: `color-mix(in oklab, var(--${v > 0.85 ? "danger" : v > 0.6 ? "warn" : "cyan"}) ${Math.floor(v * 100)}%, var(--muted))` }} />;
          })}
        </div>
      </div>
    </div>
  );
}

function MailCenter() {
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
                 {sending ? "Transmitting..." : "Send Secure Warning"}
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

function PresetBtn({ label, onClick }: any) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl glass border border-glass-border text-[10px] font-black uppercase tracking-tighter hover:border-cyan hover:text-cyan transition-all">
       {label}
    </button>
  );
}
function TextField({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none disabled:opacity-60" />
    </div>
  );
}
function SelectField({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none appearance-none">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Reports() {
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {["Monthly Compliance Report", "National Sustainability Index", "AI Anomaly Digest", "Sector-wise Water Audit", "Critical Incident Log", "Reuse Efficiency Report"].map((r, i) => (
        <div key={r} className="glass-strong rounded-2xl p-5 hover:border-cyan/40 border border-transparent transition">
          <FileText className="h-6 w-6 text-cyan mb-3" />
          <h4 className="font-bold">{r}</h4>
          <p className="text-xs text-muted-foreground mt-1">Generated · {["Today", "Yesterday", "2 days ago"][i % 3]}</p>
          <button className="mt-4 text-xs px-3 py-1.5 rounded-full glass border border-glass-border hover:border-cyan transition">Download PDF</button>
        </div>
      ))}
    </div>
  );
}
// function Stub({ title }: { title: string }) {
//   return <div className="glass-strong rounded-2xl p-12 text-center text-muted-foreground">{title} · Coming online</div>;
// }
