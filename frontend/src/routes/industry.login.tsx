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
  const { state, update, register, loginUser, rawState } = useAppState();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email || !pw) { setErr("Please fill all fields."); return; }

    if (isSignup) {
      if (pw !== confirmPw) { setErr("Passwords do not match."); return; }
      try {
        await register(email, pw);
        setIsSignup(false);
        setPw("");
        setConfirmPw("");
        alert("Account created successfully! Please sign in.");
      } catch (e: any) {
        setErr(e.message || "Failed to create account.");
      }
      return;
    }

    // Support routing mistaken entries to official portal
    if (email === "gov@hydronexa.com") {
      navigate({ to: "/government/login" });
      return;
    }
    
    try {
      await loginUser(email, pw);
      navigate({ to: "/industry/dashboard" });
    } catch (e: any) {
      setErr(e.message || "Invalid credentials.");
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
            <h1 className="text-3xl font-bold mt-2">{isSignup ? "Create Account" : "Industry Access"}</h1>
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
              {isSignup ? "Register your industry email ID" : "Securely log into your environment"}
            </p>
          </div>

          <form onSubmit={submit} className="glass-strong rounded-3xl p-7 space-y-4 border border-eco/30" autoComplete="off">
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

            {isSignup && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</label>
                <input type={showPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password" name="ind-confirm-pw"
                  className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-eco focus:outline-none" />
              </motion.div>
            )}

            {err && <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{err}</motion.div>}
            
            <button type="submit" className="w-full h-12 mt-2 rounded-full gradient-eco text-primary-foreground font-medium shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition">
              {isSignup ? "Create Industry Account" : "Secure Industry Login"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          
          <div className="mt-5 text-center">
            <button 
              onClick={() => { setIsSignup(!isSignup); setErr(""); }} 
              className="text-sm text-cyan hover:underline"
            >
              {isSignup ? "Already have an account? Log In" : "Don't have an account? Create one"}
            </button>
          </div>

          <div className="mt-6 text-center">
             <Link to="/portal" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to portal</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
