import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  FileText, Download, Eye, FileSpreadsheet, X, CheckCircle2, 
  AlertTriangle, AlertOctagon, Activity, MapPin, Sparkles, Droplets, Loader2, BarChart2
} from "lucide-react";

export function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: industries, error } = await supabase.from('industry').select('*');
      if (!error && industries) setData(industries);
      setLoading(false);
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    let fresh = 0, reused = 0, avg = 0;
    let ctoCompliantCount = 0;
    let criticalCount = 0;
    let warningCount = 0;
    const districts: Record<string, { total: number, count: number }> = {};

    if (data.length === 0) return null;

    data.forEach(d => {
      const consumption = Number(d.cto_consumption) || 0;
      const limit = Number(d.cto_limit) || 0;
      const reuse = Number(d.reuse_percent) || 0;
      
      fresh += consumption;
      reused += consumption * (reuse / 100);
      avg += reuse;

      if (consumption <= limit) ctoCompliantCount++;
      if (d.compliance_status === 'Critical') criticalCount++;
      if (d.compliance_status === 'Warning') warningCount++;

      const dist = d.district || 'Unknown';
      if (!districts[dist]) districts[dist] = { total: 0, count: 0 };
      districts[dist].total += reuse;
      districts[dist].count += 1;
    });

    const avgReuse = Math.round(avg / data.length);
    const compliantPercent = (ctoCompliantCount / data.length) * 100;
    const overallScore = Math.round((avgReuse * 0.6) + (compliantPercent * 0.4));

    const districtList = Object.keys(districts).map(k => ({
      name: k,
      avg: Math.round(districts[k].total / districts[k].count)
    })).sort((a, b) => b.avg - a.avg);

    return {
      totalFreshWaterConsumed: Math.round(fresh),
      totalReusedWater: Math.round(reused),
      totalFreshWaterSaved: Math.round(reused),
      avgReuse,
      ctoCompliantCount,
      inspectionRequiredCount: criticalCount, // Usually Critical means inspection
      criticalCount,
      warningCount,
      bestDistrict: districtList[0]?.name || "N/A",
      lowestDistrict: districtList[districtList.length - 1]?.name || "N/A",
      overallScore,
      totalIndustries: data.length
    };
  }, [data]);

  const reportsList = [
    { id: 'daily', name: 'Daily Compliance Report', desc: 'Summary of daily industrial compliance status and anomalies.', status: 'Ready' },
    { id: 'weekly', name: 'Weekly Compliance Report', desc: 'Aggregated weekly metrics and compliance trends.', status: 'Ready' },
    { id: 'monthly', name: 'Monthly Compliance Report', desc: 'Comprehensive monthly compliance review for regulatory reporting.', status: 'Ready' },
    { id: 'cto', name: 'Water Reuse & CTO Analysis Report', desc: 'Detailed analysis of CTO consumption limits vs actual water reuse.', status: 'Ready' },
    { id: 'inspection', name: 'Inspection Report', desc: 'List of industries requiring physical inspection and historical logs.', status: 'Ready' },
    { id: 'environmental', name: 'Environmental Impact Report', desc: 'Executive summary of water savings, reuse efficiency, and overall environmental impact.', status: 'Ready', highlight: true },
  ];

  const handleDownloadCSV = (reportName: string) => {
    let csvContent = "Industry Name,District,Region,CTO Consumption (L),CTO Limit (L),Reuse %,Reuse Target,Compliance Status\n";
    data.forEach(d => {
      csvContent += `"${d.name}","${d.district || 'Unknown'}","${d.region || 'Unknown'}","${d.cto_consumption}","${d.cto_limit}","${d.reuse_percent}","${d.reuse_target}","${d.compliance_status}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = (reportName: string) => {
    let textContent = `${reportName.toUpperCase()}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
    textContent += `HydroNexa Automated Regulatory Report\n--------------------------------------\n\n`;
    
    if (metrics && reportName.includes('Environmental')) {
        textContent += `EXECUTIVE SUMMARY:\nHydroNexa analysis indicates that industrial water reuse has significantly reduced fresh water consumption by ${metrics.totalFreshWaterSaved} L. Most industries remain compliant with CTO regulations, while a small number (${metrics.inspectionRequiredCount}) require inspection and corrective action.\n\n`;
        textContent += `Total Fresh Water Consumed: ${metrics.totalFreshWaterConsumed} L\n`;
        textContent += `Total Reused Water: ${metrics.totalReusedWater} L\n`;
        textContent += `Avg Reuse %: ${metrics.avgReuse}%\n`;
        textContent += `CTO Compliant: ${metrics.ctoCompliantCount} / ${metrics.totalIndustries}\n`;
        textContent += `Inspections Required: ${metrics.inspectionRequiredCount}\n`;
        textContent += `Critical Industries Count: ${metrics.criticalCount}\n`;
        textContent += `Warning Industries Count: ${metrics.warningCount}\n`;
        textContent += `Best Performing District: ${metrics.bestDistrict}\n`;
        textContent += `Lowest Performing District: ${metrics.lowestDistrict}\n`;
        textContent += `Overall Environmental Impact Score: ${metrics.overallScore}/100\n`;
    } else {
        textContent += `DATA EXTRACT:\n\n`;
        data.forEach(d => {
            textContent += `[${d.compliance_status}] ${d.name} (${d.district || 'Unknown'}) | CTO: ${d.cto_consumption}/${d.cto_limit} L | Reuse: ${d.reuse_percent}%\n`;
        });
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Downloading as .txt as it is the most reliable native text format without jspdf
    link.download = `${reportName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-500"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Regulatory Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Generate and view automated compliance and environmental reports.</p>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Report Name & Description</th>
              <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Generated Date</th>
              <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold">Status</th>
              <th className="py-4 px-6 text-xs uppercase tracking-wider text-slate-500 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reportsList.map((report) => (
              <tr key={report.id} className={`border-b border-slate-100 dark:border-slate-800/50 transition-colors ${report.highlight ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                <td className="py-5 px-6">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 rounded-lg p-2 ${report.highlight ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {report.name} 
                        {report.highlight && <span className="text-[10px] uppercase tracking-widest font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">New</span>}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">{report.desc}</div>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
                  <div className="text-xs text-slate-500">Automated System</div>
                </td>
                <td className="py-5 px-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> {report.status}
                  </span>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedReport(report.id)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(report.name)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      title="Download Text Report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadCSV(report.name)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      title="Download CSV"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Preview Panel */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Report Preview</div>
                  <h2 className="text-xl font-bold">{reportsList.find(r => r.id === selectedReport)?.name}</h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-8 space-y-8 flex-1">
                {selectedReport === 'environmental' && metrics ? (
                  <>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles className="h-24 w-24 text-emerald-500" /></div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" /> Executive Summary
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10">
                        HydroNexa analysis indicates that industrial water reuse has significantly reduced fresh water consumption by <strong>{metrics.totalFreshWaterSaved.toLocaleString()} L</strong>. Most industries remain compliant with CTO regulations, while a small number ({metrics.inspectionRequiredCount}) require inspection and corrective action.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> Total Fresh Water Consumed</div>
                        <div className="text-3xl font-black text-blue-600">{metrics.totalFreshWaterConsumed.toLocaleString()} L</div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> Total Reused Water</div>
                        <div className="text-3xl font-black text-emerald-600">{metrics.totalReusedWater.toLocaleString()} L</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Reuse %</div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-200">{metrics.avgReuse}%</div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CTO Compliant</div>
                        <div className="text-2xl font-black text-emerald-600">{metrics.ctoCompliantCount} <span className="text-xs text-slate-500 font-medium">/ {metrics.totalIndustries}</span></div>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inspections Req.</div>
                        <div className="text-2xl font-black text-red-600">{metrics.inspectionRequiredCount}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-slate-400" /> District & Compliance Breakdown
                      </h3>
                      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical Industries Count</span>
                          <span className="font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">{metrics.criticalCount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Warning Industries Count</span>
                          <span className="font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">{metrics.warningCount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-500" /> Best Performing District</span>
                          <span className="font-bold">{metrics.bestDistrict}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-red-500" /> Lowest Performing District</span>
                          <span className="font-bold">{metrics.lowestDistrict}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-indigo-600 text-white rounded-xl p-6 text-center shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-700/50 mix-blend-multiply" />
                      <div className="relative z-10">
                        <div className="text-sm font-bold uppercase tracking-widest text-indigo-200 mb-2">Overall Environmental Impact Score</div>
                        <div className="text-6xl font-black">{metrics.overallScore}<span className="text-3xl text-indigo-300">/100</span></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Report preview not available for this category.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                <button 
                  onClick={() => handleDownloadPDF(reportsList.find(r => r.id === selectedReport)?.name || 'Report')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download Report
                </button>
                <button 
                  onClick={() => handleDownloadCSV(reportsList.find(r => r.id === selectedReport)?.name || 'Report')}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Export CSV
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
