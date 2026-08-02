
const fs = require("fs");
let content = fs.readFileSync("src/routes/industry.dashboard.tsx", "utf-8");

const oldImports = `import {
  LayoutDashboard, Activity, BarChart3, Brain, AlertTriangle, Leaf, FileText, Settings,
  Droplets, Recycle, Gauge, Waves, Factory, Cpu, Sparkles, TrendingUp, Save, ArrowRight, Loader2, Zap,
  RefreshCcw, CheckCircle2, Timer, Wind, ArrowDownCircle, ArrowUpCircle, ShieldCheck,
  FlaskConical, Thermometer, FlaskRound, Info, Beaker, ZapOff, TrendingDown, Calendar,
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart
} from "lucide-react";`;

const newImports = `import {
  LayoutDashboard, Activity, BarChart3, Brain, AlertTriangle, Leaf, FileText, Settings,
  Droplets, Recycle, Gauge, Waves, Factory, Cpu, Sparkles, TrendingUp, Save, ArrowRight, Loader2, Zap,
  RefreshCcw, CheckCircle2, Timer, Wind, ArrowDownCircle, ArrowUpCircle, ShieldCheck,
  FlaskConical, Thermometer, FlaskRound, Info, Beaker, ZapOff, TrendingDown, Calendar,
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check
} from "lucide-react";`;

content = content.replace(oldImports, newImports);

const settingsStartIndex = content.indexOf("function SettingsPanel() {");
const oldTop = content.substring(0, settingsStartIndex);

const newSettings = `function SettingsPanel() {
  const { state, updateSetup } = useAppState();
  const s = state.setup || {};
  const [step, setStep] = useState(0);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSubject, setRequestSubject] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRequest = async () => {
    if (!requestSubject || !requestMessage) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/settings-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.currentUserEmail,
          subject: requestSubject,
          message: requestMessage,
          currentSettings: s
        })
      });
      if (res.ok) {
        alert("Settings change request submitted to Admin successfully.");
        setShowRequestForm(false);
        setRequestSubject("");
        setRequestMessage("");
      } else {
        alert("Failed to submit request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Plant Identity",
      icon: Factory,
      content: (
        <div className="grid md:grid-cols-2 gap-5">
          <SettingSelect label="Industry Type" value={s.industryType} options={["Textile", "Pulp & Paper", "Food Processing", "Steel & Metal", "Pharma"]} onChange={(v) => updateSetup({ industryType: v as any })} />
          <SettingSelect label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v) => updateSetup({ plantScale: v })} />
          <SettingSelect label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v) => updateSetup({ processType: v })} />
          <SettingText label="Plant Name" value={s.plantName} onChange={(v) => updateSetup({ plantName: v })} />
          <SettingText label="Location" value={s.location} onChange={(v) => updateSetup({ location: v })} />
        </div>
      )
    },
    {
      title: "Capacity & CTO",
      icon: Gauge,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-cyan/5 p-4 rounded-xl border border-cyan/20">
             <div>
               <p className="text-sm font-bold text-cyan">CTO Modification</p>
               <p className="text-xs text-muted-foreground mt-1">These values are strictly Read-Only. Submit a request to the Admin to modify them.</p>
             </div>
             {!showRequestForm && (
               <button onClick={() => setShowRequestForm(true)} className="px-5 py-2 bg-cyan/20 border border-cyan/50 text-cyan rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan hover:text-background transition-all">
                 Request Change
               </button>
             )}
          </div>
          
          {showRequestForm && (
            <div className="glass rounded-xl p-5 border border-cyan/30 animate-in fade-in slide-in-from-top-4 duration-300">
               <h5 className="font-bold text-sm text-cyan mb-4">Submit Change Request</h5>
               <div className="space-y-4">
                 <div>
                   <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Subject</label>
                   <input type="text" value={requestSubject} onChange={(e) => setRequestSubject(e.target.value)} className="w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none" />
                 </div>
                 <div>
                   <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Message / Reason for Change</label>
                   <textarea rows={3} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Explain why you need to modify your Capacity or CTO values..." className="w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none resize-none" />
                 </div>
                 <div className="flex justify-end gap-3 pt-2">
                   <button onClick={() => setShowRequestForm(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-white transition">Cancel</button>
                   <button onClick={handleSubmitRequest} disabled={isSubmitting} className="px-5 py-2 bg-cyan text-background rounded-lg text-sm font-bold hover:scale-105 transition disabled:opacity-50">
                     {isSubmitting ? "Submitting..." : "Submit Request"}
                   </button>
                 </div>
               </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <SettingNumber label="Daily Production Capacity (L)" value={s.dailyCapacity ?? 0} onChange={(v) => updateSetup({ dailyCapacity: v })} readOnly />
            <SettingNumber label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit ?? 100} onChange={(v) => updateSetup({ ctoLimit: v })} readOnly />
            <SettingNumber label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit ?? 3000} onChange={(v) => updateSetup({ monthlyCtoLimit: v })} readOnly />
            <SettingText label="CTO Validity" value={s.ctoValidity && s.ctoValidity !== "N/A" ? s.ctoValidity : ""} onChange={(v) => updateSetup({ ctoValidity: v })} readOnly />
            <SettingSlider label="Reuse Target %" value={s.reuseTarget ?? 60} onChange={(v) => updateSetup({ reuseTarget: v })} readOnly />
            <SettingSelect label="Monitoring Frequency" value={s.monitoringFrequency || "1m"} options={["10s", "30s", "1m", "5m"]} onChange={(v) => updateSetup({ monitoringFrequency: v })} readOnly />
          </div>
        </div>
      )
    },
    {
      title: "Operations",
      icon: Clock,
      content: (
        <div className="grid md:grid-cols-2 gap-5">
          <SettingSelect label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v) => updateSetup({ shiftTimings: v })} />
          <SettingSelect label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v) => updateSetup({ workingDays: v })} />
          <SettingNumber label="Number of Units" value={s.units ?? 0} onChange={(v) => updateSetup({ units: v })} />
          <SettingSelect label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v) => updateSetup({ waterSource: v })} />
          <SettingText label="CTO Certificate Number" value={s.ctoCertificate || ""} onChange={(v) => updateSetup({ ctoCertificate: v })} />
        </div>
      )
    },
    {
      title: "Alerts & AI",
      icon: BellRing,
      content: (
        <div className="space-y-6">
          <AdminSlider label="Alert Sensitivity" value={s.alertSensitivity ?? 70} onChange={(v: any) => updateSetup({ alertSensitivity: v })} />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Notification Preferences</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Email", "SMS"].map((opt) => {
                const active = Array.isArray(s.notifications) && s.notifications.includes(opt);
                return (
                  <button key={opt} onClick={() => updateSetup({ notifications: active ? s.notifications.filter((x:any) => x !== opt) : [...(Array.isArray(s.notifications) ? s.notifications : []), opt]})}
                    className={\`px-4 py-2 rounded-full text-sm border transition \${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border"}\`}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          <AdminToggle label="AI Monitoring" value={s.aiMonitoring} onChange={(v: any) => updateSetup({ aiMonitoring: v })} />
          <AdminToggle label="Compliance Alerts" value={s.complianceAlerts} onChange={(v: any) => updateSetup({ complianceAlerts: v })} />
          <AdminToggle label="Sustainability Reports" value={s.sustainabilityReports} onChange={(v: any) => updateSetup({ sustainabilityReports: v })} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-2xl p-6 border border-glass-border">
         <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
             {steps.map((st, i) => (
               <div key={i} className="flex-1 flex items-center cursor-pointer" onClick={() => setStep(i)}>
                 <div className="flex flex-col items-center">
                   <div className={\`h-10 w-10 rounded-full flex items-center justify-center transition-all \${i <= step ? "gradient-cyan text-primary-foreground shadow-glow" : "glass border border-glass-border text-muted-foreground"}\`}>
                     {i < step ? <Check className="h-5 w-5" /> : <st.icon className="h-5 w-5" />}
                   </div>
                   <div className="text-[10px] mt-2 uppercase tracking-wider hidden md:block">{st.title}</div>
                 </div>
                 {i < steps.length - 1 && (
                   <div className="flex-1 h-px mx-2 relative">
                     <div className="absolute inset-0 bg-glass-border" />
                     <motion.div initial={{ width: 0 }} animate={{ width: i < step ? "100%" : "0%" }} className="absolute inset-y-0 left-0 gradient-cyan" />
                   </div>
                 )}
               </div>
             ))}
           </div>
         
         <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
               <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
               >
                  {steps[step].content}
               </motion.div>
            </AnimatePresence>
         </div>

         <div className="flex justify-between items-center mt-4 pt-6 border-t border-glass-border">
            <button 
               onClick={() => setStep(s => Math.max(0, s - 1))}
               disabled={step === 0}
               className={\`px-6 py-2.5 rounded-xl text-sm font-bold transition \${step === 0 ? "opacity-30 cursor-not-allowed" : "glass hover:bg-white/10"}\`}
            >
               Previous
            </button>
            <button 
               onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
               disabled={step === steps.length - 1}
               className={\`px-6 py-2.5 rounded-xl text-sm font-bold transition \${step === steps.length - 1 ? "opacity-30 cursor-not-allowed" : "bg-cyan text-background hover:scale-105"}\`}
            >
               Next
            </button>
         </div>
      </div>
    </div>
  );
}

function SettingText({ label, value, onChange, readOnly = false }: { label: string; value?: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type="text" value={value || ""} onChange={(e) => !readOnly && onChange(e.target.value)} readOnly={readOnly} className={\`mt-2 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:outline-none \${readOnly ? "opacity-70 cursor-not-allowed" : "focus:border-eco"}\`} />
    </div>
  );
}

function SettingNumber({ label, value, onChange, readOnly = false }: { label: string; value: number; onChange: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => !readOnly && onChange(parseFloat(e.target.value) || 0)} readOnly={readOnly} className={\`mt-2 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:outline-none \${readOnly ? "opacity-70 cursor-not-allowed" : "focus:border-eco"}\`} />
    </div>
  );
}

function SettingSlider({ label, value, onChange, readOnly = false }: { label: string; value: number; onChange: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-xl font-bold text-gradient">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => !readOnly && onChange(parseInt(e.target.value))} disabled={readOnly} className={\`mt-2 w-full accent-eco \${readOnly ? "opacity-70 cursor-not-allowed" : ""}\`} />
    </div>
  );
}

function SettingSelect({ label, value, options, onChange, readOnly = false }: { label: string; value: any; options: string[]; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value ?? ""} onChange={(e) => !readOnly && onChange(e.target.value)} disabled={readOnly}
        className={\`mt-2 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none transition appearance-none \${readOnly ? "opacity-70 cursor-not-allowed" : ""}\`}>
        <option value="">Select...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function AdminSlider({ label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="font-bold text-cyan">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full accent-cyan" />
    </div>
  );
}

function AdminToggle({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-4 border border-glass-border">
      <span className="text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={\`relative h-7 w-12 rounded-full transition \${value ? "gradient-cyan" : "bg-white/10"}\`}>
        <motion.span layout className={\`absolute top-1 \${value ? "right-1" : "left-1"} h-5 w-5 rounded-full bg-background\`} />
      </button>
    </div>
  );
}
`

fs.writeFileSync("src/routes/industry.dashboard.tsx", oldTop + newSettings);

