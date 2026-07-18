import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { Particles } from "@/components/Particles";
import {
  ArrowRight, Cpu, Droplets, Activity, Recycle, ShieldCheck, Brain,
  LineChart, Leaf, Factory, Mail, Phone, MapPin, Github, Twitter, Linkedin,
  CheckCircle2, Zap, Gauge, Waves
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import textileImg from "@/assets/industry-textile.jpg";
import paperImg from "@/assets/industry-paper.jpg";
import foodImg from "@/assets/industry-food.jpg";
import steelImg from "@/assets/industry-steel.jpg";
import pharmaImg from "@/assets/industry-pharma.jpg";
import tharaniImg from "@/assets/team-tharani.jpg";
import sabaImg from "@/assets/team-sabapathi.jpg";
import vmImg from "@/assets/team-vishnum.jpg";
import vkImg from "@/assets/team-vishnuk.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const industries = [
  { name: "Textile", img: textileImg, desc: "Dye-water reuse intelligence and color-effluent monitoring." },
  { name: "Pulp & Paper", img: paperImg, desc: "Process water optimization and BOD/COD compliance." },
  { name: "Food Processing", img: foodImg, desc: "Hygiene-grade water tracking and clean-water efficiency." },
  { name: "Steel & Metal", img: steelImg, desc: "Cooling-water circulation and thermal load analytics." },
  { name: "Pharma", img: pharmaImg, desc: "Purity monitoring, pH-focused alerts and validation." },
];

const features = [
  { icon: Activity, title: "Real-time Monitoring", desc: "Sub-second telemetry across every sensor in your plant." },
  { icon: ShieldCheck, title: "CTO Compliance Tracking", desc: "Live regulatory thresholds with predictive escalation." },
  { icon: Brain, title: "AI Analytics", desc: "Anomaly detection, forecasting and prescriptive insights." },
  { icon: Recycle, title: "Reuse Optimization", desc: "Maximize closed-loop water cycles automatically." },
  { icon: LineChart, title: "Regulatory Monitoring", desc: "Direct uplink to government regulatory portals." },
  { icon: Leaf, title: "Sustainability Insights", desc: "ESG reporting, water-saved metrics and impact scoring." },
];

const team = [
  { name: "Tharani", role: "AI & Analytics", img: tharaniImg, desc: "Driving AI-powered intelligent monitoring systems." },
  { name: "Sabapathi", role: "Dashboard Engineering", img: sabaImg, desc: "Crafting modern industrial dashboard experiences." },
  { name: "Vishnu M", role: "IoT Integration", img: vmImg, desc: "Real-time monitoring workflows & sensor mesh." },
  { name: "Vishnu K", role: "Systems & QA", img: vkImg, desc: "System integration, testing and workflow optimization." },
];

function LandingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setSubmitStatus({ type: "error", msg: "Please fill in all required fields." });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, message })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus({ type: "success", msg: "Your message has been sent successfully!" });
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
      } else {
        setSubmitStatus({ type: "error", msg: data.error || "Failed to send message." });
      }
    } catch (err) {
      console.error(err);
      setSubmitStatus({ type: "error", msg: "An unexpected error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section id="home" className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-15 dark:opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background dark:from-background/30 dark:via-background/60" />
          <div className="absolute inset-0 gradient-mesh opacity-50 dark:opacity-100" />
        </div>
        <Particles count={50} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-cyan/30 text-xs font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-eco animate-pulse" />
              Live · Industrial Water Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
              Transforming<br />
              <span className="text-gradient">Industrial Water</span><br />
              Intelligence
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Real-time AI and IoT powered platform for industrial water monitoring,
              reuse optimization, and CTO compliance management.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/portal" className="group inline-flex items-center gap-2 h-12 px-6 rounded-full gradient-cyan text-primary-foreground font-medium shadow-glow hover:scale-105 transition-transform">
                View Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link to="/onboarding" className="inline-flex items-center gap-2 h-12 px-6 rounded-full glass border border-glass-border font-medium hover:border-cyan transition">
                Book Demo
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-eco" /> ISO 14001 Aligned</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-eco" /> CPCB Compliant</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-eco" /> Edge AI</div>
            </div>
          </motion.div>

          {/* Floating dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-10 gradient-cyan opacity-20 blur-3xl rounded-full" />
            <div className="relative glass-strong rounded-3xl p-6 shadow-elegant animate-float">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-danger" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warn" />
                  <div className="h-2.5 w-2.5 rounded-full bg-eco" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">hydronexa.live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Flow Rate", v: "1,284 L/m", c: "var(--cyan)" },
                  { l: "Reuse %", v: "72.4%", c: "var(--eco)" },
                  { l: "pH Level", v: "7.2", c: "var(--warn)" },
                  { l: "CTO Used", v: "68%", c: "var(--cyan-glow)" },
                ].map((s, i) => (
                  <motion.div
                    key={s.l}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="glass rounded-xl p-3 border border-glass-border"
                  >
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</div>
                    <div className="text-xl font-bold mt-1" style={{ color: s.c }}>{s.v}</div>
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${50 + i * 12}%` }}
                        transition={{ duration: 1.2, delay: 0.7 + i * 0.1 }}
                        className="h-full"
                        style={{ background: s.c }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 glass rounded-xl p-3 h-32 relative overflow-hidden">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Live Water Flow</div>
                <svg viewBox="0 0 300 80" className="w-full h-20">
                  <defs>
                    <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,50 Q30,20 60,40 T120,35 T180,25 T240,40 T300,30 L300,80 L0,80 Z" fill="url(#g1)" />
                  <path d="M0,50 Q30,20 60,40 T120,35 T180,25 T240,40 T300,30" stroke="var(--cyan)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="About HydroNexa" title="Intelligent water ecosystems for modern industry" />
          <p className="max-w-3xl text-lg text-muted-foreground mt-6">
            HydroNexa Technologies builds intelligent industrial water monitoring ecosystems using
            IoT sensors, AI analytics, and compliance intelligence to improve sustainability and
            optimize industrial water reuse.
          </p>
          <div className="grid md:grid-cols-4 gap-5 mt-14">
            {[
              { icon: Factory, k: "120+", l: "Industrial Plants" },
              { icon: Droplets, k: "8.4M L", l: "Water Saved Daily" },
              { icon: Cpu, k: "24/7", l: "AI Monitoring" },
              { icon: Gauge, k: "99.97%", l: "Uptime SLA" },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-cyan/40 transition-all hover:shadow-glow"
              >
                <s.icon className="h-7 w-7 text-cyan mb-3" />
                <div className="text-3xl font-bold font-display">{s.k}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" className="relative py-28 px-4">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative max-w-7xl mx-auto">
          <SectionHeader eyebrow="Industries we serve" title="Built for water-intensive sectors" />
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative h-72 rounded-2xl overflow-hidden glass bg-slate-900 border border-glass-border hover:border-cyan transition-all hover:shadow-glow"
              >
                <img src={ind.img} alt={ind.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent dark:from-background dark:via-background/70" />
                <div className="absolute bottom-0 p-5 text-white">
                  <h3 className="text-xl font-bold font-display drop-shadow-md">{ind.name}</h3>
                  <p className="text-sm text-white/80 mt-1 drop-shadow-md">{ind.desc}</p>
                </div>
                <div className="absolute top-4 right-4 h-8 w-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OVERVIEW / WORKFLOW */}
      <section id="overview" className="relative py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="System Overview" title="How industrial water is monitored, reused & optimized" />
          <div className="mt-14 glass-strong rounded-3xl p-6 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 water-grid opacity-30" />
            <Particles count={20} />
            <div className="relative grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 items-center">
              {[
                { icon: Factory, label: "Factory", status: "ok" },
                { icon: Waves, label: "Pipeline", status: "ok" },
                { icon: Droplets, label: "Tanks", status: "ok" },
                { icon: Cpu, label: "Treatment", status: "warn" },
                { icon: Recycle, label: "Reuse Cycle", status: "ok" },
              ].map((node, i) => (
                <div key={node.label} className="relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="glass rounded-2xl p-5 text-center border border-glass-border relative"
                  >
                    <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-3 ${node.status === "warn" ? "bg-warn/20" : "bg-cyan/20"}`}>
                      <node.icon className={`h-6 w-6 ${node.status === "warn" ? "text-warn" : "text-cyan"}`} />
                    </div>
                    <div className="text-sm font-semibold">{node.label}</div>
                    <div className={`mt-2 inline-flex items-center gap-1 text-[10px] ${node.status === "warn" ? "text-warn" : "text-eco"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${node.status === "warn" ? "bg-warn" : "bg-eco"} animate-pulse`} />
                      {node.status === "warn" ? "pH Moderate" : "Stable"}
                    </div>
                  </motion.div>
                  {i < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 h-px w-6 z-10">
                      <div className="h-px w-full animate-flow" style={{ background: "linear-gradient(90deg, transparent, var(--cyan), transparent)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs">
              <Status color="eco" label="Flow Stable" />
              <Status color="eco" label="Reuse Active" />
              <Status color="warn" label="pH Moderate" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="Platform Features" title="Everything you need, nothing you don't" />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group glass rounded-2xl p-6 hover:border-cyan/40 transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl gradient-cyan flex items-center justify-center mb-4 group-hover:shadow-glow transition">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="relative py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader eyebrow="The team" title="Engineers behind HydroNexa" />
        </div>
        <div className="mt-14 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex gap-6 animate-marquee w-max">
            {[...team, ...team].map((m, i) => (
              <div key={i} className="w-72 shrink-0 glass rounded-2xl p-5 border border-glass-border hover:border-cyan transition-all">
                <div className="relative h-56 rounded-xl overflow-hidden mb-4 bg-slate-900">
                  <img src={m.img} alt={m.name} loading="lazy" className="w-full h-full object-cover opacity-90 dark:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-80" />
                </div>
                <h4 className="font-bold text-lg">{m.name}</h4>
                <div className="text-xs text-cyan mt-0.5">{m.role}</div>
                <p className="text-sm text-muted-foreground mt-2">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionHeader eyebrow="Get in touch" title="Talk to the HydroNexa team" />
          <div className="mt-14 glass-strong rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input 
                label="Your name" 
                placeholder="Jane Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
              <Input 
                label="Work email" 
                placeholder="jane@plant.com" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <Input 
                label="Company" 
                placeholder="Industrial Co." 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
              />
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea 
                  rows={4} 
                  placeholder="Tell us about your plant…" 
                  className="mt-1 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {submitStatus && (
                <div className={`p-4 rounded-xl text-sm border transition-all ${
                  submitStatus.type === "success" 
                    ? "bg-eco/10 border-eco/30 text-eco" 
                    : "bg-danger/10 border-danger/30 text-danger"
                }`}>
                  {submitStatus.msg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-12 rounded-full gradient-cyan text-primary-foreground font-medium shadow-glow hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 transition"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
            <div className="space-y-6">
              <ContactItem icon={Mail} label="Email" value="hello@hydronexa.tech" />
              <ContactItem icon={Phone} label="Phone" value="+91 6422789425" />
              <ContactItem icon={MapPin} label="Location" value="· Coimbatore ·Banglore" />
              <div className="flex gap-3 pt-4">
                {[Twitter, Linkedin, Github].map((Ic, i) => (
                  <a key={i} href="#" className="h-10 w-10 rounded-full glass flex items-center justify-center hover:border-cyan hover:text-cyan transition">
                    <Ic className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-glass-border py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo />
            <p className="text-sm text-muted-foreground mt-4 max-w-md">
              AI-powered industrial water compliance, sustainability, and regulatory intelligence — for a planet that needs every drop.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-3">Platform</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/portal">Portal</Link></li>
              <li><Link to="/onboarding">Book Demo</Link></li>
              <li><a href="#features">Features</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about">About</a></li>
              <li><a href="#team">Team</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-glass-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 HydroNexa Technologies. All rights reserved.</span>
          <span className="flex items-center gap-2"><Leaf className="h-3.5 w-3.5 text-eco" /> Engineered for sustainability.</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan font-medium mb-4">
        <Zap className="h-3.5 w-3.5" /> {eyebrow}
      </div>
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function Status({ color, label }: { color: "eco" | "warn" | "danger"; label: string }) {
  const cls = color === "eco" ? "text-eco bg-eco/10 border-eco/30" : color === "warn" ? "text-warn bg-warn/10 border-warn/30" : "text-danger bg-danger/10 border-danger/30";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-${color} animate-pulse`} style={{ background: `var(--${color})` }} /> {label}
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input {...props} className="mt-1 w-full rounded-xl glass border border-glass-border px-4 py-3 text-sm focus:border-cyan focus:outline-none transition" />
    </div>
  );
}

function ContactItem({ icon: Ic, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-11 w-11 rounded-xl glass flex items-center justify-center border border-glass-border">
        <Ic className="h-5 w-5 text-cyan" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}
