import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/DashboardShell";
import { WaterTank } from "@/components/WaterTank";
import { useAppState } from "@/lib/store";
import {
  LayoutDashboard, Factory, ShieldCheck, AlertTriangle, Brain, Mail, FileText, Settings,
  Send, Sparkles, TrendingUp, TrendingDown, Activity, Terminal, ShieldAlert, Globe, Loader2, CheckCircle2
} from "lucide-react";

import { nav, monitoredIndustries } from '@/government/utils/constants';

import { StatCard } from "@/government/dashboard/components/StatCard";
import { StatusPill } from "@/government/dashboard/components/StatusPill";
import { Mini } from "@/government/dashboard/components/Mini";
import { BarCell } from "@/government/dashboard/components/BarCell";
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";

export function Alerts() {
  const alerts = [
    { t: "CTO Threshold Exceeded", desc: "MetalWorks Steel Co. exceeded 90% CTO limit", sev: "danger", time: "2m ago" },
    { t: "Abnormal Consumption", desc: "Textile Mills Ltd water usage +18% above baseline", sev: "warn", time: "12m ago" },
    { t: "pH Imbalance", desc: "PharmaCare Labs pH dropped to 5.8", sev: "warn", time: "34m ago" },
    { t: "Low Reuse Efficiency", desc: "GreenPaper Industries reuse fell below target", sev: "warn", time: "1h ago" },
    { t: "Compliance Restored", desc: "FreshFoods Processing back within limits", sev: "ok", time: "2h ago" },
  ];
  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
          className="glass-strong rounded-2xl p-5 flex items-start gap-4 border-l-4" style={{ borderLeftColor: `var(--${a.sev})` }}>
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in oklab, var(--${a.sev}) 20%, transparent)` }}>
            <AlertTriangle className="h-5 w-5" style={{ color: `var(--${a.sev})` }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{a.t}</div>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}


