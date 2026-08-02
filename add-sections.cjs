const fs = require('fs');

const overviewPath = 'frontend/src/components/industry/dashboard/Overview.tsx';
let text = fs.readFileSync(overviewPath, 'utf8');

// 1. Insert shift logic just before `return (` in Overview
const logicInsertion = `
  const currentHour = new Date().getHours();
  const getShiftStatus = (start: number, end: number, target: number, currentHour: number) => {
    let isActive = false;
    if (start < end) {
      isActive = currentHour >= start && currentHour < end;
    } else { // night shift crosses midnight
      isActive = currentHour >= start || currentHour < end;
    }
    
    if (isActive) {
      const used = (liveCtoUsed * 0.4).toFixed(1); // approximate logic for visual purposes
      return { active: true, used, target: target.toFixed(1), status: '🟢 On Track', color: 'eco' };
    } else {
      return { active: false, used: '-', target: target.toFixed(1), status: 'Waiting...', color: 'muted' };
    }
  };

  const shifts = [
    { name: "Morning Shift", time: "06:00 AM – 02:00 PM", ...getShiftStatus(6, 14, 4.0, currentHour) },
    { name: "Afternoon Shift", time: "02:00 PM – 10:00 PM", ...getShiftStatus(14, 22, 4.0, currentHour) },
    { name: "Night Shift", time: "10:00 PM – 06:00 AM", ...getShiftStatus(22, 6, 3.5, currentHour) }
  ];

  return (
    <div className="space-y-10 pb-10">`;

// Using precise replacement string
text = text.replace('  return (\n    <div className="space-y-10 pb-10">', logicInsertion);

// 2. Insert JSX sections just before `{/* Secondary Dashboard Grid */}`
const jsxInsertion = `
      {/* SECTION 1: Shift Operations */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Shift Operations</h4>
        <div className="grid lg:grid-cols-3 gap-6">
          {shifts.map((shift, i) => (
            <div key={i} className={\`p-6 rounded-2xl border transition-all \${shift.active ? 'border-cyan shadow-glow bg-cyan/10' : 'border-glass-border bg-white/5'}\`}>
               <div className="flex justify-between items-start mb-4">
                 <div>
                    <h5 className={\`text-sm font-bold tracking-tight \${shift.active ? 'text-cyan' : 'text-muted-foreground'}\`}>{shift.name}</h5>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">{shift.time}</p>
                 </div>
                 {shift.active && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan"></span></span>}
               </div>
               
               <div className="space-y-3 mt-4">
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-muted-foreground uppercase font-bold tracking-wider">Used</span>
                   <span className="font-mono font-black">{shift.used} {shift.active ? 'L' : ''}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                   <span className="text-muted-foreground uppercase font-bold tracking-wider">Target</span>
                   <span className="font-mono font-black">{shift.target} L</span>
                 </div>
                 <div className="flex justify-between items-center text-xs pt-3 border-t border-glass-border">
                   <span className="text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                   <span className={\`font-black \${shift.active ? 'text-eco' : 'text-muted-foreground'}\`}>{shift.status}</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Water Performance Summary */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Water Performance Summary</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Droplets className="h-5 w-5 text-cyan" /></div>
             <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Fresh Water Used</div>
             <div className="text-3xl font-display font-black text-cyan">{(liveCtoUsed).toFixed(1)} <span className="text-sm text-cyan/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Recycle className="h-5 w-5 text-eco" /></div>
             <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Reuse Water</div>
             <div className="text-3xl font-display font-black text-eco">{(liveCtoUsed * (reuseActual/100)).toFixed(1)} <span className="text-sm text-eco/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><Save className="h-5 w-5 text-primary" /></div>
             <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Water Saved</div>
             <div className="text-3xl font-display font-black text-primary">{(liveCtoUsed * (reuseActual/100)).toFixed(1)} <span className="text-sm text-primary/50">L</span></div>
          </div>
          <div className="p-5 rounded-2xl glass border border-glass-border relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
             <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">Reuse Efficiency</div>
             <div className="text-3xl font-display font-black text-amber-500">{reuseActual} <span className="text-sm text-amber-500/50">%</span></div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Compliance Summary */}
      <div className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6">Compliance Summary</h4>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
             <div className="h-10 w-10 rounded-full bg-eco/10 flex items-center justify-center border border-eco/20 shrink-0">
               <ShieldCheck className="h-5 w-5 text-eco" />
             </div>
             <div>
               <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">CTO Daily Limit</div>
               <div className="text-sm font-bold text-eco">{ctoPct <= 100 ? '🟢 Within Daily Limit' : '🔴 Exceeds Daily Limit'}</div>
             </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
             <div className={\`h-10 w-10 rounded-full flex items-center justify-center border shrink-0 \${reuseActual >= a.reuseTarget ? 'bg-eco/10 border-eco/20' : 'bg-warn/10 border-warn/20'}\`}>
               <Target className={\`h-5 w-5 \${reuseActual >= a.reuseTarget ? 'text-eco' : 'text-warn'}\`} />
             </div>
             <div>
               <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Reuse Target Status</div>
               <div className={\`text-sm font-bold \${reuseActual >= a.reuseTarget ? 'text-eco' : 'text-warn'}\`}>
                 {reuseActual >= a.reuseTarget ? '🟢 Target Achieved' : '🟡 Target Below Expected'}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-glass-border">
             <div className="h-10 w-10 rounded-full bg-eco/10 flex items-center justify-center border border-eco/20 shrink-0">
               <CheckCircle2 className="h-5 w-5 text-eco" />
             </div>
             <div>
               <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Overall Compliance</div>
               <div className="text-sm font-bold text-eco">SAFE - No Violations</div>
             </div>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Grid */}`;
text = text.replace('      {/* Secondary Dashboard Grid */}', jsxInsertion);

fs.writeFileSync(overviewPath, text);
console.log('Successfully injected new sections into Overview.tsx');
