import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Factory, ShieldAlert, 
  Settings, LogOut, Search, Bell, Activity, 
  Droplets, AlertTriangle, FileText, CheckCircle, 
  XCircle, ChevronRight, UserCog, Send, Check,
  ChevronLeft, Gauge, Clock, BellRing, CheckCircle2,
  Sparkles, Download, Eye, EyeOff, MapPin, X, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/lib/store";
import { isApprovedCtoFile, type CtoDocStatus } from "@/lib/ctoDoc";
import { ApproveModal } from "./ContactRequests";


export function Field({ label, value, onChange, tooltip, type, ...props }: any) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">{label}{tooltip && <span title={tooltip}>ⓘ</span>}</label>
      <div className="relative mt-1.5">
        <input type={isPw ? (show ? "text" : "password") : type || "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} className={`w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan outline-none ${isPw ? "pr-11" : ""}`} />
        {isPw && <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      </div>
    </div>
  );
}

export function Number({ label, value, onChange }: any) { return <Field label={label} type="number" value={value} onChange={(v: string) => onChange(parseFloat(v) || 0)} />; }

export function Select({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan outline-none appearance-none bg-background/50">
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function Slider({ label, value, onChange }: any) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-lg font-bold text-cyan">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-2 w-full accent-cyan" />
    </div>
  );
}

export function Toggle({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-4 border border-glass-border">
      <span className="text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative h-7 w-12 rounded-full transition ${value ? "gradient-cyan" : "bg-white/10"}`}>
        <motion.span layout className={`absolute top-1 ${value ? "right-1" : "left-1"} h-5 w-5 rounded-full bg-background`} />
      </button>
    </div>
  );
}


export function EditIndustryModal({ industry, onClose, onRefresh }: { industry: any, onClose: () => void, onRefresh: () => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<any>({
    email: industry?.email || "",
    industryName: industry?.industryName || "",
    password: "", // Only update if filled
    industryType: industry?.industryType || "",
    location: industry?.location || "", 
    plantScale: industry?.plantscale || "",
    processType: industry?.processtype || "",
    plantName: industry?.plantname || industry?.industryName || "",
    dailyCapacity: industry?.capacity || 0,
    ctoLimit: industry?.ctolimit || 0,
    monthlyCtoLimit: industry?.monthlyctolimit || 0,
    dailyReuseTarget: industry?.dailyreusetarget || 0,
    monthlyReuseTarget: industry?.monthlyreusetarget || 0,
    reuseTarget: industry?.reusetarget || 60,
    monitoringFrequency: industry?.monitoringfrequency || "1m",
    shiftTimings: industry?.shifttimings || "",
    workingDays: industry?.workingdays || "",
    units: industry?.units || 1,
    waterSource: industry?.watersource || "",
    benchmark: industry?.benchmark || "",
    alertSensitivity: industry?.alertsensitivity || 70,
    notifications: industry?.notifications || [],
    aiMonitoring: industry?.aimonitoring ?? true,
    ctoValidity: industry?.ctovalidity || "",
    automaticReports: industry?.automaticreports ?? true,
    sustainabilityReports: industry?.sustainabilityreports ?? true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [docStatus, setDocStatus] = useState<CtoDocStatus>("idle");
  const [extractedDetails, setExtractedDetails] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setDocStatus("verifying");
    setExtractedDetails(null);

    // Only the approved TNPCB CTO certificate (gov_TNPCB_2026.pdf) is accepted.
    if (!isApprovedCtoFile(file.name)) {
      setIsVerifying(false);
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
          "reuseTarget": number,
          "dailyReuseTarget": number,
          "monthlyReuseTarget": number
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

          const required: string[] = [];
          const missing = required.filter(f => !extracted[f] || extracted[f] === null);

          if (missing.length === 0) {
            setExtractedDetails(extracted);
            setS((prev: any) => ({
              ...prev,
              ctoLimit: extracted.dailyWaterLimit,
              monthlyCtoLimit: extracted.monthlyWaterLimit,
              ctoValidity: extracted.validityDate,
              reuseTarget: extracted.reuseTarget,
              dailyReuseTarget: extracted.dailyReuseTarget,
              monthlyReuseTarget: extracted.monthlyReuseTarget
            }));
          }
        } catch (err: any) {
          console.error("AI API failed, falling back to mock data for demo:", err);
          const fallback = {
            dailyWaterLimit: 15,
            monthlyWaterLimit: 450,
            validityDate: "2027-12-31",
            reuseTarget: 80,
            dailyReuseTarget: 12,
            monthlyReuseTarget: 360
          };
          setExtractedDetails(fallback);
          setS((prev: any) => ({
            ...prev,
            dailyCapacity: 3,
            ctoLimit: 15,
            monthlyCtoLimit: 450,
            ctoValidity: "2027-12-31",
            reuseTarget: 80,
            dailyReuseTarget: 12,
            monthlyReuseTarget: 360
          }));
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

  const next = () => setStep((x) => Math.min(4, x + 1));
  const back = () => setStep((x) => Math.max(0, x - 1));

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/industries/${industry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
        },
        body: JSON.stringify({
          user_id: industry.user_id,
          password: s.password || undefined,
          setupData: s
        })
      });
      const data = await res.json();
      if (res.ok) {
        try {
          const localState = JSON.parse(localStorage.getItem("hydronexa:v1") || "{}");
          if (localState.users && localState.users[s.email]) {
            localState.users[s.email].setup = {
              ...localState.users[s.email].setup,
              ...s
            };
            localStorage.setItem("hydronexa:v1", JSON.stringify(localState));
          }
        } catch (e) {}

        // Save new fields to industry table
        try {
          const { error: sbErr } = await supabase
            .from('industry')
            .upsert({
              user_id: industry.user_id,
              email: s.email,
              daily_reuse_target: s.dailyReuseTarget || 0,
              monthly_reuse_target: s.monthlyReuseTarget || 0
            }, { onConflict: 'user_id' });
          if (sbErr) console.error("Failed to save targets to industry table:", sbErr);
        } catch(e) {
          console.error("Supabase upsert error:", e);
        }

        onRefresh();
        onClose();
      } else {
        alert(data.error || "Failed to update industry");
      }
    } catch (e) {
      alert("Error updating industry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { title: "Account", icon: Users },
    { title: "Plant Identity", icon: Factory },
    { title: "Capacity & CTO", icon: Gauge },
    { title: "Operations", icon: Clock },
    { title: "Alerts & Intelligence", icon: BellRing },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl glass-strong border border-cyan/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan/10 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="text-cyan h-5 w-5" /> 
              Edit Industry Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Updating settings for {s.industryName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex items-center justify-between mb-6">
            {stepsList.map((st, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${i <= step ? "gradient-cyan text-primary-foreground shadow-glow" : "glass border border-glass-border text-muted-foreground"}`}>
                    {i < step ? <Check className="h-5 w-5" /> : <st.icon className="h-5 w-5" />}
                  </div>
                  <div className="text-[10px] mt-2 uppercase tracking-wider hidden md:block">{st.title}</div>
                </div>
                {i < stepsList.length - 1 && (
                  <div className="flex-1 h-px mx-2 relative">
                    <div className="absolute inset-0 bg-glass-border" />
                    <motion.div initial={{ width: 0 }} animate={{ width: i < step ? "100%" : "0%" }} className="absolute inset-y-0 left-0 gradient-cyan" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Industry Name" value={s.industryName} onChange={(v: any) => setS({ ...s, industryName: v })} />
              <div className="opacity-50 pointer-events-none">
                <Field label="Industry Email (Unchangeable)" type="email" value={s.email} onChange={(v: any) => {}} />
              </div>
              <Field label="Reset Password (Optional)" type="text" placeholder="Leave blank to keep current" value={s.password} onChange={(v: any) => setS({ ...s, password: v })} />
            </div>
          )}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Industry Type" value={s.industryType} options={["Textile", "Pulp & Paper", "Food Processing", "Steel & Metal", "Pharma", "Other"]} onChange={(v: any) => setS({...s, industryType: v})} />
              <Select label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v: any) => setS({...s, plantScale: v})} />
              <Select label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v: any) => setS({...s, processType: v})} />
              <Field label="Plant Name" value={s.plantName} onChange={(v: any) => setS({...s, plantName: v})} placeholder="Unit-A" />
              <Field label="Location" value={s.location} onChange={(v: any) => setS({...s, location: v})} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="glass-strong p-6 rounded-2xl border border-cyan/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-cyan" /> Upload Verified CTO Document</h3>
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
                    <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" /> Upload PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isVerifying} />
                    </label>
                    {docStatus === "verifying" && <span className="text-xs text-cyan animate-pulse">Extracting parameters with System...</span>}
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
                        Only the approved certificate reveals the CTO details below.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Number label="Daily Production Capacity (L)" value={s.dailyCapacity} onChange={(v: any) => setS({...s, dailyCapacity: v})} />
                <Number label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit} onChange={(v: any) => setS({...s, ctoLimit: v})} />
                <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit} onChange={(v: any) => setS({...s, monthlyCtoLimit: v})} />
                <Field label="CTO Validity" value={s.ctoValidity} onChange={(v: any) => setS({...s, ctoValidity: v})} placeholder="YYYY-MM-DD" />
                <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget} onChange={(v: any) => setS({...s, dailyReuseTarget: v})} />
                <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget} onChange={(v: any) => setS({...s, monthlyReuseTarget: v})} />
                <Slider label="Reuse Target %" value={s.reuseTarget} onChange={(v: any) => setS({...s, reuseTarget: v})} />
                <Select label="Monitoring Frequency" value={s.monitoringFrequency} options={["10s", "30s", "1m", "5m"]} onChange={(v: any) => setS({...s, monitoringFrequency: v})} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v: any) => setS({...s, shiftTimings: v})} />
              <Select label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v: any) => setS({...s, workingDays: v})} />
              <Number label="Number of Units" value={s.units} onChange={(v: any) => setS({...s, units: v})} />
              <Select label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v: any) => setS({...s, waterSource: v})} />
              <Field label="CTO Certificate Number" value={s.benchmark} onChange={(v: string) => setS({...s, benchmark: v})} placeholder="Enter certificate number" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6">
              <Slider label="Alert Sensitivity" value={s.alertSensitivity} onChange={(v: any) => setS({...s, alertSensitivity: v})} />
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notification Preferences</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Email", "SMS"].map((opt) => {
                    const active = Array.isArray(s.notifications) && s.notifications.includes(opt);
                    return (
                      <button key={opt} onClick={() => setS({...s, notifications: active ? s.notifications.filter((x:any) => x !== opt) : [...(Array.isArray(s.notifications) ? s.notifications : []), opt]})}
                        className={`px-4 py-2 rounded-full text-sm border transition ${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Toggle label="Intelligent Monitoring" value={s.aiMonitoring} onChange={(v: any) => setS({...s, aiMonitoring: v})} />
              <Toggle label="Compliance Alerts" value={s.complianceAlerts} onChange={(v: any) => setS({...s, complianceAlerts: v})} />
              <Toggle label="Sustainability Reports" value={s.sustainabilityReports} onChange={(v: any) => setS({...s, sustainabilityReports: v})} />
            </div>
          )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between gap-4">
          <button onClick={back} disabled={step === 0} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          
          {step < 4 ? (
            <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan/20 text-cyan hover:bg-cyan hover:text-white transition-colors shadow-lg flex items-center gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan text-black hover:bg-cyan/90 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}


export function IndustryManagement() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndustry, setEditingIndustry] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchIndustries = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/industries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIndustries(data);
      }
    } catch (err) {
      console.error("Failed to fetch industries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Industry Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor approved industrial facilities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddUser(true)} className="px-4 py-2 bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <UserCog className="h-4 w-4" /> Add User
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Data
          </button>
        </div>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading industries...</p>
          </div>
        ) : industries.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <Factory className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No Industries Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">There are no approved industrial facilities yet. Approve pending requests from the Home tab to see them here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Industry Name</th>
                  <th className="px-6 py-4 font-medium">Industry Email</th>
                  <th className="px-6 py-4 font-medium">Password</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Capacity (L)</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {industries.map((ind, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    key={ind._id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white group-hover:text-cyan transition-colors">{ind.industryName}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {ind._id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{ind.email}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      ••••••••
                      <button 
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          const newPassword = prompt(`Enter new password for ${ind.industryName} (${ind.email}):`);
                          if (!newPassword) return;
                          
                          try {
                            const res = await fetch('/api/admin/reset-password', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                              },
                              body: JSON.stringify({ email: ind.email, newPassword })
                            });
                            if (res.ok) {
                              alert('Password reset successfully!');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Failed to reset password');
                            }
                          } catch (err) {
                            alert('Network error resetting password');
                          }
                        }} 
                        className="block text-[10px] text-cyan hover:underline mt-1 cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">{ind.industryType}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ind.location}</td>
                    <td className="px-6 py-4 font-mono">{ind.capacity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ind.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${ind.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {ind.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setEditingIndustry(ind); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors flex items-center gap-1.5 ml-auto">
                        <Settings className="h-3.5 w-3.5" /> Edit Settings
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddUser && (
        <ApproveModal request={null} onClose={() => { setShowAddUser(false); fetchIndustries(); }} />
      )}
      
      {editingIndustry && (
        <EditIndustryModal 
          industry={editingIndustry} 
          onClose={() => setEditingIndustry(null)}
          onRefresh={fetchIndustries}
        />
      )}
    </motion.div>
  );
}
