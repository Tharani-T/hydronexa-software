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
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check, PieChart
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

export function QualityIntelligence({ data }: { data: SensorData | null }) {
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

              {/* AI Recommendation */}
              <div className={`mt-6 border rounded-xl p-4 flex gap-3 items-start transition-all ${ph >= 6.8 && ph <= 7.2 ? 'bg-eco/10 border-eco/20' : 'bg-white/5 border-white/10'}`}>
                 <Brain className={`h-5 w-5 shrink-0 mt-0.5 ${ph >= 6.8 && ph <= 7.2 ? 'text-eco' : 'text-muted-foreground'}`} />
                 <div className="flex flex-col gap-1">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${ph >= 6.8 && ph <= 7.2 ? 'text-eco' : 'text-muted-foreground'}`}>AI Recommendation</span>
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
      {/* REUSE WATER UTILIZATION & COMPLIANCE SECTION */}
      {/* -------------------------------------------------------- */}
      <div className="grid lg:grid-cols-12 gap-6 mt-8">
         {/* Reuse Analytics (6 cols) */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border lg:col-span-6">
            <div className="flex items-center gap-2 mb-6">
               <Recycle className="h-4 w-4 text-eco" />
               <span className="text-[9px] uppercase tracking-widest font-black text-white/70">Reuse Water Utilization Analytics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-eco/10 border border-eco/30 shadow-[0_0_15px_rgba(0,255,0,0.1)] flex flex-col items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-eco">Daily</span>
                  <span className="text-2xl font-black font-display text-white">650 L</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Weekly</span>
                  <span className="text-2xl font-black font-display text-white">4,550 L</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Monthly</span>
                  <span className="text-2xl font-black font-display text-white">19,500 L</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Yearly</span>
                  <span className="text-2xl font-black font-display text-white">237,250 L</span>
               </div>
            </div>
         </div>

         {/* CTO Compliance Comparison (6 cols) */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6">
               <Target className="h-4 w-4 text-cyan" />
               <span className="text-[9px] uppercase tracking-widest font-black text-white/70">CTO Reuse Target Compliance</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
               <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
                     <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
                     <motion.circle 
                       cx="64" cy="64" r="56" fill="none" stroke="var(--eco)" strokeWidth="12" strokeLinecap="round"
                       strokeDasharray="351.8"
                       initial={{ strokeDashoffset: 351.8 }}
                       animate={{ strokeDashoffset: 351.8 - (351.8 * 97.5) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       style={{ filter: `drop-shadow(0 0 8px var(--eco))` }}
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                     <span className="text-2xl font-black text-white">97%</span>
                     <span className="text-[9px] font-bold uppercase text-white/50">Achieved</span>
                  </div>
               </div>
               <div className="flex-1 w-full flex flex-col gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-[9px] uppercase font-bold text-white/50">Reuse Target (CTO)</span>
                     <span className="text-sm font-black text-white">20,000 L / mo</span>
                  </div>
                  <div className="bg-eco/10 border border-eco/20 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-[9px] uppercase font-bold text-eco">Currently Achieved</span>
                     <span className="text-sm font-black text-eco">19,500 L</span>
                  </div>
                  <div className="text-[10px] uppercase font-black text-eco tracking-widest">
                     Status: <span className="text-white">Excellent</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* REUSE WATER USAGE & AI RESPONSE ANALYTICS SECTION */}
      {/* -------------------------------------------------------- */}
      <div className="grid lg:grid-cols-12 gap-6 mt-6">
         {/* Reuse Analytics Count (6 cols) */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border lg:col-span-6">
            <div className="flex items-center gap-2 mb-6">
               <Recycle className="h-4 w-4 text-cyan" />
               <span className="text-[9px] uppercase tracking-widest font-black text-white/70">Reuse Water Usage Analytics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-cyan/10 border border-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] flex flex-col items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan">Daily Count</span>
                  <span className="text-2xl font-black font-display text-white">4</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Weekly Count</span>
                  <span className="text-2xl font-black font-display text-white">28</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Monthly Count</span>
                  <span className="text-2xl font-black font-display text-white">120</span>
               </div>
               <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Yearly Count</span>
                  <span className="text-2xl font-black font-display text-white">1,450</span>
               </div>
            </div>
            <div className="mt-4 text-[9px] text-white/50 font-bold uppercase tracking-widest text-center">
               Number of times treated reuse water was utilized
            </div>
         </div>

         {/* AI Decision Response Analytics (6 cols) */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border lg:col-span-6 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6">
               <Brain className="h-4 w-4 text-cyan" />
               <span className="text-[9px] uppercase tracking-widest font-black text-white/70">AI Decision Response Analytics</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
               <div className="relative h-32 w-32 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
                     <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
                     <motion.circle 
                       cx="64" cy="64" r="56" fill="none" stroke="var(--cyan)" strokeWidth="12" strokeLinecap="round"
                       strokeDasharray="351.8"
                       initial={{ strokeDashoffset: 351.8 }}
                       animate={{ strokeDashoffset: 351.8 - (351.8 * 92) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       style={{ filter: `drop-shadow(0 0 8px var(--cyan))` }}
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                     <span className="text-2xl font-black text-white">92%</span>
                     <span className="text-[9px] font-bold uppercase text-white/50 text-center leading-tight mt-1">Acceptance<br/>Rate</span>
                  </div>
               </div>
               <div className="flex-1 w-full flex flex-col gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-[9px] uppercase font-bold text-white/50">Total AI Notifications Generated</span>
                     <span className="text-sm font-black text-white">130</span>
                  </div>
                  <div className="bg-eco/10 border border-eco/20 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-[9px] uppercase font-bold text-eco">Total Accepted</span>
                     <span className="text-sm font-black text-eco">120</span>
                  </div>
                  <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex justify-between items-center">
                     <span className="text-[9px] uppercase font-bold text-danger">Total Ignored</span>
                     <span className="text-sm font-black text-danger">10</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

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
