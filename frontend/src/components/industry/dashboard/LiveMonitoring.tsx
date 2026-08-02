import { SensorData } from "@/hooks/useThingSpeak";
import { motion } from "framer-motion";
import { 
  Activity, Thermometer, Droplets, Waves, 
  RefreshCcw, Power, Factory, ShieldCheck, Recycle
} from "lucide-react";
import { useEffect, useState } from "react";

export function LiveMonitoring({ data }: { data: SensorData | null }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const flowRate = data?.flowRate ?? 0;
  const isFlowing = flowRate > 0;
  
  // Deriving values from live ThingSpeak data to simulate the full system loop
  const reuseLiters = ((data?.waterLevel ?? 0) / 100) * 5;
  const freshLiters = data ? 10 - ((data.totalFlow / 100) % 10) : 10;
  const recycleLiters = data ? 5 - reuseLiters : 0;
  const industryLiters = data ? Math.min(5, (flowRate / 30) * 5) : 0;

  // Determine active water source
  const usingReuse = reuseLiters > 0.5;
  const freshActive = isFlowing && !usingReuse;
  const reuseActive = isFlowing && usingReuse;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      <style>{`
        @keyframes flow {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      
      {/* 1. Main Digital Twin */}
      <div className="glass-strong border border-glass-border rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col shadow-2xl">
         <div className="flex justify-between items-center z-20 relative mb-8">
            <h3 className="text-xl font-black uppercase tracking-widest text-cyan flex items-center gap-3">
               <Factory className="h-6 w-6" />
               Live Water Flow
            </h3>
            <div className="flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-eco"></span>
               </span>
               <span className="text-xs font-bold text-eco uppercase tracking-widest">Live Sync</span>
            </div>
         </div>

         <div className="relative w-full aspect-[2/1] min-h-[500px] mt-4 bg-black/10 rounded-[2rem] border border-white/5">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
               {/* Fresh -> Industry */}
               <Pipeline x1="15%" y1="25%" x2="50%" y2="25%" active={freshActive} />
               {/* Industry -> Recycle */}
               <Pipeline x1="50%" y1="25%" x2="50%" y2="75%" active={isFlowing} />
               {/* Recycle -> Treatment */}
               <Pipeline x1="50%" y1="75%" x2="85%" y2="75%" active={recycleLiters > 0.5} />
               {/* Treatment -> Reuse */}
               <Pipeline x1="85%" y1="75%" x2="85%" y2="25%" active={recycleLiters > 0.5} />
               {/* Reuse -> Industry */}
               <Pipeline x1="85%" y1="25%" x2="50%" y2="25%" active={reuseActive} />
            </svg>

            {/* Nodes */}
            <TankNode name="Fresh Water Tank" current={freshLiters} capacity={10} top="25%" left="15%" />
            <TankNode name="Industry Tank" current={industryLiters} capacity={5} top="25%" left="50%" />
            <TankNode name="Reuse Tank" current={reuseLiters} capacity={5} top="25%" left="85%" />
            
            <TankNode name="Recycle Tank" current={recycleLiters} capacity={5} top="75%" left="50%" />
            <ProcessNode name="Water Treatment" top="75%" left="85%" icon={RefreshCcw} active={recycleLiters > 0.5} />
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         <SensorHealthCard data={data} time={time} />
         <WaterFlowStatusCard flowRate={flowRate} recycleLiters={recycleLiters} reuseLiters={reuseLiters} />
      </div>
    </div>
  );
}

function Pipeline({ x1, y1, x2, y2, active }: { x1: string, y1: string, x2: string, y2: string, active: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
      {active && (
        <line 
          x1={x1} y1={y1} x2={x2} y2={y2} 
          stroke="var(--cyan)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeDasharray="8 12"
          style={{ 
            animation: 'flow 0.6s linear infinite',
            filter: 'drop-shadow(0 0 8px var(--cyan))' 
          }}
        />
      )}
    </g>
  )
}

function TankNode({ name, current, capacity, top, left }: any) {
  const percent = Math.min(100, Math.max(0, (current / capacity) * 100));
  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ top, left, zIndex: 10 }}>
       <div className="w-40 h-52 glass-strong border border-white/20 rounded-2xl p-3 flex flex-col relative overflow-hidden bg-black/60 shadow-2xl backdrop-blur-md hover:border-cyan/50 transition-colors">
         {/* Liquid filling */}
         <div className="absolute bottom-0 left-0 right-0 bg-cyan/30 transition-all duration-1000 ease-in-out border-t border-cyan/60" style={{ height: `${percent}%` }}>
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-transparent" />
            <div className="w-full h-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] animate-pulse" />
         </div>
         {/* Content */}
         <div className="relative z-10 flex flex-col h-full items-center justify-between py-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{name}</span>
            <div className="flex flex-col items-center">
               <span className="text-4xl font-display font-black text-white drop-shadow-[0_2px_10px_rgba(0,255,255,0.4)]">{current.toFixed(1)}<span className="text-lg text-white/70 ml-1">L</span></span>
               <span className="text-[10px] text-cyan uppercase font-bold mt-2 bg-black/50 px-2 py-0.5 rounded-full">{percent.toFixed(0)}% Filled</span>
               <span className="text-[9px] text-white/50 uppercase mt-1">Cap: {capacity}L</span>
            </div>
            <span className="text-[9px] px-3 py-1 rounded-full bg-eco/20 text-eco border border-eco/30 font-bold uppercase flex items-center gap-1.5 backdrop-blur-sm">
               <span className="h-1.5 w-1.5 rounded-full bg-eco animate-pulse" /> Live
            </span>
         </div>
       </div>
    </div>
  )
}

function ProcessNode({ name, top, left, icon: Icon, active }: any) {
  return (
    <div className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ top, left, zIndex: 10 }}>
       <div className={`w-32 h-32 rounded-full glass-strong border-2 flex flex-col items-center justify-center bg-black/60 shadow-2xl backdrop-blur-md transition-colors ${active ? 'border-cyan/50 shadow-[0_0_30px_rgba(0,255,255,0.15)]' : 'border-white/10'}`}>
          {active && <div className="absolute inset-0 rounded-full border-2 border-cyan/40 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />}
          <Icon className={`h-10 w-10 mb-2 ${active ? 'text-cyan animate-pulse' : 'text-white/30'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight text-white/80">{name}</span>
       </div>
    </div>
  )
}

function SensorHealthCard({ data, time }: any) {
  return (
    <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border flex flex-col justify-between shadow-2xl">
      <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/90">
        <Activity className="h-5 w-5 text-cyan" />
        Sensor Health
      </h4>
      <div className="space-y-4">
        <SensorRow name="Ultrasonic Sensor" value={`${data?.ultrasonic.toFixed(1) ?? "0"} cm`} active={!!data} time={time} />
        <SensorRow name="pH Sensor" value={`${data?.ph.toFixed(1) ?? "0"} pH`} active={!!data} time={time} />
        <SensorRow name="Temperature Sensor" value={`${data?.temperature.toFixed(1) ?? "0"} °C`} active={!!data} time={time} />
      </div>
    </div>
  )
}

function SensorRow({ name, value, active, time }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 hover:bg-white/10 transition-colors group">
       <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${active ? 'bg-eco/10 border-eco/30 text-eco' : 'bg-danger/10 border-danger/30 text-danger'}`}>
             {active ? <ShieldCheck className="h-6 w-6" /> : <Power className="h-6 w-6" />}
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-bold uppercase tracking-wider text-white/90 group-hover:text-cyan transition-colors">{name}</span>
             <span className="text-[10px] text-white/50 mt-0.5">{active ? 'Connected' : 'Disconnected'} • {time.toLocaleTimeString()}</span>
          </div>
       </div>
       <div className="flex flex-col items-end">
          <span className="text-xl font-display font-black text-cyan">{value}</span>
          <div className="flex items-center gap-1.5 mt-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
             <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-eco animate-pulse shadow-glow-sm' : 'bg-danger'}`} style={active ? {boxShadow: '0 0 10px var(--eco)'} : {}} />
             <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: active ? 'var(--eco)' : 'var(--danger)' }}>Live</span>
          </div>
       </div>
    </div>
  )
}

function WaterFlowStatusCard({ flowRate, recycleLiters, reuseLiters }: any) {
  return (
    <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border flex flex-col justify-between shadow-2xl">
      <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/90">
        <Waves className="h-5 w-5 text-cyan" />
        Water Flow Status
      </h4>
      <div className="space-y-4">
        <FlowRow name="Fresh Water Flow" active={flowRate > 0.5} standby={flowRate > 0} icon={Droplets} />
        <FlowRow name="Recycle Water Flow" active={recycleLiters > 0.5} standby={recycleLiters > 0} icon={RefreshCcw} />
        <FlowRow name="Reuse Water Flow" active={reuseLiters > 0.5} standby={reuseLiters > 0} icon={Recycle} />
      </div>
    </div>
  )
}

function FlowRow({ name, active, standby, icon: Icon }: any) {
  let status = "Stopped";
  let color = "danger";
  if (active) { status = "Active"; color = "eco"; }
  else if (standby) { status = "Standby"; color = "warn"; }

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 hover:bg-white/10 transition-colors group">
       <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border bg-${color}/10 border-${color}/30 text-${color}`} style={{ color: `var(--${color})`, borderColor: `color-mix(in oklab, var(--${color}) 30%, transparent)`, backgroundColor: `color-mix(in oklab, var(--${color}) 10%, transparent)` }}>
             <Icon className={`h-6 w-6 ${active ? 'animate-pulse' : ''}`} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-white/90 group-hover:text-cyan transition-colors">{name}</span>
       </div>
       <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
          <span className={`h-2 w-2 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ backgroundColor: `var(--${color})`, boxShadow: `0 0 10px var(--${color})` }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `var(--${color})` }}>{status}</span>
       </div>
    </div>
  )
}
