import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, Shield, ArrowRight, ScanLine, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/government/login")({
  component: GovLogin,
});

function GovLogin() {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const { state, update } = useAppState();



  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pw) { setErr("Credentials required"); return; }
    // Add simple validation for demo if needed, or allow any for now
    if (user === "regulator" && pw === "hydronexa2026") {
      update({ govAuthed: true });
      navigate({ to: "/government/dashboard" });
    } else {
      setErr("Invalid regulatory credentials");
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
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 rounded-full glass-strong flex items-center justify-center mb-4 relative">
              <Shield className="h-10 w-10 text-cyan" />
              <span className="absolute inset-0 rounded-full border border-cyan animate-ripple" />
              <span className="absolute inset-0 rounded-full border border-cyan animate-ripple" style={{ animationDelay: "0.6s" }} />
            </div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan">Government Portal</div>
            <h1 className="text-3xl font-bold mt-2">Regulatory Access</h1>
            <p className="text-xs text-warn mt-2 inline-flex items-center gap-1.5"><Lock className="h-3 w-3" /> Authorized Regulatory Access Only</p>
          </div>

          <form onSubmit={submit} className="glass-strong rounded-3xl p-7 space-y-5 border border-cyan/30" autoComplete="off">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Username</label>
              <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="regulator" autoComplete="off" name="gov-user"
                className="mt-1.5 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative mt-1.5">
                <input type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="hydronexa2026" autoComplete="new-password" name="gov-pass"
                  className="w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {err && <div className="text-xs text-danger">{err}</div>}
            <button type="submit" className="w-full h-12 rounded-full gradient-cyan text-primary-foreground font-medium shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition">
              <ScanLine className="h-4 w-4" /> Secure Login <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-[10px] text-center text-muted-foreground">Authorized access only. All sessions are logged & audited.</p>
          </form>
          <div className="mt-6 text-center">
            <Link to="/portal" className="text-sm text-muted-foreground hover:text-foreground">← Back to portal selection</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
