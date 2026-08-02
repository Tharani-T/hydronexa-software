const fs = require('fs');
const file = 'src/routes/industry.dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'function StorageIntelligence({ data, history }: { data: SensorData | null; history: SensorData[] }) {';
const endStr = 'function AnalyticsFact({ icon: Ic, text, color }: any) {';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find start or end bounds.");
  process.exit(1);
}

const newSections = `function StorageIntelligence({ data, history }: { data: SensorData | null; history: SensorData[] }) {
  const ultrasonicDistance = data?.ultrasonic ?? 21;
  const flowRate = data?.flowRate ?? 0;
  const isFilling = flowRate > 0;
  
  const isCriticalEmpty = ultrasonicDistance >= 20; // 20-22 cm
  const isOverflowRisk = ultrasonicDistance <= 7;   // 5-7 cm
  const isLowWater = ultrasonicDistance > 15 && ultrasonicDistance < 20;

  const MAX_DIST = 22;
  const MIN_DIST = 5;
  const waterLevel = Math.max(0, Math.min(100, ((MAX_DIST - ultrasonicDistance) / (MAX_DIST - MIN_DIST)) * 100));
  const liveVolumeLiters = (waterLevel / 100) * 10;
  
  const estimatedMinsToOverflow = flowRate > 0 ? Math.round((100 - waterLevel) / (flowRate || 1) * 2) : 0;
  const estimatedMinsToEmpty = (!isFilling && flowRate === 0) ? Math.round(waterLevel * 1.5) : 0; 

  const alertStatus = isCriticalEmpty || isOverflowRisk ? 'danger' : isLowWater ? 'warn' : 'cyan';
  
  // CTO Data
  const ctoLimit = 15; // L
  const freshWaterUsedToday = 7; // L
  const freshWaterUsedWeek = 38; // L
  const freshWaterUsedMonth = 142; // L
  const ctoRemaining = Math.max(0, ctoLimit - freshWaterUsedToday);
  const ctoPercentage = Math.min(100, (freshWaterUsedToday / ctoLimit) * 100);

  const [alarmAcknowledged, setAlarmAcknowledged] = useState(false);
  const [activeAlarmType, setActiveAlarmType] = useState<string | null>(null);
  const [alarmVisible, setAlarmVisible] = useState(false);
  
  useEffect(() => {
    if (isCriticalEmpty) {
       if (activeAlarmType !== 'empty') {
          setActiveAlarmType('empty');
          setAlarmAcknowledged(false);
       }
    } else if (isOverflowRisk) {
       if (activeAlarmType !== 'overflow') {
          setActiveAlarmType('overflow');
          setAlarmAcknowledged(false);
       }
    } else {
       setActiveAlarmType(null);
       setAlarmAcknowledged(false);
       setAlarmVisible(false);
    }
  }, [isCriticalEmpty, isOverflowRisk, activeAlarmType]);

  useEffect(() => {
     let visibilityTimeout: any;
     let cycleInterval: any;

     if (activeAlarmType && !alarmAcknowledged) {
        setAlarmVisible(true);
        visibilityTimeout = setTimeout(() => {
           setAlarmVisible(false);
        }, 5000);

        cycleInterval = setInterval(() => {
           setAlarmVisible(true);
           visibilityTimeout = setTimeout(() => {
              setAlarmVisible(false);
           }, 5000);
        }, 15000);
     } else {
        setAlarmVisible(false);
     }

     return () => {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        if (cycleInterval) clearInterval(cycleInterval);
     };
  }, [activeAlarmType, alarmAcknowledged]);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let interval: any;

    if (alarmVisible) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        const playDoubleBeep = () => {
          if (!audioCtx) return;
          const beep = (startTime: number) => {
             const osc = audioCtx!.createOscillator();
             const gain = audioCtx!.createGain();
             osc.type = 'square';
             osc.frequency.setValueAtTime(800, startTime);
             
             gain.gain.setValueAtTime(0.1, startTime);
             gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
             
             osc.connect(gain);
             gain.connect(audioCtx!.destination);
             osc.start(startTime);
             osc.stop(startTime + 0.15);
          };

          const now = audioCtx.currentTime;
          beep(now);           // First beep
          beep(now + 0.2);     // Second beep
        };

        playDoubleBeep();
        interval = setInterval(playDoubleBeep, 1000);
      } catch (e) {
        console.error("Audio playback failed", e);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) audioCtx.close().catch(console.error);
    };
  }, [alarmVisible]);

  return (
    <div className="space-y-10 pb-20 relative min-h-screen">
       {/* Ambient Background Glow based on state */}
       <div className={\`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none transition-colors duration-1000 bg-\${alertStatus}\`} />

       {/* Top Smart Alarm / AI Action (Critical Empty or Overflow Risk) */}
       <AnimatePresence>
         {alarmVisible && (
            <motion.div 
               initial={{ opacity: 0, y: -40, scale: 0.9 }} 
               animate={{ opacity: 1, y: 0, scale: 1 }} 
               exit={{ opacity: 0, y: -40, scale: 0.9 }}
               className="fixed top-8 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-[2rem] p-8 border border-danger/50 shadow-[0_0_80px_rgba(255,0,0,0.4)] backdrop-blur-3xl flex items-center gap-8 w-[800px] max-w-[90vw]"
            >
               <div className="relative flex items-center justify-center shrink-0">
                  <div className="h-20 w-20 rounded-full bg-danger/20 flex items-center justify-center animate-pulse">
                     <BellRing className="h-10 w-10 text-danger drop-shadow-[0_0_15px_rgba(255,0,0,1)] animate-bounce" />
                  </div>
                  {/* Sound waves */}
                  <div className="absolute inset-0 rounded-full border-2 border-danger animate-ping opacity-60" style={{ animationDuration: '1s' }} />
                  <div className="absolute inset-[-15px] rounded-full border-2 border-danger animate-ping opacity-30" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute -bottom-4 bg-danger text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/20 whitespace-nowrap animate-pulse">
                     Buzzer Active
                  </div>
               </div>
               
               <div className="flex-1 flex flex-col justify-center">
                  <span className="text-3xl font-black uppercase tracking-widest text-danger drop-shadow-md mb-2">
                     {isCriticalEmpty ? 'Storage Tank is running low' : 'Overflow risk detected'}
                  </span>
                  <div className="text-lg font-bold text-white mb-4">
                     {isCriticalEmpty ? 'Please switch ON the Fresh Water Motor.' : 'Please switch OFF the Fresh Water Motor.'}
                  </div>
                  
                  <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 flex items-start gap-3">
                     <Brain className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-danger uppercase tracking-widest mb-1">AI Recommendation</span>
                        <span className="text-sm font-bold text-white">
                           {isCriticalEmpty ? 'Motor should be started immediately.' : 'Motor should be stopped immediately.'}
                        </span>
                     </div>
                  </div>
               </div>
               
               <button 
                  onClick={() => setAlarmAcknowledged(true)} 
                  className="px-6 py-3 shrink-0 rounded-full bg-danger/20 hover:bg-danger/40 border border-danger/50 text-white font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(255,0,0,0.3)]"
               >
                  OK
               </button>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Cinematic Centerpiece & Side Panels */}
       <div className="grid xl:grid-cols-12 gap-8 relative items-center">
          
          {/* Left Panel: Fresh Water Consumption & AI Forecast */}
          <div className="xl:col-span-3 space-y-6 flex flex-col z-20">
             
             {/* City Water Limit (CTO) */}
             <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Factory className="w-24 h-24" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                   <Target className="h-4 w-4 text-cyan" /> City Water Limit
                </h4>
                
                <div className="flex justify-center mb-6 relative">
                   <svg width="140" height="140" viewBox="0 0 100 100" className="-rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="var(--cyan)" strokeWidth="8" 
                         strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ctoPercentage) / 100}
                         strokeLinecap="round" className="drop-shadow-[0_0_10px_var(--cyan)]"
                         initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 251.2 - (251.2 * ctoPercentage) / 100 }} transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black font-display text-white">{freshWaterUsedToday} L</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Used Today</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">Daily Limit</span>
                      <span className="text-lg font-black text-white">{ctoLimit} L</span>
                   </div>
                   <div className="flex flex-col gap-1 p-3 rounded-xl bg-cyan/10 border border-cyan/20">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-cyan">Remaining</span>
                      <span className="text-lg font-black text-cyan">{ctoRemaining} L</span>
                   </div>
                </div>
             </div>

             {/* Fresh Water Usage Cards */}
             <div className="glass-strong rounded-[2rem] p-6 border border-glass-border">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                   <Droplets className="h-4 w-4 text-primary" /> Fresh Water Usage
                </h4>
                <div className="space-y-3">
                   <UsageRow label="Today" value={\`\${freshWaterUsedToday} L\`} highlight />
                   <UsageRow label="This Week" value={\`\${freshWaterUsedWeek} L\`} />
                   <UsageRow label="This Month" value={\`\${freshWaterUsedMonth} L\`} />
                </div>
             </div>
          </div>

          {/* Core Scene: Digital Twin (Center) */}
          <div className="xl:col-span-6 relative flex flex-col items-center justify-end h-[800px] w-full">
             
             {/* Ultrasonic Sensor & Dynamic Beam */}
             <div className="absolute top-0 flex flex-col items-center z-30 w-full max-w-sm">
                <div className="w-24 h-10 bg-zinc-900 rounded-b-xl border border-white/20 shadow-xl flex items-end justify-center pb-1.5 relative z-10">
                   <div className="w-12 h-3 bg-black rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] flex justify-around items-center px-2">
                      <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      <div className="w-1 h-1 rounded-full bg-cyan animate-pulse" style={{ animationDelay: '0.5s' }} />
                   </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-3 mb-4 bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">Ultrasonic Sensor Active</div>
                
                {/* Animated Waves measuring exact distance to water */}
                {/* Distance visual scales directly inversely to water level */}
                <div className="relative w-48 flex flex-col items-center transition-all duration-[2000ms] ease-out" style={{ height: \`\${Math.max(10, (100 - waterLevel) * 5.5)}px\` }}>
                   <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" className="opacity-80">
                      <motion.path d="M 20 10 Q 50 30 80 10" stroke="var(--cyan)" strokeWidth="3" fill="none" strokeLinecap="round" className="drop-shadow-[0_0_5px_var(--cyan)]"
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }} />
                      <motion.path d="M 10 20 Q 50 50 90 20" stroke="var(--cyan)" strokeWidth="3" fill="none" strokeLinecap="round" className="drop-shadow-[0_0_5px_var(--cyan)]"
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
                      <motion.path d="M 0 30 Q 50 70 100 30" stroke="var(--cyan)" strokeWidth="3" fill="none" strokeLinecap="round" className="drop-shadow-[0_0_5px_var(--cyan)]"
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }} />
                   </svg>
                   {/* Dotted Measurement Line */}
                   <div className="absolute top-0 bottom-0 border-l-[3px] border-dotted border-cyan/40" />
                   
                   <div className="absolute top-1/2 -translate-y-1/2 left-1/2 translate-x-6 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-black text-white whitespace-nowrap border border-white/20 shadow-2xl flex flex-col gap-1">
                      <span className="text-[8px] uppercase tracking-widest text-cyan">Distance</span>
                      {ultrasonicDistance.toFixed(1)} cm
                   </div>
                </div>
             </div>

             {/* The 3D Glass Tank */}
             <div className={\`relative w-full max-w-lg h-[600px] rounded-[4rem] glass border-[4px] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-1000 \${alertStatus === 'danger' ? 'border-danger/80 shadow-[0_0_80px_rgba(255,0,0,0.3)]' : alertStatus === 'warn' ? 'border-warn/60 shadow-[0_0_50px_rgba(255,180,0,0.2)]' : 'border-cyan/40 shadow-[0_0_50px_rgba(0,255,255,0.15)]'}\`}>
                
                {/* Background Depth & Glass Reflections */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/90" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
                <div className="absolute top-10 left-10 w-4 h-[80%] rounded-full bg-gradient-to-b from-white/20 to-transparent blur-md opacity-40 pointer-events-none" />

                {/* Actual Physical Water Layer */}
                <motion.div 
                   initial={{ height: 0 }} animate={{ height: \`\${waterLevel}%\` }}
                   className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-[2000ms] ease-out"
                   style={{ background: \`linear-gradient(to top, var(--\${alertStatus === 'danger' ? 'danger' : alertStatus === 'warn' ? 'warn' : 'cyan'}) 0%, color-mix(in oklab, var(--\${alertStatus === 'danger' ? 'danger' : alertStatus === 'warn' ? 'warn' : 'cyan'}) 30%, transparent) 100%)\` }}
                >
                   {/* Water Surface Highlights */}
                   <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/60 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] z-30" />
                   
                   {/* Layered Waves */}
                   <div className={\`absolute inset-0 opacity-50 mix-blend-overlay bg-[url('/waves.svg')] bg-repeat-x \${alertStatus === 'danger' ? 'animate-wave-fast' : 'animate-wave-slow'}\`} style={{ backgroundSize: '200% 100%' }} />
                   <div className={\`absolute inset-0 opacity-30 bg-[url('/waves.svg')] bg-repeat-x \${alertStatus === 'danger' ? 'animate-wave-fast' : 'animate-wave-slow'}\`} style={{ backgroundSize: '150% 100%', animationDirection: 'reverse' }} />

                   {/* Floating Bubbles inside water */}
                   <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute bottom-0 left-[15%] w-3 h-3 rounded-full bg-white/40 drop-shadow-md" animate={{ y: [-10, -800], opacity: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
                      <motion.div className="absolute bottom-0 left-[45%] w-5 h-5 rounded-full bg-white/20 drop-shadow-md" animate={{ y: [-10, -800], opacity: [0, 1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: 1.5 }} />
                      <motion.div className="absolute bottom-0 left-[75%] w-2 h-2 rounded-full bg-white/50 drop-shadow-md" animate={{ y: [-10, -800], opacity: [0, 1, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', delay: 0.5 }} />
                      <motion.div className="absolute bottom-0 left-[35%] w-4 h-4 rounded-full bg-white/30 drop-shadow-md" animate={{ y: [-10, -800], opacity: [0, 1, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear', delay: 2 }} />
                   </div>
                </motion.div>

                {/* Central Volume Readout Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40 drop-shadow-2xl">
                   <div className="text-xs font-black uppercase tracking-widest text-white/50 mb-3 bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md">Live Storage Volume</div>
                   <span className="text-8xl font-black font-display text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]">{liveVolumeLiters.toFixed(1)} L</span>
                   <span className="text-sm uppercase font-bold tracking-widest text-white mt-4 bg-black/60 px-6 py-2 rounded-full backdrop-blur-xl border border-white/20 shadow-2xl">{(10).toFixed(1)} L MAX CAPACITY</span>
                </div>
             </div>
          </div>

          {/* Right Panel: AI Forecast & Motor Intelligence */}
          <div className="xl:col-span-3 space-y-6 flex flex-col z-20">
             
             {/* AI Water Forecast Panel */}
             <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Brain className="w-24 h-24" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                   <Brain className="h-4 w-4 text-primary" /> AI Water Forecast
                </h4>
                
                <div className="space-y-4 relative z-10">
                   {isFilling ? (
                      <div className="p-5 rounded-2xl bg-warn/10 border border-warn/30 text-warn shadow-[0_0_20px_rgba(255,180,0,0.1)]">
                         <div className="flex items-center gap-2 mb-3">
                            <ArrowUpCircle className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Rising Trend</span>
                         </div>
                         <p className="text-sm font-bold leading-relaxed">Overflow is expected in approximately <span className="text-lg font-black">{estimatedMinsToOverflow} minutes</span>.</p>
                      </div>
                   ) : waterLevel > 20 ? (
                      <div className="p-5 rounded-2xl bg-eco/10 border border-eco/30 text-eco shadow-[0_0_20px_rgba(0,255,100,0.1)]">
                         <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Stable Trend</span>
                         </div>
                         <p className="text-sm font-bold leading-relaxed">Current storage is sufficient for another <span className="text-lg font-black">{estimatedMinsToEmpty} minutes</span>. Motor can safely remain OFF.</p>
                      </div>
                   ) : (
                      <div className="p-5 rounded-2xl bg-danger/10 border border-danger/30 text-danger shadow-[0_0_20px_rgba(255,0,0,0.1)] animate-pulse">
                         <div className="flex items-center gap-2 mb-3">
                            <ArrowDownCircle className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Critical Trend</span>
                         </div>
                         <p className="text-sm font-bold leading-relaxed">Water will become empty in approximately <span className="text-lg font-black">{estimatedMinsToEmpty} minutes</span>.</p>
                      </div>
                   )}
                   
                   <div className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-white/5 mt-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prediction Confidence</span>
                      <span className="text-lg font-black text-primary">96%</span>
                   </div>
                </div>
             </div>

             {/* Enhanced Motor Intelligence */}
             <div className={\`glass-strong rounded-[2rem] p-8 border border-glass-border transition-colors duration-500 relative overflow-hidden \${isCriticalEmpty ? 'border-danger shadow-[0_0_40px_rgba(255,0,0,0.2)] bg-danger/5' : ''}\`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                   <Cpu className="h-4 w-4 text-eco" /> Motor Control & Intelligence
                </h4>
                
                <div className="flex items-center justify-between mb-8">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</span>
                      <span className={\`text-2xl font-black tracking-tight \${isFilling ? 'text-eco drop-shadow-[0_0_10px_var(--eco)]' : 'text-white'}\`}>
                         {isFilling ? 'RUNNING' : 'STANDBY'}
                      </span>
                   </div>
                   
                   {/* Advanced Motor & Pipe UI */}
                   <div className="flex items-center gap-0">
                      {/* Pipeline connecting to the left */}
                      <div className="relative w-16 h-8 flex items-center">
                         <div className="w-full h-3 bg-black/40 border-y border-white/10" />
                         {isFilling && (
                            <div className="absolute inset-0 overflow-hidden flex items-center">
                               <motion.div 
                                  className="w-[200%] h-1.5 bg-gradient-to-l from-transparent via-cyan to-transparent drop-shadow-[0_0_8px_var(--cyan)]"
                                  initial={{ x: '0%' }} animate={{ x: '-50%' }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                               />
                            </div>
                         )}
                      </div>
                      
                      {/* Rotating Motor Core */}
                      <div className={\`h-16 w-16 rounded-full border-[3px] flex items-center justify-center bg-black/80 shadow-xl z-10 transition-colors duration-500 \${isFilling ? 'border-cyan shadow-[0_0_20px_var(--cyan)]' : 'border-white/10'}\`}>
                         <Settings className={\`h-8 w-8 \${isFilling ? 'animate-spin text-cyan drop-shadow-[0_0_8px_var(--cyan)]' : 'text-white/20'}\`} style={{ animationDuration: '2s' }} />
                      </div>
                   </div>
                </div>
                
                <div className="space-y-3 relative z-10">
                   <UsageRow label="Running Duration" value="04h 12m" />
                   <UsageRow label="Today's Runtime" value="07h 45m" />
                   <UsageRow label="Motor Start Count" value="12 Cycles" />
                   <UsageRow label="Last ON Time" value="10:15 AM" />
                   <UsageRow label="Last OFF Time" value="12:30 PM" />
                </div>
                
                {isCriticalEmpty && (
                   <div className="absolute inset-0 border-[4px] border-danger rounded-[2rem] animate-ping opacity-20 pointer-events-none" />
                )}
             </div>
          </div>
       </div>

      {/* Smart Event Timeline */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border overflow-hidden relative max-w-[90vw] mx-auto mt-6">
         <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
         <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
         
         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2 relative z-20">
            <Clock className="h-4 w-4 text-primary" /> Smart Event Timeline
         </h4>
         
         <div className="flex items-center justify-between overflow-x-auto pb-4 hide-scrollbar relative z-0 w-full px-8">
            <TimelineEvent time="08:00 AM" title="Motor Started" active />
            <TimelineDivider />
            <TimelineEvent time="08:15 AM" title="Tank Filling" active />
            <TimelineDivider />
            <TimelineEvent time="09:30 AM" title="Tank Reached 80%" active={waterLevel >= 80} />
            <TimelineDivider />
            <TimelineEvent time="10:45 AM" title="AI Predicted Overflow" active={isOverflowRisk} warn />
            <TimelineDivider />
            <TimelineEvent time="11:00 AM" title="Motor Stopped" active={!isFilling} />
            <TimelineDivider />
            <TimelineEvent time="11:15 AM" title="Storage Stable" active={!isFilling && waterLevel > 20} eco />
         </div>
      </div>

    </div>
  );
}

function UsageRow({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/5">
       <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
       <span className={\`text-sm font-black \${highlight ? 'text-primary drop-shadow-md text-base' : 'text-white'}\`}>{value}</span>
    </div>
  );
}

function TimelineEvent({ time, title, active, warn, eco }: any) {
  return (
    <div className={\`flex flex-col gap-2 min-w-[130px] transition-opacity duration-500 \${active ? 'opacity-100' : 'opacity-30'}\`}>
       <div className="text-[9px] font-bold text-muted-foreground">{time}</div>
       <div className={\`p-3 rounded-xl border text-xs font-black shadow-lg \${active ? (warn ? 'bg-danger/10 border-danger/30 text-danger' : eco ? 'bg-eco/10 border-eco/30 text-eco' : 'bg-primary/10 border-primary/30 text-primary') : 'bg-black/20 border-white/10 text-white/50'}\`}>
          {title}
       </div>
    </div>
  );
}

function TimelineDivider() {
  return (
    <div className="shrink-0 text-muted-foreground/30 px-2">
       <ArrowRight className="h-4 w-4" />
    </div>
  );
}
`;

const newFileContent = content.substring(0, startIdx) + newSections + content.substring(endIdx);
fs.writeFileSync(file, newFileContent);
console.log("Successfully generated Advanced Cinematic Storage Intelligence");
