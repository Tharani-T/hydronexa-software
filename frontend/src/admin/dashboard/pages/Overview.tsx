import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Users, Factory, ShieldAlert, 
  Settings, LogOut, Search, Bell, Activity, 
  Droplets, AlertTriangle, FileText, CheckCircle, 
  XCircle, ChevronRight, UserCog, Send, Check,
  ChevronLeft, Gauge, Clock, BellRing, CheckCircle2,
  Sparkles, Download, Eye, EyeOff, MapPin, X, Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/lib/store";
import { MOCK_REQUESTS } from "./ContactRequests";
import { TamilNaduComplianceMap } from "@/government/dashboard/overview/TamilNaduComplianceMap";


const MOCK_STATS = [
  { label: "Total Industries", value: "248", icon: Factory, trend: "+12%", color: "text-blue-500" },
  { label: "Active Online", value: "192", icon: Activity, trend: "+5%", color: "text-emerald-500" },
  { label: "Pending Requests", value: "14", icon: Users, trend: "-2%", color: "text-amber-500" },
  { label: "Government Accounts", value: "12", icon: ShieldAlert, trend: "+2", color: "text-purple-500" },
  { label: "Active Gov Accounts", value: "8", icon: ShieldAlert, trend: "+1", color: "text-indigo-500" },
];

const MOCK_CONNECTIONS_DATA = [
  { time: '00:00', connections: 120 },
  { time: '04:00', connections: 98 },
  { time: '08:00', connections: 180 },
  { time: '12:00', connections: 240 },
  { time: '16:00', connections: 250 },
  { time: '20:00', connections: 190 },
  { time: '24:00', connections: 140 },
];

const MOCK_MAP_NODES = [
  { id: 'ind-1', name: 'Apex Manufacturing', region: 'North America', type: 'Textile', status: 'Active', x: 20, y: 30, color: 'bg-blue-500', trend: '+12.4', engagement: '94%' },
  { id: 'ind-2', name: 'Global Chem', region: 'Europe', type: 'Chemical', status: 'Active', x: 70, y: 20, color: 'bg-emerald-500', trend: '+8.1', engagement: '88%' },
  { id: 'ind-3', name: 'SteelWorks Inc', region: 'Asia Pacific', type: 'Manufacturing', status: 'Warning', x: 60, y: 60, color: 'bg-amber-500', trend: '-2.3', engagement: '76%' },
  { id: 'ind-4', name: 'AquaPure Systems', region: 'South America', type: 'Water Treatment', status: 'Critical', x: 30, y: 70, color: 'bg-red-500', trend: '-15.0', engagement: '45%' },
  { id: 'ind-5', name: 'TechFlow', region: 'Middle East', type: 'Electronics', status: 'Active', x: 80, y: 40, color: 'bg-purple-500', trend: '+5.5', engagement: '91%' },
];

function InteractiveMapGraph({ industries = [] }: { industries?: any[] }) {
  const mapNodes = industries.length > 0 ? industries.map((ind, i) => ({
    id: ind._id || `ind-${i}`,
    name: ind.industryName || ind.company || 'Unknown',
    region: ind.location || 'State Region',
    type: ind.industryType || ind.type || 'Unknown Type',
    status: ind.status || 'Active',
    x: 10 + ((i * 137) % 80),
    y: 10 + ((i * 93) % 80),
    color: ind.status === 'Active' ? 'bg-emerald-500' : ind.status === 'Warning' ? 'bg-amber-500' : 'bg-red-500',
    trend: '+0.0',
    engagement: '100%'
  })) : MOCK_MAP_NODES;

  const [selectedNodeId, setSelectedNodeId] = useState(mapNodes[0]?.id);
  
  useEffect(() => {
    if (!mapNodes.find(n => n.id === selectedNodeId) && mapNodes.length > 0) {
      setSelectedNodeId(mapNodes[0].id);
    }
  }, [mapNodes, selectedNodeId]);

  const selectedNode = mapNodes.find(n => n.id === selectedNodeId) || mapNodes[0];

  if (!selectedNode) return <div className="p-8 text-center text-muted-foreground">No industry data available for map.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full min-h-[400px]">
      {/* Map Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 overflow-hidden p-8">
        {/* State Map Shape Background */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" preserveAspectRatio="none">
          <polygon points="30,10 60,5 80,30 90,60 70,90 40,95 10,70 15,30" fill="#111827" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeLinejoin="round" />
          <path d="M40,10 L45,40 L30,60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" strokeDasharray="1 2" />
          <path d="M45,40 L80,50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" strokeDasharray="1 2" />
          <path d="M45,40 L60,85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" strokeDasharray="1 2" />
        </svg>

        {/* Nodes */}
        <div className="absolute inset-0 w-full h-full">
          {mapNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full ${node.color} border-2 border-background shadow-lg transition-transform duration-300 ${isSelected ? 'scale-150 z-10' : 'scale-100 hover:scale-125 z-0'}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1.5 : 1 }}
                whileHover={{ scale: 1.3 }}
              >
                {isSelected && (
                  <span className={`absolute inset-0 rounded-full animate-ping opacity-75 ${node.color}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-full lg:w-[350px] flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 h-full"
          >
            {/* Header Card */}
            <div className="flex items-center gap-4 glass rounded-xl p-4 border border-white/5">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${selectedNode.color} bg-opacity-20`}>
                <Factory className={`h-6 w-6 ${selectedNode.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <h4 className="text-xl font-bold">{selectedNode.region}</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3" /> Industry Intelligence
                </p>
              </div>
            </div>

            {/* Details Card */}
            <div className="glass rounded-xl p-5 border border-white/5 flex-1">
              <div className="text-xs text-cyan uppercase tracking-widest font-bold mb-2">INDUSTRY DETAILS</div>
              <h5 className="text-lg font-semibold mb-4">{selectedNode.name}</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{selectedNode.type}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`text-sm font-bold ${selectedNode.status === 'Active' ? 'text-emerald-500' : selectedNode.status === 'Warning' ? 'text-amber-500' : 'text-red-500'}`}>
                    {selectedNode.status}
                  </span>
                </div>
              </div>

              <button className="text-sm text-cyan hover:text-cyan/80 mt-6 inline-flex items-center gap-2 group transition-colors">
                View Detailed Reports <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Engagement</div>
                <div className="text-2xl font-bold">{selectedNode.engagement}</div>
              </div>
              <div className="glass rounded-xl p-4 border border-white/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Trend Score</div>
                <div className={`text-2xl font-bold ${selectedNode.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                  {selectedNode.trend}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


export function DashboardOverview() {
  const [industries, setIndustries] = useState<any[]>([]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("/api/admin/industries", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIndustries(data);
        }
      } catch (err) {
        console.error("Failed to fetch industries", err);
      }
    };
    fetchIndustries();
  }, []);


  const mapIndustries = useMemo(() => {
    if (!Array.isArray(industries) || industries.length === 0) {
      return [
        { id: "IND-CBE-01", industry_name: "Coimbatore Foundries Ltd", district: "Coimbatore", compliance_status: "Safe", current_cto_consumption: 45, daily_cto_limit: 100, current_reuse_percentage: 65, daily_reuse_target: 60 },
        { id: "IND-MDU-02", industry_name: "Madurai Chemicals Corp", district: "Madurai", compliance_status: "Warning", current_cto_consumption: 75, daily_cto_limit: 100, current_reuse_percentage: 42, daily_reuse_target: 60 },
        { id: "IND-ERD-03", industry_name: "Erode Leather Tanneries", district: "Erode", compliance_status: "Critical", current_cto_consumption: 92, daily_cto_limit: 100, current_reuse_percentage: 30, daily_reuse_target: 60 },
        { id: "IND-CHN-04", industry_name: "Chennai Tech Parks", district: "Chennai", compliance_status: "Safe", current_cto_consumption: 38, daily_cto_limit: 100, current_reuse_percentage: 72, daily_reuse_target: 60 },
        { id: "IND-SLM-05", industry_name: "Salem Steel Processing", district: "Salem", compliance_status: "Safe", current_cto_consumption: 52, daily_cto_limit: 100, current_reuse_percentage: 60, daily_reuse_target: 60 },
        { id: "IND-TRY-06", industry_name: "Trichy Heavy Fabrication", district: "Tiruchirappalli", compliance_status: "Safe", current_cto_consumption: 48, daily_cto_limit: 100, current_reuse_percentage: 68, daily_reuse_target: 60 },
        { id: "IND-TPR-07", industry_name: "Tirupur Knitwear Processing", district: "Tiruppur", compliance_status: "Safe", current_cto_consumption: 41, daily_cto_limit: 100, current_reuse_percentage: 70, daily_reuse_target: 60 }
      ];
    }
    return industries.map((ind, i) => {
      const name = ind.industryName || ind.company || ind.name || ind.plant_name || ('Industry ' + (i + 1));
      const district = ind.location || ind.district || ind.city || 'Chennai';
      const statusRaw = ind.status || ind.compliance_status || 'Safe';
      const compliance_status = statusRaw === 'Active' || statusRaw === 'Safe' ? 'Safe' : statusRaw === 'Warning' ? 'Warning' : 'Critical';
      return {
        id: ind._id || ind.id || ('ind-' + i),
        industry_name: name,
        name: name,
        district: district,
        compliance_status,
        current_cto_consumption: ind.current_cto_consumption ?? ind.consumption ?? 50,
        daily_cto_limit: ind.daily_cto_limit ?? ind.limit ?? 100,
        current_reuse_percentage: ind.current_reuse_percentage ?? ind.reuse ?? 60,
        daily_reuse_target: ind.daily_reuse_target ?? 60,
      };
    });
  }, [industries]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-strong rounded-2xl p-6 border border-white/5 hover:border-cyan/30 transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {/* Pending Contact Requests */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border border-white/5 w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Pending Contact Requests</h3>
            <button className="text-sm text-cyan hover:underline">View All Requests</button>
          </div>
          <div className="space-y-4">
            {MOCK_REQUESTS.map((req) => (
              <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{req.company}</div>
                  <div className="text-xs text-muted-foreground truncate">{req.contact} • {req.type}</div>
                </div>
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {req.date}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full font-medium">
                    {req.status}
                  </span>
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-emerald-400">
                    <Check className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* State Interactive Map */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-white/5 flex flex-col w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">State Industry Network</h3>
              <p className="text-sm text-muted-foreground">Interactive state map of active industries</p>
            </div>
          </div>
          
          <TamilNaduComplianceMap industries={mapIndustries} />
        </motion.div>
      </div>
    </div>
  );
}
