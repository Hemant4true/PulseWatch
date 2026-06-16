const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;
  replacements.forEach(pair => {
    content = content.replace(pair[0], pair[1]);
  });
  if (content !== original) {
    fs.writeFileSync(filepath, content);
    console.log('Updated ' + filepath);
  }
}

function applyGlobalReplacements(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      applyGlobalReplacements(fullPath);
    } else if (file.endsWith('.tsx')) {
      replaceInFile(fullPath, [
        [/indigo-500/g, 'brand-highlight'],
        [/slate-900/g, 'brand-base'],
        [/slate-950/g, 'brand-base'],
        [/text-brand-white/g, 'text-brand-base'], // Fixing Landing.tsx text
        [/bg-brand-blue/g, 'bg-brand-highlight'], // Fixing Landing.tsx hero
      ]);
    }
  });
}

applyGlobalReplacements('src');
