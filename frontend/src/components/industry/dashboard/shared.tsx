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





export function useAdaptive() {
  const { state } = useAppState();
  const s = state.setup;
  const reuseTarget = s.reuseTarget ?? 60;
  const ctoLimit = s.ctoLimit ?? 10000; // Default 10k KL
  const monthlyCtoLimit = s.monthlyCtoLimit ?? (ctoLimit * 30);
  const type = s.industryType ?? "Industrial";
  
  const email = state.currentUserEmail;
  const plantName = s.plantName ?? "Industrial Facility";
  const token = state.token || localStorage.getItem("token");
  
  // Dynamic standards based on industry type
  const standardOptions = {
    Pharma: { tempMax: 25, phRange: "6.8 - 7.4", phMin: 6.8, phMax: 7.4, mode: "Purity Mode" },
    "Food Processing": { tempMax: 10, phRange: "6.5 - 7.5", phMin: 6.5, phMax: 7.5, mode: "Hygiene Mode" },
    Textile: { tempMax: 45, phRange: "6.0 - 9.0", phMin: 6.0, phMax: 9.0, mode: "Dye-Reuse Mode" },
    "Steel & Metal": { tempMax: 60, phRange: "5.5 - 9.5", phMin: 5.5, phMax: 9.5, mode: "Cooling Mode" },
    Industrial: { tempMax: 35, phRange: "6.5 - 8.5", phMin: 6.5, phMax: 8.5, mode: "General Mode" }
  };
  const standards = standardOptions[type as keyof typeof standardOptions] || standardOptions.Industrial;

  return { reuseTarget, ctoLimit, monthlyCtoLimit, type, email, plantName, token, ...standards };
}

export function triggerBuzzer() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(115, ctx.currentTime); // Raspy base
    osc2.type = "square";
    osc2.frequency.setValueAtTime(119, ctx.currentTime);

    // Beep 1
    gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.3);
    
    // Beep 2
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.38);
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime + 0.58);
    gainNode.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.63);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 0.7);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.error("Synthesized buzzer play failed:", e);
  }
}

export function triggerAnalytics5SecHorn() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc2.type = "square";
    osc2.frequency.setValueAtTime(144, ctx.currentTime);

    const duration = 5.2; // Loud warning siren of at least 5 seconds duration
    for (let t = 0; t < duration; t += 0.4) {
      osc1.frequency.setValueAtTime(140, ctx.currentTime + t);
      osc1.frequency.setValueAtTime(160, ctx.currentTime + t + 0.2);
      osc2.frequency.setValueAtTime(144, ctx.currentTime + t);
      osc2.frequency.setValueAtTime(164, ctx.currentTime + t + 0.2);
    }

    gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.28, ctx.currentTime + duration - 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Synthesized analytics wailing horn play failed:", e);
  }
}

export function CountUp({ value, suffix = "", className = "" }: { value: number; suffix?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <div className={className}>{Math.round(display)}{suffix}</div>;
}

export function PredictiveAlert({ title, desc, sev }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border-l-4 bg-${sev}/10 border-${sev}/30`}
      style={{ borderLeftColor: `var(--${sev})` }}
    >
       <div className="font-black text-[10px] uppercase tracking-widest mb-1" style={{ color: `var(--${sev})` }}>{title}</div>
       <div className="text-xs text-muted-foreground font-medium">{desc}</div>
    </motion.div>
  );
}

export function TelemetryRow({ label, status, color }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass border border-glass-border/50">
       <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
       <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${color})` }} />
          <span className="text-[10px] font-black uppercase" style={{ color: `var(--${color})` }}>{status}</span>
       </div>
    </div>
  );
}

export function MiniStat({ label, value, color }: any) {
  return (
    <div className="p-3 rounded-xl glass border border-glass-border">
       <div className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold opacity-50">{label}</div>
       <div className="text-xs font-black font-display tracking-tight mt-0.5" style={{ color: `var(--${color})` }}>{value}</div>
    </div>
  );
}

