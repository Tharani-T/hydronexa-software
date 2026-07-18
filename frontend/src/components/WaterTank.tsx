import { motion } from "framer-motion";

export function WaterTank({ fill = 60, label, status = "ok" }: { fill?: number; label?: string; status?: "ok" | "warn" | "danger" }) {
  const color = status === "ok" ? "var(--cyan)" : status === "warn" ? "var(--warn)" : "var(--danger)";
  return (
    <div className="relative w-full">
      <div className="relative h-44 w-full rounded-2xl glass overflow-hidden border border-glass-border">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${fill}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0"
          style={{
            background: `linear-gradient(180deg, ${color} 0%, color-mix(in oklab, ${color} 60%, transparent) 100%)`,
          }}
        >
          <motion.div 
            className="absolute -top-4 left-[-50%] w-[200%] h-8 opacity-50"
            animate={{ x: ["-25%", "25%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{ 
              background: `radial-gradient(ellipse at center, ${color}, transparent 70%)`,
              borderRadius: "40%"
            }}
          />
          <div className="absolute -top-2 left-0 right-0 h-4 animate-flow"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl font-bold drop-shadow-lg">{fill}%</span>
        </div>
        {/* tick marks */}
        <div className="absolute inset-y-0 left-0 w-1 flex flex-col justify-between py-2">
          {[0,1,2,3,4].map(i => <div key={i} className="h-px w-2 bg-glass-border ml-1" />)}
        </div>
      </div>
      {label && <div className="mt-2 text-sm text-muted-foreground text-center">{label}</div>}
    </div>
  );
}
