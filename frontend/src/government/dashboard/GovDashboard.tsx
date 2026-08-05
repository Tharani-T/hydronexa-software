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

import { Overview } from "@/government/dashboard/overview/Overview";
import { IndustriesView } from "@/government/dashboard/industries/IndustriesView";
import { Compliance, MailCenter } from "@/government/dashboard/compliance/Compliance";
import { Reports } from "@/government/dashboard/reports/Reports";
import { InspectionQueue } from "@/government/dashboard/inspection/InspectionQueue";

import { GovLanguageSelector } from "@/government/dashboard/components/GovLanguageSelector";

export function GovDashboard() {
  const { state } = useAppState();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");

  useEffect(() => {
    if (!state.govAuthed) navigate({ to: "/government/login" });
  }, [state.govAuthed]);

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail) setSection(e.detail);
    };
    window.addEventListener('gov-navigate', handleNav);
    return () => window.removeEventListener('gov-navigate', handleNav);
  }, []);

  return (
    <DashboardShell
      navItems={nav}
      active={section}
      onNavigate={setSection}
      accent="cyan"
      title="Regulatory Command Center"
      subtitle="Real-time Intelligent compliance intelligence"
      logoutTo="/government/login"
      headerRight={<GovLanguageSelector />}
    >
      {section === "overview" && <Overview />}
      {section === "industries" && <IndustriesView />}
      {section === "compliance" && <Compliance />}
      {section === "mail" && <MailCenter />}
      {section === "inspection" && <InspectionQueue />}
      {section === "reports" && <Reports />}
    </DashboardShell>
  );
}

