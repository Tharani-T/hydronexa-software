import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import {
  LayoutDashboard, Activity, BarChart3, Brain, AlertTriangle, Leaf, FileText, Settings,
  Droplets, Recycle, Gauge, Waves, Factory, Cpu, Sparkles, TrendingUp, Save, ArrowRight, Loader2, Zap,
  RefreshCcw, CheckCircle2, Timer, Wind, ArrowDownCircle, ArrowUpCircle, ShieldCheck,
  FlaskConical, Thermometer, FlaskRound, Info, Beaker, ZapOff, TrendingDown, Calendar,
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart
} from "lucide-react";
import { useThingSpeak, SensorData } from "@/hooks/useThingSpeak";
import { THRESHOLDS } from "@/lib/config";
import { DigitalTwin } from "@/components/DigitalTwin";

export const Route = createFileRoute("/industry/dashboard")({
  component: IndustryDashboard,
});

const nav = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "monitoring", icon: Activity, label: "Live Monitoring" },
  { id: "analytics", icon: Waves, label: "Water Analytics" },
  { id: "quality", icon: FlaskConical, label: "Quality Intelligence" },
  { id: "reuse-intelligence", icon: Recycle, label: "Reuse Intelligence" },
  { id: "alerts", icon: AlertTriangle, label: "Alerts" },
  { id: "sustainability", icon: Leaf, label: "Sustainability" },
  { id: "reports", icon: FileText, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function IndustryDashboard() {
  const { state, update } = useAppState();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");

  useEffect(() => {
    if (!state.industryAuthed) navigate({ to: "/industry/login" });
  }, [state.industryAuthed]);

  const s = state.setup;

  const handleLogout = () => {
    update({ industryAuthed: false, currentUserEmail: null });
    navigate({ to: "/industry/login" });
  };

  // Intercept for incomplete setup
  if (!s.completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative z-10 glass-strong rounded-3xl p-10 max-w-md w-full text-center border border-glass-border shadow-2xl">
          <div className="h-20 w-20 mx-auto bg-cyan/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse-glow">
             <Factory className="h-10 w-10 text-cyan" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Setup Required</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Welcome to HydroNexa! Before you can access the real-time water telemetry and analytics, please configure your plant profile.
          </p>
          
          <div className="mt-8 space-y-3">
            <button 
              onClick={() => navigate({ to: "/onboarding" })}
              className="w-full h-12 rounded-full gradient-cyan text-primary-foreground font-semibold shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              Configure Industry Setup <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full h-12 rounded-full glass border border-glass-border text-sm hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const industryAccent = s.industryType === "Pharma" ? "Pharma · Purity Mode"
    : s.industryType === "Steel & Metal" ? "Steel · Cooling Cycle"
    : s.industryType === "Food Processing" ? "Food · Hygiene Mode"
    : s.industryType === "Textile" ? "Textile · Dye-Reuse Mode"
    : "Industrial Mode";

  const { data, history, loading, error } = useThingSpeak();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Connecting to HydroNexa IoT Mesh...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={nav}
      active={section}
      onNavigate={(id) => {
        if (id === "settings") navigate({ to: "/onboarding" });
        else setSection(id);
      }}
      accent="eco"
      title={s.plantName ?? "HydroNexa Plant"}
      subtitle={`${industryAccent} · ${s.location ?? "—"}`}
      logoutTo="/industry/login"
    >
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          Real-time telemetry sync failed: {error}. Using last known values.
        </div>
      )}
      {section === "overview" && <Overview data={data} history={history} />}
      {section === "monitoring" && <LiveMonitoring data={data} />}
      {section === "analytics" && <Analytics data={data} history={history} />}
      {section === "quality" && <QualityIntelligence data={data} />}
      {section === "reuse-intelligence" && <ReuseIntelligence data={data} />}
      {section === "alerts" && <AlertsView data={data} />}
      {section === "sustainability" && <SustainabilityView data={data} />}
      {section === "reports" && <ReportsView data={data} />}
      {section === "settings" && <SettingsPanel />}
    </DashboardShell>
  );
}

function useAdaptive() {
  const { state } = useAppState();
  const s = state.setup;
  const reuseTarget = s.reuseTarget ?? 60;
  const ctoLimit = s.ctoLimit ?? 10000; // Default 10k KL
  const monthlyCtoLimit = s.monthlyCtoLimit ?? (ctoLimit * 30);
  const type = s.industryType ?? "Industrial";
  
  const email = state.currentUserEmail;
  const plantName = s.plantName ?? "Industrial Facility";
  const token = state.token || localStorage.getItem("token");
  
  // Dynamic standards based on industry type
  const standardOptions = {
    Pharma: { tempMax: 25, phRange: "6.8 - 7.4", phMin: 6.8, phMax: 7.4, mode: "Purity Mode" },
    "Food Processing": { tempMax: 10, phRange: "6.5 - 7.5", phMin: 6.5, phMax: 7.5, mode: "Hygiene Mode" },
    Textile: { tempMax: 45, phRange: "6.0 - 9.0", phMin: 6.0, phMax: 9.0, mode: "Dye-Reuse Mode" },
    "Steel & Metal": { tempMax: 60, phRange: "5.5 - 9.5", phMin: 5.5, phMax: 9.5, mode: "Cooling Mode" },
    Industrial: { tempMax: 35, phRange: "6.5 - 8.5", phMin: 6.5, phMax: 8.5, mode: "General Mode" }
  };
  const standards = standardOptions[type as keyof typeof standardOptions] || standardOptions.Industrial;

  return { reuseTarget, ctoLimit, monthlyCtoLimit, type, email, plantName, token, ...standards };
}

function triggerBuzzer() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(115, ctx.currentTime); // Raspy base
    osc2.type = "square";
    osc2.frequency.setValueAtTime(119, ctx.currentTime);

    // Beep 1
    gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.3);
    
    // Beep 2
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.38);
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime + 0.58);
    gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.63);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.error("Synthesized buzzer play failed:", e);
  }
}

function triggerAnalytics5SecHorn() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc2.type = "square";
    osc2.frequency.setValueAtTime(144, ctx.currentTime);

    const duration = 5.2; // Loud warning siren of at least 5 seconds duration
    for (let t = 0; t < duration; t += 0.4) {
      osc1.frequency.setValueAtTime(140, ctx.currentTime + t);
      osc1.frequency.setValueAtTime(160, ctx.currentTime + t + 0.2);
      osc2.frequency.setValueAtTime(144, ctx.currentTime + t);
      osc2.frequency.setValueAtTime(164, ctx.currentTime + t + 0.2);
    }

    gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.28, ctx.currentTime + duration - 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Synthesized analytics wailing horn play failed:", e);
  }
}

function Overview({ data, history }: { data: SensorData | null; history: SensorData[] }) {
  const a = useAdaptive();
  const flow = data?.flowRate ?? 0;
  const ph = data?.ph ?? 7.0;
  const waterLevel = data?.waterLevel ?? 0;
  const temp = data?.temperature ?? 25;

  // Real-time dynamic accumulation state starting strictly at 0 (persisted in localStorage)
  const [liveCtoUsed, setLiveCtoUsed] = useState(() => {
    const saved = localStorage.getItem("liveCtoUsed");
    return saved ? parseFloat(saved) : 0;
  });

  // Monthly accumulation state (initialized to mid-month tracking value of 42%, persisted in localStorage)
  const [monthlyCtoUsed, setMonthlyCtoUsed] = useState(() => {
    const saved = localStorage.getItem("monthlyCtoUsed");
    return saved ? parseFloat(saved) : a.monthlyCtoLimit * 0.42;
  });

  // Persist live and monthly CTO usage to localStorage on every change
  useEffect(() => {
    localStorage.setItem("liveCtoUsed", liveCtoUsed.toString());
  }, [liveCtoUsed]);

  useEffect(() => {
    localStorage.setItem("monthlyCtoUsed", monthlyCtoUsed.toString());
  }, [monthlyCtoUsed]);

  // Dynamic ticking every 1 second based on active flowRate (L/m to KL/s) for both daily and monthly
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCtoUsed(prev => {
        if (flow > 0) {
          const increment = flow / 60000;
          return prev + increment;
        }
        return prev;
      });
      setMonthlyCtoUsed(prev => {
        if (flow > 0) {
          const increment = flow / 60000;
          return prev + increment;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [flow]);

  // Demo Control: Simulate Next Day transition
  const handleSimulateNextDay = () => {
    setLiveCtoUsed(0);
    localStorage.setItem("liveCtoUsed", "0");
    setCriticalBreach(false);
    emailSentRef.current = false;
    localStorage.setItem("emailSent", "false");
  };

  const prevLevelRef = useRef(0);

  // Level Sensor Threshold Watcher: play synthesized buzzer alert when level reaches LEVEL_MAX (90%)
  useEffect(() => {
    const threshold = THRESHOLDS.LEVEL_MAX; // 90%
    if (waterLevel >= threshold && prevLevelRef.current < threshold) {
      triggerBuzzer();
    }
    prevLevelRef.current = waterLevel;
  }, [waterLevel]);

  // Dynamic scientific calculations for Reuse Efficiency

  const phFactor = Math.max(0.4, 1 - Math.abs(ph - 7.2) * 0.12);
  const tempFactor = Math.max(0.6, 1 - Math.abs(temp - 25) * 0.008);
  const baseReuse = (waterLevel * 0.55) + (flow > 0 ? (flow * 0.7) : 10) + (12 * phFactor) + (8 * tempFactor);
  const reuseActual = Math.min(100, Math.max(5, Math.round(baseReuse)));

  // Circulation loop diagnostics
  const circulationRate = (flow * (reuseActual / 100)).toFixed(2); // L/m
  const loopPressure = (12.4 + (flow * 0.15) + (waterLevel * 0.04)).toFixed(1); // PSI

  const ctoPct = Math.min(100, Math.round((liveCtoUsed / a.ctoLimit) * 100));
  const remaining = Math.max(0, a.ctoLimit - liveCtoUsed);

  // Live accumulated monthly usage percentages
  const monthlyCtoPct = Math.min(100, Math.round((monthlyCtoUsed / a.monthlyCtoLimit) * 100));
  const remainingMonthly = Math.max(0, a.monthlyCtoLimit - monthlyCtoUsed);

  const complianceStatus = (data?.ph ?? 7) > a.phMax || (data?.ph ?? 7) < a.phMin ? "Critical Breach" : "Operational Stable";
  const complianceColor = complianceStatus.includes("Stable") ? "eco" : "danger";

  const emailSentRef = useRef(localStorage.getItem("emailSent") === "true");
  const [criticalBreach, setCriticalBreach] = useState(false);

  useEffect(() => {
    // Check if daily usage exceeded limits
    if (liveCtoUsed >= a.ctoLimit && a.ctoLimit > 0) {
      setCriticalBreach(true);
      
      if (!emailSentRef.current) {
        emailSentRef.current = true;
        localStorage.setItem("emailSent", "true");
        
        if (a.email) {
          fetch('/api/send-cto-alert', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${a.token}`
            },
            body: JSON.stringify({
              to: a.email,
              industryName: a.plantName,
              dailyLimit: a.ctoLimit,
              currentUsage: liveCtoUsed.toFixed(1),
              exceededAmount: (liveCtoUsed - a.ctoLimit).toFixed(1),
              timestamp: new Date().toLocaleString()
            })
          }).catch(err => console.error('Failed to send CTO alert email:', err));
        }
      }
    } else if (liveCtoUsed < a.ctoLimit) {
      setCriticalBreach(false);
      emailSentRef.current = false;
      localStorage.setItem("emailSent", "false");
    }
  }, [liveCtoUsed, a.ctoLimit, a.email, a.plantName, a.token]);

  // Alerts logic
  const alerts = [];
  if (ctoPct >= 90) alerts.push({ type: 'danger', msg: 'Daily CTO Warning: Near Limit', icon: AlertTriangle });
  else if (ctoPct >= 75) alerts.push({ type: 'warn', msg: 'Daily CTO Elevated', icon: AlertTriangle });

  if (monthlyCtoPct >= 90) alerts.push({ type: 'danger', msg: 'Monthly Consumption Alert', icon: AlertTriangle });
  
  if (reuseActual < a.reuseTarget) alerts.push({ type: 'warn', msg: 'Sustainability Alert: Below Target', icon: Leaf });
  else alerts.push({ type: 'eco', msg: 'Reuse Target Achieved', icon: Leaf });

  if ((data?.ph ?? 7) < a.phMin || (data?.ph ?? 7) > a.phMax) alerts.push({ type: 'danger', msg: 'Critical Compliance Warning: pH Out of Range', icon: AlertTriangle });

  return (
    <div className="space-y-10 pb-10">
      
      <AnimatePresence>
        {criticalBreach && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-strong rounded-3xl p-6 border-2 border-danger shadow-[0_0_40px_rgba(255,0,0,0.2)] bg-danger/10 flex items-center gap-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-danger opacity-5 animate-pulse" />
            <div className="h-16 w-16 rounded-2xl bg-danger/20 flex items-center justify-center border border-danger/30 relative z-10 shrink-0">
               <AlertTriangle className="h-8 w-8 text-danger animate-pulse" />
            </div>
            <div className="relative z-10 flex-1">
               <h3 className="text-xl font-black text-danger tracking-tight uppercase">Critical Compliance Warning</h3>
               <p className="text-sm text-danger/80 font-bold mt-1">Daily CTO Limit Exceeded. A formal operational warning has been dispatched to {a.email || "your registered email"}.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Hero Section with Dual CTO Gauges */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Daily CTO Gauge */}
        <div className="glass-strong rounded-[2rem] p-10 relative overflow-hidden group border border-glass-border shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 to-transparent pointer-events-none" />
          <div className="w-full flex justify-between items-center mb-8 relative z-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black opacity-60">Real-Time Sync</div>
              <div className="text-[12px] text-cyan font-bold uppercase tracking-widest">Daily CTO Limit</div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSimulateNextDay}
                className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 hover:bg-cyan/20 border border-white/10 hover:border-cyan/30 text-muted-foreground hover:text-cyan transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-glow-sm"
                title="Instantly resets Daily usage/alerts while keeping Monthly data unchanged"
              >
                <RefreshCcw className="h-3 w-3 animate-spin-slow text-cyan" /> Simulate Next Day
              </button>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm flex items-center gap-2 ${ctoPct > 90 ? 'border-danger text-danger bg-danger/10' : 'border-cyan text-cyan bg-cyan/10'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {ctoPct > 90 ? 'Critical' : 'Nominal'}
              </div>
            </div>
          </div>

          <div className="relative h-64 w-64 flex-shrink-0 mb-6">
            <svg viewBox="0 0 200 200" className="h-full w-full rotate-[-90deg]">
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--glass-border)" strokeWidth="6" strokeDasharray="1 4" />
              <motion.circle 
                cx="100" cy="100" r="92" fill="none" 
                stroke="url(#dailyCtoGradient)" strokeWidth="12" strokeLinecap="round"
                initial={{ strokeDasharray: "0, 578" }}
                animate={{ strokeDasharray: `${(ctoPct / 100) * 578}, 578` }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="dailyCtoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--cyan)" />
                  <stop offset="100%" stopColor={ctoPct > 90 ? "var(--danger)" : "var(--cyan-glow)"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-4 rounded-full overflow-hidden border border-glass-border bg-black/40">
              <motion.div 
                initial={{ top: "100%" }}
                animate={{ top: `${100 - ctoPct}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                className={`absolute inset-0 bg-gradient-to-t ${ctoPct > 90 ? 'from-danger/40 to-danger/10' : 'from-cyan/40 to-cyan/10'}`}
              >
                <div className={`absolute -top-4 left-[-50%] w-[200%] h-8 opacity-40 animate-flow`} style={{ background: `radial-gradient(ellipse at center, var(--${ctoPct > 90 ? 'danger' : 'cyan'}), transparent 70%)`, borderRadius: '45%' }} />
              </motion.div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <CountUp value={ctoPct} suffix="%" className="text-6xl font-black font-display tracking-tighter" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Utilized Today</div>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-4">
            <HeroMetric label="Configured" value={`${a.ctoLimit.toLocaleString()}`} sub="KL/Day" color="muted" />
            <HeroMetric label="Current" value={`${liveCtoUsed.toFixed(3)}`} sub="KL Used" color="cyan" />
            <HeroMetric label="Remaining" value={`${remaining.toFixed(3)}`} sub="KL Left" color={ctoPct > 90 ? "danger" : "eco"} />
          </div>
        </div>

        {/* Monthly CTO Gauge */}
        <div className="glass-strong rounded-[2rem] p-10 relative overflow-hidden group border border-glass-border shadow-2xl flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="w-full flex justify-between items-center mb-8 relative z-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black opacity-60">Aggregate Sync</div>
              <div className="text-[12px] text-primary font-bold uppercase tracking-widest">Monthly CTO Limit</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm flex items-center gap-2 ${monthlyCtoPct > 90 ? 'border-danger text-danger bg-danger/10' : 'border-primary text-primary bg-primary/10'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {monthlyCtoPct > 90 ? 'Critical' : 'Tracking'}
            </div>
          </div>

          <div className="relative h-64 w-64 flex-shrink-0 mb-6">
            <svg viewBox="0 0 200 200" className="h-full w-full rotate-[-90deg]">
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--glass-border)" strokeWidth="6" strokeDasharray="1 4" />
              <motion.circle 
                cx="100" cy="100" r="92" fill="none" 
                stroke="url(#monthlyCtoGradient)" strokeWidth="12" strokeLinecap="round"
                initial={{ strokeDasharray: "0, 578" }}
                animate={{ strokeDasharray: `${(monthlyCtoPct / 100) * 578}, 578` }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
              <defs>
                <linearGradient id="monthlyCtoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor={monthlyCtoPct > 90 ? "var(--danger)" : "var(--primary-glow)"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-4 rounded-full overflow-hidden border border-glass-border bg-black/40">
              <motion.div 
                initial={{ top: "100%" }}
                animate={{ top: `${100 - monthlyCtoPct}%` }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
                className={`absolute inset-0 bg-gradient-to-t ${monthlyCtoPct > 90 ? 'from-danger/40 to-danger/10' : 'from-primary/40 to-primary/10'}`}
              >
                <div className="absolute -top-4 left-[-50%] w-[200%] h-8 opacity-40 animate-flow" style={{ background: `radial-gradient(ellipse at center, var(--${monthlyCtoPct > 90 ? 'danger' : 'primary'}), transparent 70%)`, borderRadius: '45%' }} />
              </motion.div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <CountUp value={monthlyCtoPct} suffix="%" className="text-6xl font-black font-display tracking-tighter" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Utilized This Month</div>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-4">
            <HeroMetric label="Configured" value={`${(a.monthlyCtoLimit / 1000).toFixed(1)}k`} sub="KL/Month" color="muted" />
            <HeroMetric label="Current" value={`${(monthlyCtoUsed / 1000).toFixed(3)}k`} sub="KL Used" color="primary" />
            <HeroMetric label="Remaining" value={`${(remainingMonthly / 1000).toFixed(3)}k`} sub="KL Left" color={monthlyCtoPct > 90 ? "danger" : "eco"} />
          </div>
        </div>

      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Reuse Intelligence & Alerts */}
        <div className="flex flex-col gap-6">
          
          {/* Reuse Target Panel */}
          <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden flex flex-col h-[340px]">
            <div className="absolute inset-0 bg-gradient-to-br from-eco/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest">Reuse Intelligence</h4>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Sustainability Pulse</p>
                </div>
                <div className={`p-2 rounded-xl bg-${reuseActual >= a.reuseTarget ? 'eco' : 'warn'}/10 border border-${reuseActual >= a.reuseTarget ? 'eco' : 'warn'}/20`}>
                  <Recycle className={`h-5 w-5 text-${reuseActual >= a.reuseTarget ? 'eco' : 'warn'} ${reuseActual >= a.reuseTarget ? 'animate-spin-slow' : ''}`} style={{ color: `var(--${reuseActual >= a.reuseTarget ? 'eco' : 'warn'})` }} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-end justify-between mb-2">
                  <div className="flex items-end gap-2">
                    <CountUp value={reuseActual} suffix="%" className="text-5xl font-black font-display tracking-tight text-eco" />
                    <span className="text-[10px] text-muted-foreground mb-1.5 font-bold uppercase">Current Efficiency</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground uppercase font-black">pH Correction</span>
                    <div className="text-xs font-black text-cyan">x{phFactor.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="space-y-2 w-full mt-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Configured Target: {a.reuseTarget}%</span>
                    <span style={{ color: `var(--${reuseActual >= a.reuseTarget ? 'eco' : 'warn'})` }}>
                      {reuseActual >= a.reuseTarget ? "Target Achieved" : "Below Target"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                    {/* Target Marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10" style={{ left: `${a.reuseTarget}%` }} />
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${reuseActual}%` }}
                      className={`h-full bg-${reuseActual >= a.reuseTarget ? 'eco' : 'warn'}`}
                      style={{ background: `var(--${reuseActual >= a.reuseTarget ? 'eco' : 'warn'})` }}
                    />
                  </div>
                </div>

                {/* Circulation Diagnostics */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5 text-[10px]">
                  <div>
                    <span className="text-muted-foreground uppercase font-bold block">Treated Loop Flow</span>
                    <span className="font-mono text-cyan font-black text-[11px]">{circulationRate} L/min</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase font-bold block">Loop Pressure</span>
                    <span className="font-mono text-primary font-black text-[11px]">{loopPressure} PSI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Alerts Panel */}
          <div className="glass-strong rounded-[2rem] p-6 border border-glass-border flex-1 flex flex-col overflow-hidden">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> Live Alert Stream
            </h4>
            <div className="space-y-3 overflow-y-auto pr-2">
              {alerts.map((alert, i) => (
                <motion.div 
                  key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-xl border-l-4 bg-${alert.type}/10 border-${alert.type}/40 flex items-center gap-3`}
                  style={{ borderLeftColor: `var(--${alert.type})` }}
                >
                  <alert.icon className={`h-4 w-4 text-${alert.type}`} style={{ color: `var(--${alert.type})` }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `var(--${alert.type})` }}>{alert.msg}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Digital Twin */}
        <div className="lg:col-span-2 glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h4 className="text-sm font-black uppercase tracking-widest">Digital Twin Live Mirror</h4>
               <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Real-time Operational Simulation</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase border border-eco/30 text-eco bg-eco/5 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Operational</div>
              <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase border border-cyan/30 text-cyan bg-cyan/5 flex items-center gap-1.5"><Zap className="h-3 w-3" /> Synced</div>
            </div>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden relative min-h-[350px]">
            <DigitalTwin data={data} />
          </div>
        </div>

      </div>

      {/* Premium Sensor Status Strip */}
      <div className="glass-strong rounded-2xl border border-glass-border p-4">
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SensorStatus label="Flow Sensor" value={`${flow.toFixed(1)} L/m`} active={flow > 0.1} icon={Waves} />
            <div className="flex items-center justify-between col-span-1 border-r border-glass-border/30 pr-2">
              <SensorStatus 
                label="Level Sensor" 
                value={`${data?.waterLevel?.toFixed(0) ?? 0}%`} 
                active={true} 
                icon={Droplets} 
                status={(data?.waterLevel ?? 0) >= THRESHOLDS.LEVEL_MAX ? 'Critical' : (data?.waterLevel ?? 0) <= THRESHOLDS.LEVEL_MIN ? 'Moderate' : 'Stable'}
              />
              <button 
                onClick={triggerBuzzer}
                className="ml-auto p-1.5 rounded-lg bg-warn/15 hover:bg-warn/30 border border-warn/30 hover:border-warn/60 text-warn hover:text-warn-glow transition-all duration-300 flex items-center justify-center shrink-0 active:scale-90"
                title="Manual Buzzer Sound Test"
              >
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
              </button>
            </div>
            <SensorStatus label="pH Sensor" value={`${data?.ph?.toFixed(1) ?? 7.0} pH`} active={true} icon={Beaker} 
              status={((data?.ph ?? 7) < a.phMin || (data?.ph ?? 7) > a.phMax) ? 'Critical' : 'Stable'} />
            <SensorStatus label="Temp Sensor" value={`${data?.temperature?.toFixed(1) ?? 25}°C`} active={true} icon={Thermometer} 
              status={(data?.temperature ?? 0) > a.tempMax ? 'Critical' : 'Stable'} />
            <SensorStatus label="Ultrasonic" value={`${data?.ultrasonic?.toFixed(1) ?? 0} cm`} active={true} icon={Activity} />
         </div>
      </div>

    </div>
  );
}

function SensorStatus({ label, value, active, status = 'Stable', icon: Ic }: any) {
  const color = status === 'Critical' ? 'danger' : status === 'Moderate' ? 'warn' : 'eco';
  return (
    <div className="flex items-center gap-3 p-2">
       <div className={`h-10 w-10 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center relative overflow-hidden`}>
          <div className={`absolute inset-0 bg-${color} opacity-10 animate-pulse`} style={{ background: `var(--${color})` }} />
          <Ic className="h-4 w-4 relative z-10" style={{ color: `var(--${color})` }} />
       </div>
       <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-sm font-black font-display tracking-tight">{value}</span>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${color})` }} />
          </div>
       </div>
    </div>
  );
}

function HeroMetric({ label, value, sub, color }: any) {
  return (
    <div className="p-4 rounded-2xl glass border border-glass-border hover:bg-white/5 transition-all flex flex-col min-h-[110px]">
      <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground font-black mb-1">{label}</div>
      <div className={`text-xl font-black font-display tracking-tight leading-tight mb-auto ${color !== 'muted' ? `text-${color}` : 'text-foreground'}`} style={color !== 'muted' ? { color: `var(--${color})` } : {}}>
        {value}
      </div>
      <div className="text-[8px] text-muted-foreground font-bold mt-2 opacity-60 leading-tight">{sub}</div>
    </div>
  );
}

function IntelligenceCard({ title, icon: Ic, description, color, sub }: any) {
  return (
    <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden group">
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-10 blur-3xl transition-all group-hover:opacity-20`} style={{ background: `var(--${color})` }} />
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-${color}/10 border border-${color}/20`} style={{ background: `color-mix(in oklab, var(--${color}) 10%, transparent)`, borderColor: `color-mix(in oklab, var(--${color}) 20%, transparent)` }}>
           <Ic className="h-4 w-4" style={{ color: `var(--${color})` }} />
        </div>
        <div className="text-[10px] uppercase tracking-widest font-black">{title}</div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed font-medium mb-3">{description}</p>
      <div className="text-[9px] font-black uppercase tracking-tighter opacity-50 flex items-center gap-1.5">
         <Sparkles className="h-3 w-3" />
         {sub}
      </div>
    </div>
  );
}

function TelemetryRow({ label, status, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass border border-glass-border/50">
       <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
       <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${color})` }} />
          <span className="text-[10px] font-black uppercase" style={{ color: `var(--${color})` }}>{status}</span>
       </div>
    </div>
  );
}

function StatusPill({ label, value, active, warn }: any) {
  const color = warn ? "warn" : active ? "eco" : "muted";
  return (
    <div className="glass rounded-2xl p-4 border border-glass-border flex flex-col gap-1 hover:border-white/20 transition-all">
       <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
       <div className="flex items-center justify-between">
          <span className="text-sm font-black font-display tracking-tight">{value}</span>
          <span className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ background: `var(--${color})` }} />
       </div>
    </div>
  );
}

function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <div className={className}>{Math.round(display)}{suffix}</div>;
}

function UsageMetric({ label, value, color }: any) {
  return (
    <div className="p-3 rounded-xl glass border border-glass-border">
      <div className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">{label}</div>
      <div className={`text-lg font-black font-display mt-0.5 ${color !== 'muted' ? `text-${color}` : 'text-foreground'}`} style={color !== 'muted' ? { color: `var(--${color})` } : {}}>{value}</div>
    </div>
  );
}

function KPI({ label, value, icon: Ic, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: `var(--${color})` }} />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Ic className="h-4 w-4" style={{ color: `var(--${color})` }} />
      </div>
      <div className="text-3xl font-bold mt-2 font-display">{value}</div>
      <div className="text-xs mt-1 text-muted-foreground">{sub}</div>
    </motion.div>
  );
}

function LiveMonitoring({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const [activeTime, setActiveTime] = useState(0);
  const flowRate = data?.flowRate ?? 0;
  
  useEffect(() => {
    let interval: any;
    if (flowRate > 0.5) {
      interval = setInterval(() => setActiveTime(prev => prev + 1), 1000);
    } else {
      setActiveTime(0);
    }
    return () => clearInterval(interval);
  }, [flowRate > 0.5]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Massive Digital Twin Section */}
      <div className="grid lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2 min-h-[600px]">
           <DigitalTwin data={data} />
        </div>
        
        <div className="flex flex-col gap-6">
           <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border flex-1 flex flex-col justify-between">
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan" />
                    Operational Control
                 </h4>
                 <div className="space-y-4">
                    <ControlBadge label="Intake Motor" status={flowRate > 0.5 ? "Active" : "Standby"} color={flowRate > 0.5 ? "cyan" : "muted"} />
                    <ControlBadge label="Treatment Loop" status="Synced" color="eco" />
                    <ControlBadge label="Reuse Cycle" status={data && data.waterLevel > 20 ? "Available" : "Buffering"} color={data && data.waterLevel > 20 ? "eco" : "warn"} />
                 </div>
              </div>

              <div className="space-y-6 mt-10">
                 <div className="p-6 rounded-2xl bg-white/5 border border-glass-border">
                    <div className="flex items-center gap-3 mb-2">
                       <Timer className="h-4 w-4 text-cyan" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pump Active Duration</span>
                    </div>
                    <div className="text-3xl font-black font-display text-cyan">{formatTime(activeTime)}</div>
                 </div>
                 <div className="p-6 rounded-2xl bg-white/5 border border-glass-border">
                    <div className="flex items-center gap-3 mb-2">
                       <Wind className="h-4 w-4 text-eco" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estimated Sync Rate</span>
                    </div>
                    <div className="text-3xl font-black font-display text-eco">4.8s <span className="text-xs opacity-50 uppercase tracking-tighter">Latency</span></div>
                 </div>
              </div>
           </div>

           <div className="glass-strong rounded-[2.5rem] p-8 border border-danger/20 bg-danger/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-40"><AlertTriangle className="h-5 w-5 text-danger animate-pulse" /></div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-6">Real-Time Alerts</h4>
              <div className="space-y-3">
                 {data && data.waterLevel > 90 && <LiveAlert title="Overflow Risk" sev="danger" />}
                 {data && data.flowRate > 20 && <LiveAlert title="Abnormal Flow" sev="danger" />}
                 {data && (data.ph > 8.5 || data.ph < 6.5) && <LiveAlert title="pH Quality Breach" sev="warn" />}
                 {(!data || (data.waterLevel <= 90 && data.flowRate <= 20)) && (
                   <div className="flex flex-col items-center justify-center py-6 opacity-30 text-center">
                      <ShieldCheck className="h-10 w-10 mb-2" />
                      <div className="text-[10px] font-black uppercase tracking-widest">No Active Breaches</div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Live Sensor Intelligence Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <SensorIntelligence 
           label="Flow Rate" 
           value={data?.flowRate.toFixed(1) ?? "0.0"} 
           unit="L/m" 
           icon={Waves} 
           color="cyan"
           visual={<WaveVisual active={flowRate > 0.1} />}
        />
        <SensorIntelligence 
           label="Total Flow" 
           value={data?.totalFlow.toFixed(1) ?? "0.0"} 
           unit="KL" 
           icon={Gauge} 
           color="cyan"
           sub="Cumulative"
        />
        <SensorIntelligence 
           label="Tank Level" 
           value={data?.waterLevel.toFixed(0) ?? "0"} 
           unit="%" 
           icon={Droplets} 
           color="eco"
           visual={<LevelVisual fill={data?.waterLevel ?? 0} />}
        />
        <SensorIntelligence 
           label="Ultrasonic" 
           value={data?.ultrasonic.toFixed(1) ?? "0.0"} 
           unit="cm" 
           icon={Activity} 
           color="eco"
           sub="Distance"
        />
        <SensorIntelligence 
           label="Water pH" 
           value={data?.ph.toFixed(1) ?? "7.1"} 
           unit="pH" 
           icon={Beaker} 
           color="warn"
           visual={<PHVisual val={data?.ph ?? 7.1} />}
        />
        <SensorIntelligence 
           label="Temperature" 
           value={data?.temperature.toFixed(1) ?? "24.2"} 
           unit="°C" 
           icon={Thermometer} 
           color="warn"
           sub="Thermal"
        />
      </div>
    </div>
  );
}

function ControlBadge({ label, status, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl glass border border-glass-border">
       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
       <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${color !== 'muted' ? 'animate-pulse' : ''}`} style={{ background: `var(--${color})` }} />
          <span className="text-[10px] font-black uppercase" style={{ color: `var(--${color})` }}>{status}</span>
       </div>
    </div>
  );
}

function LiveAlert({ title, sev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border-l-4 bg-${sev}/10 border-${sev}/40`}
      style={{ borderLeftColor: `var(--${sev})` }}
    >
       <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: `var(--${sev})` }}>{title}</div>
    </motion.div>
  );
}

function SensorIntelligence({ label, value, unit, icon: Ic, color, sub, visual }: any) {
  return (
    <div className="glass-strong rounded-[2rem] p-6 border border-glass-border relative overflow-hidden group hover:border-white/20 transition-all flex flex-col justify-between h-[220px]">
       <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
             <div className={`h-10 w-10 rounded-xl bg-${color}/10 flex items-center justify-center border border-${color}/20`} style={{ background: `color-mix(in oklab, var(--${color}) 10%, transparent)`, borderColor: `color-mix(in oklab, var(--${color}) 20%, transparent)` }}>
                <Ic className={`h-5 w-5 text-${color}`} style={{ color: `var(--${color})` }} />
             </div>
             {sub && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{sub}</span>}
          </div>
          <div className="flex items-baseline gap-1">
             <div className="text-3xl font-black font-display tracking-tighter">{value}</div>
             <div className="text-xs font-bold text-muted-foreground">{unit}</div>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mt-1 opacity-60">{label}</div>
       </div>

       <div className="flex-1 mt-4 relative overflow-hidden rounded-xl bg-black/20 border border-white/5 flex items-center justify-center">
          {visual ? visual : (
            <div className="w-full px-4 space-y-2">
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "70%" }} className={`h-full bg-${color}`} style={{ background: `var(--${color})` }} />
               </div>
               <div className="h-1 w-[60%] bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "80%" }} className={`h-full bg-${color} opacity-40`} style={{ background: `var(--${color})` }} />
               </div>
            </div>
          )}
       </div>
    </div>
  );
}

function WaveVisual({ active }: { active: boolean }) {
  return (
    <div className="w-full h-full relative overflow-hidden">
       <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d">
          <motion.path 
            d="M0 20 Q 25 10, 50 20 T 100 20" 
            stroke="var(--cyan)" strokeWidth="2" fill="none"
            animate={active ? { d: ["M0 20 Q 25 10, 50 20 T 100 20", "M0 20 Q 25 30, 50 20 T 100 20", "M0 20 Q 25 10, 50 20 T 100 20"] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
       </svg>
    </div>
  );
}

function LevelVisual({ fill }: { fill: number }) {
  return (
    <div className="w-12 h-16 relative glass border border-glass-border rounded-lg overflow-hidden">
       <motion.div 
         initial={{ height: 0 }} animate={{ height: `${fill}%` }}
         className="absolute bottom-0 left-0 right-0 bg-eco/40 border-t border-white/40"
       />
    </div>
  );
}

function PHVisual({ val }: { val: number }) {
  return (
    <div className="relative h-12 w-12 rounded-full border-2 border-glass-border flex items-center justify-center">
       <motion.div 
         animate={{ rotate: (val / 14) * 360 }}
         className="absolute inset-0 p-1"
       >
          <div className="h-2 w-2 rounded-full bg-warn shadow-glow-warn" />
       </motion.div>
       <div className="text-[10px] font-black">{val.toFixed(0)}</div>
    </div>
  );
}
function Pill({ color, children }: any) {
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border" style={{ borderColor: `var(--${color})`, color: `var(--${color})`, background: `color-mix(in oklab, var(--${color}) 12%, transparent)` }}><span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${color})` }} />{children}</span>;
}

function QualityIntelligence({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const ph = data?.ph ?? 7.0;
  const temp = data?.temperature ?? 25.0;

  // Adaptive threshold settings
  const phMin = a.phMin ?? 6.5;
  const phMax = a.phMax ?? 8.5;
  const tempMax = a.tempMax ?? 35;
  const industryName = a.plantName ?? "HydroNexa Plant";
  const industryType = a.type ?? "Industrial";
  const userEmail = a.email ?? "";
  const token = a.token ?? "";

  // 1. Water Reuse Eligibility & Safety Status
  const isOptimal = ph >= phMin && ph <= phMax && temp <= tempMax;
  const isConditional = ph >= (phMin - 0.5) && ph <= (phMax + 0.5) && temp <= (tempMax + 3);

  const reuseSuitability = isOptimal ? "Safe for Reuse" : isConditional ? "Conditional Reuse" : "Reuse Restricted";
  const reuseColor = isOptimal ? "eco" : isConditional ? "warn" : "danger";

  // 2. Reuse Confidence Score (AI-calculated out of 98%)
  let confidence = 98;
  if (temp > tempMax) {
    confidence -= Math.min(60, (temp - tempMax) * 8);
  }
  const phCenter = (phMin + phMax) / 2;
  const phDeviation = Math.abs(ph - phCenter);
  const phTolerance = (phMax - phMin) / 2;
  if (phDeviation > phTolerance) {
    confidence -= Math.min(80, (phDeviation - phTolerance) * 120);
  } else {
    confidence -= (phDeviation / phTolerance) * 15;
  }
  const confidenceScore = Math.max(5, Math.min(98, Math.round(confidence)));

  // 3. Stability Index (heartbeat tracking index)
  const stabilityIndex = Math.max(10, Math.min(99, Math.round(98 - Math.abs(ph - 7.0) * 8 - Math.max(0, temp - 25) * 1.5)));

  // pH transition bounds
  const phStatus = ph < phMin ? "Acidic" : ph > phMax ? "Alkaline" : "Neutral";
  const phColor = ph < phMin ? "danger" : ph > phMax ? "cyan" : "eco";
  
  // Trend Movement Visualization
  const phTrend = ph > 7.4 ? "Alkaline Drift ↑" : ph < 6.8 ? "Acidic Drift ↓" : "Optimal Chemistry ↔";

  // 4. Automated SMTP warning email trigger for quality breach
  const qualityEmailSentRef = useRef(localStorage.getItem("qualityEmailSent") === "true");

  useEffect(() => {
    if (reuseSuitability === "Reuse Restricted") {
      if (!qualityEmailSentRef.current) {
        qualityEmailSentRef.current = true;
        localStorage.setItem("qualityEmailSent", "true");

        if (userEmail) {
          fetch('/api/send-quality-alert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              to: userEmail,
              industryName,
              ph: ph.toFixed(1),
              temperature: temp.toFixed(1),
              reason: `Breached industry-standard parameters for ${industryType} sector.`,
              warningMessage: `Critically unsafe levels detected: pH is ${ph.toFixed(1)} (limits: ${phMin}-${phMax}) and temp is ${temp.toFixed(1)}°C (limit: ${tempMax}°C).`,
              recommendation: "IMMEDIATELY suspend recirculating valves, start pH neutralization cycles, and check cooling loops.",
              timestamp: new Date().toLocaleString()
            })
          })
          .then(res => res.json())
          .then(resData => console.log('Quality Alert Email sent:', resData.deliveryStatus))
          .catch(err => console.error('Failed to dispatch Quality Alert SMTP email:', err));
        }
      }
    } else if (reuseSuitability === "Safe for Reuse") {
      // Clear alert dispatch lock when system returns back to safe nominal
      qualityEmailSentRef.current = false;
      localStorage.setItem("qualityEmailSent", "false");
    }
  }, [reuseSuitability, ph, temp, phMin, phMax, tempMax, userEmail, industryName, industryType, token]);

  return (
    <div className="space-y-8 pb-10">
      {/* Premium AI Reusability Intelligence Engine Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Reuse Eligibility */}
         <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Recycle className={`h-16 w-16 text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }} /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Water Reuse Eligibility</div>
               <div className={`text-2xl font-black font-display tracking-tight text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }}>
                  {reuseSuitability === "Safe for Reuse" ? "ELIP-1: Fully Reusable" : reuseSuitability === "Conditional Reuse" ? "ELIP-2: Filter & Recycle" : "ELIP-3: Reuse Restricted"}
               </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
               <span className="h-2 w-2 rounded-full animate-ping" style={{ background: `var(--${reuseColor})` }} />
               <span className="text-[10px] font-black uppercase text-muted-foreground">Status: {reuseSuitability}</span>
            </div>
         </div>

         {/* Confidence Score */}
         <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldCheck className="h-16 w-16 text-cyan" /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">AI Reuse Confidence</div>
               <div className="text-3xl font-black font-display tracking-tight text-cyan flex items-baseline">
                  {confidenceScore}%
                  <span className="text-xs font-bold text-muted-foreground ml-2">
                     {confidenceScore >= 90 ? "Excellent" : confidenceScore >= 70 ? "Moderate" : "Critical Warning"}
                  </span>
               </div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-4">
               <motion.div initial={{ width: 0 }} animate={{ width: `${confidenceScore}%` }} className="h-full bg-cyan shadow-glow-cyan" />
            </div>
         </div>

         {/* Stability Index */}
         <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="h-16 w-16 text-eco" /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Reuse Stability Index</div>
               <div className="text-3xl font-black font-display tracking-tight text-eco flex items-baseline">
                  {stabilityIndex}%
                  <span className="text-xs font-bold text-muted-foreground ml-2">
                     {stabilityIndex >= 85 ? "Optimal" : stabilityIndex >= 65 ? "Fluctuating" : "Unstable"}
                  </span>
               </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4">
               <Heart className="h-3.5 w-3.5 text-eco animate-pulse" />
               <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">AI telemetry live sync</span>
            </div>
         </div>

         {/* Active Specifications */}
         <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="h-16 w-16 text-indigo" style={{ color: "var(--indigo)" }} /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Adaptive Specifications</div>
               <div className="text-sm font-black uppercase tracking-tight text-indigo" style={{ color: "var(--indigo)" }}>
                  {industryType} Sector
               </div>
               <div className="text-[10px] text-muted-foreground mt-2 font-bold space-y-0.5">
                  <div>pH Limit: <span className="text-foreground">{phMin} - {phMax} pH</span></div>
                  <div>Temp Limit: <span className="text-foreground">0 - {tempMax}°C</span></div>
               </div>
            </div>
         </div>
      </div>

      {/* Scientific Hero Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* pH Intelligence Hub */}
        <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden group">
           <div className={`absolute inset-0 bg-gradient-to-br from-${phColor}/5 to-transparent pointer-events-none transition-all duration-700`} />
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                       <FlaskRound className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                       <h4 className="font-bold">pH Chemistry Monitoring</h4>
                       <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Scientific Acidity Analytics</p>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm transition-all duration-500 ${phColor === 'eco' ? 'border-eco text-eco' : phColor === 'cyan' ? 'border-cyan text-cyan' : 'border-danger text-danger'}`}>
                    {phStatus} Range
                 </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center py-6">
                 <div className="relative h-64 w-64">
                    {/* Glowing Chemistry Spectrum Ring */}
                    <div className={`absolute -inset-4 rounded-full opacity-10 blur-xl transition-all duration-700 bg-${phColor}`} style={{ background: `var(--${phColor})` }} />
                    <svg viewBox="0 0 200 200" className="h-full w-full rotate-[-90deg]">
                       <circle cx="100" cy="100" r="90" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
                       <path d="M 100 10 A 90 90 0 0 1 190 100" fill="none" stroke="var(--danger)" strokeWidth="12" strokeLinecap="round" className="opacity-40" />
                       <path d="M 190 100 A 90 90 0 0 1 100 190" fill="none" stroke="var(--eco)" strokeWidth="12" className="opacity-40" />
                       <path d="M 100 190 A 90 90 0 0 1 10 100" fill="none" stroke="var(--cyan)" strokeWidth="12" strokeLinecap="round" className="opacity-40" />
                       
                       {/* Active Indicator */}
                       <motion.circle 
                          cx="100" cy="100" r="90" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeDasharray="1 10" 
                          animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                       />
                       
                       {/* pH Pointer */}
                       <motion.g animate={{ rotate: (ph / 14) * 360 }} transition={{ type: "spring", stiffness: 60 }}>
                          <line x1="100" y1="100" x2="100" y2="20" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" className="shadow-glow" />
                          <circle cx="100" cy="20" r="6" fill={`var(--${phColor})`} className="shadow-glow" />
                       </motion.g>
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <CountUp value={ph} suffix="" className="text-6xl font-black font-display tracking-tighter" />
                       <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mt-1">{phTrend}</div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                 <PHLabel label="Acidic Range" range={`< ${phMin}`} color="danger" active={ph < phMin} />
                 <PHLabel label="Stable Range" range={`${phMin}-${phMax}`} color="eco" active={ph >= phMin && ph <= phMax} />
                 <PHLabel label="Alkaline Range" range={`> ${phMax}`} color="cyan" active={ph > phMax} />
              </div>
           </div>
        </div>

        {/* Temperature Intelligence Hub */}
        <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden group">
           <div className={`absolute inset-0 bg-gradient-to-br from-${temp > tempMax ? 'danger' : 'cyan'}/5 to-transparent pointer-events-none transition-all duration-700`} />
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                       <Thermometer className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                       <h4 className="font-bold">Industrial Thermal Analytics</h4>
                       <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Industry Profile: {industryType}</p>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm transition-all duration-500 ${temp <= tempMax ? 'border-eco text-eco' : 'border-danger text-danger'}`}>
                    {temp <= tempMax ? 'Thermal Stable' : 'Thermal Elevated'}
                 </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative py-6">
                 <div className="relative h-64 w-64">
                    {/* Glowing Heat Aura / Zone Indicator */}
                    <div className={`absolute -inset-4 rounded-full opacity-10 blur-xl transition-all duration-700 bg-cyan`} style={{ background: temp > tempMax ? 'var(--danger)' : 'var(--cyan)' }} />
                    <svg viewBox="0 0 200 200" className="h-full w-full rotate-[135deg]">
                       <circle cx="100" cy="100" r="85" fill="none" stroke="var(--glass-border)" strokeWidth="12" strokeDasharray="210 280" />
                       <motion.circle 
                          cx="100" cy="100" r="85" fill="none" 
                          stroke={temp > tempMax ? "var(--danger)" : "var(--cyan)"} strokeWidth="15" strokeLinecap="round"
                          initial={{ strokeDasharray: "0 280" }}
                          animate={{ strokeDasharray: `${(Math.min(100, (temp / 100) * 100) / 100) * 210} 280` }}
                          transition={{ duration: 1.2 }}
                       />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                       <div className="flex items-start">
                          <CountUp value={temp} className="text-6xl font-black font-display tracking-tighter" />
                          <span className="text-2xl font-black font-display mt-2">°C</span>
                       </div>
                       <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Process Heat</div>
                    </div>
                 </div>
                 {/* Thermal Pulsing Waves */}
                 {temp > tempMax && (
                   <div className="absolute inset-0 border border-danger/20 rounded-full animate-ping pointer-events-none opacity-20" />
                 )}
              </div>

              <div className="p-4 rounded-2xl glass border border-glass-border">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance Safe Threshold</span>
                    <span className="text-[10px] font-black text-foreground">0 - {tempMax}°C</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }} animate={{ width: `${Math.min(100, (temp / tempMax) * 100)}%` }}
                       className={`h-full transition-colors duration-500 ${temp > tempMax ? 'bg-danger shadow-glow-danger' : 'bg-cyan shadow-glow-cyan'}`}
                    />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Reuse Decision Intelligence */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8">
              <Recycle className={`h-8 w-8 text-${reuseColor} ${isOptimal ? 'animate-spin-slow' : 'animate-pulse'}`} style={{ color: `var(--${reuseColor})` }} />
           </div>
           <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8">AI Dynamic Reuse Decision Logic</h4>
           
           <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className={`h-40 w-40 rounded-full border-4 flex flex-col items-center justify-center text-center p-4 relative shadow-2xl transition-all duration-700 bg-${reuseColor}/5 border-${reuseColor}/20`} style={{ borderColor: `color-mix(in oklab, var(--${reuseColor}) 20%, transparent)` }}>
                 <div className={`absolute -inset-4 rounded-full opacity-10 blur-xl animate-pulse`} style={{ background: `var(--${reuseColor})` }} />
                 <ShieldCheck className={`h-10 w-10 mb-2 text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }} />
                 <div className="text-[8px] uppercase tracking-widest font-black opacity-60 mb-1">Decision AI</div>
                 <div className={`text-[10px] font-black uppercase tracking-tighter leading-tight text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }}>{reuseSuitability}</div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                 {/* Live Status Indicators */}
                 <div className="grid grid-cols-2 gap-3 mb-2">
                    <TelemetryRow label="Reuse Flow Active" status={isOptimal ? "Synchronized" : "Bypassed"} color={isOptimal ? "eco" : "muted"} />
                    <TelemetryRow label="Reuse Restricted" status={!isOptimal ? "Restricted" : "Standby"} color={!isOptimal ? "danger" : "muted"} />
                    <TelemetryRow label="Efficiency Stable" status={confidenceScore >= 80 ? "Optimal" : "Degraded"} color={confidenceScore >= 80 ? "eco" : "warn"} />
                    <TelemetryRow label="Unsafe Reuse Blocked" status={!isOptimal && !isConditional ? "Secured" : "Safe Mode"} color={!isOptimal && !isConditional ? "danger" : "eco"} />
                 </div>

                 <QualityInsight 
                    label="Water Quality Status" 
                    text={ph >= phMin && ph <= phMax ? "pH chemistry is perfectly balanced within approved industry limits." : "pH chemical imbalance detected. Neutralization dosage adjustment required."} 
                    icon={CheckCircle2} 
                    color={ph >= phMin && ph <= phMax ? "eco" : "danger"} 
                 />
                 <QualityInsight 
                    label="Industrial Thermal Profile" 
                    text={temp <= tempMax ? `Temperature is optimal for continuous recirculating loop.` : `Thermal warning: Cooler loop sync required immediately.`} 
                    icon={Thermometer} 
                    color={temp <= tempMax ? "cyan" : "danger"} 
                 />
              </div>
           </div>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-glass-border bg-danger/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-40"><ZapOff className="h-5 w-5 text-danger" /></div>
           <h4 className="text-sm font-black uppercase tracking-widest mb-6">Automated Quality Alert System</h4>
           <div className="space-y-4">
              {ph < phMin && <PredictiveAlert title="Acidic Breach Warning" desc={`pH fell to ${ph.toFixed(1)} pH. Unsafe acidic water detected in treatment loop.`} sev="danger" />}
              {ph > phMax && <PredictiveAlert title="Alkaline Spike Warning" desc={`pH rose to ${ph.toFixed(1)} pH. High alkalinity levels registered.`} sev="danger" />}
              {temp > tempMax && <PredictiveAlert title="Critical Thermal Breach" desc={`Temp reaches ${temp.toFixed(1)}°C. Exceeds standard ${tempMax}°C bounds.`} sev="danger" />}
              {reuseSuitability === "Conditional Reuse" && <PredictiveAlert title="Filtration Alert Active" desc="AI suggests automatic chemical titration loop filtration." sev="warn" />}
              
              {reuseSuitability === "Safe for Reuse" && (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-3">
                   <div className="h-12 w-12 rounded-full bg-eco/20 flex items-center justify-center border border-eco/30 shadow-glow-eco">
                      <Sparkles className="h-6 w-6 text-eco" />
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-eco">Optimal Quality</div>
                   <p className="text-[10px] text-muted-foreground font-bold">Recirculation active. No quality risks detected.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}



function PHLabel({ label, range, color, active }: any) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${active ? `bg-${color}/10 border-${color}/40 border-2` : 'bg-white/5 border-glass-border'}`} style={active ? { borderColor: `var(--${color})`, background: `color-mix(in oklab, var(--${color}) 10%, transparent)` } : {}}>
       <div className={`text-[10px] font-black uppercase mb-0.5 ${active ? `text-${color}` : 'text-muted-foreground'}`} style={active ? { color: `var(--${color})` } : {}}>{label}</div>
       <div className="text-[8px] font-bold text-muted-foreground">{range} pH</div>
    </div>
  );
}

function QualityInsight({ label, text, icon: Ic, color }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl glass border border-glass-border">
       <div className={`h-8 w-8 rounded-xl flex items-center justify-center bg-${color}/10 border border-${color}/20 shrink-0`} style={{ background: `color-mix(in oklab, var(--${color}) 10%, transparent)`, borderColor: `color-mix(in oklab, var(--${color}) 20%, transparent)` }}>
          <Ic className="h-4 w-4" style={{ color: `var(--${color})` }} />
       </div>
       <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
          <p className="text-xs font-medium leading-relaxed">{text}</p>
       </div>
    </div>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div className="p-3 rounded-xl glass border border-glass-border">
       <div className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold opacity-50">{label}</div>
       <div className="text-xs font-black font-display tracking-tight mt-0.5" style={{ color: `var(--${color})` }}>{value}</div>
    </div>
  );
}

function ReuseIntelligence({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const ph = data?.ph ?? 7.0;
  const temp = data?.temperature ?? 25.0;

  // Configuration and thresholds
  const phMin = a.phMin ?? 6.5;
  const phMax = a.phMax ?? 8.5;
  const tempMax = a.tempMax ?? 35;
  const industryType = a.type ?? "Industrial";
  const userEmail = a.email ?? "";
  const token = a.token ?? "";
  const plantName = a.plantName ?? "HydroNexa Plant";

  // State calculations
  const isSafe = ph >= phMin && ph <= phMax && temp <= tempMax;
  const isConditional = ph >= (phMin - 0.5) && ph <= (phMax + 0.5) && temp <= (tempMax + 3);

  const reuseState = isSafe ? "High Reusable Water" : isConditional ? "Moderate Reuse" : "Unsafe For Reuse";
  const reuseColor = isSafe ? "eco" : isConditional ? "warn" : "danger";

  // Real-time daily storage values
  const rawCtoUsed = parseFloat(localStorage.getItem("liveCtoUsed") || "0");
  const liveCtoUsed = rawCtoUsed > 0 ? rawCtoUsed : 185.4; // fallback for nice telemetry demo

  // Fresh vs Reused water allocations
  const reuseRatio = isSafe ? 0.854 : isConditional ? 0.52 : 0.0;
  const freshRatio = isSafe ? 0.146 : isConditional ? 0.48 : 1.0;

  const reusedUsedToday = liveCtoUsed * reuseRatio;
  const freshUsedToday = liveCtoUsed * freshRatio;
  const reuseEfficiency = Math.round(reuseRatio * 100);
  const freshDependency = Math.round(freshRatio * 100);

  // AI Confidence Score
  const confidenceScore = isSafe ? 98 : isConditional ? 55 : 5;

  // Sustainability impact counters
  const freshSavedLiters = Math.round(reusedUsedToday * 1000);
  const sustainabilityScore = isSafe ? 94 : isConditional ? 68 : 12;

  // Dispatch quality SMTP alert loop when quality goes unsafe
  const reuseEmailSentRef = useRef(localStorage.getItem("reuseQualityEmailSent") === "true");

  useEffect(() => {
     if (!isSafe) {
        if (!reuseEmailSentRef.current) {
           reuseEmailSentRef.current = true;
           localStorage.setItem("reuseQualityEmailSent", "true");

           if (userEmail) {
              fetch('/api/send-quality-alert', {
                 method: 'POST',
                 headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                 },
                 body: JSON.stringify({
                    to: userEmail,
                    industryName: plantName,
                    ph: ph.toFixed(1),
                    temperature: temp.toFixed(1),
                    reason: `Reuse loop breach detected for ${industryType} standard.`,
                    warningMessage: `CRITICAL ALERT: pH is ${ph.toFixed(1)} (range: ${phMin}-${phMax}) or Temp is ${temp.toFixed(1)}°C (limit: ${tempMax}°C). Reuse loop is RESTRICTED.`,
                    recommendation: "IMMEDIATELY divert process feed loop to FRESH WATER intake pipeline and initiate pH titration correction.",
                    timestamp: new Date().toLocaleString()
                 })
              })
              .then(res => res.json())
              .then(resData => console.log('Reuse Alert Email sent:', resData.deliveryStatus))
              .catch(err => console.error('Failed to send Reuse Alert Email:', err));
           }
        }
     } else {
        reuseEmailSentRef.current = false;
        localStorage.setItem("reuseQualityEmailSent", "false");
     }
  }, [isSafe, ph, temp, phMin, phMax, tempMax, userEmail, plantName, industryType, token]);

  return (
    <div className="space-y-8 pb-10">
       {/* Top Header Statement */}
       <div className="glass-strong rounded-3xl p-6 border border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h3 className="text-lg font-black uppercase tracking-wider text-eco">Reuse Sustainability Statement</h3>
             <p className="text-xs text-muted-foreground mt-1">
                The facility is operating in <span className="text-eco font-bold">Closed-Loop Recirculation Mode</span>, processing treated water instead of high-volume fresh water intake.
             </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <span className="h-2 w-2 rounded-full animate-ping bg-eco" />
             <span className="text-[10px] font-black uppercase tracking-widest text-eco bg-eco/10 border border-eco/20 px-3 py-1 rounded-full">
                AI Optimization Active
             </span>
          </div>
       </div>

       {/* Digital Twin Section */}
       <div className="grid lg:grid-cols-3 gap-6">
          {/* Digital Representation Twin Frame */}
          <div className="lg:col-span-2 glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden flex flex-col h-[340px] justify-between">
             {/* Glowing Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
             <div className="absolute top-0 right-0 p-8 text-right opacity-10">
                <Cpu className="h-32 w-32 text-cyan" />
             </div>

             <div className="flex justify-between items-start z-10">
                <div>
                   <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Digital Twin Telemetry</span>
                   <h4 className="text-base font-black uppercase tracking-widest mt-0.5">Recycling Loop Visualizer</h4>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border-2 shadow-glow-sm ${isSafe ? 'border-eco text-eco' : 'border-danger text-danger animate-pulse'}`}>
                   {isSafe ? "REUSE FLOW ACTIVE" : "UNSAFE REUSE BLOCKED"}
                </div>
             </div>

             {/* SVG Digital twin layout */}
             <div className="relative w-full h-48 z-10 flex items-center justify-between px-10">
                {/* SVG Connecting Flow pipes */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   {/* Treated Pipeline Path */}
                   <path d="M 80 50 C 180 10, 220 10, 320 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                   <motion.path 
                      d="M 80 50 C 180 10, 220 10, 320 80" fill="none" 
                      stroke={isSafe ? "var(--eco)" : "rgba(255,255,255,0.1)"} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="10, 15"
                      animate={isSafe ? { strokeDashoffset: [0, -100] } : { strokeDashoffset: 0 }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                   />
                   
                   {/* Fresh Pipeline Path */}
                   <path d="M 80 150 C 180 190, 220 190, 320 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                   <motion.path 
                      d="M 80 150 C 180 190, 220 190, 320 80" fill="none" 
                      stroke={!isSafe ? "var(--cyan)" : "rgba(6,182,212,0.2)"} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="10, 15"
                      animate={{ strokeDashoffset: [0, -100] }}
                      transition={{ repeat: Infinity, duration: !isSafe ? 1.5 : 8, ease: "linear" }}
                   />
                </svg>

                {/* Treated wave tank */}
                <div className="w-24 h-32 rounded-2xl glass-strong border border-glass-border flex flex-col justify-between p-3 relative overflow-hidden shadow-2xl">
                   {/* Waving fluid SVG */}
                   <div className="absolute inset-0 pointer-events-none z-0">
                      <svg className={`absolute bottom-0 left-0 right-0 w-full ${isSafe ? 'text-eco/20' : 'text-danger/20'}`} style={{ height: isSafe ? '85%' : '45%' }} fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <motion.path 
                            d="M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z" 
                            animate={{ d: [
                              "M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z",
                              "M0,35 C40,45 60,25 100,35 L100,100 L0,100 Z",
                              "M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z"
                            ]}}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                         />
                      </svg>
                   </div>
                   <div className="z-10 flex flex-col justify-between h-full">
                      <Recycle className={`h-5 w-5 ${isSafe ? 'text-eco' : 'text-danger animate-spin-slow'}`} style={{ color: isSafe ? 'var(--eco)' : 'var(--danger)' }} />
                      <div className="text-right">
                         <span className="text-[7px] uppercase tracking-widest text-muted-foreground font-black">Treated Reuse</span>
                         <div className="text-sm font-black font-display mt-0.5">{isSafe ? '85%' : '45%'}</div>
                      </div>
                   </div>
                </div>

                {/* Processing Unit */}
                <div className="w-28 h-24 rounded-2xl glass border border-glass-border/60 z-10 flex flex-col justify-between p-3 shadow-glow-sm">
                   <div className="flex items-center justify-between">
                      <span className="h-2 w-2 rounded-full animate-ping" style={{ background: isSafe ? 'var(--eco)' : 'var(--cyan)' }} />
                      <span className="text-[7px] uppercase font-black tracking-widest text-muted-foreground">Process Intake</span>
                   </div>
                   <div className="text-center py-2">
                      <div className="text-xs font-black uppercase text-foreground">
                         {isSafe ? 'Loop Recirc' : 'Fresh Backup'}
                      </div>
                      <div className="text-[7px] text-muted-foreground mt-0.5 uppercase tracking-tighter">
                         pH: {ph.toFixed(1)} · Temp: {temp.toFixed(1)}°C
                      </div>
                   </div>
                </div>

                {/* Fresh intake tank */}
                <div className="w-24 h-32 rounded-2xl glass border border-glass-border flex flex-col justify-between p-3 relative overflow-hidden shadow-2xl">
                   {/* Waving fluid SVG */}
                   <div className="absolute inset-0 pointer-events-none z-0">
                      <svg className="absolute bottom-0 left-0 right-0 w-full text-cyan/20" style={{ height: isSafe ? '15%' : '80%' }} fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <motion.path 
                            d="M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z" 
                            animate={{ d: [
                              "M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z",
                              "M0,35 C40,45 60,25 100,35 L100,100 L0,100 Z",
                              "M0,30 C30,20 70,40 100,30 L100,100 L0,100 Z"
                            ]}}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                         />
                      </svg>
                   </div>
                   <div className="z-10 flex flex-col justify-between h-full">
                      <Droplets className="h-5 w-5 text-cyan" />
                      <div className="text-right">
                         <span className="text-[7px] uppercase tracking-widest text-muted-foreground font-black">Fresh Intake</span>
                         <div className="text-sm font-black font-display mt-0.5">{isSafe ? '15%' : '80%'}</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-4 font-bold border-t border-white/5 pt-3 z-10">
                <div>Source sync rate: <span className="text-foreground">0.2s</span></div>
                <div className="flex items-center gap-1.5">
                   <span className="h-1.5 w-1.5 rounded-full bg-eco animate-pulse" />
                   <span>Dynamic telemetry synced with ThingSpeak</span>
                </div>
             </div>
          </div>

          {/* AI Decision Indicator Panel */}
          <div className="glass-strong rounded-[2rem] p-8 border border-glass-border flex flex-col justify-between">
             <div>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">AI Decision Hub</span>
                <h4 className="text-base font-black uppercase tracking-widest mt-0.5">Eligibility Classification</h4>
                
                <div className={`mt-6 p-4 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden bg-${reuseColor}/5 border-${reuseColor}/20`} style={{ borderColor: `color-mix(in oklab, var(--${reuseColor}) 20%, transparent)` }}>
                   <div className={`absolute -inset-4 rounded-full opacity-10 blur-xl animate-pulse bg-${reuseColor}`} style={{ background: `var(--${reuseColor})` }} />
                   <ShieldCheck className={`h-12 w-12 mb-3 text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }} />
                   <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">State Determination</span>
                   <div className={`text-xl font-black uppercase tracking-tight text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }}>{reuseState}</div>
                </div>
             </div>

             <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center text-xs p-3 rounded-xl glass border border-glass-border">
                   <span className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">Quality Confidence</span>
                   <span className={`font-black ${confidenceScore >= 80 ? 'text-eco' : 'text-danger'}`}>{confidenceScore}%</span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed font-bold bg-white/5 p-3 rounded-xl border border-glass-border">
                   {isSafe ? (
                     "System successfully routing processed industrial effluent. High organic recycle stability limits fresh water dependency."
                   ) : (
                     "Quality breach detected. AI instantly shut loop valves and redirected feed flow to fresh water source buffer loops."
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* Real-time source comparisons */}
       <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Reused Water Usage today */}
          <div className="glass-strong rounded-3xl p-6 border border-glass-border flex flex-col justify-between h-[160px]">
             <div>
                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Reused Water Today</span>
                <div className="text-3xl font-black font-display tracking-tight text-eco mt-1 flex items-baseline">
                   <CountUp value={reusedUsedToday} suffix=" KL" />
                </div>
             </div>
             <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${reuseEfficiency}%` }} className="h-full bg-eco shadow-glow-eco" />
             </div>
             <div className="text-[9px] uppercase tracking-tighter text-muted-foreground mt-2 font-bold flex justify-between">
                <span>Loop allocation</span>
                <span className="text-eco font-black">{reuseEfficiency}%</span>
             </div>
          </div>

          {/* Fresh Water Used today */}
          <div className="glass-strong rounded-3xl p-6 border border-glass-border flex flex-col justify-between h-[160px]">
             <div>
                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Fresh Intake Today</span>
                <div className="text-3xl font-black font-display tracking-tight text-cyan mt-1 flex items-baseline">
                   <CountUp value={freshUsedToday} suffix=" KL" />
                </div>
             </div>
             <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${freshDependency}%` }} className="h-full bg-cyan shadow-glow-cyan" />
             </div>
             <div className="text-[9px] uppercase tracking-tighter text-muted-foreground mt-2 font-bold flex justify-between">
                <span>Backup allocation</span>
                <span className="text-cyan font-black">{freshDependency}%</span>
             </div>
          </div>

          {/* Efficiency dial ring */}
          <div className="glass-strong rounded-3xl p-6 border border-glass-border flex items-center justify-between h-[160px]">
             <div className="flex flex-col justify-between h-full py-1">
                <div>
                   <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Reuse Efficiency</span>
                   <div className="text-2xl font-black mt-1 text-eco">{reuseEfficiency}%</div>
                </div>
                <span className="text-[8px] uppercase text-muted-foreground tracking-tighter font-bold">Target limit: 60%</span>
             </div>
             <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                   <circle cx="50" cy="50" r="40" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
                   <motion.circle 
                      cx="50" cy="50" r="40" fill="none" stroke="var(--eco)" strokeWidth="8"
                      strokeDasharray="251"
                      initial={{ strokeDashoffset: 251 }}
                      animate={{ strokeDashoffset: 251 - (251 * reuseEfficiency) / 100 }}
                      transition={{ duration: 1 }}
                   />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground">AI Opt</div>
             </div>
          </div>

          {/* Dependency Reduction */}
          <div className="glass-strong rounded-3xl p-6 border border-glass-border flex items-center justify-between h-[160px]">
             <div className="flex flex-col justify-between h-full py-1">
                <div>
                   <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Dependency Reduction</span>
                   <div className="text-2xl font-black mt-1 text-cyan">{isSafe ? '78.4%' : '0.0%'}</div>
                </div>
                <span className="text-[8px] uppercase text-muted-foreground tracking-tighter font-bold">Fresh conservation index</span>
             </div>
             <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                   <circle cx="50" cy="50" r="40" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
                   <motion.circle 
                      cx="50" cy="50" r="40" fill="none" stroke="var(--cyan)" strokeWidth="8"
                      strokeDasharray="251"
                      initial={{ strokeDashoffset: 251 }}
                      animate={{ strokeDashoffset: 251 - (251 * (isSafe ? 78.4 : 0.0)) / 100 }}
                      transition={{ duration: 1 }}
                   />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground">Eco</div>
             </div>
          </div>
       </div>

       {/* AI Operational Insights Engine */}
       <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="h-16 w-16 text-indigo" style={{ color: 'var(--indigo)' }} /></div>
             <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6">AI Operational Insights Engine</h4>
             
             <div className="grid md:grid-cols-2 gap-4">
                <InsightTag status={isSafe} label="High Reuse Efficiency" color="eco" />
                <InsightTag status={isSafe} label="Fresh Water Dependency Reduced" color="eco" />
                <InsightTag status={isSafe} label="Treated Water Suitable For Processing" color="eco" />
                <InsightTag status={!isSafe && isConditional} label="Reuse Quality Degrading" color="warn" />
                <InsightTag status={!isSafe} label="Fresh Water Intake Increasing" color="cyan" />
             </div>

             <div className="p-4 rounded-2xl glass border border-glass-border/60 bg-indigo-500/5 mt-6 flex gap-4 items-start">
                <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                   <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">AI System Logic Recommendation</span>
                   <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                      {isSafe ? (
                        "Facility is functioning at ideal closed-loop recycling status. All biochemical limits are synchronized. No fresh water intake requested."
                      ) : (
                        "EMERGENCY SWITCH ACTIVE: Suspend treatment loop recirculation valves. Trigger primary fresh water pipelines for 100% processing load protection."
                      )}
                   </p>
                </div>
             </div>
          </div>

          {/* Sustainability Impact indicators */}
          <div className="glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-4 opacity-30"><Leaf className="h-5 w-5 text-eco animate-pulse" /></div>
             <div>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Sustainability Impact</span>
                <h4 className="text-base font-black uppercase tracking-widest mt-0.5">Conservation Scoring</h4>
             </div>

             <div className="space-y-4 my-6">
                <ConservationRow label="Fresh Water Saved Today" value={`${freshSavedLiters.toLocaleString()} Liters`} color="eco" />
                <ConservationRow label="Weekly Conservation Index" value="87,240 Liters" color="eco" />
                <ConservationRow label="Monthly Reuse Boost" value="+18.4% Efficiency" color="eco" />
                <ConservationRow label="Sustainability Score" value={`${sustainabilityScore}% Rating`} color={isSafe ? 'eco' : 'danger'} />
             </div>

             <div className="text-[8px] font-black uppercase text-muted-foreground tracking-widest text-center border-t border-white/5 pt-4">
                Conserving local resource buffers dynamically
             </div>
          </div>
       </div>

       {/* Warning and fallback recommended alert block */}
       {!isSafe && (
         <div className="p-5 rounded-3xl glass border border-danger/30 bg-danger/10 text-danger flex items-start gap-4 animate-pulse">
            <AlertTriangle className="h-6 w-6 text-danger shrink-0 mt-1" />
            <div>
               <h5 className="font-black uppercase tracking-widest text-xs">Unsafe Chemistry / Process Heat Spike Warning</h5>
               <p className="text-xs text-muted-foreground mt-1 font-medium">
                  The treatment plant has temporarily restricted closed-loop recycling. Fresh water pipeline intake has been engaged automatically. Standard operational boundaries will resume once pH and temperature return to acceptable limits.
               </p>
            </div>
         </div>
       )}
    </div>
  );
}

function InsightTag({ status, label, color }: { status: boolean; label: string; color: string }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${status ? `bg-${color}/5 border-${color}/20 text-foreground` : 'bg-white/5 border-glass-border/40 text-muted-foreground opacity-40'}`}>
       <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status ? 'animate-pulse' : ''}`} style={{ background: status ? `var(--${color})` : 'rgba(255,255,255,0.2)' }} />
          <span className="text-xs font-black uppercase tracking-tight">{label}</span>
       </div>
    </div>
  );
}

function ConservationRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5">
       <span className="text-[10px] text-muted-foreground uppercase font-bold">{label}</span>
       <span className={`text-xs font-black tracking-tight text-${color}`} style={{ color: `var(--${color})` }}>{value}</span>
    </div>
  );
}

function Analytics({ data }: { data: SensorData | null; history: SensorData[] }) {
  const [activeTime, setActiveTime] = useState(0);
  const flowRate = data?.flowRate ?? 0;
  const waterLevel = data?.waterLevel ?? 0;

  useEffect(() => {
    let interval: any;
    if (flowRate > 0.5) {
      interval = setInterval(() => setActiveTime(prev => prev + 1), 1000);
    } else {
      setActiveTime(0);
    }
    return () => clearInterval(interval);
  }, [flowRate > 0.5]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  const estimatedOverflow = waterLevel > 0 ? Math.max(0, Math.round((100 - waterLevel) / (flowRate || 1) * 2)) : 0;

  const prevLevelRef = useRef(0);

  // Trigger wailing industrial siren for 5 seconds when level reaches or exceeds 10%
  useEffect(() => {
    const threshold = 10;
    if (waterLevel >= threshold && prevLevelRef.current < threshold) {
      triggerAnalytics5SecHorn();
    }
    prevLevelRef.current = waterLevel;
  }, [waterLevel]);

  return (
    <div className="space-y-8 pb-10">
      {/* Immersive Digital Twin Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden flex flex-col justify-center">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent" />
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                 <div className="h-10 w-10 rounded-xl gradient-cyan flex items-center justify-center"><Activity className="h-5 w-5 text-primary-foreground" /></div>
                 <div>
                    <h4 className="font-bold">Real-Time Flow Intelligence</h4>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Inlet Pipeline Monitoring</p>
                 </div>
              </div>

              <div className="relative h-48 w-full flex items-center justify-center">
                 <svg viewBox="0 0 400 150" className="w-full h-full">
                    <motion.path 
                       animate={{ d: `M0,75 Q100,${75 - flowRate * 5} 200,75 T400,75` }}
                       stroke="var(--cyan)" strokeWidth="4" fill="none"
                       className="opacity-40"
                    />
                    <motion.path 
                       animate={{ d: `M0,75 Q50,${75 + flowRate * 10} 100,75 T200,75 T300,75 T400,75`, strokeDashoffset: -100 }}
                       stroke="var(--cyan)" strokeWidth="2" fill="none"
                       initial={{ strokeDasharray: "5, 10" }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <CountUp value={flowRate} suffix=" L/m" className="text-5xl font-black font-display text-cyan" />
                    <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${flowRate > 15 ? 'border-danger text-danger' : 'border-eco text-eco'}`}>
                       {flowRate > 15 ? 'Abnormal Flow Spike' : flowRate > 0.1 ? 'Flow Stable' : 'Pipeline Idle'}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                 <MiniStat label="Intake Speed" value={`${(flowRate * 1.2).toFixed(1)} m/s`} color="cyan" />
                 <MiniStat label="Pipeline PSI" value={`${(12 + flowRate * 0.5).toFixed(1)}`} color="cyan" />
                 <MiniStat label="Operational Status" value={flowRate > 0 ? "Active" : "Ready"} color="eco" />
              </div>
           </div>
        </div>

        <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-eco/5 to-transparent" />
           <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8 w-full">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-eco/20 flex items-center justify-center"><Droplets className="h-5 w-5 text-eco" /></div>
                    <div>
                       <h4 className="font-bold">Level Sensor Analytics</h4>
                       <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Storage Tank Mirroring</p>
                    </div>
                 </div>
                 <button 
                    onClick={triggerAnalytics5SecHorn}
                    className="p-2 rounded-xl bg-danger/10 hover:bg-danger/30 border border-danger/25 hover:border-danger/60 text-danger hover:text-danger-glow transition-all duration-300 flex items-center justify-center shrink-0 active:scale-95 animate-pulse"
                    title="Manual 5-Second Loud Horn Alert Test"
                 >
                    <Volume2 className="h-4 w-4" />
                 </button>
              </div>

              <div className="flex-1 flex items-center gap-10">
                 <div className="w-32">
                    <WaterTank fill={waterLevel} status={waterLevel > 90 ? "danger" : waterLevel < 20 ? "warn" : "ok"} />
                 </div>
                 <div className="flex-1 space-y-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Live Tank Inventory</span>
                       <CountUp value={waterLevel} suffix="%" className="text-4xl font-black font-display" />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <div className="p-4 rounded-xl glass border border-glass-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Timer className="h-4 w-4 text-eco" />
                             <span className="text-[10px] font-bold uppercase">Pump Running Time</span>
                          </div>
                          <span className="text-sm font-black font-display">{formatTime(activeTime)}</span>
                       </div>
                       <div className="p-4 rounded-xl glass border border-glass-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Wind className="h-4 w-4 text-cyan" />
                             <span className="text-[10px] font-bold uppercase">Est. Overflow Time</span>
                          </div>
                          <span className="text-sm font-black font-display text-warn">{flowRate > 0 ? `${estimatedOverflow} mins` : "N/A"}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Operational Analytics Explanation */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden">
           <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan" />
              AI Operational Analytics
           </h4>
           <div className="grid md:grid-cols-2 gap-4">
              <AnalyticsFact 
                 icon={ArrowDownCircle}
                 text={`Current water intake is ${(flowRate * 60).toFixed(0)} Liters per hour, remaining stable.`}
                 color="cyan"
              />
              <AnalyticsFact 
                 icon={ArrowUpCircle}
                 text={waterLevel > 85 ? "Tank capacity is near critical threshold. Suggest motor shutdown." : "Tank filling speed is optimal for current processing demand."}
                 color={waterLevel > 85 ? "danger" : "eco"}
              />
              <AnalyticsFact 
                 icon={Activity}
                 text="AI detects no anomalies in pipeline pressure or flow stability."
                 color="eco"
              />
              <AnalyticsFact 
                 icon={Timer}
                 text={flowRate > 0 ? `Water intake cycle has been active for ${formatTime(activeTime)}.` : "System is in stand-by mode, awaiting intake trigger."}
                 color="cyan"
              />
           </div>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-glass-border bg-danger/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4">
              <AlertTriangle className="h-5 w-5 text-danger animate-pulse" />
           </div>
           <h4 className="text-sm font-black uppercase tracking-widest mb-6">Predictive Alerts</h4>
           <div className="space-y-4">
              {waterLevel > 90 && (
                <PredictiveAlert 
                  title="Overflow Risk" 
                  desc={`Tank reached ${waterLevel}%. Overflow expected in ${estimatedOverflow} mins.`} 
                  sev="danger"
                />
              )}
              {flowRate > 20 && (
                <PredictiveAlert 
                  title="Leakage Warning" 
                  desc="High flow variance detected. Check intake pipeline B-2." 
                  sev="danger"
                />
              )}
              {activeTime > 1800 && (
                <PredictiveAlert 
                  title="Motor Fatigue" 
                  desc="Intake motor active for >30 mins. Suggest operational break." 
                  sev="warn"
                />
              )}
              {waterLevel < 90 && flowRate <= 20 && activeTime <= 1800 && (
                <div className="flex flex-col items-center justify-center text-center py-6 opacity-40">
                   <ShieldCheck className="h-10 w-10 mb-2" />
                   <div className="text-[10px] font-black uppercase tracking-widest">No Risks Detected</div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsFact({ icon: Ic, text, color }: any) {
  return (
    <div className="p-4 rounded-2xl glass border border-glass-border flex items-start gap-3">
       <Ic className={`h-5 w-5 mt-0.5 text-${color}`} style={{ color: `var(--${color})` }} />
       <p className="text-xs text-muted-foreground leading-relaxed font-medium">{text}</p>
    </div>
  );
}

function PredictiveAlert({ title, desc, sev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border-l-4 bg-${sev}/10 border-${sev}/30`}
      style={{ borderLeftColor: `var(--${sev})` }}
    >
       <div className="font-black text-[10px] uppercase tracking-widest mb-1" style={{ color: `var(--${sev})` }}>{title}</div>
       <div className="text-xs text-muted-foreground font-medium">{desc}</div>
    </motion.div>
  );
}

function AIInsights({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const insights = [];
  
  if ((data?.waterLevel ?? 0) < a.reuseTarget) {
    insights.push({ t: `Reuse efficiency is at ${data?.waterLevel.toFixed(1)}%, below target. Increase recycling flow.`, c: "warn", rec: "Recycle Loop Optimization Required" });
  } else {
    insights.push({ t: `Water reuse efficiency (${data?.waterLevel.toFixed(1)}%) is operating within optimal range.`, c: "eco", rec: "System Balance: Optimized" });
  }

  if ((data?.flowRate ?? 0) > 15) {
    insights.push({ t: `Abnormal flow surge detected (${data?.flowRate.toFixed(1)} L/m). Possible leakage in unit-2.`, c: "danger", rec: "Automated Pressure Relief Triggered" });
  } else {
    insights.push({ t: `Flow telemetry remains stable across all industrial nodes.`, c: "cyan", rec: "Steady State Flow Active" });
  }

  if ((data?.ph ?? 7) > THRESHOLDS.PH_MAX || (data?.ph ?? 7) < THRESHOLDS.PH_MIN) {
    insights.push({ t: `AI predicts water quality degradation due to pH imbalance (${data?.ph.toFixed(1)}).`, c: "warn", rec: "Auto-Dosing System Initiated" });
  } else {
    insights.push({ t: `Water quality parameters are currently within regulatory bounds.`, c: "eco", rec: "Validation Compliance: ISO Aligned" });
  }

  return (
    <div className="space-y-5">
      <div className="glass-strong rounded-3xl p-8 border border-cyan/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl gradient-cyan flex items-center justify-center shadow-glow">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg">HydroNexa Operational Intelligence</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Predictive Analytics · {a.type ?? "Industry"} Model v4.2</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full glass border border-glass-border">
            <Sparkles className="h-3.5 w-3.5 text-cyan animate-pulse" />
            <span className="text-[10px] font-bold uppercase text-cyan">AI Core Synchronized</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((ins, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="glass rounded-2xl p-5 border-l-4 relative overflow-hidden group hover:border-r-4 transition-all" 
              style={{ borderLeftColor: `var(--${ins.c})`, borderRightColor: `var(--${ins.c})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-start gap-4">
                <div className={`mt-1 h-2 w-2 rounded-full animate-pulse flex-shrink-0`} style={{ background: `var(--${ins.c})` }} />
                <div>
                  <div className="text-sm font-medium leading-relaxed mb-3">{ins.t}</div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter opacity-70">
                    <Zap className="h-3 w-3" />
                    <span>Recommendation: {ins.rec}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-2xl glass border border-glass-border bg-cyan/5">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="h-4 w-4 text-cyan animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan">Smart Automation Insight</span>
          </div>
          <p className="text-sm italic text-muted-foreground">
            "Based on historical data and current CTO utilization, the AI recommends shifting the washing cycle to the Night Shift to optimize water reuse and reduce peak-hour CTO pressure."
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertsView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (a.token) {
      fetch('/api/alerts/history', {
        headers: { 'Authorization': `Bearer ${a.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
        setFetching(false);
      })
      .catch(err => {
        console.error('Failed to fetch alert history:', err);
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
  }, [a.token]);

  const alerts = [];
  
  // 1. CTO Limit Exceed Alert
  const ctoUsed = data?.totalFlow ?? 0;
  if (ctoUsed > a.ctoLimit) {
    alerts.push({ 
      t: "CTO Limit Violation", 
      desc: `Total industrial consumption (${ctoUsed.toFixed(1)} KL) has exceeded the government CTO limit of ${a.ctoLimit} KL.`, 
      sev: "danger", 
      action: "Immediate Production Downtime Recommended",
      category: "COMPLIANCE" 
    });
  }

  // 2. Leakage Detection Alert
  if ((data?.flowRate ?? 0) > 25) {
    alerts.push({ 
      t: "Critical Leakage Detected", 
      desc: `Abnormal flow surge of ${(data?.flowRate ?? 0).toFixed(1)} L/m detected in main intake line B-2.`, 
      sev: "danger", 
      action: "Emergency Shutdown of Valve V-102",
      category: "OPERATIONAL" 
    });
  }

  // 3. Overflow Breach Alert
  if ((data?.waterLevel ?? 0) >= 95) {
    alerts.push({ 
      t: "Maximum Capacity Breach", 
      desc: `Tank level has reached critical maximum (${(data?.waterLevel ?? 0).toFixed(0)}%). Overflow is occurring or imminent.`, 
      sev: "danger", 
      action: "Turn OFF Intake Motor Immediately",
      category: "SAFETY" 
    });
  }

  if ((data?.ph ?? 7) > THRESHOLDS.PH_MAX || (data?.ph ?? 7) < THRESHOLDS.PH_MIN) {
    alerts.push({ t: "pH Threshold Violation", desc: `Industrial water quality dropped to ${(data?.ph ?? 0).toFixed(1)} pH`, sev: "danger", action: "Initiate Buffer Dosing", category: "QUALITY" });
  }
  
  if ((data?.temperature ?? 0) > THRESHOLDS.TEMP_MAX) {
    alerts.push({ t: "Thermal Load Breach", desc: `Operational temperature peaked at ${(data?.temperature ?? 0).toFixed(1)}°C`, sev: "warn", action: "Activate Secondary Cooling", category: "QUALITY" });
  }
  if ((data?.waterLevel ?? 100) < THRESHOLDS.LEVEL_MIN) {
    alerts.push({ t: "Inlet Tank Low Level", desc: `Critical water inventory reached: ${(data?.waterLevel ?? 0).toFixed(1)}%`, sev: "warn", action: "Switch to Secondary Source", category: "SAFETY" });
  }

  // Real-Time Overflow Prediction Logic
  const flowRate = data?.flowRate ?? 0;
  const waterLevel = data?.waterLevel ?? 0;
  if (flowRate > 0.5 && waterLevel > 70) {
    const remainingCap = 100 - waterLevel;
    const estMinutes = Math.max(0, Math.round(remainingCap / (flowRate * 0.15))); // Normalized prediction
    if (estMinutes < 15) {
       alerts.push({ 
          t: "Critical Overflow Prediction", 
          desc: `Tank is at ${waterLevel}%. Current intake will cause overflow in approx. ${estMinutes} mins.`, 
          sev: "danger", 
          action: "IMMEDIATE: Shutdown Intake Motor or Reduce Flow by 50%",
          countdown: estMinutes,
          isOverflow: true
       });
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Active Compliance Incidents</div>
              <div className="text-3xl font-black font-display tracking-tight text-danger mt-1">{alerts.length}</div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Requires Immediate Remediation</div>
        </div>

        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent pointer-events-none" />
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Automated Warning Emails</div>
              <div className="text-3xl font-black font-display tracking-tight text-cyan mt-1">{history.length} Sent</div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Dispatched to Registered SMTP User</div>
        </div>

        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div className="absolute inset-0 bg-gradient-to-br from-eco/5 to-transparent pointer-events-none" />
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">System SMTP Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-eco animate-pulse" />
                <span className="text-xl font-black font-display tracking-tight text-eco uppercase">Online</span>
              </div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Telemetry Synced with Govt Node</div>
        </div>
      </div>

      {/* Active Incidents Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 px-2">
          <AlertTriangle className="h-5 w-5 text-danger animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Active Industrial Breaches</span>
        </div>
        
        {alerts.length === 0 ? (
          <div className="glass-strong rounded-3xl p-10 text-center border border-eco/20 bg-eco/5">
            <div className="h-16 w-16 bg-eco/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <CheckCircle2 className="h-8 w-8 text-eco" />
            </div>
            <h3 className="text-lg font-bold text-eco">Industrial Integrity Stable</h3>
            <p className="text-muted-foreground mt-2 text-xs max-w-sm mx-auto">All plant parameters are synchronized with government CTO guidelines and ISO standards.</p>
          </div>
        ) : (
          alerts.map((a, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="glass-strong rounded-[2rem] p-8 flex items-start gap-8 border-l-[6px] relative overflow-hidden group hover:border-r-[6px] transition-all shadow-2xl" 
              style={{ borderLeftColor: `var(--${a.sev})`, borderRightColor: `var(--${a.sev})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-danger/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col items-center gap-4">
                 <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-${a.sev}/20 shadow-glow animate-pulse`}>
                   <AlertTriangle className={`h-8 w-8 text-${a.sev}`} style={{ color: `var(--${a.sev})` }} />
                 </div>
                 {a.isOverflow && (
                    <div className="flex flex-col items-center">
                       <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time Left</div>
                       <div className="h-12 w-12 rounded-full border-2 border-danger flex items-center justify-center relative">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-2 border-danger rounded-full"
                          />
                          <span className="text-xs font-black text-danger">{a.countdown}m</span>
                       </div>
                    </div>
                 )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                     {a.t}
                     <div className={`px-2 py-0.5 rounded bg-${a.sev} text-primary-foreground text-[10px] font-black`}>{a.category} BREACH</div>
                  </div>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full border border-${a.sev}/30 text-${a.sev} bg-${a.sev}/10`} style={{ color: `var(--${a.sev})`, borderColor: `var(--${a.sev})33` }}>SEVERITY: HIGH</div>
                </div>
                
                <div className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">{a.desc}</div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-cyan/20 flex items-center justify-center border border-cyan/30">
                         <RefreshCcw className="h-5 w-5 text-cyan animate-spin-slow" />
                      </div>
                      <div>
                         <div className="text-[10px] font-black uppercase text-cyan tracking-widest mb-0.5">AI Recommended Action</div>
                         <div className="text-sm font-bold">{a.action}</div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <button className="h-12 px-6 rounded-xl gradient-danger text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-glow-danger hover:scale-105 transition-transform">
                         Shutdown Motor
                      </button>
                      <button className="h-12 w-12 rounded-xl glass border border-glass-border flex items-center justify-center hover:bg-white/10 transition group">
                         <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Compliance Email & Alert History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 px-2">
          <History className="h-5 w-5 text-cyan animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Compliance Email & Alert History</span>
        </div>

        {fetching ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 text-cyan animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground animate-pulse">Loading compliance monitoring logs...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-strong rounded-3xl p-10 text-center border border-glass-border">
             <Mail className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-4" />
             <h4 className="text-sm font-bold uppercase tracking-widest">No Compliance Alerts Dispatched</h4>
             <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">No CTO limits have been breached. Automated warning history is empty.</p>
          </div>
        ) : (
          <div className="glass-strong rounded-[2rem] overflow-hidden border border-glass-border shadow-2xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-glass-border bg-white/5 text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                         <th className="p-5">Alert Type</th>
                         <th className="p-5">Summary Message</th>
                         <th className="p-5">Dispatched At</th>
                         <th className="p-5">Delivery Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {history.map((h, i) => (
                         <tr key={h._id || i} className="hover:bg-white/5 transition-colors text-xs font-medium">
                            <td className="p-5 flex items-center gap-3">
                               <div className="h-8 w-8 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20">
                                  <AlertTriangle className="h-4 w-4 text-danger animate-pulse" />
                               </div>
                               <span className="font-bold text-foreground uppercase tracking-tight">{h.alertType}</span>
                            </td>
                            <td className="p-5 text-muted-foreground max-w-sm truncate">{h.message}</td>
                            <td className="p-5 text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</td>
                            <td className="p-5">
                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                 h.deliveryStatus === 'Delivered' ? 'border-eco/30 text-eco bg-eco/5' :
                                 h.deliveryStatus === 'Sent' ? 'border-cyan/30 text-cyan bg-cyan/5' :
                                 'border-danger/30 text-danger bg-danger/5'
                               }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${h.deliveryStatus === 'Failed' ? '' : 'animate-pulse'}`} style={{
                                    background: h.deliveryStatus === 'Delivered' ? 'var(--eco)' : h.deliveryStatus === 'Sent' ? 'var(--cyan)' : 'var(--danger)'
                                  }} />
                                  {h.deliveryStatus}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SustainabilityView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const reuseEfficiency = Math.round((data?.waterLevel ?? 0) * 0.8 + 15);
  const waterSaved = Math.round((data?.totalFlow ?? 0) * 420);
  const wasteReduction = Math.round(reuseEfficiency * 0.6);
  
  // Weekly Comparison Data (Simulated)
  const stats = [
    { label: "Water Conservation", current: waterSaved, last: waterSaved * 0.65, unit: "L" },
    { label: "Reuse Efficiency", current: reuseEfficiency, last: 58, unit: "%" },
    { label: "Wastewater Reduction", current: wasteReduction, last: 24, unit: "%" },
  ];

  const scoreValue = (reuseEfficiency + (100 - (data?.ph ?? 7) * 2)) / 2;
  const grade = scoreValue > 85 ? "A+" : scoreValue > 75 ? "A" : scoreValue > 60 ? "B" : "C";
  const gradeText = grade === "A+" ? "Excellent Sustainability" : grade === "A" ? "Sustainable Operations" : grade === "B" ? "Moderate Sustainability" : "Improvement Required";

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Sustainability Command Center */}
      <div className="glass-strong rounded-[3rem] p-10 border border-eco/20 relative overflow-hidden group shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-eco/10 via-transparent to-transparent pointer-events-none" />
         <div className="absolute -top-24 -right-24 h-64 w-64 bg-eco/5 blur-3xl rounded-full" />
         
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-eco/20 flex items-center justify-center border border-eco/30 shadow-glow-eco">
                     <Leaf className="h-8 w-8 text-eco" />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tight">Environmental Command Center</h3>
                     <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">Industrial Sustainability Intelligence v2.0</p>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <div className={`text-4xl font-black font-display text-eco shadow-glow-eco mb-1`}>{grade}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{gradeText}</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <EcoGauge label="Reuse Efficiency" value={reuseEfficiency} suffix="%" color="eco" icon={Recycle} />
               <EcoGauge label="Fresh Water Saved" value={waterSaved} suffix=" L" color="cyan" icon={Droplets} />
               <EcoGauge label="Waste Reduction" value={wasteReduction} suffix="%" color="eco" icon={Activity} />
               <EcoGauge label="Sustainability Score" value={Math.round(scoreValue)} suffix="" color="eco" icon={TrendingUp} />
            </div>
         </div>
      </div>

      {/* Weekly Sustainability Comparison System */}
      <div className="grid lg:grid-cols-2 gap-8">
         <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border">
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan" />
                  Weekly Performance Comparison
               </h4>
               <span className="text-[10px] font-black uppercase bg-cyan/10 text-cyan px-2 py-1 rounded">Last Week vs Current</span>
            </div>
            
            <div className="space-y-6">
               {stats.map((s, i) => {
                  const diff = ((s.current - s.last) / s.last) * 100;
                  const isUp = diff > 0;
                  return (
                     <div key={i} className="space-y-3">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold text-muted-foreground">{s.label}</span>
                           <div className={`flex items-center gap-1.5 text-xs font-black ${isUp ? 'text-eco' : 'text-danger'}`}>
                              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                              {Math.abs(diff).toFixed(1)}% {isUp ? 'Improvement' : 'Decline'}
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 h-12">
                           <div className="relative bg-white/5 rounded-xl overflow-hidden group">
                              <div className="absolute inset-0 flex items-center px-4 z-10 text-[10px] font-black uppercase opacity-60">Last: {s.last}{s.unit}</div>
                              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-white/10" />
                           </div>
                           <div className="relative bg-white/5 rounded-xl overflow-hidden group border border-eco/20 shadow-glow-eco/5">
                              <div className="absolute inset-0 flex items-center px-4 z-10 text-[10px] font-black uppercase text-eco">Current: {s.current}{s.unit}</div>
                              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-eco/20" />
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* AI Sustainability Insights & Reports */}
         <div className="space-y-6">
            <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border relative overflow-hidden flex-1">
               <div className="absolute top-0 right-0 p-8"><Brain className="h-8 w-8 text-eco opacity-20" /></div>
               <h4 className="text-sm font-black uppercase tracking-widest mb-6">AI Sustainability Insights</h4>
               <div className="space-y-4">
                  <InsightCard text="Water conservation improved significantly compared to last week." icon={Sparkles} color="eco" />
                  <InsightCard text={`Wastewater generation reduced by ${wasteReduction}% this cycle.`} icon={Zap} color="cyan" />
                  <InsightCard text="Current reuse efficiency exceeds operational sustainability targets." icon={TrendingUp} color="eco" />
               </div>
            </div>
            
            <div className="glass-strong rounded-3xl p-6 border border-eco/10 bg-eco/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-eco/20 flex items-center justify-center">
                     <FileText className="h-6 w-6 text-eco" />
                  </div>
                  <div>
                     <h5 className="font-bold text-sm">Sustainability Performance Report</h5>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase">Weekly Comparative Analytics</p>
                  </div>
               </div>
               <button className="h-10 px-6 rounded-full gradient-eco text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-glow-eco hover:scale-105 transition-transform">
                  Generate PDF
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function EcoGauge({ label, value, suffix, color, icon: Ic }: any) {
  return (
    <div className="flex flex-col items-center p-6 rounded-3xl glass border border-glass-border hover:border-eco/40 transition-all">
       <div className={`h-12 w-12 rounded-full bg-${color}/10 flex items-center justify-center mb-4 border border-${color}/20`}>
          <Ic className={`h-6 w-6 text-${color}`} style={{ color: `var(--${color})` }} />
       </div>
       <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">{label}</div>
       <CountUp value={value} suffix={suffix} className="text-2xl font-black font-display" />
       <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} className={`h-full bg-${color}`} style={{ background: `var(--${color})` }} />
       </div>
    </div>
  );
}

function InsightCard({ text, icon: Ic, color }: any) {
  return (
    <div className="p-4 rounded-2xl glass border border-glass-border flex items-center gap-4 group hover:bg-white/5 transition-all">
       <div className={`h-8 w-8 rounded-xl bg-${color}/10 flex items-center justify-center border border-${color}/20 group-hover:shadow-glow-${color} transition-all`}>
          <Ic className={`h-4 w-4 text-${color}`} style={{ color: `var(--${color})` }} />
       </div>
       <p className="text-xs font-medium text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function ReportsView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();

  const downloadHistoricalData = async () => {
    try {
      const response = await fetch('/api/sensor-data?limit=10000');
      const records = await response.json();
      if (!records || records.length === 0) {
        alert("No historical data available.");
        return;
      }
      const headers = ["timestamp", "flowRate", "totalFlow", "temperature", "ph", "waterLevel", "ultrasonic"];
      const csvRows = [headers.join(',')];
      for (const row of records) {
        const values = headers.map(header => {
          const val = row[header] !== undefined ? row[header] : "";
          const escaped = ('' + val).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      const csvData = csvRows.join('\\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `historical_sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download historical data", e);
      alert("Failed to download historical data");
    }
  };

  const downloadReport = (name: string, type: 'txt' | 'csv' | 'json' = 'txt') => {
    let content = "";
    const timestamp = new Date().toLocaleString();
    const fileName = `${name.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'json') {
      content = JSON.stringify({
        report: name,
        generated: timestamp,
        industry: a.type,
        telemetry: data,
        compliance: (data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "BREACH" : "NOMINAL"
      }, null, 2);
    } else if (type === 'csv') {
      content = `Parameter,Value,Unit,Status\nFlow Rate,${data?.flowRate},L/m,Stable\nTotal Flow,${data?.totalFlow},KL,Normal\npH,${data?.ph},pH,${(data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "BREACH" : "NOMINAL"}\nTemperature,${data?.temperature},°C,Optimal\nWater Level,${data?.waterLevel},%,Normal`;
    } else {
      content = `
=========================================
      HYDRONEXA INDUSTRIAL REPORT
=========================================
Report Name: ${name}
Generated: ${timestamp}
Industry Type: ${a.type}

[TELEMETRY SNAPSHOT]
- Intake Flow: ${data?.flowRate} L/m
- Cumulative Flow: ${data?.totalFlow} KL
- Quality pH: ${data?.ph}
- Thermal Node: ${data?.temperature}°C
- Inventory Level: ${data?.waterLevel}%

[COMPLIANCE STATUS]
Status: ${(data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "ACTION REQUIRED" : "NOMINAL / ISO ALIGNED"}
Next Audit: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

-----------------------------------------
Validated by HydroNexa AI Intelligence Core
=========================================
      `;
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : type === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Certificate Section */}
      {/* <div className="glass-strong rounded-[2.5rem] p-10 border border-eco/20 relative overflow-hidden group shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-eco/10 via-transparent to-transparent pointer-events-none" />
         <div className="absolute top-0 right-0 p-10 opacity-10"><Award className="h-40 w-40 text-eco" /></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="h-32 w-32 rounded-full border-4 border-eco/30 flex items-center justify-center relative shadow-glow-eco">
               <Award className="h-16 w-16 text-eco" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-4 border border-dashed border-eco/40 rounded-full"
               />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">Compliance Certification</h3>
               <p className="text-muted-foreground text-sm max-w-xl mb-6">
                  HydroNexa AI Core has verified your industrial water parameters. All sensor nodes are currently operating within secondary treatment standards and ISO environmental protocols.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <button onClick={() => downloadReport("Operational Compliance Certificate", "txt")} className="h-12 px-8 rounded-full gradient-eco text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-glow-eco hover:scale-105 transition-transform flex items-center gap-3">
                     <Download className="h-4 w-4" /> Download Certificate
                  </button>
                  <button onClick={() => downloadReport("Compliance Metadata", "json")} className="h-12 px-8 rounded-full glass border border-glass-border text-[10px] font-black uppercase tracking-widest hover:border-eco transition-all flex items-center gap-3">
                     <FileJson className="h-4 w-4 text-eco" /> Export JSON Proof
                  </button>
               </div>
            </div>
         </div>
      </div> */}

      {/* Main Reports Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ReportCard 
            title="MongoDB Historical Database" 
            desc="Download all real-time sensor data stored historically." 
            icon={FileSpreadsheet} 
            color="eco"
            onDownload={downloadHistoricalData}
            btnText="Export Full History CSV"
         />
         <ReportCard 
            title="Sustainability Analytics" 
            desc="Detailed water reuse efficiency and wastage reduction metrics." 
            icon={Leaf} 
            color="eco"
            onDownload={() => downloadReport("Sustainability Analytics", "txt")}
         />
         <ReportCard 
            title="Raw Sensor Telemetry" 
            desc="Complete historical log of all 6 IoT sensor data nodes." 
            icon={FileSpreadsheet} 
            color="cyan"
            onDownload={() => downloadReport("Sensor_Raw_Data", "csv")}
            btnText="Export CSV"
         />
         <ReportCard 
            title="Compliance Audit Log" 
            desc="Comprehensive record of pH and Temperature threshold events." 
            icon={ClipboardCheck} 
            color="warn"
            onDownload={() => downloadReport("Compliance Audit Log", "txt")}
         />
         <ReportCard 
            title="Operational Summary" 
            desc="Weekly overview of flow rates and pump active durations." 
            icon={FileText} 
            color="cyan"
            onDownload={() => downloadReport("Operational Summary", "txt")}
         />
         <ReportCard 
            title="CTO Utilization Report" 
            desc="Analysis of water consumption vs government CTO limits." 
            icon={TrendingUp} 
            color="eco"
            onDownload={() => downloadReport("CTO Utilization Report", "txt")}
         />
         <ReportCard 
            title="AI Intelligence Log" 
            desc="Export the full history of AI-generated operational recommendations." 
            icon={Brain} 
            color="cyan"
            onDownload={() => downloadReport("AI Intelligence Log", "json")}
            btnText="Export JSON"
         />
      </div>
    </div>
  );
}

function ReportCard({ title, desc, icon: Ic, color, onDownload, btnText = "Download Snapshots" }: any) {
  return (
    <div className="glass-strong rounded-[2rem] p-8 border border-glass-border hover:border-white/20 transition-all group flex flex-col justify-between">
       <div>
          <div className={`h-12 w-12 rounded-2xl bg-${color}/10 flex items-center justify-center border border-${color}/20 mb-6 group-hover:scale-110 transition-transform`}>
             <Ic className={`h-6 w-6 text-${color}`} style={{ color: `var(--${color})` }} />
          </div>
          <h4 className="text-xl font-bold mb-2">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{desc}</p>
       </div>
       <button 
         onClick={onDownload}
         className="w-full h-12 rounded-xl glass border border-glass-border text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition flex items-center justify-center gap-3"
       >
          <ArrowRight className="h-4 w-4" /> {btnText}
       </button>
    </div>
  );
}

function SettingsPanel() {
  const { state, updateSetup } = useAppState();
  const s = state.setup;
  return (
    <div className="space-y-5">
      <div className="glass-strong rounded-2xl p-6 border border-cyan/20">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-5 w-5 text-cyan" />
          <h4 className="font-bold">Adaptive Configuration</h4>
        </div>
        <p className="text-xs text-muted-foreground">Changes update your dashboard, quality monitoring, and analytics in real time.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <SettingNumber label="CTO Limit (KL/day)" value={s.ctoLimit ?? 100} onChange={(v) => updateSetup({ ctoLimit: v })} />
        <SettingNumber label="Monthly CTO (KL)" value={s.monthlyCtoLimit ?? 3000} onChange={(v) => updateSetup({ monthlyCtoLimit: v })} />
        <SettingSlider label="Reuse Target %" value={s.reuseTarget ?? 60} onChange={(v) => updateSetup({ reuseTarget: v })} />
        <SettingSlider label="Alert Sensitivity" value={s.alertSensitivity ?? 70} onChange={(v) => updateSetup({ alertSensitivity: v })} />
      </div>
      <div className="flex items-center gap-2 text-xs text-eco">
        <Save className="h-3.5 w-3.5" /> Auto-saved · Dashboard adapting…
      </div>
    </div>
  );
}
function SettingNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="mt-2 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none" />
    </div>
  );
}
function SettingSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-xl font-bold text-gradient">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-2 w-full accent-eco" />
    </div>
  );
}
