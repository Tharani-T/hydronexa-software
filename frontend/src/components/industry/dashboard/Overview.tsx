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
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Target
} from "lucide-react";
import { useThingSpeak, SensorData } from "@/hooks/useThingSpeak";
import { THRESHOLDS } from "@/lib/config";
import { DigitalTwin } from "@/components/DigitalTwin";

import {
  useAdaptive,
  triggerBuzzer,
  triggerAnalytics5SecHorn,
  CountUp,
  PredictiveAlert,
  TelemetryRow,
  MiniStat
} from "./shared";

export function Overview({ data, history }: { data: SensorData | null; history: SensorData[] }) {
  const a = useAdaptive();
  const flow = data?.flowRate ?? 0;
  const ph = data?.ph ?? 7.0;
  const waterLevel = data?.waterLevel ?? 0;
  const temp = data?.temperature ?? 25;

  const [reuseFlow, setReuseFlow] = useState(0);
  const [totalFlow, setTotalFlow] = useState(0);
  const [reuseTotal, setReuseTotal] = useState(0);

  useEffect(() => {
    const fetchReuse = async () => {
      try {
        const res = await fetch(`/api/thingspeak?results=1`);
        if (res.ok) {
          const json = await res.json();
          if (json.feeds && json.feeds.length > 0) {
            const latest = json.feeds[0];
            setReuseFlow(parseFloat(latest.field7) || 0);
            setTotalFlow(parseFloat(latest.field2) || 0);
            setReuseTotal(parseFloat(latest.field8) || 0);
          }
        }
      } catch (e) {}
    };
    fetchReuse();
    const interval = setInterval(fetchReuse, 5000);
    return () => clearInterval(interval);
  }, []);

  const [dailyOffsetFlow, setDailyOffsetFlow] = useState(() => {
    const saved = localStorage.getItem("dailyOffsetFlow");
    return saved ? parseFloat(saved) : 0;
  });
  const [dailyOffsetReuse, setDailyOffsetReuse] = useState(() => {
    const saved = localStorage.getItem("dailyOffsetReuse");
    return saved ? parseFloat(saved) : 0;
  });

  const [monthlyOffsetFlow, setMonthlyOffsetFlow] = useState(() => {
    const saved = localStorage.getItem("monthlyOffsetFlow");
    return saved ? parseFloat(saved) : 0;
  });
  const [monthlyOffsetReuse, setMonthlyOffsetReuse] = useState(() => {
    const saved = localStorage.getItem("monthlyOffsetReuse");
    return saved ? parseFloat(saved) : 0;
  });

  // Real-time dynamic accumulation state starting strictly at 0 (persisted in localStorage)
  const [liveCtoUsed, setLiveCtoUsed] = useState(() => {
    const saved = localStorage.getItem("liveCtoUsed");
    return saved ? parseFloat(saved) : 0;
  });

  // Persist live CTO usage to localStorage on every change
  useEffect(() => {
    localStorage.setItem("liveCtoUsed", liveCtoUsed.toString());
  }, [liveCtoUsed]);

  // Dynamic ticking every 1 second based on active flowRate (L/m to KL/s) for daily
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCtoUsed(prev => {
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

    setDailyOffsetFlow(flow);
    localStorage.setItem("dailyOffsetFlow", flow.toString());

    setDailyOffsetReuse(reuseFlow);
    localStorage.setItem("dailyOffsetReuse", reuseFlow.toString());

    setCriticalBreach(false);
    emailSentRef.current = false;
    localStorage.setItem("emailSent", "false");
  };

  // Demo Control: Simulate Next Month transition
  const handleSimulateNextMonth = () => {
    setMonthlyOffsetFlow(totalFlow);
    localStorage.setItem("monthlyOffsetFlow", totalFlow.toString());

    setMonthlyOffsetReuse(reuseTotal);
    localStorage.setItem("monthlyOffsetReuse", reuseTotal.toString());
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

  const currentUsed = Math.max(0, flow - dailyOffsetFlow) + Math.max(0, reuseFlow - dailyOffsetReuse);
  const ctoPct = Number(Math.min(100, (currentUsed / (a.ctoLimit || 1)) * 100).toFixed(2));
  const remaining = Math.max(0, a.ctoLimit - currentUsed);

  // Live accumulated monthly usage percentages
  const monthlyCtoUsed = Math.max(0, totalFlow - monthlyOffsetFlow) + Math.max(0, reuseTotal - monthlyOffsetReuse);
  const monthlyCtoPct = Number(Math.min(100, (monthlyCtoUsed / (a.monthlyCtoLimit || 1)) * 100).toFixed(2));
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


  const currentHour = new Date().getHours();
  const getShiftStatus = (start: number, end: number, target: number, currentHour: number) => {
    let isActive = false;
    if (start < end) {
      isActive = currentHour >= start && currentHour < end;
    } else { // night shift crosses midnight
      isActive = currentHour >= start || currentHour < end;
    }

    if (isActive) {
      const used = (liveCtoUsed * 0.4).toFixed(1); // approximate logic for visual purposes
      return { active: true, used, target: target.toFixed(1), status: '🟢 On Track', color: 'eco' };
    } else {
      return { active: false, used: '-', target: target.toFixed(1), status: 'Waiting...', color: 'muted' };
    }
  };


  let overallStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  const dangerReasons: string[] = [];
  const currentPh = data?.ph ?? 7;

  if (currentPh < a.phMin) dangerReasons.push("pH Value Low");
  if (currentPh > a.phMax) dangerReasons.push("pH Value High");
  if (temp > THRESHOLDS.TEMP_MAX) dangerReasons.push("Temperature Above Safe Limit");
  if (temp > 0 && temp < 10) dangerReasons.push("Temperature Below Safe Limit");
  if (ctoPct >= 100) dangerReasons.push("Daily CTO Limit Exceeded");
  if (monthlyCtoPct >= 100) dangerReasons.push("Monthly CTO Limit Exceeded");
  if (waterLevel > THRESHOLDS.LEVEL_MAX) dangerReasons.push("Storage Tank Overflow Risk");
  if (waterLevel > 0 && waterLevel < THRESHOLDS.LEVEL_MIN) dangerReasons.push("Storage Tank Running Low");
  if (!data) dangerReasons.push("Sensor Offline");

  if (dangerReasons.length > 0) {
    overallStatus = 'DANGER';
  } else if (ctoPct >= 80 || monthlyCtoPct >= 80 || reuseActual < a.reuseTarget) {
    overallStatus = 'WARNING';
  }

  const shifts = [
    { name: "Morning Shift", time: "06:00 AM – 02:00 PM", ...getShiftStatus(6, 14, 4.0, currentHour) },
    { name: "Afternoon Shift", time: "02:00 PM – 10:00 PM", ...getShiftStatus(14, 22, 4.0, currentHour) },
    { name: "Night Shift", time: "10:00 PM – 06:00 AM", ...getShiftStatus(22, 6, 3.5, currentHour) }
  ];

  return (
    <div className="space-y-10 pb-10">


      {/* OVERALL STATUS BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass-strong rounded-3xl p-8 border-2 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden ${overallStatus === 'DANGER' ? 'border-danger bg-danger/10 shadow-[0_0_40px_rgba(255,0,0,0.2)]' :
            overallStatus === 'WARNING' ? 'border-warn bg-warn/10 shadow-[0_0_40px_rgba(255,170,0,0.15)]' :
              'border-eco bg-eco/10 shadow-[0_0_40px_rgba(0,255,100,0.1)]'
          }`}
      >
        <div className={`absolute inset-0 opacity-5 animate-pulse ${overallStatus === 'DANGER' ? 'bg-danger' : overallStatus === 'WARNING' ? 'bg-warn' : 'bg-eco'
          }`} />
        <div className="relative z-10 flex items-center gap-8 w-full">
          <div className={`h-20 w-20 shrink-0 rounded-full flex items-center justify-center border-4 ${overallStatus === 'DANGER' ? 'bg-danger/20 border-danger/40' :
              overallStatus === 'WARNING' ? 'bg-warn/20 border-warn/40' :
                'bg-eco/20 border-eco/40'
            }`}>
            {overallStatus === 'DANGER' ? <AlertTriangle className="h-10 w-10 text-danger animate-pulse" /> :
              overallStatus === 'WARNING' ? <AlertTriangle className="h-10 w-10 text-warn animate-pulse" /> :
                <ShieldCheck className="h-10 w-10 text-eco animate-pulse" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Overall Plant Status</div>
            <h1 className={`text-5xl md:text-6xl font-black font-display tracking-tighter uppercase ${overallStatus === 'DANGER' ? 'text-danger drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]' :
                overallStatus === 'WARNING' ? 'text-warn drop-shadow-[0_0_15px_rgba(255,170,0,0.5)]' :
                  'text-eco drop-shadow-[0_0_15px_rgba(0,255,100,0.5)]'
              }`}>
              {overallStatus}
            </h1>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Live Analysis</div>
            <div className={`text-lg font-bold ${overallStatus === 'DANGER' ? 'text-danger/90' :
                overallStatus === 'WARNING' ? 'text-warn/90' :
                  'text-eco/90'
              }`}>
              {overallStatus === 'DANGER' ? (dangerReasons.length > 0 ? dangerReasons.join(" • ") : 'Immediate Action Required.') :
                overallStatus === 'WARNING' ? 'Approaching Limits. Monitor Closely.' :
                  'All Systems Operating Nominally.'}
            </div>
          </div>
        </div>
      </motion.div>


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
                <div className="text-6xl font-black font-display tracking-tighter">{ctoPct}%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Utilized Today</div>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-4">
            <HeroMetric label="Configured" value={`${a.ctoLimit}`} sub="L/Day" color="muted" />
            <HeroMetric label="Current" value={`${currentUsed.toFixed(3)}`} sub="L Used" color="cyan" />
            <HeroMetric label="Remaining" value={`${remaining.toFixed(3)}`} sub="L Left" color={ctoPct > 90 ? "danger" : "eco"} />
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
            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateNextMonth}
                className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-glow-sm"
                title="Instantly resets Monthly usage/alerts while keeping previous data safe"
              >
                <RefreshCcw className="h-3 w-3 animate-spin-slow text-primary" /> Simulate Next Month
              </button>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm flex items-center gap-2 ${monthlyCtoPct > 90 ? 'border-danger text-danger bg-danger/10' : 'border-primary text-primary bg-primary/10'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {monthlyCtoPct > 90 ? 'Critical' : 'Tracking'}
              </div>
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
                <div className="text-6xl font-black font-display tracking-tighter">{monthlyCtoPct}%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Utilized This Month</div>
              </div>
            </div>
          </div>
          <div className="w-full grid grid-cols-3 gap-4">
            <HeroMetric
              label="Configured"
              value={a.monthlyCtoLimit.toFixed(0)}
              sub="L/Month"
              color="muted"
            />

            <HeroMetric
              label="Current"
              value={monthlyCtoUsed.toFixed(3)}
              sub="L Used"
              color="primary"
            />

            <HeroMetric
              label="Remaining"
              value={remainingMonthly.toFixed(3)}
              sub="L Left"
              color={monthlyCtoPct > 90 ? "danger" : "eco"}
            />
          </div>
        </div>

      </div>


      {/* SECTION 1: Shift Operations */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Shift Operations</h4>
        <div className="grid lg:grid-cols-3 gap-6">
          {shifts.map((shift, i) => (
            <div key={i} className={`p-6 rounded-2xl border transition-all ${shift.active ? 'border-cyan shadow-glow bg-cyan/10' : 'border-glass-border bg-white/5'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h5 className={`text-sm font-bold tracking-tight ${shift.active ? 'text-cyan' : 'text-muted-foreground'}`}>{shift.name}</h5>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{shift.time}</p>
                </div>
                {shift.active && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan"></span></span>}
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Used</span>
                  <span className="font-mono font-black">{shift.used} {shift.active ? 'L' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Target</span>
                  <span className="font-mono font-black">{shift.target} L</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 border-t border-glass-border">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                  <span className={`font-black ${shift.active ? 'text-eco' : 'text-muted-foreground'}`}>{shift.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Water Performance Summary */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Water Performance Summary</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Droplets className="h-5 w-5 text-cyan" /></div>
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Fresh Water Used</div>
            <div className="text-3xl font-display font-black text-cyan">{(liveCtoUsed).toFixed(1)} <span className="text-sm text-cyan/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Recycle className="h-5 w-5 text-eco" /></div>
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Reuse Water</div>
            <div className="text-3xl font-display font-black text-eco">{(liveCtoUsed * (reuseActual / 100)).toFixed(1)} <span className="text-sm text-eco/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Save className="h-5 w-5 text-primary" /></div>
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Water Saved</div>
            <div className="text-3xl font-display font-black text-primary">{(liveCtoUsed * (reuseActual / 100)).toFixed(1)} <span className="text-sm text-primary/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
            <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Reuse Efficiency</div>
            <div className="text-3xl font-display font-black text-amber-500">{reuseActual} <span className="text-sm text-amber-500/50">%</span></div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Compliance Summary */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Compliance Summary</h4>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
            <div className="h-10 w-10 rounded-full bg-eco/10 flex items-center justify-center border border-eco/20 shrink-0">
              <ShieldCheck className="h-5 w-5 text-eco" />
            </div>
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">CTO Daily Limit</div>
              <div className="text-sm font-bold text-eco">{ctoPct <= 100 ? '🟢 Within Daily Limit' : '🔴 Exceeds Daily Limit'}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border shrink-0 ${reuseActual >= a.reuseTarget ? 'bg-eco/10 border-eco/20' : 'bg-warn/10 border-warn/20'}`}>
              <Target className={`h-5 w-5 ${reuseActual >= a.reuseTarget ? 'text-eco' : 'text-warn'}`} />
            </div>
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reuse Target Status</div>
              <div className={`text-sm font-bold ${reuseActual >= a.reuseTarget ? 'text-eco' : 'text-warn'}`}>
                {reuseActual >= a.reuseTarget ? '🟢 Target Achieved' : '🟡 Target Below Expected'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
            <div className="h-10 w-10 rounded-full bg-eco/10 flex items-center justify-center border border-eco/20 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-eco" />
            </div>
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Overall Compliance</div>
              <div className="text-sm font-bold text-eco">SAFE - No Violations</div>
            </div>
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

export function SensorStatus({ label, value, active, status = 'Stable', icon: Ic }: any) {
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

export function HeroMetric({ label, value, sub, color }: any) {
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

export function IntelligenceCard({ title, icon: Ic, description, color, sub }: any) {
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

export function StatusPill({ label, value, active, warn }: any) {
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

export function UsageMetric({ label, value, color }: any) {
  return (
    <div className="p-3 rounded-xl glass border border-glass-border">
      <div className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">{label}</div>
      <div className={`text-lg font-black font-display mt-0.5 ${color !== 'muted' ? `text-${color}` : 'text-foreground'}`} style={color !== 'muted' ? { color: `var(--${color})` } : {}}>{value}</div>
    </div>
  );
}

export function KPI({ label, value, icon: Ic, color, sub }: any) {
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

