import fs from 'fs/promises';
import { globby } from 'globby';
import { dirname, resolve } from 'path';

export function copyDts(packages: string[]) {
  return {
    name: 'copy-dts',
    generateBundle: async (options, _bundle, isWrite) => {
      const sourceCodeDir = process.cwd();
      const outputDir = resolve(sourceCodeDir, options.dir);
      if (isWrite) {
        const processMap = new Map();
        for (const packageName of packages) {
          const packageNodeModulesDir = resolve(
            sourceCodeDir,
            'node_modules',
            packageName,
          );
          const packageOutputDir = resolve(
            outputDir,
            'node_modules',
            packageName,
          );
          if (packageName && !processMap.has(packageName)) {
            processMap.set(packageName, async () => {
              await fs.mkdir(packageOutputDir, {
                recursive: true,
              });
              const {
                name,
                version,
                exports,
                typesVersions,
                typings,
                license,
              } = JSON.parse(
                await fs.readFile(
                  resolve(packageNodeModulesDir, 'package.json'),
                  'utf-8',
                ),
              );
              await fs.writeFile(
                resolve(packageOutputDir, 'package.json'),
                JSON.stringify(
                  {
                    name,
                    version,
                    exports,
                    typesVersions,
                    typings,
                    license,
                  },
                  null,
                  2,
                ),
              );
              const types = await globby(
                ['**/*.d.ts', '**/license', 'LICENSE.md'],
                {
                  cwd: packageNodeModulesDir,
                },
              );
              const copyTask = types.map(async (typeFile) => {
                await fs.mkdir(dirname(resolve(packageOutputDir, typeFile)), {
                  recursive: true,
                });
                try {
                  await fs.cp(
                    resolve(packageNodeModulesDir, typeFile),
                    resolve(packageOutputDir, typeFile),
                  );
                } catch (error) {
                  console.log('copy error', error);
                }
              });
              await Promise.all(copyTask);
            });
          }
        }
        await Promise.all(Array.from(processMap.values()).map((o) => o()));
      }
    },
  };
}
