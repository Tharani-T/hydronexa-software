import { motion } from "framer-motion";
import { Factory, Droplets, Recycle, Waves, Cpu, Zap, ArrowRight, ShieldCheck, Activity, Wind, Beaker } from "lucide-react";

export function DigitalTwin({ data }: { data: any }) {
  const freshLevel = data?.waterLevel ?? 0;
  const ultrasonic = data?.ultrasonic ?? 0;
  const flowActive = (data?.flowRate ?? 0) > 0.5;
  const ph = data?.ph ?? 7.1;

  return (
    <div className="glass-strong rounded-[2.5rem] p-10 relative overflow-hidden border border-glass-border h-full flex flex-col shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 water-grid opacity-[0.05] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center animate-pulse-glow">
               <Cpu className="h-6 w-6 text-cyan" />
            </div>
            <div>
               <h3 className="text-lg font-black uppercase tracking-[0.2em] text-foreground">Digital Twin Live Mirror</h3>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Real-Time Operational Simulation v5.2</p>
            </div>
          </div>
          <div className="flex gap-3">
             <StatusBadge icon={ShieldCheck} label="Operational" color="eco" />
             <StatusBadge icon={Zap} label="Synced" color="cyan" />
          </div>
        </div>

        <div className="relative flex-1 min-h-[400px] w-full max-w-5xl mx-auto flex items-center justify-center">
          {/* Futuristic Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <filter id="glow-twin">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Primary Flow Paths */}
            <DynamicPath path="M 50 200 L 180 200" active={flowActive} />
            <DynamicPath path="M 280 200 L 400 200" active={flowActive} />
            <DynamicPath path="M 500 200 L 620 200" active={flowActive} />
            <DynamicPath path="M 720 200 L 850 200" active={flowActive} />
            
            {/* Reuse Loop Paths */}
            <DynamicPath 
              path="M 850 220 L 850 350 L 150 350 L 150 250" 
              active={flowActive && freshLevel > 10} 
              color="eco"
              speed={2.5}
            />
          </svg>

          {/* Industrial Nodes Grid */}
          <div className="grid grid-cols-4 w-full items-center relative gap-8 z-20">
             <TwinNode label="Intake" icon={Waves} color="cyan" active={flowActive} />
             <TwinNode label="Storage" icon={Droplets} fill={freshLevel} color="cyan" type="tank" />
             <TwinNode label="Treatment" icon={Beaker} status={ph > 8.5 || ph < 6.5 ? "warn" : "ok"} />
             <TwinNode label="Distribution" icon={Factory} active={flowActive} />
          </div>

          {/* Floating Telemetry Tags */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-10 right-0 glass border border-glass-border px-5 py-3 rounded-2xl backdrop-blur-xl shadow-2xl"
          >
             <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-eco animate-pulse" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Process Health</div>
             </div>
             <div className="text-xl font-black font-display text-eco">99.2% Nominal</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-10 left-0 glass border border-glass-border px-5 py-3 rounded-2xl backdrop-blur-xl shadow-2xl"
          >
             <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Sync Latency</div>
             </div>
             <div className="text-xl font-black font-display text-cyan">42ms Real-time</div>
          </motion.div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-glass-border pt-8">
           <div className="flex gap-10">
              <MiniStat label="Intake Pressure" value="5.8 bar" color="cyan" />
              <MiniStat label="Ultrasonic Mirror" value={`${ultrasonic.toFixed(1)} cm`} color="eco" />
              <MiniStat label="System Uptime" value="142:12:08" color="cyan" />
           </div>
           <button className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group px-6 py-3 rounded-full glass border border-glass-border">
              Detailed Topology <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
}

function DynamicPath({ path, active, color = "cyan", speed = 1.5 }: any) {
  return (
    <>
      <path d={path} stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="none" strokeLinecap="round" />
      {active && (
        <motion.path
          d={path}
          stroke={`var(--${color})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: "8, 16", strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -40 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
          style={{ filter: "url(#glow-twin)" }}
          className="opacity-60"
        />
      )}
    </>
  );
}

function TwinNode({ label, icon: Ic, fill, color = "cyan", type = "unit", status = "ok", active }: any) {
  const isTank = type === "tank";
  const glowColor = status === "warn" ? "var(--warn)" : `var(--${color})`;

  return (
    <div className="flex flex-col items-center gap-6 relative z-20 group">
      <div className={`relative ${isTank ? 'h-40 w-24' : 'h-28 w-28'} rounded-[2rem] glass border border-glass-border flex flex-col items-center justify-center transition-all duration-500 hover:scale-105 hover:border-${color}/40 shadow-xl`}>
        <div className={`absolute -inset-4 rounded-[3rem] opacity-0 group-hover:opacity-10 transition-opacity blur-2xl`} style={{ background: glowColor }} />
        
        {isTank ? (
          <div className="absolute inset-3 rounded-2xl bg-black/50 overflow-hidden border border-white/5">
             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: `${fill}%` }}
               className={`absolute bottom-0 left-0 right-0 transition-all duration-1000`}
               style={{ background: `linear-gradient(to top, var(--${color}) 0%, color-mix(in oklab, var(--${color}) 40%, transparent) 100%)` }}
             >
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 animate-pulse" />
                <div className="absolute inset-0 bg-[url('/waves.svg')] opacity-20 bg-repeat-x animate-wave-slow" />
             </motion.div>
             <div className="absolute inset-0 flex items-center justify-center">
                <Ic className="h-8 w-8 text-white/5" />
             </div>
          </div>
        ) : (
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:shadow-glow-${color} ${active ? 'animate-pulse' : ''}`} style={{ background: `color-mix(in oklab, ${glowColor} 15%, transparent)`, border: `1px solid color-mix(in oklab, ${glowColor} 20%, transparent)` }}>
             <Ic className="h-7 w-7" style={{ color: glowColor }} />
          </div>
        )}
        
        {isTank && (
          <div className="absolute -bottom-2 right-4 glass border border-glass-border rounded-lg px-2 py-1 text-[10px] font-black shadow-2xl">
            {Math.round(fill || 0)}%
          </div>
        )}
      </div>
      <div className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-colors">{label}</div>
    </div>
  );
}

function StatusBadge({ icon: Ic, label, color }: any) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl glass border border-glass-border shadow-lg">
       <Ic className="h-4 w-4" style={{ color: `var(--${color})` }} />
       <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div className="group cursor-default">
       <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-black opacity-50 mb-1 group-hover:opacity-100 transition-opacity">{label}</div>
       <div className="text-lg font-black font-display tracking-tight" style={{ color: `var(--${color})` }}>{value}</div>
    </div>
  );
}
