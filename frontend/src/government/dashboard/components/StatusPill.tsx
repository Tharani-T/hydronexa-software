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
import { Mini } from "@/government/dashboard/components/Mini";
import { BarCell } from "@/government/dashboard/components/BarCell";
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";

export function StatusPill({ status }: { status: string }) {
  const map: any = { ok: { c: "eco", t: "Stable" }, warn: { c: "warn", t: "Warning" }, danger: { c: "danger", t: "Critical" } };
  const m = map[status];
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold glass border" style={{ borderColor: `var(--${m.c})`, color: `var(--${m.c})` }}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: `var(--${m.c})` }} />{m.t}
    </div>
  );
}


