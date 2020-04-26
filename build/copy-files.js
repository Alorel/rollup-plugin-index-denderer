const {join} = require('path');
const glob = require('glob').sync;
const fs = require('fs');

const rootDir = join(__dirname, '..');
const cwd = join(rootDir, 'packages');
const distDir = join(rootDir, 'dist');

for (const f of glob('**/{LICENSE,package.json}', {cwd})) {
  const src = join(cwd, f);
  const dest = join(distDir, f);

  fs.copyFileSync(src, dest);
}
