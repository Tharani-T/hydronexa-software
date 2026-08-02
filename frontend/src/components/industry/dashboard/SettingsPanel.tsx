import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppState, Industries, IndustryType } from "@/lib/store";
import { 
  Building2, Gauge, Clock, BellRing, Save, 
  ChevronRight, Check, EyeOff, Eye, Send, CheckCircle2
} from "lucide-react";

const steps = [
  { title: "Plant Identity", icon: Building2 },
  { title: "Capacity & CTO", icon: Gauge },
  { title: "Operations", icon: Clock },
  { title: "Alerts & AI", icon: BellRing },
];

export function SettingsPanel() {
  const { state, updateSetup } = useAppState();
  const s = state.setup || {};
  const [step, setStep] = useState(0);

  // Request Change Dialog State
  const [isRequestingChange, setIsRequestingChange] = useState(false);
  const [changeSubject, setChangeSubject] = useState("");
  const [changeMsg, setChangeMsg] = useState("");
  const [changeSubmitted, setChangeSubmitted] = useState(false);

  const submitChangeRequest = () => {
    const existing = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
    existing.push({
      id: Date.now(),
      industryName: s.plantName || 'Unknown Plant',
      email: s.email || 'Unknown Email',
      subject: changeSubject,
      message: changeMsg,
      date: new Date().toISOString(),
      status: 'Pending'
    });
    localStorage.setItem('hydronexa:pendingRequests', JSON.stringify(existing));
    
    setChangeSubmitted(true);
    setTimeout(() => {
      setIsRequestingChange(false);
      setChangeSubmitted(false);
      setChangeSubject("");
      setChangeMsg("");
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Settings & Configuration</h2>
          <p className="text-muted-foreground text-sm mt-1 font-medium">Manage your operational parameters and compliance limits.</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="glass-strong rounded-[2rem] p-6 border border-glass-border">
        <div className="flex items-center justify-between">
          {steps.map((st, i) => (
            <div key={i} className="flex-1 flex items-center cursor-pointer" onClick={() => setStep(i)}>
              <div className="flex flex-col items-center">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all border-2 ${i === step ? "gradient-cyan text-primary-foreground shadow-glow border-transparent" : i < step ? "bg-cyan/10 border-cyan/30 text-cyan" : "glass border-glass-border text-muted-foreground"}`}>
                  {i < step ? <Check className="h-5 w-5" /> : <st.icon className="h-5 w-5" />}
                </div>
                <div className={`text-[10px] mt-3 uppercase tracking-wider font-bold hidden md:block ${i === step ? 'text-cyan' : 'text-muted-foreground'}`}>{st.title}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-4 relative">
                  <div className="absolute inset-0 bg-glass-border" />
                  <motion.div initial={{ width: 0 }} animate={{ width: i < step ? "100%" : "0%" }} className="absolute inset-y-0 left-0 gradient-cyan" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Settings Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="glass-strong rounded-[2rem] p-8 border border-glass-border relative overflow-hidden"
        >
          {step === 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-widest text-cyan mb-6">Plant Identity</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Select label="Industry Type" value={s.industryType} options={Industries} onChange={(v: any) => updateSetup({ industryType: v as IndustryType })} />
                <Select label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v: any) => updateSetup({ plantScale: v })} />
                <Select label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v: any) => updateSetup({ processType: v })} />
                <Field label="Plant Name" value={s.plantName} onChange={(v: any) => updateSetup({ plantName: v })} placeholder="HydroNexa Unit-A" />
                <Field label="Location" value={s.location} onChange={(v: any) => updateSetup({ location: v })} placeholder="Coimbatore, IN" />
                <Field label="Registered Email ID" value={s.email} onChange={() => {}} placeholder="email@example.com" disabled={true} className="opacity-50 cursor-not-allowed bg-black/20" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold uppercase tracking-widest text-cyan">Capacity & CTO</h3>
                <button 
                  onClick={() => setIsRequestingChange(true)}
                  className="px-4 py-2 rounded-xl bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 text-cyan text-xs font-bold uppercase tracking-widest transition-all shadow-glow-sm"
                >
                  Request Change
                </button>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-bold text-warn">
                ⚠️ This section is read-only. Modifications require Admin approval.
              </p>
              <div className="relative">
                <div className="absolute inset-0 z-10 cursor-not-allowed" title="This section is read-only" />
                <div className="grid md:grid-cols-2 gap-6 opacity-70 pointer-events-none grayscale-[20%]">
                  <Number label="Daily Production Capacity (L)" value={s.dailyCapacity ?? 0} onChange={() => {}} />
                  <Number label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit ?? 0} onChange={() => {}} />
                  <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit ?? 0} onChange={() => {}} />
                  <Field label="CTO Validity Date" value={s.ctoValidity} onChange={() => {}} placeholder="YYYY-MM-DD" />
                  <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget ?? 0} onChange={() => {}} />
                  <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget ?? 0} onChange={() => {}} />
                  <div className="flex flex-col h-full">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Reuse Target (%)</label>
                    <div className="mt-auto w-full rounded-xl glass border border-glass-border px-4 h-[46px] flex items-center gap-4 transition">
                      <input type="range" min={0} max={100} value={s.reuseTarget ?? 0} onChange={() => {}} className="flex-1 h-1 bg-white/20 rounded-full appearance-none outline-none accent-cyan cursor-pointer" />
                      <span className="text-sm font-bold text-cyan min-w-[3.5ch] text-right">{s.reuseTarget ?? 0}%</span>
                    </div>
                  </div>
                  <Select label="Monitoring Frequency" value={s.monitoringFrequency} options={["10s", "30s", "1m", "5m"]} onChange={() => {}} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-widest text-cyan mb-6">Operations</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Select label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v: any) => updateSetup({ shiftTimings: v })} />
                <Select label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v: any) => updateSetup({ workingDays: v })} />
                <Number label="Number of Units" value={s.units ?? 1} onChange={(v: any) => updateSetup({ units: v })} />
                <Select label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v: any) => updateSetup({ waterSource: v })} />
                <Field label="CTO Certificate Number" value={s.benchmark || s.ctoCertificate} onChange={(v: any) => updateSetup({ ctoCertificate: v })} placeholder="Enter certificate number" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-widest text-cyan mb-6">Alerts & AI</h3>
              <Slider label="Alert Sensitivity" value={s.alertSensitivity ?? 70} onChange={(v: any) => updateSetup({ alertSensitivity: v })} />
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Notification Preferences</label>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["Email", "SMS"].map((opt) => {
                    const active = (s.notifications ?? []).includes(opt);
                    return (
                      <button key={opt} onClick={() => updateSetup({ notifications: active ? (s.notifications ?? []).filter(x => x !== opt) : [...(s.notifications ?? []), opt] })}
                        className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border hover:border-cyan/50"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <Toggle label="AI Monitoring" value={!!s.aiMonitoring} onChange={(v: any) => updateSetup({ aiMonitoring: v })} />
                <Toggle label="Compliance Alerts" value={!!s.complianceAlerts} onChange={(v: any) => updateSetup({ complianceAlerts: v })} />
                <Toggle label="Sustainability Reports" value={!!s.sustainabilityReports} onChange={(v: any) => updateSetup({ sustainabilityReports: v })} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button 
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-6 py-2.5 rounded-full border border-glass-border hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
        >
          Previous
        </button>
        <button 
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          className="px-6 py-2.5 rounded-full bg-cyan text-black hover:bg-cyan-glow transition-all shadow-glow-sm text-xs font-bold uppercase tracking-widest disabled:opacity-30 flex items-center gap-2"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Request Change Dialog */}
      <AnimatePresence>
        {isRequestingChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsRequestingChange(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-lg glass-strong rounded-3xl border border-glass-border p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase tracking-tight text-cyan mb-2">Request Settings Change</h3>
              <p className="text-xs text-muted-foreground mb-6">Submit a modification request to the Administrator. Changes require approval before they are applied.</p>
              
              {!changeSubmitted ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-2">Subject</label>
                    <input 
                      type="text" 
                      value={changeSubject} 
                      onChange={e => setChangeSubject(e.target.value)}
                      placeholder="e.g. Increase Daily CTO Limit"
                      className="w-full bg-black/20 border border-glass-border rounded-xl px-4 py-3 text-sm focus:border-cyan outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground block mb-2">Message / Reason</label>
                    <textarea 
                      value={changeMsg} 
                      onChange={e => setChangeMsg(e.target.value)}
                      placeholder="Please explain why you need to modify the read-only parameters..."
                      className="w-full bg-black/20 border border-glass-border rounded-xl px-4 py-3 text-sm focus:border-cyan outline-none transition-all h-32 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 justify-end mt-4">
                    <button 
                      onClick={() => setIsRequestingChange(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-glass-border hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitChangeRequest}
                      disabled={!changeSubject.trim() || !changeMsg.trim()}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-cyan text-black hover:bg-cyan-glow transition-all shadow-glow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" /> Submit Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full bg-eco/20 border-2 border-eco flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-eco" />
                  </div>
                  <h4 className="text-xl font-bold text-eco mb-2">Request Sent!</h4>
                  <p className="text-sm text-muted-foreground">The Administrator will review your request shortly.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------

function Field({ label, value, onChange, tooltip, type, disabled, className, ...props }: any) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";

  return (
    <div className="flex flex-col h-full">
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2 mb-2">
        {label}
        {tooltip && <span className="text-[10px] text-cyan/70" title={tooltip}>ⓘ</span>}
      </label>
      <div className="relative mt-auto">
        <input
          type={isPw ? (show ? "text" : "password") : type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          {...props}
          className={`w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition ${isPw ? "pr-11" : ""} ${className || ""}`}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-muted-foreground hover:text-cyan transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Number({ label, value, onChange }: any) {
  return <Field label={label} type="number" value={value} onChange={(v: string) => onChange(parseFloat(v) || 0)} />;
}

function Select({ label, value, options, onChange }: any) {
  return (
    <div className="flex flex-col h-full">
      <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="mt-auto w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition appearance-none">
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Slider({ label, value, onChange }: any) {
  return (
    <div className="glass-strong rounded-2xl p-5 border border-glass-border">
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</label>
        <span className="text-2xl font-black font-display text-cyan">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-3 w-full accent-cyan" />
    </div>
  );
}

function Toggle({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between glass rounded-2xl p-5 border border-glass-border">
      <span className="text-sm font-bold tracking-wide">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative h-7 w-12 rounded-full transition ${value ? "gradient-cyan shadow-glow" : "bg-white/10"}`}>
        <motion.span layout className={`absolute top-1 ${value ? "right-1" : "left-1"} h-5 w-5 rounded-full bg-background`} />
      </button>
    </div>
  );
}
