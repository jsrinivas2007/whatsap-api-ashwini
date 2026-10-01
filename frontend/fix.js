const fs = require('fs');
const path = require('path');
const dir = 'src/components/dashboard/flow-builder/nodes';
const files = fs.readdirSync(dir).map(f => path.join(dir, f));
files.push('src/components/dashboard/flow-builder/FlowNodeComponent.tsx');

for (const f of files) {
  if (!f.endsWith('.tsx')) continue;
  let code = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (!code.includes('id="target"') && code.includes('type="target"')) {
     code = code.replace(/type="target"/g, 'type="target" id="target"');
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, code);
    console.log('Fixed', f);
  }
}
