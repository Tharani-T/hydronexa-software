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

import { useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { DashboardOverview } from "./pages/Overview";
import { ContactRequests } from "./pages/ContactRequests";
import { IndustryManagement } from "./pages/IndustryManagement";
import { GovernmentManagement } from "./pages/GovernmentManagement";
import { UserManagement } from "./pages/UserManagement";
import { Reports } from "./pages/Reports";
import { Alerts } from "./pages/Alerts";
import { SystemSettings } from "./pages/SystemSettings";

export function AdminDashboard() {
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
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-300 relative group ${isActive ? "text-cyan" : "text-muted-foreground hover:text-foreground"
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
              {activeTab === "Government Management" && <GovernmentManagement />}
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

