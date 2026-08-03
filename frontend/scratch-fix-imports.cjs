const fs = require('fs');
const path = require('path');

const base = 'c:\\Users\\welcome\\Desktop\\Niral Thiruvizha\\hydronexa software\\frontend\\src\\government\\dashboard';

function removeImport(file, name) {
  const p = path.join(base, file);
  let content = fs.readFileSync(p, 'utf8');
  const regex = new RegExp(`import { ${name} } from "@/government/dashboard/components/${name}";\\n?`, 'g');
  content = content.replace(regex, '');
  fs.writeFileSync(p, content);
}

// Fix BarCell
removeImport('components/BarCell.tsx', 'BarCell');

// Fix Mini
removeImport('components/Mini.tsx', 'Mini');

// Fix StatCard
removeImport('components/StatCard.tsx', 'StatCard');

// Fix StatusPill
removeImport('components/StatusPill.tsx', 'StatusPill');

// Fix UIFields (has TextField, SelectField, PresetBtn)
let p = path.join(base, 'components/UIFields.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/import { TextField, SelectField, PresetBtn } from "@\/government\/dashboard\/components\/UIFields";\n?/g, '');
fs.writeFileSync(p, content);

// Fix GovDashboard missing MailCenter
p = path.join(base, 'GovDashboard.tsx');
content = fs.readFileSync(p, 'utf8');
content = content.replace('import { Compliance } from "@/government/dashboard/compliance/Compliance";', 'import { Compliance, MailCenter } from "@/government/dashboard/compliance/Compliance";');
fs.writeFileSync(p, content);

// Fix Overview missing IndustriesGrid
p = path.join(base, 'overview/Overview.tsx');
content = fs.readFileSync(p, 'utf8');
content = content.replace('import { nav, monitoredIndustries } from \'@/government/utils/constants\';', 'import { nav, monitoredIndustries } from \'@/government/utils/constants\';\nimport { IndustriesGrid } from "@/government/dashboard/industries/IndustriesView";');
fs.writeFileSync(p, content);

console.log('Fixed imports!');
