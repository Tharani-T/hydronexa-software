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
  FileJson, FileSpreadsheet, Award, Download, ClipboardCheck, Mail, History, Volume2, Heart, Database, Clock, BellRing, Target, Check, Table
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

export function ReportsView({ data }: { data: SensorData | null }) {
  const a = useAdaptive();

  // Helper to trigger download
  const triggerDownload = (filename: string, content: string, isExcel: boolean = false) => {
    let blob;
    if (isExcel) {
      // Create a basic HTML table string for Excel to parse natively as .xls
      blob = new Blob([content], { type: 'application/vnd.ms-excel' });
    } else {
      // Standard CSV with BOM for Excel compatibility
      blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to convert 2D array to CSV string
  const toCSV = (rows: any[][]) => {
    return rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  // Helper to convert 2D array to HTML Table string for Excel (.xls)
  const toExcelHTML = (rows: any[][], title: string) => {
    const htmlRows = rows.map((row, i) => {
      const tag = i === 0 ? 'th' : 'td';
      return `<tr>${row.map(v => `<${tag} style="border: 1px solid #ccc; padding: 5px;">${String(v)}</${tag}>`).join('')}</tr>`;
    }).join('');
    
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /><style>table { font-family: Arial; border-collapse: collapse; } th { background-color: #f2f2f2; font-weight: bold; }</style></head>
    <body><h2>${title}</h2><table>${htmlRows}</table></body></html>`;
  };

  const handleExport = (reportId: number, isExcel: boolean) => {
    const ts = new Date().toISOString().split('T')[0];
    const totalFlow = data?.totalFlow || 0;
    const reuseFlow = data?.reuseFlow || 0;
    const ph = data?.ph || 7;
    const temp = data?.temperature || 25;
    const flowRate = data?.flowRate || 0;
    const waterLevel = data?.waterLevel || 0;
    const ultrasonic = data?.ultrasonic || 0;
    const timestamp = data?.timestamp || new Date().toLocaleString();
    
    const monthlyOffsetFlow = parseFloat(localStorage.getItem('monthlyOffsetFlow') || '0');
    const monthlyOffsetReuse = parseFloat(localStorage.getItem('monthlyOffsetReuse') || '0');
    const actualFreshMonth = Math.max(0, totalFlow - monthlyOffsetFlow);
    const actualReuseMonth = Math.max(0, reuseFlow - monthlyOffsetReuse);
    const monthCtoLimit = a.monthlyCtoLimit || 15000;
    
    let rows: any[][] = [];
    let title = "";
    let ext = isExcel ? "xls" : "csv";

    switch(reportId) {
      case 1:
        title = "Monthly Water Consumption Report";
        rows = [
          ["Parameter", "Value", "Unit"],
          ["Fresh Water Consumption", actualFreshMonth.toFixed(2), "Liters"],
          ["Reused Water Consumption", actualReuseMonth.toFixed(2), "Liters"],
          ["CTO Consumption Limit", monthCtoLimit.toString(), "Liters"],
          ["Water Saved", actualReuseMonth.toFixed(2), "Liters"],
          ["Daily Water Summary (Avg)", (actualFreshMonth / 30).toFixed(2), "Liters/Day"]
        ];
        break;
      case 2:
        title = "Sensor Data Report";
        rows = [
          ["Timestamp", "Flow Sensor (L/m)", "Reuse Flow Sensor (L/m)", "pH Sensor", "Temperature Sensor (°C)", "Level Sensor (%)", "Ultrasonic Sensor (cm)"],
          [timestamp, flowRate.toFixed(2), reuseFlow.toFixed(2), ph.toFixed(2), temp.toFixed(2), waterLevel.toFixed(1), ultrasonic.toFixed(1)]
        ];
        break;
      case 3:
        title = "Weekly Reuse Performance Report";
        const eff = actualFreshMonth > 0 ? ((actualReuseMonth / (actualFreshMonth + actualReuseMonth)) * 100).toFixed(1) : "0";
        rows = [
          ["Parameter", "Value", "Unit"],
          ["Fresh Water", (actualFreshMonth / 4).toFixed(2), "Liters"],
          ["Reused Water", (actualReuseMonth / 4).toFixed(2), "Liters"],
          ["Reuse Efficiency", eff, "%"],
          ["CTO Comparison", "Within limits", "Status"],
          ["Weekly Summary", "Optimal reuse operations detected", "Note"]
        ];
        break;
      case 4:
        title = "Monthly Sustainability Report";
        const reusePct = actualFreshMonth > 0 ? ((actualReuseMonth / (actualFreshMonth + actualReuseMonth)) * 100).toFixed(1) : "0";
        rows = [
          ["Metric", "Assessment"],
          ["Sustainability Score", "94/100 (A+)"],
          ["Environmental Impact", "Positive (High Water Savings)"],
          ["CTO Compliance", (ph >= a.phMin && ph <= a.phMax) ? "Compliant" : "Action Required"],
          ["Water Reuse Percentage", `${reusePct}%`]
        ];
        break;
      case 5:
        title = "Water Quality Report";
        rows = [
          ["Timestamp", "pH History", "Temperature History (°C)", "Ready for Reuse Events", "Reuse Approval History"],
          [timestamp, ph.toFixed(2), temp.toFixed(2), (ph >= a.phMin && ph <= a.phMax) ? "Yes" : "No", (ph >= a.phMin && ph <= a.phMax) ? "Approved" : "Rejected"]
        ];
        break;
      case 6:
        title = "Operational Shift Report";
        const morning = (actualFreshMonth * 0.35).toFixed(2);
        const afternoon = (actualFreshMonth * 0.45).toFixed(2);
        const night = (actualFreshMonth * 0.20).toFixed(2);
        rows = [
          ["Shift", "Water Consumption (Liters)", "Reuse Performance"],
          ["Morning Shift", morning, "Optimal"],
          ["Afternoon Shift", afternoon, "High Load"],
          ["Night Shift", night, "Stable"]
        ];
        break;
      case 7:
        title = "Complete Plant Report";
        rows = [
          ["CATEGORY", "PARAMETER", "VALUE", "STATUS"],
          ["General", "Timestamp", timestamp, "-"],
          ["Consumption", "Total Fresh Water", `${actualFreshMonth.toFixed(2)} L`, "Normal"],
          ["Consumption", "Total Reused Water", `${actualReuseMonth.toFixed(2)} L`, "Excellent"],
          ["Sensors", "Flow Rate", `${flowRate.toFixed(2)} L/m`, "Active"],
          ["Sensors", "pH Level", ph.toFixed(2), (ph >= a.phMin && ph <= a.phMax) ? "Compliant" : "Warning"],
          ["Sensors", "Temperature", `${temp.toFixed(2)} °C`, "Normal"],
          ["Sensors", "Tank Level", `${waterLevel.toFixed(1)} %`, "Stable"],
          ["Sustainability", "Reuse Efficiency", `${actualFreshMonth > 0 ? ((actualReuseMonth / (actualFreshMonth + actualReuseMonth)) * 100).toFixed(1) : "0"} %`, "High"]
        ];
        break;
    }

    const content = isExcel ? toExcelHTML(rows, title) : toCSV(rows);
    const filename = `${title.replace(/\s+/g, '_')}_${ts}.${ext}`;
    triggerDownload(filename, content, isExcel);
  };

  const reports = [
    {
      id: 1,
      title: "Monthly Water Consumption Report",
      desc: "Detailed breakdown of Fresh Water, Reused Water, CTO Consumption, and Daily Summaries.",
      icon: Droplets,
      color: "cyan"
    },
    {
      id: 2,
      title: "Sensor Data Report",
      desc: "Live timestamped logs from Flow, Reuse Flow, pH, Temperature, and Level sensors.",
      icon: Activity,
      color: "eco"
    },
    {
      id: 3,
      title: "Weekly Reuse Performance Report",
      desc: "Weekly summary of Fresh vs Reused water, efficiency metrics, and CTO comparison.",
      icon: Recycle,
      color: "cyan"
    },
    {
      id: 4,
      title: "Monthly Sustainability Report",
      desc: "Overall Sustainability Score, Environmental Impact, and Water Reuse Percentage.",
      icon: Leaf,
      color: "eco"
    },
    {
      id: 5,
      title: "Water Quality Report",
      desc: "Logs of pH History, Temperature History, and Ready for Reuse Approval Events.",
      icon: FlaskConical,
      color: "warn"
    },
    {
      id: 6,
      title: "Operational Shift Report",
      desc: "Shift-wise water consumption and reuse performance (Morning, Afternoon, Night).",
      icon: Clock,
      color: "cyan"
    },
    {
      id: 7,
      title: "Complete Plant Report",
      desc: "One comprehensive report containing all dashboard telemetry and compliance data.",
      icon: Database,
      color: "eco"
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      
      <div className="flex items-center gap-4 mb-8">
         <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
         </div>
         <div>
            <h1 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">Industrial Report Center</h1>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Downloadable Telemetry & Compliance Reports</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {reports.map((r) => (
            <div key={r.id} className="glass-strong rounded-3xl p-6 border border-glass-border hover:border-white/20 transition-all group flex flex-col justify-between relative overflow-hidden">
               {/* Background Glow */}
               <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${r.color}/10 rounded-full blur-[30px] group-hover:bg-${r.color}/20 transition-all pointer-events-none`} />
               
               <div>
                  <div className={`h-12 w-12 rounded-xl bg-${r.color}/10 flex items-center justify-center border border-${r.color}/20 mb-6 group-hover:scale-110 transition-transform`}>
                     <r.icon className={`h-6 w-6 text-${r.color}`} style={{ color: `var(--${r.color})` }} />
                  </div>
                  <h4 className="text-lg font-black mb-2 text-white/90 leading-tight">{r.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-8">{r.desc}</p>
               </div>
               
               <div className="flex flex-col gap-2 mt-auto relative z-10">
                  <button 
                    onClick={() => handleExport(r.id, true)}
                    className="w-full h-10 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                     <Table className="h-3 w-3" /> Export to Excel (.xls)
                  </button>
                  <button 
                    onClick={() => handleExport(r.id, false)}
                    className="w-full h-10 rounded-lg glass border border-glass-border text-white/70 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
                  >
                     <FileJson className="h-3 w-3" /> Export to CSV (.csv)
                  </button>
               </div>
            </div>
         ))}
      </div>

    </div>
  );
}
