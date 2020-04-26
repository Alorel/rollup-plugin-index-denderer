const packageNames = require('./build/getPackageNames').getPackageNames();

const PATH = {
  npm: '@semantic-release/npm',
  gh: '@semantic-release/github',
  exec: '@semantic-release/exec',
  git: '@semantic-release/git'
};

exports.branch = 'master';
exports.tagFormat = '${version}';
exports.generateNotes = {config: '@alorel-personal/conventional-changelog-alorel'};

exports.verifyConditions = [
  {path: PATH.npm, pkgRoot: '.'},
  PATH.gh
];
exports.prepare = [
  '@semantic-release/changelog',
  PATH.npm,
  {path: PATH.exec, cmd: 'yarn run sync'},
  {path: PATH.exec, cmd: 'yarn run clean'},
  {path: PATH.exec, cmd: 'yarn run build'},
  {path: PATH.exec, cmd: 'yarn run copy'},
  ...packageNames.map(pkg => ({
    path: PATH.exec,
    cmd: `bash -c "cd dist/${pkg} && yarn pack -o dist.tgz"`
  })),
  {
    path: PATH.git,
    message: 'chore(release): ${nextRelease.version}',
    assets: [
      'CHANGELOG.md',
      'README.md',
      'package.json',
      'yarn.lock',
      ...packageNames.flatMap(pkg => [`packages/${pkg}/README.md`, `packages/${pkg}/package.json`])
    ]
  }
];
exports.publish = [
  ...packageNames.map(pkg => ({
    path: PATH.exec,
    cmd: `bash -c "cd dist/${pkg} && npm publish dist.tgz"`
  })),
  PATH.gh
];
