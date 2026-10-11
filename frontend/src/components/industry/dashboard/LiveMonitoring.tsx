import { SensorData } from "@/hooks/useThingSpeak";
import { motion } from "framer-motion";
import {
  Activity, Thermometer, Droplets, Waves,
  RefreshCcw, Power, Factory, ShieldCheck, Recycle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

export function LiveMonitoring({ data }: { data: SensorData | null }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [liveDistance, setLiveDistance] = useState<number>(() => {
    return parseFloat(localStorage.getItem('liveUltrasonic') || '15');
  });

  useEffect(() => {
    if (data && typeof data.ultrasonic === 'number' && data.ultrasonic > 0) {
      setLiveDistance(data.ultrasonic);
    }
  }, [data?.ultrasonic]);

  const lastFreshVal = useRef<number | null>(null);
  const lastFreshTime = useRef<number>(Date.now());

  const lastReuseVal = useRef<number | null>(null);
  const lastReuseTime = useRef<number>(Date.now());

  useEffect(() => {
    if (data?.flowRate !== undefined && data.flowRate !== lastFreshVal.current) {
      lastFreshVal.current = data.flowRate;
      lastFreshTime.current = Date.now();
    }
    if (data?.reuseFlow !== undefined && data.reuseFlow !== lastReuseVal.current) {
      lastReuseVal.current = data.reuseFlow;
      lastReuseTime.current = Date.now();
    }
  }, [data?.flowRate, data?.reuseFlow]);

  let isDataFresh = false;
  if (data?.timestamp) {
    const diff = Math.floor((time.getTime() - new Date(data.timestamp).getTime()) / 1000);
    isDataFresh = diff < 60; // Stop animation if no data at all for 60 seconds
  }

  // ============================================================================
  // IMPORTANT: THE FOLLOWING LIVE MONITORING WORKFLOW IS FINAL AND LOCKED.
  // DO NOT modify this logic, animation behavior, ThingSpeak mappings, 
  // pipeline direction, or trigger conditions under ANY circumstances, 
  // even if future prompts modify other pages.
  // ============================================================================

  // Field 7 (Reuse Flow Rate) - MUST be continuously changing
  const isReuseChanging = (time.getTime() - lastReuseTime.current) < 25000;
  const reuseActive = isDataFresh && isReuseChanging && (data?.reuseFlow ?? 0) > 0;

  // Field 1 (Fresh Water Flow Rate) - Last Valid Value Logic
  const lastValidFlowRate = useRef<number>(0);

  if (data?.flowRate && data.flowRate > 0) {
    lastValidFlowRate.current = data.flowRate;
  }

  const isFreshChanging = (time.getTime() - lastFreshTime.current) < 25000;

  // Use last valid value if current is 0 or disconnected
  const flowRate = (isDataFresh && isFreshChanging && (data?.flowRate ?? 0) > 0)
    ? (data?.flowRate ?? 0)
    : lastValidFlowRate.current;

  const isFlowing = flowRate > 0;
  // ============================================================================
  // Deriving values from live ThingSpeak data to simulate the full system loop
  const rawFreshLiters = Math.max(0, Math.min(10, 10 - ((liveDistance - 5) / 17) * 10));
  const freshLiters = Number(rawFreshLiters.toFixed(1));

  const reuseLiters = ((data?.waterLevel ?? 0) / 100) * 2;
  const recycleLiters = data ? + reuseLiters : 0;
  const industryLiters = data ? Math.min(5, (flowRate / 30) * 5) : 0;

  // Determine active water source directly from ThingSpeak hardware telemetry
  const freshActive = (data?.flowRate ?? 0) > 0;

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
            <Pipeline x1="12.5%" y1="25%" x2="37.5%" y2="25%" active={isFlowing} />
            {/* Industry -> Recycle */}
            <Pipeline x1="37.5%" y1="25%" x2="37.5%" y2="75%" active={isFlowing} />
            {/* Recycle -> Treatment */}
            <Pipeline x1="37.5%" y1="75%" x2="62.5%" y2="75%" active={isFlowing} />
            {/* Treatment -> Reuse */}
            <Pipeline x1="62.5%" y1="75%" x2="62.5%" y2="25%" active={isFlowing} />
            {/* Treatment -> Reject */}
            <Pipeline x1="62.5%" y1="75%" x2="87.5%" y2="75%" active={false} />
            {/* Reuse -> Industry */}
            <Pipeline x1="62.5%" y1="25%" x2="37.5%" y2="25%" active={reuseActive} />
          </svg>

          {/* Nodes */}
          <TankNode name="Fresh Water Tank" current={freshLiters} capacity={10} top="25%" left="12.5%" />
          <TankNode name="Industry Tank" current={industryLiters} capacity={5} top="25%" left="37.5%" />
          <TankNode name="Reuse Tank" current={reuseLiters} capacity={5} top="25%" left="62.5%" />

          <TankNode name="Recycle Tank" current={recycleLiters} capacity={5} top="75%" left="37.5%" />
          <ProcessNode name="Water Treatment" top="75%" left="62.5%" icon={RefreshCcw} active={recycleLiters > 0.5} />

          <TankNode name="REJECT WATER TANK" current={data ? 1.2 : 0} capacity={5} top="75%" left="87.5%" />
        </div>
      </div>

      <LiveWaterTransferAnalysis data={data} flowRate={flowRate} />
      <IoTSensorNetworkStatus data={data} time={time} />
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

function IoTSensorNetworkStatus({ data, time }: any) {
  let isOnline = false;
  if (data && data.timestamp) {
    const diff = Math.floor((time.getTime() - new Date(data.timestamp).getTime()) / 1000);
    // If no new data has been received for more than 60 seconds, mark as disconnected
    isOnline = diff < 60;
  }

  const sensors = [
    { name: "Flow Rate Sensor", icon: Droplets },
    { name: "Reuse Flow", icon: Recycle },
    { name: "Ultrasonic Level", icon: Waves },
    { name: "pH Sensor", icon: Activity },
    { name: "Temperature Sensor", icon: Thermometer },
  ];

  return (
    <div className="mt-12 glass-strong rounded-[2.5rem] p-8 border border-glass-border flex flex-col shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-16 relative z-10">
        <Activity className="h-6 w-6 text-cyan" />
        <h3 className="text-xl font-black uppercase tracking-widest text-white/90">IoT Sensor Network Status</h3>
      </div>

      <div className="relative w-full h-48 flex items-center justify-center">
        {/* Main horizontal pipeline */}
        <div className="absolute left-0 right-0 h-1 bg-white/10 top-1/2 -translate-y-1/2">
          <div className={`h-full ${isOnline ? 'bg-cyan' : 'bg-danger/30'}`} style={isOnline ? { animation: 'flow 2s linear infinite', backgroundImage: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.8) 50%, transparent)', backgroundSize: '200% 100%' } : {}} />
        </div>

        <div className="w-full flex justify-between absolute inset-0 px-4 md:px-12">
          {sensors.map((sensor, i) => {
            const Icon = sensor.icon;
            const isTop = i % 2 === 0;
            return (
              <div key={i} className="relative flex flex-col items-center justify-center" style={{ width: '0' }}>
                {/* The dot on the pipeline */}
                <div className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 ${isOnline ? 'bg-black border-cyan' : 'bg-black border-danger'} z-10 flex items-center justify-center`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-cyan animate-pulse shadow-glow-sm' : 'bg-danger'}`} style={isOnline ? { boxShadow: '0 0 10px var(--cyan)' } : {}} />
                </div>

                {/* Vertical connection line */}
                <div className={`absolute w-0.5 ${isOnline ? 'bg-cyan/40' : 'bg-danger/20'}`} style={{
                  height: '40px',
                  top: isTop ? 'auto' : '50%',
                  bottom: isTop ? '50%' : 'auto',
                }} />

                {/* Node content */}
                <div className={`absolute flex flex-col items-center w-32 ${isTop ? 'bottom-[calc(50%+40px)]' : 'top-[calc(50%+40px)]'}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isOnline ? 'bg-eco/10 border-eco/30 text-eco' : 'bg-danger/10 border-danger/30 text-danger'} mb-2`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center text-white/90 leading-tight mb-1">{sensor.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{isOnline ? '🟢' : '🔴'}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isOnline ? 'var(--eco)' : 'var(--danger)' }}>
                      {isOnline ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LiveWaterTransferAnalysis({ data, flowRate }: any) {
  const freshToIndustry = flowRate.toFixed(1);
  const industryToRecycle = (flowRate * 0.8).toFixed(1);
  const treatmentToReuse = data?.reuseFlow ? data.reuseFlow.toFixed(1) : (flowRate * 0.6).toFixed(1);
  const treatmentToReject = data?.reuseFlow ? (data.reuseFlow * 0.2).toFixed(1) : (flowRate * 0.2).toFixed(1);

  return (
    <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border flex flex-col shadow-2xl mt-8">
      <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white/90">
        <Activity className="h-5 w-5 text-cyan" />
        Live Water Transfer Analysis
      </h4>
      <div className="space-y-4">
        <TransferRow icon="💧" title="Fresh Water → Industry" value={freshToIndustry} active={flowRate > 0} />
        <TransferRow icon="🏭" title="Industry → Recycle" value={industryToRecycle} active={flowRate > 0} />
        <TransferRow icon="♻" title="Treatment → Reuse" value={treatmentToReuse} active={flowRate > 0} />
        <TransferRow icon="🚰" title="Treatment → Reject" value={treatmentToReject} active={flowRate > 0} />
      </div>
    </div>
  )
}

function TransferRow({ icon, title, value, active }: any) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-black/30 border border-white/5 hover:bg-white/10 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-2xl">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90 group-hover:text-cyan transition-colors">{title}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Current Transfer :</span>
            <span className="text-sm font-display font-black text-cyan">{value} L/min</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Status</span>
        <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
          <span className={`h-2 w-2 rounded-full ${active ? 'bg-eco animate-pulse shadow-glow-sm' : 'bg-danger'}`} style={active ? { boxShadow: '0 0 10px var(--eco)' } : {}} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: active ? 'var(--eco)' : 'var(--danger)' }}>{active ? 'Active' : 'Standby'}</span>
          {active && <span className="text-[10px] uppercase tracking-widest font-bold text-eco ml-1 border-l border-white/10 pl-2">LIVE</span>}
        </div>
      </div>
    </div>
  )
}
