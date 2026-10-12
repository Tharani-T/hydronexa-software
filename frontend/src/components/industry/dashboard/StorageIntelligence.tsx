import { SensorData } from "@/hooks/useThingSpeak";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LabelList, ComposedChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Droplets, AlertTriangle, ShieldCheck, 
  Target, ActivitySquare, CheckCircle2, Zap, Clock, Calendar, Brain, BellRing, Settings, Power,
  Leaf, BarChart3, PieChart, TrendingUp, Mail
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { triggerBuzzer, useAdaptive } from "./shared";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";


// Custom Hook to drive animated numbers
function useAnimatedNumber(value: number) {
  const [displayVal, setDisplayVal] = useState(value);
  useEffect(() => {
    setDisplayVal(value);
  }, [value]);
  return displayVal;
}

export function StorageIntelligence({ data, history }: { data: SensorData | null; history?: SensorData[] }) {
  const a = useAdaptive();
  // Directly use live distance from ThingSpeak Field 6 (Water Level Distance)
  const distance = data?.ultrasonic ?? 22; // 22cm defaults to empty before data loads 
  const flowRate = data?.flowRate ?? 0;
  const isMotorOn = flowRate > 0;

  const [showOverflowModal, setShowOverflowModal] = useState(false);
  const [hasAcknowledgedOverflow, setHasAcknowledgedOverflow] = useState(false);

  useEffect(() => {
    const isOverflowRange = distance >= 5 && distance <= 7;
    
    if (isOverflowRange) {
      if (!hasAcknowledgedOverflow && !showOverflowModal) {
        setShowOverflowModal(true);
      }
    } else {
      if (hasAcknowledgedOverflow) setHasAcknowledgedOverflow(false);
      if (showOverflowModal) setShowOverflowModal(false);
    }
  }, [distance, hasAcknowledgedOverflow, showOverflowModal]);

  useEffect(() => {
    let interval: any;
    if (showOverflowModal) {
      triggerBuzzer(); // Initial beep
      interval = setInterval(() => triggerBuzzer(), 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOverflowModal]);

  // Tank Math (10L capacity, 5cm = Full, 22cm = Empty)
  const rawLiters = Math.max(0, Math.min(10, 10 - ((distance - 5) / 17) * 10));
  const liters = Number(rawLiters.toFixed(1));
  const fillPercent = Math.max(0, Math.min(100, (liters / 10) * 100));

  // Determine Storage State
  let status: 'normal' | 'low' | 'overflow_risk' = 'normal';
  if (distance >= 20 && distance <= 23) status = 'low';
  else if (distance >= 5 && distance <= 7) status = 'overflow_risk';

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
            <p className="text-xs text-cyan uppercase font-bold tracking-widest">Intelligent Fresh Water Management</p>
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

        {/* RIGHT: AI Storage Prediction Panel */}
        <div className="flex flex-col justify-center">
           <AIStorageRecommendation status={status} isMotorOn={isMotorOn} liters={liters} data={data} />
        </div>

      </div>

      <WeeklyWaterReuseVsFreshWaterAnalysis data={data} />
      
      {/* Overflow Modal Alert */}
      {showOverflowModal && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/95 border-2 border-danger rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(255,0,0,0.4)] flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-danger/10 animate-pulse pointer-events-none" />
            
            <h2 className="text-xl font-display font-black text-danger mb-6 uppercase tracking-widest relative z-10 flex items-center gap-2">
              <span className="text-2xl animate-bounce">🚨</span> Storage Tank Overflow Warning
            </h2>
            
            <div className="w-full bg-danger/10 border border-danger/30 rounded-xl p-4 mb-4 relative z-10 text-left">
              <div className="text-[10px] text-danger uppercase tracking-widest font-black mb-1">Tank:</div>
              <div className="text-white font-bold">Freshwater Storage Tank</div>
            </div>

            <div className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mb-8 relative z-10 text-left">
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-black mb-1">Message:</div>
              <div className="text-white/90 font-medium leading-relaxed">
                "⚠️ Freshwater Storage Tank is approaching overflow. Please switch <span className="font-black text-danger underline">OFF</span> the Fresh Water Pump immediately."
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowOverflowModal(false);
                setHasAcknowledgedOverflow(true);
              }}
              className="bg-danger hover:bg-danger/80 text-white font-black uppercase tracking-widest px-12 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:scale-105 active:scale-95 relative z-10 flex items-center gap-2"
            >
              <span>✅</span> OK
            </button>
          </motion.div>
        </div>
      )}
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

function AIStorageRecommendation({ status, isMotorOn, liters, data }: any) {
  let riskLevel = "Low";
  let riskColor = "bg-eco/20 text-eco border-eco/30";
  let aiRec = "Tank level is healthy. Continue normal operation.";
  let suggestedAction = "Continue normal operations.";
  
  if (liters <= 0) {
    riskLevel = "Critical";
    riskColor = "bg-danger/20 text-danger border-danger/30";
    aiRec = "Storage tank is empty. Please switch ON the Fresh Water Pump.";
    suggestedAction = "Switch ON Fresh Water Pump immediately.";
  } else if (status === 'low') {
    riskLevel = "Medium";
    riskColor = "bg-warn/20 text-warn border-warn/30";
    aiRec = "Water level is low. Refill is recommended soon.";
    suggestedAction = "Prepare to switch ON Fresh Water Pump.";
  } else if (status === 'overflow_risk') {
    riskLevel = "High";
    riskColor = "bg-danger/20 text-danger border-danger/30";
    aiRec = "Tank is approaching full capacity. Please switch OFF the Fresh Water Pump immediately.";
    suggestedAction = "Switch OFF Fresh Water Pump immediately.";
  }

  const flowRate = data?.flowRate ?? 0;
  let predictionText = "Motor is OFF. Water consumption has stopped.";
  
  if (flowRate > 0 && liters > 0) {
     const totalMinutes = liters / flowRate;
     const hours = Math.floor(totalMinutes / 60);
     const mins = Math.floor(totalMinutes % 60);
     
     if (hours > 0) {
        predictionText = `Approximately ${hours} Hours ${mins} Minutes Remaining`;
     } else {
        predictionText = `Approximately ${mins} Minutes Remaining`;
     }
  } else if (flowRate > 0 && liters <= 0) {
     predictionText = "Tank empty. No water available.";
  }

  return (
    <div className="glass-strong border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan/10 blur-3xl rounded-full" />
      
      <div className="flex items-center gap-3 border-b border-white/5 pb-4 relative z-10">
         <div className="h-10 w-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-cyan" />
         </div>
         <h2 className="text-lg font-black uppercase tracking-widest text-white">Smart Storage Recommendation</h2>
      </div>

      <div className="grid gap-4 relative z-10">
         <div className="flex flex-col gap-2 bg-black/40 border border-white/5 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest font-black text-white/50 flex items-center gap-2">
               Smart Recommendation
            </div>
            <div className="text-sm font-bold text-white/90 leading-snug">
               {aiRec}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 bg-black/40 border border-white/5 rounded-xl p-4">
               <div className="text-[10px] uppercase tracking-widest font-black text-white/50 flex items-center gap-2">
                  ⚠ Risk Level
               </div>
               <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border inline-flex items-center justify-center ${riskColor}`}>
                  {riskLevel}
               </div>
            </div>

            <div className="flex flex-col gap-2 bg-black/40 border border-white/5 rounded-xl p-4">
               <div className="text-[10px] uppercase tracking-widest font-black text-white/50 flex items-center gap-2">
                  ⏳ Remaining Water Availability
               </div>
               <div className="text-sm font-bold text-cyan">
                  {predictionText}
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-2 bg-cyan/10 border border-cyan/20 rounded-xl p-4 mt-2">
            <div className="text-[10px] uppercase tracking-widest font-black text-cyan flex items-center gap-2">
               Suggested Action
            </div>
            <div className="text-sm font-bold text-white/90">
               {suggestedAction}
            </div>
         </div>
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fresh = payload.find((p: any) => p.dataKey === 'fresh')?.value || 0;
    const reused = payload.find((p: any) => p.dataKey === 'reused')?.value || 0;
    const cto = payload.find((p: any) => p.dataKey === 'cto')?.value || 0;
    const total = fresh + reused;
    const freshPct = total > 0 ? ((fresh / total) * 100).toFixed(0) : 0;
    const reusePct = total > 0 ? ((reused / total) * 100).toFixed(0) : 0;
    const ctoUtil = cto > 0 ? ((total / cto) * 100).toFixed(0) : 0;
    const isExceeded = total > cto;

    return (
      <div className="bg-black/90 border border-white/10 rounded-xl p-4 shadow-2xl min-w-[200px] backdrop-blur-xl">
         <div className="text-white/50 text-[10px] uppercase font-black tracking-widest mb-3 border-b border-white/10 pb-2">{label}</div>
         <div className="grid gap-2 mb-3 border-b border-white/10 pb-3">
            <div className="flex justify-between items-center text-xs">
               <span className="text-cyan font-bold uppercase tracking-widest mr-4">Fresh Water</span>
               <span className="text-white font-black">{fresh.toFixed(2)} L <span className="text-white/40 text-[10px] font-bold">({freshPct}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-xs">
               <span className="text-eco font-bold uppercase tracking-widest mr-4">Reuse Water</span>
               <span className="text-white font-black">{reused.toFixed(2)} L <span className="text-white/40 text-[10px] font-bold">({reusePct}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-white/5">
               <span className="text-white/70 font-bold uppercase tracking-widest mr-4">Total Consumption</span>
               <span className="text-white font-black">{total.toFixed(2)} L</span>
            </div>
         </div>
         <div className="grid gap-2 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex justify-between text-white/50">
               <span>CTO Limit</span>
               <span className="text-white">{cto.toFixed(0)} L</span>
            </div>
            <div className="flex justify-between text-white/50">
               <span>CTO Utilization</span>
               <span className="text-white">{ctoUtil}%</span>
            </div>
            <div className="flex justify-between items-center mt-2">
               <span className="text-white/50">Status</span>
               {isExceeded ? (
                 <span className="text-danger flex items-center gap-1">🔴 Exceeded</span>
               ) : (
                 <span className="text-eco flex items-center gap-1">🟢 Within Limit</span>
               )}
            </div>
         </div>
      </div>
    );
  }
  return null;
};

function WeeklyWaterReuseVsFreshWaterAnalysis({ data }: any) {
  const a = useAdaptive();
  const { state, updateSetup } = useAppState();
  const userEmail = state.currentUserEmail || state.setup?.email;
  const ctoLimit = 15; // Set strictly to 15L as requested
  
  const [completedDaysCount, setCompletedDaysCount] = useState(() => {
    return parseInt(localStorage.getItem('completedDaysCount_v8') || '6');
  });

  const [todayLiveFresh, setTodayLiveFresh] = useState(() => parseFloat(localStorage.getItem("todayLiveFresh_v8") || "0"));
  const [todayLiveReused, setTodayLiveReused] = useState(() => parseFloat(localStorage.getItem("todayLiveReused_v8") || "0"));

  useEffect(() => {
    const interval = setInterval(() => {
      setTodayLiveFresh(prev => {
        if (data?.flowRate && data.flowRate > 0) {
          const newVal = prev + (data.flowRate / 60);
          localStorage.setItem("todayLiveFresh_v8", newVal.toString());
          return newVal;
        }
        return prev;
      });
      setTodayLiveReused(prev => {
        if (data?.reuseFlow && data.reuseFlow > 0) {
          const newVal = prev + (data.reuseFlow / 60);
          localStorage.setItem("todayLiveReused_v8", newVal.toString());
          return newVal;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.flowRate, data?.reuseFlow]);

  const [weeklyHistory, setWeeklyHistory] = useState<any[]>(() => {
    const stored = localStorage.getItem('waterWeeklyHistory_mock_v9');
    if (stored) return JSON.parse(stored);
    
    // Preload with 6 realistic days for demo
    const cleanData = [
      { name: "Day 1", fresh: 8, reused: 4.2 },
      { name: "Day 2", fresh: 9.8, reused: 5.0 },
      { name: "Day 3", fresh: 11.2, reused: 4.8 },
      { name: "Day 4", fresh: 10.7, reused: 5.3 },
      { name: "Day 5", fresh: 9.5, reused: 4.6 },
      { name: "Day 6", fresh: 10.9, reused: 5.1 },
      { name: "Day 7", fresh: 0, reused: 0 }
    ];
    
    localStorage.setItem('waterWeeklyHistory_mock_v9', JSON.stringify(cleanData));
    localStorage.setItem('completedDaysCount_v8', '6');
    return cleanData;
  });

  const [lastWeekStrategy, setLastWeekStrategy] = useState<any>(() => {
     const stored = localStorage.getItem('waterNextWeekStrategy_mock_v8');
     return stored ? JSON.parse(stored) : null;
  });
  
  const [hasSentStrategyAlert, setHasSentStrategyAlert] = useState(() => {
     return localStorage.getItem('waterNextWeekAlertSent_mock_v8') === 'true';
  });

  useEffect(() => {
     const handleSync = () => {
       setCompletedDaysCount(parseInt(localStorage.getItem('completedDaysCount_v8') || '6'));
       setWeeklyHistory(JSON.parse(localStorage.getItem('waterWeeklyHistory_mock_v9') || '[]'));
       setTodayLiveFresh(parseFloat(localStorage.getItem("todayLiveFresh_v8") || "0"));
       setTodayLiveReused(parseFloat(localStorage.getItem("todayLiveReused_v8") || "0"));
     };
     
     window.addEventListener('sync-storage-intelligence', handleSync);
     return () => window.removeEventListener('sync-storage-intelligence', handleSync);
  }, []);

  const handleSimulateNextDay = () => {
    if (completedDaysCount >= 7) return;
    
    let newHistory = [...weeklyHistory];
    
    newHistory[completedDaysCount] = {
      ...newHistory[completedDaysCount],
      fresh: todayLiveFresh,
      reused: todayLiveReused
    };

    setWeeklyHistory(newHistory);
    localStorage.setItem('waterWeeklyHistory_mock_v9', JSON.stringify(newHistory));

    const nextCount = completedDaysCount + 1;
    setCompletedDaysCount(nextCount);
    localStorage.setItem('completedDaysCount_v8', nextCount.toString());

    const liveFlowRate = parseFloat(localStorage.getItem('liveFlowRate') || '0');
    const liveReuseRate = parseFloat(localStorage.getItem('liveReuseRate') || '0');
    const newOffsetFlow = (data?.flowRate && data.flowRate > 0) ? data.flowRate : liveFlowRate;
    const newOffsetReuse = (data?.reuseFlow && data.reuseFlow > 0) ? data.reuseFlow : liveReuseRate;
    
    // Set for other components globally
    localStorage.setItem("dailyOffsetFlow", newOffsetFlow.toString());
    localStorage.setItem("dailyOffsetReuse", newOffsetReuse.toString());

    // Reset local accumulators
    setTodayLiveFresh(0);
    localStorage.setItem("todayLiveFresh_v8", "0");
    setTodayLiveReused(0);
    localStorage.setItem("todayLiveReused_v8", "0");
    
    // Explicitly reset daily accumulation counters so they remain 0
    localStorage.setItem("liveCtoUsed", "0");
    localStorage.setItem("shiftOffset", "0");
    localStorage.setItem("morningUsage", "0");
    localStorage.setItem("afternoonUsage", "0");
    localStorage.setItem("nightUsage", "0");
    localStorage.setItem("emailSent", "false");

    if (nextCount === 7) {
      // Week Finished!
      const completedFresh = newHistory.reduce((acc, d) => acc + d.fresh, 0);
      const completedReused = newHistory.reduce((acc, d) => acc + d.reused, 0);
      const total = completedFresh + completedReused;
      const freshPct = total > 0 ? (completedFresh / total) * 100 : 0;
      const reusedPct = total > 0 ? (completedReused / total) * 100 : 0;
      
      let targetFreshPct = freshPct;
      let targetReusedPct = reusedPct;
      
      if (completedFresh > completedReused) {
         targetFreshPct = Math.max(20, freshPct - 30);
         targetReusedPct = 100 - targetFreshPct;
      } else {
         targetFreshPct = Math.max(10, freshPct - 10);
         targetReusedPct = 100 - targetFreshPct;
      }
      
      const expectedSaving = (total * freshPct / 100) - (total * targetFreshPct / 100);
      const expectedCtoImp = (expectedSaving / (a.ctoLimit * 7)) * 100;
      
      const newStrategy = {
         lastWeekFreshPct: freshPct,
         lastWeekReusedPct: reusedPct,
         targetFreshPct,
         targetReusedPct,
         expectedSaving: expectedSaving > 0 ? expectedSaving : 0,
         expectedCtoImp: expectedCtoImp > 0 ? expectedCtoImp : 0,
         targetFreshLiters: (a.ctoLimit * 7) * (targetFreshPct / 100)
      };
      
      setLastWeekStrategy(newStrategy);
      localStorage.setItem('waterNextWeekStrategy_mock_v8', JSON.stringify(newStrategy));
      setHasSentStrategyAlert(false);
      localStorage.setItem('waterNextWeekAlertSent_mock_v8', 'false');
    }
    
    // Sync globally so that Daily CTO Consumption drops to 0 instantly
    window.dispatchEvent(new Event('sync-storage-intelligence'));
  };

  const handleSimulateNextWeek = () => {
    const cleanData = [
      { name: "Day 1", fresh: 8, reused: 4.2 },
      { name: "Day 2", fresh: 9.8, reused: 5.0 },
      { name: "Day 3", fresh: 11.2, reused: 4.8 },
      { name: "Day 4", fresh: 10.7, reused: 5.3 },
      { name: "Day 5", fresh: 9.5, reused: 4.6 },
      { name: "Day 6", fresh: 10.9, reused: 5.1 },
      { name: "Day 7", fresh: 0, reused: 0 }
    ];
    
    setWeeklyHistory(cleanData);
    localStorage.setItem('waterWeeklyHistory_mock_v9', JSON.stringify(cleanData));
    
    setCompletedDaysCount(6);
    localStorage.setItem('completedDaysCount_v8', '6');

    setLastWeekStrategy(null);
    localStorage.removeItem('waterNextWeekStrategy_mock_v8');
    localStorage.removeItem('weeklyReuseMissedAlertSent_v8');
    setHasSentReuseMissedAlert(false);

    const liveFlowRate = parseFloat(localStorage.getItem('liveFlowRate') || '0');
    const liveReuseRate = parseFloat(localStorage.getItem('liveReuseRate') || '0');
    const newOffsetFlow = (data?.flowRate && data.flowRate > 0) ? data.flowRate : liveFlowRate;
    const newOffsetReuse = (data?.reuseFlow && data.reuseFlow > 0) ? data.reuseFlow : liveReuseRate;
    
    // Set for other components globally
    localStorage.setItem("dailyOffsetFlow", newOffsetFlow.toString());
    localStorage.setItem("dailyOffsetReuse", newOffsetReuse.toString());

    // Reset local accumulators
    setTodayLiveFresh(0);
    localStorage.setItem("todayLiveFresh_v8", "0");
    setTodayLiveReused(0);
    localStorage.setItem("todayLiveReused_v8", "0");
    
    // Explicitly reset daily accumulation counters so they remain 0
    localStorage.setItem("liveCtoUsed", "0");
    localStorage.setItem("shiftOffset", "0");
    localStorage.setItem("morningUsage", "0");
    localStorage.setItem("afternoonUsage", "0");
    localStorage.setItem("nightUsage", "0");
    localStorage.setItem("emailSent", "false");
    
    // Sync globally so that Daily CTO Consumption drops to 0 instantly
    window.dispatchEvent(new Event('sync-storage-intelligence'));
  };

  const handleApplyStrategy = async (strategy: any) => {
     if (!strategy) return;
     const newDailyTarget = Math.max(5, Math.round((a.ctoLimit * 7) * (strategy.targetReusedPct / 100) / 7));
     const newMonthlyTarget = newDailyTarget * 30;
     
     // Update global state
     updateSetup({ dailyReuseTarget: newDailyTarget, monthlyReuseTarget: newMonthlyTarget });
     
     // Update Supabase
     if (userEmail) {
       try {
         await supabase
           .from('industry')
           .update({ 
             daily_reuse_target: newDailyTarget, 
             monthly_reuse_target: newMonthlyTarget 
           })
           .eq('email', userEmail);
       } catch (err) {
         console.error("Failed to update Supabase targets", err);
       }
     }
     
     alert(`Next Week Strategy Applied!\nDaily Reuse Target is now ${newDailyTarget}L.`);
  };

  useEffect(() => {
     if (lastWeekStrategy && !hasSentStrategyAlert && userEmail) {
        const currentFreshTotal = weeklyHistory.reduce((acc, curr) => acc + curr.fresh, 0);
        
        if (currentFreshTotal > lastWeekStrategy.targetFreshLiters && currentFreshTotal > 5) {
           setHasSentStrategyAlert(true);
           localStorage.setItem('waterNextWeekAlertSent_mock', 'true');
           
           fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                 to: userEmail,
                 subject: "Fresh Water Usage Exceeded Weekly Target",
                 text: `Dear ${state.setup?.plantName || 'Industry'},\n\nThe current week's Fresh Water consumption (${currentFreshTotal.toFixed(1)}L) has exceeded the planned operational strategy target (${lastWeekStrategy.targetFreshLiters.toFixed(1)}L).\n\nRecommendation: Please prioritize Reused Water to maintain CTO compliance and reduce environmental impact.`
              })
           }).catch(err => console.error("Strategy alert email failed", err));
        }
     }
  }, [weeklyHistory, lastWeekStrategy, hasSentStrategyAlert, userEmail, state.setup?.plantName]);

  const chartData = weeklyHistory.map((dayData, i) => {
    let fresh = dayData.fresh;
    let reused = dayData.reused;
    
    const total = fresh + reused;
    
    let status = "normal";
    if (total > ctoLimit) status = "exceeded";
    else if (total >= ctoLimit * 0.9) status = "warning";

    return {
      name: dayData.name,
      fresh: Number(fresh.toFixed(1)),
      reused: Number(reused.toFixed(1)),
      cto: ctoLimit,
      total: Number(total.toFixed(1)),
      status
    };
  });

  const weeklyFresh = chartData.reduce((acc, curr) => acc + curr.fresh, 0);
  const weeklyReused = chartData.reduce((acc, curr) => acc + curr.reused, 0);
  
  const totalWeekly = weeklyFresh + weeklyReused;
  const freshPct = totalWeekly > 0 ? (weeklyFresh / totalWeekly) * 100 : 0;
  const reusedPct = totalWeekly > 0 ? (weeklyReused / totalWeekly) * 100 : 0;
  
  const weeklyCtoLimit = (a?.ctoLimit || 15) * 7;
  const ctoPct = weeklyCtoLimit > 0 ? (totalWeekly / weeklyCtoLimit) * 100 : 0;
  
  
  // Daily Reuse Target calculation and missed target detection (>= 2 missed days per week)
  const dailyReuseTargetPct = state.setup?.dailyReuseTarget ?? state.setup?.reuseTarget ?? 60;
  
  const weeklyTargetStats = useMemo(() => {
    let missedCount = 0;
    weeklyHistory.forEach((day, idx) => {
      if (idx < completedDaysCount) {
        const total = day.fresh + day.reused;
        if (total > 0) {
          const reusePct = (day.reused / total) * 100;
          if (reusePct < dailyReuseTargetPct) {
            missedCount++;
          }
        }
      }
    });
    return { missedCount, targetPct: dailyReuseTargetPct };
  }, [weeklyHistory, completedDaysCount, dailyReuseTargetPct]);

  const [hasSentReuseMissedAlert, setHasSentReuseMissedAlert] = useState(() => {
    return localStorage.getItem('weeklyReuseMissedAlertSent_v8') === 'true';
  });

  useEffect(() => {
    if (weeklyTargetStats.missedCount >= 2 && !hasSentReuseMissedAlert && userEmail) {
      setHasSentReuseMissedAlert(true);
      localStorage.setItem('weeklyReuseMissedAlertSent_v8', 'true');

      const emailSubject = "Weekly Reuse Target Not Achieved";
      const emailBody = `Dear ${state.setup?.plantName || 'Industry'},

The industry failed to achieve the configured Daily Reuse Target multiple times during this week (${weeklyTargetStats.missedCount} missed days).
Please review plant operations and increase Reused Water utilization immediately.

• Daily Reuse Target: ${weeklyTargetStats.targetPct}%
• Missed Days Count: ${weeklyTargetStats.missedCount} of 7 days
• Total Weekly Reused Water: ${weeklyReused.toFixed(1)}L
• Total Weekly Fresh Water: ${weeklyFresh.toFixed(1)}L

Regards,
HydroNexa Compliance System`;

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          subject: emailSubject,
          text: emailBody,
          fromName: "HydroNexa Compliance System"
        })
      }).catch(err => console.error("Weekly reuse alert email failed", err));

      try {
        supabase.from('alert_history').insert({
          industryname: state.setup?.plantName || 'Industry Facility',
          alerttype: 'Weekly Reuse Target Not Achieved',
          message: `Missed reuse target ${weeklyTargetStats.missedCount} times this week`,
          deliverystatus: 'Delivered',
          timestamp: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error("Error inserting alert_history for weekly target", error);
        });
      } catch (e) {
        console.error("Supabase insert error", e);
      }
    }
  }, [weeklyTargetStats.missedCount, weeklyTargetStats.targetPct, hasSentReuseMissedAlert, userEmail, state.setup?.plantName, weeklyReused, weeklyFresh]);

  const diff = Math.abs(weeklyFresh - weeklyReused);
  const maxVal = Math.max(weeklyFresh, weeklyReused);
  const isBalanced = maxVal > 0 ? (diff / maxVal) <= 0.05 : false;

  let envImpact = "LOW";
  let envImpactColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  let strategyBadge = "Reuse Dominant";
  let strategyColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  if (weeklyFresh > weeklyReused) {
     envImpact = "HIGH";
     envImpactColor = "text-red-400 bg-red-500/10 border-red-500/30";
     strategyBadge = "Fresh Water Dominant";
     strategyColor = "text-red-400 bg-red-500/10 border-red-500/30";
  }
  
  if (isBalanced) {
     envImpact = "MODERATE";
     envImpactColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }

  let ctoStatus = "";
  let ctoColor = "";
  if (ctoPct > 90) {
      ctoStatus = "Exceeded";
      ctoColor = "text-red-400 bg-red-500/10 border-red-500/30";
  } else if (ctoPct > 75) {
      ctoStatus = "Near Limit";
      ctoColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else {
      ctoStatus = "Within Limit";
      ctoColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }

  let finalAiRecommendation = "";
  if (weeklyFresh > weeklyReused) {
      finalAiRecommendation = "Increase Reused Water allocation next week to reduce Fresh Water dependency.";
  } else {
      finalAiRecommendation = "Current reuse strategy is effective. Continue the same operational plan.";
  }

  return (
     <div className="mt-16 max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pl-4">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                 <TrendingUp className="h-6 w-6 text-cyan" />
              </div>
              <div>
                 <h2 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">Weekly Fresh Water vs Reused Water Analysis</h2>
                 <p className="text-[10px] text-cyan uppercase font-bold tracking-widest">Reusage of Water vis-a-vis CTO/Consumption</p>
              </div>
           </div>
           
           {completedDaysCount < 7 ? (
             <button 
                onClick={handleSimulateNextDay}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2"
             >
                <Calendar className="h-4 w-4 text-cyan" />
                Simulate Next Day
             </button>
           ) : (
             <button 
                onClick={handleSimulateNextWeek}
                className="bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-indigo-300 text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg active:scale-95 flex items-center gap-2"
             >
                <Calendar className="h-4 w-4 text-indigo-400" />
                Simulate Next Week
             </button>
           )}
        </div>

        {/* The Premium Combination Chart */}
        <div className="glass-strong border border-glass-border rounded-[2rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden h-[500px]">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
           
           <div className="h-full w-full relative z-10 pb-8">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="barFresh" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9}/>
                     <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3}/>
                   </linearGradient>
                   <linearGradient id="barReused" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9}/>
                     <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3}/>
                   </linearGradient>
                   <linearGradient id="barWarning" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                     <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3}/>
                   </linearGradient>
                   <linearGradient id="barDanger" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                     <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                 <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} tickMargin={10} />
                 <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }} tickFormatter={(value) => `${value} L`} />
                 <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                 <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                 
                 <Bar dataKey="reused" stackId="a" name="Reused Water (L)">
                   {chartData.map((entry, index) => {
                      let fillUrl = "url(#barReused)";
                      if (entry.status === 'exceeded') fillUrl = "url(#barDanger)";
                      else if (entry.status === 'warning') fillUrl = "url(#barWarning)";
                      return <Cell key={`cell-reused-${index}`} fill={fillUrl} className={index === completedDaysCount && completedDaysCount < 7 ? "animate-pulse" : ""} />;
                   })}
                 </Bar>

                 <Bar dataKey="fresh" stackId="a" name="Fresh Water (L)" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => {
                      let fillUrl = "url(#barFresh)";
                      if (entry.status === 'exceeded') fillUrl = "url(#barDanger)";
                      else if (entry.status === 'warning') fillUrl = "url(#barWarning)";
                      return <Cell key={`cell-fresh-${index}`} fill={fillUrl} className={index === completedDaysCount && completedDaysCount < 7 ? "animate-pulse" : ""} />;
                   })}
                 </Bar>
                 
                 <Line type="monotone" dataKey="cto" name="Daily CTO Limit (L)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#000' }} activeDot={{ r: 6 }} />
                 
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>

        
        {/* SECTION 0.5: Missed Weekly Target Compliance Card */}
        <div className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-lg ${
          weeklyTargetStats.missedCount >= 2 
            ? 'bg-amber-500/10 border-amber-500/30' 
            : 'bg-eco/10 border-eco/30'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border mt-0.5 ${
              weeklyTargetStats.missedCount >= 2 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                : 'bg-eco/20 border-eco/40 text-eco'
            }`}>
              {weeklyTargetStats.missedCount >= 2 ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Weekly Target Compliance Status
                </h4>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  weeklyTargetStats.missedCount >= 2 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                    : 'bg-eco/20 text-eco border-eco/40'
                }`}>
                  {weeklyTargetStats.missedCount >= 2 ? `${weeklyTargetStats.missedCount} Days Missed` : 'On Target'}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                {weeklyTargetStats.missedCount >= 2
                  ? `Alert triggered: Reused water did not meet the ${weeklyTargetStats.targetPct}% target on ${weeklyTargetStats.missedCount} completed days. Formal compliance email notification has been dispatched to ${userEmail || 'registered industry contact'}.`
                  : `Plant is meeting daily reuse targets (${weeklyTargetStats.missedCount} days below target). Operational compliance remains in Good standing.`
                }
              </p>
            </div>
          </div>
          {weeklyTargetStats.missedCount >= 2 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Compliance Email Sent
              </span>
            </div>
          )}
        </div>

        {/* SECTION 1: Fresh Water Consumption Summary */}
        <div className="pt-8 space-y-4">
           <h3 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md pl-4">Fresh Water Consumption Summary</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-strong border border-glass-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center shadow-lg">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan/10 blur-2xl rounded-full pointer-events-none" />
                 <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Today's Fresh Water</p>
                 <p className="text-3xl font-black text-white">{todayLiveFresh.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} <span className="text-base text-cyan">L</span></p>
              </div>
              <div className="glass-strong border border-glass-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center shadow-lg">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan/10 blur-2xl rounded-full pointer-events-none" />
                 <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Weekly Fresh Water</p>
                 <p className="text-3xl font-black text-white">{weeklyFresh.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} <span className="text-base text-cyan">L</span></p>
              </div>
              <div className="glass-strong border border-glass-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center shadow-lg">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-cyan/10 blur-2xl rounded-full pointer-events-none" />
                 <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Monthly Fresh Water</p>
                 <p className="text-3xl font-black text-white">{(weeklyFresh * 4).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1})} <span className="text-base text-cyan">L</span></p>
              </div>
           </div>
        </div>

        {/* SECTION 2: Final Weekly Analysis */}
        {completedDaysCount === 7 && (
          <div className="pt-4 pb-12 space-y-4">
             <h3 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md pl-4">Final Weekly Analysis</h3>
             <div className="glass-strong border border-glass-border rounded-2xl p-8 relative overflow-hidden shadow-lg flex flex-col gap-8">
                <div className="absolute right-0 top-0 w-64 h-64 bg-cyan/5 blur-[80px] rounded-full pointer-events-none" />
                
                {/* 1. Weekly Water Contribution */}
                <div>
                   <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-4">Weekly Water Contribution</p>
                   <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-4">
                         <span className="w-24 text-xs font-bold text-white/80 uppercase tracking-wider">Fresh Water</span>
                         <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan transition-all duration-1000" style={{ width: `${freshPct}%` }} />
                         </div>
                         <span className="w-12 text-right text-xs font-black text-cyan">{freshPct.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="w-24 text-xs font-bold text-white/80 uppercase tracking-wider">Reuse Water</span>
                         <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-eco transition-all duration-1000" style={{ width: `${reusedPct}%` }} />
                         </div>
                         <span className="w-12 text-right text-xs font-black text-eco">{reusedPct.toFixed(0)}%</span>
                      </div>
                   </div>
                </div>

                {/* Badges row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
                   <div>
                      <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-2">Environmental Impact</p>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${envImpactColor}`}>
                         {envImpact === "LOW" && "🟢"} {envImpact === "MODERATE" && "🟡"} {envImpact === "HIGH" && "🔴"} {envImpact}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-2">Weekly Water Strategy</p>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${strategyColor}`}>
                         {strategyBadge === "Reuse Dominant" ? "🟢" : (strategyBadge === "Balanced Operations" ? "🟡" : "🔴")} {strategyBadge}
                      </div>
                   </div>
                   <div>
                      <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-2">CTO Status</p>
                      <div className={`inline-flex items-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${ctoColor}`}>
                         {ctoStatus === "Within Limit" && "🟢"} {ctoStatus === "Near Limit" && "🟡"} {ctoStatus === "Exceeded" && "🔴"} {ctoStatus}
                      </div>
                   </div>
                </div>

                {/* Smart Recommendation */}
                <div className="pt-4 border-t border-white/10">
                   <div className="flex items-start gap-3">
                      <div className="mt-1 h-6 w-6 rounded flex items-center justify-center bg-white/5 border border-white/10 text-cyan">
                         <Brain className="h-4 w-4" />
                      </div>
                      <div>
                         <p className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">Smart Recommendation</p>
                         <p className="text-sm font-bold text-white/90">{finalAiRecommendation}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* SECTION 3: AI Next Week Strategy */}
        {lastWeekStrategy && (
           <div className="pt-4 pb-12 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-md pl-4">Next Week Operational Strategy</h3>
              <div className="glass-strong border border-glass-border rounded-2xl p-8 relative overflow-hidden shadow-lg">
                 <div className="absolute left-0 top-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Last Week Overview */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                       <h4 className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-4">Last Week Analysis</h4>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-white/80">Fresh Water</span>
                             <span className="text-lg font-black text-cyan">{lastWeekStrategy.lastWeekFreshPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-white/80">Reused Water</span>
                             <span className="text-lg font-black text-eco">{lastWeekStrategy.lastWeekReusedPct.toFixed(1)}%</span>
                          </div>
                       </div>
                    </div>
                    
                    {/* Next Week Target */}
                    <div className="bg-white/5 rounded-xl p-6 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)] relative overflow-hidden">
                       <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full pointer-events-none" />
                       <h4 className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-4">Smart Recommendation: Next Week Target</h4>
                       <div className="space-y-4 relative z-10">
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-white/80">Fresh Water</span>
                             <span className="text-lg font-black text-cyan">{lastWeekStrategy.targetFreshPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-white/80">Reused Water</span>
                             <span className="text-lg font-black text-eco">{lastWeekStrategy.targetReusedPct.toFixed(1)}%</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div>
                       <p className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-1">Expected Fresh Water Saving</p>
                       <p className="text-2xl font-black text-white">{lastWeekStrategy.expectedSaving.toFixed(1)} <span className="text-sm text-cyan">L</span></p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-black tracking-widest text-white/50 mb-1">Expected CTO Improvement</p>
                       <p className="text-2xl font-black text-eco">+{lastWeekStrategy.expectedCtoImp.toFixed(1)}%</p>
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex justify-end">
                    <button 
                       onClick={() => handleApplyStrategy(lastWeekStrategy)}
                       className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-indigo-300 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 shadow-lg hover:scale-105"
                    >
                       <Target className="h-4 w-4" />
                       Apply Next Week Strategy
                    </button>
                 </div>
              </div>
           </div>
        )}
     </div>
  );
}
