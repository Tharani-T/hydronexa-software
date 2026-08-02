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
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check, PieChart, Lightbulb, Sun, Moon, Sunrise
} from "lucide-react";
import { useThingSpeak, SensorData } from "@/hooks/useThingSpeak";
import { THRESHOLDS } from "@/lib/config";

import {
  useAdaptive,
  triggerBuzzer,
  triggerAnalytics5SecHorn,
  CountUp,
  PredictiveAlert,
  TelemetryRow,
  MiniStat
} from "./shared";

export function SustainabilityView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();

  // Mock Data derived from prompt requirements
  const shifts = [
    { name: "Morning Shift", icon: Sunrise, fresh: 3000, reuse: 7000, total: 10000, efficiency: 70, highlight: false },
    { name: "Afternoon Shift", icon: Sun, fresh: 4000, reuse: 8300, total: 12300, efficiency: 67, highlight: true },
    { name: "Night Shift", icon: Moon, fresh: 4000, reuse: 2000, total: 6000, efficiency: 33, highlight: false },
  ];

  const totalFresh = 11000;
  const totalReuse = 17300;
  const totalWater = totalFresh + totalReuse;
  const freshPercent = Math.round((totalFresh / totalWater) * 100);
  const reusePercent = Math.round((totalReuse / totalWater) * 100);

  const ctoFreshLimit = 15000;
  const freshCompliance = Math.round((totalFresh / ctoFreshLimit) * 100); // 73% (lower is better)
  
  const ctoReuseTarget = 15000;
  const reuseCompliance = Math.round((totalReuse / ctoReuseTarget) * 100); // 115% (higher is better)

  // AI Sustainability Score
  const score = 94;
  const grade = "A+";
  const status = "🟢 Safe Zone";

  return (
    <div className="space-y-8 pb-20">
      
      {/* 5 & 6. AI SUSTAINABILITY SCORE & COMPLIANCE SUMMARY */}
      <div className="grid lg:grid-cols-3 gap-6">
         <div className="glass-strong rounded-[2.5rem] p-8 border border-eco/30 relative overflow-hidden bg-eco/5 flex flex-col justify-center items-center text-center shadow-[0_0_40px_rgba(0,255,0,0.1)]">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-eco/20 to-transparent opacity-50 pointer-events-none" />
            <Leaf className="h-10 w-10 text-eco mb-4 drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]" />
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-eco mb-2">AI Sustainability Score</div>
            <div className="flex items-end gap-2 mb-2">
               <CountUp value={score} className="text-7xl font-black font-display text-white tracking-tighter drop-shadow-md" />
               <span className="text-2xl font-black text-muted-foreground mb-2">/100</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
               <span className="px-4 py-1.5 rounded-full bg-eco text-black font-black text-lg shadow-glow-eco">{grade}</span>
               <span className="text-xs font-black uppercase tracking-widest text-white/80">{status}</span>
            </div>
         </div>

         <div className="lg:col-span-2 glass-strong rounded-[2.5rem] p-8 border border-glass-border relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8"><ShieldCheck className="h-24 w-24 text-eco opacity-10" /></div>
            <div className="flex items-center gap-3 mb-6">
               <div className="h-10 w-10 rounded-full bg-eco/20 flex items-center justify-center shadow-glow-eco border border-eco/30 animate-pulse">
                  <CheckCircle2 className="h-5 w-5 text-eco" />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">AI Compliance Summary</h4>
                  <p className="text-[10px] uppercase tracking-widest text-eco font-bold">Operational Status: Optimal</p>
               </div>
            </div>
            <p className="text-lg md:text-xl font-medium text-white/90 leading-relaxed max-w-3xl">
               "The industry is operating sustainably. Fresh water consumption remains within CTO-approved limits, while reused water utilization is significantly higher. No compliance risks or penalties are expected."
            </p>
         </div>
      </div>

      {/* 4. CTO COMPLIANCE ANALYSIS & 3. FRESH VS REUSE COMPARISON */}
      <div className="grid lg:grid-cols-3 gap-6">
         {/* CTO Fresh Limit */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border flex flex-col justify-between relative group hover:border-cyan/30 transition-colors">
            <div className="absolute top-4 right-4"><Target className="h-5 w-5 text-cyan opacity-40 group-hover:opacity-100 transition-opacity" /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest font-black text-white/60 mb-1">CTO Compliance Analysis</div>
               <div className="text-sm font-black uppercase text-cyan">Fresh Water Limit</div>
            </div>
            <div className="flex justify-center py-6">
               <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                     <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                     <motion.circle 
                       cx="80" cy="80" r="70" fill="none" stroke="var(--cyan)" strokeWidth="14" strokeLinecap="round"
                       strokeDasharray="439.8"
                       initial={{ strokeDashoffset: 439.8 }}
                       animate={{ strokeDashoffset: 439.8 - (439.8 * freshCompliance) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       style={{ filter: `drop-shadow(0 0 8px var(--cyan))` }}
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                     <span className="text-3xl font-black font-display text-white">{freshCompliance}%</span>
                     <span className="text-[9px] uppercase tracking-widest font-bold text-white/50">Utilized</span>
                  </div>
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 font-bold uppercase">Actual Usage</span>
                  <span className="font-black text-white">{totalFresh.toLocaleString()} L</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 font-bold uppercase">CTO Limit</span>
                  <span className="font-black text-cyan">{ctoFreshLimit.toLocaleString()} L</span>
               </div>
            </div>
         </div>

         {/* CTO Reuse Target */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border flex flex-col justify-between relative group hover:border-eco/30 transition-colors">
            <div className="absolute top-4 right-4"><Target className="h-5 w-5 text-eco opacity-40 group-hover:opacity-100 transition-opacity" /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest font-black text-white/60 mb-1">CTO Compliance Analysis</div>
               <div className="text-sm font-black uppercase text-eco">Reuse Water Target</div>
            </div>
            <div className="flex justify-center py-6">
               <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                     <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                     <motion.circle 
                       cx="80" cy="80" r="70" fill="none" stroke="var(--eco)" strokeWidth="14" strokeLinecap="round"
                       strokeDasharray="439.8"
                       initial={{ strokeDashoffset: 439.8 }}
                       animate={{ strokeDashoffset: 439.8 - (439.8 * Math.min(100, reuseCompliance)) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       style={{ filter: `drop-shadow(0 0 8px var(--eco))` }}
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                     <span className="text-3xl font-black font-display text-white">{reuseCompliance}%</span>
                     <span className="text-[9px] uppercase tracking-widest font-bold text-white/50">Achieved</span>
                  </div>
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 font-bold uppercase">Actual Usage</span>
                  <span className="font-black text-white">{totalReuse.toLocaleString()} L</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 font-bold uppercase">CTO Target</span>
                  <span className="font-black text-eco">{ctoReuseTarget.toLocaleString()} L</span>
               </div>
            </div>
         </div>

         {/* Fresh vs Reused Comparison */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border flex flex-col justify-between relative group">
            <div className="absolute top-4 right-4"><PieChart className="h-5 w-5 text-white/20" /></div>
            <div>
               <div className="text-[9px] uppercase tracking-widest font-black text-white/60 mb-1">Source Comparison</div>
               <div className="text-sm font-black uppercase text-white">Fresh vs Reused Water</div>
            </div>
            <div className="flex justify-center py-6">
               <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                     {/* Reuse Arc (Eco) */}
                     <motion.circle 
                       cx="80" cy="80" r="60" fill="none" stroke="var(--eco)" strokeWidth="24"
                       strokeDasharray="377"
                       initial={{ strokeDashoffset: 377 }}
                       animate={{ strokeDashoffset: 377 - (377 * reusePercent) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                     />
                     {/* Fresh Arc (Cyan) starts where Reuse ends */}
                     <motion.circle 
                       cx="80" cy="80" r="60" fill="none" stroke="var(--cyan)" strokeWidth="24"
                       strokeDasharray="377"
                       initial={{ strokeDashoffset: 377 }}
                       animate={{ strokeDashoffset: 377 - (377 * freshPercent) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       className="origin-center"
                       style={{ rotate: `${(reusePercent / 100) * 360}deg` }}
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                     <span className="text-[9px] uppercase tracking-widest font-black text-eco">Reuse Leads</span>
                     <span className="text-xs font-bold text-white/50">by {reusePercent - freshPercent}%</span>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-cyan/10 border border-cyan/20 rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
                  <span className="text-[9px] uppercase font-black tracking-widest text-cyan">Fresh</span>
                  <span className="text-lg font-black text-white">{freshPercent}%</span>
               </div>
               <div className="bg-eco/10 border border-eco/20 rounded-xl p-3 flex flex-col gap-1 items-center justify-center">
                  <span className="text-[9px] uppercase font-black tracking-widest text-eco">Reused</span>
                  <span className="text-lg font-black text-white">{reusePercent}%</span>
               </div>
            </div>
         </div>
      </div>

      {/* 1. SHIFT-WISE WATER CONSUMPTION ANALYSIS */}
      <div>
         <div className="flex items-center gap-3 mb-6 px-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h4 className="text-sm font-black uppercase tracking-[0.15em]">Shift-Wise Water Consumption Analysis</h4>
         </div>
         <div className="grid lg:grid-cols-3 gap-6">
            {shifts.map((s, i) => (
               <div key={i} className={`rounded-3xl p-6 border transition-all ${s.highlight ? 'glass-strong bg-white/10 border-white/30 shadow-[0_15px_40px_rgba(0,0,0,0.4)] scale-[1.02]' : 'glass border-glass-border hover:bg-white/5'}`}>
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.highlight ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/10 text-white/70 border border-white/20'}`}>
                           <s.icon className="h-5 w-5" />
                        </div>
                        <div>
                           <div className="text-sm font-black uppercase">{s.name}</div>
                           <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{s.highlight ? 'Highest Consumption' : 'Standard Operations'}</div>
                        </div>
                     </div>
                     <div className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${s.efficiency >= 60 ? 'bg-eco/10 text-eco border-eco/30' : 'bg-danger/10 text-danger border-danger/30'}`}>
                        {s.efficiency}% Eff
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-cyan tracking-widest mb-1.5">
                           <span>Fresh Water</span>
                           <span>{s.fresh.toLocaleString()} L</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan" style={{ width: `${(s.fresh / s.total) * 100}%` }} />
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-eco tracking-widest mb-1.5">
                           <span>Reused Water</span>
                           <span>{s.reuse.toLocaleString()} L</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-eco" style={{ width: `${(s.reuse / s.total) * 100}%` }} />
                        </div>
                     </div>
                     <div className="pt-4 mt-2 border-t border-glass-border flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest font-black text-white/50">Total Consumption</span>
                        <span className="text-xl font-black font-display text-white">{s.total.toLocaleString()} L</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 2. AI SHIFT INSIGHTS & 7. AI RECOMMENDATIONS */}
      <div className="grid lg:grid-cols-2 gap-6">
         {/* AI Shift Insights */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <Brain className="h-5 w-5 text-indigo-400" />
               <h4 className="text-sm font-black uppercase tracking-[0.15em]">AI Shift Insights</h4>
            </div>
            <div className="space-y-4 flex-1">
               <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                     <Activity className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div>
                     <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400 block mb-1">Peak Demand Anomaly</span>
                     <p className="text-sm text-white/80 font-medium leading-relaxed">
                        The <span className="font-bold text-white">Afternoon Shift</span> consumed 23% more water due to increased production demand.
                     </p>
                  </div>
               </div>
               <div className="p-5 rounded-2xl bg-danger/10 border border-danger/20 flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-full bg-danger/20 flex items-center justify-center shrink-0">
                     <Droplets className="h-4 w-4 text-danger" />
                  </div>
                  <div>
                     <span className="text-[10px] uppercase tracking-widest font-black text-danger block mb-1">Efficiency Drop Detected</span>
                     <p className="text-sm text-white/80 font-medium leading-relaxed">
                        The <span className="font-bold text-white">Night Shift</span> relied more on fresh water because treated reuse water was temporarily unavailable.
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* AI Recommendations */}
         <div className="glass-strong rounded-3xl p-8 border border-glass-border">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  <h4 className="text-sm font-black uppercase tracking-[0.15em]">AI Recommendations</h4>
               </div>
               <span className="px-2 py-1 rounded bg-white/10 text-[9px] font-black uppercase tracking-widest">Actionable</span>
            </div>
            <div className="space-y-3">
               <RecommendationItem text="Increase reuse water utilization during high-consumption shifts." />
               <RecommendationItem text="Optimize cleaning schedules to reduce fresh water usage." />
               <RecommendationItem text="Maintain the current operating strategy to preserve CTO compliance." />
               <RecommendationItem text="Improve reuse water availability during production peaks." />
               <RecommendationItem text="Continue sustainable water management practices." />
            </div>
         </div>
      </div>

    </div>
  );
}

function RecommendationItem({ text }: { text: string }) {
   return (
      <div className="group flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/20 transition-all hover:bg-white/5">
         <div className="mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-eco opacity-50 group-hover:opacity-100 transition-opacity" />
         </div>
         <p className="text-xs font-medium text-white/80 leading-relaxed">{text}</p>
      </div>
   );
}
