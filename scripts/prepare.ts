import { virtualDocument } from './rollup-plugins/virtual-document';
import nodeResolve from '@rollup/plugin-node-resolve';
import fs from 'fs/promises';
import { rollup } from 'rollup';
import { copyDts } from './rollup-plugins/copy-dts.js';
import { resolveRoot } from './utils.js';
import { spawnSync } from 'child_process';

const bundle = await rollup({
  input: [
    resolveRoot('3rd-party/preact-test-utils.js'),
    resolveRoot('3rd-party/preact.js'),
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
