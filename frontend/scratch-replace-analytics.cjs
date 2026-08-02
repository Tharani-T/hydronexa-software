const fs = require('fs');
const file = 'src/routes/industry.dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'function Analytics({ data }: { data: SensorData | null; history: SensorData[] }) {';
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
  
  // Predict conditions
  const estimatedMinsToOverflow = flowRate > 0 ? Math.round((100 - waterLevel) / (flowRate || 1) * 2) : 0;
  const estimatedMinsToEmpty = (!isFilling && flowRate === 0) ? Math.round(waterLevel * 1.5) : 0; // Mock depletion rate
  
  const alertStatus = waterLevel > 90 ? 'danger' : waterLevel < 20 ? 'warn' : 'eco';
  const alertText = waterLevel > 90 ? 'Overflow Risk' : waterLevel < 20 ? 'Water Level Low' : 'Normal';

  return (
    <div className="space-y-8 pb-20">
      
      {/* Smart Alert System */}
      <AnimatePresence>
         {alertStatus !== 'eco' && (
            <motion.div 
               initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
               className={\`glass-strong rounded-3xl p-6 border flex items-center justify-between \${alertStatus === 'danger' ? 'border-danger bg-danger/10 shadow-[0_0_30px_rgba(255,0,0,0.2)]' : 'border-warn bg-warn/10'}\`}
            >
               <div className="flex items-center gap-4">
                  <div className={\`h-12 w-12 rounded-full flex items-center justify-center animate-pulse \${alertStatus === 'danger' ? 'bg-danger text-white' : 'bg-warn text-white'}\`}>
                     <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                     <h4 className={\`text-lg font-black tracking-tight \${alertStatus === 'danger' ? 'text-danger' : 'text-warn'}\`}>{alertText} Detected</h4>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Ultrasonic Sensor Warning</p>
                  </div>
               </div>
               {alertStatus === 'danger' && (
                  <div className="flex items-center gap-2 bg-danger text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                     <Volume2 className="h-4 w-4" /> Buzzer Activated
                  </div>
               )}
            </motion.div>
         )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Left Column: Ultrasonic & Utilization */}
         <div className="space-y-8">
            <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border relative overflow-hidden group">
               <div className="absolute top-0 left-0 h-32 w-32 bg-cyan/10 rounded-full blur-3xl" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Ultrasonic Sensor Intelligence
               </h4>
               <div className="space-y-4">
                  <IntelligenceRow label="Ultrasonic Distance" value={\`\${(100 - waterLevel).toFixed(1)} cm\`} />
                  <IntelligenceRow label="Current Water Height" value={\`\${waterLevel.toFixed(1)} cm\`} />
                  <IntelligenceRow label="Tank Fill Percentage" value={\`\${Math.round(waterLevel)} %\`} highlight />
                  <IntelligenceRow label="Estimated Water Volume" value={\`\${(waterLevel * 10).toFixed(0)} L\`} />
                  <IntelligenceRow label="Remaining Capacity" value={\`\${(1000 - (waterLevel * 10)).toFixed(0)} L\`} />
               </div>
            </div>

            <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Waves className="h-4 w-4" /> Water Utilization
               </h4>
               <div className="grid grid-cols-2 gap-4">
                  <UtilBox label="Water Added Today" value="3,250 L" color="cyan" />
                  <UtilBox label="Water Supplied" value="2,800 L" color="primary" />
                  <UtilBox label="Current Flow Rate" value={\`\${flowRate.toFixed(1)} L/m\`} color="eco" />
                  <UtilBox label="Est. Operating Time" value="14 hrs" color="foreground" />
               </div>
            </div>
         </div>

         {/* Center Column: Massive 3D Digital Storage Tank */}
         <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border relative overflow-hidden flex flex-col items-center justify-center min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-t from-cyan/5 to-transparent pointer-events-none" />
            
            <h4 className="absolute top-8 left-8 text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Database className="h-4 w-4" /> Storage Tank
            </h4>
            
            {/* Live Water Animation INLET */}
            {isFilling && (
               <div className="absolute top-16 right-[35%] flex flex-col items-center">
                  <div className="text-[9px] font-black text-cyan uppercase tracking-widest mb-2 animate-pulse">Filling</div>
                  <svg width="20" height="80">
                     <motion.path 
                        d="M 10 0 L 10 80" stroke="var(--cyan)" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 16"
                        initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -40 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                        className="drop-shadow-[0_0_10px_var(--cyan)]"
                     />
                  </svg>
               </div>
            )}

            {/* Main 3D Tank */}
            <div className="relative w-48 h-80 rounded-[3rem] glass border-2 border-glass-border shadow-2xl mt-10 overflow-hidden flex flex-col justify-end group transition-all duration-700 hover:border-cyan/50 hover:shadow-[0_0_50px_rgba(0,255,255,0.1)]">
               <div className="absolute inset-0 bg-black/40" />
               
               {/* Water Fill */}
               <motion.div 
                  initial={{ height: 0 }} animate={{ height: \`\${waterLevel}%\` }}
                  className="w-full relative transition-all duration-[2000ms] ease-out"
                  style={{ background: 'linear-gradient(to top, var(--cyan) 0%, color-mix(in oklab, var(--cyan) 30%, transparent) 100%)' }}
               >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 z-20" />
                  <div className="absolute inset-0 bg-[url('/waves.svg')] opacity-40 bg-repeat-x animate-wave-fast mix-blend-overlay" />
                  <div className="absolute inset-0 bg-[url('/waves.svg')] opacity-20 bg-repeat-x animate-wave-slow" />
               </motion.div>

               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-xl z-30">
                  <span className="text-5xl font-black font-display text-white">{Math.round(waterLevel)}%</span>
                  <span className="text-xs uppercase font-bold tracking-widest text-white/70">{(waterLevel * 10).toFixed(0)} L</span>
               </div>
            </div>

            {/* Live Water Animation OUTLET */}
            {!isFilling && waterLevel > 0 && (
               <div className="absolute bottom-12 right-[40%] flex flex-col items-center">
                  <svg width="80" height="20">
                     <motion.path 
                        d="M 0 10 L 80 10" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 16"
                        initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -40 }} transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                        className="drop-shadow-[0_0_10px_var(--primary)]"
                     />
                  </svg>
                  <div className="text-[9px] font-black text-primary uppercase tracking-widest mt-2 animate-pulse">Supplying Water</div>
               </div>
            )}
         </div>

         {/* Right Column: AI & Motor Intelligence */}
         <div className="space-y-8">
            <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Brain className="h-4 w-4" /> AI Storage Intelligence
               </h4>
               <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-start gap-3">
                     <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                     <p className="text-xs font-bold leading-relaxed">
                        {isFilling ? "Tank is filling normally." : waterLevel > 10 ? "Tank usage is normal. Supplying steady water." : "Water level is critically low."}
                     </p>
                  </div>
                  {isFilling && waterLevel > 50 && (
                     <div className="p-4 rounded-2xl bg-warn/10 border border-warn/20 text-warn flex items-start gap-3">
                        <Timer className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-relaxed">
                           Overflow predicted in approximately {estimatedMinsToOverflow} minutes based on current flow rate.
                        </p>
                     </div>
                  )}
                  {!isFilling && waterLevel < 50 && waterLevel > 0 && (
                     <div className="p-4 rounded-2xl bg-warn/10 border border-warn/20 text-warn flex items-start gap-3">
                        <Timer className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-relaxed">
                           Low Water expected in approximately {estimatedMinsToEmpty} minutes.
                        </p>
                     </div>
                  )}
                  {!isFilling && waterLevel >= 50 && (
                     <div className="p-4 rounded-2xl bg-eco/10 border border-eco/20 text-eco flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-relaxed">
                           Water level is stable. Sufficient reserves available for production.
                        </p>
                     </div>
                  )}
               </div>
            </div>

            <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Motor Intelligence
               </h4>
               <div className="flex items-center gap-4 mb-6">
                  <div className={\`h-12 w-12 rounded-2xl flex items-center justify-center \${isFilling ? 'bg-eco/20 text-eco animate-pulse' : 'bg-white/5 text-muted-foreground'}\`}>
                     <Factory className="h-5 w-5" />
                  </div>
                  <div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motor Status</div>
                     <div className={\`text-lg font-black tracking-tight \${isFilling ? 'text-eco' : 'text-foreground'}\`}>{isFilling ? 'Running' : 'Standby'}</div>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                     <span className="text-muted-foreground">Running Time Today</span>
                     <span>04h 12m</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                     <span className="text-muted-foreground">Total Operating Duration</span>
                     <span>1,240 hrs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                     <span className="text-muted-foreground">Motor Cycle Count</span>
                     <span>42 Cycles</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Bottom Timeline */}
      <div className="glass-strong rounded-[2.5rem] p-8 border border-glass-border overflow-hidden relative">
         <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
         <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
         
         <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2 relative z-20">
            <Clock className="h-4 w-4" /> Storage Event Timeline
         </h4>
         
         <div className="flex items-center gap-4 overflow-x-auto pb-4 hide-scrollbar relative z-0">
            <TimelineEvent time="08:00 AM" title="Motor Started" active />
            <TimelineDivider />
            <TimelineEvent time="08:15 AM" title="Tank Filling" active />
            <TimelineDivider />
            <TimelineEvent time="09:30 AM" title="80% Reached" active={waterLevel >= 80} />
            <TimelineDivider />
            <TimelineEvent time="10:45 AM" title="Overflow Warning" active={waterLevel > 90} warn />
            <TimelineDivider />
            <TimelineEvent time="11:00 AM" title="Motor Stopped" active={!isFilling} />
         </div>
      </div>
    </div>
  );
}

function IntelligenceRow({ label, value, highlight }: any) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
       <span className={\`text-sm font-black \${highlight ? 'text-cyan text-base drop-shadow-md' : 'text-foreground'}\`}>{value}</span>
    </div>
  );
}

function UtilBox({ label, value, color }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
       <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
       <div className={\`text-lg font-black font-display text-\${color}\`} style={{ color: \`var(--\${color})\` }}>{value}</div>
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
console.log("Successfully replaced Analytics with StorageIntelligence");
