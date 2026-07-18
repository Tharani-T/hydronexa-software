import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, Factory, Lock, ArrowRight, AlertTriangle, RefreshCcw } from "lucide-react";
import { useAppState } from "@/lib/store";
import { useState } from "react";

export const Route = createFileRoute("/portal")({
  component: PortalSelect,
});

function PortalSelect() {
  const navigate = useNavigate();
  const { state, resetSetup } = useAppState();
  const [showModal, setShowModal] = useState(false);

  const goIndustry = () => {
    navigate({ to: "/industry/login" });
  };

  const handleReset = () => {
    if (confirm("Reset everything and start a new industry setup?")) {
      resetSetup();
      navigate({ to: "/onboarding" });
    }
  };

  const goGov = () => {
    navigate({ to: "/government/login" });
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-mesh flex flex-col">
      <Particles count={40} />
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan mb-3">Choose your access</div>
          <h1 className="text-4xl md:text-6xl font-bold">Portal Selection</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Select the appropriate portal. Government access is restricted to authorized regulatory officers only.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl w-full">
          <PortalCard
            badge="Regulatory"
            icon={Shield}
            title="Government Portal"
            desc="Monitor industrial compliance, CTO violations, sustainability metrics, and regulatory intelligence in real time."
            cta="Secure Government Access"
            accent="cyan"
            onClick={goGov}
            secure
            delay={0}
          />
          <PortalCard
            badge="Industry"
            icon={Factory}
            title="Industry Portal"
            desc="Track water usage, reuse efficiency, AI insights, and operational compliance monitoring."
            cta="Industry Access"
            accent="eco"
            onClick={goIndustry}
            delay={0.15}
          />
        </div>

        <div className="mt-12 flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">← Back to Home</Link>
          <button onClick={handleReset} className="text-sm text-danger/70 hover:text-danger transition flex items-center gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" /> Reset Industry Setup
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-strong rounded-3xl p-8 max-w-md text-center border border-warn/40">
            <div className="mx-auto h-14 w-14 rounded-full bg-warn/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-warn" />
            </div>
            <h3 className="text-xl font-bold">Setup Required</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please complete your Industry Setup before accessing the dashboard.
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-full glass border border-glass-border text-sm">Cancel</button>
              <Link to="/onboarding" className="px-5 py-2.5 rounded-full gradient-cyan text-primary-foreground text-sm font-medium shadow-glow">Go To Setup</Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PortalCard({ badge, icon: Ic, title, desc, cta, accent, to, onClick, secure, delay }: any) {
  const accentVar = accent === "cyan" ? "var(--cyan)" : "var(--eco)";
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -6 }}
      className="group relative h-full glass-strong rounded-3xl p-8 border border-glass-border hover:border-cyan transition-all overflow-hidden cursor-pointer"
    >
      <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-30 group-hover:opacity-60 transition-opacity blur-3xl" style={{ background: accentVar }} />
      {secure && (
        <div className="absolute top-6 right-6 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-cyan">
          <Lock className="h-3 w-3" /> Secured
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{badge}</div>
      <div className="mt-6 h-16 w-16 rounded-2xl flex items-center justify-center mb-6 relative" style={{ background: `color-mix(in oklab, ${accentVar} 20%, transparent)` }}>
        <Ic className="h-8 w-8" style={{ color: accentVar }} />
        <span className="absolute inset-0 rounded-2xl border animate-ripple" style={{ borderColor: accentVar }} />
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm group-hover:shadow-glow transition" style={{ background: accentVar, color: "var(--primary-foreground)" }}>
        {cta} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
      </div>
    </motion.div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return <button onClick={onClick} className="text-left">{inner}</button>;
}
