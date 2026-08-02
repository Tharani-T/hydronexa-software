import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Factory, ArrowRight, Droplets, Eye, EyeOff, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/industry/login")({
  component: IndustryLogin,
});

function IndustryLogin() {
  const { loginUser } = useAppState();
  const [industryName, setIndustryName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const [failedAttempts, setFailedAttempts] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!industryName || !email || !pw) { setErr("Please fill all fields."); return; }

    // Support routing mistaken entries to official portal
    if (email === "gov@hydronexa.com") {
      navigate({ to: "/government/login" });
      return;
    }
    
    try {
      await loginUser(email, pw);
      setFailedAttempts(0);
      navigate({ to: "/industry/dashboard" });
    } catch (e: any) {
      setFailedAttempts(prev => prev + 1);
      setErr("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-mesh flex flex-col">
      <Particles count={45} />
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 rounded-full glass-strong flex items-center justify-center mb-4 relative">
              <Factory className="h-8 w-8 text-eco" />
              <span className="absolute inset-0 rounded-full border border-eco animate-ripple" />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-eco">Industry Portal</div>
            <h1 className="text-3xl font-bold mt-2">Industry Access</h1>
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
              Securely log into your environment
            </p>
          </div>

          <form onSubmit={submit} className="glass-strong rounded-3xl p-7 space-y-4 border border-eco/30" autoComplete="off">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Industry Name</label>
              <input type="text" value={industryName} onChange={(e) => setIndustryName(e.target.value)}
                placeholder="Your Industry Name" autoComplete="off" name="ind-login-name"
                className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Industry Email ID</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@industry.com" autoComplete="off" name="ind-login-email"
                className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative mt-1.5">
                <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password" name="ind-login-pw"
                  className="w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-eco transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && failedAttempts < 2 && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{err}</motion.div>
            )}

            {failedAttempts >= 2 && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-xs text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20 space-y-3">
                <p className="leading-relaxed">Your organization does not have an active HydroNexa account. Please contact the HydroNexa team to obtain access credentials.</p>
                <div className="flex gap-2 pt-1">
                  <a href="/#contact" className="flex-1 py-2 text-center rounded-lg bg-red-500/20 hover:bg-red-500/30 transition text-red-300 font-medium border border-red-500/30">
                    Request Access
                  </a>
                  <a href="/#contact" className="flex-1 py-2 text-center rounded-lg bg-red-500/20 hover:bg-red-500/30 transition text-red-300 font-medium border border-red-500/30">
                    Book Demo
                  </a>
                </div>
              </motion.div>
            )}
            
            <button type="submit" className="w-full h-12 mt-2 rounded-full gradient-eco text-primary-foreground font-medium shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition">
              Secure Industry Login <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
             <Link to="/portal" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to portal</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
