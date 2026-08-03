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

import { StatusPill } from "@/government/dashboard/components/StatusPill";
import { Mini } from "@/government/dashboard/components/Mini";
import { BarCell } from "@/government/dashboard/components/BarCell";
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";

export function StatCard({ label, value, delta, color, icon: Ic }: any) {
  const c = `var(--${color})`;
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl" style={{ background: c }} />
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Ic className="h-4 w-4" style={{ color: c }} />
      </div>
      <div className="text-3xl font-bold mt-2 font-display">{value}</div>
      <div className="text-xs mt-1" style={{ color: c }}>{delta} vs last week</div>
      {/* Glowing ring */}
      <svg className="absolute bottom-2 right-2 h-12 w-12" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" stroke="var(--glass-border)" strokeWidth="2" fill="none" />
        <motion.circle cx="18" cy="18" r="14" stroke={c} strokeWidth="2" fill="none" strokeDasharray="88" initial={{ strokeDashoffset: 88 }} animate={{ strokeDashoffset: 22 }} transition={{ duration: 1.5 }} strokeLinecap="round" transform="rotate(-90 18 18)" />
      </svg>
    </motion.div>
  );
}


