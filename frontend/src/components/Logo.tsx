import { Hexagon, Droplets } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ size = "md", collapsed }: { size?: "sm" | "md" | "lg", collapsed?: boolean }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`relative ${dim}`}>
        <Hexagon className="absolute inset-0 w-full h-full text-cyan animate-pulse-glow rounded-full" strokeWidth={1.5} />
        <Droplets className="absolute inset-0 m-auto h-1/2 w-1/2 text-cyan-glow" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold ${text} tracking-tight`}>
            Hydro<span className="text-gradient">Nexa</span>
          </span>
          {size !== "sm" && <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Technologies</span>}
        </div>
      )}
    </Link>
  );
}
