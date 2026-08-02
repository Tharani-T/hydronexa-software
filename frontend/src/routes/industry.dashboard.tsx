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
import { Overview } from "@/components/industry/dashboard/Overview";
import { LiveMonitoring } from "@/components/industry/dashboard/LiveMonitoring";
import { QualityIntelligence } from "@/components/industry/dashboard/QualityIntelligence";

import { StorageIntelligence } from "@/components/industry/dashboard/StorageIntelligence";
import { AlertsView } from "@/components/industry/dashboard/AlertsView";
import { SustainabilityView } from "@/components/industry/dashboard/SustainabilityView";
import { ReportsView } from "@/components/industry/dashboard/ReportsView";
import { SettingsPanel } from "@/components/industry/dashboard/SettingsPanel";

export const Route = createFileRoute("/industry/dashboard")({
  component: IndustryDashboard,
});

const nav = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "monitoring", icon: Activity, label: "Live Monitoring" },
  { id: "analytics", icon: Waves, label: "Water Analytics" },
  { id: "quality", icon: FlaskConical, label: "Quality Intelligence" },

  { id: "alerts", icon: AlertTriangle, label: "Alerts" },
  { id: "sustainability", icon: Leaf, label: "Sustainability" },
  { id: "reports", icon: FileText, label: "Reports" },
  { id: "settings", icon: Settings, label: "Settings" },
];

function IndustryDashboard() {
  const { state, update } = useAppState();
  const navigate = useNavigate();
  const [section, setSection] = useState("overview");

  useEffect(() => {
    if (!state.industryAuthed) navigate({ to: "/industry/login" });
  }, [state.industryAuthed]);

  const s = state.setup;

  const handleLogout = () => {
    update({ industryAuthed: false, currentUserEmail: null });
    navigate({ to: "/industry/login" });
  };

  // Intercept for incomplete setup
  if (!s.completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative z-10 glass-strong rounded-3xl p-10 max-w-md w-full text-center border border-glass-border shadow-2xl">
          <div className="h-20 w-20 mx-auto bg-cyan/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse-glow">
             <Factory className="h-10 w-10 text-cyan" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Setup Required</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Welcome to HydroNexa! Before you can access the real-time water telemetry and analytics, please configure your plant profile.
          </p>
          
          <div className="mt-8 space-y-3">
            <button 
              onClick={() => navigate({ to: "/onboarding" })}
              className="w-full h-12 rounded-full gradient-cyan text-primary-foreground font-semibold shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              Configure Industry Setup <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full h-12 rounded-full glass border border-glass-border text-sm hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const industryAccent = s.industryType === "Pharma" ? "Pharma · Purity Mode"
    : s.industryType === "Steel & Metal" ? "Steel · Cooling Cycle"
    : s.industryType === "Food Processing" ? "Food · Hygiene Mode"
    : s.industryType === "Textile" ? "Textile · Dye-Reuse Mode"
    : "Industrial Mode";

  const { data, history, loading, error } = useThingSpeak();

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground animate-pulse">Connecting to HydroNexa IoT Mesh...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      navItems={nav}
      active={section}
      onNavigate={(id) => setSection(id)}
      accent="eco"
      title={s.plantName ?? "HydroNexa Plant"}
      subtitle={`${industryAccent} · ${s.location ?? "—"}`}
      logoutTo="/industry/login"
    >
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3">
          <AlertTriangle className="h-4 w-4" />
          Real-time telemetry sync failed: {error}. Using last known values.
        </div>
      )}
      {section === "overview" && <Overview data={data} history={history} />}
      {section === "monitoring" && <LiveMonitoring data={data} />}
      {section === "analytics" && <StorageIntelligence data={data} history={history} />}
      {section === "quality" && <QualityIntelligence data={data} />}

      {section === "alerts" && <AlertsView data={data} />}
      {section === "sustainability" && <SustainabilityView data={data} />}
      {section === "reports" && <ReportsView data={data} />}
      {section === "settings" && <SettingsPanel />}
    </DashboardShell>
  );
}

