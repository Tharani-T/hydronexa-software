const fs = require('fs');
const file = 'src/routes/industry.dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Backgrounds
  { from: /bg-white\/40 dark:bg-black\/40/g, to: "bg-black/40" },
  { from: /bg-white\/50 dark:bg-black\/50/g, to: "bg-black/50" },
  { from: /bg-white\/60 dark:bg-black\/60/g, to: "bg-black/60" },
  { from: /bg-black\/5 dark:bg-white\/5/g, to: "bg-white/5" },
  { from: /bg-black\/10 dark:bg-white\/10/g, to: "bg-white/10" },
  { from: /bg-black\/20 dark:bg-white\/20/g, to: "bg-white/20" },
  { from: /bg-black\/30 dark:bg-white\/30/g, to: "bg-white/30" },
  { from: /bg-black\/40 dark:bg-white\/40/g, to: "bg-white/40" },
  { from: /bg-black\/50 dark:bg-white\/50/g, to: "bg-white/50" },
  { from: /bg-zinc-200 dark:bg-zinc-900/g, to: "bg-zinc-900" },
  { from: /bg-white dark:bg-black/g, to: "bg-black" },

  // Borders
  { from: /border-black\/5 dark:border-white\/5/g, to: "border-white/5" },
  { from: /border-black\/10 dark:border-white\/10/g, to: "border-white/10" },
  { from: /border-black\/20 dark:border-white\/20/g, to: "border-white/20" },
  
  // Gradients
  { from: /from-black\/10 dark:from-white\/10/g, to: "from-white/10" },
  { from: /from-black\/5 dark:from-white\/5/g, to: "from-white/5" },
  { from: /from-white\/40 dark:from-black\/40/g, to: "from-black/40" },
];

replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

fs.writeFileSync(file, content);
console.log("Successfully restored dashboard backgrounds and borders.");
