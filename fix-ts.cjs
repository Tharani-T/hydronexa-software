const fs = require('fs');

const files = fs.readdirSync('frontend/src/components/industry/dashboard').filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const p = 'frontend/src/components/industry/dashboard/' + f;
  let text = fs.readFileSync(p, 'utf8');
  
  // Remove Route definition
  text = text.replace(/export const Route = createFileRoute[\s\S]*?\}\);\n*/, '');
  
  // Remove nav definition
  text = text.replace(/const nav = \[[\s\S]*?\];\n*/, '');
  
  fs.writeFileSync(p, text);
});
console.log('Cleaned up Route and nav from extracted components.');

// Fix Logo.tsx
const logoPath = 'frontend/src/components/Logo.tsx';
let logoText = fs.readFileSync(logoPath, 'utf8');
logoText = logoText.replace('export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" })', 'export function Logo({ size = "md", collapsed }: { size?: "sm" | "md" | "lg", collapsed?: boolean })');
fs.writeFileSync(logoPath, logoText);
console.log('Fixed Logo.tsx');
