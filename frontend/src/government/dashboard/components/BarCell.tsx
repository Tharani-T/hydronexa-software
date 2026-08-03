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
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";

export function BarCell({ v, color }: any) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-xs">{v}%</span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full" style={{ width: `${v}%`, background: `var(--${color})` }} />
      </div>
    </div>
  );
}


