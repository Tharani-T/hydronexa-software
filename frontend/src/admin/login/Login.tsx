import { useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { update } = useAppState();

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("adminToken", data.token);
        (update as any)({ adminAuthed: true });
        navigate({ to: "/admin/dashboard" });
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden gradient-mesh flex flex-col">
      <Particles count={50} />
      
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-24 w-24 rounded-full glass-strong flex items-center justify-center mb-6 relative"
            >
              <ShieldCheck className="h-12 w-12 text-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              <span className="absolute inset-0 rounded-full border border-cyan/40 animate-ripple" />
              <span className="absolute inset-0 rounded-full border border-cyan/20 animate-ripple" style={{ animationDelay: "0.8s" }} />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-cyan" /> Secure Admin Portal Access
            </p>
          </div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleLogin} 
            className="glass-strong rounded-3xl p-8 space-y-6 shadow-2xl shadow-cyan/10 border border-white/10 dark:border-white/5 relative overflow-hidden" 
            autoComplete="off"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Email Address</label>
              <input 
                type="email"
                name="admin_login_email"
                autoComplete="new-password"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email" 
                className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm focus:border-cyan focus:ring-1 focus:ring-cyan/50 focus:outline-none transition-all placeholder:text-muted-foreground/50" 
              />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Password</label>
                <a href="#" className="text-xs text-cyan hover:text-cyan/80 transition-colors" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              </div>
              <div className="relative mt-2">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="admin_login_password"
                  autoComplete="new-password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-sm focus:border-cyan focus:ring-1 focus:ring-cyan/50 focus:outline-none pr-12 transition-all placeholder:text-muted-foreground/50" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-xs text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center relative z-10">
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              className="relative z-10 w-full h-12 rounded-xl bg-gradient-to-r from-cyan to-blue-500 text-white font-semibold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>
          
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
              <ArrowRight className="h-4 w-4 rotate-180" /> Return to Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}