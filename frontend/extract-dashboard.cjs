const fs = require('fs');
const path = require('path');

const code = fs.readFileSync('frontend/src/routes/industry.dashboard.tsx', 'utf8');

const funcs = [...code.matchAll(/^function (\w+)\(/gm)].map(m => {
  return { name: m[1], index: m.index };
});
funcs.push({ name: 'EOF', index: code.length });

let blocks = {};
for (let i = 0; i < funcs.length - 1; i++) {
  blocks[funcs[i].name] = code.substring(funcs[i].index, funcs[i+1].index);
}

const sharedNames = ['useAdaptive', 'triggerBuzzer', 'triggerAnalytics5SecHorn', 'CountUp', 'PredictiveAlert', 'TelemetryRow', 'MiniStat'];

const groupings = {
  'Overview': ['Overview', 'SensorStatus', 'HeroMetric', 'IntelligenceCard', 'StatusPill', 'UsageMetric', 'KPI'],
  'LiveMonitoring': ['LiveMonitoring', 'ControlBadge', 'LiveAlert', 'SensorIntelligence', 'WaveVisual', 'LevelVisual', 'PHVisual', 'Pill'],
  'QualityIntelligence': ['QualityIntelligence', 'PHLabel', 'QualityInsight'],
  'ReuseIntelligence': ['ReuseIntelligence', 'InsightTag', 'ConservationRow'],
  'Analytics': ['Analytics', 'AnalyticsFact', 'AIInsights'],
  'AlertsView': ['AlertsView'],
  'SustainabilityView': ['SustainabilityView', 'EcoGauge', 'InsightCard'],
  'ReportsView': ['ReportsView', 'ReportCard'],
  'SettingsPanel': ['SettingsPanel', 'SettingNumber', 'SettingSlider']
};

const imports = code.substring(0, funcs[0].index); // everything before first function

function makeFile(name, funcNames, isShared = false) {
  let content = imports;
  if (!isShared) {
    content += 'import {\n  ' + sharedNames.join(',\n  ') + '\n} from "./shared";\n\n';
  }
  funcNames.forEach(fn => {
    let block = blocks[fn];
    if (name !== 'industry.dashboard') {
      block = block.replace(/^function/m, 'export function');
    }
    content += block;
  });
  const outPath = path.join('frontend', 'src', 'components', 'industry', 'dashboard', name + '.tsx');
  fs.writeFileSync(outPath, content);
  console.log('Created ' + outPath);
}

// 1. Shared
makeFile('shared', sharedNames, true);

// 2. Individual components
Object.entries(groupings).forEach(([name, funcNames]) => {
  makeFile(name, funcNames);
});

// 3. Main Dashboard file
let mainContent = imports;
// add imports for all new components
const componentImports = Object.keys(groupings).map(name => {
  return 'import { ' + groupings[name][0] + ' } from "@/components/industry/dashboard/' + name + '";';
}).join('\n');

mainContent = mainContent.replace(/import { DigitalTwin.*/, match => match + '\n' + componentImports);

mainContent += blocks['IndustryDashboard'];

fs.writeFileSync('frontend/src/routes/industry.dashboard.tsx', mainContent);
console.log('Extraction complete! industry.dashboard.tsx updated.');
