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
  const waterLevel = data?.waterLevel ?? 80;
  const flowRate = data?.flowRate ?? 0;
  const isFilling = flowRate > 0;
  
  const estimatedMinsToOverflow = flowRate > 0 ? Math.round((100 - waterLevel) / (flowRate || 1) * 2) : 0;
  const estimatedMinsToEmpty = (!isFilling && flowRate === 0) ? Math.round(waterLevel * 1.5) : 0; 
  
  const alertStatus = waterLevel > 90 ? 'danger' : waterLevel < 20 ? 'warn' : 'eco';
  
  // Future AI prediction level (e.g. 15 mins ahead).
  let predictedLevel = waterLevel;
  if (isFilling) predictedLevel = Math.min(100, waterLevel + (flowRate * 15 * 0.5));
  else if (waterLevel > 0) predictedLevel = Math.max(0, waterLevel - 15 * 0.5);

  return (
    <div className="space-y-8 pb-20 relative min-h-screen">
       {/* Ambient Background Glow based on state */}
       <div className={\`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10 pointer-events-none transition-colors duration-1000 \${alertStatus === 'danger' ? 'bg-danger' : alertStatus === 'warn' ? 'bg-warn' : 'bg-cyan'}\`} />

       {/* Top Smart Alarm */}
       <AnimatePresence>
         {alertStatus !== 'eco' && (
            <motion.div 
               initial={{ opacity: 0, y: -20, scale: 0.95 }} 
               animate={{ opacity: 1, y: 0, scale: 1 }} 
               exit={{ opacity: 0, y: -20, scale: 0.95 }}
               className={\`absolute top-0 left-8 z-50 glass-strong rounded-full px-8 py-4 border flex items-center gap-6 shadow-2xl backdrop-blur-xl \${alertStatus === 'danger' ? 'border-danger/50 bg-danger/10 shadow-[0_0_50px_rgba(255,0,0,0.3)]' : 'border-warn/50 bg-warn/10'}\`}
            >
               <div className={\`relative flex items-center justify-center \${alertStatus === 'danger' ? 'animate-bounce' : ''}\`}>
                  <BellRing className={\`h-8 w-8 \${alertStatus === 'danger' ? 'text-danger drop-shadow-[0_0_10px_rgba(255,0,0,1)]' : 'text-warn'}\`} style={alertStatus === 'danger' ? { color: 'var(--danger)' } : { color: 'var(--warn)' }} />
                  {/* Sound waves */}
                  {alertStatus === 'danger' && (
                     <>
                        <div className="absolute inset-0 rounded-full border-2 border-danger animate-ping opacity-50" style={{ animationDuration: '1s', borderColor: 'var(--danger)' }} />
                        <div className="absolute inset-[-10px] rounded-full border-2 border-danger animate-ping opacity-30" style={{ animationDuration: '1.5s', borderColor: 'var(--danger)' }} />
                     </>
                  )}
               </div>
               <div className="flex flex-col">
                  <span className={\`text-xl font-black uppercase tracking-widest \${alertStatus === 'danger' ? 'text-danger drop-shadow-md' : 'text-warn'}\`} style={alertStatus === 'danger' ? { color: 'var(--danger)' } : { color: 'var(--warn)' }}>
                     {alertStatus === 'danger' ? 'Overflow Risk Predicted' : 'Low Water Predicted'}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                     <span className={\`h-2 w-2 rounded-full \${alertStatus === 'danger' ? 'bg-danger animate-pulse' : 'bg-warn'}\`} style={alertStatus === 'danger' ? { background: 'var(--danger)' } : { background: 'var(--warn)' }} />
                     Buzzer Active • Ultrasonic Triggered
                  </span>
               </div>
            </motion.div>
         )}
       </AnimatePresence>

       {/* Cinematic Centerpiece */}
       <div className="w-full min-h-[750px] relative flex items-center justify-center mt-10">
          
          {/* Smart Prediction Widgets (Floating Left) */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
             <PredictionWidget icon={Timer} label="Overflow Countdown" value={isFilling ? \`⏳ \${estimatedMinsToOverflow} min\` : 'N/A'} active={isFilling} color="danger" />
             <PredictionWidget icon={Timer} label="Low Water Countdown" value={!isFilling ? \`⏳ \${estimatedMinsToEmpty} min\` : 'N/A'} active={!isFilling} color="warn" />
             <PredictionWidget icon={CheckCircle2} label="Water Stable" value="✓" active={!isFilling && waterLevel >= 50} color="eco" />
             <PredictionWidget icon={Brain} label="Prediction Confidence" value="96%" active={true} color="primary" />
          </div>

          {/* Motor Visualization (Right) */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-0 z-20">
             <div className="flex flex-col items-center gap-4 bg-black/40 p-6 rounded-[2rem] border border-glass-border backdrop-blur-md shadow-2xl relative">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Intake Motor</div>
                <div className={\`h-24 w-24 rounded-full border-4 flex items-center justify-center bg-black transition-colors duration-500 \${isFilling ? 'shadow-[0_0_30px_rgba(0,255,255,0.3)]' : 'border-glass-border'}\`} style={isFilling ? { borderColor: 'var(--cyan)' } : {}}>
                   <Settings className={\`h-12 w-12 \${isFilling ? 'animate-spin drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white/20'}\`} style={{ animationDuration: '3s', color: isFilling ? 'var(--cyan)' : undefined }} />
                </div>
                <div className="w-full space-y-2 mt-4 text-center">
                   <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Running Time</div>
                   <div className="text-lg font-black text-white">04h 12m</div>
                   <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Cycles</div>
                   <div className="text-sm font-black text-white">42</div>
                </div>
             </div>
             
             {/* Glowing Pipe from Motor to Tank */}
             <div className="relative w-32 h-16 flex items-center">
                <div className="w-full h-4 bg-white/5 border-y border-white/10" />
                {isFilling && (
                   <div className="absolute inset-0 overflow-hidden flex items-center">
                      <motion.div 
                         className="w-[200%] h-2 bg-gradient-to-r from-transparent via-cyan to-transparent drop-shadow-[0_0_8px_var(--cyan)]"
                         initial={{ x: '-50%' }} animate={{ x: '0%' }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                   </div>
                )}
             </div>
          </div>

          {/* Core Scene: Sensor + Tank */}
          <div className="relative flex flex-col items-center h-[700px] justify-end w-[400px]">
             
             {/* Ultrasonic Sensor & Beam */}
             <div className="absolute top-0 flex flex-col items-center z-30">
                <div className="w-16 h-8 bg-zinc-900 rounded-b-xl border border-white/20 shadow-xl flex items-end justify-center pb-1 relative z-10">
                   <div className="w-8 h-2 bg-black rounded-full" />
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2 mb-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">Ultrasonic Sensor</div>
                
                {/* Animated Waves measuring distance */}
                <div className="relative w-32 flex flex-col items-center opacity-70 transition-all duration-[2000ms] ease-out" style={{ height: \`\${(100 - waterLevel) * 4}px\` }}>
                   <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <motion.path d="M 30 10 Q 50 30 70 10" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" 
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} />
                      <motion.path d="M 20 20 Q 50 50 80 20" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" strokeLinecap="round" 
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
                      <motion.path d="M 10 30 Q 50 70 90 30" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" strokeLinecap="round" 
                         initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: 80 }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} />
                   </svg>
                   {/* Measurement Line */}
                   <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/20" />
                   <div className="absolute top-1/2 -translate-y-1/2 left-1/2 translate-x-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white whitespace-nowrap border border-white/10 shadow-xl">
                      {Math.round(100 - waterLevel)} cm
                   </div>
                </div>
             </div>

             {/* The 3D Glass Tank */}
             <div className={\`relative w-full h-[500px] rounded-[3rem] glass border-[3px] shadow-2xl overflow-hidden transition-colors duration-1000 \${alertStatus === 'danger' ? 'border-danger/80 shadow-[0_0_50px_rgba(255,0,0,0.3)]' : alertStatus === 'warn' ? 'border-warn/60 shadow-[0_0_40px_rgba(255,180,0,0.2)]' : 'border-cyan/40 shadow-[0_0_40px_rgba(0,255,255,0.15)]'}\`}>
                
                {/* Background Depth */}
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />

                {/* AI Predictive Hologram Layer (Behind actual water if higher, or in front if lower. Let's just stack it absolutely) */}
                <motion.div 
                   initial={{ height: 0 }} animate={{ height: \`\${predictedLevel}%\` }}
                   className="absolute bottom-0 left-0 right-0 z-10 transition-all duration-1000"
                   style={{ background: 'linear-gradient(to top, rgba(0, 255, 100, 0.1) 0%, rgba(0, 255, 100, 0.2) 100%)' }}
                >
                   {/* Sci-Fi Grid Pattern */}
                   <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(0,255,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                   <div className="absolute top-0 inset-x-0 border-t-2 border-dashed border-eco drop-shadow-[0_0_8px_rgba(0,255,100,1)]" />
                   
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-eco/20 border border-eco/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-eco backdrop-blur-md whitespace-nowrap shadow-[0_0_15px_rgba(0,255,100,0.3)] flex items-center gap-1.5">
                      <Brain className="h-3 w-3" /> Predicted ({Math.round(predictedLevel)}%)
                   </div>
                </motion.div>

                {/* Actual Physical Water Layer */}
                <motion.div 
                   initial={{ height: 0 }} animate={{ height: \`\${waterLevel}%\` }}
                   className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-[2000ms] ease-out"
                   style={{ background: \`linear-gradient(to top, var(--\${alertStatus === 'danger' ? 'danger' : alertStatus === 'warn' ? 'warn' : 'cyan'}) 0%, color-mix(in oklab, var(--\${alertStatus === 'danger' ? 'danger' : alertStatus === 'warn' ? 'warn' : 'cyan'}) 20%, transparent) 100%)\` }}
                >
                   {/* Water Surface Surface */}
                   <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] z-30" />
                   
                   {/* Waves */}
                   <div className={\`absolute top-0 left-0 right-0 bottom-0 opacity-40 mix-blend-overlay bg-[url('/waves.svg')] bg-repeat-x \${alertStatus === 'danger' ? 'animate-wave-fast' : 'animate-wave-slow'}\`} />
                   <div className={\`absolute top-0 left-0 right-0 bottom-0 opacity-20 bg-[url('/waves.svg')] bg-repeat-x \${alertStatus === 'danger' ? 'animate-wave-fast' : 'animate-wave-slow'}\`} style={{ animationDirection: 'reverse' }} />

                   {/* Bubbles */}
                   <div className="absolute inset-0 overflow-hidden">
                      <motion.div className="absolute bottom-0 left-[20%] w-2 h-2 rounded-full bg-white/30" animate={{ y: [-10, -500], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                      <motion.div className="absolute bottom-0 left-[50%] w-3 h-3 rounded-full bg-white/20" animate={{ y: [-10, -500], opacity: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1 }} />
                      <motion.div className="absolute bottom-0 left-[80%] w-1.5 h-1.5 rounded-full bg-white/40" animate={{ y: [-10, -500], opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 2 }} />
                   </div>
                </motion.div>

                {/* Central Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-2xl z-40">
                   <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Ultrasonic Derived Volume</div>
                   <span className={\`text-7xl font-black font-display text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]\`}>{Math.round(waterLevel * 10)} L</span>
                   <span className="text-xs uppercase font-bold tracking-widest text-white/70 mt-2 bg-black/40 px-4 py-1 rounded-full backdrop-blur-md border border-white/10">{Math.round(waterLevel)}% Full</span>
                </div>
             </div>
          </div>
       </div>

      {/* Bottom Timeline */}
      <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border overflow-hidden relative max-w-5xl mx-auto mt-12">
         <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
         <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
         
         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2 relative z-20">
            <Clock className="h-4 w-4" /> Storage Event Timeline
         </h4>
         
         <div className="flex items-center justify-between overflow-x-auto pb-4 hide-scrollbar relative z-0 w-full px-8">
            <TimelineEvent time="08:00 AM" title="Motor Started" active />
            <TimelineDivider />
            <TimelineEvent time="08:15 AM" title="Tank Filling" active />
            <TimelineDivider />
            <TimelineEvent time="09:30 AM" title="80% Reached" active={waterLevel >= 80} />
            <TimelineDivider />
            <TimelineEvent time="10:45 AM" title="Overflow Prediction" active={waterLevel > 90} warn />
            <TimelineDivider />
            <TimelineEvent time="11:00 AM" title="Motor Stopped" active={!isFilling} />
         </div>
      </div>

    </div>
  );
}

function PredictionWidget({ icon: Ic, label, value, active, color }: any) {
  return (
    <div className={\`flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border transition-all duration-500 w-64 \${active ? \`shadow-[0_0_20px_var(--\${color})]\` : 'border-glass-border opacity-50'}\`} style={active ? { borderColor: \`color-mix(in oklab, var(--\${color}) 50%, transparent)\` } : {}}>
       <div className={\`h-10 w-10 shrink-0 rounded-full flex items-center justify-center\`} style={{ background: \`color-mix(in oklab, var(--\${color}) 10%, transparent)\` }}>
          <Ic className={\`h-5 w-5\`} style={{ color: \`var(--\${color})\` }} />
       </div>
       <div className="flex flex-col">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className={\`text-sm font-black text-white \${active ? 'animate-pulse' : ''}\`}>{value}</div>
       </div>
    </div>
  );
}

function TimelineEvent({ time, title, active, warn }: any) {
  return (
    <div className={\`flex flex-col gap-2 min-w-[120px] transition-opacity duration-500 \${active ? 'opacity-100' : 'opacity-30'}\`}>
       <div className="text-[9px] font-bold text-muted-foreground">{time}</div>
       <div className={\`p-3 rounded-xl border text-xs font-black \${active ? (warn ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-primary/10 border-primary/30 text-primary') : 'bg-white/5 border-white/10 text-muted-foreground'}\`}>
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
console.log("Successfully rewrote StorageIntelligence cinematically");
