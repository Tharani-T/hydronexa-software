const fs = require('fs');

const file = 'frontend/src/components/industry/dashboard/Overview.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const logicStart = lines.findIndex(l => l.includes('const shifts = ['));
if (logicStart !== -1) {
  const logic = `
  let overallStatus: 'SAFE' | 'WARNING' | 'DANGER' = 'SAFE';
  if (ctoPct >= 100 || monthlyCtoPct >= 100 || ((data?.ph ?? 7) < a.phMin || (data?.ph ?? 7) > a.phMax)) {
    overallStatus = 'DANGER';
  } else if (ctoPct >= 80 || monthlyCtoPct >= 80 || reuseActual < a.reuseTarget) {
    overallStatus = 'WARNING';
  }
`;
  lines.splice(logicStart, 0, logic);
}

const start = lines.findIndex(l => l.includes('<AnimatePresence>'));
const end = lines.findIndex(l => l.includes('</AnimatePresence>'));
if (start !== -1 && end !== -1 && end > start) {
  const banner = `
      {/* OVERALL STATUS BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={\`glass-strong rounded-3xl p-8 border-2 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden \${
          overallStatus === 'DANGER' ? 'border-danger bg-danger/10 shadow-[0_0_40px_rgba(255,0,0,0.2)]' :
          overallStatus === 'WARNING' ? 'border-warn bg-warn/10 shadow-[0_0_40px_rgba(255,170,0,0.15)]' :
          'border-eco bg-eco/10 shadow-[0_0_40px_rgba(0,255,100,0.1)]'
        }\`}
      >
        <div className={\`absolute inset-0 opacity-5 animate-pulse \${
          overallStatus === 'DANGER' ? 'bg-danger' : overallStatus === 'WARNING' ? 'bg-warn' : 'bg-eco'
        }\`} />
        <div className="relative z-10 flex items-center gap-8 w-full">
           <div className={\`h-20 w-20 shrink-0 rounded-full flex items-center justify-center border-4 \${
             overallStatus === 'DANGER' ? 'bg-danger/20 border-danger/40' :
             overallStatus === 'WARNING' ? 'bg-warn/20 border-warn/40' :
             'bg-eco/20 border-eco/40'
           }\`}>
             {overallStatus === 'DANGER' ? <AlertTriangle className="h-10 w-10 text-danger animate-pulse" /> :
              overallStatus === 'WARNING' ? <AlertTriangle className="h-10 w-10 text-warn animate-pulse" /> :
              <ShieldCheck className="h-10 w-10 text-eco animate-pulse" />}
           </div>
           <div className="flex-1">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Overall Plant Status</div>
              <h1 className={\`text-5xl md:text-6xl font-black font-display tracking-tighter uppercase \${
                overallStatus === 'DANGER' ? 'text-danger drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]' :
                overallStatus === 'WARNING' ? 'text-warn drop-shadow-[0_0_15px_rgba(255,170,0,0.5)]' :
                'text-eco drop-shadow-[0_0_15px_rgba(0,255,100,0.5)]'
              }\`}>
                {overallStatus}
              </h1>
           </div>
           <div className="hidden md:block text-right">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Live Analysis</div>
              <div className={\`text-lg font-bold \${
                overallStatus === 'DANGER' ? 'text-danger/90' :
                overallStatus === 'WARNING' ? 'text-warn/90' :
                'text-eco/90'
              }\`}>
                {overallStatus === 'DANGER' ? 'Immediate Action Required.' :
                 overallStatus === 'WARNING' ? 'Approaching Limits. Monitor Closely.' :
                 'All Systems Operating Nominally.'}
              </div>
           </div>
        </div>
      </motion.div>
`;
  lines.splice(start, end - start + 1, banner);
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Successfully added status banner');
} else {
  console.error('Could not find boundaries');
}
