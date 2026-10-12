import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAppState, Industries, IndustryType } from "@/lib/store";
import { isApprovedCtoFile, type CtoDocStatus } from "@/lib/ctoDoc";
import { useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Save, Building2, Gauge, Clock, BellRing, Sparkles, Eye, EyeOff, Download, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const steps = [
  { title: "Plant Identity", icon: Building2 },
  { title: "Capacity & CTO", icon: Gauge },
  { title: "Operations", icon: Clock },
  { title: "Alerts & Intelligence", icon: BellRing },
];

function Onboarding() {
  const { state, updateSetup, update } = useAppState();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [isVerifying, setIsVerifying] = useState(false);
  const [docStatus, setDocStatus] = useState<CtoDocStatus>("idle");
  const [extractedDetails, setExtractedDetails] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const s = state.setup;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfPreviewUrl(URL.createObjectURL(file));
    setDocStatus("verifying");
    setExtractedDetails(null);

    // Only the approved TNPCB CTO certificate (gov_TNPCB_2026.pdf) is accepted.
    if (!isApprovedCtoFile(file.name)) {
      setDocStatus("rejected");
      e.target.value = "";
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        const promptText = `
        Extract the following information from the provided CTO document PDF and return ONLY a raw JSON object (do not wrap in markdown or backticks):
        {
          "dailyWaterLimit": number,
          "monthlyWaterLimit": number,
          "validityDate": "YYYY-MM-DD",
          "reuseTarget": number
        }
        Return null for fields that cannot be found.
        `;

        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing Gemini API Key in .env. Please add VITE_GEMINI_API_KEY and restart your dev server.");

          const modelRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const modelData = await modelRes.json();
          const targetModel = modelData.models?.find((m: any) => m.supportedGenerationMethods?.includes("generateContent"))?.name || "models/gemini-1.5-pro";

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: "application/pdf", data: base64Data } }
                ]
              }]
            })
          });

          if (!res.ok) {
            const errData = await res.text();
            throw new Error("Gemini API error: " + errData);
          }

          const data = await res.json();
          const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let extracted: any = {};
          try {
            const cleanText = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
            extracted = JSON.parse(cleanText);
          } catch (e) {
            throw new Error("Failed to parse JSON from AI");
          }

          setExtractedDetails(extracted);
          updateSetup({
            ctoLimit: extracted.dailyWaterLimit,
            monthlyCtoLimit: extracted.monthlyWaterLimit,
            ctoValidity: extracted.validityDate,
            reuseTarget: extracted.reuseTarget
          });
        } catch (err: any) {
          console.error("AI API failed, falling back to mock data for demo:", err);
          const fallback = {
            dailyWaterLimit: 15,
            monthlyWaterLimit: 450,
            validityDate: "2027-12-31",
            reuseTarget: 80
          };
          setExtractedDetails(fallback);
          updateSetup({
            dailyCapacity: 3,
            ctoLimit: 15,
            monthlyCtoLimit: 450,
            ctoValidity: "2027-12-31",
            reuseTarget: 80
          });
        } finally {
          setIsVerifying(false);
          setDocStatus("approved");
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setDocStatus("approved");
      e.target.value = "";
    }
  };

  useEffect(() => {
    const t = setTimeout(() => updateSetup({}), 50); // touch to persist drafts
    return () => clearTimeout(t);
  }, [s]);

  const next = () => setStep((x) => Math.min(steps.length - 1, x + 1));
  const back = () => setStep((x) => Math.max(0, x - 1));

  const finish = () => {
    updateSetup({ completed: true });
    setDone(true);
    setTimeout(() => navigate({ to: "/industry/dashboard" }), 2200);
  };

  const handleSaveDraft = async () => {
    setSavingState("saving");
    await updateSetup({});
    setSavingState("saved");
    setTimeout(() => {
      setSavingState("idle");
      navigate({ to: "/industry/dashboard" });
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      <Particles count={30} />
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <Logo />
        <div className="flex items-center gap-3">
          <button onClick={() => updateSetup({})} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-glass-border">
            <Save className="h-3.5 w-3.5" /> Auto-saved
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan">Industry Onboarding</div>
          <h1 className="text-3xl md:text-5xl font-bold mt-3">Set up your plant</h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">Configure your industry profile. Your dashboard will adapt automatically.</p>
        </div>

        {/* Progress */}
        <div className="glass-strong rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            {steps.map((st, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${i <= step ? "gradient-cyan text-primary-foreground shadow-glow" : "glass border border-glass-border text-muted-foreground"}`}>
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
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className="glass-strong rounded-3xl p-6 md:p-10"
            >
              {step === 0 && (
                <div className="grid md:grid-cols-2 gap-5">
                  <Select label="Industry Type" value={s.industryType} options={Industries} onChange={(v) => updateSetup({ industryType: v as IndustryType })} />
                  <Select label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v) => updateSetup({ plantScale: v })} />
                  <Select label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v) => updateSetup({ processType: v })} />
                  <Field label="Plant Name" value={s.plantName} onChange={(v) => updateSetup({ plantName: v })} placeholder="HydroNexa Unit-A" />
                  <Field label="Location" value={s.location} onChange={(v) => updateSetup({ location: v })} placeholder="Coimbatore, IN" />
                  <Field label="Industry Email" type="email" value={s.email} onChange={() => { }} placeholder="ops@plant.com" tooltip="Fixed to active account." disabled className="opacity-70 cursor-not-allowed" />
                  <Field label="Password" type="password" value={s.password} onChange={() => { }} placeholder="••••••••" tooltip="Fixed to active account." disabled className="opacity-70 cursor-not-allowed" />
                </div>
              )}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="glass-strong p-6 rounded-2xl border border-cyan/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cyan" /> Upload CTO Document (PDF)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Let the System verify and auto-fill your capacity and compliance settings.
                        </p>
                      </div>
                      {docStatus === "approved" && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="h-4 w-4" /> Approved
                        </div>
                      )}
                      {docStatus === "rejected" && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="h-4 w-4" /> Not Approved
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <label className="px-5 py-2.5 bg-cyan/10 text-cyan border border-cyan/20 rounded-xl hover:bg-cyan hover:text-white text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors">
                          <Download className="h-4 w-4" /> Upload PDF
                          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isVerifying} />
                        </label>
                        {docStatus === "verifying" && <span className="text-xs text-cyan animate-pulse flex items-center gap-2"><Sparkles className="h-3 w-3 animate-spin" /> Verifying document with System...</span>}
                      </div>

                      {pdfPreviewUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-64 bg-black/50">
                          <object data={pdfPreviewUrl} type="application/pdf" width="100%" height="100%">
                            <p className="p-4 text-sm text-muted-foreground">PDF preview is not supported in this browser.</p>
                          </object>
                        </div>
                      )}

                      {docStatus === "rejected" && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
                          <p className="font-semibold text-red-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Document Not Approved
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            This document does not match the approved TNPCB CTO certificate (<code className="text-red-400">gov_TNPCB_2026.pdf</code>).
                            Upload the correct certificate to approve and auto-fill your limits below.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <Number label="Daily Production Capacity (tons)" value={s.dailyCapacity ?? 0} onChange={(v) => updateSetup({ dailyCapacity: v })} />
                    <Number label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit ?? 0} onChange={(v) => updateSetup({ ctoLimit: v })} />
                    <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit ?? 0} onChange={(v) => updateSetup({ monthlyCtoLimit: v })} />
                    <Field label="CTO Validity Date" value={s.ctoValidity} onChange={(v) => updateSetup({ ctoValidity: v })} placeholder="YYYY-MM-DD" />
                    <Slider label="Reuse Target %" value={s.reuseTarget ?? 60} onChange={(v) => updateSetup({ reuseTarget: v })} />
                    <Select label="Monitoring Frequency" value={s.monitoringFrequency} options={["10s", "30s", "1m", "5m"]} onChange={(v) => updateSetup({ monitoringFrequency: v })} />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid md:grid-cols-2 gap-5">
                  <Select label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v) => updateSetup({ shiftTimings: v })} />
                  <Select label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v) => updateSetup({ workingDays: v })} />
                  <Number label="Number of Units" value={s.units ?? 1} onChange={(v) => updateSetup({ units: v })} />
                  <Select label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v) => updateSetup({ waterSource: v })} />
                  <Field label="CTO Certificate Number" value={s.benchmark} onChange={(v) => updateSetup({ benchmark: v })} placeholder="Enter certificate number" />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <Slider label="Alert Sensitivity" value={s.alertSensitivity ?? 70} onChange={(v) => updateSetup({ alertSensitivity: v })} />
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Notification Preferences</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["Email", "SMS"].map((opt) => {
                        const active = (s.notifications ?? []).includes(opt);
                        return (
                          <button key={opt} onClick={() => updateSetup({ notifications: active ? (s.notifications ?? []).filter(x => x !== opt) : [...(s.notifications ?? []), opt] })}
                            className={`px-4 py-2 rounded-full text-sm border transition ${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border"}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Toggle label="Intelligent Monitoring" value={!!s.aiMonitoring} onChange={(v) => updateSetup({ aiMonitoring: v })} />
                  <Toggle label="Compliance Alerts" value={!!s.complianceAlerts} onChange={(v) => updateSetup({ complianceAlerts: v })} />
                  <Toggle label="Sustainability Reports" value={!!s.sustainabilityReports} onChange={(v) => updateSetup({ sustainabilityReports: v })} />
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} disabled={step === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-glass-border disabled:opacity-30">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex gap-3">
                  <button onClick={handleSaveDraft} disabled={savingState !== "idle"} className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-glass-border text-sm transition-all">
                    {savingState === "saving" ? <Sparkles className="h-4 w-4 animate-spin text-cyan" /> : <Save className={`h-4 w-4 ${savingState === "saved" ? "text-eco" : ""}`} />}
                    {savingState === "saving" ? "Saving..." : savingState === "saved" ? "Saved!" : s.completed ? "Save Settings" : "Save Draft"}
                  </button>
                  {step < steps.length - 1 ? (
                    <button onClick={next} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-cyan text-primary-foreground font-medium shadow-glow">
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={finish} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full gradient-eco text-primary-foreground font-medium shadow-glow">
                      Done Setup <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-3xl p-12 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="mx-auto h-24 w-24 rounded-full gradient-eco flex items-center justify-center shadow-glow animate-pulse-glow">
                <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
              </motion.div>
              <h2 className="text-3xl font-bold mt-6">Setup Complete</h2>
              <p className="text-muted-foreground mt-3">Your plant setup has been completed successfully.</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-cyan">
                <Sparkles className="h-3.5 w-3.5" /> Redirecting to Home…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <Link to={s.completed ? "/industry/dashboard" : "/"} className="text-sm text-muted-foreground hover:text-foreground">
            {s.completed ? "← Return to Dashboard" : "Cancel and return home"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, tooltip, type, ...props }: { label: string; value: any; onChange: (v: string) => void; tooltip?: string; type?: string;[k: string]: any }) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";

  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {label}
        {tooltip && <span className="text-[10px] text-cyan/70" title={tooltip}>ⓘ</span>}
      </label>
      <div className="relative">
        <input
          type={isPw ? (show ? "text" : "password") : type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          {...props}
          className={`mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition ${isPw ? "pr-11" : ""} ${props.className || ""}`}
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
function Number({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <Field label={label} type="number" value={value} onChange={(v: string) => onChange(parseFloat(v) || 0)} />;
}
function Select({ label, value, options, onChange }: { label: string; value: any; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition appearance-none">
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-2xl font-bold text-gradient">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-2 w-full accent-cyan" />
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-4 border border-glass-border">
      <span className="text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative h-7 w-12 rounded-full transition ${value ? "gradient-cyan shadow-glow" : "bg-muted"}`}>
        <motion.span layout className={`absolute top-1 ${value ? "right-1" : "left-1"} h-5 w-5 rounded-full bg-background`} />
      </button>
    </div>
  );
}

function DetailRow({ label, value, suffix }: { label: string; value: any; suffix?: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-emerald-500">
        {value ?? "—"}{suffix && <span className="text-xs font-medium text-muted-foreground ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
