const fs = require('fs');
const {join} = require('path');

const rootPkg = require('../package.json');
const packagesDir = join(__dirname, '..', 'packages');

const syncFields = [
  'version',
  'repository',
  'author',
  'license',
  'publishConfig'
];

const dependencyKeys = [
  'dependencies',
  'peerDependencies',
  'devDependencies'
];

function getRootDependencyVersion(pkg) {
  for (const k of dependencyKeys) {
    if (!rootPkg[k]) {
      continue;
    }

    for (const [key, version] of Object.entries(rootPkg[k])) {
      if (key === pkg) {
        return version;
      }
    }
  }

  return null;
}

for (const pkg of require('./getPackageNames').getPackageNames()) {
  const path = join(packagesDir, pkg, 'package.json');
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));

  let changed = false;
  for (const field of syncFields) {
    if (json[field] !== rootPkg[field]) {
      changed = true;
      json[field] = rootPkg[field];
    }
  }

  for (const depType of dependencyKeys) {
    if (!json[depType]) {
      continue;
    }

    for (const [pkg, version] of Object.entries(json[depType])) {
      if (version === 'workspace:*') {
        continue;
      }
      const rootVersion = getRootDependencyVersion(pkg);
      if (rootVersion && rootVersion !== version) {
        json[depType][pkg] = rootVersion;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
  }
}
