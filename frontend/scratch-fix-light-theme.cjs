const fs = require('fs');
const file = 'src/routes/industry.dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace flat background black/white with semantic or theme-adaptive classes
const replacements = [
  // Typography
  { from: /text-white\/50/g, to: "text-muted-foreground" },
  { from: /text-white\/70/g, to: "text-muted-foreground" },
  { from: /text-white\/20/g, to: "text-muted-foreground/30" },
  { from: /text-white/g, to: "text-foreground dark:text-white" },
  { from: /text-black\/50/g, to: "text-muted-foreground" },
  
  // Backgrounds
  { from: /bg-black\/40/g, to: "bg-white/40 dark:bg-black/40" },
  { from: /bg-black\/50/g, to: "bg-white/50 dark:bg-black/50" },
  { from: /bg-black\/60/g, to: "bg-white/60 dark:bg-black/60" },
  { from: /bg-white\/5/g, to: "bg-black/5 dark:bg-white/5" },
  { from: /bg-white\/10/g, to: "bg-black/10 dark:bg-white/10" },
  { from: /bg-white\/20/g, to: "bg-black/20 dark:bg-white/20" },
  { from: /bg-white\/30/g, to: "bg-black/30 dark:bg-white/30" },
  { from: /bg-white\/40/g, to: "bg-black/40 dark:bg-white/40" },
  { from: /bg-white\/50/g, to: "bg-black/50 dark:bg-white/50" },
  { from: /bg-zinc-900/g, to: "bg-zinc-200 dark:bg-zinc-900" },
  { from: /bg-black/g, to: "bg-white dark:bg-black" },

  // Borders
  { from: /border-white\/5/g, to: "border-black/5 dark:border-white/5" },
  { from: /border-white\/10/g, to: "border-black/10 dark:border-white/10" },
  { from: /border-white\/20/g, to: "border-black/20 dark:border-white/20" },
  
  // Gradients & Shadows
  { from: /from-white\/10/g, to: "from-black/10 dark:from-white/10" },
  { from: /from-white\/5/g, to: "from-black/5 dark:from-white/5" },
  { from: /from-black\/40/g, to: "from-white/40 dark:from-black/40" },
  { from: /rgba\(255,255,255,/g, to: "var(--foreground-rgb," }, // We'd need to be careful with absolute rgba
];

// Execute standard regex replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Fix specific SVG strokes for the waves
// Replace stroke="rgba(255,255,255,0.4)" with stroke="currentColor" and add opacity classes
content = content.replace(/stroke="rgba\(255,255,255,0\.4\)"/g, 'stroke="currentColor" className="text-foreground/40 dark:text-white/40"');
content = content.replace(/stroke="rgba\(255,255,255,0\.3\)"/g, 'stroke="currentColor" className="text-foreground/30 dark:text-white/30"');
content = content.replace(/stroke="rgba\(255,255,255,0\.2\)"/g, 'stroke="currentColor" className="text-foreground/20 dark:text-white/20"');

fs.writeFileSync(file, content);
console.log("Successfully adapted components for Light Theme");
