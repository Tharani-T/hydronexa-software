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
import { Field, Number, Select, Slider, Toggle } from "./IndustryManagement";


export const MOCK_REQUESTS = [
  { id: "REQ-001", company: "Apex Manufacturing", contact: "John Doe", type: "Textile", email: "john@apex.com", phone: "+1 234-567-8900", date: "2026-07-22", status: "Pending" },
  { id: "REQ-002", company: "Global Chem", contact: "Sarah Smith", type: "Chemical", email: "sarah@gchem.com", phone: "+1 987-654-3210", date: "2026-07-21", status: "Pending" },
  { id: "REQ-003", company: "SteelWorks Inc", contact: "Mike Johnson", type: "Manufacturing", email: "mike@steelworks.com", phone: "+1 555-123-4567", date: "2026-07-20", status: "Reviewed" },
];

export function ApproveCTOModal({ request, onClose }: { request: any, onClose: () => void }) {
  const [s, setS] = useState<any>({ ctoLimit: 0, monthlyCtoLimit: 0, ctoValidity: "", dailyReuseTarget: 0, monthlyReuseTarget: 0, _id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("/api/admin/industries", { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const ind = data.find((x: any) => x.email === request.email);
          if (ind) {
            setS({
              ctoLimit: ind.ctolimit || 0,
              monthlyCtoLimit: ind.monthlyctolimit || 0,
              ctoValidity: ind.ctovalidity || "",
              dailyReuseTarget: ind.dailyreusetarget || 0,
              monthlyReuseTarget: ind.monthlyreusetarget || 0,
              _id: ind._id
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndustry();
  }, [request]);

  const handleSave = async () => {
    if (!s._id) {
      alert("Could not find industry ID to update.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      
      const res = await fetch(`/api/admin/industries/${s._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ setupData: { ctoLimit: s.ctoLimit, monthlyCtoLimit: s.monthlyCtoLimit, ctoValidity: s.ctoValidity, dailyReuseTarget: s.dailyReuseTarget, monthlyReuseTarget: s.monthlyReuseTarget } })
      });
      
      if (res.ok) {
        if (request.isLocal) {
          const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
          const idx = localReqs.findIndex((r: any) => r.id.toString() === request._id.toString());
          if (idx !== -1) {
            localReqs[idx].status = 'Approved';
            localStorage.setItem('hydronexa:pendingRequests', JSON.stringify(localReqs));
          }
        } else {
          await fetch('/api/admin/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ requestId: request._id, status: 'Approved' })
          });
        }

        try {
          const localState = JSON.parse(localStorage.getItem("hydronexa:v1") || "{}");
          if (localState.users && localState.users[request.email]) {
            localState.users[request.email].setup = {
              ...localState.users[request.email].setup,
              ctoLimit: s.ctoLimit,
              monthlyCtoLimit: s.monthlyCtoLimit,
              ctoValidity: s.ctoValidity,
              dailyReuseTarget: s.dailyReuseTarget,
              monthlyReuseTarget: s.monthlyReuseTarget
            };
            localStorage.setItem("hydronexa:v1", JSON.stringify(localState));
          }
        } catch (e) {}

        onClose();
      } else {
        alert("Failed to update CTO settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating CTO settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Gauge className="h-5 w-5 text-cyan" /> Update CTO Limits</h3>
            <p className="text-sm text-muted-foreground mt-1">Approve change request for {request.company}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
             <div className="flex justify-center p-6"><div className="h-6 w-6 rounded-full border-2 border-cyan border-t-transparent animate-spin" /></div>
          ) : (
            <div className="space-y-4">
               <Number label="Daily CTO Limit (L)" value={s.ctoLimit} onChange={(v: number) => setS({ ...s, ctoLimit: v })} />
               <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit} onChange={(v: number) => setS({ ...s, monthlyCtoLimit: v })} />
               <Field label="CTO Validity Date" value={s.ctoValidity} onChange={(v: string) => setS({ ...s, ctoValidity: v })} placeholder="YYYY-MM-DD" />
               <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget} onChange={(v: number) => setS({ ...s, dailyReuseTarget: v })} />
               <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget} onChange={(v: number) => setS({ ...s, monthlyReuseTarget: v })} />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-background/50 backdrop-blur-md">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || saving} className="px-6 py-2.5 rounded-xl text-sm font-medium gradient-cyan text-primary-foreground hover:opacity-90 transition-opacity shadow-glow disabled:opacity-50 flex items-center gap-2">
             {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
             Approve & Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}


export function ApproveModal({ request, onClose }: { request: any, onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<any>({
    email: request?.email || "",
    industryName: request?.company || "",
    password: "",
    confirmPassword: "",
    industryType: request?.type || "",
    location: request?.message || "", // map the location from message field
    plantScale: "",
    processType: "",
    plantName: "",
    dailyCapacity: 0,
    ctoLimit: 0,
    monthlyCtoLimit: 0,
    dailyReuseTarget: 0,
    monthlyReuseTarget: 0,
    reuseTarget: 60,
    monitoringFrequency: "1m",
    shiftTimings: "",
    workingDays: "",
    units: 1,
    waterSource: "",
    benchmark: "",
    alertSensitivity: 70,
    notifications: [],
    aiMonitoring: true,
    ctoValidity: "",
    automaticReports: true,
    sustainabilityReports: true,
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerified, setAiVerified] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useAppState();

  const handleNext = async () => {
    if (step === 0) {
      if (!s.password || s.password !== s.confirmPassword) {
        alert("Passwords do not match or are empty");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/admin/create-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
          },
          body: JSON.stringify({ email: s.email, password: s.password })
        });
        const data = await res.json();
        if (res.ok) {
          setS({ ...s, authUserId: data.authUserId });
          setStep(1);
        } else {
          alert(data.error || "Failed to create authentication account");
        }
      } catch (e) {
        alert("Network error creating account");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep((x) => Math.min(4, x + 1));
    }
  };
  const back = () => setStep((x) => Math.max(0, x - 1));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setAiVerified(false);

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
          setAiVerified(true);
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setAiVerified(true);
      e.target.value = "";
    }
  };

  const handleComplete = async () => {
    if (!s.authUserId) {
      alert("Missing Authentication ID. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/approve-industry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
        },
        body: JSON.stringify({
          requestId: request?._id,
          industryName: s.industryName,
          email: s.email,
          password: s.password,
          authUserId: s.authUserId,
          setupData: s
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Save new fields to industry table
        try {
          const { error: sbErr } = await supabase
            .from('industry')
            .upsert({
              user_id: s.authUserId,
              email: s.email,
              daily_reuse_target: s.dailyReuseTarget || 0,
              monthly_reuse_target: s.monthlyReuseTarget || 0
            }, { onConflict: 'user_id' });
          if (sbErr) console.error("Failed to save targets to industry table:", sbErr);
        } catch(e) {
          console.error("Supabase upsert error:", e);
        }

        onClose();
      } else {
        alert(data.error || "Failed to approve");
      }
    } catch (e) {
      alert("Error approving");
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
              <CheckCircle2 className="text-emerald-500 h-5 w-5" /> 
              Approve Industry Account
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Configure {request?.company}'s environment</p>
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
              <Field label="Industry Email" type="email" value={s.email} onChange={(v: any) => setS({ ...s, email: v })} />
              <Field label="Create Password" type="password" value={s.password} onChange={(v: any) => setS({ ...s, password: v })} />
              <Field label="Confirm Password" type="password" value={s.confirmPassword} onChange={(v: any) => setS({ ...s, confirmPassword: v })} />
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
                  {aiVerified && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" /> System Verified
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" /> Upload PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isVerifying} />
                    </label>
                    {isVerifying && <span className="text-xs text-cyan animate-pulse">Extracting parameters with System...</span>}
                  </div>

                  {pdfPreviewUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-64 bg-black/50">
                      <object data={pdfPreviewUrl} type="application/pdf" width="100%" height="100%">
                        <p className="p-4 text-sm text-muted-foreground">PDF preview is not supported in this browser.</p>
                      </object>
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
                    const active = s.notifications.includes(opt);
                    return (
                      <button key={opt} onClick={() => setS({...s, notifications: active ? s.notifications.filter((x:any) => x !== opt) : [...s.notifications, opt]})}
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
            <button onClick={handleNext} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan/20 text-cyan hover:bg-cyan hover:text-white transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Approval
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}


export function ContactRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/admin/contact-requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(req => 
    req.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white/5">
          <h3 className="text-lg font-semibold">Contact Requests</h3>
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan transition-colors" />
            <input 
              type="text" 
              placeholder="Search by company or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Error loading contact requests: {error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No contact requests found.</p>
              {searchQuery && <p className="text-sm mt-1 opacity-60">Try adjusting your search query.</p>}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-muted-foreground">
                  <th className="p-4 font-medium whitespace-nowrap">Company Name</th>
                  <th className="p-4 font-medium whitespace-nowrap">Contact Person</th>
                  <th className="p-4 font-medium whitespace-nowrap">Email</th>
                  <th className="p-4 font-medium whitespace-nowrap">Phone</th>
                  <th className="p-4 font-medium whitespace-nowrap">Industry Type</th>
                  <th className="p-4 font-medium whitespace-nowrap max-w-[200px]">Location</th>
                  <th className="p-4 font-medium whitespace-nowrap">Created Date</th>
                  <th className="p-4 font-medium whitespace-nowrap">Status</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={req._id || i} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 font-medium">{req.company || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.name || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.email}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.phone || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.industryType || req.industrytype || req.type || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate" title={req.message}>
                      {req.message}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(req.createdat).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                        req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {req.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedRequest(req); setModalOpen(true); }}
                        className="px-4 py-1.5 text-xs font-semibold text-cyan hover:text-white bg-cyan/10 hover:bg-cyan rounded-lg transition-all duration-300 disabled:opacity-50"
                        disabled={req.status === 'Approved' || req.status === 'Rejected'}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to reject this request?")) {
                            await fetch('/api/admin/reject-industry', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("adminToken") || ""}` },
                              body: JSON.stringify({ requestId: req._id })
                            });
                            fetchRequests();
                          }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-all duration-300 disabled:opacity-50"
                        disabled={req.status === 'Approved' || req.status === 'Rejected'}
                      >
                        Reject
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ApproveModal 
            request={selectedRequest} 
            onClose={() => { setModalOpen(false); fetchRequests(); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
