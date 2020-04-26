const spawn = require('cross-spawn').sync;
const {getPackageNames} = require('./getPackageNames');
const {join} = require('path');

const distDir = join(__dirname, '..', 'dist');

for (const pkgName of getPackageNames()) {
  console.log('Packing', pkgName);
  let proc;
  try {
    proc = spawn(
      'yarn',
      ['pack', '-o', 'dist.tgz'],
      {
        cwd: join(distDir, pkgName),
        stdio: 'inherit'
      }
    );
  } catch (e) {
    console.error(e);
    console.error('Failed to pack', pkgName);
    process.exit(1);
  }

  switch (proc.status) {
    case 0:
      break;
    case null:
      console.error('Packing', pkgName, 'failed with signal', proc.signal);
      process.exit(1);
      break;
    default:
      console.error('Packing', pkgName, 'exited with code', proc.status);
      process.exit(proc.status);
  }

  console.log('Packed', pkgName);
}
