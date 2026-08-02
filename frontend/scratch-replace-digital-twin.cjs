const fs = require('fs');
const file = 'src/components/DigitalTwin.tsx';

const content = `import { motion } from "framer-motion";
import { Database, Factory, Activity, Recycle, Droplets } from "lucide-react";

export function DigitalTwin({ data, activeStage = 1 }: { data: any, activeStage?: number }) {
  // activeStage: 1=Storage(Fresh), 2=Reuse, 3=Recycle
  
  const freshLevel = data?.waterLevel ?? 80;
  const industryLevel = 45; 
  const recycleLevel = 60;
  const reuseLevel = 30;

  return (
    <div className="glass-strong rounded-[2.5rem] p-4 relative overflow-hidden border border-glass-border h-full flex flex-col shadow-2xl min-h-[600px] w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 water-grid opacity-[0.05] pointer-events-none" />
      
      <div className="relative z-10 w-full h-full min-h-[600px]">
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 1000 750" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-particle">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Base Pipes (Inactive) */}
            <path d="M 280 250 L 420 250" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 720 250 L 580 250" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 500 380 L 500 520" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 580 620 L 800 620 L 800 380" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Active Droplet Flows */}
            {/* Storage -> Industry */}
            <ParticleFlow path="M 280 250 L 420 250" active={activeStage === 1} color="cyan" />
            
            {/* Reuse -> Industry */}
            <ParticleFlow path="M 720 250 L 580 250" active={activeStage === 2} color="eco" />
            
            {/* Industry -> Recycle */}
            <ParticleFlow path="M 500 380 L 500 520" active={activeStage === 3} color="warn" />

            {/* Recycle -> Reuse */}
            <ParticleFlow path="M 580 620 L 800 620 L 800 380" active={activeStage === 3} color="primary" />
         </svg>

         {/* Absolute Positioning for Tanks in a 1000x750 coordinate system */}
         <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Container for absolute scaling */}
            <div className="relative w-full h-full" style={{ maxWidth: '1000px', maxHeight: '750px', margin: '0 auto' }}>
               
               {/* Storage Tank (Left) */}
               <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={{ left: '20%', top: '33.3%' }}>
                  <TwinTank name="Storage Tank" capacity="1000L" fill={freshLevel} active={activeStage === 1} color="cyan" icon={Database} />
               </div>

               {/* Industry Tank (Center) */}
               <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '33.3%' }}>
                  <TwinTank 
                     name="Industry Tank" capacity="800L" fill={industryLevel} 
                     active={activeStage === 1 || activeStage === 2} color="cyan" icon={Factory} 
                     receiving={activeStage === 1 || activeStage === 2}
                  />
                  {(activeStage === 1 || activeStage === 2) && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-cyan font-black text-[10px] uppercase tracking-widest bg-cyan/10 px-3 py-1 rounded-full border border-cyan/20">
                        Receiving Water
                     </motion.div>
                  )}
               </div>

               {/* Reuse Tank (Right) */}
               <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={{ left: '80%', top: '33.3%' }}>
                  <TwinTank name="Reuse Tank" capacity="500L" fill={reuseLevel} active={activeStage === 2} color="eco" icon={Droplets} />
                  {activeStage === 2 && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-eco font-black text-[10px] uppercase tracking-widest bg-eco/10 px-3 py-1 rounded-full border border-eco/20 flex items-center gap-1">
                        <Recycle className="h-3 w-3" /> Reused Water Supply Active
                     </motion.div>
                  )}
               </div>

               {/* Recycle Tank (Bottom Center) */}
               <div className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2" style={{ left: '50%', top: '82.6%' }}>
                  <TwinTank name="Recycle Tank" capacity="500L" fill={recycleLevel} active={activeStage === 3} color="warn" icon={Activity} />
                  {activeStage === 3 && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-warn font-black text-[10px] uppercase tracking-widest bg-warn/10 px-3 py-1 rounded-full border border-warn/20 flex items-center gap-1.5">
                        <Recycle className="h-3 w-3 animate-spin-slow" /> Recycling in Progress
                     </motion.div>
                  )}
               </div>

            </div>
         </div>
      </div>
    </div>
  );
}

function ParticleFlow({ path, active, color = "cyan" }: any) {
  if (!active) return null;
  return (
    <>
      <motion.path
        d={path}
        stroke={\`var(--\${\color})\`}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ strokeDasharray: "2, 24", strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -52 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ filter: "url(#glow-particle)" }}
        className="opacity-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      />
      <motion.path
        d={path}
        stroke={\`var(--\${\color})\`}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ strokeDasharray: "2, 24", strokeDashoffset: 0 }}
        animate={{ strokeDashoffset: -52 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="opacity-100 mix-blend-screen"
      />
    </>
  );
}

function TwinTank({ name, capacity, fill, active, color, icon: Ic, receiving }: any) {
  return (
    <div className="flex flex-col items-center gap-4 relative z-20 group">
      <div className={\`relative h-44 w-28 md:h-52 md:w-32 rounded-[2rem] glass border \${active || receiving ? \`border-\${color}/60 shadow-[0_0_40px_var(--\${color})]\` : 'border-glass-border'} flex flex-col items-center justify-center transition-all duration-500\`}>
        <div className={\`absolute -inset-4 rounded-[3rem] opacity-0 \${active || receiving ? 'opacity-30' : 'group-hover:opacity-10'} transition-opacity blur-2xl\`} style={{ background: \`var(--\${color})\` }} />
        
        {active && !receiving && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_15px_rgba(0,0,0,0.5)] z-30 animate-pulse" style={{ background: \`color-mix(in oklab, var(--\${color}) 20%, transparent)\`, borderColor: \`color-mix(in oklab, var(--\${color}) 40%, transparent)\`, color: \`var(--\${color})\` }}>
             Active
          </div>
        )}

        <div className="absolute inset-3 rounded-2xl bg-black/60 overflow-hidden border border-white/10 flex flex-col justify-end">
           <motion.div 
             initial={{ height: 0 }}
             animate={{ height: \`\${fill}%\` }}
             className="w-full relative transition-all duration-1000"
             style={{ background: \`linear-gradient(to top, var(--\${color}) 0%, color-mix(in oklab, var(--\${color}) 20%, transparent) 100%)\` }}
           >
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
              <div className="absolute inset-0 bg-[url('/waves.svg')] opacity-30 bg-repeat-x animate-wave-fast" />
              {(active || receiving) && (
                 <div className="absolute inset-0 bg-[url('/waves.svg')] opacity-20 bg-repeat-x animate-wave-slow mix-blend-overlay" />
              )}
           </motion.div>
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 drop-shadow-lg">
           <Ic className={\`h-8 w-8 mb-2 \${active || receiving ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/30'}\`} />
           <div className={\`text-2xl font-black font-display tracking-tighter \${active || receiving ? 'text-white' : 'text-white/50'}\`}>
              {Math.round(fill)}%
           </div>
        </div>
      </div>
      <div className="text-center drop-shadow-md">
        <div className={\`text-xs uppercase font-black tracking-widest \${active || receiving ? 'text-foreground' : 'text-muted-foreground'} transition-colors\`}>{name}</div>
        <div className="text-[10px] text-muted-foreground font-bold mt-1 tracking-widest">{capacity} Cap</div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(file, content);
console.log("Successfully rewrote DigitalTwin.tsx");
