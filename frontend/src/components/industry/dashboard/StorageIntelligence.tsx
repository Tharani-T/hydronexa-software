import { SensorData } from "@/hooks/useThingSpeak";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Droplets, AlertTriangle, ShieldCheck, 
  Target, ActivitySquare, CheckCircle2, Zap, Clock, Calendar, Brain, BellRing, Settings, Power,
  Leaf, BarChart3, PieChart, TrendingUp
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { triggerBuzzer } from "./shared";

// Custom Hook to drive animated numbers
function useAnimatedNumber(value: number) {
  const [displayVal, setDisplayVal] = useState(value);
  useEffect(() => {
    setDisplayVal(value);
  }, [value]);
  return displayVal;
}

export function StorageIntelligence({ data }: { data: SensorData | null }) {
  const distance = data?.ultrasonic ?? 15; 
  const flowRate = data?.flowRate ?? 0;
  const isMotorOn = flowRate > 0;

  // Tank Math (10L capacity, 5cm = Full, 22cm = Empty)
  const rawLiters = Math.max(0, Math.min(10, 10 - ((distance - 5) / 17) * 10));
  const liters = Number(rawLiters.toFixed(1));
  const fillPercent = Math.max(0, Math.min(100, (liters / 10) * 100));

  // Determine Storage State
  let status: 'normal' | 'low' | 'overflow_risk' = 'normal';
  if (distance >= 20) status = 'low';
  else if (distance <= 7) status = 'overflow_risk';

  const [lastBuzzer, setLastBuzzer] = useState<string | null>(null);

  useEffect(() => {
    if ((status === 'low' || status === 'overflow_risk') && lastBuzzer !== status) {
      triggerBuzzer();
      setLastBuzzer(status);
    } else if (status === 'normal') {
      setLastBuzzer(null);
    }
  }, [status, lastBuzzer]);

  return (
    <div className="min-h-screen pb-32 max-w-[1600px] mx-auto px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
         <div className="h-12 w-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.15)]">
            <Brain className="h-6 w-6 text-cyan" />
         </div>
         <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">Digital Storage Intelligence</h1>
            <p className="text-xs text-cyan uppercase font-bold tracking-widest">AI-Powered Fresh Water Management</p>
         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto items-center">
        
        {/* LEFT: Digital Storage Twin */}
        <div className="relative flex flex-col items-center justify-center min-h-[550px] glass-strong border border-white/5 rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           {/* Ambient Background Glow based on status */}
           <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
             status === 'overflow_risk' ? 'bg-danger' : status === 'low' ? 'bg-warn' : 'bg-cyan'
           } blur-3xl rounded-[3rem]`} />
           
           {/* Grid Background */}
           <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:30px_30px]" />

           {/* The Core Digital Twin */}
           <div className="relative w-full max-w-[280px] flex flex-col items-center flex-1 mt-6">
              <UltrasonicBeam distance={distance} fillPercent={fillPercent} status={status} />
              <DigitalTank fillPercent={fillPercent} liters={liters} status={status} />
           </div>
        </div>

        {/* RIGHT: AI Intelligence & Actions */}
        <div className="flex flex-col gap-6 justify-center">
           <AIStoragePrediction status={status} fillPercent={fillPercent} isMotorOn={isMotorOn} />
           
           <AnimatePresence mode="popLayout">
             {status === 'low' && <LowWaterAction key="low" distance={distance} />}
             {status === 'overflow_risk' && <OverflowAction key="overflow" distance={distance} />}
           </AnimatePresence>

           {status === 'normal' && (
             <AIWaterForecast fillPercent={fillPercent} isMotorOn={isMotorOn} />
           )}
        </div>

      </div>

      <SustainabilityCompliance />
    </div>
  );
}

// --------------------------------------------------------
// THE DIGITAL TWIN & SENSOR
// --------------------------------------------------------

function UltrasonicBeam({ distance, fillPercent, status }: any) {
  const isDanger = status === 'overflow_risk';
  const color = isDanger ? 'var(--danger)' : status === 'low' ? 'var(--warn)' : 'var(--cyan)';

  return (
    <div className="relative flex flex-col items-center w-full z-20">
       {/* The Sensor Hardware */}
       <div className="bg-black/80 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl backdrop-blur-xl relative overflow-hidden group hover:border-white/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          <div className={`h-10 w-10 rounded-xl bg-black flex items-center justify-center border border-white/10 shadow-[0_0_15px_color-mix(in_oklab,${color}_30%,transparent)]`}>
             <Activity className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex flex-col">
             <span className="text-[9px] uppercase tracking-widest text-white/50 font-black">Ultrasonic Radar</span>
             <span className="text-xl font-display font-black text-white">{distance.toFixed(1)} <span className="text-xs text-white/50">cm</span></span>
          </div>
       </div>

       {/* The Beam */}
       <div className="relative w-32 flex justify-center overflow-hidden" style={{ height: `${Math.max(10, 100 - fillPercent)}%`, minHeight: '60px' }}>
          <div className="absolute inset-0 flex flex-col items-center justify-start opacity-60 mix-blend-screen mask-image-b">
             <motion.div 
               animate={{ y: [0, 100, 0], opacity: [0.2, 0.8, 0.2] }} 
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="w-full flex flex-col items-center gap-1 mt-2"
             >
                {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="h-0.5 rounded-full" style={{ width: `${80 - i*8}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}`, opacity: 1 - i*0.1 }} />
                ))}
             </motion.div>
          </div>
          {/* Laser Core */}
          <div className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-current to-transparent opacity-30" style={{ color }} />
       </div>
    </div>
  )
}

function DigitalTank({ fillPercent, liters, status }: any) {
  const isOverflow = status === 'overflow_risk';
  const isLow = status === 'low';
  
  const tankColor = isOverflow ? 'rgba(255,50,50,0.8)' : isLow ? 'rgba(255,180,50,0.8)' : 'rgba(0,255,255,0.8)';
  const glowColor = isOverflow ? 'rgba(255,50,50,0.4)' : isLow ? 'rgba(255,180,50,0.4)' : 'rgba(0,255,255,0.3)';
  const rippleSpeed = isOverflow ? 0.5 : isLow ? 4 : 2;

  return (
    <div className="relative w-full h-[300px] flex justify-center">
       {/* Premium Glass Tank Container */}
       <div className={`w-full h-full glass-strong border-[6px] border-white/20 rounded-[3.5rem] p-3 flex flex-col relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-1000 ${isOverflow ? 'animate-pulse border-danger/50' : isLow ? 'border-warn/50' : ''}`}>
         
         {/* Glass reflections */}
         <div className="absolute top-0 left-4 bottom-0 w-4 bg-gradient-to-r from-white/20 to-transparent rounded-l-full mix-blend-overlay z-20" />
         <div className="absolute top-0 right-4 bottom-0 w-2 bg-gradient-to-l from-white/10 to-transparent rounded-r-full mix-blend-overlay z-20" />
         
         {/* Liquid filling */}
         <div 
           className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-10" 
           style={{ height: `${fillPercent}%`, backgroundColor: 'rgba(0,0,0,0.4)' }}
         >
            {/* The liquid body */}
            <div className="absolute inset-0 opacity-80 mix-blend-screen" style={{ backgroundColor: tankColor, boxShadow: `0 0 50px ${glowColor}` }} />
            
            {/* Surface Ripples & Waves */}
            <div className="absolute top-0 left-0 right-0 h-10 -translate-y-1/2 overflow-hidden mix-blend-screen">
               <motion.div 
                 animate={{ x: [0, -100, 0] }} 
                 transition={{ duration: rippleSpeed, repeat: Infinity, ease: "linear" }}
                 className="w-[200%] h-full opacity-60 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMTBRMTAgMCAyMCAxMFQ0MCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')]"
               />
            </div>
            
            {/* Floating Bubbles */}
            <Bubbles count={isOverflow ? 20 : isLow ? 5 : 12} color={tankColor} speed={rippleSpeed} />
         </div>
         
         {/* Overlay Content */}
         <div className="relative z-30 flex flex-col h-full items-center justify-center pointer-events-none">
            <span className="text-[12px] font-black uppercase tracking-widest text-white/70 mb-2 drop-shadow-md bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">Fresh Water</span>
            <div className="text-8xl font-display font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] tracking-tighter mix-blend-overlay opacity-90">
               {liters.toFixed(1)}<span className="text-3xl text-white/80 tracking-normal ml-1">L</span>
            </div>
            <div className="text-sm font-bold uppercase tracking-widest text-white/90 mt-4 bg-black/60 px-6 py-2 rounded-full border border-white/20 shadow-2xl backdrop-blur-xl flex items-center gap-3">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
               </span>
               {fillPercent.toFixed(0)}% Filled
            </div>
         </div>
       </div>
    </div>
  )
}

function Bubbles({ count, color, speed }: { count: number, color: string, speed: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-50">
      {Array.from({length: count}).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full border border-white/40"
          style={{
             left: `${Math.random() * 100}%`,
             width: `${Math.random() * 8 + 4}px`,
             height: `${Math.random() * 8 + 4}px`,
             backgroundColor: 'rgba(255,255,255,0.2)'
          }}
          animate={{
             y: [0, -400],
             x: [0, Math.random() * 20 - 10, 0],
             opacity: [0, 1, 0]
          }}
          transition={{
             duration: Math.random() * 2 + speed,
             repeat: Infinity,
             ease: "easeOut",
             delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  )
}

// --------------------------------------------------------
// AI MODULES & ACTIONS
// --------------------------------------------------------

function AIStoragePrediction({ status, fillPercent, isMotorOn }: any) {
  let title = "Tank Stable";
  let color = "eco";
  
  if (status === 'overflow_risk') { title = "Overflow Imminent"; color = "danger"; }
  else if (status === 'low') { title = "Low Water Expected"; color = "warn"; }
  else if (isMotorOn) { title = "Tank Filling Normally"; color = "cyan"; }

  return (
    <div className="glass-strong border border-glass-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
      <div className="flex items-center gap-2 mb-4">
         <Brain className="h-4 w-4 text-cyan" />
         <span className="text-[9px] uppercase tracking-widest font-black text-cyan">AI Assessment</span>
      </div>
      <div className="flex items-start gap-4 relative z-10">
         <div className={`h-12 w-12 rounded-full border-2 border-${color}/50 bg-${color}/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_color-mix(in_oklab,var(--${color})_40%,transparent)]`}>
            <Activity className={`h-5 w-5 text-${color} animate-pulse`} style={{ color: `var(--${color})` }} />
         </div>
         <div className="text-xl font-black uppercase tracking-tight text-white/90 leading-tight">
            {title}
         </div>
      </div>
    </div>
  )
}

function LowWaterAction({ distance }: any) {
  // AI Time Estimation (mocked dynamically based on distance)
  const timeRemaining = Math.max(1, Math.round((22 - distance) * 8));

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-strong border-2 border-warn/50 rounded-3xl p-6 shadow-[0_10px_40px_rgba(255,180,50,0.2)] relative overflow-hidden bg-warn/5"
    >
      <div className="absolute inset-0 bg-warn/10 animate-pulse opacity-50" />
      <div className="flex items-center gap-3 mb-6 relative z-10">
         <div className="h-10 w-10 rounded-full bg-warn flex items-center justify-center shadow-[0_0_20px_var(--warn)] animate-pulse">
            <BellRing className="h-5 w-5 text-black animate-bounce" />
         </div>
         <div>
            <span className="text-xs uppercase tracking-widest font-black text-warn">Low Water Alert</span>
            <div className="text-lg font-black text-white">Tank Running Empty</div>
         </div>
      </div>
      <div className="bg-black/60 border border-warn/30 rounded-2xl p-5 relative z-10 text-center">
         <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-1">Time until critical empty</p>
         <div className="text-4xl font-display font-black text-warn drop-shadow-md mb-4">{timeRemaining} <span className="text-lg">minutes</span></div>
         <div className="flex items-start gap-2 bg-warn/10 p-3 rounded-xl border border-warn/20 text-left">
            <Brain className="h-4 w-4 text-warn shrink-0 mt-0.5" />
            <p className="text-xs text-warn font-medium leading-relaxed">AI Recommendation: Water supply motor should be turned <span className="font-black underline">ON</span> immediately to prevent complete depletion.</p>
         </div>
      </div>
    </motion.div>
  )
}

function OverflowAction({ distance }: any) {
  // AI Time Estimation (mocked dynamically based on distance to overflow)
  const timeToOverflow = Math.max(1, Math.round((distance - 4) * 5));

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-strong border-2 border-danger/50 rounded-3xl p-6 shadow-[0_10px_40px_rgba(255,0,0,0.2)] relative overflow-hidden bg-danger/5"
    >
      <div className="absolute inset-0 bg-danger/10 animate-pulse" />
      <div className="flex items-center justify-between mb-6 relative z-10">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-danger flex items-center justify-center shadow-[0_0_20px_var(--danger)] animate-pulse">
               <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
               <span className="text-xs uppercase tracking-widest font-black text-danger">Overflow Warning</span>
               <div className="text-lg font-black text-white">Tank About To Overflow</div>
            </div>
         </div>
      </div>
      <div className="bg-black/60 border border-danger/30 rounded-2xl p-5 relative z-10 text-center">
         <p className="text-xs text-white/60 uppercase tracking-widest font-bold mb-1">Estimated time until overflow</p>
         <div className="text-4xl font-display font-black text-danger drop-shadow-md mb-4">{timeToOverflow} <span className="text-lg">minutes</span></div>
         <div className="flex items-start gap-2 bg-danger/10 p-3 rounded-xl border border-danger/20 text-left">
            <Brain className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger font-medium leading-relaxed">AI Recommendation: Water supply motor should be turned <span className="font-black underline">OFF</span> immediately based on current consumption rate.</p>
         </div>
      </div>
    </motion.div>
  )
}

function AIWaterForecast({ fillPercent, isMotorOn }: any) {
  let msg = "Current storage is sufficient for another 55 minutes. Motor can safely remain OFF.";
  if (isMotorOn) msg = "Tank will reach full capacity in approximately 18 minutes.";
  if (fillPercent < 20) msg = "Water will become empty in approximately 42 minutes.";

  return (
    <div className="glass-strong border border-glass-border rounded-3xl p-6 shadow-xl hover:border-cyan/30 transition-colors group">
       <div className="flex items-center gap-2 mb-4">
         <Brain className="h-4 w-4 text-cyan" />
         <span className="text-[9px] uppercase tracking-widest font-black text-cyan">AI Forecast</span>
      </div>
      <p className="text-sm text-white/90 font-medium leading-relaxed mb-6">{msg}</p>
      <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3">
         <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Prediction Confidence</span>
         <span className="text-sm font-black text-eco flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 96%</span>
      </div>
    </div>
  )
}

// --------------------------------------------------------
// USAGE & TIMELINE
// --------------------------------------------------------

// End of StorageIntelligence.tsx

// --------------------------------------------------------
// SUSTAINABILITY & COMPLIANCE
// --------------------------------------------------------

function SustainabilityCompliance() {
  // Mock Data
  const dailyFresh = 420; // Liters
  const dailyReused = 650;
  const ctoLimit = 500;
  
  const ctoPercent = Math.min(100, (dailyFresh / ctoLimit) * 100);
  
  // AI Status Logic
  let zone: 'safe' | 'warning' | 'critical' = 'safe';
  if (dailyFresh >= ctoLimit) zone = 'critical';
  else if (dailyFresh >= ctoLimit * 0.85) zone = 'warning';
  
  // Scoring
  const baseScore = 100;
  const reuseRatio = dailyReused / (dailyFresh + dailyReused);
  const reuseScore = reuseRatio * 50; 
  const complianceScore = Math.max(0, 50 - (ctoPercent / 100) * 50);
  const totalScore = Math.min(100, Math.round(reuseScore + complianceScore + 10)); 
  
  let grade = 'A+';
  if (totalScore < 90) grade = 'A';
  if (totalScore < 80) grade = 'B';
  if (totalScore < 70) grade = 'C';
  if (totalScore < 50) grade = 'D';

  return (
    <div className="mt-16 max-w-6xl mx-auto space-y-8">
       {/* Section Header */}
       <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-eco/10 border border-eco/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.15)]">
             <Leaf className="h-5 w-5 text-eco" />
          </div>
          <div>
             <h2 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md">Fresh Water Compliance & Sustainability</h2>
             <p className="text-[10px] text-eco uppercase font-bold tracking-widest">AI-Powered Enterprise Intelligence</p>
          </div>
       </div>

       {/* Grid Layout */}
       <div className="grid lg:grid-cols-12 gap-8">
         
         {/* LEFT COLUMN: Analytics & CTO (8 cols) */}
         <div className="lg:col-span-8 space-y-8">
            <FreshWaterAnalytics daily={dailyFresh} />
            <div className="grid md:grid-cols-2 gap-8">
              <CTOCompliance percent={ctoPercent} used={dailyFresh} limit={ctoLimit} zone={zone} />
              <WaterComparison fresh={dailyFresh} reused={dailyReused} />
            </div>
         </div>

         {/* RIGHT COLUMN: AI Scoring & Status (4 cols) */}
         <div className="lg:col-span-4 space-y-8">
            <SustainabilityScore score={totalScore} grade={grade} />
            <AIComplianceStatus zone={zone} />
         </div>

       </div>
    </div>
  )
}

function FreshWaterAnalytics({ daily }: any) {
  return (
    <div className="glass-strong border border-glass-border rounded-3xl p-6 shadow-xl">
       <div className="flex items-center gap-2 mb-6">
         <BarChart3 className="h-4 w-4 text-cyan" />
         <span className="text-[9px] uppercase tracking-widest font-black text-white/70">Fresh Water Consumption Analytics</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <AnalyticsCard label="Daily" value={`${daily} L`} active />
         <AnalyticsCard label="Weekly" value={`${daily * 7} L`} />
         <AnalyticsCard label="Monthly" value={`${daily * 30} L`} />
         <AnalyticsCard label="Yearly" value={`${daily * 365} L`} />
      </div>
    </div>
  )
}

function AnalyticsCard({ label, value, active }: any) {
  return (
    <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${active ? 'bg-cyan/10 border-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-black/30 border-white/5'}`}>
       <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-cyan' : 'text-white/60'}`}>{label}</span>
       <span className="text-2xl font-black font-display text-white">{value}</span>
    </div>
  )
}

function CTOCompliance({ percent, used, limit, zone }: any) {
  const color = zone === 'safe' ? 'var(--eco)' : zone === 'warning' ? 'var(--warn)' : 'var(--danger)';
  
  return (
    <div className="glass-strong border border-glass-border rounded-3xl p-6 shadow-xl flex flex-col">
       <div className="flex items-center gap-2 mb-6">
         <Target className="h-4 w-4 text-cyan" />
         <span className="text-[9px] uppercase tracking-widest font-black text-white/70">CTO Compliance Comparison</span>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center gap-4">
         <div className="relative h-32 w-32 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
               <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
               <motion.circle 
                 cx="64" cy="64" r="56" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                 strokeDasharray="351.8"
                 initial={{ strokeDashoffset: 351.8 }}
                 animate={{ strokeDashoffset: 351.8 - (351.8 * percent) / 100 }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 style={{ filter: `drop-shadow(0 0 8px ${color})` }}
               />
            </svg>
            <div className="flex flex-col items-center">
               <span className="text-2xl font-black text-white">{Math.round(percent)}%</span>
               <span className="text-[9px] font-bold uppercase text-white/50">Utilized</span>
            </div>
         </div>
         <div className="flex w-full justify-between items-center bg-black/40 rounded-xl p-3 border border-white/5">
            <div className="flex flex-col">
               <span className="text-[9px] uppercase text-white/50 font-bold">Consumed</span>
               <span className="text-sm font-black text-white">{used} L</span>
            </div>
            <div className="h-6 w-[1px] bg-white/10"></div>
            <div className="flex flex-col text-right">
               <span className="text-[9px] uppercase text-white/50 font-bold">CTO Limit</span>
               <span className="text-sm font-black text-white">{limit} L</span>
            </div>
         </div>
      </div>
    </div>
  )
}

function WaterComparison({ fresh, reused }: any) {
  const total = fresh + reused;
  const freshPercent = (fresh / total) * 100;
  const reusedPercent = (reused / total) * 100;

  return (
    <div className="glass-strong border border-glass-border rounded-3xl p-6 shadow-xl flex flex-col">
       <div className="flex items-center gap-2 mb-6">
         <PieChart className="h-4 w-4 text-cyan" />
         <span className="text-[9px] uppercase tracking-widest font-black text-white/70">Fresh vs Reused</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-6">
         <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] uppercase font-black tracking-widest text-cyan">Fresh Water</span>
               <span className="text-2xl font-black text-white">{Math.round(freshPercent)}%</span>
            </div>
            <div className="flex flex-col gap-1 text-right">
               <span className="text-[10px] uppercase font-black tracking-widest text-eco">Reused Water</span>
               <span className="text-2xl font-black text-white">{Math.round(reusedPercent)}%</span>
            </div>
         </div>
         
         <div className="h-6 w-full rounded-full overflow-hidden flex bg-black/50 border border-white/10 relative">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${freshPercent}%` }} 
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-cyan relative z-10"
              style={{ boxShadow: '0 0 15px rgba(0,255,255,0.4)' }}
            />
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${reusedPercent}%` }} 
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-eco relative z-10"
              style={{ boxShadow: '0 0 15px rgba(0,255,0,0.4)' }}
            />
         </div>
         
         <div className="text-[9px] text-white/50 font-bold uppercase tracking-widest text-center">
            Reused water utilization is dominant, indicating highly sustainable operations.
         </div>
      </div>
    </div>
  )
}

function SustainabilityScore({ score, grade }: any) {
  return (
    <div className="glass-strong border border-eco/30 bg-eco/5 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,255,0,0.1)] relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-eco/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
       
       <div className="flex items-center gap-2 mb-4 relative z-10">
         <TrendingUp className="h-4 w-4 text-eco" />
         <span className="text-[9px] uppercase tracking-widest font-black text-eco">AI Sustainability Score</span>
      </div>
      
      <div className="flex items-end justify-between relative z-10">
         <div className="flex flex-col">
            <span className="text-6xl font-display font-black text-white drop-shadow-lg leading-none">{score}</span>
            <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest mt-2">Out of 100</span>
         </div>
         <div className="h-16 w-16 rounded-2xl bg-eco text-black flex items-center justify-center text-3xl font-black shadow-[0_0_20px_var(--eco)]">
            {grade}
         </div>
      </div>
    </div>
  )
}

function AIComplianceStatus({ zone }: any) {
  let title = "Safe Zone";
  let color = "eco";
  let message = "Fresh water consumption is within the CTO-approved limit, while reused water utilization is significantly higher than fresh water consumption. The industry is operating sustainably and maintaining regulatory compliance.";
  let recommendation = "Current water usage is sustainable; maintain the existing operating strategy.";

  if (zone === 'warning') {
    title = "Warning Zone";
    color = "warn";
    message = "Fresh water consumption is approaching the CTO limit. Reused water utilization is sub-optimal and needs improvement.";
    recommendation = "Optimize reuse to avoid compliance issues. Increase reused water utilization to reduce fresh water dependency.";
  } else if (zone === 'critical') {
    title = "Critical Zone";
    color = "danger";
    message = "Fresh water consumption has exceeded the CTO-approved limit. Immediate action is required to restore compliance.";
    recommendation = "Halt non-essential fresh water intake. Maximize reused water distribution immediately.";
  }

  return (
    <div className={`glass-strong border border-${color}/40 bg-${color}/5 rounded-3xl p-6 shadow-xl relative`}>
       <div className="flex items-center gap-2 mb-4">
         <ShieldCheck className={`h-4 w-4 text-${color}`} />
         <span className={`text-[9px] uppercase tracking-widest font-black text-${color}`}>AI Compliance Status</span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
         <div className={`h-3 w-3 rounded-full bg-${color} shadow-[0_0_10px_var(--${color})] animate-pulse`} />
         <span className="text-lg font-black uppercase tracking-widest text-white">{title}</span>
      </div>
      
      <p className="text-xs text-white/80 leading-relaxed font-medium mb-6">
         {message}
      </p>

      <div className={`bg-${color}/10 border border-${color}/20 rounded-xl p-4 flex gap-3 items-start`}>
         <Brain className={`h-5 w-5 text-${color} shrink-0 mt-0.5`} />
         <div className="flex flex-col gap-1">
            <span className={`text-[10px] uppercase font-black text-${color} tracking-widest`}>AI Recommendation</span>
            <span className="text-xs text-white/90 font-bold leading-relaxed">{recommendation}</span>
         </div>
      </div>
    </div>
  )
}
