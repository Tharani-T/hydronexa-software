import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import {
  LayoutDashboard, Activity, BarChart3, Brain, AlertTriangle, Leaf, FileText, Settings,
  Droplets, Recycle, Gauge, Waves, Factory, Cpu, Sparkles, TrendingUp, Save, ArrowRight, Loader2, Zap,
  RefreshCcw, CheckCircle2, Timer, Wind, ArrowDownCircle, ArrowUpCircle, ShieldCheck,
  FlaskConical, Thermometer, FlaskRound, Info, Beaker, ZapOff, TrendingDown, Calendar,
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check
} from "lucide-react";
import { useThingSpeak, SensorData } from "@/hooks/useThingSpeak";
import { THRESHOLDS } from "@/lib/config";
import { DigitalTwin } from "@/components/DigitalTwin";





import {
  useAdaptive,
  triggerBuzzer,
  triggerAnalytics5SecHorn,
  CountUp,
  PredictiveAlert,
  TelemetryRow,
  MiniStat
} from "./shared";

export function AlertsView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (a.token) {
      fetch('/api/alerts/history', {
        headers: { 'Authorization': `Bearer ${a.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
        setFetching(false);
      })
      .catch(err => {
        console.error('Failed to fetch alert history:', err);
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
  }, [a.token]);

  const alerts = [];
  
  // 1. CTO Limit Exceed Alert
  const ctoUsed = data?.totalFlow ?? 0;
  if (ctoUsed > a.ctoLimit) {
    alerts.push({ 
      t: "CTO Limit Violation", 
      desc: `Total industrial consumption (${ctoUsed.toFixed(1)} KL) has exceeded the government CTO limit of ${a.ctoLimit} KL.`, 
      sev: "danger", 
      action: "Immediate Production Downtime Recommended",
      category: "COMPLIANCE" 
    });
  }

  // 2. Leakage Detection Alert
  if ((data?.flowRate ?? 0) > 25) {
    alerts.push({ 
      t: "Critical Leakage Detected", 
      desc: `Abnormal flow surge of ${(data?.flowRate ?? 0).toFixed(1)} L/m detected in main intake line B-2.`, 
      sev: "danger", 
      action: "Emergency Shutdown of Valve V-102",
      category: "OPERATIONAL" 
    });
  }

  // 3. Overflow Breach Alert
  if ((data?.waterLevel ?? 0) >= 95) {
    alerts.push({ 
      t: "Maximum Capacity Breach", 
      desc: `Tank level has reached critical maximum (${(data?.waterLevel ?? 0).toFixed(0)}%). Overflow is occurring or imminent.`, 
      sev: "danger", 
      action: "Turn OFF Intake Motor Immediately",
      category: "SAFETY" 
    });
  }

  if ((data?.ph ?? 7) > THRESHOLDS.PH_MAX || (data?.ph ?? 7) < THRESHOLDS.PH_MIN) {
    alerts.push({ t: "pH Threshold Violation", desc: `Industrial water quality dropped to ${(data?.ph ?? 0).toFixed(1)} pH`, sev: "danger", action: "Initiate Buffer Dosing", category: "QUALITY" });
  }
  
  if ((data?.temperature ?? 0) > THRESHOLDS.TEMP_MAX) {
    alerts.push({ t: "Thermal Load Breach", desc: `Operational temperature peaked at ${(data?.temperature ?? 0).toFixed(1)}°C`, sev: "warn", action: "Activate Secondary Cooling", category: "QUALITY" });
  }
  if ((data?.waterLevel ?? 100) < THRESHOLDS.LEVEL_MIN) {
    alerts.push({ t: "Inlet Tank Low Level", desc: `Critical water inventory reached: ${(data?.waterLevel ?? 0).toFixed(1)}%`, sev: "warn", action: "Switch to Secondary Source", category: "SAFETY" });
  }

  // Real-Time Overflow Prediction Logic
  const flowRate = data?.flowRate ?? 0;
  const waterLevel = data?.waterLevel ?? 0;
  if (flowRate > 0.5 && waterLevel > 70) {
    const remainingCap = 100 - waterLevel;
    const estMinutes = Math.max(0, Math.round(remainingCap / (flowRate * 0.15))); // Normalized prediction
    if (estMinutes < 15) {
       alerts.push({ 
          t: "Critical Overflow Prediction", 
          desc: `Tank is at ${waterLevel}%. Current intake will cause overflow in approx. ${estMinutes} mins.`, 
          sev: "danger", 
          action: "IMMEDIATE: Shutdown Intake Motor or Reduce Flow by 50%",
          countdown: estMinutes,
          isOverflow: true
       });
    }
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Active Compliance Incidents</div>
              <div className="text-3xl font-black font-display tracking-tight text-danger mt-1">{alerts.length}</div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Requires Immediate Remediation</div>
        </div>

        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent pointer-events-none" />
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">Automated Warning Emails</div>
              <div className="text-3xl font-black font-display tracking-tight text-cyan mt-1">{history.length} Sent</div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Dispatched to Registered SMTP User</div>
        </div>

        <div className="glass-strong rounded-3xl p-6 border border-glass-border relative overflow-hidden flex flex-col justify-between min-h-[140px]">
           <div className="absolute inset-0 bg-gradient-to-br from-eco/5 to-transparent pointer-events-none" />
           <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">System SMTP Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-eco animate-pulse" />
                <span className="text-xl font-black font-display tracking-tight text-eco uppercase">Online</span>
              </div>
           </div>
           <div className="text-[10px] text-muted-foreground font-bold mt-4 uppercase">Telemetry Synced with Govt Node</div>
        </div>
      </div>

      {/* Active Incidents Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 px-2">
          <AlertTriangle className="h-5 w-5 text-danger animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Active Industrial Breaches</span>
        </div>
        
        {alerts.length === 0 ? (
          <div className="glass-strong rounded-3xl p-10 text-center border border-eco/20 bg-eco/5">
            <div className="h-16 w-16 bg-eco/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <CheckCircle2 className="h-8 w-8 text-eco" />
            </div>
            <h3 className="text-lg font-bold text-eco">Industrial Integrity Stable</h3>
            <p className="text-muted-foreground mt-2 text-xs max-w-sm mx-auto">All plant parameters are synchronized with government CTO guidelines and ISO standards.</p>
          </div>
        ) : (
          alerts.map((a, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="glass-strong rounded-[2rem] p-8 flex items-start gap-8 border-l-[6px] relative overflow-hidden group hover:border-r-[6px] transition-all shadow-2xl" 
              style={{ borderLeftColor: `var(--${a.sev})`, borderRightColor: `var(--${a.sev})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-danger/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col items-center gap-4">
                 <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-${a.sev}/20 shadow-glow animate-pulse`}>
                   <AlertTriangle className={`h-8 w-8 text-${a.sev}`} style={{ color: `var(--${a.sev})` }} />
                 </div>
                 {a.isOverflow && (
                    <div className="flex flex-col items-center">
                       <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Time Left</div>
                       <div className="h-12 w-12 rounded-full border-2 border-danger flex items-center justify-center relative">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-2 border-danger rounded-full"
                          />
                          <span className="text-xs font-black text-danger">{a.countdown}m</span>
                       </div>
                    </div>
                 )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-black text-2xl uppercase tracking-tight flex items-center gap-3">
                     {a.t}
                     <div className={`px-2 py-0.5 rounded bg-${a.sev} text-primary-foreground text-[10px] font-black`}>{a.category} BREACH</div>
                  </div>
                  <div className={`text-[10px] font-black px-3 py-1 rounded-full border border-${a.sev}/30 text-${a.sev} bg-${a.sev}/10`} style={{ color: `var(--${a.sev})`, borderColor: `var(--${a.sev})33` }}>SEVERITY: HIGH</div>
                </div>
                
                <div className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">{a.desc}</div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                   <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-cyan/20 flex items-center justify-center border border-cyan/30">
                         <RefreshCcw className="h-5 w-5 text-cyan animate-spin-slow" />
                      </div>
                      <div>
                         <div className="text-[10px] font-black uppercase text-cyan tracking-widest mb-0.5">AI Recommended Action</div>
                         <div className="text-sm font-bold">{a.action}</div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <button className="h-12 px-6 rounded-xl gradient-danger text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-glow-danger hover:scale-105 transition-transform">
                         Shutdown Motor
                      </button>
                      <button className="h-12 w-12 rounded-xl glass border border-glass-border flex items-center justify-center hover:bg-white/10 transition group">
                         <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Compliance Email & Alert History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2 px-2">
          <History className="h-5 w-5 text-cyan animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Compliance Email & Alert History</span>
        </div>

        {fetching ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 text-cyan animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground animate-pulse">Loading compliance monitoring logs...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-strong rounded-3xl p-10 text-center border border-glass-border">
             <Mail className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-4" />
             <h4 className="text-sm font-bold uppercase tracking-widest">No Compliance Alerts Dispatched</h4>
             <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">No CTO limits have been breached. Automated warning history is empty.</p>
          </div>
        ) : (
          <div className="glass-strong rounded-[2rem] overflow-hidden border border-glass-border shadow-2xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-glass-border bg-white/5 text-[9px] uppercase tracking-widest font-black text-muted-foreground">
                         <th className="p-5">Alert Type</th>
                         <th className="p-5">Summary Message</th>
                         <th className="p-5">Dispatched At</th>
                         <th className="p-5">Delivery Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {history.map((h, i) => (
                         <tr key={h._id || i} className="hover:bg-white/5 transition-colors text-xs font-medium">
                            <td className="p-5 flex items-center gap-3">
                               <div className="h-8 w-8 rounded-xl bg-danger/10 flex items-center justify-center border border-danger/20">
                                  <AlertTriangle className="h-4 w-4 text-danger animate-pulse" />
                               </div>
                               <span className="font-bold text-foreground uppercase tracking-tight">{h.alertType}</span>
                            </td>
                            <td className="p-5 text-muted-foreground max-w-sm truncate">{h.message}</td>
                            <td className="p-5 text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</td>
                            <td className="p-5">
                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                 h.deliveryStatus === 'Delivered' ? 'border-eco/30 text-eco bg-eco/5' :
                                 h.deliveryStatus === 'Sent' ? 'border-cyan/30 text-cyan bg-cyan/5' :
                                 'border-danger/30 text-danger bg-danger/5'
                               }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${h.deliveryStatus === 'Failed' ? '' : 'animate-pulse'}`} style={{
                                    background: h.deliveryStatus === 'Delivered' ? 'var(--eco)' : h.deliveryStatus === 'Sent' ? 'var(--cyan)' : 'var(--danger)'
                                  }} />
                                  {h.deliveryStatus}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

