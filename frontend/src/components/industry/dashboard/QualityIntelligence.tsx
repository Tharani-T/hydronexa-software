import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Activity, BarChart3, Brain, AlertTriangle, Leaf, FileText, Settings,
  Droplets, Recycle, Gauge, Waves, Factory, Cpu, Sparkles, TrendingUp, Save, ArrowRight, Loader2, Zap,
  RefreshCcw, CheckCircle2, Timer, Wind, ArrowDownCircle, ArrowUpCircle, ShieldCheck,
  FlaskConical, Thermometer, FlaskRound, Info, Beaker, ZapOff, TrendingDown, Calendar,
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check, PieChart
} from "lucide-react";
import { useThingSpeak, SensorData } from "@/hooks/useThingSpeak";
import { THRESHOLDS } from "@/lib/config";
import { DigitalTwin } from "@/components/DigitalTwin";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  useAdaptive,
  triggerBuzzer,
  triggerAnalytics5SecHorn,
  CountUp,
  PredictiveAlert,
  TelemetryRow,
  MiniStat
} from "./shared";

export function QualityIntelligence({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const temp = data?.temperature ?? 25.0;

  // Level Sensor reading threshold
  const [overridePh, setOverridePh] = useState<number | null>(null);
  const [isWaterReady, setIsWaterReady] = useState(false);
  const isReuseActive = (data?.reuseFlow ?? 0) > 0;
  
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const { state } = useAppState();
  const [dailyTarget, setDailyTarget] = useState(state.setup.dailyReuseTarget || 500);
  const [simWeek, setSimWeek] = useState<number>(0);
  
  const [todayReuseCycles, setTodayReuseCycles] = useState(() => parseInt(localStorage.getItem("qi_reuseCycles") || "0"));
  const [todayActualReuseCount, setTodayActualReuseCount] = useState(() => parseInt(localStorage.getItem("qi_actualReuseCount") || "0"));
  const [todayReused, setTodayReused] = useState(() => parseFloat(localStorage.getItem("qi_todayReused") || "0"));
  const lastDayCount = useRef(parseInt(localStorage.getItem('completedDaysCount_v6') || '6'));
  const triggeredReadyRef = useRef(false);
  const triggeredReuseRef = useRef(false);

  // Workflow logic
  useEffect(() => {
    const level = data?.waterLevel ?? 0;
    const reuseFlow = data?.reuseFlow ?? 0;

    // 1. Level Sensor Trigger & pH Override
    if (level === 4095) {
      setOverridePh(7.0);
      
      if (reuseFlow > 0) {
        setIsWaterReady(false);
        if (!triggeredReuseRef.current) {
           triggeredReuseRef.current = true;
           setTodayActualReuseCount(prev => {
               const next = prev + 1;
               localStorage.setItem("qi_actualReuseCount", next.toString());
               return next;
           });
        }
      } else {
        if (!triggeredReadyRef.current) {
           triggeredReadyRef.current = true;
           setTodayReuseCycles(prev => {
               const next = prev + 1;
               localStorage.setItem("qi_reuseCycles", next.toString());
               return next;
           });
        }
        setIsWaterReady(true);
      }
    } else {
      setOverridePh(null);
      setIsWaterReady(false);
      triggeredReadyRef.current = false;
      triggeredReuseRef.current = false;
    }

  }, [data?.waterLevel, data?.reuseFlow]);

  useEffect(() => {
    let interval: any;
    if (isWaterReady) {
      triggerBuzzer(); // Initial beep
      interval = setInterval(() => triggerBuzzer(), 2000); // Continuous buzzer
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaterReady]);

  const ph = overridePh !== null ? overridePh : 0.0;

  // Adaptive threshold settings
  const phMin = a.phMin ?? 6.5;
  const phMax = a.phMax ?? 8.5;
  const tempMax = a.tempMax ?? 35;
  const industryName = a.plantName ?? "HydroNexa Plant";
  const industryType = a.type ?? "Industrial";
  const userEmail = a.email || state.currentUserEmail || state.setup?.email || localStorage.getItem("userEmail") || localStorage.getItem("user_email") || "";
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

  // 4. (Removed) Automated SMTP warning email trigger for quality breach removed as per user request.

  const sendingAlertRef = useRef(false);

  useEffect(() => {
    const currentSimWeek = simWeek === 0 ? 1 : simWeek;
    const storageKey = `qi_weekly_alert_sent_week_${currentSimWeek}`;

    // Count how many days in the current simulated week missed the review target
    const missedCount = timelineData.slice(0, 7).filter((row) => {
       const rowTarget = row.target || dailyTarget;
       const percentReused = rowTarget > 0 ? (row.reused / rowTarget) * 100 : 0;
       return row.status === "Missed Target" || row.reused < rowTarget || (!row.status && percentReused < 100);
    }).length;

    const emailAlreadySent = localStorage.getItem(storageKey) === "true";

    // Send email only when missed count reaches 2 or more, and email hasn't been sent yet for this week
    if (missedCount >= 2 && !emailAlreadySent && !sendingAlertRef.current) {
       sendingAlertRef.current = true;

       const recipient = userEmail || "";

       fetch('/api/send-weekly-review-alert', {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json'
          },
          body: JSON.stringify({
             to: recipient,
             industryName: industryName || "HydroNexa Plant",
             simulatedWeek: currentSimWeek,
             missedCount: missedCount
          })
       })
       .then(res => {
          if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
          return res.json();
       })
       .then(data => {
          sendingAlertRef.current = false;
          if (data.success) {
             localStorage.setItem(storageKey, "true");
             console.log(`✅ Weekly Review Alert Email sent successfully for Simulated Week ${currentSimWeek}:`, data);
          } else {
             console.error(`❌ Failed to deliver Weekly Review Alert Email for Week ${currentSimWeek}:`, data.error);
          }
       })
       .catch(err => {
          sendingAlertRef.current = false;
          console.error(`❌ Network error sending Weekly Review Alert Email for Week ${currentSimWeek}:`, err);
       });
    }
  }, [timelineData, dailyTarget, userEmail, industryName, token, simWeek]);

  useEffect(() => {
    async function fetchTarget() {
      if (userEmail) {
        try {
          const { data, error } = await supabase
            .from('industry')
            .select('daily_reuse_target')
            .eq('email', userEmail)
            .limit(1);
          
          if (data && data.length > 0 && !error) {
            const record = data[0];
            if (record.daily_reuse_target != null) {
              setDailyTarget(record.daily_reuse_target);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchTarget();
  }, [userEmail]);

  const lastProcessedTimeRef = useRef<string | null>(null);
  const lastFlowRef = useRef<number | null>(null);

  useEffect(() => {
     const flow = data?.reuseFlow ?? 0;
     const timestamp = data?.timestamp;

     if (timestamp && timestamp !== lastProcessedTimeRef.current) {
        lastProcessedTimeRef.current = timestamp;
        
        if (flow !== lastFlowRef.current) {
           setTodayReused(flow);
           localStorage.setItem("qi_todayReused", flow.toString());
        }
        
        lastFlowRef.current = flow;
     }
  }, [data?.reuseFlow, data?.timestamp]);

  useEffect(() => {
    const handleSync = () => {
       const currentDayCount = parseInt(localStorage.getItem('completedDaysCount_v6') || '6');
       if (currentDayCount > lastDayCount.current) {
           // 1. Save row to Daily Reuse Performance Timeline
           const history = JSON.parse(localStorage.getItem('qualityTimeline_v2') || '[]');
           const d = new Date();
           d.setDate(d.getDate() + history.length + 1);
           
           const status = Math.round(todayReused) >= dailyTarget ? "Target Achieved" : "Missed Target";
           const newRow = {
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
              ready: Math.round(todayReused),
              reused: Math.round(todayReused),
              cycles: todayReuseCycles,
              actualCount: todayActualReuseCount,
              target: dailyTarget,
              status: status,
              isLive: false
           };
           
           const updated = [newRow, ...history];
           localStorage.setItem('qualityTimeline_v2', JSON.stringify(updated));
           setTimelineData(updated);
           
           // 2. Reset ONLY the Reuse Target Achievement section
           setTodayReused(0);
           localStorage.setItem("qi_todayReused", "0");
           
           lastDayCount.current = currentDayCount;
       }
    };
    
    window.addEventListener('sync-storage-intelligence', handleSync);
    return () => window.removeEventListener('sync-storage-intelligence', handleSync);
  }, [todayReused, todayReuseCycles, todayActualReuseCount, dailyTarget]);

  const currentAchieved = todayReused;
  const achievementPercentage = dailyTarget > 0 ? (currentAchieved / dailyTarget) * 100 : 0;

  const [strategy, setStrategy] = useState<any>(null);
  const [baseHistory, setBaseHistory] = useState<any[]>([]);

  useEffect(() => {
     const str = localStorage.getItem('waterNextWeekStrategy_mock');
     if (str) setStrategy(JSON.parse(str));
     
     const handleStorage = () => {
         const updatedStr = localStorage.getItem('waterNextWeekStrategy_mock');
         if (updatedStr) setStrategy(JSON.parse(updatedStr));
     };
     window.addEventListener('storage', handleStorage);
     return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const generateRecord = () => {
      const d = new Date();
      // place the new record after today (live row) by setting date to tomorrow + existing entries length
      d.setDate(d.getDate() + timelineData.length);
      const reused = Math.floor(Math.random() * (dailyTarget * 0.5) + (dailyTarget * 0.8));
      const ready = Math.round(reused * 1.05);
      const cycles = reused > 0 ? Math.max(1, Math.floor(reused / 3)) : 0;
      return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        ready,
        reused,
        cycles,
        actualCount: cycles,
        target: dailyTarget,
        isLive: false,
      };
   };

   const handleSimulateNextWeek = () => {
      const nextWeek = simWeek >= 4 ? 1 : simWeek + 1;
      setSimWeek(nextWeek);

      // Reset email trigger for the new simulated week
      localStorage.setItem(`qi_weekly_alert_sent_week_${nextWeek}`, "false");

      const d = new Date();
      d.setDate(d.getDate() + timelineData.length);
      const reused = Math.floor(Math.random() * (dailyTarget * 0.5) + (dailyTarget * 0.8));
      const ready = Math.round(reused * 1.05);
      const cycles = reused > 0 ? Math.max(1, Math.floor(reused / 3)) : 0;
      const newRecord = {
         date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
         ready,
         reused,
         cycles,
         actualCount: cycles,
         target: dailyTarget,
         isLive: false,
      };

      if (nextWeek === 1) {
         const liveRow = timelineData.find(row => row.isLive) || {
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            ready: currentAchieved,
            reused: currentAchieved,
            cycles: todayReuseCycles,
            actualCount: todayActualReuseCount,
            target: dailyTarget,
            isLive: true
         };
         const updated = [liveRow, newRecord];
         localStorage.setItem('qualityTimeline_v2', JSON.stringify(updated));
         setTimelineData(updated);
      } else {
         const updated = [newRecord, ...timelineData];
         localStorage.setItem('qualityTimeline_v2', JSON.stringify(updated));
         setTimelineData(updated);
      }
   };

  useEffect(() => {
     let history = JSON.parse(localStorage.getItem('qualityTimeline_v2') || '[]');
     
     if (history.length === 0) {
        // Week 1 Initial Default Data
        const today = new Date();
        const fallbackDays = [
           { reused: 12, cycles: 4, actualCount: 4, ready: 14 },
           { reused: 9, cycles: 3, actualCount: 3, ready: 10 },
           { reused: 15, cycles: 5, actualCount: 5, ready: 18 }
        ];
        
        for (let i = 1; i <= 3; i++) {
           const d = new Date(today);
           d.setDate(d.getDate() - i);
           const dayInfo = fallbackDays[i-1];
           
           history.unshift({
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
              ready: dayInfo.ready,
              reused: dayInfo.reused,
              cycles: dayInfo.cycles,
              actualCount: dayInfo.actualCount,
              target: 8, // Fixed to 8 L as specified for Week 1
              isLive: false
           });
        }
        localStorage.setItem('qualityTimeline_v2', JSON.stringify(history));
     }

     // Store base history for reset purposes
     setBaseHistory(history);

     const actuallyReusedToday = currentAchieved;
     const todayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
     
     const liveRow = {
        date: todayDate,
        ready: actuallyReusedToday,
        reused: actuallyReusedToday,
        cycles: todayReuseCycles,
        actualCount: todayActualReuseCount,
        target: dailyTarget, // Active target for the live row
        isLive: true
     };
     
     setTimelineData([liveRow, ...history]);
  }, [currentAchieved, dailyTarget, todayReuseCycles, todayActualReuseCount]);

  let statusText = "Needs Improvement";
  let badgeColorClass = "border-danger text-danger bg-danger/10";
  let barColorClass = "bg-danger shadow-[0_0_15px_rgba(239,68,68,0.5)]";
  let textColorClass = "text-danger";

  if (achievementPercentage >= 100) {
    statusText = "Target Achieved";
    badgeColorClass = "border-eco text-eco bg-eco/10";
    barColorClass = "bg-eco shadow-[0_0_15px_rgba(34,197,94,0.5)]";
    textColorClass = "text-eco";
  } else if (achievementPercentage >= 70) {
    statusText = "On Track";
    badgeColorClass = "border-amber-400 text-amber-400 bg-amber-400/10";
    barColorClass = "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]";
    textColorClass = "text-amber-400";
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Level AI Quality Decision Alert */}
      <AnimatePresence>
         {isOptimal && ph >= 6.8 && ph <= 7.2 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
               className="glass-strong border-2 border-eco/50 bg-eco/10 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,255,0,0.2)] flex items-center gap-4"
            >
               <div className="h-12 w-12 rounded-full bg-eco flex items-center justify-center shadow-[0_0_20px_var(--eco)] animate-pulse shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-black" />
               </div>
               <div>
                  <span className="text-xs uppercase tracking-widest font-black text-eco">Water Quality Approved</span>
                  <div className="text-lg font-black text-white">The treated water is ready for reuse.</div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Premium AI Reusability Intelligence Engine Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Reuse Eligibility */}
         <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Recycle className={`h-16 w-16 text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }} /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Water Reuse Eligibility</div>
               <div className={`text-2xl font-black font-display tracking-tight text-${reuseColor}`} style={{ color: `var(--${reuseColor})` }}>
                  {reuseSuitability === "Safe for Reuse" ? "ELIP-1: Fully Reusable" : reuseSuitability === "Conditional Reuse" ? "ELIP-2: Filter & Recycle" : "ELIP-3: Water is not available"}
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
               <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">System Reuse Confidence</div>
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
               <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">System telemetry live sync</span>
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
      <div className="grid lg:grid-cols-2 gap-6 relative">
        
        {/* Reuse Start Confirmation */}
        {/* {isReuseActive && (
           <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-eco/20 border border-eco text-eco text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse z-20 flex items-center gap-2">
              <span className="text-sm">🟢</span> Reuse Process Active: Reuse water transfer has started successfully.
           </div>
        )} */}

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

              {/* Smart Recommendation */}
              <div className={`mt-6 border rounded-xl p-4 flex gap-3 items-start transition-all ${ph >= 6.8 && ph <= 7.2 ? 'bg-eco/10 border-eco/20' : 'bg-white/5 border-white/10'}`}>
                 <Brain className={`h-5 w-5 shrink-0 mt-0.5 ${ph >= 6.8 && ph <= 7.2 ? 'text-eco' : 'text-muted-foreground'}`} />
                 <div className="flex flex-col gap-1">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${ph >= 6.8 && ph <= 7.2 ? 'text-eco' : 'text-muted-foreground'}`}>Smart Recommendation</span>
                    <span className="text-xs text-white/90 font-bold leading-relaxed">
                       {ph >= 6.8 && ph <= 7.2 
                          ? "Water quality meets the required standards. Turn OFF the Fresh Water Supply and switch ON the Reuse Water Supply to maximize water conservation."
                          : "Water quality is outside optimal reuse levels. Continue treatment cycles before switching supplies."}
                    </span>
                 </div>
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


      {/* -------------------------------------------------------- */}
      {/* REUSE TARGET ACHIEVEMENT SECTION */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 mt-8">
         <div className="glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden flex flex-col justify-center">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000 ${achievementPercentage >= 100 ? 'bg-eco/5' : achievementPercentage >= 70 ? 'bg-amber-400/5' : 'bg-danger/5'}`} />

            <div className="flex items-center justify-between mb-10 z-10 relative">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                     <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                     <h4 className="font-black text-xl text-white tracking-widest uppercase drop-shadow-sm">Reuse Target Achievement</h4>
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Daily Reused Water vs Target</p>
                  </div>
               </div>
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-glow-sm transition-all duration-500 ${badgeColorClass}`}>
                  {statusText}
               </div>
            </div>

            <div className="space-y-6 z-10 relative">
               <div className="flex justify-between items-end mb-2">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Current Reused Water</span>
                     <span className="text-4xl font-black text-white">{currentAchieved.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} <span className="text-xl text-white/60">L</span></span>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Daily Reuse Target</span>
                     <span className="text-2xl font-bold text-white/80">{dailyTarget.toLocaleString()} <span className="text-sm">L</span></span>
                  </div>
               </div>
               
               {/* Bullet Chart Container */}
               <div className="relative h-8 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
                  {/* Progress Bar */}
                  <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, achievementPercentage)}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className={`h-full rounded-full transition-colors duration-500 ${barColorClass} relative overflow-hidden`}
                  >
                     {/* Shimmer effect */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                  
                  {/* Target Marker */}
                  <div className="absolute top-0 bottom-0 right-0 w-1 bg-white shadow-[0_0_10px_white] z-20" />
               </div>
               
               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white/40">0 L</span>
                  <span className={textColorClass}>Achievement: {achievementPercentage.toFixed(1)}%</span>
               </div>
            </div>
         </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* WEEKLY REUSE TIMELINE SECTION */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 mt-8">
         <div className="glass-strong rounded-3xl p-8 border border-glass-border">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                     <History className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                     <h4 className="font-black text-xl text-white tracking-widest uppercase drop-shadow-sm">Weekly Reuse Timeline</h4>
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Operational Summary & CTO Impact</p>
                  </div>
               </div>
               <button onClick={handleSimulateNextWeek} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg active:scale-95">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  Simulate Next Week
               </button>
            </div>

            <div className="space-y-3">
               <div className="grid grid-cols-8 gap-4 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                  <div className="col-span-1">Date</div>
                  <div className="col-span-1 text-center">Daily Reuse Target</div>
                  <div className="col-span-1 text-center">Ready for Reuse</div>
                  <div className="col-span-1 text-center">Actually Reused</div>
                  <div className="col-span-1 text-center">Reuse Cycles</div>
                  <div className="col-span-1 text-center">Actual Reuse Count</div>
                  <div className="col-span-1 text-center">CTO Impact</div>
                  <div className="col-span-1 text-right">Details</div>
               </div>

               {/* Rows */}
               {timelineData.slice(0, 7).map((row, idx) => {
                  const rowTarget = row.target || dailyTarget; // Fallback
                  const percentReused = rowTarget > 0 ? (row.reused / rowTarget) * 100 : 0;
                  
                  let statusColor = "bg-danger/10 border-danger/20 text-danger";
                  let dotColor = "bg-danger shadow-glow-danger";
                  
                  if (percentReused >= 90) {
                     statusColor = "bg-eco/10 border-eco/20 text-eco";
                     dotColor = "bg-eco shadow-glow-eco";
                  } else if (percentReused >= 60) {
                     statusColor = "bg-amber-400/10 border-amber-400/20 text-amber-400";
                     dotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]";
                  }

                  return (
                     <div key={idx} className="grid grid-cols-8 gap-4 px-6 py-4 items-center rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors duration-300 group">
                        <div className="col-span-1 flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full flex-shrink-0 relative">
                              {row.isLive ? (
                                 <div className="absolute inset-0 rounded-full animate-ping bg-cyan opacity-75" />
                              ) : null}
                              <div className={`absolute inset-0 rounded-full ${dotColor}`} />
                           </div>
                           <span className="text-sm font-bold text-white group-hover:text-cyan transition-colors whitespace-nowrap">{row.date} {row.isLive && <span className="text-[9px] text-cyan ml-1">(Live)</span>}</span>
                        </div>
                        <div className="col-span-1 text-center">
                           <span className="text-sm font-bold text-white/70">{rowTarget.toLocaleString()} L</span>
                        </div>
                        <div className="col-span-1 text-center">
                           <span className="text-sm font-bold text-white/70">{row.ready.toLocaleString()} L</span>
                        </div>
                        <div className="col-span-1 text-center">
                           <div className={`inline-flex px-3 py-1 rounded-full border ${statusColor} transition-all`}>
                              <span className="text-xs font-black">{row.reused.toLocaleString()} L</span>
                           </div>
                        </div>
                        <div className="col-span-1 text-center flex items-center justify-center gap-1.5">
                           <RefreshCcw className="h-3 w-3 text-muted-foreground" />
                           <span className="text-sm font-bold text-white/90">{row.isLive ? todayReuseCycles : row.cycles}</span>
                        </div>
                        <div className="col-span-1 text-center flex items-center justify-center gap-1.5">
                           <RefreshCcw className="h-3 w-3 text-cyan" />
                           <span className="text-sm font-bold text-white/90">{row.isLive ? todayActualReuseCount : (row.actualCount ?? row.cycles)}</span>
                        </div>
                        <div className="col-span-1 text-center">
                           <div className="flex items-center justify-center gap-1.5 text-cyan">
                              <ArrowDownCircle className="h-4 w-4 shrink-0" />
                              <span className="text-sm font-black whitespace-nowrap">{row.reused.toLocaleString()} L <span className="hidden lg:inline text-[9px] text-cyan/70 uppercase">Saved</span></span>
                           </div>
                        </div>
                        <div className="col-span-1 text-right flex flex-col items-end">
                           {idx === 0 ? (
                              <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">On Track</span>
                           ) : (row.status === "Target Achieved" || (!row.status && percentReused >= 100)) ? (
                              <span className="text-[9px] font-black text-eco uppercase tracking-wider bg-eco/10 px-2 py-0.5 rounded border border-eco/20">Target Achieved</span>
                           ) : (
                              <>
                                 <span className="text-[9px] font-black text-danger uppercase tracking-wider bg-danger/10 px-2 py-0.5 rounded border border-danger/20 mb-0.5 whitespace-nowrap">Missed Target</span>
                                 <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">Exceeds CTO Limit</span>
                              </>
                           )}
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* REUSE ACHIEVEMENT SUMMARY SECTION */}
      {/* -------------------------------------------------------- */}
      <div className="mt-8">
         <div className="flex items-center gap-3 mb-6 px-2">
            <div className="h-8 w-8 rounded-lg bg-eco/10 flex items-center justify-center border border-eco/20 shadow-inner">
               <Award className="h-4 w-4 text-eco" />
            </div>
            <div>
               <h4 className="font-black text-lg text-white tracking-widest uppercase drop-shadow-sm">Reuse Achievement Summary</h4>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-strong rounded-3xl p-6 border border-glass-border hover:bg-white/5 transition-colors duration-300 group flex flex-col justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4 group-hover:text-cyan transition-colors">Today Reused Water</span>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white font-display tracking-tight">{Math.round(currentAchieved).toLocaleString()}</span>
                  <span className="text-base font-bold text-white/50">L</span>
               </div>
            </div>
            <div className="glass-strong rounded-3xl p-6 border border-glass-border hover:bg-white/5 transition-colors duration-300 group flex flex-col justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4 group-hover:text-eco transition-colors">Monthly Reused Water</span>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white font-display tracking-tight">{(Math.round(currentAchieved) + 1240).toLocaleString()}</span>
                  <span className="text-base font-bold text-white/50">L</span>
               </div>
            </div>
            <div className="glass-strong rounded-3xl p-6 border border-glass-border hover:bg-white/5 transition-colors duration-300 group flex flex-col justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4 group-hover:text-indigo-400 transition-colors">Yearly Reused Water</span>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white font-display tracking-tight">{(Math.round(currentAchieved) + 14860).toLocaleString()}</span>
                  <span className="text-base font-bold text-white/50">L</span>
               </div>
            </div>
         </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* MONTHLY REUSE TARGET PROGRESS */}
      {/* -------------------------------------------------------- */}
      {(() => {
         const monthlyTarget = state.setup.monthlyReuseTarget || (dailyTarget * 30);
         const weeklyTarget = monthlyTarget / 4;

         const currentSim = simWeek === 0 ? 1 : simWeek;

         const simulatedWeekValues = [
            weeklyTarget * 1.319,
            weeklyTarget * 1.333,
            weeklyTarget * 1.333,
            weeklyTarget * 1.200,
         ];

         const weeks = [1, 2, 3, 4].map((wNum, idx) => {
            const isCompleted = wNum <= currentSim;
            const reused = isCompleted ? simulatedWeekValues[idx] : 0;
            return {
               name: `Week ${wNum}`,
               reused,
               isCompleted,
            };
         });

         const totalReused = weeks.reduce((acc, w) => acc + w.reused, 0);
         const monthlyAchievement = monthlyTarget > 0 ? (totalReused / monthlyTarget) * 100 : 0;

         let overallStatus = "🟡 Needs Improvement";
         let overallColor = "text-amber-400 bg-amber-400/10 border-amber-400/20";
         let overallBarColor = "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]";
         let overallSummary = "Monthly reuse target is below expectation. Increase reuse operations in the upcoming weeks.";

         if (monthlyAchievement >= 90) {
            overallStatus = "🟢 On Track";
            overallColor = "text-eco bg-eco/10 border-eco/20";
            overallBarColor = "bg-eco shadow-[0_0_15px_rgba(34,197,94,0.5)]";
            overallSummary = "Monthly reuse target is on track. Continue the current reuse strategy.";
         } else if (monthlyAchievement < 70) {
            overallStatus = "🔴 Critical";
            overallColor = "text-danger bg-danger/10 border-danger/20";
            overallBarColor = "bg-danger shadow-[0_0_15px_rgba(239,68,68,0.5)]";
            overallSummary = "Monthly reuse target is critically low. Immediate operational adjustments are required.";
         }

         return (
            <div className="mt-8">
               <div className="glass-strong rounded-3xl p-8 border border-glass-border relative overflow-hidden flex flex-col">
                  {/* Background Glow */}
                  <div className={`absolute top-0 right-0 w-[500px] h-[500px] blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-1000 ${monthlyAchievement >= 90 ? 'bg-eco/5' : monthlyAchievement >= 70 ? 'bg-amber-400/5' : 'bg-danger/5'}`} />

                  <div className="flex items-center justify-between mb-8 z-10">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                           <Target className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                           <h4 className="font-black text-xl text-white tracking-widest uppercase drop-shadow-sm">Monthly Reuse Target Progress</h4>
                           <span className="text-[10px] text-white/50 font-black tracking-widest block mb-1 group-hover:text-eco transition-colors">Target: {monthlyTarget.toLocaleString()} L</span>
                           <span className="text-[10px] text-cyan font-black tracking-widest block">Week {currentSim} Completed</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6 z-10">
                     {weeks.map((week, idx) => {
                        const weekPercent = weeklyTarget > 0 ? (week.reused / weeklyTarget) * 100 : 0;
                        let barColor = "bg-white/10";
                        let statusText = "⚪ Pending";
                        if (week.isCompleted) {
                           if (weekPercent >= 90) {
                              barColor = "bg-eco";
                              statusText = "🟢 ON TRACK";
                           } else if (weekPercent >= 70) {
                              barColor = "bg-amber-400";
                              statusText = "🟡 Near Target";
                           } else {
                              barColor = "bg-danger";
                              statusText = "🔴 Below Target";
                           }
                        }

                        return (
                           <div key={idx} className="flex flex-col gap-2">
                              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                 <span className={week.isCompleted ? "text-white/80" : "text-white/40"}>{week.name}</span>
                                 <span className={week.isCompleted ? "text-white/80" : "text-white/30"}>
                                    {statusText} ({weekPercent.toFixed(1)}%)
                                 </span>
                              </div>
                              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, weekPercent)}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={`h-full rounded-full ${barColor}`}
                                 />
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 z-10">
                     <div className="flex justify-between items-end mb-4">
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">Overall Monthly Progress</span>
                           <span className="text-3xl font-black text-white">{monthlyAchievement.toFixed(1)}%</span>
                        </div>
                        <div className="text-right">
                           <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 inline-flex items-center shadow-glow-sm ${overallColor}`}>
                              {overallStatus}
                           </div>
                        </div>
                     </div>
                     
                     <div className="relative h-6 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner mb-3">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${Math.min(100, monthlyAchievement)}%` }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className={`h-full rounded-full transition-colors duration-500 ${overallBarColor} relative overflow-hidden`}
                        >
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
                        </motion.div>
                     </div>
                     
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40 mb-8">
                        <span>{totalReused.toLocaleString()} L Reused</span>
                        <span>Target: {monthlyTarget.toLocaleString()} L</span>
                     </div>

                     <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                        <span className="text-xs text-white/80 font-medium leading-relaxed tracking-wide">
                           {overallSummary}
                        </span>
                     </div>
                  </div>

               </div>
            </div>
         );
      })()}

      {/* -------------------------------------------------------- */}
      {/* READY FOR REUSE ALERT NOTIFICATION */}
      {/* -------------------------------------------------------- */}
      {isWaterReady && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/95 border-2 border-eco rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(34,197,94,0.4)] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-eco/10 animate-pulse pointer-events-none" />
            
            <h2 className="text-xl font-display font-black text-eco mb-6 uppercase tracking-widest relative z-10 flex items-center gap-2">
              <span className="text-2xl animate-bounce">✅</span> Water Ready for Reuse
            </h2>
            
            <div className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mb-4 relative z-10 text-left">
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-black mb-1">Message:</div>
              <div className="text-white/90 font-medium leading-relaxed">
                The treated water is ready for reuse. Please switch <span className="font-black text-eco underline">OFF</span> the Fresh Water Tank and switch to the Reuse Water Tank.
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

export function PHLabel({ label, range, color, active }: any) {
  return (
    <div className={`p-3 rounded-xl border transition-all ${active ? `bg-${color}/10 border-${color}/40 border-2` : 'bg-white/5 border-glass-border'}`} style={active ? { borderColor: `var(--${color})`, background: `color-mix(in oklab, var(--${color}) 10%, transparent)` } : {}}>
       <div className={`text-[10px] font-black uppercase mb-0.5 ${active ? `text-${color}` : 'text-muted-foreground'}`} style={active ? { color: `var(--${color})` } : {}}>{label}</div>
       <div className="text-[8px] font-bold text-muted-foreground">{range} pH</div>
    </div>
  );
}

export function QualityInsight({ label, text, icon: Ic, color }: any) {
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
