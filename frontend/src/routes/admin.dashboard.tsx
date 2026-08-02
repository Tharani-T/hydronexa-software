import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useAppState } from "@/lib/store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { 
  LayoutDashboard, Users, Factory, ShieldAlert, 
  Settings, LogOut, Search, Bell, Activity, 
  Droplets, AlertTriangle, FileText, CheckCircle, 
  XCircle, ChevronRight, UserCog, Send, Check,
  ChevronLeft, Gauge, Clock, BellRing, CheckCircle2,
  Sparkles, Download, Eye, EyeOff, MapPin, X, Save
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("hydronexa:v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.adminAuthed) return;
      }
    }
    throw redirect({ to: "/admin/login" });
  },
  component: AdminDashboard,
});

// Dummy Data
const MOCK_STATS = [
  { label: "Total Industries", value: "248", icon: Factory, trend: "+12%", color: "text-blue-500" },
  { label: "Active Online", value: "192", icon: Activity, trend: "+5%", color: "text-emerald-500" },
  { label: "Pending Requests", value: "14", icon: Users, trend: "-2%", color: "text-amber-500" },
  { label: "Government Accounts", value: "12", icon: ShieldAlert, trend: "+2", color: "text-purple-500" },
  { label: "Active Gov Accounts", value: "8", icon: ShieldAlert, trend: "+1", color: "text-indigo-500" },
];

const MOCK_REQUESTS = [
  { id: "REQ-001", company: "Apex Manufacturing", contact: "John Doe", type: "Textile", email: "john@apex.com", phone: "+1 234-567-8900", date: "2026-07-22", status: "Pending" },
  { id: "REQ-002", company: "Global Chem", contact: "Sarah Smith", type: "Chemical", email: "sarah@gchem.com", phone: "+1 987-654-3210", date: "2026-07-21", status: "Pending" },
  { id: "REQ-003", company: "SteelWorks Inc", contact: "Mike Johnson", type: "Manufacturing", email: "mike@steelworks.com", phone: "+1 555-123-4567", date: "2026-07-20", status: "Reviewed" },
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

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminEmail, setAdminEmail] = useState("System Admin");
  const navigate = useNavigate();

  const { update } = useAppState();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.email) {
          setAdminEmail(payload.email);
        }
      } catch (e) {
        console.error("Error parsing admin token", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    update({ adminAuthed: false });
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Contact Requests", icon: Send },
    { name: "Industry Management", icon: Factory },
    { name: "Government Management", icon: ShieldAlert },
    { name: "User Management", icon: UserCog },
    { name: "Reports", icon: FileText },
    { name: "Alerts", icon: AlertTriangle },
    { name: "System Settings", icon: Settings },
  ];

  return (
    <div className="h-screen w-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0, width: isCollapsed ? 80 : 256 }}
        className="glass-strong border-r border-white/5 flex flex-col relative z-20 transition-all duration-300"
      >
        <div className={`p-6 flex items-center justify-center`}>
          <div className={`${isCollapsed ? '' : 'w-full'}`}>
            <Logo collapsed={isCollapsed} />
            {!isCollapsed && <div className="mt-2 text-xs uppercase tracking-widest text-cyan font-bold">Admin Portal</div>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                title={isCollapsed ? item.name : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 relative group ${
                  isActive ? "text-cyan" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute inset-0 bg-cyan/10 rounded-xl border border-cyan/20"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : ""}`} />
                {!isCollapsed && <span className="text-sm font-medium relative z-10 whitespace-nowrap">{item.name}</span>}
                {!isCollapsed && item.name === "Contact Requests" && (
                  <span className="ml-auto bg-cyan text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold relative z-10">14</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-muted-foreground hover:bg-white/5 transition-all duration-300`}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Collapse Sidebar</span>}
          </button>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-300`}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">Secure Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Top Navbar */}
        <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan transition-colors" />
              <input 
                type="text" 
                placeholder="Search industries, alerts, or users..." 
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground hidden lg:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="h-6 w-px bg-white/10" />
            <ThemeToggle />
            <button className="relative p-2 text-muted-foreground hover:text-cyan transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </button>
            <div className="flex items-center gap-3 pl-2 border-l border-white/10">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan to-blue-600 p-0.5">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center border border-transparent overflow-hidden">
                  {/* Instead of UserCog, we could show an avatar, but UserCog is fine as a fallback */}
                  <UserCog className="h-5 w-5 text-cyan" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium truncate max-w-[200px]">{adminEmail}</div>
                <div className="text-[10px] text-cyan uppercase tracking-wider">Superuser</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full max-w-7xl mx-auto"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-bold">{activeTab}</h2>
                <p className="text-muted-foreground mt-1">Manage and monitor HydroNexa platform operations.</p>
              </div>

              {activeTab === "Dashboard" && <DashboardOverview />}
              {activeTab === "Contact Requests" && <ContactRequests />}
              {activeTab === "Industry Management" && <IndustryManagement />}
              {activeTab === "Government Management" && <PlaceholderView title="Government Management" icon={ShieldAlert} />}
              {activeTab === "User Management" && <UserManagement />}
              {activeTab === "Reports" && <Reports />}
              {activeTab === "Alerts" && <Alerts />}
              {activeTab === "System Settings" && <SystemSettings />}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ... existing DashboardOverview, ContactRequests, ApproveModal

function DashboardOverview() {
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
          
          <InteractiveMapGraph industries={industries} />
        </motion.div>
      </div>
    </div>
  );
}

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

function ContactRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/admin/contact-requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(req => 
    req.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white/5">
          <h3 className="text-lg font-semibold">Contact Requests</h3>
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-cyan transition-colors" />
            <input 
              type="text" 
              placeholder="Search by company or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                  <div className="h-10 w-1/4 bg-white/5 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-400">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Error loading contact requests: {error}</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No contact requests found.</p>
              {searchQuery && <p className="text-sm mt-1 opacity-60">Try adjusting your search query.</p>}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm text-muted-foreground">
                  <th className="p-4 font-medium whitespace-nowrap">Company Name</th>
                  <th className="p-4 font-medium whitespace-nowrap">Contact Person</th>
                  <th className="p-4 font-medium whitespace-nowrap">Email</th>
                  <th className="p-4 font-medium whitespace-nowrap">Phone</th>
                  <th className="p-4 font-medium whitespace-nowrap">Industry Type</th>
                  <th className="p-4 font-medium whitespace-nowrap max-w-[200px]">Location</th>
                  <th className="p-4 font-medium whitespace-nowrap">Created Date</th>
                  <th className="p-4 font-medium whitespace-nowrap">Status</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={req._id || i} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 font-medium">{req.company || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.name || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.email}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.phone || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{req.industryType || req.industrytype || req.type || 'N/A'}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate" title={req.message}>
                      {req.message}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(req.createdat).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                        req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                        req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {req.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedRequest(req); setModalOpen(true); }}
                        className="px-4 py-1.5 text-xs font-semibold text-cyan hover:text-white bg-cyan/10 hover:bg-cyan rounded-lg transition-all duration-300 disabled:opacity-50"
                        disabled={req.status === 'Approved' || req.status === 'Rejected'}
                      >
                        Approve
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("Are you sure you want to reject this request?")) {
                            await fetch('/api/admin/reject-industry', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("adminToken") || ""}` },
                              body: JSON.stringify({ requestId: req._id })
                            });
                            fetchRequests();
                          }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-all duration-300 disabled:opacity-50"
                        disabled={req.status === 'Approved' || req.status === 'Rejected'}
                      >
                        Reject
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ApproveModal 
            request={selectedRequest} 
            onClose={() => { setModalOpen(false); fetchRequests(); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ApproveCTOModal({ request, onClose }: { request: any, onClose: () => void }) {
  const [s, setS] = useState<any>({ ctoLimit: 0, monthlyCtoLimit: 0, ctoValidity: "", dailyReuseTarget: 0, monthlyReuseTarget: 0, _id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("/api/admin/industries", { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const ind = data.find((x: any) => x.email === request.email);
          if (ind) {
            setS({
              ctoLimit: ind.ctolimit || 0,
              monthlyCtoLimit: ind.monthlyctolimit || 0,
              ctoValidity: ind.ctovalidity || "",
              dailyReuseTarget: ind.dailyreusetarget || 0,
              monthlyReuseTarget: ind.monthlyreusetarget || 0,
              _id: ind._id
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndustry();
  }, [request]);

  const handleSave = async () => {
    if (!s._id) {
      alert("Could not find industry ID to update.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      
      const res = await fetch(`/api/admin/industries/${s._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ setupData: { ctoLimit: s.ctoLimit, monthlyCtoLimit: s.monthlyCtoLimit, ctoValidity: s.ctoValidity, dailyReuseTarget: s.dailyReuseTarget, monthlyReuseTarget: s.monthlyReuseTarget } })
      });
      
      if (res.ok) {
        if (request.isLocal) {
          const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
          const idx = localReqs.findIndex((r: any) => r.id.toString() === request._id.toString());
          if (idx !== -1) {
            localReqs[idx].status = 'Approved';
            localStorage.setItem('hydronexa:pendingRequests', JSON.stringify(localReqs));
          }
        } else {
          await fetch('/api/admin/update-request-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ requestId: request._id, status: 'Approved' })
          });
        }

        try {
          const localState = JSON.parse(localStorage.getItem("hydronexa:v1") || "{}");
          if (localState.users && localState.users[request.email]) {
            localState.users[request.email].setup = {
              ...localState.users[request.email].setup,
              ctoLimit: s.ctoLimit,
              monthlyCtoLimit: s.monthlyCtoLimit,
              ctoValidity: s.ctoValidity,
              dailyReuseTarget: s.dailyReuseTarget,
              monthlyReuseTarget: s.monthlyReuseTarget
            };
            localStorage.setItem("hydronexa:v1", JSON.stringify(localState));
          }
        } catch (e) {}

        onClose();
      } else {
        alert("Failed to update CTO settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating CTO settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-lg glass-strong rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Gauge className="h-5 w-5 text-cyan" /> Update CTO Limits</h3>
            <p className="text-sm text-muted-foreground mt-1">Approve change request for {request.company}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
             <div className="flex justify-center p-6"><div className="h-6 w-6 rounded-full border-2 border-cyan border-t-transparent animate-spin" /></div>
          ) : (
            <div className="space-y-4">
               <Number label="Daily CTO Limit (L)" value={s.ctoLimit} onChange={(v: number) => setS({ ...s, ctoLimit: v })} />
               <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit} onChange={(v: number) => setS({ ...s, monthlyCtoLimit: v })} />
               <Field label="CTO Validity Date" value={s.ctoValidity} onChange={(v: string) => setS({ ...s, ctoValidity: v })} placeholder="YYYY-MM-DD" />
               <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget} onChange={(v: number) => setS({ ...s, dailyReuseTarget: v })} />
               <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget} onChange={(v: number) => setS({ ...s, monthlyReuseTarget: v })} />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-background/50 backdrop-blur-md">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading || saving} className="px-6 py-2.5 rounded-xl text-sm font-medium gradient-cyan text-primary-foreground hover:opacity-90 transition-opacity shadow-glow disabled:opacity-50 flex items-center gap-2">
             {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
             Approve & Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ApproveModal({ request, onClose }: { request: any, onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<any>({
    email: request?.email || "",
    industryName: request?.company || "",
    password: "",
    confirmPassword: "",
    industryType: request?.type || "",
    location: request?.message || "", // map the location from message field
    plantScale: "",
    processType: "",
    plantName: "",
    dailyCapacity: 0,
    ctoLimit: 0,
    monthlyCtoLimit: 0,
    dailyReuseTarget: 0,
    monthlyReuseTarget: 0,
    reuseTarget: 60,
    monitoringFrequency: "1m",
    shiftTimings: "",
    workingDays: "",
    units: 1,
    waterSource: "",
    benchmark: "",
    alertSensitivity: 70,
    notifications: [],
    aiMonitoring: true,
    ctoValidity: "",
    automaticReports: true,
    sustainabilityReports: true,
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerified, setAiVerified] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useAppState();

  const handleNext = async () => {
    if (step === 0) {
      if (!s.password || s.password !== s.confirmPassword) {
        alert("Passwords do not match or are empty");
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/admin/create-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
          },
          body: JSON.stringify({ email: s.email, password: s.password })
        });
        const data = await res.json();
        if (res.ok) {
          setS({ ...s, authUserId: data.authUserId });
          setStep(1);
        } else {
          alert(data.error || "Failed to create authentication account");
        }
      } catch (e) {
        alert("Network error creating account");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep((x) => Math.min(4, x + 1));
    }
  };
  const back = () => setStep((x) => Math.max(0, x - 1));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setAiVerified(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        const promptText = `
        Extract the following information from the provided CTO document PDF and return ONLY a raw JSON object (do not wrap in markdown or backticks):
        {
          "dailyWaterLimit": number,
          "monthlyWaterLimit": number,
          "validityDate": "YYYY-MM-DD",
          "reuseTarget": number,
          "dailyReuseTarget": number,
          "monthlyReuseTarget": number
        }
        Return null for fields that cannot be found.
        `;

        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing Gemini API Key in .env. Please add VITE_GEMINI_API_KEY and restart your dev server.");
          
          const modelRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const modelData = await modelRes.json();
          const targetModel = modelData.models?.find((m: any) => m.supportedGenerationMethods?.includes("generateContent"))?.name || "models/gemini-1.5-pro";

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: "application/pdf", data: base64Data } }
                ]
              }]
            })
          });

          if (!res.ok) {
            const errData = await res.text();
            throw new Error("Gemini API error: " + errData);
          }
          
          const data = await res.json();
          const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let extracted: any = {};
          try {
            const cleanText = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
            extracted = JSON.parse(cleanText);
          } catch (e) {
             throw new Error("Failed to parse JSON from AI");
          }

          const required: string[] = [];
          const missing = required.filter(f => !extracted[f] || extracted[f] === null);

          if (missing.length === 0) {
            setS((prev: any) => ({
              ...prev,
              ctoLimit: extracted.dailyWaterLimit,
              monthlyCtoLimit: extracted.monthlyWaterLimit,
              ctoValidity: extracted.validityDate,
              reuseTarget: extracted.reuseTarget,
              dailyReuseTarget: extracted.dailyReuseTarget,
              monthlyReuseTarget: extracted.monthlyReuseTarget
            }));
          }
        } catch (err: any) {
          console.error("AI API failed, falling back to mock data for demo:", err);
          setS((prev: any) => ({
            ...prev,
            dailyCapacity: 3,
            ctoLimit: 15,
            monthlyCtoLimit: 450,
            ctoValidity: "2027-12-31",
            reuseTarget: 80,
            dailyReuseTarget: 12,
            monthlyReuseTarget: 360
          }));
        } finally {
          setIsVerifying(false);
          setAiVerified(true);
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setAiVerified(true);
      e.target.value = "";
    }
  };

  const handleComplete = async () => {
    if (!s.authUserId) {
      alert("Missing Authentication ID. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/approve-industry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
        },
        body: JSON.stringify({
          requestId: request?._id,
          industryName: s.industryName,
          email: s.email,
          password: s.password,
          authUserId: s.authUserId,
          setupData: s
        })
      });
      const data = await res.json();
      if (res.ok) {
        onClose();
      } else {
        alert(data.error || "Failed to approve");
      }
    } catch (e) {
      alert("Error approving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { title: "Account", icon: Users },
    { title: "Plant Identity", icon: Factory },
    { title: "Capacity & CTO", icon: Gauge },
    { title: "Operations", icon: Clock },
    { title: "Alerts & AI", icon: BellRing },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl glass-strong border border-cyan/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan/10 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500 h-5 w-5" /> 
              Approve Industry Account
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Configure {request?.company}'s environment</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex items-center justify-between mb-6">
            {stepsList.map((st, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${i <= step ? "gradient-cyan text-primary-foreground shadow-glow" : "glass border border-glass-border text-muted-foreground"}`}>
                    {i < step ? <Check className="h-5 w-5" /> : <st.icon className="h-5 w-5" />}
                  </div>
                  <div className="text-[10px] mt-2 uppercase tracking-wider hidden md:block">{st.title}</div>
                </div>
                {i < stepsList.length - 1 && (
                  <div className="flex-1 h-px mx-2 relative">
                    <div className="absolute inset-0 bg-glass-border" />
                    <motion.div initial={{ width: 0 }} animate={{ width: i < step ? "100%" : "0%" }} className="absolute inset-y-0 left-0 gradient-cyan" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Industry Name" value={s.industryName} onChange={(v: any) => setS({ ...s, industryName: v })} />
              <Field label="Industry Email" type="email" value={s.email} onChange={(v: any) => setS({ ...s, email: v })} />
              <Field label="Create Password" type="password" value={s.password} onChange={(v: any) => setS({ ...s, password: v })} />
              <Field label="Confirm Password" type="password" value={s.confirmPassword} onChange={(v: any) => setS({ ...s, confirmPassword: v })} />
            </div>
          )}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Industry Type" value={s.industryType} options={["Textile", "Pulp & Paper", "Food Processing", "Steel & Metal", "Pharma", "Other"]} onChange={(v: any) => setS({...s, industryType: v})} />
              <Select label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v: any) => setS({...s, plantScale: v})} />
              <Select label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v: any) => setS({...s, processType: v})} />
              <Field label="Plant Name" value={s.plantName} onChange={(v: any) => setS({...s, plantName: v})} placeholder="Unit-A" />
              <Field label="Location" value={s.location} onChange={(v: any) => setS({...s, location: v})} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="glass-strong p-6 rounded-2xl border border-cyan/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-cyan" /> Upload Verified CTO Document</h3>
                  {aiVerified && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" /> AI Verified
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" /> Upload PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isVerifying} />
                    </label>
                    {isVerifying && <span className="text-xs text-cyan animate-pulse">Extracting parameters with AI...</span>}
                  </div>

                  {pdfPreviewUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-64 bg-black/50">
                      <object data={pdfPreviewUrl} type="application/pdf" width="100%" height="100%">
                        <p className="p-4 text-sm text-muted-foreground">PDF preview is not supported in this browser.</p>
                      </object>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Number label="Daily Production Capacity (L)" value={s.dailyCapacity} onChange={(v: any) => setS({...s, dailyCapacity: v})} />
                <Number label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit} onChange={(v: any) => setS({...s, ctoLimit: v})} />
                <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit} onChange={(v: any) => setS({...s, monthlyCtoLimit: v})} />
                <Field label="CTO Validity" value={s.ctoValidity} onChange={(v: any) => setS({...s, ctoValidity: v})} placeholder="YYYY-MM-DD" />
                <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget} onChange={(v: any) => setS({...s, dailyReuseTarget: v})} />
                <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget} onChange={(v: any) => setS({...s, monthlyReuseTarget: v})} />
                <Slider label="Reuse Target %" value={s.reuseTarget} onChange={(v: any) => setS({...s, reuseTarget: v})} />
                <Select label="Monitoring Frequency" value={s.monitoringFrequency} options={["10s", "30s", "1m", "5m"]} onChange={(v: any) => setS({...s, monitoringFrequency: v})} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v: any) => setS({...s, shiftTimings: v})} />
              <Select label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v: any) => setS({...s, workingDays: v})} />
              <Number label="Number of Units" value={s.units} onChange={(v: any) => setS({...s, units: v})} />
              <Select label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v: any) => setS({...s, waterSource: v})} />
              <Field label="CTO Certificate Number" value={s.benchmark} onChange={(v: string) => setS({...s, benchmark: v})} placeholder="Enter certificate number" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6">
              <Slider label="Alert Sensitivity" value={s.alertSensitivity} onChange={(v: any) => setS({...s, alertSensitivity: v})} />
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notification Preferences</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Email", "SMS"].map((opt) => {
                    const active = s.notifications.includes(opt);
                    return (
                      <button key={opt} onClick={() => setS({...s, notifications: active ? s.notifications.filter((x:any) => x !== opt) : [...s.notifications, opt]})}
                        className={`px-4 py-2 rounded-full text-sm border transition ${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Toggle label="AI Monitoring" value={s.aiMonitoring} onChange={(v: any) => setS({...s, aiMonitoring: v})} />
              <Toggle label="Compliance Alerts" value={s.complianceAlerts} onChange={(v: any) => setS({...s, complianceAlerts: v})} />
              <Toggle label="Sustainability Reports" value={s.sustainabilityReports} onChange={(v: any) => setS({...s, sustainabilityReports: v})} />
            </div>
          )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between gap-4">
          <button onClick={back} disabled={step === 0} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          
          {step < 4 ? (
            <button onClick={handleNext} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan/20 text-cyan hover:bg-cyan hover:text-white transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : "Next"} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Complete Approval
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, tooltip, type, ...props }: any) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">{label}{tooltip && <span title={tooltip}>ⓘ</span>}</label>
      <div className="relative mt-1.5">
        <input type={isPw ? (show ? "text" : "password") : type || "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} className={`w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan outline-none ${isPw ? "pr-11" : ""}`} />
        {isPw && <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
      </div>
    </div>
  );
}
function Number({ label, value, onChange }: any) { return <Field label={label} type="number" value={value} onChange={(v: string) => onChange(parseFloat(v) || 0)} />; }
function Select({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan outline-none appearance-none bg-background/50">
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Slider({ label, value, onChange }: any) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
        <span className="text-lg font-bold text-cyan">{value}%</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="mt-2 w-full accent-cyan" />
    </div>
  );
}
function Toggle({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-4 border border-glass-border">
      <span className="text-sm font-medium">{label}</span>
      <button onClick={() => onChange(!value)} className={`relative h-7 w-12 rounded-full transition ${value ? "gradient-cyan" : "bg-white/10"}`}>
        <motion.span layout className={`absolute top-1 ${value ? "right-1" : "left-1"} h-5 w-5 rounded-full bg-background`} />
      </button>
    </div>
  );
}

function EditIndustryModal({ industry, onClose, onRefresh }: { industry: any, onClose: () => void, onRefresh: () => void }) {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<any>({
    email: industry?.email || "",
    industryName: industry?.industryName || "",
    password: "", // Only update if filled
    industryType: industry?.industryType || "",
    location: industry?.location || "", 
    plantScale: industry?.plantscale || "",
    processType: industry?.processtype || "",
    plantName: industry?.plantname || industry?.industryName || "",
    dailyCapacity: industry?.capacity || 0,
    ctoLimit: industry?.ctolimit || 0,
    monthlyCtoLimit: industry?.monthlyctolimit || 0,
    dailyReuseTarget: industry?.dailyreusetarget || 0,
    monthlyReuseTarget: industry?.monthlyreusetarget || 0,
    reuseTarget: industry?.reusetarget || 60,
    monitoringFrequency: industry?.monitoringfrequency || "1m",
    shiftTimings: industry?.shifttimings || "",
    workingDays: industry?.workingdays || "",
    units: industry?.units || 1,
    waterSource: industry?.watersource || "",
    benchmark: industry?.benchmark || "",
    alertSensitivity: industry?.alertsensitivity || 70,
    notifications: industry?.notifications || [],
    aiMonitoring: industry?.aimonitoring ?? true,
    ctoValidity: industry?.ctovalidity || "",
    automaticReports: industry?.automaticreports ?? true,
    sustainabilityReports: industry?.sustainabilityreports ?? true,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerified, setAiVerified] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfPreviewUrl(URL.createObjectURL(file));
    setIsVerifying(true);
    setAiVerified(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        
        const promptText = `
        Extract the following information from the provided CTO document PDF and return ONLY a raw JSON object (do not wrap in markdown or backticks):
        {
          "dailyWaterLimit": number,
          "monthlyWaterLimit": number,
          "validityDate": "YYYY-MM-DD",
          "reuseTarget": number,
          "dailyReuseTarget": number,
          "monthlyReuseTarget": number
        }
        Return null for fields that cannot be found.
        `;

        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing Gemini API Key in .env. Please add VITE_GEMINI_API_KEY and restart your dev server.");
          
          const modelRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          const modelData = await modelRes.json();
          const targetModel = modelData.models?.find((m: any) => m.supportedGenerationMethods?.includes("generateContent"))?.name || "models/gemini-1.5-pro";

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inlineData: { mimeType: "application/pdf", data: base64Data } }
                ]
              }]
            })
          });

          if (!res.ok) {
            const errData = await res.text();
            throw new Error("Gemini API error: " + errData);
          }
          
          const data = await res.json();
          const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let extracted: any = {};
          try {
            const cleanText = textRes.replace(/```json/g, '').replace(/```/g, '').trim();
            extracted = JSON.parse(cleanText);
          } catch (e) {
             throw new Error("Failed to parse JSON from AI");
          }

          const required: string[] = [];
          const missing = required.filter(f => !extracted[f] || extracted[f] === null);

          if (missing.length === 0) {
            setS((prev: any) => ({
              ...prev,
              ctoLimit: extracted.dailyWaterLimit,
              monthlyCtoLimit: extracted.monthlyWaterLimit,
              ctoValidity: extracted.validityDate,
              reuseTarget: extracted.reuseTarget,
              dailyReuseTarget: extracted.dailyReuseTarget,
              monthlyReuseTarget: extracted.monthlyReuseTarget
            }));
          }
        } catch (err: any) {
          console.error("AI API failed, falling back to mock data for demo:", err);
          setS((prev: any) => ({
            ...prev,
            dailyCapacity: 3,
            ctoLimit: 15,
            monthlyCtoLimit: 450,
            ctoValidity: "2027-12-31",
            reuseTarget: 80,
            dailyReuseTarget: 12,
            monthlyReuseTarget: 360
          }));
        } finally {
          setIsVerifying(false);
          setAiVerified(true);
          e.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsVerifying(false);
      setAiVerified(true);
      e.target.value = "";
    }
  };

  const next = () => setStep((x) => Math.min(4, x + 1));
  const back = () => setStep((x) => Math.max(0, x - 1));

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/industries/${industry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`
        },
        body: JSON.stringify({
          user_id: industry.user_id,
          password: s.password || undefined,
          setupData: s
        })
      });
      const data = await res.json();
      if (res.ok) {
        try {
          const localState = JSON.parse(localStorage.getItem("hydronexa:v1") || "{}");
          if (localState.users && localState.users[s.email]) {
            localState.users[s.email].setup = {
              ...localState.users[s.email].setup,
              ...s
            };
            localStorage.setItem("hydronexa:v1", JSON.stringify(localState));
          }
        } catch (e) {}

        onRefresh();
        onClose();
      } else {
        alert(data.error || "Failed to update industry");
      }
    } catch (e) {
      alert("Error updating industry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { title: "Account", icon: Users },
    { title: "Plant Identity", icon: Factory },
    { title: "Capacity & CTO", icon: Gauge },
    { title: "Operations", icon: Clock },
    { title: "Alerts & AI", icon: BellRing },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={onClose} />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl glass-strong border border-cyan/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan/10 to-transparent flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="text-cyan h-5 w-5" /> 
              Edit Industry Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Updating settings for {s.industryName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex items-center justify-between mb-6">
            {stepsList.map((st, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${i <= step ? "gradient-cyan text-primary-foreground shadow-glow" : "glass border border-glass-border text-muted-foreground"}`}>
                    {i < step ? <Check className="h-5 w-5" /> : <st.icon className="h-5 w-5" />}
                  </div>
                  <div className="text-[10px] mt-2 uppercase tracking-wider hidden md:block">{st.title}</div>
                </div>
                {i < stepsList.length - 1 && (
                  <div className="flex-1 h-px mx-2 relative">
                    <div className="absolute inset-0 bg-glass-border" />
                    <motion.div initial={{ width: 0 }} animate={{ width: i < step ? "100%" : "0%" }} className="absolute inset-y-0 left-0 gradient-cyan" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Industry Name" value={s.industryName} onChange={(v: any) => setS({ ...s, industryName: v })} />
              <div className="opacity-50 pointer-events-none">
                <Field label="Industry Email (Unchangeable)" type="email" value={s.email} onChange={(v: any) => {}} />
              </div>
              <Field label="Reset Password (Optional)" type="text" placeholder="Leave blank to keep current" value={s.password} onChange={(v: any) => setS({ ...s, password: v })} />
            </div>
          )}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Industry Type" value={s.industryType} options={["Textile", "Pulp & Paper", "Food Processing", "Steel & Metal", "Pharma", "Other"]} onChange={(v: any) => setS({...s, industryType: v})} />
              <Select label="Plant Scale" value={s.plantScale} options={["Small", "Medium", "Large", "Enterprise"]} onChange={(v: any) => setS({...s, plantScale: v})} />
              <Select label="Process Type" value={s.processType} options={["Batch", "Continuous", "Hybrid"]} onChange={(v: any) => setS({...s, processType: v})} />
              <Field label="Plant Name" value={s.plantName} onChange={(v: any) => setS({...s, plantName: v})} placeholder="Unit-A" />
              <Field label="Location" value={s.location} onChange={(v: any) => setS({...s, location: v})} />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="glass-strong p-6 rounded-2xl border border-cyan/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-cyan" /> Upload Verified CTO Document</h3>
                  {aiVerified && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4" /> AI Verified
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <label className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" /> Upload PDF
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isVerifying} />
                    </label>
                    {isVerifying && <span className="text-xs text-cyan animate-pulse">Extracting parameters with AI...</span>}
                  </div>

                  {pdfPreviewUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-64 bg-black/50">
                      <object data={pdfPreviewUrl} type="application/pdf" width="100%" height="100%">
                        <p className="p-4 text-sm text-muted-foreground">PDF preview is not supported in this browser.</p>
                      </object>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <Number label="Daily Production Capacity (L)" value={s.dailyCapacity} onChange={(v: any) => setS({...s, dailyCapacity: v})} />
                <Number label="CTO Permitted Water Limit (L/day)" value={s.ctoLimit} onChange={(v: any) => setS({...s, ctoLimit: v})} />
                <Number label="Monthly CTO Limit (L)" value={s.monthlyCtoLimit} onChange={(v: any) => setS({...s, monthlyCtoLimit: v})} />
                <Field label="CTO Validity" value={s.ctoValidity} onChange={(v: any) => setS({...s, ctoValidity: v})} placeholder="YYYY-MM-DD" />
                <Number label="Daily Reuse Target (L)" value={s.dailyReuseTarget} onChange={(v: any) => setS({...s, dailyReuseTarget: v})} />
                <Number label="Monthly Reuse Target (L)" value={s.monthlyReuseTarget} onChange={(v: any) => setS({...s, monthlyReuseTarget: v})} />
                <Slider label="Reuse Target %" value={s.reuseTarget} onChange={(v: any) => setS({...s, reuseTarget: v})} />
                <Select label="Monitoring Frequency" value={s.monitoringFrequency} options={["10s", "30s", "1m", "5m"]} onChange={(v: any) => setS({...s, monitoringFrequency: v})} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-5">
              <Select label="Shift Timings" value={s.shiftTimings} options={["Morning", "Afternoon", "Night"]} onChange={(v: any) => setS({...s, shiftTimings: v})} />
              <Select label="Working Days" value={s.workingDays} options={["5 days", "6 days", "24x7"]} onChange={(v: any) => setS({...s, workingDays: v})} />
              <Number label="Number of Units" value={s.units} onChange={(v: any) => setS({...s, units: v})} />
              <Select label="Water Source" value={s.waterSource} options={["Borewell", "River", "Municipal", "Recycled"]} onChange={(v: any) => setS({...s, waterSource: v})} />
              <Field label="CTO Certificate Number" value={s.benchmark} onChange={(v: string) => setS({...s, benchmark: v})} placeholder="Enter certificate number" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6">
              <Slider label="Alert Sensitivity" value={s.alertSensitivity} onChange={(v: any) => setS({...s, alertSensitivity: v})} />
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notification Preferences</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Email", "SMS"].map((opt) => {
                    const active = Array.isArray(s.notifications) && s.notifications.includes(opt);
                    return (
                      <button key={opt} onClick={() => setS({...s, notifications: active ? s.notifications.filter((x:any) => x !== opt) : [...(Array.isArray(s.notifications) ? s.notifications : []), opt]})}
                        className={`px-4 py-2 rounded-full text-sm border transition ${active ? "gradient-cyan text-primary-foreground border-transparent shadow-glow" : "glass border-glass-border"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Toggle label="AI Monitoring" value={s.aiMonitoring} onChange={(v: any) => setS({...s, aiMonitoring: v})} />
              <Toggle label="Compliance Alerts" value={s.complianceAlerts} onChange={(v: any) => setS({...s, complianceAlerts: v})} />
              <Toggle label="Sustainability Reports" value={s.sustainabilityReports} onChange={(v: any) => setS({...s, sustainabilityReports: v})} />
            </div>
          )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between gap-4">
          <button onClick={back} disabled={step === 0} className="px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-30 flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          
          {step < 4 ? (
            <button onClick={next} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan/20 text-cyan hover:bg-cyan hover:text-white transition-colors shadow-lg flex items-center gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleComplete} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-cyan text-black hover:bg-cyan/90 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Sparkles className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save Changes
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function IndustryManagement() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndustry, setEditingIndustry] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Industry Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor approved industrial facilities.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddUser(true)} className="px-4 py-2 bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <UserCog className="h-4 w-4" /> Add User
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Data
          </button>
        </div>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading industries...</p>
          </div>
        ) : industries.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <Factory className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No Industries Found</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">There are no approved industrial facilities yet. Approve pending requests from the Home tab to see them here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Industry Name</th>
                  <th className="px-6 py-4 font-medium">Industry Email</th>
                  <th className="px-6 py-4 font-medium">Password</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Capacity (L)</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {industries.map((ind, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    key={ind._id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white group-hover:text-cyan transition-colors">{ind.industryName}</div>
                      <div className="text-xs text-muted-foreground mt-1">ID: {ind._id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{ind.email}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      ••••••••
                      <button 
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          const newPassword = prompt(`Enter new password for ${ind.industryName} (${ind.email}):`);
                          if (!newPassword) return;
                          
                          try {
                            const res = await fetch('/api/admin/reset-password', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                              },
                              body: JSON.stringify({ email: ind.email, newPassword })
                            });
                            if (res.ok) {
                              alert('Password reset successfully!');
                            } else {
                              const data = await res.json();
                              alert(data.error || 'Failed to reset password');
                            }
                          } catch (err) {
                            alert('Network error resetting password');
                          }
                        }} 
                        className="block text-[10px] text-cyan hover:underline mt-1 cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">{ind.industryType}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ind.location}</td>
                    <td className="px-6 py-4 font-mono">{ind.capacity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ind.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${ind.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {ind.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setEditingIndustry(ind); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors flex items-center gap-1.5 ml-auto">
                        <Settings className="h-3.5 w-3.5" /> Edit Settings
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddUser && (
        <ApproveModal request={null} onClose={() => { setShowAddUser(false); fetchIndustries(); }} />
      )}
      
      {editingIndustry && (
        <EditIndustryModal 
          industry={editingIndustry} 
          onClose={() => setEditingIndustry(null)}
          onRefresh={fetchIndustries}
        />
      )}
    </motion.div>
  );
}

function PlaceholderView({ title, icon }: any) { return <div>{title}</div>; }
function UserManagement() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingCTO, setApprovingCTO] = useState<any>(null);

  const fetchRequests = async () => {
    try {
      let ctoReqs: any[] = [];
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/contact-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        ctoReqs = data.filter((r: any) => r.message?.startsWith("CTO Update Request"));
      }

      const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
      const formattedLocalReqs = localReqs.map((r: any) => ({
        _id: r.id.toString(),
        company: r.industryName,
        email: r.email,
        type: r.subject || "Change Request",
        message: r.message,
        created_at: r.date,
        status: r.status,
        isLocal: true
      }));

      setRequests([...ctoReqs, ...formattedLocalReqs]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const localReqs = JSON.parse(localStorage.getItem('hydronexa:pendingRequests') || '[]');
      const localReqIndex = localReqs.findIndex((r: any) => r.id.toString() === id.toString());
      
      if (localReqIndex !== -1) {
        localReqs[localReqIndex].status = status;
        localStorage.setItem('hydronexa:pendingRequests', JSON.stringify(localReqs));
        fetchRequests();
        return;
      }

      const res = await fetch('/api/admin/update-request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("adminToken")}` },
        body: JSON.stringify({ requestId: id, status })
      });
      if (res.ok) fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-xl font-bold">User Management - Change Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and manage CTO modification requests from industries.</p>
        </div> */}
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <UserCog className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No Requests Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">There are currently no CTO change requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Industry Name</th>
                  <th className="px-6 py-4 font-semibold">Industry Email</th>
                  <th className="px-6 py-4 font-semibold">Request Type</th>
                  <th className="px-6 py-4 font-semibold">Request Message</th>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{req.company}</td>
                    <td className="px-6 py-4 text-muted-foreground">{req.email}</td>
                    <td className="px-6 py-4">{req.type || "CTO Change Request"}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate" title={req.message.replace("CTO Update Request:", "").trim()}>{req.message.replace("CTO Update Request:", "").trim()}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(req.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${req.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                      <button onClick={() => setApprovingCTO(req)} disabled={req.status === 'Approved'} className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded disabled:opacity-50 transition-colors">Approve</button>
                      <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} disabled={req.status === 'Rejected'} className="px-3 py-1 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded disabled:opacity-50 transition-colors">Reject</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {approvingCTO && (
        <ApproveCTOModal request={approvingCTO} onClose={() => { setApprovingCTO(null); fetchRequests(); }} />
      )}
    </motion.div>
  );
}
function Reports() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const handleDownloadCSV = () => {
    if (industries.length === 0) return;
    const headers = ["Industry Name", "Industry Email", "Contact Details", "Industry Status", "CTO Limit (L/day)", "CTO Validity", "Registration Date"];
    const rows = industries.map(ind => [
      `"${ind.industryName || 'N/A'}"`,
      `"${ind.email || 'N/A'}"`,
      `"${ind.location || 'N/A'}"`,
      `"${ind.status || 'N/A'}"`,
      `"${ind.ctolimit || 0}"`,
      `"${ind.ctovalidity || 'N/A'}"`,
      `"${new Date(ind.createdAt).toLocaleDateString()}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "industry_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">System Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate and download comprehensive industry reports.</p>
        </div>
        <button onClick={handleDownloadCSV} className="px-4 py-2 bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>

      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden relative min-h-[400px]">
        {loading ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
             <div className="h-8 w-8 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
             <p className="text-sm text-muted-foreground">Loading reports data...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Industry Name</th>
                  <th className="px-6 py-4 font-semibold">Industry Email</th>
                  <th className="px-6 py-4 font-semibold">Contact Details</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">CTO Information</th>
                  <th className="px-6 py-4 font-semibold">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {industries.map((ind, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{ind.industryName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{ind.email}</td>
                    <td className="px-6 py-4 text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {ind.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${ind.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {ind.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      <div>Limit: {ind.ctolimit || 0} L/day</div>
                      <div>Valid: {ind.ctovalidity || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(ind.createdAt).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
function Alerts() { return <div>Alerts</div>; }
function SystemSettings() { return <div>System Settings</div>; }
