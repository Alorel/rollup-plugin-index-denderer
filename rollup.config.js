import {join} from 'path';
import * as fs from 'fs';
import typescript from '@rollup/plugin-typescript';
import {cleanPlugin} from '@alorel/rollup-plugin-clean';
import {copyPkgJsonPlugin as copyPkgJson} from '@alorel/rollup-plugin-copy-pkg-json';
import {dtsPlugin as dts} from '@alorel/rollup-plugin-dts';
import {copyPlugin as cpPlugin} from '@alorel/rollup-plugin-copy';
import {getPackageNames, packagesDir} from './build/getPackageNames';

const distDir = join(__dirname, 'dist');

function mkOutput(overrides = {}) {
  return {
    entryFileNames: '[name].js',
    assetFileNames: '[name].[ext]',
    sourcemap: false,
    ...overrides
  };
}

function getExternals(pkgName) {
  const path = join(packagesDir, pkgName, 'package.json');
  const json = JSON.parse(fs.readFileSync(path, 'utf8'));

  const arr = ['util', 'fs', 'path'];
  if (json.dependencies) {
    arr.push(...Object.keys(json.dependencies));
  }
  if (json.peerDependencies) {
    arr.push(...Object.keys(json.peerDependencies));
  }

  return arr.length ? Array.from(new Set(arr)) : arr;
}

function plugins(add = [], tscOpts = {}) {
  return [
    typescript({
      tsconfig: join(__dirname, 'tsconfig.json'),
      ...tscOpts
    })
  ].concat(add);
}

const config = getPackageNames()
  .map(pkgName => {
    const pkgDir = join(packagesDir, pkgName);
    const include = new RegExp(`packages[\\\\/]${pkgName}[\\\\/].+\.ts$`);

    const baseSettings = {
      input: join(pkgDir, 'index.ts'),
      external: getExternals(pkgName),
      preserveModules: true,
      watch: {
        exclude: '**/node_modules/*/*'
      }
    };

    const pkgDistDir = join(distDir, pkgName);
    const esmDir = join(pkgDistDir, 'esm');

    return [
      {
        ...baseSettings,
        output: mkOutput({
          dir: pkgDistDir,
          format: 'cjs',
          plugins: [
            copyPkgJson(),
            dts()
          ]
        }),
        plugins: plugins(
          [
            cleanPlugin({dir: pkgDistDir}),
            cpPlugin({
              defaultOpts: {
                glob: {cwd: pkgDir},
                emitNameKind: 'fileName'
              },
              copy: ['LICENSE', 'README.md']
            })
          ],
          {
            include,
            rootDir: __dirname,
            outDir: pkgDir
          }
        )
      },
      {
        ...baseSettings,
        output: mkOutput({
          dir: esmDir,
          format: 'esm'
        }),
        plugins: plugins([], {
          include,
          rootDir: __dirname,
          outDir: esmDir
        })
      }
    ]
  })
  .flat();

export default config;
