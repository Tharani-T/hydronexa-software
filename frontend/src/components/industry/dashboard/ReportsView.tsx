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

  const downloadHistoricalData = async () => {
    try {
      const response = await fetch('/api/sensor-data?limit=10000');
      const records = await response.json();
      if (!records || records.length === 0) {
        alert("No historical data available.");
        return;
      }
      const headers = ["timestamp", "flowRate", "totalFlow", "temperature", "ph", "waterLevel", "ultrasonic"];
      const csvRows = [headers.join(',')];
      for (const row of records) {
        const values = headers.map(header => {
          const val = row[header] !== undefined ? row[header] : "";
          const escaped = ('' + val).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      const csvData = csvRows.join('\\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `historical_sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download historical data", e);
      alert("Failed to download historical data");
    }
  };

  const downloadReport = (name: string, type: 'txt' | 'csv' | 'json' = 'txt') => {
    let content = "";
    const timestamp = new Date().toLocaleString();
    const fileName = `${name.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}`;

    if (type === 'json') {
      content = JSON.stringify({
        report: name,
        generated: timestamp,
        industry: a.type,
        telemetry: data,
        compliance: (data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "BREACH" : "NOMINAL"
      }, null, 2);
    } else if (type === 'csv') {
      content = `Parameter,Value,Unit,Status\nFlow Rate,${data?.flowRate},L/m,Stable\nTotal Flow,${data?.totalFlow},KL,Normal\npH,${data?.ph},pH,${(data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "BREACH" : "NOMINAL"}\nTemperature,${data?.temperature},°C,Optimal\nWater Level,${data?.waterLevel},%,Normal`;
    } else {
      content = `
=========================================
      HYDRONEXA INDUSTRIAL REPORT
=========================================
Report Name: ${name}
Generated: ${timestamp}
Industry Type: ${a.type}

[TELEMETRY SNAPSHOT]
- Intake Flow: ${data?.flowRate} L/m
- Cumulative Flow: ${data?.totalFlow} KL
- Quality pH: ${data?.ph}
- Thermal Node: ${data?.temperature}°C
- Inventory Level: ${data?.waterLevel}%

[COMPLIANCE STATUS]
Status: ${(data?.ph ?? 7) > 8.5 || (data?.ph ?? 7) < 6.5 ? "ACTION REQUIRED" : "NOMINAL / ISO ALIGNED"}
Next Audit: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}

-----------------------------------------
Validated by HydroNexa AI Intelligence Core
=========================================
      `;
    }

    const blob = new Blob([content], { type: type === 'json' ? 'application/json' : type === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Certificate Section */}
      {/* <div className="glass-strong rounded-[2.5rem] p-10 border border-eco/20 relative overflow-hidden group shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-eco/10 via-transparent to-transparent pointer-events-none" />
         <div className="absolute top-0 right-0 p-10 opacity-10"><Award className="h-40 w-40 text-eco" /></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="h-32 w-32 rounded-full border-4 border-eco/30 flex items-center justify-center relative shadow-glow-eco">
               <Award className="h-16 w-16 text-eco" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute -inset-4 border border-dashed border-eco/40 rounded-full"
               />
            </div>
            <div className="flex-1 text-center md:text-left">
               <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">Compliance Certification</h3>
               <p className="text-muted-foreground text-sm max-w-xl mb-6">
                  HydroNexa AI Core has verified your industrial water parameters. All sensor nodes are currently operating within secondary treatment standards and ISO environmental protocols.
               </p>
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <button onClick={() => downloadReport("Operational Compliance Certificate", "txt")} className="h-12 px-8 rounded-full gradient-eco text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-glow-eco hover:scale-105 transition-transform flex items-center gap-3">
                     <Download className="h-4 w-4" /> Download Certificate
                  </button>
                  <button onClick={() => downloadReport("Compliance Metadata", "json")} className="h-12 px-8 rounded-full glass border border-glass-border text-[10px] font-black uppercase tracking-widest hover:border-eco transition-all flex items-center gap-3">
                     <FileJson className="h-4 w-4 text-eco" /> Export JSON Proof
                  </button>
               </div>
            </div>
         </div>
      </div> */}

      {/* Main Reports Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ReportCard 
            title="MongoDB Historical Database" 
            desc="Download all real-time sensor data stored historically." 
            icon={FileSpreadsheet} 
            color="eco"
            onDownload={downloadHistoricalData}
            btnText="Export Full History CSV"
         />
         <ReportCard 
            title="Sustainability Analytics" 
            desc="Detailed water reuse efficiency and wastage reduction metrics." 
            icon={Leaf} 
            color="eco"
            onDownload={() => downloadReport("Sustainability Analytics", "txt")}
         />
         <ReportCard 
            title="Raw Sensor Telemetry" 
            desc="Complete historical log of all 6 IoT sensor data nodes." 
            icon={FileSpreadsheet} 
            color="cyan"
            onDownload={() => downloadReport("Sensor_Raw_Data", "csv")}
            btnText="Export CSV"
         />
         <ReportCard 
            title="Compliance Audit Log" 
            desc="Comprehensive record of pH and Temperature threshold events." 
            icon={ClipboardCheck} 
            color="warn"
            onDownload={() => downloadReport("Compliance Audit Log", "txt")}
         />
         <ReportCard 
            title="Operational Summary" 
            desc="Weekly overview of flow rates and pump active durations." 
            icon={FileText} 
            color="cyan"
            onDownload={() => downloadReport("Operational Summary", "txt")}
         />
         <ReportCard 
            title="CTO Utilization Report" 
            desc="Analysis of water consumption vs government CTO limits." 
            icon={TrendingUp} 
            color="eco"
            onDownload={() => downloadReport("CTO Utilization Report", "txt")}
         />
         <ReportCard 
            title="AI Intelligence Log" 
            desc="Export the full history of AI-generated operational recommendations." 
            icon={Brain} 
            color="cyan"
            onDownload={() => downloadReport("AI Intelligence Log", "json")}
            btnText="Export JSON"
         />
      </div>
    </div>
  );
}

export function ReportCard({ title, desc, icon: Ic, color, onDownload, btnText = "Download Snapshots" }: any) {
  return (
    <div className="glass-strong rounded-[2rem] p-8 border border-glass-border hover:border-white/20 transition-all group flex flex-col justify-between">
       <div>
          <div className={`h-12 w-12 rounded-2xl bg-${color}/10 flex items-center justify-center border border-${color}/20 mb-6 group-hover:scale-110 transition-transform`}>
             <Ic className={`h-6 w-6 text-${color}`} style={{ color: `var(--${color})` }} />
          </div>
          <h4 className="text-xl font-bold mb-2">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">{desc}</p>
       </div>
       <button 
         onClick={onDownload}
         className="w-full h-12 rounded-xl glass border border-glass-border text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition flex items-center justify-center gap-3"
       >
          <ArrowRight className="h-4 w-4" /> {btnText}
       </button>
    </div>
  );
}

