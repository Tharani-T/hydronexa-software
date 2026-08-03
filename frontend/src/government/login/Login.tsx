import { useNavigate, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Lock, Building, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAppState } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export function GovLogin() {
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { update } = useAppState();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pw) { setErr("Credentials required"); return; }
    
    setLoading(true);
    setErr("");

    try {
      const { data, error } = await supabase
        .from('government_users')
        .select('*')
        .eq('email', user)
        .eq('password', pw)
        .maybeSingle();

      if (error || !data) {
        setErr("Invalid Government Email or Password.");
        setLoading(false);
        return;
      }

      if (data.status === 'Inactive') {
        setErr("Your account has been deactivated. Please contact the administrator.");
        setLoading(false);
        return;
      }

      update({ govAuthed: true });
      navigate({ to: "/government/dashboard" });
    } catch (err) {
      setErr("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F7FA] text-slate-900">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm p-4 flex justify-between items-center px-6 md:px-8">
        <Logo />
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest hidden sm:block">Department of Environmental Compliance</span>
      </header>

      {/* Main Login Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden z-10">
          
          <div className="p-8 pb-6 border-b border-slate-100 flex flex-col items-center text-center">
            {/* <div className="h-16 w-14 border border-slate-300 rounded-b-full flex flex-col items-center justify-center bg-slate-50 mb-4">
              <Building className="h-7 w-7 text-blue-800" />
            </div> */}
            <h1 className="text-2xl font-bold text-slate-900">Government Officer Sign In</h1>
            <p className="text-sm text-slate-500 mt-2">Secure access for authorized regulatory officers.</p>
          </div>

          <div className="p-8 pt-6">
            <form onSubmit={submit} className="space-y-5" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Government Email Address</label>
                <input 
                  value={user} 
                  onChange={(e) => setUser(e.target.value)} 
                  placeholder="name@gov.in" 
                  autoComplete="off" 
                  name="gov-user"
                  className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors bg-white text-slate-900" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPw ? "text" : "password"} 
                    value={pw} 
                    onChange={(e) => setPw(e.target.value)} 
                    placeholder="Enter your password" 
                    autoComplete="new-password" 
                    name="gov-pass"
                    className="w-full rounded border border-slate-300 px-4 py-2.5 pr-11 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors bg-white text-slate-900" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4" 
                  />
                  <span className="text-sm text-slate-600">Remember this device</span>
                </label>
                <a href="#" className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors">Forgot Password?</a>
              </div>

              {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2.5">{err}</div>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded transition-colors shadow-sm focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Government Sign In"
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-50 p-6 border-t border-slate-200">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-slate-800">Authorized Government Access Only</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This portal is restricted to authorized regulatory officers. All login activities are monitored and recorded.
                </p>
              </div>
            </div>
          </div>

        </div>
        
        {/* Back Link */}
        <div className="mt-8 text-center">
           <Link to="/government" className="text-sm font-medium text-slate-500 hover:text-blue-700 transition-colors flex items-center justify-center gap-1">
             &larr; Back to Portal Home
           </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 bg-white">
        <p>&copy; 2026 HydroNexa Technologies</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-blue-700 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-blue-700 transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-blue-700 transition-colors">Contact Support</a>
        </div>
      </footer>

    </div>
  );
}
