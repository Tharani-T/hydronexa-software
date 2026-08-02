const fs = require('fs');
const execSync = require('child_process').execSync;
const oldCode = execSync('git show HEAD:frontend/src/routes/industry.dashboard.tsx').toString();

const funcs = [...oldCode.matchAll(/^function (\w+)\(/gm)].map(m => {
  return { name: m[1], index: m.index };
});
funcs.push({ name: 'EOF', index: oldCode.length });

let blocks = {};
for (let i = 0; i < funcs.length - 1; i++) {
  blocks[funcs[i].name] = oldCode.substring(funcs[i].index, funcs[i+1].index);
}

const sharedNames = ['useAdaptive', 'triggerBuzzer', 'triggerAnalytics5SecHorn', 'CountUp', 'PredictiveAlert', 'TelemetryRow', 'MiniStat'];
const overviewNames = ['Overview', 'SensorStatus', 'HeroMetric', 'IntelligenceCard', 'StatusPill', 'UsageMetric', 'KPI'];

const imports = oldCode.substring(0, funcs[0].index).replace(/export const Route = createFileRoute[\s\S]*?\}\);\n*/, '').replace(/const nav = \[[\s\S]*?\];\n*/, '');

let content = imports;
content += 'import {\n  ' + sharedNames.join(',\n  ') + '\n} from "./shared";\n\n';

overviewNames.forEach(fn => {
  let block = blocks[fn].replace(/^function/m, 'export function');
  content += block;
});

fs.writeFileSync('frontend/src/components/industry/dashboard/Overview.tsx', content);
console.log('Restored Overview.tsx');
