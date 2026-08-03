const fs = require('fs');
const path = require('path');

const pagesDir = 'src/admin/dashboard/pages';

function addExport(file, names) {
  let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  names.forEach(name => {
    content = content.replace(new RegExp(`function ${name}\\(`, 'g'), `export function ${name}(`);
    content = content.replace(new RegExp(`const ${name} =`, 'g'), `export const ${name} =`);
  });
  fs.writeFileSync(path.join(pagesDir, file), content);
}

function addImport(file, names, from) {
  let content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  const importStatement = `import { ${names.join(', ')} } from "./${from}";\n`;
  // Add after the last import
  const lines = content.split('\n');
  let lastImport = 0;
  lines.forEach((line, i) => {
    if (line.startsWith('import ')) lastImport = i;
  });
  lines.splice(lastImport + 1, 0, importStatement);
  fs.writeFileSync(path.join(pagesDir, file), lines.join('\n'));
}

// Add exports
addExport('ContactRequests.tsx', ['ApproveModal', 'ApproveCTOModal', 'MOCK_REQUESTS']);
addExport('IndustryManagement.tsx', ['Field', 'Number', 'Select', 'Slider', 'Toggle', 'EditIndustryModal']);

// Add imports
addImport('ContactRequests.tsx', ['Field', 'Number', 'Select', 'Slider', 'Toggle'], 'IndustryManagement');
addImport('IndustryManagement.tsx', ['ApproveModal'], 'ContactRequests');
addImport('Overview.tsx', ['MOCK_REQUESTS'], 'ContactRequests');
addImport('UserManagement.tsx', ['ApproveCTOModal'], 'ContactRequests');

console.log("Fixes applied");
