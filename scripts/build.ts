import nodeResolve from '@rollup/plugin-node-resolve';
import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import { rollup } from 'rollup';
import { copyDts } from './rollup-plugins/copy-dts.js';
import { virtualDocument } from './rollup-plugins/virtual-document';
import { resolveRoot } from './utils';

const bundle = await rollup({
  input: [
    resolveRoot('3rd-party/preact-test-utils.js'),
    resolveRoot('3rd-party/preact.js'),
    resolveRoot('3rd-party/compat.js'),
  ],
  plugins: [
    virtualDocument(),
    nodeResolve({}),
    copyDts(['preact', 'preact-render-to-string']),
  ],
});

await fs.rm(resolveRoot('src/3rd-party'), {
  recursive: true,
  maxRetries: 3,
  force: true,
});

await fs.mkdir(resolveRoot('src/3rd-party'), { recursive: true });

await bundle.write({
  dir: resolveRoot('src/3rd-party'),
  format: 'esm',
  preserveModulesRoot: resolveRoot('3rd-party'),
  preserveModules: true,
});

const files = await fs.readdir(resolveRoot('3rd-party'));

const copyTask = files.map(async (file) => {
  return fs.cp(
    resolveRoot('3rd-party', file),
    resolveRoot('src/3rd-party', file.replace(/.js$/, '.d.ts')),
  );
});

await Promise.all(copyTask);

await fs.rm(resolveRoot('dist'), {
  recursive: true,
  maxRetries: 3,
  force: true,
});

const tscResult = spawnSync('tsc', [], {
  stdio: 'inherit',
  cwd: process.cwd(),
});
if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? -1);
}

await fs.rm(resolveRoot('dist/esm/3rd-party'), {
  recursive: true,
  force: true,
});
await fs.cp(resolveRoot('src/3rd-party'), resolveRoot('dist/esm/3rd-party'), {
  recursive: true,
});

const wechat = await rollup({
  input: [
    resolveRoot('dist/esm/page.js'),
    resolveRoot('dist/esm/component.js'),
    resolveRoot('dist/esm/compat.js'),
  ],
});

wechat.write({
  dir: resolveRoot('dist'),
  format: 'esm',
});
