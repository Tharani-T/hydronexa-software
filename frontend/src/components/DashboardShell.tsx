import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppState } from "@/lib/store";
import { ReactNode, useState } from "react";

export function DashboardShell({
  navItems,
  active,
  onNavigate,
  accent = "cyan",
  children,
  title,
  subtitle,
  logoutTo,
  headerRight,
}: {
  navItems: { id: string; label: string; icon: any }[];
  active: string;
  onNavigate: (id: string) => void;
  accent?: "cyan" | "eco";
  children: ReactNode;
  title: string;
  subtitle: string;
  logoutTo: string;
  headerRight?: ReactNode;
}) {
  const { update } = useAppState();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const accentVar = accent === "cyan" ? "var(--cyan)" : "var(--eco)";
  const logout = () => {
    if (logoutTo === "/government/login") update({ govAuthed: false });
    else update({ industryAuthed: false });
    navigate({ to: "/" });
  };
  return (
    <div className={`h-screen overflow-hidden flex bg-background ${logoutTo === "/government/login" ? 'gov-theme' : 'industry-theme'}`}>
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} border-r border-glass-border glass-strong flex-shrink-0 hidden lg:flex flex-col transition-all duration-300`}>
        <div className={`p-5 border-b border-glass-border flex ${isCollapsed ? 'justify-center' : 'justify-start'} overflow-hidden`}>
          <Logo size="sm" collapsed={isCollapsed} />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((it) => {
            const isActive = active === it.id;
            return (
              <button
                key={it.id}
                onClick={() => onNavigate(it.id)}
                title={isCollapsed ? it.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2.5 rounded-xl text-sm transition-all relative ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                {isActive && <span className="absolute inset-0 rounded-xl glass border" style={{ borderColor: accentVar, boxShadow: `0 0 20px ${accentVar}` }} />}
                <it.icon className="h-4 w-4 relative flex-shrink-0" style={isActive ? { color: accentVar } : {}} />
                {!isCollapsed && <span className="relative font-medium whitespace-nowrap overflow-hidden text-ellipsis">{it.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-glass-border flex flex-col gap-2">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition`}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">Collapse </span>}
          </button>
          <button onClick={logout} title={isCollapsed ? "Sign Out" : undefined} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-danger transition`}>
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-glass-border glass flex items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {headerRight}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative h-9 w-9 rounded-full glass border border-glass-border flex items-center justify-center hover:border-cyan transition">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger animate-pulse" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-strong border border-glass-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-glass-border bg-black/20 flex justify-between items-center">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <span className="text-[10px] bg-danger/20 text-danger px-2 py-0.5 rounded-full font-bold">New</span>
                  </div>
                  <div className="max-h-[24rem] overflow-y-auto p-2 space-y-1">
                    {logoutTo === "/government/login" ? (
                      <>
                        <NotificationItem title="Critical Alert: Tata Steel" desc="pH levels exceeded 8.5 continuously for 2 hours." time="10m ago" type="danger" />
                        <NotificationItem title="Reply: Biocon Pharma" desc="Compliance report submitted for recent inspection." time="1h ago" type="cyan" />
                        <NotificationItem title="Warning: Reliance Textiles" desc="Reuse target dropped below 40% threshold." time="2h ago" type="warn" />
                        <NotificationItem title="New Industry Registration" desc="Adani Green Energy pending approval." time="5h ago" type="eco" />
                      </>
                    ) : (
                      <>
                        <NotificationItem title="System Warning" desc="Cooling tower temperature approaching upper limit." time="15m ago" type="warn" />
                        <NotificationItem title="Govt Message" desc="Please update your monthly sustainability report." time="2h ago" type="cyan" />
                        <NotificationItem title="Optimal Efficiency" desc="Water reuse rate has hit the 75% target." time="1d ago" type="eco" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
            <Link to="/" className="h-9 px-4 rounded-full text-xs glass border border-glass-border flex items-center hover:border-cyan transition">Home</Link>
          </div>
        </header>
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}

function NotificationItem({ title, desc, time, type }: any) {
  const color = type === 'danger' ? 'danger' : type === 'warn' ? 'warn' : type === 'eco' ? 'eco' : 'cyan';
  return (
    <div className="p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold" style={{ color: `var(--${color})` }}>{title}</span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{time}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
