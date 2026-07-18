import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#industries", label: "Industries" },
  { href: "#overview", label: "Overview" },
  { href: "#features", label: "Features" },
  { href: "#team", label: "Team" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}>
      <div className={`mx-auto max-w-7xl px-4 transition-all ${scrolled ? "" : ""}`}>
        <nav className={`glass rounded-2xl px-4 md:px-6 py-3 flex items-center justify-between transition-all ${scrolled ? "shadow-elegant" : ""}`}>
          <Logo />
          <div className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <a key={l.href} href={l.href} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                {l.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px gradient-cyan group-hover:w-3/4 transition-all" />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/portal" className="hidden md:inline-flex h-9 px-4 rounded-full text-sm font-medium glass border border-cyan/30 hover:border-cyan items-center transition-all hover:shadow-glow">
              View Dashboard
            </Link>
            <Link to="/onboarding" className="inline-flex h-9 px-4 rounded-full text-sm font-medium gradient-cyan text-primary-foreground items-center shadow-glow hover:scale-105 transition-transform">
              Book Demo
            </Link>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="lg:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-2">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-3 py-2 text-sm hover:text-cyan">
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
