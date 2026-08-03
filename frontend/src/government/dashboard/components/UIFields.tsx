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

export function TextField({ label, value, onChange, disabled }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none disabled:opacity-60" />
    </div>
  );
}

export function SelectField({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none appearance-none">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}


export function PresetBtn({ label, onClick }: any) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl glass border border-glass-border text-[10px] font-black uppercase tracking-tighter hover:border-cyan hover:text-cyan transition-all">
       {label}
    </button>
  );
}

