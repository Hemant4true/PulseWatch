const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  replacements.forEach(pair => {
    content = content.replace(pair[0], pair[1]);
  });
  fs.writeFileSync(filepath, content);
  console.log('Updated ' + filepath);
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
        [/text-muted-foreground/g, 'text-brand-highlight/70'],
      ]);
    }
  });
}

applyGlobalReplacements('src');

const pages = ['Dashboard', 'Monitors', 'Incidents', 'Analytics'];
pages.forEach(page => {
  replaceInFile('src/pages/' + page + '.tsx', [
    [/bg-background/g, 'bg-brand-base'],
    [/bg-card/g, 'bg-brand-surface'],
    [/border-border/g, 'border-brand-accent'],
    [/text-foreground/g, 'text-white'],
    [/bg-primary/g, 'bg-brand-highlight'],
    [/text-primary-foreground/g, 'text-brand-base'],
  ]);
});

replaceInFile('src/pages/Login.tsx', [
  [/bg-background/g, 'bg-brand-base'],
  [/bg-card/g, 'bg-brand-surface'],
  [/border-input/g, 'border-brand-accent'],
  [/bg-primary/g, 'bg-brand-highlight'],
  [/text-primary-foreground/g, 'text-brand-base'],
  [/ring-ring/g, 'ring-brand-highlight'],
  [/text-foreground/g, 'text-white'],
]);

replaceInFile('src/pages/Register.tsx', [
  [/bg-background/g, 'bg-brand-base'],
  [/bg-card/g, 'bg-brand-surface'],
  [/border-input/g, 'border-brand-accent'],
  [/bg-primary/g, 'bg-brand-highlight'],
  [/text-primary-foreground/g, 'text-brand-base'],
  [/ring-ring/g, 'ring-brand-highlight'],
  [/text-foreground/g, 'text-white'],
]);

replaceInFile('src/pages/Landing.tsx', [
  [/bg-background/g, 'bg-brand-base'],
  [/border-brand-white\/20/g, 'border-brand-accent'],
  [/bg-primary/g, 'bg-brand-highlight'],
  [/text-primary-foreground/g, 'text-brand-base'],
  [/text-primary/g, 'text-brand-highlight'],
]);

replaceInFile('src/pages/PublicStatus.tsx', [
  [/bg-background/g, 'bg-brand-base'],
  [/bg-card/g, 'bg-brand-surface'],
  [/border-border/g, 'border-brand-accent'],
  [/text-foreground/g, 'text-white'],
]);

console.log('Replacements completed.');
