const {join} = require('path');
const fs = require('fs');

const packagesDir = join(__dirname, '..', 'packages');
exports.packagesDir = packagesDir;

exports.getPackageNames = function () {
  return fs.readdirSync(packagesDir, 'utf8')
    .filter(pkgFilter)
};

function pkgFilter(p) {
  return fs.statSync(join(packagesDir, p)).isDirectory();
}
