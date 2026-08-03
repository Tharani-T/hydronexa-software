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

export function AIPanel() {
  const insights = [
    { t: "Pharma may exceed CTO limits within 48h", c: "warn", icon: TrendingUp },
    { t: "Textile reuse can improve by 12% with cycle adjustment", c: "cyan", icon: Sparkles },
    { t: "Steel sector water saving opportunity: 4.2 ML/day", c: "eco", icon: TrendingDown },
    { t: "Anomaly detected in Food Processing pH variance", c: "warn", icon: Activity },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="glass-strong rounded-2xl p-6 md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl gradient-cyan flex items-center justify-center"><Brain className="h-5 w-5 text-primary-foreground" /></div>
          <div>
            <div className="font-bold">HydroNexa AI · Predictive Engine</div>
            <div className="text-xs text-muted-foreground">Live model · v3.2 · Confidence 94%</div>
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-xs text-eco"><span className="h-1.5 w-1.5 rounded-full bg-eco animate-pulse" /> Active</div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 border-l-2" style={{ borderLeftColor: `var(--${ins.c})` }}>
              <ins.icon className="h-4 w-4 mt-0.5" style={{ color: `var(--${ins.c})` }} />
              <div className="text-sm">{ins.t}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-strong rounded-2xl p-6">
        <h4 className="font-bold mb-4">Sustainability Score Forecast</h4>
        <div className="text-5xl font-bold text-gradient">82.4</div>
        <div className="text-xs text-muted-foreground">Projected 30-day national score</div>
        <div className="mt-6 space-y-2">
          {["Water Saved", "Reuse Efficiency", "Compliance Adherence"].map((l, i) => (
            <div key={l}>
              <div className="flex justify-between text-xs"><span>{l}</span><span className="text-cyan">{[78, 84, 91][i]}</span></div>
              <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${[78, 84, 91][i]}%` }} className="h-full gradient-cyan" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-strong rounded-2xl p-6">
        <h4 className="font-bold mb-4">Anomaly Heatmap</h4>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 84 }).map((_, i) => {
            const v = Math.random();
            return <div key={i} className="aspect-square rounded-sm" style={{ background: `color-mix(in oklab, var(--${v > 0.85 ? "danger" : v > 0.6 ? "warn" : "cyan"}) ${Math.floor(v * 100)}%, var(--muted))` }} />;
          })}
        </div>
      </div>
    </div>
  );
}


