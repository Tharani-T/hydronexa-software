const fs = require('fs');
const file = 'src/styles.css';
let content = fs.readFileSync(file, 'utf8');

const originalLightRoot = `:root {
  --radius: 0.875rem;
  /* Premium Light theme - High contrast & Elegant */
  --background: oklch(0.985 0.005 230);
  --foreground: oklch(0.2 0.04 230);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2 0.04 230);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2 0.04 230);
  --primary: oklch(0.4 0.15 240);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.95 0.02 230);
  --secondary-foreground: oklch(0.2 0.05 240);
  --muted: oklch(0.95 0.01 230);
  --muted-foreground: oklch(0.45 0.04 240);
  --accent: oklch(0.93 0.03 230);
  --accent-foreground: oklch(0.15 0.05 240);
  --destructive: oklch(0.5 0.2 25);
  --destructive-foreground: oklch(0.99 0 0);
  --border: oklch(0.88 0.02 230);
  --input: oklch(0.9 0.02 230);
  --ring: oklch(0.5 0.15 240);

  /* Deepened Accents for White Background Readability */
  --cyan: oklch(0.45 0.16 240);
  --cyan-glow: oklch(0.55 0.18 235);
  --eco: oklch(0.4 0.16 150);
  --warn: oklch(0.55 0.18 55);
  --danger: oklch(0.48 0.2 25);

  --glass: oklch(1 0 0 / 0.85);
  --glass-border: oklch(0.7 0.05 240 / 0.2);

  --gradient-hero: linear-gradient(135deg, oklch(0.35 0.15 240), oklch(0.5 0.18 230));
  --gradient-cyan: linear-gradient(135deg, oklch(0.4 0.16 240), oklch(0.55 0.18 230));
  --gradient-eco: linear-gradient(135deg, oklch(0.35 0.15 160), oklch(0.45 0.18 150));
  --gradient-mesh: radial-gradient(at 20% 20%, oklch(0.45 0.16 240 / 0.06) 0, transparent 50%),
                   radial-gradient(at 80% 60%, oklch(0.4 0.16 150 / 0.05) 0, transparent 50%);
  --shadow-glow: 0 0 25px oklch(0.45 0.16 240 / 0.2);
  --shadow-elegant: 0 20px 40px -10px oklch(0.1 0.05 240 / 0.08);
}`;

content = content.replace(/:root\s*\{[\s\S]*?(?=\.dark\s*\{)/, originalLightRoot + '\n\n');
fs.writeFileSync(file, content);
console.log("Restored original Light Theme CSS.");
