const fs = require('fs');
const path = require('path');

const srcCodePath = 'c:\\Users\\welcome\\Desktop\\Niral Thiruvizha\\hydronexa software\\frontend\\src\\routes\\government.dashboard.tsx';
const code = fs.readFileSync(srcCodePath, 'utf8');

// 1. Find all functions
const funcs = [...code.matchAll(/^function (\w+)\(/gm)].map(m => {
  return { name: m[1], index: m.index };
});
funcs.push({ name: 'EOF', index: code.length });

let blocks = {};
for (let i = 0; i < funcs.length - 1; i++) {
  blocks[funcs[i].name] = code.substring(funcs[i].index, funcs[i+1].index);
}

// 2. Identify the top section (imports, constants, Route definition)
const topSection = code.substring(0, funcs[0].index);

// Break top section into imports and constants
const routeDefMatch = topSection.match(/export const Route = createFileRoute.*?\n\}\);\n/s);
const routeDef = routeDefMatch ? routeDefMatch[0] : '';
const topWithoutRoute = topSection.replace(routeDef, '');

const navMatch = topWithoutRoute.match(/const nav = \[.*?\];/s);
const navStr = navMatch ? navMatch[0] : '';

const monMatch = topWithoutRoute.match(/const monitoredIndustries = \[.*?\];/s);
const monStr = monMatch ? monMatch[0] : '';

// The rest is imports
let baseImports = topWithoutRoute.replace(navStr, '').replace(monStr, '').trim();
// Clean base imports by removing specific local image imports which will move to constants
baseImports = baseImports.replace(/import .*? from "@\/assets\/industry-.*?\.jpg";\n?/g, '');
// add specific imports for components
const baseImportsCleaned = baseImports + "\nimport { nav, monitoredIndustries } from '@/government/utils/constants';\n";

// 3. Create folders
const dirs = [
  'login',
  'dashboard/overview',
  'dashboard/industries',
  'dashboard/compliance',
  'dashboard/analytics',
  'dashboard/reports',
  'dashboard/alerts',
  'dashboard/settings',
  'dashboard/components',
  'layouts',
  'hooks',
  'services',
  'utils',
  'assets',
  'types'
];

const basePath = 'c:\\Users\\welcome\\Desktop\\Niral Thiruvizha\\hydronexa software\\frontend\\src\\government';
dirs.forEach(d => {
  fs.mkdirSync(path.join(basePath, d), { recursive: true });
});

// 4. Create constants file
const constantsContent = `import textileImg from "@/assets/industry-textile.jpg";
import paperImg from "@/assets/industry-paper.jpg";
import foodImg from "@/assets/industry-food.jpg";
import steelImg from "@/assets/industry-steel.jpg";
import pharmaImg from "@/assets/industry-pharma.jpg";
import { LayoutDashboard, Factory, ShieldCheck, AlertTriangle, Brain, Mail, FileText } from "lucide-react";

export ${navStr}

export ${monStr}
`;
fs.writeFileSync(path.join(basePath, 'utils/constants.ts'), constantsContent);

// 5. Define groupings
const groupings = {
  'dashboard/overview/Overview': ['Overview'],
  'dashboard/industries/IndustriesView': ['IndustriesView', 'IndustriesGrid'],
  'dashboard/compliance/Compliance': ['Compliance', 'MailCenter'],
  'dashboard/analytics/AIPanel': ['AIPanel'],
  'dashboard/reports/Reports': ['Reports'],
  'dashboard/alerts/Alerts': ['Alerts'],
  'dashboard/components/StatCard': ['StatCard'],
  'dashboard/components/StatusPill': ['StatusPill'],
  'dashboard/components/UIFields': ['TextField', 'SelectField', 'PresetBtn'],
  'dashboard/components/Mini': ['Mini'],
  'dashboard/components/BarCell': ['BarCell']
};

const internalComponentImports = `
import { StatCard } from "@/government/dashboard/components/StatCard";
import { StatusPill } from "@/government/dashboard/components/StatusPill";
import { Mini } from "@/government/dashboard/components/Mini";
import { BarCell } from "@/government/dashboard/components/BarCell";
import { TextField, SelectField, PresetBtn } from "@/government/dashboard/components/UIFields";
`;

function makeFile(name, funcNames) {
  let content = baseImportsCleaned + internalComponentImports + '\n';
  funcNames.forEach(fn => {
    let block = blocks[fn];
    block = block.replace(/^function/m, 'export function');
    content += block + '\n';
  });
  
  const outPath = path.join(basePath, name + '.tsx');
  fs.writeFileSync(outPath, content);
  console.log('Created ' + outPath);
}

Object.entries(groupings).forEach(([name, funcNames]) => {
  makeFile(name, funcNames);
});

// 6. Extract GovDashboard (Layout)
let dashboardContent = baseImportsCleaned;
dashboardContent += `
import { Overview } from "@/government/dashboard/overview/Overview";
import { IndustriesView } from "@/government/dashboard/industries/IndustriesView";
import { Compliance } from "@/government/dashboard/compliance/Compliance";
import { AIPanel } from "@/government/dashboard/analytics/AIPanel";
import { Reports } from "@/government/dashboard/reports/Reports";
import { Alerts } from "@/government/dashboard/alerts/Alerts";
`;
dashboardContent += '\n' + blocks['GovDashboard'].replace(/^function/m, 'export function');
fs.writeFileSync(path.join(basePath, 'dashboard/GovDashboard.tsx'), dashboardContent);
console.log('Created GovDashboard.tsx');

// 7. Overwrite route file
const routeContent = `import { createFileRoute } from "@tanstack/react-router";
import { GovDashboard } from "@/government/dashboard/GovDashboard";

${routeDef}

export default GovDashboard;
`;
fs.writeFileSync(srcCodePath, routeContent);
console.log('Updated ' + srcCodePath);
